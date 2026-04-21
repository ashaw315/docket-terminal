import { test as base, expect, type APIRequestContext } from '@playwright/test'

type ProjectFixture = {
  id: string
  name: string
  cardIds: string[]
}

type Fixtures = {
  project: ProjectFixture
}

async function createProjectWithCards(
  request: APIRequestContext,
  opts: { cards: Array<{ title: string; column?: 'TODO' | 'IN_PROGRESS' | 'DONE' }> }
): Promise<ProjectFixture> {
  const name = `e2e-board-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
  const res = await request.post('/api/projects', { data: { name } })
  const body = await res.json()
  const id: string = body.data.id

  const cardIds: string[] = []
  for (const c of opts.cards) {
    const cres = await request.post(`/api/projects/${id}/cards`, {
      data: { title: c.title, column: c.column ?? 'TODO' },
    })
    const cbody = await cres.json()
    cardIds.push(cbody.data.id)
  }

  return { id, name, cardIds }
}

const test = base.extend<Fixtures>({
  project: async ({ request }, use) => {
    const p = await createProjectWithCards(request, {
      cards: [{ title: 'Alpha' }, { title: 'Beta' }],
    })
    await use(p)
    await request.delete(`/api/projects/${p.id}`).catch(() => {})
  },
})

test.describe.configure({ mode: 'serial' })

test('board renders 3 columns with correct labels', async ({ page, project }) => {
  await page.goto(`/projects/${project.id}`)
  await expect(page.getByRole('heading', { name: project.name.toUpperCase() })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'TODO' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'IN PROGRESS' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'DONE' })).toBeVisible()
})

test('inline creator adds a card to the TODO column', async ({ page, project, request }) => {
  await page.goto(`/projects/${project.id}`)

  const todoColumn = page.locator('section', { has: page.getByRole('heading', { name: 'TODO' }) })
  await todoColumn.getByRole('button', { name: /add card/i }).click()

  const titleInput = todoColumn.getByLabel(/new card title/i)
  await titleInput.fill('Gamma')
  await titleInput.press('Enter')

  await expect(todoColumn.getByText('Gamma')).toBeVisible({ timeout: 10000 })

  const api = await request.get(`/api/projects/${project.id}/cards`).then((r) => r.json())
  const created = api.data.find((c: { title: string }) => c.title === 'Gamma')
  expect(created).toBeDefined()
  expect(created.column).toBe('TODO')
})

test('drag a card from TODO to IN PROGRESS and it persists on reload', async ({ page, project, request }) => {
  await page.goto(`/projects/${project.id}`)

  // Make sure the board is fully hydrated before driving pointer events.
  await expect(page.locator('article', { hasText: 'Alpha' }).first()).toBeVisible()
  await expect(page.locator('article', { hasText: 'Beta' }).first()).toBeVisible()

  const alpha = page.locator('article', { hasText: 'Alpha' }).first()
  const targetColumn = page.locator('section', { has: page.getByRole('heading', { name: 'IN PROGRESS' }) })

  const src = await alpha.boundingBox()
  const dst = await targetColumn.boundingBox()
  if (!src || !dst) throw new Error('could not get bounding boxes')

  const patchPromise = page.waitForResponse(
    (res) => res.url().includes('/api/cards/') && res.request().method() === 'PATCH' && res.status() === 200,
    { timeout: 15000 }
  )

  await page.mouse.move(src.x + src.width / 2, src.y + src.height / 2)
  await page.mouse.down()
  await page.mouse.move(src.x + src.width / 2 + 20, src.y + src.height / 2 + 20, { steps: 5 })
  await page.mouse.move(dst.x + dst.width / 2, dst.y + dst.height / 2, { steps: 20 })
  await page.mouse.up()

  await expect(targetColumn.getByText('Alpha')).toBeVisible({ timeout: 10000 })
  await patchPromise

  await page.reload()

  const ipColumn = page.locator('section', { has: page.getByRole('heading', { name: 'IN PROGRESS' }) })
  await expect(ipColumn.getByText('Alpha')).toBeVisible({ timeout: 10000 })

  const api = await request.get(`/api/projects/${project.id}/cards`).then((r) => r.json())
  const alphaCard = api.data.find((c: { title: string }) => c.title === 'Alpha')
  expect(alphaCard.column).toBe('IN_PROGRESS')
})

test('edit card via modal updates title on board', async ({ page, project }) => {
  await page.goto(`/projects/${project.id}`)

  await page.locator('article', { hasText: 'Beta' }).first().click()

  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  const titleInput = dialog.getByLabel(/title/i)
  await titleInput.fill('Beta Renamed')
  await dialog.getByRole('button', { name: /^save$/i }).click()

  await expect(dialog).toBeHidden({ timeout: 10000 })
  await expect(page.getByText('Beta Renamed')).toBeVisible()
  await expect(page.getByText(/^Beta$/)).toBeHidden()
})

test('delete card via modal removes it from the board', async ({ page, project, request }) => {
  await page.goto(`/projects/${project.id}`)

  await page.locator('article', { hasText: 'Alpha' }).first().click()

  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  await dialog.getByRole('button', { name: /^delete$/i }).click()

  await expect(dialog).toBeHidden({ timeout: 10000 })
  await expect(page.getByText(/^Alpha$/)).toBeHidden()

  const api = await request.get(`/api/projects/${project.id}/cards`).then((r) => r.json())
  const stillThere = api.data.find((c: { title: string }) => c.title === 'Alpha')
  expect(stillThere).toBeUndefined()
})
