const signer = require('../../../security_modules/js_signer')
const fire = require('../../../security_modules/js_fire')
const sessionHandler = require('../../../security_modules/js_sessionHandler')
const errorHandler = require('../../../security_modules/js_errorHandler')
const { Storage } = require('@google-cloud/storage')
const storageKey = require('./keys/storage.json')

const INDEV = false

const __endMethod = async (req, h) => {
  const func = '__transcribe'
  try {
    let jsonAT = 0
    if (!INDEV) {
      sessionHandler.isLegal(req, 'at')
      jsonAT = await sessionHandler.validateRequest(req)
    }
    //
    const activeSession = jsonAT.activeSession
    const payloads = req.payload
    const recordingName = payloads.filename
    const storage = new Storage({
      credentials: storageKey,
      projectId: 'resqhub-capstone'
    })
    //
    const hUsername = signer.simpleHash(jsonAT.username)
    const encEmail = await fire('userdata', hUsername).get('email')
    const decEmail = signer.simpleDecrypt(encEmail, activeSession)
    //
    const myBucket = storage.bucket('sidedata-database')
    //
    const toDownload = []
    const [files] = await myBucket.getFiles()
    files.forEach((f) => {
      const parts = f.name.split('/')
      try {
        signer.compareHash(recordingName, parts[1])
        toDownload.push(f.name)
      } catch (e) {}
    })
    const [encAudioData] = await myBucket.file(toDownload[0]).download()
    const decAudioData = signer.simpleDecrypt(encAudioData.toString(), decEmail)
    const jsonParsed = JSON.parse(decAudioData)
    return h.response({ status: 'success', data: Buffer.from(jsonParsed.data) })
      .type('application/octet-stream')
    //
  } catch (e) {
    console.log(e)
    if (errorHandler.isInstancesOf(e)) return h.response(e.readError()).code(502)
    else return h.response({ status: 'unknown?', from: func })
  }
}

module.exports = {
  __endMethod
}
