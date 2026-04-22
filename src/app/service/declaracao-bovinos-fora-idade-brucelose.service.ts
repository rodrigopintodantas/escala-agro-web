import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { environment } from '../../environments/environment';

export interface DeclaracaoBovinosForaIdadeBrucelose {
    id: number;
    id_exploracao_pecuaria: number;
    id_produtor: number;
    id_propriedade: number;
    id_classe_animal: number;
    produtor_nome: string;
    propriedade_nome: string;
    responsavel_nome?: string;
    classe_animal_nome: string;
    M_0_2: number;
    F_0_2: number;
    data_validade: string;
    data_cadastro: string;
    situacao: string;
}

@Injectable()
export class DeclaracaoBovinosForaIdadeBruceloseService {
    private http = inject(HttpClient);

    listar(somenteMeuProdutor = false): Observable<DeclaracaoBovinosForaIdadeBrucelose[]> {
        const sub = new Subject<DeclaracaoBovinosForaIdadeBrucelose[]>();
        const params = somenteMeuProdutor ? new HttpParams().set('somenteMeuProdutor', 'true') : undefined;

        this.http.get(`${environment.apiUrl}/declaracao-bovinos-fora-idade-brucelose`, { params }).subscribe({
            next: (result: any) => {
                if (Array.isArray(result)) {
                    sub.next(result);
                } else {
                    sub.next([]);
                }
            },
            error: () => sub.next([])
        });

        return sub.asObservable();
    }

    aprovar(id: number): Observable<any> {
        return this.http.patch(`${environment.apiUrl}/declaracao-bovinos-fora-idade-brucelose/${id}/aprovar`, {});
    }

    criar(payload: {
        id_exploracao_pecuaria: number;
        id_produtor: number;
        id_propriedade: number;
        id_classe_animal: number;
        m_0_2: number;
        f_0_2: number;
    }): Observable<any> {
        return this.http.post(`${environment.apiUrl}/declaracao-bovinos-fora-idade-brucelose`, payload);
    }

    atualizar(id: number, payload: { m_0_2: number; f_0_2: number }): Observable<any> {
        return this.http.patch(`${environment.apiUrl}/declaracao-bovinos-fora-idade-brucelose/${id}`, payload);
    }
}

