const signer = require('../../../security_modules/js_signer')
const fire = require('../../../security_modules/js_fire')
const sessionHandler = require('../../../security_modules/js_sessionHandler')
const errorHandler = require('../../../security_modules/js_errorHandler')
const speech = require('@google-cloud/speech')
const { nanoid } = require('nanoid')
const transcriber = require('./func_transcriber')
const { Storage } = require('@google-cloud/storage')
const storageKey = require('./keys/key-storage.json')

const INDEV = false

const client = new speech.SpeechClient({
  keyFilename: 'surface_modules/endpoint_modules/keys/key-stt.json'
})

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
    const audioData = payloads.audioFile
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
    const randomName = nanoid(12)
    const hRecodingName = signer.simpleHash(recordingName)
    const recordingFilePath = `${hUsername}/${hRecodingName}/${randomName}.m4a`
    //
    await myBucket.file(recordingFilePath).save(audioData)
    //
    // const [files] = await myBucket.getFiles()
    // files.forEach(f => console.log(f.name))
    const [url] = await myBucket.file(recordingFilePath).getSignedUrl({
      version: 'v4',
      action: 'read',
      expires: Date.now() + 60 * 1000 // a minute
    })
    //
    try {
      console.log('v3')
      const p = await transcriber.transcribe(url)
      const audio = { content: p }
      const config = { encoding: 'LINEAR16', sampleRateHertz: 16000, languageCode: 'id-ID' }
      const request = { audio, config }
      const [response] = await client.recognize(request)
      //
      const transcription = response.results
        .map(result => result.alternatives[0].transcript)
        .join('\n')
      //
      const fs = require('fs')
      fs.writeFileSync('pre-encrypted.txt', audioData)
      const encAudioData = signer.simpleEncrypt(audioData, decEmail)
      await myBucket.file(recordingFilePath).save(encAudioData)
      fs.writeFileSync('encrypted.txt', encAudioData)
      return h.response({ status: 'success', data: transcription })
    } catch (e) {
      console.log(e)
      if (errorHandler.isInstancesOf(e)) return h.response(e.readError()).code(502)
      else return h.response({ status: 'unknown?' })
    }
  } catch (e) {
    console.log(e)
    if (errorHandler.isInstancesOf(e)) return h.response(e.readError()).code(502)
    else return h.response({ status: 'unknown?', from: func })
  }
}

module.exports = {
  __endMethod
}
