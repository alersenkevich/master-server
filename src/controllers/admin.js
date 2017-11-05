import _ from 'lodash'
import intel from 'intel'
import moment from 'moment'
import api from '../lib/api/kassy-api'
import { allClients, editClient, deleteClient } from '../helpers/database/spectator'
import { determineAppropriateSlave, switchONSlave } from './spectator'


const spectatorIsOnline = uid =>
  Boolean(_.find(websocket.CLIENTS, spectator => spectator.uid === uid))

export const getSalePoints = async (req, res) => {
  const cashboxes = await api.post({ action: 'table_atlas_salepoint', region: req.body.region })
  res.send(cashboxes)
}

export const getSubdivisions = async (req, res) => {
  const { content } = await api.post({ action: 'subdivision' })
  delete content[0]
  if (!req || !res) {
    return content.filter(v => typeof v !== 'undefined')
  }
  res.send(content.filter(v => typeof v !== 'undefined'))
}

export const getSpectators = async (req, res) => {
  const clients = await allClients()
  const subdivisions = await getSubdivisions()

  const spectators = clients.map((value) => {
    const time = moment.unix(value.created_at).format('DD.MM.YYYY HH:mm:ss')
    const status = spectatorIsOnline(value.uid)
    return { ...value._doc, time, status }
  })
  res.render('admin/spectators', { spectators, subdivisions })
}

export const getSlaves = async (req, res) => {
  let slaves = []
  slaves.push(_.find(websocket.CLIENTS, val => val.type === 'Slave' && val.authenticated === true))
  slaves = slaves.map(v => ({ ...v, connection: false }))
  res.send(slaves)
}

export const saveSpectator = async (req, res) => {
  try {
    const response = await editClient({
      ...req.body.region,
      ...req.body.cashbox,
      uid: req.body.uid,
    })
    const appropSlave = await determineAppropriateSlave(response.region)
    if (appropSlave !== false) {
      const spectatorFromReq = _.find(
        websocket.CLIENTS,
        val => (val.type === 'Spectator' && val.uid === response.uid)
      )
      websocket.appendProps(spectatorFromReq.connection, {
        region: response.region,
        cashboxTitle: response.cashboxTitle,
        authenticated: true,
        ws: { url: appropSlave.url },
      })

      if (appropSlave.db === true) {
        spectatorFromReq.connection.send(JSON.stringify({
          response: {
            data: {
              ...response._doc,
              ws: {
                url: appropSlave.url,
              },
            },
          },
        }))
      }
      else {
        switchONSlave(appropSlave.uid, response.region)
      }
      res.send({ ...response._doc, check: 1, text: 'success' })
      return
    }
    res.send({ ...response._doc, check: 1, text: 'success' })
  }
  catch (error) {
    intel.info(error)
  }
}

const deleteSpectator = async (req, res) => {
  const response = await deleteClient(req.body.uid)
  if (response) res.send({ check: 1 })
  else res.send({ check: 0, text: 'something goes wrong' })
}


export default {
  getSalePoints, getSpectators, saveSpectator, getSubdivisions, deleteSpectator, getSlaves,
}
