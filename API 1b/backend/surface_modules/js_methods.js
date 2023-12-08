const signer = require('../security_modules/js_signer')
const fire = require('../security_modules/js_fire')
const sessionHandler = require('../security_modules/js_sessionHandler')
const {
  MethodsError,
  SignerError,
  FireError,
  SessionError
} = require('../security_modules/js_errorHandler')
const { nanoid } = require('nanoid')
// const mail = require('./js_mail')

const APPKEY = 'default-appkey'
const TICKETKEY = signer.__SUPERSECRET_KEYS.__TICKETREGS
const DBMANAGEDKEY = signer.__SUPERSECRET_KEYS.__USERDBIDLE

const isInstancesOf = (e) => {
  return (e instanceof MethodsError ||
     e instanceof SignerError ||
     e instanceof FireError ||
     e instanceof SessionError)
}
const __generateKey__ = (size) => {
  let k = ''
  for (let i = 0; i < size; i++) {
    k += Math.floor(Math.random() * 10)
  }
  return k
}

const isLegal = (__req, __tokenRequired = false) => {
  if ((__req.headers.appkey !== APPKEY)) throw new MethodsError('isLegal', 'illegal')
  if (__tokenRequired === 'rt' && __req.headers.rt === undefined) {
    throw new MethodsError('isLegal', 'illegal')
  }
  if (__tokenRequired === 'at' && __req.headers.at === undefined) {
    throw new MethodsError('isLegal', 'illegal')
  }
  return true
}

const __default = async (req, h) => {
  return 1
}

/*
  RELATED ENDPOINT  : /build-vkey (POST)
  MAIN USAGE        : creating a verification key / token, sent to user's email address,
                      stored in Firestore
  PAYLOADS          : email (the user's email)
*/

const __buildvkey = async (req, h) => {
  const func = '__buildvkey'
  try {
    isLegal(req)
    const { email } = req.payload
    const key = __generateKey__(7)
    const collectionRef = fire('verifdata', signer.simpleHash(email))
    //
    try {
      const registered = await collectionRef.get('registered')
      if (registered) {
        return h.response({ status: 'registeredEmail' })
      }
      throw new MethodsError(func, 'unknown')
    } catch (e) {
      console.log(key)
      // mail.mailVerificaionKey(email, key)
      await collectionRef.write({
        tokenKey: signer.signThis({ user: email }, key.toString(), 300),
        registered: false
      }, {})
      return h.response({
        status: 'success'
      })
    }
  } catch (e) {
    if (isInstancesOf(e)) {
      return h.response(e.readError()).code(502)
    } else return h.response({ status: 'unknown?', description: `At ${func}()` })
  }
}

/*
  RELATED ENDPOINT  : /verify-vkey (POST)
  MAIN USAGE        : validating the user's input of the verification key with the
                      previously generated verification key (stored in Firestore)
  PAYLOADS          : email, vkey (the verification key)
*/

const __verifvkey = async (req, h) => {
  const func = '__verifvkey'
  try {
    const { email, vkey } = req.payload
    const hashedEmail = signer.simpleHash(email)
    const collectionRef = fire('verifdata', hashedEmail)
    const collectionRefData = await collectionRef.get(['registered', 'tokenKey'])
    const isRegistered = collectionRefData.registered

    if (isRegistered) throw new MethodsError(func, 'registeredEmail')
    //
    signer.apply(collectionRefData.tokenKey, vkey)
    const ticket = signer.signThis({ email }, TICKETKEY, 3600)
    //
    return h.response({ status: 'verified', ticket })
  } catch (e) {
    if (isInstancesOf(e)) {
      return h.response(e.readError()).code(502)
    } else return h.response({ status: 'unknown?', description: `At ${func}()` })
  }
}

/*
  RELATED ENDPOINT  : /sign-user (POST)
  MAIN USAGE        : creating a User Authenticated Recognition Token (RT)
  PAYLOADS          :
    - email (the user's email)
    - username (the user's preferred username)
    - password (the user's password)
    - fullName (the user's full name)
    - id (the user's national ID number)
    - birth (the user's birth date)
    - ticket (the user's registration ticket)
*/

const __signUser = async (req, h) => {
  const func = '__signUser'
  const payloads = req.payload
  const hUsername = signer.simpleHash(payloads.username)
  const hEmail = signer.simpleHash(payloads.email)
  //
  try {
    isLegal(req)
    signer.apply(payloads.ticket, TICKETKEY)
    //
    const pswd = signer.simpleHash(payloads.password, 'default', 512)
    const userDataRef = fire('userdata', hUsername)
    const verifDataRef = fire('verifdata', hEmail)
    const isExistEmail = (await verifDataRef.get()).exists
    //
    if (!isExistEmail) {
      throw new MethodsError(func, 'corruptedEmail')
    } else if (await verifDataRef.get('registered')) {
      throw new MethodsError(func, 'registeredEmail')
    } else if ((await userDataRef.get()).exists) {
      throw new MethodsError(func, 'registeredUsername')
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
    if (isInstancesOf(e)) {
      return h.response(e.readError()).code(502)
    } else return h.response({ status: 'unknown?', description: `At ${func}()` })
  }
}

/*
  RELATED ENDPOINT  : /user-login
  MAIN USAGE        : logging in a user
  PAYLOADS          : username, password
*/

const __userLogin = async (req, h) => {
  const func = '__userLogin'
  //
  try {
    isLegal(req)
    const { username, password } = req.payload
    //
    const hUsrn = signer.simpleHash(username)
    const user = fire('userdata', hUsrn)
    //
    if (await user.get('activeSession') !== 'no-session') {
      throw new MethodsError(func, 'alreadyIn')
    }
    //
    signer.compareHash(password, await user.get('pswd'), 512)
    //
    const activeSession = nanoid(32)
    const hActiveSession = await signer.simpleHash(activeSession, 'default')
    const updatedUserPrivateData = await signer.cipherUpdateKey(
      await user.get('userPrivateData'),
      DBMANAGEDKEY,
      activeSession
    )
    const updatedEmail = await signer.cipherUpdateKey(
      await user.get('email'),
      DBMANAGEDKEY,
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
    if (isInstancesOf(e)) {
      return h.response(e.readError()).code(502)
    } else return h.response({ status: 'unknown?', description: `At ${func}()` })
  }
}

/*
  RELATED ENDPOINT  : /user-logout (GET)
  MAIN USAGE        : logging out a user
  PAYLOADS          : RT
*/

const __userLogout = async (req, h) => {
  const func = '__userLogout'
  //
  try {
    const AT = req.headers.at
    isLegal(req, 'at')
    await sessionHandler.validateRequest(AT)
    const jsonAT = sessionHandler.applyToken(AT)
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
    if (isInstancesOf(e)) {
      return h.response(e.readError()).code(502)
    } else return h.response({ status: 'unknown?', description: `At ${func}()` })
  }
}

/*
  RELATED ENDPOINT  : /user-updatepassword (POST)
  MAIN USAGE        : updating the user's password
  PAYLOADS          : oldPassword, newPassword
*/

const __userUpdatePassword = async (req, h) => {
  const func = '__userUpdatePassword'
  try {
    const AT = req.headers.at
    isLegal(req, 'at')
    const jsonAT = await sessionHandler.validateRequest(AT)
    const { oldPassword, newPassword } = req.payload
    const hUsername = signer.simpleHash(jsonAT.username)
    const userDataRef = await fire('userdata', hUsername)
    const hPassword = await userDataRef.get('pswd')
    const hNewPassword = signer.simpleHash(newPassword, 'default', 512)
    //
    signer.compareHash(oldPassword, hPassword, 512)
    //
    userDataRef.write({ pswd: hNewPassword }, { merge: true })
    return h.response({ status: 'password-updated' })
  } catch (e) {
    if (isInstancesOf(e)) {
      return h.response(e.readError()).code(502)
    } else return h.response({ status: 'unknown?', description: `At ${func}()` })
  }
}

const __viewUserPrivateData = async (req, h) => {
  const func = '__viewUserPrivateData'
  try {
    const AT = req.headers.at
    //
    isLegal(req, 'at')
    //
    const jsonAT = await sessionHandler.validateRequest(AT)
    const hUsername = signer.simpleHash(jsonAT.username)
    const userPrivateData = await fire('userdata', hUsername).get('userPrivateData')
    const decryptedUserData = signer.simpleDecrypt(userPrivateData, jsonAT.activeSession)
    //
    return h.response({ status: 'success', data: decryptedUserData })
  } catch (e) {
    if (isInstancesOf(e)) {
      return h.response(e.readError()).code(502)
    } else return h.response({ status: 'unknown?', description: `At ${func}()` })
  }
}

/*
  RELATED ENDPOINT  : /request-at (GET)
  MAIN USAGE        : getting Access Token (AT)
  PAYLOADS          : -
*/

const __requestAT = async (req, h) => {
  const RT = req.headers.rt
  try {
    isLegal(req, 'rt')
    return h.response({ AT: await sessionHandler.requestAT(RT) })
  } catch (e) {
    if (e instanceof MethodsError || e instanceof SignerError || e instanceof SessionError) {
      return h.response(e.readError()).code(502)
    } else return h.response({ status: 'unknown?' })
  }
}

module.exports = {
  default: __default,
  buildvkey: __buildvkey,
  verifvkey: __verifvkey,
  signUser: __signUser,
  userLogin: __userLogin,
  userLogout: __userLogout,
  viewUserPrivateData: __viewUserPrivateData,
  userUpdatePassword: __userUpdatePassword,
  requestAT: __requestAT
}
