// const signer = require('../../../security_modules/js_signer')
// const fire = require('../../../security_modules/js_fire')
const sessionHandler = require('../../../security_modules/js_sessionHandler')
const errorHandler = require('../../../security_modules/js_errorHandler')
const speech = require('@google-cloud/speech')
const { nanoid } = require('nanoid')
const transcriber = require('./func_transcriber')
const { Storage } = require('@google-cloud/storage')
const storageKey = require('./keys/storage.json')

const client = new speech.SpeechClient({
  keyFilename: 'surface_modules/endpoint_modules/keys/speech-to-text.json'
})

const __endMethod = async (req, h) => {
  const func = '__transcribe'
  try {
    // sessionHandler.isLegal(req, 'at')
    // await sessionHandler.validateRequest(req)
    //
    const payloads = req.payload
    const audioData = payloads.audioFile
    const storage = new Storage({
      credentials: storageKey,
      projectId: 'resqhub-capstone'
    })
    const myBucket = storage.bucket('sidedata-database')
    const randomName = nanoid(12)
    await myBucket.file(`${randomName}.m4a`).save(audioData)
    const [url] = await myBucket.file(`${randomName}.m4a`).getSignedUrl({
      version: 'v4',
      action: 'read',
      expires: Date.now() + 60 * 1000 // a minute
    })
    //
    try {
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
