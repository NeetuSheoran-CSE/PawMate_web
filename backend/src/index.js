import { createApp } from './app.js'
import { config } from './config.js'
import { connectDb, disconnectDb } from './db.js'

async function main() {
  await connectDb()
  console.log(`[db] connected to MongoDB`)
  const server = createApp().listen(config.port, () => {
    console.log(`[api] PawMate API running on http://localhost:${config.port}/api (${config.env})`)
  })

  const shutdown = async signal => {
    console.log(`\n[api] ${signal} received, shutting down`)
    server.close(async () => {
      await disconnectDb()
      process.exit(0)
    })
    setTimeout(() => process.exit(1), 8000).unref()
  }
  process.on('SIGINT', () => shutdown('SIGINT'))
  process.on('SIGTERM', () => shutdown('SIGTERM'))
}

main().catch(err => {
  console.error('[api] Failed to start:', err.message)
  process.exit(1)
})
