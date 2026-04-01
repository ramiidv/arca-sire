/**
 * Ejemplo: Consultar retenciones por periodo
 *
 * Consulta las retenciones registradas en un periodo fiscal dado.
 * Permite filtrar por tipo de comprobante y CUIT del retenido.
 */

import fs from "fs";
import { ArcaSire } from "@ramiidv/arca-sire";

async function main() {
  const sire = new ArcaSire({
    cert: fs.readFileSync("./certs/certificado.crt", "utf-8"),
    key: fs.readFileSync("./certs/clave.key", "utf-8"),
    cuit: "20123456789",
    production: false,
  });

  // Consultar todas las retenciones de marzo 2026
  const resultado = await sire.consultarRetenciones({
    periodo: "202603",
  });

  console.log(`Total de registros: ${resultado.cantidadRegistros}`);
  console.log(`Retenciones encontradas: ${resultado.retenciones.length}\n`);

  for (const ret of resultado.retenciones) {
    console.log(`  Comprobante: ${ret.nroComprobante}`);
    console.log(`    CUIT Retenido: ${ret.cuitRetenido}`);
    console.log(`    Fecha Emision: ${ret.fechaEmision}`);
    console.log(`    Importe Operacion: $${ret.importeOperacion.toLocaleString("es-AR")}`);
    console.log(`    Importe Retenido: $${ret.importeRetenido.toLocaleString("es-AR")}`);
    console.log(`    Regimen: ${ret.codigoRegimen}`);
    console.log(`    Estado: ${ret.estado}`);
    console.log();
  }

  // Consultar retenciones filtradas por CUIT del retenido
  const filtrada = await sire.consultarRetenciones({
    periodo: "202603",
    cuitRetenido: "30712345678",
  });

  console.log(
    `Retenciones para CUIT 30712345678: ${filtrada.cantidadRegistros}`
  );

  // Consultar un comprobante individual
  if (resultado.retenciones.length > 0) {
    const nro = resultado.retenciones[0].nroComprobante;
    const detalle = await sire.consultarComprobante(nro);
    console.log(`\nDetalle del comprobante ${nro}:`);
    console.log(`  Certificado: ${detalle.nroCertificado}`);
    console.log(`  CUIT Agente: ${detalle.cuitAgente}`);
    console.log(`  Estado: ${detalle.estado}`);
  }
}

main().catch(console.error);
