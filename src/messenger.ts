import { DEFAULT_NAMESPACE } from "./static"
import type { MessageHandleParameter, MessageHandleReplyData, MessageHandleTemplate } from "./types"

export class Sender<
  T extends MessageHandleTemplate,
  Q extends keyof T,
  N extends string
> {

  namespace: N

  constructor(namespace: N = DEFAULT_NAMESPACE as N) {
    this.namespace = namespace
  }

  /**
   * send once message to bg
   */
  send<P extends MessageHandleParameter<T, Q>>(type: Q, msg?: P) {
    const handler = new Messenger<T, Q, N>(this.namespace)
    handler.send(type, msg as P)
  }

  /**
    * send message and receive response
    */
  sendWithResponse<P extends MessageHandleParameter<T, Q>, R extends MessageHandleReplyData<T, Q>>(type: Q, msg?: P): Promise<R> {
    const handler = new Messenger<T, Q, N>(this.namespace)
    return new Promise(resolve => {
      handler.onMessage(type, (data: R) => {
        handler.dc()
        resolve(data)
      })
      handler.send(type, msg as P)
    })
  }
}

export class Messenger<
  T extends MessageHandleTemplate,
  Q extends keyof T,
  N extends string
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
    this.port.postMessage({type, msg})
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
    this.port.onMessage.addListener(({type, data}) => {
      const method = type as Q
      if(this.callback[method]) {
        this.callback[method](data)
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
 */
export function sendWithResponse<
  T extends MessageHandleTemplate,
  Q extends keyof T,
  P extends MessageHandleParameter<T, Q>,
  R extends MessageHandleReplyData<T, Q>
> (type: Q, msg?: P): R {
  const sender = new Sender<T, Q, typeof DEFAULT_NAMESPACE>()
  return sender.sendWithResponse(type, msg) as R
}