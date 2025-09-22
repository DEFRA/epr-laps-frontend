import Path from 'path'
import Hapi from '@hapi/hapi'
import Vision from '@hapi/vision'
import Nunjucks from 'nunjucks'

let testServer = null

export const initializeTestServer = async () => {
  if (testServer) {
    return testServer
  }

  const server = Hapi.server({
    port: 3000,
    host: 'localhost'
  })

  await server.register(Vision)

  const nunjucksEnv = Nunjucks.configure(
    [
      Path.join(process.cwd(), 'src', 'server', 'common', 'templates'),
      Path.join(process.cwd(), 'node_modules', 'govuk-frontend', 'dist')
    ],
    {
      autoescape: true,
      throwOnUndefined: false,
      trimBlocks: true,
      lstripBlocks: true,
      watch: false,
      noCache: true
    }
  )

  server.views({
    engines: {
      njk: {
        compile: (src, options) => {
          const template = Nunjucks.compile(src, options.environment)
          return (context) => template.render(context)
        }
      }
    },
    path: Path.join(process.cwd(), 'src', 'server', 'common', 'templates'),
    compileOptions: {
      environment: nunjucksEnv
    }
  })

  await server.initialize()

  testServer = server
  return server
}
