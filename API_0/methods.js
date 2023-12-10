const fetch = require('node-fetch')
const serviceAccount = require('./key.json')
const nodemailer = require('nodemailer')

const { nanoid } = require('nanoid')
const { initializeApp, cert } = require('firebase-admin/app')
const { getFirestore } = require('firebase-admin/firestore')

const API_KEY = 'AIzaSyAnIKZjgZshlUmKuGsPdMh3cFjA9TeKeRI'
const KEY = `key=${API_KEY}`

initializeApp({
  credential: cert(serviceAccount)
})

async function fetchLoc (lat, long, scope) {
  const fetchAt = await fetch(
    'https://places.googleapis.com/v1/places:searchNearby',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': API_KEY,
        'X-Goog-FieldMask': 'places.formattedAddress,places.rating,places.userRatingCount,places.googleMapsUri,places.regularOpeningHours,places.currentOpeningHours,places.nationalPhoneNumber,places.name,places.location'
      },
      body: JSON.stringify({
        includedTypes: [scope],
        locationRestriction: {
          circle: {
            center: {
              latitude: lat,
              longitude: long
            },
            radius: 4000.0
          }
        }
      })
    }
  )
  const fetchAtJSON = await fetchAt.json()
  return fetchAtJSON
}

async function fetchDesc (lat, long) {
  const fetchR = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${long}&${KEY}&enable_address_descriptor=true`
  )
  const fetchRJSON = await fetchR.json()
  if (fetchRJSON.results.length === 0) {
    return {
      address: 'Unknown Street',
      gmaps: `https://maps.google.com?q=${lat},${long}`
    }
  }
  return {
    address: fetchRJSON.results[0].formatted_address,
    gmaps: `https://www.google.com/maps/search/?api=1&query=Google&query_place_id=${fetchRJSON.results[0].place_id}`
  }
}

async function fetchName (id) {
  const fetchR = await fetch(
    `https://places.googleapis.com/v1/${id}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': API_KEY,
        'X-Goog-FieldMask': 'id,displayName'
      }
    }
  )
  const fetchRJSON = await fetchR.json()
  return fetchRJSON.displayName.text
}

async function fetchDist (urlQuery) {
  const fetchR = await fetch(`https://maps.googleapis.com/maps/api/distancematrix/${urlQuery}&${KEY}`, {
    method: 'GET'
  })
  const fetchRJSON = await fetchR.json()
  const traffic = fetchRJSON.rows[0].elements.map((data) => {
    return {
      distance: data.distance.value,
      duration: data.duration.text,
      durationRaw: data.duration.value
    }
  })
  return traffic
}

function Fire ({ colc, docm = null }) {
  async function getDC () {
    if (docm === null) {
      return await getFirestore().collection(colc).get()
    }
    return await getFirestore().collection(colc).doc(docm).get()
  }
  async function setDC (obj, opt) {
    return await getFirestore().collection(colc).doc(docm).set(obj, opt)
  }
  async function getDCData (key = null) {
    if (key === null) {
      return (await getFirestore().collection(colc).doc(docm).get()).data()
    } else {
      return (await getFirestore().collection(colc).doc(docm).get()).data()[key]
    }
  }
  return {
    get: getDC,
    setData: setDC,
    getData: getDCData
  }
}

async function writePublicAccess (stationType, generatedLegalKey) {
  const now = new Date()
  await Fire({ colc: 'key-access-management', docm: generatedLegalKey }).setData({
    creation: {
      date: `${now.getMonth()}/${now.getDate()}/${now.getFullYear()}`,
      time: `${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`
    },
    quota: 1,
    type: 'public-key',
    scope: stationType
  }, {})
}

async function policeMethodX (req, h) {
  const generatedLegalKey = nanoid(64)
  await writePublicAccess('police', generatedLegalKey)
  return h.redirect(`/ResQHub?publicKey=${generatedLegalKey}`)
}

async function hospitalMethodX (req, h) {
  const generatedLegalKey = nanoid(64)
  await writePublicAccess('hospital', generatedLegalKey)
  return h.redirect(`/ResQHub?publicKey=${generatedLegalKey}`)
}

async function XRedirectMethodX (req, h) {
  const { publicKey } = req.query
  const doc = await Fire({ colc: 'key-access-management', docm: publicKey }).get()
  const docData = doc.data().scope
  const emojiCodes = { police: '\u{1F46E}', hospital: '\u{1F3E5}' }
  const names = { police: 'Police Stations', hospital: 'Hospitals' }

  if (!doc.exists) {
    return h.view('error')
  } else {
    return h.view('survey', {
      stationType: docData,
      stationTypeName: names[docData],
      emojiCode: emojiCodes[docData]
    })
  }
}

async function expiredMethodX (req, h) {
  const { requestKey } = req.query
  const refersTo = {
    colc: 'key-access-management',
    docm: requestKey
  }
  if (!(await Fire(refersTo).get()).exists) {
    return h.view('error2', {
      title: 'Illegal',
      msg: 'You are using an unauthorized ResQHub key.'
    })
  }
  if (await Fire(refersTo).getData('quota') === 0) {
    return h.view('error2', {
      title: 'Expired',
      msg: 'It seems like your public key is expired. Go back home to renew the key.'
    })
  }
  return h.view('error2', {
    title: 'Expired',
    msg: 'It seems like your public key is expired. Go back home to renew the key.'
  })
}

async function safeCoreX ({ lat, long, acc, legalKey }) {
  const referredKey = Fire({
    colc: 'key-access-management',
    docm: legalKey
  })

  if (!(await referredKey.get()).exists) {
    return { status: 'invalid-key' }
  }
  if ((await referredKey.getData('quota')) <= 0) {
    return { status: 'expired' }
  }
  if (acc > 80) {
    const data = await referredKey.getData('fail')
    if (data === undefined) {
      await referredKey.setData({ fail: 1 }, { merge: true })
    } else {
      await referredKey.setData({ fail: data + 1 }, { merge: true })
    }
    return { status: 'low-accuracy' }
  }

  const points = await fetchLoc(lat, long, await referredKey.getData('scope'))
  const policeStations = {
    callable: {},
    uncallable: {}
  }

  await referredKey.setData({
    quota: (await referredKey.getData('quota')) - 1
  }, { merge: true })

  try {
    if (points.error.code === 400) {
      return {
        status: 'error',
        message: points.error.message
      }
    }
  } catch (err) {}

  if (Object.keys(points).length !== 0) {
    const maskedPoints = await points.places.map((data) => {
      return {
        location: data.location,
        address: data.formattedAddress,
        rating: data.rating,
        count: data.userRatingCount,
        uri: data.googleMapsUri,
        regHours: data.regularOpeningHours,
        curHours: data.currentOpeningHours,
        phone: data.nationalPhoneNumber,
        id: data.name
      }
    })

    let urlQuery = `json?origins=${lat}%2C${long}`
    for (const i in maskedPoints) {
      maskedPoints[i].name = await fetchName(maskedPoints[i].id)
      const destLat = maskedPoints[i].location.latitude
      const destLong = maskedPoints[i].location.longitude
      if (i === '0') {
        urlQuery += `&destinations=${destLat}%2C${destLong}`
      } else {
        urlQuery += `%7C${destLat}%2C${destLong}`
      }
    }
    const drivingTraffic = await fetchDist(urlQuery + '&mode=driving')
    const walkingTraffic = await fetchDist(urlQuery + '&mode=walking')
    for (const i in maskedPoints) {
      maskedPoints[i].distance = {
        driving: drivingTraffic[i].distance,
        walking: walkingTraffic[i].distance
      }
      maskedPoints[i].duration = {
        driving: drivingTraffic[i].duration,
        drivingRaw: drivingTraffic[i].durationRaw,
        walking: walkingTraffic[i].duration,
        walkingRaw: walkingTraffic[i].durationRaw
      }
    }
    policeStations.callable = maskedPoints.filter((data) => typeof data.phone !== 'undefined')
    policeStations.uncallable = maskedPoints.filter((data) => typeof data.phone === 'undefined')
  }
  policeStations.user = await fetchDesc(lat, long)
  return {
    status: 'success',
    data: policeStations,
    remainingQuota: await referredKey.getData('quota')
  }
}

async function safeMethodPostX (req, h) {
  const { lat, long, acc, legalKey } = req.payload
  const p = await safeCoreX({ lat, long, acc, legalKey })
  return h.response(p)
}

async function safeMethodGetX (req, h) {
  const { lat, long, key } = req.query
  const p = await safeCoreX({ lat, long, acc: 1, legalKey: key })
  return h.response(p)
}

async function submitMethodX (req, h) {
  const p = req.payload
  const refr = await Fire({ colc: 'key-access-management', docm: p.key }).get()
  const now = new Date()
  try {
    if (!refr.exists) {
      return h.response({ status: 'invalid-key' })
    }
    await Fire({ colc: 'survey-data', docm: p.key }).setData({
      data: p,
      type: await refr.data().scope,
      fillOutDate: {
        date: `${now.getMonth()}/${now.getDate()}/${now.getFullYear()}`,
        time: `${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`
      }
    }, {})
  } catch (err) {
    return h.response({ status: 'failed', error: err })
  }
  return h.response({ status: 'stored' })
}

async function emailClientMethodX (req, h) {
  const { clientEmail } = req.payload
  const serviceEmail = 'raihansyah.harahap@gmail.com'
  const servicePassword = 'qlpy bkwf vpjj revt'

  const newKeyPolice = 'resqhub' + nanoid(57)
  const newKeyHospital = 'resqhub' + nanoid(57)

  const now = new Date()
  await Fire({ colc: 'key-access-management', docm: newKeyPolice }).setData({
    creation: {
      date: `${now.getMonth()}/${now.getDate()}/${now.getFullYear()}`,
      time: `${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`
    },
    quota: 10,
    type: 'private-key',
    owner: clientEmail,
    scope: 'police'
  })

  await Fire({ colc: 'key-access-management', docm: newKeyHospital }).setData({
    creation: {
      date: `${now.getMonth()}/${now.getDate()}/${now.getFullYear()}`,
      time: `${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`
    },
    quota: 10,
    type: 'private-key',
    owner: clientEmail,
    scope: 'hospital'
  })

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: serviceEmail,
      pass: servicePassword
    }
  })

  const mailOptions = {
    from: serviceEmail,
    to: clientEmail,
    subject: 'Your ResQHub API Key',
    html: `<!DOCTYPE html>
    <html>
      <head>
      </head>
      <body>
        <header>
        </header>
        <main>
          <img src="https://storage.googleapis.com/xtq/logo.png" width="200px">
          <p style=
          "font-family: Arial, Helvetica, sans-serif;
          font-weight: bold;
          text-align: left;">Thank you for trying out our API.</p>
          <p style=
          "font-family: Arial, Helvetica, sans-serif;
          color: black;
          margin: 0px;
          text-align: left;">Our API is still under development. Powered by Google Maps API, we are currently developing our own recommendation system to suggest requester the best nearby police stations and hospitals. You have 10 credits to try out our API. Usage: <br></p>
          <p style=
          "font-family:'Courier New', Courier, monospace;
          margin: 0px;
          text-align: left;">
          https<span>:</span>//resqhub-survey-y2mk2btioa-et<span>.</span>a<span>.</span>run<span>.</span>app/safe?lat=<span style="color: blue">your-latitude</span>&long=<span style="color: blue">your-longitude</span>&key=<span style="color: blue">your-api-key</span>
          </p>
          <p style=
          "font-family: Arial, Helvetica, sans-serif;
          margin-top: 20px;
          font-weight: bold;
          text-align: left;">Your keys:</p>
          <p style=
          "margin: 0px;
          font-family: Arial, Helvetica, sans-serif;
          text-align: left;">For police station requests: <span style="color:red;">${newKeyPolice}</span></p>
          <br>
          <p style=
          "margin: 0px;
          font-family: Arial, Helvetica, sans-serif;
          text-align: left;">For hospital requests: <span style="color:red;">${newKeyHospital}</span></p>
        </main>
        <footer>
        </footer>
      </body>
    </html>`
  }

  transporter.sendMail(mailOptions, (err, info) => {
    if (err) {
      console.log(err)
    } else {
      console.log('>', info.response)
    }
  })
  return 'ok'
}

async function endMethodX (req, h) {
  const { key } = req.query
  if (!(await Fire({ colc: 'survey-data', docm: key }).get()).exists) {
    return h.view('basic', { title: 'Huh..?', msg: 'Cannot store any data with the given key.' })
  }
  return h.view('basic', { title: 'Success', msg: 'Thank you very much for your time!' })
}

async function infoMethodX (req, h) {
  return h.view('info', { count: (await Fire({ colc: 'survey-data' }).get())._size })
}

module.exports = {
  safeMethodPost: safeMethodPostX,
  safeMethodGet: safeMethodGetX,
  policeMethod: policeMethodX,
  hospitalMethod: hospitalMethodX,
  XRedirect: XRedirectMethodX,
  expiredMethod: expiredMethodX,
  submitMethod: submitMethodX,
  endMethod: endMethodX,
  infoMethod: infoMethodX,
  emailClientMethod: emailClientMethodX
}
