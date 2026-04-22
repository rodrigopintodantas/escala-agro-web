import { Component, inject, OnInit } from '@angular/core';
import { CalendarModule } from 'primeng/calendar';
import { MessageService } from 'primeng/api';
import { AutenticacaoService } from '../../../service/autenticacao.service';
import { StatusAdminWidget } from '../status-admin/status-admin.widget';

@Component({
    templateUrl: './admin.dashboard.component.html',
    host: {
        class: 'block w-full'
    },
    providers: [MessageService],
    imports: [CalendarModule, StatusAdminWidget]
})
export class AdminDashboardComponent implements OnInit {
    user: any;
    //movimentacoes: Movimentacao[] = [];

    //service = inject(MovimentacaoService);
    auth = inject(AutenticacaoService);

    ngOnInit() {
        //this.service.listarMovimentacoesRecebidas().subscribe((data) => {
        //    this.movimentacoes = data;
        //});
    }
}
