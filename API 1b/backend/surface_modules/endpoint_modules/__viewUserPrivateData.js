const signer = require('../../security_modules/js_signer')
const fire = require('../../security_modules/js_fire')
const sessionHandler = require('../../security_modules/js_sessionHandler')
const errorHandler = require('../../security_modules/js_errorHandler')

const __endMethod = async (req, h) => {
  const func = '__viewUserPrivateData'
  try {
    sessionHandler.isLegal(req, 'at')
    //
    const jsonAT = await sessionHandler.validateRequest(req)
    const hUsername = signer.simpleHash(jsonAT.username)
    const userPrivateData = await fire('userdata', hUsername).get('userPrivateData')
    const decryptedUserData = signer.simpleDecrypt(userPrivateData, jsonAT.activeSession)
    //
    return h.response({ status: 'success', data: decryptedUserData })
  } catch (e) {
    if (errorHandler.isInstancesOf(e)) {
      return h.response(e.readError()).code(502)
    } else return h.response({ status: 'unknown?', description: `At ${func}()` })
  }
}

module.exports = {
  __endMethod
}
