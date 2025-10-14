/**
 * A GDS styled Payment documents controller
 */
import { fetchWithToken } from '../../server/auth/utils.js'
import { statusCodes } from '../common/constants/status-codes.js'

export const paymentDocumentsController = {
  async handler(request, h) {
    const { currentLang, translations } = request.app
    const { organisationName } = request.auth.credentials.organisationName

    const isPost = request.method === 'post'
    const selectedYear = isPost ? request.payload.sort : null

    let documentApiData = {}
    let rows = []
    let financialYearOptions = []
    let currentFY = ''
    let warningText = ''
    try {
      const documentPath = `/documents/${encodeURIComponent(organisationName)}`
      documentApiData = await fetchWithToken(request, documentPath)

      request.logger.info(
        `Successfully fetched document metadata for ${organisationName}`
      )

      // Build financial year dropdown
      currentFY = documentApiData.currentFiscalYear
      warningText = translations['fy-warning-text']
        ? translations['fy-warning-text'].replace('{year}', currentFY)
        : `For the ${currentFY} financial year, there will be a single payment covering quarters 1 and 2.`

      financialYearOptions = buildFinancialYearOptions(
        documentApiData,
        translations,
        selectedYear,
        currentFY
      )

      // Determine which year to show
      const yearToShow =
        selectedYear && documentApiData[selectedYear]
          ? selectedYear
          : Object.keys(documentApiData)[0]

      const docsToShow = documentApiData[yearToShow] || []
      rows = buildTableRows(docsToShow, translations)
    } catch (err) {
      request.logger.error(`Failed to fetch document api data:`, err)
      return h
        .response({ error: 'Failed to fetch document data' })
        .code(statusCodes.internalServerError)
    }

    return h.view('payment-documents/index.njk', {
      pageTitle: 'Payment documents',
      currentLang,
      translations,
      breadcrumbs: [
        {
          text: translations['laps-home'],
          href: `/?lang=${currentLang}`
        },
        {
          text: translations['payment-documen'],
          href: `/payment-documents?lang=${currentLang}`
        }
      ],
      rows,
      financialYearOptions,
      currentFY,
      warningText
    })
  }
}

function getTranslationKey(documentName) {
  return documentName
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/q(\d)-q(\d)/gi, (p1, p2) => `q${p1}q${p2}`)
    .replace(/q(\d)/gi, 'q$1')
}

function buildFinancialYearOptions(
  documentApiData,
  translations,
  selectedYear,
  currentFY
) {
  if (!documentApiData || typeof documentApiData !== 'object') return []

  const entries = Object.entries(documentApiData).slice(0, -1)
  return entries.map(([financialYear, _docs]) => ({
    value: financialYear,
    text: financialYear.replace(/\bto\b/, translations['to'] || 'to'),
    selected: financialYear === (selectedYear || currentFY)
  }))
}

function buildTableRows(docsToShow, translations) {
  return docsToShow.map((doc) => {
    const downloadLink = `/document/${encodeURIComponent(doc.id)}?docName=${encodeURIComponent(doc.fileName)}`
    const viewLink = `/document/view/${encodeURIComponent(doc.id)}?docName=${encodeURIComponent(doc.fileName)}`

    // Translate month and document name
    const [day, month, year] = doc.creationDate.split(' ')
    const monthTranslated = translations[month] || month
    const formattedDateTranslated = `${day} ${monthTranslated} ${year}`

    const translationKey = getTranslationKey(doc.documentName)
    const docNameTranslated = translations[translationKey] || doc.documentName

    return [
      { text: formattedDateTranslated },
      { text: docNameTranslated },
      {
        html: `<a href='${downloadLink}' download class='govuk-link'>
                ${translations.download}
                <span class='govuk-visually-hidden'>
                  ${doc.creationDate} ${doc.documentName}
                </span></a>`,
        classes: 'govuk-table__cell--numeric'
      },
      {
        html: `<a href='${viewLink}' target='_blank' rel='noopener' class='govuk-link'>
                ${translations['view-(opens-in-']}
                <span class='govuk-visually-hidden'>
                  ${doc.creationDate} ${doc.documentName}
                </span></a>`,
        classes: 'govuk-table__cell--numeric'
      }
    ]
  })
}

/**
 * Controller to handle file download by ID
 */

export const fileDownloadController = {
  async handler(request, h) {
    const { fileId } = request.params
    const filename = request.query.docName || `${fileId}.pdf`

    try {
      const documentPath = `/document/${encodeURIComponent(fileId)}`
      const apiResponse = await fetchWithToken(request, documentPath)
      request.logger.info(`Fetched file metadata for ID: ${fileId}`)

      if (Buffer.isBuffer(apiResponse)) {
        return h
          .response(apiResponse)
          .header('Content-Type', 'application/pdf')
          .header('Content-Disposition', `inline; filename="${filename}"`)
      }

      return h.response('File not found').code(statusCodes.notFound)
    } catch (err) {
      request.logger.error(`Failed to fetch file ${fileId}:`, err)
      return h
        .response('Internal server error')
        .code(statusCodes.internalServerError)
    }
  }
}
