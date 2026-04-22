export const environment = {
    production: false,
    apiUrl: 'https://escala-agro.apps.tjdft.jus.br/api',
    ambiente: 'stage',
    useSimpleAuth: true,
    keyCloakConfig: {
        redirect_uri: 'https://escala-agro.apps.tjdft.jus.br',
        urlsso: 'https://sso.apps.tjdft.jus.br/auth/',
        client: 'sgpj-web',
        realm: 'SUDES',
        urlPattern: /^https:\/\/escala-agro.apps.tjdft.jus.br\/.*$/
    }
};
