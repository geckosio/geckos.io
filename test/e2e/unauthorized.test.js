/* eslint-disable sort-imports */
import express  from 'express'
import geckos from '../../packages/server/lib/index.js'
import http  from 'http'
import path from 'path'

import {__dirname} from './_dirname.js'

const app = express()
const server = http.createServer(app)
let theToken
const io = geckos({
  authorization: async token => {
    theToken = token
    return false
  }
})

app.use('/', express.static(path.join(__dirname, '../')))

io.addServer(server)
server.listen(4000)

io.onConnection(ch => {})

describe('connection', () => {
  test('should have no connection', done => {
    let connections = 0
    io.onConnection(ch => {
      connections++
    })

    setTimeout(() => {
      expect(connections).toBe(0)
      done()
    }, 1000)
  })
})

describe('unauthorized', () => {
  test('should have received the token from client', () => {
    expect(theToken).toBe('some-unique-token')
  })
})

page.goto('http://localhost:4000/e2e/unauthorized.html')

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
