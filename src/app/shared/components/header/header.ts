import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { CartService } from '../../../core/services/cart';
import { AuthService } from '../../../core/services/auth';
import { ProductService } from '../../../core/services/product';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class HeaderComponent implements OnInit {
  cartItemCount = 0;
  isAuthenticated = false;
  currentUser: any = null;
  searchQuery = '';
  categories: string[] = [];
  isMenuOpen = false;

  // DÉCLARATIONS OBLIGATOIRES
  isMobile = false;
  isScrolled = false;

  constructor(
    private cartService: CartService,
    private authService: AuthService,
    private productService: ProductService,
    private router: Router
  ) {}

  ngOnInit() {
    this.cartService.cart$.subscribe(() => {
      this.cartItemCount = this.cartService.getItemCount();
    });

    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      this.isAuthenticated = !!user;
    });

    this.productService.getCategories().subscribe(cats => {
      this.categories = cats.slice(0, 6);
    });

    // Initialisation mobile
    this.isMobile = window.innerWidth <= 768;
  }

  onSearch() {
    if (this.searchQuery.trim()) {
      this.router.navigate(['/products'], { 
        queryParams: { search: this.searchQuery } 
      });
    }
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/']);
  }

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  // DÉTECTION SCROLL & RESIZE
  @HostListener('window:scroll')
  onScroll() {
    this.isScrolled = window.scrollY > 20;
  }

  @HostListener('window:resize')
  onResize() {
    this.isMobile = window.innerWidth <= 768;
    if (this.isMobile && this.isMenuOpen) {
      this.isMenuOpen = false;
    }
  }

  // Formatage des catégories
  formatCategory(slug: string): string {
    return slug
      .replace(/-/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  }
}