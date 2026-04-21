import { test as base, expect } from '@playwright/test'

type Fixtures = {
  projectName: string
  cleanupIds: string[]
}

const test = base.extend<Fixtures>({
  projectName: async ({}, use) => {
    const unique = `e2e-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
    await use(unique)
  },
  cleanupIds: async ({ request }, use) => {
    const ids: string[] = []
    await use(ids)
    for (const id of ids) {
      await request.delete(`/api/projects/${id}`).catch(() => {})
    }
  },
})

test.describe.configure({ mode: 'serial' })

test('create project flow adds card to grid', async ({ page, projectName, cleanupIds, request }) => {
  await page.goto('/')
  await page.getByRole('button', { name: /new project/i }).first().click()

  const modal = page.getByRole('dialog')
  await modal.getByLabel(/name/i).fill(projectName)
  await modal.getByRole('button', { name: /^create$/i }).click()

  await expect(page.getByRole('heading', { name: projectName.toUpperCase() })).toBeVisible({
    timeout: 10000,
  })

  const list = await request.get('/api/projects?status=ACTIVE').then((r) => r.json())
  const created = list.data.find((p: { name: string; id: string }) => p.name === projectName)
  expect(created).toBeDefined()
  cleanupIds.push(created.id)
})

test('project card links to its board', async ({ page, projectName, cleanupIds, request }) => {
  const res = await request.post('/api/projects', {
    data: { name: projectName },
  })
  const body = await res.json()
  const id = body.data.id
  cleanupIds.push(id)

  await page.goto('/')
  await page.getByRole('heading', { name: projectName.toUpperCase() }).click()
  await expect(page).toHaveURL(new RegExp(`/projects/${id}$`))
})

test('archive action removes card from main view', async ({ page, projectName, cleanupIds, request }) => {
  const res = await request.post('/api/projects', {
    data: { name: projectName },
  })
  const body = await res.json()
  cleanupIds.push(body.data.id)

  await page.goto('/')
  const heading = page.getByRole('heading', { name: projectName.toUpperCase() })
  await expect(heading).toBeVisible()

  const card = heading.locator('xpath=ancestor::article')
  await card.hover()
  await card.getByRole('button', { name: /project menu/i }).click()
  await page.getByRole('menuitem', { name: /archive/i }).click()

  await expect(heading).toBeHidden({ timeout: 10000 })
})

test('delete requires typed confirmation then removes the project', async ({ page, projectName, cleanupIds, request }) => {
  const res = await request.post('/api/projects', {
    data: { name: projectName },
  })
  const body = await res.json()
  const id = body.data.id

  await page.goto('/')
  const heading = page.getByRole('heading', { name: projectName.toUpperCase() })
  await expect(heading).toBeVisible()

  const card = heading.locator('xpath=ancestor::article')
  await card.hover()
  await card.getByRole('button', { name: /project menu/i }).click()
  await page.getByRole('menuitem', { name: /^delete$/i }).click()

  const dialog = page.getByRole('dialog', { name: /confirm delete/i })
  await dialog.getByLabel(/confirm project name/i).fill(projectName)
  await dialog.getByRole('button', { name: /^delete$/i }).click()

  await expect(heading).toBeHidden({ timeout: 10000 })

  const check = await request.get(`/api/projects?status=ARCHIVED`).then((r) => r.json())
  const found = check.data.find((p: { id: string }) => p.id === id)
  expect(found).toBeUndefined()

  // Do not push to cleanupIds — already deleted.
})
