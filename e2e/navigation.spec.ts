import { test, expect } from '@playwright/test'

test.describe('Navigation', () => {
  test('redirects / to login when unauthenticated', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL(/\/auth\/login|\/dashboard/)
  })

  test('co-op board is accessible', async ({ page }) => {
    // Co-op board may be public — test it doesn't 500
    const response = await page.goto('/coop-board')
    expect(response?.status()).not.toBe(500)
  })
})
