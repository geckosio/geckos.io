/* eslint-disable sort-imports */
import geckos, { Data, GeckosServer, RawMessage, iceServers } from '@geckos.io/server'

// https://stackoverflow.com/a/55944697
import { dirname } from 'path'
import { fileURLToPath } from 'url'
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// using with express6
import { express, Static } from 'express6'
import http from 'http'
import { join } from 'path'

const app = express()
const server = http.createServer(app as any)
const io: GeckosServer = geckos({
  iceServers: process.env.NODE_ENV === 'production' ? iceServers : []
})

io.addServer(server)

app.use('/static/client', Static(join(__dirname, '../dist/client')))

app.get('/', (req: any, res: any) => res.sendFile(join(__dirname, '../dist/client/index.html')))

// have to user server instead of app
server.listen(3000, () => {
  console.log('express is on http://localhost:3000')
})

setInterval(() => {
  io.emit('chat message', new Date().toISOString())
}, 1000)

io.onConnection(channel => {
  console.log(channel.id, 'connected')

  channel.onDisconnect(reason => {
    console.log(channel.id, 'disconnected', reason)
  })
})

process.on('SIGTERM', () => {
  server.close()
})
