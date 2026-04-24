import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { AuditoriaEscalaAbertaItem, AuditoriaEscalaEventoItem, EscalaApiService } from '../../service/escala-api.service';

@Component({
    selector: 'app-auditoria',
    standalone: true,
    imports: [CommonModule, ButtonModule, CardModule, ProgressSpinnerModule, TagModule, ToastModule],
    templateUrl: './auditoria.component.html'
})
export class AuditoriaComponent implements OnInit {
    private api = inject(EscalaApiService);
    private msg = inject(MessageService);

    abaSelecionada: 'veterinario' | 'tecnico' = 'veterinario';
    carregando = false;
    escalas: AuditoriaEscalaAbertaItem[] = [];

    ngOnInit(): void {
        this.carregar();
    }

    trocarAba(aba: 'veterinario' | 'tecnico'): void {
        if (this.abaSelecionada === aba || this.carregando) return;
        this.abaSelecionada = aba;
        this.carregar();
    }

    private carregar(): void {
        this.carregando = true;
        this.api.listarAuditoria(this.abaSelecionada).subscribe({
            next: (lista) => {
                this.escalas = lista || [];
                this.carregando = false;
            },
            error: () => {
                this.carregando = false;
                this.msg.add({ severity: 'error', summary: 'Erro', detail: 'Não foi possível carregar a auditoria.' });
            }
        });
    }

    tituloEvento(ev: AuditoriaEscalaEventoItem): string {
        const tipo = String(ev.tipoEvento || '');
        if (tipo === 'ordem_inicial') return 'Ordem inicial';
        if (tipo === 'afastamento_inclusao') return 'Inclusão de afastamento';
        if (tipo === 'afastamento_exclusao') return 'Exclusão de afastamento';
        if (tipo === 'feriado_inclusao') return 'Inclusão de feriado/ponto facultativo';
        if (tipo === 'feriado_exclusao') return 'Exclusão de feriado/ponto facultativo';
        return 'Recalculo de ordem';
    }

    descricaoEvento(ev: AuditoriaEscalaEventoItem): string | null {
        const tipo = String(ev.tipoEvento || '');
        const detalhes = (ev.detalhes || {}) as {
            dataInicio?: string;
            dataFim?: string;
            datas?: string[];
            plantaoIds?: number[];
            servidorRelacionado?: { usuarioId?: number; nome?: string | null; login?: string | null; papel?: string | null };
        };
        const servidorNomeBase = detalhes.servidorRelacionado?.nome || detalhes.servidorRelacionado?.login || null;
        const servidorNome = servidorNomeBase
            ? `${servidorNomeBase}${detalhes.servidorRelacionado?.papel ? ` - ${detalhes.servidorRelacionado.papel}` : ''}`
            : null;
        if (tipo === 'afastamento_inclusao') {
            const periodo = this.periodoOpcional(detalhes.dataInicio, detalhes.dataFim);
            return `Afastamento ${ev.referenciaId ? `#${ev.referenciaId}` : ''}${servidorNome ? ` - ${servidorNome}` : ''}${periodo ? ` (${periodo})` : ''}`.trim();
        }
        if (tipo === 'afastamento_exclusao') {
            const periodo = this.periodoOpcional(detalhes.dataInicio, detalhes.dataFim);
            return `Afastamento removido ${ev.referenciaId ? `#${ev.referenciaId}` : ''}${servidorNome ? ` - ${servidorNome}` : ''}${periodo ? ` (${periodo})` : ''}`.trim();
        }
        if (tipo === 'feriado_inclusao') {
            const datas = Array.isArray(detalhes.datas) ? detalhes.datas : [];
            if (datas.length > 0) return `Datas extras incluídas: ${datas.map((d) => this.dataCurta(d)).join(', ')}`;
            return 'Inclusão de data(s) extra(s) na escala';
        }
        if (tipo === 'feriado_exclusao') {
            if (Array.isArray(detalhes.plantaoIds) && detalhes.plantaoIds.length > 0) {
                return `Plantões removidos: ${detalhes.plantaoIds.length}`;
            }
            return 'Exclusão de data(s) extra(s) da escala';
        }
        return null;
    }

    severidadeEvento(ev: AuditoriaEscalaEventoItem): 'success' | 'danger' | 'info' | 'warn' | 'secondary' {
        const tipo = String(ev.tipoEvento || '');
        if (tipo === 'ordem_inicial') return 'secondary';
        if (tipo === 'afastamento_inclusao' || tipo === 'feriado_inclusao') return 'success';
        if (tipo === 'afastamento_exclusao' || tipo === 'feriado_exclusao') return 'danger';
        return 'info';
    }

    classeMarcadorEvento(ev: AuditoriaEscalaEventoItem): string {
        const tipo = String(ev.tipoEvento || '');
        if (tipo === 'ordem_inicial') return 'bg-surface-500';
        if (tipo === 'afastamento_inclusao' || tipo === 'feriado_inclusao') return 'bg-green-500';
        if (tipo === 'afastamento_exclusao' || tipo === 'feriado_exclusao') return 'bg-red-500';
        return 'bg-blue-500';
    }

    nomesOrdem(arr: { usuarioId: number; nome: string | null; login: string | null }[]): string {
        if (!Array.isArray(arr) || arr.length === 0) return '—';
        return arr.map((x) => x.nome || x.login || `#${x.usuarioId}`).join(' > ');
    }

    periodo(inicio: string, fim: string): string {
        const d1 = new Date(`${inicio}T12:00:00`).toLocaleDateString('pt-BR');
        const d2 = new Date(`${fim}T12:00:00`).toLocaleDateString('pt-BR');
        return `${d1} a ${d2}`;
    }

    private periodoOpcional(inicio?: string, fim?: string): string | null {
        if (!inicio || !fim) return null;
        return this.periodo(inicio, fim);
    }

    private dataCurta(iso: string): string {
        return new Date(`${iso}T12:00:00`).toLocaleDateString('pt-BR');
    }
}
