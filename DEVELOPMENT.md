# SentinelAML

An AI-powered AML (anti-money-laundering) transaction intelligence platform for compliance teams: graph-based transaction network visualization, rule-based risk scoring, dashboards, alerts, reports, and audit logs.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port from `PORT` env)
- `pnpm --filter @workspace/sentinel-aml run dev` — run the web frontend
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec (`lib/api-spec/openapi.yaml`)
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/scripts run seed:sentinel-aml` — seed demo customers/transactions/users (idempotent — skips if data already exists) with deliberately embedded circular chains, fan-in/fan-out structuring, and high-frequency accounts
- Required env: `DATABASE_URL` — Postgres connection string (already provisioned); `SESSION_SECRET` — JWT signing secret for auth cookies; `BANK_PRIVACY_SECRET` — optional backend-only secret for stable anonymous cross-bank IDs (falls back to `SESSION_SECRET` in development)

### Windows / local VS Code setup

- Install Node.js 20+ and pnpm (`corepack enable` then `corepack prepare pnpm@10.26.1 --activate`) from PowerShell.
- From the repository root, run `pnpm install`.
- Set `DATABASE_URL` and `SESSION_SECRET` in the local environment. Replit supplies `PORT` and `BASE_PATH`; local development safely defaults the API to port `8080`, the SentinelAML frontend to port `5173`, and the frontend base path to `/`.
- Start the API in one PowerShell window: `pnpm --filter @workspace/api-server run dev`.
- Start the frontend in a second PowerShell window: `pnpm --filter @workspace/sentinel-aml run dev`.
- The frontend proxy sends `/api` requests to `http://localhost:8080`; override it with `$env:VITE_API_PROXY_TARGET = "http://localhost:<port>"` if the API uses another port.
- Seed local demo data with `pnpm --filter @workspace/scripts run seed:sentinel-aml`.

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Artifact `sentinel-aml`: React 19 + Vite frontend (dark "surveillance-room" enterprise theme, `react-force-graph-2d` for the network graph)
- Artifact `api-server`: Express 5 backend, shared across artifacts, mounted at `/api`
- DB: PostgreSQL + Drizzle ORM (`lib/db`) — no ORM-level zod validation; request validation goes through Orval-generated Zod schemas for the original API and explicit boundary checks for extension routes
- Auth: email+password with bcryptjs + JWT in an httpOnly cookie (`sentinel_session`), roles: admin, compliance_officer, analyst, investigator
- API contract: OpenAPI spec → Orval codegen → React Query hooks (`lib/api-client-react`) + Zod schemas (`lib/api-zod`)
- Graph analytics (centrality, connected components, cycle detection, shortest path) computed in-process in TypeScript over Postgres data — no separate graph database

## Where things live

- `lib/api-spec/openapi.yaml` — source of truth for the entire API contract (auth, customers, transactions, graph, analytics, risk, dashboard, alerts, audit-logs, search, notifications, reports)
- `lib/db/src/schema/` — Drizzle table definitions (users, customers, transactions, alerts, audit-logs, notifications, banks, investigations, disclosures)
- `artifacts/api-server/src/lib/riskEngine.ts` — rule-based risk scoring engine (high-value, high-frequency, structuring, fan-out/fan-in, circular chains)
- `artifacts/api-server/src/lib/graphAnalytics.ts` — pure-function graph algorithms (degree centrality, connected components, cycle detection, shortest path)
- `artifacts/api-server/src/routes/` — one router per resource, all except `auth` gated behind `requireAuth`
- `artifacts/sentinel-aml/src/pages/` — one page per route (dashboard, customers, customer detail, transactions, graph, cross-bank, mules, investigations, disclosures, alerts, reports, audit-logs, settings, login, signup)
- `scripts/src/seed-sentinel-aml.ts` — one-off seed script for demo data

## Architecture decisions

- Original brief targeted Next.js/Prisma/Neo4j; adapted to this workspace's conventions instead: one react-vite artifact + shared Express `api-server` + Drizzle/Postgres, with graph analytics computed in-process rather than in a separate graph database.
- Kept JWT/bcrypt cookie auth (rather than Clerk/Replit Auth) per explicit brief requirement for role-based email+password auth.
- Request body validation happens via Orval-generated Zod schemas in route handlers, not `drizzle-zod` — avoids a zod v3/v4 type-compat issue between `drizzle-zod` and the workspace's pinned zod version.
- Risk scoring is a deterministic, explainable rule engine (not ML) — each flagged rule contributes a named point value so `/risk/breakdown` can show compliance officers exactly why an account scored as it did.
- Cross-bank data is simulated inside the same PostgreSQL database; anonymous IDs are SHA-256-derived on the backend and normal network responses never expose internal customer IDs.

## Product

- **Dashboard**: KPI overview (customers, transactions, high-risk accounts, total flow, open alerts) plus recent alerts feed.
- **Customers**: searchable/filterable directory, detail view with explainable risk breakdown, transaction history, delete.
- **Transactions**: filterable ledger with counterparty tracking.
- **Graph**: force-directed network visualization of accounts and transaction flows, with centrality/cycle-detection/shortest-path analytics panels and flagged-flow highlighting.
- **Alerts**: triage view to resolve/reopen system-generated alerts.
- **Reports**: risk distribution summary plus CSV export (customers/transactions/alerts).
- **Audit logs**: admin-only trail of user actions.
- **Cross-Bank Analysis**: simulated Alpha, Beta, and Gamma Indian banks with privacy-safe external entities and network-level risk.
- **Potential Mules**: explainable fan-in/fan-out, pass-through, velocity, and cross-bank screening.
- **Investigations**: case creation and status workflow for suspicious networks.
- **Disclosure Requests**: backend-authorized identity request/approval flow revealing only a name and account ending after approval.
- Demo accounts (after seeding): `admin@sentinelaml.dev` / `Sentinel123!` (also `compliance@`, `analyst@`, `investigator@` with the same password, differing roles).

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- After seeding, call `POST /api/risk/recompute` (as an authenticated user) to score customers and generate alerts — the seed script only inserts raw transactions.
- The extension seed assigns customers to three simulated Indian banks and creates the named A101/B201/C301 cross-bank demonstration network.
- `lib/db` intentionally does not depend on `drizzle-zod`; don't reintroduce it without checking zod version compatibility first.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
