import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Router } from '@angular/router';
// Import your AuthService if needed

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  templateUrl: './register.html',
  styleUrls: ['./register.scss']
})
export class Register {
  registerForm: FormGroup;
  errorMessage = '';
  loading = false;

  constructor(private fb: FormBuilder, private router: Router) {
    this.registerForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
      address: ['', [Validators.required, Validators.minLength(5)]]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { mismatch: true };
  }

  onSubmit() {
    console.log('Form valid?', this.registerForm.valid);
    console.log('Errors:', this.registerForm.errors);

    if (this.registerForm.valid) {
      this.loading = true;
      this.errorMessage = '';

      // Simule une inscription
      setTimeout(() => {
        console.log('Inscription OK ! Redirection...');
        this.loading = false;
        this.router.navigate(['/login']);
      }, 1000);
    } else {
      this.errorMessage = 'Veuillez corriger les erreurs.';
      Object.keys(this.registerForm.controls).forEach(key => {
        this.registerForm.get(key)?.markAsTouched();
      });
    }
  }

  get f() { return this.registerForm.controls; }
}