// src/app/pages/cart/cart.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CartService } from '../../services/cart.service';
import { AuthService } from '../../services/auth.service';
import { ProductService } from '../../services/product.service';
import { Product, CartItem } from '../../models/product.model';
import { Router, RouterModule } from '@angular/router';
import { forkJoin, Subscription } from 'rxjs';
import Swal from 'sweetalert2';

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
  // ON GARDE UNIQUEMENT enrichedCartItems → contient les produits complets
  enrichedCartItems: CartItem[] = [];
  loading = true;
  private sub!: Subscription;

  constructor(
    private cartService: CartService,
    private authService: AuthService,
    private productService: ProductService,
    private router: Router
  ) {}

  ngOnInit() {
    this.sub = this.cartService.cart$.subscribe(cartItems => {
      if (!cartItems || cartItems.length === 0) {
        this.enrichedCartItems = [];
        this.loading = false;
        return;
      }

      // On récupère les produits complets
      const requests = cartItems.map(item =>
        this.productService.getProductById(item.product.id)
      );

      forkJoin(requests).subscribe({
        next: (products: Product[]) => {
          this.enrichedCartItems = cartItems.map((item, i) => ({
            ...item,
            product: products[i]
          }));
          this.loading = false;
        },
        error: () => {
          // En cas d'erreur API, on garde quand même le panier
          this.enrichedCartItems = cartItems.map(item => ({
            ...item,
            product: item.product // fallback sur l'objet minimal
          }));
          this.loading = false;
        }
      });
    });
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }

  // + / - lisent toujours dans le service (source de vérité)
 increaseQuantity(productId: number): void {
  const qty = this.cartService.getCurrentQuantity(productId);
  this.cartService.updateQuantity(productId, qty + 1); // envoie la quantité absolue
}

decreaseQuantity(productId: number): void {
  const qty = this.cartService.getCurrentQuantity(productId);
  if (qty > 1) {
    this.cartService.updateQuantity(productId, qty - 1);
  }
}

  // Pour l'input number (quand l'utilisateur tape directement)
  updateQuantityFromInput(productId: number, newQty: number): void {
    if (newQty < 1) newQty = 1;
    this.cartService.updateQuantity(productId, newQty);
  }

  removeFromCart(productId: number): void {
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
        Swal.fire({
          title: 'Supprimé !',
          text: 'L\'article a été retiré de votre panier.',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
      }
    });
  }

  // Calculs sur enrichedCartItems (affichage uniquement)
  getSubtotal(item: CartItem): number {
    return item.product.price * item.quantity;
  }

  getSubtotalAll(): number {
    return this.enrichedCartItems.reduce((sum, item) => sum + this.getSubtotal(item), 0);
  }

  getShippingFee(): number {
    return this.enrichedCartItems.length > 0 ? 5 : 0;
  }

  getTotal(): number {
    return this.getSubtotalAll() + this.getShippingFee();
  }

  proceedToCheckout(): void {
    if (this.enrichedCartItems.length === 0) {
      Swal.fire({
        title: 'Panier vide',
        text: 'Ajoutez des articles avant de continuer.',
        icon: 'info'
      }).then(() => this.router.navigate(['/products']));
      return;
    }

    if (!this.authService.isAuthenticated()) {
      Swal.fire({
        title: 'Connexion requise',
        text: 'Connectez-vous pour procéder au paiement.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Me connecter',
        cancelButtonText: 'Annuler'
      }).then((r) => {
        if (r.isConfirmed) {
          this.router.navigate(['/login'], { queryParams: { returnUrl: '/checkout' } });
        }
      });
      return;
    }

    this.router.navigate(['/checkout']);
  }

  getProductSpecs(product: Product): Spec[] {
    return (product as any).specs || [];
  }
}