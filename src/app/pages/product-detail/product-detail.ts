import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ProductService } from '../../core/services/product';
import { CartService } from '../../core/services/cart';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductCardComponent } from '../../shared/components/product-card/product-card';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Product } from '../../core/models/product.model';
import { Router } from '@angular/router';

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
  imports: [
    CommonModule,
    FormsModule,
    ProductCardComponent,
  ],
  templateUrl: './product-detail.html',
  styleUrls: ['./product-detail.scss']
})
export class ProductDetailComponent implements OnInit {
  product: Product | null = null;
  similarProducts: Product[] = [];
  quantity = 1;
  selectedImage = 0;
  loading = true;
  showReviewForm = false;
  newReview: Partial<Review> = { user: '', rating: 0, comment: '', date: '' };
  private allReviews: Review[] = []; // Toutes les avis pour pagination
  private loadedReviewsCount = 0;
  private reviewsPerPage = 5; // Augmenté à 5 pour plus de variété initiale

  constructor(
    private route: ActivatedRoute,
    private productService: ProductService,
    public cartService: CartService,
    private sanitizer: DomSanitizer,
    private router: Router
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadProduct(+id);
    }
  }

  decreaseQuantity(): void {
    this.quantity = Math.max(1, this.quantity - 1);
  }

  increaseQuantity(): void {
    if (this.product) {
      this.quantity = Math.min(this.getProductStock(), this.quantity + 1);
    }
  }

  validateQuantity(): void {
    if (this.quantity < 1) {
      this.quantity = 1;
    } else if (this.product && this.quantity > this.getProductStock()) {
      this.quantity = this.getProductStock();
    }
    this.quantity = Math.floor(this.quantity);
  }

  getProductStock(): number {
    return this.product?.stock ?? 0;
  }

  loadProduct(id: number) {
    this.loading = true;
    this.productService.getProductById(id).subscribe({
      next: (product: Product) => {
        console.log('Produit chargé :', product);
        const enhancedProduct = {
          ...product,
          // Specs maintenant dynamiques depuis l'API ; supprimer les hardcoded si l'API les fournit
          specs: (product as any).specs || [], // Assumer que l'API fournit les specs
        };
        this.product = enhancedProduct;
        this.selectedImage = 0;
        let images = (product as any).images || [product.image || '/assets/fallback.jpg'];
        if (images.length < 3) {
          const main = images[0];
          images = [...images, main, main].slice(0, 3);
        }
        (this.product as any).images = images;

        // Initialiser les avis (simuler une liste plus grande pour pagination)
        this.allReviews = (product as any).reviews || [
          { user: 'Jean D.', rating: 5, comment: 'Excellent produit !', date: '2025-10-15', helpful: 3, helpfulClicked: false },
          { user: 'Marie L.', rating: 4, comment: 'Bonne qualité.', date: '2025-10-10', helpful: 1, helpfulClicked: false },
          { user: 'Paul M.', rating: 5, comment: 'Parfait !', date: '2025-10-05', helpful: 2, helpfulClicked: false },
          { user: 'Sophie K.', rating: 3, comment: 'Correct, mais pourrait être mieux.', date: '2025-10-01', helpful: 0, helpfulClicked: false },
          { user: 'Luc T.', rating: 5, comment: 'Super rapport qualité-prix.', date: '2025-09-28', helpful: 4, helpfulClicked: false },
          { user: 'Anna R.', rating: 2, comment: 'Déçu par la durabilité.', date: '2025-09-25', helpful: 1, helpfulClicked: false },
          { user: 'Marc B.', rating: 4, comment: 'Fonctionne bien au quotidien.', date: '2025-09-20', helpful: 2, helpfulClicked: false },
          { user: 'Eva S.', rating: 5, comment: 'Recommandé à 100%.', date: '2025-09-15', helpful: 5, helpfulClicked: false }
        ] as Review[];
        this.loadedReviewsCount = this.reviewsPerPage;
        (this.product as any).reviews = this.allReviews.slice(0, this.reviewsPerPage);

        // Calculer la note globale à partir des avis (si pas fournie par API)
        if (!this.product?.rating?.rate) {
          this.product = {
            ...this.product,
            rating: { rate: this.calculateOverallRating(this.allReviews), count: this.allReviews.length }
          } as any;
        }

        this.loadSimilarProducts();
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Erreur chargement produit :', error);
        this.loading = false;
      }
    });
  }

  // Nouveau : Calcul de la note moyenne
  private calculateOverallRating(reviews: Review[]): number {
    if (!reviews.length) return 0;
    const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    return Math.round(avg * 10) / 10; // Arrondi à 1 décimale (ex. 4.5)
  }

  loadSimilarProducts() {
    if (!this.product?.category) return;
    this.productService.searchProducts('', this.product.category).subscribe({
      next: (products: Product[]) => {
        this.similarProducts = products
          .filter((p: Product) => p.id !== this.product?.id)
          .slice(0, 4);
      },
      error: (error: any) => {
        console.error('Erreur similaires :', error);
      }
    });
  }

  selectImage(index: number) {
    this.selectedImage = index;
  }

  addToCart() {
    if (this.product && this.quantity > 0) {
      this.cartService.addToCart(this.product, this.quantity);
      alert(`${this.quantity} × ${this.product.title} ajouté(s) au panier !`);
    }
  }

  get inStock(): boolean {
    return this.getProductStock() > 0;
  }

  get stockText(): string {
    const stock = this.getProductStock();
    return stock > 0 ? `En stock (${stock} disponibles)` : 'Rupture de stock';
  }

  get ratingStars(): number[] {
    const rating = this.product?.rating?.rate || 0;
    return Array(5).fill(0).map((_, i) =>
      i < Math.floor(rating) ? 1 : i < rating ? 0.5 : 0
    );
  }

  get safeDescription(): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(this.product?.description || '');
  }

  get originalPrice(): number {
    if (this.product?.discountPercentage && this.product.discountPercentage > 0) {
      return Math.round(this.product.price / (1 - this.product.discountPercentage / 100));
    }
    return this.product?.price || 0;
  }

  get savings(): number {
    return this.originalPrice - (this.product?.price || 0);
  }

  get productSpecs(): Spec[] {
    return (this.product as any)?.specs || [];
  }

  get customerReviews(): Review[] {
    return (this.product as any)?.reviews || [];
  }

  // Getter pour note overall (utilise la moyenne calculée)
  get overallRating(): number {
    return this.calculateOverallRating(this.customerReviews);
  }

  get overallRatingStars(): number[] {
    const rating = this.overallRating;
    return Array(5).fill(0).map((_, i) =>
      i < Math.floor(rating) ? 1 : i < rating ? 0.5 : 0
    );
  }

  // Nouveau : Mini-étoiles pour labels de breakdown
  getMiniStars(stars: number): number[] {
    return Array(5).fill(0).map((_, i) => i < stars ? 1 : 0);
  }

  // Mise à jour de ratingBreakdown pour utiliser tous les avis (pas que loaded)
  get ratingBreakdown(): { stars: number; percentage: number }[] {
    const reviews = this.allReviews; // Utilise TOUS les avis pour breakdown complet
    if (!reviews.length) return [];
    const counts: { [key: number]: number } = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0};
    reviews.forEach(r => counts[r.rating]++);
    const total = reviews.length;
    return Object.entries(counts)
      .map(([starsStr, count]) => ({
        stars: +starsStr,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0
      }))
      .reverse(); // 5 étoiles en premier
  }

  onImageError(event: any): void {
    (event.target as HTMLImageElement).src = '/assets/fallback-image.jpg';
  }

  toggleWishlist(): void {
    console.log('Toggle wishlist for', this.product?.title);
  }

  get isInWishlist(): boolean {
    return false;
  }

  notifyWhenAvailable(): void {
    alert('Notification configurée pour restock !');
  }

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
    const user = this.newReview.user ?? '';
    const comment = this.newReview.comment ?? '';
    const rating = this.newReview.rating ?? 0;
    if (user && comment && rating > 0) {
      const fullReview: Review = {
        ...this.newReview as Review,
        user,
        comment,
        rating,
        helpful: 0,
        helpfulClicked: false
      };
      this.allReviews.unshift(fullReview); // Ajouter au début
      this.loadedReviewsCount = Math.min(this.allReviews.length, this.loadedReviewsCount + 1);
      (this.product as any).reviews = this.allReviews.slice(0, this.loadedReviewsCount);
      this.showReviewForm = false;
      this.newReview = { user: '', rating: 0, comment: '', date: '' };
      alert('Avis ajouté avec succès !');
    }
  }

  markHelpful(review: Review): void {
    if (!review.helpfulClicked) {
      review.helpful = (review.helpful ?? 0) + 1;
      review.helpfulClicked = true;
    }
  }

  loadMoreReviews(): void {
    this.loadedReviewsCount += this.reviewsPerPage;
    (this.product as any).reviews = this.allReviews.slice(0, this.loadedReviewsCount);
  }

  get hasMoreReviews(): boolean {
    return this.loadedReviewsCount < this.allReviews.length;
  }

  onSimilarProductAddToCart(product: Product): void {
    this.cartService.addToCart(product, 1);
  }

  getStarsForReview(rating: number): number[] {
    return Array(5).fill(0).map((_, i) => i < rating ? 1 : 0);
  }
}