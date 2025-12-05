import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { Product } from '../models/product.model';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private apiUrl = 'http://localhost:5000/api/products';

  // AJOUTE ÇA (c'était manquant)
  private allowedSlugs = [
    'smartphones', 'laptops', 'womens-dresses', 'mens-shirts',
    'fragrances', 'home-decoration', 'sports-accessories', 'womens-jewellery'
  ];

  categories = [
    { name: 'Smartphones', slug: 'smartphones', icon: 'phone', color: '#8b5cf6', image: 'https://images.pexels.com/photos/607812/pexels-photo-607812.jpeg?auto=compress&cs=tinysrgb&w=600&h=600&dpr=1' },
    { name: 'Laptops', slug: 'laptops', icon: 'laptop', color: '#3b82f6', image: 'https://images.pexels.com/photos/18105/pexels-photo.jpg?auto=compress&cs=tinysrgb&w=600&h=600&dpr=1' },
    { name: 'Mode Femme', slug: 'womens-dresses', icon: 'dress', color: '#ec4899', image: 'https://images.pexels.com/photos/336372/pexels-photo-336372.jpeg?auto=compress&cs=tinysrgb&w=600&h=600&dpr=1' },
    { name: 'Mode Homme', slug: 'mens-shirts', icon: 'shirt', color: '#1e40af', image: 'https://images.pexels.com/photos/1183266/pexels-photo-1183266.jpeg?auto=compress&cs=tinysrgb&w=600&h=600&dpr=1' },
    { name: 'Beauté', slug: 'fragrances', icon: 'perfume', color: '#f43f5e', image: 'https://images.pexels.com/photos/965989/pexels-photo-965989.jpeg?auto=compress&cs=tinysrgb&w=600&h=600&dpr=1' },
    { name: 'Maison', slug: 'home-decoration', icon: 'home', color: '#10b981', image: 'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=600&h=600&dpr=1' },
    { name: 'Sport', slug: 'sports-accessories', icon: 'soccer', color: '#f97316', image: 'https://images.pexels.com/photos/1432039/pexels-photo-1432039.jpeg?auto=compress&cs=tinysrgb&w=600&h=600&dpr=1' },
    { name: 'Bijoux', slug: 'womens-jewellery', icon: 'gem', color: '#a855f7', image: 'https://images.pexels.com/photos/265906/pexels-photo-265906.jpeg?auto=compress&cs=tinysrgb&w=600&h=600&dpr=1' }
  ];

  // AJOUTE LE CONSTRUCTEUR (c'était manquant aussi !)
  constructor(private http: HttpClient) {}

  getAllProducts(limit: number = 30): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}?limit=${limit}`);
  }
getProductById(id: string | number): Observable<Product> {
  return this.http.get<Product>(`${this.apiUrl}/${id}`);
}

  getProductsByCategory(category: string): Observable<Product[]> {
    if (!this.allowedSlugs.includes(category)) return of([]);
    return this.http.get<Product[]>(`${this.apiUrl}/category/${category}`);
  }

  searchProducts(query: string = ''): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}/search?q=${query}`);
  }

  getCategoryList(): Observable<any[]> {
    return of(this.categories);
  }
}