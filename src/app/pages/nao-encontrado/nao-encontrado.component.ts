import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { AppTemaAplicacao } from '../../layout/component/app.tema-aplicacao';

@Component({
    selector: 'nuptec-nao-encontrado',
    standalone: true,
    imports: [RouterModule, AppTemaAplicacao, ButtonModule],
    template: ` <app-tema-aplicacao />
        <div class="flex items-center justify-center min-h-screen overflow-hidden">
            <div class="flex flex-col items-center justify-center">
                <div class="mt-8 mb-8 w-32 shrink-0">
                    <img alt="app logo" src="assets/layout/images/logo.png" width="150" />
                </div>
                <div style="border-radius: 56px; padding: 0.3rem; background: linear-gradient(180deg, color-mix(in srgb, var(--primary-color), transparent 60%) 10%, var(--surface-ground) 30%)">
                    <div class="w-full bg-surface-0 dark:bg-surface-900 py-20 px-8 sm:px-20 flex flex-col items-center" style="border-radius: 53px">
                        <span class="text-primary font-bold text-3xl">404</span>
                        <h1 class="text-surface-900 dark:text-surface-0 font-bold text-3xl lg:text-5xl mb-2">Não Encontrado</h1>
                        <div class="text-surface-600 dark:text-surface-200 mb-8">Recurso não encontrado</div>

                        <p-button label="Ir para Página Principal" routerLink="/" />
                    </div>
                </div>
            </div>
        </div>`
})
export class NaoEncontradoComponent {}
