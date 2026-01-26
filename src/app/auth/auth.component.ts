import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

import { environment } from '../../environments/environment';

@Component({
  selector: 'app-auth',
  imports: [FormsModule, CommonModule],
  templateUrl: './auth.component.html',
  styleUrl: './auth.component.scss'
})
export class AuthComponent {
  // Signup form fields
  signupEmail: string = '';
  signupPassword: string = '';
  signupConfirmPassword: string = '';
  signupPhoneNumber: string = '';
  signupFirstName: string = '';
  signupLastName: string = '';

  // Login form fields
  loginEmail: string = '';
  loginPassword: string = '';
  showLoginPassword: boolean = false;
  showSignupPassword: boolean = false;
  showConfirmPassword: boolean = false;
  isLoginMode = true;
  isLoggingIn: boolean = false;

  // API base URL (adjust to your backend URL)
  // private apiUrl = 'http://localhost:8000';

  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient, private router: Router, private toastr: ToastrService) {}

  onSignup() {
    // Validate password match on frontend
    if (this.signupPassword !== this.signupConfirmPassword) {
      alert('Passwords do not match!');
      return;
    }

    // Validate phone number format
    const phonePattern = /^0[7-9][0-1]\d{8}$/;
    if (!phonePattern.test(this.signupPhoneNumber)) {
      alert('Phone number must be in format: 09056035245 (11 digits starting with 070-091)');
      return;
    }

    const formData = new FormData();
    formData.append('email', this.signupEmail);
    formData.append('password', this.signupPassword);
    formData.append('confirm_password', this.signupConfirmPassword);
    formData.append('phone_number', this.signupPhoneNumber);
    formData.append('first_name', this.signupFirstName);
    formData.append('last_name', this.signupLastName);

    this.http.post(`${this.apiUrl}/auth/signup`, formData).subscribe(
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
    // Clear form fields when switching modes
    this.clearForms();
  }

  clearForms() {
    // Clear signup fields
    this.signupEmail = '';
    this.signupPassword = '';
    this.signupConfirmPassword = '';
    this.signupPhoneNumber = '';
    this.signupFirstName = '';
    this.signupLastName = '';

    // Clear login fields
    this.loginEmail = '';
    this.loginPassword = '';

    // Reset password visibility
    this.showLoginPassword = false;
    this.showSignupPassword = false;
    this.showConfirmPassword = false;
  }

  autoLoginAfterSignup(email: string, password: string) {
    const loginFormData = new FormData();
    loginFormData.append('username', email);
    loginFormData.append('password', password);

    this.http.post(`${this.apiUrl}/auth/login`, loginFormData).subscribe(
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
    this.isLoggingIn = true;
    const formData = new FormData();
    formData.append('username', this.loginEmail);  // Note: backend uses 'username' for email in login
    formData.append('password', this.loginPassword);

    this.http.post(`${this.apiUrl}/auth/login`, formData).subscribe(
      (response: any) => {
        // console.log('Login successful', response);
        this.toastr.success('Login Successful');
        localStorage.setItem('access_token', response.access_token);
        this.router.navigate(['/dashboard']);
        this.isLoggingIn = false;
      },
      error => {
        // console.error('Login error', error);
        this.toastr.error('Login failed: ' + (error.error?.detail || 'Unknown error'));
        // alert('Login failed: ' + (error.error?.detail || 'Unknown error'));
        this.isLoggingIn = false;
      }
    );
  }
}