const fire = require('./js_fire')
const signer = require('./js_signer')
const { SignerError, SessionError } = require('./js_errorHandler')
const HMACSHAKEY = '381n248392rnd71usuida92_29jfi3nf'
const APPKEY = 'default-appkey'

const isLegal = (__req, __tokenRequired = false) => {
  const func = 'isLegal'
  if ((__req.headers.appkey !== APPKEY)) throw new SessionError(func, 'illegal')
  if (__tokenRequired === 'rt' && __req.headers.rt === undefined) {
    throw new SessionError(func, 'illegal')
  }
  if (__tokenRequired === 'at' && __req.headers.at === undefined) {
    throw new SessionError(func, 'illegal')
  }
  return true
}

const isInstancesOf = (e) => {
  return (e instanceof SignerError ||
    e instanceof SessionError)
}

const signToken = (__payload, __duration = null) => {
  return signer.signThis(__payload, HMACSHAKEY, __duration)
}

const applyToken = (__token) => {
  return signer.apply(__token, HMACSHAKEY)
}

const sessionChecker = async (__token, __expectedType) => {
  const func = 'sessionChecker'
  try {
    const jsonToken = applyToken(__token)
    if (jsonToken.type !== __expectedType) throw new SessionError(func, 'wrongType')
    //
    const hTokenUsername = signer.simpleHash(jsonToken.username)
    const TokenActiveSession = jsonToken.activeSession
    const userActiveSession = await fire('userdata', hTokenUsername).get('activeSession')
    //
    signer.compareHash(TokenActiveSession, userActiveSession)
    //
    return true
  } catch (e) {
    if (isInstancesOf(e)) throw e
    else throw new SessionError(func, 'unknown')
  }
}

const requestAT = async (__RT) => {
  const func = 'requestAT'
  try {
    await sessionChecker(__RT, 'rt')
    const validatedRT = applyToken(__RT)
    const AT = signToken({
      username: validatedRT.username,
      activeSession: validatedRT.activeSession,
      type: 'at'
    }, 300)
    return AT
  } catch (e) {
    if (isInstancesOf(e)) throw e
    else throw new SessionError(func, 'unknown')
  }
}

const validateRequest = async (__req) => {
  const func = 'validateRequest'
  try {
    const AT = applyToken(__req.headers.at)
    await sessionChecker(AT, 'at')
    return AT
  } catch (e) {
    if (isInstancesOf(e)) throw e
    else throw new SessionError(func, 'unknown')
  }
}

module.exports = {
  isLegal,
  requestAT,
  signToken,
  applyToken,
  validateRequest
}