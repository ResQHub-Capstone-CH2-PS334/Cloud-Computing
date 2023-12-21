const vision = require('@google-cloud/vision')
const Jimp = require('jimp')

const imagePreprocess = async (__req, __imgSize) => {
  const images = [__req.payload.fromID, __req.payload.fromLive]
  const processedImgBuffer = []
  for (let i = 0; i < 2; i++) {
    const img = {
      image: { content: images[i] },
      features: [{
        type: 'FACE_DETECTION'
      }]
    }
    const client = new vision.ImageAnnotatorClient({
      keyFilename: 'surface_modules/endpoint_modules/keys/key-cvision.json'
    })
    const [result] = await client.annotateImage(img)
    const faces = result.faceAnnotations
    let faceBoundingBoxPoints = 0

    faces.forEach((face, i) => {
      faceBoundingBoxPoints = face.boundingPoly.vertices
    })

    const targetImg = await Jimp.read(images[i])
    const bx = faceBoundingBoxPoints[0].x
    const by = faceBoundingBoxPoints[0].y
    const lx = faceBoundingBoxPoints[2].x - bx
    const ly = faceBoundingBoxPoints[2].y - by
    targetImg.crop(bx, by, lx, ly).resize(__imgSize, __imgSize)
    processedImgBuffer.push(await targetImg.getBufferAsync(Jimp.MIME_JPEG))
  }
  return processedImgBuffer
}

module.exports = { imagePreprocess }
