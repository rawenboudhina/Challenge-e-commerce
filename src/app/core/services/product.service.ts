import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, delay, map, of } from 'rxjs';
import { Product, Review, Spec } from '../models/product.model';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private apiUrl = 'https://dummyjson.com/products';

  categories = [
    { name: 'Smartphones', slug: 'smartphones', icon: 'phone', color: '#8b5cf6', image: 'https://images.pexels.com/photos/607812/pexels-photo-607812.jpeg?auto=compress&cs=tinysrgb&w=600&h=600&dpr=1' },
    { name: 'Laptops', slug: 'laptops', icon: 'laptop', color: '#3b82f6', image: 'https://images.pexels.com/photos/18105/pexels-photo.jpg?auto=compress&cs=tinysrgb&w=600&h=600&dpr=1' },
    { name: 'Mode Femme', slug: 'womens-dresses', icon: 'dress', color: '#ec4899', image: 'https://images.pexels.com/photos/336372/pexels-photo-336372.jpeg?auto=compress&cs=tinysrgb&w=600&h=600&dpr=1' },
    { name: 'Mode Homme', slug: 'mens-shirts', icon: 'shirt', color: '#1e40af', image: 'https://images.pexels.com/photos/1183266/pexels-photo-1183266.jpeg?auto=compress&cs=tinysrgb&w=600&h=600&dpr=1' },
    { name: 'Beauté', slug: 'fragrances', icon: 'perfume', color: '#f43f5e', image: 'https://images.pexels.com/photos/965989/pexels-photo-965989.jpeg?auto=compress&cs=tinysrgb&w=600&h=600&dpr=1' },
    { name: 'Maison', slug: 'home-decoration', icon: 'home', color: '#10b981', image: 'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=600&h=600&dpr=1' },
    { name: 'Sport', slug: 'sports-accessories', icon: 'soccer', color: '#f97316', image: 'https://images.pexels.com/photos/1432039/pexels-photo-1432039.jpeg?auto=compress&cs=tinysrgb&w=600&h=600&dpr=1' },
    { name: 'Bijoux', slug: 'womens-jewellery', icon: 'diamond', color: '#a855f7', image: 'https://images.pexels.com/photos/265906/pexels-photo-265906.jpeg?auto=compress&cs=tinysrgb&w=600&h=600&dpr=1' }
  ];

  private allowedSlugs = this.categories.map(c => c.slug);

  constructor(private http: HttpClient) {}

  getAllProducts(limit: number = 30): Observable<Product[]> {
    return this.http.get<any>(`${this.apiUrl}?limit=${limit * 10}`).pipe(
      delay(500),
      map(response => {
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
    if (!this.allowedSlugs.includes(category)) return of([]);
    return this.http.get<any>(`${this.apiUrl}/category/${category}`).pipe(
      delay(500),
      map(response => this.transformProducts(response.products))
    );
  }

  getCategories(): Observable<string[]> {
    return of(this.allowedSlugs).pipe(delay(300));
  }

  searchProducts(query: string = '', category?: string): Observable<Product[]> {
    let url = `${this.apiUrl}/search?q=${query}`;
    if (category && this.allowedSlugs.includes(category)) {
      url = `${this.apiUrl}/category/${category}`;
    }
    return this.http.get<any>(url).pipe(
      delay(400),
      map(response => {
        const products = response.products || response;
        const filtered = products.filter((p: any) => this.allowedSlugs.includes(p.category));
        return this.transformProducts(filtered);
      })
    );
  }

  getCategoryList(): Observable<any[]> {
    return of(this.categories).pipe(delay(300));
  }

  // === TRANSFORMATION ===
  private transformProduct(product: any): Product {
    const reviews = this.generateRealisticReviews(product.id, product.title, product.category);
    const avgRating = reviews.length > 0
      ? Math.round((reviews.reduce((s: number, r: Review) => s + r.rating, 0) / reviews.length) * 10) / 10
      : 4.5;

    return {
      id: product.id,
      title: product.title,
      price: product.price,
      description: product.description,
      category: product.category,
      image: product.thumbnail || product.images?.[0] || 'https://via.placeholder.com/300',
      images: product.images || [product.thumbnail],
      thumbnail: product.thumbnail,
      rating: { rate: avgRating, count: reviews.length },
      stock: product.stock,
      brand: product.brand,
      discountPercentage: product.discountPercentage,
      reviews,
      specs: this.extractSpecs(product)
    };
  }

  private transformProducts(products: any[]): Product[] {
    return products.map(p => this.transformProduct(p));
  }

  // === AVIS RÉALISTES PAR CATÉGORIE ===
  private generateRealisticReviews(productId: number, title: string, category: string): Review[] {
    const templates: { [key: string]: string[] } = {
      'smartphones': ['Bonne autonomie', 'Appareil photo excellent', 'Fluide', 'Écran magnifique', 'Un peu cher', 'Chauffe en jeu', 'Interface intuitive'],
      'laptops': ['Parfait pour le travail', 'Clavier agréable', 'Ventilateur bruyant', 'Autonomie correcte', 'Léger', 'Performances au top', 'Écran mat agréable'],
      'womens-dresses': ['Taille parfaitement', 'Tissu doux', 'Couleur identique', 'Joli tombé', 'Un peu transparent', 'Élégant', 'Parfait pour l\'été'],
      'mens-shirts': ['Qualité du coton', 'Repassage facile', 'Bonne coupe', 'Confortable', 'Boutons fragiles', 'Tient bien au lavage'],
      'fragrances': ['Tient toute la journée', 'Odeur raffinée', 'Trop fort', 'Parfait pour l\'été', 'Sillage puissant', 'Flacon élégant'],
      'home-decoration': ['Design moderne', 'Facile à monter', 'Bonne qualité', 'Couleur comme sur la photo', 'Un peu fragile'],
      'sports-accessories': ['Bonne adhérence', 'Confortable', 'Résistant', 'Léger', 'Taille bien'],
      'womens-jewellery': ['Magnifique', 'Brille bien', 'Léger', 'Allergie', 'Belle finition'],
      'default': ['Bon rapport qualité-prix', 'Livraison rapide', 'Conforme à la description', 'Recommandé', 'Moyen', 'Super produit']
    };

    const comments = templates[category] || templates['default'];
    const count = Math.floor(Math.random() * 6) + 3;
    const reviews: Review[] = [];

    for (let i = 0; i < count; i++) {
      const rating = this.weightedRandomRating();
      const comment = comments[Math.floor(Math.random() * comments.length)];
      reviews.push({
        user: this.randomTunisianName(),
        rating,
        comment: `${comment}${rating >= 4 ? ' !' : rating <= 2 ? '...' : '.'}`,
        date: this.randomDate(10, 90),
        helpful: Math.floor(Math.random() * 18),
        helpfulClicked: false
      });
    }
    return reviews;
  }

  private weightedRandomRating(): number {
    const r = Math.random();
    if (r < 0.08) return 1;
    if (r < 0.15) return 2;
    if (r < 0.30) return 3;
    if (r < 0.60) return 4;
    return 5;
  }

  private randomTunisianName(): string {
    const names = ['Ahmed', 'Mohamed', 'Aymen', 'Yassine', 'Sami', 'Rami', 'Karim', 'Oussama', 'Bilel', 'Fakhri', 'Nour', 'Sarra', 'Ines', 'Selim'];
    const surnames = ['Ben Ali', 'Jenhani', 'Trabelsi', 'Mabrouk', 'Chaari', 'Gabsi', 'Hamdi', 'Zouari', 'Khlifi', 'Ayari', 'Mejri', 'Sassi'];
    return `${names[Math.floor(Math.random() * names.length)]} ${surnames[Math.floor(Math.random() * surnames.length)][0]}.`;
  }

  private randomDate(minDays: number, maxDays: number): string {
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * (maxDays - minDays) + minDays));
    return date.toISOString().slice(0, 10);
  }

  private extractSpecs(product: any): Spec[] {
    const specs: Spec[] = [];
    if (product.brand) specs.push({ key: 'Marque', value: product.brand });
    if (product.warrantyInformation) specs.push({ key: 'Garantie', value: product.warrantyInformation });
    if (product.shippingInformation) specs.push({ key: 'Livraison', value: product.shippingInformation });
    if (product.availabilityStatus) specs.push({ key: 'Disponibilité', value: product.availabilityStatus });
    if (product.weight) specs.push({ key: 'Poids', value: product.weight + 'g' });
    if (product.dimensions) {
      const d = product.dimensions;
      specs.push({ key: 'Dimensions', value: `${d.width}×${d.height}×${d.depth} cm` });
    }
    return specs;
  }
}