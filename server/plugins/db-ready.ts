import { initSqlEngine } from '../utils/sql-engine'

export default defineNitroPlugin(async () => {
  await initSqlEngine()
  const { data } = dataPaths()
  console.log(`[soprod] Cache WebP : ${data}/cache`)
})
