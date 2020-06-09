const geckos = require('../../packages/server/lib').default
const http = require('http')
const express = require('express')
const path = require('path')
const app = express()
const server = http.createServer(app)
const io = geckos()

app.use('/', express.static(path.join(__dirname, '../')))

io.addServer(server)
server.listen(5800)

// give it one minute time to disconnect
jest.setTimeout(60000)

let channel

describe('connection', () => {
  test('connect', done => {
    io.onConnection(ch => {
      channel = ch
      done()
    })
  })

  describe('close', () => {
    test('should disconnect the client on browser close', done => {
      channel.onDisconnect(reason => {
        expect(typeof reason === 'string').toBeTruthy()
        done()
      })
      // move to another website
      page.goto('about:blank')
    })
  })
})

page.goto('http://localhost:5800/e2e/browserClose.html')

afterAll(async () => {
  server.close()
  page.close()
})
