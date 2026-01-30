
// Types definitions based on Diagnósticos do Brasil (DB) Integration Manual v2.0

export interface DBConfig {
    codigoApoiado: string;
    senhaIntegracao: string;
    ambiente: 'producao' | 'homologacao';
}

export interface DBPaciente {
    DataHoraPaciente: string; // YYYY-MM-DD
    NomePaciente: string;
    NumeroCartaoNacionalSaude?: string;
    NumeroCPF?: string;
    RGPacienteApoiado?: string;
    SexoPaciente: 'M' | 'F' | 'I';
}

export interface DBProcedimento {
    CodigoExameDB: string; // Ex: GLI, HEMO
    DescricaoRegiaoColeta?: string;
    VolumeUrinario?: string;
    CodigoMPP?: 'CTP' | 'CDP'; // Cancelamento Temporário/Definitivo
}

export interface DBQuestionario {
    CodigoPerguntaQuestionario: string;
    RespostaQuestionario: string;
}

export interface DBSolicitante {
    NomeSolicitante: string;
    CodigoConselho: string; // CRM, COREN...
    CodigoUFConselhoSolicitante: string;
    CodigoConselhoSolicitante: string; // Número do CRM
}

export interface DBPedido {
    NumeroAtendimentoApoiado: string; // ID local único
    CodigoPrioridade?: 'R' | 'U'; // R=Rotina, U=Urgencia
    DescricaoDadosClinicos?: string;
    DescricaoMedicamentos?: string;
    Altura?: number;
    Peso?: number;
    ListaPacienteApoiado: DBPaciente;
    ListaProcedimento: DBProcedimento[];
    ListaSolicitante?: DBSolicitante[];
    ListaQuestionarios?: DBQuestionario[];
}

export interface DBRecebeAtendimentoResult {
    StatusLote: {
        NumeroLote: string;
        Pedidos: {
            NomePaciente: string;
            NumeroAtendimentoDB: string;
            NumeroAtendimentoApoiado: string;
            Procedimentos: {
                CodigoExameDB: string;
                DescricaoExame: string;
                Material: string;
            }[];
        }[];
    };
    Confirmacao?: {
        ConfirmacaoPedidov2: {
            ct_ConfirmacaoPedidoEtiqueta_v2: {
                NumeroAtendimentoDB: string;
                Status: string;
                Amostras: {
                    NumeroAmostra: string;
                    EtiquetaAmostra: string; // Script ZPL/EPL
                    Exames: string;
                    Material: string;
                }[];
            }[];
        };
    };
}
