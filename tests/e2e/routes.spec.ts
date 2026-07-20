import { expect, test } from '@playwright/test'

const routes = [
  '/',
  '/create/mixtape',
  '/create/letter',
  '/create/memo',
  '/create/share',
  '/drive/example',
  '/missing',
]
for (const route of routes) {
  test(`${route} renders without horizontal overflow`, async ({ page }) => {
    await page.goto(route)
    await expect(page.locator('main')).toBeVisible()
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    )
    expect(overflow).toBe(false)
  })
}
