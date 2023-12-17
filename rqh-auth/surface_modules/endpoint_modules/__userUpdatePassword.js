const signer = require('../../../security_modules/js_signer')
const fire = require('../../../security_modules/js_fire')
const sessionHandler = require('../../../security_modules/js_sessionHandler')
const errorHandler = require('../../../security_modules/js_errorHandler')

const __endMethod = async (req, h) => {
  const func = '__userUpdatePassword'
  try {
    sessionHandler.isLegal(req, 'at')
    const jsonAT = await sessionHandler.validateRequest(req)
    const { oldPassword, newPassword } = req.payload
    const hUsername = signer.simpleHash(jsonAT.username)
    const userDataRef = await fire('userdata', hUsername)
    const hPassword = await userDataRef.get('pswd')
    const hNewPassword = signer.simpleHash(newPassword, 'default', 512)
    //
    signer.compareHash(oldPassword, hPassword, 512)
    //
    userDataRef.write({ pswd: hNewPassword }, { merge: true })
    return h.response({ status: 'password updated' })
  } catch (e) {
    if (errorHandler.isInstancesOf(e)) {
      return h.response(e.readError()).code(502)
    } else return h.response({ status: 'unknown?', description: `At ${func}()` })
  }
}

module.exports = {
  __endMethod
}
