/* eslint-disable sort-imports */
import { jest } from '@jest/globals'
import { express, Static } from 'express6'
import geckos from '../../packages/server/lib/index.js'
import http from 'http'
import path from 'path'

import { __dirname } from './_dirname.js'

const app = express()
const server = http.createServer(app)
const io = geckos({ iceTransportPolicy: 'relay' })

// give enough time for io.server.close to be called on github workflow
jest.setTimeout(120_000)

app.use('/', Static(path.join(__dirname, '../')))

io.addServer(server)
server.listen(5201)

let channel

describe('connection', () => {
  test('connect', done => {
    io.onConnection(ch => {
      channel = ch
      done()
    })
  })

  describe('messages', () => {
    test('chat message should be "Hello"', done => {
      channel.on('chat message 1', () => {
        channel.room.emit('chat message 2')
      })
      channel.on('chat message 2', data => {
        expect(data).toBe('Hello 2')
        done()
      })
    })

    test('should join room ', () => {
      channel.join('testRoom')
      expect(channel.roomId).toBe('testRoom')
    })

    test('should leave room ', () => {
      channel.leave()
      expect(channel.roomId).toBe(undefined)
    })

    test('test port', () => {
      expect(io.port).toBe(undefined)
    })

    test('to room loopback should be "OK"', done => {
      channel.on('room test', data => {
        if (data === 'OK') done()
      })
      channel.room.emit('chat message', 'Hello everyone in this room')
    })

    test('raw message should be "raw back"', done => {
      channel.onRaw(rawMessage => {
        expect(rawMessage).toBe('raw back')
        done()
      })
      channel.raw.emit('raw')
    })

    test('broadcast should not be sent to current channel', done => {
      let called = false
      channel.on('broadcast', () => {
        called = true
      })
      channel.broadcast.emit('broadcast', { reliable: true })
      channel.broadcast.emit('broadcast')
      setTimeout(() => {
        expect(called).toBeFalsy()
        done()
      }, 200)
    })
  })

  describe('close', () => {
    const delay = ms => {
      return new Promise(resolve => {
        setTimeout(resolve, ms)
      })
    }

    test('server should notify of client closing the connection', done => {
      let closed = false
      let disconnected = false

      channel.onDisconnect(reason => {
        disconnected = /^closed|disconnected$/.test(reason)
      })

      io.server.close(() => {
        closed = true
        delay(10_000).then(() => {
          expect(closed).toBe(true)
          expect(disconnected).toBe(true)
          done()
        })
      })
    })

    test('there should be no connection left', () => {
      const connections = io.connectionsManager.connections.size
      expect(connections).toBe(0)
    })
  })
})

page.goto('http://localhost:5201/e2e/server.html')

// afterAll(async () => {
//   page.close()
// })
