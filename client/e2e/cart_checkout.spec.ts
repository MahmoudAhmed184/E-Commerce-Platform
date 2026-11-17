import { test, expect } from '@playwright/test';

test.describe('E-Commerce Cart and Checkout', () => {

  test.beforeEach(async ({ page, request }) => {
    page.on('console', msg => console.log(msg.text()));
    // Login before each test
    await page.goto('http://localhost:4200/auth/login');
    await page.fill('input#identifier', 'testuser@example.com');
    await page.fill('input#password', 'testpassword');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*\/products/);

    // Clear cart
    await page.evaluate(async () => {
        const token = localStorage.getItem('access_token');
        await fetch('http://localhost:4200/api/v1/cart/clear/', { 
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
    });
  });

  test('can add product to cart and complete checkout', async ({ page }) => {
    // Navigate to a product page - assuming products exist
    await page.goto('http://localhost:4200/products');
    // Click on the first product card to go to details
    await page.click('.product-card a');
    await expect(page).toHaveURL(/.*\/products\/.+/);

    // Add to cart
    await expect(page.locator('.btn-cart')).toBeVisible();
    await page.click('.btn-cart');
    // Check feedback
    await expect(page.locator('.cart-feedback.success')).toBeVisible();

    // Go to cart
    await page.goto('http://localhost:4200/cart');
    await expect(page).toHaveURL(/.*\/cart/);

    // Proceed to checkout
    await page.click('a[routerLink="/checkout"]');
    await expect(page).toHaveURL(/.*\/checkout/);

    // Fill checkout form
    await page.fill('input#email', 'testuser@example.com');
    await page.fill('input#phone', '1234567890');
    await page.fill('input#line1', '123 Main St');
    await page.fill('input#city', 'Anytown');
    await page.fill('input#state', 'NY');
    await page.fill('input#postal_code', '12345');
    await page.fill('input#country', 'USA');
    
    // Select payment method (cod)
    await page.getByLabel('Cash on Delivery').check();

    // Place Order
    await page.click('button[type="submit"]');

    // Expect order confirmation
    await expect(page).toHaveURL(/.*\/orders\/.+/);
  });
});

