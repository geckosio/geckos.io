/* eslint-disable sort-imports */
import express  from 'express'
import geckos from '../../packages/server/lib/index.js'
import http  from 'http'
import path from 'path'

import {__dirname} from './_dirname.js'

const app = express()
const server = http.createServer(app)
const io = geckos({
  authorization: async token => {
    return { username: 'Yannick', points: 57454 }
  }
})

app.use('/', express.static(path.join(__dirname, '../')))

io.addServer(server)
server.listen(5900)

let channel

describe('connection', () => {
  test('connect', done => {
    io.onConnection(ch => {
      channel = ch
      done()
    })
  })

  describe('messages', () => {
    test('username should be defined', () => {
      expect(channel.userData.username).toBe('Yannick')
    })

    test('client should have the userData as well ', done => {
      channel.on('request-user-data', data => {
        expect(data.points).toBe(57454)
        done()
      })
      channel.emit('request-user-data')
    })
  })
})

page.goto('http://localhost:5900/e2e/authorization.html')

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
