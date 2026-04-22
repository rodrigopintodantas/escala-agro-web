import { DataHelper } from './data.helper';

export class FiltroHelper {
    static tipos = [
        { label: 'Normal', value: 'Normal' },
        { label: 'Grande Volume', value: 'Grande Volume' },
        { label: 'Não Informado', value: 'Não Informado' }
    ];

    static nucleoFiltro = [
        { label: '--', value: '--' },
        { label: 'Núcleo 1', value: '1' },
        { label: 'Núcleo 2', value: '2' },
        { label: 'Núcleo 3', value: '3' },
        { label: 'Núcleo 4', value: '4' },
        { label: 'Núcleo 5', value: '5' },
        { label: 'Núcleo 6', value: '6' }
    ];

    static prioridades = [
        { label: 'Prioridade', value: true },
        { label: 'Sem prioridade', value: false }
    ];

    static apensos = [
        { label: 'Sim', value: true },
        { label: 'Não', value: false }
    ];

    static distribuido = [
        { label: 'Sim', value: 'Sim' },
        { label: 'Não', value: 'Não' }
    ];

    static montaCombo(lista: any[], propriedade: any) {
        let distinct = [];
        for (var i = 0; i < lista.length; i++) {
            let ja = distinct.find((d) => d.value == lista[i][propriedade]);
            if (!ja) {
                distinct.push({ label: lista[i][propriedade], value: lista[i][propriedade], ordenador: lista[i][propriedade] });
            }
        }
        return distinct.sort((a, b) => (a.ordenador > b.ordenador ? 1 : -1));
    }

    // static montaComboReferencia(lista: any[], propriedade: any, ordenador: any) {
    //     let distinct = [];
    //     for (var i = 0; i < lista.length; i++) {
    //         let ja = distinct.find((d) => d.value == lista[i][propriedade]);
    //         if (!ja) {
    //             distinct.push({ label: lista[i][propriedade], value: lista[i][propriedade], ordenador: parseInt(lista[i][ordenador]) });
    //         }
    //     }
    //     return distinct.sort((a, b) => (parseInt(a[ordenador]) < parseInt(b[ordenador]) ? 1 : -1));
    // }

    static montaComboNumero(lista: any[], propriedade: any) {
        let distinct = [];
        for (var i = 0; i < lista.length; i++) {
            let ja = distinct.find((d) => d.value == lista[i][propriedade]);
            if (!ja) {
                distinct.push({ label: lista[i][propriedade], value: lista[i][propriedade], ordenador: lista[i][propriedade] });
            }
        }
        return distinct.sort((a, b) => (parseInt(a.ordenador) > parseInt(b.ordenador) ? 1 : -1));
    }

    static montaComboComId(lista: any[], propriedade: any, id: any) {
        let distinct = [];
        for (var i = 0; i < lista.length; i++) {
            let ja = distinct.find((d) => d.value == lista[i][id]);
            if (!ja) {
                distinct.push({ label: lista[i][propriedade], value: lista[i][id], ordenador: lista[i][propriedade] });
            }
        }
        return distinct.sort((a, b) => (a.ordenador > b.ordenador ? 1 : -1));
    }

    static montaComboData(lista: any[], propriedade: any) {
        let distinct = [];
        for (var i = 0; i < lista.length; i++) {
            let dtp = DataHelper.formataData(new Date(lista[i][propriedade]));
            if (lista[i][propriedade]) {
                let ja = distinct.find((d) => d.label == dtp);
                if (!ja) {
                    distinct.push({ label: dtp, value: dtp, dateBanco: lista[i][propriedade] });
                }
            }
        }
        return distinct.sort((a, b) => (new Date(a.dateBanco) < new Date(b.dateBanco) ? 1 : -1));
    }

    static comboDeOj(processos: any[]) {
        let distinct = [];
        for (var i = 0; i < processos.length; i++) {
            let ja = distinct.find((d) => d.value == processos[i].OrgaoJulgador.descricao);
            if (!ja) {
                distinct.push({ label: processos[i].OrgaoJulgador.descricao, value: processos[i].OrgaoJulgador.descricao, ordenador: processos[i].OrgaoJulgador.descricaooa });
            }
        }
        return distinct.sort((a, b) => (a.ordenador > b.ordenador ? 1 : -1));
    }

    static comboDeOjPeloAndamento(andamentos: any[]) {
        let distinct = [];

        for (var i = 0; i < andamentos.length; i++) {
            let descricao = andamentos[i].Processo && andamentos[i].Processo.OrgaoJulgador ? andamentos[i].Processo.OrgaoJulgador.descricao : 'Sem OJ Cadastrado';
            let ja = distinct.find((d) => d.value == descricao);
            if (!ja) {
                distinct.push({ label: descricao, value: descricao, ordenador: descricao });
            }
        }
        return distinct.sort((a, b) => (a.ordenador > b.ordenador ? 1 : -1));
    }

    static comboJurisdicao(processos: any[]) {
        let distinct = [];
        for (var i = 0; i < processos.length; i++) {
            if (processos[i].Jurisdicao) {
                let ja = distinct.find((d) => d.value == processos[i].Jurisdicao.descricao);
                if (!ja) {
                    distinct.push({ label: processos[i].Jurisdicao.descricao, value: processos[i].Jurisdicao.descricao });
                }
            }
        }
        return distinct.sort((a, b) => (a.value > b.value ? 1 : -1));
    }

    static comboRequisicao(lista: any[]) {
        let distinct = [];
        for (var i = 0; i < lista.length; i++) {
            if (lista[i].Processo.Quantitativo) {
                let dtp = lista[i].Processo.Quantitativo.descricao;
                let ja = distinct.find((d) => d.value == dtp);
                if (!ja) {
                    distinct.push({ label: dtp, value: dtp });
                }
            } else {
                let ja = distinct.find((d) => d.value == '--');
                if (!ja) {
                    distinct.push({ label: '--', value: '--' });
                }
            }
        }
        return distinct.sort((a, b) => (a.value > b.value ? 1 : -1));
    }

    static comboReferencia(andamentos: any[]) {
        let distinct = [];
        for (var i = 0; i < andamentos.length; i++) {
            if (andamentos[i].referencia) {
                let ja = distinct.find((d) => d.value == andamentos[i].referencia);
                if (!ja) {
                    distinct.push({ label: andamentos[i].referencia, value: andamentos[i].referencia });
                }
            }
        }
        return distinct.sort((a, b) => (a.value > b.value ? 1 : -1));
    }

    static comboDataDoAndamento(andamentos: any[]) {
        let distinct = [];
        for (var i = 0; i < andamentos.length; i++) {
            let dtp = andamentos[i].dataFormatada;
            if (andamentos[i].dataFormatada) {
                let ja = distinct.find((d) => d.value == dtp);
                if (!ja) {
                    distinct.push({ label: dtp, value: dtp });
                }
            }
        }
        return distinct.sort((a, b) => (a.value > b.value ? 1 : -1));
    }

    static comboTipoAndamentoDescricao(andamentos: any[]) {
        let distinct = [];
        for (var i = 0; i < andamentos.length; i++) {
            let dtp = andamentos[i].TipoAndamento.nome;
            if (andamentos[i].TipoAndamento.nome) {
                let ja = distinct.find((d) => d.value == dtp);
                if (!ja) {
                    distinct.push({ label: dtp, value: dtp });
                }
            }
        }
        return distinct.sort((a, b) => (a.value > b.value ? 1 : -1));
    }

    static comboTipoAndamentoCodigo(andamentos: any[]) {
        let distinct = [];
        for (var i = 0; i < andamentos.length; i++) {
            if (andamentos[i] && andamentos[i].TipoAndamento) {
                let dtp = andamentos[i].TipoAndamento.codigo;
                let ja = distinct.find((d) => d.value == dtp);
                if (!ja) {
                    distinct.push({ label: dtp, value: dtp });
                }
            }
        }
        return distinct.sort((a, b) => (a.value > b.value ? 1 : -1));
    }

    static comboTipoAto(andamentos: any[]) {
        let distinct = [];
        for (var i = 0; i < andamentos.length; i++) {
            let dtp = andamentos[i].TipoAndamento.TipoSentenca.descricao;
            if (andamentos[i].TipoAndamento.TipoSentenca.descricao) {
                let ja = distinct.find((d) => d.value == dtp);
                if (!ja) {
                    distinct.push({ label: dtp, value: dtp });
                }
            }
        }
        return distinct.sort((a, b) => (a.value > b.value ? 1 : -1));
    }
}
