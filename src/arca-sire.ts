import { WsaaClient } from '@ramiidv/arca-common';
import type { ArcaEvent, SoapCallOptions } from '@ramiidv/arca-common';
import { ENDPOINTS } from './constants.js';
import { SireClient } from './sire-client.js';
import { validateRetencion, validatePeriodo } from './validation.js';
import type {
  ArcaSireConfig,
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
  ServerStatus,
} from './types.js';

/**
 * Main orchestrator class for the ARCA SIRE web service.
 *
 * Provides high-level methods that handle WSAA authentication automatically
 * and expose retention/perception management operations.
 *
 * @example
 * ```ts
 * import { ArcaSire } from '@ramiidv/arca-sire';
 * import { readFileSync } from 'fs';
 *
 * const sire = new ArcaSire({
 *   cert: readFileSync('cert.pem', 'utf-8'),
 *   key: readFileSync('key.pem', 'utf-8'),
 *   cuit: '20123456789',
 *   production: false,
 * });
 *
 * // Register a retention
 * const result = await sire.registrarRetencion({
 *   tipoComprobante: 2005,
 *   fechaEmision: '2026-03-31',
 *   tipoRetencion: 1,
 *   codigoRegimen: 499,
 *   tipoOperacion: 1,
 *   cuitRetenido: '30712345678',
 *   fechaRetencion: '2026-03-31',
 *   importeOperacion: 10000,
 *   importeRetenido: 2100,
 * });
 * console.log(result.nroComprobante);
 * ```
 */
export class ArcaSire {
  /** Low-level WSAA client for direct access */
  public readonly wsaa: WsaaClient;
  /** Low-level SIRE SOAP client for direct access */
  public readonly client: SireClient;

  private readonly cuit: string;
  private readonly onEvent?: (event: ArcaEvent) => void;

  constructor(config: ArcaSireConfig) {
    const isProduction = config.production ?? false;
    const env = isProduction ? 'production' : 'testing';
    this.cuit = config.cuit;
    this.onEvent = config.onEvent;

    const soapOptions: Pick<SoapCallOptions, 'timeout' | 'retries' | 'retryDelayMs'> = {
      timeout: config.timeout,
      retries: config.retries,
      retryDelayMs: config.retryDelayMs,
    };

    this.wsaa = new WsaaClient({
      cert: config.cert,
      key: config.key,
      production: isProduction,
      timeout: config.timeout,
      retries: config.retries,
      retryDelayMs: config.retryDelayMs,
      onEvent: config.onEvent,
    });

    this.client = new SireClient({
      endpoint: ENDPOINTS.sire[env],
      namespace: ENDPOINTS.sire.namespace,
      soapOptions,
      onEvent: config.onEvent,
    });
  }

  // -------------------------------------------------------------------------
  // Registro y gestion de retenciones
  // -------------------------------------------------------------------------

  /**
   * Register a new retention/perception.
   * Authenticates automatically via WSAA.
   * @param retencion - Retention data to register
   */
  async registrarRetencion(retencion: Retencion): Promise<RetencionResult> {
    validateRetencion(retencion);
    const auth = await this.getAuth();
    return this.client.registrarRetencion(auth, retencion);
  }

  /**
   * Query retentions for a given period.
   * Authenticates automatically via WSAA.
   * @param consulta - Query parameters (period, optional filters)
   */
  async consultarRetenciones(consulta: ConsultaRetencionesParams): Promise<ConsultaRetencionesResult> {
    validatePeriodo(consulta.periodo);
    const auth = await this.getAuth();
    return this.client.consultarRetenciones(auth, consulta);
  }

  /**
   * Cancel a previously registered retention.
   * Authenticates automatically via WSAA.
   * @param nroComprobante - Certificate number to cancel
   */
  async anularRetencion(nroComprobante: string): Promise<RetencionResult> {
    const auth = await this.getAuth();
    return this.client.anularRetencion(auth, nroComprobante);
  }

  /**
   * Query a specific retention certificate by number.
   * Authenticates automatically via WSAA.
   * @param nroComprobante - Certificate number to query
   */
  async consultarComprobante(nroComprobante: string): Promise<CertificadoRetencion> {
    const auth = await this.getAuth();
    return this.client.consultarComprobante(auth, nroComprobante);
  }

  /**
   * Generate a retention certificate.
   * Authenticates automatically via WSAA.
   * @param nroComprobante - Certificate number to generate
   */
  async generarCertificado(nroComprobante: string): Promise<CertificadoRetencion> {
    const auth = await this.getAuth();
    return this.client.generarCertificado(auth, nroComprobante);
  }

  // -------------------------------------------------------------------------
  // Tablas de parametros
  // -------------------------------------------------------------------------

  /**
   * Query applicable withholding rates.
   * Authenticates automatically via WSAA.
   * @param codigoRegimen - Optional regime code to filter by
   */
  async consultarAlicuotas(codigoRegimen?: number): Promise<AlicuotaItem[]> {
    const auth = await this.getAuth();
    return this.client.consultarAlicuotas(auth, codigoRegimen);
  }

  /**
   * Query applicable regimes.
   * Authenticates automatically via WSAA.
   */
  async consultarRegimenes(): Promise<RegimenItem[]> {
    const auth = await this.getAuth();
    return this.client.consultarRegimenes(auth);
  }

  /**
   * Query valid voucher types.
   * Authenticates automatically via WSAA.
   */
  async consultarTiposComprobante(): Promise<TipoComprobanteItem[]> {
    const auth = await this.getAuth();
    return this.client.consultarTiposComprobante(auth);
  }

  /**
   * Query operation types.
   * Authenticates automatically via WSAA.
   */
  async consultarTiposOperacion(): Promise<TipoOperacionItem[]> {
    const auth = await this.getAuth();
    return this.client.consultarTiposOperacion(auth);
  }

  /**
   * Query condition types.
   * Authenticates automatically via WSAA.
   */
  async consultarCondicion(): Promise<CondicionItem[]> {
    const auth = await this.getAuth();
    return this.client.consultarCondicion(auth);
  }

  // -------------------------------------------------------------------------
  // Health check
  // -------------------------------------------------------------------------

  /**
   * Health check for the SIRE service.
   * Does not require authentication.
   */
  async status(): Promise<ServerStatus> {
    return this.client.dummy();
  }

  // -------------------------------------------------------------------------
  // Private helpers
  // -------------------------------------------------------------------------

  private async getAuth(): Promise<WsAuth> {
    const ticket = await this.wsaa.getAccessTicket(ENDPOINTS.sire.serviceId);
    return {
      Token: ticket.token,
      Sign: ticket.sign,
      CuitRepresentada: this.cuit,
    };
  }
}
