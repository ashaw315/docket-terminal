# Task Manager

## Stack

Next.js 14 App Router · Neon Postgres · Prisma · Tailwind · dnd-kit · Vitest · Playwright

## Planning cycle

Before writing any code for a task:

1. State what you are about to build in one sentence
2. List the files you will create or modify
3. List the tests you will write alongside it
4. Then implement — code and tests together, never tests as an afterthought

Never skip the planning step, even for small tasks.

## Testing — required alongside every feature

### Unit / integration tests (Vitest)

- Framework: Vitest + @testing-library/react
- Config: `vitest.config.ts` at project root
- Test files live next to the code they test: `foo.ts` → `foo.test.ts`
- Run with: `npx vitest run`

What to test:

- All API route handlers (mock Prisma, test request/response shape, auth, error cases)
- Utility functions in `lib/` (fractional indexing helpers, position assignment, ingest validation)
- Key React components (ProjectCard renders correctly, KanbanCard shows URL badge when url present)

### E2E tests (Playwright)

- Config: `playwright.config.ts` at project root
- Test files in `e2e/` directory
- Run with: `npx playwright test`

What to test:

- Create a project → appears on board
- Create a card → appears in Todo column
- Drag card to In Progress → persists on reload
- Archive a project → disappears from main view, appears in /archive
- POST /api/ingest with valid payload → cards appear on board
- POST /api/ingest with missing/wrong token → 401

### Test coverage rule

Every API route must have a corresponding `.test.ts` before the task is considered done.
Every new utility function must have a corresponding `.test.ts`.
E2E tests are written for every user-facing flow.

## Conventions

- All DB access via Prisma client singleton in `lib/prisma.ts`
- API routes return `{ data }` on success, `{ error }` on failure with appropriate HTTP status
- Validate all API request bodies with Zod — reject and return 400 before touching the DB
- Optimistic UI updates on all card mutations — revert on error
- Fractional indexing for card and project positions — never rewrite all positions
- Dark theme: bg-zinc-950, text-zinc-100, accents via project color
- No inline styles — Tailwind only
- Monospace font for card metadata, sans-serif for titles
- TypeScript strict mode — no `any`, no unannotated function returns

## TypeScript

`tsconfig.json` must have `"strict": true`. Do not disable or work around strict mode.
All shared types live in `types/index.ts` and are imported from there — never redeclare types inline.

## Input validation (Zod)

All API route handlers validate request bodies with Zod before any DB call:

```typescript
import { z } from "zod";

const CreateCardSchema = z.object({
  title: z.string().min(1).max(255),
  notes: z.string().optional(),
  url: z.string().url().optional().or(z.literal("")),
  column: z.enum(["TODO", "IN_PROGRESS", "DONE"]).default("TODO"),
});
```

Return `{ error: 'Invalid request', details: result.error.flatten() }` with status 400 on validation failure.

## Error handling

- API routes: always wrap DB calls in try/catch, return `{ error: message }` with 500 on unexpected errors
- Never expose raw Prisma error messages to the client
- Client components: show user-facing error state, log details to console

## File naming

- Components: PascalCase (`KanbanCard.tsx`)
- Utilities and lib files: camelCase (`fractionalIndex.ts`)
- Test files: same name as the file under test + `.test.ts` / `.test.tsx`
- API routes: Next.js convention (`route.ts`)

## Prisma singleton — use this exactly, do not deviate

```typescript
// lib/prisma.ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

Never instantiate `new PrismaClient()` anywhere except this file.
Import `prisma` from `lib/prisma.ts` in all API routes and server components.

## Key files

- `prisma/schema.prisma` — source of truth for data model
- `lib/prisma.ts` — Prisma client singleton (see above — critical)
- `types/index.ts` — all shared TypeScript types
- `app/api/ingest/route.ts` — bulk ingest endpoint (auth required)
- `components/board/KanbanBoard.tsx` — dnd-kit root
- `vitest.config.ts` — unit/integration test config
- `playwright.config.ts` — E2E test config
- `e2e/` — Playwright test directory

## Notes

- `Project.position` uses fractional indexing (same as `Card.position`) — drag-reorder UI is Phase 3 but the column exists now to avoid a future migration. On project creation, assign position using `generateKeyBetween(lastPosition, null)`.
- Add `zod` to the initial install — it is required, not optional.

## Env vars required

DATABASE_URL, DIRECT_URL, INGEST_TOKEN
