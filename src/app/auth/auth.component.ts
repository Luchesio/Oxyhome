import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

import { CommonModule } from '@angular/common';

import { Router } from '@angular/router';

@Component({
  selector: 'app-auth',
  imports: [FormsModule,CommonModule],
  templateUrl: './auth.component.html',
  styleUrl: './auth.component.scss'
})
export class AuthComponent {
  // Signup form fields
  signupEmail: string = '';
  signupPassword: string = '';
  signupPhoneNumber: string = '';
  signupFullName: string = '';

  // Login form fields
  loginEmail: string = '';
  loginPassword: string = '';
   isLoginMode = true;
  // API base URL (adjust to your backend URL)
  private apiUrl = 'http://localhost:8000/auth';

  constructor(private http: HttpClient, private router: Router) {}

  onSignup() {
    const formData = new FormData();
    formData.append('email', this.signupEmail);
    formData.append('password', this.signupPassword);
    formData.append('phone_number', this.signupPhoneNumber);
    formData.append('full_name', this.signupFullName);

    this.http.post(`${this.apiUrl}/signup`, formData).subscribe(
      response => {
        console.log('Signup successful', response);
        alert('Signup successful! Logging in automatically...');
        // Auto-login after signup
        this.autoLoginAfterSignup(this.signupEmail, this.signupPassword);
      },
      error => {
        console.error('Signup error', error);
        alert('Signup failed: ' + (error.error?.detail || 'Unknown error'));
      }
    );
  }

  onSwitchMode() {
    this.isLoginMode = !this.isLoginMode;
  }

  autoLoginAfterSignup(email: string, password: string) {
    const loginFormData = new FormData();
    loginFormData.append('username', email);
    loginFormData.append('password', password);

    this.http.post(`${this.apiUrl}/login`, loginFormData).subscribe(
      (response: any) => {
        console.log('Auto-login successful', response);
        localStorage.setItem('access_token', response.access_token);
        this.router.navigate(['/dashboard']);
      },
      error => {
        console.error('Auto-login error', error);
        alert('Auto-login failed: ' + (error.error?.detail || 'Unknown error'));
      }
    );
  }

  onLogin() {
    const formData = new FormData();
    formData.append('username', this.loginEmail);  // Note: backend uses 'username' for email in login
    formData.append('password', this.loginPassword);

    this.http.post(`${this.apiUrl}/login`, formData).subscribe(
      (response: any) => {
        console.log('Login successful', response);
        localStorage.setItem('access_token', response.access_token);
        this.router.navigate(['/dashboard']);
      },
      error => {
        console.error('Login error', error);
        alert('Login failed: ' + (error.error?.detail || 'Unknown error'));
      }
    );
  }
}
