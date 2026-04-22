import { CommonModule, CurrencyPipe, NgForOf, NgIf } from '@angular/common';
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { ButtonDirective } from 'primeng/button';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { Table, TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';
import { CONST } from '../../helpers/constantes';


@Component({
    selector: 'app-custom-table',
    templateUrl: './custom-table.component.html',
    imports: [
        TableModule,
        ButtonDirective,
        NgForOf,
        CurrencyPipe,
        InputTextModule,
        InputIconModule,
        IconFieldModule,
        CommonModule,
        TooltipModule
    ]
})
export class CustomTableComponent {
    @Input() items: any[] = [];
    // @Input() columns: any[] = [];
    @Input() globalFilters: string[] = [];
    @Input() rows: number = 10;
    @Input() rowsPerPageOptions: number[] = [10, 20, 30];
    @Input() showCurrentPageReport: boolean = true;
    @Input() currentPageReportTemplate: string = 'Mostrando {first} a {last} de {totalRecords} entradas';
    @Input() selectionMode = 'multiple';
    @Input() dataKey: string = 'id';
    @Input() selectedItems: any[] = [];
    @Input() showEditButton: boolean = true;
    @Input() showDeleteButton: boolean = true;

    @Input() exportFilename: string = 'Movimentações';

    @Output() onEdit = new EventEmitter<any>();
    @Output() onDelete = new EventEmitter<any>();
    @Output() onRefresh = new EventEmitter<void>();
    @Output() onSelectionChange = new EventEmitter<any[]>();

    columns = [
        { field: 'id', header: 'Identificador', pipe: 'number', tooltip: 'Identificador único da mivimentação' },
        { field: 'referencia', header: 'Referência', pipe: 'number', tooltip: 'Referência da movimentação' },
        { field: 'valorArrecadado', header: 'Valor Arrecadado', pipe: 'number', tooltip: 'Receita Própria e Receita de Terceiros - Igual ao somatório dos valores dos outros três campos (VL EMOLUMENTOS LÍQUIDOS, VL FUNDO COMP E VL OUTROS REPASSES)' },
        { field: 'valorEmolumentosLiquidos', header: 'Valor Emolumentos Líquidos', pipe: 'number', tooltip: 'Receita Própria' },
        { field: 'valorFundoCompartilhado', header: 'Valor Fundo Compartilhado', pipe: 'number', tooltip: 'Receita de Terceiros referente à CCRCPN arrecadada' },
        { field: 'valorOutrosRepasses', header: 'Valor Outros Repasses', pipe: 'number', tooltip: 'Demais Receitas de Terceiros' },
        { field: 'valorCusteio', header: 'Valor Custeio', pipe: 'number' },
        { field: 'Cartorio.nome', header: 'Cartório' },
        { field: 'Responsavel.nome', header: 'Responsável' },
        { field: 'StatusMovimentacao.descricao', header: 'Status' }
    ];


    constantes = CONST;

    onGlobalFilter(table: Table, event: Event) {
        table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
    }

    edit(item: any) {
        this.onEdit.emit(item);
    }

    delete(item: any) {
        this.onDelete.emit(item);
    }

    selectionChange(event: any) {
        this.onSelectionChange.emit(event);
    }

    refresh() {
        this.onRefresh.emit();
    }

    exportCSV() {
        // Cria uma cópia dos dados para personalização
        const csvData = this.items.map(item => {
            const formattedItem: any = {};
            this.columns.forEach(col => {
                const value = this.getNestedValue(item, col.field); // Obtém o valor do campo, mesmo que seja aninhado
                if (typeof value === 'number') {
                    // Substitui o separador decimal de ponto (.) para vírgula (,)
                    formattedItem[col.header] = value.toString().replace('.', ',');
                } else {
                    formattedItem[col.header] = value || ''; // Garante que valores nulos sejam tratados como strings vazias
                }
            });
            return formattedItem;
        });

        // Converte os dados para CSV
        const csvContent = this.convertToCSV(csvData);

        // Adiciona o BOM para corrigir caracteres acentuados
        const bom = '\uFEFF'; // BOM (Byte Order Mark)
        const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });

        // Faz o download do arquivo CSV
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `${this.exportFilename}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    private getNestedValue(obj: any, path: string): any {
        // Divide o caminho (ex.: "Cartorio.nome") e acessa cada propriedade
        return path.split('.').reduce((acc, part) => acc && acc[part], obj);
    }

    private convertToCSV(data: any[]): string {
        if (!data || data.length === 0) {
            return '';
        }
        const headers = Object.keys(data[0]).join(';'); // Usa ponto e vírgula como separador
        const rows = data.map(row => Object.values(row).join(';'));
        return `${headers}\n${rows.join('\n')}`;
    }
}
