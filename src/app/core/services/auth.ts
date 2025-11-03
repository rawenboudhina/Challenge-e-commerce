import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, delay, of, throwError } from 'rxjs';
import { map } from 'rxjs/operators';
import { User } from '../models/product.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor() {
    this.loadUser();
  }

  private loadUser(): void {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      this.currentUserSubject.next(JSON.parse(savedUser));
    }
  }

  login(email: string, password: string): Observable<User> {
    if (email && password.length >= 6) {
      const user: User = {
        id: 1,
        email: email,
        username: email.split('@')[0],
        firstName: 'John',
        lastName: 'Doe',
        token: 'fake-jwt-token-' + Date.now()
      };
      
      return of(user).pipe(
        delay(1000),
        map(u => {
          localStorage.setItem('currentUser', JSON.stringify(u));
          this.currentUserSubject.next(u);
          return u;
        })
      );
    }
    
    return throwError(() => new Error('Email ou mot de passe invalide'));
  }

  register(userData: any): Observable<User> {
    const user: User = {
      id: Date.now(),
      email: userData.email,
      username: userData.email.split('@')[0],
      firstName: userData.firstName,
      lastName: userData.lastName,
      token: 'fake-jwt-token-' + Date.now()
    };

    return of(user).pipe(
      delay(1000),
      map(u => {
        localStorage.setItem('currentUser', JSON.stringify(u));
        this.currentUserSubject.next(u);
        return u;
      })
    );
  }

  logout(): void {
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
  }

  isAuthenticated(): boolean {
    return this.currentUserSubject.value !== null;
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }
}