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
  }
]

module.exports = routers
