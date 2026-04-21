import { test as base, expect } from '@playwright/test'

type Fixtures = {
  projectName: string
  cleanupNames: string[]
}

const test = base.extend<Fixtures>({
  projectName: async ({}, use) => {
    const name = `e2e-ingest-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
    await use(name)
  },
  cleanupNames: async ({ request }, use) => {
    const names: string[] = []
    await use(names)
    if (names.length === 0) return
    const list = await request.get('/api/projects?status=ACTIVE').then((r) => r.json())
    for (const p of list.data ?? []) {
      if (names.includes(p.name)) {
        await request.delete(`/api/projects/${p.id}`).catch(() => {})
      }
    }
  },
})

test.describe.configure({ mode: 'serial' })

test('ingest page renders with PUSH TO BOARD heading', async ({ page }) => {
  await page.goto('/ingest')
  await expect(page.getByRole('heading', { name: 'PUSH TO BOARD' })).toBeVisible()
  await expect(page.getByRole('textbox', { name: /ingest payload/i })).toBeVisible()
  await expect(page.getByRole('button', { name: /^push$/i })).toBeVisible()
})

test('valid payload pushes project + cards and they appear on /', async ({ page, projectName, cleanupNames, request }) => {
  cleanupNames.push(projectName)

  await page.goto('/ingest')

  const payload = JSON.stringify({
    project: projectName,
    tasks: [
      { title: 'Write docs', column: 'todo' },
      { title: 'Review PR', column: 'in_progress' },
    ],
  })

  await page.getByRole('textbox', { name: /ingest payload/i }).fill(payload)
  await page.getByRole('button', { name: /^push$/i }).click()

  await expect(
    page.getByText(new RegExp(`2 TASKS ADDED TO ${projectName.toUpperCase()}`, 'i'))
  ).toBeVisible({ timeout: 15000 })

  await page.goto('/')
  await expect(page.getByRole('heading', { name: projectName.toUpperCase() })).toBeVisible({
    timeout: 10000,
  })

  const active = await request.get('/api/projects?status=ACTIVE').then((r) => r.json())
  const created = active.data.find((p: { name: string }) => p.name === projectName)
  expect(created).toBeDefined()
  expect(created._count.cards).toBe(2)
})

test('invalid JSON shows a client-side error and does not show success', async ({ page }) => {
  await page.goto('/ingest')
  await page.getByRole('textbox', { name: /ingest payload/i }).fill('not valid json')
  await page.getByRole('button', { name: /^push$/i }).click()

  await expect(page.getByText(/INVALID JSON/i)).toBeVisible({ timeout: 5000 })
  await expect(page.getByText(/TASKS ADDED TO/i)).toBeHidden()
})
