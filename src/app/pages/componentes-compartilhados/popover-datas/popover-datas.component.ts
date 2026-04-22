import { Component, inject, Input } from '@angular/core';
import { Popover, PopoverModule } from 'primeng/popover';
import { Vaga } from '../../../types/vaga';
import { ButtonModule } from 'primeng/button';
import { VagaService } from '../../../service/vaga.service';
import { DatePipe, NgFor, NgIf } from '@angular/common';
import { TagModule } from 'primeng/tag';

@Component({
    selector: 'nuptec-popover-datas',
    imports: [NgIf, NgFor, PopoverModule, ButtonModule, DatePipe, TagModule],
    templateUrl: './popover-datas.component.html'
})
export class PopoverDatasComponent {
    @Input() vaga?: Vaga;

    dados: any;
    loading = false;
    error = false;

    private vagaService = inject(VagaService);

    togglePopover(event: Event, popover: Popover) {
        if (popover.overlayVisible) {
            // fecha se já estiver aberto
            popover.hide();
        } else {
            // abre e busca dados
            this.buscarDados();
            popover.show(event);
        }
    }

    buscarDados() {
        this.loading = true;
        this.error = false;
        this.dados = null;

        this.vagaService.consultarDiasUteisDaVaga(this.vaga!.id).subscribe({
            next: (res: any) => {
                this.dados = res.map((data: any) => {
                    const [y, m, d] = data.split('-').map(Number);
                    return new Date(y, m - 1, d);
                });
                this.loading = false;
            },
            error: (error) => {
                this.error = true;
                this.loading = false;
            }
        });
    }

    getTotalDePlantoes(): string {
        return this.vaga?.qtd_plantoes ? this.vaga.qtd_plantoes.toString() : '0';
    }
}
