import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { SidebarComponent } from "../sidebar/sidebar.component";

interface Webhook {
  _id: string;
  event: string;
  data: any;
  timestamp: string;
  received_at: string;
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
  private apiUrl = 'http://localhost:8000';
  
  webhooks: Webhook[] = [];
  isLoading: boolean = true;
  errorMessage: string = '';

  constructor(private http: HttpClient, private router: Router) {}

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
      console.error('Error fetching webhooks:', error);
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

  getEventTypeClass(event: string): string {
    const eventLower = event.toLowerCase();
    if (eventLower.includes('success') || eventLower.includes('complete')) {
      return 'success';
    } else if (eventLower.includes('error') || eventLower.includes('fail')) {
      return 'error';
    } else if (eventLower.includes('pending') || eventLower.includes('processing')) {
      return 'pending';
    }
    return 'info';
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

  getEventIcon(event: string): string {
    const eventLower = event.toLowerCase();
    if (eventLower.includes('payment') || eventLower.includes('transaction')) {
      return 'payment';
    } else if (eventLower.includes('mandate')) {
      return 'mandate';
    } else if (eventLower.includes('account')) {
      return 'account';
    }
    return 'notification';
  }
}