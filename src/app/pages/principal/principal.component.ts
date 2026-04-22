import { Component, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { RouterModule } from '@angular/router';
import { RippleModule } from 'primeng/ripple';
import { StyleClassModule } from 'primeng/styleclass';
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';
import { PrincipalCabecalho } from './components/principal-cabecalho';
import { PrincipalCorpo } from './components/principal-corpo';
import { PrincipalRodape } from './components/principal-rodape';
import { PrincipalSaibaMais } from './components/principal-saiba-mais';

@Component({
    selector: 'escala-agro-principal',
    standalone: true,
    imports: [RouterModule, PrincipalCabecalho, PrincipalCorpo, PrincipalRodape, PrincipalSaibaMais, RippleModule, StyleClassModule, ButtonModule, DividerModule],
    template: `
        <div class="bg-surface-0 dark:bg-surface-900">
            <div id="home" class="landing-wrapper overflow-hidden">
                <principal-cabecalho class="py-5 px-6 mx-0 md:mx-12 lg:mx-20 lg:px-20 flex items-center justify-between relative lg:static" />
                <principal-corpo />
                <principal-saiba-mais />
                <principal-rodape />
            </div>
        </div>
    `
})
export class PrincipalComponent {}
