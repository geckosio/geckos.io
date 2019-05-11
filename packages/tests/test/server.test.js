const geckos = require('../../server/lib').default
const http = require('http')
const express = require('express')
const path = require('path')
const app = express()
const server = http.createServer(app)
const io = geckos({ iceTransportPolicy: 'relay' })

app.use('/static', express.static(path.join(__dirname, '../../../bundles/latest')))
app.get('/server.html', (req, res) => res.sendFile(path.join(__dirname, 'server.html')))

io.addServer(server)
server.listen(3034)
jest.setTimeout(5000)

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

    test('to room loopback should be "OK"', done => {
      channel.room.emit('chat message', 'Hello everyone in this room')
      channel.on('room test', data => {
        if (data === 'OK') done()
      })
    })

    test('raw message should be "123"', done => {
      channel.onRaw(rawMessage => {
        expect(rawMessage).toBe('123')
        done()
      })
    })
  })
})

page.goto('http://localhost:3034/server.html')

afterAll(async () => {
  server.close()
  server.removeAllListeners()
})
