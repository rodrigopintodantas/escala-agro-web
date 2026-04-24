import { Component } from '@angular/core';
import { RippleModule } from 'primeng/ripple';
import { PrincipalCabecalho } from './principal-cabecalho';

@Component({
    selector: 'principal-corpo',
    standalone: true,
    imports: [RippleModule, PrincipalCabecalho],
    template: `
        <div class="min-h-[90vh] grid grid-cols-1 lg:grid-cols-3">
            <div class="col-span-1 flex items-center justify-center px-6 lg:px-10 py-12 bg-[rgba(0,20,40,0.95)]">
                <div class="w-full max-w-xl rounded-2xl bg-white/95 text-surface-900 shadow-2xl p-6 lg:p-8">
                    <principal-cabecalho />
                </div>
            </div>
            <div class="hidden lg:block col-span-2 bg-cover bg-center" style="background-image: url('assets/layout/images/escala-agro-df-background.png');">
                <div class="w-full h-full bg-black/20"></div>
            </div>
        </div>
    `
})
export class PrincipalCorpo {}
