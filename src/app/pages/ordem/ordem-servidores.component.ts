import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { EscalaApiService, VeterinarioOption } from '../../service/escala-api.service';

@Component({
    selector: 'app-ordem-servidores',
    standalone: true,
    imports: [CommonModule, ButtonModule, TableModule, ToastModule],
    templateUrl: './ordem-servidores.component.html'
})
export class OrdemServidoresComponent implements OnInit {
    private api = inject(EscalaApiService);
    private msg = inject(MessageService);
    private route = inject(ActivatedRoute);

    /** `veterinario` ou `tecnico` — pode vir da rota (`data.ordemEscopo`). */
    escopoOrdem: 'veterinario' | 'tecnico' = 'veterinario';
    exibirAbasEscopo = false;

    @Input() servidores: VeterinarioOption[] = [];
    @Input() exibirCabecalho = true;
    @Input() carregarAutomaticamente = true;
    @Output() ordemChange = new EventEmitter<VeterinarioOption[]>();

    carregando = false;
    salvando = false;
    existeEscalaAtiva = false;
    private ordemOriginalIds: number[] = [];

    get ordemFoiAlterada(): boolean {
        const atual = this.servidores.map((s) => Number(s.id)).join(',');
        const original = this.ordemOriginalIds.join(',');
        return atual !== original;
    }

    ngOnInit(): void {
        const dataEscopo = this.route.snapshot.data['ordemEscopo'];
        if (dataEscopo === 'tecnico') {
            this.escopoOrdem = 'tecnico';
        } else if (dataEscopo === 'veterinario') {
            this.escopoOrdem = 'veterinario';
        } else {
            this.exibirAbasEscopo = true;
        }

        if (!this.carregarAutomaticamente) {
            return;
        }

        this.carregarBloqueioEdicaoPorEscalaAtiva();
        this.carregarListaPorEscopo();
    }

    trocarEscopo(escopo: 'veterinario' | 'tecnico'): void {
        if (this.escopoOrdem === escopo || this.carregando || this.salvando) {
            return;
        }
        this.escopoOrdem = escopo;
        if (this.carregarAutomaticamente) {
            this.carregarListaPorEscopo();
        }
    }

    private carregarListaPorEscopo(): void {
        this.carregando = true;
        this.api.listarOrdemServidores(this.escopoOrdem).subscribe({
            next: (lista) => {
                this.carregando = false;
                this.servidores = [...lista];
                this.ordemOriginalIds = this.servidores.map((s) => Number(s.id));
            },
            error: () => {
                this.carregando = false;
                this.msg.add({ severity: 'error', summary: 'Erro', detail: 'Não foi possível carregar a ordem dos servidores.' });
            }
        });
    }

    private carregarBloqueioEdicaoPorEscalaAtiva(): void {
        this.api.listar().subscribe({
            next: (escalas) => {
                this.existeEscalaAtiva = (escalas || []).some((e) => String(e.status || '').toLowerCase() === 'ativa');
            },
            error: () => {
                this.existeEscalaAtiva = false;
            }
        });
    }

    salvarOrdem(): void {
        if (!this.ordemFoiAlterada) {
            this.msg.add({ severity: 'info', summary: 'Ordem', detail: 'Nenhuma alteração para salvar.' });
            return;
        }

        const ordemEnviadaIds = this.servidores.map((s) => Number(s.id));
        const servidoresNaOrdemEnviada = [...this.servidores];
        this.salvando = true;
        this.api
            .salvarOrdemServidores(ordemEnviadaIds, this.escopoOrdem)
            .subscribe({
                next: (lista) => {
                    this.salvando = false;
                    /**
                     * Mantém a ordem escolhida pelo usuário para evitar "piscar" visual quando a API
                     * retorna a lista ainda não refletindo a ordenação recém-salva.
                     */
                    const mapaRetorno = new Map((lista || []).map((s) => [Number(s.id), s]));
                    this.servidores = servidoresNaOrdemEnviada.map((s) => {
                        const ret = mapaRetorno.get(Number(s.id));
                        return ret ? { ...ret } : s;
                    });
                    this.ordemOriginalIds = [...ordemEnviadaIds];
                    this.msg.add({ severity: 'success', summary: 'Ordem', detail: 'Ordem dos servidores salva com sucesso.' });
                },
                error: (err) => {
                    this.salvando = false;
                    const det = err?.error?.message || 'Não foi possível salvar a ordem.';
                    this.msg.add({ severity: 'error', summary: 'Erro', detail: det });
                }
            });
    }

    moverParaCima(index: number): void {
        this.mover(index, index - 1);
    }

    moverParaBaixo(index: number): void {
        this.mover(index, index + 1);
    }

    private mover(from: number, to: number): void {
        if (from < 0 || to < 0 || from >= this.servidores.length || to >= this.servidores.length) {
            return;
        }

        const proximaOrdem = [...this.servidores];
        const [item] = proximaOrdem.splice(from, 1);
        proximaOrdem.splice(to, 0, item);
        this.servidores = proximaOrdem;
        this.ordemChange.emit(proximaOrdem);
    }
}
