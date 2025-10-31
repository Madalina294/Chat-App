import {Component, OnInit, OnDestroy} from '@angular/core';
import {MatSlideToggleModule} from '@angular/material/slide-toggle';
import {FormsModule} from '@angular/forms';
import {ThemeService, Theme} from '../../services/theme/theme.service';
import {UserStateService} from '../../services/user-state/user-state.service';
import {UserService} from '../../services/user/user.service';
import {Subscription} from 'rxjs';

@Component({
  selector: 'app-theme',
  imports: [
    MatSlideToggleModule,
    FormsModule
  ],
  templateUrl: './theme.component.html',
  styleUrl: './theme.component.scss'
})
export class ThemeComponent implements OnInit, OnDestroy {

  activateDarkTheme: boolean = true;
  private themeSubscription?: Subscription;

  constructor(
    private themeService: ThemeService,
    private userStateService: UserStateService,
    private userService: UserService
  ){}

  ngOnInit() {
    // Ascultă schimbările de temă
    this.themeSubscription = this.themeService.currentTheme$.subscribe(theme => {
      this.activateDarkTheme = theme === 'light';
    });
  }

  ngOnDestroy() {
    if (this.themeSubscription) {
      this.themeSubscription.unsubscribe();
    }
  }

  onChange(value: boolean) {
    const theme: Theme = value ? 'light' : 'dark';
    this.themeService.setTheme(theme);
    
    // Salvează preferința utilizatorului în backend dacă este logat
    const user = this.userStateService.user();
    if (user) {
      this.userService.updatePreferredTheme(user.id, theme).subscribe({
        next: (response) => {
          // Actualizează starea utilizatorului
          this.userStateService.updateUser({ preferredTheme: theme });
        },
        error: (error) => {
          console.error('Error saving theme preference:', error);
        }
      });
    }
  }

  toggleTheme() {
    this.themeService.toggleTheme();
    
    // Salvează preferința utilizatorului în backend dacă este logat
    const user = this.userStateService.user();
    if (user) {
      const currentTheme = this.themeService.getCurrentTheme();
      this.userService.updatePreferredTheme(user.id, currentTheme).subscribe({
        next: (response) => {
          // Actualizează starea utilizatorului
          this.userStateService.updateUser({ preferredTheme: currentTheme });
        },
        error: (error) => {
          console.error('Error saving theme preference:', error);
        }
      });
    }
  }
}
