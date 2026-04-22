import { Component, ElementRef } from '@angular/core';
import { AppMenu } from './app.menu';
import { LayoutService } from '../service/layout.service';
import { CommonModule } from '@angular/common';
import { RippleModule } from 'primeng/ripple';

@Component({
    selector: 'app-barra-lateral',
    standalone: true,
    imports: [AppMenu, CommonModule, RippleModule],
    template: `
        <div class="layout-sidebar" [ngClass]="{ 'layout-sidebar-compact': isCompactMode }">
            <div class="menu-toggle-container" *ngIf="!isCompactMode">
                <button class="menu-toggle-button" (click)="toggleCompactMode()" title="Reduzir menu" pRipple>
                    <i class="pi pi-chevron-left"></i>
                </button>
            </div>
            <div class="menu-toggle-container" *ngIf="isCompactMode">
                <button class="menu-toggle-button" (click)="toggleCompactMode()" title="Expandir menu" pRipple>
                    <i class="pi pi-chevron-right"></i>
                </button>
            </div>
            <app-menu></app-menu>
        </div>
    `,
    styles: [
        `
            .menu-toggle-container {
                display: flex;
                justify-content: flex-end;
                margin-bottom: 1rem;
                padding: 0 0.5rem;
            }

            .menu-toggle-button {
                display: flex;
                align-items: center;
                justify-content: center;
                width: 2.5rem;
                height: 2.5rem;
                border: none;
                background-color: var(--surface-hover);
                color: var(--text-color);
                border-radius: 50%;
                cursor: pointer;
                transition: all var(--element-transition-duration);
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

                &:hover {
                    background-color: var(--primary-color);
                    color: var(--primary-contrast-color);
                    transform: scale(1.1);
                    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
                }

                &:active {
                    transform: scale(0.95);
                }

                i {
                    font-size: 1rem;
                    font-weight: bold;
                }
            }

            .layout-sidebar-compact {
                .menu-toggle-container {
                    justify-content: center;
                    margin-bottom: 0.5rem;
                    padding: 0;
                }
            }
        `
    ]
})
export class AppBarraLateral {
    isCompactMode = false;

    constructor(
        public el: ElementRef,
        private layoutService: LayoutService
    ) {}

    toggleCompactMode() {
        this.isCompactMode = !this.isCompactMode;
        // Salvar preferência no localStorage
        localStorage.setItem('menuCompactMode', this.isCompactMode.toString());
    }

    ngOnInit() {
        // Carregar preferência do localStorage
        const savedMode = localStorage.getItem('menuCompactMode');
        if (savedMode !== null) {
            this.isCompactMode = savedMode === 'true';
        }
    }
}
