import { WSAA_ENDPOINTS } from '@ramiidv/arca-common';

// ---------------------------------------------------------------------------
// Endpoints
// ---------------------------------------------------------------------------

export const ENDPOINTS = {
  wsaa: WSAA_ENDPOINTS,
  sire: {
    testing: 'https://fwshomo.afip.gob.ar/sire/ws/v1.0/',
    production: 'https://serviciosjava.afip.gob.ar/sire/ws/v1.0/',
    namespace: 'https://serviciosjava.afip.gob.ar/sire/ws/',
    serviceId: 'sire-ws',
  },
} as const;

// ---------------------------------------------------------------------------
// Tipos de comprobante de retencion/percepcion
// ---------------------------------------------------------------------------

/** Tipos de comprobante que se pueden emitir en SIRE */
export enum TipoComprobante {
  /** Retencion/Percepcion IVA */
  C2005 = 2005,
  /** Retencion Impuesto a las Ganancias - Beneficiarios del exterior */
  C2003 = 2003,
  /** Certificado de retenciones de Seguridad Social */
  C2004 = 2004,
}

// ---------------------------------------------------------------------------
// Tipos de retencion
// ---------------------------------------------------------------------------

/** Tipo de operacion de retencion o percepcion */
export enum TipoRetencion {
  /** Retencion */
  RETENCION = 1,
  /** Percepcion */
  PERCEPCION = 2,
}

// ---------------------------------------------------------------------------
// Regimenes
// ---------------------------------------------------------------------------

/** Regimenes de retencion/percepcion mas comunes */
export enum Regimen {
  /** IVA - Regimen general */
  IVA_GENERAL = 499,
  /** Ganancias - Regimen general */
  GANANCIAS_GENERAL = 1,
  /** SUSS - Regimen general */
  SUSS_GENERAL = 800,
}

// ---------------------------------------------------------------------------
// Tipos de operacion
// ---------------------------------------------------------------------------

/** Tipo de operacion informada */
export enum TipoOperacion {
  /** Operacion normal */
  NORMAL = 1,
  /** Anulacion */
  ANULACION = 2,
}

// ---------------------------------------------------------------------------
// Condicion del sujeto retenido
// ---------------------------------------------------------------------------

/** Condicion impositiva del sujeto retenido */
export enum CondicionSujeto {
  /** Inscripto */
  INSCRIPTO = 1,
  /** No inscripto */
  NO_INSCRIPTO = 2,
  /** Exento */
  EXENTO = 3,
  /** No categorizado */
  NO_CATEGORIZADO = 4,
}

// ---------------------------------------------------------------------------
// Estado del comprobante
// ---------------------------------------------------------------------------

/** Estado del comprobante de retencion */
export enum EstadoComprobante {
  /** Vigente */
  VIGENTE = 'V',
  /** Anulado */
  ANULADO = 'A',
}
