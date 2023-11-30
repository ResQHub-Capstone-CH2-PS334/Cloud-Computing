const cjs = require('crypto-js')
const { nanoid } = require('nanoid')

const __SUPERSECRET_KEYS = {
  __TOKENCRYPT: 'kcTRA7prpdN_plYmoZHz1L7V6N1lP61t',
  __APPDEFAULT: '82jf72oen3_283yy716jchZ7238h1946',
  __HMACSHAKEY: '381n248392rnd71usuida92_29jfi3nf'
}

const signThis = async (__jsonData, __key, __duration = null) => {
  const nowUnix = Math.round(new Date().getTime() / 1000)
  const jsonData = {
    ...__jsonData,
    sat: nowUnix, // signed at
    eat: (__duration === null) ? null : nowUnix + __duration // end at
  }
  const b64Data = btoa(JSON.stringify(jsonData))
  const salt = nanoid(8)
  const signature = cjs.HmacSHA256(b64Data, __key + salt)
  return 'resqhub' + cjs.AES.encrypt(
    b64Data + ':' + signature + ':' + salt,
    __SUPERSECRET_KEYS.__TOKENCRYPT).toString()
}

const apply = async (__encryptedToken, __key) => {
  if (__encryptedToken.slice(0, 7) !== 'resqhub') {
    return { status: 'not-a-resqhub-token', data: {} }
  }
  let decryptedToken = 0
  try {
    decryptedToken = cjs.AES.decrypt(__encryptedToken.slice(7),
      __SUPERSECRET_KEYS.__TOKENCRYPT).toString(cjs.enc.Utf8).split(':')
  } catch (err) {
    if (err.message === 'Malformed UTF-8 data') return { status: 'malformed', data: {} }
  }
  const salt = decryptedToken[2]
  const comparedSignature = cjs.HmacSHA256(decryptedToken[0], __key + salt).toString()
  if (comparedSignature === decryptedToken[1]) {
    const jsonData = JSON.parse(atob(decryptedToken[0]))
    if (jsonData.eat < Math.round(new Date().getTime() / 1000) && jsonData.eat !== null) {
      return { status: 'expired', data: jsonData }
    }
    return { status: 'authenticated', data: jsonData }
  }
  return { status: 'unauthenticated', data: {} }
}

const signUART = async (__email, __usr) => {
  const userPayload = { email: __email, username: __usr }
  const UART = await signThis(userPayload, __SUPERSECRET_KEYS.__HMACSHAKEY)
  const hUART = cjs.SHA512(UART).toString(cjs.enc.Base64)
  return { UART, hUART }
}

const simpleHash = async (txt, mode = 256, salting = 'nosalt') => {
  const salt =
  (salting === 'default')
    ? nanoid(8)
    : (salting === 'nosalt')
        ? ''
        : salting
  switch (mode) {
    case 224:
      return await ((salt === '') ? '' : salt + '.') + cjs.SHA224(txt + salt).toString()
    case 256:
      return await ((salt === '') ? '' : salt + '.') + cjs.SHA256(txt + salt).toString(cjs.enc.Base64)
    case 512:
      return await ((salt === '') ? '' : salt + '.') + cjs.SHA512(txt + salt).toString(cjs.enc.Base64)
    default:
      return -1
  }
}

const compareHash = async (txt, hash, mode = 224) => {
  const salt = (hash.split('.').length === 2) ? hash.split('.')[0] : ''
  const vhash = await simpleHash(txt, mode, salt)
  if (vhash === hash) return true
  return false
}

module.exports = {
  signThis,
  apply,
  signUART,
  simpleHash,
  compareHash,
  __SUPERSECRET_KEYS
}
