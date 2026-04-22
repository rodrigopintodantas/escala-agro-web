import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';

@Component({
    selector: 'principal-rodape',
    standalone: true,
    imports: [RouterModule],
    template: `
        <footer class="w-full bg-[#f5f5f5] dark:bg-[#1e1e1e] text-gray-800 dark:text-gray-200 border-t border-gray-300 dark:border-gray-700 py-6 px-8">
            <div class="max-w-screen-xl mx-auto text-center">
                <h2 class="text-2xl font-semibold mb-2">Escala Agro</h2>
                <p>Projeto base do frontend</p>
            </div>
        </footer>
    `
})
export class PrincipalRodape {
    constructor(public router: Router) {}
}
