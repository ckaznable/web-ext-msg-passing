import { MessageHandleParameter, MessageHandleReplyData, MessageHandleTemplate } from "./types"
import { DEFAULT_CATE_NAME } from "./static"

export class Sender<
  T extends MessageHandleTemplate,
  Q extends keyof T,
  N extends string
> {

  namespace: N

  constructor(namespace: N = DEFAULT_CATE_NAME as N) {
    this.namespace = namespace
  }

  /**
   * 傳送一次性訊息
   */
  send<P extends MessageHandleParameter<T, Q>>(type: Q, msg?: P) {
    const handler = new Messenger<T, Q, N>(this.namespace)
    handler.send(type, msg as P)
  }

  /**
    * 傳送需要溝通的訊息
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
   * 傳送訊息到後台
   */
  send<P extends MessageHandleParameter<T, Q>>(type: Q, msg: P) {
    this.port.postMessage({type, msg})
  }

  /**
   * 監聽用的callback
   */
  onMessage<R extends MessageHandleReplyData<T, Q>>(type: Q, callback: (data: R)=>void) {
    this.callback[type] = callback
  }

  /**
   * 開始監聽 不呼叫這個方法 就算設定onMessage也沒用
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
   * 中斷連線
   */
  dc() {
    this.port.disconnect()
  }
}