const fire = require('./js_fire')
const signer = require('./js_signer')
const { SignerError, SessionError } = require('./js_errorHandler')
const HMACSHAKEY = '381n248392rnd71usuida92_29jfi3nf'

const signUART = (userPayload) => {
  return signer.signThis(userPayload, HMACSHAKEY)
}

const requestBridge = async (UART) => {
  const func = 'requestBridge'
  try {
    const validatedUART = signer.apply(UART, HMACSHAKEY)
    const username = validatedUART.username
    const bridgeToken = signer.signThis({ username }, HMACSHAKEY, 10)
    return bridgeToken
  } catch (e) {
    if (e instanceof SessionError) throw e
    else throw new SessionError(func, 'unknown')
  }
}

const validateUART = async (UART) => {
  const func = 'validateUART'
  try {
    const validatedUART = signer.apply(UART, HMACSHAKEY)
    const hUARTUsername = signer.simpleHash(validatedUART.username)
    const UARTActiveSession = validatedUART.activeSession
    const userActiveSession = await fire('userdata', hUARTUsername).get('activeSession')
    const hUserActiveSession = signer.simpleHash(userActiveSession, 'default')

    signer.compareHash(UARTActiveSession, hUserActiveSession)

    return true
  } catch (e) {
    if (e instanceof SignerError) throw e
    else throw new SessionError(func, 'unknown')
  }
}
module.exports = {
  validateUART,
  requestBridge
}
