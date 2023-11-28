const cjs = require('crypto-js')
const __SERVER_SUPERSECRET_KEY = 'kcTRA7prpdN_plYmoZHz1L7V6N1lP61t'

const signThis = async (__jsonData, __key, __duration = null) => {
  const nowUnix = new Date().getTime() / 1000
  const jsonData = {
    ...__jsonData,
    sat: nowUnix, // signed at
    eat: nowUnix + __duration // end at
  }
  const b64Data = btoa(JSON.stringify(jsonData))
  const signature = cjs.HmacSHA256(b64Data, __key)
  return cjs.AES.encrypt(b64Data + ':' + signature, __SERVER_SUPERSECRET_KEY).toString()
}

const apply = async (__encryptedToken, __key) => {
  let decryptedToken = 0
  try {
    decryptedToken = cjs.AES.decrypt(__encryptedToken, __SERVER_SUPERSECRET_KEY).toString(cjs.enc.Utf8).split(':')
  } catch (err) {
    if (err.message === 'Malformed UTF-8 data') return 'malformed'
  }

  const comparedSignature = cjs.HmacSHA256(decryptedToken[0], __key).toString()
  if (comparedSignature === decryptedToken[1]) {
    const jsonData = JSON.parse(atob(decryptedToken[0]))
    if (jsonData.sat === jsonData.eat) return 'authenticated'
    if (jsonData.eat < new Date().getTime() / 1000) return 'expired'
    return 'authenticated'
  }
  return 'unauthenticated'
}

module.exports = {
  signThis,
  apply
}
