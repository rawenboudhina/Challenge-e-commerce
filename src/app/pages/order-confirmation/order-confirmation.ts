import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Product, CartItem } from '../../models/product.model';

interface Order {
  id: number;
  userId: number;
  items: { productId: number; quantity: number; product?: Product }[];
shippingAddress: {
  fullName: string;
  street: string;
},
  deliveryMethod: string;
  subtotal: number;
  shippingFee: number;
  total: number;
  status: string;
  createdAt: Date;
}

@Component({
  selector: 'app-order-confirmation',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './order-confirmation.html',
  styleUrls: ['./order-confirmation.scss'],
})
export class OrderConfirmation implements OnInit {
  order: Order | null = null;
  isLoading = true;

  private apiUrl = 'http://localhost:5000/api';
  constructor(private route: ActivatedRoute, private http: HttpClient) {}

  ngOnInit(): void {
    const orderId = this.route.snapshot.paramMap.get('id');
    if (orderId) {
      this.loadOrder(orderId);
    } else {
      this.isLoading = false;
    }
  }

  private loadOrder(orderId: string): void {
    this.http.get<Order>(`${this.apiUrl}/orders/${orderId}`).subscribe({
      next: (order) => {
        order.items.forEach((item) => {
          if (!item.product) {
            this.http
              .get<Product>(`${this.apiUrl}/products/${item.productId}`)
              .subscribe((product) => (item.product = product));
          }
        });
        this.order = order;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur chargement commande:', err);
        alert('Commande non trouvée.');
        this.isLoading = false;
      },
    });
  }

  getSubtotal(item: any): number {
    return (item.product?.price || 0) * item.quantity;
  }

  printOrder(): void {
    window.print();
  }
}
