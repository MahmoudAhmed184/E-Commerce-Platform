import type { AppError } from '../../../../core/interceptors/error/error.interceptor';
import type { User } from '../../../../core/models/user/user.model';
import { loginErrorMessage, loginRedirectUrl } from './login.page';

const adminUser: User = {
  id: 'admin-user',
  email: 'admin@example.com',
  phone: null,
  full_name: 'Admin User',
  role: 'admin',
  status: 'active',
  is_email_confirmed: true,
};

const customerUser: User = {
  id: 'customer-user',
  email: 'customer@example.com',
  phone: null,
  full_name: 'Customer User',
  role: 'customer',
  status: 'active',
  is_email_confirmed: true,
};

describe('loginErrorMessage', () => {
  it('maps pending account codes to the email confirmation message', () => {
    expect(messageFor({ code: 'email_confirmation_required', accountStatus: 'pending_approval' })).toBe(
      'Please confirm your email before signing in.',
    );
  });

  it('maps restricted account codes to the restricted account message', () => {
    expect(messageFor({ code: 'account_restricted', accountStatus: 'restricted' })).toBe(
      'Your account has been restricted. Contact support.',
    );
  });

  it('maps deleted account codes to the deleted account message', () => {
    expect(messageFor({ code: 'account_deleted', accountStatus: 'soft_deleted' })).toBe(
      'This account no longer exists.',
    );
  });

  it('maps invalid credentials to the credentials message', () => {
    expect(messageFor({ status: 401, message: 'No active account found.' })).toBe('Invalid credentials.');
  });
});

describe('loginRedirectUrl', () => {
  it('sends admins to the admin workspace by default', () => {
    expect(loginRedirectUrl(adminUser, null)).toBe('/admin');
  });

  it('sends customers to the catalog by default', () => {
    expect(loginRedirectUrl(customerUser, null)).toBe('/products');
  });

  it('honors safe internal return URLs', () => {
    expect(loginRedirectUrl(adminUser, '/admin/orders')).toBe('/admin/orders');
  });

  it('ignores non-internal return URLs', () => {
    expect(loginRedirectUrl(adminUser, 'https://example.com/admin')).toBe('/admin');
    expect(loginRedirectUrl(customerUser, '//example.com/products')).toBe('/products');
  });
});

function messageFor(error: Partial<AppError>): string {
  return loginErrorMessage({
    status: 403,
    message: 'Account is not active.',
    ...error,
  });
}
