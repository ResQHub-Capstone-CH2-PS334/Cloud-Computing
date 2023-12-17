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
    method: 'POST',
    path: '/sign-user',
    handler: methods.signUser
  },
  {
    method: 'POST',
    path: '/user-login',
    handler: methods.userLogin
  },
  {
    method: 'GET',
    path: '/user-logout',
    handler: methods.userLogout
  },
  {
    method: 'GET',
    path: '/view-userprivatedata',
    handler: methods.viewUserPrivateData
  },
  {
    method: 'PUT',
    path: '/user-updatepassword',
    handler: methods.userUpdatePassword
  },
  {
    method: 'GET',
    path: '/request-at',
    handler: methods.requestAT
  },
  {
    method: 'POST',
    path: '/request-resetpassword',
    handler: methods.requestResetPassword
  },
  {
    method: 'GET',
    path: '/reset-password',
    handler: methods.resetPassword
  }
]

module.exports = routers
