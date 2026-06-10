import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { finalize } from 'rxjs';

import { AuthService } from '../../../../core/services/auth.service';
import { CartService } from '../../../cart/services/cart.service';
import { ReviewsPage } from '../../../reviews/pages/reviews-page/reviews-page';
import { ProductService, Product, ProductImage } from '../../services/product';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, ReviewsPage],
  templateUrl: './product-detail.html',
  styleUrls: ['./product-detail.css']
})
export class ProductDetailPage implements OnInit {
  private route = inject(ActivatedRoute);
  private productService = inject(ProductService);
  private authService = inject(AuthService);
  private cartService = inject(CartService);
  private cdr = inject(ChangeDetectorRef);

  product: Product | null = null;
  loading = true;
  error = '';
  selectedImage = '';
  addingToCart = false;
  cartMessage = '';
  cartError = '';
  readonly stars = [1, 2, 3, 4, 5];

  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get('slug');
    if (slug) {
      this.loadProduct(slug);
    } else {
      this.error = 'Product not found';
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  loadProduct(slug: string): void {
    this.productService.getProduct(slug).subscribe({
      next: (data) => {
        this.product = data;
        this.selectedImage = this.getPrimaryImage(data);
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err: unknown) => {
        console.error('Failed to load product details', err);
        this.error = 'Product could not be loaded.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  getPrimaryImage(product: Product): string {
    const primary = product.images.find(img => img.is_primary);
    return primary ? primary.image : (product.images[0]?.image || 'assets/placeholder.png');
  }

  selectImage(img: ProductImage): void {
    this.selectedImage = img.image;
  }

  isFilledStar(star: number): boolean {
    return star <= Math.round(this.product?.average_rating ?? 0);
  }

  addToCart(): void {
    if (!this.product || this.product.stock === 0 || this.addingToCart) {
      return;
    }

    this.cartMessage = '';
    this.cartError = '';

    if (!this.authService.isLoggedIn()) {
      this.cartService.addGuestItem({
        product: this.product.id,
        product_name: this.product.name,
        product_slug: this.product.slug,
        product_price: this.product.price,
        primary_image: this.selectedImage || null,
        quantity: 1,
      });
      this.cartMessage = 'Added to cart.';
      this.cdr.detectChanges();
      return;
    }

    this.addingToCart = true;
    this.cartService
      .addItem(this.product.id, 1)
      .pipe(finalize(() => {
        this.addingToCart = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: () => {
          this.cartMessage = 'Added to cart.';
        },
        error: () => {
          this.cartError = 'Could not add this product to cart.';
        },
      });
  }
}
