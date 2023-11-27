import { PROTOCOL, DOMAIN } from './side-methods-js'

const t = async () => {
  await fetch(`${PROTOCOL}://${DOMAIN}/emailClient`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      clientEmail: document.getElementById('fEmail').value
    })
  })
  alert("We've sent you the API key. Check the spam folder if it doesn't come up in the inbox.")
}

document.getElementById('submit-button').onclick = t
