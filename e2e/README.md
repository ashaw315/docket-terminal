# E2E tests

Playwright specs for user-facing flows. Uses a shared `storageState` pre-populated by `global-setup.ts` (logs in once, reuses the session across every spec except `auth.spec.ts`, which overrides with an empty state to test unauthenticated flows).

Run:

```
npx playwright test
```

## AI routes are unit-tested only

`POST /api/ai/expand-card` calls the Anthropic API. Mocking that end-to-end in Playwright is fragile and expensive, so it's covered by Vitest (`app/api/ai/expand-card/route.test.ts`) with the SDK mocked via `vi.mock('@anthropic-ai/sdk')`. The `ExpandCardModal` component is also unit-tested with a stubbed `fetchSuggestions` (`components/board/ExpandCardModal.test.tsx`).

If you need to manually smoke-test the AI flow end-to-end, log in, click EXPAND on a card, and confirm the suggestions appear and can be added to the board.
