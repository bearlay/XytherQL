# XytherQL

**GraphQL Security Auditing Tool** — internal introspection and authorization audit console. Maps schema tables and mutations, inspects fields, and tests read/write access controls.

**Use only on systems you are authorized to test.**

## Architecture

```
Browser (Next.js UI)  →  FastAPI API  →  Target GraphQL endpoint
```

## Quick start (local)

### One command (recommended)

```bash
chmod +x run.sh kill.sh scripts/run.sh scripts/kill.sh
./run.sh
```

Stop everything:

```bash
./kill.sh
```

Open [http://localhost:3000](http://localhost:3000).

### Manual start

**Backend:** `cd backend && python3 -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt && uvicorn app.main:app --reload --port 8000`

**Frontend:** `cd frontend && npm install && npm run build && npm start`

### If you see 404 on every page

This is usually **not** a permissions or `sudo` issue. On macOS, Next.js dev can hit `EMFILE: too many open files` and fail to register routes. Fixes:

1. Use production mode (recommended): `npm run build && npm start`
2. Or use the updated dev script (polling): `npm run dev`
3. Optionally raise limits: `ulimit -n 10240` in your terminal, then restart dev

## Features

- **Dashboard** — connect endpoint, view schema stats, export JSON
- **Tables** — browse discovered types, inspect fields, test scalar read access
- **Mutations** — browse auth/write hooks, run safe validation probes
- **Inspector** — search any table or mutation by name
- **Schema Graph** — ER-style entity diagram (focus neighborhoods, search, attribute panel)
- **Settings** — custom headers (e.g. `Authorization`) and timeout

## User guide

### Who this is for

XytherQL is an internal security console for **authorized** GraphQL reviews. You connect to a target endpoint, map the schema, inspect types, visualize relationships, and run **limited, non-destructive** access checks. Do not use it on systems you do not own or lack written permission to test.

### Typical workflow

1. **Configure** optional headers and timeout under **Settings** (before connecting).
2. **Connect** on the **Dashboard** with your GraphQL HTTP endpoint URL.
3. Review summary stats (tables, mutations, entities).
4. Explore the schema via **Schema Graph**, **Tables**, **Mutations**, or **Inspector**.
5. Run **access control tests** on individual tables or mutations where needed.
6. **Export** raw introspection JSON from the dashboard for offline analysis.
7. **Disconnect** from the sidebar when finished.

Sessions are stored in memory on the API server and in your browser until you disconnect or restart the backend.

### Navigation

| Page | Path | Purpose |
|------|------|---------|
| Dashboard | `/` | Connect, view stats, export schema, open graph |
| Schema Graph | `/explorer` | Full-screen ER diagram of types and relations |
| Tables | `/tables` | Browse object types; open a table for fields and audits |
| Mutations | `/mutations` | Browse mutation root fields; open one for details and audits |
| Inspector | `/inspector` | Search any table or mutation by name in one place |
| Settings | `/settings` | Request timeout and custom HTTP headers |

On mobile, open the menu from the top bar. The sidebar shows your active endpoint and a **Disconnect** button when connected.

### Dashboard

**First visit:** Enter the GraphQL endpoint (e.g. `https://api.example.com/v1/graphql`) and click **Connect & Map Schema**. The API runs a standard introspection query and builds a session.

**After connect:**

- **Stat cards** link to Tables, Mutations, and Inspector with live counts.
- **Download schema JSON** exports the full introspection payload for the current session.
- **Open schema graph** jumps to the ER diagram explorer.

If connection fails, check the endpoint URL, network access, and whether the API allows introspection. Add auth headers in **Settings** before reconnecting.

### Settings

Configure these **before** connecting (or disconnect and connect again to apply changes):

- **Request timeout** — Introspection timeout in seconds (5–120). Increase for large schemas or slow networks.
- **Custom headers** — Key/value pairs sent with introspection and audit requests from the API server (e.g. `Authorization: Bearer …`, `x-hasura-admin-secret`).

Headers and timeout are kept in the browser and passed to the backend on each connect/audit call.

### Schema Graph (`/explorer`)

Interactive entity-relationship view of your GraphQL schema (React Flow).

**Toolbar**

| Control | Action |
|---------|--------|
| **Find entity…** | Search types by name; selects and focuses the first match |
| **Refresh** | Reload introspection from the server |
| **Fit** | Zoom/pan to show all visible nodes |
| **Full graph** | Toggle between focused neighborhood and broader graph |
| **Reset focus** | Return focus to the query root |
| **Hide Relay** | Hide Relay-style `Connection` / `Edge` / `PageInfo` types (on by default) |
| **Hide deprecated** | Omit deprecated fields from the model |
| **Scalars** | Show scalar fields on entity cards |

**Canvas**

- **Pan** — drag the background.
- **Zoom** — scroll or pinch; use the controls at bottom-left.
- **Click an entity** — opens the inspector panel on the right with fields and relations.
- **Click an edge** — focuses the source entity.
- Cyan lines = relations; amber markers = key-like fields (`id`, `uuid`, etc.).

**Tips**

- If the canvas looks empty, click **Fit**, then try **Full graph** or turn off **Hide Relay** (common on Hasura-style APIs).
- The counter shows how many entities are visible vs total when the graph is truncated.
- Large schemas use a focused neighborhood around `query_root` by default to keep the diagram readable.

### Tables

Lists object types discovered from introspection (mapped as “tables”). Click a row to open its detail page:

- **Fields** — name and GraphQL type for each column.
- **Access control test** — runs a limited scalar read (max 3 rows) to see if unauthenticated or current credentials can read data.
- **Retrieve dump** (where available) — fetch rows in batches with configurable limits; download results as JSON.

Audit results use status badges (e.g. allowed, denied, error) with a short message. Interpret results only in the context of your test credentials and policy.

### Mutations

Lists operations on the mutation root. Each mutation page shows return type, arguments, and an **access control test** that sends a **safe validation-style** request (not a destructive payload).

Use this to see whether a mutation is reachable or rejected under the current session headers.

### Inspector

Unified search across all table and mutation names from the sidebar session. Type to filter, select an entry, then view fields and run the same audit panel as on the dedicated table/mutation pages—useful when you know the name but not which list it belongs to.

### Access control tests

| Target | What it does |
|--------|----------------|
| **Table** | Issues a small read query (limited rows/scalars) |
| **Mutation** | Sends a validation probe with safe fallback arguments |

Tests run **from the API server** to the target endpoint using your session headers. They are intended for authorization review, not load testing or data exfiltration at scale. Use **Retrieve dump** only within policy-approved limits.

### Export and sessions

- **Export** — `GET /api/session/{id}/export` or the dashboard download button; same JSON as introspection.
- **Disconnect** — Clears the browser session; server-side session remains until backend restart or TTL (in-memory only).
- **Reconnect** — Required after backend restart (`Session not found`).

### Troubleshooting

| Problem | What to try |
|---------|-------------|
| **404 on every page** | Use `./run.sh` (production build) or `npm run build && npm start`; see [Quick start](#quick-start-local) |
| **Connection failed** | Verify URL, TLS, firewall; add auth headers in Settings |
| **Session not found** | Reconnect from the Dashboard |
| **Empty schema graph** | Click **Fit** → **Full graph**; disable **Hide Relay**; click **Refresh** |
| **Graph too crowded** | Stay in focused mode; search for one entity; enable **Hide Relay** |
| **Introspection disabled** | Target must allow introspection for this tool to work |

## Docker (optional)

```bash
docker compose up --build
```

UI: http://localhost:3000 · API: http://localhost:8000

## API endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/connect` | Introspect endpoint, create session |
| GET | `/api/session/{id}` | Session summary (tables, mutations, stats) |
| GET | `/api/session/{id}/introspection` | Full introspection JSON (Schema Graph) |
| GET | `/api/session/{id}/entity/{name}` | Inspect table/mutation/type |
| POST | `/api/session/{id}/audit/table` | Test table read access |
| POST | `/api/session/{id}/audit/mutation` | Test mutation handling |
| GET | `/api/session/{id}/export` | Download raw schema JSON |
| DELETE | `/api/session/{id}` | End session |

## Original CLI

Your original interactive CLI script logic lives in `backend/app/audit_service.py`. You can still run a terminal version by calling those functions from a small script if needed.
