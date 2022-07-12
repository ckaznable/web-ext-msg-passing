[![npm version](https://img.shields.io/npm/v/web-ext-msg-passing?color=g)](https://www.npmjs.com/package/web-ext-msg-passing)

# web-ext-msg-passing

simple web extension message passing library

## Example

Refer to this [repository](https://github.com/ckaznable/web-ext-msg-passing-example) for an example of how to use it

## Installation

Using npm:

```shell
npm install --save web-ext-msg-passing
```

or using yarn:

```shell
yarn add web-ext-msg-passing
```

## Usage

### Basic Usage

background:
```javascript
import { listen, listenGroup, installListener } from "web-ext-msg-passing"

// installListener is required if you want listen event
installListener()

// listen one event
listen("callApi", (_, reply) => {
  return fetch("<YOUR API URI>").then(res => res.json())
})

// listen multiple event
listenGroup({
  callApi2(parameter, reply) {
    return fetch("<YOUR API URI>", {
      body: JSON.stringify(parameter)
    }).then(res => res.json())
  },
  otherFn(parameter, reply) {
    // do something...
  }
})
```

content script or popup:
```javascript
import { send } from "web-ext-msg-passing"

// get api background response.
await send("callApi")
// get api background response with payload.
await send("callApi2", {id: 123})
// call background listener but not need response.
send("otherFn", {id: 3})
```

### Send event to content script from background or popup

background or popup:
```javascript
import { sendToContent } from "web-ext-msg-passing"

sendToContent("getContentHtml").then(response => {
  // response will get current page html
})
```

content script:
```javascript
import { installListener, listen } from "web-ext-msg-passing"

// installListener is required if you want listen event
installListener()

// listen event
listen("getContentHtml", () => document.documentElement.innerHTML)
```

## Typescript

Refer to this [repository](https://github.com/ckaznable/web-ext-msg-passing-example/tree/main/src/typescript) for an example of how use in typescript