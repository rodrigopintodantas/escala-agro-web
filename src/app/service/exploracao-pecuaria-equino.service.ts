import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ExploracaoPecuariaEquino {
    id_exploracao_pecuaria_equino: number;
    grupo_animal: string;
    id_propriedade_rural: number;
    id_pessoa: number;
    situacao_bloqueio: string;
    situacao_exploracao: string;

    eq_m0a6: number;
    eq_f0a6: number;
    eq_m6mais: number;
    eq_f6mais: number;
    eq_reserva_abate_60: number;

    mu_m0a6: number;
    mu_f0a6: number;
    mu_m6mais: number;
    mu_f6mais: number;
    mu_reserva_abate_60: number;

    as_m0a6: number;
    as_f0a6: number;
    as_m6mais: number;
    as_f6mais: number;
    as_reserva_abate_60: number;

    quantidade_animais: number;
    created_at?: string;
    situacao_atual_data?: string;
    situacao_atual_justificativa?: string;
    situacao_atual_descricao?: string;
    situacao_atual_responsavel?: string;

    pessoa?: {
        id: number;
        nome: string;
        documento?: string;
        telefone?: string;
        telefones?: Array<{
            tipo: string;
            numero: string;
            principal: boolean;
        }>;
    };

    vacinacoes?: any[];
    eventos?: any[];
}

@Injectable()
export class ExploracaoPecuariaEquinoService {
    private http = inject(HttpClient);

    listarPorPropriedade(idPropriedadeRural: number): Observable<ExploracaoPecuariaEquino[]> {
        let sub = new Subject<ExploracaoPecuariaEquino[]>();

        this.http.get(`${environment.apiUrl}/exploracao-pecuaria-equino/propriedade/${idPropriedadeRural}`).subscribe({
            next: (result: any) => {
                if (result && Array.isArray(result)) sub.next(result);
                else sub.next([]);
            },
            error: () => sub.next([])
        });

        return sub.asObservable();
    }
}

