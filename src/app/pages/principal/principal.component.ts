import { Component, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { RouterModule } from '@angular/router';
import { RippleModule } from 'primeng/ripple';
import { StyleClassModule } from 'primeng/styleclass';
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';
import { PrincipalCorpo } from './components/principal-corpo';

@Component({
    selector: 'escala-agro-principal',
    standalone: true,
    imports: [RouterModule, PrincipalCorpo, RippleModule, StyleClassModule, ButtonModule, DividerModule],
    template: `
        <div class="bg-surface-0 dark:bg-surface-900">
            <div id="home" class="landing-wrapper overflow-hidden">
                <principal-corpo />
            </div>
        </div>
    `
})
export class PrincipalComponent {}
