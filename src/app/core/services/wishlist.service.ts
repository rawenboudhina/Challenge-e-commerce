// src/app/core/services/wishlist.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { Product } from '../models/product.model';
import { AuthService } from './auth.service';
import { switchMap } from 'rxjs/operators';
@Injectable({
  providedIn: 'root'
})
export class WishlistService {
  private apiUrl = 'http://localhost:3000';
  private wishlistSubject = new BehaviorSubject<number[]>([]); // stocke les IDs
  wishlist$ = this.wishlistSubject.asObservable();

  private wishlist: number[] = []; // cache en mémoire (IDs)
  private userId: number | null = null;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {
    this.authService.currentUser$.subscribe(user => {
      const newUserId = user?.id || null;
      if (newUserId !== this.userId) {
        this.userId = newUserId;
        if (this.userId) {
          this.loadWishlist();
        } else {
          this.clearWishlist();
        }
      }
    });
  }

  // Charge la wishlist du serveur
  private loadWishlist(): void {
    this.http.get<{ userId: number; products: number[] }[]>(
      `${this.apiUrl}/wishlists?userId=${this.userId}`
    ).pipe(
      tap(data => {
        const userWishlist = data[0];
        this.wishlist = userWishlist?.products || [];
        this.wishlistSubject.next([...this.wishlist]);
      }),
      catchError(() => {
        this.wishlist = [];
        this.wishlistSubject.next([]);
        return of([]);
      })
    ).subscribe();
  }

  // Sauvegarde sur le serveur
 private saveToServer(): void {
  if (!this.userId) return;

  // Cherche si la wishlist existe
  this.http.get<{ id: number; userId: number; products: number[] }[]>(
    `${this.apiUrl}/wishlists?userId=${this.userId}`
  ).pipe(
    switchMap(existing => {
      const payload = { userId: this.userId, products: this.wishlist };

      if (existing.length > 0) {
        // Mise à jour
        return this.http.patch(`${this.apiUrl}/wishlists/${existing[0].id}`, payload);
      } else {
        // Création
        return this.http.post(`${this.apiUrl}/wishlists`, payload);
      }
    }),
    catchError(err => {
      console.error('Erreur sauvegarde wishlist', err);
      return of(null);
    })
  ).subscribe();
}

  add(product: Product): void {
    if (!this.userId || this.wishlist.includes(product.id)) return;

    this.wishlist.push(product.id);
    this.wishlistSubject.next([...this.wishlist]);
    this.saveToServer();
  }

  remove(productId: number): void {
    if (!this.userId) return;

    this.wishlist = this.wishlist.filter(id => id !== productId);
    this.wishlistSubject.next([...this.wishlist]);
    this.saveToServer();
  }

  toggle(product: Product): void {
    if (this.isInWishlist(product.id)) {
      this.remove(product.id);
    } else {
      this.add(product);
    }
  }

  isInWishlist(productId: number): boolean {
    return this.wishlist.includes(productId);
  }

  getAllProductIds(): number[] {
    return [...this.wishlist];
  }

  clearWishlist(): void {
    this.wishlist = [];
    this.wishlistSubject.next([]);
  }
  // À la fin du WishlistService (après clearWishlist)
get currentUserId(): number | null {
  return this.userId;
}
}