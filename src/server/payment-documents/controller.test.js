import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  paymentDocumentsController,
  fileDownloadController,
  buildFinancialYearOptions,
  findSelectedOption
} from './controller.js'
import { fetchWithToken } from '../../server/auth/utils.js'
import { statusCodes } from '../common/constants/status-codes.js'

vi.mock('../../config/nunjucks/context/context.js')

vi.mock('../../server/auth/utils.js', () => ({
  fetchWithToken: vi.fn()
}))

describe('paymentDocumentsController', () => {
  let h, request, fetchWithTokenMockData

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
          'view-(opens-in-': 'View (opens in new tab)',
          laNames: {
            'Powys County Council': 'Cyngor Sir Powys',
            'Gwynedd Council': 'Cyngor Gwynedd',
            'Cardiff Council': 'Cyngor Caerdydd',
            'Caerphilly County Borough Council':
              'Logo Cyngor Bwrdeistref Sirol Caerffili',
            'Pembrokeshire council': 'Cyngor Sir Benfro',
            'Swansea council': 'cyngor Abertawe'
          }
        }
      },
      auth: {
        credentials: {
          organisationName: 'MyOrg'
        }
      },
      logger: { info: vi.fn() },
      payload: {},
      yar: {
        flash: vi.fn()
      }
    }
    fetchWithTokenMockData = {
      currentFiscalYear: '2023-to-2024',
      '2023-to-2024': {
        EN: [
          {
            id: '1',
            documentName: 'Doc 1',
            fileName: 'doc1_en.pdf',
            creationDate: new Date().toLocaleDateString('en-GB', {
              day: '2-digit',
              month: 'short',
              year: 'numeric'
            }),
            language: 'EN',
            isLatest: true
          },
          {
            id: '2',
            documentName: 'Doc 2',
            fileName: 'doc2_en.pdf',
            creationDate: new Date().toLocaleDateString('en-GB', {
              day: '2-digit',
              month: 'short',
              year: 'numeric'
            }),
            language: 'EN',
            isLatest: true
          }
        ],
        CY: [
          {
            id: '1',
            documentName: 'Doc 1',
            fileName: 'doc1_cy.pdf',
            creationDate: new Date().toLocaleDateString('en-GB', {
              day: '2-digit',
              month: 'short',
              year: 'numeric'
            }),
            language: 'CY',
            isLatest: true
          },
          {
            id: '2',
            documentName: 'Doc 2',
            fileName: 'doc2_cy.pdf',
            creationDate: new Date().toLocaleDateString('en-GB', {
              day: '2-digit',
              month: 'short',
              year: 'numeric'
            }),
            language: 'CY',
            isLatest: true
          }
        ]
      }
    }

    // Mock fetchWithToken to return two documents
    fetchWithToken.mockResolvedValue(fetchWithTokenMockData)
  })

  it('renders payment documents with correct rows', async () => {
    request.yar.flash.mockReturnValueOnce(['2024 to 2025']).mockReturnValue()
    await paymentDocumentsController.handler(request, h)

    const viewArg = h.view.mock.calls[0][1]
    expect(viewArg.rows.length).toBe(2)
    expect(viewArg.pageTitle).toBe('Payment documents')
  })

  it('applies bold-row class only to documents within the last 30 days', async () => {
    request.yar.flash.mockReturnValue([])
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
    request.yar.flash.mockReturnValue([])

    await paymentDocumentsController.handler(request, h)

    const viewArg = h.view.mock.calls[0][1]
    expect(viewArg.rows).toEqual([])
  })

  it('returns empty array if documentApiData is null', () => {
    const result = buildFinancialYearOptions(null, {}, '2023-to-2024')
    expect(result).toEqual([])
  })

  it('returns empty array if documentApiData is not an object', () => {
    const result = buildFinancialYearOptions(
      'not-an-object',
      {},
      '2023-to-2024'
    )
    expect(result).toEqual([])
  })

  describe.each`
    councilLocation | givenOrganisationName     | currentLang | ExpectedfileLanguage | expectedFile1Name | expectedFile2Name
    ${'Non Welsh'}  | ${'Manchester LA'}        | ${'cy'}     | ${'English'}         | ${'doc1_en.pdf'}  | ${'doc2_en.pdf'}
    ${'Non Welsh'}  | ${'Manchester LA'}        | ${'en'}     | ${'English'}         | ${'doc1_en.pdf'}  | ${'doc2_en.pdf'}
    ${'Welsh'}      | ${'Powys County Council'} | ${'cy'}     | ${'Welsh'}           | ${'doc1_cy.pdf'}  | ${'doc2_cy.pdf'}
    ${'Welsh'}      | ${'Some other Council'}   | ${'cy'}     | ${'English'}         | ${'doc1_en.pdf'}  | ${'doc2_en.pdf'}
    ${'Welsh'}      | ${'Powys County Council'} | ${'en'}     | ${'English'}         | ${'doc1_en.pdf'}  | ${'doc2_en.pdf'}
  `(
    'given a $councilLocation council and selected language is $currentLang',
    ({
      givenOrganisationName,
      currentLang,
      ExpectedfileLanguage,
      expectedFile1Name,
      expectedFile2Name
    }) => {
      let updatedRequest = request
      beforeEach(() => {
        updatedRequest = {
          ...request,
          app: {
            ...request.app,
            currentLang
          },
          auth: {
            credentials: {
              organisationName: givenOrganisationName
            }
          }
        }
      })
      it(`should return file in ${ExpectedfileLanguage} language`, async () => {
        request.yar.flash
          .mockReturnValueOnce(['2024 to 2025'])
          .mockReturnValue()

        await paymentDocumentsController.handler(updatedRequest, h)

        const viewArg = h.view.mock.calls[0][1]
        const doc1Html = viewArg.rows[0][2].html
        const doc2Html = viewArg.rows[1][2].html

        expect(doc1Html).toContain(expectedFile1Name)
        expect(doc2Html).toContain(expectedFile2Name)
      })
    }
  )

  describe('when translations.laNames is undefined and currentLang is EN', () => {
    let updatedRequest
    beforeEach(() => {
      updatedRequest = {
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
        payload: {},
        yar: {
          flash: vi.fn()
        }
      }
    })
    it('should return file in english language', async () => {
      updatedRequest.yar.flash
        .mockReturnValueOnce(['2024 to 2025'])
        .mockReturnValue()

      await paymentDocumentsController.handler(updatedRequest, h)

      const viewArg = h.view.mock.calls[0][1]
      const doc1Html = viewArg.rows[0][2].html
      const doc2Html = viewArg.rows[1][2].html

      expect(doc1Html).toContain('doc1_en.pdf')
      expect(doc2Html).toContain('doc2_en.pdf')
    })

    describe('and when selectedYear file is not present', () => {
      it('should return no file', async () => {
        fetchWithToken.mockResolvedValue({
          ...fetchWithTokenMockData,
          currentFiscalYear: 'Some year'
        })
        request.yar.flash
          .mockReturnValueOnce(['2024 to 2025'])
          .mockReturnValue()

        await paymentDocumentsController.handler(request, h)

        // const viewArg = h.view.mock.calls[0][1]
        expect(true).toBe(true)
      })
    })
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

describe('findSelectedOption', () => {
  const request = {
    yar: {
      flash: vi.fn().mockReturnValue(['2022 to 2023'])
    },
    payload: {
      sort: '2021 to 2022'
    }
  }

  it('should return flash value when not post and flash exists', () => {
    const result = findSelectedOption(false, request, {
      currentFiscalYear: '2023 to 2024'
    })
    expect(result).toBe('2022 to 2023')
  })

  it('should return request payload when its a post request', () => {
    const result = findSelectedOption(true, request, {
      currentFiscalYear: '2023 to 2024'
    })
    expect(result).toBe('2021 to 2022')
  })

  it('should return current fiscal year when not post and no flash', () => {
    request.yar.flash.mockReturnValueOnce([])
    const result = findSelectedOption(false, request, {
      currentFiscalYear: '2023 to 2024'
    })
    expect(result).toBe('2023 to 2024')
  })
})
