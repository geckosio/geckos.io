const geckos = require('../packages/server/lib').default
const http = require('http')
const express = require('express')
const path = require('path')
const app = express()
const server = http.createServer(app)
const io = geckos()

app.use('/', express.static(path.join(__dirname)))

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
    test('should end reliable messages back and forth', done => {
      channel.on('reliable-message', data => {
        expect(data).toBe('hello back')
        done()
      })
      channel.emit('reliable-message', 'hello', {
        reliable: true
      })
    })
  })
})

page.goto('http://localhost:5400/reliableMessages.html')

afterAll(async () => {
  page.close()
  server.close()
})
