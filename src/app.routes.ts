import { Routes } from '@angular/router';
import { canActivateAuthRole } from './app/autenticacao/auth.guard';
import { AppLayout } from './app/layout/component/app.layout';
import { DashboardInicialComponent } from './app/pages/inicial/dashboard-inicial.component';

export const appRoutes: Routes = [
    {
        path: '',
        loadComponent: () => import('./app/pages/principal/principal.component').then((c) => c.PrincipalComponent)
    },
    {
        path: 'admin',
        component: AppLayout,
        canActivate: [canActivateAuthRole],
        children: [
            {
                path: '',
                data: { breadcrumb: 'Início' },
                component: DashboardInicialComponent
            },
            {
                path: 'ordem-servidores',
                data: { breadcrumb: 'Ordem dos servidores' },
                loadComponent: () =>
                    import('./app/pages/ordem/ordem-servidores.component').then((c) => c.OrdemServidoresComponent)
            },
            {
                path: 'ordem-tecnicos',
                redirectTo: 'ordem-servidores',
                pathMatch: 'full'
            },
            {
                path: 'escalas/criar',
                data: { breadcrumb: 'Nova escala', escalasModo: 'admin' as const },
                loadComponent: () =>
                    import('./app/pages/escalas/criar-escala/criar-escala.component').then((c) => c.CriarEscalaComponent)
            },
            {
                path: 'escalas/:id',
                data: { breadcrumb: 'Detalhe da escala', escalasModo: 'admin' as const },
                loadComponent: () => import('./app/pages/escalas/ver-escala/ver-escala.component').then((c) => c.VerEscalaComponent)
            },
            {
                path: 'escalas',
                data: { breadcrumb: 'Escalas', escalasModo: 'admin' as const },
                loadComponent: () => import('./app/pages/escalas/escalas-lista.component').then((c) => c.EscalasListaComponent)
            },
            {
                path: 'permutas',
                data: { breadcrumb: 'Permutas', permutasModo: 'admin' as const },
                loadComponent: () => import('./app/pages/permutas/permutas-lista.component').then((c) => c.PermutasListaComponent)
            },
            {
                path: 'afastamentos',
                data: { breadcrumb: 'Afastamentos', afastamentosModo: 'admin' as const },
                loadComponent: () =>
                    import('./app/pages/afastamentos/afastamentos-lista.component').then((c) => c.AfastamentosListaComponent)
            },
            {
                path: 'servidores',
                data: { breadcrumb: 'Servidores' },
                loadComponent: () => import('./app/pages/servidores/servidores-lista.component').then((c) => c.ServidoresListaComponent)
            },
            {
                path: 'auditoria',
                data: { breadcrumb: 'Auditoria' },
                loadComponent: () => import('./app/pages/auditoria/auditoria.component').then((c) => c.AuditoriaComponent)
            },
            {
                path: 'regras',
                data: { breadcrumb: 'Regras do sistema' },
                loadComponent: () => import('./app/pages/regras/regras.component').then((c) => c.RegrasComponent)
            }
        ]
    },
    {
        path: 'vt',
        component: AppLayout,
        canActivate: [canActivateAuthRole],
        children: [
            {
                path: '',
                data: { breadcrumb: 'Início' },
                component: DashboardInicialComponent
            },
            {
                path: 'escalas/:id',
                data: { breadcrumb: 'Detalhe da escala', escalasModo: 'veterinario' as const },
                loadComponent: () => import('./app/pages/escalas/ver-escala/ver-escala.component').then((c) => c.VerEscalaComponent)
            },
            {
                path: 'escalas',
                data: { breadcrumb: 'Escalas', escalasModo: 'veterinario' as const },
                loadComponent: () => import('./app/pages/escalas/escalas-lista.component').then((c) => c.EscalasListaComponent)
            },
            {
                path: 'permutas',
                data: { breadcrumb: 'Permutas', permutasModo: 'veterinario' as const },
                loadComponent: () => import('./app/pages/permutas/permutas-lista.component').then((c) => c.PermutasListaComponent)
            },
            {
                path: 'afastamentos',
                data: { breadcrumb: 'Afastamentos', afastamentosModo: 'veterinario' as const },
                loadComponent: () =>
                    import('./app/pages/afastamentos/afastamentos-lista.component').then((c) => c.AfastamentosListaComponent)
            }
        ]
    },
    {
        path: 'produtor',
        component: AppLayout,
        canActivate: [canActivateAuthRole],
        children: [
            {
                path: '',
                data: { breadcrumb: 'Início' },
                component: DashboardInicialComponent
            }
        ]
    },
    {
        path: 'nao-encontrado',
        loadComponent: () => import('./app/pages/nao-encontrado/nao-encontrado.component').then((c) => c.NaoEncontradoComponent)
    },
    { path: '**', redirectTo: '/nao-encontrado' }
];
