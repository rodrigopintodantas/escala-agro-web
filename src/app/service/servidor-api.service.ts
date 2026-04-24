import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { EscalaApiService } from './escala-api.service';

export interface VeterinarioListaItem {
    id: number;
    nome: string;
    login: string;
    suspensoEscala?: boolean;
}

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

    listarVeterinarios(): Observable<VeterinarioListaItem[]> {
        return this.http.get<VeterinarioListaItem[]>(`${this.base}/veterinarios`);
    }

    excluirVeterinario(id: number): Observable<ExcluirVeterinarioResposta> {
        return this.http.delete<ExcluirVeterinarioResposta>(`${this.base}/veterinarios/${id}`);
    }

    suspenderVeterinario(id: number): Observable<SuspenderVeterinarioResposta> {
        return this.http.post<SuspenderVeterinarioResposta>(`${this.base}/veterinarios/${id}/suspender`, {});
    }

    reativarVeterinario(id: number): Observable<ReativarVeterinarioResposta> {
        return this.http.post<ReativarVeterinarioResposta>(`${this.base}/veterinarios/${id}/reativar`, {});
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
