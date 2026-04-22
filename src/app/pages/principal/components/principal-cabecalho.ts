import { Component, inject } from '@angular/core';
import { StyleClassModule } from 'primeng/styleclass';
import { Router, RouterModule } from '@angular/router';
import { RippleModule } from 'primeng/ripple';
import { ButtonModule } from 'primeng/button';
import { CommonModule, NgIf } from '@angular/common';
import { Perfil } from '../../../types/perfil.model';
import { SelectModule } from 'primeng/select';
import { FormsModule } from '@angular/forms';
import { ProgressBarModule } from 'primeng/progressbar';
import { AutenticacaoService } from '../../../service/autenticacao.service';
import { environment } from '../../../../environments/environment';
import { MessageModule } from 'primeng/message';
import { InputTextModule } from 'primeng/inputtext';

@Component({
    selector: 'principal-cabecalho',
    standalone: true,
    imports: [RouterModule, StyleClassModule, ButtonModule, RippleModule, NgIf, SelectModule, FormsModule, ProgressBarModule, MessageModule, CommonModule, InputTextModule],
    template: `
        <div class="relative w-full flex items-center justify-between px-4 py-2 h-[4rem]">
            <a style="display: flex; align-items: center; flex-shrink: 0;">
                <img alt="app logo" src="assets/layout/images/logo4.png" style="width: 5rem;" />
                <span style="font-size: 1.5rem; font-weight: 700; margin-left: 0.5rem; color: var(--v-menuitem-text-color);"> ESCALA AGRO </span>
            </a>

            <div class="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 text-3xl font-bold pointer-events-none text-center" style="color: var(--v-menuitem-text-color); max-width: 60%; line-height: 1.2;">
                <span class="whitespace-pre-line" style="display: inline-block; word-break: break-word; hyphens: auto;">{{ sistema }}</span>
            </div>

            <a pButton [text]="true" severity="secondary" [rounded]="true" pRipple class="lg:!hidden" pStyleClass="@next" enterClass="hidden" leaveToClass="hidden" [hideOnOutsideClick]="true">
                <i class="pi pi-bars !text-2xl"></i>
            </a>

            <div class="flex items-center gap-4">
                <div *ngIf="!carregando && error" class="flex items-center gap-4">
                    <div class="alert-danger p-2">
                        <span><strong>Erro</strong></span>
                        <p class="mb-2">{{ errorMessage || 'Não foi possível se conectar ao servidor.' }}</p>
                        <p-button label="Tentar novamente" severity="danger" icon="pi pi-refresh" (click)="tentarNovamente()"></p-button>
                    </div>
                    <button pRipple type="button" (click)="logout()" class="w-10 h-10 bg-[rgba(0,20,40,0.95)] hover:bg-red-500 text-white rounded-full shadow-md transition-all flex items-center justify-center">
                        <i class="pi pi-sign-out text-lg"></i>
                    </button>
                </div>

                <div *ngIf="!carregando && !error && !temLogin" class="flex items-center gap-2">
                    <input
                        pInputText
                        type="text"
                        [(ngModel)]="loginInput"
                        placeholder="Digite seu login"
                        class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        (keyup.enter)="fazerLogin()"
                    />
                    <button
                        pRipple
                        type="button"
                        (click)="fazerLogin()"
                        [disabled]="!loginInput || loginInput.trim() === ''"
                        class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Entrar
                    </button>
                </div>

                <div *ngIf="!carregando && !error && temLogin">
                    <div *ngIf="temPerfil && (!up || up.length <= 1)" class="flex items-center gap-4">
                        <p class="text-lg font-semibold leading-normal m-0">{{ user?.nome }}</p>
                        <button pRipple type="button" (click)="entrar()" class="text-xl px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-md transition-all">Entrar</button>
                        <button pRipple type="button" (click)="logout()" class="w-10 h-10 bg-[rgba(0,20,40,0.95)] hover:bg-red-500 text-white rounded-full shadow-md transition-all flex items-center justify-center">
                            <i class="pi pi-sign-out text-lg"></i>
                        </button>
                    </div>

                    <div *ngIf="temPerfil && up?.length > 1" class="flex flex-col gap-2 items-start">
                        <p class="text-lg font-semibold leading-normal m-0">{{ user?.nome }}</p>
                        <div class="flex items-center gap-4">
                            <div class="relative group">
                                <p-select
                                    [options]="up"
                                    [(ngModel)]="perfilAtual"
                                    optionLabel="label"
                                    placeholder="Escolha o perfil"
                                    class="w-full md:w-56 border border-blue-600 focus:ring-blue-600 focus:border-blue-600 shadow-sm rounded-md"
                                    (onChange)="onPerfilChange($event)"
                                />
                            </div>
                            <button
                                pRipple
                                type="button"
                                (click)="entrar()"
                                [disabled]="!perfilAtual"
                                class="text-xl px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Entrar
                            </button>
                            <button pRipple type="button" (click)="logout()" class="w-10 h-10 bg-[rgba(0,20,40,0.95)] hover:bg-red-500 text-white rounded-full shadow-md transition-all flex items-center justify-center">
                                <i class="pi pi-sign-out text-lg"></i>
                            </button>
                        </div>
                    </div>

                    <p-button *ngIf="!temPerfil" [disabled]="true" label="usuário sem perfil cadastrado no sistema"></p-button>
                </div>
            </div>
        </div>
    `
})
export class PrincipalCabecalho {
    sistema: string = 'Escala Agro';
    labelEntrar = 'Entrar';
    habilitarEntrar = true;

    user: any;
    up: any;

    auth = inject(AutenticacaoService);
    router = inject(Router);
    temPerfil: boolean = false;

    perfilAtual?: Perfil;

    carregando: boolean = true;
    error: boolean = false;
    errorMessage: string = '';
    loginInput: string = '';
    temLogin: boolean = false;

    isLocalEnvironment = environment.ambiente !== 'production';
    isAmbienteDesenv: boolean = environment.ambiente !== 'production';

    ngOnInit(): void {
        this.error = false;
        this.carregando = true;

        const userLogin = this.auth.getUserLogin();
        this.temLogin = !!userLogin;

        if (!userLogin) {
            this.carregando = false;
            this.error = false;
            return;
        }

        try {
            this.auth.carregarPerfil().subscribe({
                next: () => {
                    this.user = this.auth.getUsuario();
                    this.temPerfil = this.auth.temPerfil();
                    this.up = this.auth.getPerfis();

                    if (this.up && this.up.length > 0) {
                        this.up = this.up.map((perfil: any) => ({
                            ...perfil,
                            label: perfil.nome
                        }));

                        if (this.up.length === 1) {
                            this.perfilAtual = this.up[0];
                        } else {
                            this.perfilAtual = undefined;
                        }
                    }

                    this.habilitarEntrar = this.temPerfil;
                    this.carregando = false;
                    this.temLogin = true;
                },
                error: (error) => {
                    if (error && error.error && error.error.message) {
                        this.errorMessage = error.error.message;
                    } else if (error && error.message) {
                        this.errorMessage = error.message;
                    } else {
                        this.errorMessage = 'Não foi possível se conectar ao servidor. Verifique se o backend está rodando na porta 3000.';
                    }
                    this.error = true;
                    this.carregando = false;
                }
            });
        } catch (error: any) {
            this.errorMessage = 'Erro ao tentar conectar ao servidor. Verifique se o backend está rodando.';
            this.error = true;
            this.carregando = false;
        }
    }

    entrar() {
        if (this.perfilAtual) {
            this.auth.definePerfil(this.perfilAtual);
            setTimeout(() => {
                if (this.perfilAtual?.dashboard) {
                    this.router.navigate([this.perfilAtual.dashboard]);
                }
            }, 100);
        } else {
            this.temPerfil = this.auth.temPerfil();
        }
    }

    tentarNovamente() {
        this.ngOnInit();
    }

    logout() {
        this.auth.logout();
    }

    shouldShowTooltip(perfil: any): boolean {
        return false;
    }

    onPerfilChange(event: any) {}

    fazerLogin() {
        if (!this.loginInput || this.loginInput.trim() === '') {
            return;
        }

        this.carregando = true;
        this.error = false;
        this.auth.login(this.loginInput.trim());

        setTimeout(() => {
            this.auth.carregarPerfil().subscribe({
                next: () => {
                    this.temLogin = true;
                    this.user = this.auth.getUsuario();
                    this.temPerfil = this.auth.temPerfil();
                    this.up = this.auth.getPerfis();

                    if (this.up && this.up.length > 0) {
                        this.up = this.up.map((perfil: any) => ({
                            ...perfil,
                            label: perfil.nome
                        }));

                        if (this.up.length === 1) {
                            this.perfilAtual = this.up[0];
                        } else {
                            this.perfilAtual = undefined;
                        }
                    }

                    this.carregando = false;
                },
                error: (error) => {
                    if (error && error.error && error.error.message) {
                        this.errorMessage = error.error.message;
                    } else if (error && error.message) {
                        this.errorMessage = error.message;
                    } else {
                        this.errorMessage = 'Não foi possível se conectar ao servidor. Verifique se o backend está rodando na porta 3000.';
                    }
                    this.error = true;
                    this.carregando = false;
                    this.temLogin = false;
                    this.auth.logout();
                }
            });
        }, 100);
    }
}
