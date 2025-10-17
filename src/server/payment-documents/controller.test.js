import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  paymentDocumentsController,
  fileDownloadController
} from './controller.js'
import { fetchWithToken } from '../../server/auth/utils.js'
import { statusCodes } from '../common/constants/status-codes.js'

vi.mock('../../server/auth/utils.js')
vi.mock('../../config/nunjucks/context/context.js')

describe('paymentDocumentsController', () => {
  let request
  let h

  beforeEach(() => {
    request = {
      logger: { info: vi.fn(), error: vi.fn() },
      params: {},
      query: {},
      // 👇 FIX: match controller’s destructuring (nested organisationName)
      auth: {
        credentials: { organisationName: { organisationName: 'TestOrg' } }
      },
      app: {
        currentLang: 'en',
        translations: {
          'laps-home': 'Home',
          'payment-documen': 'Payment documents',
          download: 'Download'
        }
      }
    }

    h = {
      view: vi.fn(),
      response: vi.fn(() => ({ code: vi.fn() }))
    }
  })

  it('renders payment documents with correct rows', async () => {
    const mockDocs = {
      '2025-26': [
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
      ],
      currentFiscalYear: '2025-26'
    }

    fetchWithToken.mockResolvedValue(mockDocs)

    await paymentDocumentsController.handler(request, h)

    expect(fetchWithToken).toHaveBeenCalledWith(request, '/documents/TestOrg')
    expect(request.logger.info).toHaveBeenCalledWith(
      'Successfully fetched document metadata for TestOrg'
    )

    const viewArg = h.view.mock.calls[0][1]
    expect(viewArg.rows.length).toBe(2)
    expect(viewArg.pageTitle).toBe('Payment documents')
  })

  it('renders page safely when translations are missing', async () => {
    const mockRequest = { ...request, app: {} }
    const mockedResponse = {
      view: vi.fn(),
      response: vi.fn(() => ({ code: vi.fn() }))
    }
    fetchWithToken.mockRejectedValue(new Error('API error'))

    await paymentDocumentsController.handler(mockRequest, mockedResponse)

    expect(mockedResponse.response).toHaveBeenCalledWith({
      error: 'Failed to fetch document data'
    })
  })

  it('applies bold-row class only to documents within the last 30 days', async () => {
    const mockToday = new Date('2025-10-15')
    vi.setSystemTime(mockToday)

    const mockDocs = {
      '2025-26': [
        {
          id: 'recent-doc',
          creationDate: '10 Oct 2025',
          documentType: 'grant',
          quarter: 'Q1',
          fileName: 'recent.pdf',
          documentName: 'Recent Payment Document',
          isLatest: true
        },
        {
          id: 'old-doc',
          creationDate: '01 Sep 2025',
          documentType: 'grant',
          quarter: 'Q2',
          fileName: 'old.pdf',
          documentName: 'Old Payment Document',
          isLatest: false
        }
      ],
      currentFiscalYear: '2025-26'
    }

    fetchWithToken.mockResolvedValue(mockDocs)

    await paymentDocumentsController.handler(request, h)

    const viewArg = h.view.mock.calls[0][1]
    const [recentRow, oldRow] = viewArg.rows

    expect(recentRow[0].classes).toContain('bold-row')
    expect(recentRow[1].classes).toContain('bold-row')

    expect(recentRow[2].classes).not.toContain('bold-row')
    expect(recentRow[3].classes).not.toContain('bold-row')

    oldRow.forEach((cell) => {
      expect(cell.classes || '').not.toContain('bold-row')
    })

    vi.useRealTimers()
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

  it('handles errors gracefully', async () => {
    fetchWithToken.mockRejectedValue(new Error('API error'))

    await fileDownloadController.handler(request, h)

    expect(request.logger.error).toHaveBeenCalled()
    const responseMock = h.response.mock.results[0].value
    expect(responseMock.code).toHaveBeenCalledWith(500)
  })
})
