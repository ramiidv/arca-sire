import { describe, it, expect } from 'vitest';
import { validateRetencion, validatePeriodo } from '../src/validation.js';
import type { Retencion } from '../src/types.js';

// ---------------------------------------------------------------------------
// Helper: valid retention data
// ---------------------------------------------------------------------------

function validRetencion(): Retencion {
  return {
    tipoComprobante: 2005,
    fechaEmision: '2026-03-31',
    tipoRetencion: 1,
    codigoRegimen: 499,
    tipoOperacion: 1,
    cuitRetenido: '30712345678',
    fechaRetencion: '2026-03-31',
    importeOperacion: 100_000,
    importeRetenido: 21_000,
  };
}

// ---------------------------------------------------------------------------
// validateRetencion
// ---------------------------------------------------------------------------

describe('validateRetencion', () => {
  it('accepts valid retention data', () => {
    expect(() => validateRetencion(validRetencion())).not.toThrow();
  });

  it('accepts retention with importeRetenido = 0', () => {
    expect(() =>
      validateRetencion({ ...validRetencion(), importeRetenido: 0 }),
    ).not.toThrow();
  });

  it('accepts retention with optional fields', () => {
    expect(() =>
      validateRetencion({
        ...validRetencion(),
        porcentajeRetencion: 21,
        observaciones: 'test',
        condicion: 1,
      }),
    ).not.toThrow();
  });

  // Missing required fields
  it('throws on missing cuitRetenido', () => {
    const data = validRetencion();
    (data as Record<string, unknown>).cuitRetenido = undefined;
    expect(() => validateRetencion(data)).toThrow('cuitRetenido');
  });

  it('throws on empty cuitRetenido', () => {
    expect(() =>
      validateRetencion({ ...validRetencion(), cuitRetenido: '' }),
    ).toThrow('cuitRetenido');
  });

  it('throws on missing fechaEmision', () => {
    const data = validRetencion();
    (data as Record<string, unknown>).fechaEmision = undefined;
    expect(() => validateRetencion(data)).toThrow('fechaEmision');
  });

  it('throws on missing importeRetenido', () => {
    const data = validRetencion();
    (data as Record<string, unknown>).importeRetenido = undefined;
    expect(() => validateRetencion(data)).toThrow('importeRetenido');
  });

  it('throws on negative importeRetenido', () => {
    expect(() =>
      validateRetencion({ ...validRetencion(), importeRetenido: -1 }),
    ).toThrow('importeRetenido');
  });

  it('throws on missing tipoComprobante', () => {
    const data = validRetencion();
    (data as Record<string, unknown>).tipoComprobante = undefined;
    expect(() => validateRetencion(data)).toThrow('tipoComprobante');
  });

  it('throws on missing codigoRegimen', () => {
    const data = validRetencion();
    (data as Record<string, unknown>).codigoRegimen = undefined;
    expect(() => validateRetencion(data)).toThrow('codigoRegimen');
  });

  it('throws on missing tipoRetencion', () => {
    const data = validRetencion();
    (data as Record<string, unknown>).tipoRetencion = undefined;
    expect(() => validateRetencion(data)).toThrow('tipoRetencion');
  });

  it('throws on missing tipoOperacion', () => {
    const data = validRetencion();
    (data as Record<string, unknown>).tipoOperacion = undefined;
    expect(() => validateRetencion(data)).toThrow('tipoOperacion');
  });

  // Invalid CUIT format
  it('throws on CUIT with wrong number of digits', () => {
    expect(() =>
      validateRetencion({ ...validRetencion(), cuitRetenido: '1234' }),
    ).toThrow('11 digitos');
  });

  it('throws on CUIT with letters', () => {
    expect(() =>
      validateRetencion({ ...validRetencion(), cuitRetenido: '3071234567X' }),
    ).toThrow('11 digitos');
  });

  it('accepts CUIT with hyphens (11 digits after stripping)', () => {
    expect(() =>
      validateRetencion({ ...validRetencion(), cuitRetenido: '30-71234567-8' }),
    ).not.toThrow();
  });

  // Invalid dates
  it('throws on invalid fechaEmision format', () => {
    expect(() =>
      validateRetencion({ ...validRetencion(), fechaEmision: '31/03/2026' }),
    ).toThrow('fechaEmision');
  });

  it('throws on invalid fechaRetencion date', () => {
    expect(() =>
      validateRetencion({ ...validRetencion(), fechaRetencion: '2026-02-30' }),
    ).toThrow('fechaRetencion');
  });

  // Multiple errors
  it('collects multiple errors in details', () => {
    const data = validRetencion();
    (data as Record<string, unknown>).cuitRetenido = undefined;
    (data as Record<string, unknown>).fechaEmision = undefined;
    (data as Record<string, unknown>).tipoComprobante = undefined;

    try {
      validateRetencion(data);
      expect.unreachable('should have thrown');
    } catch (e: unknown) {
      const err = e as { details: { field: string }[] };
      expect(err.details.length).toBeGreaterThanOrEqual(3);
      const fields = err.details.map((d) => d.field);
      expect(fields).toContain('cuitRetenido');
      expect(fields).toContain('fechaEmision');
      expect(fields).toContain('tipoComprobante');
    }
  });
});

// ---------------------------------------------------------------------------
// validatePeriodo
// ---------------------------------------------------------------------------

describe('validatePeriodo', () => {
  it('accepts valid periodo 202603', () => {
    expect(validatePeriodo('202603')).toBe('202603');
  });

  it('accepts periodo 202601 (January)', () => {
    expect(validatePeriodo('202601')).toBe('202601');
  });

  it('accepts periodo 202612 (December)', () => {
    expect(validatePeriodo('202612')).toBe('202612');
  });

  it('trims whitespace', () => {
    expect(validatePeriodo('  202603  ')).toBe('202603');
  });

  it('throws on empty string', () => {
    expect(() => validatePeriodo('')).toThrow('requerido');
  });

  it('throws on too short string', () => {
    expect(() => validatePeriodo('20260')).toThrow('YYYYMM');
  });

  it('throws on too long string', () => {
    expect(() => validatePeriodo('2026031')).toThrow('YYYYMM');
  });

  it('throws on non-numeric string', () => {
    expect(() => validatePeriodo('2026AB')).toThrow('YYYYMM');
  });

  it('throws on month 00', () => {
    expect(() => validatePeriodo('202600')).toThrow('Mes invalido');
  });

  it('throws on month 13', () => {
    expect(() => validatePeriodo('202613')).toThrow('Mes invalido');
  });

  it('throws on month 99', () => {
    expect(() => validatePeriodo('202699')).toThrow('Mes invalido');
  });
});
