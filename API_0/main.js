const Hapi = require('@hapi/hapi')
const { routers } = require('./routers')

async function start () {
  const server = Hapi.server({
    port: 9000,
    host: '0.0.0.0',
    routes: {
      cors: {
        origin: ['*']
      }
    }
  })

  await server.register(require('@hapi/vision'))
  await server.register(require('@hapi/inert'))

  server.views({
    engines: {
      html: require('handlebars')
    },
    relativeTo: __dirname,
    path: './templates'
  })

  server.route(routers)

  await server.start()
  console.log(`This server is listening at ${server.info.uri}`)
}

start()
