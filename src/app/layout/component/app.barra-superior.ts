import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { MessageModule } from 'primeng/message';
import { StyleClassModule } from 'primeng/styleclass';
import { environment } from '../../../environments/environment';
import { AutenticacaoService } from '../../service/autenticacao.service';
import { Usuario } from '../../types/usuario.model';
import { LayoutService } from '../service/layout.service';
import { AppConfigurator } from './app.configurator';

@Component({
    selector: 'app-barra-superior',
    standalone: true,
    imports: [RouterModule, CommonModule, StyleClassModule, AppConfigurator, MessageModule],
    template: `<div class="layout-topbar" >
        <div class="layout-topbar-logo-container">
            <button class="layout-menu-button layout-topbar-action" (click)="layoutService.onMenuToggle()">
                <i class="pi pi-bars"></i>
            </button>
            <a class="app-logo" routerLink="/">
                <img alt="app logo" src="assets/layout/images/logo4.png" height="30" />
                <span class="app-name hidden md:inline">ESCALA AGRO</span>
            </a>
        </div>

        <div class="hidden md:block absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 text-3xl font-bold pointer-events-none text-center" style="color: var(--v-menuitem-text-color); max-width: 60%; line-height: 1.2;">
            <span class="whitespace-pre-line" style="display: inline-block; word-break: break-word; hyphens: auto;">{{ sistema }}</span>
            <span style="color: rgba(255, 3, 3, 1)" *ngIf="isAmbienteDesenv">Desenv</span>
        </div>

        <div class="layout-topbar-actions">
            <div class="layout-config-menu">
                <button type="button" class="layout-topbar-action" (click)="toggleDarkMode()">
                    <i [ngClass]="{ 'pi ': true, 'pi-moon': layoutService.isDarkTheme(), 'pi-sun': !layoutService.isDarkTheme() }"></i>
                </button>
                <div class="relative">
                    <app-configurator />
                </div>
            </div>

            <div class="topbar-profile">
                <button class="topbar-profile-button" type="button" pStyleClass="@next" enterFromClass="hidden" enterActiveClass="animate-scalein" leaveToClass="hidden" leaveActiveClass="animate-fadeout" [hideOnOutsideClick]="true">
                    <span class="profile-details">
                        <span class="profile-name">{{ user.nome }}</span>
                        <span class="profile-job">{{ perfil }}</span>
                        <span class="profile-job">{{ cartorio }}</span>
                    </span>
                    <i class="pi pi-angle-down"></i>
                </button>
                <ul class="list-none p-4 m-0 rounded-border shadow hidden absolute bg-surface-0 dark:bg-surface-900 origin-top w-full sm:w-48 mt-2 right-0 top-auto">
                    <li>
                        <a (click)="sair()" pRipple class="flex p-2 rounded-border items-center hover:bg-emphasis transition-colors duration-150 cursor-pointer">
                            <i class="pi pi-power-off !mr-4"></i>
                            <span class="hidden sm:inline">Sair</span>
                        </a>
                    </li>
                </ul>
            </div>
        </div>
    </div>`
})
export class AppBarraSuperior implements OnInit {
    items!: MenuItem[];

    @ViewChild('searchinput') searchInput!: ElementRef;

    @ViewChild('menubutton') menuButton!: ElementRef;

    searchActive: boolean = false;
    user: Usuario = {};
    perfil: string = '';
    cartorio: string = '';
    isAmbienteDesenv: boolean = environment.ambiente !== 'production';
    sistema: string = 'Escala Agro';

    constructor(
        public layoutService: LayoutService,
        private auth: AutenticacaoService,
        private router: Router
    ) {}

    toggleDarkMode() {
        this.layoutService.layoutConfig.update((state) => ({ ...state, darkTheme: !state.darkTheme }));
    }
    sair() {
        this.auth.logout();
    }
    onMenuButtonClick() {
        this.layoutService.onMenuToggle();
    }

    ngOnInit() {
        this.user = this.auth.getUsuario();
        const perfil = this.auth.getPerfil();
        this.perfil = perfil?.nome || '';
    }

    activateSearch() {
        this.searchActive = true;
        setTimeout(() => {
            this.searchInput.nativeElement.focus();
        }, 100);
    }

    deactivateSearch() {
        this.searchActive = false;
    }
}
