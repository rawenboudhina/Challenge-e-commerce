import {
  Component,
  Input,
  Output,
  EventEmitter,
  inject,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Product } from '../../../models/product.model';
import { WishlistService } from '../../../services/wishlist.service';
import { CartService } from '../../../services/cart.service';
import Swal from 'sweetalert2';
import { AuthService } from '../../../services/auth.service'; // ← AJOUTE CET IMPORT !
@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './product-card.html',
  styleUrls: ['./product-card.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductCardComponent implements OnInit, OnDestroy {
  @Input() product!: Product;
  @Output() addToCart = new EventEmitter<Product>();
  @Output() quickBuy = new EventEmitter<Product>();

  wishlistService = inject(WishlistService);
  private cartService = inject(CartService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private authService = inject(AuthService); // ← AJOUTÉ
  private subscription: any;
  isWishlisted = false;
  get isLoggedIn(): boolean {
    return this.authService.isAuthenticated();
  }
ngOnInit(): void {
  this.subscription = this.wishlistService.wishlist$.subscribe((ids) => {
    // Convertit les deux en string pour comparer
    this.isWishlisted = ids.includes(String(this.product.id));
    this.cdr.markForCheck();
  });
}

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  // === PRIX ===
  get originalPrice(): number {
    if (this.product.discountPercentage && this.product.discountPercentage > 0) {
      return Math.round(this.product.price / (1 - this.product.discountPercentage / 100));
    }
    return this.product.price;
  }

  // === ÉTOILES ===
  getStars(): any[] {
    const rating = this.product.rating?.rate || 0;
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push({
        isFilled: i <= Math.floor(rating),
        isHalf: i === Math.ceil(rating) && !Number.isInteger(rating),
        isEmpty: i > Math.ceil(rating),
      });
    }
    return stars;
  }

  // === ACTIONS ===
  onAddToCart(): void {
  if (!this.product.stock || this.product.stock <= 0) return;

  // NE FAIS PLUS ÇA : this.cartService.addToCart(this.product);
  this.addToCart.emit(this.product); // SEULEMENT L'ÉVÉNEMENT

  Swal.fire({
    title: 'Ajouté au panier !',
    text: `${this.product.title} a été ajouté à votre panier.`,
    icon: 'success',
    timer: 2000,
    toast: true,
    position: 'top-end',
    showConfirmButton: false
  });
}

onToggleWishlist($event: Event): void {
  $event.stopPropagation();

  if (!this.isLoggedIn) {
    this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
    return;
  }

  const wasWishlisted = this.isWishlisted;

  // LA LIGNE MAGIQUE QUI RÉSOUT TOUT
  const productIdToSend = this.product.id; // ENVOIE UNIQUEMENT L'ID NUMÉRIQUE (1, 2, 3...)

  this.wishlistService.toggle(productIdToSend);

  Swal.fire({
    title: wasWishlisted ? 'Retiré des favoris' : 'Ajouté aux favoris !',
    icon: wasWishlisted ? 'info' : 'success',
    timer: 1500,
    toast: true,
    position: 'top-end',
    showConfirmButton: false
  });
}
  onQuickBuy($event: Event): void {
    $event.stopPropagation();
    if (!this.product.stock || this.product.stock <= 0) return;

    this.cartService.addToCart(this.product);
    this.quickBuy.emit(this.product);

    Swal.fire({
      title: 'Prêt à payer !',
      text: `${this.product.title} ajouté au panier`,
      icon: 'success',
      timer: 1500,
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
    });

    this.router.navigate(['/cart']);
  }

  onProductClick(): void {
    this.router.navigate(['/product', this.product.id]);
  }
}
