import { ActivatedRouteSnapshot, CanActivateFn, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { inject } from '@angular/core';
import { AutenticacaoService } from '../service/autenticacao.service';
import { environment } from '../../environments/environment';

const isAccessAllowed = async (route: ActivatedRouteSnapshot, __: RouterStateSnapshot): Promise<boolean | UrlTree> => {
    const router = inject(Router);
    const auth = inject(AutenticacaoService);

    // Se usar autenticação simples
    if (environment.useSimpleAuth) {
        if (auth.authenticated && auth.temPerfil()) {
            return true;
        }
        // Redirecionar para login se não autenticado
        return router.navigate(['/']);
    }

    // Fallback para Keycloak (se necessário no futuro)
    return router.navigate(['/']);
};

export const canActivateAuthRole: CanActivateFn = isAccessAllowed;
