import { Injectable, Inject, signal } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { BehaviorSubject, Observable } from 'rxjs';

export type Theme = 'light' | 'dark';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private currentThemeSubject = new BehaviorSubject<Theme>('dark');
  public currentTheme$ = this.currentThemeSubject.asObservable();

  public isDarkMode = signal(true);

  constructor(@Inject(DOCUMENT) private document: Document) {
    this.initializeTheme();
  }

  private initializeTheme(): void {
    // Verifică dacă suntem în browser (nu pe server)
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      // Pe server, folosește dark mode ca default
      this.currentThemeSubject.next('dark');
      this.isDarkMode.set(true);
      return;
    }

    // Verifică dacă există o temă salvată în localStorage
    const savedTheme = localStorage.getItem('theme') as Theme;
    if (savedTheme) {
      this.currentThemeSubject.next(savedTheme);
      this.isDarkMode.set(savedTheme === 'dark');
      this.applyTheme(savedTheme);
    } else {
      // Folosește dark mode ca default la prima lansare
      this.setTheme('dark');
    }

    // Ascultă schimbările în preferința sistemului
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!localStorage.getItem('theme')) {
        const systemTheme: Theme = e.matches ? 'dark' : 'light';
        this.setTheme(systemTheme);
      }
    });
  }

  // Adaugă această metodă pentru a încărca preferința utilizatorului la login
  public loadUserTheme(userTheme?: string): void {
    if (userTheme && (userTheme === 'light' || userTheme === 'dark')) {
      this.setTheme(userTheme as Theme);
    } else {
      // Dacă nu există preferință, folosește dark mode
      this.setTheme('dark');
    }
  }

  public setTheme(theme: Theme): void {
    this.currentThemeSubject.next(theme);
    this.isDarkMode.set(theme === 'dark'); 
    this.applyTheme(theme);
    
    // Salvează tema în localStorage doar dacă este disponibil
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('theme', theme);
    }
  }

  public toggleTheme(): void {
    const newTheme: Theme = this.currentThemeSubject.value === 'light' ? 'dark' : 'light';
    this.setTheme(newTheme);
  }

  public getCurrentTheme(): Theme {
    return this.currentThemeSubject.value;
  }

  public reinitializeTheme(): void {
    this.initializeTheme();
  }

  private applyTheme(theme: Theme): void {
    // Verifică dacă document este disponibil (nu pe server)
    if (typeof document === 'undefined' || !this.document?.body) {
      return;
    }

    if (theme === 'light') {
      this.document.documentElement.classList.add('light-mode');
      this.document.documentElement.classList.remove('dark-mode');
      this.document.body.classList.add('light-mode');
      this.document.body.classList.remove('dark-mode');
    } else {
      this.document.documentElement.classList.add('dark-mode');
      this.document.documentElement.classList.remove('light-mode');
      this.document.body.classList.add('dark-mode');
      this.document.body.classList.remove('light-mode');
    }
  }

  // Adaugă această metodă pentru reset la dark mode la logout
  public resetToDefaultTheme(): void {
    // Șterge tema salvată din localStorage
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('theme');
    }
    
    // Revino la dark mode ca default
    this.setTheme('dark');
  }
}
