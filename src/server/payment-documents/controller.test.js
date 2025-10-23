import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  paymentDocumentsController,
  fileDownloadController
} from './controller.js'
import { fetchWithToken } from '../../server/auth/utils.js'
import { statusCodes } from '../common/constants/status-codes.js'

vi.mock('../../config/nunjucks/context/context.js')

vi.mock('../../server/auth/utils.js', () => ({
  fetchWithToken: vi.fn()
}))

describe('paymentDocumentsController', () => {
  let h, request

  beforeEach(() => {
    h = {
      view: vi.fn().mockReturnValue('rendered')
    }

    request = {
      method: 'get',
      app: {
        currentLang: 'en',
        translations: {
          'laps-home': 'Home',
          'payment-documen': 'Payment documents',
          download: 'Download',
          'view-(opens-in-': 'View (opens in new tab)'
        }
      },
      auth: {
        credentials: {
          organisationName: 'MyOrg'
        }
      },
      logger: { info: vi.fn() },
      payload: {}
    }

    // Mock fetchWithToken to return two documents
    fetchWithToken.mockResolvedValue({
      currentFiscalYear: '2023-to-2024',
      '2023-to-2024': {
        EN: [
          {
            id: '1',
            documentName: 'Doc 1',
            fileName: 'doc1.pdf',
            creationDate: new Date().toLocaleDateString('en-GB', {
              day: '2-digit',
              month: 'short',
              year: 'numeric'
            }),
            isLatest: true
          },
          {
            id: '2',
            documentName: 'Doc 2',
            fileName: 'doc2.pdf',
            creationDate: new Date().toLocaleDateString('en-GB', {
              day: '2-digit',
              month: 'short',
              year: 'numeric'
            }),
            isLatest: true
          }
        ]
      }
    })
  })

  it('renders payment documents with correct rows', async () => {
    await paymentDocumentsController.handler(request, h)

    const viewArg = h.view.mock.calls[0][1]
    expect(viewArg.rows.length).toBe(2)
    expect(viewArg.pageTitle).toBe('Payment documents')
  })

  it('applies bold-row class only to documents within the last 30 days', async () => {
    await paymentDocumentsController.handler(request, h)

    const viewArg = h.view.mock.calls[0][1]
    const [recentRow1, recentRow2] = viewArg.rows

    expect(recentRow1[0].classes).toContain('bold-row')
    expect(recentRow1[1].classes).toContain('bold-row')
    expect(recentRow2[0].classes).toContain('bold-row')
    expect(recentRow2[1].classes).toContain('bold-row')
  })

  it('handles missing docs for year/lang gracefully', async () => {
    fetchWithToken.mockResolvedValue({
      currentFiscalYear: '2023-to-2024',
      '2023-to-2024': { EN: [] }
    })
    request.method = 'get'
    request.app.currentLang = 'es'

    await paymentDocumentsController.handler(request, h)

    const viewArg = h.view.mock.calls[0][1]
    expect(viewArg.rows).toEqual([])
  })
})

describe('fileDownloadController', () => {
  let request
  let h

  beforeEach(() => {
    request = {
      logger: {
        info: vi.fn(),
        error: vi.fn()
      },
      params: { fileId: '123' },
      query: {},
      auth: {
        credentials: {
          organisationName: 'TestOrg'
        }
      }
    }

    const responseMock = {
      header: vi.fn().mockReturnThis(),
      code: vi.fn().mockReturnThis()
    }

    h = {
      redirect: vi.fn(() => responseMock),
      response: vi.fn(() => responseMock)
    }
  })

  it('returns 404 if API returns non-buffer response', async () => {
    fetchWithToken.mockResolvedValue({ url: 'https://example.com/file.pdf' })

    await fileDownloadController.handler(request, h)

    expect(h.response).toHaveBeenCalledWith('File not found')
    const responseMock = h.response.mock.results[0].value
    expect(responseMock.code).toHaveBeenCalledWith(statusCodes.notFound)
  })

  it('returns PDF buffer if API returns a buffer', async () => {
    const buffer = Buffer.from('PDF data')
    fetchWithToken.mockResolvedValue(buffer)

    await fileDownloadController.handler(request, h)

    const responseMock = h.response.mock.results[0].value
    expect(h.response).toHaveBeenCalledWith(buffer)
    expect(responseMock.header).toHaveBeenCalledWith(
      'Content-Type',
      'application/pdf'
    )
    expect(responseMock.header).toHaveBeenCalledWith(
      'Content-Disposition',
      'inline; filename="123.pdf"'
    )
  })

  it('returns 404 if file not found', async () => {
    fetchWithToken.mockResolvedValue(null)

    await fileDownloadController.handler(request, h)

    const responseMock = h.response.mock.results[0].value
    expect(responseMock.code).toHaveBeenCalledWith(statusCodes.notFound)
  })
})
