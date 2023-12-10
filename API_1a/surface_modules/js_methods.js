const getStationEndPoint = require('./endpoint_modules/__getStation')
const transcribeEndPoint = require('./endpoint_modules/__transcribe')

const __home = (req, h) => {
  return h.response({ status: 'home' })
}

const __getStation = async (req, h) => {
  return await getStationEndPoint.__endMethod(req, h)
}

const __transcribe = async (req, h) => {
  return await transcribeEndPoint.__endMethod(req, h)
}

module.exports = {
  home: __home,
  getStation: __getStation,
  transcribe: __transcribe
}
