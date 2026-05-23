import type { UiAddress } from '../../../../core/models/commerce-ui/commerce-ui.model';
import { validateAddress } from './delivery-page';

describe('validateAddress', () => {
  it('requires every shipping field plus email for guest checkout', () => {
    const errors = validateAddress(
      {
        ...completeAddress(),
        name: ' ',
        email: '',
        phone: '',
        addressLine1: '',
        city: '',
        region: '',
        postalCode: '',
        country: '',
      },
      true,
    );

    expect(errors).toEqual({
      email: 'Email is required for guest checkout.',
      name: 'Full name is required.',
      phone: 'Phone is required.',
      addressLine1: 'Address line 1 is required.',
      city: 'City is required.',
      region: 'Region is required.',
      postalCode: 'Postal code is required.',
      country: 'Country is required.',
    });
  });

  it('does not require email for authenticated checkout', () => {
    const errors = validateAddress({ ...completeAddress(), email: '' }, false);

    expect(errors).toEqual({});
  });
});

function completeAddress(): UiAddress {
  return {
    name: 'Sam Customer',
    email: 'sam@example.com',
    phone: '+12025550199',
    addressLine1: '10 Market Street',
    addressLine2: '',
    city: 'New York',
    region: 'NY',
    postalCode: '10001',
    country: 'US',
    deliveryNotes: '',
  };
}
