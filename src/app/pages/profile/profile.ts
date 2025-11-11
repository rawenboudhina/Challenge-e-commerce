// src/app/features/profile/profile.component.ts
import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { WishlistService } from '../../core/services/wishlist.service';
import { HttpClient } from '@angular/common/http';
import { ProductService } from '../../core/services/product.service';
import { Subject, takeUntil, forkJoin } from 'rxjs';
import { Product } from '../../core/models/product.model';

interface Order {
  id: string;
  date: string;
  total: number;
  status: 'En cours' | 'Livrée' | 'Annulée';
  items: any[];
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './profile.html',
  styleUrls: ['./profile.scss']
})
export class ProfileComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private authService = inject(AuthService);
  private wishlistService = inject(WishlistService);
  private productService = inject(ProductService);
  private http = inject(HttpClient);
  private fb = inject(FormBuilder);

  private apiUrl = 'http://localhost:3000';

  profileForm!: FormGroup;
  activeTab = 'profile';
  updateSuccess = false;

  user: any = null;
  orders: Order[] = [];
  favorites: Product[] = [];
  addresses: string[] = []; // Toutes les adresses
  mainAddress: string = ''; // Adresse principale (celle du profil)

  tabs = [
    { id: 'profile', label: 'Profil' },
    { id: 'orders', label: 'Commandes' },
    { id: 'favorites', label: 'Favoris' },
    { id: 'addresses', label: 'Adresses' }
  ];

  ngOnInit(): void {
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.user = user;
        if (user) {
          this.loadAllData();
          this.initForm();
        }
      });

    if (this.authService.isAuthenticated()) {
      this.user = this.authService.getCurrentUser();
      this.loadAllData();
      this.initForm();
    }
  }

  private initForm(): void {
    this.profileForm = this.fb.group({
      firstName: [this.user?.firstName || '', Validators.required],
      lastName: [this.user?.lastName || '', Validators.required],
      email: [this.user?.email || '', [Validators.required, Validators.email]],
      address: [this.user?.address || '', Validators.required]
    });
  }

  private loadAllData(): void {
    this.loadOrders();
    this.loadFavorites();
    this.loadAddresses();
  }

  private loadOrders(): void {
    if (!this.user?.id) return;
    this.http.get<Order[]>(`${this.apiUrl}/orders?userId=${this.user.id}`)
      .subscribe(orders => this.orders = orders);
  }

  private loadFavorites(): void {
    this.wishlistService.wishlist$
      .pipe(takeUntil(this.destroy$))
      .subscribe(ids => {
        if (ids.length === 0) {
          this.favorites = [];
          return;
        }
        forkJoin(ids.map(id => this.productService.getProductById(id)))
          .subscribe(products => {
            this.favorites = products.filter(p => p !== null) as Product[];
          });
      });

    if (this.user) this.wishlistService.loadWishlist();
  }

  // CHARGER LES ADRESSES (principale + supplémentaires)
  private loadAddresses(): void {
    this.mainAddress = this.user?.address || 'Aucune adresse principale';

    // Si tu as un champ addresses[] dans l'utilisateur → utilise-le
    // Sinon, on simule avec localStorage ou API
    const saved = localStorage.getItem(`addresses_${this.user?.id}`);
    this.addresses = saved ? JSON.parse(saved) : [this.mainAddress];
    
    // Toujours garder l'adresse principale en premier
    if (!this.addresses.includes(this.mainAddress)) {
      this.addresses.unshift(this.mainAddress);
    }
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }

  // MISE À JOUR PROFIL + ADRESSE PRINCIPALE
  updateProfile(): void {
    if (this.profileForm.valid && this.user?.id) {
      const updatedData = this.profileForm.value;
      this.http.patch(`${this.apiUrl}/users/${this.user.id}`, updatedData)
        .subscribe(() => {
          const payload = { ...this.user, ...updatedData };
          localStorage.setItem('currentUser', JSON.stringify(payload));
          this.authService['currentUserSubject'].next(payload);
          this.user = payload;
          this.mainAddress = updatedData.address;

          // Mettre à jour les adresses
          if (!this.addresses.includes(this.mainAddress)) {
            this.addresses.unshift(this.mainAddress);
          }
          this.saveAddressesToStorage();

          this.updateSuccess = true;
          setTimeout(() => this.updateSuccess = false, 3000);
        });
    }
  }

  // AJOUTER UNE NOUVELLE ADRESSE
  addAddress(): void {
    const newAddr = prompt('Nouvelle adresse de livraison :');
    if (newAddr?.trim()) {
      const addr = newAddr.trim();
      if (!this.addresses.includes(addr)) {
        this.addresses.push(addr);
        this.saveAddressesToStorage();
        this.showToast('Adresse ajoutée !', 'success');
      } else {
        alert('Cette adresse existe déjà !');
      }
    }
  }

  // SUPPRIMER UNE ADRESSE (sauf principale)
  removeAddress(index: number): void {
    if (index === 0) {
      alert('Vous ne pouvez pas supprimer l’adresse principale ! Modifiez-la dans Profil.');
      return;
    }
    this.addresses.splice(index, 1);
    this.saveAddressesToStorage();
    this.showToast('Adresse supprimée', 'success');
  }

  // SAUVEGARDER DANS LOCALSTORAGE
  private saveAddressesToStorage(): void {
    if (this.user?.id) {
      localStorage.setItem(`addresses_${this.user.id}`, JSON.stringify(this.addresses));
    }
  }

  // RETIRER FAVORI
  removeFavorite(productId: number): void {
    const product = this.favorites.find(p => p.id === productId);
    if (product) this.wishlistService.toggle(product);
  }

  // TOAST PRO
  private showToast(message: string, type: 'success' | 'error' = 'success'): void {
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed; top: 20px; right: 20px; z-index: 9999;
      background: ${type === 'success' ? '#28a745' : '#dc3545'};
      color: white; padding: 16px 32px; border-radius: 16px;
      font-weight: 600; box-shadow: 0 10px 30px rgba(0,0,0,0.2);
      animation: slideIn 0.5s ease;
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}