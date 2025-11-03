// product-card.component.ts
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Product } from '../../../core/models/product.model';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product-card.html',
  styleUrls: ['./product-card.scss']
})
export class ProductCardComponent {
  @Input() product!: Product;

  get originalPrice(): number {
    if (this.product.discountPercentage) {
      return Math.round(this.product.price / (1 - this.product.discountPercentage / 100));
    }
    return this.product.price;
  }

  getStars(): any[] {
    const stars = [];
    const rating = this.product.rating?.rate || 0;
    const floorRating = Math.floor(rating);
    const fractional = rating - floorRating;

    for (let i = 1; i <= 5; i++) {
      let isFilled = false;
      let isHalf = false;
      let isEmpty = true;

      if (i <= floorRating) {
        isFilled = true;
        isEmpty = false;
      } else if (i === floorRating + 1 && fractional > 0) {
        isHalf = true;
        isEmpty = false;
      }

      stars.push({ 
        index: i, 
        value: i,
        isFilled,
        isHalf,
        isEmpty
      });
    }
    return stars;
  }

  addToCart() {
    // Implement add to cart logic
    console.log('Added to cart:', this.product.title);
  }

  toggleWishlist() {
    // Implement wishlist logic
    console.log('Toggled wishlist for:', this.product.title);
  }

  quickBuy() {
    // Implement quick buy logic
    console.log('Quick buy:', this.product.title);
  }
}