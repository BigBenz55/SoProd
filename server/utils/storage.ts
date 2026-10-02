import { createReadStream, promises as fsp } from 'node:fs'
import { resolve, sep, posix } from 'node:path'
import { PassThrough, Transform, type Readable } from 'node:stream'
import { Client as FtpClient } from 'basic-ftp'
import SftpClient from 'ssh2-sftp-client'

export interface StorageEntry {
  name: string
  path: string
  type: 'dir' | 'file'
  size: number
}

export interface ReadRange {
  start?: number
  end?: number
}

export interface StorageDriver {
  readonly kind: 'local' | 'ftp' | 'sftp'
  list(dir: string): Promise<StorageEntry[]>
  /** Une seule session FTP pour tout l’arbre (évite des centaines de connexions sur la Freebox). */
  walkDir?(dir: string, maxDepth?: number): Promise<StorageEntry[]>
  size(path: string): Promise<number>
  read(path: string, range?: ReadRange): Promise<Readable>
  ping(): Promise<boolean>
}

function delay(ms: number) {
  return new Promise<void>(resolve => setTimeout(resolve, ms))
}

function isTransientRemoteError(err: unknown) {
  const msg = String(err instanceof Error ? err.message : err)
  return /FIN packet|ECONNRESET|ETIMEDOUT|EPIPE|socket hang up|503|421|closed unexpectedly/i.test(msg)
}

/** Normalises a user-supplied remote path and refuses anything escaping the root. */
export function cleanRemotePath(input: string | undefined | null) {
  const raw = String(input ?? '').replace(/\\/g, '/')
  const normalised = posix.normalize('/' + raw).replace(/\/+$/, '')
  if (normalised.split('/').includes('..')) throw createError({ statusCode: 400, message: 'Chemin invalide' })
  return normalised || '/'
}

/** Chemin logique admin (/) → chemin absolu sur la Box (respecte NUXT_STORAGE_ROOT). */
export function joinStoragePath(root: string, logical: string) {
  const base = cleanRemotePath(root || '/')
  const path = cleanRemotePath(logical)
  if (path === '/') return base
  const tail = path.slice(1)
  return base === '/' ? `/${tail}` : `${base}/${tail}`
}

export function childStoragePath(parent: string, name: string) {
  const base = cleanRemotePath(parent)
  return base === '/' ? `/${name}` : posix.join(base, name)
}

export function storageRootLabel(root: string) {
  const abs = cleanRemotePath(root || '/')
  return abs === '/' ? '/' : abs
}

function rootFolderName(root: string) {
  const parts = cleanRemotePath(root || '/').split('/').filter(Boolean)
  return parts.at(-1) ?? ''
}

/** Évite la boucle Freebox → Freebox sur certains serveurs FTP. */
function skipFtpDirLoop(base: string, root: string, name: string, isDir: boolean) {
  if (!isDir) return false
  const parent = base.split('/').filter(Boolean).pop()
  if (parent && name === parent) return true
  const rootName = rootFolderName(root)
  if (base === '/' && rootName && name === rootName && cleanRemotePath(root) !== '/') return true
  return false
}

function limitBytes(maxBytes: number, onDone: () => void) {
  let seen = 0
  return new Transform({
    transform(chunk: Buffer, _enc, cb) {
      if (seen >= maxBytes) return cb()
      const remaining = maxBytes - seen
      seen += chunk.length
      if (chunk.length >= remaining) {
        this.push(chunk.subarray(0, remaining))
        this.push(null)
        onDone()
        return cb()
      }
      cb(null, chunk)
    },
  })
}

class LocalDriver implements StorageDriver {
  readonly kind = 'local' as const
  private root: string
  constructor(root: string) {
    this.root = resolve(process.cwd(), root)
  }

  private abs(path: string) {
    const target = resolve(this.root, '.' + cleanRemotePath(path))
    if (target !== this.root && !target.startsWith(this.root + sep)) {
      throw createError({ statusCode: 400, message: 'Chemin invalide' })
    }
    return target
  }

  async list(dir: string) {
    const base = cleanRemotePath(dir)
    const entries = await fsp.readdir(this.abs(base), { withFileTypes: true })
    const out: StorageEntry[] = []
    for (const e of entries) {
      if (e.name.startsWith('.')) continue
      const path = posix.join(base, e.name)
      const size = e.isFile() ? (await fsp.stat(this.abs(path))).size : 0
      out.push({ name: e.name, path, type: e.isDirectory() ? 'dir' : 'file', size })
    }
    return out
  }

  async size(path: string) {
    return (await fsp.stat(this.abs(path))).size
  }

  async read(path: string, range: ReadRange = {}) {
    return createReadStream(this.abs(path), { start: range.start, end: range.end })
  }

  async ping() {
    try {
      await fsp.access(this.root)
      return true
    } catch {
      return false
    }
  }
}

interface RemoteOptions {
  host: string
  port: number
  user: string
  password: string
  secure: boolean
  privateKeyPath: string
  root: string
}

class FtpDriver implements StorageDriver {
  readonly kind = 'ftp' as const
  constructor(private opts: RemoteOptions) {}

  /** La Freebox coupe les sessions FTP concurrentes (FIN packet). */
  private busy = false
  private waiters: (() => void)[] = []

  private async acquire() {
    while (this.busy) {
      await new Promise<void>(resolve => this.waiters.push(resolve))
    }
    this.busy = true
    return () => {
      this.busy = false
      this.waiters.shift()?.()
    }
  }

  private full(path: string) {
    return joinStoragePath(this.opts.root, path)
  }

  private async connect() {
    let last: unknown
    for (let attempt = 0; attempt < 4; attempt++) {
      const client = new FtpClient(90_000)
      try {
        await client.access({
          host: this.opts.host,
          port: this.opts.port || 21,
          user: this.opts.user,
          password: this.opts.password,
          secure: this.opts.secure,
          secureOptions: { rejectUnauthorized: false },
        })
        return client
      } catch (err) {
        last = err
        client.close()
        if (attempt < 3 && isTransientRemoteError(err)) {
          await delay(500 * (attempt + 1))
          continue
        }
        throw err
      }
    }
    throw last
  }

  private async listDir(client: FtpClient, dir: string) {
    const base = cleanRemotePath(dir)
    const remote = this.full(base)
    await client.cd(remote)
    const pwd = await client.pwd()
    const items = await client.list()
    const out: StorageEntry[] = []
    for (const i of items) {
      if (i.name.startsWith('.')) continue
      const isDir = i.isDirectory
      if (skipFtpDirLoop(base, this.opts.root, i.name, isDir)) continue
      if (isDir) {
        try {
          await client.cd(i.name)
          const nested = await client.pwd()
          await client.cd(pwd)
          if (nested.replace(/\/$/, '') === pwd.replace(/\/$/, '')) continue
        } catch {
          await client.cd(pwd).catch(() => {})
        }
      }
      out.push({
        name: i.name,
        path: childStoragePath(base, i.name),
        type: isDir ? 'dir' : 'file',
        size: i.size,
      })
    }
    return out
  }

  async list(dir: string) {
    const release = await this.acquire()
    try {
      const client = await this.connect()
      try {
        return await this.listDir(client, dir)
      } finally {
        client.close()
      }
    } finally {
      release()
    }
  }

  async walkDir(dir: string, maxDepth = 3) {
    const release = await this.acquire()
    try {
      const client = await this.connect()
      try {
        const files: StorageEntry[] = []
        const recurse = async (logical: string, depth: number) => {
          const entries = await this.listDir(client, logical)
          for (const e of entries.sort((a, b) => a.name.localeCompare(b.name, 'fr', { numeric: true }))) {
            if (e.type === 'dir' && depth < maxDepth) await recurse(e.path, depth + 1)
            else if (e.type === 'file') files.push(e)
          }
        }
        await recurse(cleanRemotePath(dir), 0)
        return files
      } finally {
        client.close()
      }
    } finally {
      release()
    }
  }

  async size(path: string) {
    const release = await this.acquire()
    try {
      const client = await this.connect()
      try {
        return await client.size(this.full(path))
      } finally {
        client.close()
      }
    } finally {
      release()
    }
  }

  async read(path: string, range: ReadRange = {}) {
    const release = await this.acquire()
    let released = false
    let client: FtpClient
    try {
      client = await this.connect()
    } catch (err) {
      release()
      throw err
    }

    const finish = () => {
      if (released) return
      released = true
      client.close()
      release()
    }

    const start = range.start ?? 0
    const out = new PassThrough()
    let target: NodeJS.WritableStream = out
    if (range.end !== undefined) {
      const limiter = limitBytes(range.end - start + 1, finish)
      limiter.pipe(out)
      target = limiter
    }

    void client.downloadTo(target as any, this.full(path), start).then(
      () => finish(),
      (err) => {
        finish()
        if (!out.writableEnded) out.destroy(err instanceof Error ? err : new Error(String(err)))
      },
    )
    return out
  }

  async ping() {
    try {
      const release = await this.acquire()
      try {
        const client = await this.connect()
        client.close()
        return true
      } finally {
        release()
      }
    } catch {
      return false
    }
  }
}

class SftpDriver implements StorageDriver {
  readonly kind = 'sftp' as const
  constructor(private opts: RemoteOptions) {}

  private full(path: string) {
    return joinStoragePath(this.opts.root, path)
  }

  private async connect() {
    const client = new SftpClient()
    await client.connect({
      host: this.opts.host,
      port: this.opts.port || 22,
      username: this.opts.user,
      password: this.opts.password || undefined,
      privateKey: this.opts.privateKeyPath ? await fsp.readFile(this.opts.privateKeyPath) : undefined,
      readyTimeout: 20_000,
    })
    return client
  }

  async list(dir: string) {
    const client = await this.connect()
    try {
      const base = cleanRemotePath(dir)
      const items = await client.list(this.full(base))
      const parentName = base.split('/').filter(Boolean).pop()
      return items
        .filter(i => !i.name.startsWith('.'))
        .filter(i => !(i.type === 'd' && parentName && i.name === parentName))
        .map(i => ({
          name: i.name,
          path: childStoragePath(base, i.name),
          type: i.type === 'd' ? 'dir' : 'file',
          size: i.size,
        }) satisfies StorageEntry)
    } finally {
      await client.end().catch(() => {})
    }
  }

  async size(path: string) {
    const client = await this.connect()
    try {
      const stat = await client.stat(this.full(path))
      return stat.size
    } finally {
      await client.end().catch(() => {})
    }
  }

  async read(path: string, range: ReadRange = {}) {
    const client = await this.connect()
    const stream = client.createReadStream(this.full(path), { start: range.start, end: range.end }) as unknown as Readable
    const close = () => client.end().catch(() => {})
    stream.once('close', close)
    stream.once('error', close)
    return stream
  }

  async ping() {
    try {
      const client = await this.connect()
      await client.end()
      return true
    } catch {
      return false
    }
  }
}

let driver: StorageDriver | null = null

export function useBox() {
  if (driver) return driver
  const { storage } = useRuntimeConfig()
  const opts: RemoteOptions = {
    host: storage.host,
    port: Number(storage.port) || 0,
    user: storage.user,
    password: storage.password,
    secure: String(storage.secure) === 'true',
    privateKeyPath: storage.privateKeyPath,
    root: storage.driver === 'local' ? '/' : storage.root || '/',
  }
  if (storage.driver === 'ftp') driver = new FtpDriver(opts)
  else if (storage.driver === 'sftp') driver = new SftpDriver(opts)
  else driver = new LocalDriver(storage.root || './demo-box')
  return driver
}

export async function readToBuffer(stream: Readable) {
  const chunks: Buffer[] = []
  for await (const chunk of stream) chunks.push(chunk as Buffer)
  return Buffer.concat(chunks)
}
