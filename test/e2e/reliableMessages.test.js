/* eslint-disable sort-imports */
import { express, Static } from 'express6'
import geckos from '../../packages/server/lib/index.js'
import http from 'http'
import path from 'path'

import { __dirname } from './_dirname.js'

const app = express()
const server = http.createServer(app)
const io = geckos()

app.use('/', Static(path.join(__dirname, '../')))

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
    test('should send reliable messages back and forth', done => {
      channel.on('reliable-message', data => {
        expect(data).toBe('hello back')
        done()
      })
      channel.emit('reliable-message', 'hello', {
        reliable: true
      })
    })

    test('should send reliable messages (to room) back and forth', done => {
      channel.on('reliable-message-room', data => {
        expect(data).toBe('hello room back')
        done()
      })
      channel.room.emit('reliable-message-room', 'hello room', {
        reliable: true
      })
    })

    test('should send reliable messages (to global) back and forth', done => {
      channel.on('reliable-message-global', data => {
        expect(data).toBe('hello global back')
        done()
      })
      io.emit('reliable-message-global', 'hello global', {
        reliable: true
      })
    })
  })
})

page.goto('http://localhost:5400/e2e/reliableMessages.html')

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
