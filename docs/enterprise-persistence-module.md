# Enterprise Persistence Module Contract

This project uses an open-core backend registry for persistence.
The OSS build ships with `memory` backend only.

The enterprise module adds:

- Offline Ed25519 license verification
- PGlite-backed local persistence (Postgresql relational storage)
- Restart recovery with bounded retention aligned to `maxTraces`

To enable `pglite`, provide an external module via:

- `PATHLOOM_PERSISTENCE_MODE=pglite`
- `PATHLOOM_PERSISTENCE_BACKEND_MODULE=@pathloom/enterprise-persistence/register`

## Runtime Contract

The module referenced by `PATHLOOM_PERSISTENCE_BACKEND_MODULE` must export:

```ts
export async function registerTraceStoreBackends({
  registerTraceStoreBackend,
}) {
  // register one or more backends
}
```

The callback receives `registerTraceStoreBackend(mode, factory)` where:

- `mode` is `'memory' | 'pglite'`
- `factory` is an async function receiving:
  - `maxTraces: number`
  - `persistencePath: string`
  - `flushMs: number`
- `factory` returns a `TraceStore` optionally augmented with:
  - `getPersistenceStatus(): PersistenceStatus`
  - `close(): Promise<void>` for cleanup and deterministic testing

## Runtime Model

- Reads remain memory-first through the runtime store for fast UI/API access.
- Writes mark dirty `traceId`s and flush them in batches to PGlite.
- Persistence uses relational tables.
- Startup restore reloads the newest traces up to `maxTraces`.
- SQL retention prunes older traces after flush.

## Minimal Example (Enterprise Package)

```ts
// package: @pathloom/enterprise-persistence/register
import { createPGliteTraceStore } from '@pathloom/enterprise-persistence/pglite'

export async function registerTraceStoreBackends({
  registerTraceStoreBackend,
}) {
  registerTraceStoreBackend('pglite', async (config) => {
    // Enterprise package validates signed license before enabling backend.
    return createPGliteTraceStore({
      persistencePath: config.persistencePath,
      maxTraces: config.maxTraces,
      flushMs: config.flushMs,
    })
  })
}
```

## Install & Activate (Customer)

1. Install enterprise package and configure private registry auth.
2. Set env:

```env
PATHLOOM_PERSISTENCE_MODE=pglite
PATHLOOM_PERSISTENCE_BACKEND_MODULE=@pathloom/enterprise-persistence/register
PATHLOOM_LICENSE_KEY=otg.v1.<payload-base64url>.<signature-base64url>
PATHLOOM_LICENSE_PUBLIC_KEY_PATH=/etc/pathloom-studio/license-public.pem
PATHLOOM_PERSISTENCE_PATH=\.pathloom/pglite
PATHLOOM_PERSISTENCE_FLUSH_MS=750
```

3. Restart the server.
4. Check `GET /api/config`:
   - `persistence.enabled=true`
   - `persistence.backend="pglite"`
