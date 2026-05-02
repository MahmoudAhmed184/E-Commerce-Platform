import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ProductService, Product, ProductImage } from '../../services/product';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './product-detail.html',
  styleUrls: ['./product-detail.css']
})
export class ProductDetailPage implements OnInit {
  private route = inject(ActivatedRoute);
  private productService = inject(ProductService);
  private cdr = inject(ChangeDetectorRef);

  product: Product | null = null;
  loading = true;
  error = '';
  selectedImage = '';

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
}
