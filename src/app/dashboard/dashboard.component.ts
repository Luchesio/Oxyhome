import { Router } from '@angular/router';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { SidebarComponent } from "../sidebar/sidebar.component";
import { ToastrService } from 'ngx-toastr';

import { environment } from '../../environments/environment';

export interface BankAccount {
  name: string;
  lastFour: string;
}

export interface UserProfile {
  name: string;
  avatar: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
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

interface AccountMandate {
  account_number: string;
  account_name: string;
  bank_name: string;
  bank_code: string;
  extended_data: {
    mandate_status: string;
  }
}

interface MandateResponse {
  status_code: number;
  response: {
    status: string;
    message: string;
    data: {
      provider_response: {
        accounts: AccountMandate[];
        reference: string;
        meta: {
          records: number;
          page: number;
          pages: number;
          page_size: number;
        }
      }
    }
  }
}

@Component({
  selector: 'app-dashboard',
  imports: [SidebarComponent, CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
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

  // Mandates properties
  allMandates: AccountMandate[] = [];
  displayedMandates: AccountMandate[] = [];
  isLoadingMandates: boolean = false;
  mandatesError: string = '';
  remainingMandatesCount: number = 0;

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

  constructor(
    private router: Router, 
    private http: HttpClient,
    private toastr: ToastrService
  ) {}

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
        this.userProfile = {
          name: response.first_name || 'User',
          avatar: this.userProfile.avatar,
          email: response.email,
          first_name: response.first_name,
          last_name: response.last_name,
          phone_number: response.phone_number
        };
        
        // Fetch mandates after user profile is loaded
        this.fetchMandates();
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

  generateRandomDigits(length: number): string {
    let result = '';
    for (let i = 0; i < length; i++) {
      result += Math.floor(Math.random() * 10);
    }
    return result;
  }

  async fetchMandates(): Promise<void> {
    if (!this.userProfile.phone_number) {
      return;
    }

    this.isLoadingMandates = true;
    this.mandatesError = '';

    // Generate random refs
    const requestRef = this.generateRandomDigits(9);
    const transactionRef = this.generateRandomDigits(12);

    // Prepare payload
    const payload = {
      request_ref: requestRef,
      request_type: "Get Accounts Max",
      transaction: {
        mock_mode: "Inspect",
        transaction_ref: transactionRef,
        transaction_desc: "Check active mandates",
        transaction_ref_parent: null,
        amount: 0,
        customer: {
          customer_ref: this.userProfile.phone_number,
          firstname: this.userProfile.first_name || '',
          surname: this.userProfile.last_name || '',
          email: this.userProfile.email || '',
          mobile_no: this.userProfile.phone_number
        },
        meta: {
          biller_code: "000734"
        },
        details: {}
      }
    };

    try {
      const response = await this.http.post<MandateResponse>(
        `${this.apiUrl}/api/mandate`, 
        payload
      ).toPromise();
      
      if (response && response.response && response.response.data) {
        this.allMandates = response.response.data.provider_response.accounts || [];
        // Display only first 2 mandates
        this.displayedMandates = this.allMandates.slice(0, 2);
        this.remainingMandatesCount = Math.max(0, this.allMandates.length - 2);
      } else {
        this.mandatesError = 'No mandate data received';
      }
    } catch (error: any) {
      this.toastr.error('Error fetching mandates');
      console.error('Error fetching mandates:', error);
      this.mandatesError = 'Failed to load mandates';
    } finally {
      this.isLoadingMandates = false;
    }
  }

  refreshMandates(): void {
    this.fetchMandates();
  }

  getStatusClass(status: string): string {
    return status.toLowerCase() === 'active' ? 'active' : 'inactive';
  }

  goToNotifications(): void {
    this.router.navigate(['/notifications']);
  }

  goToProfile(): void {
    this.router.navigate(['/profile']);
  }

  goToMandates(): void {
    this.router.navigate(['/mandates']);
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