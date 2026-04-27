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
        <div class="w-full flex flex-col gap-4">
            <div class="text-center">
                <img alt="app logo" src="assets/layout/images/logo4.png" class="w-20 mx-auto mb-2" />
                <div class="text-2xl font-bold text-surface-900">Sistema de Gestão de Escalas</div>
                <div class="text-sm text-surface-600">{{ sistema }}</div>
            </div>
            <div *ngIf="!carregando && error" class="rounded-md border border-red-200 bg-red-50 p-3 text-red-700 text-sm">
                <strong>Erro</strong>
                <p class="mb-2 mt-1">{{ errorMessage || 'Não foi possível se conectar ao servidor.' }}</p>
                <p-button label="Tentar novamente" severity="danger" icon="pi pi-refresh" (click)="tentarNovamente()"></p-button>
            </div>

            <div *ngIf="!carregando && !error && !temLogin" class="flex flex-col gap-2">
                <label for="loginInput" class="text-sm font-medium text-surface-700">Login</label>
                <input
                    id="loginInput"
                    pInputText
                    type="text"
                    [(ngModel)]="loginInput"
                    placeholder="Digite seu login"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    (keyup.enter)="fazerLogin()"
                />
                <button
                    pRipple
                    type="button"
                    (click)="fazerLogin()"
                    [disabled]="!loginInput || loginInput.trim() === ''"
                    class="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Entrar
                </button>
            </div>

            <div *ngIf="!carregando && !error && temLogin" class="flex flex-col gap-3">
                <p class="text-base font-semibold m-0">{{ user?.nome }}</p>

                <div *ngIf="temPerfil && (!up || up.length <= 1)" class="flex items-center gap-2">
                    <button pRipple type="button" (click)="entrar()" class="flex-1 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-md transition-all">
                        Entrar
                    </button>
                    <button pRipple type="button" (click)="logout()" class="w-10 h-10 bg-[rgba(0,20,40,0.95)] hover:bg-red-500 text-white rounded-md shadow-md transition-all flex items-center justify-center">
                        <i class="pi pi-sign-out text-lg"></i>
                    </button>
                </div>

                <div *ngIf="temPerfil && up?.length > 1" class="flex flex-col gap-2">
                    <p-select
                        [options]="up"
                        [(ngModel)]="perfilAtual"
                        optionLabel="label"
                        placeholder="Escolha o perfil"
                        class="w-full"
                        (onChange)="onPerfilChange($event)"
                    />
                    <div class="flex items-center gap-2">
                        <button
                            pRipple
                            type="button"
                            (click)="entrar()"
                            [disabled]="!perfilAtual"
                            class="flex-1 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Entrar
                        </button>
                        <button pRipple type="button" (click)="logout()" class="w-10 h-10 bg-[rgba(0,20,40,0.95)] hover:bg-red-500 text-white rounded-md shadow-md transition-all flex items-center justify-center">
                            <i class="pi pi-sign-out text-lg"></i>
                        </button>
                    </div>
                </div>
                <p-button *ngIf="!temPerfil" [disabled]="true" label="Usuário sem perfil cadastrado no sistema"></p-button>
            </div>
        </div>
    `
})
export class PrincipalCabecalho {
    sistema: string = 'SGEA';
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
                        this.errorMessage = 'Não foi possível se conectar ao servidor. Verifique se o backend está rodando na porta 4001.';
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
        this.temLogin = false;
        this.temPerfil = false;
        this.user = {};
        this.up = [];
        this.perfilAtual = undefined;
        this.loginInput = '';
        this.error = false;
        this.carregando = false;
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
                        this.errorMessage = 'Não foi possível se conectar ao servidor. Verifique se o backend está rodando na porta 4001.';
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
