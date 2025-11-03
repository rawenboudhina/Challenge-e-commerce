import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ProductService } from '../../core/services/product';
import { Product } from '../../core/models/product.model';
import { ProductCardComponent } from '../../shared/components/product-card/product-card';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, ProductCardComponent],
  templateUrl: './home.html',
  styleUrls: ['./home.scss']
})
export class HomeComponent implements OnInit, OnDestroy {
  featuredProducts: Product[] = [];
  laptops: Product[] = [];
  smartphones: Product[] = [];
  tablets: Product[] = [];
  accessories: Product[] = [];
  loading = true;
  currentSlide = 0;
  private carouselInterval: any;

  // Catégories Tech - 5 catégories minimum
  techCategories = [
    {
      name: 'Laptops',
      slug: 'laptops',
      icon: '💻',
      color: '#3b82f6',
      image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=500&h=500&fit=crop',
      description: 'High-performance laptops'
    },
    {
      name: 'Smartphones',
      slug: 'smartphones',
      icon: '📱',
      color: '#8b5cf6',
      image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500&h=500&fit=crop',
      description: 'Latest smartphones'
    },
    {
      name: 'Tablets',
      slug: 'tablets',
      icon: '📲',
      color: '#ec4899',
      image: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=500&h=500&fit=crop',
      description: 'Powerful tablets'
    },
    {
      name: 'Headphones',
      slug: 'mobile-accessories',
      icon: '🎧',
      color: '#10b981',
      image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&h=500&fit=crop',
      description: 'Premium audio'
    },
    {
      name: 'Smart Devices',
      slug: 'mobile-accessories',
      icon: '⌚',
      color: '#f59e0b',
      image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&h=500&fit=crop',
      description: 'Connected tech'
    }
  ];

  // Banners avec images tech attractives
  banners = [
    {
      title: 'Ultra-Powerful Laptops',
      subtitle: 'Performance Unleashed',
      description: 'Experience the ultimate computing power for creators and professionals',
      image: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=1920&h=800&fit=crop',
      cta: 'Shop Now',
      gradient: 'linear-gradient(135deg, rgba(37, 99, 235, 0.85), rgba(59, 130, 246, 0.65))'
    },
    {
      title: 'Next-Gen Smartphones',
      subtitle: 'Innovation in Your Hands',
      description: 'Discover cutting-edge mobile technology that redefines excellence',
      image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=1920&h=800&fit=crop',
      cta: 'Explore',
      gradient: 'linear-gradient(135deg, rgba(139, 92, 246, 0.85), rgba(168, 85, 247, 0.65))'
    },
    {
      title: 'Premium Audio Experience',
      subtitle: 'Sound Perfection',
      description: 'Immerse yourself in crystal-clear audio with advanced noise cancellation',
      image: 'https://images.unsplash.com/photo-1545127398-14699f92334b?w=1920&h=800&fit=crop',
      cta: 'Discover',
      gradient: 'linear-gradient(135deg, rgba(236, 72, 153, 0.85), rgba(251, 113, 133, 0.65))'
    },
    {
      title: 'Smart Technology',
      subtitle: 'Connected Life',
      description: 'Stay connected with intelligent devices that enhance your lifestyle',
      image: 'https://images.unsplash.com/photo-1519558260268-cde7e03a0152?w=1920&h=800&fit=crop',
      cta: 'Learn More',
      gradient: 'linear-gradient(135deg, rgba(16, 185, 129, 0.85), rgba(5, 150, 105, 0.65))'
    }
  ];
  constructor(private productService: ProductService) {}
  ngOnInit() {
    this.loadFeaturedProducts();
    this.loadCategoryProducts();
    this.startCarousel();
  }
  ngOnDestroy() {
    if (this.carouselInterval) {
      clearInterval(this.carouselInterval);
    }
  }
  loadFeaturedProducts() {
    this.loading = true;
    // Charger 12 produits pour avoir 4x3 en grid
    this.productService.getAllProducts(12).subscribe({
      next: (products) => {
        this.featuredProducts = products;
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des produits', error);
        this.loading = false;
      }
    });
  }
  loadCategoryProducts() {
    // Laptops - 4 produits
    this.productService.getProductsByCategory('laptops').subscribe({
      next: (products) => {
        this.laptops = products.slice(0, 4);
      }
    });
    // Smartphones - 4 produits
    this.productService.getProductsByCategory('smartphones').subscribe({
      next: (products) => {
        this.smartphones = products.slice(0, 4);
      }
    });
    // Tablets - 4 produits
    this.productService.getProductsByCategory('tablets').subscribe({
      next: (products) => {
        this.tablets = products.slice(0, 4);
      }
    });
    // Accessories - 4 produits
    this.productService.getProductsByCategory('mobile-accessories').subscribe({
      next: (products) => {
        this.accessories = products.slice(0, 4);
      }
    });
  }
  startCarousel() {
    this.carouselInterval = setInterval(() => {
      this.nextSlide();
    }, 6000); // 6 secondes au lieu de 5
  }
  nextSlide() {
    this.currentSlide = (this.currentSlide + 1) % this.banners.length;
  }
  prevSlide() {
    this.currentSlide = this.currentSlide === 0 ? this.banners.length - 1 : this.currentSlide - 1;
  }
  goToSlide(index: number) {
    this.currentSlide = index;
  }
  // Dans home.ts, ajoutez cette méthode dans la classe HomeComponent :
  trackByProductId(index: number, product: any): number {
    return product.id;
  }
}