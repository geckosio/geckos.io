/* eslint-disable sort-imports */
import {jest} from '@jest/globals';
import express  from 'express'
import geckos from '../../packages/server/lib/index.js'
import http  from 'http'
import path from 'path'

import {__dirname} from './_dirname.js'

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
