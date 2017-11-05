import intel from 'intel'
import WebSocket from 'ws'


export const applyMiddleware = (param, ...functions) => {
  try {
    let tmp = param
    functions.forEach(fn => tmp = fn(tmp)) // eslint-disable-line no-return-assign
  }
  catch (error) {
    intel.info(`Something goes wrong in applyMiddleware function, maybe some function throws the errors,
    \n you can read what kind of errors was throwed below:\n\n${error}`)
  }
}

export const wrapConnection = junc =>
  ({
    type: false,
    authenticated: false,
    region: false,
    connection: junc,
    uid: false,
    state: 0,
    serverSets: { PORT: false, URL: false },
  })


export const execRoute = ({ junc, message }) => {
  try {
    if (message.data.client) {
      websocket.router[message.data.client.type][message.request]({ junc, message }) // eslint-disable-line no-undef, max-len
    }
    else {
      websocket.router[junc.type][message.request]({ junc, message }) // eslint-disable-line no-undef, max-len
    }
  }
  catch (error) {
    intel.info(`it's attempt to call unexisting function: ${message.request}\n
    Full description of error read below...: \n\n${error} `)
  }
}

export const dropClient = (juncUnit) => {
  websocket.CLIENTS.forEach((value) => { // eslint-disable-line no-undef
    if (juncUnit.connection === value.connection) {
      websocket.CLIENTS.clean(value) // eslint-disable-line no-undef
    }
  })
}

export const processData = (data) => {
  try {
    const message = JSON.parse(data.message)
    return { ...data, message }
  }
  catch (error) {
    intel.info('unexpectable message')
  }
  return data
}

export const runRouter = (juncUnit) => {
  juncUnit.connection.on('message', message =>
    applyMiddleware({ junc: juncUnit, message }, processData, execRoute))
  juncUnit.connection.on('close', () => dropClient(juncUnit))
}

export const runWebSocketServer = (server, router) => {
  const socket = new WebSocket.Server({ server })

  socket.router = router
  socket.CLIENTS = []

  socket.broadcast = (data) => {
    socket.CLIENTS.forEach((client, key) => {
      if (client.connection.readyState === WebSocket.OPEN) {
        client.connection.send(data)
      }
      else {
        intel.info(`Client ${key} isn't connected `)
      }
    })
  }

  socket.appendClient = (websock) => {
    socket.CLIENTS.push(websock)
    return websock
  }

  socket.appendProps = (junc, settings) => {
    socket.CLIENTS.forEach((client, key) => (client.connection === junc) ? Object.assign(socket.CLIENTS[key], settings) : junc)
  }

  socket.on('close', () => {
    intel.info('Socket is disconnected, closing the app')
  })

  intel.info('WebSocket server is initialized, app is ready for work now')
  return socket
}

Array.prototype.clean = function (value) { // eslint-disable-line no-extend-native, func-names
  for (var i = 0; i < this.length; i++) if (this[i] === value) this.splice(i, 1); i-- // eslint-disable-line vars-on-top, no-var, max-len, block-scoped-var
  return this
}
