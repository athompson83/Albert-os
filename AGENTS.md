<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Albert OS — bounded experimental guidance

## Context and authority

- Read `README.md`, relevant `STATUS.md`/`SUMMARY.md`, and directory-scoped guidance. Albert OS is experimental, not the authoritative current SaaS portfolio control plane.
- The README requires an owner decision on active product versus bounded internal tool versus superseded/archive status before further integrations. This policy change does not reactivate the product or resolve that decision.
- Preserve the existing Next.js/NextAuth/TanStack Query/Zustand architecture; do not create a competing source of truth for data owned by a current canonical system.
- Integration, revenue, deployment, and task status must be reconciled with the actual provider of record. A dashboard page or connector stub does not prove a service is connected or current.
- Require explicit authorization for connector writes, deployments, billing, or destructive actions as the README specifies. Keep secrets server-side and out of logs, screenshots, payloads, and prompts.
- Current owner instructions and approved controls govern authority. Preserve any adopted canonical control standard; do not introduce another constitution or silently extend release authority.

## Working foundation

- Define one bounded end-to-end acceptance path and non-goals before an authorized feature. Do not add speculative integrations, services, databases, or dependencies.
- Use `npm ci` with the committed lockfile; reconcile compatible toolchain pins with CI/hosting rather than inventing versions.
- Existing commands are `npm run dev`, `npm run lint`, `npm run build`, and `npm start`. The manifest defines no test/smoke command; lint/build alone do not prove behavior.
- Add a real synthetic/mocked local smoke path before a substantial feature: an authorized user sees a provenance-labelled provider result, while unauthenticated access and unauthorized connector writes fail closed. Mock data must be visibly distinguished from live provider evidence.
- Ordinary tests must not use Production credentials, real billing actions, or paid-provider traffic. Separate authorized live checks; document variable names/consumers/scopes/validation, never secret values.
- Never add placeholder-success scripts or suppress errors. Demonstrate an intentional failure is caught when adding/changing the verification harness.

## Economical CI and delivery

- Run focused local checks before coherent pushes. Broaden for auth, permissions, shared contracts, dependencies, toolchain, workflows, and agent policy; diagnose complete failing logs before reruns.
- Avoid duplicate push/PR jobs, speculative pushes, repeated matrices, and unrelated hosted tasks. Prose-only changes need an explicit allowlist; agent/release policy and executable Markdown are not automatically ordinary documentation.
- Preserve required checks. CI routing changes need tests and an always-evaluated gate rejecting failed/cancelled/missing required work; cancel superseded PR validation only where safe, not deployments/migrations.
- Use least privilege, immutable action references, and untrusted/privileged separation. Check actual branch rules, canonical project IDs, environment scopes, deployment triggers, and authorization before merging; a merge may deploy.
- Fix relevant blockers/invariants and record unrelated cleanup without broadening the task. Do not create duplicate platform projects or delete canonical resources as branch cleanup.

## Handoff

- Distinguish implemented, wired, locally verified, hosted verified, and released with exact SHA, commands/results, environment, and evidence. Update existing status artifacts concisely; retain PROJECT_CHECKLIST/PROGRESS if adopted, not parallel competing trackers.
- Preserve history when archiving. Report actual checks, blockers, genuine owner decisions, and the next smallest authorized task. Load deeper context/skills only when needed; confirm fresh-agent instruction loading.
