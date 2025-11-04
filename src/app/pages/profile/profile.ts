import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';

interface User {
  firstName: string;
  lastName: string;
  email: string;
  address: string;
}

interface Order {
  id: string;
  date: string;
  total: number;
  status: 'En cours' | 'Livrée' | 'Annulée';
  items: { name: string; quantity: number; price: number }[];
}

interface Favorite {
  id: string;
  name: string;
  price: number;
  image: string;
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="profile-page">
      <div class="container">
        <h1>Mon Profil</h1>

        <!-- Onglets -->
        <div class="tabs">
          <button
            *ngFor="let tab of tabs"
            [class.active]="activeTab === tab.id"
            (click)="setActiveTab(tab.id)"
            class="tab-btn"
          >
            {{ tab.label }}
          </button>
        </div>

        <!-- Contenu des onglets -->
        <div class="tab-content">
          <!-- Profil -->
          <div *ngIf="activeTab === 'profile'" class="tab-pane">
            <form [formGroup]="profileForm" (ngSubmit)="updateProfile()" class="profile-form">
              <div class="form-row">
                <div class="form-group">
                  <label>Prénom</label>
                  <input type="text" formControlName="firstName" />
                </div>
                <div class="form-group">
                  <label>Nom</label>
                  <input type="text" formControlName="lastName" />
                </div>
              </div>
              <div class="form-group">
                <label>Email</label>
                <input type="email" formControlName="email" />
              </div>
              <div class="form-group">
                <label>Adresse</label>
                <textarea formControlName="address" rows="3"></textarea>
              </div>
              <button type="submit" class="btn-primary" [disabled]="profileForm.pristine">
                Mettre à jour
              </button>
              <p *ngIf="updateSuccess" class="success-msg">Profil mis à jour !</p>
            </form>
          </div>

          <!-- Commandes -->
          <div *ngIf="activeTab === 'orders'" class="tab-pane">
            <div *ngIf="orders.length === 0" class="empty-state">
              Aucune commande pour le moment.
            </div>
            <div *ngFor="let order of orders" class="order-card">
              <div class="order-header">
                <strong>Commande #{{ order.id }}</strong>
                <span class="status" [class]="order.status">{{ order.status }}</span>
              </div>
              <div class="order-date">{{ order.date }}</div>
              <div class="order-items">
                <div *ngFor="let item of order.items" class="order-item">
                  {{ item.name }} × {{ item.quantity }} — {{ item.price | currency:'EUR' }}
                </div>
              </div>
              <div class="order-total">
                <strong>Total: {{ order.total | currency:'EUR' }}</strong>
              </div>
            </div>
          </div>

          <!-- Favoris -->
          <div *ngIf="activeTab === 'favorites'" class="tab-pane">
            <div *ngIf="favorites.length === 0" class="empty-state">
              Aucun favori ajouté.
            </div>
            <div class="favorites-grid">
              <div *ngFor="let fav of favorites" class="favorite-item">
                <img [src]="fav.image" [alt]="fav.name" />
                <div class="favorite-info">
                  <h4>{{ fav.name }}</h4>
                  <p>{{ fav.price | currency:'EUR' }}</p>
                  <button class="btn-remove" (click)="removeFavorite(fav.id)">Retirer</button>
                </div>
              </div>
            </div>
          </div>

          <!-- Adresses -->
          <div *ngIf="activeTab === 'addresses'" class="tab-pane">
            <div class="address-list">
              <div *ngFor="let addr of addresses; let i = index" class="address-card">
                <p><strong>Adresse {{ i + 1 }}</strong></p>
                <p>{{ addr }}</p>
                <button class="btn-remove" (click)="removeAddress(i)">Supprimer</button>
              </div>
            </div>
            <button class="btn-add" (click)="addAddress()">+ Ajouter une adresse</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .profile-page { padding: 2rem 0; }
    .tabs { display: flex; border-bottom: 1px solid #eee; margin-bottom: 2rem; flex-wrap: wrap; }
    .tab-btn { padding: 1rem 1.5rem; border: none; background: none; font-weight: 500; cursor: pointer; }
    .tab-btn.active { border-bottom: 3px solid #007bff; color: #007bff; }
    .tab-pane { animation: fadeIn 0.3s; }

    .profile-form .form-row { display: flex; gap: 1rem; }
    .form-group { flex: 1; margin-bottom: 1rem; }
    .form-group label { display: block; margin-bottom: 0.5rem; font-weight: 500; }
    .form-group input, .form-group textarea { width: 100%; padding: 0.75rem; border: 1px solid #ddd; border-radius: 4px; }
    .btn-primary { background: #007bff; color: white; padding: 0.75rem 1.5rem; border: none; border-radius: 4px; cursor: pointer; }
    .btn-primary:disabled { background: #ccc; cursor: not-allowed; }

    .order-card { border: 1px solid #eee; padding: 1rem; border-radius: 8px; margin-bottom: 1rem; }
    .order-header { display: flex; justify-content: space-between; align-items: center; }
    .status { padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.8rem; }
    .status.En-cours { background: #fff3cd; color: #856404; }
    .status.Livrée { background: #d4edda; color: #155724; }
    .status.Annulée { background: #f8d7da; color: #721c24; }

    .favorites-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1rem; }
    .favorite-item { border: 1px solid #eee; border-radius: 8px; overflow: hidden; }
    .favorite-item img { width: 100%; height: 150px; object-fit: cover; }
    .favorite-info { padding: 1rem; }
    .btn-remove { background: #dc3545; color: white; border: none; padding: 0.5rem; border-radius: 4px; cursor: pointer; }

    .address-card { border: 1px solid #eee; padding: 1rem; border-radius: 8px; margin-bottom: 1rem; }
    .btn-add { background: #28a745; color: white; padding: 0.75rem 1rem; border: none; border-radius: 4px; cursor: pointer; }

    .empty-state { text-align: center; color: #666; font-style: italic; padding: 2rem; }
    .success-msg { color: green; margin-top: 1rem; }

    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

    @media (max-width: 768px) {
      .form-row { flex-direction: column; }
      .tabs { flex-direction: column; }
      .tab-btn { text-align: left; border-bottom: 1px solid #eee; }
      .tab-btn.active { border-bottom: 3px solid #007bff; }
    }
  `]
})
export class ProfileComponent implements OnInit {
  profileForm!: FormGroup;
  activeTab = 'profile';

  tabs = [
    { id: 'profile', label: 'Profil' },
    { id: 'orders', label: 'Commandes' },
    { id: 'favorites', label: 'Favoris' },
    { id: 'addresses', label: 'Adresses' }
  ];

  // Données simulées
  user: User = {
    firstName: 'Jean',
    lastName: 'Dupont',
    email: 'jean@example.com',
    address: '123 Rue de Paris, 75001 Paris'
  };

  orders: Order[] = [
    {
      id: 'CMD001',
      date: '15 Oct 2025',
      total: 1299.99,
      status: 'Livrée',
      items: [
        { name: 'iPhone 15 Pro', quantity: 1, price: 1299.99 }
      ]
    }
  ];

  favorites: Favorite[] = [
    { id: '1', name: 'MacBook Pro', price: 2499, image: 'https://via.placeholder.com/300' },
    { id: '2', name: 'AirPods Max', price: 579, image: 'https://via.placeholder.com/300' }
  ];

  addresses: string[] = [
    '123 Rue de Paris, 75001 Paris',
    '45 Avenue des Champs, 69000 Lyon'
  ];

  updateSuccess = false;

  constructor(private fb: FormBuilder) {}

  ngOnInit() {
    this.profileForm = this.fb.group({
      firstName: [this.user.firstName, Validators.required],
      lastName: [this.user.lastName, Validators.required],
      email: [this.user.email, [Validators.required, Validators.email]],
      address: [this.user.address, Validators.required]
    });
  }

  setActiveTab(tab: string) {
    this.activeTab = tab;
  }

  updateProfile() {
    if (this.profileForm.valid) {
      this.user = { ...this.profileForm.value };
      this.updateSuccess = true;
      setTimeout(() => this.updateSuccess = false, 3000);
    }
  }

  removeFavorite(id: string) {
    this.favorites = this.favorites.filter(f => f.id !== id);
  }

  removeAddress(index: number) {
    this.addresses.splice(index, 1);
  }

  addAddress() {
    const newAddr = prompt('Nouvelle adresse :');
    if (newAddr?.trim()) {
      this.addresses.push(newAddr.trim());
    }
  }
}