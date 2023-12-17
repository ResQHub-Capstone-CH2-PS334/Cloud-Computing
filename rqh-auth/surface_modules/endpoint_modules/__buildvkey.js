const signer = require('../../../security_modules/js_signer')
const fire = require('../../../security_modules/js_fire')
const sessionHandler = require('../../../security_modules/js_sessionHandler')
const errorHandler = require('../../../security_modules/js_errorHandler')
const mail = require('../js_mail')

const generateKey = (size) => {
  let k = ''
  for (let i = 0; i < size; i++) {
    k += Math.floor(Math.random() * 10)
  }
  return k
}

const __endMethod = async (req, h) => {
  const func = '__buildvkey'
  try {
    sessionHandler.isLegal(req)
    const { email } = req.payload
    const key = generateKey(7)
    const collectionRef = fire('verifdata', signer.simpleHash(email))
    //
    try {
      const registered = await collectionRef.get('registered')
      if (registered) {
        return h.response({ status: 'registeredEmail' })
      }
      throw new errorHandler.MethodsError(func, 'unknown')
    } catch (e) {
      console.log(key)
      mail.mailVerificaionKey(email, key)
      await collectionRef.write({
        tokenKey: signer.signThis({ user: email }, key.toString(), 300),
        registered: false
      }, {})
      return h.response({
        status: 'success'
      })
    }
  } catch (e) {
    if (errorHandler.isInstancesOf(e)) {
      return h.response(e.readError()).code(502)
    } else return h.response({ status: 'unknown?', description: `At ${func}()` })
  }
}

module.exports = {
  __endMethod
}
