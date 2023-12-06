const Hapi = require('@hapi/hapi')
const routers = require('./surface_modules/js_routers')

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

  server.route(routers)

  await server.start()
  console.log(`This server is listening at ${server.info.uri}`)
}

start()
