import { mergeApplicationConfig, ApplicationConfig } from '@angular/core';
import { provideServerRendering } from '@angular/platform-server';
import { provideServerRouting } from '@angular/ssr';
import { appConfig } from './app.config';
import { serverRoutes } from './app.routes.server';

// --- IMPORTURI NOI ---
import { TranslateLoader } from '@ngx-translate/core';
import { TranslateServerLoader } from './translate-server-loader';

// --- FACTORY NOU PENTRU SERVER ---
export function ServerLoaderFactory() {
  return new TranslateServerLoader();
}

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(),
    provideServerRouting(serverRoutes),

    // --- PROVIDER NOU (SUPRASCRIERE) ---
    // Aici îi spunem lui Angular: "Când ești pe server,
    // ignoră HttpLoaderFactory și folosește TranslateServerLoader în schimb."
    {
      provide: TranslateLoader,
      useFactory: ServerLoaderFactory,
    }
  ]
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
