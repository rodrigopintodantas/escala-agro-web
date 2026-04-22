export const environment = {
    production: false,
    apiUrl: 'http://localhost:3000/api',
    ambiente: 'local',
    useSimpleAuth: true,
    keyCloakConfig: {
        redirect_uri: 'http://localhost:4200',
        urlsso: 'https://sso.apps.tjdft.jus.br/auth/',
        client: 'sgpj-web',
        realm: 'SUDES',
        urlPattern: /^http:\/\/localhost:3000\/.*$/
    }
};
