import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, delay, map, forkJoin, of } from 'rxjs';
import { Product } from '../models/product.model';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private apiUrl = 'https://dummyjson.com/products';
  
  // LISTE STRICTE DES CATÉGORIES TECH - Aucune autre catégorie ne passe
  private readonly TECH_CATEGORIES = [
    'laptops',
    'smartphones',
    'tablets',
    'mobile-accessories',
    'audio',
  ];

  constructor(private http: HttpClient) {}

  /**
   * Récupère UNIQUEMENT les produits tech
   * Filtre strictement pour éliminer tout produit non-tech
   */
  getAllProducts(limit: number = 30): Observable<Product[]> {
    const requests = this.TECH_CATEGORIES.map(category =>
      this.http.get<any>(`${this.apiUrl}/category/${category}`)
    );

    return forkJoin(requests).pipe(
      delay(500),
      map(responses => {
        const allProducts = responses.flatMap(response => response.products);
        
        // Filtrage strict : on ne garde QUE les produits tech
        const techProducts = allProducts.filter(p => 
          this.isTechProduct(p)
        );
        
        // Mélange aléatoire
        const shuffled = techProducts.sort(() => 0.5 - Math.random());
        return this.transformProducts(shuffled.slice(0, limit));
      })
    );
  }

  /**
   * Récupère un produit par ID
   */
  getProductById(id: number): Observable<Product> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      delay(300),
      map(product => this.transformProduct(product))
    );
  }

  /**
   * Récupère les produits par catégorie tech
   */
  getProductsByCategory(category: string): Observable<Product[]> {
    // Vérifie que c'est bien une catégorie tech
    if (!this.TECH_CATEGORIES.includes(category)) {
      console.warn(`Catégorie non-tech bloquée: ${category}`);
      return of([]);
    }

    return this.http.get<any>(`${this.apiUrl}/category/${category}`).pipe(
      delay(500),
      map(response => {
        // Double vérification : filtre les produits
        const techProducts = response.products.filter((p: any) => 
          this.isTechProduct(p)
        );
        return this.transformProducts(techProducts);
      })
    );
  }

  /**
   * Retourne UNIQUEMENT les catégories tech
   */
  getCategories(): Observable<string[]> {
    return of(this.TECH_CATEGORIES).pipe(delay(300));
  }

  /**
   * Recherche de produits tech uniquement
   */
  searchProducts(query: string): Observable<Product[]> {
    return this.http.get<any>(`${this.apiUrl}/search?q=${query}`).pipe(
      delay(400),
      map(response => {
        // Filtre STRICT pour ne garder que les produits tech
        const techProducts = response.products.filter((p: any) => 
          this.isTechProduct(p)
        );
        return this.transformProducts(techProducts);
      })
    );
  }

  /**
   * Vérifie si un produit est bien un produit tech
   * FILTRE STRICT : bloque tout ce qui n'est pas tech
   */
  private isTechProduct(product: any): boolean {
    const category = product.category?.toLowerCase() || '';
    
    // Liste des catégories autorisées
    const allowedCategories = this.TECH_CATEGORIES;
    
    // Liste noire : catégories à bloquer absolument
    const blockedCategories = [
      'beauty',
      'fragrances',
      'furniture',
      'groceries',
      'home-decoration',
      'kitchen-accessories',
      'mens-shirts',
      'mens-shoes',
      'womens-bags',
      'womens-dresses',
      'womens-jewellery',
      'womens-shoes',
      'tops',
      'motorcycle',
      'lighting',
      'skin-care',
      'sports-accessories', // Souvent non-tech dans DummyJSON
      'vehicle',
      'mens-watches',
  'womens-watches',
  'sunglasses'
    ];
    
    // Bloque si dans la liste noire
    if (blockedCategories.includes(category)) {
      return false;
    }
    
    // Accepte uniquement si dans la liste blanche
    return allowedCategories.includes(category);
  }

  /**
   * Transforme un produit de l'API en modèle Product
   */
  private transformProduct(product: any): Product {
    return {
      id: product.id,
      title: product.title,
      price: product.price,
      description: product.description,
      category: product.category,
      image: product.thumbnail || product.images?.[0] || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600',
      images: product.images || [product.thumbnail],
      thumbnail: product.thumbnail,
      rating: {
        rate: product.rating || 4.5,
        count: product.stock || 100
      },
      stock: product.stock,
      brand: product.brand,
      discountPercentage: product.discountPercentage
    };
  }

  /**
   * Transforme un tableau de produits
   */
  private transformProducts(products: any[]): Product[] {
    return products.map(p => this.transformProduct(p));
  }
}