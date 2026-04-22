import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';

@Component({
    selector: 'app-dashboard-inicial',
    standalone: true,
    imports: [CommonModule, CardModule],
    template: `
        <div class="p-4">
            <p-card header="Escala Agro">
                <p class="m-0">Projeto inicial carregado com sucesso.</p>
            </p-card>
        </div>
    `
})
export class DashboardInicialComponent {}
