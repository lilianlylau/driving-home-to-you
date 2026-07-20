import { expect, test } from '@playwright/test'

const routes = ['/', '/create/mixtape', '/drive/example', '/missing']
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

test('creator draft survives forward, backward, and refresh navigation', async ({ page }) => {
  await page.goto('/create/mixtape')
  await page.evaluate(() => {
    localStorage.setItem(
      'driving-home-to-you:creator-draft',
      JSON.stringify({
        state: {
          songs: [
            {
              id: 'track-1',
              title: 'Dreams',
              artist: 'The Cranberries',
              audioUrl: 'https://example.com/dreams.mp3',
            },
          ],
          noteText: '',
          voiceMemo: null,
          currentStep: 1,
          player: { activeTrackId: 'track-1', positionSeconds: 24, isPlaying: true },
        },
        version: 0,
      }),
    )
  })
  await page.reload()
  await page.getByRole('button', { name: 'next', exact: true }).click()
  await page.getByRole('textbox', { name: 'Your letter' }).fill('still thinking of you')
  await page.getByRole('button', { name: 'next', exact: true }).click()
  await expect(page).toHaveURL(/\/create\/memo$/)
  await page.getByRole('button', { name: 'back' }).click()
  await expect(page.getByRole('textbox', { name: 'Your letter' })).toHaveValue(
    'still thinking of you',
  )
  await page.reload()
  await expect(page.getByRole('textbox', { name: 'Your letter' })).toHaveValue(
    'still thinking of you',
  )
  await page.getByRole('button', { name: 'back' }).click()
  await expect(page.getByText('Dreams - The Cranberries')).toBeVisible()
})

test('guards later creator routes', async ({ page }) => {
  await page.goto('/create/share')
  await expect(page).toHaveURL(/\/create\/mixtape$/)
})
