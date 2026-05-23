import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { ProductListingPage } from './product-listing-page';

describe('ProductListingPage', () => {
  let component: ProductListingPage;
  let fixture: ComponentFixture<ProductListingPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductListingPage],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(ProductListingPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
