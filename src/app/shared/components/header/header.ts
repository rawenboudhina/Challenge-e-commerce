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
  styleUrls: ['./header.scss'],
})
export class HeaderComponent implements OnInit {
  cartItemCount = 0;
  isAuthenticated = false;
  currentUser: any = null;
  searchQuery = '';
  categories: string[] = [];
  isMenuOpen = false;
  isScrolled = false;
  isDesktop = window.innerWidth >= 769;
  isMobile = window.innerWidth <= 768;

  @HostListener('window:resize')
  onResize() {
    this.isDesktop = window.innerWidth >= 769;
    this.isMobile = window.innerWidth <= 768;
    if (this.isDesktop && this.isMenuOpen) this.isMenuOpen = false;
  }

  @HostListener('window:scroll')
  onScroll() {
    this.isScrolled = window.scrollY > 20;
  }

  closeMenu() { this.isMenuOpen = false; }

  constructor(
    private cartService: CartService,
    private authService: AuthService,
    private productService: ProductService,
    private router: Router
  ) {}

  ngOnInit() {
    this.cartService.cart$.subscribe(() => this.cartItemCount = this.cartService.getItemCount());
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      this.isAuthenticated = !!user;
    });
    this.productService.getCategories().subscribe(cats => this.categories = cats.slice(0, 6));
  }

  onSearch() {
    if (this.searchQuery.trim()) {
      this.router.navigate(['/products'], { queryParams: { search: this.searchQuery } });
      this.searchQuery = '';
      this.closeMenu();
    }
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/']);
    this.closeMenu();
  }

  toggleMenu() { this.isMenuOpen = !this.isMenuOpen; }

  formatCategory(slug: string): string {
    return slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }
}