import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { RippleModule } from 'primeng/ripple';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { AutenticacaoService } from '../../service/autenticacao.service';
import { CargaEscalaUsuariosResposta, EscalaApiService } from '../../service/escala-api.service';
import { EscopoServidor, ServidorApiService, ServidorListaItem } from '../../service/servidor-api.service';
import { AdicionarServidorDialogComponent } from './adicionar-servidor-dialog.component';

type ConjuntoCarga = 'desenvolvimento' | 'producao';

@Component({
    selector: 'app-servidores-lista',
    standalone: true,
    imports: [
        CommonModule,
        TableModule,
        ToastModule,
        ButtonModule,
        ConfirmDialogModule,
        RippleModule,
        TooltipModule,
        AdicionarServidorDialogComponent
    ],
    providers: [ConfirmationService],
    templateUrl: './servidores-lista.component.html'
})
export class ServidoresListaComponent implements OnInit {
    private api = inject(ServidorApiService);
    private escalaApi = inject(EscalaApiService);
    private auth = inject(AutenticacaoService);
    private router = inject(Router);
    private msg = inject(MessageService);
    private confirm = inject(ConfirmationService);

    escopoServidor: EscopoServidor = 'veterinario';
    linhas: ServidorListaItem[] = [];
    aguardandoConclusaoEscala: ServidorListaItem[] = [];
    existeEscalaBloqueandoOrdem = false;
    carregando = true;
    carregandoConjunto: ConjuntoCarga | null = null;
    excluindoId: number | null = null;
    suspenderId: number | null = null;
    existeEscalaAtiva = false;
    dialogAdicionarVisible = false;
    salvandoNovoServidor = false;

    get rotuloEscopo(): string {
        return this.escopoServidor === 'tecnico' ? 'técnicos' : 'veterinários';
    }

    get rotuloEscopoSingular(): string {
        return this.escopoServidor === 'tecnico' ? 'técnico' : 'veterinário';
    }

    ngOnInit(): void {
        this.carregar();
    }

    trocarEscopo(escopo: EscopoServidor): void {
        if (this.escopoServidor === escopo || this.carregando) {
            return;
        }
        this.escopoServidor = escopo;
        this.carregar();
    }

    abrirDialogAdicionar(): void {
        this.dialogAdicionarVisible = true;
    }

    salvarNovoServidor(dados: { nome: string; login: string; escopo: EscopoServidor }): void {
        const rotulo =
            dados.escopo === 'tecnico' ? 'Técnico' : 'Veterinário';
        this.salvandoNovoServidor = true;
        this.api.criar({ nome: dados.nome, login: dados.login }, dados.escopo).subscribe({
            next: (res) => {
                this.salvandoNovoServidor = false;
                this.dialogAdicionarVisible = false;
                if (this.escopoServidor !== dados.escopo) {
                    this.escopoServidor = dados.escopo;
                }
                const aguardando = !!res.servidor?.aguardandoConclusaoEscala;
                const detalhe = aguardando
                    ? 'O servidor foi incluído em Aguardando conclusão da escala e não alterou a ordem global.'
                    : 'O servidor foi incluído na ordem global como último da lista.';
                this.msg.add({
                    severity: 'success',
                    summary: `${rotulo} adicionado`,
                    detail: `${detalhe} Senha padrão: ${res.senhaPadrao}.`
                });
                this.carregar();
            },
            error: (err) => {
                this.salvandoNovoServidor = false;
                const det = err?.error?.message || `Não foi possível adicionar o ${rotulo.toLowerCase()}.`;
                this.msg.add({ severity: 'error', summary: 'Erro', detail: det });
            }
        });
    }

    private carregar(): void {
        this.carregando = true;
        this.api.existeEscalaAtiva().subscribe({
            next: (ativa) => {
                this.existeEscalaAtiva = ativa;
                this.api.listar(this.escopoServidor).subscribe({
                    next: (data) => {
                        this.linhas = data.ativos || [];
                        this.aguardandoConclusaoEscala = data.aguardandoConclusaoEscala || [];
                        this.existeEscalaBloqueandoOrdem = !!data.existeEscalaBloqueandoOrdem;
                        this.carregando = false;
                    },
                    error: () => {
                        this.carregando = false;
                        this.msg.add({
                            severity: 'error',
                            summary: 'Erro',
                            detail: `Não foi possível carregar os ${this.rotuloEscopo}.`
                        });
                    }
                });
            },
            error: () => {
                this.carregando = false;
                this.msg.add({ severity: 'error', summary: 'Erro', detail: 'Não foi possível validar escalas ativas.' });
            }
        });
    }

    confirmarCargaConjunto(conjunto: ConjuntoCarga): void {
        const rotulo = conjunto === 'desenvolvimento' ? 'desenvolvimento' : 'produção';
        this.confirm.confirm({
            message:
                `Carregar o conjunto de ${rotulo}? Isso apaga escalas, afastamentos, plantões e todos os usuários, ` +
                `substituindo pelos servidores do conjunto e recriando a ordem global. Você será desconectado ao final.`,
            header: `Carga ${rotulo}`,
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Confirmar carga',
            rejectLabel: 'Cancelar',
            acceptButtonStyleClass: 'p-button-danger',
            rejectButtonStyleClass: 'p-button-text',
            accept: () => this.executarCargaConjunto(conjunto)
        });
    }

    private executarCargaConjunto(conjunto: ConjuntoCarga): void {
        this.carregandoConjunto = conjunto;
        const req =
            conjunto === 'desenvolvimento'
                ? this.escalaApi.carregarDesenvolvimento()
                : this.escalaApi.carregarProducao();

        req.subscribe({
            next: (res) => {
                this.carregandoConjunto = null;
                const detalhe = this.montarDetalheCarga(res);
                sessionStorage.setItem('escalaPosCargaMensagem', detalhe);
                this.auth.logout();
                void this.router.navigate(['/']);
            },
            error: (err) => {
                this.carregandoConjunto = null;
                const det = err?.error?.message || 'Não foi possível executar a carga de servidores.';
                this.msg.add({ severity: 'error', summary: 'Erro', detail: det });
            }
        });
    }

    private montarDetalheCarga(res: CargaEscalaUsuariosResposta): string {
        const i = res.inseridos;
        return (
            `${res.mensagem} Total: ${i.totalUsuarios} (${i.veterinarios} vets, ${i.tecnicos} técnicos). ` +
            `Faça login novamente (senha padrão: ${res.senhaPadrao}).`
        );
    }

    confirmarExcluir(row: ServidorListaItem): void {
        if (this.existeEscalaAtiva) {
            if (row.suspensoEscala) {
                this.confirm.confirm({
                    message: `Reativar o servidor "${row.nome}" para participação em escalas ativas?`,
                    header: 'Reativar servidor',
                    icon: 'pi pi-exclamation-triangle',
                    acceptLabel: 'Reativar',
                    rejectLabel: 'Cancelar',
                    acceptButtonStyleClass: 'p-button-success',
                    rejectButtonStyleClass: 'p-button-text',
                    accept: () => this.reativar(row)
                });
                return;
            }
            this.confirm.confirm({
                message: `Suspender o servidor "${row.nome}" nas escalas ativas? O servidor ficará marcado como suspenso da escala.`,
                header: 'Suspender servidor',
                icon: 'pi pi-exclamation-triangle',
                acceptLabel: 'Suspender',
                rejectLabel: 'Cancelar',
                acceptButtonStyleClass: 'p-button-warning',
                rejectButtonStyleClass: 'p-button-text',
                accept: () => this.suspender(row)
            });
            return;
        }
        this.confirm.confirm({
            message:
                `Excluir o ${this.rotuloEscopoSingular} "${row.nome}"? Ele será removido do papel de ${this.rotuloEscopoSingular}, desativado no sistema e a ordem dos servidores será recalculada (incluindo escala ativa, se houver).`,
            header: `Excluir ${this.rotuloEscopoSingular}`,
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Excluir',
            rejectLabel: 'Cancelar',
            acceptButtonStyleClass: 'p-button-danger',
            rejectButtonStyleClass: 'p-button-text',
            accept: () => this.excluir(row)
        });
    }

    private excluir(row: ServidorListaItem): void {
        this.excluindoId = row.id;
        this.api.excluir(row.id, this.escopoServidor).subscribe({
            next: (res) => {
                this.excluindoId = null;
                this.linhas = this.linhas.filter((x) => x.id !== row.id);
                this.aguardandoConclusaoEscala = this.aguardandoConclusaoEscala.filter((x) => x.id !== row.id);
                const rec = res?.recalcEscalas;
                const detalhe = rec
                    ? `Escalas afetadas: ${rec.escalasAfetadas}; plantões atualizados: ${rec.plantoesAtualizados}.`
                    : 'Exclusão concluída.';
                this.msg.add({
                    severity: 'success',
                    summary: `${this.rotuloEscopoSingular.charAt(0).toUpperCase()}${this.rotuloEscopoSingular.slice(1)} excluído`,
                    detail: detalhe
                });
                this.carregar();
            },
            error: (err) => {
                this.excluindoId = null;
                const det = err?.error?.message || `Não foi possível excluir o ${this.rotuloEscopoSingular}.`;
                this.msg.add({ severity: 'error', summary: 'Erro', detail: det });
            }
        });
    }

    private suspender(row: ServidorListaItem): void {
        this.suspenderId = row.id;
        this.api.suspender(row.id, this.escopoServidor).subscribe({
            next: (res) => {
                this.suspenderId = null;
                const detalhe = `Escalas afetadas: ${res.escalasAfetadas}; servidor marcado como suspenso da escala.`;
                this.msg.add({
                    severity: 'success',
                    summary: 'Servidor suspenso',
                    detail: detalhe
                });
                this.carregar();
            },
            error: (err) => {
                this.suspenderId = null;
                const det = err?.error?.message || 'Não foi possível suspender o servidor.';
                this.msg.add({ severity: 'error', summary: 'Erro', detail: det });
            }
        });
    }

    private reativar(row: ServidorListaItem): void {
        this.suspenderId = row.id;
        this.api.reativar(row.id, this.escopoServidor).subscribe({
            next: (res) => {
                this.suspenderId = null;
                const detalhe = `Escalas afetadas: ${res.escalasAfetadas}; servidor reativado para escala.`;
                this.msg.add({
                    severity: 'success',
                    summary: 'Servidor reativado',
                    detail: detalhe
                });
                this.carregar();
            },
            error: (err) => {
                this.suspenderId = null;
                const det = err?.error?.message || 'Não foi possível reativar o servidor.';
                this.msg.add({ severity: 'error', summary: 'Erro', detail: det });
            }
        });
    }
}
