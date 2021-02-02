import WebRTCConnection from './webrtcConnection'
import { ChannelId, ServerOptions } from '@geckos.io/common/lib/types'
import { EVENTS } from '@geckos.io/common/lib/constants'
import makeRandomId from '@geckos.io/common/lib/makeRandomId'
import { IncomingMessage } from 'http'
import CreateDataChannel from '../geckos/channel'

export default class ConnectionsManagerServer {
  connections: Map<ChannelId, WebRTCConnection> = new Map()

  constructor(public options: ServerOptions) {}

  private createId(): ChannelId {
    do {
      const id = makeRandomId(24)
      if (!this.connections.has(id)) {
        return id
      }
    } while (true)
  }

  getConnection(id: ChannelId) {
    return this.connections.get(id) || null
  }

  getConnections() {
    return this.connections
  }

  private async getUserData(authorization: string | undefined, req: IncomingMessage) {
    // check authorization and get userData
    let userData = {}
    if (this.options?.authorization) {
      if (typeof this.options.authorization !== 'function') {
        console.log('[warning] Authorization is not a function!?')
        return { _statusCode: 500 }
      }

      const res = await this.options.authorization(authorization, req)
      if (typeof res === 'boolean' && res) userData = {}
      else if (typeof res === 'boolean' && !res) return { _statusCode: 401 }
      else if (typeof res === 'number' && res >= 100 && res < 600) return { _statusCode: res }
      else userData = res
    }

    return userData
  }

  async createConnection(authorization: string | undefined, req: IncomingMessage) {
    // get userData
    let userData: any = await this.getUserData(authorization, req)
    if (userData._statusCode) return userData

    const newId = this.createId()
    // console.log('createConnection', newId)

    // create the webrtc connection
    const connection = new WebRTCConnection(newId, this.options, this.connections, userData)
    const pc = connection.peerConnection

    pc.onStateChange(state => {
      // keep track of the maxMessageSize
      // if (state === 'connected') connection.channel.maxMessageSize = pc.sctp?.maxMessageSize

      if (state === 'disconnected' || state === 'failed' || state === 'closed') {
        this.deleteConnection(connection, state)
      }
    })

    // pc.onconnectionstatechange = () => {
    //   // keep track of the maxMessageSize
    //   if (pc.connectionState === 'connected') connection.channel.maxMessageSize = pc.sctp?.maxMessageSize

    //   if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed' || pc.connectionState === 'closed') {
    //     connection.channel.eventEmitter.emit(EVENTS.DISCONNECT, pc.connectionState)
    //     this.deleteConnection(connection)
    //   }
    // }

    this.connections.set(connection.id, connection)

    let gatheringState
    let localDescription
    let candidates = []

    pc.onGatheringStateChange(state => {
      gatheringState = state
    })

    pc.onLocalDescription((sdp, type) => {
      localDescription = { sdp, type }
    })

    pc.onLocalCandidate((candidate, mid) => {
      // @ts-ignore
      connection.additionalCandidates.push({ candidate, sdpMid: mid })
      candidates.push({ candidate, mid })
    })

    const dc = pc.createDataChannel('geckos.io')

    dc.onClosed(() => {
      // console.log('onClosed')
    })

    connection.channel = new CreateDataChannel(connection, dc, userData)

    // test
    const pause = (ms: number): Promise<void> => {
      return new Promise(resolve => {
        setTimeout(() => {
          resolve()
        }, ms)
      })
    }

    await pause(50)

    // create the offer
    // await connection.doOffer()

    // const { id, iceConnectionState, peerConnection, remoteDescription, localDescription, signalingState } = connection
    const { id, peerConnection } = connection

    return {
      connection: {
        id,
        // peerConnection,
        // iceConnectionState: '',
        // remoteDescription: '',
        localDescription
        // signalingState: ''
      },
      userData,
      status: 200
    }
  }

  deleteConnection(connection: WebRTCConnection, state: string) {
    // console.log('deleteConnection', connection.id)
    connection.close()

    connection.channel.eventEmitter.on(EVENTS.DISCONNECT, () => {
      connection.removeAllListeners()
      connection.channel.eventEmitter.removeAllListeners()
    })

    connection.channel.eventEmitter.emit(EVENTS.DISCONNECT, state)

    if (this.connections.get(connection.id)) this.connections.delete(connection.id)
  }
}
