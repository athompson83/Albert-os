# Hermes Integration

AlbertOS exposes a Hermes-friendly HTTP surface so Hermes can discover the app, request Adam input, update work, and confirm state.

## Start Here

- `GET /hermes/bootstrap` gives Hermes the app purpose, discovered local Hermes/OpenJarvis notes, absolute endpoint map, write contracts, current open tasks, credential requests, products needing action, and recent events.
- `GET /hermes` gives the compact manifest.
- `GET /hermes/health` gives a small health payload.
- `POST /hermes/inbox` lets Hermes send general workstream events or structured updates.

## Write Paths

- `POST/PATCH /hermes/tasks`
- `POST/PATCH /hermes/credentials`
- `POST/PATCH /hermes/products`
- `POST/PATCH /hermes/workflows`
- `POST /hermes/inbox`

## Local Hermes Files Found

- `work/OpenJarvis/src/openjarvis/evals/backends/external/hermes_agent.py`
- `work/OpenJarvis/src/openjarvis/evals/backends/external/_runners/hermes_runner.py`
- `work/OpenJarvis/src/openjarvis/evals/configs/framework_comparison/_third_party.toml`

The OpenJarvis adapter expects a separate Hermes Agent checkout through `HERMES_AGENT_PATH`, plus optional `HERMES_AGENT_PYTHON`. No standalone Hermes Agent checkout was found under `C:/Users/Adam` during the 2026-06-25 local search; AlbertOS is therefore acting as the HTTP host app Hermes can connect to.

## UI Surfaces

- `/` dashboard: Hermes status, handoff endpoints, workstream, tasks, products, revenue.
- `/credentials`: Adam-facing credential entry for Hermes requests.
- `/tasks`: task queue and requested-field responses.
- `/products`: review, comment, remove, and download digital products.
- `/progress`: GitHub/status/report feed.
