const fetch = require('node-fetch')

const API_KEY = 'AIzaSyAnIKZjgZshlUmKuGsPdMh3cFjA9TeKeRI'
// const KEY = `key=${API_KEY}`

class MapsError extends Error {
  constructor (__funcitonName, __status) {
    super()
    this.STATUSLIB = {
      nothing: 'found nothing'
    }
    this.funcitonName = __funcitonName
    this.status = __status
    this.description = this.STATUSLIB[__status]
  }

  readError () {
    return {
      status: this.status,
      description: 'at ' + this.funcitonName + '(): ' + this.description
    }
  }
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
      regOpenNow,
      regDescriptions,
      curOpenNow,
      curDescriptions
    }
  })
}

const getNearby = async (__type, __lat, __long, __rad) => {
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
    const phoneProvided = dataPlaces.filter((a) => a.nationalPhoneNumber !== undefined)
    const phoneProvidedBasicInfo = internalGetAllInformation(phoneProvided)
    const noPhoneProvided = dataPlaces.filter((a) => a.nationalPhoneNumber === undefined)
    const nophoneProvidedBasicInfo = internalGetAllInformation(noPhoneProvided)

    console.log(phoneProvidedBasicInfo)
    console.log(nophoneProvidedBasicInfo)
  } else {
    throw new MapsError('getNearby', 'nothing')
  }
  return dataFetch
}

module.exports = {
  MapsError,
  getNearby
}
