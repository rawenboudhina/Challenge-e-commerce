import { Component, OnInit, OnDestroy, inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductService } from '../../core/services/product.service';
import { CartService } from '../../core/services/cart.service';
import { WishlistService } from '../../core/services/wishlist.service';
import { AuthService } from '../../core/services/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductCardComponent } from '../../shared/components/product-card/product-card';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Product } from '../../core/models/product.model';
import { RouterModule } from '@angular/router';

interface Review {
  user: string;
  rating: number;
  comment: string;
  title?: string;        // ← AJOUTÉ
  date: string;
  helpful?: number;
  helpfulClicked?: boolean;
  justAdded?: boolean;   // ← AJOUTE CETTE LIGNE YA SI !!!
}

interface Spec {
  key: string;
  value: string;
}

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, ProductCardComponent, RouterModule],
  templateUrl: './product-detail.html',
  styleUrls: ['./product-detail.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductDetailComponent implements OnInit, OnDestroy {
  // === SERVICES ===
   public authService = inject(AuthService);
   public route = inject(ActivatedRoute);
   productService = inject(ProductService);
   cartService = inject(CartService);
   wishlistService = inject(WishlistService);
   sanitizer = inject(DomSanitizer);
 public router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  // === ÉTAT ===
  product: Product | null = null;
  similarProducts: Product[] = [];
  quantity = 1;
  selectedImage = 0;
  loading = true;
  showReviewForm = false;
  newReview: Partial<Review> = { rating: 0, comment: '' };
   allReviews: Review[] = [];
   loadedReviewsCount = 0;
   reviewsPerPage = 5;

  // Wishlist
  isInWishlist = false;
  private wishlistSubscription: any;
  hoverRating = 0;
  // === LIFECYCLE ===
 ngOnInit(): void {
  // LE FIX ULTIME 2025 : SUBSCRIBE AUX PARAMÈTRES (JAMAIS snapshot avec OnPush)
  this.route.paramMap.subscribe(params => {
    const id = params.get('id');
    if (id) {
      this.loadProduct(+id);
    } else {
      this.router.navigate(['/404']);
    }
  });

  // Wishlist (inchangé)
  this.wishlistSubscription = this.wishlistService.wishlist$.subscribe(ids => {
    if (this.product) {
      this.isInWishlist = ids.includes(this.product.id);
      this.cdr.markForCheck();
    }
  });

  // Supprime le setTimeout inutile
  // setTimeout(() => this.updateWishlistStatus(), 0); ← SUPPRIME ÇA
}

  ngOnDestroy(): void {
    this.wishlistSubscription?.unsubscribe();
  }

  // === WISHLIST ===
  private updateWishlistStatus(): void {
    if (!this.product) return;
    const wishlistIds = this.wishlistService.getAllProductIds();
    this.isInWishlist = wishlistIds.includes(this.product.id);
    this.cdr.markForCheck();
  }

  toggleWishlist(): void {
    if (!this.product) return;
    if (!this.wishlistService.currentUserId) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
      return;
    }
    this.wishlistService.toggle(this.product);
  }
  
  private triggerConfetti(): void {
  for (let i = 0; i < 25; i++) {
    const confetti = document.createElement('div');
    confetti.className = 'confetti';
    confetti.style.left = Math.random() * 100 + 'vw';
    confetti.style.background = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'][Math.floor(Math.random() * 4)];
    confetti.style.animationDelay = Math.random() * 0.5 + 's';
    document.body.appendChild(confetti);
    setTimeout(() => confetti.remove(), 2000);
  }
}

private playAddToCartSound(): void {
  const audio = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-coin-win-1939.mp3');
  audio.volume = 0.5;
  audio.play().catch(() => {});
}

private vibratePhone(): void {
  if (navigator.vibrate) {
    navigator.vibrate([200, 100, 200]);
  }
}

  // === CHARGEMENT PRODUIT ===
 private loadProduct(id: number): void {
  this.loading = true;
  this.product = null; // Reset pour forcer OnPush
  this.cdr.detectChanges(); // Forcer affichage du skeleton

  this.productService.getProductById(id).subscribe({
    next: (product: Product) => {
      const enhancedProduct = {
        ...product,
        specs: (product as any).specs || [],
      };
      this.product = enhancedProduct;
      this.selectedImage = 0;

      // Images fallback
      let images = product.images || [product.image || '/assets/fallback.jpg'];
      if (images.length < 3) {
        const main = images[0];
        images = [...images, main, main].slice(0, 3);
      }
      (this.product as any).images = images;

      // Reviews
      this.allReviews = [...(product.reviews || [])];
      this.loadedReviewsCount = Math.min(this.reviewsPerPage, this.allReviews.length);
      (this.product as any).reviews = this.allReviews.slice(0, this.loadedReviewsCount);

      // Rating global
      if (!this.product.rating?.rate || this.product.rating.count === 0) {
        const avg = this.allReviews.length > 0
          ? this.allReviews.reduce((s, r) => s + r.rating, 0) / this.allReviews.length
          : 4.5;
        this.product.rating = {
          rate: Math.round(avg * 10) / 10,
          count: this.allReviews.length
        };
      }

      this.loadSimilarProducts();
      this.loading = false;

      // LE SECRET TUNISIEN 2025 :
      this.cdr.detectChanges(); // PAS markForCheck() → detectChanges() !!!
      this.updateWishlistStatus();
    },
    error: (error) => {
      console.error('Erreur chargement produit :', error);
      this.loading = false;
      this.cdr.detectChanges(); // Même en erreur
    }
  });
}
  // === QUANTITÉ ===
  decreaseQuantity(): void {
    this.quantity = Math.max(1, this.quantity - 1);
  }

  increaseQuantity(): void {
    if (this.product) {
      this.quantity = Math.min(this.getProductStock(), this.quantity + 1);
    }
  }

  validateQuantity(): void {
    if (this.quantity < 1) this.quantity = 1;
    else if (this.product && this.quantity > this.getProductStock()) this.quantity = this.getProductStock();
    this.quantity = Math.floor(this.quantity);
  }

  getProductStock(): number {
    return this.product?.stock ?? 0;
  }

  // === SIMILAIRES ===
  private loadSimilarProducts(): void {
    if (!this.product?.category) return;
    this.productService.searchProducts('', this.product.category).subscribe({
      next: (products: Product[]) => {
        this.similarProducts = products
          .filter(p => p.id !== this.product?.id)
          .slice(0, 4);
        this.cdr.markForCheck();
      }
    });
  }

  // === PRIX ===
  get originalPrice(): number {
    if (this.product?.discountPercentage && this.product.discountPercentage > 0) {
      return Math.round(this.product.price / (1 - this.product.discountPercentage / 100));
    }
    return this.product?.price || 0;
  }

  get savings(): number {
    return this.originalPrice - (this.product?.price || 0);
  }

  // === IMAGES ===
  selectImage(index: number): void {
    this.selectedImage = index;
  }

  onImageError(event: any): void {
    (event.target as HTMLImageElement).src = '/assets/fallback-image.jpg';
  }

  // === PANIER ===
  addToCart(): void {
    if (this.product && this.quantity > 0) {
      this.cartService.addToCart(this.product, this.quantity);
      this.showToast(`${this.quantity} × ${this.product.title} ajouté(s) au panier !`, 'success');
    }
  }

  // === STOCK ===
  get inStock(): boolean {
    return this.getProductStock() > 0;
  }

  get stockText(): string {
    const stock = this.getProductStock();
    return stock > 0 ? `En stock (${stock} disponibles)` : 'Rupture de stock';
  }

  // === ÉTOILES ===
  get ratingStars(): number[] {
    const rating = this.product?.rating?.rate || 0;
    return Array(5).fill(0).map((_, i) =>
      i < Math.floor(rating) ? 1 : i < rating ? 0.5 : 0
    );
  }

  get overallRating(): number {
    return this.calculateOverallRating(this.allReviews);
  }

  get overallRatingStars(): number[] {
    const rating = this.overallRating;
    return Array(5).fill(0).map((_, i) =>
      i < Math.floor(rating) ? 1 : i < rating ? 0.5 : 0
    );
  }

  getMiniStars(stars: number): number[] {
    return Array(5).fill(0).map((_, i) => i < stars ? 1 : 0);
  }

  // === AVIS ===
  private calculateOverallRating(reviews: Review[]): number {
    if (!reviews.length) return 4.5;
    const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    return Math.round(avg * 10) / 10;
  }

  get customerReviews(): Review[] {
    return (this.product as any)?.reviews || [];
  }

  get ratingBreakdown(): { stars: number; percentage: number }[] {
    if (!this.allReviews.length) return [];
    const counts: { [key: number]: number } = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0};
    this.allReviews.forEach(r => counts[r.rating]++);
    const total = this.allReviews.length;
    return Object.entries(counts)
      .map(([starsStr, count]) => ({
        stars: +starsStr,
        percentage: Math.round((count / total) * 100)
      }))
      .reverse();
  }

  get hasMoreReviews(): boolean {
    return this.loadedReviewsCount < this.allReviews.length;
  }

  loadMoreReviews(): void {
    this.loadedReviewsCount += this.reviewsPerPage;
    (this.product as any).reviews = this.allReviews.slice(0, this.loadedReviewsCount);
    this.cdr.markForCheck();
  }

  // === FORMULAIRE AVIS (PRO) ===
  openReviewModal(): void {
    if (!this.authService.isAuthenticated()) {
      if (confirm('Vous devez être connecté pour écrire un avis.\nVoulez-vous vous connecter maintenant ?')) {
        this.router.navigate(['/login'], { 
          queryParams: { returnUrl: this.router.url + '#reviews' } 
        });
      }
      return;
    }

    this.showReviewForm = true;
    this.newReview = {
      user: this.authService.getCurrentUser()?.firstName || 'Client',
      rating: 5,
      comment: '',
      title: '',                                 // ← ajouté
      date: new Date().toISOString().slice(0, 10)
    };

    setTimeout(() => {
      document.querySelector('.review-form')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  }

  setReviewRating(rating: number): void {
    this.newReview.rating = rating;
  }

  cancelReview(): void {
    this.showReviewForm = false;
    this.newReview = { rating: 0, comment: '' };
  }

 submitReview(): void {
  const comment = this.newReview.comment?.trim();
  const title = this.newReview.title?.trim();
  const rating = this.newReview.rating;

  if (!title || !comment || !rating || rating === 0) {
    alert('Veuillez remplir le titre, le commentaire et la note');
    return;
  }

  const fullReview: Review = {
    user: this.authService.getCurrentUser()?.firstName || 'Client',
    rating,
    comment,
    title,                                      // ← titre ajouté
    date: new Date().toLocaleDateString('fr-FR'),
    helpful: 0,
    helpfulClicked: false,
    justAdded: true                             // ← animation
  };

  this.allReviews.unshift(fullReview);
  this.updateReviewsDisplay();
  this.updateOverallRating();
  this.showReviewForm = false;
  this.newReview = { rating: 0, comment: '', title: '' };

  // Animation disparaît après 3s
  setTimeout(() => {
    fullReview.justAdded = false;
    this.cdr.markForCheck();
  }, 3000);

  this.showToast('Merci pour votre avis ! Il apparaît en premier', 'success');
}
  private updateReviewsDisplay(): void {
    this.loadedReviewsCount = Math.min(this.reviewsPerPage, this.allReviews.length);
    (this.product as any).reviews = this.allReviews.slice(0, this.loadedReviewsCount);
    this.cdr.markForCheck();
  }

  private updateOverallRating(): void {
    if (!this.product) return;
    const avg = this.allReviews.length > 0
      ? this.allReviews.reduce((s, r) => s + r.rating, 0) / this.allReviews.length
      : 4.5;
    this.product.rating = {
      rate: Math.round(avg * 10) / 10,
      count: this.allReviews.length
    };
  }

  markHelpful(review: Review): void {
    if (!review.helpfulClicked) {
      review.helpful = (review.helpful ?? 0) + 1;
      review.helpfulClicked = true;
      this.cdr.markForCheck();
    }
  }

  getStarsForReview(rating: number): number[] {
    return Array(5).fill(0).map((_, i) => i < rating ? 1 : 0);
  }

  // === TOAST PRO ===
  private showToast(message: string, type: 'success' | 'error' = 'success'): void {
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed; top: 20px; right: 20px; z-index: 9999;
      background: ${type === 'success' ? '#10b981' : '#ef4444'};
      color: white; padding: 16px 32px; border-radius: 16px;
      font-weight: 600; box-shadow: 0 10px 30px rgba(0,0,0,0.2);
      animation: slideIn 0.5s ease;
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
  }

  // === AUTRES ===
  onSimilarProductAddToCart(product: Product): void {
    this.cartService.addToCart(product, 1);
  }

  get safeDescription(): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(this.product?.description || '');
  }

  get productSpecs(): Spec[] {
    return (this.product as any)?.specs || [];
  }

  notifyWhenAvailable(): void {
    this.showToast('Vous serez notifié dès le retour en stock !', 'success');
  }
   // === AJOUT AU PANIER DEPUIS SIMILAIRES (VERSION PRO TUNISIE 2025) ===
  onAddToCartFromSimilar(product: Product, event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }

    this.cartService.addToCart(product, 1);
    this.showToast(`1 × ${product.title} ajouté au panier !`, 'success');
    
    // EFFETS DE OUF
    this.triggerConfetti();
    this.playAddToCartSound();
    this.vibratePhone();
  }
}