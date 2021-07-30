import 'expect-puppeteer'

beforeAll(async () => {
  await page.goto('http://localhost:3000/signin')
})

test('redirects to library', async () => {
  await expect(page.evaluate(() => location.pathname)).resolves.toBe('/signin')

  await page.type('#in-use', 'test@example.com')
  await page.type('#in-p', 'password')

  await page.click("button[type='submit']")
  await page.waitForNavigation({ timeout: 5000, waitUntil: 'networkidle2' })

  await expect(page.evaluate(() => location.pathname)).resolves.toBe('/')
})
