import { ArcaValidationError } from '@ramiidv/arca-common';
import type { ValidationErrorDetail } from '@ramiidv/arca-common';
import type { Retencion } from './types.js';

// ---------------------------------------------------------------------------
// Retencion validation
// ---------------------------------------------------------------------------

/**
 * Validates retention data before registration.
 * Checks all required fields and their formats.
 * @param data - Retention data to validate
 * @throws ArcaValidationError if required fields are missing or invalid
 */
export function validateRetencion(data: Retencion): void {
  const errors: ValidationErrorDetail[] = [];

  // cuitRetenido: must be 11 digits
  if (!data.cuitRetenido || typeof data.cuitRetenido !== 'string') {
    errors.push({
      field: 'cuitRetenido',
      message: 'cuitRetenido es requerido',
      value: data.cuitRetenido,
    });
  } else {
    const normalized = data.cuitRetenido.replace(/-/g, '');
    if (!/^\d{11}$/.test(normalized)) {
      errors.push({
        field: 'cuitRetenido',
        message: 'cuitRetenido debe tener 11 digitos',
        value: data.cuitRetenido,
      });
    }
  }

  // fechaEmision: valid date string
  if (!data.fechaEmision || typeof data.fechaEmision !== 'string') {
    errors.push({
      field: 'fechaEmision',
      message: 'fechaEmision es requerido',
      value: data.fechaEmision,
    });
  } else if (!isValidDateString(data.fechaEmision)) {
    errors.push({
      field: 'fechaEmision',
      message: 'fechaEmision debe ser una fecha valida (YYYY-MM-DD)',
      value: data.fechaEmision,
    });
  }

  // importeRetenido: must be >= 0
  if (data.importeRetenido == null || typeof data.importeRetenido !== 'number') {
    errors.push({
      field: 'importeRetenido',
      message: 'importeRetenido es requerido y debe ser un numero',
      value: data.importeRetenido,
    });
  } else if (data.importeRetenido < 0) {
    errors.push({
      field: 'importeRetenido',
      message: 'importeRetenido debe ser >= 0',
      value: data.importeRetenido,
    });
  }

  // tipoComprobante: required
  if (data.tipoComprobante == null || typeof data.tipoComprobante !== 'number') {
    errors.push({
      field: 'tipoComprobante',
      message: 'tipoComprobante es requerido',
      value: data.tipoComprobante,
    });
  }

  // nroComprobante is auto-assigned by SIRE, no validation needed here

  // codigoRegimen: required
  if (data.codigoRegimen == null || typeof data.codigoRegimen !== 'number') {
    errors.push({
      field: 'codigoRegimen',
      message: 'codigoRegimen es requerido',
      value: data.codigoRegimen,
    });
  }

  // fechaRetencion: valid date string
  if (!data.fechaRetencion || typeof data.fechaRetencion !== 'string') {
    errors.push({
      field: 'fechaRetencion',
      message: 'fechaRetencion es requerido',
      value: data.fechaRetencion,
    });
  } else if (!isValidDateString(data.fechaRetencion)) {
    errors.push({
      field: 'fechaRetencion',
      message: 'fechaRetencion debe ser una fecha valida (YYYY-MM-DD)',
      value: data.fechaRetencion,
    });
  }

  // importeOperacion: required, must be a number
  if (data.importeOperacion == null || typeof data.importeOperacion !== 'number') {
    errors.push({
      field: 'importeOperacion',
      message: 'importeOperacion es requerido y debe ser un numero',
      value: data.importeOperacion,
    });
  }

  // tipoRetencion: required
  if (data.tipoRetencion == null || typeof data.tipoRetencion !== 'number') {
    errors.push({
      field: 'tipoRetencion',
      message: 'tipoRetencion es requerido',
      value: data.tipoRetencion,
    });
  }

  // tipoOperacion: required
  if (data.tipoOperacion == null || typeof data.tipoOperacion !== 'number') {
    errors.push({
      field: 'tipoOperacion',
      message: 'tipoOperacion es requerido',
      value: data.tipoOperacion,
    });
  }

  if (errors.length > 0) {
    throw new ArcaValidationError(
      `Datos de retencion invalidos: ${errors.map((e) => e.message).join('; ')}`,
      errors,
    );
  }
}

// ---------------------------------------------------------------------------
// Periodo validation
// ---------------------------------------------------------------------------

/**
 * Validates a fiscal period string.
 * Must be in YYYYMM format with valid month (01-12).
 * @param periodo - Period to validate
 * @returns The validated period string
 * @throws ArcaValidationError if the period format is invalid
 */
export function validatePeriodo(periodo: string): string {
  if (!periodo || typeof periodo !== 'string') {
    throw new ArcaValidationError(
      'periodo es requerido.',
      [{ field: 'periodo', message: 'periodo es requerido', value: periodo }],
      'periodo',
    );
  }

  const trimmed = periodo.trim();
  if (!/^\d{6}$/.test(trimmed)) {
    throw new ArcaValidationError(
      `periodo debe tener formato YYYYMM (6 digitos). Recibido: "${periodo}".`,
      [{ field: 'periodo', message: 'Debe tener formato YYYYMM (6 digitos)', value: periodo }],
      'periodo',
    );
  }

  const month = parseInt(trimmed.slice(4, 6), 10);
  if (month < 1 || month > 12) {
    throw new ArcaValidationError(
      `periodo tiene un mes invalido: ${month}. Debe ser entre 01 y 12.`,
      [{ field: 'periodo', message: `Mes invalido: ${month}. Debe ser entre 01 y 12`, value: periodo }],
      'periodo',
    );
  }

  return trimmed;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Checks if a string is a valid YYYY-MM-DD date.
 */
function isValidDateString(dateStr: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
  const date = new Date(dateStr + 'T00:00:00Z');
  if (isNaN(date.getTime())) return false;
  // Verify the parsed date matches input (catches e.g. 2026-02-30)
  const [y, m, d] = dateStr.split('-').map(Number);
  return date.getUTCFullYear() === y && date.getUTCMonth() + 1 === m && date.getUTCDate() === d;
}
