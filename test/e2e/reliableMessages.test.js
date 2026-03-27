/* eslint-disable sort-imports */
import { express, Static } from 'express6'
import geckos from '../../packages/server/lib/index.js'
import http from 'http'
import path from 'path'

import { __dirname } from './_dirname.js'

const app = express()
const server = http.createServer(app)
const io = geckos()

app.use('/', Static(path.join(__dirname, '../')))

io.addServer(server)
server.listen(5400)

let channel

describe('connection', () => {
  test('connect', done => {
    io.onConnection(ch => {
      channel = ch
      done()
    })
  })

  describe('messages', () => {
    test('should send reliable messages back and forth', done => {
      channel.on('reliable-message', data => {
        expect(data).toBe('hello back')
        done()
      })
      channel.emit('reliable-message', 'hello', {
        reliable: true
      })
    })

    test('should send reliable messages (to room) back and forth', done => {
      channel.on('reliable-message-room', data => {
        expect(data).toBe('hello room back')
        done()
      })
      channel.room.emit('reliable-message-room', 'hello room', {
        reliable: true
      })
    })

    test('should send reliable messages (to global) back and forth', done => {
      channel.on('reliable-message-global', data => {
        expect(data).toBe('hello global back')
        done()
      })
      io.emit('reliable-message-global', 'hello global', {
        reliable: true
      })
    })

    test('should send reliable messages (to specific room via io.room()) back and forth', done => {
      channel.on('reliable-message-io-room', data => {
        expect(data).toBe('hello io room back')
        done()
      })
      io.room(channel.roomId).emit('reliable-message-io-room', 'hello io room', {
        reliable: true
      })
    })

    test('server-to-client: should receive multiple raw copies but deduplicate to one', done => {
      channel.on('server-dedup-result', data => {
        console.log(`server-to-client: rawCount=${data.rawCount}, dedupCount=${data.dedupCount}`)
        expect(data.rawCount).toBeGreaterThan(1)
        expect(data.dedupCount).toBe(1)
        done()
      })
      channel.emit('server-dedup-test', 'ping', { reliable: true })
    })

    test('client-to-server: should receive multiple raw copies but deduplicate to one', done => {
      let rawCount = 0
      let dedupCount = 0

      // count every raw arrival (before deduplication)
      channel.eventEmitter.on('dedup-count-test', () => {
        rawCount++
      })

      // count deduplicated arrivals
      channel.on('dedup-count-test', () => {
        dedupCount++
      })

      // tell the client to send a reliable message back
      channel.emit('dedup-count-test', 'go')

      // wait for all retransmissions to arrive (10 runs × 150ms = ~1.5s)
      setTimeout(() => {
        console.log(`client-to-server: rawCount=${rawCount}, dedupCount=${dedupCount}`)
        expect(rawCount).toBeGreaterThan(1)
        expect(dedupCount).toBe(1)
        done()
      }, 2500)
    })
  })
})

page.goto('http://localhost:5400/e2e/reliableMessages.html')

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
