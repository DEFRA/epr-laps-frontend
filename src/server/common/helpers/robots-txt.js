/**
 * Robots.txt Hapi Plugin
 *
 * Serves robots.txt file from the source directory.
 * File-based approach for simple, maintainable configuration.
 * Reads from src/server/public/robots.txt which is committed to git.
 *
 * @module robotsTxt
 */

import { promises as fs } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { statusCodes } from '../constants/status-codes'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROBOTS_TXT_PATH = path.resolve(__dirname, '../../public/robots.txt')

/**
 * Hapi plugin for serving robots.txt from file
 *
 * @type {Object}
 * @property {string} name - Plugin name
 * @property {string} version - Plugin version
 * @property {Function} register - Hapi plugin register function
 *
 * @example
 * // Register the plugin
 * await server.register(robotsTxt)
 */
export const robotsTxt = {
  name: 'robots-txt',
  version: '1.0.0',

  async register(server) {
    // Read robots.txt content from file
    let robotsContent = ''
    try {
      robotsContent = await fs.readFile(ROBOTS_TXT_PATH, 'utf-8')
    } catch (error) {
      server.logger?.warn(`Failed to read robots.txt: ${error.message}`)
      robotsContent = 'User-agent: *\nDisallow: /\n'
    }

    // Register route to serve robots.txt
    server.route({
      method: 'GET',
      path: '/robots.txt',
      handler: (_request, h) => {
        return h.response(robotsContent).type('text/plain').code(statusCodes.ok)
      },
      options: {
        auth: false,
        cache: {
          privacy: 'public'
        }
      }
    })

    server.logger?.info('Robots.txt plugin registered')
  }
}
