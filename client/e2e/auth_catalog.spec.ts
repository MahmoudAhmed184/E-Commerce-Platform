import { test, expect } from '@playwright/test';

test.describe('E-Commerce E2E', () => {

  test('can navigate to login page', async ({ page }) => {
    await page.goto('http://localhost:4200/auth/login');
    await expect(page).toHaveTitle(/Client/);
  });

  test('can login successfully', async ({ page }) => {
    await page.goto('http://localhost:4200/auth/login');
    await page.fill('input#identifier', 'testuser@example.com');
    await page.fill('input#password', 'testpassword');
    await page.click('button[type="submit"]');
    
    // Expect redirection to products page
    await expect(page).toHaveURL(/.*\/products/);
  });

  test('can browse product catalog', async ({ page }) => {
    await page.goto('http://localhost:4200/products');
    
    // Check if product cards exist
    const productCards = page.locator('.product-card');
    // We expect at least one product
    await expect(productCards.first()).toBeVisible();
  });
});
