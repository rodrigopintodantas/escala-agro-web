import { HttpClient, HttpHandlerFn, HttpRequest } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { environment } from '../../environments/environment';
import { Perfil } from '../types/perfil.model';
import { Usuario } from '../types/usuario.model';

@Injectable({
    providedIn: 'root'
})
export class AutenticacaoService {
    authenticated = false;
    user: Usuario = {};
    private userLogin: string | null = null;
    private authToken: string | null = null;

    private apiURL = `${environment.apiUrl}/auth`;
    private http = inject(HttpClient);

    constructor() {
        const storedUser = sessionStorage.getItem('user');
        const storedLogin = sessionStorage.getItem('userLogin');
        const storedToken = sessionStorage.getItem('authToken');
        if (storedUser && storedLogin && storedToken) {
            this.authenticated = true;
            this.user = JSON.parse(storedUser);
            this.userLogin = storedLogin;
            this.authToken = storedToken;
        }
    }

    login(login: string, senha: string): Observable<void> {
        const obs = new Subject<void>();
        this.http.post<{ token: string }>(`${this.apiURL}/login`, { login, senha }).subscribe({
            next: (retorno) => {
                this.userLogin = login;
                this.authToken = retorno.token;
                sessionStorage.setItem('userLogin', login);
                sessionStorage.setItem('authToken', retorno.token);
                this.authenticated = true;
                obs.next();
                obs.complete();
            },
            error: (error) => {
                this.limparAutenticacao();
                this.authenticated = false;
                obs.error(error);
            }
        });
        return obs.asObservable();
    }

    logout() {
        this.authenticated = false;
        this.userLogin = null;
        this.limparAutenticacao();
    }

    carregarPerfil(): Observable<any> {
        const obs = new Subject();

        if (!this.userLogin) {
            obs.error('Usuário não autenticado');
            return obs.asObservable();
        }
        if (!this.authToken) {
            obs.error('Token de autenticação ausente');
            return obs.asObservable();
        }

        this.http
            .get<any>(this.apiURL, {
                headers: {
                    Authorization: `Bearer ${this.authToken}`
                }
            })
            .subscribe({
                next: (retorno) => {
                    sessionStorage.setItem('user', JSON.stringify(retorno.usuario));
                    sessionStorage.setItem('profiles', JSON.stringify(retorno.up));
                    this.user = retorno.usuario;
                    if (retorno.up.length === 1) {
                        sessionStorage.setItem('profile', JSON.stringify(retorno.up[0]));
                    }
                    obs.next(retorno);
                },
                error: (error) => {
                    obs.error(error);
                }
            });

        return obs.asObservable();
    }

    async loadServidorInfo() {
        if (this.userLogin) {
            await this.carregarPerfil().toPromise();
        }
        return this.user;
    }

    definePerfil(perfil: Perfil | undefined) {
        if (perfil) {
            sessionStorage.setItem('profile', JSON.stringify(perfil));
        }
    }

    public limparAutenticacao() {
        sessionStorage.removeItem('profile');
        sessionStorage.removeItem('profiles');
        sessionStorage.removeItem('user');
        sessionStorage.removeItem('userLogin');
        sessionStorage.removeItem('authToken');
        this.authToken = null;
    }

    getPerfil(): Perfil | null {
        const profile = sessionStorage.getItem('profile');
        return profile ? JSON.parse(profile) : null;
    }

    getPerfis(): Perfil[] {
        const profiles = sessionStorage.getItem('profiles');
        return profiles ? JSON.parse(profiles) : [];
    }

    getUsuario(): Usuario {
        const user = sessionStorage.getItem('user');
        return user ? JSON.parse(user) : {};
    }

    getUserLogin(): string | null {
        return this.userLogin || sessionStorage.getItem('userLogin');
    }

    temPerfil() {
        return !!sessionStorage.getItem('profiles');
    }

    private getNomePerfilAtual(): string {
        return (this.getPerfil()?.nome || '').trim();
    }

    isAdmin() {
        return this.temPerfil() && this.getNomePerfilAtual() === 'ADMIN';
    }

    isVeterinario() {
        const nome = this.getNomePerfilAtual().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        return this.temPerfil() && nome.toLowerCase() === 'veterinario';
    }

    isProdutor() {
        return this.temPerfil() && this.getNomePerfilAtual() === 'Produtor';
    }
}

export function authInterceptor(req: HttpRequest<unknown>, next: HttpHandlerFn) {
    const authService = inject(AutenticacaoService);
    const authToken = sessionStorage.getItem('authToken');
    const perfil = authService.getPerfil();

    let headers: { [key: string]: string } = {};

    if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
    }

    if (perfil?.id) {
        headers['up'] = `${perfil.id}`;
    }

    const newRequest = req.clone({
        setHeaders: headers
    });

    return next(newRequest);
}
