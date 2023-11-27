const methods = require('./methods')
const { Storage } = require('@google-cloud/storage')
const vision = require('@google-cloud/vision')
const { google } = require('googleapis')
const fetch = require('node-fetch')

const routes = [
  {
    method: 'GET',
    path: '/storage',
    handler: async (req, h) => {
      const storage = new Storage({ projectId: 'rai-capstone-pre-dev' })
      const myBucket = storage.bucket('vampire-handsome')
      await myBucket.file('hello.txt').save('hello world')
      return 'ok'
    }
  },
  {
    method: 'GET',
    path: '/ResQHub',
    handler: methods.XRedirect
  },
  {
    method: 'GET',
    path: '/police',
    handler: methods.policeMethod
  },
  {
    method: 'GET',
    path: '/hospital',
    handler: methods.hospitalMethod
  },
  {
    method: 'GET',
    path: '/side-js',
    handler: { file: './templates/side.mjs' }
  },
  {
    method: 'GET',
    path: '/side-methods-js',
    handler: { file: './templates/side-methods.mjs' }
  },
  {
    method: 'GET',
    path: '/css-file',
    handler: { file: './templates/style.css' }
  },
  {
    method: 'GET',
    path: '/css-file-info',
    handler: { file: './templates/style-info.css' }
  },
  {
    method: 'GET',
    path: '/ibmplex-reg',
    handler: { file: './templates/fonts/IBMPlexMono-Regular.ttf' }
  },
  {
    method: 'GET',
    path: '/ibmplex-med',
    handler: { file: './templates/fonts/IBMPlexMono-Medium.ttf' }
  },
  {
    method: 'GET',
    path: '/ibmplex-bold',
    handler: { file: './templates/fonts/IBMPlexMono-Bold.ttf' }
  },
  {
    method: 'GET',
    path: '/philosopher-bold',
    handler: { file: './templates/fonts/Philosopher-Bold.ttf' }
  },
  {
    method: 'GET',
    path: '/museoModerno-bold',
    handler: { file: './templates/fonts/MuseoModerno-Bold.ttf' }
  },
  {
    method: 'GET',
    path: '/email-request',
    handler: { file: './templates/email-request.mjs' }
  },
  {
    method: 'GET',
    path: '/input',
    handler: (req, h) => { return h.view('input') }
  },
  {
    method: 'POST',
    path: '/safe',
    handler: methods.safeMethodPost
  },
  {
    method: 'GET',
    path: '/{any*}',
    handler: (req, h) => {
      return h.view('error2', { title: 'Lost?', msg: 'Nothing here' })
    }
  },
  {
    method: 'GET',
    path: '/safe',
    handler: methods.safeMethodGet
  },
  {
    method: 'GET',
    path: '/info',
    handler: methods.infoMethod
  },
  {
    method: 'GET',
    path: '/expired',
    handler: methods.expiredMethod
  },
  {
    method: 'POST',
    path: '/submit',
    handler: methods.submitMethod
  },
  {
    method: 'GET',
    path: '/end',
    handler: methods.endMethod
  },
  {
    method: 'POST',
    path: '/emailClient',
    handler: methods.emailClientMethod
  },
  {
    method: 'GET',
    path: '/jwt-token',
    handler: async (req, h) => {
      const url = 'https://invoker-private-y2mk2btioa-et.a.run.app/invoke'
      const jwtClient = new google.auth.JWT(
        {
          keyFile: './creds.json',
          scopes: []
        }
      )

      jwtClient.fetchIdToken(url)
        .then(async (token) => {
          console.log(token)
          const fetchAt = await fetch(
            url,
            {
              method: 'GET',
              headers: {
                Authorization: `Bearer ${token}`
              }
            }
          )
          const fetchRJSON = await fetchAt.json()
          console.log(fetchRJSON)
        })

      return h.response({
        status: 'ok'
      })
    }
  },
  {
    method: 'POST',
    path: '/visapitest',
    handler: async (req, h) => {
      const file = req.payload
      const buffer0 = new Uint8Array(file.img)
      const client = new vision.ImageAnnotatorClient()
      const [result] = await client.annotateImage({
        image: {
          content: buffer0
        },
        features: [{
          type: 'TEXT_DETECTION'
        }]
      })
      const detections = result.textAnnotations
      detections.forEach(item => console.log(item.description, '=>', item.boundingPoly.vertices))

      return 'ok'
    },
    options: {
      payload: {
        output: 'data',
        parse: true,
        multipart: true,
        maxBytes: 100000000
      }
    }
  }
]
module.exports = { routers: routes }
