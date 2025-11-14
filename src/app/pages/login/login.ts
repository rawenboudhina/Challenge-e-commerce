import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';  // AJOUTE RouterModule
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule], // AJOUTÉ
  templateUrl: './login.html',
  styleUrls: ['./login.scss']
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  errorMessage = '';
  loading = false;

/*   onSubmit() {
    if (this.loginForm.invalid) {
      this.errorMessage = 'Veuillez remplir correctement le formulaire.';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    const { email, password } = this.loginForm.value;

    this.authService.login(email!, password!).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/products']);
      },
      error: (err: any) => {
        this.loading = false;
        this.errorMessage = err.message;
      }
    });
  } */
 onSubmit() {
  if (this.loginForm.invalid) {
    this.errorMessage = 'Veuillez remplir correctement le formulaire.';
    return;
  }

  this.loading = true;
  this.errorMessage = '';

  const { email, password } = this.loginForm.value;

  this.authService.login(email!, password!).subscribe({
    next: () => {
      this.loading = false;

      // RÉCUPÈRE returnUrl depuis l'URL
      const returnUrl = this.router.parseUrl(this.router.url).queryParams['returnUrl'];
      
      // Redirige vers returnUrl OU /products par défaut
      this.router.navigateByUrl(returnUrl || '/products');
    },
    error: (err: any) => {
      this.loading = false;
      this.errorMessage = err.message || 'Identifiants incorrects';
    }
  });
}

  get f() { return this.loginForm.controls; }
}