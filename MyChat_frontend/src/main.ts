// Polyfill pentru 'global' - necesar pentru SockJS și @stomp/stompjs în browser
if (typeof (window as any).global === 'undefined') {
  (window as any).global = window;
}

import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
