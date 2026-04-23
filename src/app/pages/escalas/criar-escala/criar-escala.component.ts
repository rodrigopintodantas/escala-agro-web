import { CommonModule } from '@angular/common';
import { Component, ViewChild, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { Calendar } from 'primeng/calendar';
import { EscalaApiService } from '../../../service/escala-api.service';

@Component({
    selector: 'app-criar-escala',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        RouterModule,
        ButtonModule,
        CalendarModule,
        DropdownModule,
        InputTextModule,
        TextareaModule,
        ToastModule
    ],
    templateUrl: './criar-escala.component.html'
})
export class CriarEscalaComponent {
    @ViewChild('extrasCal') private extrasCal?: Calendar;

    private api = inject(EscalaApiService);
    private router = inject(Router);
    private msg = inject(MessageService);

    nome = '';
    descricao = '';
    mesInicio: Date | null = null;
    mesFim: Date | null = null;
    dataInicio: Date | null = null;
    dataFim: Date | null = null;
    periodicidade = 'fim_de_semana';
    /** Datas adicionais (além de sábados e domingos) geradas como plantão previsto. */
    datasPlantaoExtras: Date[] = [];
    salvando = false;

    opcoesPeriodicidade = [{ label: 'Sábados e domingos', value: 'fim_de_semana' }];

    repositionarCalendarioExtras(): void {
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                this.extrasCal?.alignOverlay();
            });
        });
    }

    private fmt(d: Date): string {
        const y = d.getFullYear();
        const m = `${d.getMonth() + 1}`.padStart(2, '0');
        const day = `${d.getDate()}`.padStart(2, '0');
        return `${y}-${m}-${day}`;
    }

    private fmtBr(d: Date): string {
        return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }

    private primeiroDiaDoMes(base: Date): Date {
        return new Date(base.getFullYear(), base.getMonth(), 1, 12, 0, 0, 0);
    }

    private ultimoDiaDoMes(base: Date): Date {
        return new Date(base.getFullYear(), base.getMonth() + 1, 0, 12, 0, 0, 0);
    }

    private diffMesesInclusivo(inicio: Date, fim: Date): number {
        const a = inicio.getFullYear() * 12 + inicio.getMonth();
        const b = fim.getFullYear() * 12 + fim.getMonth();
        return b - a + 1;
    }

    onMesInicioSelecionado(): void {
        if (!this.mesInicio) {
            this.dataInicio = null;
            return;
        }
        const inicioMes = this.primeiroDiaDoMes(this.mesInicio);
        this.mesInicio = inicioMes;
        this.dataInicio = inicioMes;

        if (!this.mesFim) {
            this.mesFim = inicioMes;
            this.dataFim = this.ultimoDiaDoMes(inicioMes);
            return;
        }

        const fimMes = this.primeiroDiaDoMes(this.mesFim);
        if (fimMes < inicioMes) {
            this.mesFim = inicioMes;
            this.dataFim = this.ultimoDiaDoMes(inicioMes);
            return;
        }
        if (this.diffMesesInclusivo(inicioMes, fimMes) > 2) {
            const limite = new Date(inicioMes.getFullYear(), inicioMes.getMonth() + 1, 1, 12, 0, 0, 0);
            this.mesFim = limite;
            this.dataFim = this.ultimoDiaDoMes(limite);
            this.msg.add({
                severity: 'warn',
                summary: 'Validação',
                detail: 'A escala pode abranger no máximo dois meses fechados.'
            });
            return;
        }
        this.mesFim = fimMes;
        this.dataFim = this.ultimoDiaDoMes(fimMes);
    }

    onMesFimSelecionado(): void {
        if (!this.mesFim) {
            this.dataFim = null;
            return;
        }
        const fimMes = this.primeiroDiaDoMes(this.mesFim);
        this.mesFim = fimMes;
        this.dataFim = this.ultimoDiaDoMes(fimMes);

        if (!this.mesInicio) {
            this.mesInicio = fimMes;
            this.dataInicio = this.primeiroDiaDoMes(fimMes);
            return;
        }

        const inicioMes = this.primeiroDiaDoMes(this.mesInicio);
        if (fimMes < inicioMes) {
            this.mesFim = inicioMes;
            this.dataFim = this.ultimoDiaDoMes(inicioMes);
            this.msg.add({
                severity: 'warn',
                summary: 'Validação',
                detail: 'O mês final deve ser igual ou posterior ao mês inicial.'
            });
            return;
        }

        if (this.diffMesesInclusivo(inicioMes, fimMes) > 2) {
            const limite = new Date(inicioMes.getFullYear(), inicioMes.getMonth() + 1, 1, 12, 0, 0, 0);
            this.mesFim = limite;
            this.dataFim = this.ultimoDiaDoMes(limite);
            this.msg.add({
                severity: 'warn',
                summary: 'Validação',
                detail: 'A escala pode abranger no máximo dois meses fechados.'
            });
        }
    }

    salvar(): void {
        if (!this.nome?.trim()) {
            this.msg.add({ severity: 'warn', summary: 'Validação', detail: 'Informe o nome da escala.' });
            return;
        }
        if (!this.dataInicio || !this.dataFim) {
            this.msg.add({ severity: 'warn', summary: 'Validação', detail: 'Selecione mês inicial e mês final.' });
            return;
        }
        if (!this.mesInicio || !this.mesFim) {
            this.msg.add({ severity: 'warn', summary: 'Validação', detail: 'Selecione mês inicial e mês final.' });
            return;
        }
        if (this.diffMesesInclusivo(this.mesInicio, this.mesFim) > 2) {
            this.msg.add({
                severity: 'warn',
                summary: 'Validação',
                detail: 'A escala pode abranger no máximo dois meses fechados.'
            });
            return;
        }

        const ini = this.fmt(this.dataInicio);
        const fim = this.fmt(this.dataFim);
        for (const d of this.datasPlantaoExtras) {
            const s = this.fmt(d);
            if (s < ini || s > fim) {
                this.msg.add({
                    severity: 'warn',
                    summary: 'Validação',
                    detail: `A data ${this.fmtBr(d)} das datas adicionais deve estar entre a data inicial e a data final da escala.`
                });
                return;
            }
        }

        this.salvando = true;
        this.api
            .criar({
                nome: this.nome.trim(),
                descricao: this.descricao?.trim() || undefined,
                dataInicio: this.fmt(this.dataInicio),
                dataFim: this.fmt(this.dataFim),
                periodicidade: this.periodicidade,
                membrosVeterinarios: [],
                membrosTecnicos: [],
                datasPlantaoExtras: this.datasPlantaoExtras.map((d) => this.fmt(d))
            })
            .subscribe({
                next: () => {
                    this.salvando = false;
                    this.msg.add({ severity: 'success', summary: 'Sucesso', detail: 'Escala criada.' });
                    this.router.navigate(['/admin/escalas']);
                },
                error: (err) => {
                    this.salvando = false;
                    const det = err?.error?.message || 'Não foi possível salvar.';
                    this.msg.add({ severity: 'error', summary: 'Erro', detail: det });
                }
            });
    }
}
