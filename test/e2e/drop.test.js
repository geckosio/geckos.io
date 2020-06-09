const geckos = require('../../packages/server/lib').default
const http = require('http')
const express = require('express')
const path = require('path')
const app = express()
const server = http.createServer(app)
const io = geckos()

app.use('/', express.static(path.join(__dirname, '../')))

io.addServer(server)
server.listen(5700)

let channel

describe('connection', () => {
  test('connect', done => {
    io.onConnection(ch => {
      channel = ch
      done()
    })
  })

  describe('messages', () => {
    test('should get maxMessageSize', () => {
      expect(typeof channel.maxMessageSize === 'number').toBeTruthy()
    })

    describe('', () => {
      test('should send successfully', done => {
        let dropped = false

        channel.onDrop(drop => {
          dropped = true
        })

        channel.raw.emit(Buffer.alloc(channel.maxMessageSize))

        setTimeout(() => {
          expect(dropped).toBeFalsy()
          done()
        }, 200)
      })
    })

    describe('', () => {
      test('should drop too large message', done => {
        let dropped = false

        channel.onDrop(drop => {
          if (dropped) return
          dropped = true
          expect(drop.reason).toBe('MAX_MESSAGE_SIZE_EXCEEDED')
          done()
        })

        channel.raw.emit(Buffer.alloc(channel.maxMessageSize + 1))
      })
    })

    describe('', () => {
      test('should drop some messages', done => {
        let attempts = 0

        channel.onDrop(drop => {
          expect(drop.reason).toBe('DROPPED_FROM_BUFFERING')
          expect(attempts).toBeGreaterThanOrEqual(10)
          clearInterval(interval)
          done()
        })

        const interval = setInterval(() => {
          attempts++
          channel.raw.emit(Buffer.alloc(50 * 1024))
        }, 0)
      })
    })
  })
})

page.goto('http://localhost:5700/e2e/drop.html')

afterAll(async () => {
  page.close()
  server.close()
})
