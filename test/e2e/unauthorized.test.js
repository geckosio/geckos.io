/* eslint-disable sort-imports */
import { express, Static } from 'express6'
import geckos from '../../packages/server/lib/index.js'
import http from 'http'
import path from 'path'

import { __dirname } from './_dirname.js'
import { sleep, serverListenPromise, kill } from '../helpers.js'

const app = express()

const server = http.createServer(app)
const sockets = new Set()
server.on('connection', socket => {
  sockets.add(socket)
  server.once('close', () => {
    sockets.delete(socket)
  })
})

let theToken
const io = geckos({
  authorization: async token => {
    theToken = token
    return false
  }
})

app.use('/', Static(path.join(__dirname, '../')))

io.addServer(server)
await serverListenPromise(server, 4001)

io.onConnection(ch => {})

describe('connection', () => {
  test('should have no connection', async () => {
    let connections = 0

    io.onConnection(ch => {
      connections++
    })

    await page.goto('http://localhost:4001/e2e/unauthorized.html', { timeout: 2000 })

    await sleep(2000)

    expect(connections).toBe(0)
  })
})

describe('unauthorized', () => {
  test('should have received the token from client', () => {
    expect(theToken).toBe('some-unique-token')
  })
})

afterAll(async () => {
  await kill(server, sockets)
})
