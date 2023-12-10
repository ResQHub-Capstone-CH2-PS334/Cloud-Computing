// const signer = require('../../../security_modules/js_signer')
// const fire = require('../../../security_modules/js_fire')
const sessionHandler = require('../../../security_modules/js_sessionHandler')
const errorHandler = require('../../../security_modules/js_errorHandler')
const maps = require('./func_gmaps')

const __endMethod = async (req, h) => {
  const func = '__getStation'
  try {
    sessionHandler.isLegal(req, 'at')
    await sessionHandler.validateRequest(req)
    //
    const { type, lat, long, rad } = req.payload
    const data = await maps.getNearby(type, lat, long, rad)
    return h.response({ status: 'success', data })
  } catch (e) {
    if (errorHandler.isInstancesOf(e)) return h.response(e.readError()).code(502)
    else return h.response({ status: 'unknown?', from: func })
  }
}

module.exports = {
  __endMethod
}
