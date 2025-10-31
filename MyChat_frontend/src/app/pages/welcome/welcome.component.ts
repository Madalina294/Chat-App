import { Component, OnInit } from '@angular/core';
import {StorageService} from '../../services/storage/storage.service';
import {NgIf} from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { UserStateService } from '../../services/user-state/user-state.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-welcome',
  imports: [NgIf, TranslateModule],
  templateUrl: './welcome.component.html',
  styleUrl: './welcome.component.scss'
})
export class WelcomeComponent implements OnInit {
  user: any = null;
  userImage: string | null = null;

  constructor(private router: Router,
    private route: ActivatedRoute,
    private userStateService: UserStateService,
    private translate: TranslateService) {
  }

  ngOnInit() {
    // Încarcă utilizatorul normal (OAuth-ul este gestionat în login.component.ts)
    this.user = StorageService.getUser();
    this.userImage = this.user?.image || null;
  }

  logout(){
    StorageService.signout();
    this.router.navigate(['login']);
  }

  getFullImageUrl(imageUrl: string | null): string {
    if (!imageUrl) return '';
    if (imageUrl.startsWith('/uploads/')) {
      return 'http://localhost:8080' + imageUrl;
    }
    return imageUrl;
  }

}
