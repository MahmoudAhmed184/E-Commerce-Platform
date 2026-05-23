import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { PaymentService } from './payment.service';

describe('PaymentService', () => {
  let service: PaymentService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(PaymentService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('requests card element setup from the backend', async () => {
    const elementsPromise = firstValueFrom(service.initializeStripeElements('card-element'));

    const request = http.expectOne(`${environment.apiBaseUrl}/payments/card/elements/`);
    expect(request.request.body).toEqual({ mount_target_id: 'card-element' });
    request.flush({ client_secret: 'pi_secret_123' });

    await expect(elementsPromise).resolves.toEqual({
      provider: 'stripe',
      ready: true,
      mountTargetId: 'card-element',
      clientSecret: 'pi_secret_123',
    });
  });

  it('confirms card payment through the backend', async () => {
    const resultPromise = firstValueFrom(service.payByCard(25.5));

    const request = http.expectOne(`${environment.apiBaseUrl}/payments/card/confirm/`);
    expect(request.request.body).toEqual({ amount: 25.5 });
    request.flush({ status: 'paid', provider_reference: 'stripe_2550' });

    await expect(resultPromise).resolves.toEqual({ status: 'paid', providerReference: 'stripe_2550' });
  });

  it('delegates wallet payment and insufficient-balance errors to the backend', async () => {
    const resultPromise = firstValueFrom(service.payByWallet(65));

    const request = http.expectOne(`${environment.apiBaseUrl}/payments/wallet/pay/`);
    expect(request.request.body).toEqual({ amount: 65 });
    request.flush({
      status: 'failed',
      provider_reference: null,
      failure_reason: 'Wallet balance is below the order total.',
    });

    await expect(resultPromise).resolves.toEqual({
      status: 'failed',
      providerReference: null,
      failureReason: 'Wallet balance is below the order total.',
    });
  });

  it('confirms cash-on-delivery payment through the backend', async () => {
    const resultPromise = firstValueFrom(service.confirmCod());

    const request = http.expectOne(`${environment.apiBaseUrl}/payments/cod/confirm/`);
    expect(request.request.body).toEqual({});
    request.flush({ status: 'cod_pending', provider_reference: null });

    await expect(resultPromise).resolves.toEqual({ status: 'cod_pending', providerReference: null });
  });
});
