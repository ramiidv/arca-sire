// Main class
export { ArcaSire } from './arca-sire.js';

// Error classes (base from common, domain-specific local)
export {
  ArcaError,
  ArcaAuthError,
  ArcaSoapError,
  ArcaServiceError,
  ArcaSireError,
  ArcaSireServiceError,
} from './errors.js';

// Low-level client
export { SireClient, type SireClientConfig } from './sire-client.js';

// WSAA re-export
export { WsaaClient } from './wsaa.js';
export type { WsaaClientConfig } from './wsaa.js';

// Types
export type {
  ArcaSireConfig,
  AccessTicket,
  WsAuth,
  SoapCallOptions,
  ServerStatus,
  ArcaEvent,
  Retencion,
  RetencionResult,
  CertificadoRetencion,
  ConsultaRetencionesParams,
  ConsultaRetencionesResult,
  RegimenItem,
  AlicuotaItem,
  TipoComprobanteItem,
  TipoOperacionItem,
  CondicionItem,
} from './types.js';

// Constants and enums
export {
  ENDPOINTS,
  TipoComprobante,
  TipoRetencion,
  Regimen,
  TipoOperacion,
  CondicionSujeto,
  EstadoComprobante,
} from './constants.js';

// Validation
export {
  validateRetencion,
  validatePeriodo,
} from './validation.js';
export { ArcaValidationError } from '@ramiidv/arca-common';
export type { ValidationErrorDetail } from '@ramiidv/arca-common';

// Utilities (from common)
export { ensureArray, parseXml, buildXml, checkServiceErrors } from './soap-client.js';
