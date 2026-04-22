import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface GuiaTransitoAnimal {
    id: number;
    cod_gta: string;
    data_solicitacao?: string;
    data_validade?: string;
    especie: string;
    municipio_origem?: string;
    estado_origem?: string;
    municipio_destino?: string;
    estado_destino?: string;
    total_animais_declarados?: number;
    tipo_movimentacao?: 'SAIDA' | 'ENTRADA' | string;
    situacao: 'ATIVA' | 'INATIVA' | string;
    finalidade?: string;
    tipo_transporte?: string;
    nome_propriedade_origem?: string;
    nome_produtor_origem?: string;
    documento_origem?: string;
    inscricao_estadual_origem?: string;
    nome_propriedade_destino?: string;
    nome_produtor_destino?: string;
    documento_destino?: string;
    inscricao_estadual_destino?: string;
    nome_emissor?: string;
    documento_emissor?: string;
    lotacao_emissor?: string;
    requisitante_gta?: string;
    estratificacao?: Array<{
        codigo: string;
        rotulo?: string;
        quantidade: number;
    }>;
}

export interface EstratificacaoItemOpcao {
    codigo: string;
    rotulo: string;
    ordem: number;
}

export interface CriarGuiaTransitoAnimalPayload {
    idPropriedadeOrigem: number;
    nomePropriedadeOrigem: string;
    idPessoaOrigem: number;
    nomeProdutorOrigem: string;
    documentoOrigem?: string;
    inscricaoEstadualOrigem?: string;
    estadoOrigem?: string;
    municipioOrigem?: string;
    idPropriedadeDestino: number;
    nomePropriedadeDestino: string;
    idPessoaDestino: number;
    nomeProdutorDestino: string;
    documentoDestino?: string;
    inscricaoEstadualDestino?: string;
    estadoDestino?: string;
    municipioDestino?: string;
    nomeEmissor?: string;
    documentoEmissor?: string;
    lotacaoEmissor?: string;
    requisitanteGta?: string;
    finalidade?: string;
    tipoTransporte?: string;
    classeCodigo: string;
    estratificacao: Array<{ codigo: string; quantidade: number }>;
}

@Injectable()
export class GuiaTransitoAnimalService {
    private http = inject(HttpClient);

    listar(): Observable<GuiaTransitoAnimal[]> {
        return this.http.get<GuiaTransitoAnimal[]>(`${environment.apiUrl}/guia-transito-animal`);
    }

    consultarPeloId(id: number): Observable<GuiaTransitoAnimal> {
        return this.http.get<GuiaTransitoAnimal>(`${environment.apiUrl}/guia-transito-animal/${id}`);
    }

    listarItensEstratificacaoPorClasse(classeCodigo: string): Observable<EstratificacaoItemOpcao[]> {
        return this.http.get<EstratificacaoItemOpcao[]>(`${environment.apiUrl}/guia-transito-animal/estratificacao-itens/${classeCodigo}`);
    }

    criar(payload: CriarGuiaTransitoAnimalPayload): Observable<GuiaTransitoAnimal> {
        return this.http.post<GuiaTransitoAnimal>(`${environment.apiUrl}/guia-transito-animal`, payload);
    }

    excluir(id: number): Observable<void> {
        return this.http.delete<void>(`${environment.apiUrl}/guia-transito-animal/${id}`);
    }

    listarPorPropriedadePeriodo(
        propriedadeId: number,
        dataInicio: string,
        dataFim: string,
        pessoaId?: number | null,
        classeCodigo?: string | null
    ): Observable<GuiaTransitoAnimal[]> {
        const params: Record<string, string> = {
            propriedadeId: String(propriedadeId),
            dataInicio,
            dataFim
        };
        if (pessoaId) params['pessoaId'] = String(pessoaId);
        if (classeCodigo) params['classeCodigo'] = classeCodigo;

        return this.http.get<GuiaTransitoAnimal[]>(
            `${environment.apiUrl}/guia-transito-animal/por-propriedade-periodo`,
            {
                params
            }
        );
    }
}

