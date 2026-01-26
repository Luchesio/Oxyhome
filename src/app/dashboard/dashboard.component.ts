import { Router } from '@angular/router';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { SidebarComponent } from "../sidebar/sidebar.component";

import { environment } from '../../environments/environment';

export interface BankAccount {
  name: string;
  lastFour: string;
}

export interface UserProfile {
  name: string;
  avatar: string;
  email?: string;
}

export interface Installment {
  id: string;
  name: string;
  icon: string;
  dueDate: Date;
  dueDateShort: string;
  amount: number;
  status: 'Due' | 'Paid' | 'Overdue';
}

@Component({
  selector: 'app-dashboard',
  imports: [SidebarComponent, CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  // private apiUrl = 'http://localhost:8000';

  private apiUrl = environment.apiUrl;
  
  walletBalance: number = 150000.00;
  hasNotifications: boolean = true;

  userProfile: UserProfile = {
    name: 'Loading...',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
    email: ''
  };

  bankAccount: BankAccount = {
    name: 'Access Bank',
    lastFour: '5678'
  };

  installments: Installment[] = [
    {
      id: '1',
      name: 'Samsung Washing Machine',
      icon: 'assets/icons/washing-machine.png',
      dueDate: new Date('2023-03-10'),
      dueDateShort: '24.10, 2021',
      amount: 150000.00,
      status: 'Due'
    },
    {
      id: '2',
      name: 'LG Refrigerator',
      icon: 'assets/icons/refrigerator.png',
      dueDate: new Date('2023-03-13'),
      dueDateShort: '24.10, 2021',
      amount: 1000.00,
      status: 'Due'
    },
    {
      id: '3',
      name: 'LG Refrigerator',
      icon: 'assets/icons/refrigerator.png',
      dueDate: new Date('2023-03-10'),
      dueDateShort: '24.10, 2021',
      amount: 500.00,
      status: 'Due'
    },
    {
      id: '4',
      name: 'Samsung Washing Machine',
      icon: 'assets/icons/washing-machine.png',
      dueDate: new Date('2023-03-13'),
      dueDateShort: '28 IM, 2021',
      amount: 150000.00,
      status: 'Due'
    }
  ];

  constructor(private router: Router, private http: HttpClient) {}

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
        // Only use first_name for display
        this.userProfile = {
          name: response.first_name || 'User',
          avatar: this.userProfile.avatar,
          email: response.email
        };
      },
      error => {
        console.error('Error fetching user profile', error);
        if (error.status === 401) {
          localStorage.removeItem('access_token');
          this.router.navigate(['/auth']);
        }
      }
    );
  }

  goToNotifications(): void {
    this.router.navigate(['/notifications']);
  }

  goToProfile(): void {
    this.router.navigate(['/profile']);
  }

  topUpWallet(): void {
    console.log('Top up wallet clicked');
  }

  viewInstallment(installment: Installment): void {
    console.log('View installment:', installment);
  }

  logout(): void {
    localStorage.removeItem('access_token');
    this.router.navigate(['/auth']);
  }
}