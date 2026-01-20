import { Routes } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard.component';
import { HomeComponent } from './home/home.component';
import { AuthComponent } from './auth/auth.component';
export const routes: Routes = [

    { path: '', redirectTo: 'home', pathMatch: 'full' },
    
    { path: 'home', component: HomeComponent },

    { path: 'auth', component: AuthComponent },

    { path: 'dashboard', component: DashboardComponent }

];
