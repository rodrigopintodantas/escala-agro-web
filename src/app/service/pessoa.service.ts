import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Pessoa {
    id?: number;
    nome: string;
    apelido?: string;
    documento: string;
    produtor_rural: boolean;
    situacao_cadastral: string;
    situacao_sanitaria?: string;
    sexo?: string;
    municipio?: string;
    data_cadastro?: string;
    data_nascimento?: string;
    email?: string;
    ciencia_termo?: boolean;
    estado_civil?: string;
    naturalidade?: string;
    classificacao_produtor?: string;
    escolaridade?: string;
    nome_mae?: string;
    nome_pai?: string;
    telefone?: string;
    endereco?: string;
    cep?: string;
    id_tipo_responsavel_tecnico?: number | null;
    rt?: boolean; // compatibilidade temporária com payload legado
    dados_desativacao?: any;
    dados_ativacao?: any;
    created_at?: string;
    updated_at?: string;
}

export interface ResponsavelTecnicoPessoa {
    id: number;
    nome: string;
    documento: string;
}

export interface TipoResponsavelTecnico {
    id: number;
    descricao: string;
}

@Injectable()
export class PessoaService {
    private http = inject(HttpClient);

    listar(): Observable<Pessoa[]> {
        let sub = new Subject<Pessoa[]>();

        console.log('PessoaService: Fazendo requisição para:', `${environment.apiUrl}/pessoa`);

        this.http.get(`${environment.apiUrl}/pessoa`).subscribe({
            next: (result: any) => {
                console.log('PessoaService: Resposta recebida:', result);
                if (result && Array.isArray(result)) {
                    sub.next(result);
                } else {
                    console.warn('PessoaService: Resposta não é um array:', result);
                    sub.next([]);
                }
            },
            error: (error) => {
                console.error('PessoaService: Erro ao listar pessoas:', error);
                console.error('PessoaService: Status do erro:', error.status);
                console.error('PessoaService: Mensagem do erro:', error.message);
                sub.next([]);
            }
        });

        return sub.asObservable();
    }

    criar(pessoa: Pessoa): Observable<Pessoa> {
        let sub = new Subject<Pessoa>();

        this.http.post(`${environment.apiUrl}/pessoa`, pessoa).subscribe({
            next: (result: any) => {
                sub.next(result);
            },
            error: (error) => {
                console.error('Erro ao criar pessoa:', error);
                sub.error(error);
            }
        });

        return sub.asObservable();
    }

    atualizar(pessoa: Pessoa): Observable<Pessoa> {
        let sub = new Subject<Pessoa>();

        this.http.put(`${environment.apiUrl}/pessoa/${pessoa.id}`, pessoa).subscribe({
            next: (result: any) => {
                sub.next(result);
            },
            error: (error) => {
                console.error('Erro ao atualizar pessoa:', error);
                sub.error(error);
            }
        });

        return sub.asObservable();
    }

    excluir(id: number): Observable<any> {
        let sub = new Subject<any>();

        this.http.delete(`${environment.apiUrl}/pessoa/${id}`).subscribe({
            next: (result: any) => {
                sub.next(result);
            },
            error: (error) => {
                console.error('Erro ao excluir pessoa:', error);
                sub.error(error);
            }
        });

        return sub.asObservable();
    }

    consultarPeloId(id: number): Observable<Pessoa> {
        let sub = new Subject<Pessoa>();

        this.http.get(`${environment.apiUrl}/pessoa/${id}`).subscribe({
            next: (result: any) => {
                sub.next(result);
            },
            error: (error) => {
                console.error('Erro ao consultar pessoa:', error);
                sub.error(error);
            }
        });

        return sub.asObservable();
    }

    listarResponsaveisTecnicos(): Observable<ResponsavelTecnicoPessoa[]> {
        return this.http.get<ResponsavelTecnicoPessoa[]>(`${environment.apiUrl}/pessoa/responsaveis-tecnicos`);
    }

    listarTiposResponsavelTecnico(): Observable<TipoResponsavelTecnico[]> {
        return this.http.get<TipoResponsavelTecnico[]>(`${environment.apiUrl}/tipo-responsavel-tecnico`);
    }
}
