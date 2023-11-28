const fetch = require('node-fetch')
const __backendProtocol = 'https'
const __backendUrl = 'api1b-be-y2mk2btioa-et.a.run.app'
const __fullUrl = `${__backendProtocol}://${__backendUrl}`
const { google } = require('googleapis')
const cjs = require('crypto-js')

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

module.exports = {
  default: __default,
  buildvkey: __buildvkey,
  verifvkey: __verifvkey,
  encryptUserConfig: __encryptUserConfig
}
