import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductCardComponent } from '../../shared/components/product-card/product-card';
import { ProductService } from '../../core/services/product';
import { CartService } from '../../core/services/cart.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Product } from '../../core/models/product.model';

interface Filters {
  category: string;
  minPrice: number;
  maxPrice: number;
  minRating: number;
  sort: string;
  search: string;
}

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, FormsModule, ProductCardComponent],
  templateUrl: './products.html',
  styleUrls: ['./products.scss']
})
export class Products implements OnInit {
  products: Product[] = [];
  filteredProducts: Product[] = [];
  paginatedProducts: Product[] = [];
  categories: string[] = [];
  loading = true;
  currentPage = 1;
  itemsPerPage = 20;
  totalPages = 0;
  totalProducts = 0;

  filters: Filters = {
    category: '',
    minPrice: 0,
    maxPrice: 999,
    minRating: 0,
    sort: 'newest',
    search: ''
  };

  constructor(
    private productService: ProductService,
    private cartService: CartService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadCategories();
    this.loadProducts();
    this.route.queryParams.subscribe(params => {
      // Charger filtres depuis query params si présents
      this.filters.category = params['category'] || '';
      this.filters.search = params['search'] || ''; // Si recherche depuis header
      this.applyFilters();
    });
  }

  loadCategories() {
    this.productService.getCategories().subscribe(cats => {
      this.categories = cats;
    });
  }

  loadProducts() {
    this.loading = true;
    this.productService.getAllProducts(100).subscribe({
      next: (products: Product[]) => {
        this.products = products; // Assume au moins 20
        this.totalProducts = products.length;
        this.applyFilters();
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Erreur chargement produits:', error);
        this.loading = false;
      }
    });
  }

  applyFilters() {
    let filtered = [...this.products];

    // Filtre catégorie
    if (this.filters.category) {
      filtered = filtered.filter(p => p.category === this.filters.category);
    }

    // Filtre prix
    filtered = filtered.filter(p => 
      p.price >= this.filters.minPrice && p.price <= this.filters.maxPrice
    );

    // Filtre note
    filtered = filtered.filter(p => 
      (p.rating?.rate || 0) >= this.filters.minRating
    );

    // Recherche si présente
    if (this.filters.search) {
      filtered = filtered.filter(p => 
        p.title.toLowerCase().includes(this.filters.search.toLowerCase())
      );
    }

    // Tri
    filtered = this.sortProducts(filtered, this.filters.sort);

    this.filteredProducts = filtered;
    this.totalPages = Math.ceil(filtered.length / this.itemsPerPage);
    this.currentPage = 1; // Reset page
    this.updatePagination();
  }

  sortProducts(products: Product[], sortBy: string): Product[] {
    return [...products].sort((a, b) => {
      switch (sortBy) {
        case 'price-asc':
          return a.price - b.price;
        case 'price-desc':
          return b.price - a.price;
        case 'popularity':
          return (b.rating?.count || 0) - (a.rating?.count || 0);
        case 'newest':
          return (b.id || 0) - (a.id || 0); // Proxy par ID (plus grand = plus récent)
        default:
          return 0;
      }
    });
  }

  updatePagination() {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    this.paginatedProducts = this.filteredProducts.slice(start, start + this.itemsPerPage);
  }

  changePage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePagination();
      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  get pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  onProductAddToCart(product: Product) {
    this.cartService.addToCart(product, 1);
  }

  // Form events
  onFilterChange() {
    this.applyFilters();
    this.updateUrl();
  }

  resetFilters() {
    this.filters = { category: '', minPrice: 0, maxPrice: 999, minRating: 0, sort: 'newest', search: '' };
    this.applyFilters();
    this.updateUrl();
  }

  private updateUrl() {
    this.router.navigate(['/products'], {
      queryParams: {
        category: this.filters.category || null,
        search: this.filters.search || null,
        minPrice: this.filters.minPrice > 0 ? this.filters.minPrice : null,
        maxPrice: this.filters.maxPrice < 999 ? this.filters.maxPrice : null,
        minRating: this.filters.minRating > 0 ? this.filters.minRating : null,
        sort: this.filters.sort !== 'newest' ? this.filters.sort : null
      },
      queryParamsHandling: 'merge'
    });
  }

  formatCategory(slug: string): string {
    return slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }
}