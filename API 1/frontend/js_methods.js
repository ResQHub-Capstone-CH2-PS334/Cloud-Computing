const fetch = require('node-fetch')
const __backendProtocol = 'https'
const __backendUrl = 'api1b-be-y2mk2btioa-et.a.run.app'
const __fullUrl = `${__backendProtocol}://${__backendUrl}`
const { google } = require('googleapis')
const cjs = require('crypto-js')
const signer = require('./js_signer')
// const jwt = require('jsonwebtoken')

const __getToken__ = async (url) => {
  const jwtClient = new google.auth.JWT(
    {
      keyFile: './keys/key_cloudrun.json',
      scopes: []
    }
  )
  const token = await jwtClient.fetchIdToken(url)
  return token
}
const __default = async (req, h) => {
  return h.response({
    status: 'ok'
  })
}

const __buildvkey = async (req, h) => {
  if (req.payload === null) return h.response({ status: 'no-body' })
  const { email } = req.payload
  if (email === null) {
    return h.response({ status: 'incomplete-body' })
  }

  const token = await __getToken__(`${__fullUrl}/build-vkey`)
  const f = await fetch(`${__fullUrl}/build-vkey`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ email })
  })
  const fJSON = await f.json()
  return h.response(fJSON)
}

const __verifvkey = async (req, h) => {
  if (req.payload === null) return h.response({ status: 'no-body' })
  const { email = null, vkey = null } = req.payload
  if (vkey === null || email === null) {
    return h.response({ status: 'incomplete-body' })
  }

  const token = await __getToken__(`${__fullUrl}/build-vkey`)
  const f = await fetch(`${__backendProtocol}://${__backendUrl}/verif-vkey`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ email, vkey })
  })
  const fJSON = await f.json()
  return h.response(fJSON)
}

const __encryptUserConfig = async (req, h) => {
  const hash = cjs.SHA256('oi').toString()
  return h.response(hash)
}

const __jwtEndPoint = async (req, h) => {
  console.log(req.headers.authorization)
  return 1
}

const __jwtExperiment = async (req, h) => {
  const pp = {
    name: 'Maxwell',
    field: 'Physics!',
    xf: '1284',
    fd: {
      a: 12,
      b: 13,
      c: 8,
      dm: {
        a: 15,
        b: 12
      }
    }
  }
  const x = await signer.signThis(pp, '123', 120)
  const y = await signer.apply('resqhubU2FsdGVkX1+XerdtNnphQJyVEJrcPNTN47qNTvmf2UhhZAeU2vwB4xKaMXdWE5VKdj6lMRbA8HASYXF3iQM84PIHW/F0nAjg3SmZvA54cmATwA4NJPY3WSdzkNXu/h0m/YewZh+3DQ9A7vXfJ7kh6GasHcOdbEXnEpXAAbOoNMS1nGR6sbxligh3cTHO8J9PCqzO03b/ohtRNnY+aBAEsHtOaaani/3kWZk7jduNTZ5EoU1xPJ0cY3LMQ+7Qr+WY/U4FfRK+yIazyOMz9OkPnoh77vQus/IeutIbjsFSpb3NRFwpQOMe5CPbL8JOeFC3uzgW7Xyizz1YRNIt/6nsZUnMMpVIoNIhuaQUslGROwM=', '123')
  console.log(y)
  return x
}

module.exports = {
  default: __default,
  buildvkey: __buildvkey,
  verifvkey: __verifvkey,
  encryptUserConfig: __encryptUserConfig,
  jwtExperiment: __jwtExperiment,
  jwtEndPoint: __jwtEndPoint
}
