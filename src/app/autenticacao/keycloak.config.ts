import { provideKeycloak, withAutoRefreshToken, AutoRefreshTokenService, UserActivityService } from 'keycloak-angular';
import { environment } from '../../environments/environment';

export const provideKeycloakAngular = () =>
    provideKeycloak({
        config: {
            realm: environment.keyCloakConfig.realm,
            url: environment.keyCloakConfig.urlsso,
            clientId: environment.keyCloakConfig.client
        },
        initOptions: {
            onLoad: 'login-required',
            silentCheckSsoRedirectUri: window.location.origin + '/assets/silent-check-sso.html'
        },
        features: [
            withAutoRefreshToken({
                onInactivityTimeout: 'logout',
                sessionTimeout: 60000
            })
        ],
        providers: [AutoRefreshTokenService, UserActivityService]
    });
