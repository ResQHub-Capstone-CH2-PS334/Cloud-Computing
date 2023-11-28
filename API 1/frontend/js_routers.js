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
  },
  {
    method: 'GET',
    path: '/jwt-experiment',
    handler: methods.jwtExperiment
  },
  {
    method: 'POST',
    path: '/jwt-endpoint',
    handler: methods.jwtEndPoint
  },
  {
    method: 'POST',
    path: '/encrypt-userconfig',
    handler: methods.encryptUserConfig,
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
