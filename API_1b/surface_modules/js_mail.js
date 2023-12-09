const nodemailer = require('nodemailer')
const fs = require('fs/promises')

const mailVerificaionKey = async (email, vkey) => {
  const __htmlPath = './verifEmail.html'

  const __htmlBin = (await fs.readFile(__htmlPath, 'utf8'))
    .replace('xxx', vkey)

  const __serviceEmail = 'raihansyah.harahap@gmail.com'
  const __servicePassword = 'qlpy bkwf vpjj revt'

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: __serviceEmail,
      pass: __servicePassword
    }
  })

  const mailOptions = {
    from: __serviceEmail,
    to: email,
    subject: 'Your ResQHub Verification Key',
    html: __htmlBin
  }

  transporter.sendMail(mailOptions, (err, info) => {
    if (err) {
      console.log(err)
    } else {
      console.log('>', info.response)
    }
  })
}

module.exports = { mailVerificaionKey }
