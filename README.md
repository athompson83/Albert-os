<div align="center">

# Albert OS

**An experimental AI operations workspace for tasks, agents, products, credentials, integrations, and portfolio activity.**

![Stage](https://img.shields.io/badge/stage-experimental-475569?style=flat-square)
![Next.js](https://img.shields.io/badge/Next.js-16-475569?style=flat-square&logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React-19-475569?style=flat-square&logo=react&logoColor=white)
![Branch](https://img.shields.io/badge/default-master-475569?style=flat-square)

</div>

> [!CAUTION]
> Albert OS is an experimental workspace, not a verified source of truth for the current SaaS portfolio. Integration status, revenue, tasks, and product state are trustworthy only when their backing services are configured and independently verified.

## Overview

Albert OS explores a unified owner-facing command center for coordinating AI agents and operational work. The current Next.js application contains dashboard and workflow surfaces for agent activity, tasks, product review, credentials, applications, files, conversations, integrations, logs, and revenue signals.

## Current repository shape

| Area | Current implementation |
| --- | --- |
| Application | Next.js App Router with React and TypeScript |
| State/data | TanStack Query and Zustand |
| Authentication | NextAuth dependency and login routes |
| Operations | API routes for status, tasks, products, logs, and integrations |
| Portfolio signals | GitHub, credential, workflow, and revenue-oriented surfaces |
| UI | Responsive dark operations dashboard |

The presence of a page or connector does not prove that the external service is connected, current, or safe for production use.

## Local development

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.

Verification commands:

```bash
npm run lint
npm run build
```

## Security expectations

- Keep provider tokens, GitHub credentials, billing keys, and administrative secrets server-side.
- Never render secret values in activity logs, browser payloads, screenshots, or agent prompts.
- Treat revenue and deployment information as unverified until reconciled against the provider of record.
- Require explicit authorization before any connector performs a write, deployment, billing, or destructive action.
- Do not use this repository as a second control plane when a current canonical system already owns the same data.

## Product decision required

Before further investment, decide whether Albert OS remains an active product, becomes a bounded internal tool, is superseded by another command center, or should be archived. That decision should precede new integrations so portfolio state is not fragmented across competing sources of truth.