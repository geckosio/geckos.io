const geckos = require('../../packages/server/lib').default
const http = require('http')
const express = require('express')
const path = require('path')
const app = express()
const server = http.createServer(app)
const io = geckos()

app.use('/', express.static(path.join(__dirname, '../')))

io.addServer(server)
server.listen(5100)

let channel

describe('connection', () => {
  test('connect', done => {
    io.onConnection(ch => {
      channel = ch
      done()
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
})

page.goto('http://localhost:5100/e2e/emptyMessages.html')

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
