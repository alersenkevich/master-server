import intel from 'intel'
import moment from 'moment'
import { Client } from '../../models'


export async function findClient(clientID) {
  try {
    return Client.findOne({ uid: clientID })
  }
  catch (error) {
    intel.info(error)
    return null
  }
}

export async function deleteClient(uid) {
  try {
    const dbclient = await findClient(uid)
    if (dbclient === null) {
      throw new Error(`Невозможно удалить монитор зрителя ${__filename} -> 39`)
    }
    dbclient.remove()
    return true
  } catch (error) {
    intel.info(new Error(error))
    return false
  }
}

export async function addClient(client) {
  try {
    const dbclient = await findClient(client.clientID)
    if (dbclient) {
      return dbclient
    }
    const time = moment().unix()
    const newClient = new Client({
      uid: client.clientID,
      created_at: time,
      type: 'Spectator',
    })
    return newClient.save()
  }
  catch (error) {
    intel.info(error)
    return null
  }
}

export async function editClient(data) {
  let dbclient = await findClient(data.uid)
  if (dbclient === null) {
    throw new Error(`Невозможно обновить монитор зрителя ${__filename} -> 39`)
  }
  data.updated_at = moment().unix() // eslint-disable-line no-param-reassign
  dbclient = Object.assign(dbclient, data)
  return dbclient.save()
}

export async function allClients(params = {}) {
  try {
    return await Client.find(params).sort({ created_at: 'desc' })
  }
  catch (error) {
    intel.info(error)
    return null
  }
}

export default {
  findClient, addClient, allClients, editClient,
}
