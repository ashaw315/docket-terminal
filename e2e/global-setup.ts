import { chromium } from '@playwright/test'
import { mkdir } from 'fs/promises'
import { dirname } from 'path'

const STORAGE_PATH = 'e2e/.auth/session.json'
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3001'

async function globalSetup() {
  const password = process.env.AUTH_PASSWORD
  if (!password) {
    throw new Error(
      'AUTH_PASSWORD is not set. Add it to .env.local so Playwright globalSetup can pre-authenticate.'
    )
  }

  await mkdir(dirname(STORAGE_PATH), { recursive: true })

  const browser = await chromium.launch()
  const context = await browser.newContext()
  const page = await context.newPage()

  try {
    await page.goto(`${BASE_URL}/login`)
    await page.fill('input[type="password"]', password)
    await page.click('button[type="submit"]')
    await page.waitForURL(`${BASE_URL}/`, { timeout: 15000 })
    await context.storageState({ path: STORAGE_PATH })
  } finally {
    await browser.close()
  }
}

export default globalSetup
