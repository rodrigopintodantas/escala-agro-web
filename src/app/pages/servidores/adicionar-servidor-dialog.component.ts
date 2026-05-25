import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { EscopoServidor } from '../../service/servidor-api.service';

@Component({
    selector: 'app-adicionar-servidor-dialog',
    standalone: true,
    imports: [CommonModule, DialogModule, ReactiveFormsModule, InputTextModule, ButtonModule],
    templateUrl: './adicionar-servidor-dialog.component.html'
})
export class AdicionarServidorDialogComponent {
    @Input() visible = false;
    /** Escopo sugerido ao abrir (aba atual da listagem). */
    @Input() escopoInicial: EscopoServidor = 'veterinario';
    @Input() existeEscalaBloqueandoOrdem = false;
    @Input() salvando = false;

    @Output() visibleChange = new EventEmitter<boolean>();
    @Output() salvar = new EventEmitter<{ nome: string; login: string; escopo: EscopoServidor }>();

    formulario = new FormGroup({
        escopo: new FormControl<EscopoServidor>('veterinario', { nonNullable: true, validators: [Validators.required] }),
        nome: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
        login: new FormControl('', { nonNullable: true, validators: [Validators.required] })
    });

    get escopoSelecionado(): EscopoServidor {
        return this.formulario.controls.escopo.value;
    }

    fechar(): void {
        this.visibleChange.emit(false);
    }

    selecionarEscopo(escopo: EscopoServidor): void {
        if (this.salvando) {
            return;
        }
        this.formulario.controls.escopo.setValue(escopo);
    }

    enviar(): void {
        if (this.formulario.invalid || this.salvando) {
            this.formulario.markAllAsTouched();
            return;
        }
        const nome = this.formulario.controls.nome.value.trim();
        const login = this.formulario.controls.login.value.trim().toLowerCase();
        const escopo = this.formulario.controls.escopo.value;
        this.salvar.emit({ nome, login, escopo });
    }

    aoAbrir(): void {
        this.formulario.reset({
            escopo: this.escopoInicial,
            nome: '',
            login: ''
        });
    }
}
