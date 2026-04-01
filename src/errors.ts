// Base errors re-exported from common
export { ArcaError, ArcaAuthError, ArcaSoapError, ArcaServiceError } from '@ramiidv/arca-common';
import { ArcaError, ArcaServiceError } from '@ramiidv/arca-common';

/**
 * Base error for SIRE SDK.
 * Extends ArcaError from common for backward compatibility.
 */
export class ArcaSireError extends ArcaError {
  constructor(message: string) {
    super(message);
    this.name = 'ArcaSireError';
  }
}

/**
 * Error de servicio de SIRE (errores de negocio).
 * Extiende ArcaServiceError de common.
 */
export class ArcaSireServiceError extends ArcaServiceError {
  constructor(message: string, errors: { code: number; msg: string }[]) {
    super(message, errors);
    this.name = 'ArcaSireServiceError';
  }
}
