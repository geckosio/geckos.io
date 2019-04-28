const geckos = require('@geckos.io/server').default
const http = require('http')
const express = require('express')
const path = require('path')
const app = express()
const server = http.createServer(app)
const io = geckos()

app.use('/static', express.static(path.join(__dirname, '../bundles/latest')))
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')))

io.addServer(server)
server.listen(3033)
jest.setTimeout(5000)

test('chat message should be "Hello"', done => {
  io.onConnection(channel => {
    channel.on('chat message 1', () => {
      channel.room.emit('chat message 2')
    })

    channel.on('chat message 2', data => {
      expect(data).toBe('Hello 2')
      done()
    })
  })
})

page.goto('http://localhost:3033')

afterAll(async () => {
  server.close()
  server.removeAllListeners()
})
