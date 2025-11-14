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
import { Product } from '../../../models/product.model';
import { WishlistService } from '../../../services/wishlist.service';
import { CartService } from '../../../services/cart.service';
// import { AuthService } from '../../../services/auth.service';  
import Swal from 'sweetalert2';  // Import pour SweetAlert

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
    // Affiche une alerte attractive de succès avec SweetAlert
    Swal.fire({
      title: 'Ajouté au panier !',
      text: `${this.product.title} a été ajouté à votre panier.`,
      icon: 'success',
      timer: 2000,  // Ferme automatiquement après 2 secondes
      showConfirmButton: false,
      position: 'top-end',  // Position en haut à droite pour une notification discrète
      toast: true  // Mode toast pour une notification non bloquante
    });
  }

  onToggleWishlist($event: Event): void {
    $event.stopPropagation();
    // CORRIGÉ : Utilise currentUserId (public getter)
    if (!this.wishlistService.currentUserId) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
      return;
    }
    const wasWishlisted = this.isWishlisted;  // Capture l'état avant toggle pour le message
    this.wishlistService.toggle(this.product);
    // Réactivité gérée via wishlist$

    // Affiche une alerte attractive avec SweetAlert basée sur l'action
    const action = wasWishlisted ? 'retiré des' : 'ajouté aux';
    Swal.fire({
      title: `${this.product.title} ${action} favoris !`,
      icon: 'success',
      timer: 2000,  // Ferme automatiquement après 2 secondes
      showConfirmButton: false,
      position: 'top-end',  // Position en haut à droite pour une notification discrète
      toast: true  // Mode toast pour une notification non bloquante
    });
  }

  onQuickBuy($event: Event): void {
    $event.stopPropagation();
    if (!this.product.stock || this.product.stock <= 0) return;
    this.cartService.addToCart(this.product);
    this.quickBuy.emit(this.product);
    // Affiche une alerte attractive de succès avec SweetAlert avant redirection
    Swal.fire({
      title: 'Ajouté au panier !',
      text: `${this.product.title} a été ajouté à votre panier.`,
      icon: 'success',
      timer: 2000,  // Ferme automatiquement après 2 secondes
      showConfirmButton: false,
      position: 'top-end',
      toast: true
    });
    this.router.navigate(['/cart']);
  }

  onProductClick(): void {
    this.router.navigate(['/product', this.product.id]);
  }
}