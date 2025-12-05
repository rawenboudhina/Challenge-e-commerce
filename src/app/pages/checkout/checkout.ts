import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
  ReactiveFormsModule,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CartService } from '../../services/cart.service';
import { AuthService } from '../../services/auth.service';
import { HttpClient } from '@angular/common/http';
import { Product, CartItem } from '../../models/product.model';
import { User } from '../../models/user.model'; // ← ICI
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
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './checkout.html',
  styleUrls: ['./checkout.scss'],
})
export class CheckoutComponent implements OnInit {
  cartItems: CartItem[] = [];
  isLoading = false;
  submitted = false;

  addressForm: FormGroup;
  paymentForm: FormGroup;

  deliveryMethods: DeliveryMethod[] = [
    { id: 'standard', name: 'Livraison Standard', price: 5, description: '3-5 jours ouvrables' },
    { id: 'express', name: 'Livraison Express', price: 15, description: '1-2 jours ouvrables' },
  ];

  selectedDelivery: DeliveryMethod | null = this.deliveryMethods[0];
  shippingFee: number = this.deliveryMethods[0].price;
  subtotal: number = 0;
  total: number = 0;

  addresses: string[] = [];
  selectedAddressIndex: number | null = null;
  showNewAddressForm = false;

  private apiUrl = 'http://localhost:5000';
  constructor(
    private fb: FormBuilder,
    private cartService: CartService,
    public authService: AuthService,
    private http: HttpClient,
    private router: Router
  ) {
    this.addressForm = this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(2)]],
      street: ['', [Validators.required, Validators.minLength(5)]],
    });

    this.paymentForm = this.fb.group({
      cardNumber: ['', [Validators.required, Validators.pattern(/^\d{16}$/)]],
      expiryMonth: ['', [Validators.required, Validators.min(1), Validators.max(12)]],
      expiryYear: ['', [Validators.required, Validators.min(2025)]],
      cvv: ['', [Validators.required, Validators.pattern(/^\d{3,4}$/)]],
      nameOnCard: ['', [Validators.required, Validators.minLength(2)]],
    });
  }

  ngOnInit(): void {
    this.cartService.cart$.subscribe((items) => {
      this.cartItems = items;
      this.subtotal = this.cartService.getTotal();
      this.updateTotal();
    });

    const user = this.authService.getCurrentUser() as User | null;
    if (user) {
      this.addressForm.patchValue({
        fullName: `${user.firstName} ${user.lastName}`,
      });
      const main = user.address || '';
      const extras = Array.isArray((user as any).addresses) ? (user as any).addresses : [];
      const unique = [main, ...extras].filter((a, i, arr) => a && arr.indexOf(a) === i);
      this.addresses = unique;
      if (this.addresses.length > 0) {
        this.selectedAddressIndex = 0;
        this.onAddressChange(0);
      }
    }
  }
  private loadAddresses(userId: number, userAddress: string): void {}

  onAddressChange(index: number): void {
    this.selectedAddressIndex = index;
    this.showNewAddressForm = false;
    const selectedAddress = this.addresses[index];
    this.addressForm.patchValue({
      street: selectedAddress,
    });
  }

  addNewAddress(): void {
    if (this.addressForm.valid) {
      const newAddress = this.addressForm.value.street;
      const user = this.authService.getCurrentUser() as User;
      if (user && !this.addresses.includes(newAddress)) {
        this.addresses.push(newAddress);
        
        this.onAddressChange(this.addresses.length - 1);
        alert('Adresse ajoutée avec succès !');
      } else if (this.addresses.includes(newAddress)) {
        alert('Cette adresse existe déjà !');
      }
    } else {
      this.submitted = true;
    }
  }

  private saveAddressesToStorage(userId: number): void {}

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
      userId: this.authService.getCurrentUser()?.id
        ? Number(this.authService.getCurrentUser()!.id)
        : undefined,
      items: this.cartItems.map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
      })),
      shippingAddress: this.addressForm.value,
      deliveryMethod: this.selectedDelivery!.id,
      paymentInfo: this.paymentForm.value,
      subtotal: this.subtotal,
      shippingFee: this.shippingFee,
      total: this.total,
      status: 'pending',
      createdAt: new Date(),
    };

   this.http.post<any>(`${this.apiUrl}/api/orders`, order).subscribe({
  next: (response) => {
    this.cartService.clearCart();
    this.router.navigate(['/order-confirmation', response.order.id]);
  },
      error: (err) => {
        console.error('Erreur lors de la commande:', err);
        alert('Erreur lors de la validation de la commande. Veuillez réessayer.');
        this.isLoading = false;
      },
    });
  }

  addressFormControl(name: string): AbstractControl {
    return this.addressForm.get(name)!;
  }

  paymentFormControl(name: string): AbstractControl {
    return this.paymentForm.get(name)!;
  }
}
