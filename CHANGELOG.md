# Changelog

## 0.1.0 (2026-03-31)

### Features
- Initial release
- Orchestrator class `ArcaSire` with automatic WSAA authentication
- Register retentions/perceptions (`registrarRetencion`)
- Query retentions by period (`consultarRetenciones`)
- Cancel retentions (`anularRetencion`)
- Query individual certificates (`consultarComprobante`)
- Generate retention certificates (`generarCertificado`)
- Parameter queries: regimes, rates, voucher types, operation types, conditions
- Input validation with `ArcaValidationError` from `@ramiidv/arca-common`
- Low-level `SireClient` for direct SOAP access
- Enums: `TipoComprobante`, `TipoRetencion`, `Regimen`, `TipoOperacion`, `CondicionSujeto`, `EstadoComprobante`
- Domain-specific errors: `ArcaSireError`, `ArcaSireServiceError`
- Health check via `status()` / `dummy()`
