import { createError } from 'h3'
import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import type { DatabaseSync } from 'node:sqlite'
import type { Pool, RowDataPacket } from 'mysql2/promise'
import { createPool } from 'mysql2/promise'

export type DbDriver = 'sqlite' | 'mysql'

let driver: DbDriver = 'sqlite'
let sqlite: DatabaseSync | null = null
let pool: Pool | null = null
let ready = false

const SQLITE_SCHEMA = `
CREATE TABLE IF NOT EXISTS galleries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  event_date TEXT,
  event_type TEXT NOT NULL DEFAULT 'mariage',
  folder TEXT,
  private_token TEXT NOT NULL UNIQUE,
  public_token TEXT NOT NULL UNIQUE,
  pin_hash TEXT,
  public_download INTEGER NOT NULL DEFAULT 0,
  validity_days INTEGER NOT NULL DEFAULT 60,
  expires_at TEXT NOT NULL,
  cover_media_id INTEGER,
  status TEXT NOT NULL DEFAULT 'draft',
  status_message TEXT,
  is_demo INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  indexed_at TEXT
);
CREATE TABLE IF NOT EXISTS media (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  gallery_id INTEGER NOT NULL REFERENCES galleries(id) ON DELETE CASCADE,
  path TEXT NOT NULL,
  filename TEXT NOT NULL,
  kind TEXT NOT NULL,
  width INTEGER,
  height INTEGER,
  size_bytes INTEGER NOT NULL DEFAULT 0,
  tone TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  favorite INTEGER NOT NULL DEFAULT 0,
  favorited_at TEXT,
  poster_path TEXT,
  cached INTEGER NOT NULL DEFAULT 0,
  UNIQUE (gallery_id, path)
);
CREATE INDEX IF NOT EXISTS media_gallery ON media (gallery_id, position);
`

const MYSQL_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS galleries (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    event_date DATE NULL,
    event_type VARCHAR(32) NOT NULL DEFAULT 'mariage',
    folder VARCHAR(512) NULL,
    private_token CHAR(36) NOT NULL,
    public_token CHAR(36) NOT NULL,
    pin_hash VARCHAR(128) NULL,
    public_download TINYINT UNSIGNED NOT NULL DEFAULT 0,
    validity_days INT NOT NULL DEFAULT 60,
    expires_at DATETIME NOT NULL,
    cover_media_id INT UNSIGNED NULL,
    status VARCHAR(16) NOT NULL DEFAULT 'draft',
    status_message VARCHAR(512) NULL,
    is_demo TINYINT UNSIGNED NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    indexed_at DATETIME NULL,
    UNIQUE KEY uq_private_token (private_token),
    UNIQUE KEY uq_public_token (public_token)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
  `CREATE TABLE IF NOT EXISTS media (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    gallery_id INT UNSIGNED NOT NULL,
    path VARCHAR(768) NOT NULL,
    filename VARCHAR(255) NOT NULL,
    kind VARCHAR(16) NOT NULL,
    width INT UNSIGNED NULL,
    height INT UNSIGNED NULL,
    size_bytes BIGINT UNSIGNED NOT NULL DEFAULT 0,
    tone VARCHAR(16) NULL,
    position INT NOT NULL DEFAULT 0,
    favorite TINYINT UNSIGNED NOT NULL DEFAULT 0,
    favorited_at DATETIME NULL,
    poster_path VARCHAR(768) NULL,
    cached TINYINT UNSIGNED NOT NULL DEFAULT 0,
    UNIQUE KEY uq_gallery_path (gallery_id, path),
    KEY idx_media_gallery (gallery_id, position),
    CONSTRAINT fk_media_gallery FOREIGN KEY (gallery_id) REFERENCES galleries(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
]

interface MysqlConn {
  host: string
  port: number
  database: string
  user: string
  password: string
}

function databaseUrlRaw() {
  const fromConfig = String(useRuntimeConfig().databaseUrl || '').trim()
  if (fromConfig) return fromConfig
  return String(process.env.NUXT_DATABASE_URL || process.env.DATABASE_URL || '').trim()
}

function urlProtocol(url: string) {
  return url.split(':')[0]?.toLowerCase() ?? ''
}

export function parseDatabaseUrl(url: string): { driver: DbDriver; mysql?: MysqlConn; sqliteFile?: string } {
  const proto = urlProtocol(url)
  if (proto === 'mysql' || proto === 'mysql2') {
    const normalized = url.replace(/^mysql2:/i, 'mysql:')
    const u = new URL(normalized)
    const database = decodeURIComponent(u.pathname.replace(/^\//, ''))
    if (!database) throw new Error('DATABASE_URL : nom de base manquant dans le chemin.')
    return {
      driver: 'mysql',
      mysql: {
        host: u.hostname,
        port: u.port ? Number(u.port) : 3306,
        database,
        user: decodeURIComponent(u.username),
        password: decodeURIComponent(u.password),
      },
    }
  }
  if (proto === 'sqlite' || proto === 'file') {
    const u = new URL(url.replace(/^file:/, 'sqlite:'))
    const sqliteFile = decodeURIComponent(u.pathname || u.hostname || './.data/soprod.db')
    return { driver: 'sqlite', sqliteFile }
  }
  throw new Error(`DATABASE_URL non supportée (${proto}). Utilisez mysql:// ou sqlite:.`)
}

function configDriver(): DbDriver {
  const url = databaseUrlRaw()
  if (url) return parseDatabaseUrl(url).driver
  const d = String(useRuntimeConfig().db?.driver || 'sqlite').toLowerCase()
  return d === 'mysql' ? 'mysql' : 'sqlite'
}

function resolveMysqlConfig(): MysqlConn {
  const url = databaseUrlRaw()
  if (url) {
    const parsed = parseDatabaseUrl(url)
    if (parsed.driver !== 'mysql' || !parsed.mysql) throw new Error('DATABASE_URL attendue en mysql://')
    return parsed.mysql
  }
  const mysql = useRuntimeConfig().db.mysql
  return {
    host: mysql.host,
    port: Number(mysql.port) || 3306,
    database: mysql.database,
    user: mysql.user,
    password: mysql.password,
  }
}

function sqliteDbPath() {
  const url = databaseUrlRaw()
  if (url && urlProtocol(url) === 'sqlite' || url && urlProtocol(url) === 'file') {
    const { sqliteFile } = parseDatabaseUrl(url)
    return sqliteFile!
  }
  return dataPaths().db
}

async function openSqlite() {
  const { DatabaseSync } = await import('node:sqlite')
  const dbPath = sqliteDbPath()
  try {
    mkdirSync(dirname(dbPath), { recursive: true })
    sqlite = new DatabaseSync(dbPath)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    const hint = /EACCES|EROFS|read-only/i.test(message)
      ? 'NUXT_DATA_DIR doit être un dossier inscriptible sur le serveur.'
      : message
    throw createError({ statusCode: 500, message: `SQLite inaccessible : ${hint}` })
  }
  sqlite.exec('PRAGMA journal_mode = WAL')
  sqlite.exec('PRAGMA foreign_keys = ON')
  sqlite.exec(SQLITE_SCHEMA)
}

async function openMysql() {
  let mysql: MysqlConn
  try {
    mysql = resolveMysqlConfig()
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    throw createError({ statusCode: 500, message })
  }
  if (!mysql.host || !mysql.database || !mysql.user) {
    throw createError({
      statusCode: 500,
      message:
        'MySQL : définissez NUXT_DATABASE_URL (mysql://…) ou NUXT_DB_DRIVER=mysql avec NUXT_DB_MYSQL_HOST, NUXT_DB_MYSQL_DATABASE, NUXT_DB_MYSQL_USER, NUXT_DB_MYSQL_PASSWORD.',
    })
  }
  try {
    pool = createPool({
      host: mysql.host,
      port: mysql.port,
      database: mysql.database,
      user: mysql.user,
      password: mysql.password,
      waitForConnections: true,
      connectionLimit: 8,
      charset: 'utf8mb4',
    })
    await pool.execute('SELECT 1')
    for (const stmt of MYSQL_STATEMENTS) {
      await pool.execute(stmt)
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    throw createError({
      statusCode: 500,
      message: `Connexion MySQL impossible (${mysql.host}/${mysql.database}) : ${message}`,
    })
  }
}

export async function initSqlEngine() {
  if (ready) return
  driver = configDriver()
  if (driver === 'mysql') {
    await openMysql()
    const mysql = resolveMysqlConfig()
    const via = databaseUrlRaw() ? 'DATABASE_URL' : 'NUXT_DB_MYSQL_*'
    console.log(`[soprod] Base MySQL (${via}) : ${mysql.host}/${mysql.database}`)
  } else {
    await openSqlite()
    console.log(`[soprod] Base SQLite : ${sqliteDbPath()}`)
  }
  ready = true
}

export function dbDriver() {
  return driver
}

export function sqlNow() {
  return new Date().toISOString().slice(0, 19).replace('T', ' ')
}

/** MySQL renvoie parfois BIGINT / Date : JSON.stringify échoue sans ça. */
function normalizeSqlValue(value: unknown): unknown {
  if (typeof value === 'bigint') return Number(value)
  if (value instanceof Date) return value.toISOString().slice(0, 19).replace('T', ' ')
  return value
}

function normalizeSqlRow<T>(row: RowDataPacket): T {
  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(row)) out[key] = normalizeSqlValue(value)
  return out as T
}

export async function sqlGet<T>(sql: string, params: unknown[] = []): Promise<T | undefined> {
  await initSqlEngine()
  if (driver === 'mysql') {
    const [rows] = await pool!.execute<RowDataPacket[]>(sql, params)
    const row = rows[0]
    return row ? normalizeSqlRow<T>(row) : undefined
  }
  return sqlite!.prepare(sql).get(...params) as T | undefined
}

export async function sqlAll<T>(sql: string, params: unknown[] = []): Promise<T[]> {
  await initSqlEngine()
  if (driver === 'mysql') {
    const [rows] = await pool!.execute<RowDataPacket[]>(sql, params)
    return rows.map(row => normalizeSqlRow<T>(row))
  }
  return sqlite!.prepare(sql).all(...params) as T[]
}

export async function sqlRun(sql: string, params: unknown[] = []): Promise<number> {
  await initSqlEngine()
  if (driver === 'mysql') {
    const [result] = await pool!.execute(sql, params)
    const header = result as { insertId?: number }
    return Number(header.insertId ?? 0)
  }
  const info = sqlite!.prepare(sql).run(...params) as { lastInsertRowid: number | bigint }
  return Number(info.lastInsertRowid ?? 0)
}
