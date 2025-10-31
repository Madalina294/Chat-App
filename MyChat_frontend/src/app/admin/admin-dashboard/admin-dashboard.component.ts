import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatGridListModule } from '@angular/material/grid-list';
import { BreadcrumbComponent } from '../../shared/breadcrumb/breadcrumb.component';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatGridListModule,
    BreadcrumbComponent,
    TranslateModule
  ],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss'
})
export class AdminDashboardComponent {

  constructor(private translate: TranslateService) {}

  get dashboardItems() {
    return [
      {
        title: this.translate.instant('adminDashboard.manageUsers.title'),
        description: this.translate.instant('adminDashboard.manageUsers.description'),
        icon: 'supervisor_account',
        route: '/admin/all-users',
        color: 'primary'
      },
      {
        title: this.translate.instant('adminDashboard.statistics.title'),
        description: this.translate.instant('adminDashboard.statistics.description'),
        icon: 'analytics',
        route: '/admin/statistics',
        color: 'accent'
      },
      {
        title: this.translate.instant('adminDashboard.systemSettings.title'),
        description: this.translate.instant('adminDashboard.systemSettings.description'),
        icon: 'settings',
        route: '/admin/settings',
        color: 'warn'
      },
      {
        title: this.translate.instant('adminDashboard.activityLogs.title'),
        description: this.translate.instant('adminDashboard.activityLogs.description'),
        icon: 'history',
        route: '/admin/activity-logs',
        color: 'primary'
      }
    ];
  }
}
