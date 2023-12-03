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
  const collectionRef = await fire('verifdata', await signer.simpleHash(email, 256))
  if ((await collectionRef.get()).exists && await collectionRef.get('registered')) {
    return h.response({ status: 'already-registered' })
  }
  console.log(key)
  // __mail__(email, key)
  await collectionRef.write({
    tokenKey: await signer.signThis({ user: email }, key.toString(), 15),
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
  const hashedEmail = await signer.simpleHash(email, 256)
  const collectionRef = await fire('verifdata', hashedEmail)
  const isAvaibable = (await collectionRef.get()).exists

  if (!isAvaibable) { return h.response({ status: 'not-exist' }) }
  if (await collectionRef.get('registered')) {
    return h.response({ status: 'email-taken' })
  }

  const apply = await signer.apply(await collectionRef.get('tokenKey'), vkey)
  const ticket = await signer.signThis({ email }, TICKETKEY, 3600)

  switch (apply.status) {
    case 'expired':
      return h.response({ status: 'expired' })
    case 'authenticated':
      return h.response({ status: 'verified', ticket })
    default:
      return h.response({ status: 'invalid' })
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
  if (req.headers.appkey !== APPKEY) {
    return h.response({ status: 'illegal' })
  }

  const payloads = req.payload
  const hUsername = await signer.simpleHash(payloads.username, 256)
  const hEmail = await signer.simpleHash(payloads.email, 256)
  const ticket = await signer.apply(payloads.ticket, TICKETKEY)

  if (ticket.status !== 'authenticated' || payloads.email !== ticket.data.email) {
    return h.response({
      status: (ticket.status === 'expired') ? 'expired' : 'invalid'
    })
  }

  const pswd = await signer.simpleHash(payloads.password, 512, 'default')
  const userDataRef = await fire('userdata', hUsername)
  const verifDataRef = await fire('verifdata', hEmail)

  if (await verifDataRef.get('registered')) {
    return h.response({ status: 'used-email' })
  } else if ((await userDataRef.get()).exists) {
    return h.response({ status: 'used-username' })
  }

  const activeSession = nanoid(32)
  const encryptedEmail = await signer.simpleEncrypt(payloads.email, activeSession)
  const userPrivateData = await signer.simpleEncrypt({
    fuln: payloads.fullName,
    id: payloads.id,
    brth: payloads.birth
  }, activeSession)
  const UART = await signer.signUART({
    username: payloads.username,
    activeSession
  })
  const write = {
    userPrivateData,
    pswd,
    activeSession: await signer.simpleHash(activeSession, 256, 'default'),
    email: encryptedEmail
  }

  await userDataRef.write(write, { merge: true })
  await verifDataRef.write({ registered: true })
  await verifDataRef.delete('tokenKey')
  console.log(activeSession)

  return h.response({ status: 'signed', UART })
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
  if (req.headers.appkey !== APPKEY) {
    return h.response({ status: 'illegal' })
  }
  const { username, password } = req.payload

  const hUsrn = await signer.simpleHash(username, 256)
  const user = await fire('userdata', hUsrn)

  if (!(await user.get()).exists) {
    return h.response({ status: 'invalid' })
  }
  if (await user.get('activeSession') !== 'no-session') {
    return h.response({ status: 'already-logged-in' })
  }

  const isPswdMatch = await signer.compareHash(password, await user.get('pswd'), 512, 'default')
  if (isPswdMatch) {
    const activeSession = nanoid(32)
    const hActiveSession = await signer.simpleHash(activeSession, 256, 'default')
    const updatedUserPrivateData = await signer.cipherUpdateKey(
      user.get('userPrivateData'),
      DBMANAGEDKEY,
      activeSession
    )

    user.write({ userPrivateData: updatedUserPrivateData }, { merge: true })
    user.write({ activeSession: hActiveSession }, { merge: true })

    console.log(activeSession)
    const UART = await signer.signUART({ username, activeSession })
    return h.response({ status: 'logged-in', UART })
  }
  return h.response({ status: 'invalid' })
}

/*
  RELATED ENDPOINT  : /user-logout
  MAIN USAGE        : logging out a user
  PAYLOADS          : UART
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

const __userLogout = async (req, h) => {
  if (req.headers.appkey !== APPKEY) {
    return h.response({ status: 'illegal' })
  }

  const { UART } = req.payload
  const jsonUART = await signer.applyUART(UART)
  const hUsername = await signer.simpleHash(jsonUART.data.username, 256)
  const collectionRef = await fire('userdata', hUsername)
  const activeSession0 = jsonUART.data.activeSession
  const activeSession1 = await collectionRef.get('activeSession')
  const eEmail = await collectionRef.get('email')
  const eUserPrivateData = await collectionRef.get('userPrivateData')

  if (jsonUART.status !== 'authenticated') {
    h.response({ status: 'invalid' })
  }
  if (await collectionRef.get('activeSession') === 'no-session') {
    return h.response({ status: 'already-logged-out' })
  }
  if (!(await signer.compareHash(activeSession0, activeSession1, 256))) {
    return h.response({ status: 'session-mismatch' })
  }

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
}

const __userUpdatePassword = async (req, h) => {

}

const __viewUserPrivateData = async (req, h) => {
  const { UART } = req.payload
  const jsonUART = await signer.apply(UART, DEFHMACKEY)
  if (jsonUART.status !== 'authenticated') {
    return h.response({ status: jsonUART.status })
  }
  const collectionRef = await fire('userdata', await signer.simpleHash(jsonUART.data.username, 256))
  if (
    !await signer.compareHash(
      jsonUART.data.activeSession,
      await collectionRef.get('activeSession'),
      256
    )
  ) {
    return h.response({ status: 'invalid' })
  }
  try {
    console.log(await signer.simpleDecrypt(await collectionRef.get('email'), jsonUART.data.activeSession))
  } catch (e) {
    console.log(e)
  }
  return h.response(await signer.simpleDecrypt(await collectionRef.get('userPrivateData'), jsonUART.data.activeSession))
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
