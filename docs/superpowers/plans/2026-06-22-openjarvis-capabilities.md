# OpenJarvis Capabilities Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an OpenJarvis-inspired capability catalog and traceable capability responses to Albert OS.

**Architecture:** Keep the catalog in a small shared TypeScript module consumed by API routes, Hermes routes, chat, and UI pages. Avoid importing OpenJarvis runtime code; use its concepts of discoverable tools, built-in agent modes, and traceable runs.

**Tech Stack:** Next.js App Router, React client pages, TypeScript, existing Hermes gateway helpers.

---

### Task 1: Capability Data Model

**Files:**
- Create: `lib/capabilities.ts`

- [ ] Define `AlbertCapability`, catalog data, summary helpers, matching helpers, and trace builders.
- [ ] Keep data static and safe for server-side use.

### Task 2: API and Hermes Endpoints

**Files:**
- Create: `app/api/capabilities/route.ts`
- Create: `app/hermes/capabilities/route.ts`
- Modify: `app/agent/route.ts`

- [ ] Return catalog summaries from `/api/capabilities`.
- [ ] Return the same shape from `/hermes/capabilities`.
- [ ] Include `/hermes/capabilities` in the root `/agent` endpoint list.

### Task 3: Chat and Progress Integration

**Files:**
- Modify: `lib/hermes-gateway.ts`
- Modify: `lib/progress.ts`

- [ ] Let chat answer capability questions from the catalog.
- [ ] Attach capability readiness to the progress snapshot.

### Task 4: UI

**Files:**
- Create: `app/capabilities/page.tsx`
- Modify: `components/Sidebar.tsx`
- Modify: `app/progress/page.tsx`

- [ ] Add a capabilities page with compact operational cards.
- [ ] Add sidebar navigation.
- [ ] Show capability readiness on Progress.

### Task 5: Verification

**Commands:**
- `npm run lint`
- `npm run build`
- Local HTTP checks for `/api/capabilities`, `/hermes/capabilities`, `/capabilities`, and chat.
