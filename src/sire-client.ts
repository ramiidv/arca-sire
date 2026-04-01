import { afipSoapCall, ensureArray, checkServiceErrors } from './soap-client.js';
import type { ArcaEvent, SoapCallOptions, ServerStatus } from './types.js';
import type {
  WsAuth,
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
import { ArcaSireServiceError } from './errors.js';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

export interface SireClientConfig {
  /** SOAP endpoint URL */
  endpoint: string;
  /** SOAP namespace */
  namespace: string;
  /** SOAP call options (retries, timeout) */
  soapOptions?: Pick<SoapCallOptions, 'timeout' | 'retries' | 'retryDelayMs'>;
  /** Optional event callback */
  onEvent?: (event: ArcaEvent) => void;
}

// ---------------------------------------------------------------------------
// Low-level SIRE SOAP client
// ---------------------------------------------------------------------------

/**
 * Low-level client for SIRE web service.
 * Handles SOAP call construction and response parsing.
 * Does NOT manage authentication - the caller must provide auth tokens.
 */
export class SireClient {
  protected readonly endpoint: string;
  protected readonly namespace: string;
  protected readonly soapOptions?: Pick<SoapCallOptions, 'timeout' | 'retries' | 'retryDelayMs'>;
  protected readonly onEvent?: (event: ArcaEvent) => void;

  constructor(config: SireClientConfig) {
    this.endpoint = config.endpoint;
    this.namespace = config.namespace;
    this.soapOptions = config.soapOptions;
    this.onEvent = config.onEvent;
  }

  // -------------------------------------------------------------------------
  // Health check
  // -------------------------------------------------------------------------

  /**
   * Health check for the SIRE service.
   * Does not require authentication.
   */
  async dummy(): Promise<ServerStatus> {
    const result = await afipSoapCall(
      this.endpoint,
      this.namespace,
      'dummy',
      {},
      { ...this.soapOptions, onEvent: this.onEvent },
    );

    return {
      appserver: (result['appserver'] ?? '') as string,
      dbserver: (result['dbserver'] ?? '') as string,
      authserver: (result['authserver'] ?? '') as string,
    };
  }

  // -------------------------------------------------------------------------
  // Registro de retenciones
  // -------------------------------------------------------------------------

  /**
   * Register a new retention/perception.
   * @param auth - Authentication tokens
   * @param retencion - Retention data to register
   */
  async registrarRetencion(auth: WsAuth, retencion: Retencion): Promise<RetencionResult> {
    const params = {
      Auth: {
        Token: auth.Token,
        Sign: auth.Sign,
        Cuit: auth.CuitRepresentada,
      },
      Retencion: {
        tipoComprobante: retencion.tipoComprobante,
        fechaEmision: retencion.fechaEmision,
        tipoRetencion: retencion.tipoRetencion,
        codigoRegimen: retencion.codigoRegimen,
        tipoOperacion: retencion.tipoOperacion,
        cuitRetenido: retencion.cuitRetenido,
        fechaRetencion: retencion.fechaRetencion,
        importeOperacion: retencion.importeOperacion,
        importeRetenido: retencion.importeRetenido,
        ...(retencion.porcentajeRetencion != null && { porcentajeRetencion: retencion.porcentajeRetencion }),
        ...(retencion.nroComprobanteOriginal != null && { nroComprobanteOriginal: retencion.nroComprobanteOriginal }),
        ...(retencion.condicion != null && { condicion: retencion.condicion }),
        ...(retencion.nroCertificadoPropio != null && { nroCertificadoPropio: retencion.nroCertificadoPropio }),
        ...(retencion.tipoDocRetenido != null && { tipoDocRetenido: retencion.tipoDocRetenido }),
        ...(retencion.importeBaseCalculo != null && { importeBaseCalculo: retencion.importeBaseCalculo }),
        ...(retencion.fechaComprobanteOriginal != null && { fechaComprobanteOriginal: retencion.fechaComprobanteOriginal }),
        ...(retencion.tipoComprobanteOriginal != null && { tipoComprobanteOriginal: retencion.tipoComprobanteOriginal }),
        ...(retencion.observaciones != null && { observaciones: retencion.observaciones }),
      },
    };

    const result = await this.call('registrarRetencion', params);
    this.checkErrors(result);

    return this.mapRetencionResult(result);
  }

  // -------------------------------------------------------------------------
  // Consulta de retenciones
  // -------------------------------------------------------------------------

  /**
   * Query retentions for a given period.
   * @param auth - Authentication tokens
   * @param consulta - Query parameters (period, optional filters)
   */
  async consultarRetenciones(
    auth: WsAuth,
    consulta: ConsultaRetencionesParams,
  ): Promise<ConsultaRetencionesResult> {
    const params = {
      Auth: {
        Token: auth.Token,
        Sign: auth.Sign,
        Cuit: auth.CuitRepresentada,
      },
      Consulta: {
        periodo: consulta.periodo,
        ...(consulta.quincena != null && { quincena: consulta.quincena }),
        ...(consulta.tipoComprobante != null && { tipoComprobante: consulta.tipoComprobante }),
        ...(consulta.cuitRetenido != null && { cuitRetenido: consulta.cuitRetenido }),
      },
    };

    const result = await this.call('consultarRetenciones', params);
    this.checkErrors(result);

    type R = Record<string, unknown>;
    const retencionesRaw = result['retenciones'] ?? result['Retenciones'];
    const items = ensureArray<R>(
      ((retencionesRaw as R)?.['retencion'] ??
      (retencionesRaw as R)?.['Retencion'] ??
      retencionesRaw) as R | R[] | undefined
    );

    return {
      retenciones: items.map((r) => this.mapCertificado(r)),
      cantidadRegistros: Number(result['cantidadRegistros'] ?? result['CantidadRegistros'] ?? items.length),
    };
  }

  // -------------------------------------------------------------------------
  // Anulacion de retencion
  // -------------------------------------------------------------------------

  /**
   * Cancel a previously registered retention.
   * @param auth - Authentication tokens
   * @param nroComprobante - Certificate number to cancel
   */
  async anularRetencion(auth: WsAuth, nroComprobante: string): Promise<RetencionResult> {
    const params = {
      Auth: {
        Token: auth.Token,
        Sign: auth.Sign,
        Cuit: auth.CuitRepresentada,
      },
      NroComprobante: nroComprobante,
    };

    const result = await this.call('anularRetencion', params);
    this.checkErrors(result);

    return this.mapRetencionResult(result);
  }

  // -------------------------------------------------------------------------
  // Consulta de comprobante individual
  // -------------------------------------------------------------------------

  /**
   * Query a specific retention certificate by number.
   * @param auth - Authentication tokens
   * @param nroComprobante - Certificate number to query
   */
  async consultarComprobante(auth: WsAuth, nroComprobante: string): Promise<CertificadoRetencion> {
    const params = {
      Auth: {
        Token: auth.Token,
        Sign: auth.Sign,
        Cuit: auth.CuitRepresentada,
      },
      NroComprobante: nroComprobante,
    };

    const result = await this.call('consultarComprobante', params);
    this.checkErrors(result);

    const comprobante = (result['comprobante'] ?? result['Comprobante'] ?? result) as Record<string, unknown>;
    return this.mapCertificado(comprobante);
  }

  // -------------------------------------------------------------------------
  // Generar certificado
  // -------------------------------------------------------------------------

  /**
   * Generate a retention certificate (PDF/data).
   * @param auth - Authentication tokens
   * @param nroComprobante - Certificate number to generate
   */
  async generarCertificado(auth: WsAuth, nroComprobante: string): Promise<CertificadoRetencion> {
    const params = {
      Auth: {
        Token: auth.Token,
        Sign: auth.Sign,
        Cuit: auth.CuitRepresentada,
      },
      NroComprobante: nroComprobante,
    };

    const result = await this.call('generarCertificado', params);
    this.checkErrors(result);

    const certificado = (result['certificado'] ?? result['Certificado'] ?? result) as Record<string, unknown>;
    return this.mapCertificado(certificado);
  }

  // -------------------------------------------------------------------------
  // Tablas de parametros
  // -------------------------------------------------------------------------

  /**
   * Query applicable withholding rates.
   * @param auth - Authentication tokens
   * @param codigoRegimen - Optional regime code to filter by
   */
  async consultarAlicuotas(auth: WsAuth, codigoRegimen?: number): Promise<AlicuotaItem[]> {
    const params = {
      Auth: {
        Token: auth.Token,
        Sign: auth.Sign,
        Cuit: auth.CuitRepresentada,
      },
      ...(codigoRegimen != null && { CodigoRegimen: codigoRegimen }),
    };

    const result = await this.call('consultarAlicuotas', params);
    this.checkErrors(result);

    type R = Record<string, unknown>;
    const alicuotasRaw = result['alicuotas'] ?? result['Alicuotas'] ?? result['arrayAlicuotas'];
    const items = ensureArray<R>(
      ((alicuotasRaw as R)?.['alicuota'] ??
      (alicuotasRaw as R)?.['Alicuota'] ??
      alicuotasRaw) as R | R[] | undefined
    );

    return items.map((a) => ({
      codigoRegimen: Number(a['codigoRegimen'] ?? a['CodigoRegimen'] ?? 0),
      porcentaje: Number(a['porcentaje'] ?? a['Porcentaje'] ?? 0),
      importeMinimo: a['importeMinimo'] != null ? Number(a['importeMinimo']) : undefined,
      importeExcedente: a['importeExcedente'] != null ? Number(a['importeExcedente']) : undefined,
      descripcion: a['descripcion'] as string | undefined,
      vigenciaDesde: a['vigenciaDesde'] as string | undefined,
      vigenciaHasta: a['vigenciaHasta'] as string | undefined,
    }));
  }

  /**
   * Query applicable regimes.
   * @param auth - Authentication tokens
   */
  async consultarRegimenes(auth: WsAuth): Promise<RegimenItem[]> {
    const params = {
      Auth: {
        Token: auth.Token,
        Sign: auth.Sign,
        Cuit: auth.CuitRepresentada,
      },
    };

    const result = await this.call('consultarRegimenes', params);
    this.checkErrors(result);

    type R = Record<string, unknown>;
    const regimenesRaw = result['regimenes'] ?? result['Regimenes'] ?? result['arrayRegimenes'];
    const items = ensureArray<R>(
      ((regimenesRaw as R)?.['regimen'] ??
      (regimenesRaw as R)?.['Regimen'] ??
      regimenesRaw) as R | R[] | undefined
    );

    return items.map((r) => ({
      codigo: Number(r['codigo'] ?? r['Codigo'] ?? 0),
      descripcion: String(r['descripcion'] ?? r['Descripcion'] ?? ''),
      tipoRetencion: r['tipoRetencion'] != null ? Number(r['tipoRetencion']) : undefined,
      estado: r['estado'] as string | undefined,
      vigenciaDesde: r['vigenciaDesde'] as string | undefined,
      vigenciaHasta: r['vigenciaHasta'] as string | undefined,
    }));
  }

  /**
   * Query valid voucher types.
   * @param auth - Authentication tokens
   */
  async consultarTiposComprobante(auth: WsAuth): Promise<TipoComprobanteItem[]> {
    const params = {
      Auth: {
        Token: auth.Token,
        Sign: auth.Sign,
        Cuit: auth.CuitRepresentada,
      },
    };

    const result = await this.call('consultarTiposComprobante', params);
    this.checkErrors(result);

    type R = Record<string, unknown>;
    const tiposRaw = result['tiposComprobante'] ?? result['TiposComprobante'] ?? result['arrayTiposComprobante'];
    const items = ensureArray<R>(
      ((tiposRaw as R)?.['tipoComprobante'] ??
      (tiposRaw as R)?.['TipoComprobante'] ??
      tiposRaw) as R | R[] | undefined
    );

    return items.map((t) => ({
      codigo: Number(t['codigo'] ?? t['Codigo'] ?? t['id'] ?? 0),
      descripcion: String(t['descripcion'] ?? t['Descripcion'] ?? t['desc'] ?? ''),
    }));
  }

  /**
   * Query operation types.
   * @param auth - Authentication tokens
   */
  async consultarTiposOperacion(auth: WsAuth): Promise<TipoOperacionItem[]> {
    const params = {
      Auth: {
        Token: auth.Token,
        Sign: auth.Sign,
        Cuit: auth.CuitRepresentada,
      },
    };

    const result = await this.call('consultarTiposOperacion', params);
    this.checkErrors(result);

    type R = Record<string, unknown>;
    const tiposRaw = result['tiposOperacion'] ?? result['TiposOperacion'] ?? result['arrayTiposOperacion'];
    const items = ensureArray<R>(
      ((tiposRaw as R)?.['tipoOperacion'] ??
      (tiposRaw as R)?.['TipoOperacion'] ??
      tiposRaw) as R | R[] | undefined
    );

    return items.map((t) => ({
      codigo: Number(t['codigo'] ?? t['Codigo'] ?? t['id'] ?? 0),
      descripcion: String(t['descripcion'] ?? t['Descripcion'] ?? t['desc'] ?? ''),
    }));
  }

  /**
   * Query condition types.
   * @param auth - Authentication tokens
   */
  async consultarCondicion(auth: WsAuth): Promise<CondicionItem[]> {
    const params = {
      Auth: {
        Token: auth.Token,
        Sign: auth.Sign,
        Cuit: auth.CuitRepresentada,
      },
    };

    const result = await this.call('consultarCondicion', params);
    this.checkErrors(result);

    type R = Record<string, unknown>;
    const condicionesRaw = result['condiciones'] ?? result['Condiciones'] ?? result['arrayCondiciones'];
    const items = ensureArray<R>(
      ((condicionesRaw as R)?.['condicion'] ??
      (condicionesRaw as R)?.['Condicion'] ??
      condicionesRaw) as R | R[] | undefined
    );

    return items.map((c) => ({
      codigo: Number(c['codigo'] ?? c['Codigo'] ?? c['id'] ?? 0),
      descripcion: String(c['descripcion'] ?? c['Descripcion'] ?? c['desc'] ?? ''),
    }));
  }

  // -------------------------------------------------------------------------
  // Private helpers
  // -------------------------------------------------------------------------

  private async call(method: string, params: Record<string, unknown>): Promise<Record<string, unknown>> {
    return afipSoapCall(
      this.endpoint,
      this.namespace,
      method,
      params,
      { ...this.soapOptions, onEvent: this.onEvent },
    );
  }

  private checkErrors(result: Record<string, unknown>): void {
    // Check using common utility first
    try {
      checkServiceErrors(result, 'SIRE');
    } catch (e) {
      // Re-throw as domain-specific error
      if (e instanceof Error && 'errors' in e) {
        const serviceErr = e as { errors: { code: number; msg: string }[] };
        throw new ArcaSireServiceError(e.message, serviceErr.errors);
      }
      throw e;
    }

    // Also check SIRE-specific error structures
    const errorRaw = result['error'] ?? result['Error'];
    if (errorRaw) {
      const errObj = errorRaw as Record<string, unknown>;
      const code = Number(errObj['codigo'] ?? errObj['Codigo'] ?? errObj['code'] ?? 0);
      const msg = String(errObj['descripcion'] ?? errObj['Descripcion'] ?? errObj['msg'] ?? 'Error SIRE desconocido');
      if (code !== 0) {
        throw new ArcaSireServiceError(
          `SIRE: [${code}] ${msg}`,
          [{ code, msg }],
        );
      }
    }
  }

  private mapRetencionResult(raw: Record<string, unknown>): RetencionResult {
    const resultado = (raw['resultado'] ?? raw['Resultado'] ?? raw) as Record<string, unknown>;

    const erroresRaw = resultado['errores'] ?? resultado['Errores'];
    let errores: { code: number; msg: string }[] | undefined;
    if (erroresRaw) {
      type R = Record<string, unknown>;
      const errItems = ensureArray<R>(
        ((erroresRaw as R)?.['error'] ?? (erroresRaw as R)?.['Error'] ?? erroresRaw) as R | R[] | undefined,
      );
      errores = errItems.map((e) => ({
        code: Number(e['codigo'] ?? e['code'] ?? 0),
        msg: String(e['descripcion'] ?? e['msg'] ?? ''),
      }));
    }

    return {
      nroComprobante: String(resultado['nroComprobante'] ?? resultado['NroComprobante'] ?? raw['nroComprobante'] ?? ''),
      nroCertificado: (resultado['nroCertificado'] ?? resultado['NroCertificado'] ?? raw['nroCertificado']) as string | undefined,
      codigoAutorizacion: (resultado['codigoAutorizacion'] ?? resultado['CodigoAutorizacion'] ?? raw['codigoAutorizacion']) as string | undefined,
      fechaProceso: String(resultado['fechaProceso'] ?? resultado['FechaProceso'] ?? raw['fechaProceso'] ?? ''),
      resultado: String(resultado['resultado'] ?? resultado['Resultado'] ?? 'OK'),
      observaciones: (resultado['observaciones'] ?? resultado['Observaciones'] ?? raw['observaciones']) as string | undefined,
      errores,
    };
  }

  private mapCertificado(raw: Record<string, unknown>): CertificadoRetencion {
    return {
      nroComprobante: String(raw['nroComprobante'] ?? raw['NroComprobante'] ?? ''),
      nroCertificado: String(raw['nroCertificado'] ?? raw['NroCertificado'] ?? ''),
      tipoComprobante: Number(raw['tipoComprobante'] ?? raw['TipoComprobante'] ?? 0),
      cuitAgente: String(raw['cuitAgente'] ?? raw['CuitAgente'] ?? ''),
      cuitRetenido: String(raw['cuitRetenido'] ?? raw['CuitRetenido'] ?? ''),
      fechaEmision: String(raw['fechaEmision'] ?? raw['FechaEmision'] ?? ''),
      fechaRetencion: String(raw['fechaRetencion'] ?? raw['FechaRetencion'] ?? ''),
      tipoRetencion: Number(raw['tipoRetencion'] ?? raw['TipoRetencion'] ?? 0),
      codigoRegimen: Number(raw['codigoRegimen'] ?? raw['CodigoRegimen'] ?? 0),
      importeOperacion: Number(raw['importeOperacion'] ?? raw['ImporteOperacion'] ?? 0),
      importeRetenido: Number(raw['importeRetenido'] ?? raw['ImporteRetenido'] ?? 0),
      porcentajeRetencion: raw['porcentajeRetencion'] != null
        ? Number(raw['porcentajeRetencion'])
        : undefined,
      estado: String(raw['estado'] ?? raw['Estado'] ?? ''),
      codigoAutorizacion: (raw['codigoAutorizacion'] ?? raw['CodigoAutorizacion']) as string | undefined,
      condicion: raw['condicion'] != null ? Number(raw['condicion']) : undefined,
      observaciones: (raw['observaciones'] ?? raw['Observaciones']) as string | undefined,
    };
  }
}
