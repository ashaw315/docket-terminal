import { test as base, expect, type APIRequestContext } from '@playwright/test'

type ArchivedFixture = {
  id: string
  name: string
}

type Fixtures = {
  archivedProject: ArchivedFixture
  completedProject: ArchivedFixture
}

async function createProjectWithStatus(
  request: APIRequestContext,
  status: 'COMPLETED' | 'ARCHIVED'
): Promise<ArchivedFixture> {
  const name = `e2e-arch-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
  const cres = await request.post('/api/projects', { data: { name } })
  const cbody = await cres.json()
  const id = cbody.data.id
  await request.patch(`/api/projects/${id}`, { data: { status } })
  return { id, name }
}

const test = base.extend<Fixtures>({
  archivedProject: async ({ request }, use) => {
    const p = await createProjectWithStatus(request, 'ARCHIVED')
    await use(p)
    await request.delete(`/api/projects/${p.id}`).catch(() => {})
  },
  completedProject: async ({ request }, use) => {
    const p = await createProjectWithStatus(request, 'COMPLETED')
    await use(p)
    await request.delete(`/api/projects/${p.id}`).catch(() => {})
  },
})

test.describe.configure({ mode: 'serial' })

test('archive page renders with ARCHIVE heading', async ({ page }) => {
  await page.goto('/archive')
  await expect(page.getByRole('heading', { name: 'ARCHIVE' })).toBeVisible()
  await expect(page.getByRole('link', { name: /active/i })).toBeVisible()
})

test('an archived project appears on /archive with an ARCHIVED badge', async ({ page, archivedProject }) => {
  await page.goto('/archive')
  const card = page
    .locator('article', { has: page.getByRole('heading', { name: archivedProject.name.toUpperCase() }) })
  await expect(card).toBeVisible()
  await expect(card.getByText('ARCHIVED')).toBeVisible()
})

test('a completed project appears on /archive with a COMPLETED badge', async ({ page, completedProject }) => {
  await page.goto('/archive')
  const card = page
    .locator('article', { has: page.getByRole('heading', { name: completedProject.name.toUpperCase() }) })
  await expect(card).toBeVisible()
  await expect(card.getByText('COMPLETED')).toBeVisible()
})

test('restore moves the project back to active view', async ({ page, archivedProject, request }) => {
  await page.goto('/archive')

  const card = page
    .locator('article', { has: page.getByRole('heading', { name: archivedProject.name.toUpperCase() }) })
  await expect(card).toBeVisible()

  const patchPromise = page.waitForResponse(
    (res) =>
      res.url().includes(`/api/projects/${archivedProject.id}`) &&
      res.request().method() === 'PATCH' &&
      res.status() === 200,
    { timeout: 15000 }
  )

  await card.getByRole('button', { name: /restore/i }).click()
  await patchPromise

  await expect(card).toBeHidden({ timeout: 10000 })

  await page.goto('/')
  await expect(page.getByRole('heading', { name: archivedProject.name.toUpperCase() })).toBeVisible({
    timeout: 10000,
  })

  const active = await request.get('/api/projects?status=ACTIVE').then((r) => r.json())
  const found = active.data.find((p: { id: string }) => p.id === archivedProject.id)
  expect(found).toBeDefined()
})

test('main page has an ARCHIVE nav link to /archive', async ({ page }) => {
  await page.goto('/')
  const link = page.getByRole('link', { name: /^archive/i })
  await expect(link).toBeVisible()
  await link.click()
  await expect(page).toHaveURL(/\/archive$/)
  await expect(page.getByRole('heading', { name: 'ARCHIVE' })).toBeVisible()
})
