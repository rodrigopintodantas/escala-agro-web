import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Job {
  id: number;
  nome: string;
  descricao: string;
  proxima_execucao: string | null;
  interval_seconds: number | null;
  ultimo_status: 'queued' | 'running' | 'succeeded' | 'failed' | 'cancelled' | null;
  ultima_execucao_inicio: string | null;
  ultima_execucao_fim: string | null;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface JobExecucaoResultado {
  sucesso: boolean;
  mensagem: string;
  dados?: { id_job_run: number | null; job_key: string };
}

@Injectable({
  providedIn: 'root'
})
export class JobService {
  private apiUrl = `${environment.apiUrl}/job`;

  constructor(private http: HttpClient) { }

  listar(): Observable<{ sucesso: boolean; dados: Job[] }> {
    return this.http.get<{ sucesso: boolean; dados: Job[] }>(this.apiUrl);
  }

  executar(id: number): Observable<JobExecucaoResultado> {
    return this.http.post<JobExecucaoResultado>(`${this.apiUrl}/${id}/executar`, {});
  }
}
