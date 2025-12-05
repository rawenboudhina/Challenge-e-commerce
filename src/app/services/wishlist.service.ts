// src/app/services/wishlist.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { AuthService } from './auth.service';
import Swal from 'sweetalert2';

@Injectable({
  providedIn: 'root'
})
export class WishlistService {
  private apiUrl = 'http://localhost:5000/api/wishlist';

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

    this.http.get<(string | number)[]>(`${this.apiUrl}`).pipe(
      tap(ids => {
        const normalized = (ids || []).map(id => id.toString());
        this.wishlistSubject.next(normalized);
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

    this.http.post<(string | number)[]>(`${this.apiUrl}/add`, { productId: productId.toString() }).pipe(
      tap(ids => {
        const normalized = (ids || []).map(id => id.toString());
        this.wishlistSubject.next(normalized);
        Swal.fire({ icon: 'success', title: 'Ajouté aux favoris', timer: 1500, toast: true, position: 'top-end', showConfirmButton: false });
      }),
      catchError(err => {
        console.error('Erreur ajout wishlist', err);
        Swal.fire({ icon: 'error', title: 'Erreur ajout favoris', timer: 2000, toast: true, position: 'top-end', showConfirmButton: false });
        return of([]);
      })
    ).subscribe();
  }

  /** Supprime un produit de la wishlist */
  remove(productId: string | number): void {
    if (!this.authService.isAuthenticated()) return;

    this.http.post<(string | number)[]>(`${this.apiUrl}/remove`, { productId: productId.toString() }).pipe(
      tap(ids => {
        const normalized = (ids || []).map(id => id.toString());
        this.wishlistSubject.next(normalized);
        Swal.fire({ icon: 'info', title: 'Retiré des favoris', timer: 1500, toast: true, position: 'top-end', showConfirmButton: false });
      }),
      catchError(err => {
        console.error('Erreur suppression wishlist', err);
        Swal.fire({ icon: 'error', title: 'Erreur suppression favoris', timer: 2000, toast: true, position: 'top-end', showConfirmButton: false });
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
