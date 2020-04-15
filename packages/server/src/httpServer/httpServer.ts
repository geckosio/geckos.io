import url from 'url'
import http from 'http'
import ConnectionsManagerServer from '../wrtc/connectionsManager'
import SetCORS from './setCors'
import ParseBody from './parseBody'
import { CorsOptions } from '@geckos.io/common/lib/typings'

const HttpServer = (server: http.Server, connectionsManager: ConnectionsManagerServer, cors: CorsOptions) => {
  const prefix = '.wrtc'
  const version = 'v1'
  const root = `/${prefix}/${version}`
  const rootRegEx = new RegExp(`/${prefix}/${version}`)

  const evs = server.listeners('request').slice(0)
  server.removeAllListeners('request')

  server.on('request', async (req: http.IncomingMessage, res: http.ServerResponse) => {
    const pathname = req.url ? url.parse(req.url, true).pathname : undefined
    const method = req.method

    // if the request is not part of the rootRegEx,
    // trigger the other server's (Express) events.
    if (!pathname || !rootRegEx.test(pathname)) {
      for (var i = 0; i < evs.length; i++) {
        evs[i].call(server, req, res)
      }
    }

    if (pathname && rootRegEx.test(pathname)) {
      const path1 = pathname === `${root}/connections`
      const path2 = new RegExp(`${prefix}\/${version}\/connections\/[0-9a-zA-Z]+\/remote-description`).test(pathname)
      const closePath = new RegExp(`${prefix}\/${version}\/connections\/[0-9a-zA-Z]+\/close`).test(pathname)

      SetCORS(req, res, cors)

      if (req.method === 'OPTIONS') {
        res.writeHead(200)
        res.end()
        return
      }

      let body = ''

      try {
        body = (await ParseBody(req)) as string
      } catch (error) {
        res.writeHead(400)
        res.end()
        return
      }

      res.on('error', error => {
        console.error(error.message)
        res.writeHead(500)
        res.end()
        return
      })

      res.setHeader('Content-Type', 'application/json')

      if (pathname && method) {
        if (method === 'POST' && path1) {
          try {
            // create connection
            const connection = await connectionsManager.createConnection()

            // create the offer
            await connection.doOffer()

            const {
              id,
              iceConnectionState,
              peerConnection,
              remoteDescription,
              localDescription,
              signalingState
            } = connection

            res.write(
              JSON.stringify({
                id,
                iceConnectionState,
                peerConnection,
                remoteDescription,
                localDescription,
                signalingState
              })
            )

            res.end()
            return
          } catch (error) {
            console.error(error.message)
            res.statusCode = 500
            res.end()
            return
          }
        } else if (method === 'POST' && path2) {
          const ids = pathname.match(/[0-9a-zA-Z]{24}/g)
          if (ids && ids.length === 1) {
            const id = ids[0]
            const connection = connectionsManager.getConnection(id)

            if (!connection) {
              res.statusCode = 404
              res.end()
              return
            }

            try {
              await connection.applyAnswer(JSON.parse(body))
              let connectionJSON = connection.toJSON()
              res.write(JSON.stringify(connectionJSON.remoteDescription))
              res.end()
              return
            } catch (error) {
              console.error(error.message)
              res.statusCode = 400
              res.end()
              return
            }
          }
        } else if (method === 'POST' && closePath) {
          const ids = pathname.match(/[0-9a-zA-Z]{24}/g)
          if (ids && ids.length === 1) {
            const id = ids[0]
            const connection = connectionsManager.getConnection(id)
            connection?.close()
          }
          res.end()
          return
        } else {
          res.writeHead(404)
          res.end()
          return
        }
      }
    }
  })
}

export default HttpServer
