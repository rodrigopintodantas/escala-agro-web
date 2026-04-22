import { provideHttpClient, withFetch, withInterceptors, withInterceptorsFromDi } from '@angular/common/http';
import { ApplicationConfig, ErrorHandler, LOCALE_ID, provideZoneChangeDetection } from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter, withEnabledBlockingInitialNavigation, withInMemoryScrolling } from '@angular/router';
import Aura from '@primeng/themes/aura';
import { MessageService } from 'primeng/api';
import { providePrimeNG } from 'primeng/config';
import { appRoutes } from './app.routes';
import { GlobalErrorHandler } from './app/autenticacao/GlobalErrorHandler';
import { authInterceptor } from './app/service/autenticacao.service';
import { MsgService } from './app/service/mensagens.service';
import { environment } from './environments/environment';

// Providers condicionais baseados no tipo de autenticação
const authProviders = environment.useSimpleAuth 
    ? [] // Autenticação simples - não precisa de Keycloak
    : [
        // Se precisar manter Keycloak no futuro, adicionar aqui
        // provideKeycloakAngular(),
    ];

export const appConfig: ApplicationConfig = {
    providers: [
        MsgService,
        MessageService,
        ...authProviders,
        provideHttpClient(withFetch(), withInterceptors([authInterceptor]), withInterceptorsFromDi()),
        {
            provide: ErrorHandler,
            useClass: GlobalErrorHandler
        },
        provideZoneChangeDetection({ eventCoalescing: true }),
        provideRouter(
            appRoutes,
            withInMemoryScrolling({
                anchorScrolling: 'enabled',
                scrollPositionRestoration: 'enabled'
            }),
            withEnabledBlockingInitialNavigation()
        ),
        provideAnimationsAsync(),
        providePrimeNG({ theme: { preset: Aura, options: { darkModeSelector: '.app-dark' } } }),
        { provide: LOCALE_ID, useValue: 'pt-BR' }
    ]
};
