import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule, ActivatedRoute } from '@angular/router'; 
import { AuthService } from '../../services/auth.service';
import { WishlistService } from '../../services/wishlist.service';
import { HttpClient } from '@angular/common/http';
import { ProductService } from '../../services/product.service';
import { Subject, takeUntil, forkJoin } from 'rxjs';
import { Product } from '../../models/product.model';
import Swal from 'sweetalert2';

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
  private route = inject(ActivatedRoute); 

private apiUrl = 'http://localhost:5000/api/users'; 
private authApiUrl = 'http://localhost:5000/api/auth';
  profileForm!: FormGroup;
  activeTab = 'profile';
  updateSuccess = false;

  user: any = null;
  orders: Order[] = [];
  favorites: Product[] = [];
  addresses: string[] = [];
  mainAddress: string = '';

  tabs = [
    { id: 'profile', label: 'Profil' },
    { id: 'orders', label: 'Commandes' },
    { id: 'favorites', label: 'Favoris' },
    { id: 'addresses', label: 'Adresses' }
  ];

 ngOnInit(): void {
  this.route.queryParams.subscribe(params => {
    const tabParam = params['tab'];
    if (tabParam && this.tabs.some(tab => tab.id === tabParam)) {
      this.activeTab = tabParam;
    }
  });

  this.authService.currentUser$
    .pipe(takeUntil(this.destroy$))
    .subscribe(user => {
      this.user = user;
      if (user) {
        this.initForm();
        this.loadAllData(); // ← ici on recharge TOUT, y compris les adresses
      }
    });

  // Cas où l'utilisateur est déjà connecté au chargement
  if (this.authService.isAuthenticated()) {
    this.user = this.authService.getCurrentUser();
    this.initForm();
    this.loadAllData();
    this.refreshUserFromServer();
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

  private refreshUserFromServer(): void {
    this.http.get<any>(`${this.authApiUrl}/me`)
      .pipe(takeUntil(this.destroy$))
      .subscribe(res => {
        const srvUser = res?.user;
        if (srvUser) {
          const payload = { ...this.user, ...srvUser, token: this.user?.token };
          localStorage.setItem('currentUser', JSON.stringify(payload));
          (this.authService as any)['currentUserSubject'].next(payload);
          this.user = payload;
          this.loadAddresses();
        }
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
      .subscribe(orders => 
        this.orders = orders
      );
  }

 private loadFavorites(): void {
  this.wishlistService.wishlist$
    .pipe(takeUntil(this.destroy$))
    .subscribe(ids => {
      if (ids.length === 0) {
        this.favorites = [];
        return;
      }
      forkJoin(
        ids.map(id => this.productService.getProductById(id.toString())) // ← .toString()
      ).subscribe(products => {
        this.favorites = products.filter(p => p !== null) as Product[];
      });
    });
}
  private loadAddresses(): void {
  if (!this.user?.id) {
    this.addresses = [];
    this.mainAddress = '';
    return;
  }

  const rawAddress = this.user.address?.trim();
  this.mainAddress = rawAddress && rawAddress !== '' ? rawAddress : '';

  const serverAddresses: string[] = Array.isArray(this.user.addresses) ? (this.user.addresses as string[]) : [];
  const cleaned = serverAddresses
    .map((a: string) => a?.trim())
    .filter((a: string) => !!a && a !== this.mainAddress);

  this.addresses = [];
  if (this.mainAddress) this.addresses.push(this.mainAddress);
  cleaned.forEach((a: string) => this.addresses.push(a));
}
  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }

  updateProfile(): void {
    if (this.profileForm.valid && this.user?.id) {
      const updatedData = this.profileForm.value;
      const newMain = (updatedData.address ?? '').trim();
      const extras = Array.isArray(this.user?.addresses)
        ? (this.user.addresses as string[]).filter(a => (a ?? '').trim() && (a ?? '').trim() !== newMain)
        : [];

      this.http.patch<any>(`${this.authApiUrl}/me`, { ...updatedData, addresses: extras }).subscribe({
        next: (res) => {
          const srvUser = res?.user || {};
          const payload = { ...this.user, ...srvUser, token: this.user?.token };
          localStorage.setItem('currentUser', JSON.stringify(payload));
          (this.authService as any)['currentUserSubject'].next(payload);
          this.user = payload;
          this.loadAddresses();
          this.updateSuccess = true;
          Swal.fire({ icon: 'success', title: 'Profil mis à jour', timer: 1500, showConfirmButton: false });
          setTimeout(() => this.updateSuccess = false, 1500);
        },
        error: () => {
          Swal.fire({ icon: 'error', title: 'Échec de la mise à jour', timer: 2000, showConfirmButton: false });
        }
      });
    }
  }

  addAddress(): void {
    const newAddr = prompt('Nouvelle adresse de livraison :');
    if (newAddr?.trim()) {
      const addr = newAddr.trim();
      if (!this.addresses.includes(addr)) {
        this.addresses.push(addr);
        const main = this.profileForm.value.address?.trim() || this.mainAddress;
        const extras = this.addresses.filter(a => a !== main);
        this.http.patch<any>(`${this.authApiUrl}/me`, { address: main, addresses: extras }).subscribe({
          next: (res) => {
            const srvUser = res?.user || {};
            const payload = { ...this.user, ...srvUser, token: this.user?.token };
            localStorage.setItem('currentUser', JSON.stringify(payload));
            (this.authService as any)['currentUserSubject'].next(payload);
            this.user = payload;
            this.loadAddresses();
            Swal.fire({ icon: 'success', title: 'Adresse ajoutée', timer: 1500, showConfirmButton: false });
          },
          error: () => {
            Swal.fire({ icon: 'error', title: 'Échec de l’ajout', timer: 2000, showConfirmButton: false });
          }
        });
      } else {
        alert('Cette adresse existe déjà !');
      }
    }
  }

  removeAddress(index: number): void {
    if (index === 0) {
      alert('Vous ne pouvez pas supprimer l\'adresse principale ! Modifiez-la dans Profil.');
      return;
    }
    this.addresses.splice(index, 1);
    const main = this.profileForm.value.address?.trim() || this.mainAddress;
    const extras = this.addresses.filter(a => a !== main);
    this.http.patch<any>(`${this.authApiUrl}/me`, { address: main, addresses: extras }).subscribe({
      next: (res) => {
        const srvUser = res?.user || {};
        const payload = { ...this.user, ...srvUser, token: this.user?.token };
        localStorage.setItem('currentUser', JSON.stringify(payload));
        (this.authService as any)['currentUserSubject'].next(payload);
        this.user = payload;
        this.loadAddresses();
        Swal.fire({ icon: 'success', title: 'Adresse supprimée', timer: 1500, showConfirmButton: false });
      },
      error: () => {
        Swal.fire({ icon: 'error', title: 'Échec de la suppression', timer: 2000, showConfirmButton: false });
      }
    });
  }

  private saveAddressesToStorage(): void {}

removeFavorite(productId: string | number): void {
  Swal.fire({
    title: 'Retirer des favoris ?',
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'Oui',
    cancelButtonText: 'Annuler'
  }).then(result => {
    if (result.isConfirmed) {
      this.wishlistService.remove(productId);
    }
  });
}

  

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
