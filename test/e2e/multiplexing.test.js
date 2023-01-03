/* eslint-disable sort-imports */
import { express, Static } from 'express6'
import geckos from '../../packages/server/lib/index.js'
import http from 'http'
import path from 'path'

import { __dirname } from './_dirname.js'

describe('Multiplexing (using a single UDP port)', () => {
  test('should work with multiplex', async () => {
    const app = express()
    const server = http.createServer(app)

    // If multiplexing is working, that single port should be enough for multiple clients.
    const io = geckos({ portRange: { min: 20000, max: 20001 }, multiplex: true })

    app.use('/', Static(path.join(__dirname, '../')))

    io.addServer(server)
    server.listen(6969)

    const firstPage = await browser.newPage()
    const secondPage = await browser.newPage()
    const thirdPage = await browser.newPage()

    /** @type {Set<import("../../packages/server/lib/index.js").ServerChannel>} */
    const connections = new Set()
    io.onConnection(c => connections.add(c))

    const allConnected = new Promise(r => {
      const cID = setInterval(() => {
        if (connections.size === 3) {
          clearInterval(cID)
          r()
        }
      }, 1000)
    })

    firstPage.goto('http://localhost:6969/e2e/multiplexing.html')
    secondPage.goto('http://localhost:6969/e2e/multiplexing.html')
    thirdPage.goto('http://localhost:6969/e2e/multiplexing.html')
    await allConnected
    expect(connections.size).toBe(3)
  })

  test('should NOT work without multiplex', async () => {
    const app = express()
    const server = http.createServer(app)

    // If multiplexing is working, that single port should be enough for multiple clients.
    const io = geckos({ portRange: { min: 20000, max: 20001 }, multiplex: false })

    app.use('/', Static(path.join(__dirname, '../')))

    io.addServer(server)
    server.listen(6969)

    const firstPage = await browser.newPage()
    const secondPage = await browser.newPage()
    const thirdPage = await browser.newPage()

    /** @type {Set<import("../../packages/server/lib/index.js").ServerChannel>} */
    const connections = new Set()
    io.onConnection(c => connections.add(c))

    const pause = t => new Promise(r => setTimeout(r, t))

    firstPage.goto('http://localhost:6969/e2e/multiplexing.html')
    secondPage.goto('http://localhost:6969/e2e/multiplexing.html')
    thirdPage.goto('http://localhost:6969/e2e/multiplexing.html')
    await pause(2000)
    expect(connections.size).toBe(2)
  })
})
