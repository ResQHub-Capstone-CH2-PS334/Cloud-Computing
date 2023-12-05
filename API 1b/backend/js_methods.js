const signer = require('./js_signer')
const APPKEY = signer.__SUPERSECRET_KEYS.__APPDEFAULT
const TICKETKEY = signer.__SUPERSECRET_KEYS.__TICKETREGS
const DBMANAGEDKEY = signer.__SUPERSECRET_KEYS.__USERDBIDLE
// const DEFHMACKEY = signer.__SUPERSECRET_KEYS.__HMACSHAKEY
const { nanoid } = require('nanoid')
const fire = require('./js_fire')
const { MethodsError, SignerError, FireError } = require('./js_errorHandler')

const __generateKey__ = (size) => {
  let k = ''
  for (let i = 0; i < size; i++) {
    k += Math.floor(Math.random() * 10)
  }
  return k
}

const isLegal = (req) => {
  if (req.headers.appkey !== APPKEY) throw new MethodsError('isLegal', 'illegal')
  return true
}

const isLegalAccess = (req) => {
  if (req.headers.appkeyBridge !== 'bridge' + APPKEY) {
    throw new MethodsError('isLegal', 'not illegal, but give access to')
  }
}

const __default = async (req, h) => {
  return 1
}

/*
  RELATED ENDPOINT  : /build-vkey
  MAIN USAGE        : creating a verification key / token, sent to user's email address,
                      stored in Firestore
  PAYLOADS          : email (the user's email)
*/

const __buildvkey = async (req, h) => {
  const func = __buildvkey
  try {
    isLegal(req)
    const { email } = req.payload
    const key = __generateKey__(7)
    const collectionRef = fire('verifdata', signer.simpleHash(email))

    try {
      await collectionRef.get('registeredEmail')
      throw new MethodsError(func, 'registeredEmail')
    } catch (e) {
      console.log(key)
      // __mail__(email, key)
      await collectionRef.write({
        tokenKey: signer.signThis({ user: email }, key.toString(), 30),
        registered: false
      }, {})
      return h.response({
        status: 'success'
      })
    }
  } catch (e) {
    if (e instanceof MethodsError || e instanceof SignerError || e instanceof FireError) {
      return h.response(e.readError()).code(502)
    } else return h.response({ status: 'unknown?', message: e })
  }
}

/*
  RELATED ENDPOINT  : /verify-vkey
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
    signer.apply(collectionRefData.tokenKey, vkey)
    const ticket = signer.signThis({ email }, TICKETKEY, 3600)

    return h.response({ status: 'verified', ticket })
  } catch (e) {
    if (e instanceof MethodsError || e instanceof SignerError) {
      return h.response(e.readError()).code(502)
    } else return h.response({ status: 'unknown?' })
  }
}

/*
  RELATED ENDPOINT  : /sign-user
  MAIN USAGE        : creating a User Authenticated Recognition Token (UART)
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

  try {
    isLegal(req)
    signer.apply(payloads.ticket, TICKETKEY)

    const pswd = signer.simpleHash(payloads.password, 'default', 512)
    const userDataRef = await fire('userdata', hUsername)
    const verifDataRef = await fire('verifdata', hEmail) // registered
    const isExistEmail = (await verifDataRef.get()).exists

    if (!isExistEmail) {
      throw new MethodsError(func, 'corruptedEmail')
    } else if (await verifDataRef.get('registered')) {
      throw new MethodsError(func, 'registeredEmail')
    } else if ((await userDataRef.get()).exists) {
      throw new MethodsError(func, 'registeredUsername')
    }

    const activeSession = nanoid(32)
    const encryptedEmail = signer.simpleEncrypt(payloads.email, activeSession)
    const userPrivateData = signer.simpleEncrypt({
      fuln: payloads.fullName,
      id: payloads.id,
      brth: payloads.birth
    }, activeSession)
    const UART = signer.signUART({
      username: payloads.username,
      activeSession
    })
    const write = {
      userPrivateData,
      pswd,
      activeSession: signer.simpleHash(activeSession, 'default'),
      email: encryptedEmail
    }

    await userDataRef.write(write, { merge: true })
    await verifDataRef.write({ registered: true })
    await verifDataRef.delete('tokenKey')
    console.log(activeSession)

    return h.response({ status: 'signed', UART })
  } catch (e) {
    if (e instanceof MethodsError || e instanceof SignerError) {
      return h.response(e.readError()).code(502)
    } else return h.response({ status: 'unknown?' })
  }
}

/*
  RELATED ENDPOINT  : /user-login
  MAIN USAGE        : logging in a user
  PAYLOADS          : username, password
*/

const __userLogin = async (req, h) => {
  const func = '__userLogin'

  try {
    isLegal(req)
    const { username, password } = req.payload

    const hUsrn = signer.simpleHash(username)
    const user = await fire('userdata', hUsrn)

    if (!(await user.get()).exists) {
      throw new MethodsError(func, 'unrecognized')
    }
    if (await user.get('activeSession') !== 'no-session') {
      throw new MethodsError(func, 'alreadyIn')
    }

    const isPswdMatch = signer.compareHash(password, await user.get('pswd'), 512)
    if (isPswdMatch) {
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

      user.write({ userPrivateData: updatedUserPrivateData }, { merge: true })
      user.write({ activeSession: hActiveSession }, { merge: true })
      user.write({ email: updatedEmail }, { merge: true })

      console.log(activeSession)
      const UART = await signer.signUART({ username, activeSession })
      return h.response({ status: 'logged in', UART })
    }
  } catch (e) {
    if (e instanceof MethodsError || e instanceof SignerError) {
      return h.response(e.readError()).code(502)
    } else return h.response({ status: 'unknown?' })
  }
}

/*
  RELATED ENDPOINT  : /user-logout
  MAIN USAGE        : logging out a user
  PAYLOADS          : UART
*/

const __userLogout = async (req, h) => {
  const func = '__userLogout'
  try {
    isLegal(req)
    const { UART } = req.payload
    const jsonUART = signer.applyUART(UART)
    const hUsername = signer.simpleHash(jsonUART.username)
    const collectionRef = await fire('userdata', hUsername)

    if (!(await collectionRef.get()).exists) {
      throw new MethodsError(func, 'unrecognized')
    }

    const collectionRefData = await collectionRef.get(['activeSession', 'email', 'userPrivateData'])
    const activeSession0 = jsonUART.activeSession
    const activeSession1 = collectionRefData.activeSession
    const eEmail = collectionRefData.email
    const eUserPrivateData = collectionRefData.userPrivateData

    if (await collectionRef.get('activeSession') === 'no-session') {
      throw new MethodsError(func, 'alreadyOut')
    }

    signer.compareHash(activeSession0, activeSession1)

    await collectionRef.write({
      activeSession: 'no-session'
    }, { merge: true })
    await collectionRef.write({
      userPrivateData: await signer.cipherUpdateKey(
        eUserPrivateData,
        activeSession0,
        DBMANAGEDKEY
      )
    }, { merge: true })
    await collectionRef.write({
      email: await signer.cipherUpdateKey(
        eEmail,
        activeSession0,
        DBMANAGEDKEY
      )
    }, { merge: true })

    return h.response({ status: 'logged-out' })
  } catch (e) {
    if (e instanceof MethodsError || e instanceof SignerError) {
      return h.response(e.readError()).code(502)
    } else return h.response({ status: 'unknown?' })
  }
}

/*
  RELATED ENDPOINT  : /user-updatepassword
  MAIN USAGE        : updating the user's password
  PAYLOADS          : UART, oldPassword, newPassword
*/

const __userUpdatePassword = async (req, h) => {
  // const func = '__userUpdatePassword'
  try {
    isLegal(req)
    const { UART, oldPassword, newPassword } = req.payload
    const jsonUART = signer.applyUART(UART)

    const hUsername = signer.simpleHash(jsonUART.username)
    const userDataRef = await fire('userdata', hUsername)
    const hPassword = await userDataRef.get('pswd')
    const hNewPassword = signer.simpleHash(newPassword, 'default', 512)

    signer.compareHash(oldPassword, hPassword, 512)

    userDataRef.write({ pswd: hNewPassword }, { merge: true })
    return h.response({ status: 'password-updated' })
  } catch (e) {
    if (e instanceof MethodsError || e instanceof SignerError) {
      return h.response(e.readError()).code(502)
    } else return h.response({ status: 'unknown?' })
  }
}

const __viewUserPrivateData = async (req, h) => {
  try {
    const { UART } = req.payload
    const jsonUART = signer.applyUART(UART)
    console.log(jsonUART)
    const collectionRef = await fire('userdata', signer.simpleHash(jsonUART.username))
    if (
      !await signer.compareHash(
        jsonUART.activeSession,
        await collectionRef.get('activeSession')
      )
    ) {
      return h.response({ status: 'invalid' })
    }
    return h.response(await signer.simpleDecrypt(await collectionRef.get('userPrivateData'), jsonUART.activeSession))
  } catch (e) {
    return h.response(e.readError())
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
  userUpdatePassword: __userUpdatePassword
}
