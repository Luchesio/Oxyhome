import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { SidebarComponent } from "../sidebar/sidebar.component";
import { ToastrService } from 'ngx-toastr';


import { environment } from '../../environments/environment';

interface UserData {
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  created_at?: string;
  user_id?: string;
}

interface PasswordChangeData {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

@Component({
  selector: 'app-profile',
  imports: [SidebarComponent, CommonModule, FormsModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit {
  private apiUrl = 'http://localhost:8000';

  // private apiUrl = environment.apiUrl;
  
  userData: UserData = {
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    created_at: '',
    user_id: ''
  };

  passwordData: PasswordChangeData = {
    current_password: '',
    new_password: '',
    confirm_password: ''
  };

  isLoading: boolean = true;
  editMode: boolean = false;
  showPasswordModal: boolean = false;
  isChangingPassword: boolean = false;

  // Additional profile stats (you can fetch these from your backend)
  profileStats = {
    totalPurchases: 12,
    activePlans: 3,
    completedPayments: 8,
    walletBalance: 150000.00
  };

  constructor(private http: HttpClient, private router: Router, private toastr: ToastrService) {}

  ngOnInit(): void {
    this.fetchUserProfile();
  }

  fetchUserProfile(): void {
    const token = localStorage.getItem('access_token');
    
    if (!token) {
      this.router.navigate(['/auth']);
      return;
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    this.http.get<any>(`${this.apiUrl}/auth/me`, { headers }).subscribe(
      response => {
        this.userData = {
          first_name: response.first_name,
          last_name: response.last_name,
          email: response.email,
          phone_number: response.phone_number,
          created_at: response.created_at || new Date().toISOString(),
          user_id: response.id || response._id
        };
        this.isLoading = false;
      },
      error => {
        // console.error('Error fetching user profile', error);
        this.toastr.error('Error fetching user profile');
        this.isLoading = false;
        if (error.status === 401) {
          localStorage.removeItem('access_token');
          this.router.navigate(['/auth']);
        }
      }
    );
  }

  toggleEditMode(): void {
    this.editMode = !this.editMode;
    if (!this.editMode) {
      // Reload user data if edit is cancelled
      this.fetchUserProfile();
    }
  }

  saveProfile(): void {
    const token = localStorage.getItem('access_token');
    
    if (!token) {
      this.toastr.error('You must be logged in to update your profile');
      this.router.navigate(['/auth']);
      return;
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    const updateData = {
      first_name: this.userData.first_name,
      last_name: this.userData.last_name,
      email: this.userData.email,
      phone_number: this.userData.phone_number
    };

    this.http.put<any>(`${this.apiUrl}/auth/me`, updateData, { headers }).subscribe(
      response => {
        this.toastr.success('Profile updated successfully!');
        this.editMode = false;
        this.fetchUserProfile(); // Refresh the data
      },
      error => {
        console.error('Error updating profile', error);
        if (error.error && error.error.detail) {
          this.toastr.error(error.error.detail);
        } else {
          this.toastr.error('Failed to update profile. Please try again.');
        }
      }
    );
  }

  openPasswordModal(): void {
    this.showPasswordModal = true;
    this.passwordData = {
      current_password: '',
      new_password: '',
      confirm_password: ''
    };
  }

  closePasswordModal(): void {
    this.showPasswordModal = false;
    this.passwordData = {
      current_password: '',
      new_password: '',
      confirm_password: ''
    };
  }

  changePassword(): void {
    // Validation
    if (!this.passwordData.current_password || !this.passwordData.new_password || !this.passwordData.confirm_password) {
      this.toastr.error('All password fields are required');
      return;
    }

    if (this.passwordData.new_password !== this.passwordData.confirm_password) {
      this.toastr.error('New passwords do not match');
      return;
    }

    if (this.passwordData.new_password.length < 8) {
      this.toastr.error('New password must be at least 8 characters long');
      return;
    }

    const token = localStorage.getItem('access_token');
    
    if (!token) {
      this.toastr.error('You must be logged in to change your password');
      this.router.navigate(['/auth']);
      return;
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    this.isChangingPassword = true;

    this.http.post<any>(`${this.apiUrl}/auth/change-password`, this.passwordData, { headers }).subscribe(
      response => {
        this.toastr.success('Password changed successfully!');
        this.closePasswordModal();
        this.isChangingPassword = false;
      },
      error => {
        console.error('Error changing password', error);
        if (error.error && error.error.detail) {
          this.toastr.error(error.error.detail);
        } else {
          this.toastr.error('Failed to change password. Please try again.');
        }
        this.isChangingPassword = false;
      }
    );
  }

  logout(): void {
    localStorage.removeItem('access_token');
    this.router.navigate(['/auth']);
  }

  goToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  getInitials(): string {
    const firstInitial = this.userData.first_name ? this.userData.first_name[0] : '';
    const lastInitial = this.userData.last_name ? this.userData.last_name[0] : '';
    return (firstInitial + lastInitial).toUpperCase() || 'U';
  }

  getFullName(): string {
    const firstName = this.userData.first_name ? this.capitalizeFirstLetter(this.userData.first_name) : '';
    const lastName = this.userData.last_name ? this.capitalizeFirstLetter(this.userData.last_name) : '';
    return `${firstName} ${lastName}`.trim();
  }

  capitalizeFirstLetter(text: string): string {
    if (!text) return '';
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  }

  getMemberSince(): string {
    if (!this.userData.created_at) return 'N/A';
    const date = new Date(this.userData.created_at);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }
}