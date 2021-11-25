import type { IncomingMessage, Server, ServerResponse } from 'http'
import { additionalCandidates, close, connection, remoteDescription } from './routes.js'
import ConnectionsManagerServer from '../wrtc/connectionsManager.js'
import { CorsOptions } from '@geckos.io/common/lib/types.js'
import SetCORS from './setCors.js'
import { sendStatus } from './helpers.js'

const PREFIX = '.wrtc/v2'

const HttpServer = (server: Server, connectionsManager: ConnectionsManagerServer, cors: CorsOptions) => {
  const root = `/${PREFIX}`
  const rootRegEx = new RegExp(`/${PREFIX}`)

  const evs = server.listeners('request').slice(0)
  server.removeAllListeners('request')

  server.on('request', async (req: IncomingMessage, res: ServerResponse) => {
    const pathname = req.url ? new URL(req.url, `http://${req.headers.host}`).pathname : undefined
    const method = req.method

    // check if the request should be handle by geckos or not
    const forGeckos = pathname && rootRegEx.test(pathname)

    if (!forGeckos) {
      for (var i = 0; i < evs.length; i++) {
        evs[i].call(server, req, res)
      }
    }

    if (forGeckos) {
      const reg_rd = new RegExp(`${PREFIX}/connections/[0-9a-zA-Z]+/remote-description`).test(pathname)
      const reg_ac = new RegExp(`${PREFIX}/connections/[0-9a-zA-Z]+/additional-candidates`).test(pathname)
      const reg_c = new RegExp(`${PREFIX}/connections/[0-9a-zA-Z]+/close`).test(pathname)

      const _connections = method === 'POST' && pathname === `${root}/connections`
      const _remote_description = method === 'POST' && reg_rd
      const _additional_candidates = method === 'GET' && reg_ac
      const _close = method === 'POST' && reg_c

      SetCORS(req, res, cors)

      if (method === 'OPTIONS') return await sendStatus(res, 200)

      if (_connections) await connection(connectionsManager, req, res)
      else if (_remote_description) await remoteDescription(connectionsManager, req, res)
      else if (_additional_candidates) await additionalCandidates(connectionsManager, req, res)
      else if (_close) await close(connectionsManager, req, res)
      else await sendStatus(res, 404)
    }
  })
}

export default HttpServer
