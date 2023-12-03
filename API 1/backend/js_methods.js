const signer = require('./js_signer')
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

const __verifvkey = async (req, h) => {
  const { email, vkey } = req.payload
  const collectionRef = (await fire('verifdata', await signer.simpleHash(email, 256)))
  if (!(await collectionRef.get()).exists) {
    return h.response({ status: 'not-exist' })
  }
  if (await collectionRef.get('registered')) {
    return h.response({ status: 'already-registered' })
  }
  const apply = await signer.apply(await collectionRef.get('tokenKey'), vkey)
  const registrationTicket = await signer.signThis(
    { email },
    signer.__SUPERSECRET_KEYS.__TICKETREGS,
    3600
  )
  switch (apply.status) {
    case 'expired':
      return h.response({ status: 'expired' })
    case 'authenticated':
      return h.response({ status: 'verified', registrationTicket })
    case 'unauthenticated':
      return h.response({ status: 'wrong' })
    case 'malformed':
      return h.response({ status: 'malformed' })
    default:
      return h.response({ status: 'unknown' })
  }
}

const __signUser = async (req, h) => {
  if (req.headers['x-rqh-appkey'] !== signer.__SUPERSECRET_KEYS.__APPDEFAULT) {
    return h.response({ status: 'illegal' })
  }
  const payloads = req.payload
  const ticket = await signer.apply(payloads.ticket, signer.__SUPERSECRET_KEYS.__TICKETREGS)
  if (ticket.status !== 'authenticated') {
    return h.response(ticket)
  }
  if (payloads.email !== ticket.data.email) {
    return h.response({ status: 'email-mismatch' })
  }
  const pswd = await signer.simpleHash(payloads.password, 512, 'default')
  const collectionRef = await fire(
    'userdata',
    await signer.simpleHash(payloads.username, 256)
  )
  if ((await collectionRef.get()).exists) {
    return h.response({ status: 'username-taken' })
  }
  const activeSession = nanoid(16)
  const userPrivateData = await signer.simpleEncrypt({
    fuln: payloads.fullName,
    id: payloads.id,
    brth: payloads.birth
  }, activeSession)

  const UART = await signer.signUART({
    username: payloads.username,
    activeSession
  })
  await collectionRef.write({
    userPrivateData,
    pswd,
    activeSession: await signer.simpleHash(activeSession, 256, 'default'),
    email: await signer.simpleHash(payloads.email, 256)
  }, { merge: true })

  await fire('verifdata', await signer.simpleHash(payloads.email, 256)).write({
    registered: true
  })
  await fire('verifdata', await signer.simpleHash(payloads.email, 256)).delete('tokenKey')
  console.log(activeSession)
  return h.response({ status: 'signed', UART })
}

const __userLogin = async (req, h) => {
  if (req.headers['x-rqh-appkey'] !== signer.__SUPERSECRET_KEYS.__APPDEFAULT) {
    return h.response({ status: 'illegal' })
  }
  const { username, password } = req.payload
  const usrnHashed = await signer.simpleHash(username, 256)
  const user = await fire('userdata', usrnHashed)

  if (!(await user.get()).exists) {
    return h.response({ status: 'invalid' })
  }
  if (await user.get('activeSession') !== 'no-session') {
    return h.response({ status: 'already-logged-in' })
  }
  const isPwdMatch = await signer.compareHash(password, await user.get('pswd'), 512, 'default')
  if (isPwdMatch) {
    const activeSession = nanoid(16)
    await fire('userdata', await signer.simpleHash(username, 256)).write({
      userPrivateData: await signer.cipherUpdateKey(
        await fire(
          'userdata',
          await signer.simpleHash(username, 256)
        ).get('userPrivateData'),
        signer.__SUPERSECRET_KEYS.__USERDBIDLE,
        activeSession
      )
    }, { merge: true })
    await fire(
      'userdata',
      await signer.simpleHash(username, 256)
    ).write({
      activeSession: await signer.simpleHash(activeSession, 256, 'default')
    }, { merge: true })

    console.log(activeSession)
    const UART = await signer.signUART({
      username,
      activeSession
    })
    return h.response({ status: 'logged-in', UART })
  }
  return h.response({ status: 'invalid' })
}

const __userLogout = async (req, h) => {
  const { UART } = req.payload
  const jsonUART = await signer.applyUART(UART)
  if (jsonUART.status !== 'authenticated') {
    h.response({ status: jsonUART.status })
  }
  const collectionRef = await fire(
    'userdata',
    await signer.simpleHash(jsonUART.data.username, 256)
  )
  if (await collectionRef.get('activeSession') === 'no-session') {
    return h.response({ status: 'already-logged-out' })
  }
  if (
    !(await signer.compareHash(
      jsonUART.data.activeSession,
      await collectionRef.get('activeSession'),
      256
    ))
  ) {
    return h.response({ status: 'session-mismatch' })
  }
  await collectionRef.write({
    activeSession: 'no-session'
  }, { merge: true })
  await collectionRef.write({
    userPrivateData: await signer.cipherUpdateKey(
      await collectionRef.get('userPrivateData'),
      jsonUART.data.activeSession,
      signer.__SUPERSECRET_KEYS.__USERDBIDLE
    )
  }, { merge: true })
  return h.response({ status: 'logged-out' })
}

const __viewUserPrivateData = async (req, h) => {
  const { UART } = req.payload
  const jsonUART = await signer.apply(UART, signer.__SUPERSECRET_KEYS.__HMACSHAKEY)
  if (jsonUART.status !== 'authenticated') {
    return h.response({ status: jsonUART.status })
  }
  const collectionRef = await fire('userdata', await signer.simpleHash(jsonUART.data.username, 256))
  console.log(jsonUART)
  if (
    !await signer.compareHash(
      jsonUART.data.activeSession,
      await collectionRef.get('activeSession'),
      256
    )
  ) {
    return h.response({ status: 'invalid' })
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
  viewUserPrivateData: __viewUserPrivateData
}
