const utils = require('./js_utils')

const __RQH_AUTH_URL = 'https://rqh-auth-6old2slxmq-et.a.run.app/'
const __RQH_CORE_URL = '%%BASH%%:RQH_CORE_URL'

const buildVkey = async (req, h) => {
  return await utils.makeRequest({
    __url: __RQH_AUTH_URL + 'build-vkey',
    __headers: utils.getHeaders(req, ['appkey']),
    __method: 'POST',
    __payloads: req.payload,
    __requiredPayloads: ['email']
  }, h)
}

const verifVkey = async (req, h) => {
  return await utils.makeRequest({
    __url: __RQH_AUTH_URL + 'verif-vkey',
    __headers: utils.getHeaders(req, ['appkey']),
    __method: 'POST',
    __payloads: req.payload,
    __requiredPayloads: ['email', 'vkey']
  }, h)
}

const signUser = async (req, h) => {
  return await utils.makeRequest({
    __url: __RQH_AUTH_URL + 'sign-user',
    __headers: utils.getHeaders(req, ['appkey']),
    __method: 'POST',
    __payloads: req.payload,
    __requiredPayloads: ['email', 'username', 'password', 'fullName', 'id', 'birth', 'ticket']
  }, h)
}

const requestAT = async (req, h) => {
  return await utils.makeRequest({
    __url: __RQH_AUTH_URL + 'request-at',
    __headers: utils.getHeaders(req, ['appkey', 'rt']),
    __method: 'GET',
    __payloads: null,
    __requiredPayloads: []
  }, h)
}

const viewUserPrivateData = async (req, h) => {
  return await utils.makeRequest({
    __url: __RQH_AUTH_URL + 'view-userprivatedata',
    __headers: utils.getHeaders(req, ['appkey', 'rt']),
    __method: 'GET',
    __payloads: null,
    __requiredPayloads: []
  }, h)
}

const userUpdatePassword = async (req, h) => {
  return await utils.makeRequest({
    __url: __RQH_AUTH_URL + 'user-updatepassword',
    __headers: utils.getHeaders(req, ['appkey', 'at']),
    __method: 'PUT',
    __payloads: null,
    __requiredPayloads: []
  }, h)
}

const requestResetPassword = async (req, h) => {
  return await utils.makeRequest({
    __url: __RQH_AUTH_URL + 'request-resetpassword',
    __headers: utils.getHeaders(req, ['appkey', 'at']),
    __method: 'POST',
    __payloads: req.payload,
    __requiredPayloads: ['requestPwd', 'username', 'state']
  }, h)
}

const userLogout = async (req, h) => {
  return await utils.makeRequest({
    __url: __RQH_AUTH_URL + 'user-logout',
    __headers: utils.getHeaders(req, ['appkey', 'at']),
    __method: 'GET',
    __payloads: null,
    __requiredPayloads: []
  }, h)
}

const userLogin = async (req, h) => {
  return await utils.makeRequest({
    __url: __RQH_AUTH_URL + 'user-login',
    __headers: utils.getHeaders(req, ['appkey', 'at']),
    __method: 'POST',
    __payloads: req.payload,
    __requiredPayloads: ['username', 'password']
  }, h)
}

const resetPassword = async (req, h) => {
  const { credentials } = req.query
  return await utils.makeRequest({
    __url: __RQH_AUTH_URL + `reset-password?credentials=${credentials}`,
    __headers: null,
    __method: 'GET',
    __payloads: null,
    __requiredPayloads: []
  }, h)
}

const getStation = async (req, h) => {
  return await utils.makeRequest({
    __url: __RQH_CORE_URL + 'get-station',
    __headers: utils.getHeaders(req, ['appkey', 'at']),
    __method: 'POST',
    __payloads: req.payload,
    __requiredPayloads: ['type', 'lat', 'long', 'rad']
  }, h)
}

const transcribe = async (req, h) => {
  return await utils.makeRequest({
    __url: __RQH_CORE_URL + 'transcribe',
    __headers: utils.getHeaders(req, ['appkey', 'at']),
    __method: 'POST',
    __payloads: req.payload,
    __requiredPayloads: ['audioFile', 'filename']
  }, h)
}

const getAudio = async (req, h) => {
  return await utils.makeRequest({
    __url: __RQH_CORE_URL + 'get-audio',
    __headers: utils.getHeaders(req, ['appkey', 'at']),
    __method: 'POST',
    __payloads: req.payload,
    __requiredPayloads: ['filename']
  }, h)
}

const predict = async (req, h) => {
  return await utils.makeRequest({
    __url: __RQH_CORE_URL + 'predict',
    __headers: utils.getHeaders(req, ['appkey', 'at']),
    __method: 'POST',
    __payloads: req.payload,
    __requiredPayloads: ['fromID', 'fromLive']
  }, h)
}

module.exports = {
  buildVkey,
  verifVkey,
  signUser,
  requestAT,
  viewUserPrivateData,
  userUpdatePassword,
  requestResetPassword,
  userLogout,
  userLogin,
  resetPassword,
  getStation,
  transcribe,
  getAudio,
  predict
}
