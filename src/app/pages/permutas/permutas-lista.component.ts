import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { RippleModule } from 'primeng/ripple';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { FormsModule } from '@angular/forms';
import {
    BasePlantoesPermutaResposta,
    BaseServidorPermuta,
    EscalaApiService,
    EscalaListagem,
    PermutaListagem
} from '../../service/escala-api.service';
import { AutenticacaoService } from '../../service/autenticacao.service';

export type PermutasListaModo = 'admin' | 'veterinario';

interface OpcaoServidorPermuta {
    label: string;
    value: number;
}

interface OpcaoOrdinalPermuta {
    label: string;
    value: number;
}

@Component({
    selector: 'app-permutas-lista',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        RouterModule,
        TableModule,
        TagModule,
        ToastModule,
        ConfirmDialogModule,
        ButtonModule,
        TooltipModule,
        RippleModule,
        DialogModule,
        DropdownModule
    ],
    providers: [ConfirmationService],
    templateUrl: './permutas-lista.component.html'
})
export class PermutasListaComponent implements OnInit {
    private api = inject(EscalaApiService);
    private msg = inject(MessageService);
    private route = inject(ActivatedRoute);
    private confirm = inject(ConfirmationService);
    private auth = inject(AutenticacaoService);

    permutas: PermutaListagem[] = [];
    carregando = true;
    modo: PermutasListaModo = 'admin';
    /** Controle de loading por permuta em ações de cancelar/aceitar/recusar/excluir */
    permutaAcaoLoadingId: number | null = null;
    excluindoPermutaId: number | null = null;

    dialogCriarAberto = false;
    salvandoCriar = false;
    carregandoDialog = false;
    escopoCriar: 'veterinario' | 'tecnico' = 'veterinario';
    escalas: EscalaListagem[] = [];
    escalaIdSelecionada: number | null = null;
    /** Calendário base (por ordinal) da escala selecionada. */
    basePlantoes: BasePlantoesPermutaResposta | null = null;
    servidorOrigemId: number | null = null;
    servidorDestinoId: number | null = null;
    ordinalOrigem: number | null = null;
    ordinalDestino: number | null = null;

    ngOnInit(): void {
        const m = this.route.snapshot.data['permutasModo'];
        if (m === 'veterinario') {
            this.modo = 'veterinario';
        }
        this.carregarPermutas();
        if (this.modo === 'admin') {
            this.carregarDadosCriacao();
        }
    }

    get exibirCriarPermuta(): boolean {
        return this.modo === 'admin';
    }

    private carregarDadosCriacao(): void {
        this.api.listar().subscribe({
            next: (escalas) => {
                this.escalas = (escalas || []).filter((e) => {
                    const st = String(e.status || '').toLowerCase();
                    return st === 'ativa' || st === 'rascunho';
                });
            },
            error: () => {
                this.msg.add({
                    severity: 'warn',
                    summary: 'Aviso',
                    detail: 'Não foi possível carregar as escalas para criar permuta.'
                });
            }
        });
    }

    private carregarPermutas(): void {
        this.carregando = true;
        this.api.listarPermutas().subscribe({
            next: (data) => {
                this.permutas = data;
                this.carregando = false;
            },
            error: () => {
                this.carregando = false;
                this.msg.add({ severity: 'error', summary: 'Erro', detail: 'Não foi possível carregar as permutas.' });
            }
        });
    }

    get prefixoArea(): string {
        return this.modo === 'veterinario' ? '/vt' : '/admin';
    }

    get subtitulo(): string {
        if (this.modo === 'admin') {
            return 'Todas as permutas do sistema.';
        }
        return 'Permutas em que você é o solicitante ou o destinatário.';
    }

    private uidLogado(): number | null {
        const id = this.auth.getUsuario().id;
        return id == null ? null : Number(id);
    }

    ehSolicitante(row: PermutaListagem): boolean {
        const u = this.uidLogado();
        return u != null && Number(row.solicitanteUsuarioId) === u;
    }

    ehDestinatario(row: PermutaListagem): boolean {
        const u = this.uidLogado();
        return u != null && Number(row.destinatarioUsuarioId) === u;
    }

    statusPendente(row: PermutaListagem): boolean {
        return (row.status || '').toLowerCase() === 'pendente';
    }

    /** Texto do lado da permuta (origem/destino): Nº do plantão + data atual (e nome no modo admin). */
    textoLadoPermuta(row: PermutaListagem, lado: 'origem' | 'destino'): string {
        const ordinal = lado === 'origem' ? row.ordinalSolicitante : row.ordinalDestinatario;
        const dataIso =
            (lado === 'origem' ? row.dataOrigemAtual : row.dataDestinoAtual) ||
            (lado === 'origem' ? row.dataOrigemSnapshot : row.dataDestinoSnapshot) ||
            (lado === 'origem' ? row.plantaoOrigem?.dataReferencia : row.plantaoDestino?.dataReferencia);
        const partes: string[] = [];
        if (ordinal) {
            partes.push(`${ordinal}º plantão`);
        }
        if (dataIso) {
            partes.push(this.formatarData(dataIso));
        }
        if (this.modo === 'admin') {
            const nome = lado === 'origem' ? row.solicitante?.nome : row.destinatario?.nome;
            if (nome) {
                partes.push(nome.trim());
            }
        }
        return partes.length > 0 ? partes.join(' — ') : '—';
    }

    private formatarData(dataIso: string): string {
        const d = new Date(dataIso + 'T12:00:00');
        return d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' });
    }

    categoriaLabel(row: PermutaListagem): string {
        return String(row.categoria || '').toLowerCase() === 'tecnico' ? 'Técnico' : 'Veterinário';
    }

    severityPermuta(status: string): 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast' | undefined {
        const s = (status || '').toLowerCase();
        if (s === 'pendente') return 'warn';
        if (s === 'ativa' || s === 'aceita' || s === 'aprovada') return 'success';
        if (s === 'recusada' || s === 'cancelada') return 'danger';
        if (s === 'invalidada') return 'contrast';
        return 'info';
    }

    statusLabel(status: string): string {
        const s = (status || '').toLowerCase();
        const mapa: Record<string, string> = {
            pendente: 'Pendente',
            ativa: 'Ativa',
            aceita: 'Ativa',
            recusada: 'Recusada',
            cancelada: 'Cancelada',
            invalidada: 'Invalidada'
        };
        return mapa[s] || status;
    }

    confirmarCancelar(row: PermutaListagem): void {
        this.confirm.confirm({
            message: 'Cancelar esta solicitação de permuta?',
            header: 'Confirmar',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Cancelar pedido',
            rejectLabel: 'Voltar',
            accept: () => this.executarAcao(row.id, 'cancelar')
        });
    }

    confirmarAceitar(row: PermutaListagem): void {
        this.confirm.confirm({
            message: 'Aceitar esta permuta? Ela passará a valer e a troca seguirá os servidores mesmo se as datas mudarem.',
            header: 'Aceitar permuta',
            icon: 'pi pi-check-circle',
            acceptLabel: 'Aceitar',
            rejectLabel: 'Voltar',
            accept: () => this.executarAcao(row.id, 'aceitar')
        });
    }

    confirmarRecusar(row: PermutaListagem): void {
        this.confirm.confirm({
            message: 'Recusar esta solicitação de permuta?',
            header: 'Recusar permuta',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Recusar',
            rejectLabel: 'Voltar',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => this.executarAcao(row.id, 'recusar')
        });
    }

    confirmarExcluir(row: PermutaListagem): void {
        const st = (row.status || '').toLowerCase();
        const msgAtiva = 'Excluir esta permuta ativa? A escala será recalculada e a troca será desfeita.';
        const msgOutros = 'Excluir este registro de permuta?';
        this.confirm.confirm({
            message: st === 'ativa' || st === 'aceita' ? msgAtiva : msgOutros,
            header: 'Excluir permuta',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Excluir',
            rejectLabel: 'Voltar',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => this.executarExcluir(row.id)
        });
    }

    private executarExcluir(permutaId: number): void {
        this.excluindoPermutaId = permutaId;
        this.api.excluirPermuta(permutaId).subscribe({
            next: () => {
                this.excluindoPermutaId = null;
                this.permutas = this.permutas.filter((p) => p.id !== permutaId);
                this.msg.add({ severity: 'success', summary: 'Permuta', detail: 'Permuta excluída com sucesso.' });
            },
            error: (err) => {
                this.excluindoPermutaId = null;
                const det = err?.error?.message || 'Não foi possível excluir a permuta.';
                this.msg.add({ severity: 'error', summary: 'Erro', detail: det });
            }
        });
    }

    private executarAcao(permutaId: number, tipo: 'cancelar' | 'aceitar' | 'recusar'): void {
        this.permutaAcaoLoadingId = permutaId;
        const req =
            tipo === 'cancelar'
                ? this.api.cancelarPermuta(permutaId)
                : tipo === 'aceitar'
                  ? this.api.aceitarPermuta(permutaId)
                  : this.api.recusarPermuta(permutaId);
        req.subscribe({
            next: (atual) => {
                this.permutaAcaoLoadingId = null;
                const st = (atual as { status?: string })?.status;
                this.permutas = this.permutas.map((p) =>
                    p.id === permutaId ? { ...p, status: st || p.status } : p
                );
                this.msg.add({ severity: 'success', summary: 'Permuta', detail: 'Atualizado com sucesso.' });
            },
            error: (err) => {
                this.permutaAcaoLoadingId = null;
                const det = err?.error?.message || 'Não foi possível concluir a ação.';
                this.msg.add({ severity: 'error', summary: 'Erro', detail: det });
            }
        });
    }

    abrirCriarPermuta(): void {
        this.escopoCriar = 'veterinario';
        this.escalaIdSelecionada = null;
        this.basePlantoes = null;
        this.servidorOrigemId = null;
        this.servidorDestinoId = null;
        this.ordinalOrigem = null;
        this.ordinalDestino = null;
        this.dialogCriarAberto = true;
    }

    fecharDialogCriar(): void {
        this.dialogCriarAberto = false;
    }

    trocarEscopoCriar(escopo: 'veterinario' | 'tecnico'): void {
        if (this.escopoCriar === escopo || this.salvandoCriar) return;
        this.escopoCriar = escopo;
        this.limparSelecaoServidores();
    }

    private limparSelecaoServidores(): void {
        this.servidorOrigemId = null;
        this.servidorDestinoId = null;
        this.ordinalOrigem = null;
        this.ordinalDestino = null;
    }

    onEscalaChange(): void {
        this.basePlantoes = null;
        this.limparSelecaoServidores();
        const id = this.escalaIdSelecionada;
        if (id == null) return;
        this.carregandoDialog = true;
        this.api.listarBasePlantoesPermuta(id).subscribe({
            next: (base) => {
                this.basePlantoes = base;
                this.carregandoDialog = false;
            },
            error: (err) => {
                this.carregandoDialog = false;
                const det = err?.error?.message || 'Não foi possível carregar os plantões da escala.';
                this.msg.add({ severity: 'error', summary: 'Erro', detail: det });
            }
        });
    }

    onServidorOrigemChange(): void {
        this.ordinalOrigem = null;
    }

    onServidorDestinoChange(): void {
        this.ordinalDestino = null;
    }

    private get servidoresEscopo(): BaseServidorPermuta[] {
        if (!this.basePlantoes) return [];
        return this.escopoCriar === 'tecnico' ? this.basePlantoes.tecnicos : this.basePlantoes.veterinarios;
    }

    get opcoesServidorOrigem(): OpcaoServidorPermuta[] {
        return this.servidoresEscopo.map((s) => ({
            value: Number(s.usuarioId),
            label: s.nome || s.login || `#${s.usuarioId}`
        }));
    }

    get opcoesServidorDestino(): OpcaoServidorPermuta[] {
        const uid = this.servidorOrigemId;
        return this.opcoesServidorOrigem.filter((s) => uid == null || Number(s.value) !== Number(uid));
    }

    private plantoesDoServidor(usuarioId: number | null): OpcaoOrdinalPermuta[] {
        if (usuarioId == null) return [];
        const servidor = this.servidoresEscopo.find((s) => Number(s.usuarioId) === Number(usuarioId));
        if (!servidor) return [];
        return servidor.plantoes.map((p) => ({
            value: p.ordinal,
            label: `${p.ordinal}º — ${this.formatarData(p.dataReferencia)}`
        }));
    }

    get opcoesPlantaoOrigem(): OpcaoOrdinalPermuta[] {
        return this.plantoesDoServidor(this.servidorOrigemId);
    }

    get opcoesPlantaoDestino(): OpcaoOrdinalPermuta[] {
        return this.plantoesDoServidor(this.servidorDestinoId);
    }

    get formularioCriarValido(): boolean {
        return (
            this.escalaIdSelecionada != null &&
            this.servidorOrigemId != null &&
            this.servidorDestinoId != null &&
            this.ordinalOrigem != null &&
            this.ordinalDestino != null &&
            Number(this.servidorOrigemId) !== Number(this.servidorDestinoId)
        );
    }

    salvarCriarPermuta(): void {
        if (!this.formularioCriarValido || this.escalaIdSelecionada == null) {
            this.msg.add({
                severity: 'warn',
                summary: 'Permuta',
                detail: 'Preencha escala, os dois servidores e o número do plantão de cada um.'
            });
            return;
        }
        this.salvandoCriar = true;
        this.api
            .criarPermutaAdmin({
                escalaId: this.escalaIdSelecionada,
                categoria: this.escopoCriar,
                solicitanteUsuarioId: Number(this.servidorOrigemId),
                ordinalSolicitante: Number(this.ordinalOrigem),
                destinatarioUsuarioId: Number(this.servidorDestinoId),
                ordinalDestinatario: Number(this.ordinalDestino)
            })
            .subscribe({
                next: () => {
                    this.salvandoCriar = false;
                    this.fecharDialogCriar();
                    this.msg.add({
                        severity: 'success',
                        summary: 'Permuta',
                        detail: 'Permuta registrada e aplicada na escala.'
                    });
                    this.carregarPermutas();
                },
                error: (err) => {
                    this.salvandoCriar = false;
                    const det = err?.error?.message || 'Não foi possível cadastrar a permuta.';
                    this.msg.add({ severity: 'error', summary: 'Erro', detail: det });
                }
            });
    }
}
