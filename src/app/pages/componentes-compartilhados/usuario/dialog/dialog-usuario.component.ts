import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output, SimpleChanges } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { InputMaskModule } from 'primeng/inputmask';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { Usuario } from '../../../../types/usuario.model';
import { MultiSelectModule } from 'primeng/multiselect';
import { Perfil } from '../../../../types/perfil.model';
import { PerfilService } from '../../../../service/perfil.service';

// Interface estendida para incluir papéis
interface UsuarioComPapels extends Usuario {
    papels?: Perfil[];
}

@Component({
    selector: 'app-usuario-dialog',
    templateUrl: './dialog-usuario.component.html',
    standalone: true,
    imports: [
        CommonModule,
        DialogModule,
        FormsModule,
        ReactiveFormsModule,
        InputTextModule,
        DropdownModule,
        ButtonModule,
        InputMaskModule,
        MultiSelectModule
    ]
})
export class UsuarioDialogComponent implements OnInit {
    generos: any[] = [
        { label: 'Masculino', value: 'masculino' },
        { label: 'Feminino', value: 'feminino' }
    ];

    papels: Perfil[] = [];

    @Input() visible: boolean = false;
    @Input() tituloCadastro: string = 'Novo Usuário';
    @Input() usuario: Usuario = {};
    @Input() submitted: boolean = false;
    @Input() modoEdicao: boolean = false;
    @Input() usuarioParaEditar: any = null;

    @Output() onHide = new EventEmitter<void>();
    @Output() onSave = new EventEmitter<UsuarioComPapels>();

    formulario = new FormGroup({
        nome: new FormControl('', [Validators.required]),
        login: new FormControl('', [Validators.required]),
        email: new FormControl('', [Validators.required, Validators.email]),
        cargo: new FormControl('', [Validators.required]),
        telefone: new FormControl('', [Validators.required]),
        genero: new FormControl('', [Validators.required]),
        papels: new FormControl<Perfil[]>([], [Validators.required])
    });

    constructor(private perfilService: PerfilService) { }

    ngOnInit(): void {
        this.carregarPapels();
        this.resetForm();
    }

    carregarPapels() {
        this.perfilService.listar().subscribe({
            next: (papels: Perfil[]) => {
                this.papels = papels;
                console.log('Papéis carregados:', papels);
            },
            error: (error: any) => {
                console.error('Erro ao carregar papéis:', error);
            }
        });
    }

    hideDialog() {
        this.onHide.emit();
    }

    save() {
        if (this.formulario.valid) {
            const papelsValue = this.formulario.get('papels')?.value || [];
            console.log('Papéis selecionados no formulário:', papelsValue);
            console.log('Tipo dos papéis:', typeof papelsValue);
            console.log('É array?', Array.isArray(papelsValue));

            const usuarioData: UsuarioComPapels = {
                id: this.modoEdicao ? this.usuarioParaEditar?.id : undefined,
                nome: this.formulario.get('nome')?.value || '',
                login: this.formulario.get('login')?.value || '',
                email: this.formulario.get('email')?.value || '',
                cargo: this.formulario.get('cargo')?.value || '',
                telefone: this.formulario.get('telefone')?.value || '',
                genero: this.formulario.get('genero')?.value || 'masculino',
                ativo: this.modoEdicao ? this.usuarioParaEditar?.ativo : true,
                papels: papelsValue
            };

            console.log('Dados do usuário a serem enviados:', usuarioData);
            this.onSave.emit(usuarioData);
        }
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['visible']?.currentValue) {
            if (this.modoEdicao && this.usuarioParaEditar) {
                this.carregarDadosParaEdicao();
            } else {
                this.resetForm();
            }
        }
    }

    private carregarDadosParaEdicao() {
        if (this.usuarioParaEditar) {
            // Mapear os papéis do usuário para o formato esperado pelo multiSelect
            const papelsSelecionados = this.usuarioParaEditar.UsuarioPapelModels?.map((up: any) => up.PapelModel) || [];

            this.formulario.patchValue({
                nome: this.usuarioParaEditar.nome || '',
                login: this.usuarioParaEditar.login || '',
                email: this.usuarioParaEditar.email || '',
                cargo: this.usuarioParaEditar.cargo || '',
                telefone: this.usuarioParaEditar.telefone || '',
                genero: this.usuarioParaEditar.genero || 'masculino',
                papels: papelsSelecionados
            });
        }
    }

    resetForm() {
        if (this.formulario) {
            this.formulario.reset();
            this.formulario.patchValue({
                genero: 'masculino'
            });
        }
    }
}
