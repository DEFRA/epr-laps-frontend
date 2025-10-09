import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  paymentDocumentsController,
  fileDownloadController
} from './controller.js'
import { fetchWithToken } from '../../server/auth/utils.js'
import { context } from '../../config/nunjucks/context/context.js'
import { statusCodes } from '../common/constants/status-codes.js'

vi.mock('../../server/auth/utils.js')
vi.mock('../../config/nunjucks/context/context.js')

describe('paymentDocumentsController', () => {
  let request
  let h

  beforeEach(() => {
    request = {
      logger: {
        info: vi.fn(),
        error: vi.fn()
      },
      params: {},
      query: {}
    }

    h = {
      view: vi.fn()
    }
  })

  it('renders payment documents with correct rows', async () => {
    const mockContext = {
      currentLang: 'en',
      translations: {
        'laps-home': 'Home',
        'payment-documen': 'Payment documents'
      },
      authedUser: {
        organisationName: 'TestOrg'
      }
    }

    const mockDocs = [
      {
        id: '123',
        creationDate: '2025-01-01',
        documentType: 'grant',
        quarter: 'Q1',
        fileName: 'file1.pdf',
        formattedDate: '1 Jan 2025',
        documentName: 'Grant determination letter Q1'
      },
      {
        id: '456',
        creationDate: '2025-02-01',
        documentType: 'remittance',
        quarter: 'Q2',
        fileName: 'file2.pdf',
        formattedDate: '2 Jan 2025',
        documentName: 'Remittance advice Q2'
      }
    ]

    context.mockResolvedValue(mockContext)
    fetchWithToken.mockResolvedValue(mockDocs)

    await paymentDocumentsController.handler(request, h)

    expect(fetchWithToken).toHaveBeenCalledWith(request, '/documents/TestOrg')
    expect(request.logger.info).toHaveBeenCalledWith(
      'Successfully fetched document metadata for TestOrg'
    )

    const viewArg = h.view.mock.calls[0][1]
    expect(viewArg.rows.length).toBe(2)
    expect(viewArg.pageTitle).toBe('Payment documents')
    expect(viewArg.breadcrumbs).toHaveLength(2)

    const firstRow = viewArg.rows[0]
    expect(firstRow[0].text).toBe('1 Jan 2025')
    expect(firstRow[1].text).toBe('Grant determination letter Q1')
  })

  it('handles fetch errors gracefully', async () => {
    context.mockResolvedValue({
      currentLang: 'en',
      translations: {},
      authedUser: { organisationName: 'TestOrg' }
    })
    fetchWithToken.mockRejectedValue(new Error('API error'))

    await paymentDocumentsController.handler(request, h)

    expect(request.logger.error).toHaveBeenCalled()
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
      query: {}
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

    expect(h.response).toHaveBeenCalledWith(buffer)
    const responseMock = h.response.mock.results[0].value
    expect(responseMock.header).toHaveBeenCalledWith(
      'Content-Type',
      'application/pdf'
    )
    expect(responseMock.header).toHaveBeenCalledWith(
      'Content-Disposition',
      'attachment; filename="123.pdf"'
    )
  })

  it('returns 404 if file not found', async () => {
    fetchWithToken.mockResolvedValue(null)

    await fileDownloadController.handler(request, h)

    const responseMock = h.response.mock.results[0].value
    expect(responseMock.code).toHaveBeenCalledWith(statusCodes.notFound)
  })

  it('handles errors gracefully', async () => {
    fetchWithToken.mockRejectedValue(new Error('API error'))

    await fileDownloadController.handler(request, h)

    expect(request.logger.error).toHaveBeenCalled()
    const responseMock = h.response.mock.results[0].value
    expect(responseMock.code).toHaveBeenCalledWith(500)
  })

  it('should handle missing translations and currentLang', async () => {
    const mockRequest = {
      app: {},
      logger: { info: vi.fn(), error: vi.fn() } // ✅ added logger mock
    }
    const mockedResponse = { redirect: vi.fn(), view: vi.fn() }

    await paymentDocumentsController.handler(mockRequest, mockedResponse)

    expect(mockedResponse.view).toHaveBeenCalledWith(
      'payment-documents/index.njk',
      expect.objectContaining({
        pageTitle: 'Payment documents',
        currentLang: 'en',
        breadcrumbs: [
          { text: undefined, href: '/?lang=en' },
          { text: undefined, href: '/payment-documents?lang=en' }
        ]
      })
    )
  })
})
