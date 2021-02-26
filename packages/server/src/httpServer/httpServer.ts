import ConnectionsManagerServer from '../wrtc/connectionsManager'
import ParseBody from './parseBody'
import SetCORS from './setCors'
import http from 'http'
import url from 'url'
import { CorsOptions } from '@geckos.io/common/lib/types'

const end = (res: http.ServerResponse, statusCode: number) => {
  res.writeHead(statusCode)
  res.end()
}

const HttpServer = (server: http.Server, connectionsManager: ConnectionsManagerServer, cors: CorsOptions) => {
  const prefix = '.wrtc'
  const version = 'v1'
  const root = `/${prefix}/${version}`
  const rootRegEx = new RegExp(`/${prefix}/${version}`)

  const evs = server.listeners('request').slice(0)
  server.removeAllListeners('request')

  server.on('request', async (req: http.IncomingMessage, res: http.ServerResponse) => {
    const pathname = req.url ? url.parse(req.url, true).pathname : undefined
    const headers = req.headers
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
      const path3 = new RegExp(`${prefix}\/${version}\/connections\/[0-9a-zA-Z]+\/additional-candidates`).test(pathname)
      const closePath = new RegExp(`${prefix}\/${version}\/connections\/[0-9a-zA-Z]+\/close`).test(pathname)

      SetCORS(req, res, cors)

      if (req.method === 'OPTIONS') {
        end(res, 200)
        return
      }

      let body = ''

      try {
        body = (await ParseBody(req)) as string
      } catch (error) {
        end(res, 400)
        return
      }

      res.on('error', _error => {
        end(res, 500)
        return
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
              if (status >= 100 && status < 600) end(res, status)
              else end(res, 500)
              return
            }

            if (!connection || !connection.id) {
              end(res, 500)
              return
            }

            const { id, localDescription } = connection

            res.write(
              JSON.stringify({
                userData, // the userData for authentication
                id,
                localDescription
              })
            )

            res.end()
            return
          } catch (error) {
            end(res, 500)
            return
          }
        } else if (method === 'POST' && path2) {
          const ids = pathname.match(/[0-9a-zA-Z]{24}/g)
          if (ids && ids.length === 1) {
            const id = ids[0]
            const connection = connectionsManager.getConnection(id)

            if (!connection) {
              end(res, 404)
              return
            }

            try {
              const { sdp, type } = JSON.parse(body)
              connection.peerConnection.setRemoteDescription(sdp, type)
              res.end()
              return
            } catch (error) {
              end(res, 400)
              return
            }
          } else {
            end(res, 400)
            return
          }
        } else if (method === 'GET' && path3) {
          const ids = pathname.match(/[0-9a-zA-Z]{24}/g)
          if (ids && ids.length === 1) {
            const id = ids[0]
            const connection = connectionsManager.getConnection(id)

            if (!connection) {
              end(res, 404)
              return
            }

            try {
              const additionalCandidates = [...connection.additionalCandidates]
              connection.additionalCandidates = []
              res.write(JSON.stringify(additionalCandidates))
              res.end()
              return
            } catch (error) {
              end(res, 400)
              return
            }
          } else {
            end(res, 400)
            return
          }
        } else if (method === 'POST' && closePath) {
          const ids = pathname.match(/[0-9a-zA-Z]{24}/g)
          if (ids && ids.length === 1) {
            const id = ids[0]
            const connection = connectionsManager.getConnection(id)
            connection?.close()
          } else {
            end(res, 400)
            return
          }
        } else {
          end(res, 404)
          return
        }
      }
    }
  })
}

export default HttpServer
