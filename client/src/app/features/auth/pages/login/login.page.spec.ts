import type { AppError } from '../../../../core/interceptors/error.interceptor';
import { loginErrorMessage } from './login.page';

describe('loginErrorMessage', () => {
  it('maps pending account codes to the email confirmation message', () => {
    expect(messageFor({ code: 'email_confirmation_required', accountStatus: 'pending_approval' })).toBe(
      'Please confirm your email before logging in.',
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

function messageFor(error: Partial<AppError>): string {
  return loginErrorMessage({
    status: 403,
    message: 'Account is not active.',
    ...error,
  });
}
