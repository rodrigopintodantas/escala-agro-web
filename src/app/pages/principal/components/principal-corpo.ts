import { Component } from '@angular/core';
import { RippleModule } from 'primeng/ripple';

@Component({
    selector: 'principal-corpo',
    standalone: true,
    imports: [RippleModule],
    template: `
        <div class="min-h-[90vh] grid grid-cols-1 lg:grid-cols-3">
            <div class="col-span-1 flex flex-col justify-center px-6 lg:px-16 py-12 bg-[rgba(0,20,40,0.95)] text-white">
                <h1 class="text-3xl lg:text-5xl font-bold mb-4 text-blue-100">Bem-vindo ao {{ titulo }}</h1>
                <p class="text-blue-50 mb-4">Portal inicial do Escala Agro.</p>
                <button pRipple type="button" class="text-md px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-all shadow-md w-fit" (click)="saibaMais()">Saiba Mais</button>
            </div>
            <div class="hidden lg:block col-span-2 bg-cover bg-center" style="background-image: url('assets/layout/images/escala-agro-df-background.png');">
                <div class="w-full h-full bg-black/20"></div>
            </div>
        </div>
    `
})
export class PrincipalCorpo {
    titulo: string = 'Escala Agro';

    saibaMais() {
        const target = document.getElementById('saiba-mais');
        if (target) {
            target.scrollIntoView({ behavior: 'smooth' });
        }
    }
}
