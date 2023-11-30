const methods = require('./js_methods')
const vision = require('@google-cloud/vision') // Cloud Vision API
const routers = [
  { // default
    method: 'GET',
    path: '/',
    handler: methods.default
  },
  {
    method: 'POST',
    path: '/build-vkey',
    handler: methods.buildvkey
  },
  {
    method: 'POST',
    path: '/verif-vkey',
    handler: methods.verifvkey
  },
  {
    method: 'POST',
    path: '/sign-user',
    handler: methods.signUser
  },
  {
    method: 'GET',
    path: '/m',
    handler: async function (req, h) {
      const client = new vision.ImageAnnotatorClient()
      const [result] = await client.faceDetection('test.jpeg')
      console.log(result.faceAnnotations[0].landmarks)
      return 1
    }
  }
]

module.exports = routers
