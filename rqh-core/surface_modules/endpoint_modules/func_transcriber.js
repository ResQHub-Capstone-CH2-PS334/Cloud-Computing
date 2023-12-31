const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path
const ffmpeg = require('fluent-ffmpeg')
ffmpeg.setFfmpegPath(ffmpegPath)
const errorHandler = require('../../../security_modules/js_errorHandler')

const transcribe = async (fileUrl) => {
  const func = '__transcribe'
  //
  return new Promise((resolve, reject) => {
    const convertedBuffers = []
    const q = ffmpeg()
      .input(fileUrl)
      .inputFormat('m4a')
      .audioCodec('pcm_s16le')
      .audioFrequency(16000)
      .audioChannels(1)
      .toFormat('wav')
      .on('error', () => {
        reject(new errorHandler.TranscriberError(func, 'invalid'))
      })
    const ffstream = q.pipe()
    ffstream
      .on('error', () => {
        reject(new errorHandler.TranscriberError(func, 'invalid'))
      })
      .on('data', function (chunk) {
        convertedBuffers.push(chunk)
      })
      .on('end', () => {
        const amalgamatedBuffer = Buffer.concat(convertedBuffers)
        resolve(amalgamatedBuffer)
      })
  })
}

module.exports = {
  transcribe
}
