import { setDefaultCookiePolicy } from './cookies.js'
import { config } from '../../../config/config.js'

vi.mock('../../../config/config.js', () => ({
  config: {
    get: vi.fn()
  }
}))

describe('setDefaultCookiePolicy', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('should call response.state with correct cookie name, value, and options', () => {
    const mockState = vi.fn()
    const mockResponse = { state: mockState }

    config.get.mockReturnValue(123456)

    setDefaultCookiePolicy(mockResponse)

    expect(mockState).toHaveBeenCalledWith(
      'cookie_policy',
      JSON.stringify({
        essential: true,
        settings: false,
        usage: false,
        campaigns: false
      }),
      { maxAge: 123456 }
    )
  })

  test('should handle when hOrResponse is a toolkit with a response() method', () => {
    const mockState = vi.fn()
    const mockResponse = { state: mockState }
    const mockToolkit = { response: vi.fn(() => mockResponse) }

    config.get.mockReturnValue(654321)

    const result = setDefaultCookiePolicy(mockToolkit)

    expect(mockToolkit.response).toHaveBeenCalled()
    expect(mockState).toHaveBeenCalledWith(
      'cookie_policy',
      JSON.stringify({
        essential: true,
        settings: false,
        usage: false,
        campaigns: false
      }),
      { maxAge: 654321 }
    )
    expect(result).toBe(mockResponse)
  })

  test('should return the same response object passed in', () => {
    const mockResponse = { state: vi.fn() }
    config.get.mockReturnValue(1000)

    const result = setDefaultCookiePolicy(mockResponse)
    expect(result).toBe(mockResponse)
  })
})
