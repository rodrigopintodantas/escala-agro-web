import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { RippleModule } from 'primeng/ripple';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import {
    EscalaApiService,
    EscalaDetalhe,
    PlantaoDetalhe,
    PrevisaoPlantaoItem
} from '../../../service/escala-api.service';
import { AutenticacaoService } from '../../../service/autenticacao.service';

/** Um dia de plantão na UI: 1 vaga de veterinário + até 2 de técnico (escala unificada ou legado). */
interface PlantaoDiaAgrupado {
    dataReferencia: string;
    plantaoVet: PlantaoDetalhe | null;
    plantoesTec: PlantaoDetalhe[];
}

interface BlocoMes {
    rotulo: string;
    chave: string;
    itens: PlantaoDiaAgrupado[];
}

interface BlocoMesPrevisao {
    rotulo: string;
    chave: string;
    itens: PrevisaoPlantaoItem[];
}

interface OpcaoPlantaoPermuta {
    label: string;
    value: number;
}

@Component({
    selector: 'app-ver-escala',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        RouterModule,
        ButtonModule,
        DialogModule,
        DropdownModule,
        TagModule,
        ToastModule,
        TooltipModule,
        RippleModule
    ],
    templateUrl: './ver-escala.component.html',
    styleUrl: './ver-escala.component.scss'
})
export class VerEscalaComponent implements OnInit {
    private route = inject(ActivatedRoute);
    private api = inject(EscalaApiService);
    private msg = inject(MessageService);
    private auth = inject(AutenticacaoService);

    escala: EscalaDetalhe | null = null;
    plantoes: PlantaoDetalhe[] = [];
    plantoesPorMes: BlocoMes[] = [];
    carregando = true;
    /** Simulação dos próximos plantões após o período da escala. */
    previsaoProximosPlantoes: PrevisaoPlantaoItem[] = [];
    /** Mesmo agrupamento mensal do calendário real, para reutilizar o layout. */
    previsaoPorMes: BlocoMesPrevisao[] = [];
    carregandoPrevisao = false;

    dialogPermutaVisivel = false;
    plantaoPermutaOrigem: PlantaoDetalhe | null = null;
    opcoesDestinoPermuta: OpcaoPlantaoPermuta[] = [];
    plantaoDestinoIdSelecionado: number | null = null;
    enviandoPermuta = false;

    /** IDs numéricos de plantão origem com permuta pendente (você como solicitante). Evita falha de `includes` com string vs number. */
    private plantaoIdsComPermutaPendenteSolicitante = new Set<number>();

    /** Lista de escalas correspondente ao perfil (admin ou veterinário). */
    voltarListaPath = '/admin/escalas';

    /** UI de permuta oculta momentaneamente no perfil veterinário (menu e botão). */
    exibirUiPermuta = true;

    ngOnInit(): void {
        const modo = this.route.snapshot.data['escalasModo'];
        if (modo === 'veterinario') {
            this.voltarListaPath = '/vt/escalas';
        }

        const id = this.route.snapshot.paramMap.get('id');
        const numId = id ? parseInt(id, 10) : NaN;
        if (Number.isNaN(numId)) {
            this.carregando = false;
            return;
        }
        this.api.obterPorId(numId).subscribe({
            next: (data) => {
                this.escala = data;
                this.plantoes = this.filtrarPlantoesNoPeriodoDaEscala(data, data.plantoes || []);
                this.plantoesPorMes = this.agruparPorMes(this.agruparPlantoesPorDia(this.plantoes));
                this.plantaoIdsComPermutaPendenteSolicitante = new Set(
                    (data.permutaPendenteComoSolicitantePlantaoIds || []).map((x) => Number(x)).filter((n) => !Number.isNaN(n))
                );
                this.exibirUiPermuta = true;
                this.carregando = false;

                this.carregandoPrevisao = true;
                this.previsaoProximosPlantoes = [];
                this.previsaoPorMes = [];
                this.api.preverProximosPlantoes(numId, 6).subscribe({
                    next: (pv) => {
                        this.previsaoProximosPlantoes = pv.itens || [];
                        this.previsaoPorMes = this.agruparPrevisaoPorMes(this.previsaoProximosPlantoes);
                        this.carregandoPrevisao = false;
                    },
                    error: () => {
                        this.previsaoProximosPlantoes = [];
                        this.previsaoPorMes = [];
                        this.carregandoPrevisao = false;
                    }
                });
            },
            error: () => {
                this.carregando = false;
                this.escala = null;
                this.msg.add({ severity: 'error', summary: 'Erro', detail: 'Não foi possível carregar a escala.' });
            }
        });
    }

    private filtrarPlantoesNoPeriodoDaEscala(escala: EscalaDetalhe, plantoes: PlantaoDetalhe[]): PlantaoDetalhe[] {
        const inicio = this.dataRefSoDia(escala?.dataInicio || '');
        const fim = this.dataRefSoDia(escala?.dataFim || '');
        if (!inicio || !fim) return [...plantoes];
        return plantoes.filter((p) => {
            const data = this.dataRefSoDia(p.dataReferencia);
            return data >= inicio && data <= fim;
        });
    }

    private categoriaPlantaoNorm(p: PlantaoDetalhe): 'veterinario' | 'tecnico' {
        const c = String(p.categoriaPlantao || 'veterinario').toLowerCase();
        return c === 'tecnico' ? 'tecnico' : 'veterinario';
    }

    private agruparPlantoesPorDia(plantoes: PlantaoDetalhe[]): PlantaoDiaAgrupado[] {
        const map = new Map<string, PlantaoDetalhe[]>();
        for (const p of plantoes) {
            const iso = this.dataRefSoDia(p.dataReferencia);
            if (!map.has(iso)) map.set(iso, []);
            map.get(iso)!.push(p);
        }
        return [...map.keys()].sort().map((iso) => {
            const arr = map.get(iso)!;
            const plantaoVet = arr.find((x) => this.categoriaPlantaoNorm(x) === 'veterinario') ?? null;
            const plantoesTec = arr
                .filter((x) => this.categoriaPlantaoNorm(x) === 'tecnico')
                .sort((a, b) => (a.vagaIndice ?? 0) - (b.vagaIndice ?? 0));
            return { dataReferencia: iso, plantaoVet, plantoesTec };
        });
    }

    private agruparPorMes(dias: PlantaoDiaAgrupado[]): BlocoMes[] {
        const map = new Map<string, PlantaoDiaAgrupado[]>();
        for (const dia of dias) {
            const iso = this.dataRefSoDia(dia.dataReferencia);
            const d = new Date(iso + 'T12:00:00');
            const chave = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            if (!map.has(chave)) map.set(chave, []);
            map.get(chave)!.push(dia);
        }
        const blocos: BlocoMes[] = [];
        const chavesOrdenadas = [...map.keys()].sort();
        for (const chave of chavesOrdenadas) {
            const itens = map.get(chave)!.sort((a, b) =>
                this.dataRefSoDia(a.dataReferencia).localeCompare(this.dataRefSoDia(b.dataReferencia))
            );
            const d = new Date(this.dataRefSoDia(itens[0].dataReferencia) + 'T12:00:00');
            const rotulo = d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
            blocos.push({ rotulo, chave, itens });
        }
        return blocos;
    }

    private agruparPrevisaoPorMes(itens: PrevisaoPlantaoItem[]): BlocoMesPrevisao[] {
        const map = new Map<string, PrevisaoPlantaoItem[]>();
        for (const p of itens) {
            const iso = this.dataRefSoDia(p.dataReferencia);
            const d = new Date(iso + 'T12:00:00');
            const chave = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            if (!map.has(chave)) map.set(chave, []);
            map.get(chave)!.push(p);
        }
        const blocos: BlocoMesPrevisao[] = [];
        const chavesOrdenadas = [...map.keys()].sort();
        for (const chave of chavesOrdenadas) {
            const lista = map.get(chave)!.sort((a, b) =>
                this.dataRefSoDia(a.dataReferencia).localeCompare(this.dataRefSoDia(b.dataReferencia))
            );
            const d = new Date(this.dataRefSoDia(lista[0].dataReferencia) + 'T12:00:00');
            const rotulo = d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
            blocos.push({ rotulo, chave, itens: lista });
        }
        return blocos;
    }

    temIntervaloGrandeComAnteriorPrevisao(indice: number, itens: PrevisaoPlantaoItem[]): boolean {
        if (indice <= 0) return false;
        return this.diffDiasEntreReferencias(itens[indice - 1].dataReferencia, itens[indice].dataReferencia) > 1;
    }

    criarDataLocalHoje(): Date {
        const t = new Date();
        return new Date(t.getFullYear(), t.getMonth(), t.getDate(), 12, 0, 0, 0);
    }

    private hojeIsoSistema(): string {
        return this.fmtData(this.criarDataLocalHoje());
    }

    /** Comparado ao “hoje” real do sistema: dia do plantão já passou. */
    plantaoDiaJaPassou(p: PlantaoDetalhe): boolean {
        return this.dataRefSoDia(p.dataReferencia) < this.hojeIsoSistema();
    }

    botaoPermutaDesabilitado(p: PlantaoDetalhe): boolean {
        return this.plantaoDiaJaPassou(p) || this.plantaoTemPermutaPendenteComoSolicitante(p);
    }

    private fmtData(d: Date): string {
        const y = d.getFullYear();
        const m = `${d.getMonth() + 1}`.padStart(2, '0');
        const day = `${d.getDate()}`.padStart(2, '0');
        return `${y}-${m}-${day}`;
    }

    /** Garante YYYY-MM-DD para comparações (API pode enviar ISO com hora). */
    private dataRefSoDia(raw: string): string {
        const s = String(raw).trim();
        const m = s.match(/^(\d{4}-\d{2}-\d{2})/);
        return m ? m[1] : s.slice(0, 10);
    }

    private dataLocalAoMeioDia(raw: string): Date {
        return new Date(this.dataRefSoDia(raw) + 'T12:00:00');
    }

    formatarDataCompleta(raw: string): string {
        return this.dataLocalAoMeioDia(raw).toLocaleDateString('pt-BR', {
            weekday: 'long',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }

    formatarDataCurta(raw: string): string {
        return this.dataLocalAoMeioDia(raw).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }

    labelPeriodicidade(p: string): string {
        if (p === 'fim_de_semana') return 'Sábados e domingos';
        return p || '—';
    }

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

    severityStatus(status: string): 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast' | undefined {
        const s = (status || '').toLowerCase();
        if (s === 'ativa') return 'success';
        if (s === 'encerrada' || s === 'concluida') return 'secondary';
        return 'info';
    }

    diaSemana(dataRef: string): string {
        const d = new Date(this.dataRefSoDia(dataRef) + 'T12:00:00');
        return d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
    }

    diaNumero(dataRef: string): string {
        const d = new Date(this.dataRefSoDia(dataRef) + 'T12:00:00');
        return String(d.getDate()).padStart(2, '0');
    }

    /** Datas incluídas manualmente pelo admin (além de sábados/domingos) não são fim de semana. */
    ehDataAdicionalAdministrador(dataRef: string): boolean {
        const d = new Date(this.dataRefSoDia(dataRef) + 'T12:00:00');
        const dow = d.getDay();
        return dow !== 0 && dow !== 6;
    }

    /** Diferença em dias de calendário entre duas referências (YYYY-MM-DD). */
    private diffDiasEntreReferencias(anterior: string, atual: string): number {
        const a = new Date(this.dataRefSoDia(anterior) + 'T12:00:00');
        const b = new Date(this.dataRefSoDia(atual) + 'T12:00:00');
        return Math.round((b.getTime() - a.getTime()) / 86400000);
    }

    temIntervaloGrandeComAnterior(indice: number, itens: PlantaoDiaAgrupado[]): boolean {
        if (indice <= 0) return false;
        return this.diffDiasEntreReferencias(itens[indice - 1].dataReferencia, itens[indice].dataReferencia) > 1;
    }

    private idUsuarioLogadoNumero(): number | null {
        const u = this.auth.getUsuario() as Record<string, unknown>;
        const raw = u?.['id'] ?? u?.['UsuarioId'];
        if (raw == null) {
            return null;
        }
        const n = Number(raw);
        return Number.isNaN(n) ? null : n;
    }

    /** Alinhado ao texto gravado em `plantao.observacao` no recálculo por atestado. */
    rotuloExibicaoPlantao(p: PlantaoDetalhe): string {
        const obs = p.observacao?.trim();
        if (obs && obs.startsWith('Gestão - Atestado médico')) {
            return obs;
        }
        const nome = p.usuario?.nome?.trim() || '—';
        const login = p.usuario?.login?.trim();
        return login ? `${nome} · ${login}` : nome;
    }

    textoPrevisaoVeterinario(item: PrevisaoPlantaoItem): string {
        const n1 = item.nome?.trim();
        if (!n1) {
            return '—';
        }
        return item.login?.trim() ? `${n1} · ${item.login}` : n1;
    }

    textosPrevisaoTecnicos(item: PrevisaoPlantaoItem): string[] {
        const out: string[] = [];
        const n2 = item.segundoNome?.trim();
        if (n2) {
            out.push(item.segundoLogin?.trim() ? `${n2} · ${item.segundoLogin}` : n2);
        }
        const n3 = item.terceiroNome?.trim();
        if (n3) {
            out.push(item.terceiroLogin?.trim() ? `${n3} · ${item.terceiroLogin}` : n3);
        }
        return out;
    }

    membrosPorCategoria(categoria: 'veterinario' | 'tecnico'): NonNullable<EscalaDetalhe['membros']> {
        return [...(this.escala?.membros || [])]
            .filter((m) =>
                (String(m.categoriaMembro || 'veterinario').toLowerCase() === 'tecnico' ? 'tecnico' : 'veterinario') ===
                categoria
            )
            .sort((a, b) => a.ordem - b.ordem);
    }

    get quantidadeDiasComPlantao(): number {
        return new Set(this.plantoes.map((p) => this.dataRefSoDia(p.dataReferencia))).size;
    }

    classesLinhaDia(dia: PlantaoDiaAgrupado): Record<string, boolean> {
        const slots = [dia.plantaoVet, ...dia.plantoesTec].filter((x): x is PlantaoDetalhe => !!x);
        const meu = slots.some((p) => this.ehPlantaoDoUsuarioLogado(p));
        const passado = this.plantaoDiaJaPassou({ dataReferencia: dia.dataReferencia } as PlantaoDetalhe);
        return {
            'linha-meu': meu,
            'linha-passado': passado
        };
    }

    mensagemAlteracaoPlantao(p: PlantaoDetalhe): string | null {
        const obs = p.observacao?.trim();
        if (!obs) {
            return null;
        }
        if (obs.startsWith('Gestão - Atestado médico') || obs.startsWith('Alterado por afastamento:')) {
            return obs;
        }
        return null;
    }

    private idUsuarioDoPlantaoNumero(p: PlantaoDetalhe): number | null {
        const row = p as unknown as Record<string, unknown>;
        const raw = row['usuarioId'] ?? row['usuario_id'] ?? row['UsuarioModelId'] ?? p.usuario?.id;
        if (raw == null) {
            return null;
        }
        const n = Number(raw);
        return Number.isNaN(n) ? null : n;
    }

    ehPlantaoDoUsuarioLogado(p: PlantaoDetalhe): boolean {
        const uid = this.idUsuarioLogadoNumero();
        const pid = this.idUsuarioDoPlantaoNumero(p);
        if (uid != null && pid != null && uid === pid) {
            return true;
        }
        const loginU = this.auth.getUsuario()?.login?.trim();
        const loginP = p.usuario?.login?.trim();
        return !!(loginU && loginP && loginU === loginP);
    }

    /** Já existe solicitação de permuta pendente com este plantão como origem (você é o solicitante). */
    plantaoTemPermutaPendenteComoSolicitante(p: PlantaoDetalhe): boolean {
        const pid = Number(p.id);
        if (Number.isNaN(pid)) {
            return false;
        }
        return this.plantaoIdsComPermutaPendenteSolicitante.has(pid);
    }

    hintBotaoPermuta(p: PlantaoDetalhe): string {
        if (this.plantaoDiaJaPassou(p)) {
            return 'Plantão em data passada (relativo ao dia de referência) — permuta indisponível';
        }
        if (this.plantaoTemPermutaPendenteComoSolicitante(p)) {
            return 'Solicitação de permuta pendente';
        }
        return 'Solicitar permuta';
    }

    classesLinhaPlantao(p: PlantaoDetalhe): Record<string, boolean> {
        const meu = this.ehPlantaoDoUsuarioLogado(p);
        const passado = this.plantaoDiaJaPassou(p);
        return {
            'linha-meu': meu,
            'linha-passado': passado
        };
    }

    abrirDialogPermuta(origem: PlantaoDetalhe): void {
        if (this.plantaoDiaJaPassou(origem) || this.plantaoTemPermutaPendenteComoSolicitante(origem)) {
            return;
        }
        if (this.idUsuarioLogadoNumero() == null && !this.auth.getUsuario()?.login?.trim()) {
            return;
        }
        const origNum = Number(origem.id);
        const candidatos = [...this.plantoes]
            .filter(
                (p) =>
                    Number(p.id) !== origNum &&
                    !this.ehPlantaoDoUsuarioLogado(p) &&
                    !this.plantaoDiaJaPassou(p)
            )
            .sort((a, b) => this.dataRefSoDia(a.dataReferencia).localeCompare(this.dataRefSoDia(b.dataReferencia)));
        if (candidatos.length === 0) {
            this.msg.add({
                severity: 'warn',
                summary: 'Permuta',
                detail: 'Não há outros plantões nesta escala para solicitar permuta.'
            });
            return;
        }
        this.plantaoPermutaOrigem = origem;
        this.opcoesDestinoPermuta = candidatos.map((p) => ({
            value: Number(p.id),
            label: this.rotuloOpcaoPlantaoPermuta(p)
        }));
        this.plantaoDestinoIdSelecionado = null;
        this.dialogPermutaVisivel = true;
    }

    private rotuloOpcaoPlantaoPermuta(p: PlantaoDetalhe): string {
        const d = new Date(p.dataReferencia + 'T12:00:00');
        const dataTxt = d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' });
        const rotulo = this.rotuloExibicaoPlantao(p);
        return `${dataTxt} — ${rotulo}`;
    }

    fecharDialogPermuta(): void {
        this.dialogPermutaVisivel = false;
        this.plantaoPermutaOrigem = null;
        this.opcoesDestinoPermuta = [];
        this.plantaoDestinoIdSelecionado = null;
    }

    confirmarSolicitacaoPermuta(): void {
        if (!this.escala?.id || !this.plantaoPermutaOrigem || this.plantaoDestinoIdSelecionado == null) {
            this.msg.add({
                severity: 'warn',
                summary: 'Permuta',
                detail: 'Selecione o plantão com o qual deseja permutar.'
            });
            return;
        }
        this.enviandoPermuta = true;
        this.api
            .solicitarPermuta(this.escala.id, {
                plantaoOrigemId: this.plantaoPermutaOrigem.id,
                plantaoDestinoId: this.plantaoDestinoIdSelecionado
            })
            .subscribe({
                next: () => {
                    this.enviandoPermuta = false;
                    const origemId = Number(this.plantaoPermutaOrigem!.id);
                    if (!Number.isNaN(origemId)) {
                        this.plantaoIdsComPermutaPendenteSolicitante.add(origemId);
                        if (this.escala) {
                            this.escala.permutaPendenteComoSolicitantePlantaoIds = [
                                ...this.plantaoIdsComPermutaPendenteSolicitante
                            ];
                        }
                    }
                    this.fecharDialogPermuta();
                    this.msg.add({
                        severity: 'success',
                        summary: 'Permuta',
                        detail: 'Solicitação registrada com sucesso.'
                    });
                },
                error: (err) => {
                    this.enviandoPermuta = false;
                    const det = err?.error?.message || 'Não foi possível enviar a solicitação.';
                    this.msg.add({ severity: 'error', summary: 'Erro', detail: det });
                }
            });
    }
}
