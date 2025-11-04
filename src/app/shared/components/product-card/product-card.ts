import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { Product } from '../../../core/models/product.model';
import { WishlistService } from '../../../core/services/wishlist';
import { CartService } from '../../../core/services/cart';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, RouterModule],
  templateUrl: './product-card.html',
  styleUrls: ['./product-card.scss']
})
export class ProductCardComponent {
  @Input() product!: Product;
  @Output() addToCart = new EventEmitter<Product>();
  @Output() quickBuy = new EventEmitter<Product>();

  private wishlistService = inject(WishlistService);
  private cartService = inject(CartService);
  private router = inject(Router);

  // Vérifie si le produit est dans la wishlist
  get isWishlisted(): boolean {
    return this.wishlistService.isInWishlist(this.product.id);
  }

  get originalPrice(): number {
    if (this.product.discountPercentage && this.product.discountPercentage > 0) {
      return Math.round(this.product.price / (1 - this.product.discountPercentage / 100));
    }
    return this.product.price;
  }

getStars(): { index: number; isFilled: boolean; isHalf: boolean; isEmpty: boolean; value: number }[] {
  const rating = this.product.rating?.rate || 0;
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    const value = i;
    const isFilled = i <= Math.floor(rating);
    const isHalf = i === Math.ceil(rating) && rating % 1 >= 0.5;
    const isEmpty = i > Math.ceil(rating);
    stars.push({ index: i - 1, isFilled, isHalf, isEmpty, value });
  }
  return stars;
}
  onAddToCart() {
    if (!this.product.stock || this.product.stock <= 0) return;
    this.cartService.addToCart(this.product);
    this.addToCart.emit(this.product);
  }

  onToggleWishlist($event: Event) {
    $event.stopPropagation();
    this.wishlistService.toggle(this.product);
  }

  onQuickBuy($event: Event) {
    $event.stopPropagation();
    if (!this.product.stock || this.product.stock <= 0) return;

    this.cartService.addToCart(this.product);
    this.quickBuy.emit(this.product);
    this.router.navigate(['/cart']);
  }

  onProductClick() {
    this.router.navigate(['/product', this.product.id]);
  }
}