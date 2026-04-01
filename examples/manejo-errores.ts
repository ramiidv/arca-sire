/**
 * Ejemplo: Manejo de errores
 *
 * El SDK provee clases de error especificas para catch granular:
 *   - ArcaAuthError: falla de autenticacion WSAA
 *   - ArcaSireServiceError: error de negocio de SIRE (con codigos)
 *   - ArcaSoapError: error HTTP/SOAP (timeout, servidor caido)
 *   - ArcaValidationError: datos de entrada invalidos
 */

import fs from "fs";
import {
  ArcaSire,
  ArcaAuthError,
  ArcaSoapError,
  ArcaSireServiceError,
  TipoComprobante,
  TipoRetencion,
  Regimen,
  TipoOperacion,
} from "@ramiidv/arca-sire";
import { ArcaValidationError } from "@ramiidv/arca-common";

async function main() {
  const sire = new ArcaSire({
    cert: fs.readFileSync("./certs/certificado.crt", "utf-8"),
    key: fs.readFileSync("./certs/clave.key", "utf-8"),
    cuit: "20123456789",
    production: false,
    timeout: 60_000, // 60s para servidores lentos
  });

  try {
    const resultado = await sire.registrarRetencion({
      tipoComprobante: TipoComprobante.C2005,
      fechaEmision: "2026-03-31",
      tipoRetencion: TipoRetencion.RETENCION,
      codigoRegimen: Regimen.IVA_GENERAL,
      tipoOperacion: TipoOperacion.NORMAL,
      cuitRetenido: "30712345678",
      fechaRetencion: "2026-03-31",
      importeOperacion: 100_000,
      importeRetenido: 21_000,
    });

    console.log(`Comprobante: ${resultado.nroComprobante}`);

    // Verificar si hubo errores parciales
    if (resultado.errores && resultado.errores.length > 0) {
      for (const err of resultado.errores) {
        console.warn(`Advertencia [${err.code}]: ${err.msg}`);
      }
    }
  } catch (e) {
    if (e instanceof ArcaValidationError) {
      // Datos de entrada invalidos (CUIT mal formada, periodo invalido, etc.)
      console.error("Error de validacion:", e.message);
      for (const detail of e.details) {
        console.error(`  Campo: ${detail.field} - ${detail.message}`);
      }
    } else if (e instanceof ArcaAuthError) {
      // Certificado invalido, expirado, o respuesta WSAA inesperada
      console.error("Error de autenticacion:", e.message);
    } else if (e instanceof ArcaSireServiceError) {
      // Error de negocio de SIRE con codigos especificos
      for (const err of e.errors) {
        console.error(`SIRE [${err.code}]: ${err.msg}`);
      }
    } else if (e instanceof ArcaSoapError) {
      // Timeout, HTTP 500, SOAP Fault
      console.error("Error de conexion:", e.message);
    } else {
      throw e;
    }
  }
}

main().catch(console.error);
