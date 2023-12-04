const methods = require('./js_method')
const routers = [
  {
    method: 'GET',
    path: '/',
    handler: methods.home
  },
  {
    method: 'POST',
    path: '/get-police',
    handler: methods.getPolice
  }
]

module.exports = routers
