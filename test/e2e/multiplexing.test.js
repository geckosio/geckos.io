/* eslint-disable sort-imports */
import { afterThis } from 'jest-after-this'
import { express, Static } from 'express6'
import geckos from '../../packages/server/lib/index.js'
import http from 'http'
import path, { join } from 'path'
import { readFile, writeFile, rm } from 'fs/promises'

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

    afterThis(done => {
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
    // change port in multiplexing.html
    let file = await readFile(join(__dirname, 'multiplexing.html'), { encoding: 'utf-8' })
    file = file.replace('6969', '6968')
    await writeFile(join(__dirname, 'multiplexing-6968.html'), file, { encoding: 'utf-8' })

    const app = express()
    const server = http.createServer(app)

    // Without multiplex, two ports should not be enough for all clients.
    const io = geckos({ portRange: { min: 20002, max: 20004 }, multiplex: false })

    app.use('/', Static(path.join(__dirname, '../')))

    io.addServer(server)
    server.listen(6968)

    afterThis(done => {
      server.close(done)
    })

    const firstPage = await browser.newPage()
    const secondPage = await browser.newPage()
    const thirdPage = await browser.newPage()

    afterThis(async () => {
      await firstPage.close()
      await secondPage.close()
      await thirdPage.close()
      await rm(join(__dirname, 'multiplexing-6968.html'))
    })

    firstPage.goto('http://localhost:6968/e2e/multiplexing-6968.html')
    secondPage.goto('http://localhost:6968/e2e/multiplexing-6968.html')
    thirdPage.goto('http://localhost:6968/e2e/multiplexing-6968.html')

    await pause(1000)

    // but this should be 2?
    expect(io.connectionsManager.connections.size).toBe(3)
  })
})
