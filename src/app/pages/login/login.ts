import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';  // Add this import
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth';
import { catchError, tap } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],  // Add RouterModule here
  templateUrl: './login.html',
  styleUrls: ['./login.scss']
})
export class Login {
  loginForm: FormGroup;
  errorMessage = '';
  loading = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  onSubmit() {
    if (this.loginForm.valid) {
      this.loading = true;
      this.errorMessage = '';
      const { email, password } = this.loginForm.value;
      this.authService.login(email, password).pipe(
        tap(() => {
          this.loading = false;
          this.router.navigate(['/products']);
        }),
        catchError(err => {
          this.loading = false;
          this.errorMessage = err.message || 'Erreur de connexion';
          return of(null);
        })
      ).subscribe();
    } else {
      this.errorMessage = 'Veuillez corriger les erreurs dans le formulaire.';
    }
  }

  get f() { return this.loginForm.controls; }
}