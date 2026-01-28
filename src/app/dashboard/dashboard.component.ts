import { Router } from '@angular/router';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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

interface Bank {
  name: string;
  code: string;
}

interface AccountLookupResponse {
  status_code: number;
  response: {
    status: string;
    message: string;
    data: {
      provider_response: {
        customer_id: string;
        account_name: string;
        account_number: string;
        last_name: string;
        first_name: string;
        middle_name: string;
        gender: string;
        account_currency: string;
        dob: string;
        reference: string;
        meta: {
          [key: string]: any;
        }
      }
    }
  }
}

@Component({
  selector: 'app-dashboard',
  imports: [SidebarComponent, CommonModule, FormsModule],
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

  // Mandates properties
  allMandates: AccountMandate[] = [];
  displayedMandates: AccountMandate[] = [];
  isLoadingMandates: boolean = false;
  mandatesError: string = '';
  remainingMandatesCount: number = 0;

  // Bank linking modal properties
  showLinkBankModal: boolean = false;
  showBankResponseModal: boolean = false;
  isLinkingBank: boolean = false;
  
  // Form fields for bank linking
  linkAccountNumber: string = '';
  selectedBankCode: string = '';
  
  // Bank response data
  bankResponseData: any = null;
  bankResponseMessage: string = '';

  // Banks list
  banks: Bank[] = [
    { name: 'Access Bank Plc', code: '044' },
    { name: 'Alpha Morgan Bank', code: '108' },
    { name: 'Citibank Nigeria Ltd', code: '023' },
    { name: 'Ecobank Nigeria Plc', code: '050' },
    { name: 'Fidelity Bank Plc', code: '070' },
    { name: 'First Bank of Nigeria Ltd', code: '011' },
    { name: 'First City Monument Bank', code: '214' },
    { name: 'Globus Bank', code: '103' },
    { name: 'Guaranty Trust Bank', code: '058' },
    { name: 'Heritage Bank Plc', code: '030' },
    { name: 'Keystone Bank Limited', code: '082' },
    { name: 'Optimus Bank', code: '109' },
    { name: 'Parallex Bank', code: '110' },
    { name: 'Polaris Bank', code: '076' },
    { name: 'Premium Trust Bank', code: '107' },
    { name: 'Providus Bank', code: '101' },
    { name: 'Signature Bank', code: '106' },
    { name: 'Stanbic IBTC Bank Ltd', code: '221' },
    { name: 'Standard Chartered Bank', code: '068' },
    { name: 'Sterling Bank Plc', code: '232' },
    { name: 'SunTrust Bank Nigeria Ltd', code: '100' },
    { name: 'Titan Trust Bank', code: '102' },
    { name: 'Union Bank of Nigeria Plc', code: '032' },
    { name: 'United Bank for Africa', code: '033' },
    { name: 'Unity Bank Plc', code: '215' },
    { name: 'Wema Bank Plc', code: '035' },
    { name: 'Zenith Bank Plc', code: '057' }
  ];

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
    this.loadPrimaryBankAccount();
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

  async loadPrimaryBankAccount(): Promise<void> {
    const token = localStorage.getItem('access_token');
    
    if (!token) {
      return;
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    try {
      const response = await this.http.get<any>(
        `${this.apiUrl}/api/bank-accounts/primary`, 
        { headers }
      ).toPromise();
      
      if (response && response.status === 'success' && response.data) {
        // Update bank account display with actual data from database
        this.bankAccount = {
          name: response.data.account_name || 'No Account',
          lastFour: response.data.account_number ? response.data.account_number.slice(-4) : '****'
        };
      }
    } catch (error) {
      console.error('Error loading primary bank account:', error);
      // Keep default values if no account found
    }
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

  // Open link bank modal
  openLinkBankModal(): void {
    this.showLinkBankModal = true;
    this.resetLinkBankForm();
  }

  // Close link bank modal
  closeLinkBankModal(): void {
    this.showLinkBankModal = false;
    this.resetLinkBankForm();
  }

  // Reset link bank form
  resetLinkBankForm(): void {
    this.linkAccountNumber = '';
    this.selectedBankCode = '';
  }

  // Check if link bank form is valid
  isLinkBankFormValid(): boolean {
    return !!(
      this.linkAccountNumber &&
      this.linkAccountNumber.length === 10 &&
      this.selectedBankCode &&
      this.userProfile.phone_number
    );
  }

  // Submit bank account lookup
  async submitBankAccountLookup(): Promise<void> {
    if (!this.isLinkBankFormValid()) {
      this.toastr.error('Please fill in all required fields');
      return;
    }

    this.isLinkingBank = true;

    // Generate random refs
    const requestRef = this.generateRandomDigits(9);
    const transactionRef = this.generateRandomDigits(12);

    // Prepare payload
    const payload = {
      account_number: this.linkAccountNumber,
      cbn_bankcode: this.selectedBankCode,
      request_ref: requestRef,
      request_type: "lookup_account_min",
      auth_type: "bank.account",
      auth_provider: "PaywithAccount",
      transaction: {
        mock_mode: "Live",
        transaction_ref: transactionRef,
        transaction_desc: "Account lookup for linking",
        transaction_ref_parent: null,
        amount: 0,
        customer: {
          customer_ref: this.userProfile.phone_number!,
          firstname: this.userProfile.first_name || '',
          surname: this.userProfile.last_name || '',
          email: this.userProfile.email || '',
          mobile_no: this.userProfile.phone_number!
        },
        meta: {},
        details: {}
      }
    };

    try {
      const response = await this.http.post<AccountLookupResponse>(
        `${this.apiUrl}/api/getbanks`, 
        payload
      ).toPromise();
      
      if (response && response.response && response.response.data) {
        this.bankResponseData = response.response.data.provider_response;
        this.bankResponseMessage = response.response.message || 'Account details retrieved successfully';
        
        // Close first modal WITHOUT resetting form (we need the values later)
        this.showLinkBankModal = false;
        // Don't call resetLinkBankForm() here - we need those values!
        
        // Open response modal
        this.showBankResponseModal = true;
      } else {
        this.toastr.error('No account data received');
      }
    } catch (error: any) {
      this.toastr.error('Failed to lookup account. Please try again.');
      console.error('Error looking up account:', error);
    } finally {
      this.isLinkingBank = false;
    }
  }

  // Close bank response modal
  closeBankResponseModal(): void {
    this.showBankResponseModal = false;
    this.bankResponseData = null;
    this.bankResponseMessage = '';
    // Reset form fields after closing response modal
    this.resetLinkBankForm();
  }

  // Save bank account to database
  async saveBankAccountToDatabase(): Promise<void> {
    if (!this.bankResponseData) {
      this.toastr.error('No bank account data to save');
      return;
    }

    // Debug: Check if we have the form values
    console.log('Form values before saving:', {
      linkAccountNumber: this.linkAccountNumber,
      selectedBankCode: this.selectedBankCode,
      accountName: this.bankResponseData.account_name
    });

    if (!this.linkAccountNumber || !this.selectedBankCode) {
      this.toastr.error('Missing account number or bank code');
      console.error('Missing required form data!');
      return;
    }

    try {
      const token = localStorage.getItem('access_token');
      
      if (!token) {
        this.router.navigate(['/auth']);
        return;
      }

      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      });

      // Get bank name or use a fallback
      const bankName = this.getBankNameByCode(this.selectedBankCode) || 'Bank';

      // Prepare the data to save - including account_number and cbn_bankcode from the form
      const savePayload = {
        account_number: this.linkAccountNumber,  // From the form input
        cbn_bankcode: this.selectedBankCode,      // From the bank dropdown
        account_name: this.bankResponseData.account_name,  // From API response
        bank_name: bankName
      };

      console.log('Saving bank account with payload:', savePayload);

      // Call the save bank account endpoint
      const response = await this.http.post<any>(
        `${this.apiUrl}/api/save-bank-account`, 
        savePayload, 
        { headers }
      ).toPromise();
      
      console.log('Save response:', response);
      
      if (response && response.status === 'success') {
        this.toastr.success('Bank account linked successfully!');
        
        // Update the displayed bank account info with account_name
        this.bankAccount = {
          name: this.bankResponseData.account_name || bankName,
          lastFour: this.linkAccountNumber.slice(-4)
        };
        
        // Close modal
        this.closeBankResponseModal();
        
        // Optionally refresh mandates or other data
        this.fetchMandates();
      } else {
        this.toastr.error('Failed to link bank account');
      }
      
    } catch (error: any) {
      console.error('Error saving bank account:', error);
      
      // Handle specific error messages
      if (error.error && error.error.detail) {
        this.toastr.error(error.error.detail);
      } else if (error.status === 400) {
        this.toastr.error('Failed to save bank account');
      } else if (error.status === 401) {
        this.toastr.error('Session expired. Please login again.');
        localStorage.removeItem('access_token');
        this.router.navigate(['/auth']);
      } else {
        this.toastr.error('Failed to save bank account. Please try again.');
      }
    }
  }

  // Helper to get bank name by code
  getBankNameByCode(code: string): string | undefined {
    const bank = this.banks.find(b => b.code === code);
    return bank?.name;
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