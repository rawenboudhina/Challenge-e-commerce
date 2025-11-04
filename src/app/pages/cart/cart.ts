import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CartService } from '../../core/services/cart';
import { Product, CartItem } from '../../core/models/product.model';

interface Spec {
  key: string;
  value: string;
}

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cart.html',
  styleUrls: ['./cart.scss']
})
export class Cart implements OnInit {
  cartItems: CartItem[] = [];
  loading = true;

  constructor(private cartService: CartService) {}

  ngOnInit() {
    this.loadCart();
  }

  loadCart() {
    this.cartService.cart$.subscribe(items => {
      this.cartItems = items;
      this.loading = false;
    });
  }

  getSubtotal(item: CartItem): number {
    return item.product.price * item.quantity;
  }

  getSubtotalAll(): number {
    return this.cartItems.reduce((sum, item) => sum + this.getSubtotal(item), 0);
  }

  getShippingFee(): number {
    return this.cartItems.length > 0 ? 5 : 0; // Frais fixes de 5€
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
    if (confirm('Voulez-vous supprimer cet article ?')) {
      this.cartService.removeFromCart(productId);
    }
  }

  proceedToCheckout(): void {
    if (this.cartItems.length > 0) {
      // Naviguer vers checkout ou alerter
      alert('Redirection vers le paiement... (Implémentez la page checkout)');
      // this.router.navigate(['/checkout']); // Si page existe
    }
  }

  // Helper pour specs (optionnel, pour éviter erreurs TS)
  getProductSpecs(product: Product): Spec[] {
    return (product as any).specs || [];
  }
}