# OpenJarvis Capabilities Design

## Goal

Bring the most useful OpenJarvis pattern into Albert OS: discoverable capabilities that can be queried, shown in the UI, and referenced by chat/progress responses.

## Scope

Albert OS will not port the OpenJarvis Python runtime, local model stack, desktop shell, or trace database. Instead, it will add a lightweight capability catalog inside the existing Next.js and Hermes HTTP gateway app.

## Design

- A shared `lib/capabilities.ts` module owns the catalog, summary counts, simple capability matching, and a run-trace record builder.
- `/api/capabilities` and `/hermes/capabilities` expose the catalog to Albert UI and external Hermes clients.
- Chat responses can answer "what can you do?" and capability-specific questions using the same catalog.
- The Progress page shows a capability readiness section so GitHub progress, local status, and Hermes capability state are visible together.
- A `/capabilities` page provides a scannable command-center view for available abilities.

## Verification

Run lint and build. Manually verify `/api/capabilities`, `/hermes/capabilities`, `/capabilities`, `/progress`, and chat capability questions.
