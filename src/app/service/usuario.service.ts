import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { environment } from '../../environments/environment';
import { Usuario } from '../types/usuario.model';
import { Perfil } from '../types/perfil.model';

export interface UsuarioPapel {
    id?: number;
    usuario_id?: number;
    papel_id?: number;
    PapelModel?: Perfil;
}

export interface UsuarioComPerfis extends Usuario {
    UsuarioPapelModels?: UsuarioPapel[];
}

@Injectable()
export class UsuarioService {
    private http = inject(HttpClient);

    listarUsuarioTodos(): Observable<UsuarioComPerfis[]> {
        let sub = new Subject<UsuarioComPerfis[]>();

        console.log('UsuarioService: Fazendo requisição para:', `${environment.apiUrl}/usuario`);

        this.http.get(`${environment.apiUrl}/usuario`).subscribe({
            next: (result: any) => {
                console.log('UsuarioService: Resposta recebida:', result);
                if (result && Array.isArray(result)) {
                    sub.next(result);
                } else {
                    console.warn('UsuarioService: Resposta não é um array:', result);
                    sub.next([]);
                }
            },
            error: (error) => {
                console.error('UsuarioService: Erro ao listar usuários:', error);
                console.error('UsuarioService: Status do erro:', error.status);
                console.error('UsuarioService: Mensagem do erro:', error.message);
                // Em caso de erro, retornar array vazio ao invés de erro
                sub.next([]);
            }
        });

        return sub.asObservable();
    }

    criar(usuario: Usuario): Observable<Usuario> {
        let sub = new Subject<Usuario>();

        this.http.post(`${environment.apiUrl}/usuario`, usuario).subscribe({
            next: (result: any) => {
                sub.next(result);
            },
            error: (error) => {
                console.error('Erro ao criar usuário:', error);
                sub.error(error);
            }
        });

        return sub.asObservable();
    }

    criarAdmin(usuario: Usuario): Observable<Usuario> {
        let sub = new Subject<Usuario>();

        this.http.post(`${environment.apiUrl}/usuario/admin`, usuario).subscribe({
            next: (result: any) => {
                sub.next(result);
            },
            error: (error) => {
                console.error('Erro ao criar usuário:', error);
                sub.error(error);
            }
        });

        return sub.asObservable();
    }

    atualizar(usuario: Usuario): Observable<Usuario> {
        let sub = new Subject<Usuario>();

        this.http.put(`${environment.apiUrl}/usuario/${usuario.id}`, usuario).subscribe({
            next: (result: any) => {
                sub.next(result);
            },
            error: (error) => {
                console.error('Erro ao atualizar usuário:', error);
                sub.error(error);
            }
        });

        return sub.asObservable();
    }

    excluir(id: number): Observable<any> {
        let sub = new Subject<any>();

        this.http.delete(`${environment.apiUrl}/usuario/${id}`).subscribe({
            next: (result: any) => {
                sub.next(result);
            },
            error: (error) => {
                console.error('Erro ao excluir usuário:', error);
                sub.error(error);
            }
        });

        return sub.asObservable();
    }

    bloquear(usuario: Usuario): Observable<any> {
        let sub = new Subject<any>();

        this.http.put(`${environment.apiUrl}/usuario/bloquear/${usuario.id}`, {}).subscribe({
            next: (result: any) => {
                sub.next(result);
            },
            error: (error) => {
                console.error('Erro ao bloquear usuário:', error);
                sub.error(error);
            }
        });

        return sub.asObservable();
    }

    desbloquear(usuario: Usuario): Observable<any> {
        let sub = new Subject<any>();

        this.http.put(`${environment.apiUrl}/usuario/desbloquear/${usuario.id}`, {}).subscribe({
            next: (result: any) => {
                sub.next(result);
            },
            error: (error) => {
                console.error('Erro ao desbloquear usuário:', error);
                sub.error(error);
            }
        });

        return sub.asObservable();
    }

    excluirLista(ids: number[]): Observable<any> {
        let sub = new Subject<any>();

        this.http.post(`${environment.apiUrl}/usuario/excluir-lista`, { ids }).subscribe({
            next: (result: any) => {
                sub.next(result);
            },
            error: (error) => {
                console.error('Erro ao excluir lista de usuários:', error);
                sub.error(error);
            }
        });

        return sub.asObservable();
    }
}
