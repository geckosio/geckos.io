import { ChannelId, Data, RawMessage } from '@geckos.io/common/lib/types.js'
import client, { ClientChannel } from './geckos/channel.js'

export default client
export { client as geckos }
export type { ClientChannel, Data, RawMessage, ChannelId }
