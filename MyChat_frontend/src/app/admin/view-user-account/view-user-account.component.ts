import {Component, OnInit, signal} from '@angular/core';
import {AdminService} from '../../services/admin/admin.service';
import {ActivatedRoute} from '@angular/router';
import {MatSnackBar} from '@angular/material/snack-bar';
import {NgIf} from '@angular/common';
import {MatIcon} from '@angular/material/icon';
import {MatProgressSpinner} from '@angular/material/progress-spinner';
import {TranslateModule, TranslateService} from '@ngx-translate/core';

@Component({
  selector: 'app-view-user-account',
  imports: [
    NgIf,
    MatIcon,
    MatProgressSpinner,
    TranslateModule
  ],
  templateUrl: './view-user-account.component.html',
  styleUrl: './view-user-account.component.scss'
})
export class ViewUserAccountComponent implements OnInit{

  user: any;
  isSpinning = signal(false);

  constructor(private adminService: AdminService,
              private route: ActivatedRoute,
              private snackBar: MatSnackBar,
              private translate: TranslateService){}

  ngOnInit(){
    this.loadUserData();
  }

  getFullImageUrl(imageUrl: string | null): string {
    if (!imageUrl) return '';
    if (imageUrl.startsWith('/uploads/')) {
      return 'http://localhost:8080' + imageUrl;
    }
    return imageUrl;
  }

  loadUserData(){
    this.isSpinning.set(true);
    this.adminService.getUserById(this.route.snapshot.queryParams['userId']).subscribe({
      next: (res) =>{
        this.isSpinning.set(false);
        console.log(res);
        this.user = res;
      },
      error: (res) =>{
        this.isSpinning.set(false);
        this.snackBar.open(this.translate.instant('viewUserAccount.errorLoading'), this.translate.instant('viewUserAccount.ok'), {duration: 3000});
      }
    })
  }

}
