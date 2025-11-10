// src/app/core/services/auth.service.ts
import { Injectable, Injector, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { User } from '../models/user.model';

interface UserPayload extends Omit<User, 'password'> {
  token: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:3000';
  private currentUserSubject = new BehaviorSubject<UserPayload | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  private injector = inject(Injector);
  private http = inject(HttpClient);

  constructor() {
    this.loadUserFromStorage();
  }

  private loadUserFromStorage(): void {
    try {
      const saved = localStorage.getItem('currentUser');
      if (saved) {
        const user = JSON.parse(saved);
        this.currentUserSubject.next(user);
        this.mergeCartOnUserChange();
      }
    } catch (error) {
      console.error('Erreur chargement utilisateur', error);
      localStorage.removeItem('currentUser');
    }
  }

  private mergeCartOnUserChange(): void {
    setTimeout(() => {
      try {
        const cartService = this.injector.get<any>(class {}, null);
        if (cartService?.mergeLocalCartOnLogin) {
          cartService.mergeLocalCartOnLogin();
        }
      } catch (e) {
        setTimeout(() => this.mergeCartOnUserChange(), 100);
      }
    }, 0);
  }

  // MÉTHODE OUBLIÉE → REMETS-LA !
  register(data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    address: string;
  }): Observable<UserPayload> {
    const newUser: User = {
      id: Date.now(),
      email: data.email,
      username: data.email.split('@')[0],
      firstName: data.firstName,
      lastName: data.lastName,
      address: data.address,
      password: data.password
    };

    return this.http.get<User[]>(`${this.apiUrl}/users?email=${data.email}`).pipe(
      switchMap(users => {
        if (users.length > 0) {
          return throwError(() => new Error('Cet email est déjà utilisé'));
        }
        return this.http.post<User>(`${this.apiUrl}/users`, newUser).pipe(
          switchMap(createdUser => {
            return this.http.post(`${this.apiUrl}/wishlists`, {
              userId: createdUser.id,
              products: []
            }).pipe(map(() => createdUser));
          }),
          map(user => {
            const { password: _, ...safeUser } = user;
            const token = `jwt-${user.id}-${Date.now()}`;
            const payload: UserPayload = { ...safeUser, token };
            localStorage.setItem('currentUser', JSON.stringify(payload));
            this.currentUserSubject.next(payload);
            this.mergeCartOnUserChange();
            return payload;
          })
        );
      }),
      catchError(err => {
        return throwError(() => new Error(err.message || 'Erreur d’inscription'));
      })
    );
  }

  login(email: string, password: string): Observable<UserPayload> {
    return this.http.get<User[]>(`${this.apiUrl}/users?email=${email}`).pipe(
      map(users => {
        const user = users[0];
        if (!user || user.password !== password) {
          throw new Error('Email ou mot de passe invalide');
        }
        return user;
      }),
      map(user => {
        const { password: _, ...safeUser } = user;
        const token = `jwt-${user.id}-${Date.now()}`;
        const payload: UserPayload = { ...safeUser, token };
        localStorage.setItem('currentUser', JSON.stringify(payload));
        this.currentUserSubject.next(payload);
        this.mergeCartOnUserChange();
        return payload;
      }),
      catchError(err => {
        return throwError(() => new Error(err.message || 'Erreur de connexion'));
      })
    );
  }

  logout(): void {
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
  }

  isAuthenticated(): boolean {
    return !!this.currentUserSubject.value;
  }

  getCurrentUser(): UserPayload | null {
    return this.currentUserSubject.value;
  }
}