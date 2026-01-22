import { ScrollArea } from '@/components/ui/scroll-area';

export const DataSharingConsent = () => {
    return (
        <ScrollArea className="h-[300px] rounded-md border p-4 bg-muted/30">
            <div className="space-y-4 text-sm text-muted-foreground">
                <h3 className="text-lg font-bold text-foreground">Termo de Consentimento para Compartilhamento de Dados de Saúde</h3>
                <p className="text-xs text-muted-foreground">Última atualização: Janeiro de 2026</p>

                <section className="space-y-2">
                    <h4 className="font-semibold text-foreground">1. Objeto do Consentimento</h4>
                    <p>
                        Este Termo de Consentimento estabelece as condições para o tratamento,
                        armazenamento e compartilhamento dos seus dados pessoais sensíveis de saúde
                        pela plataforma BHB (Biomedical Health Bank), em conformidade com a Lei Geral
                        de Proteção de Dados (LGPD - Lei nº 13.709/2018).
                    </p>
                </section>

                <section className="space-y-2">
                    <h4 className="font-semibold text-foreground">2. Dados Objeto deste Consentimento</h4>
                    <p>Ao aceitar este termo, você autoriza o tratamento dos seguintes dados sensíveis:</p>
                    <ul className="list-disc pl-6 space-y-1">
                        <li>Resultados de exames laboratoriais (hemograma, bioquímica, hormonais, etc.)</li>
                        <li>Resultados de exames de imagem (radiografias, tomografias, ressonâncias, ultrassons)</li>
                        <li>Laudos médicos e pareceres de especialistas</li>
                        <li>Histórico de condições de saúde, doenças e tratamentos</li>
                        <li>Informações sobre medicamentos, alergias e reações adversas</li>
                        <li>Dados biométricos e antropométricos (peso, altura, pressão arterial, etc.)</li>
                        <li>Informações genéticas, quando aplicável</li>
                    </ul>
                </section>

                <section className="space-y-2">
                    <h4 className="font-semibold text-foreground">3. Finalidades do Tratamento</h4>
                    <p>Seus dados de saúde serão utilizados para:</p>
                    <ul className="list-disc pl-6 space-y-1">
                        <li>Armazenamento seguro e organizado do seu histórico de saúde</li>
                        <li>Geração de análises e tendências sobre sua evolução de saúde</li>
                        <li>Processamento por sistemas de Inteligência Artificial para insights de saúde</li>
                        <li>Compartilhamento com profissionais de saúde por você autorizados</li>
                        <li>Geração de relatórios e visualizações para seu acompanhamento</li>
                    </ul>
                </section>

                <section className="space-y-2">
                    <h4 className="font-semibold text-foreground">4. Uso de Inteligência Artificial</h4>
                    <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                        <p className="font-semibold text-amber-700 dark:text-amber-400">⚠️ DECLARAÇÃO IMPORTANTE SOBRE IA</p>
                        <p className="mt-2">
                            Ao aceitar este termo, você reconhece e concorda que:
                        </p>
                        <ul className="list-disc pl-6 space-y-1 mt-2">
                            <li>Seus dados de saúde serão processados por sistemas de Inteligência Artificial</li>
                            <li>A IA <strong>PODE COMETER ERROS, APRESENTAR FALHAS E GERAR RESULTADOS IMPRECISOS</strong></li>
                            <li>As análises de IA são <strong>AUXILIARES</strong> e <strong>NÃO SUBSTITUEM</strong> avaliação médica profissional</li>
                            <li>Você <strong>NÃO DEVE</strong> tomar decisões médicas baseado exclusivamente nas análises da IA</li>
                            <li>O BHB não se responsabiliza por danos decorrentes do uso incorreto das análises de IA</li>
                        </ul>
                        <p className="mt-2 font-medium text-destructive">
                            SEMPRE consulte um profissional de saúde qualificado para diagnósticos e tratamentos.
                        </p>
                    </div>
                </section>

                <section className="space-y-2">
                    <h4 className="font-semibold text-foreground">5. Compartilhamento de Dados</h4>
                    <p>
                        Você pode compartilhar seus dados de saúde com profissionais médicos de sua
                        escolha através dos seguintes mecanismos:
                    </p>
                    <ul className="list-disc pl-6 space-y-1">
                        <li><strong>Links temporários:</strong> Links de acesso com prazo de validade definido por você</li>
                        <li><strong>Acesso por código:</strong> Códigos únicos para compartilhamento pontual</li>
                        <li><strong>Permissões permanentes:</strong> Acesso contínuo para profissionais de sua confiança</li>
                    </ul>
                    <p className="mt-2">
                        Você pode revogar qualquer compartilhamento a qualquer momento através das
                        configurações de privacidade da sua conta.
                    </p>
                </section>

                <section className="space-y-2">
                    <h4 className="font-semibold text-foreground">6. Segurança e Armazenamento</h4>
                    <p>Seus dados são protegidos por:</p>
                    <ul className="list-disc pl-6 space-y-1">
                        <li>Criptografia de ponta a ponta para todos os documentos</li>
                        <li>Armazenamento em servidores seguros com certificações de segurança</li>
                        <li>Controles de acesso rigorosos e autenticação multifator</li>
                        <li>Monitoramento 24/7 para detecção de ameaças</li>
                        <li>Backups criptografados e planos de recuperação de desastres</li>
                    </ul>
                </section>

                <section className="space-y-2">
                    <h4 className="font-semibold text-foreground">7. Seus Direitos</h4>
                    <p>Você mantém total controle sobre seus dados e pode, a qualquer momento:</p>
                    <ul className="list-disc pl-6 space-y-1">
                        <li>Acessar todos os seus dados armazenados na plataforma</li>
                        <li>Solicitar correção de informações incorretas</li>
                        <li>Exportar seus dados em formato portável</li>
                        <li>Solicitar a exclusão completa de seus dados</li>
                        <li>Revogar este consentimento (o que pode limitar funcionalidades da plataforma)</li>
                        <li>Gerenciar e revogar compartilhamentos ativos</li>
                    </ul>
                </section>

                <section className="space-y-2">
                    <h4 className="font-semibold text-foreground">8. Revogação do Consentimento</h4>
                    <p>
                        Você pode revogar este consentimento a qualquer momento através das configurações
                        de sua conta ou entrando em contato com nossa equipe. A revogação não afeta a
                        licitude do tratamento realizado anteriormente com base no consentimento.
                    </p>
                    <p className="mt-2">
                        <strong>Nota:</strong> A revogação do consentimento pode resultar na impossibilidade
                        de utilizar determinadas funcionalidades da plataforma que dependem do tratamento
                        de dados de saúde.
                    </p>
                </section>

                <section className="space-y-2">
                    <h4 className="font-semibold text-foreground">9. Declaração</h4>
                    <div className="p-3 bg-primary/10 border border-primary/30 rounded-lg">
                        <p>
                            Ao marcar a caixa de aceite abaixo, você declara que:
                        </p>
                        <ul className="list-disc pl-6 space-y-1 mt-2">
                            <li>Leu e compreendeu integralmente este termo</li>
                            <li>Está ciente de que as análises de IA podem conter erros e imprecisões</li>
                            <li>Consente livremente com o tratamento de seus dados de saúde</li>
                            <li>Entende que pode revogar este consentimento a qualquer momento</li>
                            <li>Compromete-se a sempre buscar orientação médica profissional</li>
                        </ul>
                    </div>
                </section>

                <section className="space-y-2">
                    <h4 className="font-semibold text-foreground">10. Contato</h4>
                    <p>
                        Para dúvidas sobre este termo ou exercício de seus direitos:
                    </p>
                    <p className="mt-2">
                        E-mail: consentimento@bhb.health
                    </p>
                </section>
            </div>
        </ScrollArea>
    );
};
