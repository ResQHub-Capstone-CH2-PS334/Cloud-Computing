const fetch = require('node-fetch')
const { google } = require('googleapis')

const internalCheckRequestRequirement = (__payload, __require) => {
  if (__payload === null) {
    return 'no payload!'
  }
  let err = ''
  for (let i = 0; i < __require.length; i++) {
    if (__payload[__require[i]] === undefined) {
      err += 'Missing ' + __require[i] + '...'
    }
  }
  console.log(err)
  return err
}

const internalEvokeCloudRun = async (__url) => {
  const url = __url
  const jwtClient = new google.auth.JWT({
    keyFile: './keys/key-cloudrun.json',
    scopes: []
  })
  const token = await jwtClient.fetchIdToken(url)
  return token
}

const internalCallBackEnd = async (__url, __method, __headers, __body = null) => {
  const reqBackEndToken = await internalEvokeCloudRun(__url)
  const fetcher = await fetch(__url, {
    method: __method,
    headers: {
      ...__headers,
      Authorization: `Bearer ${reqBackEndToken}`
    },
    body: JSON.stringify(__body)
  })
  const jsonFetcher = await fetcher.json()
  return jsonFetcher
}

const makeRequest = async ({
  __url,
  __headers,
  __method,
  __payloads,
  __requiredPayloads
}, h) => {
  let errPayloads = 0

  if (__payloads !== null) {
    errPayloads = internalCheckRequestRequirement(__payloads, __requiredPayloads)
  }
  if (errPayloads === 0 || errPayloads === '') {
    return h.response(await internalCallBackEnd(__url, __method, __headers, __payloads))
  }
  return h.response({ malformedPayloads: errPayloads })
}

const getHeaders = (req, __headers) => {
  const returnHeader = {}
  __headers.forEach((x) => { returnHeader[x] = req.headers[x] })
  return returnHeader
}

module.exports = {
  makeRequest,
  getHeaders
}
