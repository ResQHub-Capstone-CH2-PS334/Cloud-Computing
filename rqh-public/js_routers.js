const methods = require('./js_methods')

const routers = [
  {
    method: 'GET',
    path: '/',
    handler: (req, h) => { return 1 }
  },
  {
    method: 'POST',
    path: '/build-vkey',
    handler: methods.buildVkey
  },
  {
    method: 'POST',
    path: '/verif-vkey',
    handler: methods.verifVkey
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
