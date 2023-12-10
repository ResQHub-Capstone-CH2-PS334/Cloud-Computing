import { writeDetails, RESPONSES, PROTOCOL, DOMAIN } from './side-methods-js'

const OPTIONS = {
  enableHighAccuracy: true,
  timeout: 6000,
  maximumAge: 0
}

async function getQueryAt (at) {
  return window.location.search.split('?')[1].split('&')[at].split('=')[1]
}

async function success (pos) {
  const fetchR = await fetch(`${PROTOCOL}://${DOMAIN}/safe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      lat: pos.coords.latitude,
      long: pos.coords.longitude,
      acc: pos.coords.accuracy,
      legalKey: await getQueryAt(0)
    })
  })
  const fetchRJSON = await fetchR.json()
  if (fetchRJSON.status === 'low-accuracy') {
    document.getElementById('ps').innerHTML = `Failed. Please use mobile phone to get better accuracy or try to RELOAD this page.<br><span style="color:cyan;">Your error: ${(pos.coords.accuracy).toFixed(2)} meters. We only accept error below 80 meters.</span>`
    document.getElementById('ps').style = 'font-size: 1.87vh; max-width: 500px; text-align:center; color:red; margin: 0px 20px 0px 20px;'
    return
  } else if (fetchRJSON.status === 'expired') {
    window.location.href = '/expired?requestKey=' + await getQueryAt(0)
  }

  if (pos.coords.accuracy.toFixed() > 60) {
    let p = document.createElement('p')
    p = document.createElement('p')
    p.style = 'text-align: center; color: red; font-family: "ibmplex med"; font-size: 2vh; margin: 0px 20px 10px 20px; max-width:500px;'
    p.innerHTML = 'You have low accuracy (still acceptable, tho..)'
    document.getElementById('second-div').appendChild(p)
  }

  const a = document.createElement('button')
  a.style = 'text-align: center; font-family: "ibmplex med"; width: 150px; font-size: 1.5vh; margin: 8px 0px 0px 0px;'
  a.innerHTML = '- Share Me -'
  a.onclick = () => { window.location.href = fetchRJSON.data.user.gmaps }
  document.getElementById('second-div').appendChild(a)

  const texts = [
    ['&#x1F4EB; Address: ' + fetchRJSON.data.user.address, document.createElement('p')],
    ['&#x2B06; Latitude: ' + pos.coords.latitude, document.createElement('p')],
    ['&#x27A1; Longitude: ' + pos.coords.longitude, document.createElement('p')],
    ['&#x1F3AF; Inaccurate by: ' + pos.coords.accuracy.toFixed() + ' meters', document.createElement('p')]
  ]

  for (const i in texts) {
    const div = document.createElement('div')
    div.className = 'show'
    texts[i][1].style = 'text-align: left; font-size: 1.87vh;'
    texts[i][1].innerHTML = texts[i][0]
    div.append(texts[i][1])
    document.getElementById('detailaddr-div-id').append(div)
  }

  if (fetchRJSON.data.callable.length === undefined) {
    document.getElementById('sos-callable').innerHTML = "We can't find any callable police station nearby."
  } else {
    document.getElementById('sos-callable').remove()
    fetchRJSON.data.callable.forEach((item) => { writeDetails(item, 'detailsos-div-id', 2, true) })
  }

  if (fetchRJSON.data.uncallable.length === undefined) {
    document.getElementById('sos-uncallable').innerHTML = "We can't find any police station nearby."
  } else {
    document.getElementById('sos-uncallable').remove()
    fetchRJSON.data.uncallable.forEach((item) => { writeDetails(item, 'detail-div-id', 2, true) })
  }

  const SOSLegends = document.createElement('p')
  SOSLegends.innerHTML = '&#x1F198; SOS Call, &#x1F552; Open Hours, &#x2B50; Rating, &#x1F694; Driving, &#x1F6B6; Walking'
  SOSLegends.style = 'font-size: 1.6vh; text-align: left'
  document.getElementById('sos-legend').appendChild(SOSLegends)
  document.getElementById('ps').remove()
}

function error (err) {
  document.getElementById('ps').innerHTML = '&#x1F512; We kindly request your consent to enable location sharing for this page.'
  document.getElementById('ps').style = 'font-size: 1.87vh; max-width: 500px; text-align:center; color:orange; margin: 0px 20px 0px 20px;'

  const reloadButton = document.createElement('button')
  reloadButton.innerHTML = 'Reload'
  reloadButton.style = 'margin-top: 10px;'
  reloadButton.onclick = () => {
    location.reload()
  }
  document.getElementById('reldbutt').appendChild(reloadButton)
  console.warn(`ERROR(${err.code}): ${err.message}`)
}

navigator.geolocation.getCurrentPosition(success, error, OPTIONS)

document.getElementById('submit-button').onclick = async () => {
  const fetchR = await fetch(`${PROTOCOL}://${DOMAIN}/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      data: RESPONSES,
      key: await getQueryAt(0)
    })
  })
  const fetchRJSON = await fetchR.json()
  if (fetchRJSON.status === 'stored') {
    window.location.href = `/end?key=${await getQueryAt(0)}`
  } else if (fetchRJSON.status === 'invalid-key') {
    alert('Invalid key!')
  } else {
    alert('Submission failed, please try again.\n' + fetchRJSON.error)
  }
}
