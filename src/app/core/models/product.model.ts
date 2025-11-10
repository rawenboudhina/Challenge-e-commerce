export interface Product {
  id: number;
  title: string;
  name?: string;
  price: number;
  description: string;
  category: string;
  image: string;
  rating?: {
    rate: number;
    count: number;
  };
  stock?: number;
  images?: string[];
  thumbnail?: string;
  brand?: string;
  discountPercentage?: number;
  isNew?: boolean;
  discount?: number;
  reviews?: Review[];
  specs?: Spec[]; // ← CORRIGÉ ICI
}

export interface Review {
  user: string;
  rating: number;
  comment: string;
  date: string;
  helpful?: number;
  helpfulClicked?: boolean;
}

export interface Spec {
  key: string;
  value: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}