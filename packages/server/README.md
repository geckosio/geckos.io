<a href="http://geckos.io">
<img src="https://github.com/geckosio/geckos.io/raw/master/readme/logo-256.png" alt="logo" width="128">
</a>

# @geckos.io/server

[![Dependency Status](https://david-dm.org/geckosio/geckos.io/status.svg?path=packages/server&style=flat-square)](https://david-dm.org/geckosio/geckos.io?path=packages%2Fserver)
[![NPM version](https://img.shields.io/npm/v/@geckos.io/server.svg?style=flat-square)](https://www.npmjs.com/package/@geckos.io/server)
[![Downloads](https://img.shields.io/npm/dm/@geckos.io/server.svg?style=flat-square)](https://www.npmjs.com/package/@geckos.io/server)
![Node version](https://img.shields.io/node/v/@geckos.io/server.svg?style=flat-square)
![Snyk Vulnerabilities for GitHub Repo (Specific Manifest)](https://img.shields.io/snyk/vulnerabilities/github/geckosio/geckos.io/packages/server/package.json.svg?style=flat-square)
![NPM](https://img.shields.io/npm/l/@geckos.io/server.svg?style=flat-square)

Real-time client/server communication over UDP using **WebRTC** and **Node.js**.

This framework fits perfectly with your next **HTML5 real-time multiplayer games** or chat app.

Read the [documentation](https://github.com/geckosio/geckos.io) for more information.

## Install

```console
npm install @geckos.io/server
```

## How to use

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
