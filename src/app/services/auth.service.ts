// src/app/services/auth.service.ts
import { Injectable, Injector } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { User, UserPayload } from '../models/user.model'; // ← ICI
import { CartService } from './cart.service';
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:5000/api/auth';

  private currentUserSubject = new BehaviorSubject<UserPayload | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private http: HttpClient,
    private injector: Injector
  ) {
    this.loadUserFromStorage();
    if (!this.currentUserSubject.value) {
      this.bootstrapFromCookie();
    }
  }

  private loadUserFromStorage(): void {
    try {
      const saved = localStorage.getItem('currentUser');
      if (saved) {
        const user = JSON.parse(saved) as UserPayload;
        this.currentUserSubject.next(user);
        this.mergeCartOnUserChange();
      }
    } catch (err) {
      localStorage.removeItem('currentUser');
    }
  }
// Dans auth.service.ts
getUserId(): string | null {
  const id = this.getCurrentUser()?.id as any;
  return id ? String(id) : null;
}
  private mergeCartOnUserChange(): void {
    try {
      const cartService = this.injector.get(CartService);
      cartService.mergeLocalCartOnLogin();
    } catch {}
  }

  register(data: any): Observable<UserPayload> {
    return this.http.post<UserPayload>(`${this.apiUrl}/register`, data).pipe(
      tap(user => this.setCurrentUser(user)),
      catchError(err => throwError(() => ({ message: err.error?.message || 'Erreur inscription' })))
    );
  }

  login(email: string, password: string): Observable<UserPayload> {
    return this.http.post<UserPayload>(`${this.apiUrl}/login`, { email, password }).pipe(
      tap(user => this.setCurrentUser(user)),
      catchError(err => throwError(() => ({ message: err.error?.message || 'Identifiants incorrects' })))
    );
  }

private setCurrentUser(user: any): void {
  const normalized: UserPayload = {
    id: user.id || user._id || user.user?.id || user.user?._id,
    email: user.email || user.user?.email,
    username: user.username || user.user?.username,
    firstName: user.firstName || user.user?.firstName || '',
    lastName: user.lastName || user.user?.lastName || '',
    address: user.address || user.user?.address || '',
    token: user.token
  };

  console.log('Utilisateur normalisé sauvegardé :', normalized); // ← Tu verras enfin Ali !

  localStorage.setItem('currentUser', JSON.stringify(normalized));
  this.currentUserSubject.next(normalized);
  this.mergeCartOnUserChange();
}

  logout(): void {
    this.http.post(`${this.apiUrl}/logout`, {}).subscribe({
      next: () => {
        localStorage.removeItem('currentUser');
        localStorage.removeItem('temp_cart');
        try {
          const cartService = this.injector.get(CartService);
          cartService.clearCart();
        } catch {}
        this.currentUserSubject.next(null);
      },
      error: () => {
        localStorage.removeItem('currentUser');
        localStorage.removeItem('temp_cart');
        try {
          const cartService = this.injector.get(CartService);
          cartService.clearCart();
        } catch {}
        this.currentUserSubject.next(null);
      }
    });
  }

  private bootstrapFromCookie(): void {
    this.http.get<any>(`${this.apiUrl}/me`).subscribe({
      next: (res) => {
        if (res?.user) {
          this.setCurrentUser(res.user);
        }
      },
      error: () => {}
    });
  }

  isAuthenticated(): boolean {
    return !!this.currentUserSubject.value?.id;
  }

  getCurrentUser(): UserPayload | null {
    return this.currentUserSubject.value;
  }
}
