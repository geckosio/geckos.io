/* eslint-disable sort-imports */
import ndc from 'node-datachannel'
import type { DataChannel, DataChannelInitConfig, PeerConnection, RtcConfig } from 'node-datachannel'
export type { DataChannel, DataChannelInitConfig, PeerConnection, RtcConfig }

export const wait = (ms: number = 1000): Promise<void> => {
  return new Promise(resolve => {
    setTimeout(() => {
      return resolve()
    }, ms)
  })
}

export const createPeerConnection = (peerName: string, config: ndc.RtcConfig) => {
  return new ndc.PeerConnection(peerName, config)
}

export const closePeerConnection = (peerConnection: PeerConnection): Promise<void> => {
  return new Promise(resolve => {
    if (peerConnection) {
      peerConnection.close()
      resolve()
    } else {
      resolve()
    }
  })
}

export const closeDataChannel = (dataChannel: DataChannel): Promise<void> => {
  return new Promise(resolve => {
    if (dataChannel?.isOpen()) {
      dataChannel.close()
      resolve()
    } else {
      resolve()
    }
  })
}

export const cleanup = (): Promise<void> => {
  return new Promise(resolve => {
    try {
      ndc.cleanup()
      resolve()
    } catch (err) {
      resolve()
    }
  })
}
