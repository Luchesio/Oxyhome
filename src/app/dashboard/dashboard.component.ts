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
  bankName?: string;
  fullAccountNumber?: string;
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

interface Bank {
  name: string;
  code: string;
}

interface Webhook {
  _id: string;
  request_ref: string;
  request_type: string;
  details: {
    amount?: string;
    transaction_ref?: string;
    status?: string;
    customer_firstname?: string;
    customer_surname?: string;
    meta?: {
      note?: string;
      payment_option?: string;
      pwt_item_amount?: number;
      [key: string]: any;
    };
  };
  received_at: string;
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
  
  walletBalance: number = 0.00;
  isLoadingBalance: boolean = false;
  hasNotifications: boolean = true;

  userProfile: UserProfile = {
    name: 'Loading...',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
    email: ''
  };

  bankAccount: BankAccount = {
    name: 'No Account Linked',
    lastFour: '****',
    bankName: '',
    fullAccountNumber: ''
  };

  // Notifications properties (replacing mandates)
  allNotifications: any[] = [];
  displayedNotifications: any[] = [];
  isLoadingNotifications: boolean = false;
  notificationsError: string = '';
  remainingNotificationsCount: number = 0;

  // Account linking notification
  hasLinkedAccount: boolean = false;
  showLinkAccountNotification: boolean = false;

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
    this.loadWalletBalance();
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
        
        // Fetch notifications after user profile is loaded
        this.fetchNotifications();
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

  async loadWalletBalance(): Promise<void> {
    const token = localStorage.getItem('access_token');
    
    if (!token) {
      return;
    }

    this.isLoadingBalance = true;

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    try {
      const response = await this.http.get<any>(
        `${this.apiUrl}/api/wallet/balance`, 
        { headers }
      ).toPromise();
      
      if (response && response.status === 'success' && response.data) {
        this.walletBalance = response.data.balance || 0.00;
      }
    } catch (error) {
      console.error('Error loading wallet balance:', error);
      // Keep default value of 0.00 if error
      this.walletBalance = 0.00;
    } finally {
      this.isLoadingBalance = false;
    }
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
        // User has a linked account
        this.hasLinkedAccount = true;
        
        // Update bank account display with actual data from database
        this.bankAccount = {
          name: response.data.account_name || 'Account Holder',
          lastFour: response.data.account_number ? response.data.account_number.slice(-4) : '****',
          bankName: response.data.bank_name || '',
          fullAccountNumber: response.data.account_number || ''
        };
      } else {
        // No linked account - show notification after a short delay
        this.hasLinkedAccount = false;
        setTimeout(() => {
          this.showLinkAccountNotification = true;
          // Auto-hide after 5 seconds
          setTimeout(() => {
            this.showLinkAccountNotification = false;
          }, 5000);
        }, 1000);
      }
    } catch (error) {
      console.error('Error loading primary bank account:', error);
      // No account found - show notification
      this.hasLinkedAccount = false;
      setTimeout(() => {
        this.showLinkAccountNotification = true;
        setTimeout(() => {
          this.showLinkAccountNotification = false;
        }, 5000);
      }, 1000);
    }
  }

  async fetchNotifications(): Promise<void> {
    const token = localStorage.getItem('access_token');
    
    if (!token) {
      return;
    }

    this.isLoadingNotifications = true;
    this.notificationsError = '';

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    try {
      const response = await this.http.get<any>(
        `${this.apiUrl}/auth/webhooks`, 
        { headers }
      ).toPromise();
      
      if (response && response.webhooks) {
        this.allNotifications = response.webhooks || [];
        // Display only first 2 notifications
        this.displayedNotifications = this.allNotifications.slice(0, 2);
        this.remainingNotificationsCount = Math.max(0, this.allNotifications.length - 2);
      } else {
        this.notificationsError = 'No notification data received';
      }
    } catch (error: any) {
      this.toastr.error('Error fetching notifications');
      console.error('Error fetching notifications:', error);
      this.notificationsError = 'Failed to load notifications';
    } finally {
      this.isLoadingNotifications = false;
    }
  }

  refreshNotifications(): void {
    this.fetchNotifications();
  }

  getPaymentNote(notification: any): string {
    return notification.details?.meta?.note || 'Payment notification';
  }

  getPaymentOption(notification: any): string {
    return notification.details?.meta?.payment_option || 'N/A';
  }

  getPaymentAmount(notification: any): number {
    const amount = notification.details?.meta?.pwt_item_amount || 0;
    return amount / 100; // Convert kobo to naira
  }

  formatNotificationDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  getStatusClass(status: string): string {
    const statusLower = status?.toLowerCase() || '';
    if (statusLower.includes('success') || statusLower.includes('complete')) {
      return 'success';
    } else if (statusLower.includes('error') || statusLower.includes('fail')) {
      return 'error';
    } else if (statusLower.includes('pending') || statusLower.includes('processing')) {
      return 'pending';
    }
    return 'info';
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
        
        // Update the displayed bank account info with all details
        this.bankAccount = {
          name: this.bankResponseData.account_name || bankName,
          lastFour: this.linkAccountNumber.slice(-4),
          bankName: bankName,
          fullAccountNumber: this.linkAccountNumber
        };
        
        // Mark as having linked account
        this.hasLinkedAccount = true;
        
        // Close modal
        this.closeBankResponseModal();
        
        // Reload bank account to ensure UI is in sync with database
        this.loadPrimaryBankAccount();
        
        // Optionally refresh notifications
        // this.fetchNotifications();
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

  dismissLinkAccountNotification(): void {
    this.showLinkAccountNotification = false;
  }
}