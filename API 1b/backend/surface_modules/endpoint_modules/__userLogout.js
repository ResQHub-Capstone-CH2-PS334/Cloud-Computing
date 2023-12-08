const signer = require('../../security_modules/js_signer')
const fire = require('../../security_modules/js_fire')
const sessionHandler = require('../../security_modules/js_sessionHandler')
const errorHandler = require('../../security_modules/js_errorHandler')

const DBMANAGEDKEY = signer.__SUPERSECRET_KEYS.__USERDBIDLE

const __endMethod = async (req, h) => {
  const func = '__userLogout'
  //
  try {
    sessionHandler.isLegal(req, 'at')
    const jsonAT = await sessionHandler.validateRequest(req)
    const hUsername = signer.simpleHash(jsonAT.username)
    const collectionRef = fire('userdata', hUsername)
    const collectionRefData = await collectionRef.get(['activeSession', 'email', 'userPrivateData'])
    const activeSession0 = jsonAT.activeSession
    const eEmail = collectionRefData.email
    const eUserPrivateData = collectionRefData.userPrivateData
    //
    await collectionRef.write({
      userPrivateData: signer.cipherUpdateKey(
        eUserPrivateData,
        activeSession0,
        DBMANAGEDKEY
      ),
      email: signer.cipherUpdateKey(
        eEmail,
        activeSession0,
        DBMANAGEDKEY
      ),
      activeSession: 'no-session'
    }, { merge: true })

    return h.response({ status: 'logged-out' })
  } catch (e) {
    if (errorHandler.isInstancesOf(e)) {
      return h.response(e.readError()).code(502)
    } else return h.response({ status: 'unknown?', description: `At ${func}()` })
  }
}

module.exports = {
  __endMethod
}
