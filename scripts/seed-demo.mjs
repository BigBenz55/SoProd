// Prepares demo material from a folder of source images:
//   demo-box/mariage-claire-antoine/*.jpg  → stands in for the originals on the Box disk
//   public/images/*.webp                   → imagery for the showcase page
// Usage: node scripts/seed-demo.mjs <source-dir>
import { mkdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join, resolve } from 'node:path'
import sharp from 'sharp'

const source = resolve(process.argv[2] ?? 'scripts/demo-source')
const root = resolve(import.meta.dirname, '..')
const boxDir = join(root, 'demo-box', 'mariage-claire-antoine')
const publicDir = join(root, 'public', 'images')

const sequence = [
  ['robe-boutons', 'CA-0112'],
  ['preparatifs-boutons', 'CA-0158'],
  ['portrait-voile', 'CA-0204'],
  ['alliances', 'CA-0231'],
  ['ceremonie-eglise', 'CA-0347'],
  ['sortie-confettis', 'CA-0418'],
  ['vin-honneur', 'CA-0502'],
  ['hero-allee', 'CA-0611'],
  ['couple-prairie', 'CA-0689'],
  ['diner-table', 'CA-0744'],
  ['premiere-danse', 'CA-0903'],
  ['sortie-etincelles', 'CA-1027'],
]

await mkdir(boxDir, { recursive: true })
await mkdir(publicDir, { recursive: true })

for (const [name, shot] of sequence) {
  const input = join(source, `${name}.png`)
  if (!existsSync(input)) {
    console.warn(`manquant : ${input}`)
    continue
  }
  const mono = sharp(input).grayscale()

  await mono.clone().jpeg({ quality: 92, mozjpeg: true }).toFile(join(boxDir, `${shot}.jpg`))

  for (const width of [960, 1920]) {
    await mono
      .clone()
      .resize({ width, withoutEnlargement: false })
      .webp({ quality: 74 })
      .toFile(join(publicDir, `${name}-${width}.webp`))
  }
  console.log(`✓ ${name} → ${shot}.jpg`)
}
