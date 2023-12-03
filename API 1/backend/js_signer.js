const cjs = require('crypto-js')
const { nanoid } = require('nanoid')

const __SUPERSECRET_KEYS = {
  __TOKENCRYPT: 'kcTRA7prpdN_plYmoZHz1L7V6N1lP61t',
  __APPDEFAULT: '82jf72oen3_283yy716jchZ7238h1946',
  __HMACSHAKEY: '381n248392rnd71usuida92_29jfi3nf',
  __TICKETREGS: 'n3p283jcos83_unid8271998?i2j3847',
  __USERDBIDLE: 'poru489r2--23?jdf893298c2898r2i3'
}

const safeB64 = (__mode, __input) => {
  if (__mode === 'enc') {
    return btoa(__input).replace('/', '_').replace('+', '-')
  }
  if (__mode === 'dec') {
    return atob(__input.replace('-', '+').replace('/', '-'))
  }
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

const signUART = async (userPayload) => {
  return await signThis(userPayload, __SUPERSECRET_KEYS.__HMACSHAKEY)
}

const applyUART = async (UART) => {
  return await apply(UART, __SUPERSECRET_KEYS.__HMACSHAKEY)
}
const simpleHash = async (__txt, mode = 256, salting = 'nosalt') => {
  const salt =
  (salting === 'default')
    ? nanoid(8)
    : (salting === 'nosalt')
        ? ''
        : salting
  switch (mode) {
    case 224:
      return safeB64(
        'enc',
        ((salt === '') ? '' : salt + '.') + cjs.SHA224(__txt + salt).toString()
      )
    case 256:
      return safeB64(
        'enc',
        ((salt === '') ? '' : salt + '.') + cjs.SHA256(__txt + salt).toString(cjs.enc.Base64)
      )
    case 512:
      return safeB64(
        'enc',
        ((salt === '') ? '' : salt + '.') + cjs.SHA512(__txt + salt).toString(cjs.enc.Base64)
      )
    default:
      return -1
  }
}

const compareHash = async (__txt, __hash, mode = 224) => {
  const hash = safeB64('dec', __hash)
  const salt = (hash.split('.').length === 2) ? hash.split('.')[0] : ''
  const vhash = safeB64('dec', await simpleHash(__txt, mode, salt))
  if (vhash === hash) return true
  return false
}

const simpleEncrypt = async (__plain, __pwd) => {
  return cjs.AES.encrypt(btoa(
    (typeof __plain === 'object') ? JSON.stringify(__plain) : __plain
  ), __pwd).toString()
}

const simpleDecrypt = async (__cipher, __pwd) => {
  return atob(cjs.AES.decrypt(__cipher, __pwd).toString(cjs.enc.Utf8))
}

const cipherUpdateKey = async (__cipher, __oldKey, __newKey) => {
  const decrypted = await cjs.AES.decrypt(__cipher, __oldKey).toString(cjs.enc.Utf8)
  const encrypted = await cjs.AES.encrypt(decrypted, __newKey).toString()
  return encrypted
}
module.exports = {
  signThis,
  apply,
  signUART,
  applyUART,
  simpleHash,
  compareHash,
  simpleEncrypt,
  simpleDecrypt,
  cipherUpdateKey,
  __SUPERSECRET_KEYS
}
