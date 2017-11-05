import _ from 'lodash'
import intel from 'intel'
import api from '../lib/api/kassy-api'
import { findClient, addClient } from '../helpers/database/spectator'


export const generateAnswer = async (outputData, junc, sets) => {
  let obj = { response: { status: 1, text: 'OK', data: outputData } }
  if (sets) {
    obj = {
      [sets.type]: {
        status: 1, text: 'OK', data: outputData, action: sets.action,
      },
    }
  }
  try {
    const answer = await JSON.stringify(obj)
    junc.connection.send(answer)
  }
  catch (error) {
    intel.info(`something goes wrong in generateAnswer function,
    what's wrong you can read below: \n\n${error} `)
  }
}

export const switchONSlave = async (uid, region) => {
  const databaseConfig = await api.post({
    action: 'subdivision',
    regionDB: region,
  })

  databaseConfig.content[0].postgresDB = `atlas_${databaseConfig.content[0].db}`
  databaseConfig.content[0].hostname = `api.${databaseConfig.content[0].db}.kassy.ru`

  const slave = _.find(websocket.CLIENTS, val => val.uid === uid) // eslint-disable-line no-undef
  generateAnswer(
    {
      postgresDB: databaseConfig.content[0].postgresDB,
      hostname: databaseConfig.content[0].hostname,
      port: databaseConfig.content[0].port,
      region,
    },
    slave,
    {
      type: 'request',
      action: 'switch',
    }
  )
}

/**
 * @param {string} region
 * @return {slave => boolean}
 */
const isSlaveRegion = region => slave =>
  (slave.type === 'Slave' && slave.state === 1 && slave.region === region)

/**
 * @param {object} slave
 * @return {boolean}
 */
const isPureSlave = slave => (slave.type === 'Slave' && slave.state === 0)

export const determineAppropriateSlave = async (region) => {
  if (!region) {
    return false
  }

  const slave = _.find(websocket.CLIENTS, isSlaveRegion(region)) // eslint-disable-line no-undef

  if (slave) {
    return {
      url: slave.serverSets.URL,
      db: true,
      uid: slave.uid,
    }
  }

  const pureSlave = _.find(websocket.CLIENTS, isPureSlave) // eslint-disable-line no-undef

  if (pureSlave) {
    return {
      url: pureSlave.serverSets.URL,
      db: false,
      uid: pureSlave.uid,
    }
  }

  intel.info('Unfortunately programm wasn\'t able to find neccessary slave-server')

  return false
}

const determineJuncProps = async ({ junc, clientData }) => {
  try {

    const {
      region = false,
      cashboxTitle = false,
    } = clientData

    const authenticated = Boolean(region && cashboxTitle)

    const remadeJunc = {
      uid: clientData.uid,
      type: 'Spectator',
      region,
      cashboxTitle,
      authenticated,
    }

    websocket.appendProps(junc.connection, remadeJunc) // eslint-disable-line no-undef

    const appropSlave = await determineAppropriateSlave(region)

    if (appropSlave !== false) {
      if (appropSlave.db) {
        generateAnswer({
          ...clientData._doc, // eslint-disable-line no-underscore-dangle
          ws: { url: appropSlave.url },
        }, junc)
      }
      else {
        switchONSlave(appropSlave.uid, region)
      }
      return
    }
    return
  }
  catch (error) {
    intel.info(`Something goes wrong in determineJuncProps function,
    description of error is below:\n\n${error}`)
  }
}

const authorize = async ({ junc, message }) => {
  let clientData = await findClient(message.data.client.clientID)
  if (clientData != null) {
    await determineJuncProps({ junc, message, clientData })
    return
  }
  clientData = await addClient(message.data.client)
  await determineJuncProps({ junc, message, clientData })
}


export default { authorize, determineAppropriateSlave }
