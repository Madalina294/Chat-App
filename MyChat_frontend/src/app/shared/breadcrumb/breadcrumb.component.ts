import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd, ActivatedRoute, RouterModule } from '@angular/router';
import { MatIcon } from '@angular/material/icon';
import { filter } from 'rxjs/operators';

interface BreadcrumbItem {
  label: string;
  url: string;
  active: boolean;
}

@Component({
  selector: 'app-breadcrumb',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIcon],
  templateUrl: './breadcrumb.component.html',
  styleUrl: './breadcrumb.component.scss'
})
export class BreadcrumbComponent implements OnInit {
  breadcrumbs: BreadcrumbItem[] = [];

  private routeLabels: { [key: string]: string } = {
    'admin': 'Admin Dashboard',
    'dashboard': 'Dashboard',
    'all-users': 'Manage Users',
    'statistics': 'Statistics',
    'settings': 'Setting',
    'activity-logs': 'Activity Logs'
  };

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute
  ) {}

  ngOnInit() {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.buildBreadcrumbs();
      });

    // Construiește breadcrumbs la inițializare
    this.buildBreadcrumbs();
  }

  private buildBreadcrumbs() {
    const url = this.router.url;
    const urlSegments = url.split('/').filter(segment => segment);

    this.breadcrumbs = [];

    // Adaugă Home doar dacă nu suntem pe pagina principală
    if (urlSegments.length > 0) {
      this.breadcrumbs.push({
        label: 'Home',
        url: '/welcome',
        active: false
      });
    }

    let currentPath = '';

    urlSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const isLast = index === urlSegments.length - 1;

      this.breadcrumbs.push({
        label: this.routeLabels[segment] || this.formatLabel(segment),
        url: currentPath,
        active: isLast
      });
    });
  }

  private formatLabel(segment: string): string {
    return segment
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
}
