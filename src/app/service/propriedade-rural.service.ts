import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { environment } from '../../environments/environment';

export interface PropriedadeRural {
    id?: number;
    nome_propriedade: string;
    codigo_mapa?: string;
    nivel?: string;
    situacao_cadastral: string;
    situacao_sanitaria?: string;
    id_proprietario: number;
    id_ra?: number;
    proprietario?: {
        id: number;
        nome: string;
        municipio?: string;
        documento?: string;
        telefone?: string;
        telefones?: Array<{
            tipo: string;
            numero: string;
            principal: boolean;
        }>;
    };
    produtores?: Array<{
        id: number;
        id_propriedade_rural: number;
        id_produtor: number;
        id_situacao_produtor: number;
        pessoa?: {
            id: number;
            nome: string;
            documento?: string;
            telefone?: string;
            municipio?: string;
            telefones?: Array<{
                tipo: string;
                numero: string;
                principal: boolean;
            }>;
        };
        situacao?: {
            id: number;
            nome: string;
        };
    }>;
}

@Injectable()
export class PropriedadeRuralService {
    private http = inject(HttpClient);

    listar(): Observable<PropriedadeRural[]> {
        let sub = new Subject<PropriedadeRural[]>();

        console.log('PropriedadeRuralService: Fazendo requisição para:', `${environment.apiUrl}/propriedade-rural`);

        this.http.get(`${environment.apiUrl}/propriedade-rural`).subscribe({
            next: (result: any) => {
                console.log('PropriedadeRuralService: Resposta recebida:', result);
                if (result && Array.isArray(result)) {
                    sub.next(result);
                } else {
                    console.warn('PropriedadeRuralService: Resposta não é um array:', result);
                    sub.next([]);
                }
            },
            error: (error) => {
                console.error('PropriedadeRuralService: Erro ao listar propriedades rurais:', error);
                console.error('PropriedadeRuralService: Status do erro:', error.status);
                console.error('PropriedadeRuralService: Mensagem do erro:', error.message);
                sub.next([]);
            }
        });

        return sub.asObservable();
    }

    criar(propriedade: PropriedadeRural): Observable<PropriedadeRural> {
        let sub = new Subject<PropriedadeRural>();

        this.http.post(`${environment.apiUrl}/propriedade-rural`, propriedade).subscribe({
            next: (result: any) => {
                sub.next(result);
            },
            error: (error) => {
                console.error('Erro ao criar propriedade rural:', error);
                sub.error(error);
            }
        });

        return sub.asObservable();
    }

    atualizar(propriedade: PropriedadeRural): Observable<PropriedadeRural> {
        let sub = new Subject<PropriedadeRural>();

        this.http.put(`${environment.apiUrl}/propriedade-rural/${propriedade.id}`, propriedade).subscribe({
            next: (result: any) => {
                sub.next(result);
            },
            error: (error) => {
                console.error('Erro ao atualizar propriedade rural:', error);
                sub.error(error);
            }
        });

        return sub.asObservable();
    }

    excluir(id: number): Observable<any> {
        let sub = new Subject<any>();

        this.http.delete(`${environment.apiUrl}/propriedade-rural/${id}`).subscribe({
            next: (result: any) => {
                sub.next(result);
            },
            error: (error) => {
                console.error('Erro ao excluir propriedade rural:', error);
                sub.error(error);
            }
        });

        return sub.asObservable();
    }

    consultarPeloId(id: number): Observable<PropriedadeRural> {
        let sub = new Subject<PropriedadeRural>();

        this.http.get(`${environment.apiUrl}/propriedade-rural/${id}`).subscribe({
            next: (result: any) => {
                sub.next(result);
            },
            error: (error) => {
                console.error('Erro ao consultar propriedade rural:', error);
                sub.error(error);
            }
        });

        return sub.asObservable();
    }
}
