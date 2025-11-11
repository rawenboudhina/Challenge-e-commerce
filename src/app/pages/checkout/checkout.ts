// src/app/pages/checkout/checkout.component.ts (corrigé pour l'erreur 'user' et simplifié pour fullName + street seulement)
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CartService } from '../../core/services/cart.service';
import { AuthService } from '../../core/services/auth.service';
import { HttpClient } from '@angular/common/http';
import { Product, CartItem } from '../../core/models/product.model';
import { User } from '../../core/models/user.model'; // Import User

interface DeliveryMethod {
  id: string;
  name: string;
  price: number;
  description: string;
}

interface Order {
  id?: number;
  userId?: number;
  items: { productId: number; quantity: number }[];
  shippingAddress: {
    fullName: string;
    street: string;
  };
  deliveryMethod: string;
  paymentInfo: {
    cardNumber: string;
    expiryMonth: string;
    expiryYear: string;
    cvv: string;
    nameOnCard: string;
  };
  subtotal: number;
  shippingFee: number;
  total: number;
  status: string;
  createdAt: Date;
}

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule
  ],
  templateUrl: './checkout.html',
  styleUrls: ['./checkout.scss']
})
export class CheckoutComponent implements OnInit {
  cartItems: CartItem[] = [];
  isLoading = false;
  submitted = false;

  addressForm: FormGroup;
  paymentForm: FormGroup;

  deliveryMethods: DeliveryMethod[] = [
    { id: 'standard', name: 'Livraison Standard', price: 5, description: '3-5 jours ouvrables' },
    { id: 'express', name: 'Livraison Express', price: 15, description: '1-2 jours ouvrables' }
  ];

  selectedDelivery: DeliveryMethod | null = this.deliveryMethods[0];
  shippingFee: number = this.deliveryMethods[0].price;
  subtotal: number = 0;
  total: number = 0;

  // ← AJOUTÉ : Gestion des adresses multiples (string[])
  addresses: string[] = [];
  selectedAddressIndex: number | null = null; // Index de l'adresse sélectionnée
  showNewAddressForm = false; // Pour afficher le formulaire d'ajout

  private apiUrl = 'http://localhost:3000';

  constructor(
    private fb: FormBuilder,
    private cartService: CartService,
    public authService: AuthService,
    private http: HttpClient,
    private router: Router
  ) {
    this.addressForm = this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(2)]],
      street: ['', [Validators.required, Validators.minLength(5)]]
    });

    this.paymentForm = this.fb.group({
      cardNumber: ['', [Validators.required, Validators.pattern(/^\d{16}$/)]],
      expiryMonth: ['', [Validators.required, Validators.min(1), Validators.max(12)]],
      expiryYear: ['', [Validators.required, Validators.min(2025)]],
      cvv: ['', [Validators.required, Validators.pattern(/^\d{3,4}$/)]],
      nameOnCard: ['', [Validators.required, Validators.minLength(2)]]
    });
  }

  ngOnInit(): void {
    this.cartService.cart$.subscribe(items => {
      this.cartItems = items;
      this.subtotal = this.cartService.getTotal();
      this.updateTotal();
    });

    const user = this.authService.getCurrentUser() as User | null;
    if (user) {
      this.addressForm.patchValue({
        fullName: `${user.firstName} ${user.lastName}`,
      });
      this.loadAddresses(user.id, user.address || '');
    }
  }

  // ← AJOUTÉ : Charger les adresses depuis localStorage (comme dans profile) - CORRIGÉ : Passer userAddress
  private loadAddresses(userId: number, userAddress: string): void {
    const saved = localStorage.getItem(`addresses_${userId}`);
    this.addresses = saved ? JSON.parse(saved) : [userAddress];
    // Sélectionner la première adresse par défaut
    if (this.addresses.length > 0) {
      this.selectedAddressIndex = 0;
      this.onAddressChange(0);
    }
  }

  // ← AJOUTÉ : Sélectionner une adresse et pré-remplir le formulaire
  onAddressChange(index: number): void {
    this.selectedAddressIndex = index;
    this.showNewAddressForm = false;
    const selectedAddress = this.addresses[index];
    this.addressForm.patchValue({
      street: selectedAddress, // Utilise la string comme street
    });
  }

  // ← AJOUTÉ : Ajouter une nouvelle adresse (similaire à profile, mais via formulaire)
  addNewAddress(): void {
    if (this.addressForm.valid) {
      const newAddress = this.addressForm.value.street; // Prendre seulement la street comme string
      const user = this.authService.getCurrentUser() as User;
      if (user && !this.addresses.includes(newAddress)) {
        this.addresses.push(newAddress);
        this.saveAddressesToStorage(user.id);
        this.onAddressChange(this.addresses.length - 1);
        alert('Adresse ajoutée avec succès !');
      } else if (this.addresses.includes(newAddress)) {
        alert('Cette adresse existe déjà !');
      }
    } else {
      this.submitted = true;
    }
  }

  // ← AJOUTÉ : Sauvegarder adresses dans localStorage
  private saveAddressesToStorage(userId: number): void {
    localStorage.setItem(`addresses_${userId}`, JSON.stringify(this.addresses));
  }

  onDeliveryChange(method: DeliveryMethod): void {
    this.selectedDelivery = method;
    this.shippingFee = method.price;
    this.updateTotal();
  }

  private updateTotal(): void {
    this.total = this.subtotal + this.shippingFee;
  }

  getSubtotal(item: CartItem): number {
    return item.product.price * item.quantity;
  }

  onSubmit(): void {
    if (this.addressForm.invalid || this.paymentForm.invalid || this.cartItems.length === 0) {
      this.submitted = true;
      return;
    }

    this.isLoading = true;

    const order: Order = {
      userId: this.authService.getCurrentUser()?.id,
      items: this.cartItems.map(item => ({ productId: item.product.id, quantity: item.quantity })),
      shippingAddress: this.addressForm.value, // Utilise le formulaire pré-rempli
      deliveryMethod: this.selectedDelivery!.id,
      paymentInfo: this.paymentForm.value,
      subtotal: this.subtotal,
      shippingFee: this.shippingFee,
      total: this.total,
      status: 'pending',
      createdAt: new Date()
    };

    this.http.post<Order>(`${this.apiUrl}/orders`, order).subscribe({
      next: (newOrder) => {
        this.cartService.clearCart();
        this.router.navigate(['/order-confirmation', newOrder.id]);
      },
      error: (err) => {
        console.error('Erreur lors de la commande:', err);
        alert('Erreur lors de la validation de la commande. Veuillez réessayer.');
        this.isLoading = false;
      }
    });
  }

  // Helpers pour validation
  addressFormControl(name: string): AbstractControl {
    return this.addressForm.get(name)!;
  }

  paymentFormControl(name: string): AbstractControl {
    return this.paymentForm.get(name)!;
  }
}