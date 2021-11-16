import ConnectionsManagerServer from '../wrtc/connectionsManager.js'
import { CorsOptions } from '@geckos.io/common/lib/types.js'
import ParseBody from './parseBody.js'
import SetCORS from './setCors.js'
import http from 'http'
import url from 'url'

const end = (res: http.ServerResponse, statusCode: number) => {
  res.writeHead(statusCode)
  res.end()
}

const HttpServer = (server: http.Server, connectionsManager: ConnectionsManagerServer, cors: CorsOptions) => {
  const prefix = '.wrtc'
  const version = 'v2'
  const root = `/${prefix}/${version}`
  const rootRegEx = new RegExp(`/${prefix}/${version}`)

  const evs = server.listeners('request').slice(0)
  server.removeAllListeners('request')

  server.on('request', async (req: http.IncomingMessage, res: http.ServerResponse) => {
    const pathname = req.url ? url.parse(req.url, true).pathname : undefined
    const headers = req.headers
    const method = req.method

    const forGeckos = pathname && rootRegEx.test(pathname)

    // if the request is not part of the rootRegEx,
    // trigger the other server's (Express) events.
    if (!forGeckos) {
      for (var i = 0; i < evs.length; i++) {
        evs[i].call(server, req, res)
      }
    }

    if (forGeckos) {
      const path1 = pathname === `${root}/connections`
      const path2 = new RegExp(`${prefix}/${version}/connections/[0-9a-zA-Z]+/remote-description`).test(pathname)
      const path3 = new RegExp(`${prefix}/${version}/connections/[0-9a-zA-Z]+/additional-candidates`).test(pathname)
      const closePath = new RegExp(`${prefix}/${version}/connections/[0-9a-zA-Z]+/close`).test(pathname)

      SetCORS(req, res, cors)

      if (req.method === 'OPTIONS') return end(res, 200)

      let body = ''

      try {
        body = (await ParseBody(req)) as string
      } catch (error) {
        return end(res, 400)
      }

      res.on('error', _error => {
        return end(res, 500)
      })

      res.setHeader('Content-Type', 'application/json')

      if (pathname && method) {
        if (method === 'POST' && path1) {
          try {
            // create connection (and check auth header)
            const { status, connection, userData } = await connectionsManager.createConnection(
              headers?.authorization,
              req,
              res
            )

            // on http status code
            if (status !== 200) {
              if (status >= 100 && status < 600) return end(res, status)
              else return end(res, 500)
            }

            if (!connection || !connection.id) return end(res, 500)

            const { id, localDescription } = connection

            if (!id || !localDescription) return end(res, 500)

            res.write(
              JSON.stringify({
                userData, // the userData for authentication
                id,
                localDescription
              })
            )
            return res.end()
          } catch (error) {
            return end(res, 500)
          }
        } else if (method === 'POST' && path2) {
          const ids = pathname.match(/[0-9a-zA-Z]{24}/g)
          if (ids && ids.length === 1) {
            const id = ids[0]
            const connection = connectionsManager.getConnection(id)

            if (!connection) return end(res, 404)

            try {
              const { sdp, type } = JSON.parse(body)
              connection.peerConnection.setRemoteDescription(sdp, type)

              return end(res, 200)
            } catch (error) {
              return end(res, 400)
            }
          } else {
            return end(res, 400)
          }
        } else if (method === 'GET' && path3) {
          const ids = pathname.match(/[0-9a-zA-Z]{24}/g)
          if (ids && ids.length === 1) {
            const id = ids[0]
            const connection = connectionsManager.getConnection(id)

            if (!connection) {
              return end(res, 404)
            }

            try {
              const additionalCandidates = [...connection.additionalCandidates]
              connection.additionalCandidates = []
              res.write(JSON.stringify(additionalCandidates))
              return res.end()
            } catch (error) {
              return end(res, 400)
            }
          } else {
            return end(res, 400)
          }
        } else if (method === 'POST' && closePath) {
          const ids = pathname.match(/[0-9a-zA-Z]{24}/g)
          if (ids && ids.length === 1) {
            const id = ids[0]
            const connection = connectionsManager.getConnection(id)
            connection?.close()
            return end(res, 200)
          } else {
            return end(res, 400)
          }
        } else {
          return end(res, 404)
        }
      }
    }
  })
}

export default HttpServer
