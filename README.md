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

in background:
```javascript
import { listen, listenGroup, installListener } from "web-ext-msg-passing"

// required in background
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

in content script or popup script:

```javascript
import { sendWithResponse } from "web-ext-msg-passing"

// get api background response.
await sendWithResponse("callApi")
// get api background response with payload.
await sendWithResponse("callApi2", {id: 123})
// call background listener but not need response.
send("otherFn", {id: 3})
```