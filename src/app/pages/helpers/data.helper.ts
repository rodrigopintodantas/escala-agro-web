// import moment from "moment";

export class DataHelper {
    // static getDataMesAnterior(date: Date) {
    //     moment(date).add('months', -1);
    // }
    static formataData(date: Date) {
        let dia = date.getDate().toString().padStart(2, '0');
        let mes = (date.getMonth() + 1).toString().padStart(2, '0');
        let ano = date.getFullYear();
        return `${dia}/${mes}/${ano}`;
    }

    static converterParaDate(dataString: string | null | undefined): Date {
        return dataString ? new Date(dataString) : new Date();
    }

    static formataDataHora(date: Date) {
        if (date) {
            let dia = date.getDate().toString().padStart(2, '0');
            let mes = (date.getMonth() + 1).toString().padStart(2, '0');
            let ano = date.getFullYear();
            let hora = date.getHours().toString().padStart(2, '0');
            let minuto = date.getMinutes().toString().padStart(2, '0');
            let segundo = date.getSeconds().toString().padStart(2, '0');
            return `${dia}/${mes}/${ano} ${hora}:${minuto}:${segundo}`;
        }
        return null;
    }

    static getAnoAtual() {
        let date = new Date();
        return date.getFullYear();
    }

    static getAnoDaData(ano: string) {
        let date = new Date(ano);
        return date.getFullYear();
    }

    static getReferenciaDaData(date: Date) {
        let mes = (date.getMonth() + 1).toString().padStart(2, '0');
        let ano = date.getFullYear();
        return `${mes}/${ano}`;
    }

    static getReferenciaParaOrdenacao(date: string | undefined) {
        if (date != undefined) {
            date = date.padStart(7, '0');
            let part = date.split('/');
            return part[1] + part[0];
        }
        return '';
    }

    static getReferenciaPadding(date: string) {
        return date.padStart(7, '0');
    }

    static formataDataTexto(date: string) {
        let data = new Date(date);
        let dia = data.getDate().toString().padStart(2, '0');
        let mes = (data.getMonth() + 1).toString().padStart(2, '0');
        let ano = data.getFullYear();
        return `${dia}/${mes}/${ano}`;
    }

    static formataDataHoraBanco(date: Date) {
        let dia = date.getDate().toString().padStart(2, '0');
        let mes = (date.getMonth() + 1).toString().padStart(2, '0');
        let ano = date.getFullYear();
        let hora = date.getHours();
        let minuto = date.getMinutes();
        let segundo = date.getSeconds();
        return `${ano}-${mes}-${dia}T${hora}:${minuto}:${segundo}.000Z`;
    }

    static getNumDays(startDate: Date, endDate: Date) {
        var numWorkDays = 0;
        var currentDate = new Date(startDate);
        currentDate.setDate(currentDate.getDate() + 1);
        while (currentDate < endDate) {
            // // Skips Sunday and Saturday
            // if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6) {
            //   numWorkDays++;
            // }
            numWorkDays++;
            currentDate.setDate(currentDate.getDate() + 1);
        }
        return numWorkDays;
    }

    static getWorkNumDays(startDate: Date, endDate: Date) {
        var numWorkDays = 0;
        var currentDate = new Date(startDate);
        currentDate.setDate(currentDate.getDate() + 1);
        while (currentDate < endDate) {
            // Skips Sunday and Saturday
            if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6) {
                numWorkDays++;
            }

            currentDate.setDate(currentDate.getDate() + 1);
        }
        return numWorkDays;
    }

    static converterStringParaDate(dateString: string): Date {
        const [ano, mes, dia] = dateString.split('-').map(Number);
        return new Date(ano, mes - 1, dia);
    }
    // static getNumeroDeMesesEntreDatas(startDate: Date, endDate: Date) {
    //     const inicio = moment(startDate); // Data de hoje
    //     const fim = moment(endDate); // Outra data no passado
    //     const duration = moment.duration(fim.diff(inicio));

    //     // Mostra a diferença em dias
    //     return Math.floor(duration.asMonths());
    // }
}
