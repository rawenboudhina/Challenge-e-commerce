import { Component, OnInit, OnDestroy, HostListener, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { CartService } from '../../../services/cart.service';
import { AuthService } from '../../../services/auth.service';
import { ProductService } from '../../../services/product.service';
import { FormsModule } from '@angular/forms';
import { trigger, transition, style, animate } from '@angular/animations';
import { debounceTime, distinctUntilChanged, switchMap, catchError } from 'rxjs/operators';
import { Subject, of } from 'rxjs';
import { Category } from '../../../models/category.model';
@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './header.html',
  styleUrls: ['./header.scss'],
  animations: [
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.95)' }),
        animate('200ms ease-out', style({ opacity: 1, transform: 'scale(1)' }))
      ]),
      transition(':leave', [
        animate('150ms ease-in', style({ opacity: 0, transform: 'scale(0.95)' }))
      ])
    ])
  ]
})
export class HeaderComponent implements OnInit, OnDestroy {
  // États existants
  cartItemCount = 0;
  isAuthenticated = false;
  currentUser: any = null;
  // categories: string[] = [];
  categories: any[] = []; // Changé de string[] à any[] (ou interface Category)
  isMenuOpen = false;
  isScrolled = false;
  isDesktop = window.innerWidth >= 769;
  isMobile = window.innerWidth <= 768;

  // Panier
  showCartDropdown = false;
  cartItems: any[] = [];
  cartTotal = 0;
  private cartSubscription: any;

  // Recherche
  searchQuery = '';
  searchResults: any[] = [];
  showSearchDropdown = false;
  private searchTerms = new Subject<string>();
  @ViewChild('searchInput') searchInput!: ElementRef;

  // Profil
  showUserDropdown = false;

  constructor(
    private cartService: CartService,
    private authService: AuthService,
    private productService: ProductService,
  
    private router: Router
  ) {}

  ngOnInit() {
    // Panier
    this.cartSubscription = this.cartService.cart$.subscribe(() => {
      this.cartItemCount = this.cartService.getItemCount();
      this.updateMiniCart();
    });

    // Auth
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      this.isAuthenticated = !!user;
    });

    // Catégories
  /*   this.productService.getCategories().subscribe(cats => {
      this.categories = cats;;
    }); */
    // Dans ngOnInit
this.productService.getCategoryList().subscribe(cats => {
  this.categories = cats;
});
    this.productService.getCategoryList().subscribe(cats => {
      this.categories = cats; // ← 8 objets complets
    });

    // Recherche
    this.searchTerms.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(term => {
        const trimmed = term.trim();
        return trimmed ? this.productService.searchProducts(trimmed) : of([]);
      }),
      catchError(() => of([]))
    ).subscribe(results => {
      this.searchResults = results.slice(0, 8);
      this.showSearchDropdown = !!this.searchResults.length && !!this.searchQuery.trim();
    });
  }

  ngOnDestroy() {
    this.cartSubscription?.unsubscribe();
  }

  // === RECHERCHE ===
  onSearchInput() {
    this.searchTerms.next(this.searchQuery);
  }

  onSearch() {
    const q = this.searchQuery.trim();
    if (!q) return;
    this.router.navigate(['/products'], { queryParams: { search: q } });
    this.clearSearch();
  }

  goToProduct(id: number) {
    this.router.navigate(['/product', id]);
    this.clearSearch();
  }

  clearSearch() {
    this.searchQuery = '';
    this.searchResults = [];
    this.showSearchDropdown = false;
    setTimeout(() => this.searchInput?.nativeElement.focus(), 0);
  }

  // === UI ===
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

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    const target = event.target as HTMLElement;

    // Fermer recherche si clic hors zone
    if (!target.closest('.search-bar') && !target.closest('.mobile-search')) {
      this.showSearchDropdown = false;
    }

    // Fermer panier si clic hors conteneur
    if (!target.closest('.cart-container')) {
      this.showCartDropdown = false;
    }

    // Fermer profil si clic hors conteneur
    if (!target.closest('.user-container')) {
      this.showUserDropdown = false;
    }
  }

  @HostListener('document:keydown.escape')
  onEscape() {
    this.showSearchDropdown = false;
    this.showCartDropdown = false;
    this.showUserDropdown = false;
    this.clearSearch();
  }

  // === PANIER ===
  toggleCartDropdown(event: Event) {
    event.stopPropagation();
    this.showCartDropdown = !this.showCartDropdown;
  }

  updateMiniCart() {
    // this.cartItems = this.cartService.getItems(); // Décommentez si besoin
    this.cartTotal = this.cartService.getTotal();
  }

  removeFromCart(id: number) {
    this.cartService.removeFromCart(id);
  }

  // === PROFIL ===
  toggleUserDropdown(event: Event) {
    event.stopPropagation();
    this.showUserDropdown = !this.showUserDropdown;
    if (this.isMobile && this.isMenuOpen) {
      this.closeMenu();
    }
  }

  closeUserDropdown() {
    this.showUserDropdown = false;
  }

  // === MENU MOBILE ===
  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  closeMenu() {
    this.isMenuOpen = false;
    this.showCartDropdown = false;
    this.showUserDropdown = false;
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/']);
    this.closeMenu();
  }

formatCategory(category: Category): string {
  return category.name;
}

// Ajoute une fonction pour le slug (plus propre)
getCategorySlug(category: Category): string {
  return category.slug || category.name.toLowerCase().replace(/\s+/g, '-');
}

}