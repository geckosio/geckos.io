import type { IncomingMessage, ServerResponse } from 'http'
import { getJSONBody, sendJSON, sendStatus } from './helpers.js'
import type ConnectionsManagerServer from '../wrtc/connectionsManager.js'

export const connection = async (
  connectionsManager: ConnectionsManagerServer,
  req: IncomingMessage,
  res: ServerResponse
) => {
  try {
    const headers = req.headers

    // create connection (and check auth header)
    const { status, connection, userData } = await connectionsManager.createConnection(headers?.authorization, req, res)

    // on http status code
    if (status !== 200) {
      if (status >= 100 && status < 600) return sendStatus(res, status)
      else return sendStatus(res, 500)
    }

    if (!connection || !connection.id) return sendStatus(res, 500)

    const { id, localDescription } = connection

    if (!id || !localDescription) return sendStatus(res, 500)

    return sendJSON(res, {
      userData, // the userData for authentication
      id,
      localDescription
    })
  } catch (err) {
    return sendStatus(res, 500)
  }
}

export const remoteDescription = async (
  connectionsManager: ConnectionsManagerServer,
  req: IncomingMessage,
  res: ServerResponse
) => {
  try {
    const pathname = req.url ? new URL(req.url, `http://${req.headers.host}`).pathname : undefined
    const ids = pathname?.match(/[0-9a-zA-Z]{24}/g)
    const body: { sdp: any; type: any } = (await getJSONBody(req)) as any

    if (ids && ids.length === 1) {
      const id = ids[0]

      const connection = connectionsManager.getConnection(id)
      if (!connection) return sendStatus(res, 404)

      const { sdp, type } = body
      if (!sdp || !type) sendStatus(res, 400)

      connection.peerConnection.setRemoteDescription(sdp, type)

      return sendStatus(res, 200)
    } else {
      return sendStatus(res, 400)
    }
  } catch (err) {
    return sendStatus(res, 500)
  }
}

export const additionalCandidates = async (
  connectionsManager: ConnectionsManagerServer,
  req: IncomingMessage,
  res: ServerResponse
) => {
  try {
    const pathname = req.url ? new URL(req.url, `http://${req.headers.host}`).pathname : undefined
    const ids = pathname?.match(/[0-9a-zA-Z]{24}/g)

    if (ids && ids.length === 1) {
      const id = ids[0]

      const connection = connectionsManager.getConnection(id)
      if (!connection) return sendStatus(res, 404)

      const additionalCandidates = [...connection.additionalCandidates]
      connection.additionalCandidates = []
      return sendJSON(res, additionalCandidates)
    } else {
      return sendStatus(res, 400)
    }
  } catch (err) {
    return sendStatus(res, 500)
  }
}

export const close = async (
  connectionsManager: ConnectionsManagerServer,
  req: IncomingMessage,
  res: ServerResponse
) => {
  try {
    const pathname = req.url ? new URL(req.url, `http://${req.headers.host}`).pathname : undefined
    const ids = pathname?.match(/[0-9a-zA-Z]{24}/g)

    if (ids && ids.length === 1) {
      const id = ids[0]
      const connection = connectionsManager.getConnection(id)
      await connection?.close()
      return sendStatus(res, 200)
    } else {
      return sendStatus(res, 400)
    }
  } catch (err) {
    return sendStatus(res, 500)
  }
}
