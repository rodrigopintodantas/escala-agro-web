import { Component, ElementRef, inject, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { AppMenuitem } from './app.menuitem';
import { AutenticacaoService } from '../../service/autenticacao.service';

@Component({
    selector: 'app-menu',
    standalone: true,
    imports: [CommonModule, AppMenuitem, RouterModule],
    template: `<ul class="layout-menu">
        <ng-container *ngFor="let item of model; let i = index">
            <li app-menuitem *ngIf="!item.separator" [item]="item" [index]="i" [root]="true"></li>
            <li *ngIf="item.separator" class="menu-separator"></li>
        </ng-container>
    </ul> `
})
export class AppMenu implements OnInit {
    el: ElementRef = inject(ElementRef);
    model: MenuItem[] = [];

    @ViewChild('menuContainer') menuContainer!: ElementRef;
    auth = inject(AutenticacaoService);

    ngOnInit() {
        if (this.auth.isAdmin()) {
            this.model = this.menuAdmin;
            return;
        }

        if (this.auth.isVeterinario()) {
            this.model = this.menuVeterinario;
            return;
        }

        if (this.auth.isProdutor()) {
            this.model = this.menuProdutor;
            return;
        }

        this.model = this.menuBasico;
    }

    menuBasico: MenuItem[] = [
        {
            label: 'Menu',
            items: [
                {
                    label: 'Início',
                    icon: 'pi pi-home',
                    routerLink: ['/']
                }
            ]
        }
    ];

    menuAdmin: MenuItem[] = [
        {
            label: 'Menu - Admin',
            items: [
                {
                    label: 'Início',
                    icon: 'pi pi-home',
                    routerLink: ['/admin']
                },
                {
                    label: 'Ordem veterinários',
                    icon: 'pi pi-sort-alt',
                    routerLink: ['/admin/ordem-servidores']
                },
                {
                    label: 'Ordem técnicos',
                    icon: 'pi pi-sort-alt',
                    routerLink: ['/admin/ordem-tecnicos']
                },
                {
                    label: 'Escalas',
                    icon: 'pi pi-calendar',
                    routerLink: ['/admin/escalas']
                },
                {
                    label: 'Afastamentos',
                    icon: 'pi pi-calendar-times',
                    routerLink: ['/admin/afastamentos']
                },
                {
                    label: 'Servidores',
                    icon: 'pi pi-users',
                    routerLink: ['/admin/servidores']
                }
            ]
        }
    ];

    menuVeterinario: MenuItem[] = [
        {
            label: 'Menu - Veterinário',
            items: [
                {
                    label: 'Início',
                    icon: 'pi pi-home',
                    routerLink: ['/vt']
                },
                {
                    label: 'Escalas',
                    icon: 'pi pi-calendar',
                    routerLink: ['/vt/escalas']
                },
                {
                    label: 'Afastamentos',
                    icon: 'pi pi-calendar-times',
                    routerLink: ['/vt/afastamentos']
                }
            ]
        }
    ];

    menuProdutor: MenuItem[] = [
        {
            label: 'Menu - Produtor',
            items: [
                {
                    label: 'Início',
                    icon: 'pi pi-home',
                    routerLink: ['/produtor']
                }
            ]
        }
    ];
}
