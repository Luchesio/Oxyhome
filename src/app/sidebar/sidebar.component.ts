import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Router } from '@angular/router';

export interface MenuItem {
  label: string;
  icon: string;
  route: string;
  badge?: string;
}

@Component({
  selector: 'app-sidebar',
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent {
  isMenuOpen = false;

  constructor(private router: Router) { }

  @Input() menuItems: MenuItem[] = [
    {
      label: 'Dashboard',
      icon: 'assets/dashboard.svg',
      route: '/dashboard'
    },
    {
      label: 'Schedule Payment',
      icon: 'assets/schedule.svg',
      route: '/installments'
    },
    {
      label: 'Notifications',
      icon: 'assets/notification.svg',
      route: '/notifications',
      badge: '•'
    },
    {
      label: 'Profile',
      icon: 'assets/profile.svg',
      route: '/profile'
    },
    {
      label: 'Mandates',
      icon: 'assets/myinstallment.svg',
      route: '/mandates'
    }
  ];

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  closeMenu(): void {
    this.isMenuOpen = false;
  }

  logout(): void {
    localStorage.removeItem('access_token');
    this.router.navigate(['/auth']);
    this.closeMenu();
  }
}