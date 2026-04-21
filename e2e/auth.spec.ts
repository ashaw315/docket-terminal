import { test, expect } from '@playwright/test'

// Auth tests MUST start without a session so we can observe the redirect-to-login flow.
test.use({ storageState: { cookies: [], origins: [] } })

test.describe.configure({ mode: 'serial' })

test('unauthenticated request to / redirects to /login', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveURL(/\/login/)
  await expect(page.getByLabel(/password/i)).toBeVisible()
})

test('wrong password shows INVALID PASSWORD and stays on /login', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel(/password/i).fill('nope-this-is-wrong')
  await page.getByRole('button', { name: /enter/i }).click()

  await expect(page.getByText(/INVALID PASSWORD/i)).toBeVisible({ timeout: 10000 })
  await expect(page).toHaveURL(/\/login/)
})

test('correct password redirects to /', async ({ page }) => {
  const password = process.env.AUTH_PASSWORD
  if (!password) throw new Error('AUTH_PASSWORD not set for test')

  await page.goto('/login')
  await page.getByLabel(/password/i).fill(password)
  await page.getByRole('button', { name: /enter/i }).click()

  await page.waitForURL('**/', { timeout: 15000 })
  await expect(page.getByRole('heading', { level: 1, name: 'DOCKET TERMINAL' })).toBeVisible()
})

test('session persists across reload after login', async ({ page }) => {
  const password = process.env.AUTH_PASSWORD
  if (!password) throw new Error('AUTH_PASSWORD not set for test')

  await page.goto('/login')
  await page.getByLabel(/password/i).fill(password)
  await page.getByRole('button', { name: /enter/i }).click()
  await page.waitForURL('**/', { timeout: 15000 })

  await page.reload()
  await expect(page).not.toHaveURL(/\/login/)
  await expect(page.getByRole('heading', { level: 1, name: 'DOCKET TERMINAL' })).toBeVisible()
})

test('logout clears the session and subsequent access redirects to /login', async ({ page }) => {
  const password = process.env.AUTH_PASSWORD
  if (!password) throw new Error('AUTH_PASSWORD not set for test')

  await page.goto('/login')
  await page.getByLabel(/password/i).fill(password)
  await page.getByRole('button', { name: /enter/i }).click()
  await page.waitForURL('**/', { timeout: 15000 })

  await page.getByRole('link', { name: /logout/i }).click()
  await page.waitForURL(/\/login/, { timeout: 10000 })

  await page.goto('/')
  await expect(page).toHaveURL(/\/login/)
})

test('post-login redirect honors the `from` parameter', async ({ page }) => {
  const password = process.env.AUTH_PASSWORD
  if (!password) throw new Error('AUTH_PASSWORD not set for test')

  await page.goto('/archive')
  await expect(page).toHaveURL(/\/login\?from=/)

  await page.getByLabel(/password/i).fill(password)
  await page.getByRole('button', { name: /enter/i }).click()

  await page.waitForURL(/\/archive/, { timeout: 15000 })
  await expect(page.getByRole('heading', { name: 'ARCHIVE' })).toBeVisible()
})
