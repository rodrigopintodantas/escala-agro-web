export class RegraNegocioService {
    static recuperaSiglasSubstituicao() {
        return ['CANC_SUBST'];
    }
    static recuperaSiglasConvocacao() {
        return ['CONV', 'CONV_SUBST'];
    }
    static recuperaSiglasDesignacao() {
        return ['DESIGNADO', 'DESIG_SUBST'];
    }
}
