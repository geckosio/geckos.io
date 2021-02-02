import WebRTCConnection from './webrtcConnection'
import { ChannelId, ServerOptions } from '@geckos.io/common/lib/types'
import { EVENTS } from '@geckos.io/common/lib/constants'
import makeRandomId from '@geckos.io/common/lib/makeRandomId'
import { IncomingMessage } from 'http'

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

    // create the webrtc connection
    const connection = new WebRTCConnection(this.createId(), this.options, this.connections, userData)
    const pc = connection.peerConnection

    pc.onStateChange(state => {
      console.log('Peer1 State:', state)

      // keep track of the maxMessageSize
      // if (state === 'connected') connection.channel.maxMessageSize = pc.sctp?.maxMessageSize

      if (state === 'disconnected' || state === 'failed' || state === 'closed') {
        connection.channel.eventEmitter.emit(EVENTS.DISCONNECT, state)
        this.deleteConnection(connection)
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

    pc.onGatheringStateChange(state => {
      console.log('Peer1 GatheringState:', state)
    })
    pc.onLocalDescription((sdp, type) => {
      console.log('Peer1 SDP:', sdp, ' Type:', type)
      // peer2.setRemoteDescription(sdp, type);
    })
    pc.onLocalCandidate((candidate, mid) => {
      console.log('Peer1 Candidate:', candidate)
      // peer2.addRemoteCandidate(candidate, mid);
    })

    // create the offer
    // await connection.doOffer()

    // const { id, iceConnectionState, peerConnection, remoteDescription, localDescription, signalingState } = connection
    const { id, peerConnection } = connection

    return {
      connection: {
        id,
        peerConnection,
        iceConnectionState: '',
        remoteDescription: '',
        localDescription: '',
        signalingState: ''
      },
      userData,
      status: 200
    }
  }

  deleteConnection(connection: WebRTCConnection) {
    connection.close()
    connection.channel.eventEmitter.removeAllListeners()
    connection.removeAllListeners()

    this.connections.delete(connection.id)
  }
}
