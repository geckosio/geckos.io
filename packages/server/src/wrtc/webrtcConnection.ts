import Connection from './connection'
import CreateDataChannel from '../geckos/channel'
import Channel from '../geckos/channel'
import { ChannelId, ServerOptions } from '../../../common/lib/types'

const DefaultRTCPeerConnection: RTCPeerConnection = require('wrtc').RTCPeerConnection

// strangely something it takes a long time
// so I set it to 10 seconds
const TIME_TO_HOST_CANDIDATES = 10000

export default class WebRTCConnection extends Connection {
  public peerConnection: RTCPeerConnection
  public channel: Channel
  public additionalCandidates: RTCIceCandidate[] = []
  private options: any

  constructor(id: ChannelId, serverOptions: ServerOptions, public connections: Map<any, any>, public userData: any) {
    super(id)

    const { iceServers = [], iceTransportPolicy = 'all', ...dataChannelOptions } = serverOptions

    this.options = {
      timeToHostCandidates: TIME_TO_HOST_CANDIDATES
    }

    let configuration: RTCConfiguration = {
      // @ts-ignore
      sdpSemantics: 'unified-plan',
      iceServers: iceServers,
      iceTransportPolicy: iceTransportPolicy
    }

    // @ts-ignore
    this.peerConnection = new DefaultRTCPeerConnection(configuration)

    this.peerConnection.onconnectionstatechange = () => {
      if (this.peerConnection.connectionState === 'disconnected') this.close()
    }

    this.channel = new CreateDataChannel(this, dataChannelOptions, userData)
  }

  async doOffer() {
    try {
      const offer: RTCSessionDescriptionInit = await this.peerConnection.createOffer()
      await this.peerConnection.setLocalDescription(offer)
      // we do not wait, since we request the missing candidates later
      /*await*/ this.waitUntilIceGatheringStateComplete(this.peerConnection, this.options)
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
  }

  async waitUntilIceGatheringStateComplete(peerConnection: RTCPeerConnection, options: any) {
    if (peerConnection.iceGatheringState === 'complete') {
      return
    }

    let totalIceCandidates = 0

    const { timeToHostCandidates } = options

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        peerConnection.removeEventListener('icecandidate', onIceCandidate)

        // if time is up but we found some iceCandidates
        if (totalIceCandidates > 0) {
          // console.log('Timed out waiting for all host candidates, will continue with what we have so far.')
          resolve()
        } else {
          reject(new Error('Timed out waiting for host candidates State: ' + peerConnection.iceGatheringState))
        }
      }, timeToHostCandidates)

      // peerConnection.addEventListener('icegatheringstatechange', _ev => {
      //   console.log('seconds', new Date().getSeconds(), peerConnection.iceGatheringState)
      // })

      const onIceCandidate = (ev: RTCPeerConnectionIceEvent) => {
        const { candidate } = ev

        totalIceCandidates++

        if (candidate) this.additionalCandidates.push(candidate)

        if (!candidate) {
          clearTimeout(timeout)
          peerConnection.removeEventListener('icecandidate', onIceCandidate)
          resolve()
        }
      }

      peerConnection.addEventListener('icecandidate', onIceCandidate)
    })
  }
}
