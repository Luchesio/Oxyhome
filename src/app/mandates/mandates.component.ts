import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { SidebarComponent } from "../sidebar/sidebar.component";
import { ToastrService } from 'ngx-toastr';

import { environment } from '../../environments/environment';

interface UserProfile {
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
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
  selector: 'app-mandates',
  imports: [SidebarComponent, CommonModule],
  templateUrl: './mandates.component.html',
  styleUrl: './mandates.component.scss'
})
export class MandatesComponent implements OnInit {
  // private apiUrl = 'http://localhost:8000';

  private apiUrl = environment.apiUrl;
  
  // User data
  userProfile: UserProfile | null = null;
  
  // Mandates data
  accounts: AccountMandate[] = [];
  
  // UI state
  isLoading: boolean = true;
  errorMessage: string = '';

  constructor(private http: HttpClient, private router: Router,  private toastr: ToastrService) {}

  ngOnInit(): void {
    this.fetchUserProfileAndMandates();
  }

  async fetchUserProfileAndMandates(): Promise<void> {
    const token = localStorage.getItem('access_token');
    
    if (!token) {
      this.router.navigate(['/auth']);
      return;
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    try {
      // First fetch user profile
      const userResponse = await this.http.get<any>(`${this.apiUrl}/auth/me`, { headers }).toPromise();
      
      this.userProfile = {
        first_name: userResponse.first_name,
        last_name: userResponse.last_name,
        email: userResponse.email,
        phone_number: userResponse.phone_number
      };

      // Then fetch mandates
      await this.fetchMandates();
      
    } catch (error: any) {
      this.toastr.error('Error fetching user profile', error);
      // console.error('Error fetching user profile', error);
      if (error.status === 401) {
        localStorage.removeItem('access_token');
        this.router.navigate(['/auth']);
      } else {
        this.errorMessage = 'Failed to load user profile';
        this.isLoading = false;
      }
    }
  }

  generateRandomDigits(length: number): string {
    let result = '';
    for (let i = 0; i < length; i++) {
      result += Math.floor(Math.random() * 10);
    }
    return result;
  }

  async fetchMandates(): Promise<void> {
    if (!this.userProfile) {
      this.errorMessage = 'User profile not loaded';
      this.isLoading = false;
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    // Generate random refs
    const requestRef = this.generateRandomDigits(9);
    const transactionRef = this.generateRandomDigits(12);

    // Prepare payload
    const payload = {
      request_ref: requestRef,
      request_type: "Get Accounts Max",
      transaction: {
        mock_mode: "Live",
        transaction_ref: transactionRef,
        transaction_desc: "Check active mandates",
        transaction_ref_parent: null,
        amount: 0,
        customer: {
          customer_ref: this.userProfile.phone_number,
          firstname: this.userProfile.first_name,
          surname: this.userProfile.last_name,
          email: this.userProfile.email,
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
        this.accounts = response.response.data.provider_response.accounts || [];
      } else {
        this.errorMessage = 'No mandate data received';
      }
    } catch (error: any) {
      this.toastr.error('Error fetching mandates:', error);
      // console.error('Error fetching mandates:', error);
      this.errorMessage = 'Failed to load mandates. Please try again.';
    } finally {
      this.isLoading = false;
    }
  }

  getStatusClass(status: string): string {
    return status.toLowerCase() === 'active' ? 'active' : 'inactive';
  }

  refreshMandates(): void {
    this.fetchMandates();
  }

  getActiveMandatesCount(): number {
    return this.accounts.filter(acc => 
      acc.extended_data.mandate_status.toLowerCase() === 'active'
    ).length;
  }
}