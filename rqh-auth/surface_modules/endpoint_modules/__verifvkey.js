const signer = require('../../../security_modules/js_signer')
const fire = require('../../../security_modules/js_fire')
const sessionHandler = require('../../../security_modules/js_sessionHandler')
const errorHandler = require('../../../security_modules/js_errorHandler')
const CKEYS = require('../../../security_modules/keys/key-constant.json')

const __endMethod = async (req, h) => {
  const func = '__verifvkey'
  try {
    sessionHandler.isLegal(req)
    const { email, vkey } = req.payload
    const hashedEmail = signer.simpleHash(email)
    const collectionRef = fire('verifdata', hashedEmail)
    const collectionRefData = await collectionRef.get(['registered', 'tokenKey'])
    const isRegistered = collectionRefData.registered

    if (isRegistered) throw new errorHandler.MethodsError(func, 'registeredEmail')
    //
    signer.apply(collectionRefData.tokenKey, vkey)
    const ticket = signer.signThis({ email }, CKEYS.TICKETREGS, 3600)
    //
    return h.response({ status: 'verified', ticket })
  } catch (e) {
    if (errorHandler.isInstancesOf(e)) {
      return h.response(e.readError()).code(502)
    } else return h.response({ status: 'unknown?', description: `At ${func}()` })
  }
}

module.exports = {
  __endMethod
}
