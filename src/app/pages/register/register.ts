import { Component ,inject} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule], 
  templateUrl: './register.html',
  styleUrls: ['./register.scss']
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  registerForm = this.fb.group({
    firstName: ['', [Validators.required, Validators.minLength(2)]],
    lastName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', [Validators.required]],
    address: ['', [Validators.required, Validators.minLength(5)]]
  }, { validators: this.passwordMatchValidator });

  errorMessage = '';
  loading = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  passwordMatchValidator(group: AbstractControl) {
    const pwd = group.get('password')?.value;
    const confirm = group.get('confirmPassword')?.value;
    return pwd === confirm ? null : { mismatch: true };
  }

onSubmit() {
  if (this.registerForm.invalid) {
    this.errorMessage = 'Veuillez corriger les erreurs.';
    return;
  }

  this.loading = true;
  this.errorMessage = '';

  const raw = this.registerForm.value;
  const data = {
    firstName: raw.firstName?.trim() || '',
    lastName: raw.lastName?.trim() || '',
    email: raw.email?.trim() || '',
    password: raw.password || '',
    address: raw.address?.trim() || ''
  };

  // Vérifie qu'aucun champ n'est vide
  if (!data.firstName || !data.lastName || !data.email || !data.password || !data.address) {
    this.errorMessage = 'Tous les champs sont obligatoires.';
    this.loading = false;
    return;
  }

  this.authService.register(data).subscribe({
    next: () => {
      this.loading = false;
      this.router.navigate(['/']);
    },
    error: (err) => {
      this.loading = false;
      this.errorMessage = err.message;
    }
  });
}

  get f() { return this.registerForm.controls; }
}