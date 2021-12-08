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
