import { NgFor, NgForOf, NgIf, CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BadgeModule } from 'primeng/badge';
import { ButtonDirective } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { Table, TableModule } from 'primeng/table';
import { ToolbarModule } from 'primeng/toolbar';
import { UsuarioService, UsuarioComPerfis } from '../../../../service/usuario.service';
import { Usuario } from '../../../../types/usuario.model';
import { CONST } from '../../../helpers/constantes';
import { UsuarioDialogComponent } from '../dialog/dialog-usuario.component';
import { DeleteDialogComponent } from '../../delete-dialog/delete-dialog.component';
import { HttpClient } from '@angular/common/http';
import { TagModule } from 'primeng/tag';
import { MsgService, MensagensEnum } from '../../../../service/mensagens.service';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';

@Component({
    selector: 'nuptec-lista-usuario',
    standalone: true,
    imports: [NgFor, NgForOf, NgIf, CommonModule, BadgeModule, ButtonDirective, InputTextModule, TableModule, ToolbarModule, CardModule, UsuarioDialogComponent, DeleteDialogComponent, TagModule, ToastModule],
    providers: [UsuarioService, MessageService],
    templateUrl: './lista-usuario.component.html'
})
export class ListaUsuarioComponent implements OnInit {
    private usuarioService = inject(UsuarioService);
    private router = inject(Router);
    private http = inject(HttpClient);
    private msgService = inject(MsgService);

    selectedItens: UsuarioComPerfis[] = [];
    itens: UsuarioComPerfis[] = [];
    constantes = CONST;
    globalFilters = ['nome', 'login', 'email', 'cargo', 'telefone', 'UsuarioPapelModels', 'ativo'];
    page = { titulo: 'Lista de Usuários' };

    // Propriedades para o dialog
    dialogVisible: boolean = false;
    dialogTitulo: string = 'Novo Usuário';
    modoEdicao: boolean = false;
    usuarioParaEditar: UsuarioComPerfis | null = null;

    // Propriedades para o dialog de exclusão
    deleteDialogVisible: boolean = false;
    deleteDialogHeader: string = 'Confirmar Exclusão';
    deleteDialogMessage: string = 'Tem certeza que deseja excluir o usuário';
    usuarioParaExcluir: UsuarioComPerfis | null = null;

    cols = [
        { field: 'nome', header: 'Nome' },
        { field: 'login', header: 'Login' },
        { field: 'email', header: 'Email' },
        { field: 'cargo', header: 'Cargo' },
        { field: 'telefone', header: 'Telefone' },
        { field: 'UsuarioPapelModels', header: 'Papéis' },
        { field: 'ativo', header: 'Status' }
    ];

    ngOnInit(): void {
        this._carregaUsuarios();
    }

    private _carregaUsuarios() {
        this.usuarioService.listarUsuarioTodos().subscribe({
            next: (result: UsuarioComPerfis[]) => {
                console.log('Usuários carregados:', result);
                if (result && result.length > 0) {
                    console.log('Estrutura do primeiro usuário:', JSON.stringify(result[0], null, 2));
                    if (result[0]?.UsuarioPapelModels) {
                        console.log('Papéis do primeiro usuário:', result[0].UsuarioPapelModels);
                        console.log('Quantidade de papéis:', result[0].UsuarioPapelModels.length);
                        result[0].UsuarioPapelModels.forEach((papel, index) => {
                            console.log(`Papel ${index}:`, papel);
                            console.log(`Papel ${index} - PapelModel:`, papel.PapelModel);
                        });
                    } else {
                        console.log('Primeiro usuário não tem UsuarioPapelModels');
                    }
                }
                this.itens = result || [];
            },
            error: (error: any) => {
                console.error('Erro ao carregar usuários:', error);
                this.itens = [];
            }
        });
    }

    onGlobalFilter(table: Table, event: Event) {
        table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
    }

    verDetalhe(item: UsuarioComPerfis) {
        this.router.navigate(['/vt/usuarios/detalhe', item.id]);
    }

    editarUsuario(item: UsuarioComPerfis) {
        // Abrir dialog de edição com dados preenchidos
        this.usuarioParaEditar = item;
        this.dialogVisible = true;
        this.dialogTitulo = 'Editar Usuário';
        this.modoEdicao = true;
    }

    bloquearUsuario(item: UsuarioComPerfis) {
        if (item && item.id) {
            this.usuarioService.bloquear(item).subscribe({
                next: () => {
                    console.log('Usuário bloqueado com sucesso');
                    this._carregaUsuarios(); // Recarrega a lista
                },
                error: (error: any) => {
                    console.error('Erro ao bloquear usuário:', error);
                }
            });
        }
    }

    desbloquearUsuario(item: UsuarioComPerfis) {
        if (item && item.id) {
            this.usuarioService.desbloquear(item).subscribe({
                next: () => {
                    console.log('Usuário desbloqueado com sucesso');
                    this._carregaUsuarios(); // Recarrega a lista
                },
                error: (error: any) => {
                    console.error('Erro ao desbloquear usuário:', error);
                }
            });
        }
    }

    excluirUsuario(item: UsuarioComPerfis) {
        // Abrir dialog de confirmação
        this.usuarioParaExcluir = item;
        this.deleteDialogVisible = true;
    }

    confirmarExclusao() {
        if (this.usuarioParaExcluir && this.usuarioParaExcluir.id) {
            this.usuarioService.excluir(this.usuarioParaExcluir.id).subscribe({
                next: () => {
                    console.log('Usuário excluído com sucesso');
                    this.msgService.sucesso(MensagensEnum.PADRAO_EXCLUSAO_SIMPLES);
                    this._carregaUsuarios(); // Recarrega a lista
                    this.fecharDeleteDialog(); // Fecha o dialog
                },
                error: (error: any) => {
                    console.error('Erro ao excluir usuário:', error);

                    // Tratar erro específico de exclusão
                    let mensagemErro = 'Erro ao excluir usuário';
                    if (error.error && error.error.message) {
                        mensagemErro = error.error.message;
                    } else if (error.message) {
                        mensagemErro = error.message;
                    }

                    // Mostrar mensagem de erro para o usuário
                    this.msgService.erroGlobal('Erro ao excluir usuário:', mensagemErro);

                    this.fecharDeleteDialog(); // Fecha o dialog mesmo com erro
                }
            });
        }
    }

    fecharDeleteDialog() {
        this.deleteDialogVisible = false;
        this.usuarioParaExcluir = null;
    }

    // Método para debug dos papéis
    getPapelsInfo(item: UsuarioComPerfis): string {
        if (item.UsuarioPapelModels && item.UsuarioPapelModels.length > 0) {
            return item.UsuarioPapelModels.map((up: any) => up.PapelModel?.nome || 'Papel').join(', ');
        }
        return 'Sem papéis';
    }

    // Método para retornar severidades diferentes para as tags
    getTagSeverity(index: number): string {
        const severities = [
            'info' // Azul
            //'success',   // Verde
            //'warning',   // Amarelo
            //'danger',    // Vermelho
            //'secondary', // Cinza
            //'help'       // Roxo
        ];

        return severities[index % severities.length];
    }

    // Métodos para controlar o dialog
    openNew() {
        this.dialogVisible = true;
        this.dialogTitulo = 'Novo Usuário';
        this.modoEdicao = false;
        this.usuarioParaEditar = null;
    }

    hideDialog() {
        this.dialogVisible = false;
        this.modoEdicao = false;
        this.usuarioParaEditar = null;
    }

    saveUsuario(usuario: any) {
        console.log('=== DEBUG SAVE USUARIO ===');
        console.log('Usuário a ser salvo:', usuario);
        console.log('Papéis selecionados:', usuario.papels);
        console.log('Tipo dos papéis:', typeof usuario.papels);
        console.log('É array?', Array.isArray(usuario.papels));
        console.log('Quantidade de papéis:', usuario.papels?.length || 0);

        if (usuario.papels && usuario.papels.length > 0) {
            usuario.papels.forEach((papel: any, index: number) => {
                console.log(`Papel ${index}:`, papel);
                console.log(`Papel ${index} - id:`, papel.id);
                console.log(`Papel ${index} - nome:`, papel.nome);
                console.log(`Papel ${index} - descricao:`, papel.descricao);
            });
        }
        console.log('Modo edição:', this.modoEdicao);
        console.log('========================');

        if (this.modoEdicao) {
            // Modo edição - atualizar usuário existente
            this.usuarioService.atualizar(usuario).subscribe({
                next: (usuarioAtualizado: Usuario) => {
                    console.log('Usuário atualizado com sucesso:', usuarioAtualizado);

                    // Recarregar a lista e fechar o dialog
                    this._carregaUsuarios();
                    this.hideDialog();
                },
                error: (error) => {
                    console.error('Erro ao atualizar usuário:', error);
                    // TODO: Mostrar mensagem de erro para o usuário
                }
            });
        } else {
            // Modo criação - criar novo usuário
            this.usuarioService.criar(usuario).subscribe({
                next: (usuarioCriado: Usuario) => {
                    console.log('Usuário criado com sucesso:', usuarioCriado);

                    // Recarregar a lista e fechar o dialog
                    this._carregaUsuarios();
                    this.hideDialog();
                },
                error: (error) => {
                    console.error('Erro ao criar usuário:', error);
                    // TODO: Mostrar mensagem de erro para o usuário
                }
            });
        }
    }
}
