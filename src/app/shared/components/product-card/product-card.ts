// src/app/components/product-card/product-card.component.ts
import {
  Component,
  Input,
  Output,
  EventEmitter,
  inject,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  OnInit,
  OnDestroy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Product } from '../../../core/models/product.model';
import { WishlistService } from '../../../core/services/wishlist.service';
import { CartService } from '../../../core/services/cart.service';
import { AuthService } from '../../../core/services/auth.service';  
@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './product-card.html',
  styleUrls: ['./product-card.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductCardComponent implements OnInit, OnDestroy {
  @Input() product!: Product;
  @Output() addToCart = new EventEmitter<Product>();
  @Output() quickBuy = new EventEmitter<Product>();

  wishlistService = inject(WishlistService);
  private cartService = inject(CartService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  private subscriptionWishlist: any;
  isWishlisted = false;

  ngOnInit(): void {
    this.subscriptionWishlist = this.wishlistService.wishlist$.subscribe(ids => {
      this.isWishlisted = ids.includes(this.product.id);
      this.cdr.markForCheck();
    });
  }

  ngOnDestroy(): void {
    this.subscriptionWishlist?.unsubscribe();
  }
  // === PRIX ===
  get originalPrice(): number {
    if (this.product.discountPercentage && this.product.discountPercentage > 0) {
      return Math.round(this.product.price / (1 - this.product.discountPercentage / 100));
    }
    return this.product.price;
  }

  // === ÉTOILES ===
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

  // === ACTIONS ===
  onAddToCart(): void {
    if (!this.product.stock || this.product.stock <= 0) return;
    this.cartService.addToCart(this.product);
    this.addToCart.emit(this.product);
  }

  onToggleWishlist($event: Event): void {
    $event.stopPropagation();

    // CORRIGÉ : Utilise currentUserId (public getter)
    if (!this.wishlistService.currentUserId) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
      return;
    }

    this.wishlistService.toggle(this.product);
    // Réactivité gérée via wishlist$
  }

  onQuickBuy($event: Event): void {
    $event.stopPropagation();
    if (!this.product.stock || this.product.stock <= 0) return;
    this.cartService.addToCart(this.product);
    this.quickBuy.emit(this.product);
    this.router.navigate(['/cart']);
  }

  onProductClick(): void {
    this.router.navigate(['/product', this.product.id]);
  }
}