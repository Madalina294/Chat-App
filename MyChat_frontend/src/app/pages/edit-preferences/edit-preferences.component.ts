import {Component, OnInit, OnDestroy, signal} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { UserStateService } from '../../services/user-state/user-state.service';
import { UserService } from '../../services/user/user.service';
import { ThemeService, Theme } from '../../services/theme/theme.service';
import {LanguageService} from '../../services/language/language.service';
import {TranslatePipe, TranslateService} from '@ngx-translate/core';

@Component({
  selector: 'app-edit-preferences',
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatSelectModule,
    MatFormFieldModule,
    TranslatePipe
  ],
  templateUrl: './edit-preferences.component.html',
  styleUrl: './edit-preferences.component.scss'
})
export class EditPreferencesComponent implements OnInit, OnDestroy {
  selectedTheme = signal("dark");
  selectedLanguage = signal("en")
  isLoading = signal(false);
  private themeSubscription?: Subscription;
  private languageSubscription?: Subscription;

  constructor(
    private userStateService: UserStateService,
    private userService: UserService,
    private themeService: ThemeService,
    private languageService: LanguageService,
    private snackBar: MatSnackBar,
    private router: Router,
    private translate: TranslateService
  ) {}

  ngOnInit() {
    const user = this.userStateService.user();
    
    // Încarcă tema preferată din starea utilizatorului
    if (user?.preferredTheme) {
      this.selectedTheme.set(user.preferredTheme);
    }

    // Încarcă limba preferată din starea utilizatorului
    if (user?.preferredLanguage) {
      this.selectedLanguage.set(user.preferredLanguage);
    }

    // Ascultă schimbările de temă din ThemeService
    this.themeSubscription = this.themeService.currentTheme$.subscribe(theme => {
      this.selectedTheme.set(theme);
    });

    // Ascultă schimbările de limbă din LanguageService
    this.languageSubscription = this.languageService.currentLanguage$.subscribe(language => {
      this.selectedLanguage.set(language);
    });
  }

  ngOnDestroy() {
    if (this.themeSubscription) {
      this.themeSubscription.unsubscribe();
    }
    if (this.languageSubscription) {
      this.languageSubscription.unsubscribe();
    }
  }

  onThemeChange(newTheme: string) {
    this.selectedTheme.set(newTheme);
    this.isLoading.set(true);
    const user = this.userStateService.user();

    if (user) {
      this.userService.updatePreferredTheme(user.id, newTheme).subscribe({
        next: (response) => {
          this.isLoading.set(false);
          // Actualizează starea utilizatorului
          this.userStateService.updateUser({ preferredTheme: newTheme });

          // Aplică tema imediat
          this.themeService.setTheme(newTheme as 'light' | 'dark');

          this.snackBar.open(
            this.translate.instant('preferences.themeUpdated'), 
            this.translate.instant('common.close') || 'Close', 
            { duration: 3000 }
          );

        },
        error: (error) => {
          this.isLoading.set(false);
          console.error('Error updating theme:', error);
          this.snackBar.open(
            this.translate.instant('preferences.themeUpdateError'), 
            this.translate.instant('common.close') || 'Close', 
            { duration: 3000 }
          );
        }
      });
    }
  }

  goBack() {
    this.router.navigate(['/profile']);
  }


  onLanguageChange(preferredLanguage: string) {
    this.selectedLanguage.set(preferredLanguage);
    this.isLoading.set(true);
    const user = this.userStateService.user();

    if (user) {
      this.userService.updatePreferredLanguage(user.id, preferredLanguage).subscribe({
        next: (response) => {
          this.isLoading.set(false);
          // Actualizează starea utilizatorului
          this.userStateService.updateUser({ preferredLanguage: preferredLanguage });

          // Aplică limba imediat
          this.languageService.use(preferredLanguage as 'en' | 'ro');

          this.snackBar.open(
            this.translate.instant('preferences.languageUpdated'), 
            this.translate.instant('common.close') || 'Close', 
            { duration: 3000 }
          );

        },
        error: (error) => {
          this.isLoading.set(false);
          console.error('Error updating language:', error);
          this.snackBar.open(
            this.translate.instant('preferences.languageUpdateError'), 
            this.translate.instant('common.close') || 'Close', 
            { duration: 3000 }
          );
        }
      });
    }
  }
}
