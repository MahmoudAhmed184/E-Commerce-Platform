import * as underTest from './orders.routes';
import { ORDERS_ROUTES } from './orders.routes';

describe('orders.routes', () => {
  it('exports a module surface', () => {
    expect(underTest).toBeTruthy();
  });

  it('routes the orders index to the customer orders page', () => {
    expect(ORDERS_ROUTES.some((route) => route.path === '')).toBe(true);
  });

  it('keeps order detail routes addressable by order number', () => {
    expect(ORDERS_ROUTES.some((route) => route.path === ':orderNumber')).toBe(true);
    expect(ORDERS_ROUTES.some((route) => route.path === ':orderNumber/confirmation')).toBe(true);
  });
});
