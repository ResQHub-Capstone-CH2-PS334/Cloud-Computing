const fire = require('./js_fire')
const signer = require('./js_signer')
const { SignerError, SessionError } = require('./js_errorHandler')
const HMACSHAKEY = '381n248392rnd71usuida92_29jfi3nf'

const signUART = (userPayload) => {
  return signer.signThis(userPayload, HMACSHAKEY)
}

const validateUART = async (UART) => {
  const func = 'validateUART'
  try {
    const validatedUART = signer.apply(UART, HMACSHAKEY)
    const hUARTUsername = signer.simpleHash(validatedUART.username)
    const UARTActiveSession = validatedUART.activeSession
    const userActiveSession = await fire('userdata', hUARTUsername).get('activeSession')

    if (UARTActiveSession === userActiveSession) {

    } else {
      throw new SessionError(func, 'activeSessionMismatch')
    }
  } catch (e) {
    if (e instanceof SignerError) throw e
    else throw new SessionError(func, 'unknown')
  }
}
