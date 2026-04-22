import { HttpErrorResponse } from '@angular/common/http';
import { ErrorHandler, Injectable } from '@angular/core';
import { MsgService } from './../service/mensagens.service';

@Injectable({
    providedIn: 'root'
})
export class GlobalErrorHandler implements ErrorHandler {
    constructor(private msgService: MsgService) {}

    handleError(error: Error | HttpErrorResponse): void {
        // Verificar se é um erro de resposta HTTP
        if (error instanceof HttpErrorResponse) {
            console.log('Erro HTTP:', error);
            this.msgService.erroGlobal(error.error.message, '');
        } else {
            console.error('Erro capturado pelo GlobalErrorHandler:', error);
        }
    }
}
