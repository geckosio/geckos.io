<a href="http://geckos.io">
<img src="https://github.com/geckosio/geckos.io/raw/master/readme/logo-256.png" alt="logo" width="128">
</a>

# @geckos.io/client

[![Dependency Status](https://david-dm.org/geckosio/geckos.io/status.svg?path=packages/client&style=flat-square)](https://david-dm.org/geckosio/geckos.io?path=packages%2Fclient)
[![NPM version](https://img.shields.io/npm/v/@geckos.io/client.svg?style=flat-square)](https://www.npmjs.com/package/@geckos.io/client)
[![Downloads](https://img.shields.io/npm/dm/@geckos.io/client.svg?style=flat-square)](https://www.npmjs.com/package/@geckos.io/client)
![Node version](https://img.shields.io/node/v/@geckos.io/client.svg?style=flat-square)
[![Minified bundle](https://img.shields.io/github/size/geckosio/geckos.io/bundles/latest/geckos.io-client.latest.min.js.svg?label=minified%20bundle&style=flat-square)](https://github.com/geckosio/geckos.io/tree/master/bundles/versions)
![Snyk Vulnerabilities for GitHub Repo (Specific Manifest)](https://img.shields.io/snyk/vulnerabilities/github/geckosio/geckos.io/packages/client/package.json.svg?style=flat-square)

Real-time client/server communication over UDP using **WebRTC** and **Node.js**.

This framework fits perfectly with your next **HTML5 real-time multiplayer games** or chat app.

Read the [documentation](https://github.com/geckosio/geckos.io) for more information.

## Install

```console
npm install @geckos.io/client
```

## Use

```js
import geckos from '@geckos.io/client'

// or add a minified version to your index.html file
// https://github.com/geckosio/geckos.io/tree/master/bundles/versions

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
