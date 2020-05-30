const geckos = require('../../packages/server/lib').default
const http = require('http')
const express = require('express')
const path = require('path')
const app = express()
const server = http.createServer(app)
const io = geckos()

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
    test('should emit to specific room', done => {
      channel.on('io room', data => {
        expect(data).toBe('Hello back, everyone!')
        done()
      })
      io.room(channel.roomId).emit('io room', 'Hello everyone!')
    })
  })
})

page.goto('http://localhost:5500/e2e/emit.html')

afterAll(async () => {
  page.close()
  server.close()
})
