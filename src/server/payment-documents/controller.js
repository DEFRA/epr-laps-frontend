/**
 * A GDS styled Payment documents controller
 */
import { fetchWithToken } from '../../server/auth/utils.js'
import { format } from 'date-fns'
import { context } from '../../config/nunjucks/context/context.js'
import { statusCodes } from '../common/constants/status-codes.js'

export const paymentDocumentsController = {
  async handler(request, h) {
    const viewContext = await context(request)
    const { currentLang, translations } = viewContext
    const { organisationName } = viewContext.authedUser

    let documentApiData = []
    let rows = []
    try {
      const documentPath = `/file/metadata/${encodeURIComponent(organisationName)}`
      documentApiData = await fetchWithToken(request, documentPath)

      request.logger.info(
        `Successfully fetched document metadata for ${organisationName}`
      )

      rows = documentApiData.map((doc) => {
        const formattedDate = format(new Date(doc.creationDate), 'd MMM yyyy')
        const displayName = `${
          doc.documentType === 'grant'
            ? 'Grant determination letter'
            : 'Remittance Advice'
        } ${doc.quarter}`

        const viewLink = `/public/pdfs/${encodeURIComponent(doc.fileName)}`

        return [
          { text: formattedDate },
          { text: displayName },
          {
            html: `<a href="/file/${encodeURIComponent(doc.id)}?filename=${encodeURIComponent(doc.fileName)}" class="govuk-link">
                    Download <span class="govuk-visually-hidden">${formattedDate} ${displayName}</span>
                   </a>`,
            classes: 'govuk-table__cell--numeric'
          },
          {
            html: `<a href="${viewLink}" target="_blank" class="govuk-link">
                    View (opens in a new tab) <span class="govuk-visually-hidden">${formattedDate} ${displayName}</span>
                   </a>`,
            classes: 'govuk-table__cell--numeric'
          }
        ]
      })
    } catch (err) {
      request.logger.error(`Failed to fetch document api data:`, err)
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
      rows
    })
  }
}

/**
 * Controller to handle file download by ID
 */

export const fileDownloadController = {
  async handler(request, h) {
    const { fileId } = request.params
    const filename = request.query.filename || `${fileId}.pdf`

    try {
      const documentPath = `/file/${encodeURIComponent(fileId)}`
      const apiResponse = await fetchWithToken(request, documentPath)
      request.logger.info(`Fetched file metadata for ID: ${fileId}`)

      if (apiResponse?.url) {
        return h.redirect(apiResponse.url)
      }

      if (Buffer.isBuffer(apiResponse)) {
        return h
          .response(apiResponse)
          .header('Content-Type', 'application/pdf')
          .header('Content-Disposition', `attachment; filename="${filename}"`)
      }

      return h.response('File not found').code(statusCodes.notFound)
    } catch (err) {
      request.logger.error(`Failed to download file ${fileId}:`, err)
      return h.response('Internal server error').code(500)
    }
  }
}
