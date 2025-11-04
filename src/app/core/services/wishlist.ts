import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Product } from '../models/product.model';

@Injectable({
  providedIn: 'root'
})
export class WishlistService {
  private wishlistKey = 'techzone_wishlist';
  private wishlistSubject = new BehaviorSubject<Product[]>(this.loadWishlist());
  wishlist$ = this.wishlistSubject.asObservable();

  private loadWishlist(): Product[] {
    const data = localStorage.getItem(this.wishlistKey);
    return data ? JSON.parse(data) : [];
  }

  private saveWishlist(items: Product[]) {
    localStorage.setItem(this.wishlistKey, JSON.stringify(items));
    this.wishlistSubject.next(items);
  }

  add(product: Product) {
    const current = this.loadWishlist();
    if (!current.some(p => p.id === product.id)) {
      current.push(product);
      this.saveWishlist(current);
    }
  }

  remove(productId: number) {
    const current = this.loadWishlist();
    const updated = current.filter(p => p.id !== productId);
    this.saveWishlist(updated);
  }

  toggle(product: Product) {
    const current = this.loadWishlist();
    const exists = current.some(p => p.id === product.id);
    if (exists) {
      this.remove(product.id);
    } else {
      this.add(product);
    }
  }

  isInWishlist(productId: number): boolean {
    return this.loadWishlist().some(p => p.id === productId);
  }

  getAll(): Product[] {
    return this.loadWishlist();
  }

  clear() {
    localStorage.removeItem(this.wishlistKey);
    this.wishlistSubject.next([]);
  }
}