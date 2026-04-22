import { Component, inject, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { MagistradoService } from '../../../service/magistrado.service';

@Component({
    selector: 'app-dialog-editar-contato',
    standalone: true,
    imports: [CommonModule, FormsModule, ReactiveFormsModule, ButtonModule, InputTextModule, DialogModule, ToastModule],
    providers: [MagistradoService, MessageService],
    templateUrl: './dialog-editar-contato.component.html'
})
export class DialogEditarContatoComponent implements OnInit, OnChanges {
    private magistradoService = inject(MagistradoService);
    private messageService = inject(MessageService);

    @Input() visible: boolean = false;
    @Input() magistradoId: number = 0;
    @Input() telefoneAtual: string = '';
    @Output() visibleChange = new EventEmitter<boolean>();
    @Output() contatoAtualizado = new EventEmitter<any>();

    formulario = new FormGroup({
        telefone: new FormControl<string | null>(null, [Validators.maxLength(255), Validators.pattern(/^[\d\s\-()+]*$/)])
    });

    carregando = false;

    ngOnInit(): void {
        this.formulario.patchValue({
            telefone: this.telefoneAtual
        });
    }

    ngOnChanges(changes: SimpleChanges): void {
        // Atualiza o formulário quando o dialog é aberto ou quando o telefone muda
        if (changes['visible']?.currentValue || changes['telefoneAtual']) {
            this.formulario.patchValue({
                telefone: this.telefoneAtual
            });
        }
    }

    onVisibleChange(visible: boolean) {
        this.visibleChange.emit(visible);
    }

    salvar() {
        console.log('Formulário válido:', this.formulario.valid);
        console.log('Magistrado ID:', this.magistradoId);
        console.log('Valores do formulário:', this.formulario.value);

        if (this.formulario.valid && this.magistradoId > 0) {
            this.carregando = true;

            const telefone = this.formulario.get('telefone')?.value;

            // Atualizar telefone e contato se fornecidos
            const atualizacoes = [];

            if (telefone !== null && telefone !== this.telefoneAtual) {
                console.log('Atualizando telefone:', telefone);
                atualizacoes.push(this.magistradoService.atualizarTelefone(this.magistradoId, telefone || ''));
            }

            if (atualizacoes.length > 0) {
                console.log('Executando atualizações:', atualizacoes.length);
                // Executar todas as atualizações
                this.magistradoService.atualizarTelefone(this.magistradoId, telefone || '').subscribe({
                    next: () => {
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Sucesso',
                            detail: 'Informações de contato atualizadas com sucesso!',
                            life: 3000
                        });
                        this.carregando = false;
                        // Emitir evento com os dados atualizados
                        this.contatoAtualizado.emit({
                            telefone: telefone || ''
                        });
                        this.visibleChange.emit(false);
                    },
                    error: (error) => {
                        console.error('Erro ao atualizar contato:', error);
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Erro',
                            detail: 'Erro ao atualizar informações de contato',
                            life: 3000
                        });
                        this.carregando = false;
                    }
                });
            } else {
                console.log('Nenhuma atualização necessária');
                this.carregando = false;
                this.visibleChange.emit(false);
            }
        } else {
            console.log('Formulário inválido ou ID do magistrado inválido');
            this.messageService.add({
                severity: 'warn',
                summary: 'Aviso',
                detail: 'Por favor, verifique os dados informados',
                life: 3000
            });
        }
    }

    cancelar() {
        this.formulario.patchValue({
            telefone: this.telefoneAtual
        });
        this.visibleChange.emit(false);
    }

    getErrorMessage(field: string): string {
        const control = this.formulario.get(field);
        if (control?.hasError('required')) {
            return `${field} é obrigatório`;
        }
        if (control?.hasError('maxlength')) {
            return `${field} deve ter no máximo 255 caracteres`;
        }
        if (control?.hasError('pattern') && field === 'telefone') {
            return 'Telefone deve conter apenas números, espaços, hífens, parênteses e sinal de mais';
        }
        return '';
    }
}
