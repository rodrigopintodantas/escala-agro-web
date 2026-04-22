import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { MessageService } from 'primeng/api';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { ServidorApiService, VeterinarioSaldo } from '../../service/servidor-api.service';

@Component({
    selector: 'app-servidores-lista',
    standalone: true,
    imports: [CommonModule, TableModule, ToastModule],
    templateUrl: './servidores-lista.component.html'
})
export class ServidoresListaComponent implements OnInit {
    private api = inject(ServidorApiService);
    private msg = inject(MessageService);

    linhas: VeterinarioSaldo[] = [];
    carregando = true;

    ngOnInit(): void {
        this.api.listarSaldoVeterinarios().subscribe({
            next: (data) => {
                this.linhas = data;
                this.carregando = false;
            },
            error: () => {
                this.carregando = false;
                this.msg.add({ severity: 'error', summary: 'Erro', detail: 'Não foi possível carregar os saldos.' });
            }
        });
    }
}
