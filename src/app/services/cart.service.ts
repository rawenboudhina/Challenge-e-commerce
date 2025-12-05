// src/app/services/cart.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, forkJoin } from 'rxjs';
import { Product, CartItem } from '../models/product.model';
import { AuthService } from './auth.service';
import { HttpClient } from '@angular/common/http';
import { ProductService } from './product.service';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private apiUrl = 'http://localhost:5000/api/cart';
  private cartItems: CartItem[] = [];
  private cartSubject = new BehaviorSubject<CartItem[]>([]);
  public cart$ = this.cartSubject.asObservable();

  constructor(
    private authService: AuthService,
    private http: HttpClient,
    private productService: ProductService
  ) {
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.loadCartFromServer();
      } else {
        this.loadLocalCart();
      }
    });
  }

  private loadCartFromServer(): void {
    this.http.get<any>(this.apiUrl).subscribe({
      next: (res) => this.enrichFromServer(res),
      error: () => {
        this.cartItems = [];
        this.cartSubject.next([]);
      }
    });
  }

  private loadLocalCart(): void {
    const saved = localStorage.getItem('temp_cart');
    this.cartItems = saved ? JSON.parse(saved) : [];
    this.cartSubject.next([...this.cartItems]);
  }

  private saveLocalCart(): void {
    localStorage.setItem('temp_cart', JSON.stringify(this.cartItems));
  }

  // UTILISE TOUJOURS LA RÉPONSE DU SERVEUR — JAMAIS loadCartFromServer()
  private syncCartFromResponse(res: any): void {
    this.enrichFromServer(res);
  }

  private enrichFromServer(res: any): void {
    const items: { id: number; quantity: number }[] = (res?.items || []).map((i: any) => ({
      id: Number(i.productId),
      quantity: Number(i.quantity)
    }));
    if (items.length === 0) {
      this.cartItems = [];
      this.cartSubject.next([]);
      return;
    }
    forkJoin<Product[]>(items.map((it: { id: number; quantity: number }) => this.productService.getProductById(it.id)))
      .subscribe((products: Product[]) => {
        this.cartItems = products.map((p: Product, idx: number) => ({
          product: p,
          quantity: items[idx].quantity
        }));
        this.cartSubject.next([...this.cartItems]);
      });
  }

  addToCart(product: Product, quantity = 1): void {
    const existingIndex = this.cartItems.findIndex(i => i.product.id === product.id);

    if (this.authService.isAuthenticated()) {
      this.http.post<any>(`${this.apiUrl}/add`, {
        productId: product.id,
        quantity: existingIndex >= 0
          ? this.cartItems[existingIndex].quantity + quantity
          : quantity
      }).subscribe({
        next: (res) => this.syncCartFromResponse(res),
        error: () => {
          if (existingIndex >= 0) {
            this.cartItems[existingIndex].quantity += quantity;
          } else {
            this.cartItems.push({ product, quantity });
          }
          this.cartSubject.next([...this.cartItems]);
        }
      });
    } else {
      if (existingIndex >= 0) {
        this.cartItems[existingIndex].quantity += quantity;
      } else {
        this.cartItems.push({ product, quantity });
      }
      this.saveLocalCart();
      this.cartSubject.next([...this.cartItems]);
    }
  }

  removeFromCart(productId: number): void {
  this.cartItems = this.cartItems.filter(i => i.product.id !== productId);
  this.cartSubject.next([...this.cartItems]);

  if (this.authService.isAuthenticated()) {
    this.http.post<any>(`${this.apiUrl}/remove`, { productId }).subscribe({
      next: (res) => this.syncCartFromResponse(res),
      error: () => {
        // En cas d'erreur, tu peux restaurer l'article ou laisser supprimé
        this.loadCartFromServer(); // option plus sûre
      }
    });
  } else {
    this.saveLocalCart();
  }
}
// Ajoute cette méthode dans CartService
getCurrentQuantity(productId: number): number {
  const item = this.cartItems.find(i => i.product.id === productId);
  return item ? item.quantity : 0;
}
  updateQuantity(productId: number, quantity: number): void {
    const item = this.cartItems.find(i => i.product.id === productId);
    if (item) {
      item.quantity = quantity;

      if (quantity <= 0) {
        this.removeFromCart(productId);
        return;
      }

      if (this.authService.isAuthenticated()) {
        this.http.post<any>(`${this.apiUrl}/add`, {
          productId,
          quantity
        }).subscribe({
          next: (res) => this.syncCartFromResponse(res), // ← JAMAIS loadCartFromServer()
          error: () => this.cartSubject.next([...this.cartItems])
        });
      } else {
        this.saveLocalCart();
        this.cartSubject.next([...this.cartItems]);
      }
    }
  }

  clearCart(): void {
    this.cartItems = [];
    if (this.authService.isAuthenticated()) {
      this.http.delete<any>(`${this.apiUrl}/clear`).subscribe({
        next: () => this.cartSubject.next([])
      });
    } else {
      localStorage.removeItem('temp_cart');
      this.cartSubject.next([]);
    }
  }

  getItemCount(): number {
    return this.cartItems.reduce((s, i) => s + i.quantity, 0);
  }

  getTotal(): number {
    return this.cartItems.reduce((s, i) => s + (i.product.price * i.quantity), 0);
  }
}
