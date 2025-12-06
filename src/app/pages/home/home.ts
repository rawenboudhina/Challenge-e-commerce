import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../services/product.service';
import { Product } from '../../models/product.model';
import { ProductCardComponent } from '../../shared/components/product-card/product-card';
import { CartService } from '../../services/cart.service';
import Swal from 'sweetalert2';
@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ProductCardComponent
  ],
  templateUrl: './home.html',
  styleUrls: ['./home.scss']
})
export class HomeComponent implements OnInit, OnDestroy {
  @ViewChild('searchInput') searchInput!: ElementRef;

  promotedProducts: Product[] = [];
  featuredProducts: Product[] = [];
  categories: any[] = [];
  loading = true;
  searchTerm = '';

  currentSlide = 0;
  private carouselInterval: any;

  constructor(
    private productService: ProductService,
    private cartService: CartService,
    private router: Router
  ) {}

ngOnInit(): void {
  this.categories = this.productService.categories;

  this.productService.getAllProducts(50).subscribe(products => {
    let strongPromo = products
      .filter(p => (p.discountPercentage ?? 0) > 15) 
      .sort((a, b) => (b.discountPercentage ?? 0) - (a.discountPercentage ?? 0))
      .slice(0, 6);

    if (strongPromo.length < 6) {
      const extras = products
        .filter(p => p.isNew && !strongPromo.find(s => s.id === p.id))
        .slice(0, 6 - strongPromo.length);
      strongPromo = [...strongPromo, ...extras];
    }

    if (strongPromo.length === 0) {
      strongPromo = products.slice(0, 6);
    }

    this.promotedProducts = strongPromo.length > 0 ? strongPromo : this.getFallbackProducts();
  });

  this.loadFeaturedProducts();
  this.startCarousel();
}

  ngOnDestroy(): void {
    if (this.carouselInterval) clearInterval(this.carouselInterval);
  }
  
  loadFeaturedProducts(): void {
    this.loading = true;
    this.productService.getAllProducts(12).subscribe({
      next: (products) => {
        this.featuredProducts = products;
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  startCarousel(): void {
    this.carouselInterval = setInterval(() => this.nextSlide(), 6000);
  }

  nextSlide(): void {
    this.currentSlide = (this.currentSlide + 1) % this.promotedProducts.length;
  }

  prevSlide(): void {
    this.currentSlide = this.currentSlide === 0
      ? this.promotedProducts.length - 1
      : this.currentSlide - 1;
  }

  goToSlide(index: number): void {
    this.currentSlide = index;
  }

  search(event: Event): void {
    event.preventDefault();
    if (this.searchTerm.trim()) {
      this.router.navigate(['/products'], {
        queryParams: { search: this.searchTerm.trim() }
      });
      this.searchTerm = '';
    }
  }

 onAddToCart(product: Product): void {
this.cartService.addToCart(product); // UN SEUL APPEL ICI  
  Swal.fire({
    title: `${product.title} ajouté au panier !`,
    icon: 'success',
    timer: 2000,
    showConfirmButton: false,
    position: 'top-end',
    toast: true
  });
}
trackByProductId(index: number, product: Product): number {
  return product.id;
}

  trackByCategory(index: number, category: any): string {
    return category.slug;
  }
  getCategoryIcon(slug: string): string {
    switch (slug) {
      case 'smartphones':
        return 'smartphone';
      case 'laptops':
        return 'laptop_mac';
      case 'womens-dresses':
        return 'checkroom';
      case 'mens-shirts':
        return 'man';
      case 'fragrances':
        return 'spa';
      case 'home-decoration':
        return 'home';
      case 'sports-accessories':
        return 'sports_soccer';
      case 'womens-jewellery':
        return 'auto_awesome';
      default:
        return 'category';
    }
  }
loadPromotedProducts(): void {
  this.productService.getAllProducts(50).subscribe(products => {
    let strongPromo = products
      .filter(p => (p.discountPercentage ?? 0) > 20) 
      .sort((a, b) => (b.discountPercentage ?? 0) - (a.discountPercentage ?? 0))
      .slice(0, 6);

    this.promotedProducts = strongPromo.length > 0 ? strongPromo : [{
      id: 999,
      title: "iPhone 16 Pro Max",
      price: 1299,
      description: "Le futur dans votre poche. Caméra 48MP, A18 Pro, batterie 2 jours.",
      image: "https://images.unsplash.com/photo-1592750475371-7a84eaa3e88b?w=800",
      discountPercentage: 25,
      isNew: true
    } as Product];
  });
}
private getFallbackProducts(): Product[] {
  return [
    {
      id: 999, title: "iPhone 16 Pro Max", price: 1299, discountPercentage: 25, isNew: true,
      image: "https://images.unsplash.com/photo-1592750475371-7a84eaa3e88b?w=800",
      description: "Caméra 48MP, A18 Pro, batterie 2 jours."
    },
    {
      id: 998, title: "Samsung Galaxy S25", price: 999, discountPercentage: 30, isNew: true,
      image: "https://images.unsplash.com/photo-1607938077363-2d2e0e0aca37?w=800",
      description: "Écran AMOLED 120Hz, IA intégrée."
    },
    {
      id: 997, title: "MacBook Air M3", price: 1199, discountPercentage: 20,
      image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800",
      description: "Léger, puissant, 18h d'autonomie."
    },
    {
      id: 996, title: "AirPods Pro 2", price: 279, discountPercentage: 35,
      image: "https://images.unsplash.com/photo-1606843050554-2eb1f75cea2c?w=800",
      description: "Réduction de bruit active, son spatial."
    },
    {
      id: 995, title: "PS5 Pro", price: 699, discountPercentage: 15, isNew: true,
      image: "https://images.unsplash.com/photo-1606149059548-87b70f0e9f1e?w=800",
      description: "4K 120FPS, ray tracing."
    },
    {
      id: 994, title: "Nintendo Switch 2", price: 399, discountPercentage: 10, isNew: true,
      image: "https://images.unsplash.com/photo-1571415073823-3e3c9c1e0945?w=800",
      description: "Hybride, 4K docké, Joy-Con 2."
    }
  ] as Product[];
}
getOriginalPrice(product: any): number {
  if (!product.discountPercentage) return product.price;
  return Math.round(product.price * 10000 / (100 - product.discountPercentage)) / 100;
}
}
