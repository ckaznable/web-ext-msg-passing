import { DEFAULT_NAMESPACE } from "./static"
import type { MessageHandle, MessageHandleParameter, MessageHandleReplyData, MessageHandleTemplate, MiddlewareData } from "./types"

const handler: Record<string, MessageHandleTemplate> = {}
const middlewareHandle: Record<string, (data: MiddlewareData) => void> = {}

/**
 * listen multiple handle in one call
 */
export function listenGroup<T extends MessageHandleTemplate>(group: Partial<T>) {
  listenNamespaceGroup(DEFAULT_NAMESPACE, group)
}

/**
 * listen multiple handle with namespace in one call
 */
export function listenNamespaceGroup<T extends MessageHandleTemplate>(namespace: string, group: Partial<T>) {
  (<Array<keyof T>>Object.keys(group)).forEach((fnName) => {
    listenNamespace(namespace, fnName as string, group[fnName] as unknown as (data: any) => void)
  })
}

/**
 * listen handle
 */
export function listen<
  T extends MessageHandleTemplate,
  Q extends keyof T = keyof T,
  P extends MessageHandleParameter<T, Q> = MessageHandleParameter<T, Q>,
  R extends MessageHandleReplyData<T, Q> = MessageHandleReplyData<T, Q>
>(type: Q, cb: MessageHandle<P, R>) {
  listenNamespace<T>(DEFAULT_NAMESPACE, type, cb)
}

/**
 * listen handle with namespace
 */
export function listenNamespace<
  T extends MessageHandleTemplate,
  Q extends keyof T = keyof T,
  P extends MessageHandleParameter<T, Q> = MessageHandleParameter<T, Q>,
  R extends MessageHandleReplyData<T, Q> = MessageHandleReplyData<T, Q>
>(namespace: string, type: Q, cb: MessageHandle<P, R>) {
  if(!handler[namespace]) {
    handler[namespace] = {} as MessageHandleTemplate
  }

  handler[namespace][type as keyof MessageHandleTemplate] = cb
}

/**
 * listen middleware
 */
export function listenMiddleware(cb: (data: MiddlewareData) => void) {
  middlewareHandle[DEFAULT_NAMESPACE] = cb
}

/**
 * listen middleware with namespace
 */
export function listenNamespaceMiddleware(namespace: string, cb: (data: MiddlewareData) => void) {
  middlewareHandle[namespace] = cb
}

/**
 * remove handle
 */
export function removeListener(type: string) {
  removeNamespaceListener(DEFAULT_NAMESPACE, type)
}

/**
 * remove handle with namespace
 */
export function removeNamespaceListener(namespace: string, type: string) {
  if(!handler[namespace]) {
    return
  }

  if(handler[namespace][type]) {
    delete handler[namespace][type]
  }
}

/**
 * clear handle and middleware
 */
export function clear() {
  clearNamespace(DEFAULT_NAMESPACE)
}

/**
 * clear handle and middleware with namespace
 */
export function clearNamespace(namespace: string) {
  if(handler[namespace]) {
    delete handler[namespace]
  }

  if(middlewareHandle[namespace]) {
    delete middlewareHandle[namespace]
  }
}

/**
 * clear all handle and middleware
 */
export function clearAll() {
  Object.keys(handler).forEach(k => {
    delete handler[k]
  })

  Object.keys(middlewareHandle).forEach(k => {
    delete middlewareHandle[k]
  })
}

function onConnect(port: chrome.runtime.Port) {
  const portHandler = handler[port.name] || handler[`${port.name}.${port.sender?.tab?.id||""}`]
  if(portHandler) {
    port.onMessage.addListener((msg, { sender }) => {
      if(!sender) {
        return
      }

      const mwh = middlewareHandle[port.name] || middlewareHandle[`${port.name}.${sender.tab?.id||""}`]
      if(mwh) {
        mwh({
          namespace: port.name,
          type: msg.type,
          data: msg.msg
        })
      }

      const methodHandler = portHandler[msg.type] || portHandler[`${msg.type}.${sender.tab?.id||""}`]
      methodHandler && methodHandler.call(msg.msg, msg.msg, data => {
        port.postMessage({
          type: msg.type,
          data
        })
      }, sender.tab, sender, port)
    })
  }
}

/**
 * start listen
 */
export function installListener() {
  chrome.runtime.onConnect.addListener(onConnect)
}

/**
 * stop listen
 */
export function uninstallListener() {
  chrome.runtime.onConnect.removeListener(onConnect)
}