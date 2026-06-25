# Hermes Integration

AlbertOS exposes a Hermes-friendly HTTP surface so Hermes can discover the app, request Adam input, update work, and confirm state.

## Start Here

- Production base URL: `https://albert-os.vercel.app`
- Local base URL while developing: `http://localhost:3001`
- `GET /hermes/bootstrap` gives Hermes the app purpose, discovered local Hermes/OpenJarvis notes, absolute endpoint map, write contracts, current open tasks, credential requests, products needing action, and recent events.
- `GET /hermes` gives the compact manifest.
- `GET /hermes/health` gives a small health payload.
- `POST /hermes/inbox` lets Hermes send general workstream events or structured updates.

## Write Paths

- `POST /api/chat/stream` for live Albert or agent conversations. Body: `{ "message": "...", "agentId": "albert" }`.
- `POST/PATCH /hermes/tasks`
- `POST/PATCH /hermes/credentials`
- `POST/PATCH /hermes/products`
- `POST/PATCH /hermes/workflows`
- `POST /hermes/inbox`

## Agent Work Visibility

- `GET /api/progress` returns the full feed.
- `GET /api/progress?agent=albert` filters for Albert.
- `GET /api/progress?agent=operator` filters for automation and system work.
- `GET /api/progress?agent=sentinelqa` filters for quality/protocol work.
- `GET /api/marketing` returns campaigns, outreach assets, prospect lists, product marketing assets, and marketing tasks.
- `GET /api/stripe/summary` returns Stripe CRM/revenue status when `STRIPE_SECRET_KEY` is configured.

## Slack App Setup

Configure the Slack app with:

- Event Subscriptions request URL: `https://albert-os.vercel.app/api/slack/events`
- Slash command request URL: `https://albert-os.vercel.app/api/slack/commands`
- Bot scopes: `app_mentions:read`, `chat:write`, `commands`
- Runtime secrets: `SLACK_SIGNING_SECRET`, `SLACK_BOT_TOKEN`

Slash command examples:

- `/albert status`
- `/albert operator check current workflows`
- `/albert sentinelqa summarize quality work`

## Stripe CRM Setup

Configure:

- `STRIPE_SECRET_KEY` in Vercel and local `.env`

AlbertOS reads Stripe customers and payment intents to show:

- `/customers`: CRM-style customer list, paying status, total revenue, and last payment.
- `/revenue`: Stripe revenue summary alongside products, subscribers, and launch readiness.

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
- `/progress`: GitHub/status/report feed with an agent filter.
- `/customers`: Stripe CRM.
- `/marketing`: campaigns, outreach, prospect lists, and product marketing assets.
