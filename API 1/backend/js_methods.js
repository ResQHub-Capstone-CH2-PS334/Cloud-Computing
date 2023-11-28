const { initializeApp, cert } = require('firebase-admin/app')
const { getFirestore } = require('firebase-admin/firestore')
const nodemailer = require('nodemailer')
const fs = require('fs/promises')
const { nanoid } = require('nanoid')
const cjs = require('crypto-js')

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
  return {
    get: __get,
    write: __write,
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

const __mail__ = async (email, vkey, exp) => {
  const __htmlPath = './verifEmail.html'

  const __htmlBin = (await fs.readFile(__htmlPath, 'utf8'))
    .replace('xxx', vkey)
    .replace('xxxx', exp)

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

const __hasher__ = {
  hash: async function (__msg, __salt = null) {
    let salt = nanoid(10)
    if (__salt !== null) {
      salt = __salt
    }
    const msg = `${salt}${__msg}`
    const hashedMsg = salt + cjs.SHA256(msg).toString()
    console.log('Salt h: ', hashedMsg.slice(0, 10), '.', salt)
    return hashedMsg
  },
  compare: async function (__msg, __hashedMsg) {
    const salt = __hashedMsg.slice(0, 10)
    console.log('Salt c: ', salt)
    const testHashedMsg = await __hasher__.hash(__msg, salt)
    console.log(testHashedMsg)
    if (testHashedMsg === __hashedMsg) {
      return true
    }
    return false
  }
}

const __default = async (req, h) => {
  const h0 = await __hasher__.hash('He wants to fuck me hard')
  console.log(h0)
  const h1 = await __hasher__.compare('He wants to fuck me hard', h0)
  console.log(h1)
  return 1
}

const __buildvkey = async (req, h) => {
  const { email } = req.payload
  const key = await __generateKey__(7)
  console.log(key)
  const expirationDate = new Date()
  expirationDate.setMinutes(expirationDate.getMinutes() + 5)
  const collectionRef = await __fire__('userdata', email)

  if ((await collectionRef.get()).exists && await collectionRef.get('verified')) {
    return h.response({ status: 'has-verified' })
  }

  __mail__(email, key, `${expirationDate.getHours()}:${expirationDate.getMinutes()}:${expirationDate.getSeconds}`)
  await collectionRef.write({
    hashedKey: await __hasher__.hash(key),
    creationDate: new Date(),
    expirationDate,
    verified: false
  }, {})
  return h.response({
    status: 'success'
  })
}

const __verifvkey = async (req, h) => {
  const { email, vkey } = req.payload
  const now = (new Date()).getTime() / 1000
  const collectionRef = (await __fire__('userdata', email))
  if (!(await collectionRef.get()).exists) {
    return h.response({ status: 'not-exist' })
  }
  if (await collectionRef.get('verified')) {
    console.log((await collectionRef.get('expirationDate'))._seconds)
    return h.response({ status: 'has-verified' })
  }
  if (await __hasher__.compare(vkey, await collectionRef.get('hashedKey'))) {
    if (now > (await collectionRef.get('expirationDate'))._seconds) {
      return h.response({ status: 'expired' })
    }
    await collectionRef.write({ verified: true }, { merge: true })
    return h.response({ status: 'verified' })
  } else {
    return h.response({ status: 'wrong' })
  }
}

module.exports = {
  default: __default,
  buildvkey: __buildvkey,
  verifvkey: __verifvkey
}

/* SAMPLES
* To create verification key for new user
* curl -X POST -H "Content-Type: application/json" -d '{"email": "raihansyah.harahap@gmail.com"}' localhost:9000/build-verif-key
*
* New user verifies their key
* curl -X POST -H "Content-Type: application/json" -d '{"email": "raihansyah.harahap@gmail.com", "verifKey": "7038547"}' localhost:9000/verify-key
*/
