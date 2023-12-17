const buildvkeyEndPoint = require('./endpoint_modules/__buildvkey')
const verifvkeyEndPoint = require('./endpoint_modules/__verifvkey')
const signUserEndPoint = require('./endpoint_modules/__signUser')
const userLoginEndPoint = require('./endpoint_modules/__userLogin')
const userLogoutEndPoint = require('./endpoint_modules/__userLogout')
const userUpdatePasswordEndPoint = require('./endpoint_modules/__userUpdatePassword')
const viewUserPrivateDataEndPoint = require('./endpoint_modules/__viewUserPrivateData')
const requestATEndPoint = require('./endpoint_modules/__requestAT')
const requestResetPassword = require('./endpoint_modules/__requestResetPassword')
const resetPassword = require('./endpoint_modules/__resetPassword')
const __default = async (req, h) => {
  return 1
}

/*
  RELATED ENDPOINT  : /build-vkey (POST)
  MAIN USAGE        : creating a verification key / token, sent to user's email address,
                      stored in Firestore
  HEADERS           : appkey
  PAYLOADS          : email
*/

const __buildvkey = async (req, h) => {
  return await buildvkeyEndPoint.__endMethod(req, h)
}

/*
  RELATED ENDPOINT  : /verify-vkey (POST)
  MAIN USAGE        : validating the user's input of the verification key with the
                      previously generated verification key (stored in Firestore)
  HEADERS           : appkey
  PAYLOADS          : email, vkey
*/

const __verifvkey = async (req, h) => {
  return await verifvkeyEndPoint.__endMethod(req, h)
}

/*
  RELATED ENDPOINT  : /sign-user (POST)
  MAIN USAGE        : creating a User Authenticated Recognition Token (RT)
  HEADERS           : appkey
  PAYLOADS          : email, username, password, fullname, id, birth, ticket
*/

const __signUser = async (req, h) => {
  return await signUserEndPoint.__endMethod(req, h)
}

/*
  RELATED ENDPOINT  : /user-login (POST)
  MAIN USAGE        : logging in a user
  HEADERS           : appkey, at
  PAYLOADS          : username, password
*/

const __userLogin = async (req, h) => {
  return await userLoginEndPoint.__endMethod(req, h)
}

/*
  RELATED ENDPOINT  : /user-logout (GET)
  MAIN USAGE        : logging out a user
  HEADERS           : appkey, at
  PAYLOADS          : -
*/

const __userLogout = async (req, h) => {
  return await userLogoutEndPoint.__endMethod(req, h)
}

/*
  RELATED ENDPOINT  : /user-updatepassword (POST)
  MAIN USAGE        : updating the user's password
  HEADERS           : appkey, at
  PAYLOADS          : oldPassword, newPassword
*/

const __userUpdatePassword = async (req, h) => {
  return await userUpdatePasswordEndPoint.__endMethod(req, h)
}

/*
  RELATED ENDPOINT  : /request-resetpassword (POST)
  MAIN USAGE        : generate a request for password reset
  HEADERS           : appkey, at
  PAYLOADS          : requestedPwd
*/

const __requestResetPassword = async (req, h) => {
  return await requestResetPassword.__endMethod(req, h)
}

/*
  RELATED ENDPOINT  : /reset-password (GET)
  MAIN USAGE        : generate a request for password reset
*/
const __resetPassword = async (req, h) => {
  return await resetPassword.__endMethod(req, h)
}

const __viewUserPrivateData = async (req, h) => {
  return await viewUserPrivateDataEndPoint.__endMethod(req, h)
}

/*
  RELATED ENDPOINT  : /request-at (GET)
  MAIN USAGE        : getting Access Token (AT)
  HEADERS           : appkey, rt
  PAYLOADS          : -
*/

const __requestAT = async (req, h) => {
  return await requestATEndPoint.__endMethod(req, h)
}

module.exports = {
  default: __default,
  buildvkey: __buildvkey,
  verifvkey: __verifvkey,
  signUser: __signUser,
  userLogin: __userLogin,
  userLogout: __userLogout,
  viewUserPrivateData: __viewUserPrivateData,
  userUpdatePassword: __userUpdatePassword,
  requestAT: __requestAT,
  requestResetPassword: __requestResetPassword,
  resetPassword: __resetPassword
}
