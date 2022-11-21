import { DEFAULT_NAMESPACE, ERROR_TYPE_RESPONSE } from "./static.js"
import { getCurrentTabId } from "./util.js"
import type { MessageHandleParameter, MessageHandleReplyData, MessageHandleTemplate, OptionalIfUndefined, PassingData, UnionMessageHandleTemplate } from "./types.js"

export class UnionSender<T extends UnionMessageHandleTemplate, S = {[K in keyof T]: Sender<T[K]>}> {
  sender: S

  constructor(namespaceList: (keyof T)[]) {
    this.sender = namespaceList.reduce((acc, namespace: string) => {
      acc[namespace as keyof S] = new Sender<T[keyof T]>(namespace) as unknown as S[keyof S]
      return acc
    }, {} as S)
  }

  getSender<E extends MessageHandleTemplate>(namespace: keyof T): Sender<E> {
    return this.sender[namespace as unknown as keyof S] as unknown as Sender<E>
  }

  async send<N extends keyof T, E extends T[N], Q extends keyof E, P extends MessageHandleParameter<E, Q>, R extends MessageHandleReplyData<E, Q>>(namespace: N, type: Q, ...[msg]: OptionalIfUndefined<P>): Promise<R> {
    const response = await (this.getSender(namespace)).send(type as string, msg)

    if(this.isErrorResponse(response)) {
      throw new Error(response.error)
    }

    return response
  }

  async sendToContent<N extends keyof T, E extends T[N], Q extends keyof E, P extends MessageHandleParameter<E, Q>, R extends MessageHandleReplyData<E, Q>>(namespace: N, type: Q, ...[msg]: OptionalIfUndefined<P>): Promise<R> {
    const response = await (this.getSender(namespace)).sendToContent(type as string, msg)

    if(this.isErrorResponse(response)) {
      throw new Error(response.error)
    }

    return response
  }

  isErrorResponse(response: any) {
    return typeof response === "object"
      && "type" in response
      && "error" in response
      && response.type === ERROR_TYPE_RESPONSE
  }
}

export class Sender<
  T extends MessageHandleTemplate,
  N extends string = string
> {

  namespace: N

  constructor(namespace: N = DEFAULT_NAMESPACE as N) {
    this.namespace = namespace
  }

  /**
   * send once message to bg
   */
  send<Q extends keyof T, P extends MessageHandleParameter<T, Q>, R extends MessageHandleReplyData<T, Q>>(type: Q, ...[msg]: OptionalIfUndefined<P>): Promise<R> {
    return new Promise(resolve => {
      chrome.runtime.sendMessage({type, msg, name: this.namespace} as PassingData, ({msg}: PassingData<R>) => {
        resolve(msg)
      })
    })
  }

  async sendToContent<Q extends keyof T, P extends MessageHandleParameter<T, Q>, R extends MessageHandleReplyData<T, Q>>(type: Q, ...[msg]: OptionalIfUndefined<P>): Promise<R|undefined> {
    const tabId = await getCurrentTabId()
    if(!tabId) {
      return
    }

    return new Promise(resolve => {
      chrome.tabs.sendMessage(tabId, {type, msg, name: this.namespace} as PassingData, ({msg}: PassingData<R>) => {
        resolve(msg)
      })
    })
  }
}

export class Messenger<
  T extends MessageHandleTemplate,
  Q extends keyof T = keyof T,
  N extends string = string
> {
  src: N
  port: chrome.runtime.Port
  callback: Record<Q, (data: any)=>void>

  constructor(src: N) {
    this.src = src
    this.port = chrome.runtime.connect({name: src})
    this.callback = {} as Record<Q, (data: any)=>void>
    this.listen()
  }

  /**
   * send message to bg
   */
  send<P extends MessageHandleParameter<T, Q>>(type: Q, ...[msg]: OptionalIfUndefined<P>) {
    this.port.postMessage({type, msg} as PassingData)
  }

  /**
   * when received message callback
   */
  onMessage<R extends MessageHandleReplyData<T, Q>>(type: Q, callback: (data: R)=>void) {
    this.callback[type] = callback
  }

  /**
   * mount listener
   */
  listen() {
    this.port.onMessage.addListener(({type, msg}) => {
      const method = type as Q
      if(this.callback[method]) {
        this.callback[method](msg)
      }
    })
  }

  /**
   * disconnect port session
   */
  dc() {
    this.port.disconnect()
  }
}

/**
 * quick use sender helper
*/
export function send<
  T extends MessageHandleTemplate,
  Q extends keyof T = keyof T,
  P extends MessageHandleParameter<T, Q> = MessageHandleParameter<T, Q>
> (type: Q, ...[msg]: OptionalIfUndefined<P>) {
  const sender = new Sender<T, typeof DEFAULT_NAMESPACE>()
  return sender.send(type, msg as any)
}

/**
 * quick use sender helper with response
 */
export function sendToContent<
  T extends MessageHandleTemplate,
  Q extends keyof T = keyof T,
  P extends MessageHandleParameter<T, Q> = MessageHandleParameter<T, Q>,
  R extends MessageHandleReplyData<T, Q> = MessageHandleReplyData<T, Q>
> (type: Q, ...[msg]: OptionalIfUndefined<P>): Promise<R|undefined> {
  const sender = new Sender<T, typeof DEFAULT_NAMESPACE>()
  return sender.sendToContent(type, msg as any)
}