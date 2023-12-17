const getStationEndPoint = require('./endpoint_modules/__getStation')
const transcribeEndPoint = require('./endpoint_modules/__transcribe')
const predictEndPoint = require('./endpoint_modules/__predict')
const getAudio = require('./endpoint_modules/__getAudio')

const __home = (req, h) => {
  return h.response({ status: 'home' })
}

const __getStation = async (req, h) => {
  return await getStationEndPoint.__endMethod(req, h)
}

const __transcribe = async (req, h) => {
  return await transcribeEndPoint.__endMethod(req, h)
}

const __predict = async (req, h) => {
  return await predictEndPoint.__endMethod(req, h)
}

const __getAudio = async (req, h) => {
  return await getAudio.__endMethod(req, h)
}

module.exports = {
  home: __home,
  getStation: __getStation,
  transcribe: __transcribe,
  predict: __predict,
  getAudio: __getAudio
}
