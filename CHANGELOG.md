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