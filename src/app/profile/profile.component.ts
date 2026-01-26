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

@Component({
  selector: 'app-profile',
  imports: [SidebarComponent, CommonModule, FormsModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit {
  // private apiUrl = 'http://localhost:8000';

  private apiUrl = environment.apiUrl;
  
  userData: UserData = {
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    created_at: '',
    user_id: ''
  };

  isLoading: boolean = true;
  editMode: boolean = false;

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
        this.toastr.error('Error fetching user profile:', error);
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
  }

  saveProfile(): void {
    // Implement save functionality here
    console.log('Saving profile:', this.userData);
    this.editMode = false;
    // You can make a PUT/PATCH request to update user data
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
    return `${this.userData.first_name} ${this.userData.last_name}`.trim();
  }

  getMemberSince(): string {
    if (!this.userData.created_at) return 'N/A';
    const date = new Date(this.userData.created_at);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }
}