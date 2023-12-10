const fetch = require('node-fetch')
const errorHandler = require('../../../security_modules/js_errorHandler')
const API_KEY = 'AIzaSyAnIKZjgZshlUmKuGsPdMh3cFjA9TeKeRI'
const KEY = `key=${API_KEY}`

const internalGetDistance = async (__query) => {
  const getFetch = await fetch(`https://maps.googleapis.com/maps/api/distancematrix/${__query}&${KEY}`, {
    method: 'GET'
  })
  const dataFetch = await getFetch.json()
  const data = dataFetch.rows[0].elements.map((data) => {
    return {
      distance: data.distance.value,
      durationText: data.duration.text,
      duration: data.duration.value
    }
  })
  return data
}

const internalGetAllInformation = (__data) => {
  return __data.map((a) => {
    const regOpenHours = a.regularOpeningHours
    let regOpenNow = 'not provided'
    let regDescriptions = 'not provided'

    if (!(regOpenHours === undefined)) {
      regOpenNow = regOpenHours.openNow
      regDescriptions = regOpenHours.weekdayDescriptions
    }

    const curOpenHours = a.currentOpeningHours
    let curOpenNow = 'not provided'
    let curDescriptions = 'not provided'

    if (!(curOpenHours === undefined)) {
      curOpenNow = curOpenHours.openNow
      curDescriptions = curOpenHours.weekdayDescriptions
    }

    return {
      name: a.name,
      phone: a.nationalPhoneNumber === undefined ? 'not provided' : a.nationalPhoneNumber,
      address: a.formattedAddress,
      location: a.location,
      rating: a.rating === undefined ? 'not provided' : a.rating,
      ratingCount: a.userRatingCount === undefined ? 'not provided' : a.userRatingCount,
      uri: a.googleMapsUri,
      driving: a.driving,
      walking: a.walking,
      regOpenNow,
      regDescriptions,
      curOpenNow,
      curDescriptions
    }
  })
}

const internalGetQueryInfo = (__data, __loc) => {
  let query = `json?origins=${__loc.lat}%2C${__loc.long}`
  for (const i in __data) {
    // maskedPoints[i].name = await fetchName(maskedPoints[i].id)
    const destLat = __data[i].location.latitude
    const destLong = __data[i].location.longitude
    if (i === '0') {
      query += `&destinations=${destLat}%2C${destLong}`
    } else {
      query += `%7C${destLat}%2C${destLong}`
    }
  }
  return query
}

const getNearby = async (__type, __lat, __long, __rad) => {
  const func = 'getNearby'
  try {
    const fHeaders = {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': API_KEY,
      'X-Goog-FieldMask': 'places.formattedAddress,places.rating,places.userRatingCount,places.googleMapsUri,places.regularOpeningHours,places.currentOpeningHours,places.nationalPhoneNumber,places.name,places.location'
    }
    const fBody = {
      includedTypes: [__type],
      locationRestriction: {
        circle: {
          center: { latitude: __lat, longitude: __long },
          radius: __rad
        }
      }
    }
    const getFetch = await fetch('https://places.googleapis.com/v1/places:searchNearby',
      {
        method: 'POST',
        headers: fHeaders,
        body: JSON.stringify(fBody)
      }
    )
    const dataFetch = await getFetch.json()
    const dataPlaces = dataFetch.places
    if (Array.isArray(dataPlaces)) {
      const distanceMatrixQuery = internalGetQueryInfo(dataPlaces, {
        lat: __lat,
        long: __long
      })
      const trafficInfo = {
        driving: await internalGetDistance(distanceMatrixQuery + '&mode=driving'),
        walking: await internalGetDistance(distanceMatrixQuery + '&mode=walking')
      }
      console.log(trafficInfo)
      for (const i in dataPlaces) {
        dataPlaces[i].driving = trafficInfo.driving[i]
        dataPlaces[i].walking = trafficInfo.walking[i]
      }
      console.log(dataPlaces)
      const phoneProvided = dataPlaces.filter((a) => a.nationalPhoneNumber !== undefined)
      const phoneProvidedBasicInfo = internalGetAllInformation(phoneProvided)
      const noPhoneProvided = dataPlaces.filter((a) => a.nationalPhoneNumber === undefined)
      const nophoneProvidedBasicInfo = internalGetAllInformation(noPhoneProvided)
      const points = {
        phoneProvidedBasicInfo,
        nophoneProvidedBasicInfo
      }
      return points
    } else throw new errorHandler.MapsError('getNearby', 'nothing')
  } catch (e) {
    if (errorHandler.isInstancesOf(e)) throw e
    else throw new errorHandler.MapsError(func, 'unknown')
  }
}

module.exports = {
  getNearby
}
