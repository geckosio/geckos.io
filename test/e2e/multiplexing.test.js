/* eslint-disable sort-imports */
import { express, Static } from 'express6'
import geckos from '../../packages/server/lib/index.js'
import http from 'http'
import path, { join } from 'path'
import { readFile, writeFile, rm } from 'fs/promises'

import { __dirname } from './_dirname.js'

const pause = t => new Promise(r => setTimeout(r, t))

/** Immediately kill the server. */
const kill = async (httpServer, sockets = new Set()) => {
  for (const socket of sockets) {
    socket.destroy()
    sockets.delete(socket)
  }

  return new Promise(resolve => {
    httpServer.close(() => {
      return resolve()
    })
  })
}

describe('Multiplexing (using a single UDP port)', () => {
  test('should work with multiplex', async () => {
    const app = express()
    const sockets = new Set()

    const server = http.createServer(app)
    server.on('connection', socket => {
      sockets.add(socket)
    })

    const connections = new Set()

    // If multiplexing is working, that single port should be enough for multiple clients.
    const io = geckos({ portRange: { min: 20000, max: 20001 }, multiplex: true })
    io.onConnection(c => connections.add(c))

    app.use('/', Static(path.join(__dirname, '../')))

    io.addServer(server)
    server.listen(6969)

    const firstPage = await browser.newPage()
    const secondPage = await browser.newPage()
    const thirdPage = await browser.newPage()

    firstPage.goto('http://localhost:6969/e2e/multiplexing.html')
    secondPage.goto('http://localhost:6969/e2e/multiplexing.html')
    thirdPage.goto('http://localhost:6969/e2e/multiplexing.html')

    await pause(1000)

    expect(connections.size).toBe(3)
    expect(io.connectionsManager.connections.size).toBe(3)

    await firstPage.close()
    await secondPage.close()
    await thirdPage.close()
    await kill(server, sockets)
  })

  test('should NOT work without multiplex', async () => {
    const app = express()
    const server = http.createServer(app)

    const connections = new Set()

    // Without multiplex, two ports should not be enough for all clients.
    const io = geckos({ portRange: { min: 20002, max: 20003 }, multiplex: false })
    io.onConnection(c => connections.add(c))

    app.use('/', Static(path.join(__dirname, '../')))

    io.addServer(server)
    server.listen(6969)

    const firstPage = await browser.newPage()
    const secondPage = await browser.newPage()
    const thirdPage = await browser.newPage()

    firstPage.goto('http://localhost:6969/e2e/multiplexing.html')
    secondPage.goto('http://localhost:6969/e2e/multiplexing.html')
    thirdPage.goto('http://localhost:6969/e2e/multiplexing.html')

    await pause(1000)

    expect(connections.size).toBe(2)
    expect(io.connectionsManager.connections.size).toBe(2)

    await firstPage.close()
    await secondPage.close()
    await thirdPage.close()
    await kill(server)
  })
})
