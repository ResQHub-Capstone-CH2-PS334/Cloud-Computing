const signer = require('../../../security_modules/js_signer')
const fire = require('../../../security_modules/js_fire')
const sessionHandler = require('../../../security_modules/js_sessionHandler')
const errorHandler = require('../../../security_modules/js_errorHandler')
const CKEYS = require('../../../security_modules/keys/key-constant.json')
const mail = require('../js_mail')

// ********* UNDER BASH COMMAND INFLUENCE *********
// ********* DO NOT MODIFY! ***********************
const apiURL = '%%BASH%%:RQH_PUBLIC_URL'
// ************************************************

const __endMethod = async (req, h) => {
  const resetPasswordURL = `${apiURL}/reset-password`
  const func = '__requestResetPassword'
  const { requestPwd, state = 'loggedIn' } = req.payload
  try {
    let activeSession = 0
    let hUsername = 0
    if (state === 'loggedIn') {
      sessionHandler.isLegal(req, 'at')
      const jsonAT = await sessionHandler.validateRequest(req)
      activeSession = jsonAT.activeSession
      hUsername = signer.simpleHash(jsonAT.username)
    } else if (state === 'loggedOut') {
      sessionHandler.isLegal(req)
      const { username } = req.payload
      hUsername = signer.simpleHash(username)
    }
    const doc = fire('userdata', hUsername)
    const reqToken = signer.signThis({ hUsername, requestPwd }, CKEYS.REQRESETPWD, 300)
    const encEmail = await doc.get('email')
    const decEmail = signer.simpleDecrypt(
      encEmail,
      activeSession === 0 ? CKEYS.DBMANAGEDKEY : activeSession
    )
    // console.log('This token: ', reqToken)
    // console.log('Will be sent to: ', decEmail)
    // console.log('URL', resetPasswordURL + '?credentials=' + reqToken)
    mail.mailPasswordCredentials(decEmail, resetPasswordURL + '?credentials=' + reqToken)
    return h.response({ status: 'requested' })
  } catch (e) {
    if (errorHandler.isInstancesOf(e)) return h.response(e.readError()).code(502)
    else h.response({ status: 'unknown?', description: `At ${func}()` })
  }
}

module.exports = {
  __endMethod
}
