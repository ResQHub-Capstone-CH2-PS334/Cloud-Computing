const maps = require('./js_gmaps')
const sessionHandler = require('../security_modules/js_sessionHandler')
const errorHandler = require('../security_modules/js_errorHandler')

const __home = (req, h) => {
  return h.response({ status: 'home' })
}

/*
const writeLog = async (__text) => {

}
*/

const __getStation = async (req, h) => {
  const { type, lat, long, rad } = req.payload
  try {
    sessionHandler.isLegal(req)
    await sessionHandler.validateRequest(req)
    const data = await maps.getNearby(type, lat, long, rad)
    return h.response({ data })
  } catch (e) {
    if (errorHandler.isInstancesOf(e)) {
      return h.response(e.readError())
    } else h.response({ status: 'unknown error' })
  }
}

module.exports = {
  home: __home,
  getStation: __getStation
}
