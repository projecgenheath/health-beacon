import { ScrollArea } from '@/components/ui/scroll-area';

export const PrivacyPolicy = () => {
    return (
        <ScrollArea className="h-[300px] rounded-md border p-4 bg-muted/30">
            <div className="space-y-4 text-sm text-muted-foreground">
                <h3 className="text-lg font-bold text-foreground">Política de Privacidade do BHB (Biomedical Health Bank)</h3>
                <p className="text-xs text-muted-foreground">Última atualização: Janeiro de 2026</p>

                <section className="space-y-2">
                    <h4 className="font-semibold text-foreground">1. Introdução</h4>
                    <p>
                        Esta Política de Privacidade descreve como o BHB (Biomedical Health Bank) coleta,
                        usa, armazena e protege suas informações pessoais e dados de saúde. Estamos
                        comprometidos com a proteção de sua privacidade em conformidade com a Lei Geral
                        de Proteção de Dados (LGPD - Lei nº 13.709/2018).
                    </p>
                </section>

                <section className="space-y-2">
                    <h4 className="font-semibold text-foreground">2. Dados Coletados</h4>
                    <p>Coletamos os seguintes tipos de dados:</p>

                    <div className="mt-2">
                        <p className="font-medium text-foreground">2.1 Dados de Identificação:</p>
                        <ul className="list-disc pl-6 space-y-1">
                            <li>Nome completo e data de nascimento</li>
                            <li>CPF e documentos de identificação</li>
                            <li>E-mail e telefone de contato</li>
                            <li>Endereço residencial</li>
                        </ul>
                    </div>

                    <div className="mt-2">
                        <p className="font-medium text-foreground">2.2 Dados de Saúde (Dados Sensíveis):</p>
                        <ul className="list-disc pl-6 space-y-1">
                            <li>Resultados de exames laboratoriais e de imagem</li>
                            <li>Histórico médico e condições de saúde</li>
                            <li>Alergias e medicamentos em uso</li>
                            <li>Peso, altura e indicadores biométricos</li>
                            <li>Sexo biológico e identidade de gênero</li>
                        </ul>
                    </div>

                    <div className="mt-2">
                        <p className="font-medium text-foreground">2.3 Dados de Uso:</p>
                        <ul className="list-disc pl-6 space-y-1">
                            <li>Logs de acesso e navegação na plataforma</li>
                            <li>Dispositivos e navegadores utilizados</li>
                            <li>Endereço IP e localização aproximada</li>
                        </ul>
                    </div>
                </section>

                <section className="space-y-2">
                    <h4 className="font-semibold text-foreground">3. Finalidade do Tratamento</h4>
                    <p>Utilizamos seus dados para:</p>
                    <ul className="list-disc pl-6 space-y-1">
                        <li>Criar e gerenciar sua conta na plataforma</li>
                        <li>Armazenar e organizar seus documentos de saúde</li>
                        <li>Gerar análises e insights sobre seus dados de saúde usando IA</li>
                        <li>Permitir o compartilhamento de dados com profissionais de saúde autorizados</li>
                        <li>Enviar notificações e alertas relacionados à sua saúde</li>
                        <li>Melhorar continuamente nossos serviços</li>
                        <li>Cumprir obrigações legais e regulatórias</li>
                    </ul>
                </section>

                <section className="space-y-2">
                    <h4 className="font-semibold text-foreground">4. Base Legal para Tratamento</h4>
                    <p>
                        O tratamento de seus dados é realizado com base no seu <strong>consentimento
                            expresso</strong>, especialmente para dados sensíveis de saúde, conforme Art. 11
                        da LGPD. Também tratamos dados quando necessário para:
                    </p>
                    <ul className="list-disc pl-6 space-y-1">
                        <li>Execução do contrato de prestação de serviços</li>
                        <li>Cumprimento de obrigação legal ou regulatória</li>
                        <li>Exercício regular de direitos em processo judicial</li>
                    </ul>
                </section>

                <section className="space-y-2">
                    <h4 className="font-semibold text-foreground">5. Compartilhamento de Dados</h4>
                    <p>Seus dados podem ser compartilhados com:</p>
                    <ul className="list-disc pl-6 space-y-1">
                        <li><strong>Profissionais de saúde:</strong> Apenas mediante sua autorização expressa</li>
                        <li><strong>Provedores de serviços:</strong> Empresas que nos auxiliam na operação da plataforma (hospedagem, processamento)</li>
                        <li><strong>Autoridades:</strong> Quando exigido por lei ou ordem judicial</li>
                    </ul>
                    <p className="mt-2 font-medium text-foreground">
                        Jamais vendemos ou comercializamos seus dados pessoais a terceiros.
                    </p>
                </section>

                <section className="space-y-2">
                    <h4 className="font-semibold text-foreground">6. Segurança dos Dados</h4>
                    <p>Implementamos medidas técnicas e organizacionais para proteger seus dados:</p>
                    <ul className="list-disc pl-6 space-y-1">
                        <li>Criptografia de dados em trânsito e em repouso</li>
                        <li>Controles de acesso rigorosos</li>
                        <li>Monitoramento contínuo de segurança</li>
                        <li>Backups regulares e plano de recuperação</li>
                        <li>Treinamento de equipe em proteção de dados</li>
                    </ul>
                </section>

                <section className="space-y-2">
                    <h4 className="font-semibold text-foreground">7. Seus Direitos (LGPD)</h4>
                    <p>Você tem direito a:</p>
                    <ul className="list-disc pl-6 space-y-1">
                        <li><strong>Confirmação e acesso:</strong> Saber se tratamos seus dados e acessá-los</li>
                        <li><strong>Correção:</strong> Solicitar correção de dados incompletos ou inexatos</li>
                        <li><strong>Anonimização ou eliminação:</strong> Solicitar anonimização ou exclusão de dados desnecessários</li>
                        <li><strong>Portabilidade:</strong> Receber seus dados em formato estruturado</li>
                        <li><strong>Revogação do consentimento:</strong> Revogar seu consentimento a qualquer momento</li>
                        <li><strong>Oposição:</strong> Opor-se a tratamentos específicos</li>
                    </ul>
                </section>

                <section className="space-y-2">
                    <h4 className="font-semibold text-foreground">8. Retenção de Dados</h4>
                    <p>
                        Seus dados são retidos enquanto sua conta estiver ativa ou pelo tempo necessário
                        para cumprir as finalidades descritas. Após a exclusão da conta, alguns dados
                        podem ser retidos por período adicional para cumprimento de obrigações legais.
                    </p>
                </section>

                <section className="space-y-2">
                    <h4 className="font-semibold text-foreground">9. Cookies e Tecnologias Similares</h4>
                    <p>
                        Utilizamos cookies e tecnologias similares para melhorar sua experiência,
                        lembrar suas preferências e analisar o uso da plataforma. Você pode gerenciar
                        as configurações de cookies através do seu navegador.
                    </p>
                </section>

                <section className="space-y-2">
                    <h4 className="font-semibold text-foreground">10. Contato e Encarregado de Dados</h4>
                    <p>
                        Para exercer seus direitos ou esclarecer dúvidas sobre esta política,
                        entre em contato com nosso Encarregado de Proteção de Dados (DPO):
                    </p>
                    <p className="mt-2">
                        E-mail: privacidade@bhb.health
                    </p>
                </section>

                <section className="space-y-2">
                    <h4 className="font-semibold text-foreground">11. Alterações nesta Política</h4>
                    <p>
                        Esta política pode ser atualizada periodicamente. Notificaremos você sobre
                        alterações significativas através da plataforma ou por e-mail.
                    </p>
                </section>
            </div>
        </ScrollArea>
    );
};
