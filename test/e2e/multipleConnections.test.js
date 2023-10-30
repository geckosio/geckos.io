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

const pause = (ms = 2500) => {
  return new Promise(resolve => {
    setTimeout(() => {
      return resolve()
    }, ms)
  })
}

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
  await pause()
})

describe('test with multiple users', () => {
  test('connect user 1', async () => {
    const count = messages.length
    await firstPage.goto('http://localhost:6150/e2e/multipleConnections.html')

    await waitForNewMessage(count + 1)
    expect(messages.length).toBe(count + 1)
    expect(messages[0]).toMatch(regId)
    await pause()
  })

  test('connect user 2', async () => {
    const count = messages.length
    await secondPage.goto('http://localhost:6150/e2e/multipleConnections.html')

    await waitForNewMessage(count + 1)
    expect(messages.length).toBe(count + 1)
    expect(messages[0]).toMatch(regId)
    await pause()
  })

  test('two users connected', async () => {
    const size = io.connectionsManager.connections.size
    expect(size).toBe(2)
  })

  test('send/get messages', async () => {
    const count = messages.length

    io.emit('msg', 'hello')

    await waitForNewMessage(count + 2)
    expect(messages.length).toBe(count + 2)
    expect(messages[0]).toMatch('Response: hello')
    expect(messages[1]).toMatch('Response: hello')
    await pause()
  })

  test('close browser of user 1', async () => {
    firstPage.goto('http://localhost:6150')

    await waitForNewMessage(5)
    expect(messages.length).toBe(5)
    expect(['disconnected', 'closed']).toContain(messages[0])
    await pause()
  })

  test('only user 1 remaining', async () => {
    const size = io.connectionsManager.connections.size
    expect(size).toBe(1)
  })

  test('send message to all users (only user 1 is remaining)', async () => {
    io.emit('msg', 'hey')

    await waitForNewMessage(6)
    expect(messages.length).toBe(6)
    expect(messages[0]).toMatch('Response: hey')
    await pause()
  })
})

afterAll(async () => {
  const close = () => {
    return new Promise(resolve => {
      setTimeout(() => {
        return resolve()
      }, 5000)
      server.close(() => {
        return resolve()
      })
    })
  }

  await firstPage.close()
  await secondPage.close()
  await close()
  await pause()
})
