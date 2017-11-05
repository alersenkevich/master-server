import md5 from 'md5'
import intel from 'intel'
import fetch from 'node-fetch'
import apiConfig from './config'


class KassyApi {
  constructor(initialConfig) {
    this.config = initialConfig
  }

  async request(url, config) {
    const xml = this.composeXML(config)
    const sign = md5(xml + config.secret_key)
    try {
      const response = await fetch(url, {
        method: config.method,
        headers: {
          'Content-type': 'application/x-www-form-urlencoded;multipart/form-data; charset=UTF-8',
          'Accept-Encoding': 'gzip,deflate',
        },
        body: `xml=${xml}&sign=${sign}`,
      })

      return await response.json()
    }
    catch (error) {
      intel.info(`Ошибка запроса к апи\n\n${error}`)
    }
  }

  get(url, config) {
    return this.request(this.config.url, { ...config, method: 'GET' })
  }

  post(config) {
    return this.request(this.config.url, { ...config, ...this.config, method: 'POST' })
  }

  patch(url, config) {
    return this.request(this.config.url, { ...config, method: 'PATCH' })
  }

  put(url, config) {
    return this.request(this.config.url, { ...config, method: 'PUT' })
  }

  delete(url, config) {
    return this.request(this.config.url, { ...config, method: 'DELETE' })
  }

  composeXML(config) { // eslint-disable-line class-methods-use-this
    if (config.action === 'subdivision') {
      let filter = false
      if (config.regionDB) filter = `<filter id="" db="${config.regionDB}" state="" />`
      return (`<?xml version="1.0" encoding="utf-8"?>
      <request db="${config.db || ''}" module="${config.action}" format="json">
        ${(filter) || ''}
          <auth id="${config.agent_id}" />
      </request>`)
    }
    else if (config.action === 'table_atlas_salepoint') {
      return (`<?xml version="1.0" encoding="utf-8"?>
      <request db="${config.region.db}" module="${config.action}" format="json">
        <auth id="${config.agent_id}" />
      </request>
      `)
    }
    return ''
  }
}

export default new KassyApi(apiConfig)
