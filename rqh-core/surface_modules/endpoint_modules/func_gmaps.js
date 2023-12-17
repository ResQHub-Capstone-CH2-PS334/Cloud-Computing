const fetch = require('node-fetch')
const errorHandler = require('../../../security_modules/js_errorHandler')
// const API_KEY = 'AIzaSyAnIKZjgZshlUmKuGsPdMh3cFjA9TeKeRI'
const API_KEY = 'AIzaSyDaeHxiPSZVWVFioRBrAmTOQOkpi7nExxY'
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

const internalSortPoints = (__nodes) => {
  const deepCopy = (__data) => {
    return JSON.parse(JSON.stringify(__data))
  }
  //
  const byRating = __nodes
    .filter((a) => a.rating !== 'not provided')
    .sort((a, b) => b.rating - a.rating)
  const byDrivingDistance = deepCopy(__nodes)
    .sort((a, b) => a.driving.distance - b.driving.distance)
  const byDrivingTime = deepCopy(__nodes)
    .sort((a, b) => a.driving.duration - b.driving.duration)
  const byWalkingDistance = deepCopy(__nodes)
    .sort((a, b) => a.walking.distance - b.walking.distance)
  const byWalkingTime = deepCopy(__nodes)
    .sort((a, b) => a.walking.duration - b.walking.duration)
  return {
    byRating,
    byDrivingDistance,
    byDrivingTime,
    byWalkingDistance,
    byWalkingTime
  }
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
    try {
      if (dataFetch.error.code === 400) {
        throw new errorHandler.MapsError(func, 'outage')
      }
    } catch (e) {
      if (errorHandler.isInstancesOf(e)) throw e
    }
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
      for (const i in dataPlaces) {
        dataPlaces[i].driving = trafficInfo.driving[i]
        dataPlaces[i].walking = trafficInfo.walking[i]
      }
      const phoneProvided = dataPlaces.filter((a) => a.nationalPhoneNumber !== undefined)
      const phoneProvidedBasicInfo = internalGetAllInformation(phoneProvided)
      const noPhoneProvided = dataPlaces.filter((a) => a.nationalPhoneNumber === undefined)
      const nophoneProvidedBasicInfo = internalGetAllInformation(noPhoneProvided)
      const points = {
        phoneProvidedBasicInfo,
        nophoneProvidedBasicInfo
      }

      const phoneProvidedSorted = internalSortPoints(phoneProvidedBasicInfo)
      const noPhoneProvidedSorted = internalSortPoints(nophoneProvidedBasicInfo)

      const sortedPoints = {
        phoneProvided: {
          byRating: phoneProvidedSorted.byRating,
          byDrivingDistance: phoneProvidedSorted.byDrivingDistance,
          byDrivingTime: phoneProvidedSorted.byDrivingTime,
          byWalkingDistance: phoneProvidedSorted.byWalkingDistance,
          byWalkingTime: phoneProvidedSorted.byWalkingTime
        },
        noPhoneProvided: {
          byRating: noPhoneProvidedSorted.byRating,
          byDrivingDistance: noPhoneProvidedSorted.byDrivingDistance,
          byDrivingTime: noPhoneProvidedSorted.byDrivingTime,
          byWalkingDistance: noPhoneProvidedSorted.byWalkingDistance,
          byWalkingTime: noPhoneProvidedSorted.byWalkingTime
        }
      }
      //
      return {
        notSorted: points,
        sorted: sortedPoints
      }
    } else throw new errorHandler.MapsError('getNearby', 'nothing')
  } catch (e) {
    if (errorHandler.isInstancesOf(e)) throw e
    else throw new errorHandler.MapsError(func, 'unknown')
  }
}

module.exports = {
  getNearby
}
