import { Injectable } from '@angular/core';
import { MessageService } from 'primeng/api';

export enum MensagensEnum {
    PADRAO_EXCLUSAO_SIMPLES = 'Registro excluido com sucesso.'
}

@Injectable({
    providedIn: 'root'
})
export class MsgService {
    constructor(private readonly messageService: MessageService) {}

    sucesso(mensagem: MensagensEnum | string, titulo: string = 'Sucesso'): void {
        this.messageService.add({
            severity: 'success',
            summary: titulo,
            detail: this._resolveMensagem(mensagem)
        });
    }

    erroGlobal(titulo: string, detalhe: string = ''): void {
        this.messageService.add({
            severity: 'error',
            summary: titulo || 'Erro',
            detail: detalhe
        });
    }

    aviso(mensagem: MensagensEnum | string, titulo: string = 'Atencao'): void {
        this.messageService.add({
            severity: 'warn',
            summary: titulo,
            detail: this._resolveMensagem(mensagem)
        });
    }

    info(mensagem: MensagensEnum | string, titulo: string = 'Informacao'): void {
        this.messageService.add({
            severity: 'info',
            summary: titulo,
            detail: this._resolveMensagem(mensagem)
        });
    }

    private _resolveMensagem(mensagem: MensagensEnum | string): string {
        return String(mensagem ?? '');
    }
}
