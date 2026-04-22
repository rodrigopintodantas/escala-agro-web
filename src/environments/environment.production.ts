export const environment = {
    production: true,
    apiUrl: 'https://escala-agro.tjdft.jus.br/api',
    ambiente: 'production',
    useSimpleAuth: true,
    keyCloakConfig: {
        redirect_uri: 'https://escala-agro.tjdft.jus.br',
        urlsso: 'https://sso.tjdft.jus.br/auth/',
        client: 'sgpj-web',
        realm: 'SUDES',
        urlPattern: /^https:\/\/escala-agro.tjdft.jus.br\/.*$/
    }
};
