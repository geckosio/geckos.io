/* eslint-disable sort-imports */
const { express, Static } = require('express6')
const geckos = require('../../packages/server/cjs/index.js').default
const path = require('path')

const io = geckos()
const app = express()

// give enough time for io.server.close to be called on github workflow
jest.setTimeout(120_000)

app.use('/', Static(path.join(__dirname, '../')))

app.listen(5301)
io.listen(5302)

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
  })

  describe('others', () => {
    test('test port', () => {
      expect(io.port).toBe(5302)
    })
  })

  describe('close', () => {
    test('should close the connection', done => {
      channel.onDisconnect(reason => {
        expect(reason).toBe('closed')
        done()
      })
      setTimeout(() => {
        channel.close()
      }, 2000)
    })
  })

  describe('shutdown', () => {
    const delay = ms => {
      return new Promise(resolve => {
        setTimeout(resolve, ms)
      })
    }

    test('close the geckos server', done => {
      io.server.close(() => {
        delay(10_000).then(() => {
          done()
        })
      })
    })
  })
})

page.goto('http://localhost:5301/e2e/simple.html')

// afterAll(async () => {
//   page.close()
// })
