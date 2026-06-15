import { expect, test, type Page } from '@playwright/test';

const publicRoutes = [
  '/',
  '/login',
  '/pricing',
  '/faq',
  '/how-it-works',
  '/onboarding',
  '/preview/discover-v7',
] as const;

const protectedRoutes = [
  '/app',
  '/app/find',
  '/app/create',
  '/app/sell',
  '/app/launch',
  '/app/saved',
  '/app/team',
] as const;

const disallowedText = [
  'Maximum update depth',
  'Too many re-renders',
  'Sarah Jenkins',
] as const;

const nonCriticalConsolePatterns = [
  /favicon\.ico/i,
  /ResizeObserver loop limit exceeded/i,
  /ResizeObserver loop completed with undelivered notifications/i,
];

function getCriticalMessages(messages: string[]) {
  return messages.filter(
    (message) =>
      !nonCriticalConsolePatterns.some((pattern) => pattern.test(message))
  );
}

function collectPageErrors(page: Page) {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') {
      consoleErrors.push(message.text());
    }
  });

  page.on('pageerror', (error) => {
    pageErrors.push(error.message);
  });

  return { consoleErrors, pageErrors };
}

async function assertVisibleBodyContent(page: Page, route: string) {
  const body = page.locator('body');
  await expect(body).toBeVisible();

  const bodyText = (await body.innerText()).replace(/\s+/g, ' ').trim();
  expect(
    bodyText.length,
    `Expected meaningful body content on ${route}, received ${bodyText.length} characters`
  ).toBeGreaterThan(80);

  for (const text of disallowedText) {
    expect(bodyText, `Unexpected text "${text}" found on ${route}`).not.toContain(text);
  }
}

function assertNoClientErrors(route: string, consoleErrors: string[], pageErrors: string[]) {
  const criticalConsoleErrors = getCriticalMessages(consoleErrors);
  expect(
    criticalConsoleErrors,
    `Critical console errors on ${route}:\n${criticalConsoleErrors.join('\n')}`
  ).toEqual([]);
  expect(pageErrors, `Uncaught page errors on ${route}:\n${pageErrors.join('\n')}`).toEqual([]);
}

for (const route of publicRoutes) {
  test(`public smoke: ${route}`, async ({ page }) => {
    const { consoleErrors, pageErrors } = collectPageErrors(page);

    const response = await page.goto(route, { waitUntil: 'domcontentloaded' });
    expect(response, `No response received for ${route}`).not.toBeNull();
    expect(
      response?.ok(),
      `Navigation failed for ${route} with status ${response?.status()}`
    ).toBeTruthy();

    await page.waitForTimeout(750);
    await assertVisibleBodyContent(page, route);
    assertNoClientErrors(route, consoleErrors, pageErrors);
  });
}

for (const route of protectedRoutes) {
  test(`protected redirect smoke: ${route}`, async ({ page }) => {
    const { consoleErrors, pageErrors } = collectPageErrors(page);

    const response = await page.goto(route, { waitUntil: 'networkidle' });
    const finalUrl = page.url();
    const encodedRoute = encodeURIComponent(route);

    expect(finalUrl, `Expected redirect to login for ${route}, got ${finalUrl}`).toContain('/login');
    expect(
      finalUrl,
      `Expected login redirect to preserve next=${encodedRoute} for ${route}, got ${finalUrl}`
    ).toContain(`next=${encodedRoute}`);
    expect(response, `No response received for ${route}`).not.toBeNull();

    await assertVisibleBodyContent(page, route);
    assertNoClientErrors(route, consoleErrors, pageErrors);
  });
}
