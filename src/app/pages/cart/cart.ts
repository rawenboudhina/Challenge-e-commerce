import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CartService } from '../../services/cart.service';
import { AuthService } from '../../services/auth.service';
import { Product, CartItem } from '../../models/product.model';
import { Router, RouterModule } from '@angular/router';
import Swal from 'sweetalert2';  // ← Ajoutez cet import pour SweetAlert2

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
export class CartComponent implements OnInit, OnDestroy {
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
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }

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
    // Remplace le confirm natif par SweetAlert pour une confirmation attractive
    Swal.fire({
      title: 'Supprimer cet article ?',
      text: 'Êtes-vous sûr de vouloir retirer cet article de votre panier ?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Oui, supprimer',
      cancelButtonText: 'Annuler',
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6'
    }).then((result) => {
      if (result.isConfirmed) {
        this.cartService.removeFromCart(productId);
        // Optionnel : Afficher une confirmation de succès après suppression
        Swal.fire({
          title: 'Supprimé !',
          text: 'L\'article a été retiré de votre panier.',
          icon: 'success',
          timer: 2000,  // Ferme automatiquement après 2 secondes
          showConfirmButton: false
        });
      }
    });
  }

  proceedToCheckout(): void {
    if (this.cartItems.length === 0) {
      // Alerte attractive pour panier vide
      Swal.fire({
        title: 'Panier vide',
        text: 'Votre panier est vide. Ajoutez des articles avant de continuer.',
        icon: 'info',
        confirmButtonText: 'OK',
        confirmButtonColor: '#3085d6'
      }).then(() => {
        this.router.navigate(['/products']);  // Rediriger vers produits (optionnel)
      });
      return;
    }

    if (!this.authService.isAuthenticated()) {
      // Alerte attractive pour connexion requise
      Swal.fire({
        title: 'Connexion requise',
        text: 'Connexion requise pour procéder au paiement. Voulez-vous vous connecter ?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Oui, me connecter',
        cancelButtonText: 'Non, annuler',
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33'
      }).then((result) => {
        if (result.isConfirmed) {
          this.router.navigate(['/login'], { queryParams: { returnUrl: '/checkout' } });
        }
      });
      return;
    }

    // Si tout est OK, rediriger vers checkout
    this.router.navigate(['/checkout']);
  }

  getProductSpecs(product: Product): Spec[] {
    return (product as any).specs || [];
  }
}