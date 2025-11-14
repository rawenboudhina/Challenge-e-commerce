// src/app/core/services/cart.service.ts
import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, of, forkJoin, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Product, CartItem } from '../models/product.model';
import { AuthService } from './auth.service';
import { HttpClient } from '@angular/common/http';
import { switchMap, map } from 'rxjs/operators';

interface CartResponse {
  id: number;
  userId: number;
  items: { productId: number; quantity: number }[];
}

@Injectable({
  providedIn: 'root'
})
export class CartService implements OnDestroy {
  private apiUrl = 'http://localhost:3000';
  private cartItems: CartItem[] = [];
  private cartSubject = new BehaviorSubject<CartItem[]>([]);
  public cart$: Observable<CartItem[]> = this.cartSubject.asObservable();
  private localCartKey = 'temp_cart';
  private isLoadingCart = false;
  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private http: HttpClient
  ) {
    console.log('CartService INSTANCIÉ !', this);
    this.initCart();
  }

  private initCart(): void {
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        if (user) {
          this.loadUserCart(user.id);
        } else {
          this.loadLocalCart();
        }
      });
  }

  private loadLocalCart(): void {
    const saved = localStorage.getItem(this.localCartKey);
    this.cartItems = saved ? JSON.parse(saved) : [];
    this.cartSubject.next([...this.cartItems]);
  }

  private saveLocalCart(): void {
    localStorage.setItem(this.localCartKey, JSON.stringify(this.cartItems));
    this.cartSubject.next([...this.cartItems]);
  }

  private fetchProductsForCart(cart: CartResponse): Observable<CartItem[]> {
    if (cart.items.length === 0) return of([]);

    const requests = cart.items.map(item =>
      this.http.get<Product>(`${this.apiUrl}/products/${item.productId}`).pipe(
        map(product => ({ product, quantity: item.quantity }))
      )
    );

    return forkJoin(requests).pipe(
      map(fetchedItems => {
        this.cartItems = [];
        fetchedItems.forEach(({ product, quantity }) => {
          const existing = this.cartItems.find(i => i.product.id === product.id);
          if (existing) {
            existing.quantity += quantity;
          } else {
            this.cartItems.push({ product, quantity });
          }
        });
        return this.cartItems;
      })
    );
  }

  private loadUserCart(userId: number): void {
    if (this.isLoadingCart) return;
    this.isLoadingCart = true;

    this.http.get<CartResponse[]>(`${this.apiUrl}/carts?userId=${userId}`).pipe(
      switchMap(carts => {
        if (carts.length > 0) {
          return this.fetchProductsForCart(carts[0]);
        }
        return this.http.post<CartResponse>(`${this.apiUrl}/carts`, { userId, items: [] }).pipe(
          switchMap(newCart => this.fetchProductsForCart(newCart))
        );
      })
    ).subscribe({
      next: (items) => {
        this.cartItems = items;
        this.cartSubject.next([...this.cartItems]);
        this.isLoadingCart = false;
      },
      error: () => {
        this.isLoadingCart = false;
      }
    });
  }

private lastAddTime = new Map<number, number>(); // par produit

addToCart(product: Product, quantity: number = 1): void {
  const now = Date.now();
  const lastTime = this.lastAddTime.get(product.id) || 0;

  if (now - lastTime < 500) {
    console.warn('Double ajout détecté, ignoré pour', product.title);
    return;
  }

  this.lastAddTime.set(product.id, now);

  if (this.isLoadingCart) return;

  const existingItem = this.cartItems.find(item => item.product.id === product.id);
  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    this.cartItems.push({ product, quantity });
  }

  this.cartSubject.next([...this.cartItems]);

  if (this.authService.isAuthenticated()) {
    this.saveUserCart();
  } else {
    this.saveLocalCart();
  }
}

  private saveUserCart(): void {
    const user = this.authService.getCurrentUser();
    if (!user) return;

    this.http.get<CartResponse[]>(`${this.apiUrl}/carts?userId=${user.id}`).pipe(
      switchMap(carts => {
        const items = this.cartItems.map(item => ({
          productId: item.product.id,
          quantity: item.quantity
        }));
        if (carts.length > 0) {
          return this.http.patch<CartResponse>(`${this.apiUrl}/carts/${carts[0].id}`, { items });
        } else {
          return this.http.post<CartResponse>(`${this.apiUrl}/carts`, {
            userId: user.id,
            items
          });
        }
      })
    ).subscribe(() => {
      this.cartSubject.next([...this.cartItems]);
    });
  }

  removeFromCart(productId: number): void {
    this.cartItems = this.cartItems.filter(item => item.product.id !== productId);
    this.authService.isAuthenticated() ? this.saveUserCart() : this.saveLocalCart();
  }

  updateQuantity(productId: number, quantity: number): void {
    const item = this.cartItems.find(item => item.product.id === productId);
    if (item) {
      item.quantity = quantity;
      if (quantity <= 0) {
        this.removeFromCart(productId);
      } else {
        this.authService.isAuthenticated() ? this.saveUserCart() : this.saveLocalCart();
      }
    }
  }

  clearCart(): void {
    this.cartItems = [];
    if (this.authService.isAuthenticated()) {
      const user = this.authService.getCurrentUser();
      if (user) {
        this.http.get<CartResponse[]>(`${this.apiUrl}/carts?userId=${user.id}`).subscribe(carts => {
          if (carts.length > 0) {
            this.http.patch(`${this.apiUrl}/carts/${carts[0].id}`, { items: [] }).subscribe();
          }
        });
      }
    } else {
      localStorage.removeItem(this.localCartKey);
    }
    this.cartSubject.next([...this.cartItems]);
  }

  mergeLocalCartOnLogin(): void {
    const localCartJson = localStorage.getItem(this.localCartKey);
    if (!localCartJson || !this.authService.isAuthenticated()) return;

    let localCart: CartItem[];
    try {
      localCart = JSON.parse(localCartJson);
    } catch (e) {
      localStorage.removeItem(this.localCartKey);
      return;
    }

    if (localCart.length === 0) {
      localStorage.removeItem(this.localCartKey);
      return;
    }

    let hasChanges = false;
    localCart.forEach(localItem => {
      const existingItem = this.cartItems.find(item => item.product.id === localItem.product.id);
      if (existingItem) {
        existingItem.quantity += localItem.quantity;
        hasChanges = true;
      } else {
        this.cartItems.push({ ...localItem });
        hasChanges = true;
      }
    });

    if (hasChanges) {
      this.saveUserCart();
      this.cartSubject.next([...this.cartItems]);
    }
    localStorage.removeItem(this.localCartKey);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  // Ajoute ça dans ton CartService (n'importe où dans la classe)

public getItemCount(): number {
  return this.cartItems.reduce((count, item) => count + item.quantity, 0);
}

public getTotal(): number {
  return this.cartItems.reduce((total, item) => total + (item.product.price * item.quantity), 0);
}
}