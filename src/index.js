import http from 'http'
import path from 'path'
import intel from 'intel'
import express from 'express'
import mongoose from 'mongoose'
import bluebird from 'bluebird'
import bodyParser from 'body-parser'

import {
  applyMiddleware,
  wrapConnection,
  runRouter,
  runWebSocketServer,
} from './lib/websocket'
import router from './routes'
import { MONGO_URL, PORT } from './config'
import { describeProcessEvents } from './init'


const app = express()


app.set('views', `${__dirname}/views`)
app.set('view engine', 'pug')
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(express.static(path.join(__dirname, '../public')))

const server = http.createServer(app)
app.use('/admin', router.admin)

global.Promise = bluebird
Promise.config({ cancellation: true })

mongoose.connection.on('connected', () => {
  server.listen(PORT, () => {
    global.websocket = runWebSocketServer(server, router.socket)
    global.websocket.on('connection', conn => applyMiddleware(conn, wrapConnection, global.websocket.appendClient, runRouter))
  })
})

try {
  describeProcessEvents(MONGO_URL)
  mongoose.connect(MONGO_URL)
  mongoose.Promise = global.Promise
}
catch (error) {
  intel.warn(error)
}