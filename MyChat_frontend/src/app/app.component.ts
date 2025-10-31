import {Component, ChangeDetectionStrategy, OnInit} from '@angular/core';
import {Router, RouterLink, RouterOutlet} from '@angular/router';
import {MatToolbar} from '@angular/material/toolbar';
import {MatButton, MatIconButton} from '@angular/material/button';
import {MatMenu, MatMenuItem, MatMenuTrigger} from '@angular/material/menu';
import {MatIcon} from '@angular/material/icon';
import {NgIf} from '@angular/common';
import {MatDivider} from '@angular/material/divider';
import {MatSnackBar} from '@angular/material/snack-bar';
import { UserStateService } from './services/user-state/user-state.service';
import {ThemeService} from './services/theme/theme.service';
import {ThemeComponent} from './pages/theme/theme.component';
import { LanguageService } from './services/language/language.service';
import {TranslatePipe} from '@ngx-translate/core';
import { UserService } from './services/user/user.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, MatToolbar, MatIconButton, MatMenuTrigger, MatIcon, MatMenu, NgIf, MatMenuItem, RouterLink, MatDivider, MatButton, ThemeComponent, TranslatePipe],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent implements OnInit{
  title = '2fa-angular';

  // Signals din UserStateService
  isAdminLoggedIn: any;
  isCustomerLoggedIn: any;
  userName: any;
  userImage: any;

  // Signal din ThemeService
  isDarkMode : any;

  constructor(
    private router: Router,
    private snackBar: MatSnackBar,
    private userStateService: UserStateService,
    private userService: UserService,
    private themeService: ThemeService,
    public lang: LanguageService
  ) {
    // Inițializez signals după ce userStateService este disponibil
    this.isAdminLoggedIn = this.userStateService.isAdmin;
    this.isCustomerLoggedIn = this.userStateService.isCustomer;
    this.userName = this.userStateService.userName;
    this.userImage = this.userStateService.userImage;
    this.isDarkMode = this.themeService.isDarkMode;
  }

  ngOnInit(){
    this.themeService.reinitializeTheme();
    this.lang.reinitializeLanguage();
    
    this.router.events.subscribe(event => {
      if(event.constructor.name === "NavigationEnd"){
        // Reîncarcă datele din storage la navigare (pentru cazurile când se schimbă din exterior)
        this.userStateService.loadUserFromStorage();

        const user = this.userStateService.user();
        
        // Încarcă preferința de temă a utilizatorului dacă este logat
        if (user?.preferredTheme) {
          this.themeService.loadUserTheme(user.preferredTheme);
        } else {
          // Dacă nu este logat, folosește dark mode
          this.themeService.resetToDefaultTheme();
        }

        // Încarcă preferința de limbă a utilizatorului dacă este logat
        if (user?.preferredLanguage) {
          this.lang.loadUserLanguage(user.preferredLanguage);
        } else {
          // Dacă nu este logat, folosește engleza ca default
          this.lang.resetToDefaultLanguage();
        }
      }
    })
  }

  logout(){
    this.userStateService.clearUser();
    // Revino la dark mode ca default la logout
    this.themeService.resetToDefaultTheme();
    // Revino la engleza ca default la logout
    this.lang.resetToDefaultLanguage();
    this.router.navigateByUrl("/login");
  }

  getFullImageUrl(imageUrl: string | null): string {
    if (!imageUrl) return '';
    if (imageUrl.startsWith('/uploads/')) {
      return 'http://localhost:8080' + imageUrl;
    }
    return imageUrl;
  }

  /**
   * Schimbă limba și o salvează în backend dacă utilizatorul este autentificat
   */
  changeLanguage(language: 'en' | 'ro'): void {
    const user = this.userStateService.user();
    
    // Aplică limba imediat în UI
    this.lang.use(language);
    
    // Dacă utilizatorul este autentificat, salvează limba în backend
    if (user) {
      this.userService.updatePreferredLanguage(user.id, language).subscribe({
        next: (response) => {
          // Actualizează starea utilizatorului
          this.userStateService.updateUser({ preferredLanguage: language });
        },
        error: (error) => {
          console.error('Error saving language preference:', error);
          // Limba rămâne schimbată în UI chiar dacă salvarea în backend eșuează
        }
      });
    }
  }
}
