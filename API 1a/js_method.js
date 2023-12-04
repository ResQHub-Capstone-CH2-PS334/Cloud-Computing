const __home = (req, h) => {
  return h.response({ status: 'home' })
}

const writeLog = async (__text) => {

} 

const __getPolice = async (req, h) => {
  const { lat, long, rad } = req.payload
}

const __getHospital = async (req, h) => {
  const { lat, long, rad } = req.payload
}

module.exports = {
  home: __home,
  getPolice: __getPolice,
  getHospital: __getHospital
}
