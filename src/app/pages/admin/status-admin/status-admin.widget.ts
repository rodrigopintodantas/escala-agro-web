import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ChartModule } from 'primeng/chart';
import { DropdownModule } from 'primeng/dropdown';
import { TableModule } from 'primeng/table';
import { catchError, forkJoin, of } from 'rxjs';
import { LayoutService } from '../../../layout/service/layout.service';


@Component({
    selector: 'status-admin-widget',
    templateUrl: './status-admin.widget.html',
    host: {
        style: 'display: contents;'
    },
    styles: [
        `
            .info-card-blue {
                transition:
                    transform 0.3s ease,
                    box-shadow 0.3s ease;
            }
            .info-card-blue:hover {
                transform: translateY(-4px);
                box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
            }
            .info-card-green {
                transition:
                    transform 0.3s ease,
                    box-shadow 0.3s ease;
            }
            .info-card-green:hover {
                transform: translateY(-4px);
                box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
            }
            .info-card-orange {
                transition:
                    transform 0.3s ease,
                    box-shadow 0.3s ease;
            }
            .info-card-orange:hover {
                transform: translateY(-4px);
                box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
            }
        `
    ],
    imports: [CommonModule, CardModule, FormsModule, DropdownModule, TableModule, RouterModule, ChartModule],
    providers: [VagaService, PermutaService, DispensaService, InscricaoService],
    standalone: true
})
export class StatusAdminWidget implements OnInit, AfterViewInit {
    constructor(
        private readonly escalaService: EscalaService,
        private readonly vagaService: VagaService,
        private readonly permutaService: PermutaService,
        private readonly dispensaService: DispensaService,
        private readonly router: Router,
        private readonly inscricaoService: InscricaoService
        //private movimentacaoService: MovimentacaoService,
        //private cartorioService: CartorioService,
        //private responsavelService: ResponsavelService,
        //private usuarioService: UsuarioService
    ) {}

    totais = {
        escalasAbertas: 0,
        escalasRealizadas: 0,
        vagasAguardando: 0,
        vagasOcupadas: 0,
        alertas: 0,
        substituicoes: 0,
        permutasAguardandoAutorizacao: 0,
        permutasPendentesParaMagistrado: 0
    };

    escalas: Escala[] = [];
    escalasPrincipais: Escala[] = [];
    todasAsVagas: Vaga[] = [];
    vagasPorEscala: { [escalaId: number]: Vaga[] } = {};
    alertas: any[] = [];
    magistradosDesignadosConvocadosData: any;
    magistradosDesignadosConvocadosOptions: any;
    juizDireitoSubstitutoRealData: any;
    juizDireitoSubstitutoRealOptions: any;
    escalasQueFazemParteDoSaldo: Escala[] = [];
    paginaPlantaoSemanal: number = 1;
    itensPorPaginaPlantaoSemanal: number = 3;
    paginaFeriadoForense: number = 1;
    itensPorPaginaFeriadoForense: number = 3;
    paginaFeriadoForenseTR: number = 1;
    itensPorPaginaFeriadoForenseTR: number = 3;

    ngOnInit(): void {
        this.carregarTotaisEscalas();
        this.carregarPermutasAguardandoAutorizacao();
        this.carregarPermutasPendentesParaMagistrado();
        this.carregaEscalasQueFazemParteDoSaldoAtual();
    }

    private carregaEscalasQueFazemParteDoSaldoAtual() {
        this.inscricaoService.consultaEscalasQueFazemParteDoSaldoAtual().subscribe({
            next: (escalas: Escala[]) => {
                this.escalasQueFazemParteDoSaldo = escalas;
                console.log(this.escalasQueFazemParteDoSaldo);
            }
        });
    }

    ngAfterViewInit(): void {
        // Aguardar os estilos CSS do PrimeNG serem carregados antes de inicializar os gráficos
        requestAnimationFrame(() => {
            setTimeout(() => {
                this._carregaGraficoMagistradosDesignadosConvocados();
                this._carregaGraficoJuizDireitoSubstituto();
            }, 200);
        });
    }

    private carregarTotaisEscalas() {
        // Buscar todas as escalas
        this.escalaService.listarEscalas().subscribe({
            next: (escalas: Escala[]) => {
                // Armazenar todas as escalas para os containers dinâmicos
                this.escalas = escalas;

                // Filtrar apenas escalas do tipo PRINCIPAL para o dropdown
                this.escalasPrincipais = escalas.filter((escala) => escala.tipo_escala_enum === 'PRINCIPAL');

                // Contar escalas que não tenham o status 'Concluída'
                this.totais.escalasAbertas = escalas.filter((escala) => escala.status_escala && escala.status_escala.sigla === 'INSCRICOES_ABERTAS').length;

                // Contar escalas que tenham o status 'Concluída' e sejam do tipo PRINCIPAL
                this.totais.escalasRealizadas = escalas.filter((escala) => escala.status_escala && escala.status_escala.sigla === 'CONCLUIDA' && escala.tipo_escala_enum === 'PRINCIPAL').length;

                // Carregar todas as vagas de todas as escalas
                this.carregarTodasAsVagas(escalas);

                // Recarregar alertas após carregar escalas
                this.carregarAlertas();
            },
            error: (error) => {
                console.error('Erro ao carregar escalas:', error);
            }
        });
    }

    private carregarTodasAsVagas(escalas: Escala[]) {
        this.todasAsVagas = [];
        this.vagasPorEscala = {};

        // Carregar vagas de cada escala
        escalas.forEach((escala) => {
            this.vagaService.getByEscala(escala.id).subscribe({
                next: (vagas: Vaga[]) => {
                    if (vagas && vagas.length > 0) {
                        // Armazenar vagas por escala
                        this.vagasPorEscala[escala.id] = vagas;
                        // Manter total geral para o card principal
                        this.todasAsVagas = this.todasAsVagas.concat(vagas);
                    }
                },
                error: (error) => {
                    console.error(`Erro ao carregar vagas da escala ${escala.id}:`, error);
                }
            });
        });
    }

    getTotalVagasDesignadas(): string {
        if (!this.todasAsVagas || this.todasAsVagas.length === 0) {
            return '0/0';
        }

        let totalOcupadas = 0;
        let totalVagas = 0;

        // Calcular total de vagas de TODAS as vagas
        this.todasAsVagas.forEach((vaga) => {
            totalVagas += vaga.qtd_vaga_disponivel;
        });

        // Contar inscrições que ocupam vaga de TODAS as vagas
        this.todasAsVagas.forEach((vaga) => {
            if (vaga.inscricoes && vaga.inscricoes.length > 0) {
                const inscricoesQueContam = vaga.inscricoes.filter((inscricao) => this._inscricaoContaComoOcupacao(inscricao));
                totalOcupadas += inscricoesQueContam.length;
            }
        });

        return `${totalOcupadas}/${totalVagas}`;
    }

    navegarParaEscalasAbertas() {
        this.router.navigate(['/gc/lista-escala'], {
            queryParams: {
                filtro: 'abertas',
                status: 'nao-concluidas'
            }
        });
    }

    navegarParaEscalasRealizadas() {
        this.router.navigate(['/gc/lista-escala'], {
            queryParams: {
                filtro: 'realizadas',
                status: 'concluidas'
            }
        });
    }

    navegarParaPermutas() {
        this.router.navigate(['/gc/permutas']);
    }

    navegarParaMinhasPermutas() {
        this.router.navigate(['/magistrado/minhas-permutas']);
    }

    carregarPermutasAguardandoAutorizacao() {
        this.permutaService.consultarPermutasAguardandoAutorizacao().subscribe({
            next: (permutas) => {
                this.totais.permutasAguardandoAutorizacao = permutas.length;
            },
            error: (error) => {
                console.error('Erro ao carregar permutas aguardando autorização:', error);
            }
        });
    }

    carregarPermutasPendentesParaMagistrado() {
        this.permutaService.consultarPermutasPendentes().subscribe({
            next: (permutas) => {
                this.totais.permutasPendentesParaMagistrado = permutas.length;
            },
            error: (error) => {
                console.error('Erro ao carregar permutas pendentes para magistrado:', error);
            }
        });
    }

    edit(item: Escala) {
        this.router.navigate(['/gc/criar-escala'], {
            queryParams: {
                id: item.id,
                modo: 'editar'
            }
        });
    }

    deveExibirAlerta(): boolean {
        return this.alertas && this.alertas.length > 0;
    }

    private carregarAlertas() {
        // Limpar alertas existentes
        this.alertas = [];

        // Alerta: Escalas com inscrições abertas (sempre primeiro e destacado)
        const escalasInscricoesAbertas = this.escalas.filter((escala) => escala.status_escala?.sigla === 'INSCRICOES_ABERTAS');

        if (escalasInscricoesAbertas && escalasInscricoesAbertas.length > 0) {
            const quantidadeEscalas = escalasInscricoesAbertas.length;
            const mensagem = quantidadeEscalas === 1 ? 'Há 1 escala com inscrições abertas' : `Há ${quantidadeEscalas} escalas com inscrições abertas`;

            this.alertas.push({
                tipo: 'info',
                mensagem: mensagem,
                link: '/gc/lista-escala',
                icone: 'pi-calendar-plus',
                cor: 'blue-500',
                destacado: true
            });
        }

        // Alerta: Permutas aguardando ciência (status ACEITA)
        this.permutaService.consultarPermutasAguardandoAutorizacao().subscribe({
            next: (permutas) => {
                if (permutas && permutas.length > 0) {
                    const quantidadePermutas = permutas.length;
                    const mensagem = quantidadePermutas === 1 ? 'Há 1 permuta aguardando ciência' : `Há ${quantidadePermutas} permutas aguardando ciência`;

                    // Remover alerta duplicado se existir antes de adicionar
                    this.alertas = this.alertas.filter((a) => !(a.link === '/gc/permutas' && a.icone === 'pi-sync'));

                    this.alertas.push({
                        tipo: 'info',
                        mensagem: mensagem,
                        link: '/gc/permutas',
                        icone: 'pi-sync',
                        cor: 'orange-500'
                    });
                }
            },
            error: (error) => {
                console.error('Erro ao carregar permutas aguardando autorização:', error);
            }
        });

        // Alerta: Dispensas pendentes
        this.dispensaService.consultarPendentes().subscribe({
            next: (dispensas) => {
                if (dispensas && dispensas.length > 0) {
                    const quantidadeDispensas = dispensas.length;
                    const mensagem = quantidadeDispensas === 1 ? 'Há 1 dispensa pendente' : `Há ${quantidadeDispensas} dispensas pendentes`;

                    // Remover alerta duplicado se existir antes de adicionar
                    this.alertas = this.alertas.filter((a) => !(a.link === '/gc/dispensas' && a.icone === 'pi-chevron-circle-down'));

                    this.alertas.push({
                        tipo: 'info',
                        mensagem: mensagem,
                        link: '/gc/dispensas',
                        icone: 'pi-chevron-circle-down',
                        cor: 'purple-500'
                    });
                }
            },
            error: (error) => {
                console.error('Erro ao carregar dispensas pendentes:', error);
            }
        });
    }

    layoutService = inject(LayoutService);

    setSvg(path: string) {
        return `/layout/images/dashboard/${path}` + (this.layoutService.isDarkTheme() ? '-dark' : '') + '.svg';
    }

    private _inscricaoContaComoOcupacao(inscricao: any): boolean {
        const sigla = inscricao?.status?.sigla;
        return sigla === 'DESIGNADO' || sigla === 'CONV' || sigla === 'DESIG_SUBST' || sigla === 'CONV_SUBST' || sigla === 'PERMUTA';
    }

    getNomesEscalasPrincipais(): string[] {
        if (!this.escalasPrincipais || this.escalasPrincipais.length === 0) {
            return [];
        }
        return this.escalasPrincipais.map((escala) => escala.nome || 'Sem nome');
    }

    // Método auxiliar para verificar se uma escala é do tipo especificado
    private isTipoEscala(escala: Escala, siglaEsperada: string, nomesAlternativos: string[] = []): boolean {
        if (escala.tipo_escala?.sigla === siglaEsperada) {
            return true;
        }
        const nomeTipo = escala.tipo_escala?.nome?.toUpperCase() || '';
        return nomesAlternativos.some((nome) => nomeTipo.includes(nome.toUpperCase()));
    }

    // Método auxiliar para obter escalas de Plantão Semanal (concluídas)
    private getEscalasPlantaoSemanal(): Escala[] {
        if (!this.escalasPrincipais || this.escalasPrincipais.length === 0) {
            return [];
        }
        return this.escalasPrincipais.filter((escala) => {
            const statusOk = escala.status_escala?.sigla === 'CONCLUIDA';
            if (!statusOk) return false;

            // Verificar por sigla primeiro
            if (escala.tipo_escala?.sigla === 'PLANTAO_SEMANAL') {
                return true;
            }

            // Se não tiver sigla, verificar por nome
            const nomeTipo = escala.tipo_escala?.nome?.toUpperCase() || '';
            return nomeTipo.includes('PLANTÃO SEMANAL') || nomeTipo.includes('PLANTAO SEMANAL') || (nomeTipo.includes('PLANTÃO') && nomeTipo.includes('SEMANAL') && !nomeTipo.includes('FERIADO'));
        });
    }

    // Método auxiliar para obter escalas de Feriado Forense (concluídas)
    private getEscalasFeriadoForense(): Escala[] {
        if (!this.escalasPrincipais || this.escalasPrincipais.length === 0) {
            return [];
        }
        return this.escalasPrincipais.filter((escala) => {
            const statusOk = escala.status_escala?.sigla === 'CONCLUIDA';
            if (!statusOk) return false;

            // Verificar por sigla primeiro
            if (escala.tipo_escala?.sigla === 'PLANTAO_FERIADO_FORENSE') {
                // Garantir que não seja TR
                const nomeTipo = escala.tipo_escala?.nome?.toUpperCase() || '';
                return !nomeTipo.includes('TR');
            }

            // Se não tiver sigla, verificar por nome (mas excluir TR)
            const nomeTipo = escala.tipo_escala?.nome?.toUpperCase() || '';
            const temFeriadoForense = nomeTipo.includes('FERIADO') && nomeTipo.includes('FORENSE');
            const naoTemTR = !nomeTipo.includes('TR');
            return temFeriadoForense && naoTemTR;
        });
    }

    // Método auxiliar para obter escalas de Feriado Forense TR (concluídas)
    private getEscalasFeriadoForenseTR(): Escala[] {
        if (!this.escalasPrincipais || this.escalasPrincipais.length === 0) {
            return [];
        }
        return this.escalasPrincipais.filter((escala) => {
            const statusOk = escala.status_escala?.sigla === 'CONCLUIDA';
            if (!statusOk) return false;

            // Verificar por sigla primeiro
            if (escala.tipo_escala?.sigla === 'PLANTAO_FERIADO_FORENSE_TR') {
                return true;
            }

            // Se não tiver sigla, verificar por nome (deve conter TR)
            const nomeTipo = escala.tipo_escala?.nome?.toUpperCase() || '';
            const temFeriadoForense = nomeTipo.includes('FERIADO') && nomeTipo.includes('FORENSE');
            const temTR = nomeTipo.includes('TR');
            return temFeriadoForense && temTR;
        });
    }

    formatarData(data: string): string {
        if (!data) return '';
        try {
            // Se a data vem no formato YYYY-MM-DD, usar componentes diretamente para evitar problemas de timezone
            if (data.includes('T')) {
                // Formato ISO com hora
                const date = new Date(data);
                const dia = String(date.getDate()).padStart(2, '0');
                const mes = String(date.getMonth() + 1).padStart(2, '0');
                const ano = date.getFullYear();
                return `${dia}/${mes}/${ano}`;
            } else {
                // Formato YYYY-MM-DD (sem hora)
                const partes = data.split('-');
                if (partes.length === 3) {
                    const [ano, mes, dia] = partes;
                    return `${dia}/${mes}/${ano}`;
                }
                // Fallback para outros formatos
                const date = new Date(data + 'T12:00:00'); // Adiciona meio-dia para evitar problemas de timezone
                const dia = String(date.getDate()).padStart(2, '0');
                const mes = String(date.getMonth() + 1).padStart(2, '0');
                const ano = date.getFullYear();
                return `${dia}/${mes}/${ano}`;
            }
        } catch (error) {
            return data;
        }
    }

    truncarNomeEscala(nome: string, maxCaracteres: number = 18): string {
        if (!nome) return '';
        if (nome.length <= maxCaracteres) {
            return nome;
        }
        return nome.substring(0, maxCaracteres) + '...';
    }

    getNomesEscalasPrincipaisPaginados(): Array<{ nome: string; data_inicio: string }> {
        const escalasFiltradas = this.getEscalasPlantaoSemanal();
        if (escalasFiltradas.length === 0) {
            return [];
        }
        const inicio = (this.paginaPlantaoSemanal - 1) * this.itensPorPaginaPlantaoSemanal;
        const fim = inicio + this.itensPorPaginaPlantaoSemanal;
        return escalasFiltradas.slice(inicio, fim).map((escala) => ({
            nome: escala.nome || 'Sem nome',
            data_inicio: escala.data_inicio || ''
        }));
    }

    // Método para calcular altura dinâmica do card de Plantão Semanal
    getAlturaCardPlantaoSemanal(): string {
        const totalEscalas = this.getEscalasPlantaoSemanal().length;
        if (totalEscalas === 0) {
            return '150px'; // Altura mínima quando não há escalas
        }
        if (totalEscalas >= 3) {
            return '360px'; // Altura máxima quando há 3 ou mais escalas
        }
        // Altura base: header (60px) + padding (48px) = 108px
        // Cada item da timeline: ~60px
        const alturaBase = 108;
        const alturaPorItem = 60;
        const alturaTotal = alturaBase + totalEscalas * alturaPorItem;
        return `${alturaTotal}px`;
    }

    // Método para calcular altura dinâmica do card de Feriado Forense
    getAlturaCardFeriadoForense(): string {
        const totalEscalas = this.getEscalasFeriadoForense().length;
        if (totalEscalas === 0) {
            return '150px'; // Altura mínima quando não há escalas
        }
        if (totalEscalas >= 3) {
            return '360px'; // Altura máxima quando há 3 ou mais escalas
        }
        // Altura base: header (60px) + padding (48px) = 108px
        // Cada item da timeline: ~60px
        const alturaBase = 108;
        const alturaPorItem = 60;
        const alturaTotal = alturaBase + totalEscalas * alturaPorItem;
        return `${alturaTotal}px`;
    }

    // Método para calcular altura dinâmica do card de Feriado Forense TR
    getAlturaCardFeriadoForenseTR(): string {
        const totalEscalas = this.getEscalasFeriadoForenseTR().length;
        if (totalEscalas === 0) {
            return '150px'; // Altura mínima quando não há escalas
        }
        if (totalEscalas >= 3) {
            return '360px'; // Altura máxima quando há 3 ou mais escalas
        }
        // Altura base: header (60px) + padding (48px) = 108px
        // Cada item da timeline: ~60px
        const alturaBase = 108;
        const alturaPorItem = 60;
        const alturaTotal = alturaBase + totalEscalas * alturaPorItem;
        return `${alturaTotal}px`;
    }

    getTotalPaginasPlantaoSemanal(): number {
        const totalItens = this.getEscalasPlantaoSemanal().length;
        return Math.ceil(totalItens / this.itensPorPaginaPlantaoSemanal);
    }

    getIndiceInicialPagina(): number {
        return (this.paginaPlantaoSemanal - 1) * this.itensPorPaginaPlantaoSemanal;
    }

    podeIrParaProximaPaginaPlantaoSemanal(): boolean {
        return this.paginaPlantaoSemanal < this.getTotalPaginasPlantaoSemanal();
    }

    podeIrParaPaginaAnteriorPlantaoSemanal(): boolean {
        return this.paginaPlantaoSemanal > 1;
    }

    proximaPaginaPlantaoSemanal(): void {
        if (this.podeIrParaProximaPaginaPlantaoSemanal()) {
            this.paginaPlantaoSemanal++;
        }
    }

    paginaAnteriorPlantaoSemanal(): void {
        if (this.podeIrParaPaginaAnteriorPlantaoSemanal()) {
            this.paginaPlantaoSemanal--;
        }
    }

    // Métodos de paginação para Saldo Feriado Forense
    getNomesEscalasPrincipaisPaginadosFeriadoForense(): Array<{ nome: string; data_inicio: string }> {
        const escalasFiltradas = this.getEscalasFeriadoForense();
        if (escalasFiltradas.length === 0) {
            return [];
        }
        const inicio = (this.paginaFeriadoForense - 1) * this.itensPorPaginaFeriadoForense;
        const fim = inicio + this.itensPorPaginaFeriadoForense;
        return escalasFiltradas.slice(inicio, fim).map((escala) => ({
            nome: escala.nome || 'Sem nome',
            data_inicio: escala.data_inicio || ''
        }));
    }

    getTotalPaginasFeriadoForense(): number {
        const totalItens = this.getEscalasFeriadoForense().length;
        return Math.ceil(totalItens / this.itensPorPaginaFeriadoForense);
    }

    getIndiceInicialPaginaFeriadoForense(): number {
        return (this.paginaFeriadoForense - 1) * this.itensPorPaginaFeriadoForense;
    }

    podeIrParaProximaPaginaFeriadoForense(): boolean {
        return this.paginaFeriadoForense < this.getTotalPaginasFeriadoForense();
    }

    podeIrParaPaginaAnteriorFeriadoForense(): boolean {
        return this.paginaFeriadoForense > 1;
    }

    proximaPaginaFeriadoForense(): void {
        if (this.podeIrParaProximaPaginaFeriadoForense()) {
            this.paginaFeriadoForense++;
        }
    }

    paginaAnteriorFeriadoForense(): void {
        if (this.podeIrParaPaginaAnteriorFeriadoForense()) {
            this.paginaFeriadoForense--;
        }
    }

    // Métodos de paginação para Saldo Feriado Forense TR
    getNomesEscalasPrincipaisPaginadosFeriadoForenseTR(): Array<{ nome: string; data_inicio: string }> {
        const escalasFiltradas = this.getEscalasFeriadoForenseTR();
        if (escalasFiltradas.length === 0) {
            return [];
        }
        const inicio = (this.paginaFeriadoForenseTR - 1) * this.itensPorPaginaFeriadoForenseTR;
        const fim = inicio + this.itensPorPaginaFeriadoForenseTR;
        return escalasFiltradas.slice(inicio, fim).map((escala) => ({
            nome: escala.nome || 'Sem nome',
            data_inicio: escala.data_inicio || ''
        }));
    }

    getTotalPaginasFeriadoForenseTR(): number {
        const totalItens = this.getEscalasFeriadoForenseTR().length;
        return Math.ceil(totalItens / this.itensPorPaginaFeriadoForenseTR);
    }

    getIndiceInicialPaginaFeriadoForenseTR(): number {
        return (this.paginaFeriadoForenseTR - 1) * this.itensPorPaginaFeriadoForenseTR;
    }

    podeIrParaProximaPaginaFeriadoForenseTR(): boolean {
        return this.paginaFeriadoForenseTR < this.getTotalPaginasFeriadoForenseTR();
    }

    podeIrParaPaginaAnteriorFeriadoForenseTR(): boolean {
        return this.paginaFeriadoForenseTR > 1;
    }

    proximaPaginaFeriadoForenseTR(): void {
        if (this.podeIrParaProximaPaginaFeriadoForenseTR()) {
            this.paginaFeriadoForenseTR++;
        }
    }

    paginaAnteriorFeriadoForenseTR(): void {
        if (this.podeIrParaPaginaAnteriorFeriadoForenseTR()) {
            this.paginaFeriadoForenseTR--;
        }
    }

    private _obterCoresPrimary() {
        let primaryColorValue = '';
        try {
            const tempEl = document.createElement('div');
            tempEl.style.position = 'absolute';
            tempEl.style.visibility = 'hidden';
            tempEl.style.width = '1px';
            tempEl.style.height = '1px';
            tempEl.style.color = 'var(--p-primary-color)';
            if (document.body) {
                document.body.appendChild(tempEl);
                const computedColor = getComputedStyle(tempEl).color;
                document.body.removeChild(tempEl);
                if (computedColor && computedColor !== 'rgba(0, 0, 0, 0)' && computedColor !== 'transparent' && computedColor !== 'rgb(0, 0, 0)') {
                    primaryColorValue = this._rgbToHex(computedColor);
                }
            }
        } catch (e) {
            console.warn('Erro ao obter cor primary do PrimeNG:', e);
        }
        if (!primaryColorValue || primaryColorValue.trim() === '') {
            try {
                const tempEl = document.createElement('div');
                tempEl.style.position = 'absolute';
                tempEl.style.visibility = 'hidden';
                tempEl.style.width = '1px';
                tempEl.style.height = '1px';
                tempEl.style.color = 'var(--primary-color)';
                if (document.body) {
                    document.body.appendChild(tempEl);
                    const computedColor = getComputedStyle(tempEl).color;
                    document.body.removeChild(tempEl);
                    if (computedColor && computedColor !== 'rgba(0, 0, 0, 0)' && computedColor !== 'transparent' && computedColor !== 'rgb(0, 0, 0)') {
                        primaryColorValue = this._rgbToHex(computedColor);
                    }
                }
            } catch (e) {
                console.warn('Erro ao resolver cor primary:', e);
            }
        }
        let primaryColor = primaryColorValue.trim() || '#3b82f6';
        if (!primaryColor.startsWith('#')) {
            if (primaryColor.startsWith('rgb')) {
                primaryColor = this._rgbToHex(primaryColor);
            } else {
                primaryColor = '#3b82f6';
            }
        }
        const primaryColorLight = this._lightenColor(primaryColor, 25);
        const primaryColorLighter = this._lightenColor(primaryColor, 50);
        return {
            primary: primaryColor,
            primaryLight: primaryColorLight,
            primaryLighter: primaryColorLighter
        };
    }

    private _rgbToHex(rgb: string): string {
        const match = rgb.match(/\d+/g);
        if (match && match.length >= 3) {
            const r = parseInt(match[0]).toString(16).padStart(2, '0');
            const g = parseInt(match[1]).toString(16).padStart(2, '0');
            const b = parseInt(match[2]).toString(16).padStart(2, '0');
            return '#' + r + g + b;
        }
        return '#3b82f6';
    }

    private _lightenColor(color: string, percent: number): string {
        const c = color.trim().toLowerCase();
        if (!c.startsWith('#')) {
            if (c.startsWith('rgb')) {
                return this._rgbToHex(c);
            }
            return color;
        }
        const num = parseInt(c.replace('#', ''), 16);
        const r = (num >> 16) + Math.round(percent * 2.55);
        const g = ((num >> 8) & 0x00ff) + Math.round(percent * 2.55);
        const b = (num & 0x0000ff) + Math.round(percent * 2.55);
        const newR = Math.min(255, Math.max(0, r));
        const newG = Math.min(255, Math.max(0, g));
        const newB = Math.min(255, Math.max(0, b));
        return '#' + ((1 << 24) + (newR << 16) + (newG << 8) + newB).toString(16).slice(1);
    }

    private _carregaGraficoMagistradosDesignadosConvocados() {
        this.escalaService.listarEscalas().subscribe({
            next: (escalas) => {
                const escalasParaGrafico = escalas
                    .filter((e) => e.status_escala?.sigla != 'INSCRICOES_ABERTAS' && e.tipo_escala_enum === 'PRINCIPAL')
                    .sort((a, b) => {
                        const dataA = new Date(a.data_inicio!).getTime();
                        const dataB = new Date(b.data_inicio!).getTime();
                        return dataB - dataA;
                    })
                    .slice(0, 5);
                if (!escalasParaGrafico || escalasParaGrafico.length === 0) {
                    this._inicializarGraficoVazio();
                    return;
                }
                const requests = escalasParaGrafico.map((escala) =>
                    forkJoin({
                        escala: of(escala),
                        designadas: this.vagaService.consultarDesignada(escala.id!).pipe(catchError(() => of([]))),
                        convocadas: this.vagaService.consultaConvocados(escala.id!).pipe(catchError(() => of([])))
                    })
                );
                forkJoin(requests).subscribe({
                    next: (results) => {
                        const labelsEscalas: string[] = [];
                        const nomesCompletosEscalas: string[] = [];
                        const magistradosDesignados: number[] = [];
                        const magistradosConvocados: number[] = [];
                        results.forEach((result) => {
                            const nomeCompleto = result.escala.nome || '';
                            nomesCompletosEscalas.push(nomeCompleto);
                            labelsEscalas.push(this.truncarNomeEscala(nomeCompleto));
                            const magistradosDesignadosSet = new Set<number>();
                            if (result.designadas && Array.isArray(result.designadas)) {
                                result.designadas.forEach((vaga: any) => {
                                    if (vaga.inscricoes && Array.isArray(vaga.inscricoes)) {
                                        vaga.inscricoes.forEach((inscricao: any) => {
                                            if (inscricao.magistrado?.id && (inscricao.status?.sigla === 'DESIGNADO' || inscricao.status?.sigla === 'DESIG_SUBST')) {
                                                magistradosDesignadosSet.add(inscricao.magistrado.id);
                                            }
                                        });
                                    }
                                });
                            }
                            magistradosDesignados.push(magistradosDesignadosSet.size);
                            const magistradosConvocadosSet = new Set<number>();
                            if (result.convocadas && Array.isArray(result.convocadas)) {
                                result.convocadas.forEach((vaga: any) => {
                                    if (vaga.inscricoes && Array.isArray(vaga.inscricoes)) {
                                        vaga.inscricoes.forEach((inscricao: any) => {
                                            if (inscricao.magistrado?.id && (inscricao.status?.sigla === 'CONV' || inscricao.status?.sigla === 'CONV_SUBST')) {
                                                magistradosConvocadosSet.add(inscricao.magistrado.id);
                                            }
                                        });
                                    }
                                });
                            }
                            magistradosConvocados.push(magistradosConvocadosSet.size);
                        });
                        this._construirGraficoMagistrados(labelsEscalas, nomesCompletosEscalas, magistradosDesignados, magistradosConvocados);
                    },
                    error: (error) => {
                        console.error('Erro ao carregar dados do gráfico de magistrados:', error);
                        this._inicializarGraficoVazio();
                    }
                });
            },
            error: (error) => {
                console.error('Erro ao carregar escalas:', error);
                this._inicializarGraficoVazio();
            }
        });
    }

    private _construirGraficoMagistrados(labels: string[], nomesCompletos: string[], designados: number[], convocados: number[]) {
        const documentStyle = getComputedStyle(document.documentElement);
        const textColor = documentStyle.getPropertyValue('--text-color');
        const textColorSecondary = documentStyle.getPropertyValue('--text-color-secondary');
        const surfaceBorder = documentStyle.getPropertyValue('--surface-border');
        const primaryColors = this._obterCoresPrimary();
        this.magistradosDesignadosConvocadosData = {
            labels: labels,
            datasets: [
                {
                    label: 'Designados',
                    backgroundColor: primaryColors.primary,
                    borderColor: primaryColors.primary,
                    data: designados
                },
                {
                    label: 'Convocados',
                    backgroundColor: primaryColors.primaryLight,
                    borderColor: primaryColors.primaryLight,
                    data: convocados
                }
            ]
        };
        this.magistradosDesignadosConvocadosOptions = {
            plugins: {
                legend: {
                    labels: {
                        color: textColor
                    }
                },
                tooltip: {
                    callbacks: {
                        title: (context: any) => {
                            const index = context[0].dataIndex;
                            return nomesCompletos[index] || labels[index] || '';
                        },
                        label: function (context: any) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                label += context.parsed.y + ' magistrado(s)';
                            }
                            return label;
                        }
                    }
                }
            },
            scales: {
                x: {
                    stacked: true,
                    ticks: {
                        color: textColorSecondary,
                        font: {
                            weight: 500
                        }
                    },
                    grid: {
                        display: false,
                        drawBorder: false
                    }
                },
                y: {
                    stacked: true,
                    ticks: {
                        color: textColorSecondary,
                        stepSize: 1
                    },
                    grid: {
                        color: surfaceBorder,
                        drawBorder: false
                    }
                }
            },
            maintainAspectRatio: false
        };
    }

    private _inicializarGraficoVazio() {
        const documentStyle = getComputedStyle(document.documentElement);
        const textColor = documentStyle.getPropertyValue('--text-color');
        const textColorSecondary = documentStyle.getPropertyValue('--text-color-secondary');
        const surfaceBorder = documentStyle.getPropertyValue('--surface-border');
        const primaryColors = this._obterCoresPrimary();
        this.magistradosDesignadosConvocadosData = {
            labels: ['Sem dados'],
            datasets: [
                {
                    label: 'Designados',
                    backgroundColor: primaryColors.primary,
                    borderColor: primaryColors.primary,
                    data: [0]
                },
                {
                    label: 'Convocados',
                    backgroundColor: primaryColors.primaryLight,
                    borderColor: primaryColors.primaryLight,
                    data: [0]
                }
            ]
        };
        this.magistradosDesignadosConvocadosOptions = {
            plugins: {
                legend: {
                    labels: {
                        color: textColor
                    }
                }
            },
            scales: {
                x: {
                    stacked: true,
                    ticks: {
                        color: textColorSecondary,
                        font: {
                            weight: 500
                        }
                    },
                    grid: {
                        display: false,
                        drawBorder: false
                    }
                },
                y: {
                    stacked: true,
                    ticks: {
                        color: textColorSecondary,
                        stepSize: 1
                    },
                    grid: {
                        color: surfaceBorder,
                        drawBorder: false
                    }
                }
            },
            maintainAspectRatio: false
        };
    }

    private _carregaGraficoJuizDireitoSubstituto() {
        this.escalaService.listarEscalas().subscribe({
            next: (escalas) => {
                const escalasParaGrafico = escalas
                    .filter((e) => e.status_escala?.sigla != 'INSCRICOES_ABERTAS' && e.tipo_escala_enum === 'PRINCIPAL')
                    .sort((a, b) => {
                        const dataA = new Date(a.data_inicio!).getTime();
                        const dataB = new Date(b.data_inicio!).getTime();
                        return dataB - dataA;
                    })
                    .slice(0, 5);
                if (!escalasParaGrafico || escalasParaGrafico.length === 0) {
                    this._inicializarGraficoJuizVazio();
                    return;
                }
                const requests = escalasParaGrafico.map((escala) =>
                    forkJoin({
                        escala: of(escala),
                        designadas: this.vagaService.consultarDesignada(escala.id!).pipe(catchError(() => of([]))),
                        convocadas: this.vagaService.consultaConvocados(escala.id!).pipe(catchError(() => of([])))
                    })
                );
                forkJoin(requests).subscribe({
                    next: (results) => {
                        const labelsEscalas: string[] = [];
                        const nomesCompletosEscalas: string[] = [];
                        const juizesDireito: number[] = [];
                        const juizesSubstitutos: number[] = [];
                        results.forEach((result) => {
                            const nomeCompleto = result.escala.nome || '';
                            nomesCompletosEscalas.push(nomeCompleto);
                            labelsEscalas.push(this.truncarNomeEscala(nomeCompleto));
                            const magistradosDireitoSet = new Set<number>();
                            const magistradosSubstitutosSet = new Set<number>();
                            if (result.designadas && Array.isArray(result.designadas)) {
                                result.designadas.forEach((vaga: any) => {
                                    if (vaga.inscricoes && Array.isArray(vaga.inscricoes)) {
                                        vaga.inscricoes.forEach((inscricao: any) => {
                                            if (inscricao.magistrado?.id && (inscricao.status?.sigla === 'DESIGNADO' || inscricao.status?.sigla === 'DESIG_SUBST')) {
                                                const tipoJuiz = inscricao.magistrado?.tipo_juiz?.descricao?.toLowerCase() || '';
                                                if (tipoJuiz.includes('direito')) {
                                                    magistradosDireitoSet.add(inscricao.magistrado.id);
                                                } else if (tipoJuiz.includes('substitut')) {
                                                    magistradosSubstitutosSet.add(inscricao.magistrado.id);
                                                }
                                            }
                                        });
                                    }
                                });
                            }
                            if (result.convocadas && Array.isArray(result.convocadas)) {
                                result.convocadas.forEach((vaga: any) => {
                                    if (vaga.inscricoes && Array.isArray(vaga.inscricoes)) {
                                        vaga.inscricoes.forEach((inscricao: any) => {
                                            if (inscricao.magistrado?.id && (inscricao.status?.sigla === 'CONV' || inscricao.status?.sigla === 'CONV_SUBST')) {
                                                const tipoJuiz = inscricao.magistrado?.tipo_juiz?.descricao?.toLowerCase() || '';
                                                if (tipoJuiz.includes('direito')) {
                                                    magistradosDireitoSet.add(inscricao.magistrado.id);
                                                } else if (tipoJuiz.includes('substitut')) {
                                                    magistradosSubstitutosSet.add(inscricao.magistrado.id);
                                                }
                                            }
                                        });
                                    }
                                });
                            }
                            juizesDireito.push(magistradosDireitoSet.size);
                            juizesSubstitutos.push(magistradosSubstitutosSet.size);
                        });
                        this._construirGraficoJuizDireitoSubstituto(labelsEscalas, nomesCompletosEscalas, juizesDireito, juizesSubstitutos);
                    },
                    error: (error) => {
                        console.error('Erro ao carregar dados do gráfico de juízes:', error);
                        this._inicializarGraficoJuizVazio();
                    }
                });
            },
            error: (error) => {
                console.error('Erro ao carregar escalas:', error);
                this._inicializarGraficoJuizVazio();
            }
        });
    }

    private _construirGraficoJuizDireitoSubstituto(labels: string[], nomesCompletos: string[], direito: number[], substitutos: number[]) {
        const documentStyle = getComputedStyle(document.documentElement);
        const textColor = documentStyle.getPropertyValue('--text-color');
        const textColorSecondary = documentStyle.getPropertyValue('--text-color-secondary');
        const surfaceBorder = documentStyle.getPropertyValue('--surface-border');
        const primaryColors = this._obterCoresPrimary();
        this.juizDireitoSubstitutoRealData = {
            labels: labels,
            datasets: [
                {
                    label: 'Juiz de Direito',
                    backgroundColor: primaryColors.primary,
                    borderColor: primaryColors.primary,
                    data: direito
                },
                {
                    label: 'Juiz Substituto',
                    backgroundColor: primaryColors.primaryLighter,
                    borderColor: primaryColors.primaryLighter,
                    data: substitutos
                }
            ]
        };
        this.juizDireitoSubstitutoRealOptions = {
            plugins: {
                legend: {
                    labels: {
                        color: textColor
                    }
                },
                tooltip: {
                    callbacks: {
                        title: (context: any) => {
                            const index = context[0].dataIndex;
                            return nomesCompletos[index] || labels[index] || '';
                        },
                        label: function (context: any) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                label += context.parsed.y + ' magistrado(s)';
                            }
                            return label;
                        }
                    }
                }
            },
            scales: {
                x: {
                    ticks: {
                        color: textColorSecondary,
                        font: {
                            weight: 500
                        }
                    },
                    grid: {
                        display: false,
                        drawBorder: false
                    }
                },
                y: {
                    ticks: {
                        color: textColorSecondary,
                        stepSize: 1
                    },
                    grid: {
                        color: surfaceBorder,
                        drawBorder: false
                    }
                }
            },
            maintainAspectRatio: false
        };
    }

    private _inicializarGraficoJuizVazio() {
        const documentStyle = getComputedStyle(document.documentElement);
        const textColor = documentStyle.getPropertyValue('--text-color');
        const textColorSecondary = documentStyle.getPropertyValue('--text-color-secondary');
        const surfaceBorder = documentStyle.getPropertyValue('--surface-border');
        const primaryColors = this._obterCoresPrimary();
        this.juizDireitoSubstitutoRealData = {
            labels: ['Sem dados'],
            datasets: [
                {
                    label: 'Juiz de Direito',
                    backgroundColor: primaryColors.primary,
                    borderColor: primaryColors.primary,
                    data: [0]
                },
                {
                    label: 'Juiz Substituto',
                    backgroundColor: primaryColors.primaryLighter,
                    borderColor: primaryColors.primaryLighter,
                    data: [0]
                }
            ]
        };
        this.juizDireitoSubstitutoRealOptions = {
            plugins: {
                legend: {
                    labels: {
                        color: textColor
                    }
                }
            },
            scales: {
                x: {
                    ticks: {
                        color: textColorSecondary,
                        font: {
                            weight: 500
                        }
                    },
                    grid: {
                        display: false,
                        drawBorder: false
                    }
                },
                y: {
                    ticks: {
                        color: textColorSecondary,
                        stepSize: 1
                    },
                    grid: {
                        color: surfaceBorder,
                        drawBorder: false
                    }
                }
            },
            maintainAspectRatio: false
        };
    }
}
