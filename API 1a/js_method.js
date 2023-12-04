const maps = require('./js_gmaps')

const __home = (req, h) => {
  return h.response({ status: 'home' })
}

const writeLog = async (__text) => {

}

const __getPolice = async (req, h) => {
  const { lat, long, rad } = req.payload
  try {
    const data = await maps.getNearby('police', lat, long, rad)
    return h.response({ data })
  } catch (e) {
    if (e instanceof maps.MapsError) {
      return h.response(e.readError())
    } else h.response({ status: 'unknown error' })
  }
}

const __getHospital = async (req, h) => {
  const { lat, long, rad } = req.payload
}

module.exports = {
  home: __home,
  getPolice: __getPolice,
  getHospital: __getHospital
}
