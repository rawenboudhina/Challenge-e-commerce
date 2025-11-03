export interface Product {
  id: number;
  title: string;
  price: number;
  description: string;
  category: string;
  image: string;
  rating: {
    rate: number;
    count: number;
  };
  stock?: number;
  images?: string[];
  thumbnail?: string;
  brand?: string;
  discountPercentage?: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface User {
  id: number;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  token?: string;
}