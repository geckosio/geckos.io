const geckos = require('../../packages/server/lib').default
const http = require('http')
const express = require('express')
const path = require('path')
const app = express()
const server = http.createServer(app)
const io = geckos({
  label: 'testLabel',
  ordered: true,
  maxRetransmits: 10,
  maxPacketLifeTime: undefined
})

app.use('/', express.static(path.join(__dirname, '../')))

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
      channel.on('emit', data => {
        expect(data).toBe('emit back')
        done()
      })
      channel.emit('emit', 'emit')
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
