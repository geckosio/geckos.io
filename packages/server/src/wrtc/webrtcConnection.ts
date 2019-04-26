import DefaultConnection from './defaultConnection'
import CreateDataChannel from './channel'
import Channel from './channel'
import { ChannelId, ServerOptions } from '@geckos.io/common/lib/typings'

const DefaultRTCPeerConnection: RTCPeerConnection = require('wrtc').RTCPeerConnection
const TIME_TO_HOST_CANDIDATES = 5000

export default class WebRTCConnection extends DefaultConnection {
  peerConnection: RTCPeerConnection
  channel: Channel
  private options: any

  constructor(id: ChannelId, serverOptions: ServerOptions) {
    super(id)

    const { iceServers = [], ...dataChannelOptions } = serverOptions

    this.options = {
      clearTimeout,
      setTimeout,
      timeToHostCandidates: TIME_TO_HOST_CANDIDATES
    }

    let configuration: RTCConfiguration = {
      iceServers: iceServers,
      iceCandidatePoolSize: iceServers.length
    }

    // @ts-ignore
    this.peerConnection = new DefaultRTCPeerConnection(configuration)

    this.peerConnection.onconnectionstatechange = () => {
      if (this.peerConnection.connectionState === 'disconnected') this.close()
    }

    this.channel = new CreateDataChannel(this, dataChannelOptions)
  }

  async doOffer() {
    try {
      const offer: RTCSessionDescriptionInit = await this.peerConnection.createOffer()
      await this.peerConnection.setLocalDescription(offer)
      await this.waitUntilIceGatheringStateComplete(this.peerConnection, this.options)
    } catch (error) {
      console.error(error.messages)
      this.close()
      throw error
    }
  }

  get iceConnectionState() {
    return this.peerConnection.iceConnectionState
  }

  get localDescription() {
    return this.descriptionToJSON(this.peerConnection.localDescription) //, true)
  }

  get remoteDescription() {
    return this.descriptionToJSON(this.peerConnection.remoteDescription)
  }

  get signalingState() {
    return this.peerConnection.signalingState
  }

  async applyAnswer(answer: RTCSessionDescription) {
    await this.peerConnection.setRemoteDescription(answer)
  }

  toJSON = () => {
    return {
      ...super.toJSON(),
      iceConnectionState: this.iceConnectionState,
      localDescription: this.localDescription,
      remoteDescription: this.remoteDescription,
      signalingState: this.signalingState
    }
  }

  descriptionToJSON(description: RTCSessionDescription | null, shouldDisableTrickleIce = false) {
    return !description
      ? {}
      : {
          type: description.type,
          sdp: shouldDisableTrickleIce ? this.disableTrickleIce(description.sdp) : description.sdp
        }
  }

  disableTrickleIce(sdp: string) {
    return sdp.replace(/\r\na=ice-options:trickle/g, '')
  }

  close() {
    this.peerConnection.close()
    super.close()
    this.removeAllListeners()
  }

  async waitUntilIceGatheringStateComplete(peerConnection: RTCPeerConnection, options: any) {
    if (peerConnection.iceGatheringState === 'complete') {
      return
    }

    const { timeToHostCandidates } = options
    const deferred: any = {}

    deferred.promise = new Promise((resolve, reject) => {
      deferred.resolve = resolve
      deferred.reject = reject
    })

    const timeout = options.setTimeout(() => {
      peerConnection.removeEventListener('icecandidate', onIceCandidate)
      deferred.reject(new Error('Timed out waiting for host candidates State: ' + peerConnection.iceGatheringState))
    }, timeToHostCandidates)

    const onIceCandidate = (ev: RTCPeerConnectionIceEvent) => {
      const { candidate } = ev

      if (!candidate) {
        options.clearTimeout(timeout)
        peerConnection.removeEventListener('icecandidate', onIceCandidate)
        deferred.resolve()
      }
    }

    peerConnection.addEventListener('icecandidate', onIceCandidate)

    await deferred.promise
  }
}
