import geckos, { ServerChannel, Data, RawMessage, iceServers } from '@geckos.io/server'

// using with express
import express from 'express'
import http from 'http'
import { join } from 'path'
const app = express()
const server = http.createServer(app)
const io = geckos({
  iceServers: process.env.NODE_ENV === 'production' ? iceServers : []
  // cors: { origin: 'http://localhost:8080' }
  // cors: {
  //   origin: req => {
  //     // do some work and return a string
  //     return 'http://localhost:8080'
  //   }
  // }
})

io.addServer(server)

app.use('/static/client', express.static(join(__dirname, '../client')))

app.get('/', (req, res) => res.sendFile(join(__dirname, '../client/index.html')))

// have to user server instead of app
server.listen(3000, () => {
  console.log('express is on http://localhost:3000')
})

io.onConnection((channel: ServerChannel) => {
  channel.onDisconnect(event => {
    console.log('onDisconnect event:', event)
    if (event === 'closed') console.log(`The connection for channel ${channel.id} got closed!`)
  })

  channel.emit('chat message', `Welcome to the chat ${channel.id}!`)

  // send reliable messages to the client (experimental)
  io.emit('some reliable event', 'very important message [io]', { reliable: true })
  channel.emit('some reliable event', 'very important message [channel]', { reliable: true })

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
