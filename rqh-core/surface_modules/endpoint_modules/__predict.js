const sessionHandler = require('../../../security_modules/js_sessionHandler')
const errorHandler = require('../../../security_modules/js_errorHandler')
const { imagePreprocess } = require('./func_imagePreprocess')
const { predictSimilarity } = require('./func_predictSimilarity')

const INDEV = true

const __endMethod = async (req, h) => {
  const func = '__getStation'
  try {
    if (!INDEV) {
      sessionHandler.isLegal(req, 'at')
      await sessionHandler.validateRequest(req)
    }
    console.log('pass#1')
    const preprocessedImageBuffers = await imagePreprocess(req, 120)
    console.log('pass#2')
    const similarityScore = await predictSimilarity(preprocessedImageBuffers)
    console.log('pass#3')
    return h.response({ status: 'success', similarity: similarityScore })
  } catch (e) {
    console.log(e)
    if (errorHandler.isInstancesOf(e)) return h.response(e.readError()).code(502)
    else return h.response({ status: 'unknown?', from: func })
  }
}

module.exports = {
  __endMethod
}
