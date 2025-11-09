import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, delay, map, of } from 'rxjs';
import { Product } from '../models/product.model';
import { Category } from '../models/category.model';
@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private apiUrl = 'https://dummyjson.com/products';

  // ✅ TES 11 CATÉGORIES
  categories = [
  { 
    name: 'Smartphones', 
    slug: 'smartphones', 
    icon: '📱', 
    color: '#8b5cf6', 
    image: 'https://images.pexels.com/photos/607812/pexels-photo-607812.jpeg?auto=compress&cs=tinysrgb&w=600&h=600&dpr=1' 
  },
  { 
    name: 'Laptops', 
    slug: 'laptops', 
    icon: '💻', 
    color: '#3b82f6', 
    image: 'https://images.pexels.com/photos/18105/pexels-photo.jpg?auto=compress&cs=tinysrgb&w=600&h=600&dpr=1' 
  },
  { 
    name: 'Mode Femme', 
    slug: 'womens-dresses', 
    icon: '👗', 
    color: '#ec4899', 
    image: 'https://images.pexels.com/photos/336372/pexels-photo-336372.jpeg?auto=compress&cs=tinysrgb&w=600&h=600&dpr=1' 
  },
  { 
    name: 'Mode Homme', 
    slug: 'mens-shirts', 
    icon: '👔', 
    color: '#1e40af', 
    image: 'https://images.pexels.com/photos/1183266/pexels-photo-1183266.jpeg?auto=compress&cs=tinysrgb&w=600&h=600&dpr=1' 
  },
  { 
    name: 'Beauté', 
    slug: 'fragrances', 
    icon: '💄', 
    color: '#f43f5e', 
    image: 'https://images.pexels.com/photos/965989/pexels-photo-965989.jpeg?auto=compress&cs=tinysrgb&w=600&h=600&dpr=1' 
  },
  { 
    name: 'Maison', 
    slug: 'home-decoration', 
    icon: '🏠', 
    color: '#10b981', 
    image: 'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=600&h=600&dpr=1' 
  },
  { 
    name: 'Sport', 
    slug: 'sports-accessories', 
    icon: '⚽', 
    color: '#f97316', 
    image: 'https://images.pexels.com/photos/1432039/pexels-photo-1432039.jpeg?auto=compress&cs=tinysrgb&w=600&h=600&dpr=1' 
  },
  { 
    name: 'Bijoux', 
    slug: 'womens-jewellery', 
    icon: '💎', 
    color: '#a855f7', 
    image: 'https://images.pexels.com/photos/265906/pexels-photo-265906.jpeg?auto=compress&cs=tinysrgb&w=600&h=600&dpr=1' 
  }
];
  // ✅ SLUGS AUTORISÉS
  private allowedSlugs = this.categories.map(c => c.slug);

  constructor(private http: HttpClient) {}

  getAllProducts(limit: number = 30): Observable<Product[]> {
    return this.http.get<any>(`${this.apiUrl}?limit=${limit * 10}`).pipe(
      delay(500),
      map(response => {
        // ✅ FILTRER SEULEMENT LES CATÉGORIES AUTORISÉES
        const filtered = response.products.filter((p: any) => 
          this.allowedSlugs.includes(p.category)
        );
        const shuffled = filtered.sort(() => 0.5 - Math.random());
        return this.transformProducts(shuffled.slice(0, limit));
      })
    );
  }

  getProductById(id: number): Observable<Product> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      delay(300),
      map(product => this.transformProduct(product))
    );
  }

  getProductsByCategory(category: string): Observable<Product[]> {
    if (!this.allowedSlugs.includes(category)) {
      return of([]);
    }
    return this.http.get<any>(`${this.apiUrl}/category/${category}`).pipe(
      delay(500),
      map(response => this.transformProducts(response.products))
    );
  }

  getCategories(): Observable<string[]> {
    return of(this.allowedSlugs).pipe(delay(300));
  }

/*   searchProducts(query: string): Observable<Product[]> {
    return this.http.get<any>(`${this.apiUrl}/search?q=${query}`).pipe(
      delay(400),
      map(response => {
        const filtered = response.products.filter((p: any) => 
          this.allowedSlugs.includes(p.category)
        );
        return this.transformProducts(filtered);
      })
    );
  } */

  private transformProduct(product: any): Product {
    return {
      id: product.id,
      title: product.title,
      price: product.price,
      description: product.description,
      category: product.category,
      image: product.thumbnail || product.images?.[0] || 'https://via.placeholder.com/300',
      images: product.images || [product.thumbnail],
      thumbnail: product.thumbnail,
      rating: { rate: product.rating || 4.5, count: product.stock || 100 },
      stock: product.stock,
      brand: product.brand,
      discountPercentage: product.discountPercentage
    };
  }

  private transformProducts(products: any[]): Product[] {
    return products.map(p => this.transformProduct(p));
  }
  // src/core/services/product.service.ts
searchProducts(query: string = '', category?: string): Observable<Product[]> {
  let url = `${this.apiUrl}/search?q=${query}`;
  if (category && this.allowedSlugs.includes(category)) {
    url = `${this.apiUrl}/category/${category}`;
  }

  return this.http.get<any>(url).pipe(
    delay(400),
    map(response => {
      const products = response.products || response;
      const filtered = products.filter((p: any) =>
        this.allowedSlugs.includes(p.category)
      );
      return this.transformProducts(filtered);
    })
  );
}
// product.service.ts

// Ajouter cette méthode publique
getCategoryList(): Observable<any[]> {
  return of(this.categories).pipe(delay(300));
}
  
}