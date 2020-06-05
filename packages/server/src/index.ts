import server, { GeckosServer, ServerChannel } from './server'
import iceServers from './iceServers'
import { Data, RawMessage, ChannelId } from '@geckos.io/common/lib/typings'

export default server
export { iceServers }
export type { GeckosServer, ServerChannel, Data, RawMessage, ChannelId }
