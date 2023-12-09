const sessionHandler = require('../../../security_modules/js_sessionHandler')
const errorHandler = require('../../../security_modules/js_errorHandler')

const __endMethod = async (req, h) => {
  const RT = req.headers.rt
  try {
    sessionHandler.isLegal(req, 'rt')
    return h.response({ AT: await sessionHandler.requestAT(RT) })
  } catch (e) {
    if (errorHandler.isInstancesOf(e)) {
      return h.response(e.readError()).code(502)
    } else return h.response({ status: 'unknown?' })
  }
}

module.exports = {
  __endMethod
}
