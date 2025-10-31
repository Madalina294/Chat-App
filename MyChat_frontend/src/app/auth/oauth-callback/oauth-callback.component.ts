import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { StorageService } from '../../services/storage/storage.service';
import { UserStateService } from '../../services/user-state/user-state.service';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-oauth-callback',
  templateUrl: './oauth-callback.component.html',
  styleUrls: ['./oauth-callback.component.scss'],
  standalone: true,
  imports: [CommonModule, TranslateModule]
})
export class OAuthCallbackComponent implements OnInit {
  showError = false;
  processingStep = 1; // 1: Redirected, 2: Processing, 3: Redirecting

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private userStateService: UserStateService
  ) {}

  ngOnInit() {
    // OAuth-ul va fi procesat aici
    this.processOAuthCallback();
  }

  private processOAuthCallback() {
    console.log('=== DEBUG: OAuth Callback Processing ===');

    // Simulate step progression
    setTimeout(() => {
      this.processingStep = 2;
    }, 1000);

    // Verifică dacă există token-ul în URL parameters
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token');
      const userId = urlParams.get('userId');
      const googleId = urlParams.get('googleId');

      if (token && userId) {
        // Salvează token-ul
        StorageService.saveToken(token);

        // Face request pentru a obține datele utilizatorului cu imaginea
        console.log('Making request to:', `http://localhost:8080/api/auth/oauth-user-data?userId=${userId}&googleId=${googleId || ''}`);
        this.http.get(`http://localhost:8080/api/auth/oauth-user-data?userId=${userId}&googleId=${googleId || ''}`)
          .subscribe({
            next: (response: any) => {

              // Creează userData din response
              const userData = {
                id: response.userId,
                firstname: response.userFirstName,
                lastname: response.userLastName,
                email: response.email || '',
                role: response.userRole || 'USER',
                image: response.image || null,
                preferredTheme: response.preferredTheme || "dark",
                preferredLanguage: response.preferredLanguage || "en",
                mfaEnabled: response.mfaEnabled || false,
                googleId: response.googleId || googleId || ''
              };

              // Salvează datele utilizatorului
              StorageService.saveUser(userData);
              this.userStateService.setUser(userData);

              // Navighează către welcome
              setTimeout(() => {
                this.router.navigate(['/chat']);
              }, 500);
            },
            error: (error) => {
              console.error('Error fetching OAuth user data:', error);
              this.showError = true;
            }
          });

        return;
      } else {
        // No token found, show error after a delay
        setTimeout(() => {
          this.showError = true;
        }, 2000);
      }
    } else {
      // Server-side rendering, redirect to login
      this.router.navigate(['/login']);
    }
  }

  retryAuthentication() {
    this.showError = false;
    this.processingStep = 1;
    this.router.navigate(['/login']);
  }
}
