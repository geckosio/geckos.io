import geckos, { ServerChannel, Data, RawMessage, iceServers } from '@geckos.io/server'

// using with express
import express from 'express'
import http from 'http'
import { join } from 'path'
const app = express()
const server = http.createServer(app)
const io = geckos({ iceServers: process.env.NODE_ENV === 'production' ? iceServers : [] })
io.listen()

app.use('/static/client', express.static(join(__dirname, '../client')))

app.get('/', (req, res) => res.sendFile(join(__dirname, '../client/index.html')))

// have to user server instead of app
server.listen(3000, () => {
  console.log('express is on http://localhost:3000')
})

io.onConnection((channel: ServerChannel) => {
  channel.onDisconnect(() => {
    console.log(`${channel.id} got disconnected`)
  })

  channel.emit('chat message', `Welcome to the chat ${channel.id}!`)

  channel.on('chat message', (data: Data) => {
    // emit to all
    io.emit('chat message', `ALL: ${data}`)

    // emit the "chat message" data to all channels in the same room
    channel.room.emit('chat message', `ROOM: ${data}`)

    // emit the "chat message" data to all channels in the same room, except sender
    channel.broadcast.emit('chat message', data)

    // emits a message to the channel
    channel.emit('chat message', `SENT: ${data}`)
  })

  channel.on('number', (data: Data) => {
    console.log('number: ', data)
  })

  channel.onRaw((rawMessage: RawMessage) => {
    console.log('rawMessage: ', rawMessage)
    channel.raw.emit('RAW_MESSAGE')
  })
})
