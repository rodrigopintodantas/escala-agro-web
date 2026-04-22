import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { Table, TableModule } from 'primeng/table';
import { CardModule } from 'primeng/card';
import { ToolbarModule } from 'primeng/toolbar';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonDirective } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { CONST } from '../helpers/constantes';
import { Job, JobService } from '../../service/job.service';

@Component({
    selector: 'app-lista-jobs',
    standalone: true,
    imports: [CommonModule, TableModule, CardModule, ToolbarModule, InputTextModule, ButtonDirective, TagModule],
    providers: [JobService],
    templateUrl: './lista-jobs.component.html'
})
export class ListaJobsComponent implements OnInit {
    private jobService = inject(JobService);

    itens: Job[] = [];
    executandoIds = new Set<number>();
    constantes = CONST;
    globalFilters = ['id', 'nome', 'descricao', 'proxima_execucao', 'ultimo_status'];
    page = { titulo: 'Jobs' };

    cols = [
        { field: 'id', header: 'ID' },
        { field: 'nome', header: 'Job key' },
        { field: 'descricao', header: 'Descrição' },
        { field: 'ultimo_status', header: 'Status' },
        { field: 'ultima_execucao_inicio', header: 'Início' },
        { field: 'ultima_execucao_fim', header: 'Fim' },
        { field: 'proxima_execucao', header: 'Próxima execução' },
        { field: 'interval_seconds', header: 'Intervalo (s)' },
        { field: 'ativo', header: 'Ativo' }
    ];

    ngOnInit(): void {
        this.carregar();
    }

    carregar() {
        this.jobService.listar().subscribe({
            next: (res) => {
                this.itens = res?.dados || [];
            },
            error: () => {
                this.itens = [];
            }
        });
    }

    executar(item: Job) {
        if (!item?.id || this.executandoIds.has(item.id)) return;
        this.executandoIds.add(item.id);

        this.jobService.executar(item.id).subscribe({
            next: () => {
                this.executandoIds.delete(item.id);
                this.carregar();
            },
            error: () => {
                this.executandoIds.delete(item.id);
            }
        });
    }

    onGlobalFilter(table: Table, event: Event) {
        table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
    }

    formatDate(date?: string | null): string {
        if (!date) return '-';
        const d = new Date(date);
        if (Number.isNaN(d.getTime())) return '-';
        return d.toLocaleString('pt-BR');
    }

    getAtivoSeverity(ativo: boolean): string {
        return ativo ? 'success' : 'danger';
    }

    getAtivoLabel(ativo: boolean): string {
        return ativo ? 'Sim' : 'Não';
    }

    getStatusLabel(status: Job['ultimo_status']): string {
        if (!status) return 'Nunca executado';
        if (status === 'queued') return 'Na fila';
        if (status === 'running') return 'Executando';
        if (status === 'succeeded') return 'Concluído';
        if (status === 'failed') return 'Falhou';
        if (status === 'cancelled') return 'Cancelado';
        return status;
    }

    getStatusSeverity(status: Job['ultimo_status']): string {
        if (!status) return 'secondary';
        if (status === 'running') return 'info';
        if (status === 'queued') return 'warning';
        if (status === 'succeeded') return 'success';
        if (status === 'failed') return 'danger';
        return 'secondary';
    }
}

