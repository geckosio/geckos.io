import Channel from '../geckos/channel'
import Connection from './connection'
import nodeDataChannel from 'node-datachannel'
import { ChannelId, ServerOptions } from '@geckos.io/common/lib/types'

// strangely something it takes a long time
// so I set it to 10 seconds
const TIME_TO_HOST_CANDIDATES = 10000

export default class WebRTCConnection extends Connection {
  public peerConnection: nodeDataChannel.PeerConnection
  public channel: Channel
  public additionalCandidates: RTCIceCandidate[] = []
  private options: any

  constructor(
    id: ChannelId,
    serverOptions: ServerOptions,
    public connections: Map<ChannelId, WebRTCConnection>,
    public userData: any
  ) {
    super(id)

    const { iceServers = [], iceTransportPolicy = 'all', portRange, ...dataChannelOptions } = serverOptions

    this.options = {
      timeToHostCandidates: TIME_TO_HOST_CANDIDATES
    }

    let configuration: nodeDataChannel.RtcConfig = {
      // sdpSemantics: 'unified-plan',
      // iceTransportPolicy: iceTransportPolicy,
      iceServers: iceServers.map(ice => ice.urls as string)
    }

    // portRange is a nonstandard API
    if (portRange?.min && portRange?.max)
      configuration = { ...configuration, portRangeBegin: portRange.min, portRangeEnd: portRange.max }

    // this.peerConnection = new DefaultRTCPeerConnection(configuration)
    this.peerConnection = new nodeDataChannel.PeerConnection(id as string, configuration)
  }

  descriptionToJSON(description: RTCSessionDescription | null | any, shouldDisableTrickleIce = false) {
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
    if (this.channel.dataChannel?.isOpen()) this.channel.dataChannel.close()
    if (this.peerConnection) this.peerConnection.close()
    super.close()

    // @ts-ignore
    this.channel.dataChannel = null
    // @ts-ignore
    this.peerConnection = null

    nodeDataChannel.cleanup()
  }

  async waitUntilIceGatheringStateComplete(peerConnection: RTCPeerConnection, options: any): Promise<void> {
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
