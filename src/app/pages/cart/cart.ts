// src/app/pages/cart/cart.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CartService } from '../../core/services/cart.service';
import { AuthService } from '../../core/services/auth.service';
import { Product, CartItem } from '../../core/models/product.model';
import { Router, RouterModule } from '@angular/router'; 
interface Spec {
  key: string;
  value: string;
}

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './cart.html',
  styleUrls: ['./cart.scss']
})
export class CartComponent implements OnInit, OnDestroy {  // ← CHANGÉ ICI
  cartItems: CartItem[] = [];
  loading = true;
  private sub: any;

  constructor(
    private cartService: CartService,
    private authService: AuthService,
    private router: Router 
  ) {}

  ngOnInit() {
    this.sub = this.cartService.cart$.subscribe(items => {
      this.cartItems = items;
      this.loading = false;
    });
/* 
    if (this.authService.isAuthenticated()) {
      this.cartService.mergeLocalCartOnLogin();
    } */
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }

  // ... reste identique
  getSubtotal(item: CartItem): number {
    return item.product.price * item.quantity;
  }

  getSubtotalAll(): number {
    return this.cartItems.reduce((sum, item) => sum + this.getSubtotal(item), 0);
  }

  getShippingFee(): number {
    return this.cartItems.length > 0 ? 5 : 0;
  }

  getTotal(): number {
    return this.getSubtotalAll() + this.getShippingFee();
  }

  increaseQuantity(productId: number): void {
    const item = this.cartItems.find(i => i.product.id === productId);
    if (item) {
      this.cartService.updateQuantity(productId, item.quantity + 1);
    }
  }

  decreaseQuantity(productId: number): void {
    const item = this.cartItems.find(i => i.product.id === productId);
    if (item && item.quantity > 1) {
      this.cartService.updateQuantity(productId, item.quantity - 1);
    }
  }

  updateQuantity(productId: number, quantity: number): void {
    this.cartService.updateQuantity(productId, quantity);
  }

  removeFromCart(productId: number): void {
    if (confirm('Supprimer cet article ?')) {
      this.cartService.removeFromCart(productId);
    }
  }

 proceedToCheckout(): void {
    if (this.cartItems.length === 0) {
      alert('Votre panier est vide. Ajoutez des articles avant de continuer.');
      this.router.navigate(['/products']); // Optionnel : Rediriger vers produits
      return;
    }
    this.router.navigate(['/checkout']); // ← Redirection vers la page de paiement
  }

  getProductSpecs(product: Product): Spec[] {
    return (product as any).specs || [];
  }
}