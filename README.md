<div align="center">

<a href="http://geckos.io">
<img src="readme/logo-256.png" alt="logo" width="128">
</a>

# geckos.io

### Geckos&#46;io offers real-time client/server communication over UDP using WebRTC and Node.js

#### _Geckos&#46;io fits perfectly with your next HTML5 real-time multiplayer games or chat app._

[![NPM version](https://img.shields.io/npm/v/@geckos.io/server.svg?style=flat-square)](https://www.npmjs.com/package/@geckos.io/server)
[![Github Workflow](https://img.shields.io/github/workflow/status/geckosio/geckos.io/CI/master?label=github%20build&logo=github&style=flat-square)](https://github.com/geckosio/geckos.io/actions?query=workflow%3ACI)
[![Dependency Status](https://david-dm.org/geckosio/geckos.io/status.svg?path=packages/server&style=flat-square)](https://david-dm.org/geckosio/geckos.io?path=packages%2Fserver)
[![Downloads](https://img.shields.io/npm/dm/@geckos.io/server.svg?style=flat-square)](https://www.npmjs.com/package/@geckos.io/server)
![Node version](https://img.shields.io/node/v/@geckos.io/server.svg?style=flat-square)
[![Minified bundle](https://img.shields.io/github/size/geckosio/geckos.io/bundles/latest/geckos.io-client.latest.min.js.svg?label=minified%20bundle&style=flat-square)](https://github.com/geckosio/geckos.io/tree/master/bundles)
[![Codecov](https://img.shields.io/codecov/c/github/geckosio/geckos.io?logo=codecov&style=flat-square)](https://codecov.io/gh/geckosio/geckos.io)

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

// or add a minified version to your index.html file
// https://github.com/geckosio/geckos.io/tree/master/bundles

const channel = geckos({ port: 3000 }) // default port is 9208

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

io.listen(3000) // default port is 9208

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

Here a list of available methods.

### Client

```js
// import geckos.io client
import geckos from '@geckos.io/client'

/**
 * start geckos client with these options
 * @param options.url default is `${location.protocol}//${location.hostname}`
 * @param options.port default is 9208
 * @param options.label Default: 'geckos.io'.
 * @param options.iceServers Default: [].
 * @param options.iceTransportPolicy Default: 'all'.
 */
const channel = geckos(options)

// once the channel is connected to the server
channel.onConnect(error => {
  if (error) console.error(error.message)

  // listens for a disconnection
  channel.onDisconnect(() => {})

  // listens for a custom event from the server
  channel.on('chat message', data => {})

  // emits a message to the server
  channel.emit('chat message', 'Hi!')

  // closes the WebRTC connection
  channel.close()
})
```

### Server

```js
// import geckos.io server
import geckos from '@geckos.io/server'

/**
 * start geckos server with these options
 * @param options.iceServers Default: [].
 * @param options.iceTransportPolicy Default: 'all'.
 * @param options.label Default: 'geckos.io'.
 * @param options.ordered Default: false.
 * @param options.maxPacketLifeTime Default: null.
 * @param options.maxRetransmits Default: 0.
 * @param options.cors
 * @param options.cors.origin String | (req) => string. Default '*'
 */
io = geckos(options)

/**
 * make the server listen on a port
 * @param {number} port default port is 9208
 */
io.listen()

// whenever a new channel is connected
io.onConnection(channel => {
  // the channel includes its id
  const { id } = channel

  // whenever the channel got disconnected
  // the event will be 'disconnected', 'failed' or 'closed'
  channel.onDisconnect(event => {})

  // listen for a custom event
  channel.on('chat message', data => {})

  // channel joins a room
  channel.join('someRoomId')

  // channel leaves a room
  channel.leave()

  // channel closes the webRTC connection
  channel.close()

  // will trigger a specific event on all channels in a
  // specific room and add the senderId as a second parameter
  channel.forward(channel.roomId).emit('chat message', 'Hello!')

  // listen for a forwarded message
  channel.on('chat message', (data, senderId) => {
    // we know that the message was forwarded if senderId is defined
    if (senderId) {
      // ...
    } else {
      // ...
    }
  })

  // emits a message to the channel
  channel.emit('chat message', 'Hello to myself!')

  // emits a message to all channels, in the same room
  channel.room.emit('chat message', 'Hello everyone!')

  // emits a message to all channels, in the same room, except sender
  channel.broadcast.emit('chat message', 'Hello friends!')

  // emits a message to all channels
  io.emit('chat message', 'Hello everyone!')

  // emits a message to all channels in a specific room
  io.room(roomId).emit('chat message', 'Hello everyone!')
})
```

**Note**: The following event names are reserved:

- `sendOverDataChannel`
- `receiveFromDataChannel`
- `disconnected`
- `disconnect`
- `connection`
- `connect`
- `error`
- `dataChannelIsOpen`
- `sendToRoom`
- `sendToAll`
- `forwardMessage`
- `broadcastMessage`
- `rawMessage`

## Raw Messages

You can send and receive `USVString`, `ArrayBuffer` and `ArrayBufferView` using rawMessages.

```js
// emit a raw message
channel.raw.emit(rawMessage)

// emit a raw message to all users in the same room
channel.raw.room.emit(rawMessage)

// broadcast a raw message
channel.raw.broadcast.emit(rawMessage)

// listen for a raw message
channel.onRaw(rawMessage => {})
```

## Reliable Messages

All emit function can send reliable message if needed. This is **NOT** meant to be used as the default. Just use it to send important messages back and forth.

It works by simply transferring multiple messages after each other. The receiver will simply reject a message if it has already been processed.

```js
channel.emit(
  'end of game',
  {
    points: 147,
    time: 650,
    achievements: ['crucial_hit', 'golden_trophy']
  },
  {
    // Set the reliable option
    // Default: false
    reliable: true,
    // The interval between each message in ms (optional)
    // Default: 150
    interval: 150,
    // How many times the message should be sent (optional)
    // Default: 10
    runs: 10
  }
)
```

## Servers

### Standalone

```js
import geckos from '@geckos.io/server'
const io = geckos()

io.onConnection( channel => { ... })
io.listen(3000) // default port is 9208
```

### Node.js HTTP Server

```js
const geckos = require('@geckos.io/server').default
const http = require('http')
const server = http.createServer()
const io = geckos()

io.addServer(server)
io.onConnection( channel => { ... })
// make sure the client uses the same port
// @geckos.io/client uses the port 9208 by default
server.listen(3000)
```

### Express

```js
const geckos = require('@geckos.io/server').default
const http = require('http')
const express = require('express')
const app = express()
const server = http.createServer(app)
const io = geckos()

io.addServer(server)
io.onConnection( channel => { ... })
// make sure the client uses the same port
// @geckos.io/client uses the port 9208 by default
server.listen(3000)
```

## Deployment

You have to make sure you deploy it to a server which forwards all traffic on ports **9208/tcp** (or another port you define) and **0-65535/upd** to your application.

Port 9208/tcp (or another port you define) is used for the peer signaling. The peer connection itself will be on a random port between 0-65535/upd.

## ICE Servers

Geckos&#46;io provides a default list of ICE servers for testing. In production, you should probably use your own STUN and TURN servers.

```js
const geckos = require('@geckos.io/server').default
const { iceServers } = require('@geckos.io/server')
// or
import geckos, { iceServers } from '@geckos.io/server'

// use an empty array if you are developing locally
// use the default iceServers if you are testing it on your server
const io = geckos({ iceServers: null, TESTING_LOCALLY ? [] : iceServers })
```

Watch a useful video about ICE Servers on [YouTube](https://youtu.be/Y1mx7cx6ckI).

## TypeScript

Geckos&#46;io is written in TypeScript. If you import geckos&#46;io with the `import` statement, the types will be imported as well.

```ts
// client.js
import geckos, { Data } from '@geckos.io/client'

const channel = geckos({ url: 'YOUR_SERVER_URL' })

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

- [Multiplayer Game with phaser.io](https://github.com/geckosio/phaser3-multiplayer-game-example#readme)
- [Simple Chat App Example](https://github.com/geckosio/simple-chat-app-example#readme)

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
| Any other App with Real-Time communication                      |    &#9679;    |    &#9679;    | &#9679; |

## Who is using geckos.io

- [DatTank.io](https://dattank.io/) - is a free multiplayer browser online tank game.

## New Technologies

For now WebRTC in the best way to send fast (unordered and unreliable) messages between browser and server. But once a better technology will be widely available (for example [quic](https://caniuse.com/#search=quic)), we will implement it as well.

## Ads

<a href="https://github.com/yandeu/enable3d#readme"><img src="readme/enable3d-logo.png" alt="enable3d logo" width="300"></a>

Want to make a 3D HTML5 Game? Take a look at [enable3d](https://github.com/yandeu/enable3d#readme).

## Development

To help developing geckos.io, install this repository via **`npm install`**. Test it with **`npm test`**. Then start the development server with **`npm run dev`**.

## License

The BSD 3-Clause License (BSD-3-Clause) 2019 - [Yannick Deubel](https://github.com/yandeu). Please have a look at the [LICENSE](LICENSE) for more details.
