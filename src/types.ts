export type ReceiverReply<T = any> = (msg: T) => void
export type ReceiverHandle<T = any, Q = any> = (data: T, reply: ReceiverReply<Q>) => void
export type MessageHandle<T = any, Q = any> = (msg: T, reply: (response: Q) => void, tab: Required<chrome.tabs.Tab>, sender: chrome.runtime.MessageSender, port: chrome.runtime.Port) => void

export type MessageHandleTemplate = Record<string, MessageHandle>

export type MessageHandleParameter<
  T extends MessageHandleTemplate,
  Q extends keyof T = keyof T
> = T[Q] extends MessageHandle<infer U, infer _> ? U : never

export type MessageHandleReplyData<
  T extends MessageHandleTemplate,
  Q extends keyof T = keyof T
> = T[Q] extends MessageHandle<infer _, infer U> ? U : never