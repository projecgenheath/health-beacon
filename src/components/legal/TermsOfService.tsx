import { ScrollArea } from '@/components/ui/scroll-area';

export const TermsOfService = () => {
    return (
        <ScrollArea className="h-[300px] rounded-md border p-4 bg-muted/30">
            <div className="space-y-4 text-sm text-muted-foreground">
                <h3 className="text-lg font-bold text-foreground">Termos de Uso do BHB (Biomedical Health Bank)</h3>
                <p className="text-xs text-muted-foreground">Última atualização: Janeiro de 2026</p>

                <section className="space-y-2">
                    <h4 className="font-semibold text-foreground">1. Aceitação dos Termos</h4>
                    <p>
                        Ao acessar e utilizar a plataforma BHB (Biomedical Health Bank), você concorda em cumprir
                        e estar vinculado a estes Termos de Uso. Se você não concordar com qualquer parte destes
                        termos, não deverá utilizar nossos serviços.
                    </p>
                </section>

                <section className="space-y-2">
                    <h4 className="font-semibold text-foreground">2. Descrição do Serviço</h4>
                    <p>
                        O BHB é uma plataforma de gerenciamento de saúde pessoal que permite aos usuários:
                    </p>
                    <ul className="list-disc pl-6 space-y-1">
                        <li>Armazenar e gerenciar exames médicos e resultados laboratoriais</li>
                        <li>Acompanhar a evolução de indicadores de saúde ao longo do tempo</li>
                        <li>Receber análises automatizadas geradas por Inteligência Artificial</li>
                        <li>Compartilhar dados de saúde com profissionais médicos</li>
                    </ul>
                </section>

                <section className="space-y-2">
                    <h4 className="font-semibold text-foreground">3. Limitações do Uso de Inteligência Artificial</h4>
                    <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                        <p className="font-semibold text-amber-700 dark:text-amber-400">⚠️ AVISO IMPORTANTE</p>
                        <p className="mt-2">
                            As análises e interpretações fornecidas por nossa tecnologia de Inteligência Artificial
                            são meramente <strong>informativas e educativas</strong>. A IA utilizada nesta plataforma:
                        </p>
                        <ul className="list-disc pl-6 space-y-1 mt-2">
                            <li><strong>PODE APRESENTAR ERROS, IMPRECISÕES OU FALHAS</strong> na interpretação dos dados</li>
                            <li>Não substitui, em hipótese alguma, a avaliação de um profissional de saúde qualificado</li>
                            <li>Não deve ser utilizada como base única para decisões médicas</li>
                            <li>Pode não considerar fatores individuais específicos do paciente</li>
                            <li>Está sujeita a limitações técnicas e de treinamento do modelo</li>
                        </ul>
                        <p className="mt-2 font-medium">
                            Você deve SEMPRE consultar um médico ou profissional de saúde qualificado para
                            obter diagnósticos, tratamentos e orientações médicas.
                        </p>
                    </div>
                </section>

                <section className="space-y-2">
                    <h4 className="font-semibold text-foreground">4. Responsabilidades do Usuário</h4>
                    <p>Ao utilizar o BHB, você se compromete a:</p>
                    <ul className="list-disc pl-6 space-y-1">
                        <li>Fornecer informações verdadeiras, precisas e atualizadas</li>
                        <li>Manter a confidencialidade de suas credenciais de acesso</li>
                        <li>Não compartilhar sua conta com terceiros</li>
                        <li>Utilizar a plataforma apenas para fins legítimos relacionados à sua saúde</li>
                        <li>Não tentar burlar ou violar medidas de segurança do sistema</li>
                    </ul>
                </section>

                <section className="space-y-2">
                    <h4 className="font-semibold text-foreground">5. Isenção de Responsabilidade</h4>
                    <p>
                        O BHB e seus desenvolvedores não se responsabilizam por:
                    </p>
                    <ul className="list-disc pl-6 space-y-1">
                        <li>Decisões médicas tomadas com base nas informações da plataforma</li>
                        <li>Erros ou omissões nas análises geradas por IA</li>
                        <li>Danos decorrentes do uso inadequado da plataforma</li>
                        <li>Interrupções temporárias no serviço por manutenção ou problemas técnicos</li>
                    </ul>
                </section>

                <section className="space-y-2">
                    <h4 className="font-semibold text-foreground">6. Propriedade Intelectual</h4>
                    <p>
                        Todo o conteúdo, design, logotipos, marcas e software do BHB são de propriedade
                        exclusiva da plataforma e estão protegidos por leis de propriedade intelectual.
                    </p>
                </section>

                <section className="space-y-2">
                    <h4 className="font-semibold text-foreground">7. Alterações nos Termos</h4>
                    <p>
                        Reservamos o direito de modificar estes termos a qualquer momento. Alterações
                        significativas serão comunicadas aos usuários através da plataforma. O uso
                        continuado após as alterações constitui aceitação dos novos termos.
                    </p>
                </section>

                <section className="space-y-2">
                    <h4 className="font-semibold text-foreground">8. Lei Aplicável</h4>
                    <p>
                        Estes termos são regidos pelas leis da República Federativa do Brasil. Qualquer
                        disputa será resolvida nos tribunais competentes do Brasil.
                    </p>
                </section>

                <section className="space-y-2">
                    <h4 className="font-semibold text-foreground">9. Contato</h4>
                    <p>
                        Para dúvidas sobre estes termos, entre em contato através do e-mail:
                        contato@bhb.health
                    </p>
                </section>
            </div>
        </ScrollArea>
    );
};
