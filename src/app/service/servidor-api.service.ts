import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface VeterinarioListaItem {
    id: number;
    nome: string;
    login: string;
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

@Injectable({ providedIn: 'root' })
export class ServidorApiService {
    private http = inject(HttpClient);
    private base = `${environment.apiUrl}/servidor`;

    listarVeterinarios(): Observable<VeterinarioListaItem[]> {
        return this.http.get<VeterinarioListaItem[]>(`${this.base}/veterinarios`);
    }

    excluirVeterinario(id: number): Observable<ExcluirVeterinarioResposta> {
        return this.http.delete<ExcluirVeterinarioResposta>(`${this.base}/veterinarios/${id}`);
    }
}
