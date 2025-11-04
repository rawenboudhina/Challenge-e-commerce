import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home';
import { Products } from './pages/products/products';
// import { ProductDetailComponent } from './pages/product-detail/product-detail';
import { Cart } from './pages/cart/cart';
import { Login } from './pages/login/login';
import { Register } from './pages/register/register';

export const routes: Routes = [
  {
    path: '',
    component: HomeComponent,
  },
  {
    path: 'products',
    component: Products,
  },
  {
    path: 'cart',
    component: Cart,
  },
  {
    path: 'login',
    component: Login,
  },
  {
    path: 'register',
    component: Register,
  },
  {
    path: 'product/:id',
    loadComponent: () =>
      import('./pages/product-detail/product-detail').then((m) => m.ProductDetailComponent),
  },
  {
  path: 'profile',
  loadComponent: () => import('./pages/profile/profile').then(m => (m as any).ProfileComponent)
}
  ,
  {
    path: '**',
    redirectTo: '',
  }

];