const methods = require('./js_methods')

const routers = [
  { // default
    method: 'GET',
    path: '/',
    handler: methods.default
  },
  {
    method: 'POST',
    path: '/build-vkey',
    handler: methods.buildvkey
  },
  {
    method: 'POST',
    path: '/verif-vkey',
    handler: methods.verifvkey
  }
]

module.exports = routers
