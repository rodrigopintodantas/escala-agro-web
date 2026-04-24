import { Component, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { RouterModule } from '@angular/router';
import { RippleModule } from 'primeng/ripple';
import { StyleClassModule } from 'primeng/styleclass';
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';
import { PrincipalCorpo } from './components/principal-corpo';
import { PrincipalRodape } from './components/principal-rodape';

@Component({
    selector: 'escala-agro-principal',
    standalone: true,
    imports: [RouterModule, PrincipalCorpo, PrincipalRodape, RippleModule, StyleClassModule, ButtonModule, DividerModule],
    template: `
        <div class="bg-surface-0 dark:bg-surface-900 min-h-screen lg:h-screen">
            <div id="home" class="landing-wrapper min-h-screen lg:h-screen flex flex-col overflow-x-hidden lg:overflow-hidden">
                <div class="flex-1 min-h-0">
                    <principal-corpo />
                </div>
                <principal-rodape />
            </div>
        </div>
    `
})
export class PrincipalComponent {}
