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

export const createDataChannel = (
  pc: PeerConnection,
  label: string,
  config?: DataChannelInitConfig | undefined
): Promise<DataChannel> => {
  return new Promise((resolve, reject) => {
    try {
      const dc = pc.createDataChannel(label, config)
      resolve(dc)
    } catch (err: any) {
      console.log('ERROR:', err.message)
      reject(err)
    }
  })
}

export const createPeerConnection = (peerName: string, config: RtcConfig): Promise<PeerConnection> => {
  return new Promise((resolve, reject) => {
    try {
      const peerConnection = new ndc.PeerConnection(peerName, config)
      resolve(peerConnection)
    } catch (err) {
      reject(err)
    }
  })
}

export const closePeerConnection = (peerConnection: PeerConnection): Promise<void> => {
  return new Promise(resolve => {
    if (peerConnection) {
      peerConnection.destroy()
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
