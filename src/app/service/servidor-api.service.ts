import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { EscalaApiService } from './escala-api.service';

export type EscopoServidor = 'veterinario' | 'tecnico';

export interface ServidorListaItem {
    id: number;
    nome: string;
    login: string;
    suspensoEscala?: boolean;
    aguardandoOrdemEscopo?: string | null;
}

export interface ServidorListaResposta {
    ativos: ServidorListaItem[];
    aguardandoConclusaoEscala: ServidorListaItem[];
    existeEscalaBloqueandoOrdem: boolean;
}

export interface CriarServidorPayload {
    nome: string;
    login: string;
    email?: string;
    cargo?: string;
}

export interface CriarServidorResposta {
    servidor: ServidorListaItem & { aguardandoConclusaoEscala: boolean };
    senhaPadrao: string;
}

/** @deprecated Use ServidorListaItem */
export type VeterinarioListaItem = ServidorListaItem;

export interface ExcluirVeterinarioResposta {
    removido: boolean;
    recalcEscalas?: {
        escalasAfetadas: number;
        plantoesAtualizados: number;
        ordensAlteradas: number;
        ordemGlobalAlterada: boolean;
        permutasCanceladas: number;
    };
}

export interface SuspenderVeterinarioResposta {
    suspenso: boolean;
    escalasAfetadas: number;
    plantoesMarcados: number;
}

export interface ReativarVeterinarioResposta {
    reativado: boolean;
    escalasAfetadas: number;
}

@Injectable({ providedIn: 'root' })
export class ServidorApiService {
    private http = inject(HttpClient);
    private escalaApi = inject(EscalaApiService);
    private base = `${environment.apiUrl}/servidor`;

    listar(escopo: EscopoServidor): Observable<ServidorListaResposta> {
        const segmento = escopo === 'tecnico' ? 'tecnicos' : 'veterinarios';
        return this.http.get<ServidorListaResposta>(`${this.base}/${segmento}`);
    }

    criar(payload: CriarServidorPayload, escopo: EscopoServidor): Observable<CriarServidorResposta> {
        const segmento = escopo === 'tecnico' ? 'tecnicos' : 'veterinarios';
        return this.http.post<CriarServidorResposta>(`${this.base}/${segmento}`, payload);
    }

    listarVeterinarios(): Observable<ServidorListaResposta> {
        return this.listar('veterinario');
    }

    listarTecnicos(): Observable<ServidorListaResposta> {
        return this.listar('tecnico');
    }

    excluir(id: number, escopo: EscopoServidor): Observable<ExcluirVeterinarioResposta> {
        const segmento = escopo === 'tecnico' ? 'tecnicos' : 'veterinarios';
        return this.http.delete<ExcluirVeterinarioResposta>(`${this.base}/${segmento}/${id}`);
    }

    excluirVeterinario(id: number): Observable<ExcluirVeterinarioResposta> {
        return this.excluir(id, 'veterinario');
    }

    excluirTecnico(id: number): Observable<ExcluirVeterinarioResposta> {
        return this.excluir(id, 'tecnico');
    }

    suspender(id: number, escopo: EscopoServidor): Observable<SuspenderVeterinarioResposta> {
        const segmento = escopo === 'tecnico' ? 'tecnicos' : 'veterinarios';
        return this.http.post<SuspenderVeterinarioResposta>(`${this.base}/${segmento}/${id}/suspender`, {});
    }

    suspenderVeterinario(id: number): Observable<SuspenderVeterinarioResposta> {
        return this.suspender(id, 'veterinario');
    }

    reativar(id: number, escopo: EscopoServidor): Observable<ReativarVeterinarioResposta> {
        const segmento = escopo === 'tecnico' ? 'tecnicos' : 'veterinarios';
        return this.http.post<ReativarVeterinarioResposta>(`${this.base}/${segmento}/${id}/reativar`, {});
    }

    reativarVeterinario(id: number): Observable<ReativarVeterinarioResposta> {
        return this.reativar(id, 'veterinario');
    }

    existeEscalaAtiva(): Observable<boolean> {
        return new Observable<boolean>((subscriber) => {
            this.escalaApi.listar().subscribe({
                next: (escalas) => {
                    subscriber.next((escalas || []).some((e) => String(e.status || '').toLowerCase() === 'ativa'));
                    subscriber.complete();
                },
                error: (err) => subscriber.error(err)
            });
        });
    }
}
