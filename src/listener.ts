import { DEFAULT_NAMESPACE } from "./static"
import type { MessageHandle, MessageHandleParameter, MessageHandleReplyData, MessageHandleTemplate, MiddlewareData, PassingData } from "./types"

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

function getHandler(namespace: string, sender: chrome.runtime.MessageSender) {
  return handler[namespace] || handler[`${namespace}.${sender?.tab?.id||""}`]
}

function onHandle(namespace: string, type: string, msg: any, sender: chrome.runtime.MessageSender, sendResponse: (data: any)=>void) {
  const portHandler = getHandler(namespace, sender)
  if(!portHandler) {
    return
  }

  const mwh = middlewareHandle[namespace] || middlewareHandle[`${namespace}.${sender.tab?.id||""}`]
  mwh && mwh({type, msg, name: namespace})

  const methodHandler = portHandler[type] || portHandler[`${type}.${sender.tab?.id||""}`]
  methodHandler && methodHandler.call(msg, msg, sendResponse, sender.tab, sender)
}

function onConnect(port: chrome.runtime.Port) {
  const portHandler = getHandler(port.name, port.sender)
  if(portHandler) {
    port.onMessage.addListener((data, { sender }) => {
      if(!sender) return

      onHandle(port.name, data.type, data.data, sender, _data => {
        port.postMessage({
          type: data.type,
          msg: _data
        })
      })
    })
  }
}

function onMessage({name, type, msg}: PassingData, sender: chrome.runtime.MessageSender, sendResponse: (data: any)=>void) {
  onHandle(name, type, msg, sender, data => {
    sendResponse({
      type,
      msg: data
    })
  })

  return true
}

/**
 * start listen
 */
export function installListener() {
  chrome.runtime.onMessage.addListener(onMessage)
  chrome.runtime.onConnect.addListener(onConnect)
}

/**
 * stop listen
 */
export function uninstallListener() {
  chrome.runtime.onMessage.removeListener(onMessage)
  chrome.runtime.onConnect.removeListener(onConnect)
}