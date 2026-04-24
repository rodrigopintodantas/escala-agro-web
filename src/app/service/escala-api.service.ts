import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface VeterinarioOption {
    id: number;
    nome: string;
    login: string;
    email?: string;
    cargo?: string;
    ordemGlobal?: number | null;
}

export interface PlantaoDetalhe {
    id: number;
    escalaId: number;
    usuarioId: number;
    dataReferencia: string;
    /** 0 = primeira vaga do dia; 1 = segunda (escala de técnicos). */
    vagaIndice?: number;
    /** `veterinario` | `tecnico` — escala unificada: 1 vet + 2 técnicos por dia. */
    categoriaPlantao?: string;
    status: string;
    observacao?: string | null;
    usuario?: { id: number; nome: string; login: string };
}

export interface EscalaListagem {
    id: number;
    nome: string;
    descricao?: string | null;
    dataInicio: string;
    dataFim: string;
    periodicidade: string;
    modoOrdemInicial: string;
    status: string;
    membros?: {
        id: number;
        ordem: number;
        usuarioId: number;
        categoriaMembro?: string;
        usuario?: { id: number; nome: string; login: string };
    }[];
}

export interface EscalaDetalhe extends EscalaListagem {
    plantoes?: PlantaoDetalhe[];
    /** IDs dos plantões do usuário com solicitação de permuta pendente (ele como solicitante). */
    permutaPendenteComoSolicitantePlantaoIds?: number[];
}

/** Simulação de plantões após o fim do período da escala (GET previsao-plantoes). */
export interface PrevisaoPlantaoItem {
    dataReferencia: string;
    usuarioId: number;
    nome: string | null;
    login: string | null;
    segundoUsuarioId?: number;
    segundoNome?: string | null;
    segundoLogin?: string | null;
    terceiroUsuarioId?: number;
    terceiroNome?: string | null;
    terceiroLogin?: string | null;
}

export interface PrevisaoPlantoesResposta {
    itens: PrevisaoPlantaoItem[];
}

export interface AuditoriaOrdemUsuarioItem {
    usuarioId: number;
    nome: string | null;
    login: string | null;
}

export interface AuditoriaEscalaEventoItem {
    id: number;
    categoriaMembro: 'veterinario' | 'tecnico' | string;
    tipoEvento: string;
    referenciaTipo?: string | null;
    referenciaId?: number | null;
    dataReferencia?: string | null;
    detalhes?: unknown;
    createdAt: string;
    ordemAntes: AuditoriaOrdemUsuarioItem[];
    ordemDepois: AuditoriaOrdemUsuarioItem[];
}

export interface AuditoriaEscalaAbertaItem {
    escalaId: number;
    nome: string;
    dataInicio: string;
    dataFim: string;
    status: string;
    categoriaMembro: 'veterinario' | 'tecnico' | string;
    eventos: AuditoriaEscalaEventoItem[];
}

export interface PermutaListagem {
    id: number;
    escalaId: number;
    solicitanteUsuarioId: number;
    destinatarioUsuarioId: number;
    plantaoOrigemId: number | null;
    plantaoDestinoId: number | null;
    status: string;
    createdAt: string;
    updatedAt?: string;
    escala?: { id: number; nome: string };
    solicitante?: { id: number; nome: string; login: string };
    destinatario?: { id: number; nome: string; login: string };
    plantaoOrigem?: {
        id: number;
        dataReferencia: string;
        usuarioId: number;
        observacao?: string | null;
        usuario?: { id: number; nome: string; login: string };
    } | null;
    plantaoDestino?: {
        id: number;
        dataReferencia: string;
        usuarioId: number;
        observacao?: string | null;
        usuario?: { id: number; nome: string; login: string };
    } | null;
}

export interface AdicionarDatasExtrasResposta {
    adicionados: number;
    /** Plantões já existentes cujo veterinário foi ajustado no rodízio */
    atualizados: number;
    ordemAlterada?: boolean;
    ordemGlobalAlterada?: boolean;
    /** Permutas pendentes canceladas após recalcular o rodízio */
    permutasCanceladas?: number;
    datas: string[];
}

export interface RemoverPlantoesFeriadosResposta {
    removidos: number;
    atualizados?: number;
    ordemAlterada?: boolean;
    ordemGlobalAlterada?: boolean;
    permutasCanceladas?: number;
}

export interface CriarEscalaPayload {
    nome: string;
    descricao?: string;
    dataInicio: string;
    dataFim: string;
    periodicidade: string;
    membrosVeterinarios?: { usuarioId: number; ordem?: number }[];
    membrosTecnicos?: { usuarioId: number; ordem?: number }[];
    /** Datas (YYYY-MM-DD) extras como plantão, além de sábados e domingos no período. */
    datasPlantaoExtras?: string[];
}

@Injectable({ providedIn: 'root' })
export class EscalaApiService {
    private http = inject(HttpClient);
    private base = `${environment.apiUrl}/escala`;

    listar(): Observable<EscalaListagem[]> {
        return this.http.get<EscalaListagem[]>(this.base);
    }

    listarVeterinarios(): Observable<VeterinarioOption[]> {
        return this.http.get<VeterinarioOption[]>(`${this.base}/veterinarios`);
    }

    listarOrdemServidores(escopo: 'veterinario' | 'tecnico' = 'veterinario'): Observable<VeterinarioOption[]> {
        const params = new HttpParams().set('escopo', escopo);
        return this.http.get<VeterinarioOption[]>(`${this.base}/ordem-servidores`, { params });
    }

    listarAuditoria(categoria: 'veterinario' | 'tecnico' = 'veterinario'): Observable<AuditoriaEscalaAbertaItem[]> {
        const params = new HttpParams().set('categoria', categoria);
        return this.http.get<AuditoriaEscalaAbertaItem[]>(`${this.base}/auditoria`, { params });
    }

    listarTecnicos(): Observable<VeterinarioOption[]> {
        return this.http.get<VeterinarioOption[]>(`${this.base}/tecnicos`);
    }

    salvarOrdemServidores(
        usuarioIds: number[],
        escopo: 'veterinario' | 'tecnico' = 'veterinario'
    ): Observable<VeterinarioOption[]> {
        return this.http.put<VeterinarioOption[]>(`${this.base}/ordem-servidores`, { usuarioIds, escopo });
    }

    listarPermutas(): Observable<PermutaListagem[]> {
        return this.http.get<PermutaListagem[]>(`${this.base}/permutas`);
    }

    cancelarPermuta(permutaId: number): Observable<unknown> {
        return this.http.post(`${this.base}/permutas/${permutaId}/cancelar`, {});
    }

    aceitarPermuta(permutaId: number): Observable<unknown> {
        return this.http.post(`${this.base}/permutas/${permutaId}/aceitar`, {});
    }

    recusarPermuta(permutaId: number): Observable<unknown> {
        return this.http.post(`${this.base}/permutas/${permutaId}/recusar`, {});
    }

    criar(body: CriarEscalaPayload): Observable<unknown> {
        return this.http.post(this.base, body);
    }

    obterPorId(id: number): Observable<EscalaDetalhe> {
        return this.http.get<EscalaDetalhe>(`${this.base}/${id}`);
    }

    /**
     * Próximos plantões previstos após `dataFim` da escala (fins de semana), com rodízio alinhado ao último plantão da escala.
     */
    preverProximosPlantoes(id: number, quantidade = 8): Observable<PrevisaoPlantoesResposta> {
        const params = new HttpParams().set('quantidade', String(quantidade));
        return this.http.get<PrevisaoPlantoesResposta>(`${this.base}/${id}/previsao-plantoes`, { params });
    }

    excluir(id: number): Observable<void> {
        return this.http.delete<void>(`${this.base}/${id}`);
    }

    /** Admin: define o status da escala como `ativa`. */
    ativar(id: number): Observable<EscalaListagem> {
        return this.http.post<EscalaListagem>(`${this.base}/${id}/ativar`, {});
    }

    /** Admin: conclui a escala (`concluida`) e atualiza a ordem global conforme o último plantão. */
    concluir(id: number): Observable<EscalaListagem> {
        return this.http.post<EscalaListagem>(`${this.base}/${id}/concluir`, {});
    }

    adicionarDatasPlantaoExtras(
        escalaId: number,
        datasPlantaoExtras: string[]
    ): Observable<AdicionarDatasExtrasResposta> {
        return this.http.post<AdicionarDatasExtrasResposta>(`${this.base}/${escalaId}/datas-plantao-extras`, {
            datasPlantaoExtras
        });
    }

    removerPlantoesFeriadosFacultativos(
        escalaId: number,
        plantaoIds: number[]
    ): Observable<RemoverPlantoesFeriadosResposta> {
        return this.http.post<RemoverPlantoesFeriadosResposta>(`${this.base}/${escalaId}/remover-plantoes-feriados`, {
            plantaoIds
        });
    }

    solicitarPermuta(
        escalaId: number,
        body: { plantaoOrigemId: number; plantaoDestinoId: number }
    ): Observable<unknown> {
        return this.http.post(`${this.base}/${escalaId}/solicitar-permuta`, body);
    }
}
