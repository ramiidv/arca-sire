// Shared types from common
export type { AccessTicket, ArcaEvent, ServerStatus, SoapCallOptions } from '@ramiidv/arca-common';
import type { ArcaEvent } from '@ramiidv/arca-common';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

export interface ArcaSireConfig {
  /** PEM-encoded X.509 certificate */
  cert: string;
  /** PEM-encoded RSA private key */
  key: string;
  /** CUIT of the withholding agent (e.g. "20123456789") */
  cuit: string;
  /** Use production endpoints (default: false = testing / homologacion) */
  production?: boolean;
  /** Request timeout in ms (default: 30000) */
  timeout?: number;
  /** Number of retries on 5xx / network errors (default: 1) */
  retries?: number;
  /** Base delay in ms for exponential backoff (default: 1000) */
  retryDelayMs?: number;
  /** Optional event callback */
  onEvent?: (event: ArcaEvent) => void;
}

// ---------------------------------------------------------------------------
// Authentication
// ---------------------------------------------------------------------------

export interface WsAuth {
  Token: string;
  Sign: string;
  CuitRepresentada: string;
}

// ---------------------------------------------------------------------------
// Retencion - Datos de una retencion/percepcion a registrar
// ---------------------------------------------------------------------------

export interface Retencion {
  /** Tipo de comprobante (C2005, C2003, C2004) */
  tipoComprobante: number;
  /** Fecha de emision del comprobante (formato YYYY-MM-DD) */
  fechaEmision: string;
  /** Tipo de retencion: 1=Retencion, 2=Percepcion */
  tipoRetencion: number;
  /** Codigo de regimen de retencion/percepcion */
  codigoRegimen: number;
  /** Tipo de operacion: 1=Normal, 2=Anulacion */
  tipoOperacion: number;
  /** CUIT del sujeto retenido/percibido (11 digitos) */
  cuitRetenido: string;
  /** Fecha de la retencion (formato YYYY-MM-DD) */
  fechaRetencion: string;
  /** Importe total de la operacion */
  importeOperacion: number;
  /** Importe retenido/percibido */
  importeRetenido: number;
  /** Porcentaje/alicuota aplicada */
  porcentajeRetencion?: number;
  /** Numero de comprobante original (para percepciones) */
  nroComprobanteOriginal?: string;
  /** Condicion del sujeto retenido */
  condicion?: number;
  /** Numero de certificado propio (opcional) */
  nroCertificadoPropio?: string;
  /** Tipo de documento del retenido (80=CUIT, 86=CUIL, etc.) */
  tipoDocRetenido?: number;
  /** Importe base de calculo */
  importeBaseCalculo?: number;
  /** Fecha del comprobante original (formato YYYY-MM-DD) */
  fechaComprobanteOriginal?: string;
  /** Tipo de comprobante original */
  tipoComprobanteOriginal?: number;
  /** Descripcion u observaciones */
  observaciones?: string;
}

// ---------------------------------------------------------------------------
// Resultado de registro de retencion
// ---------------------------------------------------------------------------

export interface RetencionResult {
  /** Numero de comprobante asignado por SIRE */
  nroComprobante: string;
  /** Numero de certificado generado */
  nroCertificado?: string;
  /** Codigo de autorizacion electronica (CAE equivalente) */
  codigoAutorizacion?: string;
  /** Fecha de proceso */
  fechaProceso: string;
  /** Resultado de la operacion */
  resultado: string;
  /** Observaciones del servicio */
  observaciones?: string;
  /** Errores de la operacion (si los hay) */
  errores?: { code: number; msg: string }[];
}

// ---------------------------------------------------------------------------
// Certificado de retencion
// ---------------------------------------------------------------------------

export interface CertificadoRetencion {
  /** Numero de comprobante */
  nroComprobante: string;
  /** Numero de certificado */
  nroCertificado: string;
  /** Tipo de comprobante */
  tipoComprobante: number;
  /** CUIT del agente de retencion */
  cuitAgente: string;
  /** CUIT del sujeto retenido */
  cuitRetenido: string;
  /** Fecha de emision (YYYY-MM-DD) */
  fechaEmision: string;
  /** Fecha de retencion (YYYY-MM-DD) */
  fechaRetencion: string;
  /** Tipo de retencion: 1=Retencion, 2=Percepcion */
  tipoRetencion: number;
  /** Codigo de regimen */
  codigoRegimen: number;
  /** Importe de la operacion */
  importeOperacion: number;
  /** Importe retenido */
  importeRetenido: number;
  /** Porcentaje de retencion */
  porcentajeRetencion?: number;
  /** Estado del comprobante (V=Vigente, A=Anulado) */
  estado: string;
  /** Codigo de autorizacion */
  codigoAutorizacion?: string;
  /** Condicion del sujeto */
  condicion?: number;
  /** Observaciones */
  observaciones?: string;
}

// ---------------------------------------------------------------------------
// Consulta de retenciones (filtros)
// ---------------------------------------------------------------------------

export interface ConsultaRetencionesParams {
  /** Periodo fiscal (formato YYYYMM) */
  periodo: string;
  /** Quincena: 1 o 2 (opcional) */
  quincena?: number;
  /** Tipo de comprobante (filtro opcional) */
  tipoComprobante?: number;
  /** CUIT del sujeto retenido (filtro opcional) */
  cuitRetenido?: string;
}

// ---------------------------------------------------------------------------
// Resultado de consulta de retenciones
// ---------------------------------------------------------------------------

export interface ConsultaRetencionesResult {
  /** Retenciones encontradas */
  retenciones: CertificadoRetencion[];
  /** Cantidad total de registros */
  cantidadRegistros: number;
}

// ---------------------------------------------------------------------------
// Regimen (tabla de parametros)
// ---------------------------------------------------------------------------

export interface RegimenItem {
  /** Codigo de regimen */
  codigo: number;
  /** Descripcion del regimen */
  descripcion: string;
  /** Tipo de retencion asociado */
  tipoRetencion?: number;
  /** Estado del regimen (vigente/no vigente) */
  estado?: string;
  /** Fecha de vigencia desde (YYYY-MM-DD) */
  vigenciaDesde?: string;
  /** Fecha de vigencia hasta (YYYY-MM-DD) */
  vigenciaHasta?: string;
}

// ---------------------------------------------------------------------------
// Alicuota (tabla de parametros)
// ---------------------------------------------------------------------------

export interface AlicuotaItem {
  /** Codigo de regimen */
  codigoRegimen: number;
  /** Porcentaje de la alicuota */
  porcentaje: number;
  /** Importe minimo sujeto a retencion */
  importeMinimo?: number;
  /** Importe excedente no sujeto a retencion */
  importeExcedente?: number;
  /** Descripcion */
  descripcion?: string;
  /** Fecha de vigencia desde (YYYY-MM-DD) */
  vigenciaDesde?: string;
  /** Fecha de vigencia hasta (YYYY-MM-DD) */
  vigenciaHasta?: string;
}

// ---------------------------------------------------------------------------
// Tipo de comprobante (tabla de parametros)
// ---------------------------------------------------------------------------

export interface TipoComprobanteItem {
  /** Codigo del tipo de comprobante */
  codigo: number;
  /** Descripcion */
  descripcion: string;
}

// ---------------------------------------------------------------------------
// Tipo de operacion (tabla de parametros)
// ---------------------------------------------------------------------------

export interface TipoOperacionItem {
  /** Codigo del tipo de operacion */
  codigo: number;
  /** Descripcion */
  descripcion: string;
}

// ---------------------------------------------------------------------------
// Condicion (tabla de parametros)
// ---------------------------------------------------------------------------

export interface CondicionItem {
  /** Codigo de la condicion */
  codigo: number;
  /** Descripcion */
  descripcion: string;
}
