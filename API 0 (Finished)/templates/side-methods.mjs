export const PROTOCOL = 'https'
export const DOMAIN = 'resqhub-survey-y2mk2btioa-et.a.run.app'

export const RESPONSES = {
  voteup: [],
  votedown: []
}
const TODAY = (new Date()).getDay()

export async function writeDetails (jT, parentId, prioritize = 1, emphasize = false) {
  const parent = document.getElementById(parentId)
  let divParent = 0

  divParent = document.createElement('div')
  divParent.className = 'show'

  const texts = [
    document.createElement('p'),
    document.createElement('p'),
    document.createElement('p'),
    document.createElement('p'),
    document.createElement('p'),
    document.createElement('p')
  ]
  const button0 = document.createElement('button')
  const button1 = document.createElement('button')
  const button2 = document.createElement('button')

  const tsplitString = jT.name.toString().toLowerCase().split(' ')
  jT.name = ''

  for (const p in tsplitString) {
    if (typeof tsplitString[p][0] === 'undefined') continue
    jT.name += tsplitString[p][0].toString().toUpperCase() + tsplitString[p].slice(1) + ' '
  }
  texts[0].innerHTML = jT.name
  texts[1].innerHTML = (typeof jT.regHours === 'undefined') ? '&#x1F552; Not provided' : `&#x1F552; ${jT.regHours.weekdayDescriptions[(TODAY + 6) % 7]}`
  texts[2].innerHTML = (typeof jT.phone === 'undefined') ? '&#x1F198; Not Provided' : `&#x1F198; ${jT.phone}`
  texts[3].innerHTML = (typeof jT.rating === 'undefined') ? '&#x2B50; Not Rated' : `&#x2B50; ${jT.rating} (${jT.count})`
  if (jT.distance.driving < 1000) {
    texts[4].innerHTML = `&#x1F694; ${jT.distance.driving} m (${jT.duration.driving})`
  } else {
    texts[4].innerHTML = `&#x1F694; ${(jT.distance.driving / 1000).toFixed(2)} km (${jT.duration.driving})`
  }
  if (jT.distance.walking < 1000) {
    texts[5].innerHTML = `&#x1F6B6; ${jT.distance.walking} m (${jT.duration.walking})`
  } else {
    texts[5].innerHTML = `&#x1F6B6; ${(jT.distance.walking / 1000).toFixed(2)} km (${jT.duration.walking})`
  }

  texts[0].style = 'margin-top: 10px; color: cornsilk; text-align: left; font-size:3vh;'
  if (typeof jT.regHours === 'undefined') {
    texts[1].style = 'color: orange; '
  } else {
    if (jT.regHours.openNow === true) {
      texts[1].style = 'color: green;'
    } else {
      texts[1].style = 'color: red;'
      texts[1].innerHTML = `${texts[1].innerHTML} (CLOSED)`
    }
  }
  if (typeof jT.phone === 'undefined') {
    texts[2].style = 'color: orange;'
  } else {
    texts[2].style = 'color: green'
  }
  if (typeof jT.rating === 'undefined') {
    texts[3].style = 'color: orange;'
  } else {
    texts[3].style = 'color: green;'
  }
  texts[5].style = 'margin-bottom: 10px;'
  button0.innerHTML = '&#x1F5FA; Copy Google Maps link'
  button1.innerHTML = '&#x2705; Vote Up'
  button2.innerHTML = '&#x26D4; Vote Down'

  button1.setAttribute('id', `${jT.id}-${emphasize}-btn1`)
  button2.setAttribute('id', `${jT.id}-${emphasize}-btn2`)

  button0.onclick = function () {
    window.location.href = jT.uri
  }
  button1.onclick = function () {
    if (Object.keys(RESPONSES.voteup.filter((item) => Boolean(item.name === jT.name)))
      .length === 0) {
      RESPONSES.votedown = RESPONSES.votedown.filter((item) => Boolean(item.name !== jT.name))
      RESPONSES.voteup.push(jT)
      button1.innerHTML += ' (picked)'
      button2.innerHTML = '&#x26D4; Vote Down'
      divParent.style = 'background-color: rgba(51, 255, 133, 0.09);'
    }
    getStats()
    try { document.getElementById('sos').remove() } catch {}
  }
  button2.onclick = function () {
    if (Object.keys(RESPONSES.votedown.filter((item) => Boolean(item.name === jT.name)))
      .length === 0) {
      RESPONSES.voteup = RESPONSES.voteup.filter((item) => Boolean(item.name !== jT.name))
      RESPONSES.votedown.push(jT)
      button2.innerHTML += ' (picked)'
      button1.innerHTML = '&#x2705; Vote Up'
      divParent.style = 'background-color: rgba(255, 51, 51, 0.09);'
    }
    getStats()
    try { document.getElementById('sos').remove() } catch {}
  }

  const temp = texts[1]
  texts[1] = texts[prioritize]
  texts[prioritize] = temp
  if (emphasize) {
    texts[1].style = 'font-size: 2.5vh;'
  }

  for (const i in texts) {
    divParent.append(texts[i])
  }
  divParent.append(button0)
  divParent.append(button1)
  divParent.append(button2)
  parent.append(divParent)
}

export async function getStats () {
  document.getElementById('submit-button').style = 'margin-top: 20px; visibility: visible;'
  const statisticArrays = {
    voteup: {
      ratings: [],
      distances: {
        driving: [],
        walking: []
      },
      durations: {
        driving: [],
        walking: []
      }
    },
    votedown: {
      ratings: [],
      distances: {
        driving: [],
        walking: []
      },
      durations: {
        driving: [],
        walking: []
      }
    }
  }

  for (const node in RESPONSES.voteup) {
    if (RESPONSES.voteup[node].rating !== undefined) {
      statisticArrays.voteup.ratings.push(RESPONSES.voteup[node].rating)
    }
    statisticArrays.voteup.distances.driving.push(RESPONSES.voteup[node].distance.driving)
    statisticArrays.voteup.distances.walking.push(RESPONSES.voteup[node].distance.walking)
    statisticArrays.voteup.durations.driving.push(RESPONSES.voteup[node].duration.drivingRaw)
    statisticArrays.voteup.durations.walking.push(RESPONSES.voteup[node].duration.walkingRaw)
  }
  for (const node in RESPONSES.votedown) {
    if (RESPONSES.votedown[node].rating !== undefined) {
      statisticArrays.votedown.ratings.push(RESPONSES.votedown[node].rating)
    }
    statisticArrays.votedown.distances.driving.push(RESPONSES.votedown[node].distance.driving)
    statisticArrays.votedown.distances.walking.push(RESPONSES.votedown[node].distance.walking)
    statisticArrays.votedown.durations.driving.push(RESPONSES.votedown[node].duration.drivingRaw)
    statisticArrays.votedown.durations.walking.push(RESPONSES.votedown[node].duration.walkingRaw)
  }
  const summary = {
    voteup: {
      rating: {
        avg: await getAvg(statisticArrays.voteup.ratings),
        std: await getStDev(statisticArrays.voteup.ratings)
      },
      distances: {
        driving: {
          avg: await getAvg(statisticArrays.voteup.distances.driving),
          std: await getStDev(statisticArrays.voteup.distances.driving)
        },
        walking: {
          avg: await getAvg(statisticArrays.voteup.distances.walking),
          std: await getStDev(statisticArrays.voteup.distances.walking)
        }
      },
      durations: {
        driving: {
          avg: await getAvg(statisticArrays.voteup.durations.driving),
          std: await getStDev(statisticArrays.voteup.durations.driving)
        },
        walking: {
          avg: await getAvg(statisticArrays.voteup.durations.walking),
          std: await getStDev(statisticArrays.voteup.durations.walking)
        }
      }
    },
    votedown: {
      rating: {
        avg: await getAvg(statisticArrays.votedown.ratings),
        std: await getStDev(statisticArrays.votedown.ratings)
      },
      distances: {
        driving: {
          avg: await getAvg(statisticArrays.votedown.distances.driving),
          std: await getStDev(statisticArrays.votedown.distances.driving)
        },
        walking: {
          avg: await getAvg(statisticArrays.votedown.distances.walking),
          std: await getStDev(statisticArrays.votedown.distances.walking)
        }
      },
      durations: {
        driving: {
          avg: await getAvg(statisticArrays.votedown.durations.driving),
          std: await getStDev(statisticArrays.votedown.durations.driving)
        },
        walking: {
          avg: await getAvg(statisticArrays.votedown.durations.walking),
          std: await getStDev(statisticArrays.votedown.durations.walking)
        }
      }
    }
  }

  const divParent = document.createElement('div')
  divParent.className = 'show'
  const texts = [
    document.createElement('p'),
    document.createElement('p'),
    document.createElement('p'),
    document.createElement('p'),
    document.createElement('p')
  ]
  texts[0].innerHTML = `Average Rating: ${summary.voteup.rating.avg} (stdev: ${summary.voteup.rating.std})`
  texts[1].innerHTML = `Average Distance Driving: ${summary.voteup.distances.driving.avg} (stdev: ${summary.voteup.distances.driving.std})`
  texts[2].innerHTML = `Average Distance Walking: ${summary.voteup.distances.walking.avg} (stdev: ${summary.voteup.distances.walking.std})`
  texts[3].innerHTML = `Average Duration Driving: ${summary.voteup.durations.driving.avg} (stdev: ${summary.voteup.durations.driving.std})`
  texts[4].innerHTML = `Average Duration Walking: ${summary.voteup.durations.walking.avg} (stdev: ${summary.voteup.durations.walking.std})`

  const data = [
    {
      data: ['Context', ' Avg ', ' Stdev '],
      style: [
        'font-size: 2.2vh; width: 65%;',
        'font-size: 2.2vh; width: 17.5%;',
        'font-size: 2.2vh; width: 17.5%;']
    },
    {
      data: ['Rating', (summary.voteup.rating.avg).toFixed(1), (summary.voteup.rating.std).toFixed(1)],
      style: ['', 'text-align: center;', 'text-align: center;']
    },
    {
      data: ['&#x1F4CF; DISTANCES'],
      style: ['background-color: rgba(255, 255, 51, 0.085);']
    },
    {
      data: ['Vote-Ups'],
      style: ['color: green;']
    },
    {
      data: [
        'Driving (in km)',
        (summary.voteup.distances.driving.avg / 1000).toFixed(2),
        (summary.voteup.distances.driving.std / 1000).toFixed(2)
      ],
      style: ['', 'text-align: center;', 'text-align: center;']
    },
    {
      data: [
        'Walking (in km)',
        (summary.voteup.distances.walking.avg / 1000).toFixed(2),
        (summary.voteup.distances.walking.std / 1000).toFixed(2)
      ],
      style: ['', 'text-align: center;', 'text-align: center;']
    },
    {
      data: ['Vote-Downs'],
      style: ['color: red;']
    },
    {
      data: [
        'Driving (in km)',
        (summary.votedown.distances.driving.avg / 1000).toFixed(2),
        (summary.votedown.distances.driving.std / 1000).toFixed(2)
      ],
      style: ['', 'text-align: center;', 'text-align: center;']
    },
    {
      data: [
        'Walking (in km)',
        (summary.votedown.distances.walking.avg / 1000).toFixed(2),
        (summary.votedown.distances.walking.std / 1000).toFixed(2)
      ],
      style: ['', 'text-align: center;', 'text-align: center;']
    },
    {
      data: ['&#x23F1; DURATIONS'],
      style: ['background-color: rgba(255, 255, 51, 0.085);']
    },
    {
      data: ['Vote-Ups'],
      style: ['color: green;']
    },
    {
      data: [
        'Driving (in mins)',
        (summary.voteup.durations.driving.avg / 60).toFixed(2),
        (summary.voteup.durations.driving.std / 60).toFixed(2)
      ],
      style: ['', 'text-align: center;', 'text-align: center;']
    },
    {
      data: [
        'Walking (in mins)',
        (summary.voteup.durations.walking.avg / 60).toFixed(2),
        (summary.voteup.durations.walking.std / 60).toFixed(2)
      ],
      style: ['', 'text-align: center;', 'text-align: center;']
    },
    {
      data: ['Vote-Downs'],
      style: ['color: red;']
    },
    {
      data: [
        'Driving (in mins)',
        (summary.votedown.durations.driving.avg / 60).toFixed(2),
        (summary.votedown.durations.driving.std / 60).toFixed(2)
      ],
      style: ['', 'text-align: center;', 'text-align: center;']
    },
    {
      data: [
        'Walking (in mins)',
        (summary.votedown.durations.walking.avg / 60).toFixed(2),
        (summary.votedown.durations.walking.std / 60).toFixed(2)
      ],
      style: ['', 'text-align: center;', 'text-align: center;']
    }
  ]
  document.getElementById('detailsum-div-id').appendChild(await writeTable(data))
}

export async function writeTable (dataIn) {
  try {
    document.getElementById('my-table').remove()
  } catch {}
  const sumRows = dataIn.length
  const table = document.createElement('table')
  table.setAttribute('id', 'my-table')
  for (let i = 0; i < sumRows; i++) {
    const tr = document.createElement('tr')
    for (let j = 0; j < dataIn[i].data.length; j++) {
      const th = document.createElement((i === 0) ? 'th' : 'td')
      th.innerHTML = dataIn[i].data[j]
      th.style = dataIn[i].style[j]
      tr.appendChild(th)
      if (dataIn[i].data.length === 1) {
        th.setAttribute('colspan', '3')
      }
    }
    table.appendChild(tr)
  }
  return table
}

export async function getAvg (arr) {
  if (arr.length === 1) {
    return arr[0]
  } else if (arr.length === 0) {
    return 0.00
  }
  return arr.reduce((a, b) => a + b) / arr.length
}

export async function getStDev (arr) {
  if (arr.length === 1) {
    return 0.00
  } else if (arr.length === 0) {
    return 0.00
  }
  const avg = await getAvg(arr)
  return Math.sqrt(arr.map((x) => Math.pow((x - avg), 2)).reduce((a, b) => a + b) / arr.length)
}
