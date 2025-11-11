import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home';
import { Products } from './pages/products/products';
// import { ProductDetailComponent } from './pages/product-detail/product-detail';
import { CartComponent } from './pages/cart/cart';
import { LoginComponent } from './pages/login/login';
import { RegisterComponent } from './pages/register/register';
import { CheckoutComponent } from './pages/checkout/checkout';
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
    component: CartComponent,
  },
  {
    path: 'login',
    component: LoginComponent,
  },
  {
    path: 'register',
    component: RegisterComponent,
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
  ,  {
  path: 'order-confirmation/:id',
  loadComponent: () => import('./pages/order-confirmation/order-confirmation').then(m => (m as any).OrderConfirmation)
},
{ path: 'checkout', component: CheckoutComponent },
  
  {
    path: '**',
    redirectTo: '',
  }

];