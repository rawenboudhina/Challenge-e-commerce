// src/app/pages/product-detail/product-detail.component.ts
import { Component, OnInit, OnDestroy, inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductService } from '../../core/services/product.service';
import { CartService } from '../../core/services/cart.service';
import { WishlistService } from '../../core/services/wishlist.service';
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
  date: string;
  helpful?: number;
  helpfulClicked?: boolean;
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
  // Services
  private route = inject(ActivatedRoute);
  private productService = inject(ProductService);
  private cartService = inject(CartService);
  private wishlistService = inject(WishlistService);
  private sanitizer = inject(DomSanitizer);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  // État
  product: Product | null = null;
  similarProducts: Product[] = [];
  quantity = 1;
  selectedImage = 0;
  loading = true;
  showReviewForm = false;
  newReview: Partial<Review> = { user: '', rating: 0, comment: '', date: '' };
  private allReviews: Review[] = [];
  private loadedReviewsCount = 0;
  private reviewsPerPage = 5;

  // Wishlist réactive
  isInWishlist = false;
  private wishlistSubscription: any;

  // === WISHLIST : DÉPLACÉE EN HAUT ===
  private updateWishlistStatus(): void {
    if (!this.product) return;
    const wishlistIds = this.wishlistService.getAllProductIds();
    this.isInWishlist = wishlistIds.includes(this.product.id);
    this.cdr.markForCheck();
  }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadProduct(+id);
    }

    // S'abonne à wishlist$
    this.wishlistSubscription = this.wishlistService.wishlist$.subscribe(ids => {
      if (this.product) {
        this.isInWishlist = ids.includes(this.product.id);
        this.cdr.markForCheck();
      }
    });

    // Synchronise si produit déjà chargé
    setTimeout(() => this.updateWishlistStatus(), 0);
  }

  ngOnDestroy() {
    this.wishlistSubscription?.unsubscribe();
  }

  // === WISHLIST ===
  toggleWishlist(): void {
    if (!this.product) return;
    if (!this.wishlistService.currentUserId) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
      return;
    }
    this.wishlistService.toggle(this.product);
  }

  // === CHARGEMENT PRODUIT ===
 loadProduct(id: number) {
  this.loading = true;
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

      // === AVIS RÉELS ===
      this.allReviews = this.product?.reviews || [];
      this.loadedReviewsCount = Math.min(this.reviewsPerPage, this.allReviews.length);
      (this.product as any).reviews = this.allReviews.slice(0, this.loadedReviewsCount);

      // Correction note globale
      if (!this.product?.rating?.rate || this.product.rating.count === 0) {
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
      this.cdr.markForCheck();
      this.updateWishlistStatus();
    },
    error: (error: any) => {
      console.error('Erreur chargement produit :', error);
      this.loading = false;
      this.cdr.markForCheck();
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
  loadSimilarProducts() {
    if (!this.product?.category) return;
    this.productService.searchProducts('', this.product.category).subscribe({
      next: (products: Product[]) => {
        this.similarProducts = products
          .filter((p: Product) => p.id !== this.product?.id)
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
  selectImage(index: number) {
    this.selectedImage = index;
  }
  onImageError(event: any): void {
    (event.target as HTMLImageElement).src = '/assets/fallback-image.jpg';
  }

  // === PANIER ===
  addToCart() {
    if (this.product && this.quantity > 0) {
      this.cartService.addToCart(this.product, this.quantity);
      alert(`${this.quantity} × ${this.product.title} ajouté(s) au panier !`);
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
    return this.calculateOverallRating(this.customerReviews);
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
    if (!reviews.length) return 0;
    const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    return Math.round(avg * 10) / 10;
  }
  get customerReviews(): Review[] {
    return (this.product as any)?.reviews || [];
  }
  get ratingBreakdown(): { stars: number; percentage: number }[] {
    const reviews = this.allReviews;
    if (!reviews.length) return [];
    const counts: { [key: number]: number } = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0};
    reviews.forEach(r => counts[r.rating]++);
    const total = reviews.length;
    return Object.entries(counts)
      .map(([starsStr, count]) => ({
        stars: +starsStr,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0
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

  // === FORMULAIRE AVIS ===
  openReviewModal(): void {
    this.showReviewForm = true;
    this.newReview = { user: '', rating: 0, comment: '', date: new Date().toISOString().slice(0, 10) };
  }
  setReviewRating(rating: number): void {
    this.newReview.rating = rating;
  }
  cancelReview(): void {
    this.showReviewForm = false;
    this.newReview = { user: '', rating: 0, comment: '', date: '' };
  }
  submitReview(): void {
    const user = this.newReview.user?.trim();
    const comment = this.newReview.comment?.trim();
    const rating = this.newReview.rating;
    if (user && comment && rating && rating > 0) {
      const fullReview: Review = {
        user,
        rating,
        comment,
        date: this.newReview.date || new Date().toISOString().slice(0, 10),
        helpful: 0,
        helpfulClicked: false
      };
      this.allReviews.unshift(fullReview);
      this.loadedReviewsCount = Math.min(this.allReviews.length, this.loadedReviewsCount + 1);
      (this.product as any).reviews = this.allReviews.slice(0, this.loadedReviewsCount);
      this.showReviewForm = false;
      this.newReview = { user: '', rating: 0, comment: '', date: '' };
      alert('Avis ajouté avec succès !');
      this.cdr.markForCheck();
    }
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

  // === SIMILAIRES ===
  onSimilarProductAddToCart(product: Product): void {
    this.cartService.addToCart(product, 1);
  }

  // === DESCRIPTION SÉCURISÉE ===
  get safeDescription(): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(this.product?.description || '');
  }
  get

 productSpecs(): Spec[] {
    return (this.product as any)?.specs || [];
  }

  // === OUT OF STOCK ===
  notifyWhenAvailable(): void {
    alert('Vous serez notifié dès le retour en stock !');
  }
}