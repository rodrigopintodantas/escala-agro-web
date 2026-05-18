import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { RippleModule } from 'primeng/ripple';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { EscopoServidor, ServidorApiService, ServidorListaItem } from '../../service/servidor-api.service';

@Component({
    selector: 'app-servidores-lista',
    standalone: true,
    imports: [CommonModule, TableModule, ToastModule, ButtonModule, ConfirmDialogModule, RippleModule, TooltipModule],
    providers: [ConfirmationService],
    templateUrl: './servidores-lista.component.html'
})
export class ServidoresListaComponent implements OnInit {
    private api = inject(ServidorApiService);
    private msg = inject(MessageService);
    private confirm = inject(ConfirmationService);

    escopoServidor: EscopoServidor = 'veterinario';
    linhas: ServidorListaItem[] = [];
    carregando = true;
    excluindoId: number | null = null;
    suspenderId: number | null = null;
    existeEscalaAtiva = false;

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

    private carregar(): void {
        this.carregando = true;
        this.api.existeEscalaAtiva().subscribe({
            next: (ativa) => {
                this.existeEscalaAtiva = ativa;
                this.api.listar(this.escopoServidor).subscribe({
                    next: (data) => {
                        this.linhas = data;
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
