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
import { EscalaApiService, PermutaListagem } from '../../service/escala-api.service';
import { AutenticacaoService } from '../../service/autenticacao.service';

export type PermutasListaModo = 'admin' | 'veterinario';

@Component({
    selector: 'app-permutas-lista',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        TableModule,
        TagModule,
        ToastModule,
        ConfirmDialogModule,
        ButtonModule,
        TooltipModule,
        RippleModule
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
    /** Controle de loading por permuta em ações de cancelar/aceitar/recusar */
    permutaAcaoLoadingId: number | null = null;

    ngOnInit(): void {
        const m = this.route.snapshot.data['permutasModo'];
        if (m === 'veterinario') {
            this.modo = 'veterinario';
        }
        this.carregarPermutas();
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
            return 'Todas as solicitações do sistema.';
        }
        return 'Solicitações em que você é o solicitante ou o destinatário.';
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

    /** Colunas de plantão: no perfil veterinário mostra só a data (sem nome do escalado). */
    textoColunaPlantao(p: PermutaListagem['plantaoOrigem']): string {
        if (this.modo === 'veterinario') {
            return this.apenasDataPlantao(p);
        }
        return this.rotuloPlantaoCompleto(p);
    }

    private apenasDataPlantao(p: PermutaListagem['plantaoOrigem']): string {
        if (!p?.dataReferencia) {
            return '—';
        }
        const d = new Date(p.dataReferencia + 'T12:00:00');
        return d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' });
    }

    private rotuloPlantaoCompleto(p: PermutaListagem['plantaoOrigem']): string {
        if (!p?.dataReferencia) {
            return '—';
        }
        const d = new Date(p.dataReferencia + 'T12:00:00');
        const dataTxt = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
        const nome = p.usuario?.nome?.trim() || '—';
        const login = p.usuario?.login ? ` (${p.usuario.login})` : '';
        return `${dataTxt} — ${nome}${login}`;
    }

    severityPermuta(status: string): 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast' | undefined {
        const s = (status || '').toLowerCase();
        if (s === 'pendente') return 'warn';
        if (s === 'aceita' || s === 'aprovada') return 'success';
        if (s === 'recusada' || s === 'cancelada') return 'danger';
        return 'info';
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
            message: 'Aceitar esta permuta? Após confirmar, os plantões serão trocados definitivamente.',
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
}
