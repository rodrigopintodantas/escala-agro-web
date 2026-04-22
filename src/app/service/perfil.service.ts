import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Perfil } from '../types/perfil.model';

@Injectable({
    providedIn: 'root'
})
export class PerfilService {
    private apiURL = `${environment.apiUrl}/papel`;
    private http = inject(HttpClient);

    listar(): Observable<Perfil[]> {
        return this.http.get<Perfil[]>(this.apiURL);
    }
}
