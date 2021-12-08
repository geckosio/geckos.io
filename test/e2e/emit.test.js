/* eslint-disable sort-imports */
import { express, Static } from 'express6'
import geckos from '../../packages/server/lib/index.js'
import http from 'http'
import path from 'path'

import { __dirname } from './_dirname.js'

const app = express()
const server = http.createServer(app)
const io = geckos({
  label: 'testLabel',
  ordered: true,
  maxRetransmits: 10,
  maxPacketLifeTime: undefined
})

app.use('/', Static(path.join(__dirname, '../')))

io.addServer(server)
server.listen(5500)

let channel

describe('connection', () => {
  test('connect', done => {
    io.onConnection(ch => {
      channel = ch
      done()
    })
  })

  describe('emit', () => {
    test('should emit to single', done => {
      const responses = []

      channel.on('emit', data => {
        responses.push(data)

        if (responses.length === 3) {
          expect(responses[0]).toBe('emit back')
          expect(responses[1]).toBe('got Buffer')
          expect(responses[2]).toBe('got 1234')
          done()
        }
      })
      channel.emit('emit', 'emit')
      channel.emit('emit', Buffer.alloc(8))
      channel.emit('emit', 1234)
    })
  })

  describe('emit room', () => {
    test('should emit to room', done => {
      channel.on('emit room', data => {
        expect(data).toBe('emit room back')
        done()
      })
      channel.room.emit('emit room', 'emit room')
    })
  })

  describe('emit global', () => {
    test('should emit to global', done => {
      channel.on('emit global', data => {
        expect(data).toBe('hello global back')
        done()
      })
      io.emit('emit global', 'hello global')
    })
  })

  describe('emit specific room', () => {
    let calls = 0
    test('should emit to specific room', done => {
      channel.on('io room', data => {
        if (data === 'Hello back, everyone!') calls++
      })

      io.room(channel.roomId).emit('io room', 'Hello everyone!')
      io.room('non-existing-roomId').emit('io room', 'Hello everyone!')
      io.room().emit('io room', 'Hello everyone!')

      setTimeout(() => {
        expect(calls).toBe(2)
        done()
      }, 1000)
    })
  })
})

page.goto('http://localhost:5500/e2e/emit.html')

afterAll(async () => {
  const close = () => {
    return new Promise(resolve => {
      server.close(() => {
        resolve()
      })
    })
  }

  await close()
  // await page.close()
  // await browser.close()
})
