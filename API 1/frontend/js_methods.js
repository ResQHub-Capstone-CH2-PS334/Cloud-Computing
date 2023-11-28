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
  const pp = { name: 'Maxwell', field: 'Physics!', xf: '1284', fd: '1287823', etc: '128472', wow: '12jeij23u9832cu932923um49cu3984m932u4c93um493u4c94m9u8093um4c9324' }
  const x = await signer.signThis(pp, '123', 120)
  const y = await signer.apply('U2FsdGVkX18Ns9aKN7cwChxLdumzKLxM6neQ/eq4gX1NqwdPCju8jayUIkCg2uMpmIoi3Jjge7nQ0SXxZdFYIktE+WTZDuI6J0QdRP+3kZIbI3WOCQ5H2eYkv0ee8ApU93G9xUUHWOFwyQz4ys5uAoM1WANVdGz/Qw5lZLCOQe7OtQzHBaSD0fBtDq5PFD2Wkqt/fLMHzAnWy5xZ42L3Z8NvfhDADcDaN38lZBKic3cBPO9fuV9aCKz5INlO/2ab2+65x5yDc+dIP18TLdaf6oXk1d+F7erkQepYdQXl29uL7vuWqyEYKYyryTXYSi+6Hh9gCTsX5vL/KY2mT21+Zg/gGDfORvm3zZsK3i5Z3K/+WfhcsI1TspPvxwPYxSCKuDxtzd0dUgSMkPCQ5g5+HrhpX+1XN29jN8GwnPZ5P+j1mUJs/3nons4c0YfPKKJxTPBvdU9uh8sLBxIvoXXrSA==', '123')
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
