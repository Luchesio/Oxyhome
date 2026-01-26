import { Routes } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard.component';
import { HomeComponent } from './home/home.component';
import { AuthComponent } from './auth/auth.component';
import { ProfileComponent } from './profile/profile.component';
import { NotificationsComponent } from './notifications/notifications.component';
import { InstallmentsComponent } from './installments/installments.component';
import { MandatesComponent } from './mandates/mandates.component';
export const routes: Routes = [

    { path: '', redirectTo: 'home', pathMatch: 'full' },
    
    { path: 'home', component: HomeComponent },

    { path: 'auth', component: AuthComponent },

    { path: 'profile', component: ProfileComponent },
    { path: 'notifications', component: NotificationsComponent },
    { path: 'installments', component: InstallmentsComponent },

    { path: 'dashboard', component: DashboardComponent },

    { path: 'mandates', component: MandatesComponent }

];
