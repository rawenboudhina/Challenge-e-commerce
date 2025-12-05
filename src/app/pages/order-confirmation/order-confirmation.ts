import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Product, CartItem } from '../../models/product.model';

interface Order {
  id: string;
  userId: string;
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
        const id = (order as any)._id || (order as any).id || orderId;
        order.items.forEach((item) => {
          if (!item.product) {
            this.http
              .get<Product>(`${this.apiUrl}/products/${item.productId}`)
              .subscribe((product) => (item.product = product));
          }
        });
        this.order = { ...order, id } as Order;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur chargement commande:', err);
        alert('Commande non trouvée.');
        this.isLoading = false;
      },
    });
  }

  getStatusLabel(status: string | undefined): string {
    switch ((status || '').toLowerCase()) {
      case 'confirmed':
        return 'confirmée';
      case 'pending':
        return 'en attente';
      case 'shipped':
        return 'expédiée';
      case 'delivered':
        return 'livrée';
      case 'cancelled':
        return 'annulée';
      default:
        return status || '';
    }
  }

  getSubtotal(item: any): number {
    return (item.product?.price || 0) * item.quantity;
  }

  printOrder(): void {
    window.print();
  }
}
