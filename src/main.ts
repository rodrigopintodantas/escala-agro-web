import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app.config';
import { AppComponent } from './app.component';
import { registerLocaleData } from '@angular/common';
import * as ptBr from '@angular/common/locales/pt'; // Importação correta para evitar erro

registerLocaleData(ptBr.default); // Uso correto do locale

bootstrapApplication(AppComponent, appConfig).catch((err) => console.error(err));
