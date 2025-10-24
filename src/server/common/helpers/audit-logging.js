import { audit } from '@defra/cdp-auditing'
import { v4 as uuidv4 } from 'uuid'

export const Outcome = {
  Success: 'Success',
  Failure: 'Failure'
}

export const ActionKind = {
  BankDetailsConfirmed: 'BankDetailsConfirmed',
  DocumentAccessed: 'DocumentAccessed',
  DocumentsListed: 'DocumentsListed',
  FullBankDetailsViewed: 'FullBankDetailsViewed',
  MaskedBankDetailsViewed: 'MaskedBankDetailsViewed'
}

export const Action = {
  '/payment-documents': {
    get: {
      kind: ActionKind.DocumentsListed
    }
  },
  '/document/view': {
    get: {
      kind: ActionKind.DocumentAccessed
    }
  },
  '/bank-details': {
    get: {
      kind: ActionKind.DocumentsListed
    },
    put: {
      kind: ActionKind.BankDetailsConfirmed
    }
  }
}

export const writeAuditLog = (request, action, outcome) => {
  if (!action) {
    return
  }
  const auditLogData = {
    log_id: uuidv4(),
    user_id: request.auth.credentials.sub,
    user_email: request.auth.credentials.email,
    user_first_name: request.auth.credentials.firstName,
    user_last_name: request.auth.credentials.lastName,
    user_role: request.auth.credentials.role,
    local_authority_name: request.auth.credentials.currentOrganisation,
    action_kind: action,
    outcome
  }
  request.logger.debug(`Audit log: ${JSON.stringify(auditLogData)}`)
  audit(auditLogData)
}
