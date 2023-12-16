const methods = require('./js_methods')
const routers = [
  {
    method: 'GET',
    path: '/',
    handler: methods.home
  },
  {
    method: 'POST',
    path: '/get-station',
    handler: methods.getStation
  },
  {
    method: 'POST',
    path: '/transcribe',
    handler: methods.transcribe,
    options: {
      payload: {
        output: 'data',
        parse: true,
        multipart: true
      }
    }
  },
  {
    method: 'POST',
    path: '/predict',
    handler: methods.predict,
    options: {
      payload: {
        output: 'data',
        parse: true,
        multipart: true
      }
    }
  }
]

module.exports = routers
