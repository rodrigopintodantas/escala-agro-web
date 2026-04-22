import { Component } from '@angular/core';

@Component({
    selector: 'principal-saiba-mais',
    standalone: true,
    template: `
        <section id="saiba-mais" class="min-h-[82vh] w-screen bg-[rgba(0,20,40,0.9)] text-white py-12 flex items-center">
            <div class="w-full text-center px-6 lg:px-20">
                <h2 class="text-3xl lg:text-5xl font-semibold mb-6 text-blue-100">{{ titulo }}</h2>
                <p class="text-lg lg:text-xl text-blue-50 leading-relaxed w-full">Projeto frontend inicial do Escala Agro, com autenticação simples e estrutura pronta para evolução.</p>
            </div>
        </section>
    `
})
export class PrincipalSaibaMais {
    titulo: string = 'Escala Agro';
}
