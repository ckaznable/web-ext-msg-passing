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

```javascript
// in background.js

import { listen, listenGroup, installListener } from "web-ext-msg-passing"

// installListener is required if you want listen event
installListener()

// listen one event
listen("callApi", async (_, reply) => {
  reply(await fetch("<YOUR API URI>").then(res => res.json()))
})

// listen multiple event
listenGroup({
  callApi2(parameter, reply) {
    fetch("<YOUR API URI>", {
      body: JSON.stringify(parameter)
    }).then(res => {
      return res.json()
    }).then(reply)
  },
  otherFn(parameter, reply) {
    // do something...
  }
})
```

```javascript
// in content script or popup

import { sendWithResponse } from "web-ext-msg-passing"

// get api background response.
await sendWithResponse("callApi")
// get api background response with payload.
await sendWithResponse("callApi2", {id: 123})
// call background listener but not need response.
send("otherFn", {id: 3})
```

### Send event to content script from background or popup

```javascript
// in background or popup

import { sendToContent } from "web-ext-msg-passing"

sendToContent("getContentHtml").then(response => {
  // response will get current page html
})
```

```javascript
// in content script

import { installListener, listen } from "web-ext-msg-passing"

// installListener is required if you want listen event
installListener()

// listen event
listen("getContentHtml", (_, reply) => {
  reply(document.documentElement.innerHTML)
})
```

## Typescript

Refer to this [repository](https://github.com/ckaznable/web-ext-msg-passing-example/tree/main/src/typescript) for an example of how use in typescript