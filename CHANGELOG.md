# [0.1.5] (2022-11-23)

* add cjs build

# [0.1.4] (2022-11-21)

* add import with ".js" extension name

# [0.1.3] (2022-11-17)

* apply v0.1.2 change to all sender

# [0.1.2] (2022-11-17)

* make sender parameter 2 is not required

# [0.1.1] (2022-07-13)

* update README
* update package.json dependencies

# [0.1.0] (2022-07-12)

## Breaking Changes

* removed deprecated method from code
* change MessageHandle type declare, You can now return value or Promise directly without going through the reply method

```typescript
// type declare
MessageHandle<T = any, Q = any> = (msg: T, tab: Required<chrome.tabs.Tab>, sender: chrome.runtime.MessageSender, port: chrome.runtime.Port) => Q|Promise<Q>|void

// before
listen("getAPI", (body, reply) => {
  fetch("...", {body}).then(res => res.json()).then(reply)
})

// since 0.1.0
listen("getAPI", (body) => {
  return fetch("...", {body}).then(res => res.json())
})
```

# [0.0.6] (2022-07-07)

## Changes

* change sender implement from `chrome.runtime.Port.postMessage` to `chrome.runtime.sendMessage`

## Deprecated method

* `sendWithResponse`
* `UnionSender.sendWithResponse`
* `Sender.sendWithResponse`

# [0.0.5] (2022-06-27)

## Added UnionSender

UnionSender able compose different namespace Sender in one Sender

```javascript
// Sender
send(type, parameter)

// Union Sender
send(namespace, type, parameter)
send(namespace2, type, parameter)
```

# [0.0.4] (2022-06-25)

## Types

* fix sendToContent and sendWithResponse return wrong type

## Bugs

* fix sendWithResponse can't send response problem

# [0.0.3] (2022-06-24)

* improve typescript supported
* add sendToContent, supported send event to content script

# [0.0.2] (2022-06-22)

* release to npm
* change default export schema
* add example in [README.md](./README.md)

# [0.0.1] (2022-06-17)

* init release