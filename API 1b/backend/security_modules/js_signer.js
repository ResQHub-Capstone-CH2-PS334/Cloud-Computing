const cjs = require('crypto-js')
const { SignerError } = require('./js_errorHandler')
const { nanoid } = require('nanoid')
const __SUPERSECRET_KEYS = {
  __TOKENCRYPT: 'kcTRA7prpdN_plYmoZHz1L7V6N1lP61t',
  __APPDEFAULT: '82jf72oen3_283yy716jchZ7238h1946',
  __HMACSHAKEY: '381n248392rnd71usuida92_29jfi3nf',
  __TICKETREGS: 'n3p283jcos83_unid8271998?i2j3847',
  __USERDBIDLE: 'poru489r2--23?jdf893298c2898r2i3'
}

const TOKENCRYPT = 'kcTRA7prpdN_plYmoZHz1L7V6N1lP61t'

const safeB64 = (__mode, __input) => {
  if (__mode === 'enc') {
    return btoa(__input).replace('/', '_').replace('+', '-')
  }
  if (__mode === 'dec') {
    return atob(__input.replace('-', '+').replace('/', '-'))
  }
}

const signThis = (__jsonData, __key, __duration = null) => {
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

const apply = (__encryptedToken, __key) => {
  const func = 'apply'
  try {
    const initiator = __encryptedToken.slice(0, 7)
    const token = __encryptedToken.slice(7)
    //
    if (initiator !== 'resqhub') throw new SignerError(func, 'foreign')
    //
    const decryptedToken = cjs.AES.decrypt(token, TOKENCRYPT).toString(cjs.enc.Utf8).split(':')
    const salt = decryptedToken[2]
    const comparedSignature = cjs.HmacSHA256(decryptedToken[0], __key + salt).toString()
    //
    if (comparedSignature === decryptedToken[1]) {
      const jsonData = JSON.parse(atob(decryptedToken[0]))
      if (jsonData.eat < Math.round(new Date().getTime() / 1000) &&
      jsonData.eat !== null) throw new SignerError(func, 'expired')
      return jsonData
    } else throw new SignerError(func, 'invalid')
  } catch (e) {
    if (e instanceof SignerError) throw e
    else throw new SignerError(func, 'invalid')
  }
}

const simpleHash = (__txt, salting = 'nosalt', mode = 256) => {
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

const compareHash = (__txt, __hash, mode = 256) => {
  const hash = safeB64('dec', __hash)
  const salt = (hash.split('.').length === 2) ? hash.split('.')[0] : ''
  const vhash = safeB64('dec', simpleHash(__txt, salt, mode))
  const func = 'compareHash'
  //
  try {
    if (vhash === hash) return true
    throw new SignerError(func, 'mismatch')
  } catch (e) {
    if (e instanceof SignerError) throw e
    else throw new SignerError(func, 'unknown')
  }
}

const simpleEncrypt = (__plain, __pwd) => {
  const func = 'simpleEncrypt'
  try {
    const data = (typeof __plain === 'object') ? JSON.stringify(__plain) : __plain
    const encrypted = cjs.AES.encrypt(btoa(data), __pwd).toString()
    return encrypted
  } catch (e) {
    if (e instanceof SignerError) throw e
    else throw new SignerError(func, 'unknown')
  }
}

const simpleDecrypt = (__cipher, __pwd) => {
  const func = 'simpleDecrypt'
  try {
    const decrypted = atob(cjs.AES.decrypt(__cipher, __pwd).toString(cjs.enc.Utf8))
    return decrypted
  } catch (e) {
    if (e instanceof SignerError) throw e
    else throw new SignerError(func, 'unknown')
  }
}

const cipherUpdateKey = (__cipher, __oldKey, __newKey) => {
  const decrypted = cjs.AES.decrypt(__cipher, __oldKey).toString(cjs.enc.Utf8)
  const encrypted = cjs.AES.encrypt(decrypted, __newKey).toString()
  return encrypted
}

module.exports = {
  SignerError,
  signThis,
  apply,
  simpleHash,
  compareHash,
  simpleEncrypt,
  simpleDecrypt,
  cipherUpdateKey,
  __SUPERSECRET_KEYS
}
