import { Component, OnInit, signal, Injectable } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardHeader, MatCardTitle, MatCardContent, MatCardActions, MatCardSubtitle } from '@angular/material/card';
import { MatIcon } from '@angular/material/icon';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatPaginator, MatPaginatorIntl, PageEvent } from '@angular/material/paginator';
import { MatSelect } from '@angular/material/select';
import {MatFormField, MatLabel} from '@angular/material/form-field';
import { MatOption } from '@angular/material/core';
import { AdminService, UserData, PaginatedResponse } from '../../services/admin/admin.service';
import { BreadcrumbComponent } from '../../shared/breadcrumb/breadcrumb.component';
import {ConfirmDeleteComponent} from '../../shared/confirm-delete/confirm-delete.component';
import {MatDialog} from '@angular/material/dialog';
import {Router, RouterLink} from '@angular/router';
import {TranslateModule, TranslateService} from '@ngx-translate/core';
import { Subject } from 'rxjs';

@Injectable()
export class CustomPaginatorIntl extends MatPaginatorIntl {
  constructor(private translate: TranslateService) {
    super();
    this.translate.onLangChange.subscribe(() => {
      this.getTranslations();
    });
    this.getTranslations();
  }

  getTranslations() {
    this.itemsPerPageLabel = this.translate.instant('allUsers.paginator.itemsPerPage');
    this.nextPageLabel = this.translate.instant('allUsers.paginator.nextPage');
    this.previousPageLabel = this.translate.instant('allUsers.paginator.previousPage');
    this.firstPageLabel = this.translate.instant('allUsers.paginator.firstPage');
    this.lastPageLabel = this.translate.instant('allUsers.paginator.lastPage');
    this.changes.next();
  }

  override getRangeLabel = (page: number, pageSize: number, length: number): string => {
    if (length === 0 || pageSize === 0) {
      return this.translate.instant('allUsers.showing') + ` 0 ` + this.translate.instant('allUsers.paginator.ofLabel') + ` ${length}`;
    }
    const startIndex = page * pageSize;
    const endIndex = startIndex < length ? Math.min(startIndex + pageSize, length) : startIndex + pageSize;
    return `${startIndex + 1} - ${endIndex} ` + this.translate.instant('allUsers.paginator.ofLabel') + ` ${length}`;
  };
}

@Component({
  selector: 'app-all-users',
  standalone: true,
  imports: [
    CommonModule,
    MatButton,
    MatCard,
    MatCardHeader,
    MatCardTitle,
    MatCardSubtitle,
    MatCardContent,
    MatCardActions,
    MatIcon,
    MatProgressSpinner,
    MatPaginator,
    MatSelect,
    MatFormField,
    MatOption,
    BreadcrumbComponent,
    MatLabel,
    TranslateModule
  ],
  templateUrl: './all-users.component.html',
  styleUrl: './all-users.component.scss',
  providers: [
    { provide: MatPaginatorIntl, useClass: CustomPaginatorIntl }
  ]
})
export class AllUsersComponent implements OnInit {
  users = signal<UserData[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  // Pagination properties
  totalElements = signal(0);
  pageSize = signal(10);
  currentPage = signal(0);
  pageSizeOptions = [5, 10, 20, 50];
  sortBy = signal('id');
  sortDir = signal('asc');

  // Make Math available in template
  Math = Math;

  constructor(
    private adminService: AdminService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private router: Router,
    private translate: TranslateService
  ) {}

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.loading.set(true);
    this.error.set(null);

    this.adminService.getUsersPaginated(
      this.currentPage(),
      this.pageSize(),
      this.sortBy(),
      this.sortDir()
    ).subscribe({
      next: (response: PaginatedResponse) => {
        this.loading.set(false);
        this.users.set(response.content);
        this.totalElements.set(response.totalElements);
        console.log('Users loaded:', this.users());
        console.log('Pagination info:', {
          totalElements: response.totalElements,
          totalPages: response.totalPages,
          currentPage: response.number,
          pageSize: response.size
        });
      },
      error: (error) => {
        console.error('Error loading users:', error);
        this.loading.set(false);
        this.error.set(this.translate.instant('allUsers.loadError'));
        this.snackBar.open(this.translate.instant('allUsers.loadError'), this.translate.instant('allUsers.close'), {
          duration: 3000
        });
      }
    });
  }

  deleteUser(userId: number) {
    const dialogRef = this.dialog.open(ConfirmDeleteComponent, {
      width: '400px',
      data: { message: this.translate.instant('allUsers.confirmDelete') }
    });

    dialogRef.afterClosed().subscribe(result => {
      if(result === true){
        this.loading.set(true);
        this.adminService.deleteUser(userId).subscribe({
          next: () => {
            this.loading.set(false);
            this.snackBar.open(this.translate.instant('allUsers.userDeletedSuccess'), this.translate.instant('allUsers.ok'), {duration: 3000});
            this.loadUsers();
          },
          error: () =>{
            this.loading.set(false);
            this.snackBar.open(this.translate.instant('allUsers.deleteError'), this.translate.instant('allUsers.ok'), {duration: 3000});
          }
        })
      }
    })
  }

  viewAccount(userId: number) {
    this.router.navigate(["/admin/view-user-account"], {
      queryParams: {userId: userId}
    });
  }

  sendEmail(userEmail: string) {
    this.router.navigate(["/admin/send-email"], {
      queryParams: {email: userEmail}
    });
  }

  // Pagination methods
  onPageChange(event: PageEvent) {
    this.currentPage.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.loadUsers();
  }

  onSortChange(sortBy: string) {
    this.sortBy.set(sortBy);
    this.currentPage.set(0); // Reset to first page when sorting changes
    this.loadUsers();
  }

  onSortDirectionChange() {
    this.sortDir.set(this.sortDir() === 'asc' ? 'desc' : 'asc');
    this.currentPage.set(0); // Reset to first page when sort direction changes
    this.loadUsers();
  }
}
