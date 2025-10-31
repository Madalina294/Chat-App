import {Inject, Injectable, PLATFORM_ID} from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { isPlatformBrowser, DOCUMENT } from '@angular/common';
import { BehaviorSubject } from 'rxjs';

const LANG_KEY = 'app.language';
const SUPPORTED_LANGS = ['en', 'ro'] as const;
type Lang = typeof SUPPORTED_LANGS[number];

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private readonly isBrowser: boolean;
  private currentLanguageSubject = new BehaviorSubject<Lang>('en');
  public currentLanguage$ = this.currentLanguageSubject.asObservable();

  constructor(
    private translate: TranslateService,
    @Inject(PLATFORM_ID) platformId: Object,
    @Inject(DOCUMENT) private document: Document
  ) {
    this.isBrowser = isPlatformBrowser(platformId);

    this.translate.addLangs([...SUPPORTED_LANGS]);
    this.translate.setDefaultLang('en');

    const initial =
      this.getSavedLanguage() ??
      this.getBrowserLanguage() ??
      'en';

    // folosește limba doar în browser
    if (this.isBrowser) {
      this.use(initial);
    } else {
      // pe server doar setează default (fără localStorage/document)
      this.translate.use(initial);
      this.currentLanguageSubject.next(initial);
    }
  }

  get current(): Lang {
    return (this.translate.currentLang as Lang) || 'en';
  }

  use(lang: Lang) {
    this.translate.use(lang);
    this.currentLanguageSubject.next(lang);
    if (this.isBrowser) {
      try {
        localStorage.setItem(LANG_KEY, lang);
      } catch {}
      this.document.documentElement.lang = lang;
    }
  }

  /**
   * Încarcă limba preferată a utilizatorului
   */
  loadUserLanguage(userLanguage: string): void {
    if (!this.isBrowser) return;
    
    const lang = SUPPORTED_LANGS.includes(userLanguage as Lang) 
      ? (userLanguage as Lang) 
      : 'en';
    
    this.use(lang);
  }

  /**
   * Reinițializează limba (pentru refresh-uri)
   */
  reinitializeLanguage(): void {
    if (!this.isBrowser) return;
    
    const savedLang = this.getSavedLanguage();
    if (savedLang) {
      this.use(savedLang);
    }
  }

  /**
   * Resetează limba la default (engleza) - folosit la logout
   */
  resetToDefaultLanguage(): void {
    if (!this.isBrowser) return;
    
    this.use('en');
  }

  private getSavedLanguage(): Lang | null {
    if (!this.isBrowser) return null;
    try {
      const val = localStorage.getItem(LANG_KEY);
      return SUPPORTED_LANGS.includes(val as Lang) ? (val as Lang) : null;
    } catch {
      return null;
    }
  }

  private getBrowserLanguage(): Lang | null {
    if (!this.isBrowser) return null;
    const nav = navigator.language?.slice(0, 2);
    return SUPPORTED_LANGS.includes(nav as Lang) ? (nav as Lang) : null;
  }
}
