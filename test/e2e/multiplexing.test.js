/* eslint-disable sort-imports */
import { afterThis } from 'jest-after-this'
import { express, Static } from 'express6'
import geckos from '../../packages/server/lib/index.js'
import http from 'http'
import path from 'path'

import { __dirname } from './_dirname.js'

const pause = t => new Promise(r => setTimeout(r, t))

describe('Multiplexing (using a single UDP port)', () => {
  test('should work with multiplex', async () => {
    const app = express()
    const server = http.createServer(app)

    // If multiplexing is working, that single port should be enough for multiple clients.
    const io = geckos({ portRange: { min: 20000, max: 20001 }, multiplex: true })

    app.use('/', Static(path.join(__dirname, '../')))

    io.addServer(server)
    server.listen(6969)

    afterThis((done) => {
      server.close(done)
    })

    const firstPage = await browser.newPage()
    const secondPage = await browser.newPage()
    const thirdPage = await browser.newPage()

    afterThis(async () => {
      await firstPage.close()
      await secondPage.close()
      await thirdPage.close()
    })

    firstPage.goto('http://localhost:6969/e2e/multiplexing.html')
    secondPage.goto('http://localhost:6969/e2e/multiplexing.html')
    thirdPage.goto('http://localhost:6969/e2e/multiplexing.html')

    await pause(1000)

    expect(io.connectionsManager.connections.size).toBe(3)
  })

  test('should NOT work without multiplex', async () => {
    const app = express()
    const server = http.createServer(app)

    // Without multiplex, two ports should not be enough for all clients.
    const io = geckos({ portRange: { min: 20002, max: 20004 }, multiplex: false })

    app.use('/', Static(path.join(__dirname, '../')))

    io.addServer(server)
    server.listen(6968)

    afterThis((done) => {
      server.close(done)
    })

    const firstPage = await browser.newPage()
    const secondPage = await browser.newPage()
    const thirdPage = await browser.newPage()

    afterThis(async () => {
      await firstPage.close()
      await secondPage.close()
      await thirdPage.close()
    })

    firstPage.goto('http://localhost:6968/e2e/multiplexing.html')
    secondPage.goto('http://localhost:6968/e2e/multiplexing.html')
    thirdPage.goto('http://localhost:6968/e2e/multiplexing.html')

    await pause(1000)

    expect(io.connectionsManager.connections.size).toBe(2)
  })
})
