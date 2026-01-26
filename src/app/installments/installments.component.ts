import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { SidebarComponent } from "../sidebar/sidebar.component";

interface Bank {
  name: string;
  code: string;
}

interface UserProfile {
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
}

interface InvoiceResponse {
  status: string;
  message: string;
  data: {
    provider_response: {
      meta: {
        payment_id: number;
        virtual_account_name: string;
        virtual_account_number: string;
        virtual_account_bank_name: string;
        virtual_account_bank_code: string;
        virtual_account_status: string;
        virtual_account_expiry_date: string;
        ussd_code: string | null;
      }
    }
  }
}

@Component({
  selector: 'app-installments',
  imports: [SidebarComponent, CommonModule, FormsModule],
  templateUrl: './installments.component.html',
  styleUrl: './installments.component.scss'
})
export class InstallmentsComponent implements OnInit {
  private apiUrl = 'http://localhost:8000';
  
  // Form fields
  accountNumber: string = '';
  selectedBankCode: string = '';
  amount: number | null = null;
  downPayment: number | null = null;
  repeatFrequency: string = '';
  numberOfPayments: number | null = null;
  
  // User data from backend
  userProfile: UserProfile | null = null;
  
  // UI state
  isLoading: boolean = false;
  showModal: boolean = false;
  modalMessage: string = '';
  modalMeta: any = null;
  
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

  repeatFrequencies = [
    { value: 'daily', label: 'Daily' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'annually', label: 'Annually' }
  ];

  constructor(private http: HttpClient, private router: Router) {}

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
          first_name: response.first_name,
          last_name: response.last_name,
          email: response.email,
          phone_number: response.phone_number
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

  generateRandomDigits(length: number): string {
    let result = '';
    for (let i = 0; i < length; i++) {
      result += Math.floor(Math.random() * 10);
    }
    return result;
  }

  generateRepeatStartDate(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    
    return `${year}-${month}-${day}-${hours}-${minutes}-${seconds}`;
  }

  calculateNumberOfPayments(): number {
    if (!this.amount || !this.downPayment) return 0;
    
    const remaining = this.amount - this.downPayment;
    if (remaining <= 0) return 0;
    
    // For simplicity, assuming equal installments
    // You can modify this logic based on your business rules
    return Math.ceil(remaining / this.downPayment);
  }

  isFormValid(): boolean {
    return !!(
      this.accountNumber &&
      this.selectedBankCode &&
      this.amount &&
      this.downPayment &&
      this.repeatFrequency &&
      this.userProfile
    );
  }

  async submitInvoice(): Promise<void> {
    if (!this.isFormValid()) {
      alert('Please fill in all required fields');
      return;
    }

    this.isLoading = true;

    // Generate random refs
    const requestRef = this.generateRandomDigits(9);
    const transactionRef = this.generateRandomDigits(12);
    
    // Calculate number of payments
    this.numberOfPayments = this.calculateNumberOfPayments();

    // Generate repeat start date
    const repeatStartDate = this.generateRepeatStartDate();

    // Prepare payload
    const payload = {
      account_number: this.accountNumber,
      cbn_bankcode: this.selectedBankCode,
      request_ref: requestRef,
      request_type: "send invoice",
      auth_type: "bank.account",
      auth_provider: "PaywithAccount",
      transaction: {
        mock_mode: "Inspect",
        transaction_ref: transactionRef,
        transaction_desc: `Installment payment - ${this.amount}`,
        transaction_ref_parent: null,
        amount: this.amount,
        customer: {
          customer_ref: this.userProfile!.phone_number,
          firstname: this.userProfile!.first_name,
          surname: this.userProfile!.last_name,
          email: this.userProfile!.email,
          mobile_no: this.userProfile!.phone_number
        },
        meta: {
          type: "instalment",
          down_payment: this.downPayment,
          repeat_frequency: this.repeatFrequency,
          repeat_start_date: repeatStartDate,
          number_of_payments: this.numberOfPayments,
          biller_code: "000734"
        },
        details: {}
      }
    };

    try {
      const response = await this.http.post<any>(`${this.apiUrl}/api/invoice`, payload).toPromise();
      
      // Show modal with response
      if (response && response.response) {
        this.modalMessage = response.response.message || 'Invoice sent successfully';
        this.modalMeta = response.response.data?.provider_response?.meta || null;
        this.showModal = true;
        
        // Reset form on success
        this.resetForm();
      }
    } catch (error: any) {
      console.error('Error submitting invoice:', error);
      alert('Failed to send invoice. Please try again.');
    } finally {
      this.isLoading = false;
    }
  }

  resetForm(): void {
    this.accountNumber = '';
    this.selectedBankCode = '';
    this.amount = null;
    this.downPayment = null;
    this.repeatFrequency = '';
    this.numberOfPayments = null;
  }

  closeModal(): void {
    this.showModal = false;
    this.modalMessage = '';
    this.modalMeta = null;
  }
}