import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface TipoAfastamento {
    id: number;
    tipo: string;
    descricao?: string | null;
    regraOrdem?: 'nao_altera' | 'adiar_no_ciclo' | string;
}

export interface RecalculoAfastamentoResumo {
    afastamentoId?: number;
    escalasAfetadas: number;
    plantoesAtualizados: number;
    ordensAlteradas: number;
    /** Ordem geral (página Ordem dos Servidores) atualizada por regra `adiar_no_ciclo`. */
    ordemGlobalAlterada?: boolean;
    permutasCanceladas: number;
}

export interface AfastamentoListagem {
    id: number;
    tipoId: number;
    usuarioId: number;
    dataInicio: string;
    dataFim: string;
    createdAt?: string;
    updatedAt?: string;
    tipo?: TipoAfastamento;
    usuario?: { id: number; nome: string; login: string; email?: string };
    recalc?: RecalculoAfastamentoResumo;
}

export interface CriarAfastamentoPayload {
    tipoId: number;
    dataInicio: string;
    dataFim: string;
    /** Obrigatório quando o registro é feito por administrador. */
    usuarioId?: number;
}

@Injectable({ providedIn: 'root' })
export class AfastamentoApiService {
    private http = inject(HttpClient);
    private base = `${environment.apiUrl}/afastamento`;

    listarTipos(): Observable<TipoAfastamento[]> {
        return this.http.get<TipoAfastamento[]>(`${this.base}/tipos`);
    }

    listar(): Observable<AfastamentoListagem[]> {
        return this.http.get<AfastamentoListagem[]>(this.base);
    }

    criar(body: CriarAfastamentoPayload): Observable<AfastamentoListagem> {
        return this.http.post<AfastamentoListagem>(this.base, body);
    }

    /** Remove o afastamento e recalcula escalas no período. */
    desfazer(id: number): Observable<{ removido: boolean; recalc: RecalculoAfastamentoResumo }> {
        return this.http.delete<{ removido: boolean; recalc: RecalculoAfastamentoResumo }>(`${this.base}/${id}`);
    }
}
