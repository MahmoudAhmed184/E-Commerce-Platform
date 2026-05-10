import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { environment } from '../../../../../environments/environment';
import { ReviewsPage } from './reviews-page-v2';
import { ReviewService, Review } from '../../services/review.service';
import { AuthService } from '../../../../core/services/auth.service';

const mockReview: Review = {
  id: 1,
  user: 'u1',
  user_name: 'Test User',
  product: 101,
  rating: 4,
  comment: 'Great product!',
  is_visible: true,
  deleted_at: null,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

describe('ReviewsPage', () => {
  let fixture: ComponentFixture<ReviewsPage>;
  let component: ReviewsPage;
  let http: HttpTestingController;
  let authService: AuthService;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [ReviewsPage],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: { get: () => 'test-slug' } }
          }
        }
      ],
    });

    fixture = TestBed.createComponent(ReviewsPage);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
    authService = TestBed.inject(AuthService);
  });

  afterEach(() => {
    http.verify();
    vi.restoreAllMocks();
    TestBed.resetTestingModule();
  });

  async function flushReviews(slug: string, reviews: Review[]) {
    fixture.detectChanges();
    await fixture.whenStable();
    
    const req = http.expectOne(`${environment.apiBaseUrl}/products/${slug}/reviews/`);
    req.flush(reviews);
    
    fixture.detectChanges();
    await fixture.whenStable();
  }

  it('renders reviews and summary correctly', async () => {
    await flushReviews('test-slug', [mockReview]);

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Test User');
    expect(el.textContent).toContain('Great product!');
    expect(el.textContent).toContain('4.0'); // Average rating summary
  });

  it('shows login prompt for guests', async () => {
    vi.spyOn(authService, 'isLoggedIn').mockReturnValue(false);
    await flushReviews('test-slug', []);

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Log in to share your experience');
  });

  it('allows logged in users to submit a review', async () => {
    vi.spyOn(authService, 'isLoggedIn').mockReturnValue(true);
    await flushReviews('test-slug', []);

    const form = component['form'];
    form.setValue({ rating: 5, comment: 'Amazing!' });
    
    component['submitReview']();
    
    const req = http.expectOne(`${environment.apiBaseUrl}/products/test-slug/reviews/`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ rating: 5, comment: 'Amazing!' });
    req.flush(mockReview);

    // Should reload reviews after submission
    const reloadReq = http.expectOne(`${environment.apiBaseUrl}/products/test-slug/reviews/`);
    reloadReq.flush([mockReview]);
  });

  it('allows users to delete their own review', async () => {
    vi.spyOn(authService, 'isLoggedIn').mockReturnValue(true);
    vi.spyOn(authService, 'currentUser').mockReturnValue({ id: 'u1', email: 'u@u.com', role: 'customer' } as any);
    await flushReviews('test-slug', [mockReview]);

    const el = fixture.nativeElement as HTMLElement;
    const deleteBtn = Array.from(el.querySelectorAll('button')).find(b => b.textContent?.includes('Delete'));
    expect(deleteBtn).toBeTruthy();

    deleteBtn?.click();

    const req = http.expectOne(`${environment.apiBaseUrl}/reviews/1/`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('No reviews yet');
  });
});
