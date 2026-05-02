import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Product } from '../../services/product';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './product-card.html',
  styleUrls: ['./product-card.css']
})
export class ProductCard {
  @Input({ required: true }) product!: Product;

  get primaryImage(): string {
    if (this.product.primary_image) {
      return this.product.primary_image;
    }
    if (this.product.images && this.product.images.length > 0) {
      const primary = this.product.images.find(img => img.is_primary);
      return primary ? primary.image : this.product.images[0].image;
    }
    return 'assets/placeholder.png';
  }
}
