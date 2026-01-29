import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { SidebarComponent } from "../sidebar/sidebar.component";
import { ToastrService } from 'ngx-toastr';

import { environment } from '../../environments/environment';

interface Webhook {
  _id: string;
  request_ref: string;
  request_type: string;
  requester: string;
  mock_mode: string;
  details: {
    amount: string;
    transaction_type: string;
    transaction_ref: string;
    transaction_desc: string;
    status: string;
    provider: string;
    customer_ref: string;
    customer_email: string;
    customer_firstname: string;
    customer_surname: string;
    customer_mobile_no: string;
    meta: {
      note?: string;
      payment_option?: string;
      pwt_item_amount?: number;
      [key: string]: any;
    };
  };
  received_at: string;
  signature: string;
}

interface WebhookResponse {
  webhooks: Webhook[];
  count: number;
}

@Component({
  selector: 'app-notifications',
  imports: [SidebarComponent, CommonModule],
  templateUrl: './notifications.component.html',
  styleUrl: './notifications.component.scss'
})
export class NotificationsComponent implements OnInit {
  // private apiUrl = 'http://localhost:8000';

  private apiUrl = environment.apiUrl;
  
  webhooks: Webhook[] = [];
  isLoading: boolean = true;
  errorMessage: string = '';

  constructor(private http: HttpClient, private router: Router, private toastr: ToastrService) {}

  ngOnInit(): void {
    this.fetchWebhooks();
  }

  async fetchWebhooks(): Promise<void> {
    const token = localStorage.getItem('access_token');
    
    if (!token) {
      this.router.navigate(['/auth']);
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    try {
      const response = await this.http.get<WebhookResponse>(
        `${this.apiUrl}/auth/webhooks`, 
        { headers }
      ).toPromise();
      
      if (response) {
        this.webhooks = response.webhooks || [];
      } else {
        this.errorMessage = 'No webhook data received';
      }
    } catch (error: any) {
      // console.error('Error fetching webhooks:', error);
      this.toastr.error('Error fetching webhooks:', error);
      if (error.status === 401) {
        localStorage.removeItem('access_token');
        this.router.navigate(['/auth']);
      } else {
        this.errorMessage = 'Failed to load notifications. Please try again.';
      }
    } finally {
      this.isLoading = false;
    }
  }

  refreshWebhooks(): void {
    this.fetchWebhooks();
  }

  // FIX: Removed '?.' from details and meta because interface says they are required
  getPaymentNote(webhook: Webhook): string {
    return webhook.details.meta.note || 'No note available';
  }

  getPaymentOption(webhook: Webhook): string {
    return webhook.details.meta.payment_option || 'N/A';
  }

  getPaymentAmount(webhook: Webhook): number {
    return webhook.details.meta.pwt_item_amount || 0;
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // FIX: Updated signature to accept undefined to satisfy strict HTML templates
  getStatusClass(status: string | undefined): string {
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
}