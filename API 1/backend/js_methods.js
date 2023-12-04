const signer = require('./js_signer')
const APPKEY = require('./js_signer').__SUPERSECRET_KEYS.__APPDEFAULT
const TICKETKEY = require('./js_signer').__SUPERSECRET_KEYS.__TICKETREGS
const DBMANAGEDKEY = require('./js_signer').__SUPERSECRET_KEYS.__USERDBIDLE
const DEFHMACKEY = signer.__SUPERSECRET_KEYS.__HMACSHAKEY

const { nanoid } = require('nanoid')
const fire = require('./js_fire')

const __generateKey__ = async (size) => {
  let k = ''
  for (let i = 0; i < size; i++) {
    k += Math.floor(Math.random() * 10)
  }
  return k
}

const isLegal = (req) => {
  if (req.headers.appkey !== APPKEY) throw new signer.SignerError('isLegal', 'illegal')
  return true
}

const __default = async (req, h) => {
  return 1
}

/*
  RELATED ENDPOINT  : /build-vkey
  MAIN USAGE        : creating a verification key / token, sent to user's email address,
                      stored in Firestore
  PAYLOADS          : email (the user's email)
  RETURNS
    - {status: already-registered}
      the user is registered
    - {status: succes}
      the verification key is sent to the user's email
*/

const __buildvkey = async (req, h) => {
  const { email } = req.payload
  const key = await __generateKey__(7)
  const collectionRef = await fire('verifdata', await signer.simpleHash(email))
  if ((await collectionRef.get()).exists && await collectionRef.get('registered')) {
    return h.response({ status: 'already registered' })
  }
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

/*
  RELATED ENDPOINT  : /verify-vkey
  MAIN USAGE        : validating the user's input of the verification key with the
                      previously generated verification key (stored in Firestore)
  PAYLOADS          : email, vkey (the verification key)
  RETURNS
    - {status: not-exist}
      no token is avaiable pertaining to the email
    - {status: already-registered}
      the email has been taken for a registration
    - {status: expired}
      the verification code has expired
    - {status: verified}
      the verification code inputted is validated, giving user a registration ticket
    - {status: invalid}
      the verification code is invalid
*/

const __verifvkey = async (req, h) => {
  const { email, vkey } = req.payload
  const hashedEmail = await signer.simpleHash(email)
  const collectionRef = await fire('verifdata', hashedEmail)
  const isAvaibable = (await collectionRef.get()).exists

  if (!isAvaibable) return h.response({ status: 'not exist' })

  const collectionRefData = await collectionRef.get(['registered', 'tokenKey'])
  const isRegistered = collectionRefData.registered

  if (isRegistered) return h.response({ status: 'email taken' })

  try {
    signer.apply(collectionRefData.tokenKey, vkey)
    const ticket = await signer.signThis({ email }, TICKETKEY, 3600)
    return h.response({ status: 'verified', ticket })
  } catch (e) {
    return h.response(e.readError())
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
  RETURNS
    - {status: illegal}
      accessing with the illegal request
    - {status: signed}
      the user has been signed up
    - {status: expired}
      the ticket has expired
    - {status: used-email}
      using the already registered email
    - {status: used-username}
      using the already registered username
*/

const __signUser = async (req, h) => {
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
      return h.response({ status: 'email missing' })
    } else if (await verifDataRef.get('registered')) {
      return h.response({ status: 'used email' })
    } else if ((await userDataRef.get()).exists) {
      return h.response({ status: 'used username' })
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
    console.log(e)
    return h.response(e.readError())
  }
}

/*
  RELATED ENDPOINT  : /user-login
  MAIN USAGE        : logging in a user
  PAYLOADS          : username, password
  RETURNS
    - {status: illegal}
      accessing with the illegal request
    - {status: invalid}
      invalid username/password
    - {status: already-logged-in}
      the requested username has logged in
    - {status: logged-in}
      successfull logged in
*/

const __userLogin = async (req, h) => {
  try {
    isLegal(req)
    const { username, password } = req.payload

    const hUsrn = signer.simpleHash(username)
    const user = await fire('userdata', hUsrn)

    if (!(await user.get()).exists) {
      return h.response({ status: 'unrecognized' })
    }
    if (await user.get('activeSession') !== 'no-session') {
      return h.response({ status: 'already logged in' })
    }

    const isPswdMatch = signer.compareHash(password, await user.get('pswd'), 512)
    if (isPswdMatch) {
      const activeSession = nanoid(32)
      const hActiveSession = await signer.simpleHash(activeSession, 'default', 256)
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
    return h.response(e.readError())
  }
}

/*
  RELATED ENDPOINT  : /user-logout
  MAIN USAGE        : logging out a user
  PAYLOADS          : UART
  RETURNS
    - {status: illegal}
      accessing with the illegal request
    - {status: invalid/session-mismatch}
      corrupted UART
    - {status: already-logged-out}
      the requested username has logged out
    - {status: logged-out}
      successfully logged out
*/

const __userLogout = async (req, h) => {
  try {
    isLegal(req)
    const { UART } = req.payload
    const jsonUART = signer.applyUART(UART)
    const hUsername = signer.simpleHash(jsonUART.username)
    const collectionRef = await fire('userdata', hUsername)

    if (!(await collectionRef.get()).exists) {
      return h.response({ status: 'unreachable username' })
    }

    const collectionRefData = await collectionRef.get(['activeSession', 'email', 'userPrivateData'])
    const activeSession0 = jsonUART.activeSession
    const activeSession1 = collectionRefData.activeSession
    const eEmail = collectionRefData.email
    const eUserPrivateData = collectionRefData.userPrivateData

    if (await collectionRef.get('activeSession') === 'no-session') {
      return h.response({ status: 'already logged out' })
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
    return h.response(e.readError())
  }
}

/*
  RELATED ENDPOINT  : /user-updatepassword
  MAIN USAGE        : updating the user's password
  PAYLOADS          : UART, oldPassword, newPassword
  RETURNS
    - {status: illegal}
      accessing with the illegal request
    - {status: invalid}
      invalid UART
    - {status: already-logged-out}
      the requested username has logged out
    - {status: logged-out}
      successfully logged out
*/

const __userUpdatePassword = async (req, h) => {
  try {
    const { UART, oldPassword, newPassword } = req.payload
    const jsonUART = await signer.applyUART(UART)

    const hUsername = signer.simpleHash(jsonUART.username)
    const userDataRef = await fire('userdata', hUsername)
    const hPassword = await userDataRef.get('pswd')
    const hNewPassword = signer.simpleHash(newPassword, 'default', 512)

    signer.compareHash(oldPassword, hPassword, 512)

    userDataRef.write({ pswd: hNewPassword }, { merge: true })
    return h.response({ status: 'password-updated' })
  } catch (e) {
    return h.response(e.readError())
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
