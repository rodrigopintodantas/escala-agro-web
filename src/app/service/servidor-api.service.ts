import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface VeterinarioSaldo {
    id: number;
    nome: string;
    login: string;
    saldo: number;
}

@Injectable({ providedIn: 'root' })
export class ServidorApiService {
    private http = inject(HttpClient);
    private base = `${environment.apiUrl}/servidor`;

    listarSaldoVeterinarios(): Observable<VeterinarioSaldo[]> {
        return this.http.get<VeterinarioSaldo[]>(`${this.base}/veterinarios-saldo`);
    }
}
