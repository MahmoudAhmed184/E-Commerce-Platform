# Vendra Product Context

## Register

Product. Vendra is an ecommerce application where the interface serves shopping, checkout, order tracking, account management, and admin operations.

## Users

- Customers comparing everyday products, reviewing availability, adding items to cart, checking out, and tracking orders.
- Returning customers who need saved cart, profile, order history, and support access.
- Admin users who manage catalog, orders, payments, reviews, and customer data.

## Product Purpose

Help users move from product discovery to checkout with clear pricing, inventory, delivery, payment, and order-state feedback.

## Design Principles

- Consistency is the primary affordance. Buttons, form controls, cards, shell backgrounds, focus states, and status treatments should look the same across storefront, checkout, account, and admin surfaces.
- Use semantic design tokens and shared Angular components as the source of truth. Feature templates should not introduce raw palette recipes when a token or primitive exists.
- Keep the visual register restrained and task-focused. Accent color is reserved for primary actions, active states, focus, and product status emphasis.
- Support both light and dark themes through token overrides, not one-off component classes.
- Accessibility is a release requirement. Shared controls must meet the 44px touch target token and implement expected keyboard behavior.

## Anti-References

- Marketing hero styling inside task flows.
- Decorative glass, aurora, blur, or gradient-text treatments.
- Duplicated commerce components with the same selector but different visual recipes.
- Hand-authored primary actions that bypass the shared button primitive.
