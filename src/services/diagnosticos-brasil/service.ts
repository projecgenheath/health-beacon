
import { DBPedido, DBConfig, DBProcedimento, DBPaciente } from './types';
import { supabase } from '@/integrations/supabase/client';

// Simple mapping for demo purposes. In a real app, this should be in a database table.
const EXAM_TYPE_MAPPING: Record<string, string> = {
    'Hemograma Completo': 'HEMO',
    'Glicemia': 'GLI',
    'Colesterol Total': 'COL',
    'TSH': 'TSH',
    'Urea': 'URE',
    'Creatinina': 'CRE',
    // Add more mappings as needed
};

export class DiagnosticosBrasilService {
    private config: DBConfig;

    constructor(config: DBConfig) {
        this.config = config;
    }

    /**
     * Converts a Health Beacon exam request to the DB XML format.
     * Note: This function generates the XML body. 
     * In a real scenario, this should be sent to a Supabase Edge Function to avoid CORS and hide credentials.
     */
    public generateRecebeAtendimentoXML(pedido: DBPedido): string {
        const procedimentosXML = pedido.ListaProcedimento.map(proc => `
                  <ct_Procedimento_v2>
                     <CodigoExameDB>${proc.CodigoExameDB}</CodigoExameDB>
                     <DescricaoRegiaoColeta>${proc.DescricaoRegiaoColeta || ''}</DescricaoRegiaoColeta>
                     <VolumeUrinario>${proc.VolumeUrinario || ''}</VolumeUrinario>
                  </ct_Procedimento_v2>`).join('');

        const solicitantesXML = pedido.ListaSolicitante ? pedido.ListaSolicitante.map(sol => `
               <ListaSolicitante>
                  <ct_Solicitante_v2>
                     <NomeSolicitante>${sol.NomeSolicitante}</NomeSolicitante>
                     <CodigoConselho>${sol.CodigoConselho}</CodigoConselho>
                     <CodigoUFConselhoSolicitante>${sol.CodigoUFConselhoSolicitante}</CodigoUFConselhoSolicitante>
                     <CodigoConselhoSolicitante>${sol.CodigoConselhoSolicitante}</CodigoConselhoSolicitante>
                  </ct_Solicitante_v2>
               </ListaSolicitante>`).join('') : '';

        return `
      <RecebeAtendimento>
         <atendimento>
            <CodigoApoiado>${this.config.codigoApoiado}</CodigoApoiado>
            <CodigoUsuario>${this.config.usuario}</CodigoUsuario>
            <CodigoSenhaIntegracao>${this.config.senhaIntegracao}</CodigoSenhaIntegracao>
            <Pedido>
               <NumeroAtendimentoApoiado>${pedido.NumeroAtendimentoApoiado}</NumeroAtendimentoApoiado>
               <ListaPacienteApoiado>
                  <RGPacienteApoiado>${pedido.ListaPacienteApoiado.RGPacienteApoiado || ''}</RGPacienteApoiado>
                  <NomePaciente>${pedido.ListaPacienteApoiado.NomePaciente}</NomePaciente>
                  <SexoPaciente>${pedido.ListaPacienteApoiado.SexoPaciente}</SexoPaciente>
                  <DataHoraPaciente>${pedido.ListaPacienteApoiado.DataHoraPaciente}</DataHoraPaciente>
                  <NumeroCPF>${pedido.ListaPacienteApoiado.NumeroCPF || ''}</NumeroCPF>
                  <NumeroCartaoNacionalSaude>${pedido.ListaPacienteApoiado.NumeroCartaoNacionalSaude || ''}</NumeroCartaoNacionalSaude>
               </ListaPacienteApoiado>
               <CodigoPrioridade>${pedido.CodigoPrioridade || 'R'}</CodigoPrioridade>
               <DescricaoDadosClinicos>${pedido.DescricaoDadosClinicos || ''}</DescricaoDadosClinicos>
               <Altura>${pedido.Altura || ''}</Altura>
               <Peso>${pedido.Peso || ''}</Peso>
               ${solicitantesXML}
               <ListaProcedimento>
                  ${procedimentosXML}
               </ListaProcedimento>
            </Pedido>
         </atendimento>
      </RecebeAtendimento>
    `;
    }

    /**
     * Helper to map our database format to DB format
     */
    public static mapExamRequestToDB(
        requestId: string,
        ticketNumber: string,
        patient: any,
        examTypes: string[]
    ): DBPedido {

        const procedimentos: DBProcedimento[] = examTypes.map(type => ({
            CodigoExameDB: EXAM_TYPE_MAPPING[type] || 'GENERICO', // Default or error handling needs tbd
        })).filter(p => p.CodigoExameDB !== 'GENERICO');

        return {
            NumeroAtendimentoApoiado: ticketNumber, // Using the request ID or a generated ticket number
            CodigoPrioridade: 'R',
            ListaPacienteApoiado: {
                NomePaciente: patient.full_name,
                DataHoraPaciente: patient.date_of_birth || '2000-01-01',
                SexoPaciente: patient.sex === 'male' ? 'M' : 'F',
                NumeroCPF: patient.cpf
            },
            ListaProcedimento: procedimentos
        };
    }
}
