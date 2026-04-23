import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { RippleModule } from 'primeng/ripple';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import {
    EscalaApiService,
    EscalaDetalhe,
    EscalaListagem,
    RemoverPlantoesFeriadosResposta
} from '../../service/escala-api.service';

export interface FeriadoCadastradoItem {
    plantaoId: number;
    iso: string;
}

export type EscalasListaModo = 'admin' | 'veterinario';

@Component({
    selector: 'app-escalas-lista',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        RouterModule,
        TableModule,
        ButtonModule,
        TagModule,
        ToastModule,
        ConfirmDialogModule,
        DialogModule,
        DropdownModule,
        TooltipModule,
        RippleModule
    ],
    providers: [ConfirmationService],
    templateUrl: './escalas-lista.component.html'
})
export class EscalasListaComponent implements OnInit {
    private route = inject(ActivatedRoute);
    private api = inject(EscalaApiService);
    private msg = inject(MessageService);
    private confirm = inject(ConfirmationService);

    /** Definido pelos `data` da rota (`/admin/escalas` ou `/vt/escalas`). */
    modoEscalas: EscalasListaModo = 'admin';

    escalas: EscalaListagem[] = [];
    carregando = true;
    excluindoId: number | null = null;
    ativandoEscalaId: number | null = null;
    concluindoEscalaId: number | null = null;

    /** Somente admin: edição limitada a datas adicionais de plantão. */
    dialogEditarExtrasAberto = false;
    escalaEditarExtras: EscalaListagem | null = null;
    /**
     * Plantões em dias que não são sábado/domingo (feriados / pontos facultativos na escala).
     */
    feriadosCadastrados: FeriadoCadastradoItem[] = [];
    /** Plantão selecionado no dropdown para remoção (uma por vez). */
    plantaoSelecionadoParaRemocao: number | null = null;
    removerFeriadoCarregandoId: number | null = null;
    /** Dias do período que ainda não têm plantão (inclusão uma data por vez). */
    opcoesNovasDatasEscala: { iso: string; exibicao: string }[] = [];
    /** ISO AAAA-MM-DD da data escolhida no dropdown para incluir. */
    dataSelecionadaParaInclusao: string | null = null;
    carregandoDetalheEscalaId: number | null = null;
    salvandoDatasExtras = false;

    /** Limites do período (sempre a partir do GET /escala/:id — evita intervalo errado na lista). */
    private periodoEditarMin: Date | null = null;
    private periodoEditarMax: Date | null = null;

    get prefixoArea(): string {
        return this.modoEscalas === 'veterinario' ? '/vt' : '/admin';
    }

    /** Evita clicar em ações de outra linha enquanto uma ativação ou conclusão está em andamento. */
    acaoOutraEscalaEmAndamento(rowId: number): boolean {
        return (
            (this.ativandoEscalaId !== null && this.ativandoEscalaId !== rowId) ||
            (this.concluindoEscalaId !== null && this.concluindoEscalaId !== rowId)
        );
    }

    /** Inclusão ou remoção em andamento — bloqueia a outra ação. */
    get bloqueadoDialogExtras(): boolean {
        return this.salvandoDatasExtras || this.removerFeriadoCarregandoId !== null;
    }

    ngOnInit(): void {
        const m = this.route.snapshot.data['escalasModo'];
        if (m === 'veterinario') {
            this.modoEscalas = 'veterinario';
        }

        this.api.listar().subscribe({
            next: (data) => {
                this.escalas = data;
                this.carregando = false;
            },
            error: () => {
                this.carregando = false;
                this.msg.add({ severity: 'error', summary: 'Erro', detail: 'Não foi possível carregar as escalas.' });
            }
        });
    }

    labelPeriodicidade(p: string): string {
        if (p === 'fim_de_semana') return 'Sábados e domingos';
        return p || '—';
    }

    severityStatus(status: string): 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast' | undefined {
        const s = (status || '').toLowerCase();
        if (s === 'ativa') return 'success';
        if (s === 'encerrada' || s === 'concluida') return 'secondary';
        return 'info';
    }

    /** Rótulo amigável para o status no `p-tag` (valor persistido permanece em minúsculas na API). */
    labelStatusEscala(status: string): string {
        const s = (status || '').toLowerCase();
        const map: Record<string, string> = {
            ativa: 'Ativa',
            rascunho: 'Rascunho',
            encerrada: 'Encerrada',
            concluida: 'Concluída'
        };
        return map[s] || status || '—';
    }

    podeExibirBotaoAtivar(row: EscalaListagem): boolean {
        const s = (row.status || '').toLowerCase();
        return s !== 'ativa' && s !== 'concluida';
    }

    podeExibirBotaoConcluir(row: EscalaListagem): boolean {
        return (row.status || '').toLowerCase() === 'ativa';
    }

    escalaConcluida(row: EscalaListagem): boolean {
        return (row.status || '').toLowerCase() === 'concluida';
    }

    ativarEscala(row: EscalaListagem): void {
        this.ativandoEscalaId = row.id;
        this.api.ativar(row.id).subscribe({
            next: (atualizada) => {
                this.ativandoEscalaId = null;
                const i = this.escalas.findIndex((e) => e.id === row.id);
                if (i >= 0) {
                    this.escalas[i] = { ...this.escalas[i], status: atualizada.status };
                }
                this.msg.add({
                    severity: 'success',
                    summary: 'Escala',
                    detail: 'Status atualizado para ativa.'
                });
            },
            error: (err) => {
                this.ativandoEscalaId = null;
                const det = err?.error?.message || 'Não foi possível ativar a escala.';
                this.msg.add({ severity: 'error', summary: 'Erro', detail: det });
            }
        });
    }

    confirmarConcluirEscala(row: EscalaListagem): void {
        this.confirm.confirm({
            message:
                `Concluir a escala "${row.nome}"? O status passará a Concluída e a ordem global dos veterinários será atualizada para o próximo ciclo começar pelo veterinário seguinte àquele que possui o último plantão (por data). Permutas pendentes nesta escala serão canceladas.`,
            header: 'Concluir escala',
            icon: 'pi pi-flag',
            acceptLabel: 'Concluir',
            rejectLabel: 'Cancelar',
            acceptButtonStyleClass: 'p-button-primary',
            rejectButtonStyleClass: 'p-button-text',
            accept: () => {
                this.concluindoEscalaId = row.id;
                this.api.concluir(row.id).subscribe({
                    next: (atualizada) => {
                        this.concluindoEscalaId = null;
                        const i = this.escalas.findIndex((e) => e.id === row.id);
                        if (i >= 0) {
                            this.escalas[i] = { ...this.escalas[i], status: atualizada.status };
                        }
                        this.msg.add({
                            severity: 'success',
                            summary: 'Escala concluída',
                            detail: 'Status atualizado para Concluída e a ordem global dos servidores foi ajustada.'
                        });
                    },
                    error: (err) => {
                        this.concluindoEscalaId = null;
                        const det = err?.error?.message || 'Não foi possível concluir a escala.';
                        this.msg.add({ severity: 'error', summary: 'Erro', detail: det });
                    }
                });
            }
        });
    }

    abrirEditarDatasExtras(row: EscalaListagem): void {
        this.carregandoDetalheEscalaId = row.id;
        this.api.obterPorId(row.id).subscribe({
            next: (det: EscalaDetalhe) => {
                this.carregandoDetalheEscalaId = null;
                this.periodoEditarMin = this.parseDateOnly(det.dataInicio);
                this.periodoEditarMax = this.parseDateOnly(det.dataFim);
                this.escalaEditarExtras = {
                    ...row,
                    dataInicio: det.dataInicio,
                    dataFim: det.dataFim
                };
                this.dataSelecionadaParaInclusao = null;
                this.plantaoSelecionadoParaRemocao = null;
                this.montarListasParaDialogoExtras(det);
                this.dialogEditarExtrasAberto = true;
            },
            error: () => {
                this.carregandoDetalheEscalaId = null;
                this.msg.add({
                    severity: 'error',
                    summary: 'Erro',
                    detail: 'Não foi possível carregar os plantões da escala.'
                });
            }
        });
    }

    /**
     * Datas “manuais” já na escala = plantões em dias que não são sábado/domingo.
     * Novas opções = dias do período sem plantão ainda (dropdown, uma por vez).
     */
    private montarListasParaDialogoExtras(det: EscalaDetalhe): void {
        const plantoes = det.plantoes || [];
        const existentes = new Set<string>();
        const feriados: FeriadoCadastradoItem[] = [];

        for (const p of plantoes) {
            const iso = this.plantaoDataReferenciaParaIso(p.dataReferencia);
            if (!iso) {
                continue;
            }
            existentes.add(iso);
            if (!this.isFimDeSemanaIso(iso)) {
                feriados.push({ plantaoId: p.id, iso });
            }
        }
        feriados.sort((a, b) => a.iso.localeCompare(b.iso));
        this.feriadosCadastrados = feriados;

        const min = this.periodoEditarMin;
        const max = this.periodoEditarMax;
        if (!min || !max) {
            this.opcoesNovasDatasEscala = [];
            return;
        }

        const opcoes: { iso: string; exibicao: string }[] = [];
        for (const d of this.listarDiasNoIntervalo(min, max)) {
            const iso = this.fmtData(d);
            if (!existentes.has(iso)) {
                opcoes.push({
                    iso,
                    exibicao: d.toLocaleDateString('pt-BR', {
                        weekday: 'long',
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                    })
                });
            }
        }
        this.opcoesNovasDatasEscala = opcoes;
        if (
            this.dataSelecionadaParaInclusao != null &&
            !opcoes.some((o) => o.iso === this.dataSelecionadaParaInclusao)
        ) {
            this.dataSelecionadaParaInclusao = null;
        }
        if (
            this.plantaoSelecionadoParaRemocao != null &&
            !feriados.some((f) => f.plantaoId === this.plantaoSelecionadoParaRemocao)
        ) {
            this.plantaoSelecionadoParaRemocao = null;
        }
    }

    opcoesDropdownFeriadosRemover(): { label: string; value: number }[] {
        return this.feriadosCadastrados.map((f) => ({
            label: this.labelFeriadoParaDropdown(f.iso),
            value: f.plantaoId
        }));
    }

    private labelFeriadoParaDropdown(iso: string): string {
        const d = this.parseDateOnly(iso);
        if (!d) {
            return iso;
        }
        const s = d.toLocaleDateString('pt-BR', {
            weekday: 'long',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
        return this.capitalizePrimeiraLetra(s);
    }

    opcoesDropdownNovasDatas(): { label: string; value: string }[] {
        return this.opcoesNovasDatasEscala.map((o) => ({
            label: this.capitalizePrimeiraLetra(o.exibicao),
            value: o.iso
        }));
    }

    private capitalizePrimeiraLetra(s: string): string {
        if (!s) return s;
        return s.charAt(0).toUpperCase() + s.slice(1);
    }

    private plantaoDataReferenciaParaIso(raw: string | Date | undefined | null): string | null {
        const d = this.parseDateOnly(raw);
        return d ? this.fmtData(d) : null;
    }

    /** Sábado ou domingo (0–6). */
    private isFimDeSemanaIso(iso: string): boolean {
        const d = this.parseDateOnly(iso);
        if (!d) {
            return false;
        }
        const dow = d.getDay();
        return dow === 0 || dow === 6;
    }

    private listarDiasNoIntervalo(inicio: Date, fim: Date): Date[] {
        const out: Date[] = [];
        const cur = new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate(), 12, 0, 0, 0);
        const lim = new Date(fim.getFullYear(), fim.getMonth(), fim.getDate(), 12, 0, 0, 0);
        while (cur.getTime() <= lim.getTime()) {
            out.push(new Date(cur));
            cur.setDate(cur.getDate() + 1);
        }
        return out;
    }

    fecharDialogEditarExtras(): void {
        this.dialogEditarExtrasAberto = false;
        this.escalaEditarExtras = null;
        this.feriadosCadastrados = [];
        this.plantaoSelecionadoParaRemocao = null;
        this.removerFeriadoCarregandoId = null;
        this.opcoesNovasDatasEscala = [];
        this.dataSelecionadaParaInclusao = null;
        this.periodoEditarMin = null;
        this.periodoEditarMax = null;
    }

    confirmarRemoverFeriadoSelecionado(): void {
        if (this.bloqueadoDialogExtras) {
            return;
        }
        const pid = this.plantaoSelecionadoParaRemocao;
        if (pid == null || !this.escalaEditarExtras) {
            return;
        }
        const item = this.feriadosCadastrados.find((f) => f.plantaoId === pid);
        if (!item) {
            return;
        }
        this.confirm.confirm({
            message: `Remover o plantão de ${this.rotuloDataIsoCurto(item.iso)}? O rodízio será recalculado a partir dessa data. Permutas pendentes ligadas a essa data serão excluídas.`,
            header: 'Remover data',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Remover',
            rejectLabel: 'Cancelar',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => this.executarRemoverFeriado(pid, item.iso)
        });
    }

    private executarRemoverFeriado(plantaoId: number, isoRef: string): void {
        if (!this.escalaEditarExtras) {
            return;
        }
        this.removerFeriadoCarregandoId = plantaoId;
        this.api.removerPlantoesFeriadosFacultativos(this.escalaEditarExtras.id, [plantaoId]).subscribe({
            next: (res: RemoverPlantoesFeriadosResposta) => {
                this.removerFeriadoCarregandoId = null;
                this.plantaoSelecionadoParaRemocao = null;
                this.api.obterPorId(this.escalaEditarExtras!.id).subscribe({
                    next: (detAtual: EscalaDetalhe) => {
                        this.montarListasParaDialogoExtras(detAtual);
                        const atual = res.atualizados ?? 0;
                        const rotTxt =
                            atual === 0
                                ? ' O rodízio foi atualizado a partir desta data.'
                                : atual === 1
                                  ? ' 1 plantão existente foi ajustado no rodízio.'
                                  : ` ${atual} plantões existentes foram ajustados no rodízio.`;
                        const pc = res.permutasCanceladas ?? 0;
                        const permTxt =
                            pc === 0
                                ? ''
                                : pc === 1
                                  ? ' 1 permuta pendente foi cancelada.'
                                  : ` ${pc} permutas pendentes foram canceladas.`;
                        this.msg.add({
                            severity: 'success',
                            summary: 'Data removida',
                            detail: `A data ${this.rotuloDataIsoCurto(isoRef)} foi excluída da escala.${rotTxt}${permTxt}`
                        });
                    },
                    error: () => {
                        this.msg.add({
                            severity: 'warn',
                            summary: 'Removido',
                            detail: 'A data foi removida, mas não foi possível recarregar a lista no diálogo.'
                        });
                    }
                });
            },
            error: (err) => {
                this.removerFeriadoCarregandoId = null;
                const det = err?.error?.message || 'Não foi possível remover.';
                this.msg.add({ severity: 'error', summary: 'Erro', detail: det });
            }
        });
    }

    rotuloDataIsoCurto(iso: string): string {
        const d = this.parseDateOnly(iso);
        if (!d) {
            return iso;
        }
        return d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' });
    }

    /**
     * Data local meio-dia (evita deslocamento UTC em comparações do PrimeNG).
     * Aceita string só data, ISO com hora ou objeto Date.
     */
    private parseDateOnly(raw: unknown): Date | null {
        if (raw == null || raw === '') {
            return null;
        }
        if (raw instanceof Date) {
            if (isNaN(raw.getTime())) {
                return null;
            }
            return new Date(raw.getFullYear(), raw.getMonth(), raw.getDate(), 12, 0, 0, 0);
        }
        const str = String(raw);
        const m = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
        if (!m) {
            return null;
        }
        const y = parseInt(m[1], 10);
        const mo = parseInt(m[2], 10) - 1;
        const d = parseInt(m[3], 10);
        return new Date(y, mo, d, 12, 0, 0, 0);
    }

    private fmtData(d: Date): string {
        const y = d.getFullYear();
        const m = `${d.getMonth() + 1}`.padStart(2, '0');
        const day = `${d.getDate()}`.padStart(2, '0');
        return `${y}-${m}-${day}`;
    }

    adicionarDataExtraSelecionada(): void {
        if (!this.escalaEditarExtras || !this.dataSelecionadaParaInclusao || this.bloqueadoDialogExtras) {
            return;
        }
        const iso = this.dataSelecionadaParaInclusao;

        this.salvandoDatasExtras = true;
        this.api.adicionarDatasPlantaoExtras(this.escalaEditarExtras.id, [iso]).subscribe({
            next: (res) => {
                this.salvandoDatasExtras = false;
                this.dataSelecionadaParaInclusao = null;
                this.api.obterPorId(this.escalaEditarExtras!.id).subscribe({
                    next: (detAtual: EscalaDetalhe) => {
                        this.montarListasParaDialogoExtras(detAtual);
                        const atual = res.atualizados ?? 0;
                        const rotTxt =
                            atual === 0
                                ? ' O rodízio foi atualizado a partir desta data.'
                                : atual === 1
                                  ? ' O rodízio foi recalculado e 1 plantão existente mudou de veterinário.'
                                  : ` O rodízio foi recalculado e ${atual} plantões existentes foram atualizados.`;
                        const pc = res.permutasCanceladas ?? 0;
                        const permTxt =
                            pc === 0
                                ? ''
                                : pc === 1
                                  ? ' 1 permuta pendente foi cancelada.'
                                  : ` ${pc} permutas pendentes foram canceladas.`;
                        this.msg.add({
                            severity: 'success',
                            summary: 'Data adicionada',
                            detail: `A data ${this.rotuloDataIsoCurto(iso)} foi incluída na escala.${rotTxt}${permTxt}`
                        });
                    },
                    error: () => {
                        this.msg.add({
                            severity: 'warn',
                            summary: 'Data adicionada',
                            detail: 'A data foi incluída, mas não foi possível atualizar a lista no diálogo.'
                        });
                    }
                });
            },
            error: (err) => {
                this.salvandoDatasExtras = false;
                const det = err?.error?.message || 'Não foi possível adicionar a data.';
                this.msg.add({ severity: 'error', summary: 'Erro', detail: det });
            }
        });
    }

    confirmarExcluir(row: EscalaListagem): void {
        this.confirm.confirm({
            message: `Excluir a escala "${row.nome}"? Plantões e vínculos serão removidos. Esta ação não pode ser desfeita.`,
            header: 'Confirmar exclusão',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Excluir',
            rejectLabel: 'Cancelar',
            acceptButtonStyleClass: 'p-button-danger',
            rejectButtonStyleClass: 'p-button-text',
            accept: () => {
                this.excluindoId = row.id;
                this.api.excluir(row.id).subscribe({
                    next: () => {
                        this.excluindoId = null;
                        this.escalas = this.escalas.filter((e) => e.id !== row.id);
                        this.msg.add({ severity: 'success', summary: 'Excluída', detail: 'Escala removida com sucesso.' });
                    },
                    error: (err) => {
                        this.excluindoId = null;
                        const det = err?.error?.message || 'Não foi possível excluir a escala.';
                        this.msg.add({ severity: 'error', summary: 'Erro', detail: det });
                    }
                });
            }
        });
    }
}
