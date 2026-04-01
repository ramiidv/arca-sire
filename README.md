# @ramiidv/arca-sire

SDK de TypeScript para el web service SIRE (Sistema Integral de Retenciones Electronicas) de ARCA (ex AFIP). Gestiona certificados de retencion/percepcion electronicos, reemplazando al antiguo sistema SICORE.

## Caracteristicas

- Zero dependencias SOAP: construye los envelopes SOAP manualmente
- Zero dependencias HTTP: usa `fetch` nativo (Node 18+)
- Firma CMS/PKCS#7 con node-forge
- ESM only
- TypeScript estricto con tipos completos
- Cache automatico de tokens WSAA
- Reintentos con backoff exponencial
- Sistema de eventos para monitoreo

## Instalacion

```bash
npm install @ramiidv/arca-sire
```

## Inicio rapido

```typescript
import { readFileSync } from 'fs';
import { ArcaSire, TipoComprobante, TipoRetencion, TipoOperacion } from '@ramiidv/arca-sire';

const sire = new ArcaSire({
  cert: readFileSync('./cert.pem', 'utf-8'),
  key: readFileSync('./key.pem', 'utf-8'),
  cuit: '20123456789',
  production: false, // false = homologacion
});

// Registrar una retencion de IVA
const resultado = await sire.registrarRetencion({
  tipoComprobante: TipoComprobante.C2005,
  fechaEmision: '2026-03-31',
  tipoRetencion: TipoRetencion.RETENCION,
  codigoRegimen: 499,
  tipoOperacion: TipoOperacion.NORMAL,
  cuitRetenido: '30712345678',
  fechaRetencion: '2026-03-31',
  importeOperacion: 10000,
  importeRetenido: 2100,
});
console.log('Comprobante:', resultado.nroComprobante);

// Consultar retenciones de un periodo
const consulta = await sire.consultarRetenciones({ periodo: '202603' });
console.log(`${consulta.cantidadRegistros} retenciones encontradas`);

// Consultar un comprobante especifico
const comprobante = await sire.consultarComprobante('00001234');
console.log(comprobante.estado, comprobante.importeRetenido);

// Anular una retencion
const anulacion = await sire.anularRetencion('00001234');
console.log('Anulado:', anulacion.resultado);
```

## Configuracion

```typescript
interface ArcaSireConfig {
  /** Certificado X.509 en formato PEM */
  cert: string;
  /** Clave privada RSA en formato PEM */
  key: string;
  /** CUIT del agente de retencion */
  cuit: string;
  /** Usar endpoints de produccion (default: false) */
  production?: boolean;
  /** Timeout en ms (default: 30000) */
  timeout?: number;
  /** Cantidad de reintentos en errores 5xx/red (default: 1) */
  retries?: number;
  /** Delay base en ms para backoff exponencial (default: 1000) */
  retryDelayMs?: number;
  /** Callback de eventos para monitoreo */
  onEvent?: (event: ArcaEvent) => void;
}
```

## API

### Metodos de alto nivel

#### `registrarRetencion(retencion: Retencion): Promise<RetencionResult>`

Registra una nueva retencion/percepcion. Autentica automaticamente con WSAA.

```typescript
const resultado = await sire.registrarRetencion({
  tipoComprobante: TipoComprobante.C2005,
  fechaEmision: '2026-03-31',
  tipoRetencion: TipoRetencion.RETENCION,
  codigoRegimen: 499,
  tipoOperacion: TipoOperacion.NORMAL,
  cuitRetenido: '30712345678',
  fechaRetencion: '2026-03-31',
  importeOperacion: 10000,
  importeRetenido: 2100,
  porcentajeRetencion: 21,
  condicion: CondicionSujeto.INSCRIPTO,
});
```

#### `consultarRetenciones(consulta: ConsultaRetencionesParams): Promise<ConsultaRetencionesResult>`

Consulta retenciones registradas por periodo.

```typescript
const resultado = await sire.consultarRetenciones({
  periodo: '202603',
  quincena: 1,                          // opcional
  tipoComprobante: TipoComprobante.C2005, // opcional
  cuitRetenido: '30712345678',          // opcional
});

for (const ret of resultado.retenciones) {
  console.log(ret.nroCertificado, ret.importeRetenido, ret.estado);
}
```

#### `anularRetencion(nroComprobante: string): Promise<RetencionResult>`

Anula una retencion previamente registrada.

```typescript
const resultado = await sire.anularRetencion('00001234');
```

#### `consultarComprobante(nroComprobante: string): Promise<CertificadoRetencion>`

Consulta un certificado de retencion especifico por numero de comprobante.

```typescript
const comprobante = await sire.consultarComprobante('00001234');
console.log(comprobante.estado); // 'V' = Vigente, 'A' = Anulado
```

#### `generarCertificado(nroComprobante: string): Promise<CertificadoRetencion>`

Genera un certificado de retencion.

```typescript
const certificado = await sire.generarCertificado('00001234');
```

#### `consultarAlicuotas(codigoRegimen?: number): Promise<AlicuotaItem[]>`

Consulta las alicuotas/tasas aplicables. Opcionalmente filtra por regimen.

```typescript
const alicuotas = await sire.consultarAlicuotas(499);
for (const a of alicuotas) {
  console.log(`Regimen ${a.codigoRegimen}: ${a.porcentaje}%`);
}
```

#### `consultarRegimenes(): Promise<RegimenItem[]>`

Consulta los regimenes de retencion/percepcion disponibles.

```typescript
const regimenes = await sire.consultarRegimenes();
for (const r of regimenes) {
  console.log(`[${r.codigo}] ${r.descripcion}`);
}
```

#### `consultarTiposComprobante(): Promise<TipoComprobanteItem[]>`

Consulta los tipos de comprobante validos.

```typescript
const tipos = await sire.consultarTiposComprobante();
```

#### `consultarTiposOperacion(): Promise<TipoOperacionItem[]>`

Consulta los tipos de operacion validos.

```typescript
const tipos = await sire.consultarTiposOperacion();
```

#### `consultarCondicion(): Promise<CondicionItem[]>`

Consulta las condiciones del sujeto retenido.

```typescript
const condiciones = await sire.consultarCondicion();
```

#### `status(): Promise<ServerStatus>`

Verifica el estado del servicio SIRE (no requiere autenticacion).

```typescript
const estado = await sire.status();
console.log(estado.appserver); // "OK"
```

### Acceso a clientes de bajo nivel

Para casos avanzados, se pueden usar los clientes individuales directamente:

```typescript
const sire = new ArcaSire({ /* ... */ });

// Obtener ticket de acceso manualmente
const ticket = await sire.wsaa.getAccessTicket('sire-ws');

const credenciales = {
  Token: ticket.token,
  Sign: ticket.sign,
  CuitRepresentada: '20123456789',
};

// Llamar directamente al servicio
const resultado = await sire.client.registrarRetencion(credenciales, {
  tipoComprobante: 2005,
  fechaEmision: '2026-03-31',
  tipoRetencion: 1,
  codigoRegimen: 499,
  tipoOperacion: 1,
  cuitRetenido: '30712345678',
  fechaRetencion: '2026-03-31',
  importeOperacion: 10000,
  importeRetenido: 2100,
});
```

## Tipos de respuesta

### Retencion (datos de entrada)

```typescript
interface Retencion {
  tipoComprobante: number;
  fechaEmision: string;
  tipoRetencion: number;
  codigoRegimen: number;
  tipoOperacion: number;
  cuitRetenido: string;
  fechaRetencion: string;
  importeOperacion: number;
  importeRetenido: number;
  porcentajeRetencion?: number;
  nroComprobanteOriginal?: string;
  condicion?: number;
  nroCertificadoPropio?: string;
  tipoDocRetenido?: number;
  importeBaseCalculo?: number;
  fechaComprobanteOriginal?: string;
  tipoComprobanteOriginal?: number;
  observaciones?: string;
}
```

### RetencionResult

```typescript
interface RetencionResult {
  nroComprobante: string;
  nroCertificado?: string;
  codigoAutorizacion?: string;
  fechaProceso: string;
  resultado: string;
  observaciones?: string;
  errores?: { code: number; msg: string }[];
}
```

### CertificadoRetencion

```typescript
interface CertificadoRetencion {
  nroComprobante: string;
  nroCertificado: string;
  tipoComprobante: number;
  cuitAgente: string;
  cuitRetenido: string;
  fechaEmision: string;
  fechaRetencion: string;
  tipoRetencion: number;
  codigoRegimen: number;
  importeOperacion: number;
  importeRetenido: number;
  porcentajeRetencion?: number;
  estado: string;
  codigoAutorizacion?: string;
  condicion?: number;
  observaciones?: string;
}
```

### Tipos de parametros

```typescript
interface RegimenItem {
  codigo: number;
  descripcion: string;
  tipoRetencion?: number;
  estado?: string;
  vigenciaDesde?: string;
  vigenciaHasta?: string;
}

interface AlicuotaItem {
  codigoRegimen: number;
  porcentaje: number;
  importeMinimo?: number;
  importeExcedente?: number;
  descripcion?: string;
  vigenciaDesde?: string;
  vigenciaHasta?: string;
}

interface TipoComprobanteItem {
  codigo: number;
  descripcion: string;
}

interface TipoOperacionItem {
  codigo: number;
  descripcion: string;
}

interface CondicionItem {
  codigo: number;
  descripcion: string;
}

interface ServerStatus {
  appserver: string;
  dbserver: string;
  authserver: string;
}
```

## Manejo de errores

El SDK usa una jerarquia de errores de 4 clases:

```
Error
  └── ArcaError (base de @ramiidv/arca-common)
        ├── ArcaAuthError (errores de WSAA)
        ├── ArcaSoapError (errores HTTP/transporte)
        ├── ArcaSireError (base de errores SIRE)
        └── ArcaSireServiceError (errores de negocio de SIRE)
```

```typescript
import {
  ArcaAuthError,
  ArcaSireServiceError,
  ArcaSoapError,
} from '@ramiidv/arca-sire';

try {
  await sire.registrarRetencion(retencion);
} catch (error) {
  if (error instanceof ArcaAuthError) {
    // Certificado vencido, servicio no autorizado, WSAA caido
    console.error('Error de autenticacion:', error.message);
  } else if (error instanceof ArcaSireServiceError) {
    // Errores de negocio SIRE (datos invalidos, regimen incorrecto, etc.)
    for (const detalle of error.errors) {
      console.error(`[${detalle.code}] ${detalle.msg}`);
    }
  } else if (error instanceof ArcaSoapError) {
    // Errores HTTP/red
    console.error('Error HTTP:', error.statusCode, error.message);
  }
}
```

## Eventos

El SDK emite eventos para monitoreo y debugging:

```typescript
const sire = new ArcaSire({
  // ...
  onEvent: (evento) => {
    switch (evento.type) {
      case 'auth:login':
        console.log(`Login para ${evento.service}`);
        break;
      case 'auth:cache-hit':
        console.log(`Token cacheado para ${evento.service}`);
        break;
      case 'request:start':
        console.log(`Inicio ${evento.method}`);
        break;
      case 'request:end':
        console.log(`Fin ${evento.method} (${evento.durationMs}ms)`);
        break;
      case 'request:retry':
        console.log(`Reintento #${evento.attempt}`);
        break;
      case 'request:error':
        console.log(`Error: ${evento.error}`);
        break;
    }
  },
});
```

## Enums utiles

```typescript
import {
  TipoComprobante,
  TipoRetencion,
  Regimen,
  TipoOperacion,
  CondicionSujeto,
  EstadoComprobante,
} from '@ramiidv/arca-sire';

// Tipos de comprobante
TipoComprobante.C2005; // 2005 - Retencion/Percepcion IVA
TipoComprobante.C2003; // 2003 - Ganancias beneficiarios del exterior
TipoComprobante.C2004; // 2004 - Seguridad Social

// Tipo de operacion
TipoRetencion.RETENCION;  // 1
TipoRetencion.PERCEPCION; // 2

// Regimenes comunes
Regimen.IVA_GENERAL;       // 499
Regimen.GANANCIAS_GENERAL; // 1
Regimen.SUSS_GENERAL;      // 800

// Condicion del sujeto
CondicionSujeto.INSCRIPTO;      // 1
CondicionSujeto.NO_INSCRIPTO;   // 2
CondicionSujeto.EXENTO;         // 3
CondicionSujeto.NO_CATEGORIZADO; // 4

// Estado del comprobante
EstadoComprobante.VIGENTE; // 'V'
EstadoComprobante.ANULADO; // 'A'
```

## Requisitos

- Node.js >= 18 (soporte nativo de `fetch`)
- Certificado digital emitido por ARCA/AFIP
- Autorizacion para el servicio web `sire-ws`

## Licencia

MIT
