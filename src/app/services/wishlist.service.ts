// src/app/services/wishlist.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class WishlistService {
  private apiUrl = 'http://localhost:5000/api/wishlist';

  // Le backend renvoie un tableau de strings (ObjectId.toString())
  private wishlistSubject = new BehaviorSubject<string[]>([]);
  public wishlist$ = this.wishlistSubject.asObservable();

  private http = inject(HttpClient);
  private authService = inject(AuthService);

  constructor() {
    // Recharge la wishlist à chaque changement d'utilisateur
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.loadWishlist();
      } else {
        this.wishlistSubject.next([]); // Vide si déconnecté
      }
    });
  }

  /** Charge la wishlist depuis le serveur */
  loadWishlist(): void {
    if (!this.authService.isAuthenticated()) return;

    this.http.get<string[]>(`${this.apiUrl}`).pipe(
      tap(ids => {
        console.log('Wishlist chargée :', ids); // Pour debug
        this.wishlistSubject.next(ids);
      }),
      catchError(err => {
        console.error('Erreur chargement wishlist', err);
        this.wishlistSubject.next([]);
        return of([]);
      })
    ).subscribe();
  }

  /** Ajoute un produit à la wishlist */
  add(productId: string | number): void {
    if (!this.authService.isAuthenticated()) return;

    this.http.post<string[]>(`${this.apiUrl}/add`, { productId: productId.toString() }).pipe(
      tap(ids => {
        this.wishlistSubject.next(ids);
        console.log('Ajouté à la wishlist :', productId);
      }),
      catchError(err => {
        console.error('Erreur ajout wishlist', err);
        return of([]);
      })
    ).subscribe();
  }

  /** Supprime un produit de la wishlist */
  remove(productId: string | number): void {
    if (!this.authService.isAuthenticated()) return;

    this.http.post<string[]>(`${this.apiUrl}/remove`, { productId: productId.toString() }).pipe(
      tap(ids => {
        this.wishlistSubject.next(ids);
        console.log('Supprimé de la wishlist :', productId);
      }),
      catchError(err => {
        console.error('Erreur suppression wishlist', err);
        return of([]);
      })
    ).subscribe();
  }

  /** Bascule ajout/suppression */
  toggle(productId: string | number): void {
    if (this.isInWishlist(productId)) {
      this.remove(productId);
    } else {
      this.add(productId);
    }
  }

  /** Vérifie si un produit est dans la wishlist */
  isInWishlist(productId: string | number): boolean {
    return this.wishlistSubject.value.includes(productId.toString());
  }

  /** Retourne le nombre d'articles dans la wishlist */
  getCount(): number {
    return this.wishlistSubject.value.length;
  }
}
