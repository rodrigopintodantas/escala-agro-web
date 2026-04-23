import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { Router } from '@angular/router';
import { TagModule } from 'primeng/tag';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { forkJoin, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { EscalaApiService, EscalaDetalhe, EscalaListagem, PlantaoDetalhe } from '../../service/escala-api.service';
import { AfastamentoApiService, AfastamentoListagem } from '../../service/afastamento-api.service';

interface BlocoMesPlantoes {
    rotulo: string;
    chave: string;
    itens: PlantaoDetalhe[];
}

@Component({
    selector: 'app-dashboard-inicial',
    standalone: true,
    imports: [CommonModule, CardModule, TagModule, ProgressSpinnerModule],
    template: `
        <div class="p-4">
            <ng-container *ngIf="ehAreaAdmin; else dashboardPadrao">
                <div class="flex items-center justify-between mb-4 gap-3">
                    <h1 class="text-2xl font-semibold m-0">Dashboard administrativo</h1>
                    <p-tag *ngIf="escalaAtiva" value="Escala ativa encontrada" severity="success" />
                </div>

                <div *ngIf="carregando" class="flex justify-center py-8">
                    <p-progressSpinner strokeWidth="4" styleClass="w-12 h-12"></p-progressSpinner>
                </div>

                <p-card *ngIf="!carregando && erroCarregamento" header="Erro ao carregar">
                    <p class="m-0 text-red-600 dark:text-red-400">{{ erroCarregamento }}</p>
                </p-card>

                <p-card *ngIf="!carregando && !erroCarregamento && !escalaAtiva" header="Próximos plantões">
                    <p class="m-0 text-color-secondary">Não há escala ativa no momento.</p>
                </p-card>

                <ng-container *ngIf="!carregando && !erroCarregamento && escalaAtiva">
                    <div class="text-sm text-color-secondary mb-4">
                        Escala ativa: <strong>{{ escalaAtiva.nome }}</strong> ({{ formatarPeriodo(escalaAtiva.dataInicio, escalaAtiva.dataFim) }})
                    </div>

                    <div class="flex flex-col gap-4">
                        <p-card header="Próximos plantões">
                            <ng-container *ngIf="proximosPlantoesPorMes.length; else semProximosPlantoes">
                                <div class="flex flex-col gap-4">
                                    <section
                                        *ngFor="let bloco of proximosPlantoesPorMes"
                                        class="rounded-2xl overflow-hidden border border-surface-200 dark:border-surface-700 shadow-md"
                                    >
                                        <div class="bg-gradient-to-r from-primary-600 to-primary-500 text-white px-5 py-3">
                                            <h3 class="m-0 text-lg font-semibold capitalize">{{ bloco.rotulo }}</h3>
                                            <span class="text-sm opacity-90">{{ bloco.itens.length }} plantão(ões)</span>
                                        </div>
                                        <ul class="list-none m-0 p-0 divide-y divide-surface-200 dark:divide-surface-700">
                                            <li
                                                *ngFor="let p of bloco.itens"
                                                class="flex flex-wrap items-center justify-between gap-3 px-5 py-4 bg-surface-0 dark:bg-surface-900"
                                            >
                                                <div class="flex flex-1 flex-wrap items-start gap-6">
                                                    <div class="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-lg bg-primary-100 dark:bg-primary-900/40 text-primary-800 dark:text-primary-200">
                                                        <span class="text-xs font-medium leading-none opacity-80">{{ diaSemana(p.dataReferencia) }}</span>
                                                        <span class="text-lg font-bold leading-tight">{{ diaNumero(p.dataReferencia) }}</span>
                                                    </div>
                                                    <div class="min-w-[14rem]">
                                                        <div class="text-color-secondary text-sm uppercase tracking-wide">Data</div>
                                                        <div class="text-base">{{ formatarDataCompleta(p.dataReferencia) }}</div>
                                                    </div>
                                                    <div class="min-w-[16rem] rounded-lg border border-surface-200 dark:border-surface-700 bg-surface-50/70 dark:bg-surface-800/40 px-3 py-2">
                                                        <div class="text-color-secondary text-xs uppercase tracking-wide mb-1">Veterinário</div>
                                                        <div class="flex flex-col gap-1">
                                                            <div class="text-sm font-medium">{{ p.usuario?.nome || '—' }}</div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div class="flex items-center gap-2 shrink-0">
                                                    <p-tag [value]="p.status || 'previsto'" severity="info" />
                                                </div>
                                            </li>
                                        </ul>
                                    </section>
                                </div>
                            </ng-container>
                            <ng-template #semProximosPlantoes>
                                <p class="m-0 text-color-secondary">Não há próximos plantões para a escala ativa.</p>
                            </ng-template>
                        </p-card>

                        <p-card header="Afastamentos do plantão">
                            <ng-container *ngIf="afastamentosNoPeriodoEscala.length; else semAfastamentos">
                                <div class="flex flex-col gap-3">
                                    <div
                                        *ngFor="let af of afastamentosNoPeriodoEscala"
                                        class="rounded-lg border border-surface-200 dark:border-surface-700 px-3 py-2"
                                    >
                                        <div class="flex items-center justify-between gap-2 mb-1">
                                            <div class="font-medium">{{ af.usuario?.nome || '—' }}</div>
                                            <p-tag [value]="af.tipo?.tipo || 'Afastamento'" severity="info" />
                                        </div>
                                        <div class="text-sm text-color-secondary">
                                            {{ formatarPeriodo(af.dataInicio, af.dataFim) }}
                                        </div>
                                    </div>
                                </div>
                            </ng-container>
                            <ng-template #semAfastamentos>
                                <p class="m-0 text-color-secondary">Nenhum afastamento cadastrado no período da escala ativa.</p>
                            </ng-template>
                        </p-card>
                    </div>
                </ng-container>
            </ng-container>
        </div>

        <ng-template #dashboardPadrao>
            <p-card header="Escala Agro">
                <p class="m-0">Projeto inicial carregado com sucesso.</p>
            </p-card>
        </ng-template>
    `
})
export class DashboardInicialComponent implements OnInit {
    private router = inject(Router);
    private escalaApi = inject(EscalaApiService);
    private afastamentoApi = inject(AfastamentoApiService);

    ehAreaAdmin = false;
    carregando = false;
    erroCarregamento: string | null = null;
    escalaAtiva: EscalaListagem | null = null;
    proximosPlantoes: PlantaoDetalhe[] = [];
    proximosPlantoesPorMes: BlocoMesPlantoes[] = [];
    afastamentosNoPeriodoEscala: AfastamentoListagem[] = [];

    ngOnInit(): void {
        this.ehAreaAdmin = this.router.url.startsWith('/admin');
        if (!this.ehAreaAdmin) {
            return;
        }
        this.carregarDashboardAdmin();
    }

    private carregarDashboardAdmin(): void {
        this.carregando = true;
        this.erroCarregamento = null;
        this.escalaAtiva = null;
        this.proximosPlantoes = [];
        this.proximosPlantoesPorMes = [];
        this.afastamentosNoPeriodoEscala = [];

        this.escalaApi
            .listar()
            .pipe(
                switchMap((escalas) => {
                    const ativa = escalas.find((e) => String(e.status || '').toLowerCase() === 'ativa') || null;
                    this.escalaAtiva = ativa;
                    const hoje = this.hojeIso();
                    const escalasComPlantoesFuturos = escalas.filter((e) => this.dataRefSoDia(e.dataFim) >= hoje);
                    const detalhesEscalas$ = escalasComPlantoesFuturos.length
                        ? forkJoin(escalasComPlantoesFuturos.map((e) => this.escalaApi.obterPorId(e.id)))
                        : of([] as EscalaDetalhe[]);
                    const detalheEscalaAtiva$ = ativa ? this.escalaApi.obterPorId(ativa.id) : of(null as EscalaDetalhe | null);
                    const afastamentos$ = this.afastamentoApi.listar();
                    return forkJoin({
                        detalhesEscalas: detalhesEscalas$,
                        detalheEscalaAtiva: detalheEscalaAtiva$,
                        afastamentos: afastamentos$
                    });
                }),
                map(({ detalhesEscalas, detalheEscalaAtiva, afastamentos }) => {
                    const hoje = this.hojeIso();
                    const todosPlantoes = (detalhesEscalas || []).flatMap((d) => d.plantoes || []);
                    const plantoes = todosPlantoes
                        .filter((p) => this.dataRefSoDia(p.dataReferencia) >= hoje)
                        .sort((a, b) => {
                            const cmpData = this.dataRefSoDia(a.dataReferencia).localeCompare(this.dataRefSoDia(b.dataReferencia));
                            if (cmpData !== 0) return cmpData;
                            return Number(a.id) - Number(b.id);
                        })
                        .slice(0, 4);

                    const afastamentosRecentes = [...(afastamentos || [])]
                        .sort((a, b) => {
                            const ca = String(a.createdAt || '');
                            const cb = String(b.createdAt || '');
                            if (ca && cb && ca !== cb) return cb.localeCompare(ca);
                            return Number(b.id) - Number(a.id);
                        })
                        .slice(0, 5);

                    if (!this.escalaAtiva || !detalheEscalaAtiva) {
                        return {
                            plantoes,
                            afastamentosFiltrados: afastamentosRecentes
                        };
                    }
                    return { plantoes, afastamentosFiltrados: afastamentosRecentes };
                })
            )
            .subscribe({
                next: ({ plantoes, afastamentosFiltrados }) => {
                    this.proximosPlantoes = plantoes;
                    this.proximosPlantoesPorMes = this.agruparPlantoesPorMes(plantoes);
                    this.afastamentosNoPeriodoEscala = afastamentosFiltrados;
                    this.carregando = false;
                },
                error: () => {
                    this.carregando = false;
                    this.erroCarregamento = 'Não foi possível carregar os dados do dashboard.';
                }
            });
    }

    formatarData(raw: string): string {
        return new Date(this.dataRefSoDia(raw) + 'T12:00:00').toLocaleDateString('pt-BR', {
            weekday: 'short',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }

    formatarPeriodo(inicio: string, fim: string): string {
        return `${this.formatarData(inicio)} - ${this.formatarData(fim)}`;
    }

    formatarDataCompleta(raw: string): string {
        return new Date(this.dataRefSoDia(raw) + 'T12:00:00').toLocaleDateString('pt-BR', {
            weekday: 'long',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }

    diaSemana(dataRef: string): string {
        const d = new Date(this.dataRefSoDia(dataRef) + 'T12:00:00');
        return d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
    }

    diaNumero(dataRef: string): string {
        const d = new Date(this.dataRefSoDia(dataRef) + 'T12:00:00');
        return String(d.getDate()).padStart(2, '0');
    }

    private agruparPlantoesPorMes(plantoes: PlantaoDetalhe[]): BlocoMesPlantoes[] {
        const map = new Map<string, PlantaoDetalhe[]>();
        for (const p of plantoes) {
            const iso = this.dataRefSoDia(p.dataReferencia);
            const d = new Date(iso + 'T12:00:00');
            const chave = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            if (!map.has(chave)) map.set(chave, []);
            map.get(chave)!.push(p);
        }
        const blocos: BlocoMesPlantoes[] = [];
        for (const chave of [...map.keys()].sort()) {
            const itens = map
                .get(chave)!
                .sort((a, b) => this.dataRefSoDia(a.dataReferencia).localeCompare(this.dataRefSoDia(b.dataReferencia)));
            const d = new Date(this.dataRefSoDia(itens[0].dataReferencia) + 'T12:00:00');
            const rotulo = d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
            blocos.push({ rotulo, chave, itens });
        }
        return blocos;
    }

    private hojeIso(): string {
        const d = new Date();
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    }

    private dataRefSoDia(raw: string): string {
        const s = String(raw || '').trim();
        const m = s.match(/^(\d{4}-\d{2}-\d{2})/);
        return m ? m[1] : s.slice(0, 10);
    }
}
