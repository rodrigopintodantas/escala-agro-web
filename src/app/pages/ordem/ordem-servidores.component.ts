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

    @Input() servidores: VeterinarioOption[] = [];
    @Input() exibirCabecalho = true;
    @Input() carregarAutomaticamente = true;
    @Output() ordemChange = new EventEmitter<VeterinarioOption[]>();

    carregando = false;
    salvando = false;
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
        }

        if (!this.carregarAutomaticamente) {
            return;
        }

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

    salvarOrdem(): void {
        if (!this.ordemFoiAlterada) {
            this.msg.add({ severity: 'info', summary: 'Ordem', detail: 'Nenhuma alteração para salvar.' });
            return;
        }

        this.salvando = true;
        this.api
            .salvarOrdemServidores(this.servidores.map((s) => Number(s.id)), this.escopoOrdem)
            .subscribe({
                next: (lista) => {
                    this.salvando = false;
                    this.servidores = [...lista];
                    this.ordemOriginalIds = this.servidores.map((s) => Number(s.id));
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
