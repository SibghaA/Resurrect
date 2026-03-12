import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test('shows login page for unauthenticated users', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/auth\/login/)
  })

  test('login page has email and password fields', async ({ page }) => {
    await page.goto('/auth/login')
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/password/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible()
  })

  test('shows error on invalid credentials', async ({ page }) => {
    await page.goto('/auth/login')
    await page.getByLabel(/email/i).fill('notauser@example.com')
    await page.getByLabel(/password/i).fill('wrongpassword')
    await page.getByRole('button', { name: /sign in/i }).click()
    await expect(page.getByText(/invalid/i)).toBeVisible({ timeout: 5000 })
  })

  test('register page has required fields', async ({ page }) => {
    await page.goto('/auth/register')
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/password/i)).toBeVisible()
  })
})
