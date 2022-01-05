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
server.listen(6150)

let firstPage
let secondPage
const regId = /^[\w]{24}$/

const messages = []
const waitForNewMessage = toBe => {
  return new Promise(resolve => {
    const count = messages.length
    const interval = setInterval(() => {
      if (toBe && messages.length === toBe) {
        clearInterval(interval)
        return resolve(messages[0])
      } else if (messages.length > count) {
        clearInterval(interval)
        return resolve(messages[0])
      }
    }, 50)
  })
}

beforeAll(async () => {
  io.onConnection(channel => {
    channel.onDisconnect(reason => {
      messages.unshift(reason)
    })

    channel.on('msg', data => {
      messages.unshift(data)
    })

    messages.unshift(channel.id)
  })

  firstPage = await browser.newPage()
  secondPage = await browser.newPage()
})

describe('test with multiple users', () => {
  test('connect user 1', async () => {
    const count = messages.length
    await firstPage.goto('http://localhost:6150/e2e/multipleConnections.html')

    await waitForNewMessage()
    expect(messages.length).toBe(count + 1)
    expect(messages[0]).toMatch(regId)
  })

  test('connect user 2', async () => {
    const count = messages.length
    await secondPage.goto('http://localhost:6150/e2e/multipleConnections.html')

    await waitForNewMessage()
    expect(messages.length).toBe(count + 1)
    expect(messages[0]).toMatch(regId)
  })

  test('two users connected', async () => {
    const size = io.connectionsManager.connections.size
    expect(size).toBe(2)
  })

  test('send/get messages', async () => {
    const count = messages.length

    io.emit('msg', 'hello')

    await waitForNewMessage(4)
    expect(messages.length).toBe(count + 2)
    expect(messages[0]).toMatch('Response: hello')
    expect(messages[1]).toMatch('Response: hello')
  })

  test('close browser of user 1', async () => {
    firstPage.goto('http://localhost:6150')

    await waitForNewMessage()
    expect(messages.length).toBe(5)
    expect(messages[0]).toMatch('disconnected')
  })

  test('only user 1 remaining', async () => {
    const size = io.connectionsManager.connections.size
    expect(size).toBe(1)
  })

  test('send message to all users (only user 1 is remaining)', async () => {
    io.emit('msg', 'hey')

    await waitForNewMessage()
    expect(messages.length).toBe(6)
    expect(messages[0]).toMatch('Response: hey')
  })
})

afterAll(async () => {
  const close = () => {
    return new Promise(resolve => {
      server.close(() => {
        resolve()
      })
    })
  }

  await close()
  // await secondPage()
  // await page.close()
  // await browser.close()
})
