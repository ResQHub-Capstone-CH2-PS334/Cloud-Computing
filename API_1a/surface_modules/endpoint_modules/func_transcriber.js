const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path
const ffmpeg = require('fluent-ffmpeg')
const errorHandler = require('../../../security_modules/js_errorHandler')

const transcribe = async (inputFile) => {
  const func = '__transcribe'
  return new Promise((resolve, reject) => {
    const convertedBuffers = []
    const q = ffmpeg()
      .setFfmpegPath(ffmpegPath)
      .input(inputFile + 'j')
      .inputFormat('m4a')
      .audioCodec('pcm_s16le')
      .audioFrequency(16000)
      .audioChannels(1)
      .toFormat('wav')
      .on('error', () => {
        console.log('va')
        reject(new errorHandler.TranscriberError(func, 'invalid'))
      })
    const ffstream = q.pipe()
    ffstream
      .on('error', () => {
        console.log('vff')
        reject(new errorHandler.TranscriberError(func, 'invalid'))
      })
      .on('data', function (chunk) {
        convertedBuffers.push(chunk)
      })
      .on('end', () => {
        console.log('vx')
        const amalgamatedBuffer = Buffer.concat(convertedBuffers)
        resolve(amalgamatedBuffer)
      })
  })
}

module.exports = {
  transcribe
}
