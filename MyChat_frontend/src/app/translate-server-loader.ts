import { TranslateLoader } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';
import * as fs from 'fs';
import * as path from 'path';

export class TranslateServerLoader implements TranslateLoader {
  constructor(
    private prefix: string = 'assets/i18n/',
    private suffix: string = '.json'
  ) {}

  public getTranslation(lang: string): Observable<any> {

    // --- O LOGICĂ DE DETECȚIE MAI BUNĂ ---
    // 'ng serve' setează NODE_ENV la 'development'
    // 'ng build' (production) setează NODE_ENV la 'production'
    const isDev = process.env['NODE_ENV'] === 'development';

    let assetsPath: string;

    if (isDev) {
      // --- Mod DEVELOPMENT (ng serve) ---
      // Citește direct din folderul 'src'
      assetsPath = path.join(
        process.cwd(),
        'src', // <-- Citește din 'src'
        this.prefix,
        `${lang}${this.suffix}`
      );
    } else {
      // --- Mod PRODUCTION (ng build / prerender) ---
      // Citește din folderul 'dist'
      assetsPath = path.join(
        process.cwd(),
        'dist/2fa-angular/browser', // Numele proiectului tău
        this.prefix,
        `${lang}${this.suffix}`
      );
    }

    try {
      const data = JSON.parse(fs.readFileSync(assetsPath, 'utf8'));
      return of(data);
    } catch (e) {
      // Am adăugat un log mai bun pentru a vedea ce cale a fost folosită
      console.warn(`[TranslateServerLoader] (isDev: ${isDev}) Eroare la încărcarea fișierului: ${assetsPath}`);
      return of({});
    }
  }
}
