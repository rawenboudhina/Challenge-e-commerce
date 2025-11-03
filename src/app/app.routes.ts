import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home';
import { Products} from './pages/products/products';
import { ProductDetail } from './pages/product-detail/product-detail';
import { Cart } from './pages/cart/cart';
import { Login } from './pages/login/login';
import { Register} from './pages/register/register';

export const routes: Routes = [
  {
    path: '',
    component: HomeComponent
  },
  {
    path: 'products',
    component: Products
  },
  {
    path: 'products/:id',
    component: ProductDetail
  },
  {
    path: 'cart',
    component: Cart
  },
  {
    path: 'login',
    component: Login
  },
  {
    path: 'register',
    component: Register
  },
  {
    path: '**',
    redirectTo: ''
  }
];