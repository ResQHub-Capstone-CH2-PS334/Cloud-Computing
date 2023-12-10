// const signer = require('../../../security_modules/js_signer')
// const fire = require('../../../security_modules/js_fire')
const sessionHandler = require('../../../security_modules/js_sessionHandler')
const errorHandler = require('../../../security_modules/js_errorHandler')
const speech = require('@google-cloud/speech')
const fs = require('fs')
const { nanoid } = require('nanoid')
const transcriber = require('./func_transcriber')

const client = new speech.SpeechClient({
  keyFilename: 'surface_modules/endpoint_modules/keys/speech-to-text.json'
})

const __endMethod = async (req, h) => {
  const func = '__transcribe'
  try {
    sessionHandler.isLegal(req, 'at')
    await sessionHandler.validateRequest(req)
    //
    const payloads = req.payload
    // const gcsUri = 'gs://cloud-samples-data/speech/brooklyn_bridge.raw'
    const audioData = payloads.audioFile
    const randomName = nanoid(12)

    fs.writeFileSync(randomName + '.tempAudio', audioData)

    try {
      const p = await transcriber.transcribe(randomName + '.tempAudio')
      const audio = { content: p }
      const config = { encoding: 'LINEAR16', sampleRateHertz: 16000, languageCode: 'en-Us' }
      const request = { audio, config }

      const [response] = await client.recognize(request)
      const transcription = response.results
        .map(result => result.alternatives[0].transcript)
        .join('\n')
      console.log('t->', transcription)

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
