import intel from 'intel'
import api from '../lib/api/kassy-api'
import { findClient } from '../helpers/database/spectator'
import { generateAnswer } from './spectator'


const authorize = async ({ junc, message }) => {
  try {
    const receivedSets = message.data.client
    const remadeJunc = {
      uid: receivedSets.uid,
      type: receivedSets.type,
      region: receivedSets.region,
      authenticated: true,
      serverSets: {
        ...receivedSets.serverSets,
        URL: `ws://${receivedSets.serverSets.ADDRESS}:${receivedSets.serverSets.PORT}`,
      },
      state: 0,
      regionSets: false,
    }


    if (receivedSets.region !== null) {
      remadeJunc.state = 1
      const databaseConfig = await api.post({
        action: 'subdivision',
        region: message.data.client.region,
      })
      databaseConfig.content[0].postgresDB = `atlas_${databaseConfig.content[0].db}`
      databaseConfig.content[0].hostname = `api.${databaseConfig.content[0].db}.kassy.ru`

      remadeJunc.regionSets = {
        postgresDB: databaseConfig.content[0].postgresDB,
        hostname: databaseConfig.content[0].hostname,
        port: databaseConfig.content[0].port,
      }
    }
    websocket.appendProps(junc.connection, remadeJunc) // eslint-disable-line no-undef

    intel.info(`Slave-server has connected just now, configuration of this server you can read below:\n\n
    Type:SLAVE – uid: ${remadeJunc.uid};

    State:${(remadeJunc.region)
    ? 'Connected to DB, working with spectators'
    : 'Not connected to DB, waiting for configuration'};

    Server Configuration: ${remadeJunc.serverSets.URL};

    Database Configuration: ${(remadeJunc.regionSets)
    ? JSON.stringify(remadeJunc.regionSets)
    : 'NULL, waiting for configuration'}`)
  }
  catch (error) {
    intel.info(`Something goes wrong on  slave authorization, description of error is below:\n\n${error}`)
  }
}

const hookOnAllSpectators = (junc, region) => {
  try {
    websocket.CLIENTS.forEach(async (spectator) => {
      if (spectator.region === region && spectator.authenticated === true && spectator.type === 'Spectator') {
        websocket.appendProps(spectator.connection, {
          ws: { url: junc.serverSets.URL },
        })
        const client = await findClient(spectator.uid)
        generateAnswer({ ...client._doc, ws: { url: junc.serverSets.URL } }, spectator)
      }
    })
  }
  catch (error) {
    intel.info(`Something goes wrong on hookOnAllSpectators function ${__filename} \n\n${error}`)
  }
}

const switchServer = ({ junc, message }) => {
  try {
    const remadeJunc = {
      region: message.data.region,
      regionSets: message.data.regionSets,
      state: 1,
    }
    junc = { ...junc, ...remadeJunc }
    websocket.appendProps(junc.connection, remadeJunc) // eslint-disable-line no-undef

    intel.info(`Slave-server has connected to postgres region db, configuration was changed.
    New configuration of this server you can read below:\n\n

    Type:SLAVE – uid: ${junc.uid};

    State: ${(junc.region)
    ? 'Connected to DB, working with spectators'
    : 'Not connected to DB, waiting for configuration'};

    Server Configuration: ${junc.serverSets.URL};
    
    Database Configuration: ${(junc.regionSets)
    ? JSON.stringify(junc.regionSets)
    : 'NULL, waiting for configuration'}`)

    hookOnAllSpectators(junc, remadeJunc.region)
  }
  catch (error) {
    intel.info(`Something goes wrong in switching slave method, the error below: \n\n${error}`)
  }
}


export default { authorize, switchServer }
