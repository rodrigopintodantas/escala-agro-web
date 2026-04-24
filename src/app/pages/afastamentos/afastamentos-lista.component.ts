import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { RippleModule } from 'primeng/ripple';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import {
    AfastamentoApiService,
    AfastamentoListagem,
    RecalculoAfastamentoResumo,
    TipoAfastamento
} from '../../service/afastamento-api.service';
import { EscalaApiService, VeterinarioOption } from '../../service/escala-api.service';
import { AutenticacaoService } from '../../service/autenticacao.service';
import { forkJoin } from 'rxjs';

export type AfastamentosListaModo = 'admin' | 'veterinario';

@Component({
    selector: 'app-afastamentos-lista',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        TableModule,
        ToastModule,
        ButtonModule,
        ConfirmDialogModule,
        DialogModule,
        CalendarModule,
        DropdownModule,
        RippleModule
    ],
    providers: [ConfirmationService],
    templateUrl: './afastamentos-lista.component.html'
})
export class AfastamentosListaComponent implements OnInit {
    private api = inject(AfastamentoApiService);
    private escalaApi = inject(EscalaApiService);
    private msg = inject(MessageService);
    private confirm = inject(ConfirmationService);
    private route = inject(ActivatedRoute);
    private auth = inject(AutenticacaoService);

    afastamentos: AfastamentoListagem[] = [];
    tipos: TipoAfastamento[] = [];
    servidores: Array<VeterinarioOption & { papel: 'Veterinário' | 'Técnico' }> = [];
    carregando = true;
    modo: AfastamentosListaModo = 'veterinario';

    dialogAberto = false;
    salvando = false;
    tipoIdSelecionado: number | null = null;
    usuarioIdSelecionado: number | null = null;
    dataInicio: Date | null = null;
    dataFim: Date | null = null;

    /** Linha em processo de exclusão (desfazer). */
    desfazendoId: number | null = null;

    ngOnInit(): void {
        const m = this.route.snapshot.data['afastamentosModo'];
        if (m === 'admin') {
            this.modo = 'admin';
            this.carregarServidores();
        }
        this.carregarTipos();
        this.carregarAfastamentos();
    }

    get subtitulo(): string {
        return this.modo === 'admin'
            ? 'Todos os afastamentos cadastrados no sistema.'
            : 'Seus afastamentos registrados.';
    }

    private carregarTipos(): void {
        this.api.listarTipos().subscribe({
            error: () => {
                this.msg.add({
                    severity: 'warn',
                    summary: 'Aviso',
                    detail: 'Não foi possível carregar os tipos de afastamento.'
                });
            },
            next: (t) => {
                this.tipos = t;
            }
        });
    }

    private carregarServidores(): void {
        forkJoin({
            veterinarios: this.escalaApi.listarVeterinarios(),
            tecnicos: this.escalaApi.listarTecnicos()
        }).subscribe({
            error: () => {
                this.msg.add({
                    severity: 'warn',
                    summary: 'Aviso',
                    detail: 'Não foi possível carregar a lista de servidores.'
                });
            },
            next: ({ veterinarios, tecnicos }) => {
                const base = [
                    ...veterinarios.map((v) => ({ ...v, papel: 'Veterinário' as const })),
                    ...tecnicos.map((t) => ({ ...t, papel: 'Técnico' as const }))
                ];
                this.servidores = [...base].sort((a, b) => {
                    const nomeCmp = String(a.nome || '').localeCompare(String(b.nome || ''), 'pt-BR');
                    if (nomeCmp !== 0) return nomeCmp;
                    return a.papel.localeCompare(b.papel, 'pt-BR');
                });
            }
        });
    }

    private carregarAfastamentos(): void {
        this.carregando = true;
        this.api.listar().subscribe({
            next: (data) => {
                this.afastamentos = data;
                this.carregando = false;
            },
            error: () => {
                this.carregando = false;
                this.msg.add({
                    severity: 'error',
                    summary: 'Erro',
                    detail: 'Não foi possível carregar os afastamentos.'
                });
            }
        });
    }

    abrirCriar(): void {
        this.tipoIdSelecionado = null;
        this.usuarioIdSelecionado = null;
        this.dataInicio = null;
        this.dataFim = null;
        if (this.modo === 'veterinario') {
            const id = this.auth.getUsuario().id;
            this.usuarioIdSelecionado = id != null ? Number(id) : null;
        }
        this.dialogAberto = true;
    }

    fecharDialog(): void {
        this.dialogAberto = false;
    }

    private fmt(d: Date): string {
        const y = d.getFullYear();
        const m = `${d.getMonth() + 1}`.padStart(2, '0');
        const day = `${d.getDate()}`.padStart(2, '0');
        return `${y}-${m}-${day}`;
    }

    private normalizarTexto(v?: string | null): string {
        return (v || '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .trim()
            .toLowerCase();
    }

    tipoSelecionadoEhAbono(): boolean {
        if (this.tipoIdSelecionado == null) return false;
        const tipo = this.tipos.find((t) => Number(t.id) === Number(this.tipoIdSelecionado));
        return this.normalizarTexto(tipo?.tipo) === 'abono';
    }

    aoAlterarTipoAfastamento(): void {
        if (!this.tipoSelecionadoEhAbono()) return;
        if (this.dataInicio) {
            this.dataFim = this.dataInicio;
        } else {
            this.dataFim = null;
        }
    }

    aoAlterarDataInicio(): void {
        if (this.tipoSelecionadoEhAbono()) {
            this.dataFim = this.dataInicio;
        }
    }

    salvar(): void {
        if (this.tipoIdSelecionado == null) {
            this.msg.add({ severity: 'warn', summary: 'Validação', detail: 'Selecione o tipo de afastamento.' });
            return;
        }
        const ehAbono = this.tipoSelecionadoEhAbono();
        if (!this.dataInicio || (!ehAbono && !this.dataFim)) {
            this.msg.add({
                severity: 'warn',
                summary: 'Validação',
                detail: ehAbono ? 'Informe a data do abono.' : 'Informe a data inicial e a data final.'
            });
            return;
        }
        const dataFimEfetiva = ehAbono ? this.dataInicio : this.dataFim;
        if (!dataFimEfetiva) {
            this.msg.add({ severity: 'warn', summary: 'Validação', detail: 'Informe a data final.' });
            return;
        }
        if (this.fmt(dataFimEfetiva) < this.fmt(this.dataInicio)) {
            this.msg.add({
                severity: 'warn',
                summary: 'Validação',
                detail: 'A data final deve ser igual ou posterior à data inicial.'
            });
            return;
        }
        if (this.modo === 'admin' && (this.usuarioIdSelecionado == null || !Number.isFinite(this.usuarioIdSelecionado))) {
            this.msg.add({ severity: 'warn', summary: 'Validação', detail: 'Selecione o servidor.' });
            return;
        }

        const payload = {
            tipoId: this.tipoIdSelecionado,
            dataInicio: this.fmt(this.dataInicio),
            dataFim: this.fmt(dataFimEfetiva),
            ...(this.modo === 'admin' && this.usuarioIdSelecionado != null
                ? { usuarioId: this.usuarioIdSelecionado }
                : {})
        };

        this.salvando = true;
        this.api.criar(payload).subscribe({
            next: (criado) => {
                this.salvando = false;
                this.afastamentos = [criado, ...this.afastamentos];
                this.fecharDialog();
                this.msg.add({ severity: 'success', summary: 'Afastamento', detail: 'Registro criado com sucesso.' });
                if (criado?.recalc && criado.recalc.escalasAfetadas > 0) {
                    const og =
                        criado.recalc.ordemGlobalAlterada === true
                            ? ' A ordem geral (Ordem dos Servidores) foi atualizada.'
                            : '';
                    this.msg.add({
                        severity: 'info',
                        summary: 'Escalas recalculadas',
                        detail: `${criado.recalc.escalasAfetadas} escala(s), ${criado.recalc.plantoesAtualizados} plantão(ões) ajustado(s), ${criado.recalc.ordensAlteradas} ordem(ns) de escala alterada(s).${og}`
                    });
                }
            },
            error: (err) => {
                this.salvando = false;
                const det = err?.error?.message || 'Não foi possível salvar.';
                this.msg.add({ severity: 'error', summary: 'Erro', detail: det });
            }
        });
    }

    labelTipo(row: AfastamentoListagem): string {
        return row.tipo?.tipo?.trim() || '—';
    }

    formatoData(iso: string): string {
        if (!iso) return '—';
        const d = new Date(iso + 'T12:00:00');
        return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }

    opcoesTipoDropdown(): { label: string; value: number }[] {
        return this.tipos.map((t) => ({ label: t.tipo, value: t.id }));
    }

    opcoesUsuarioDropdown(): { label: string; value: number }[] {
        return this.servidores.map((s) => ({ label: `${s.nome} - ${s.papel}`, value: s.id }));
    }

    papelServidor(id: number | null | undefined): string | null {
        if (id == null) return null;
        const row = this.servidores.find((s) => Number(s.id) === Number(id));
        return row?.papel || null;
    }

    confirmarDesfazer(row: AfastamentoListagem): void {
        this.confirm.confirm({
            message:
                'Remover este afastamento e recalcular as escalas no período? Permutas pendentes nas datas afetadas podem ser canceladas.',
            header: 'Desfazer afastamento',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Desfazer',
            rejectLabel: 'Cancelar',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => this.executarDesfazer(row.id)
        });
    }

    private executarDesfazer(id: number): void {
        this.desfazendoId = id;
        this.api.desfazer(id).subscribe({
            next: (res) => {
                this.desfazendoId = null;
                this.afastamentos = this.afastamentos.filter((a) => a.id !== id);
                this.msg.add({ severity: 'success', summary: 'Afastamento', detail: 'Registro removido.' });
                const recalc: RecalculoAfastamentoResumo | undefined = res?.recalc;
                if (recalc && recalc.escalasAfetadas > 0) {
                    const og =
                        recalc.ordemGlobalAlterada === true
                            ? ' A ordem geral (Ordem dos Servidores) foi atualizada.'
                            : '';
                    this.msg.add({
                        severity: 'info',
                        summary: 'Escalas recalculadas',
                        detail: `${recalc.escalasAfetadas} escala(s), ${recalc.plantoesAtualizados} plantão(ões) ajustado(s), ${recalc.ordensAlteradas} ordem(ns) de escala alterada(s).${og}`
                    });
                }
            },
            error: (err) => {
                this.desfazendoId = null;
                const det = err?.error?.message || 'Não foi possível desfazer.';
                this.msg.add({ severity: 'error', summary: 'Erro', detail: det });
            }
        });
    }
}
