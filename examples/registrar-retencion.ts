/**
 * Ejemplo: Registrar una retencion de IVA
 *
 * Registra una retencion en el SIRE (Sistema Integral de Retenciones
 * Electronicas) de ARCA. Muestra el flujo completo incluyendo la
 * consulta de regimenes disponibles.
 */

import fs from "fs";
import {
  ArcaSire,
  TipoComprobante,
  TipoRetencion,
  Regimen,
  TipoOperacion,
} from "@ramiidv/arca-sire";

async function main() {
  const sire = new ArcaSire({
    cert: fs.readFileSync("./certs/certificado.crt", "utf-8"),
    key: fs.readFileSync("./certs/clave.key", "utf-8"),
    cuit: "20123456789",
    production: false,
  });

  // Verificar el estado del servicio
  const status = await sire.status();
  console.log("Estado del servicio:", status);

  // Consultar regimenes disponibles
  const regimenes = await sire.consultarRegimenes();
  console.log(`\nRegimenes disponibles: ${regimenes.length}`);
  for (const reg of regimenes.slice(0, 5)) {
    console.log(`  - [${reg.codigo}] ${reg.descripcion}`);
  }

  // Registrar una retencion de IVA
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
    porcentajeRetencion: 21,
    observaciones: "Retencion IVA sobre factura de servicios",
  });

  console.log("\nRetencion registrada:");
  console.log(`  Nro Comprobante: ${resultado.nroComprobante}`);
  console.log(`  Resultado: ${resultado.resultado}`);
  console.log(`  Fecha proceso: ${resultado.fechaProceso}`);

  if (resultado.nroCertificado) {
    console.log(`  Nro Certificado: ${resultado.nroCertificado}`);
  }
  if (resultado.codigoAutorizacion) {
    console.log(`  Codigo Autorizacion: ${resultado.codigoAutorizacion}`);
  }
}

main().catch(console.error);
