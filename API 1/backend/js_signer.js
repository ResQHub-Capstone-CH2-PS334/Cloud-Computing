const cjs = require('crypto-js')
const __SERVER_SUPERSECRET_KEY = 'kcTRA7prpdN_plYmoZHz1L7V6N1lP61t'

const signThis = async (__jsonData, __key, __duration = null) => {
  const nowUnix = Math.round(new Date().getTime() / 1000)
  const jsonData = {
    ...__jsonData,
    sat: nowUnix, // signed at
    eat: nowUnix + __duration // end at
  }
  const b64Data = btoa(JSON.stringify(jsonData))
  const signature = cjs.HmacSHA256(b64Data, __key)
  return cjs.AES.encrypt('resqhub' + b64Data + ':' + signature, __SERVER_SUPERSECRET_KEY).toString()
}

const apply = async (__encryptedToken, __key) => {
  if (__encryptedToken.slice(0, 7) !== 'resqhub') {
    return { status: 'not-a-resqhub-token', data: {} }
  }
  let decryptedToken = 0
  try {
    decryptedToken = cjs.AES.decrypt(__encryptedToken.slice(7), __SERVER_SUPERSECRET_KEY).toString(cjs.enc.Utf8).split(':')
  } catch (err) {
    if (err.message === 'Malformed UTF-8 data') return { status: 'malformed', data: {} }
  }

  const comparedSignature = cjs.HmacSHA256(decryptedToken[0], __key).toString()
  if (comparedSignature === decryptedToken[1]) {
    const jsonData = JSON.parse(atob(decryptedToken[0]))
    if (jsonData.sat === jsonData.eat) {
      return { status: 'authenticated', data: jsonData }
    }
    if (jsonData.eat < Math.round(new Date().getTime() / 1000)) {
      return { status: 'expired', data: jsonData }
    }
    return { status: 'authenticated', data: jsonData }
  }
  return { status: 'unauthenticated', data: {} }
}

module.exports = {
  signThis,
  apply
}
