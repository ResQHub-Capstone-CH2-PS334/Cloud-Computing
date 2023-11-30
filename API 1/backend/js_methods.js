const { initializeApp, cert } = require('firebase-admin/app')
const { getFirestore, FieldValue } = require('firebase-admin/firestore')
const nodemailer = require('nodemailer')
const fs = require('fs/promises')
const signer = require('./js_signer')

const __serviceAccount = require('./keys/key-firestore.json')

initializeApp({
  credential: cert(__serviceAccount)
})

const __fire__ = (col, doc = null) => {
  const __get = async (key = null) => {
    if (key === null) {
      // returns a document metadata
      return await getFirestore().collection(col).doc(doc).get()
    }
    if (typeof (key) === 'object') {
      const d = []
      const nodes = await getFirestore().collection(col).where(key.key, key.operator, key.value).get()
      nodes.forEach(node => d.push(node.data()))

      // returns a list of keys of the corresponding document
      return d
    }
    // returns keys and values of a specific document
    return (await getFirestore().collection(col).doc(doc).get()).data()[key]
  }
  const __list = async () => {
    const d = []
    const nodes = await getFirestore().collection(col).get()
    nodes.forEach(node => d.push(node.data()))

    // returns all documents' keys and values
    return d
  }
  const __write = async (content, option) => {
    // writes a content (object) into a document
    return await getFirestore().collection(col).doc(doc).set(content, option)
  }
  const __delete = async (key) => {
    // delete a document (if key is null) or a field
    if (doc === null) return -1 // collection deletion is not allowed
    if (key === null) {
      return (await getFirestore().collection(col).doc(doc).delete())
    }
    return (await getFirestore().collection(col).doc(doc).update({
      [key]: FieldValue.delete()
    }))
  }
  return {
    get: __get,
    write: __write,
    delete: __delete,
    list: __list
  }
}

const __generateKey__ = async (size) => {
  let k = ''
  for (let i = 0; i < size; i++) {
    k += Math.floor(Math.random() * 10)
  }
  return k
}

const __mail__ = async (email, vkey) => {
  const __htmlPath = './verifEmail.html'

  const __htmlBin = (await fs.readFile(__htmlPath, 'utf8'))
    .replace('xxx', vkey)

  const __serviceEmail = 'raihansyah.harahap@gmail.com'
  const __servicePassword = 'qlpy bkwf vpjj revt'

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: __serviceEmail,
      pass: __servicePassword
    }
  })

  const mailOptions = {
    from: __serviceEmail,
    to: email,
    subject: 'Your ResQHub Verification Key',
    html: __htmlBin
  }

  transporter.sendMail(mailOptions, (err, info) => {
    if (err) {
      console.log(err)
    } else {
      console.log('>', info.response)
    }
  })
}

const __default = async (req, h) => {
  return 1
}

const __buildvkey = async (req, h) => {
  const { email } = req.payload
  const key = await __generateKey__(7)
  const collectionRef = await __fire__('userdata', await signer.simpleHash(email))
  if ((await collectionRef.get()).exists && await collectionRef.get('verified')) {
    return h.response({ status: 'already-verified' })
  }
  console.log(key + '.')
  // __mail__(email, key)
  await collectionRef.write({
    tokenKey: await signer.signThis({ user: email }, key.toString(), 15),
    verified: false
  }, {})
  return h.response({
    status: 'success'
  })
}

const __verifvkey = async (req, h) => {
  const { email, vkey } = req.payload
  const collectionRef = (await __fire__('userdata', await signer.simpleHash(email)))
  if (!(await collectionRef.get()).exists) {
    return h.response({ status: 'not-exist' })
  }
  if (await collectionRef.get('verified')) {
    return h.response({ status: 'already-verified' })
  }
  const apply = await signer.apply(await collectionRef.get('tokenKey'), vkey)
  switch (apply.status) {
    case 'expired':
      return h.response({ status: 'expired' })
    case 'authenticated':
      await collectionRef.write({ verified: true }, { merge: true })
      await collectionRef.delete('tokenKey')
      return h.response({ status: 'verified' })
    case 'unauthenticated':
      return h.response({ status: 'wrong' })
    case 'malformed':
      return h.response({ status: 'malformed' })
    default:
      return h.response({ status: 'unknown' })
  }
}

const __signUser = async (req, h) => {
  const payloads = req.payload
  const collectionRef = await __fire__('userdata', await signer.simpleHash(payloads.email))
  if (!(await collectionRef.get()).exists) {
    return h.response({ status: 'not-exist' })
  }
  if (await collectionRef.get('verified') === false) {
    return h.response({ status: 'unverified' })
  }
  if (payloads.appDefaultKey !== signer.__SUPERSECRET_KEYS.__APPDEFAULT) {
    return h.response({ status: 'illegal' })
  }
  if (await collectionRef.get('hUART') !== undefined) {
    // return h.response({ status: 'already-signed' })
  }
  const userCoreData = {
    usrn: await signer.simpleHash(payloads.username, 512, 'default'),
    pswd: await signer.simpleHash(payloads.password, 512, 'default')
  }
  const userAdditionalData = {
    fuln: payloads.fullName,
    id: payloads.id,
    brth: payloads.birth
  }
  console.log(await signer.compareHash(payloads.username, userCoreData.usrn, 256))
  const { UART, hUART } = await signer.signUART(payloads.email, payloads.username)
  await collectionRef.write({ hUART }, { merge: true })
  return h.response({ status: 'signed', data: userCoreData })
}

module.exports = {
  default: __default,
  buildvkey: __buildvkey,
  verifvkey: __verifvkey,
  signUser: __signUser
}
