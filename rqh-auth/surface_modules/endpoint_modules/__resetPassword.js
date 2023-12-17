const signer = require('../../../security_modules/js_signer')
const fire = require('../../../security_modules/js_fire')
// const sessionHandler = require('../../../security_modules/js_sessionHandler')
const errorHandler = require('../../../security_modules/js_errorHandler')
const CKEYS = require('../../../security_modules/keys/key-constant.json')

const __endMethod = async (req, h) => {
  const func = '__requestResetPassword'
  const { credentials } = req.query
  try {
    const credentialsData = signer.apply(credentials, CKEYS.REQRESETPWD)
    const doc = fire('userdata', credentialsData.hUsername)
    const pswd = signer.simpleHash(credentialsData.requestPwd, 'default', 512)
    //
    await doc.write({ pswd }, { merge: true })
    //
    return h.response({ status: 'success', description: 'password updaed.' })
  } catch (e) {
    if (errorHandler.isInstancesOf(e)) return h.response(e.readError()).code(502)
    else h.response({ status: 'unknown?', description: `At ${func}()` })
  }
}

module.exports = {
  __endMethod
}
