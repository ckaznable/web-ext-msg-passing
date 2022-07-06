import { DEFAULT_NAMESPACE } from "./static"
import { getCurrentTabId } from "./util"
import type { MessageHandleParameter, MessageHandleReplyData, MessageHandleTemplate, PassingData, UnionMessageHandleTemplate } from "./types"

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

  send<N extends keyof T, E extends T[N], Q extends keyof E, P extends MessageHandleParameter<E, Q>>(namespace: N, type: Q, msg?: P) {
    return (this.getSender(namespace)).send(type as string, msg)
  }

  sendWithResponse<N extends keyof T, E extends T[N], Q extends keyof E, P extends MessageHandleParameter<E, Q>, R extends MessageHandleReplyData<E, Q>>(namespace: N, type: Q, msg?: P): Promise<R> {
    return (this.getSender(namespace)).sendWithResponse(type as string, msg)
  }

  sendToContent<N extends keyof T, E extends T[N], Q extends keyof E, P extends MessageHandleParameter<E, Q>, R extends MessageHandleReplyData<E, Q>>(namespace: N, type: Q, msg?: P): Promise<R> {
    return (this.getSender(namespace)).sendToContent(type as string, msg)
  }
}

export class Sender<
  T extends MessageHandleTemplate,
  Q extends keyof T = keyof T,
  N extends string = string
> {

  namespace: N

  constructor(namespace: N = DEFAULT_NAMESPACE as N) {
    this.namespace = namespace
  }

  /**
   * send once message to bg
   */
  send<P extends MessageHandleParameter<T, Q>, R extends MessageHandleReplyData<T, Q>>(type: Q, msg?: P): Promise<R> {
    return new Promise(resolve => {
      chrome.runtime.sendMessage({type, msg, name: this.namespace} as PassingData, ({msg}: PassingData<R>) => {
        resolve(msg)
      })
    })
  }

  /**
   * send message and receive response
   * @deprecated since version 0.1.0 please use send method
   */
  sendWithResponse<P extends MessageHandleParameter<T, Q>, R extends MessageHandleReplyData<T, Q>>(type: Q, msg?: P): Promise<R> {
    return this.send(type, msg)
  }

  async sendToContent<P extends MessageHandleParameter<T, Q>, R extends MessageHandleReplyData<T, Q>>(type: Q, msg?: P): Promise<R|undefined> {
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
  send<P extends MessageHandleParameter<T, Q>>(type: Q, msg: P) {
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
  Q extends keyof T,
  P extends MessageHandleParameter<T, Q>
> (type: Q, msg?: P) {
  const sender = new Sender<T, Q, typeof DEFAULT_NAMESPACE>()
  return sender.send(type, msg)
}

/**
 * quick use sender helper with response
 * @deprecated since version 0.1.0 please use send method
 */
export function sendWithResponse<
  T extends MessageHandleTemplate,
  Q extends keyof T,
  P extends MessageHandleParameter<T, Q>,
  R extends MessageHandleReplyData<T, Q>
> (type: Q, msg?: P): Promise<R> {
  const sender = new Sender<T, Q, typeof DEFAULT_NAMESPACE>()
  return sender.sendWithResponse(type, msg)
}

/**
 * quick use sender helper with response
 */
export function sendToContent<
  T extends MessageHandleTemplate,
  Q extends keyof T,
  P extends MessageHandleParameter<T, Q>,
  R extends MessageHandleReplyData<T, Q>
> (type: Q, msg?: P): Promise<R|undefined> {
  const sender = new Sender<T, Q, typeof DEFAULT_NAMESPACE>()
  return sender.sendToContent(type, msg)
}