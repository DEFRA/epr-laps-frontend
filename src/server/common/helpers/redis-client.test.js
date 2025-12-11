import { vi } from 'vitest'
import { Cluster, Redis } from 'ioredis'
import { config } from '../../../config/config.js'
import { buildRedisClient } from './redis-client.js'

// Mock ioredis safely
vi.mock('ioredis', async () => {
  const actual = await vi.importActual('ioredis')

  function RedisMock(options) {
    this.options = options
    this.on = vi.fn()
  }

  function ClusterMock(nodes, options) {
    this.nodes = nodes
    this.options = options
    this.on = vi.fn()
  }

  return {
    ...actual,
    Redis: vi.fn(RedisMock), // Spy around the constructor
    Cluster: vi.fn(ClusterMock) // Spy around the constructor
  }
})

describe('#buildRedisClient', () => {
  describe('When Redis Single InstanceCache is requested', () => {
    beforeEach(() => {
      buildRedisClient(config.get('redis'))
    })

    test('Should instantiate a single Redis client', () => {
      expect(Redis).toHaveBeenCalledWith({
        db: 0,
        host: '127.0.0.1',
        keyPrefix: 'epr-laps-frontend:',
        port: 6379
      })
    })
  })

  describe('When a Redis Cluster is requested', () => {
    beforeEach(() => {
      buildRedisClient({
        ...config.get('redis'),
        useSingleInstanceCache: false,
        useTLS: true,
        username: 'user',
        password: 'pass'
      })
    })

    test('Should instantiate a Redis Cluster client', () => {
      expect(Cluster).toHaveBeenCalledWith(
        [{ host: '127.0.0.1', port: 6379 }],
        {
          dnsLookup: expect.any(Function),
          keyPrefix: 'epr-laps-frontend:',
          redisOptions: { db: 0, password: 'pass', tls: {}, username: 'user' },
          slotsRefreshTimeout: 10000
        }
      )
    })
  })
})
