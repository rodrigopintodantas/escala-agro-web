export class UtilArray {
    // 0h às 12h - exemplo
    static ordenarFaixaDeHorarios(arr: any[]) {
        return arr.sort((a, b) => {
            const [inicioA, fimA] = a.split(' à ');
            const [inicioB, fimB] = b.split(' à ');

            const comparacaoInicio = UtilArray.compararHorarios(inicioA, inicioB);
            if (comparacaoInicio !== 0) {
                return comparacaoInicio;
            }

            return UtilArray.compararHorarios(fimA, fimB);
        });
    }

    static compararHorarios(horarioA: string, horarioB: string): number {
        // Se algum horário for 'N/A', colocar no final
        if (horarioA === 'N/A' && horarioB === 'N/A') return 0;
        if (horarioA === 'N/A') return 1;
        if (horarioB === 'N/A') return -1;

        // Extrair números dos horários (ex: "0h" -> 0, "12h" -> 12, "24h" -> 24)
        const numeroA = parseInt(horarioA.replace('h', ''));
        const numeroB = parseInt(horarioB.replace('h', ''));

        return numeroA - numeroB;
    }
}
