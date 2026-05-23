import { ChangeDetectionStrategy, Component, DestroyRef, effect, inject, input, output } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { type FormControl, type FormGroup, NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';

import type { UiAddress } from '../../../../core/models/commerce-ui/commerce-ui.model';
import type { UiOption } from '../../../../shared/components/ui.types';

type AddressFormGroup = FormGroup<{
  name: FormControl<string>;
  email: FormControl<string>;
  phone: FormControl<string>;
  addressLine1: FormControl<string>;
  addressLine2: FormControl<string>;
  city: FormControl<string>;
  region: FormControl<string>;
  postalCode: FormControl<string>;
  country: FormControl<string>;
  deliveryNotes: FormControl<string>;
}>;

@Component({
  selector: 'app-address-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'contents' },
  template: `
    <fieldset class="grid gap-md rounded-md border-hairline border-border-default bg-surface-raised p-md" [formGroup]="form">
      <legend class="px-xs type-heading-md text-text-primary">{{ legend() }}</legend>

      @if (guest()) {
        <label class="grid gap-xs type-label-md text-text-primary">
          Email
          <input class="min-h-control-md rounded-sm border-hairline border-border-default bg-surface-raised px-sm py-xs text-text-primary focus-visible:focus-ring aria-invalid:border-border-error" type="email" autocomplete="email" formControlName="email" [attr.aria-invalid]="fieldErrors()['email'] ? 'true' : null" />
          @if (fieldErrors()['email']) {
            <span class="type-body-sm text-text-error">{{ fieldErrors()['email'] }}</span>
          }
        </label>
      }

      <div class="grid gap-md md:grid-cols-2">
        <label class="grid gap-xs type-label-md text-text-primary">
          Full name
          <input class="min-h-control-md rounded-sm border-hairline border-border-default bg-surface-raised px-sm py-xs text-text-primary focus-visible:focus-ring aria-invalid:border-border-error" type="text" autocomplete="name" formControlName="name" [attr.aria-invalid]="fieldErrors()['name'] ? 'true' : null" />
          @if (fieldErrors()['name']) {
            <span class="type-body-sm text-text-error">{{ fieldErrors()['name'] }}</span>
          }
        </label>
        <label class="grid gap-xs type-label-md text-text-primary">
          Phone
          <input class="min-h-control-md rounded-sm border-hairline border-border-default bg-surface-raised px-sm py-xs text-text-primary focus-visible:focus-ring aria-invalid:border-border-error" type="tel" autocomplete="tel" formControlName="phone" [attr.aria-invalid]="fieldErrors()['phone'] ? 'true' : null" />
          @if (fieldErrors()['phone']) {
            <span class="type-body-sm text-text-error">{{ fieldErrors()['phone'] }}</span>
          }
        </label>
      </div>

      <label class="grid gap-xs type-label-md text-text-primary">
        Address line 1
        <input class="min-h-control-md rounded-sm border-hairline border-border-default bg-surface-raised px-sm py-xs text-text-primary focus-visible:focus-ring aria-invalid:border-border-error" type="text" autocomplete="address-line1" formControlName="addressLine1" [attr.aria-invalid]="fieldErrors()['addressLine1'] ? 'true' : null" />
        @if (fieldErrors()['addressLine1']) {
          <span class="type-body-sm text-text-error">{{ fieldErrors()['addressLine1'] }}</span>
        }
      </label>
      <label class="grid gap-xs type-label-md text-text-primary">
        Address line 2
        <input class="min-h-control-md rounded-sm border-hairline border-border-default bg-surface-raised px-sm py-xs text-text-primary focus-visible:focus-ring" type="text" autocomplete="address-line2" formControlName="addressLine2" />
      </label>

      <div class="grid gap-md md:grid-cols-2">
        <label class="grid gap-xs type-label-md text-text-primary">
          City
          <input class="min-h-control-md rounded-sm border-hairline border-border-default bg-surface-raised px-sm py-xs text-text-primary focus-visible:focus-ring aria-invalid:border-border-error" type="text" autocomplete="address-level2" formControlName="city" [attr.aria-invalid]="fieldErrors()['city'] ? 'true' : null" />
          @if (fieldErrors()['city']) {
            <span class="type-body-sm text-text-error">{{ fieldErrors()['city'] }}</span>
          }
        </label>
        <label class="grid gap-xs type-label-md text-text-primary">
          Region
          <input class="min-h-control-md rounded-sm border-hairline border-border-default bg-surface-raised px-sm py-xs text-text-primary focus-visible:focus-ring aria-invalid:border-border-error" type="text" autocomplete="address-level1" formControlName="region" [attr.aria-invalid]="fieldErrors()['region'] ? 'true' : null" />
          @if (fieldErrors()['region']) {
            <span class="type-body-sm text-text-error">{{ fieldErrors()['region'] }}</span>
          }
        </label>
      </div>

      <div class="grid gap-md md:grid-cols-2">
        <label class="grid gap-xs type-label-md text-text-primary">
          Postal code
          <input class="min-h-control-md rounded-sm border-hairline border-border-default bg-surface-raised px-sm py-xs text-text-primary focus-visible:focus-ring aria-invalid:border-border-error" type="text" autocomplete="postal-code" formControlName="postalCode" [attr.aria-invalid]="fieldErrors()['postalCode'] ? 'true' : null" />
          @if (fieldErrors()['postalCode']) {
            <span class="type-body-sm text-text-error">{{ fieldErrors()['postalCode'] }}</span>
          }
        </label>
        <label class="grid gap-xs type-label-md text-text-primary">
          Country
          <select class="min-h-control-md rounded-sm border-hairline border-border-default bg-surface-raised px-sm py-xs text-text-primary focus-visible:focus-ring aria-invalid:border-border-error" formControlName="country" [attr.aria-invalid]="fieldErrors()['country'] ? 'true' : null">
            @for (option of countryOptions(); track option.value) {
              <option [value]="option.value" [disabled]="option.disabled">{{ option.label }}</option>
            } @empty {
              <option value="" disabled>No countries available</option>
            }
          </select>
          @if (fieldErrors()['country']) {
            <span class="type-body-sm text-text-error">{{ fieldErrors()['country'] }}</span>
          }
        </label>
      </div>

      <label class="grid gap-xs type-label-md text-text-primary">
        Delivery notes optional
        <textarea class="min-h-thumbnail-sm rounded-sm border-hairline border-border-default bg-surface-raised px-sm py-xs text-text-primary focus-visible:focus-ring" autocomplete="off" formControlName="deliveryNotes"></textarea>
      </label>

      @if (summaryError()) {
        <p class="rounded-md border-hairline border-border-error bg-surface-error p-sm type-body-sm text-text-error" role="alert">{{ summaryError() }}</p>
      }
    </fieldset>
  `,
})
export class AddressFormComponent {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  readonly mode = input<'guest' | 'auth'>('guest');
  readonly countryOptions = input<readonly UiOption[]>([]);
  readonly initialAddress = input<UiAddress | null>(null);
  readonly guest = input(true);
  readonly disabled = input(false);
  readonly fieldErrors = input<Record<string, string | undefined>>({});
  readonly summaryError = input<string | null>(null);
  readonly legend = input('Shipping address');

  readonly addressChange = output<UiAddress>();

  protected readonly form: AddressFormGroup = this.fb.group({
    name: '',
    email: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    region: '',
    postalCode: '',
    country: '',
    deliveryNotes: '',
  });

  constructor() {
    this.form.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.addressChange.emit(addressFromForm(this.form)));

    effect(() => {
      const address = this.initialAddress();
      if (address) {
        this.form.setValue(toFormValue(address), { emitEvent: false });
      }
    });

    effect(() => {
      if (this.disabled()) {
        this.form.disable({ emitEvent: false });
      } else {
        this.form.enable({ emitEvent: false });
      }
    });
  }
}

function toFormValue(address: UiAddress): ReturnType<AddressFormGroup['getRawValue']> {
  return {
    name: address.name,
    email: address.email ?? '',
    phone: address.phone,
    addressLine1: address.addressLine1,
    addressLine2: address.addressLine2 ?? '',
    city: address.city,
    region: address.region,
    postalCode: address.postalCode,
    country: address.country,
    deliveryNotes: address.deliveryNotes ?? '',
  };
}

function addressFromForm(form: AddressFormGroup): UiAddress {
  return form.getRawValue();
}
