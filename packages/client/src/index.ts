import { ChannelId, Data, RawMessage } from '@geckos.io/common/lib/types'
import client, { ClientChannel } from './geckos/channel'

export default client
export { client as geckos }
export type { ClientChannel, Data, RawMessage, ChannelId }
