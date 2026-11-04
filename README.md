# SigmaTactix Growth OS

**An AI-native growth operating system for marketing teams.** SigmaTactix Growth OS brings workspace intelligence, marketing workflows, governed agent assistance, and performance reporting into one application.

[Getting started](#getting-started) · [Capabilities](#capabilities) · [Development](#development) · [Security](#security)

> **Project status:** This repository contains an actively developed application. Some features require provider credentials or external services, and availability depends on configuration. Agent actions are approval-gated; do not assume integrations or automation are active until verified in your environment.

## At a glance

- **Workspace knowledge:** Organize business information across 10 knowledge vaults, with workspace-scoped data and retrieval.
- **Marketing workflows:** Plan and create content, review SEO and paid media information, manage leads, and prepare reports.
- **Governed agents:** Use approval-gated agent workflows and task execution records.
- **AI and integrations:** Configure supported AI providers and data connectors for your workspace.
- **Security controls:** Server-side credential handling, request validation, rate limiting, and Supabase Row-Level Security (RLS).

## Capabilities

| Area | Examples |
|---|---|
| Growth workspace | Dashboard, diagnostics, Second Brain, and tenant administration |
| Marketing studios | SEO/AEO, paid ads, content, social, email, image, video, and CRO workflows |
| Intelligence | Agent Cockpit, Agent Reach, VANTA Living System, competitor research, and market simulation |
| Platform | Reports, data connectors, AI configuration, scheduler, and architecture viewer |

Availability varies by configuration. External services may require credentials, permissions, or additional infrastructure.

## Technology

- **Frontend:** React 19, React Router, Tailwind CSS, Vite, Recharts, and Three.js
- **Backend:** Node.js 20+, Express, and TypeScript
- **Data:** Supabase (PostgreSQL, Auth, pgvector, and RLS)
- **AI:** Gemini with configurable multi-provider support
- **Validation and testing:** Zod and Vitest

## Architecture

```text
React application (Vite)
        │ HTTP / JSON
        ▼
Express API (authentication, validation, application services)
        │ workspace-scoped access
        ▼
Supabase (PostgreSQL, Auth, pgvector, and Row-Level Security)
```

The frontend communicates with the Express API. Server-side services connect to Supabase and configured providers. Keep privileged keys on the server; never expose the Supabase service-role key to client code.

## Getting started

### Prerequisites

- Node.js 20 or later and npm 10 or later
- A Supabase project configured for the database features used by the application
- API credentials for the providers you want to use

### Install and configure

```bash
git clone https://github.com/sigmatactix/sigma-tactix-growth-os-v2.git
cd sigma-tactix-growth-os-v2
npm install
cp .env.example .env
```

Add the required values to `.env`. Consult `.env.example` for the current configuration and descriptions. Commonly required settings include:

```env
GEMINI_API_KEY=your-gemini-api-key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-server-only-service-role-key
CONNECTOR_CREDENTIALS_KEY=your-32-byte-hex-encryption-key
APP_URL=http://localhost:3000
```

Use a strong, unique encryption key and follow the instructions in `.env.example` for its expected format. Never commit `.env` or share secret values. The service-role key and encryption key must remain server-side.

### Run locally

```bash
npm run dev
```

Open <http://localhost:3000>. For a client-only development server, use `npm run dev:client`.

### Database

Review `backend/database/migrations/` and apply the migrations required by your checkout to your Supabase project in order. Use the repository's verification SQL where applicable. Confirm the target project and migration state before making database changes; do not assume a migration has been applied remotely.

## Development

| Command | Purpose |
|---|---|
| `npm run dev` | Start the full-stack development server |
| `npm run dev:client` | Start the Vite client without the backend |
| `npm run lint` | Run the TypeScript check |
| `npm run test` | Run the Vitest suite |
| `npm run check` | Run the type check and tests |
| `npm run build` | Build the client and server |
| `npm start` | Start the production server |

Run `npm run check` before submitting changes. Tests and available integrations may require additional setup; see the project configuration and relevant documentation.

### Project layout

```text
src/                         React application, pages, components, and shared libraries
src/server/                  Server-side services and routes
backend/database/migrations/ Supabase schema and migration files
docs/                        Architecture decisions, plans, and operational guides
MASTER_CONTEXT.md            Extended architecture and project context
CONTEXT.md                   Domain glossary
```

## Security

- Keep `.env`, provider credentials, and private keys out of version control.
- Never expose `SUPABASE_SERVICE_ROLE_KEY` or `CONNECTOR_CREDENTIALS_KEY` to the browser.
- Keep workspace queries scoped and preserve RLS policies; do not disable RLS as a workaround.
- Validate new API inputs and follow existing authentication and authorization patterns.
- Agent access to sensitive vaults and actions must remain governed by the existing policy and approval controls.

To report a vulnerability, do not open a public issue. Contact [security@sigmatactix.com](mailto:security@sigmatactix.com).

## Contributing

1. Create a focused branch for your change.
2. Add or update tests where appropriate.
3. Run `npm run check` and, for behavior or packaging changes, `npm run build`.
4. Open a pull request with a concise summary, verification results, and any migration or configuration notes.

Follow the TypeScript, Zod validation, theme-token, and domain-language conventions used in the codebase. See [CONTEXT.md](./CONTEXT.md) and [MASTER_CONTEXT.md](./MASTER_CONTEXT.md) for additional project guidance.

## Further information

- [Changelog](./CHANGELOG.md)
- [Architecture and project context](./MASTER_CONTEXT.md)
- [License](./LICENSE)
- [Website](https://sigmatactix.com)
