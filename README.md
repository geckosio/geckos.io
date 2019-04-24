<div align="center">

<a href="http://geckos.io">
<img src="readme/logo-256.png" alt="logo" width="128">
</a>

# geckos.io

#### Geckos&#46;io offers real-time client/server communication over UDP using WebRTC and Node.js

[![Dependency Status](https://david-dm.org/geckosio/geckos.io/status.svg?path=packages/server&style=flat-square)](https://david-dm.org/geckosio/geckos.io?path=packages%2Fserver)
[![devDependency Status](https://david-dm.org/geckosio/geckos.io/dev-status.svg?path=packages/server&style=flat-square)](https://david-dm.org/geckosio/geckos.io?path=packages%2Fserver&type=dev)
[![NPM version](https://img.shields.io/npm/v/@geckos.io/server.svg?style=flat-square)](https://www.npmjs.com/package/@geckos.io/server)
[![Downloads](https://img.shields.io/npm/dm/@geckos.io/server.svg?style=flat-square)](https://www.npmjs.com/package/@geckos.io/server)
![Node version](https://img.shields.io/node/v/@geckos.io/server.svg?style=flat-square)
![Code style](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)

</div>

---

## What is it made for?

It's designed specifically for your HTML5 real-time multiplayer games by lowering the average latency and preventing huge latency spikes.

## Getting Started

First things first, install it via npm:

```console
npm install @geckos.io/client @geckos.io/server
```

## Usage

#### client.js

```js
import geckos from '@geckos.io/client'

const channel = geckos()

channel.onConnect(error => {
  if (error) {
    console.error(error.message)
    return
  }

  channel.on('chat message', data => {
    console.log(`You got the message ${data}`)
  })

  channel.emit('chat message', 'a short message sent to the server')
})
```

#### server.js

```js
const geckos = require('@geckos.io/server').default
// or with es6
import geckos from '@geckos.io/server'

const io = geckos()

io.listen()

io.onConnection(channel => {
  channel.onDisconnect(() => {
    console.log(`${channel.id} got disconnected`)
  })

  channel.on('chat message', data => {
    console.log(`got ${data} from "chat message"`)
    // emit the "chat message" data to all channels in the same room
    io.room(channel.roomId).emit('chat message', data)
  })
})
```

## Cheatsheet

You will find all the available methos in the [cheatsheet](cheatsheet.md)!

## Servers

### Standalone

```js
import geckos from '@geckos.io/server'
const io = geckos()

io.onConnection( channel => { ... })
io.listen()
```

### Node.js HTTP Server

```js
// TODO(yandeu) addServer() does not work yet
const geckos = require('@geckos.io/server').default
const http = require('http')
const server = http.createServer()
const io = geckos()

io.addServer(server)
io.onConnection( channel => { ... })
server.listen(3000)
```

### Express

```js
// TODO(yandeu) addServer() does not work yet
const geckos = require('@geckos.io/server').default
const http = require('http')
const express = require('express')
const app = express()
const server = http.createServer(app)
const io = geckos()

io.addServer(server)
io.onConnection( channel => { ... })
server.listen(3000);
```

## Deployment

You have to make sure you deploy it to a server which forwards all traffic on ports **9208/tcp** and **0-65535/upd** to your application.

Port 9208/tcp is used for the peer signaling. The peer connection itself will be on a random port between 0-65535/upd.

## ICE Servers

Geckos&#46;io provides a default list of ICE servers for testing. In production, you should probably use your own STUN and TURN servers.

```js
const geckos = require('@geckos.io/server').default
const { iceServers } = require('@geckos.io/server')
// or
import geckos, { iceServers } from '@geckos.io/server'

// use an empty array if you are developing locally
// use the default iceServers if you are testing it on your server
const io = geckos(null, TESTING_LOCALLY ? [] : iceServers)
```

## TypeScript

Geckos&#46;io is written in TypeScript. If you import geckos&#46;io with the `import` statement, the types will be imported as well.

```ts
// client.js
import geckos, { Data } from '@geckos.io/client'

const channel = geckos('YOUR_SERVER_URL')

channel.onConnect(() => {
  channel.on('chat message', (data: Data) => {
    // ...
  })
})

// server.js
import geckos, { Data, Channel } from '@geckos.io/server'

const io = geckos()

io.onConnection((channel: Channel) => {
  channel.on('chat message', (data: Data) => {
    // ...
  })
})
```

## Examples

- [Multiplayer Game with phaser.io](https://github.com/geckosio/phaser3-multiplayer-game-example)

## socket&#46;io vs geckos&#46;io vs peerjs

_TODO: Note some differences here._

### When to use socket&#46;io, geckos&#46;io or peerjs?

|                                                                 | socket&#46;io | geckos&#46;io | peerjs  |
| --------------------------------------------------------------- | :-----------: | :-----------: | :-----: |
| Real-Time Multiplayer Game<br>(_with authoritative server_)     |               |    &#9679;    |         |
| Real-Time Multiplayer Game<br>(_without authoritative server_)  |               |               | &#9679; |
| Turn based Multiplayer Game<br>(_with authoritative server_)    |    &#9679;    |               |         |
| Turn based Multiplayer Game<br>(_without authoritative server_) |    &#9679;    |               | &#9679; |
| Chat App                                                        |    &#9679;    |               | &#9679; |
| Any other App with Real-Time communication                      |    &#9679;    |               | &#9679; |

## License

The BSD 3-Clause License (BSD-3-Clause) 2019 - [Yannick Deubel](https://github.com/yandeu). Please have a look at the [LICENSE](LICENSE) for more details.
