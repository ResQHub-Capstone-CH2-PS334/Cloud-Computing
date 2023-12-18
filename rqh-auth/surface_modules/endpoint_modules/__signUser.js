const signer = require('../../../security_modules/js_signer')
const fire = require('../../../security_modules/js_fire')
const sessionHandler = require('../../../security_modules/js_sessionHandler')
const errorHandler = require('../../../security_modules/js_errorHandler')
const CKEYS = require('../../../security_modules/keys/key-constant.json')
const { nanoid } = require('nanoid')

const __endMethod = async (req, h) => {
  const func = '__signUser'
  const payloads = req.payload
  const hUsername = signer.simpleHash(payloads.username)
  const hEmail = signer.simpleHash(payloads.email)
  //
  try {
    sessionHandler.isLegal(req)
    const relatedEmail = signer.apply(payloads.ticket, CKEYS.TICKETREGS)
    if (relatedEmail.email !== payloads.email) {
      throw new errorHandler.MethodsError(func, 'leak')
    }
    //
    const pswd = signer.simpleHash(payloads.password, 'default', 512)
    const userDataRef = fire('userdata', hUsername)
    const verifDataRef = fire('verifdata', hEmail)
    const isExistEmail = (await verifDataRef.get()).exists
    //
    if (!isExistEmail) {
      throw new errorHandler.MethodsError(func, 'corruptedEmail')
    } else if (await verifDataRef.get('registered')) {
      throw new errorHandler.MethodsError(func, 'registeredEmail')
    } else if ((await userDataRef.get()).exists) {
      throw new errorHandler.MethodsError(func, 'registeredUsername')
    }
    //
    const activeSession = nanoid(32)
    const encryptedEmail = signer.simpleEncrypt(payloads.email, activeSession)
    const userPrivateData = signer.simpleEncrypt({
      fuln: payloads.fullName,
      id: payloads.id,
      brth: payloads.birth
    }, activeSession)
    const RT = sessionHandler.signToken({
      username: payloads.username,
      activeSession,
      type: 'rt'
    })
    const write = {
      userPrivateData,
      pswd,
      activeSession: signer.simpleHash(activeSession, 'default'),
      email: encryptedEmail
    }
    //
    await userDataRef.write(write, { merge: true })
    await verifDataRef.write({ registered: true }, { merge: true })
    await verifDataRef.delete('tokenKey')
    console.log(activeSession)
    //
    return h.response({ status: 'signed', RT })
  } catch (e) {
    if (errorHandler.isInstancesOf(e)) {
      return h.response(e.readError()).code(502)
    } else return h.response({ status: 'unknown?', description: `At ${func}()` })
  }
}

module.exports = {
  __endMethod
}
