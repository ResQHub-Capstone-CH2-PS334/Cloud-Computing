const signer = require('../../../security_modules/js_signer')
const fire = require('../../../security_modules/js_fire')
const sessionHandler = require('../../../security_modules/js_sessionHandler')
const errorHandler = require('../../../security_modules/js_errorHandler')
const CKEYS = require('../../../security_modules/keys/constant-keys.json')
const { nanoid } = require('nanoid')

const __endMethod = async (req, h) => {
  const func = '__userLogin'
  //
  try {
    sessionHandler.isLegal(req)
    const { username, password } = req.payload
    //
    const hUsrn = signer.simpleHash(username)
    const user = fire('userdata', hUsrn)
    //
    if (await user.get('activeSession') !== 'no-session') {
      throw new errorHandler.MethodsError(func, 'alreadyIn')
    }
    //
    signer.compareHash(password, await user.get('pswd'), 512)
    //
    const activeSession = nanoid(32)
    const hActiveSession = await signer.simpleHash(activeSession, 'default')
    const updatedUserPrivateData = await signer.cipherUpdateKey(
      await user.get('userPrivateData'),
      CKEYS.DBMANAGEDKEY,
      activeSession
    )
    const updatedEmail = await signer.cipherUpdateKey(
      await user.get('email'),
      CKEYS.DBMANAGEDKEY,
      activeSession
    )
    //
    user.write({
      userPrivateData: updatedUserPrivateData,
      activeSession: hActiveSession,
      email: updatedEmail
    }, { merge: true })
    //
    console.log(activeSession)
    const RT = sessionHandler.signToken({ username, activeSession, type: 'rt' })
    return h.response({ status: 'logged in', RT })
  } catch (e) {
    if (errorHandler.isInstancesOf(e)) {
      return h.response(e.readError()).code(502)
    } else return h.response({ status: 'unknown?', description: `At ${func}()` })
  }
}

module.exports = {
  __endMethod
}
