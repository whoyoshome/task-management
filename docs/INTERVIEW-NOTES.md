# Interview Notes

## Trade-offs I made

1. **Microservices vs modular monolith** — Chose microservices to practice service boundaries and TCP contracts. Accept higher operational complexity for a portfolio demo.
2. **localStorage vs httpOnly cookies** — The refresh token lives in an httpOnly, SameSite=Strict cookie, so an XSS payload cannot steal a long-lived session. The access token stays in localStorage: it is short-lived and lets every tab share one session. Keeping it in memory only would also need a cross-tab channel, or a BFF layer.
3. **OpenAPI type generation** — Invested in generated types to keep frontend and backend aligned. Requires regenerating types when the API changes.

## What I would improve with more time

1. Drag-and-drop kanban with `@dnd-kit`
2. Sprint planning UI wired to existing backend endpoints
3. Distributed tracing (OpenTelemetry) across gateway and microservices
4. Password reset and email verification flows

## Demo in under 5 minutes

```bash
git clone <repo>
cd task-management
cp .env.example .env
npm run docker:up
# Wait for services + seed container
open http://localhost:5173
```

Login: `admin@example.com` / `Password123!`

## Talking points for interviews

- Explain JWT + refresh flow and the axios interceptor
- Walk through project-role guards on task mutations
- Show TaskDetailPanel: comments + labels wired to real API endpoints
- Mention CI: lint, unit tests (all apps), E2E with Docker Compose
