# E2E tests

Playwright specs for user-facing flows. Uses a shared `storageState` pre-populated by `global-setup.ts` (logs in once, reuses the session across every spec except `auth.spec.ts`, which overrides with an empty state to test unauthenticated flows).

Run:

```
npx playwright test
```

## AI routes are unit-tested only

AI-backed routes call the Anthropic API. Mocking that end-to-end in Playwright is fragile and expensive, so they're covered by Vitest with the SDK mocked via `vi.mock('@anthropic-ai/sdk')`:

- `POST /api/ai/expand-card` — see `app/api/ai/expand-card/route.test.ts`
- `POST /api/ai/generate-board` — see `app/api/ai/generate-board/route.test.ts`

The corresponding UI components (`ExpandCardModal`, `GenerateBoardModal`) are unit-tested with an injected AI function (`fetchSuggestions`, `generate`).

If you need to manually smoke-test end-to-end: log in, click EXPAND on a card, or GENERATE in the page header, and verify the flow.
