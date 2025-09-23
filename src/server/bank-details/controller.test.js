import { bankDetailsController } from './controller.js'
import { vi, describe, test, beforeEach, expect } from 'vitest'
import axios from 'axios'
import { context } from './../../config/nunjucks/context/context.js'

vi.mock('axios')
vi.mock('./../../config/nunjucks/context/context.js')

describe('#bankDetailsController', () => {
  const h = {
    view: vi.fn(),
    response: vi.fn().mockReturnThis(),
    code: vi.fn().mockReturnThis()
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('should return 401 if user is unauthenticated', async () => {
    context.mockResolvedValue({ authedUser: null })

    const request = { app: {} }
    await bankDetailsController.handler(request, h)

    expect(h.response).toHaveBeenCalledWith({ error: 'Unauthorized' })
    expect(h.code).toHaveBeenCalledWith(401)
  })

  test('should render view with API data for authenticated user', async () => {
    const apiData = { bankName: 'Test Bank' }
    context.mockResolvedValue({ authedUser: { token: 'token123' } })
    axios.get.mockResolvedValue({ data: apiData })

    const request = {
      app: {
        translations: {
          'bank-details': 'Bank details',
          'laps-home': 'LAPs home'
        },
        currentLang: 'en'
      }
    }

    await bankDetailsController.handler(request, h)

    expect(axios.get).toHaveBeenCalledWith(expect.any(String), {
      headers: { Authorization: 'Bearer token123' }
    })

    expect(h.view).toHaveBeenCalledWith(
      'bank-details/index.njk',
      expect.objectContaining({
        pageTitle: 'Bank Details',
        heading: 'Glamshire County Council',
        translations: request.app.translations,
        currentLang: 'en',
        apiData
      })
    )
  })

  test('should fallback to empty translations and en for currentLang', async () => {
    const apiData = { bankName: 'Test Bank' }
    context.mockResolvedValue({ authedUser: { token: 'token123' } })
    axios.get.mockResolvedValue({ data: apiData })

    const request = { app: {} }

    await bankDetailsController.handler(request, h)

    const viewArgs = h.view.mock.calls[0][1]
    expect(viewArgs.translations).toEqual({})
    expect(viewArgs.currentLang).toBe('en')
  })

  test('should return 500 if API call fails', async () => {
    context.mockResolvedValue({ authedUser: { token: 'token123' } })
    axios.get.mockRejectedValue(new Error('API error'))

    const request = { app: {} }
    await bankDetailsController.handler(request, h)

    expect(h.response).toHaveBeenCalledWith({
      error: 'Failed to fetch bank details'
    })
    expect(h.code).toHaveBeenCalledWith(500)
  })
})
