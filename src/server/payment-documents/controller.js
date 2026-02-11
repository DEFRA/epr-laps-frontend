/**
 * A GDS styled Payment documents controller
 */
import { fetchWithToken } from '../../server/auth/utils.js'
import { languageKeys } from '../common/constants/laguages.js'
import { statusCodes } from '../common/constants/status-codes.js'

export const paymentDocumentsController = {
  async handler(request, h) {
    const { currentLang, translations } = request.app
    const organisationName = request.auth.credentials.organisationName

    const isPost = request.method === 'post'

    let documentApiData = {}
    let rows = []
    let financialYearOptions = []
    const documentPath = `/documents/${request.auth.credentials.organisationId}`
    documentApiData = await fetchWithToken(request, documentPath)

    request.logger.info(
      `Successfully fetched document metadata for ${organisationName}`
    )

    // Build financial year dropdown
    const selectedYear = findSelectedOption(isPost, request, documentApiData)

    financialYearOptions = buildFinancialYearOptions(
      documentApiData,
      translations,
      selectedYear
    )
    // Determine which year to show
    const yearToShow =
      selectedYear && documentApiData[selectedYear]
        ? selectedYear
        : Object.keys(documentApiData).find((key) => key.includes('to'))

    // Determine language to show based on URL param
    const langKey = currentLang.toUpperCase()

    const welshCouncils =
      langKey === languageKeys.cy.toUpperCase()
        ? (translations.laNames ?? {})
        : {}
    const isWelshCouncil =
      langKey === languageKeys.cy.toUpperCase() &&
      Object.keys(welshCouncils).includes(organisationName)

    const docsByYear = documentApiData[yearToShow] || {}
    const docsToShow =
      docsByYear[isWelshCouncil ? langKey : languageKeys.en.toUpperCase()] || []

    rows = buildTableRows(docsToShow, translations)
    request.yar.flash('selectedYear', selectedYear)

    return h.view('payment-documents/index.njk', {
      pageTitle: 'Payment documents',
      currentLang,
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
      currentFY: documentApiData.currentFiscalYear
    })
  }
}

function getTranslationKey(documentName) {
  return documentName
    .toLowerCase()
    .replaceAll(/\s+/g, '-')
    .replaceAll(/q(\d)-q(\d)/gi, (p1, p2) => `q${p1}q${p2}`)
    .replaceAll(/q(\d)/gi, 'q$1')
}

export function buildFinancialYearOptions(
  documentApiData,
  translations,
  selectedYear
) {
  if (!documentApiData || typeof documentApiData !== 'object') {
    return []
  }

  const entries = Object.entries(documentApiData).slice(0, -1)
  return entries.map(([financialYear, _docs]) => ({
    value: financialYear,
    text: financialYear.replace(/\bto\b/, translations['to'] || 'to'),
    selected: financialYear === selectedYear
  }))
}

function buildTableRows(docsToShow, translations) {
  return docsToShow.map((doc) => {
    const downloadLink = `/document/${encodeURIComponent(doc.id)}?docName=${encodeURIComponent(doc.fileName)}`
    const viewLink = `/document/view/${encodeURIComponent(doc.id)}?docName=${encodeURIComponent(doc.fileName)}`

    // Parse date in "DD Mon YYYY" format
    const [day, month, year] = doc.creationDate.split(' ')

    const boldClass = doc.isLatest ? 'bold-row' : ''

    const translationKey = getTranslationKey(doc.documentName)
    const docNameTranslated = translations[translationKey] || doc.documentName
    const monthTranslated = translations[month] || month
    const formattedDateTranslated = `${day} ${monthTranslated} ${year}`

    return [
      { text: formattedDateTranslated, classes: boldClass },
      { text: docNameTranslated, classes: boldClass },
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

export function findSelectedOption(isPost, request, documentApiData) {
  const messages = request.yar.flash('selectedYear')
  if (messages.length > 0 && !isPost) {
    return messages[0]
  }
  return isPost ? request.payload.sort : documentApiData.currentFiscalYear
}

/**
 * Controller to handle file download by ID
 */

export const fileDownloadController = {
  async handler(request, h) {
    const { fileId } = request.params
    const filename = request.query.docName || `${fileId}.pdf`

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
  }
}
