import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTabsModule } from '@angular/material/tabs';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login-page',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatTabsModule,
    MatIconModule
  ],
  templateUrl: './login-page.component.html',
  styleUrl: './login-page.component.scss'
})
export class LoginPageComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly feedback = signal('Use the demo credentials or create a new account locally.');

  protected readonly loginForm = this.formBuilder.nonNullable.group({
    email: ['demo@reader.app', [Validators.required, Validators.email]],
    password: ['demo123', [Validators.required, Validators.minLength(6)]]
  });

  protected readonly signupForm = this.formBuilder.nonNullable.group({
    displayName: ['Demo Reader', [Validators.required, Validators.minLength(2)]],
    email: ['demo@reader.app', [Validators.required, Validators.email]],
    password: ['demo123', [Validators.required, Validators.minLength(6)]]
  });

  protected submitLogin(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const { email, password } = this.loginForm.getRawValue();
    const result = this.authService.login(email, password);
    this.feedback.set(result.message);

    if (result.success) {
      void this.router.navigate(['/home']);
    }
  }

  protected submitSignup(): void {
    if (this.signupForm.invalid) {
      this.signupForm.markAllAsTouched();
      return;
    }

    const result = this.authService.signup(this.signupForm.getRawValue());
    this.feedback.set(result.message);

    if (result.success) {
      void this.router.navigate(['/home']);
    }
  }
}
