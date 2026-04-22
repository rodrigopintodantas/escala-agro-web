import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ExploracaoPecuariaBovino {
    id_exploracao_pecuaria_bovino: number;
    grupo_animal: string;
    id_propriedade_rural: number;
    id_pessoa: number;
    situacao_bloqueio: string;
    situacao_exploracao: string;
    m0a2?: number;
    m3a8?: number;
    m9a12?: number;
    f0a2?: number;
    f3a8?: number;
    f9a12?: number;
    m0a12: number;
    f0a12: number;
    m13a24: number;
    f13a24: number;
    m25a36: number;
    f25a36: number;
    m36mais: number;
    f36mais: number;
    reserva_abate_60: number;
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

export interface TipoVacinacao {
    id_tipo_vacinacao: number;
    nome: string;
}

export interface RegistrarVacinacaoPayload {
    id_tipo_vacinacao: number;
    data: string;
    campanha?: string;
    produtor?: string;
    responsavel_tecnico?: string;
    usuario_modificacao?: string;
    qtd_animais_vacinados: number;
}

@Injectable()
export class ExploracaoPecuariaBovinoService {
    private http = inject(HttpClient);

    listarPorPropriedade(idPropriedadeRural: number): Observable<ExploracaoPecuariaBovino[]> {
        let sub = new Subject<ExploracaoPecuariaBovino[]>();

        this.http.get(`${environment.apiUrl}/exploracao-pecuaria-bovino/propriedade/${idPropriedadeRural}`).subscribe({
            next: (result: any) => {
                if (result && Array.isArray(result)) sub.next(result);
                else sub.next([]);
            },
            error: () => sub.next([])
        });

        return sub.asObservable();
    }

    listarTiposVacinacao(): Observable<TipoVacinacao[]> {
        return this.http.get<TipoVacinacao[]>(`${environment.apiUrl}/exploracao-pecuaria-bovino/tipos-vacinacao`);
    }

    registrarVacinacao(idExploracao: number, payload: RegistrarVacinacaoPayload): Observable<any> {
        return this.http.post(`${environment.apiUrl}/exploracao-pecuaria-bovino/${idExploracao}/vacinacoes`, payload);
    }

  atualizarFaixas(
    idExploracao: number,
    payload: {
      m0a12?: number; f0a12?: number;
      m13a24: number; f13a24: number;
      m25a36: number; f25a36: number;
      m36mais: number; f36mais: number;
      reserva_abate_60: number;
      m0a2: number; m3a8: number; m9a12: number;
      f0a2: number; f3a8: number; f9a12: number;
    }
  ): Observable<any> {
    return this.http.put(`${environment.apiUrl}/exploracao-pecuaria-bovino/${idExploracao}/faixas`, payload);
  }
}

