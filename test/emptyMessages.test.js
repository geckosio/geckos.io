const geckos = require('../packages/server/lib').default
const http = require('http')
const express = require('express')
const path = require('path')
const app = express()
const server = http.createServer(app)
const io = geckos()

app.use('/', express.static(path.join(__dirname, '../')))
app.get('/emptyMessages.html', (req, res) => res.sendFile(path.join(__dirname, 'emptyMessages.html')))

io.addServer(server)
server.listen(3515)

let channel

describe('connection', () => {
  test('connect', done => {
    io.onConnection(ch => {
      channel = ch
      done()
    })
  })
})

describe('messages', () => {
  test('should receive empty message', done => {
    channel.on('empty', data => {
      expect(data).toBe(null)
      done()
    })
  })

  test('should receive empty message (reliable)', done => {
    channel.on('empty-reliable', data => {
      expect(data).toBe(null)
      done()
    })
  })
})

page.goto('http://localhost:3515/emptyMessages.html')

afterAll(async () => {
  app.removeAllListeners()
  page.close()
})
