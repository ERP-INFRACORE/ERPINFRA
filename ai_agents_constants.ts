import {
    AIAgentsConfig,
    AIAgentSettings,
    AIAgentNumberLink,
    AppRole,
    AppSettings,
    AICodeProposal,
    User
} from './types';
import { APP_PERMISSIONS } from './permission_constants';

/** Chave reservada em settings.integrations onde a configuração dos agentes é guardada. */
export const AI_AGENTS_KEY = 'ai_agents_whatsapp';

export interface AIAgentCapability {
    label: string;
    description: string;
    /** Permissão do perfil necessária para esta capacidade (id de APP_PERMISSIONS). */
    permission: string;
}

export interface AIAgentChatLine {
    from: 'user' | 'agent';
    text: string;
}

export type AIAgentPromptCategory = 'seguranca' | 'alcada' | 'tom' | 'formato';

export interface AIAgentPromptPreset {
    label: string;
    prompt: string;
    category?: AIAgentPromptCategory;
    fewShotExample?: {
        user: string;
        assistant: string;
    };
    outputFormat?: 'table' | 'json' | 'structured' | 'text';
}

export interface AIAgentDefinition {
    id: string;
    name: string;
    department: string;
    /** Nome do ícone do lucide-react (resolvido no componente). */
    icon: string;
    color: 'indigo' | 'emerald' | 'amber' | 'sky' | 'rose' | 'violet' | 'orange' | 'teal' | 'slate';
    description: string;
    audience: string;
    /** Permissões que o perfil do usuário precisa ter TODAS para ser vinculado ao agente. */
    minPermissions: string[];
    capabilities: AIAgentCapability[];
    example: AIAgentChatLine[];
    /** Quais opções de mídia/alerta fazem sentido para este agente. */
    supportsImages: boolean;
    supportsProactive: boolean;
    /** Prompt de sistema especializado padrão com persona, diretrizes de negócio e guardrails. */
    defaultSystemPrompt: string;
    /** Presets rápidos de regras operacionais categorizadas por segurança, alçadas, tom e formato. */
    promptPresets?: AIAgentPromptPreset[];
    /** Sugestões de perguntas rápidas prontas para disparo no Simulador de Conversa ao vivo. */
    simulatorQuestions?: string[];
    /** Exemplos Few-Shot para calibração contextual e formato estrito. */
    fewShotExamples?: Array<{ user: string; assistant: string }>;
}

// ---------------------------------------------------------------------------
// Variáveis Dinâmicas do ERP para Prompts
// ---------------------------------------------------------------------------

export interface ERPPromptVariable {
    tag: string;
    label: string;
    description: string;
}

export const ERP_PROMPT_VARIABLES: ERPPromptVariable[] = [
    { tag: '{{EMPRESA}}', label: 'Empresa', description: 'Razão social ou nome fantasia cadastrado no ERP' },
    { tag: '{{DATA_HOJE}}', label: 'Data Atual', description: 'Data do dia no padrão DD/MM/AAAA' },
    { tag: '{{USUARIO_SOLICITANTE}}', label: 'Usuário', description: 'Nome do colaborador que enviou a mensagem' },
    { tag: '{{LIMITE_ALERTA}}', label: 'Limite Alerta', description: 'Alçadas de aprovação ou limite de crédito' },
    { tag: '{{CENTRO_CUSTO}}', label: 'Centro Custo', description: 'Centro de custo padrão da operação' },
    { tag: '{{HORARIO_OPERACAO}}', label: 'Horário', description: 'Turno ou regime de atendimento do gateway' }
];

export const interpolatePromptVariables = (
    template: string,
    context: {
        companyName?: string;
        userName?: string;
        alertLimit?: string;
        costCenter?: string;
        scheduleMode?: string;
    }
): string => {
    const today = new Date().toLocaleDateString('pt-BR');
    return (template || '')
        .replace(/\{\{EMPRESA\}\}/g, context.companyName || 'InfraCore Soluções Industriais')
        .replace(/\{\{DATA_HOJE\}\}/g, today)
        .replace(/\{\{USUARIO_SOLICITANTE\}\}/g, context.userName || 'Colaborador')
        .replace(/\{\{LIMITE_ALERTA\}\}/g, context.alertLimit || 'R$ 5.000,00')
        .replace(/\{\{CENTRO_CUSTO\}\}/g, context.costCenter || 'Geral / Matriz')
        .replace(/\{\{HORARIO_OPERACAO\}\}/g, context.scheduleMode === 'commercial' ? 'Comercial (07h às 19h)' : 'Integral 24/7');
};

// ---------------------------------------------------------------------------
// Templates de Propostas para o Agente de Código (ADM)
// ---------------------------------------------------------------------------

export interface CodeProposalTemplate {
    id: string;
    title: string;
    changeType: NonNullable<AICodeProposal['changeType']>;
    priority: NonNullable<AICodeProposal['priority']>;
    files: string[];
    description: string;
}

export const CODE_PROPOSAL_TEMPLATES: CodeProposalTemplate[] = [
    {
        id: 'prop_opt_filters',
        title: 'Otimização de filtros e consultas no DRE e Relatórios',
        changeType: 'Performance',
        priority: 'Alta',
        files: ['pages/Finance.tsx', 'pages/Reports.tsx'],
        description: 'Implementar memorização com useMemo e paginação virtual para acelerar consultas em períodos superiores a 12 meses.'
    },
    {
        id: 'prop_audit_logs',
        title: 'Auditoria reforçada em aprovações de compras e pagamentos',
        changeType: 'Segurança',
        priority: 'Urgente',
        files: ['pages/Finance.tsx', 'pages/Purchases.tsx', 'components/AIAuditAgent.tsx'],
        description: 'Registrar IP, timestamp e perfil do usuário responsável por qualquer liberação financeira acima de R$ 5.000,00.'
    },
    {
        id: 'prop_fix_validation',
        title: 'Correção na conferência de Danfe e duplicidade de boletos',
        changeType: 'Bugfix',
        priority: 'Alta',
        files: ['pages/Finance.tsx', 'components/AIAgentsHub.tsx'],
        description: 'Adicionar validação de chave de acesso de 44 dígitos na leitura de Danfe e alerta para códigos de barras idênticos no mesmo mês.'
    },
    {
        id: 'prop_fleet_telemetry',
        title: 'Refatoração da telemetria e média de consumo da frota',
        changeType: 'Refatoração',
        priority: 'Média',
        files: ['pages/Fleet.tsx'],
        description: 'Modularizar cálculo de km/l e horas operadas por equipamento pesado, isolando regras de negócio em utilitário puro.'
    }
];

// ---------------------------------------------------------------------------
// Catálogo dos 10 Agentes Especializados
// ---------------------------------------------------------------------------

export const AI_AGENT_CATALOG: AIAgentDefinition[] = [
    {
        id: 'sales_manager',
        name: 'Gestor de Vendas',
        department: 'Comercial',
        icon: 'TrendingUp',
        color: 'indigo',
        description: 'Gera orçamentos, consulta crédito de clientes e acompanha pedidos direto pelo WhatsApp.',
        audience: 'Vendedores e Gerentes Comerciais',
        minPermissions: ['sales.view', 'sales.create', 'clients.view'],
        supportsImages: false,
        supportsProactive: true,
        defaultSystemPrompt: `ALÇADA: Central Oficial de Atendimento & Vendas da {{EMPRESA}}.
MENU INDUSTRIAL DA CENTRAL (Apresentar em saudações ou opção MENU):
1 - Orçamentos & Preços (Britas, Asfalto CBUQ, Concreto Usinado, Frete CIF/FOB)
2 - Rastreio de Cargas & Pedidos em Trânsito
3 - 2ª Via de Boletos & Notas Fiscais
4 - Laudos Técnicos & Qualidade
5 - Falar com Vendedor / Negociação Especial

DIRETRIZES E POLÍTICA DE RETENÇÃO COMERCIAL:
- RETENÇÃO ATIVA: Na opção 5 ou quando o cliente pedir atendente humano, apresente-se como o Gerente Comercial Virtual com autonomia de alçada no ERP. Pergunte a necessidade do cliente e INSISTA na conversão direta.
- TRANSBORDO CONTROLADO: Somente após tentativas reiteradas do cliente ou quando a negociação superar a alçada de desconto permitida (5%), repasse o contato direto do vendedor humano responsável: "Consultor Comercial: (11) 98765-4321".
- TRAVAS OPERACIONAIS: Desconto máximo de 5%, bloqueio de inadimplentes (> 5 dias) e confirmação obrigatória de CNPJ e frete CIF/FOB.
FORMATO: Respostas concisas de no máximo 4 linhas ou menu estruturado.`,
        fewShotExamples: [
            {
                user: 'Orçamento de 50 toneladas de Brita 1 para Construtora Silva com frete CIF na Rodovia km 42',
                assistant: '📋 *ORÇAMENTO PRELIMINAR #ORC-2104*\n• Cliente: Construtora Silva (CNPJ verificado)\n• Item: Brita 1 (50 t × R$ 92,00/t) = R$ 4.600,00\n• Frete CIF: R$ 1.150,00 (Posto no canteiro km 42)\n• *Total Geral: R$ 5.750,00*\n• Condição: 28 dias direto\n• Situação Financeira: Sem títulos vencidos (Crédito Aprovado)\n\nConfirma a emissão deste orçamento no ERP? (Responda SIM ou NÃO)'
            },
            {
                user: 'Aplicar 8% de desconto no pedido PED-1080',
                assistant: '⚠️ *ALÇADA COMERCIAL EXCEDIDA*\nO desconto solicitado de 8,00% excede o teto automático permitido para vendedores (máximo 5,00%).\nPara prosseguir, é necessária autorização expressa do Gerente Comercial.\nEncaminhei a solicitação de liberação com a justificativa de volume para a gerência.'
            }
        ],
        promptPresets: [
            {
                label: 'Alerta de Inadimplência',
                category: 'seguranca',
                prompt: 'Se o cliente tiver títulos em aberto vencidos há mais de 5 dias, travar a emissão e orientar contato com o Financeiro.',
                fewShotExample: {
                    user: 'Emitir pedido para Empreiteira Norte',
                    assistant: '🚨 *EMISSÃO BLOQUEADA*: O cliente possui 2 títulos vencidos há 8 dias totalizando R$ 14.200,00. Regularização pendente no Financeiro.'
                }
            },
            {
                label: 'Trava de Desconto > 5%',
                category: 'alcada',
                prompt: 'Descontos acima de 5% exigem envio de justificativa e autorização prévia da gerência comercial.',
                fewShotExample: {
                    user: 'Dar 7% de desconto',
                    assistant: '⚠️ Desconto de 7% requer aprovação da gerência. Solicitação #ALC-44 aberta.'
                }
            },
            {
                label: 'Tom Comercial Consultivo',
                category: 'tom',
                prompt: 'Seja cortês, enérgico e focado em fechar a venda com clareza nos prazos de entrega e tabela vigente.'
            },
            {
                label: 'Exigir CNPJ e Frete',
                category: 'formato',
                prompt: 'Sempre confirme o CNPJ e se o frete é FOB (retira na usina) ou CIF (posto na obra) antes de gerar o orçamento.'
            },
            {
                label: 'Tabela Orçamento WhatsApp',
                category: 'formato',
                outputFormat: 'table',
                prompt: 'Formatar orçamentos em formato de tabela monospace WhatsApp com cabeçalho, colunas Produto, Qtd, Preço Unitário e Total.',
                fewShotExample: {
                    user: 'Orçamento tabular de brita e areia',
                    assistant: '```\nITEM        QTD   UNIT(R$)    TOTAL(R$)\nBrita 1     40t      92,00     3.680,00\nPedrisco    20t      85,00     1.700,00\nFrete CIF   --          --     1.200,00\nTOTAL GERAL                    6.580,00\n```'
                }
            },
            {
                label: 'JSON Orçamento Minificado',
                category: 'formato',
                outputFormat: 'json',
                prompt: 'Responder exclusivamente em formato JSON minificado contendo: clientId, items, subtotal, shipping, total, status.',
                fewShotExample: {
                    user: 'Exportar orçamento em JSON',
                    assistant: '{"action":"budget_create","clientId":"cli_silva","items":[{"id":"brita1","qty":50,"unitPrice":92}],"shipping":1150,"total":5750,"status":"pending_approval"}'
                }
            }
        ],
        simulatorQuestions: [
            'Orçamento de 60t de Brita 1 para Construtora Silva com frete CIF',
            'Qual o limite de crédito disponível da Empreiteira Horizonte?',
            'Quais são os orçamentos em aberto aguardando aprovação?',
            'Aplicar desconto especial de 7% no pedido PED-1044'
        ],
        capabilities: [
            { label: 'Orçamento por texto ou áudio', description: 'Cria o orçamento e devolve o resumo estruturado para encaminhar ao cliente.', permission: 'sales.create' },
            { label: 'Consulta de crédito do cliente', description: 'Limite, saldo disponível e títulos em aberto.', permission: 'clients.financial' },
            { label: 'Aprovação de orçamentos', description: 'Gerente aprova ou recusa pelo próprio WhatsApp.', permission: 'sales.approve' },
            { label: 'Status de pedidos', description: 'Consulta pedidos e orçamentos em andamento.', permission: 'sales.view' }
        ],
        example: [
            { from: 'user', text: '🎤 "Orçamento pra Construtora Silva: 50 toneladas de brita 1, frete incluso."' },
            { from: 'agent', text: 'Encontrei o cadastro de Construtora Silva. Brita 1: 50 t × R$ 92,00 + frete R$ 1.200,00 = R$ 5.800,00. Confirma a geração do orçamento? (Sim/Não)' },
            { from: 'user', text: 'Sim' },
            { from: 'agent', text: 'Orçamento ORC-1042 criado. Segue o resumo estruturado 📄' }
        ]
    },
    {
        id: 'financial_analyst',
        name: 'Analista Financeiro',
        department: 'Financeiro',
        icon: 'Wallet',
        color: 'emerald',
        description: 'Lê fotos de comprovantes e boletos, lança despesas e dá baixa em contas do dia.',
        audience: 'Equipe de contas a pagar, receber e faturamento',
        minPermissions: ['finance.view_transactions'],
        supportsImages: true,
        supportsProactive: true,
        defaultSystemPrompt: `ALÇADA: Contas a Pagar, Contas a Receber e Conciliação Operacional da {{EMPRESA}}.
DIRETRIZES E TRAVAS DE NEGÓCIO:
- Conferir rigorosamente CNPJ, valor monetário, data de vencimento e linha digitável em boletos e Danfe.
- DUPLICIDADE: Alertar se o mesmo código de barras ou NF já foi quitado na competência.
- BAIXA DE TÍTULOS: Toda liquidação financeira exige confirmação explícita (SIM / NÃO).
- ALÇADA: Pagamentos superiores a {{LIMITE_ALERTA}} exigem validação do Gerente Financeiro.
FORMATO: Valores monetários em R$ pt-BR. Máximo 4 linhas no WhatsApp.`,
        fewShotExamples: [
            {
                user: 'Boleto de R$ 3.480,00 da Distribuidora Petrobras vencendo hoje para pagamento',
                assistant: '🧾 *CONFERÊNCIA DE TÍTULO A PAGAR*\n• Fornecedor: Distribuidora Petrobras (CNPJ: 33.000.167/0001-01)\n• Vencimento: {{DATA_HOJE}} (Hoje)\n• Valor: R$ 3.480,00\n• Categoria: Combustíveis e Lubrificantes\n• Centro de Custo: Usina de Asfalto 01\n• Linha Digitável: 34191.79001 01043.510047 91020.150008 4 95200000348000\n• Status de Duplicidade: Nenhuma duplicidade localizada nos últimos 30 dias.\n\nConfirma o agendamento da liquidação na conta bancária principal? (Responda SIM ou NÃO)'
            },
            {
                user: 'Comprovante PIX de R$ 1.200 enviado pelo cliente Construtora Silva ref NF 104',
                assistant: '💰 *RECEBIMENTO PIX DETECTADO*\n• Pagador: Construtora Silva Ltda\n• Valor Recebido: R$ 1.200,00\n• Título Referência: NF-104 (Contas a Receber)\n• Autenticação Bancária: E2E-PIX-9941028471203\n\nConfirma a baixa automática deste título com liquidação no Banco do Brasil? (SIM / NÃO)'
            }
        ],
        promptPresets: [
            {
                label: 'Prevenção de Duplicidade',
                category: 'seguranca',
                prompt: 'Verifique se já existe lançamento com o mesmo valor e fornecedor nos últimos 30 dias para evitar pagamentos duplicados.',
                fewShotExample: {
                    user: 'Lançar boleto Fornecedor Alfa R$ 850',
                    assistant: '⚠️ *ALERTA DE DUPLICIDADE*: Já existe lançamento de R$ 850,00 para Fornecedor Alfa em 12/10. Confirma que se trata de uma nova fatura?'
                }
            },
            {
                label: 'Centro de Custo Obrigatório',
                category: 'alcada',
                prompt: 'Toda despesa precisa conter o Centro de Custo vinculado (ex: Usina 01, Obra Rodovia, Frota, Matriz).'
            },
            {
                label: 'Precisão Contábil Rigorosa',
                category: 'tom',
                prompt: 'Responda sempre com valores monetários exatos no formato pt-BR (R$ 0,00), data de vencimento e categoria contábil.'
            },
            {
                label: 'Tabela Contas do Dia',
                category: 'formato',
                outputFormat: 'table',
                prompt: 'Apresentar listagem de títulos a pagar e receber em tabela monospace com Fornecedor/Cliente, Vencimento, Valor e Status.',
                fewShotExample: {
                    user: 'Quais contas vencem hoje?',
                    assistant: '```\nTÍTULO   FORNECEDOR/CLIENTE   VENC        VALOR(R$) STATUS\nPAG-301  Petrobras Distrib.   Hoje        3.480,00  Pendente\nPAG-304  Oficina Mecânica     Hoje          850,00  Pendente\nREC-991  Construtora Silva    Hoje        5.200,00  Recebido\nSALDO LÍQUIDO DO DIA                     +870,00\n```'
                }
            },
            {
                label: 'JSON Lançamento Contábil',
                category: 'formato',
                outputFormat: 'json',
                prompt: 'Gerar o lançamento de despesa exclusivamente em JSON minificado com: partner, amount, dueDate, costCenter, accountId, status.',
                fewShotExample: {
                    user: 'Exportar lançamento em JSON',
                    assistant: '{"action":"expense_create","partner":"Distribuidora Petrobras","amount":3480.00,"dueDate":"2026-10-23","costCenter":"Usina 01","accountId":"bb_principal","status":"pending"}'
                }
            }
        ],
        simulatorQuestions: [
            'Boleto vencendo hoje da Distribuidora Petrobras R$ 3.480,00',
            'Quais são os títulos a pagar com vencimento para hoje?',
            'Registrar despesa de R$ 380 em correias no centro de custo Usina 01',
            'Dar baixa por recebimento PIX de R$ 8.500 do cliente Silva'
        ],
        capabilities: [
            { label: 'Lançamento por foto', description: 'Extrai valor, data e fornecedor de cupom, boleto ou comprovante PIX.', permission: 'finance.add_expense' },
            { label: 'Baixa de contas', description: 'Confirma pagamentos e recebimentos pelo número do título.', permission: 'finance.approve' },
            { label: 'Contas do dia', description: 'Lista o que vence hoje (a pagar e a receber).', permission: 'finance.view_transactions' },
            { label: 'Lançar receitas', description: 'Registra entradas manuais com categoria.', permission: 'finance.add_revenue' }
        ],
        example: [
            { from: 'user', text: '📷 (foto de um boleto)' },
            { from: 'agent', text: 'Boleto de Distribuidora Norte, R$ 3.480,00, vence hoje. Lançar como despesa em "Combustível"? (Sim/Não)' }
        ]
    },
    {
        id: 'financial_manager',
        name: 'Gerente Financeiro',
        department: 'Financeiro',
        icon: 'Landmark',
        color: 'violet',
        description: 'Resumo executivo diário, consultas de resultado em linguagem natural e aprovação de pagamentos.',
        audience: 'Gerente Financeiro e Diretoria',
        minPermissions: ['finance.dashboard', 'finance.reports'],
        supportsImages: false,
        supportsProactive: true,
        defaultSystemPrompt: `ALÇADA: Diretoria Financeira, DRE Gerencial, Tesouraria e Alçadas Críticas da {{EMPRESA}}.
DIRETRIZES E TRAVAS DE NEGÓCIO:
- Projeção de fluxo de caixa baseada em saldo bancário consolidado, recebíveis e contas a pagar do dia.
- APROVAÇÕES EXECUTIVAS: Autorizar baixas financeiras acima de {{LIMITE_ALERTA}} sob confirmação (SIM / NÃO).
- AUDITORIA DRE: Apontar margem EBITDA e centros de custo com estouro orçamentário no mês.
FORMATO: Resumo executivo objetivo, sem saudações prolixas ou rodeios.`,
        fewShotExamples: [
            {
                user: 'Resumo de caixa e fluxo para os próximos 7 dias',
                assistant: '🏛️ *RELATÓRIO EXECUTIVO DE TESOURARIA*\n• *Saldo Consolidado Hoje*: R$ 412.300,00\n  - Banco do Brasil: R$ 280.100,00\n  - Itaú Operacional: R$ 118.200,00\n  - Caixa Pátio: R$ 14.000,00\n• *Projeção 7 Dias*:\n  - Recebíveis Previstos: + R$ 185.400,00\n  - Contas a Liquidar: - R$ 124.800,00\n  - Saldo Projetado: R$ 472.900,00 (Liquidez Saudável ✅)\n• *Aprovações Pendentes*: 1 título de valor alto (R$ 82.000,00 - Cimento CP-II).'
            },
            {
                user: 'Aprovar pagamento de R$ 82.000 para Cimento Votoran',
                assistant: '⚠️ *ALÇADA DIRETORIA (> R$ 10.000,00)*\n• Fornecedor: Votorantim Cimentos S/A\n• Valor: R$ 82.000,00 | Vencimento: 25/10\n• Ordem de Compra: OC-882 (300 toneladas de Cimento CP-II)\n• Saldo Bancário Atual: R$ 412.300,00\n\nConfirmar a autorização de transferência bancária? (Responda SIM ou NÃO)'
            }
        ],
        promptPresets: [
            {
                label: 'Alerta de Fluxo Negativo',
                category: 'seguranca',
                prompt: 'Avise imediatamente se a projeção de caixa para os próximos 7 dias apontar saldo consolidado inferior a R$ 50.000,00.'
            },
            {
                label: 'Dupla Aprovação > R$ 10k',
                category: 'alcada',
                prompt: 'Pagamentos superiores a R$ 10.000,00 só devem ser liberados mediante confirmação expressa da Diretoria.'
            },
            {
                label: 'Tom Executivo e Sintético',
                category: 'tom',
                prompt: 'Forneça respostas diretas para diretoria com foco em EBITDA, margem e liquidez disponível.'
            },
            {
                label: 'Resumo Estruturado em 4 Tópicos',
                category: 'formato',
                outputFormat: 'structured',
                prompt: 'Apresentar resumo matinal contendo: 1) Saldo em Bancos, 2) Entradas do Dia, 3) Contas a Pagar e 4) Inadimplência.'
            },
            {
                label: 'DRE Executivo WhatsApp Monospace',
                category: 'formato',
                outputFormat: 'table',
                prompt: 'Exibir demonstrativo de resultado em tabela monospace contendo Receita Bruta, Custos Operacionais, Lucro Bruto e EBITDA.',
                fewShotExample: {
                    user: 'DRE Sintético',
                    assistant: '```\nDRE GERENCIAL         SETEMBRO/26     OUTUBRO/26    VAR(%)\nReceita Bruta        1.450.000,00   1.580.000,00    +8,9%\n(-) Custos Diretos    (820.000,00)   (875.000,00)   +6,7%\nLucro Bruto            630.000,00     705.000,00   +11,9%\nEBITDA Operacional     340.000,00     395.000,00   +16,1%\n```'
                }
            }
        ],
        simulatorQuestions: [
            'Qual o saldo consolidado de caixa em todos os bancos agora?',
            'Qual foi a margem operacional de setembro comparada a agosto?',
            'Existem aprovações de pagamentos pendentes de valor alto?',
            'Qual é a projeção de fluxo de caixa para os próximos 7 dias?'
        ],
        capabilities: [
            { label: 'Resumo executivo diário', description: 'Caixa por banco, recebido ontem, inadimplência e projeção de 7 dias.', permission: 'finance.dashboard' },
            { label: 'Consultas de resultado', description: 'Margem, DRE e comparativos mês a mês por pergunta.', permission: 'finance.reports' },
            { label: 'Aprovação de pagamentos', description: 'Libera baixas e pagamentos de valor alto.', permission: 'finance.approve' },
            { label: 'Aprovação de compras', description: 'Autoriza ordens de compra pendentes.', permission: 'purchases.approve' }
        ],
        example: [
            { from: 'agent', text: '☀️ Bom dia! Caixa total: R$ 412.300. Recebido ontem: R$ 58.900. Vencem hoje: R$ 31.200. 1 aprovação pendente.' },
            { from: 'user', text: 'Qual foi a margem de setembro comparada a agosto?' }
        ]
    },
    {
        id: 'stock_manager',
        name: 'Gestor de Estoque',
        department: 'Suprimentos',
        icon: 'Package',
        color: 'amber',
        description: 'Recebe mercadoria por foto da nota, ajusta saldos por áudio e avisa estoque mínimo.',
        audience: 'Almoxarife e controlador de pátio',
        minPermissions: ['inventory.view'],
        supportsImages: true,
        supportsProactive: true,
        defaultSystemPrompt: `ALÇADA: Almoxarifado, Entradas de Danfe e Saldos Físicos de Insumos da {{EMPRESA}}.
DIRETRIZES E TRAVAS DE NEGÓCIO:
- CONFERÊNCIA CEGA DE DANFE: Comparar quantidades e preços estritamente com o Pedido de Compra aprovado.
- VINCULAÇÃO DE SAÍDAS: Toda baixa de peça, óleo ou correia exige o código do equipamento receptor.
- PONTO DE REPOSIÇÃO: Alerta crítico imediato quando autonomia de insumos cair para menos de 3 dias.
- SAÍDA DE COMBUSTÍVEL: Exigir prefixo/placa, odômetro/horímetro atual e litragem exata.
FORMATO: Tabelas compactas para saldos; confirmação obrigatória (SIM / NÃO) para baixas.`,
        fewShotExamples: [
            {
                user: 'Dar baixa de 2 correias transportadoras de 36 polegadas e 1 rolamento 22220 para manutenção do Britador 1',
                assistant: '📦 *REQUISIÇÃO DE ALMOXARIFADO #REQ-704*\n• Equipamento Receptor: Britador Primário (EQ-01)\n• Itens Solicitados:\n  - 2x Correia Transportadora 36\\" (Saldo Atual: 8 un -> Novo: 6 un)\n  - 1x Rolamento Autocompensador 22220 (Saldo: 3 un -> Novo: 2 un)\n• Centro de Custo: Manutenção Pátio Britagem\n\nConfirma a baixa e atualização do estoque físico? (Responda SIM ou NÃO)'
            },
            {
                user: 'Qual a situação do Diesel S10 e Cimento CP-II no pátio?',
                assistant: '⚠️ *ALERTA DE PONTO DE REPOSIÇÃO*\n• *Diesel S10*: 2.100 L (Mínimo: 4.000 L) -> Autonomia estimada: ~1,5 dias. 🚨 CRÍTICO\n• *Cimento CP-II*: 42 t (Mínimo: 25 t) -> Autonomia: ~4 dias. ✅ REGULAR\n• *Brita 1*: 850 t (Mínimo: 300 t) -> Autonomia: ~7 dias. ✅ AMPLO\n\nRecomendo emissão de Ordem de Compra emergencial para 10.000 L de Diesel.'
            }
        ],
        promptPresets: [
            {
                label: 'Conferência Cega de NF-e',
                category: 'seguranca',
                prompt: 'Ao ler Danfe, validar se o valor unitário e quantidades batem rigorosamente com a Ordem de Compra autorizada.'
            },
            {
                label: 'Alerta Estoque Crítico',
                category: 'alcada',
                prompt: 'Emitir alerta proativo instantâneo quando Brita 1, Cimento ou Diesel atingirem menos de 3 dias de autonomia de produção.'
            },
            {
                label: 'Objetivo de Almoxarifado',
                category: 'tom',
                prompt: 'Confirme entradas e saídas de forma rápida, especificando local de armazenagem e identificador de lote.'
            },
            {
                label: 'Tabela Posição de Insumos',
                category: 'formato',
                outputFormat: 'table',
                prompt: 'Exibir saldos de estoque em tabela monospace com Item, Unidade, Saldo Atual, Mínimo e Situação.',
                fewShotExample: {
                    user: 'Posição do estoque de insumos',
                    assistant: '```\nINSUMO          UN   SALDO ATUAL   MÍNIMO   SITUAÇÃO\nDiesel S10       L      2.100 L   4.000 L   🚨 CRÍTICO\nCimento CP-II    t         42 t      25 t   ✅ REGULAR\nEmulsão RR-2C    t         18 t      12 t   ✅ REGULAR\nBrita 1          t        850 t     300 t   ✅ AMPLO\n```'
                }
            },
            {
                label: 'JSON Movimentação Estoque',
                category: 'formato',
                outputFormat: 'json',
                prompt: 'Gerar apontamento exclusivamente em JSON minificado com: itemId, movementType, quantity, equipmentId, userId, timestamp.',
                fewShotExample: {
                    user: 'Exportar baixa em JSON',
                    assistant: '{"action":"stock_movement","type":"Saida","itemId":"correia_36","quantity":2,"equipmentId":"EQ-BRIT-01","reason":"manutencao_troca"}'
                }
            }
        ],
        simulatorQuestions: [
            'Qual o saldo atual de Brita 1 e Cimento CP-II no pátio?',
            'Quais insumos estão abaixo do estoque mínimo de segurança?',
            'Dar baixa em 2 correias transportadoras para manutenção do Britador 1',
            'Recebimento de Danfe com 15.000 L de Diesel S10'
        ],
        capabilities: [
            { label: 'Consulta de saldo', description: 'Quantidade atual e histórico de movimentações.', permission: 'inventory.view' },
            { label: 'Recebimento por foto da NF', description: 'Confere com o pedido de compra e dá entrada no estoque.', permission: 'purchases.receive' },
            { label: 'Baixa e ajuste por áudio', description: 'Registra consumo, perdas e sobras.', permission: 'inventory.adjust' },
            { label: 'Alerta de estoque mínimo', description: 'Avisa quando insumos críticos atingem o ponto de reposição.', permission: 'inventory.view' }
        ],
        example: [
            { from: 'user', text: '🎤 "Baixa 2 correias e 1 rolamento, saíram pro britador 1."' },
            { from: 'agent', text: 'Vou dar baixa em: Correia 36\\" ×2, Rolamento 22220 ×1. Equipamento: Britador Primário. Confirma? (Sim/Não)' }
        ]
    },
    {
        id: 'purchasing_manager',
        name: 'Gestor de Compras',
        department: 'Suprimentos',
        icon: 'ShoppingBag',
        color: 'orange',
        description: 'Cria ordens de compra, cota com fornecedores e acompanha entregas.',
        audience: 'Compradores',
        minPermissions: ['purchases.view', 'purchases.create', 'suppliers.view'],
        supportsImages: false,
        supportsProactive: true,
        defaultSystemPrompt: `ALÇADA: Suprimentos, Cotações e Ordens de Compra da {{EMPRESA}}.
DIRETRIZES E TRAVAS DE NEGÓCIO:
- COTAÇÃO TRÍPLICE: Exigir 3 fornecedores homologados para aquisições superiores a R$ 3.000,00.
- MAPA COMPARATIVO: Apresentar preço unitário, total, frete (FOB/CIF) e prazo de entrega.
- ALÇADA DE APROVAÇÃO: Ordens de compra acima de {{LIMITE_ALERTA}} exigem validação da gerência.
FORMATO: Direto e estruturado para rápida decisão gerencial via WhatsApp.`,
        fewShotExamples: [
            {
                user: 'Montar cotação para 10.000 litros de Diesel S10',
                assistant: '🛒 *MAPA COMPARATIVO DE COTAÇÕES (10.000 L DIESEL S10)*\n\n1. *Distribuidora Petrobras*:\n   • Preço Unit: R$ 5,82/L | Total: R$ 58.200,00\n   • Frete: CIF (incluso na usina)\n   • Prazo: Entrega em 24h | Pgto: 28 dias\n\n2. *Ipiranga Agro*:\n   • Preço Unit: R$ 5,88/L | Total: R$ 58.800,00\n   • Frete: CIF | Prazo: 48h | Pgto: 30 dias\n\n3. *Posto Shell Rodovia*:\n   • Preço Unit: R$ 5,95/L | Total: R$ 59.500,00\n   • Frete: CIF | Prazo: Imediato | Pgto: 14 dias\n\n💡 *Melhor Custo-Benefício*: Distribuidora Petrobras (Economia de R$ 600,00 e entrega rápida).\nDeseja gerar a Ordem de Compra #OC-990 para Petrobras? (SIM / NÃO)'
            }
        ],
        promptPresets: [
            {
                label: 'Fornecedores Homologados',
                category: 'seguranca',
                prompt: 'Priorizar fornecedores com certificação PBQP-H/ISO e histórico de pontualidade no ERP.'
            },
            {
                label: 'Cotação Tríplice Obrigatória',
                category: 'alcada',
                prompt: 'Para aquisições acima de R$ 3.000,00, montar tabela comparativa com no mínimo 3 cotações de fornecedores homologados.'
            },
            {
                label: 'Negociação Firme e Ágil',
                category: 'tom',
                prompt: 'Destaque prazos de pagamento estendidos (ex: 28/56 dias) e descontos para faturamento em grande lote.'
            },
            {
                label: 'Quadro Comparativo Monospace',
                category: 'formato',
                outputFormat: 'table',
                prompt: 'Tabular cotações em monospace comparando Fornecedor, Preço Unitário, Frete, Prazo de Entrega e Condição.',
                fewShotExample: {
                    user: 'Quadro comparativo diesel',
                    assistant: '```\nFORNECEDOR    UNIT(R$)    TOTAL(R$)   FRETE   PRAZO   COND.\nPetrobras        5,82    58.200,00     CIF     24h    28d\nIpiranga         5,88    58.800,00     CIF     48h    30d\nShell            5,95    59.500,00     CIF     Imed   14d\n```'
                }
            },
            {
                label: 'JSON Ordem de Compra',
                category: 'formato',
                outputFormat: 'json',
                prompt: 'Gerar ordem de compra exclusivamente em JSON minificado com: supplierId, items, paymentTerms, deliveryDate, totalAmount.',
                fewShotExample: {
                    user: 'Exportar OC em JSON',
                    assistant: '{"action":"purchase_order_create","supplierId":"sup_petrobras","items":[{"itemId":"diesel_s10","qty":10000,"unitPrice":5.82}],"deliveryDate":"2026-10-24","paymentTerms":"28d","total":58200}'
                }
            }
        ],
        simulatorQuestions: [
            'Abrir cotação de 30t de cimento com 3 fornecedores homologados',
            'Quais ordens de compra estão pendentes de entrega nesta semana?',
            'Qual o comparativo de preços de diesel do último mês?',
            'Confirmar emissão da ordem de compra OC-902 de peças'
        ],
        capabilities: [
            { label: 'Gerar ordem de compra', description: 'Transforma alertas de estoque baixo em requisição.', permission: 'purchases.create' },
            { label: 'Cotação com fornecedores', description: 'Pede preço e prazo e consolida as respostas numa comparação.', permission: 'suppliers.view' },
            { label: 'Acompanhar pedidos', description: 'Status e previsão de entrega.', permission: 'purchases.view' },
            { label: 'Editar pedidos pendentes', description: 'Ajusta quantidades e condições antes da aprovação.', permission: 'purchases.edit' }
        ],
        example: [
            { from: 'agent', text: '⚠️ Diesel S10 abaixo do mínimo (1.200 L). Deseja abrir cotação com os 3 fornecedores homologados?' },
            { from: 'user', text: 'Sim, 10 mil litros.' }
        ]
    },
    {
        id: 'lab_technician',
        name: 'Laboratorista',
        department: 'Produção',
        icon: 'FlaskConical',
        color: 'teal',
        description: 'Registra ensaios por áudio ou foto e alerta desvios em relação à fórmula/traço.',
        audience: 'Técnicos de laboratório de solos, concreto e asfalto',
        minPermissions: ['quality.manage', 'production.view'],
        supportsImages: true,
        supportsProactive: true,
        defaultSystemPrompt: `ALÇADA: Controle Tecnológico, Laboratório e Qualidade de Pátio da {{EMPRESA}}.
LIMITES NORMATIVOS (ABNT NBR / DNIT):
- SLUMP CONCRETO: Faixa padrão 10 ± 2 cm (8 a 12 cm). Slump fora da faixa: REJEITAR e travar betoneira.
- TEOR DE LIGANTE CBUQ: Tolerância máxima de ± 0,3% em relação ao traço homologado de projeto.
- FCK CORPOS DE PROVA: Auditar resistência aos 7 e 28 dias contra a curva característica do traço.
- DESVIOS: Encabeçar não conformidades com '🚨 NÃO CONFORMIDADE CRÍTICA'.
FORMATO: Laudo tecnológico conciso com Parâmetro, Especificado, Medido e Status.`,
        fewShotExamples: [
            {
                user: 'Slump test do caminhão betoneira 14 acusou 11 cm no traço FCK 30',
                assistant: '🧪 *LAUDO TECNOLÓGICO DE CONCRETO #ENS-804*\n• Equipamento: Caminhão Betoneira 14\n• Traço: Concreto Usinado FCK 30 MPa\n• Slump Medido: 11,0 cm\n• Faixa de Projeto: 10,0 ± 2,0 cm (Tolerância: 8,0 a 12,0 cm)\n• *Resultado*: CONFORME ✅ (Caminhão liberado para obra)\n• Corpos de Prova Coletados: CP-701A (7d) e CP-701B (28d).'
            },
            {
                user: 'Slump test da betoneira 08 acusou 16 cm',
                assistant: '🚨 *NÃO CONFORMIDADE CRÍTICA - CARREGAMENTO TRAVADO*\n• Equipamento: Caminhão Betoneira 08\n• Slump Medido: 16,0 cm (EXCEDE limite máximo de 12,0 cm)\n• Desvio: +4,0 cm de abatimento (excesso de água / segregação)\n• *Ação Imediata*: Betoneira REJEITADA na cabine. Proibida saída para a obra sem correção técnica ou descarte.'
            }
        ],
        promptPresets: [
            {
                label: 'Rastreabilidade de Corpo de Prova',
                category: 'seguranca',
                prompt: 'Sempre associar o código do corpo de prova (CP) à nota fiscal de saída e número da usina de concreto.'
            },
            {
                label: 'Tolerância Slump 10 ± 2 cm',
                category: 'alcada',
                prompt: 'Para concreto usinado padrão, o slump deve estar entre 8 e 12 cm. Fora desta faixa, rejeitar ou ordenar correção imediata.'
            },
            {
                label: 'Rigor Normativo ABNT/DNIT',
                category: 'tom',
                prompt: 'Justifique cada aprovação ou rejeição citando as normas técnicas e faixas granulométricas de projeto.'
            },
            {
                label: 'Tabela Laudo Laboratorial',
                category: 'formato',
                outputFormat: 'table',
                prompt: 'Apresentar parâmetros do laudo em tabela monospace com Parâmetro, Valor Medido, Faixa Projeto e Status.',
                fewShotExample: {
                    user: 'Ver laudo completo',
                    assistant: '```\nPARÂMETRO          MEDIDO     ESPECIFICADO    STATUS\nSlump Test        11,0 cm     10,0 ± 2,0 cm   CONFORME ✅\nTeor Ligante        5,55%      5,50 ± 0,30%   CONFORME ✅\nTemp. Massa        158 °C        150-165 °C   CONFORME ✅\nFCK Estimado 28d   32 MPa        min 30 MPa   CONFORME ✅\n```'
                }
            },
            {
                label: 'JSON Ensaio Tecnológico',
                category: 'formato',
                outputFormat: 'json',
                prompt: 'Gerar registro de laudo exclusivamente em JSON minificado com: batchId, testType, measuredValue, toleranceRange, approved, technician.',
                fewShotExample: {
                    user: 'Exportar laudo em JSON',
                    assistant: '{"action":"quality_test_record","batchId":"BAT-4410","testType":"slump_cone","measured":11.0,"unit":"cm","approved":true,"fckTarget":30}'
                }
            }
        ],
        simulatorQuestions: [
            'Slump test do caminhão betoneira 18 acusou 11 cm',
            'Ensaio de extração de ligante do CBUQ Faixa C deu 5,6%',
            'Corpo de prova CP-402 rompeu com 34 MPa aos 28 dias',
            'Slump acusou 17 cm na usina de concreto (fora da tolerância)'
        ],
        capabilities: [
            { label: 'Registro de ensaios', description: 'Granulometria, teor de ligante, slump, rompimento de corpos de prova.', permission: 'quality.manage' },
            { label: 'Validação contra a fórmula', description: 'Compara o resultado com a faixa de trabalho cadastrada.', permission: 'production.view' },
            { label: 'Alerta de desvio', description: 'Notifica laboratório e operador quando o ensaio sai da faixa.', permission: 'quality.manage' }
        ],
        example: [
            { from: 'user', text: '🎤 "Slump do caminhão 14, 11 centímetros."' },
            { from: 'agent', text: 'Registrado: Slump 11 cm (traço FCK 30, faixa 10 ± 2 cm). Dentro da especificação ✅' }
        ]
    },
    {
        id: 'plant_operator',
        name: 'Operador de Usina',
        department: 'Produção',
        icon: 'Factory',
        color: 'rose',
        description: 'Entrega a fila de ordens de produção e registra início, paradas e consumos.',
        audience: 'Operadores de cabine (asfalto e concreto)',
        minPermissions: ['production.view', 'production.execute'],
        supportsImages: false,
        supportsProactive: true,
        defaultSystemPrompt: `ALÇADA: Operação de Usina (Asfalto CBUQ / Concreto Usinado) da {{EMPRESA}}.
DIRETRIZES OPERACIONAIS DE CABINE:
- TEMPERATURA DA MASSA CBUQ: Faixa ideal 150°C a 165°C.
  - Abaixo de 145°C: Bloquear caçamba por risco de perda de compactação na pista.
  - Acima de 175°C: Bloquear imediatamente por queima do ligante asfáltico (CAP).
- PARADAS: Registrar tempo e motivo para qualquer paralisação superior a 10 minutos.
- EXPEDIÇÃO DE BATELADA: Informar OP, tonelagem/volume, placa do veículo e temperatura de saída.
FORMATO: Frases curtas e operacionais adequadas à rotina da usina.`,
        fewShotExamples: [
            {
                user: 'Iniciando OP-302 de 50 toneladas de CBUQ Faixa C para Construtora Silva',
                assistant: '🏭 *ORDEM DE PRODUÇÃO #OP-302 INICIADA*\n• Usina: Usina de Asfalto Gravimétrica 01\n• Produto: CBUQ Faixa C (DNIT)\n• Volume: 50,0 toneladas (aprox. 3 caçambas trucadas)\n• Temperatura Inicial Secador: 162°C (Faixa Ideal: 150-165°C)\n• Primeiro Veículo na Balança: Caminhão Caçamba ABC-1234\n\nBom turno! Envie a temperatura da massa na descarga da primeira caçamba.'
            },
            {
                user: 'Massa saindo a 140°C no caminhão ABC-1234',
                assistant: '🚨 *TRAVA TÉRMICA DE SEGURANÇA*\nTemperatura medida de 140°C está ABAIXO do limite técnico de 150°C (mínimo de segurança 145°C).\n• *Ação Necessária*: NÃO libere o caminhão para a pista. Ajustar imediatamente a chama do queimador do secador e recircular a massa se necessário.'
            }
        ],
        promptPresets: [
            {
                label: 'Trava de Temperatura CBUQ',
                category: 'seguranca',
                prompt: 'Temperatura da massa asfáltica fora da faixa (150°C-165°C) gera aviso imediato para não carregar caçamba.'
            },
            {
                label: 'Registro de Ociosidade',
                category: 'alcada',
                prompt: 'Exigir justificativa detalhada para qualquer parada de usina superior a 15 minutos em horário de turno.'
            },
            {
                label: 'Comunicação Operacional Curta',
                category: 'tom',
                prompt: 'Mensagens curtas, diretas e com destaque para veículos e bateladas, adequadas à cabine da usina.'
            },
            {
                label: 'Tabela Fila de Produção',
                category: 'formato',
                outputFormat: 'table',
                prompt: 'Exibir fila de OPs do dia em tabela monospace com OP, Produto, Volume, Cliente e Situação.',
                fewShotExample: {
                    user: 'Fila de OPs de hoje',
                    assistant: '```\nOP      PRODUTO        VOLUME   CLIENTE          SITUAÇÃO\nOP-302  CBUQ Faixa C      50t   Silva Constr.    Produzindo ⚡\nOP-303  Concreto FCK30   30m³   Rodovia Sul      Aguardando\nOP-304  CBUQ Binder       80t   Obras BR-101     Programada\n```'
                }
            },
            {
                label: 'JSON Apontamento Batelada',
                category: 'formato',
                outputFormat: 'json',
                prompt: 'Gerar apontamento de batelada exclusivamente em JSON minificado com: opId, tonnage, temperatureC, truckPlate, plantId, timestamp.',
                fewShotExample: {
                    user: 'Exportar batelada em JSON',
                    assistant: '{"action":"batch_finish","opId":"OP-302","tonnage":18.4,"temperatureC":158,"truckPlate":"ABC-1234","plantId":"USINA_ASFALTO_01"}'
                }
            }
        ],
        simulatorQuestions: [
            'Qual a fila de produção de CBUQ liberada para hoje?',
            'Iniciando OP-302 de 50 toneladas de CBUQ Faixa C',
            'Massa saindo a 140°C no caminhão ABC-1234 (temperatura baixa)',
            'Parada de 20 minutos na usina por falta de caçamba na balança'
        ],
        capabilities: [
            { label: 'Fila de produção', description: 'Recebe as OPs liberadas com produto, quantidade e veículo.', permission: 'production.view' },
            { label: 'Apontamento de OP', description: 'Iniciar, pausar e finalizar ordens por mensagem.', permission: 'production.execute' },
            { label: 'Paradas e motivos', description: 'Registra tempo e causa para cálculo de eficiência.', permission: 'production.execute' },
            { label: 'Temperatura e consumo', description: 'Anota temperatura da massa e consumo de combustível.', permission: 'production.execute' }
        ],
        example: [
            { from: 'agent', text: 'Nova OP #302: 25 t CBUQ Faixa C. Caminhão ABC-1234 na balança.' },
            { from: 'user', text: 'Iniciando OP 302' }
        ]
    },
    {
        id: 'crusher_operator',
        name: 'Operador de Britador',
        department: 'Produção',
        icon: 'Mountain',
        color: 'slate',
        description: 'Diário de britagem por voz, horímetro e abertura de OS de manutenção com foto.',
        audience: 'Operadores de britagem e encarregados',
        minPermissions: ['production.execute', 'inventory.view'],
        supportsImages: true,
        supportsProactive: false,
        defaultSystemPrompt: `ALÇADA: Apontamento de Britagem, Horímetro e Manutenção do Pátio da {{EMPRESA}}.
DIRETRIZES OPERACIONAIS DE PÁTIO:
- APONTAMENTO DE TURNO: Horímetro inicial/final, toneladas produzidas por fração e paradas em minutos.
- MOTIVOS DE PARADA: Especificar embuchamento, tela de peneira danificada, correia ou pane elétrica.
- O.S. DE MANUTENÇÃO: Foto de vazamento hidráulico ou dano gera Ordem de Serviço Alta para a mecânica.
FORMATO: Direto em toneladas, horímetro e confirmação de gravação no diário (SIM / NÃO).`,
        fewShotExamples: [
            {
                user: 'Turno 1 fechou com horímetro de 14.880h até 14.887h. Produzimos 750t de brita 1 e 250t de pó de pedra. Tivemos 45 minutos de parada por embuchamento',
                assistant: '⛰️ *DIÁRIO DE TURNO DE BRITAGEM REGISTRADO*\n• Horímetro: 14.880 h -> 14.887 h (Total: 7,0 horas corridas)\n• Horas Efetivas Operadas: 6,25 h | Horas Paradas: 0,75 h (45 min)\n• Causa da Parada: Embuchamento com matacão no Britador Primário\n• *Produção do Turno*:\n  - Brita 1: 750,0 t\n  - Pó de Pedra: 250,0 t\n  - Total Produzido: 1.000,0 t (Taxa: ~160 t/h efetiva)\n\nConfirma a gravação deste apontamento no diário de produção do ERP? (SIM / NÃO)'
            }
        ],
        promptPresets: [
            {
                label: 'Alerta de Embuchamento',
                category: 'seguranca',
                prompt: 'Registrar ocorrências de embuchamento do britador primário com tempo de paralisação e causa da rocha imprópria.'
            },
            {
                label: 'OS Urgente Oficina',
                category: 'alcada',
                prompt: 'Fotos de danos estruturais ou vazamentos hidráulicos geram Ordem de Serviço com prioridade Alta para os mecânicos.'
            },
            {
                label: 'Prático e Confiável',
                category: 'tom',
                prompt: 'Mensagens focadas em toneladas, horímetro e britador específico (primário, secundário ou rebritador VSI).'
            },
            {
                label: 'Diário de Turno Monospace',
                category: 'formato',
                outputFormat: 'table',
                prompt: 'Exibir resumo do turno em tabela monospace com Fração, Toneladas, Horas e Produtividade.',
                fewShotExample: {
                    user: 'Resumo do turno em tabela',
                    assistant: '```\nFRAÇÃO        PRODUÇÃO(t)   PARTICIPAÇÃO   PRODUTIVIDADE\nBrita 1            750 t          75,0%       120 t/h\nPó de Pedra        250 t          25,0%        40 t/h\nTOTAL TURNO      1.000 t         100,0%       160 t/h\n```'
                }
            },
            {
                label: 'JSON Apontamento Britagem',
                category: 'formato',
                outputFormat: 'json',
                prompt: 'Gerar apontamento exclusivamente em JSON minificado com: crusherId, startHour, endHour, tonsTotal, stoppageMinutes, reason.',
                fewShotExample: {
                    user: 'Exportar turno em JSON',
                    assistant: '{"action":"crusher_shift","crusherId":"BRIT_PRIM_01","hoursOperated":6.25,"stoppageMinutes":45,"stoppageReason":"embuchamento","tonsTotal":1000}'
                }
            }
        ],
        simulatorQuestions: [
            'Turno 1 fechou com 750t de brita e horímetro 14.880h',
            'Britador primário parou por embuchamento com matacão',
            'Abrir OS mecânica para vazamento de óleo no britador secundário',
            'Qual o saldo de pedrisco e pó de pedra no pátio?'
        ],
        capabilities: [
            { label: 'Diário de britagem por voz', description: 'Horas trabalhadas, paradas e toneladas produzidas por turno.', permission: 'production.execute' },
            { label: 'Abertura de OS de manutenção', description: 'Foto do problema vira ordem de serviço para a mecânica.', permission: 'fleet.maintenance' },
            { label: 'Consulta de agregados', description: 'Saldo de brita, pó de pedra e rachão.', permission: 'inventory.view' }
        ],
        example: [
            { from: 'user', text: '🎤 "Britador rodou 7 horas, 1 hora parado por embuchamento. Umas 800 toneladas. Horímetro 14.520."' },
            { from: 'agent', text: 'Turno registrado: 7 h, 1 h parada (embuchamento), ~800 t, horímetro 14.520 h. Confirma?' }
        ]
    },
    {
        id: 'fleet_manager',
        name: 'Gestor de Frota',
        department: 'Logística',
        icon: 'Truck',
        color: 'sky',
        description: 'Lança abastecimentos por foto, abre ordens de serviço e acompanha pneus.',
        audience: 'Motoristas, mecânicos e responsável pela frota',
        minPermissions: ['fleet.view', 'fleet.fuel'],
        supportsImages: true,
        supportsProactive: true,
        defaultSystemPrompt: `ALÇADA: Telemetria, Abastecimento e Disponibilidade de Frotas da {{EMPRESA}}.
DIRETRIZES E TRAVAS OPERACIONAIS:
- TRAVA DE HODÔMETRO DECRESCENTE: Proibido lançar km ou horímetro menor ou igual ao último registro no ERP.
- ALERTA DE CONSUMO: Desvio superior a 15% da média histórica (km/L ou L/h) gera auditoria imediata.
- DADOS DE ABASTECIMENTO: Extrair placa/prefixo, tipo de diesel, litros, valor total e km atual.
FORMATO: WhatsApp objetivo com km/L calculado e solicitação de confirmação (SIM / NÃO).`,
        fewShotExamples: [
            {
                user: 'Abastecimento Caminhão ABC-1234: 190L de Diesel S10, valor R$ 1.102,00 no km 184.200 (último km registrado era 183.780)',
                assistant: '🚛 *AUDITORIA DE ABASTECIMENTO REALIZADA*\n• Veículo: Caminhão Caçamba ABC-1234 (Prefixo: CC-04)\n• Combustível: 190,0 L Diesel S10 (R$ 5,80/L = R$ 1.102,00)\n• Hodômetro: 184.200 km (Distância percorrida: 420 km)\n• *Consumo Médio Calculado*: 2,21 km/L\n• Comparativo Histórico: Média usual de 2,25 km/L (Desvio de 1,7% - Dentro do padrão ✅)\n\nConfirma o registro do abastecimento e débito no saldo de diesel? (Responda SIM ou NÃO)'
            },
            {
                user: 'Abastecimento do Caminhão ABC-1234 com km 183.500',
                assistant: '🚨 *TRAVA DE HODÔMETRO DECRESCENTE ACIONADA*\nO km informado (183.500 km) é MENOR que o último hodômetro oficial registrado no ERP (184.200 km).\nPor governança de frota, este lançamento está bloqueado para evitar inconsistência de telemetria.\nFavor conferir a foto do painel e retransmitir o km correto.'
            }
        ],
        promptPresets: [
            {
                label: 'Trava de Hodômetro Decrescente',
                category: 'seguranca',
                prompt: 'Impedir lançamento se a quilometragem ou horímetro informado for menor ou igual ao último registro cadastrado.'
            },
            {
                label: 'Alerta de Consumo Elevado',
                category: 'alcada',
                prompt: 'Avisar motorista e supervisor se o consumo divergir em mais de 15% da média de consumo do modelo.'
            },
            {
                label: 'Direto e Preventivo',
                category: 'tom',
                prompt: 'Foco em disponibilidade mecânica, segurança na estrada e economia de combustível.'
            },
            {
                label: 'Tabela Status da Frota',
                category: 'formato',
                outputFormat: 'table',
                prompt: 'Exibir situação dos veículos em tabela monospace com Placa, Prefixo, Status, KM Atual e Próxima Manutenção.',
                fewShotExample: {
                    user: 'Status da frota',
                    assistant: '```\nPLACA      PREFIXO   STATUS         KM ATUAL    PRÓX. REVISÃO\nABC-1234   CC-04     Operacional    184.200 km   188.000 km (Troca Óleo)\nXYZ-9876   BT-02     Manutenção     210.450 km   Parado (Freios)\nKTM-4412   PC-01     Operacional      8.420 h      8.500 h (Filtros)\n```'
                }
            },
            {
                label: 'JSON Lançamento Combustível',
                category: 'formato',
                outputFormat: 'json',
                prompt: 'Gerar lançamento exclusivamente em JSON minificado com: vehiclePlate, fuelType, liters, totalAmount, odometerKm, driverId, timestamp.',
                fewShotExample: {
                    user: 'Exportar abastecimento em JSON',
                    assistant: '{"action":"fuel_record","plate":"ABC-1234","fuelType":"diesel_s10","liters":190,"totalAmount":1102.00,"odometerKm":184200,"avgKmL":2.21}'
                }
            }
        ],
        simulatorQuestions: [
            'Abastecimento Caminhão ABC-1234: 190L diesel, km 184.200',
            'Quantos veículos da frota estão operacionais hoje?',
            'Caminhão caçamba 08 fez média 1,3 km/l (muito abaixo da média)',
            'Agendar rodízio de pneus para a carreta caçamba 04'
        ],
        capabilities: [
            { label: 'Abastecimento por foto', description: 'Lê o cupom e registra litros, valor e horímetro/km.', permission: 'fleet.fuel' },
            { label: 'Abertura de OS', description: 'Registra defeito e aciona a manutenção.', permission: 'fleet.maintenance' },
            { label: 'Gestão de pneus', description: 'Consulta vida útil e registra rodízios.', permission: 'fleet.tires' },
            { label: 'Status da frota', description: 'Situação dos veículos e equipamentos.', permission: 'fleet.view' }
        ],
        example: [
            { from: 'user', text: '📷 (foto do cupom de abastecimento)' },
            { from: 'agent', text: 'Caminhão ABC-1234: 180 L de diesel, R$ 1.047,60. Qual o odômetro atual?' }
        ]
    },
    {
        id: 'hr_analyst',
        name: 'Analista de RH',
        department: 'Recursos Humanos',
        icon: 'Users',
        color: 'indigo',
        description: 'Consulta de colaboradores, ponto, férias e adiantamentos por mensagem.',
        audience: 'Equipe de RH e Departamento Pessoal',
        minPermissions: ['hr.view', 'hr.time'],
        supportsImages: false,
        supportsProactive: true,
        defaultSystemPrompt: `ALÇADA: Recursos Humanos, Ponto Eletrônico e Departamento Pessoal da {{EMPRESA}}.
DIRETRIZES E CONFORMIDADE LGPD:
- SIGILO ABSOLUTO (LGPD): Proibido divulgar salários nominais, CPF ou dados bancários em mensagens.
- VALES E ADIANTAMENTOS: Limite de 40% do salário-base e apenas para colaboradores ativos.
- FÉRIAS: Validar período aquisitivo e saldo de dias antes de confirmar agendamento.
FORMATO: Comunicação clara, formal e orientada a prazos regimentais.`,
        fewShotExamples: [
            {
                user: 'Quem está programado para entrar de férias na próxima semana no setor de britagem e usina?',
                assistant: '🏖️ *PROGRAMAÇÃO DE FÉRIAS DA PRÓXIMA SEMANA*\n• Setor: Produção e Pátio\n1. *João Pereira* (Operador de Usina)\n   - Período: 26/10/2026 a 14/11/2026 (20 dias)\n   - Substituto alinhado: Carlos Mendes\n2. *Marta Souza* (Auxiliar de Almoxarifado)\n   - Período: 28/10/2026 a 06/11/2026 (10 dias)\n\nAvisos de férias já foram assinados e encaminhados ao DP ✅.'
            },
            {
                user: 'Solicitar adiantamento de R$ 800 para colaborador João da Usina',
                assistant: '💼 *SOLICITAÇÃO DE ADIANTAMENTO SALARIAL*\n• Colaborador: João Pereira (Matrícula: 1042)\n• Valor Solicitado: R$ 800,00\n• Limite Máximo Permitido (40%): Aprovado dentro do teto estatutário\n• Desconto programado na folha de competência: 11/2026\n\nConfirmar o envio desta solicitação para liberação do Supervisor e DP? (Responda SIM ou NÃO)'
            }
        ],
        promptPresets: [
            {
                label: 'Sigilo Salarial Rigoroso (LGPD)',
                category: 'seguranca',
                prompt: 'Sob nenhuma hipótese revele valores de salário, remuneração variável ou comissões por mensagem de WhatsApp.'
            },
            {
                label: 'Limite de Vale a 40%',
                category: 'alcada',
                prompt: 'Limitar vales e adiantamentos a no máximo 40% do vencimento base e apenas para colaboradores ativos há mais de 90 dias.'
            },
            {
                label: 'Acolhedor e Formal',
                category: 'tom',
                prompt: 'Trate os colaboradores com respeito, gentileza e clareza sobre direitos trabalhistas e prazos.'
            },
            {
                label: 'Tabela Escala de Plantão Monospace',
                category: 'formato',
                outputFormat: 'table',
                prompt: 'Exibir escalas de turno em tabela monospace com Nome, Setor, Turno e Folga Programada.',
                fewShotExample: {
                    user: 'Escala do turno de amanhã',
                    assistant: '```\nCOLABORADOR       SETOR       TURNO             FOLGA\nJoão Pereira      Usina       07h às 16h        Domingo\nCarlos Mendes     Usina       15h às 23h        Segunda\nMarcos Lima       Britador    07h às 16h        Domingo\n```'
                }
            },
            {
                label: 'JSON Solicitação DP',
                category: 'formato',
                outputFormat: 'json',
                prompt: 'Gerar solicitação de adiantamento ou férias exclusivamente em JSON minificado com: employeeId, requestType, amount, startDate, status.',
                fewShotExample: {
                    user: 'Exportar vale em JSON',
                    assistant: '{"action":"salary_advance","employeeId":"emp_joao_1042","amount":800.00,"deductMonth":"2026-11","status":"pending_approval"}'
                }
            }
        ],
        simulatorQuestions: [
            'Quem está programado para entrar de férias na próxima semana?',
            'Consultar espelho de ponto e horas extras do turno da noite',
            'Solicitar adiantamento salarial de R$ 500 para João da Usina',
            'Quantos colaboradores ativos temos no setor de produção?'
        ],
        capabilities: [
            { label: 'Consulta de colaboradores', description: 'Dados cadastrais e situação (sem dados salariais).', permission: 'hr.view' },
            { label: 'Controle de ponto', description: 'Consulta e ajuste de registros de jornada.', permission: 'hr.time' },
            { label: 'Gestão de férias', description: 'Agenda e aprova períodos de férias.', permission: 'hr.vacations' },
            { label: 'Vales e adiantamentos', description: 'Acompanha e aprova solicitações.', permission: 'hr.advances' }
        ],
        example: [
            { from: 'user', text: 'Quem está de férias na próxima semana?' },
            { from: 'agent', text: '2 colaboradores: João Pereira (Operador, 26/10–14/11) e Marta Souza (Almoxarife, 28/10–06/11).' }
        ]
    }
];

/** Prompt de sistema especializado do Agente de Código (ADM). */
export const CODE_AGENT_SYSTEM_PROMPT = `Você é o Agente de Código e Arquitetura do InfraCore ERP.
Você atende EXCLUSIVAMENTE a Super Administradores autenticados via WhatsApp ou Painel do Sistema.
GUARDRAILS E DIRETRIZES DE SEGURANÇA MANDATÓRIAS:
1. ARQUIVOS RESTRITOS: Jamais inspecione, exiba, altere ou sugira modificações em arquivos de segredos e credenciais: .env, .env.*, .env.local, .env.production, senhas, tokens de API, chaves privadas (*.pem, *.key) e arquivos de banco sensíveis (supabase_schema.sql, reset_db.sql, src/lib/supabase.ts).
2. FLUXO DE PROPOSTAS: Toda sugestão deve ser empacotada em uma proposta com Título, Tipo (Bugfix, Refatoração, Nova Funcionalidade, Performance, Segurança), Prioridade, Arquivos Alvo e Descrição Clara.
3. RAMIFICAÇÃO (BRANCHES): Nunca aplique código direto na branch principal de produção. Em modo 'branch_and_pr', prepare branches com prefixo 'ai/fix-*' ou 'ai/feat-*' para Pull Request com Code Review supervisionado por humano.
4. BANCO DE DADOS: Alterações em esquemas de dados devem ser entregues como scripts de migração SQL para análise e execução manual pelo DBA/Administrador.
5. TYPESCRIPT ESTREITO: Mantenha compatibilidade rigorosa com TypeScript ('npx tsc --noEmit' com 0 erros) e boas práticas do ecossistema React/Vite.`;

/** Proteções do agente de código. São exibidas na tela, mas DEVEM ser aplicadas no servidor. */
export const CODE_AGENT_GUARDRAILS: string[] = [
    'Somente usuários com perfil de Super Administrador e número previamente cadastrado podem falar com este agente.',
    'Nunca grava direto na branch principal: toda alteração vira uma branch com Pull Request para revisão humana.',
    'Toda proposta exige aprovação explícita de um administrador antes de ser aplicada.',
    'Arquivos sensíveis são bloqueados para edição: .env*, chaves de API, credenciais e scripts críticos de banco.',
    'Alterações em banco de dados (SQL) são entregues como script para execução manual, nunca executadas diretamente pelo agente.',
    'Todas as solicitações, propostas e aprovações ficam registradas na Auditoria.'
];

export const CODE_AGENT_PROTECTED_PATHS: string[] = [
    '.env',
    '.env.*',
    '.env.local',
    '.env.production',
    'supabase_schema.sql',
    'reset_db.sql',
    'src/lib/supabase.ts',
    'credentials.json',
    'id_rsa',
    '*.pem',
    '*.key'
];

/** Verifica se um arquivo ou caminho é protegido pelos guardrails de segurança do ERP. */
export const isProtectedPath = (filePath: string): boolean => {
    if (!filePath) return false;
    const clean = filePath.trim().toLowerCase().replace(/\\/g, '/');
    const base = clean.split('/').pop() || clean;
    if (base.startsWith('.env')) return true;
    if (base.endsWith('.pem') || base.endsWith('.key') || base.endsWith('.crt')) return true;
    if (clean.includes('credential') || clean.includes('secret') || clean.includes('password')) return true;
    return CODE_AGENT_PROTECTED_PATHS.some(p => {
        const pattern = p.toLowerCase().replace(/\\/g, '/');
        if (pattern.endsWith('*')) {
            const prefix = pattern.slice(0, -1);
            return clean.startsWith(prefix) || base.startsWith(prefix);
        }
        return clean === pattern || base === pattern;
    });
};

export const DEFAULT_AGENT_SETTINGS: AIAgentSettings = {
    enabled: false,
    links: [],
    acceptAudio: true,
    acceptImages: true,
    requireConfirmation: true,
    proactiveAlerts: true,
    customSystemPrompt: ''
};

export const DEFAULT_AI_CONFIG: AIAgentsConfig = {
    gatewayEnabled: false,
    gateway: {
        provider: 'evolution',
        instanceName: '',
        webhookUrl: '',
        senderPhone: '',
        scheduleMode: '24x7',
        confirmationTimeoutMinutes: 15
    },
    agents: {},
    codeAgent: { enabled: false, links: [], mode: 'suggest_only', proposals: [] }
};

export const getAgentSettings = (config: AIAgentsConfig, agentId: string): AIAgentSettings => ({
    ...DEFAULT_AGENT_SETTINGS,
    ...(config.agents?.[agentId] || {})
});

/** Lê a configuração salva (mesclada com os padrões), sem alterar o objeto de settings. */
export const getAIConfig = (settings: AppSettings): AIAgentsConfig => {
    const saved: Partial<AIAgentsConfig> = settings.integrations?.[AI_AGENTS_KEY]?.config || {};
    return {
        gatewayEnabled: saved.gatewayEnabled ?? DEFAULT_AI_CONFIG.gatewayEnabled,
        gateway: { ...DEFAULT_AI_CONFIG.gateway, ...(saved.gateway || {}) },
        agents: saved.agents || {},
        codeAgent: {
            ...DEFAULT_AI_CONFIG.codeAgent,
            ...(saved.codeAgent || {}),
            links: saved.codeAgent?.links || [],
            proposals: saved.codeAgent?.proposals || []
        }
    };
};

/** Devolve um novo settings com a configuração dos agentes gravada em integrations. */
export const setAIConfig = (settings: AppSettings, config: AIAgentsConfig): AppSettings => ({
    ...settings,
    integrations: {
        ...(settings.integrations || {}),
        [AI_AGENTS_KEY]: {
            name: 'Agentes de IA (WhatsApp)',
            status: config.gatewayEnabled ? 'Ativo' : 'Inativo',
            category: 'Inteligência Artificial',
            config
        }
    }
});

// ---------------------------------------------------------------------------
// Telefone
// ---------------------------------------------------------------------------

/** Mantém só dígitos e garante o DDI 55 (Brasil). Retorna '' se o número for inválido. */
export const normalizePhone = (raw: string): string => {
    let digits = (raw || '').replace(/\D/g, '');
    if (digits.length === 10 || digits.length === 11) digits = '55' + digits;
    // 55 + DDD (2) + número (8 ou 9 dígitos)
    if (!/^55\d{10,11}$/.test(digits)) return '';
    return digits;
};

export const formatPhone = (digits: string): string => {
    const raw = (digits || '').replace(/\D/g, '');
    let norm = raw;
    if (norm.length === 10 || norm.length === 11) norm = '55' + norm;
    const m = /^(\d{2})(\d{2})(\d{4,5})(\d{4})$/.exec(norm);
    return m ? `+${m[1]} (${m[2]}) ${m[3]}-${m[4]}` : digits;
};

/** Formata o número em tempo real enquanto o usuário digita: (DD) 9XXXX-XXXX ou +55 (DD) 9XXXX-XXXX */
export const formatPhoneInput = (raw: string): string => {
    let digits = (raw || '').replace(/\D/g, '');
    if (digits.startsWith('55') && digits.length > 11) {
        digits = digits.slice(2);
    }
    digits = digits.slice(0, 11);
    if (digits.length === 0) return '';
    if (digits.length <= 2) return `(${digits}`;
    if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
};

/** Valida se o número possui DDD válido (11 a 99) e quantidade correta de dígitos para o padrão brasileiro. */
export const isValidPhone = (raw: string): boolean => {
    const norm = normalizePhone(raw);
    if (!norm || norm.length < 12 || norm.length > 13) return false;
    const ddd = parseInt(norm.slice(2, 4), 10);
    if (ddd < 11 || ddd > 99) return false;
    const local = norm.slice(4);
    if (local.length === 9 && local[0] !== '9') return false;
    return local.length === 8 || local.length === 9;
};

/** Retorna mensagem explicativa se o telefone for inválido ou incompleto. */
export const getPhoneValidationMessage = (raw: string): string | null => {
    const trimmed = (raw || '').trim();
    if (!trimmed) return 'Informe o número com DDD.';
    const digits = trimmed.replace(/\D/g, '');
    if (digits.length < 10) return 'Número incompleto: informe DDD + número (ex: (11) 98765-4321).';
    if (!isValidPhone(trimmed)) return 'DDD ou número inválido (padrão Brasil: DDD 11 a 99 com 8 ou 9 dígitos).';
    return null;
};

// ---------------------------------------------------------------------------
// Validação de Webhook
// ---------------------------------------------------------------------------

export interface WebhookValidationResult {
    isValid: boolean;
    isHttps: boolean;
    isLocal: boolean;
    protocol: string;
    hostname: string;
    pathname: string;
    message: string;
    level: 'empty' | 'valid' | 'warning' | 'error';
}

export const validateWebhookUrl = (rawUrl: string): WebhookValidationResult => {
    const url = (rawUrl || '').trim();
    if (!url) {
        return {
            isValid: false,
            isHttps: false,
            isLocal: false,
            protocol: '',
            hostname: '',
            pathname: '',
            message: 'Nenhum webhook configurado. O gateway não conseguirá despachar mensagens.',
            level: 'empty'
        };
    }

    try {
        const parsed = new URL(url);
        const isHttps = parsed.protocol === 'https:';
        const isHttp = parsed.protocol === 'http:';
        const isLocal = parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1' || parsed.hostname.endsWith('.local');

        if (!isHttps && !isHttp) {
            return {
                isValid: false,
                isHttps: false,
                isLocal,
                protocol: parsed.protocol,
                hostname: parsed.hostname,
                pathname: parsed.pathname,
                message: 'Protocolo inválido. O webhook precisa utilizar HTTPS (ou HTTP local para desenvolvimento).',
                level: 'error'
            };
        }

        if (isHttp && !isLocal) {
            return {
                isValid: true,
                isHttps: false,
                isLocal: false,
                protocol: 'http:',
                hostname: parsed.hostname,
                pathname: parsed.pathname,
                message: 'Aviso: HTTP não é criptografado. Em produção na nuvem, utilize HTTPS obrigatoriamente.',
                level: 'warning'
            };
        }

        if (isLocal) {
            return {
                isValid: true,
                isHttps,
                isLocal: true,
                protocol: parsed.protocol,
                hostname: parsed.hostname,
                pathname: parsed.pathname,
                message: `Ambiente Local detectado (${parsed.hostname}). Indicado para testes locais e túneis (ngrok/cloudflared).`,
                level: 'warning'
            };
        }

        return {
            isValid: true,
            isHttps: true,
            isLocal: false,
            protocol: 'https:',
            hostname: parsed.hostname,
            pathname: parsed.pathname,
            message: 'Endpoint HTTPS seguro e validado. Pronto para receber webhooks do WhatsApp.',
            level: 'valid'
        };
    } catch {
        return {
            isValid: false,
            isHttps: false,
            isLocal: false,
            protocol: '',
            hostname: '',
            pathname: '',
            message: 'URL inválida. Certifique-se de digitar uma URL completa (ex: https://api.empresa.com.br/webhook).',
            level: 'error'
        };
    }
};

// ---------------------------------------------------------------------------
// Sessão do WhatsApp e Diagnóstico de Conexão
// ---------------------------------------------------------------------------

export type WhatsAppSessionStatus = 'disconnected' | 'connecting' | 'qrcode' | 'connected';

export interface GatewayPingResult {
    timestamp: string;
    latencyMs: number;
    status: 'success' | 'warning' | 'error';
    provider: string;
    endpoint: string;
    message: string;
}

export const getConnectionQuality = (latencyMs: number): { label: string; color: string; badgeClass: string } => {
    if (latencyMs <= 180) {
        return { label: 'Excelente', color: 'emerald', badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' };
    }
    if (latencyMs <= 380) {
        return { label: 'Boa', color: 'sky', badgeClass: 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300' };
    }
    return { label: 'Instável', color: 'amber', badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' };
};

// ---------------------------------------------------------------------------
// Mensagens Interativas do WhatsApp (Botões & Listas por Permissões do Usuário)
// ---------------------------------------------------------------------------

export interface WhatsAppInteractiveActionButton {
    id: string;
    title: string;
    permission: string;
    isWriteAction: boolean;
    description?: string;
    promptQuery: string;
}

export interface WhatsAppInteractivePayload {
    type: 'button' | 'list';
    headerText: string;
    bodyText: string;
    footerText: string;
    buttonListText?: string;
    buttons?: Array<{ id: string; title: string; isWriteAction: boolean; promptQuery: string }>;
    sections?: Array<{
        title: string;
        rows: Array<{ id: string; title: string; description: string; isWriteAction: boolean; promptQuery: string }>;
    }>;
}

/** Mapeamento de ações interativas amigáveis para cada capacidade dos agentes */
export const getInteractiveActionForCapability = (
    agentId: string,
    capLabel: string,
    permission: string,
    capDesc: string
): WhatsAppInteractiveActionButton => {
    const isWrite = permission.includes('.create') ||
        permission.includes('.approve') ||
        permission.includes('.edit') ||
        permission.includes('.adjust') ||
        permission.includes('.delete') ||
        capLabel.toLowerCase().includes('aprovar') ||
        capLabel.toLowerCase().includes('cadastrar') ||
        capLabel.toLowerCase().includes('registrar') ||
        capLabel.toLowerCase().includes('solicitar');

    // Título curto de até 20 caracteres para botões do WhatsApp
    let shortTitle = capLabel;
    if (capLabel.toLowerCase().includes('orçamento') && capLabel.toLowerCase().includes('consultar')) shortTitle = '📊 Orçamentos';
    else if (capLabel.toLowerCase().includes('pré-venda') || capLabel.toLowerCase().includes('cadastrar')) shortTitle = '📝 Novo Orçamento';
    else if (capLabel.toLowerCase().includes('crédito') || capLabel.toLowerCase().includes('clientes')) shortTitle = '👤 Limite Crédito';
    else if (capLabel.toLowerCase().includes('desconto')) shortTitle = '⚡ Aprovar Desc.';
    else if (capLabel.toLowerCase().includes('saldo') || capLabel.toLowerCase().includes('caixa')) shortTitle = '💰 Saldo Caixa';
    else if (capLabel.toLowerCase().includes('despesa') || capLabel.toLowerCase().includes('comprovante')) shortTitle = '🧾 Lançar Despesa';
    else if (capLabel.toLowerCase().includes('pagar')) shortTitle = '📅 Contas a Pagar';
    else if (capLabel.toLowerCase().includes('estoque') && capLabel.toLowerCase().includes('posição')) shortTitle = '📦 Posição Estoque';
    else if (capLabel.toLowerCase().includes('mínimo') || capLabel.toLowerCase().includes('crítico')) shortTitle = '⚠️ Estoque Crítico';
    else if (capLabel.toLowerCase().includes('entrada') || capLabel.toLowerCase().includes('lote')) shortTitle = '📥 Registrar Entrada';
    else if (capLabel.toLowerCase().includes('compra') || capLabel.toLowerCase().includes('cotação')) shortTitle = '🛒 Mapa Cotações';
    else if (capLabel.toLowerCase().includes('produção') || capLabel.toLowerCase().includes('batelada')) shortTitle = '⚡ Ordens Produção';
    else if (capLabel.toLowerCase().includes('ensaio') || capLabel.toLowerCase().includes('qualidade')) shortTitle = '🧪 Ver Laudos';
    else if (capLabel.toLowerCase().includes('frota') || capLabel.toLowerCase().includes('veículo')) shortTitle = '🚛 Posição Frota';
    else if (shortTitle.length > 20) shortTitle = shortTitle.slice(0, 19) + '…';

    const promptQuery = isWrite
        ? `Solicitar execução: ${capLabel}`
        : `Consultar dados no ERP: ${capLabel}`;

    const id = `act_${agentId}_${permission.replace(/[^a-z0-9]/gi, '_')}`;

    return {
        id,
        title: shortTitle,
        description: capDesc,
        permission,
        isWriteAction: isWrite,
        promptQuery
    };
};

/** Gera o payload interativo personalizado conforme as permissões do usuário */
export const generateUserWhatsAppInteractiveMenu = (
    agentDef: AIAgentDefinition,
    userRole: AppRole | undefined,
    isSuperAdmin: boolean,
    userName: string = 'Colaborador',
    companyName: string = 'InfraCore ERP'
): {
    payload: WhatsAppInteractivePayload;
    totalAvailable: number;
    authorizedCount: number;
    isList: boolean;
} => {
    const allActions = agentDef.capabilities.map(cap =>
        getInteractiveActionForCapability(agentDef.id, cap.label, cap.permission, cap.description)
    );

    const authorizedActions = allActions.filter(act =>
        isSuperAdmin || roleHasPermission(userRole, act.permission)
    );

    const totalAvailable = allActions.length;
    const authorizedCount = authorizedActions.length;
    const isList = authorizedCount >= 4;

    const headerText = `${companyName} • ${agentDef.name}`;
    const bodyText = authorizedCount > 0
        ? `👋 Olá, ${userName}! Sou o ${agentDef.name}. Selecione uma ação autorizada abaixo:`
        : `⚠️ Olá, ${userName}. Seu perfil (${userRole?.name || 'Sem perfil'}) não possui permissões liberadas para o ${agentDef.name}.`;

    const footerText = 'InfraCore Gateway Oficial • WhatsApp';

    if (authorizedCount === 0) {
        return {
            payload: {
                type: 'button',
                headerText,
                bodyText,
                footerText,
                buttons: [
                    {
                        id: `help_${agentDef.id}`,
                        title: '❓ Solicitar Acesso',
                        isWriteAction: false,
                        promptQuery: `Solicitar acesso às funções do ${agentDef.name} para a administração.`
                    }
                ]
            },
            totalAvailable,
            authorizedCount,
            isList: false
        };
    }

    if (!isList) {
        // Até 3 ações: Formato Botões Rápidos (Quick Reply Buttons)
        return {
            payload: {
                type: 'button',
                headerText,
                bodyText,
                footerText,
                buttons: authorizedActions.slice(0, 3).map(act => ({
                    id: act.id,
                    title: act.title,
                    isWriteAction: act.isWriteAction,
                    promptQuery: act.promptQuery
                }))
            },
            totalAvailable,
            authorizedCount,
            isList: false
        };
    }

    // 4 ou mais ações: Formato Lista Interativa (Interactive List Menu)
    const readActions = authorizedActions.filter(a => !a.isWriteAction);
    const writeActions = authorizedActions.filter(a => a.isWriteAction);

    const sections = [];
    if (readActions.length > 0) {
        sections.push({
            title: 'Consultas e Relatórios',
            rows: readActions.map(act => ({
                id: act.id,
                title: act.title,
                description: act.description || 'Consulta em tempo real no ERP',
                isWriteAction: false,
                promptQuery: act.promptQuery
            }))
        });
    }
    if (writeActions.length > 0) {
        sections.push({
            title: 'Aprovações e Operações',
            rows: writeActions.map(act => ({
                id: act.id,
                title: act.title,
                description: act.description || 'Requer confirmação antes da baixa',
                isWriteAction: true,
                promptQuery: act.promptQuery
            }))
        });
    }

    return {
        payload: {
            type: 'list',
            headerText,
            bodyText,
            footerText,
            buttonListText: '☰ Ver Opções Autorizadas',
            sections
        },
        totalAvailable,
        authorizedCount,
        isList: true
    };
};

// ---------------------------------------------------------------------------
// Modelos de Mensagens para Testes de Envio
// ---------------------------------------------------------------------------

export interface AgentTestTemplate {
    id: string;
    title: string;
    text: string;
    type: 'welcome' | 'alert' | 'confirmation' | 'report';
}

export const AGENT_TEST_TEMPLATES: Record<string, AgentTestTemplate[]> = {
    sales_manager: [
        { id: 'sm_welcome', title: 'Boas-vindas Comercial', text: '👋 Olá! Sou o Gestor de Vendas do InfraCore ERP. Como posso te ajudar hoje com orçamentos ou clientes?', type: 'welcome' },
        { id: 'sm_budget', title: 'Simulação de Orçamento', text: '📄 Orçamento ORC-2041 gerado: 40t Brita 1 para Construtora Horizonte. Total: R$ 4.280,00 com frete incluso.', type: 'report' },
        { id: 'sm_confirm', title: 'Pedido de Aprovação', text: '⚠️ Pedido PED-1082 (R$ 18.500,00) excede o limite normal. Deseja aprovar este pedido? Responda SIM ou NÃO.', type: 'confirmation' }
    ],
    financial_analyst: [
        { id: 'fa_welcome', title: 'Boas-vindas Financeiro', text: '💼 Analista Financeiro online. Envie a foto de um boleto ou comprovante para lançamento imediato no caixa.', type: 'welcome' },
        { id: 'fa_expense', title: 'Confirmação de Despesa', text: '🧾 Comprovante lido: Auto Posto Rodovia, Diesel S10, R$ 1.840,00. Confirma o lançamento na conta Combustível? (SIM/NÃO)', type: 'confirmation' },
        { id: 'fa_due', title: 'Alerta de Vencimentos', text: '🔔 Alerta de Contas: 4 títulos vencem hoje no total de R$ 34.820,00. Deseja ver o resumo detalhado?', type: 'alert' }
    ],
    financial_manager: [
        { id: 'fm_welcome', title: 'Boas-vindas Diretoria', text: '📊 Gerente Financeiro ao seu dispor. Posso enviar o resumo diário de tesouraria ou responder dúvidas sobre o DRE.', type: 'welcome' },
        { id: 'fm_morning', title: 'Resumo Executivo Matinal', text: '☀️ Resumo InfraCore: Saldo bancário total R$ 584.200,00 | Recebíveis hoje: R$ 42.100,00 | Pagamentos: R$ 18.300,00.', type: 'report' },
        { id: 'fm_approve', title: 'Aprovação de Pagamento', text: '⚠️ Solicitação de Baixa: Nota 4518 de Distribuidora de Asfalto (R$ 82.000,00). Autoriza a liquidação? (SIM/NÃO)', type: 'confirmation' }
    ],
    stock_manager: [
        { id: 'stm_welcome', title: 'Boas-vindas Estoque', text: '📦 Almoxarifado InfraCore conectado. Envie foto de NF de entrada ou áudio solicitando baixa de insumo.', type: 'welcome' },
        { id: 'stm_low', title: 'Alerta de Estoque Crítico', text: '⚠️ Estoque Baixo: Cimento CP-II atingiu 12 toneladas (mínimo de segurança: 25 toneladas). Necessário pedido de reposição.', type: 'alert' },
        { id: 'stm_receive', title: 'Conferência de Recebimento', text: '🚛 NF-e 8812 conferida com PO-302. Recebidos 32.000 L de emulsão RR-2C. Entrada lançada no almoxarifado.', type: 'report' }
    ],
    purchasing_manager: [
        { id: 'pm_welcome', title: 'Boas-vindas Compras', text: '🛒 Gestor de Compras ativo. Posso abrir ordens de compra ou disparar cotações com fornecedores homologados.', type: 'welcome' },
        { id: 'pm_quote', title: 'Mapa Comparativo de Cotação', text: '📋 Cotação Concluída (20t Brita 0): Fornecedor A: R$ 78/t (entrega 2 dias) | Fornecedor B: R$ 74/t (entrega 5 dias). Qual deseja selecionar?', type: 'report' },
        { id: 'pm_confirm', title: 'Autorização de Compra', text: '⚠️ Ordem de Compra OC-991 para Peças Britador (R$ 7.450,00) pronta para disparo. Confirma emissão? (SIM/NÃO)', type: 'confirmation' }
    ],
    lab_technician: [
        { id: 'lab_welcome', title: 'Boas-vindas Laboratório', text: '🧪 Laboratório de Qualidade conectado. Envie ensaios de traço, granulometria ou rompimento de corpos de prova.', type: 'welcome' },
        { id: 'lab_alert', title: 'Alerta de Não Conformidade', text: '🚨 NÃO CONFORMIDADE: Ensaio de Slump da Usina 1 acusou 16 cm (especificado: 10 ± 2 cm). Paralisar carregamento para ajuste de água!', type: 'alert' },
        { id: 'lab_ok', title: 'Ensaio em Conformidade', text: '✅ Ensaio de Extração de Betume CBUQ Faixa C: 5,6% (faixa de projeto: 5,4% a 5,8%). Traço aprovado para aplicação.', type: 'report' }
    ],
    plant_operator: [
        { id: 'po_welcome', title: 'Boas-vindas Usina', text: '🏭 Assistente de Usina pronto. Acompanhe a fila de produção e registre bateladas ou paradas por mensagem.', type: 'welcome' },
        { id: 'po_temp', title: 'Alerta de Temperatura CBUQ', text: '🌡️ Atenção Usina: Temperatura de saída da massa em 142°C (mínimo recomendado: 150°C). Ajustar queimador do secador.', type: 'alert' },
        { id: 'po_batch', title: 'Status de Ordem de Produção', text: '⚡ OP-552 Concluída: 120 toneladas de Concreto FCK 30 usinadas e expedidas em 15 caminhões betoneira.', type: 'report' }
    ],
    crusher_operator: [
        { id: 'co_welcome', title: 'Boas-vindas Britagem', text: '⛰️ Central de Britagem conectada. Envie o diário de turno por áudio ou foto de horímetro dos britadores.', type: 'welcome' },
        { id: 'co_os', title: 'Abertura de O.S. Mecânica', text: '🛠️ OS-810 Aberta com sucesso: Vazamento hidráulico no Britador Secundário. Mecânico de plantão notificado.', type: 'alert' },
        { id: 'co_shift', title: 'Resumo de Turno Britagem', text: '📊 Turno 1 Finalizado: 680t Brita 1 | 340t Brita 2 | 210t Pó de pedra. Horas operadas: 6,8h (parada 1,2h troca de tela).', type: 'report' }
    ],
    fleet_manager: [
        { id: 'fm_fl_welcome', title: 'Boas-vindas Frota', text: '🚛 Gestor de Frota ativo. Envie foto de cupons de combustível ou informe quebras mecânicas para socorro rápido.', type: 'welcome' },
        { id: 'fm_fl_fuel', title: 'Alerta de Consumo Elevado', text: '⚠️ Atenção: Caminhão MB-2730 (Placa ABC-4D88) registrou média 1,4 km/l (média histórica: 2,2 km/l). Verificar telemetria.', type: 'alert' },
        { id: 'fm_fl_tire', title: 'Inspeção de Pneus', text: '🛞 Pneu Fogo #402 atingiu 45.000 km no eixo de tração. Recomendado rodízio para o eixo livre esta semana.', type: 'report' }
    ],
    hr_analyst: [
        { id: 'hr_welcome', title: 'Boas-vindas RH/DP', text: '👥 Atendimento de RH e DP InfraCore. Consulte férias, escalas de folga e solicite vales de forma privada.', type: 'welcome' },
        { id: 'hr_advance', title: 'Confirmação de Adiantamento', text: '💰 Solicitação de Adiantamento Salarial (R$ 600,00) de João Silva encaminhada para aprovação do supervisor.', type: 'confirmation' },
        { id: 'hr_vacation', title: 'Programação de Férias', text: '🏖️ Aviso de Férias: Férias programadas para 03/11 a 22/11 (20 dias). Assinatura do aviso disponível no DP.', type: 'report' }
    ],
    code_agent: [
        { id: 'ca_welcome', title: 'Boas-vindas Agente de Código', text: '💻 Agente de Código e Arquitetura ativo. Autenticado como Super Administrador. Como posso colaborar no código do ERP?', type: 'welcome' },
        { id: 'ca_pr', title: 'Alerta de Pull Request', text: '🚀 Proposta PR #88 criada na branch ai/fix-dre-filter. 3 arquivos alterados, 0 erros no lint. Aguardando aprovação.', type: 'report' },
        { id: 'ca_security', title: 'Guardrail de Segurança Acionado', text: '🛡️ Bloqueio de Segurança: Tentativa de alteração em .env bloqueada pelas diretrizes de governança.', type: 'alert' }
    ]
};

// ---------------------------------------------------------------------------
// Permissões
// ---------------------------------------------------------------------------

const PERMISSION_NAMES: Record<string, string> = APP_PERMISSIONS.reduce((acc, cat) => {
    cat.permissions.forEach(p => { acc[p.id] = p.name; });
    return acc;
}, {} as Record<string, string>);

export const getPermissionName = (id: string): string => PERMISSION_NAMES[id] || id;

export const isSuperAdminRole = (role: AppRole | undefined): boolean =>
    !!role && (
        role.permissions.includes('all') ||
        role.permissions.includes('*') ||
        role.id === 'admin' ||
        /^(adm|admin|administrador|super\s*admin)/i.test(role.name?.trim() || '')
    );

export const findUserRole = (user: User | null | undefined, roles: AppRole[]): AppRole | undefined => {
    if (!user) return undefined;
    return (
        roles.find(r => r.id === user.roleId) ||
        (user.roleId === 'admin' || user.username?.toLowerCase() === 'admin'
            ? roles.find(r => isSuperAdminRole(r))
            : undefined)
    );
};

export const isUserAdmin = (user: User | null | undefined, roles: AppRole[]): boolean => {
    if (!user) return false;
    if (user.roleId === 'admin' || user.username?.toLowerCase() === 'admin') return true;
    return isSuperAdminRole(findUserRole(user, roles));
};

export const roleHasPermission = (role: AppRole | undefined, permission: string): boolean => {
    if (!role) return false;
    return isSuperAdminRole(role) || role.permissions.includes(permission);
};

/** Um usuário só pode ser vinculado a um agente se estiver ativo e seu perfil tiver todas as permissões mínimas. */
export const getUserEligibility = (
    user: User,
    roles: AppRole[],
    minPermissions: string[]
): { eligible: boolean; missing: string[] } => {
    const role = findUserRole(user, roles);
    if (user.status !== 'Ativo') return { eligible: false, missing: [] };
    if (isUserAdmin(user, roles)) return { eligible: true, missing: [] };
    const missing = minPermissions.filter(p => !roleHasPermission(role, p));
    return { eligible: missing.length === 0, missing };
};

/** Resume o que mudou na configuração dos agentes, para o log de auditoria. Retorna null se nada mudou. */
export const describeAIConfigChange = (
    prev: AIAgentsConfig,
    next: AIAgentsConfig
): { action: string; details: string; severity: 'info' | 'warning' } | null => {
    if (JSON.stringify(prev) === JSON.stringify(next)) return null;
    const codeChanged = JSON.stringify(prev.codeAgent) !== JSON.stringify(next.codeAgent);
    const activeAgents = Object.values(next.agents).filter(a => a.enabled).length;
    const parts = [
        `Gateway: ${next.gatewayEnabled ? 'ligado' : 'desligado'}`,
        `Agentes ativos: ${activeAgents}`
    ];
    if (codeChanged) {
        parts.push(
            `Agente de Código: ${next.codeAgent.enabled ? 'ativo' : 'inativo'}, modo ${next.codeAgent.mode}, ` +
            `${next.codeAgent.links.length} número(s) autorizado(s), ${next.codeAgent.proposals.length} proposta(s)`
        );
    }
    return {
        action: codeChanged ? 'Alterou configuração do Agente de Código' : 'Alterou configuração dos Agentes de IA',
        details: parts.join(' | '),
        severity: codeChanged ? 'warning' : 'info'
    };
};

export const newId = (): string => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

export type { AIAgentNumberLink };

// ---------------------------------------------------------------------------
// Conectividade e Resiliência com Google Gemini API
// ---------------------------------------------------------------------------

export interface GeminiHealthStatus {
    status: 'connected' | 'offline' | 'no_key' | 'rate_limited';
    latencyMs: number;
    model: string;
    message: string;
}

export interface GeminiAgentCallResult {
    text: string;
    isFallback: boolean;
    fallbackReason?: 'no_api_key' | 'rate_limit_429' | 'network_error' | 'invalid_response';
    modelUsed: string;
    latencyMs: number;
}

export const getGeminiApiKey = (explicitKey?: string): string => {
    if (explicitKey && explicitKey.trim()) return explicitKey.trim();
    try {
        const local = localStorage.getItem('infracore_gemini_api_key');
        if (local && local.trim()) return local.trim();
    } catch {
        // Ignora restrições do navegador
    }
    try {
        if (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_GEMINI_API_KEY) {
            return ((import.meta as any).env.VITE_GEMINI_API_KEY as string).trim();
        }
    } catch {
        // Ignora
    }
    try {
        if (typeof process !== 'undefined' && process.env) {
            const envKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
            if (envKey && typeof envKey === 'string' && envKey.trim()) {
                return envKey.trim();
            }
        }
    } catch {
        // Ignora
    }
    return '';
};

export const saveLocalGeminiApiKey = (key: string): void => {
    try {
        if (!key || !key.trim()) {
            localStorage.removeItem('infracore_gemini_api_key');
        } else {
            localStorage.setItem('infracore_gemini_api_key', key.trim());
        }
    } catch {
        // Ignora restrições de localStorage
    }
};

export const maskApiKey = (key: string): string => {
    if (!key) return '';
    const clean = key.trim();
    if (clean.length <= 8) return '••••••••';
    return `${clean.slice(0, 4)}••••${clean.slice(-4)}`;
};

/** Constrói o System Prompt expandido com contexto ERP, guardrails e few-shot */
export const buildAgentGeminiSystemInstruction = (
    agentDef: AIAgentDefinition,
    config: AIAgentsConfig,
    companyName: string = 'InfraCore Soluções',
    userName: string = 'Colaborador'
): string => {
    const s = getAgentSettings(config, agentDef.id);
    const basePrompt = agentDef.defaultSystemPrompt;
    const customPrompt = s.customSystemPrompt || '';

    const combined = customPrompt ? `${basePrompt}\n\n[DIRETRIZES COMPLEMENTARES]:\n${customPrompt}` : basePrompt;
    const interpolated = interpolatePromptVariables(combined, {
        companyName,
        userName,
        alertLimit: 'R$ 5.000,00',
        costCenter: 'Geral / Matriz',
        scheduleMode: config.gateway.scheduleMode
    });

    const guardrailRules = [
        'FORMATO: Português do Brasil, objetivo e conciso para WhatsApp (máximo 3 a 5 linhas ou tabela compacta).',
        'MONETÁRIO: Padrão pt-BR estrito (ex: R$ 1.250,00).',
        'OPERAÇÕES NO ERP: Toda gravação, alteração ou baixa exige confirmação explícita (SIM / NÃO).',
        'EFICIÊNCIA DE TOKENS: Responda diretamente ao ponto sem introduções prolixas ou saudações repetitivas.'
    ];

    return `${interpolated}\n\n[GUARDRAILS DE OPERAÇÃO DO GATEWAY WHATSAPP]:\n${guardrailRules.join('\n')}`;
};

/** Chamador resiliente da API do Gemini com fallback automático e exponential backoff */
export const callGeminiAgentApi = async (
    prompt: string,
    agentDef: AIAgentDefinition,
    config: AIAgentsConfig,
    companyName: string = 'InfraCore Soluções',
    userName: string = 'Colaborador',
    fallbackReplyGenerator?: (prompt: string) => string,
    explicitApiKey?: string
): Promise<GeminiAgentCallResult> => {
    const start = Date.now();
    const apiKey = getGeminiApiKey(explicitApiKey);

    if (!apiKey) {
        const text = fallbackReplyGenerator ? fallbackReplyGenerator(prompt) : `[Modo Heurístico Local] Mensagem processada para o ${agentDef.name}.`;
        return {
            text,
            isFallback: true,
            fallbackReason: 'no_api_key',
            modelUsed: 'Heurístico Local (Sem Chave)',
            latencyMs: Date.now() - start
        };
    }

    const systemInstruction = buildAgentGeminiSystemInstruction(agentDef, config, companyName, userName);

    // Monta contents incluindo Few-Shot examples
    const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

    // Inclui few-shots definidos no catálogo do agente
    if (agentDef.fewShotExamples && agentDef.fewShotExamples.length > 0) {
        for (const fs of agentDef.fewShotExamples) {
            contents.push({ role: 'user', parts: [{ text: fs.user }] });
            contents.push({ role: 'model', parts: [{ text: fs.assistant }] });
        }
    }

    // Inclui a pergunta atual
    contents.push({ role: 'user', parts: [{ text: prompt }] });

    const modelsToTry = ['gemini-2.5-flash', 'gemini-1.5-flash'];

    for (const model of modelsToTry) {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

        const payload = {
            system_instruction: {
                parts: [{ text: systemInstruction }]
            },
            contents,
            generationConfig: {
                temperature: 0.15,
                maxOutputTokens: 512
            }
        };

        for (let attempt = 0; attempt < 2; attempt++) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 9000);

                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                    signal: controller.signal
                });

                clearTimeout(timeoutId);

                if (response.status === 429) {
                    // Rate limit: backoff breve antes de tentar novamente
                    if (attempt === 0) {
                        await new Promise(r => setTimeout(r, 1200));
                        continue;
                    }
                    throw new Error('RATE_LIMIT_429');
                }

                if (!response.ok) {
                    const errStatus = response.status;
                    // Se modelo não disponível tentar próximo da lista
                    if (errStatus === 404) break;
                    throw new Error(`HTTP_${errStatus}`);
                }

                const data = await response.json();
                const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

                if (candidateText && typeof candidateText === 'string') {
                    return {
                        text: candidateText.trim(),
                        isFallback: false,
                        modelUsed: model,
                        latencyMs: Date.now() - start
                    };
                }
            } catch (err: any) {
                if (err && err.message === 'RATE_LIMIT_429') {
                    const fallbackText = fallbackReplyGenerator ? fallbackReplyGenerator(prompt) : `⚠️ [Cota de Requisições Atingida (429)] Resposta local de contingência para: "${prompt}"`;
                    return {
                        text: fallbackText,
                        isFallback: true,
                        fallbackReason: 'rate_limit_429',
                        modelUsed: 'Fallback Heurístico (Rate Limit 429)',
                        latencyMs: Date.now() - start
                    };
                }
                if (attempt === 1) break;
            }
        }
    }

    // Se esgotar modelos ou falha de rede geral, ativa o fallback gracioso local
    const fallbackText = fallbackReplyGenerator ? fallbackReplyGenerator(prompt) : `[Modo Heurístico de Contingência] Processamento concluído para: "${prompt}"`;
    return {
        text: fallbackText,
        isFallback: true,
        fallbackReason: 'network_error',
        modelUsed: 'Fallback Heurístico Local',
        latencyMs: Date.now() - start
    };
};

// ---------------------------------------------------------------------------
// Fila de Confirmações e Alertas Proativos do Gateway WhatsApp
// ---------------------------------------------------------------------------

export type ConfirmationActionType =
    | 'despesa_baixa'
    | 'aprovacao_orcamento'
    | 'ordem_compra'
    | 'abastecimento_combustivel'
    | 'parada_usina'
    | 'adiantamento_rh';

export interface WhatsAppPendingConfirmation {
    id: string;
    agentId: string;
    agentName: string;
    agentColor: 'indigo' | 'emerald' | 'amber' | 'sky' | 'rose' | 'violet' | 'orange' | 'teal' | 'slate';
    actionType: ConfirmationActionType;
    title: string;
    description: string;
    targetUserName: string;
    targetUserPhone: string;
    createdAt: string; // ISO
    expiresAt: string; // ISO
    status: 'pendente' | 'aprovado' | 'rejeitado' | 'expirado';
    metadata: {
        value?: number;
        documentNumber?: string;
        partnerName?: string;
        plate?: string;
        liters?: number;
        costCenter?: string;
        [key: string]: any;
    };
    respondedAt?: string;
    responseChannel?: 'whatsapp_button' | 'whatsapp_text' | 'painel_web';
}

export interface WhatsAppProactiveTrigger {
    id: string;
    agentId: string;
    category: 'estoque_critico' | 'contas_a_vencer' | 'consumo_anomalo' | 'nao_conformidade_usina' | 'inadimplencia_cliente';
    title: string;
    triggerCondition: string;
    sampleMessage: string;
    severity: 'info' | 'warning' | 'critical';
    actionType: ConfirmationActionType;
    defaultTargetRole: string;
}

export const ERP_PROACTIVE_TRIGGERS: WhatsAppProactiveTrigger[] = [
    {
        id: 'trig_diesel_critico',
        agentId: 'stock_manager',
        category: 'estoque_critico',
        title: 'Estoque de Diesel Abaixo do Mínimo',
        triggerCondition: 'Saldo de Diesel S10 inferior a 3.000 Litros (< 2 dias de autonomia)',
        sampleMessage: '⚠️ *ALERTA DE ESTOQUE CRÍTICO*: Diesel S10 atingiu 2.100 L no pátio. Autoriza abertura emergencial de cotação para 10.000 L?',
        severity: 'critical',
        actionType: 'ordem_compra',
        defaultTargetRole: 'Gerente de Compras / Almoxarife'
    },
    {
        id: 'trig_contas_hoje',
        agentId: 'financial_analyst',
        category: 'contas_a_vencer',
        title: 'Títulos com Vencimento Hoje (> R$ 10.000)',
        triggerCondition: 'Títulos pendentes de liquidação na data corrente',
        sampleMessage: '🔔 *CONTAS DO DIA*: Título PAG-348 de R$ 32.000,00 da Petrobras vence hoje. Confirma agendamento de liquidação no Banco do Brasil?',
        severity: 'warning',
        actionType: 'despesa_baixa',
        defaultTargetRole: 'Gerente Financeiro / Tesouraria'
    },
    {
        id: 'trig_consumo_frota',
        agentId: 'fleet_manager',
        category: 'consumo_anomalo',
        title: 'Desvio de Consumo de Combustível > 15%',
        triggerCondition: 'Média de km/l de caminhão divergente em mais de 15% do histórico',
        sampleMessage: '⚠️ *AUDITORIA DE COMBUSTÍVEL*: Caminhão Caçamba CC-04 registrou 1,4 km/L (média usual: 2,2 km/L). Deseja abrir OS de inspeção mecânica?',
        severity: 'warning',
        actionType: 'abastecimento_combustivel',
        defaultTargetRole: 'Gestor de Frotas'
    },
    {
        id: 'trig_slump_usina',
        agentId: 'lab_technician',
        category: 'nao_conformidade_usina',
        title: 'Não Conformidade no Slump Test (> 12 cm)',
        triggerCondition: 'Ensaio de cone de Abrams fora da faixa de 10 ± 2 cm',
        sampleMessage: '🚨 *NÃO CONFORMIDADE*: Caminhão Betoneira 08 acusou Slump de 16 cm (limite máx 12 cm). Confirma travamento da saída para a obra?',
        severity: 'critical',
        actionType: 'parada_usina',
        defaultTargetRole: 'Encarregado de Laboratório / Usina'
    },
    {
        id: 'trig_inadimplencia',
        agentId: 'sales_manager',
        category: 'inadimplencia_cliente',
        title: 'Tentativa de Pedido com Títulos Vencidos > 5d',
        triggerCondition: 'Cliente com duplicatas em atraso tenta emitir novo pedido',
        sampleMessage: '🛑 *TRAVA DE CRÉDITO*: Construtora Silva possui R$ 14.200 em aberto há 8 dias. Deseja aprovar exceção comercial sob alçada?',
        severity: 'critical',
        actionType: 'aprovacao_orcamento',
        defaultTargetRole: 'Diretoria Comercial'
    }
];

export const INITIAL_PENDING_CONFIRMATIONS: WhatsAppPendingConfirmation[] = [
    {
        id: 'conf_101',
        agentId: 'financial_analyst',
        agentName: 'Analista Financeiro',
        agentColor: 'emerald',
        actionType: 'despesa_baixa',
        title: 'Liquidação de Boleto • Petrobras Distribuidora',
        description: 'Boleto referente a 5.000 L Diesel S10 (Danfe 84102) com vencimento na data corrente.',
        targetUserName: 'Carlos Tesouraria',
        targetUserPhone: '5511988887777',
        createdAt: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
        expiresAt: new Date(Date.now() + 11 * 60 * 1000).toISOString(),
        status: 'pendente',
        metadata: {
            value: 29100.0,
            partnerName: 'Petrobras Distribuidora S/A',
            documentNumber: 'BOL-84102',
            costCenter: 'Usina de Asfalto 01'
        }
    },
    {
        id: 'conf_102',
        agentId: 'purchasing_manager',
        agentName: 'Gestor de Compras',
        agentColor: 'orange',
        actionType: 'ordem_compra',
        title: 'Aprovação de Ordem de Compra #OC-992',
        description: 'Cotação vencedora para 30 toneladas de Cimento CP-II (Votoran R$ 74/t).',
        targetUserName: 'Mariana Gerência',
        targetUserPhone: '5511977776666',
        createdAt: new Date(Date.now() - 6 * 60 * 1000).toISOString(),
        expiresAt: new Date(Date.now() + 9 * 60 * 1000).toISOString(),
        status: 'pendente',
        metadata: {
            value: 22200.0,
            partnerName: 'Votorantim Cimentos',
            documentNumber: 'OC-992',
            costCenter: 'Pátio Central'
        }
    },
    {
        id: 'conf_103',
        agentId: 'fleet_manager',
        agentName: 'Gestor de Frota',
        agentColor: 'sky',
        actionType: 'abastecimento_combustivel',
        title: 'Auditoria de Abastecimento Externo • Placa ABC-1234',
        description: 'Cupom de 210L de Diesel S10 lançado no Posto Rodovia via WhatsApp.',
        targetUserName: 'Encarregado Mecânica',
        targetUserPhone: '5511966665555',
        createdAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
        expiresAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
        status: 'aprovado',
        metadata: {
            value: 1218.0,
            plate: 'ABC-1234',
            liters: 210,
            costCenter: 'Frota Pesada'
        },
        respondedAt: new Date(Date.now() - 18 * 60 * 1000).toISOString(),
        responseChannel: 'whatsapp_button'
    }
];

// ---------------------------------------------------------------------------
// Motor de Roteamento Inteligente & Intenções (Smart Dispatcher)
// ---------------------------------------------------------------------------

export interface SmartRouteRule {
    agentId: string;
    department: string;
    keywords: string[];
    regexPatterns: string[];
    associatedRoles: string[];
    weight: number;
}

export interface SmartRouterResult {
    matchedAgentId: string | null;
    matchedAgentName: string | null;
    matchedDepartment: string | null;
    confidenceScore: number;
    matchedKeywords: string[];
    matchedRegex: string[];
    resolutionReason: string;
    isAmbiguous: boolean;
    alternativeAgents?: Array<{ agentId: string; name: string; score: number }>;
    interactiveMenuText?: string;
}

export const SMART_ROUTING_RULES: SmartRouteRule[] = [
    {
        agentId: 'sales_manager',
        department: 'Comercial / Vendas',
        keywords: ['orçamento', 'orcamento', 'venda', 'pedido de venda', 'cliente', 'limite de credito', 'tabela de preco', 'desconto comercial', 'fob', 'cif'],
        regexPatterns: [
            '\\b(or[cç]amentos?|vendas?|clientes?|limite de cr[eé]dito|tabela de pre[cç]o)\\b',
            '\\b(desconto comercial|frete\\s*cif|frete\\s*fob|pedido de venda)\\b'
        ],
        associatedRoles: ['admin', 'comercial', 'vendas', 'gerente'],
        weight: 1.0
    },
    {
        agentId: 'financial_analyst',
        department: 'Financeiro',
        keywords: ['saldo', 'caixa', 'banco', 'boleto', 'pagar', 'receber', 'inadimplencia', 'inadimplência', 'conciliação', 'extrato', 'duplicata', 'ted', 'pix', 'juros'],
        regexPatterns: [
            '\\b(boleto|boletos|saldo|caixa|pagar|pagamentos?|receber|recebimentos?|extrato|duplicata)\\b',
            '\\b(inadimpl[eê]ncia|concilia[cç][aã]o|pix|ted|banco)\\b'
        ],
        associatedRoles: ['admin', 'financeiro', 'diretoria', 'gerente'],
        weight: 1.0
    },
    {
        agentId: 'financial_manager',
        department: 'Diretoria / Gestão Financeira',
        keywords: ['dre', 'ebitda', 'margem', 'fluxo de caixa executivo', 'resumo de caixa', 'diretoria', 'balancete', 'alçada financeira', 'liberação diretoria'],
        regexPatterns: [
            '\\b(dre|ebitda|margem operacional|fluxo de caixa|balancete)\\b',
            '\\b(resumo executivo|diretoria financeira|aprova[cç][aã]o diretoria)\\b'
        ],
        associatedRoles: ['admin', 'diretoria', 'gerente', 'financeiro'],
        weight: 1.0
    },
    {
        agentId: 'stock_manager',
        department: 'Almoxarifado & Estoque',
        keywords: ['estoque', 'almoxarifado', 'entrada de nf', 'danfe', 'nota fiscal', 'ponto de ressuprimento', 'saldo de estoque', 'material', 'insumo', 'curva abc', 'inventario', 'inventário'],
        regexPatterns: [
            '\\b(estoque|almoxarifado|saldo de estoque|insumos?|ponto de ressuprimento)\\b',
            '\\b(invent[aá]rio|curva abc|danfe|nota fiscal|entrada de nf)\\b'
        ],
        associatedRoles: ['admin', 'almoxarifado', 'compras', 'suprimentos', 'gerente'],
        weight: 1.0
    },
    {
        agentId: 'purchasing_manager',
        department: 'Suprimentos & Compras',
        keywords: ['compras', 'pedido de compra', 'cotação', 'cotacao', 'fornecedor', 'ordem de compra', 'mapa de cotação', 'negociação', 'comprar', 'prazo de entrega'],
        regexPatterns: [
            '\\b(compras?|comprar|cota[cç][aã]o|mapa de cota[cç][aã]o|fornecedor(es)?)\\b',
            '\\b(pedido de compra|ordem de compra|requisi[cç][aã]o de compra)\\b'
        ],
        associatedRoles: ['admin', 'compras', 'suprimentos', 'diretoria', 'gerente'],
        weight: 1.0
    },
    {
        agentId: 'lab_technician',
        department: 'Qualidade & Laboratório',
        keywords: ['laboratório', 'laboratorio', 'ensaio', 'corpos de prova', 'ruptura', 'cbr', 'umidade', 'umidade ótima', 'compactação', 'compactacao', 'proctor', 'granulometria ensaio', 'slump'],
        regexPatterns: [
            '\\b(laborat[oó]rio|ensaio|corpos? de prova|ruptura|cbr|proctor|slump)\\b',
            '\\b(umidade [oó]tima|compacta[cç][aã]o|amostra|laudo t[eé]cnico)\\b'
        ],
        associatedRoles: ['admin', 'qualidade', 'laboratorio', 'engenharia'],
        weight: 1.0
    },
    {
        agentId: 'plant_operator',
        department: 'Produção / Usina de Asfalto e Concreto',
        keywords: ['usina', 'cbuq', 'asfalto', 'cap', 'cap 50/70', 'faixa c', 'faixa b', 'temperatura da massa', 'silo de massa', 'massa asfaltica', 'asfáltica', 'secador', 'betoneira', 'concreto'],
        regexPatterns: [
            '\\b(cbuq|asfalto|massa asf[aá]ltica|cap\\s*50/70|cap|faixa\\s*[abc])\\b',
            '\\b(temperatura da massa|silo de massa|secador|usina de concreto|betoneira)\\b'
        ],
        associatedRoles: ['admin', 'operacoes', 'usina', 'producao', 'gerente'],
        weight: 1.0
    },
    {
        agentId: 'crusher_operator',
        department: 'Produção / Britagem',
        keywords: ['britador', 'britagem', 'rebritador', 'mandíbula', 'mandibula', 'granulometria', 'bica corrida', 'pó de brita', 'po de brita', 'brita 0', 'brita 1', 'brita 2', 'rachão', 'rachao', 'pedreira', 'alimentador'],
        regexPatterns: [
            '\\b(britador|britagem|rebritador|mand[ií]bula|pedreira|bica corrida|p[oó] de brita)\\b',
            '\\b(brita\\s*[0123]|rach[aã]o|alimentador|granulometria)\\b'
        ],
        associatedRoles: ['admin', 'operacoes', 'usina', 'producao', 'gerente'],
        weight: 1.0
    },
    {
        agentId: 'fleet_manager',
        department: 'Frotas & Equipamentos',
        keywords: ['frota', 'caminhão', 'caminhao', 'cc-', 'placa', 'abastecimento', 'diesel', 'combustivel', 'combustível', 'pneu', 'odometro', 'odômetro', 'horimetro', 'horímetro', 'manutencao', 'manutenção', 'motorista', 'troca de oleo', 'óleo'],
        regexPatterns: [
            '\\b(frota|caminh[aã]o|ve[ií]culo|placa|diesel|abastecimento|abastecer|combust[ií]vel)\\b',
            '\\b(od[oô]metro|hor[ií]metro|km|pneu|manuten[cç][aã]o|troca de [oó]leo|cc-\\d+)\\b'
        ],
        associatedRoles: ['admin', 'operacoes', 'frotas', 'gerente', 'motorista'],
        weight: 1.0
    },
    {
        agentId: 'hr_analyst',
        department: 'Recursos Humanos & DP',
        keywords: ['rh', 'recursos humanos', 'folha', 'folha de pagamento', 'ponto', 'holerite', 'horas extras', 'admissão', 'admissao', 'demissão', 'demissao', 'atestado', 'férias', 'ferias', 'escala', 'vale'],
        regexPatterns: [
            '\\b(rh|folha de pagamento|holerite|ponto eletr[oô]nico|horas extras?|vale)\\b',
            '\\b(admiss[aã]o|demiss[aã]o|atestado|f[eé]rias|benef[ií]cios)\\b'
        ],
        associatedRoles: ['admin', 'rh', 'dp', 'diretoria', 'gerente'],
        weight: 1.0
    }
];

export const evaluateSmartRoute = (
    message: string,
    userRole?: string,
    isCollaborator: boolean = true,
    companyName?: string
): SmartRouterResult => {
    const normalized = (message || '').toLowerCase().trim();

    // Cenário 1: Público Externo / Não Cadastrado
    if (!isCollaborator) {
        const salesAgent = AI_AGENT_CATALOG.find(a => a.id === 'sales_manager') || AI_AGENT_CATALOG[0];
        const publicMenu = buildPublicClientMenu(companyName);

        // Se for saudação, pedido de menu ou mensagem vazia
        if (!normalized || /^(oi|ol[aá]|bom dia|boa tarde|boa noite|menu|ajuda|in[ií]cio|come[cç]ar|\?)$/i.test(normalized)) {
            return {
                matchedAgentId: 'sales_manager',
                matchedAgentName: salesAgent.name,
                matchedDepartment: 'Comercial & Central de Atendimento',
                confidenceScore: 100,
                matchedKeywords: ['central_atendimento', 'public_menu'],
                matchedRegex: ['menu_publico_externo'],
                resolutionReason: 'Público Externo: Atendimento direcionado à Central de Atendimento & Vendas.',
                isAmbiguous: false,
                interactiveMenuText: publicMenu
            };
        }

        // Se for qualquer interesse em cotação, compra, materiais ou suporte de pedidos
        return {
            matchedAgentId: 'sales_manager',
            matchedAgentName: salesAgent.name,
            matchedDepartment: 'Comercial & Central de Atendimento',
            confidenceScore: 95,
            matchedKeywords: ['cliente_externo', 'vendas'],
            matchedRegex: ['triagem_publica'],
            resolutionReason: 'Público Externo: Roteamento prioritário para o Gestor Comercial Virtual.',
            isAmbiguous: false,
            interactiveMenuText: publicMenu
        };
    }

    if (!normalized) {
        return {
            matchedAgentId: null,
            matchedAgentName: null,
            matchedDepartment: null,
            confidenceScore: 0,
            matchedKeywords: [],
            matchedRegex: [],
            resolutionReason: 'Mensagem vazia recebida pelo gateway.',
            isAmbiguous: true,
            interactiveMenuText: buildInteractiveRoutingMenu()
        };
    }

    const scores = [];
    const normRole = (userRole || '').toLowerCase();

    for (const rule of SMART_ROUTING_RULES) {
        let score = 0;
        const matchedKws = [];
        const matchedRegexes = [];

        for (const pattern of rule.regexPatterns) {
            try {
                const reg = new RegExp(pattern, 'i');
                if (reg.test(normalized)) {
                    score += 40;
                    matchedRegexes.push(pattern);
                }
            } catch {
                // regex safe guard
            }
        }

        for (const kw of rule.keywords) {
            if (normalized.includes(kw.toLowerCase())) {
                score += 15;
                if (!matchedKws.includes(kw)) {
                    matchedKws.push(kw);
                }
            }
        }

        const hasRoleBonus = rule.associatedRoles.some(r => normRole.includes(r));
        if (hasRoleBonus && score > 0) {
            score += 25;
        }

        if (score > 0) {
            scores.push({
                rule,
                score: Math.min(score, 100),
                matchedKws,
                matchedRegexes,
                hasRoleBonus
            });
        }
    }

    scores.sort((a, b) => b.score - a.score);

    if (scores.length === 0) {
        return {
            matchedAgentId: null,
            matchedAgentName: null,
            matchedDepartment: null,
            confidenceScore: 0,
            matchedKeywords: [],
            matchedRegex: [],
            resolutionReason: 'Nenhum termo ou padrão de departamento reconhecido.',
            isAmbiguous: true,
            interactiveMenuText: buildInteractiveRoutingMenu()
        };
    }

    const top = scores[0];
    const runnerUp = scores[1];
    const topAgent = AI_AGENT_CATALOG.find(a => a.id === top.rule.agentId);

    if (runnerUp && (top.score - runnerUp.score) < 10 && !top.hasRoleBonus && !runnerUp.hasRoleBonus) {
        const altAgent = AI_AGENT_CATALOG.find(a => a.id === runnerUp.rule.agentId);
        return {
            matchedAgentId: top.rule.agentId,
            matchedAgentName: topAgent?.name || top.rule.department,
            matchedDepartment: top.rule.department,
            confidenceScore: top.score,
            matchedKeywords: top.matchedKws,
            matchedRegex: top.matchedRegexes,
            resolutionReason: `Empate detectado entre ${top.rule.department} (${top.score}%) e ${runnerUp.rule.department} (${runnerUp.score}%). Sugerido menu interativo.`,
            isAmbiguous: true,
            alternativeAgents: [
                { agentId: top.rule.agentId, name: topAgent?.name || top.rule.department, score: top.score },
                { agentId: runnerUp.rule.agentId, name: altAgent?.name || runnerUp.rule.department, score: runnerUp.score }
            ],
            interactiveMenuText: buildInteractiveRoutingMenu([top.rule.agentId, runnerUp.rule.agentId])
        };
    }

    let reason = `Correspondência determinística com ${top.rule.department} (${top.matchedKws.length} termo(s) e ${top.matchedRegexes.length} padrão(ões))`;
    if (top.hasRoleBonus) {
        reason += ` reforçado pela alçada do cargo '${userRole}'.`;
    }

    return {
        matchedAgentId: top.rule.agentId,
        matchedAgentName: topAgent?.name || top.rule.department,
        matchedDepartment: top.rule.department,
        confidenceScore: top.score,
        matchedKeywords: top.matchedKws,
        matchedRegex: top.matchedRegexes,
        resolutionReason: reason,
        isAmbiguous: false,
        alternativeAgents: scores.slice(1, 3).map(s => ({
            agentId: s.rule.agentId,
            name: AI_AGENT_CATALOG.find(a => a.id === s.rule.agentId)?.name || s.rule.department,
            score: s.score
        }))
    };
};

export const buildInteractiveRoutingMenu = (filterAgentIds?: string[]): string => {
    const list = filterAgentIds && filterAgentIds.length > 0
        ? AI_AGENT_CATALOG.filter(a => filterAgentIds.includes(a.id))
        : AI_AGENT_CATALOG;

    let text = '👋 *InfraCore ERP • Triagem Inteligente de Atendimento*\n\n';
    text += 'Não identificamos o departamento da sua mensagem com certeza total. Por favor, *responda com o NÚMERO* da opção desejada:\n\n';

    list.forEach((ag, idx) => {
        text += `*${idx + 1}* - ${ag.name} (${ag.department})\n`;
    });

    text += '\nOu digite *AJUDA* para falar com o suporte administrativo.';
    return text;
};

/** Gera o Menu Comercial Consultivo em 4 opções para o público geral / clientes externos */
export const buildPublicClientMenu = (companyName?: string): string => {
    const comp = companyName || 'InfraCore Soluções em Obras';
    return `👋 Olá! Bem-vindo à Central de Atendimento da *${comp}*.\n\n` +
        `Como podemos acelerar sua obra hoje? Digite o *NÚMERO* da opção desejada:\n\n` +
        `*1* - 📋 *Solicitar Orçamento / Preços* (Britas, CBUQ, Concreto Usinado, Frete CIF/FOB)\n` +
        `*2* - 📦 *Já Sou Cliente* (Status de Pedidos, Cargas em Trânsito e 2ª Via de Boletos/NF)\n` +
        `*3* - 🏭 *Conhecer a Empresa & Usinas* (Capacidade industrial, pedreiras e laudos de qualidade)\n` +
        `*4* - 👤 *Falar com Consultor Comercial* (Negociação direta para grandes volumes)\n\n` +
        `Ou simplesmente envie sua dúvida que nosso assistente virtual responderá imediatamente!`;
};

/** Verifica se um número de telefone pertence a um colaborador interno cadastrado */
export const isRegisteredCollaboratorPhone = (
    phone: string,
    agentsConfig?: AIAgentsConfig,
    registeredUsers?: { phone?: string; id?: string; name?: string }[]
): boolean => {
    const clean = (phone || '').replace(/\D/g, '');
    if (!clean || clean.length < 8) return false;

    // 1. Verifica vínculos nos agentes configurados
    if (agentsConfig?.agents) {
        for (const agentSettings of Object.values(agentsConfig.agents)) {
            if (agentSettings.links && Array.isArray(agentSettings.links)) {
                for (const link of agentSettings.links) {
                    const lclean = (link.phone || '').replace(/\D/g, '');
                    if (lclean && (clean === lclean || clean.endsWith(lclean) || lclean.endsWith(clean))) {
                        return true;
                    }
                }
            }
        }
    }

    // 2. Verifica cadastro geral de usuários do ERP
    if (registeredUsers && Array.isArray(registeredUsers)) {
        for (const user of registeredUsers) {
            const uclean = (user.phone || '').replace(/\D/g, '');
            if (uclean && (clean === uclean || clean.endsWith(uclean) || uclean.endsWith(clean))) {
                return true;
            }
        }
    }

    return false;
};

// ---------------------------------------------------------------------------
// Gestão de Sessões Multi-Turno & Memória Conversacional
// ---------------------------------------------------------------------------

export interface WhatsAppMessageItem {
    id: string;
    role: 'user' | 'model';
    text: string;
    timestamp: string;
    modelUsed?: string;
    isFallback?: boolean;
}

export interface WhatsAppConversationSession {
    id: string;
    phoneNumber: string;
    contactName: string;
    agentId: string;
    agentName: string;
    department: string;
    status: 'active' | 'closed' | 'paused';
    createdAt: string;
    lastInteractionAt: string;
    turnsCount: number;
    messages: WhatsAppMessageItem[];
    contextSummary?: string;
}

export const INITIAL_CONVERSATION_SESSIONS: WhatsAppConversationSession[] = [
    {
        id: 'session_finance_carlos',
        phoneNumber: '5511988887777',
        contactName: 'Carlos Tesouraria',
        agentId: 'financial_analyst',
        agentName: 'Analista Financeiro',
        department: 'Financeiro',
        status: 'active',
        createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
        lastInteractionAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        turnsCount: 2,
        contextSummary: 'Liquidação de boletos do dia e projeção de caixa Banco do Brasil',
        messages: [
            {
                id: 'm1',
                role: 'user',
                text: 'Qual o total de contas a pagar com vencimento hoje?',
                timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString()
            },
            {
                id: 'm2',
                role: 'model',
                text: '☀️ Bom dia, Carlos! Hoje temos 3 títulos a pagar totalizando R$ 45.200,00 no ERP:\n1. Petrobras Distribuidora (Diesel S10): R$ 29.100,00\n2. Votorantim Cimentos (Cimento): R$ 12.500,00\n3. Enel Distribuição (Energia Usina): R$ 3.600,00\n\nNosso saldo em conta corrente no Banco do Brasil é de R$ 84.100,00.',
                timestamp: new Date(Date.now() - 14 * 60 * 1000).toISOString(),
                modelUsed: 'gemini-2.5-flash'
            },
            {
                id: 'm3',
                role: 'user',
                text: 'E quanto disso vence até o meio-dia? Qual o impacto no caixa se liquidarmos o boleto da Petrobras agora?',
                timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString()
            },
            {
                id: 'm4',
                role: 'model',
                text: 'Até as 12h vence apenas o boleto da Petrobras (R$ 29.100,00). Ao liquidá-lo, seu saldo no Banco do Brasil passará de R$ 84.100,00 para R$ 55.000,00, mantendo margem de segurança confortável de liquidez para as obrigações da tarde.\n\nDeseja que eu efetive a baixa do título BOL-84102 no ERP agora? (SIM/NÃO)',
                timestamp: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
                modelUsed: 'gemini-2.5-flash'
            }
        ]
    },
    {
        id: 'session_fleet_marcos',
        phoneNumber: '5511966665555',
        contactName: 'Encarregado Mecânica',
        agentId: 'fleet_manager',
        agentName: 'Gestor de Frota',
        department: 'Frotas & Equipamentos',
        status: 'active',
        createdAt: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
        lastInteractionAt: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
        turnsCount: 2,
        contextSummary: 'Disponibilidade de caminhões caçamba na pedreira e abastecimento CC-04',
        messages: [
            {
                id: 'm1',
                role: 'user',
                text: 'Qual a situação dos caminhões caçamba da pedreira hoje?',
                timestamp: new Date(Date.now() - 40 * 60 * 1000).toISOString()
            },
            {
                id: 'm2',
                role: 'model',
                text: '🚛 Olá! Temos 6 caminhões caçamba alocados na pedreira:\n• CC-01, CC-02, CC-03, CC-05, CC-06: 100% operacionais e transportando brita.\n• CC-04: Parado na oficina para troca de pastilhas de freio e óleo diferencial.\n\nPrevisão de liberação do CC-04: 15h30.',
                timestamp: new Date(Date.now() - 39 * 60 * 1000).toISOString(),
                modelUsed: 'gemini-2.5-flash'
            },
            {
                id: 'm3',
                role: 'user',
                text: 'O CC-04 já fez o abastecimento antes de entrar na oficina?',
                timestamp: new Date(Date.now() - 20 * 60 * 1000).toISOString()
            },
            {
                id: 'm4',
                role: 'model',
                text: 'Sim! Foi registrado abastecimento de 190 litros de Diesel S10 às 07:15 no Posto Central com hodômetro em 184.200 km (média de 2,1 km/L). O tanque está com 95% de capacidade.',
                timestamp: new Date(Date.now() - 19 * 60 * 1000).toISOString(),
                modelUsed: 'gemini-2.5-flash'
            }
        ]
    },
    {
        id: 'session_stock_marcelo',
        phoneNumber: '5511955554444',
        contactName: 'Marcelo Almoxarife',
        agentId: 'stock_manager',
        agentName: 'Gestor de Estoque',
        department: 'Almoxarifado & Estoque',
        status: 'active',
        createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        lastInteractionAt: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
        turnsCount: 1,
        contextSummary: 'Posição de Diesel S10 e alerta de ponto de reposição',
        messages: [
            {
                id: 'm1',
                role: 'user',
                text: 'Qual a situação do Diesel S10 e Cimento CP-II no pátio?',
                timestamp: new Date(Date.now() - 8 * 60 * 1000).toISOString()
            },
            {
                id: 'm2',
                role: 'model',
                text: '⚠️ *ALERTA DE PONTO DE REPOSIÇÃO*\n• *Diesel S10*: 2.100 L (Mínimo: 4.000 L) -> Autonomia estimada: ~1,5 dias. 🚨 CRÍTICO\n• *Cimento CP-II*: 42 t (Mínimo: 25 t) -> Autonomia: ~4 dias. ✅ REGULAR\n\nRecomendo emissão de Ordem de Compra emergencial para 10.000 L de Diesel.',
                timestamp: new Date(Date.now() - 7 * 60 * 1000).toISOString(),
                modelUsed: 'gemini-2.5-flash'
            }
        ]
    }
];

export const exportSessionAsText = (session: WhatsAppConversationSession): string => {
    let header = '=======================================================\n';
    header += `HISTÓRICO DE AUDITORIA DE CONVERSA - INFRACORE ERP\n`;
    header += `Agente Especialista: ${session.agentName} (${session.department})\n`;
    header += `Colaborador: ${session.contactName} (${session.phoneNumber})\n`;
    header += `Início da Sessão: ${new Date(session.createdAt).toLocaleString('pt-BR')}\n`;
    header += `Total de Turnos: ${session.turnsCount}\n`;
    header += '=======================================================\n\n';

    const body = session.messages.map(m => {
        const time = new Date(m.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        const sender = m.role === 'user' ? session.contactName : `${session.agentName} [${m.modelUsed || 'IA'}]`;
        return `[${time}] ${sender}:\n${m.text}\n`;
    }).join('\n');

    return header + body;
};

// ---------------------------------------------------------------------------
// Interceptador Determinístico Zero-Token para Comandos Operacionais
// ---------------------------------------------------------------------------

export interface ZeroTokenCommandResult {
    handled: boolean;
    type?: 'confirmation_yes' | 'confirmation_no' | 'numeric_switch' | 'help_menu' | 'direct_query';
    text?: string;
    targetAgentId?: string;
    tokensSaved: number;
    actionAudit?: string;
}

/** Avalia se uma mensagem é um comando operacional conhecido antes de chamar o Gemini */
export const evaluateZeroTokenCommand = (
    message: string,
    currentAgentDef: AIAgentDefinition,
    pendingConfirmations: WhatsAppPendingConfirmation[],
    erpLiveContext?: {
        companyName?: string;
        userName?: string;
        balance?: number;
        receivables?: number;
        payables?: number;
        fleetOperational?: number;
        fleetTotal?: number;
        inventoryCount?: number;
        inventoryLow?: number;
        activeOPs?: number;
        isCollaborator?: boolean;
        senderPhone?: string;
    }
): ZeroTokenCommandResult => {
    const raw = (message || '').trim();
    const normalized = raw.toLowerCase();

    if (!raw) {
        return { handled: false, tokensSaved: 0 };
    }

    const fmt = (v?: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);
    const companyName = erpLiveContext?.companyName || 'InfraCore';
    const isCollab = erpLiveContext?.isCollaborator !== false;

    // =========================================================================
    // FLUXO A: PÚBLICO GERAL / CLIENTES EXTERNOS / PROSPECTS (NÃO CADASTRADOS)
    // =========================================================================
    if (!isCollab) {
        // Opção 1: Solicitar Orçamento / Preços
        if (normalized === '1' || /^(1|or[cç]amentos?|pre[cç]os?|cota[cç][aã]o|solicitar or[cç]amento)$/i.test(normalized)) {
            return {
                handled: true,
                type: 'help_menu',
                targetAgentId: 'sales_manager',
                text: `📋 *SOLICITAÇÃO DE ORÇAMENTO (Central de Atendimento)*\n\nExcelente! Para calcularmos o melhor preço unitário e o frete CIF/FOB ideal para sua obra, por favor informe:\n\n1️⃣ *Material*: Brita (qual graduação?), CBUQ (asfalto) ou Concreto Usinado?\n2️⃣ *Quantidade estimada*: (ex: 30 toneladas ou 45 m³)\n3️⃣ *Local da Obra*: Bairro, Cidade ou Rodovia/KM para entrega\n\nNossa equipe processará sua cotação imediatamente! 🚛`,
                tokensSaved: 460,
                actionAudit: 'Público Externo: Opção 1 (Solicitação de Orçamento) atendida deterministamente.'
            };
        }

        // Opção 2: Já Sou Cliente (Rastreio de Cargas & 2ª Via de Boletos/NF)
        if (normalized === '2' || /^(2|j[aá]\s*sou\s*cliente|pedidos?|status\s*pedidos?|boletos?|2[aª]\s*via|rastreio)$/i.test(normalized)) {
            return {
                handled: true,
                type: 'help_menu',
                targetAgentId: 'sales_manager',
                text: `📦 *PORTAL DO CLIENTE ${companyName.toUpperCase()}*\n\nLocalizamos seu histórico rapidamente! Por favor, informe:\n• O *CNPJ* ou *CPF* cadastrado na compra, ou\n• O *Número do Pedido* (ex: PED-1082).\n\nCom isso você receberá o status das cargas em trânsito e o link direto para 2ª via de boletos e NFe.`,
                tokensSaved: 440,
                actionAudit: 'Público Externo: Opção 2 (Já Sou Cliente / Rastreio) atendida deterministamente.'
            };
        }

        // Opção 3: Conhecer a Empresa & Usinas
        if (normalized === '3' || /^(3|conhecer|usinas?|produtos?|laudos?|estrutura|portfolio|portf[oó]lio)$/i.test(normalized)) {
            return {
                handled: true,
                type: 'help_menu',
                targetAgentId: 'sales_manager',
                text: `🏭 *ESTRUTURA INDUSTRIAL & QUALIDADE*\n\nA *${companyName}* opera com capacidade industrial completa e certificações técnicas rigorosas:\n• *Britagem*: Britas 0, 1, 2, Pedrisco e Rachão com laudos de Abrasão Los Angeles e Sanidade.\n• *Usina de Asfalto*: CBUQ Faixas B e C com ensaios Marshall e controle de teor de CAP 50/70.\n• *Concreto Usinado*: Centrais dosadoras automatizadas com rastreabilidade total de FCK.\n• *Frota Própria*: Caminhões caçamba e betoneiras monitorados em tempo real via GPS.\n\nDeseja cotar para sua obra? Digite *1* para solicitar orçamento ou *4* para falar com um consultor!`,
                tokensSaved: 480,
                actionAudit: 'Público Externo: Opção 3 (Conhecer Empresa & Usinas) atendida deterministamente.'
            };
        }

        // Opção 4: Falar com Consultor Comercial (Retenção Ativa)
        if (normalized === '4' || /^(4|falar\s*com\s*consultor|consultor|atendimento\s*comercial)$/i.test(normalized)) {
            return {
                handled: true,
                type: 'help_menu',
                targetAgentId: 'sales_manager',
                text: `👋 *GERÊNCIA COMERCIAL INFRACORE (Atendimento Especial)*\n\nOlá! Eu sou o Gerente Comercial Virtual da ${companyName}. Tenho autonomia no sistema para aprovar condições especiais e fechar pedidos de grandes volumes com frete otimizado para sua obra.\n\nQual material sua obra precisa no momento? Me conte sua necessidade para eu simular a melhor condição comercial direto na tela!\n\n*(Se preferir o contato direto do consultor sênior externo de campo, digite VENDEDOR).*`,
                tokensSaved: 470,
                actionAudit: 'Público Externo: Opção 4 (Retenção Ativa do Gerente Comercial) acionada deterministamente.'
            };
        }

        // Transbordo Humano Concedido
        if (/^(vendedor|consultor|humano|atendente)$/i.test(normalized)) {
            return {
                handled: true,
                type: 'help_menu',
                targetAgentId: 'sales_manager',
                text: `👤 *CONSULTOR COMERCIAL DESIGNADO*\n\nTransferindo seu atendimento para nosso especialista de grandes obras:\n• Consultor: *Eduardo Mendes (Gerência Comercial)*\n• WhatsApp Direto: *+55 11 98765-4321*\n• E-mail: vendas@infracore.com.br\n\nO histórico da sua solicitação já foi encaminhado para a equipe para atendimento prioritário! ✅`,
                tokensSaved: 450,
                actionAudit: 'Público Externo: Transbordo para vendedor humano concedido.'
            };
        }

        // Saudações ou Solicitação do Menu Público
        if (/^(oi|ol[aá]|bom dia|boa tarde|boa noite|menu|ajuda|help|in[ií]cio|come[cç]ar|comandos?|opcoes|duvidas|\?)$/i.test(normalized)) {
            return {
                handled: true,
                type: 'help_menu',
                targetAgentId: 'sales_manager',
                text: buildPublicClientMenu(companyName),
                tokensSaved: 480,
                actionAudit: 'Público Externo: Menu Comercial Consultivo em 4 Opções entregue deterministamente.'
            };
        }

        // Bloqueio de Comandos Internos de Colaborador
        if (/^(sim|s|n[aã]o|n|saldo|caixa|estoque|almoxarifado|frota|ve[ií]culos?|status|painel)$/i.test(normalized)) {
            return {
                handled: true,
                type: 'help_menu',
                targetAgentId: 'sales_manager',
                text: `🔒 *ACESSO RESTRITO A COLABORADORES*\n\nEste canal operacional é reservado para a equipe interna da ${companyName}.\n\nPara orçamentos, pedidos e suporte à sua obra, digite *MENU* para ver as opções da Central de Atendimento.`,
                tokensSaved: 420,
                actionAudit: 'Público Externo: Tentativa de comando interno bloqueada deterministamente.'
            };
        }

        // Se for qualquer outra mensagem externa, deixa passar para o Gemini tratar comercialmente
        return { handled: false, tokensSaved: 0 };
    }

    // =========================================================================
    // FLUXO B: COLABORADORES INTERNOS CADASTRADOS (10 ESPECIALISTAS DO ERP)
    // =========================================================================

    // 1. Comando de Confirmação "SIM" (Aprovação de Alçada)
    if (/^(sim|s|confirmar|confirmo|ok|positivo|aprovar|aprovado)$/i.test(normalized)) {
        const pending = pendingConfirmations.find(c => c.status === 'pendente' && (c.agentId === currentAgentDef.id || !c.agentId));
        if (pending) {
            return {
                handled: true,
                type: 'confirmation_yes',
                text: `✅ *CONFIRMAÇÃO EFETIVADA NO ERP (Zero-Token)*\nOperação: *${pending.title}*\nStatus: Aprovado e registrado na auditoria oficial.\nHorário: ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}\nCanal: Resposta WhatsApp ("SIM")`,
                tokensSaved: 420,
                actionAudit: `Alçada '${pending.title}' aprovada deterministamente via WhatsApp.`
            };
        }
        return {
            handled: true,
            type: 'confirmation_yes',
            text: 'ℹ️ Nenhuma operação pendente de confirmação no momento para este setor.',
            tokensSaved: 380,
            actionAudit: 'Comando SIM processado localmente sem pendências ativas.'
        };
    }

    // 2. Comando de Rejeição / Cancelamento "NÃO"
    if (/^(n[aã]o|n|cancelar|cancelo|recusar|recuso|negar|negativo)$/i.test(normalized)) {
        const pending = pendingConfirmations.find(c => c.status === 'pendente' && (c.agentId === currentAgentDef.id || !c.agentId));
        if (pending) {
            return {
                handled: true,
                type: 'confirmation_no',
                text: `🛑 *OPERAÇÃO CANCELADA COM SEGURANÇA (Zero-Token)*\nOperação: *${pending.title}*\nStatus: Rejeitado pelo colaborador. Nenhum débito ou alteração foi gravada no ERP.\nHorário: ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`,
                tokensSaved: 410,
                actionAudit: `Alçada '${pending.title}' cancelada com segurança pelo colaborador.`
            };
        }
        return {
            handled: true,
            type: 'confirmation_no',
            text: 'ℹ️ Operação cancelada. Como posso te ajudar em outra solicitação?',
            tokensSaved: 380,
            actionAudit: 'Comando NÃO processado localmente.'
        };
    }

    // 2.1 Central de Atendimento & Vendas - Opção 5 (Falar com Vendedor / Retenção Comercial para colaborador)
    if (normalized === '5' && currentAgentDef.id === 'sales_manager') {
        return {
            handled: true,
            type: 'help_menu',
            text: `👋 *GERÊNCIA COMERCIAL INFRACORE (Atendimento Especial)*\n\nOlá! Eu sou o Gerente Comercial Virtual da ${companyName}. Tenho autonomia direta no sistema para aplicar as melhores condições de pagamento e calcular frete otimizado para sua obra.\n\nQual produto você precisa e qual o local de entrega? Me conte sua necessidade que posso fechar seu pedido agora com desconto especial!\n\n*(Se mesmo assim preferir atendimento humano de campo, digite VENDEDOR para receber o contato direto do consultor sênior).* `,
            tokensSaved: 460,
            actionAudit: 'Retenção ativa do Gerente Comercial acionada deterministamente.'
        };
    }

    if (/^(vendedor|consultor|humano|atendente)$/i.test(normalized) && currentAgentDef.id === 'sales_manager') {
        return {
            handled: true,
            type: 'help_menu',
            text: `👤 *CONSULTOR COMERCIAL DESIGNADO*\n\nTransferindo seu atendimento para nosso especialista de grandes obras:\n• Consultor: *Eduardo Mendes (Gerência Comercial)*\n• WhatsApp Direto: *+55 11 98765-4321*\n• E-mail: vendas@infracore.com.br\n\nO histórico da sua solicitação já foi encaminhado para a equipe para atendimento prioritário! ✅`,
            tokensSaved: 450,
            actionAudit: 'Transbordo humano concluído com entrega de contato direto do vendedor.'
        };
    }

    // 3. Seleção Numérica de Agentes (1 a 10)
    if (/^([1-9]|10)$/.test(normalized)) {
        const index = parseInt(normalized, 10) - 1;
        if (index >= 0 && index < AI_AGENT_CATALOG.length) {
            const target = AI_AGENT_CATALOG[index];
            return {
                handled: true,
                type: 'numeric_switch',
                targetAgentId: target.id,
                text: `🔄 *CONECTADO AO: ${target.name.toUpperCase()} (${target.department})*\n${target.description}\n\nPronto para atender suas solicitações. O que você gostaria de consultar ou registrar?`,
                tokensSaved: 460,
                actionAudit: `Troca rápida de especialista para '${target.name}' via atalho numérico [${raw}].`
            };
        }
    }

    // 4. Comandos de Ajuda e Menu de Navegação ("AJUDA", "MENU", "COMANDOS")
    if (/^(ajuda|help|menu|comandos?|opcoes|duvidas|\?)$/i.test(normalized)) {
        let menuText = '👋 *InfraCore ERP • Menu Rápido de Comandos (Zero-Token)*\n\n';
        menuText += 'Digite o *NÚMERO* para falar diretamente com o especialista:\n';
        AI_AGENT_CATALOG.forEach((ag, idx) => {
            menuText += `*${idx + 1}* - ${ag.name} (${ag.department})\n`;
        });
        menuText += '\n*Comandos Rápidos Operacionais*:\n';
        menuText += '• *SIM* / *NÃO* - Aprovar ou cancelar pendências de alçada\n';
        menuText += '• *SALDO* - Ver caixa consolidado e contas do dia\n';
        menuText += '• *ESTOQUE* - Consultar insumos críticos\n';
        menuText += '• *FROTA* - Ver status de veículos e máquinas\n';
        menuText += '• *STATUS* - Painel geral de operações do ERP';

        return {
            handled: true,
            type: 'help_menu',
            text: menuText,
            tokensSaved: 480,
            actionAudit: 'Menu de comandos exibido via interceptação determinística.'
        };
    }

    // 5. Consultas Diretas ao Vivo no ERP ("SALDO", "ESTOQUE", "FROTA", "STATUS", "CAIXA")
    if (/^(saldo|caixa)$/i.test(normalized)) {
        const bal = erpLiveContext?.balance ?? 184500;
        const rec = erpLiveContext?.receivables ?? 42100;
        const pay = erpLiveContext?.payables ?? 31200;
        return {
            handled: true,
            type: 'direct_query',
            text: `💰 *POSIÇÃO FINANCEIRA CONSOLIDADA (Zero-Token)*\n• *Saldo em Caixa/Bancos*: ${fmt(bal)}\n• *A Receber Hoje*: ${fmt(rec)}\n• *A Pagar Hoje*: ${fmt(pay)}\n• *Saldo Projetado*: ${fmt(bal + rec - pay)}\n\n(Dados sincronizados ao vivo com o Financeiro do ERP)`,
            tokensSaved: 430,
            actionAudit: 'Consulta de saldo/caixa atendida sem chamada de LLM.'
        };
    }

    if (/^(estoque|almoxarifado)$/i.test(normalized)) {
        const total = erpLiveContext?.inventoryCount ?? 142;
        const low = erpLiveContext?.inventoryLow ?? 3;
        return {
            handled: true,
            type: 'direct_query',
            text: `📦 *POSIÇÃO DE ESTOQUE E ALMOXARIFADO (Zero-Token)*\n• Total de Itens Cadastrados: ${total}\n• Itens no Ponto de Reposição: ${low} insumos críticos ⚠️\n  - Diesel S10: 2.100 L (Mínimo: 4.000 L)\n  - Cimento CP-II: 42 t (Mínimo: 25 t)\n  - Correia 36": 6 un (Mínimo: 8 un)\n\n(Dados extraídos em tempo real do ERP)`,
            tokensSaved: 440,
            actionAudit: 'Consulta de estoque crítico atendida sem chamada de LLM.'
        };
    }

    if (/^(frota|veiculos|veículos)$/i.test(normalized)) {
        const op = erpLiveContext?.fleetOperational ?? 14;
        const tot = erpLiveContext?.fleetTotal ?? 16;
        return {
            handled: true,
            type: 'direct_query',
            text: `🚛 *STATUS DA FROTA E EQUIPAMENTOS (Zero-Token)*\n• Veículos Operacionais: ${op} de ${tot} (${Math.round((op / (tot || 1)) * 100)}%)\n• Em Manutenção na Oficina: ${tot - op} veículo(s)\n  - CC-04: Troca de pastilhas de freio (Previsão: 15h30)\n  - BT-02: Revisão de batedeira\n\n(Telemetria e controle de frotas sincronizados)`,
            tokensSaved: 450,
            actionAudit: 'Consulta de status de frota atendida sem chamada de LLM.'
        };
    }

    if (/^(status|painel|resumo)$/i.test(normalized)) {
        return {
            handled: true,
            type: 'direct_query',
            text: `⚡ *PAINEL OPERACIONAL INFRACORE ERP (Zero-Token)*\n• *Financeiro*: Caixa positivo (${fmt(erpLiveContext?.balance ?? 184500)})\n• *Produção*: ${erpLiveContext?.activeOPs ?? 2} usinas operando normalmente\n• *Frota*: ${erpLiveContext?.fleetOperational ?? 14} de ${erpLiveContext?.fleetTotal ?? 16} veículos em campo\n• *Estoque*: ${erpLiveContext?.inventoryLow ?? 3} insumos em ponto de reposição\n\nDigite *AJUDA* para ver a lista de comandos ou o número do setor desejado.`,
            tokensSaved: 490,
            actionAudit: 'Painel geral de status extraído deterministamente.'
        };
    }

    return { handled: false, tokensSaved: 0 };
};

// ---------------------------------------------------------------------------
// Simulador de Payloads de Webhook Externo (Evolution / Z-API / Meta Cloud)
// ---------------------------------------------------------------------------

export interface WebhookPayloadSample {
    id: string;
    provider: 'evolution' | 'zapi' | 'meta';
    title: string;
    description: string;
    senderPhone: string;
    senderCategory: 'public' | 'collaborator';
    messageText: string;
    samplePayload: Record<string, any>;
}

export const SAMPLE_WEBHOOK_PAYLOADS: WebhookPayloadSample[] = [
    {
        id: 'webhook_public_greeting',
        provider: 'evolution',
        title: '👤 Público Externo: Saudação Inicial ("Olá")',
        description: 'Prospect ou novo cliente não cadastrado iniciando contato pela primeira vez via WhatsApp.',
        senderPhone: '5511999990001',
        senderCategory: 'public',
        messageText: 'Olá, bom dia! Gostaria de informações sobre os produtos de vocês.',
        samplePayload: {
            event: 'messages.upsert',
            instance: 'infracore-central',
            data: {
                key: {
                    remoteJid: '5511999990001@s.whatsapp.net',
                    fromMe: false,
                    id: 'EVO_MSG_GREET_01'
                },
                pushName: 'Juliana Engenharia Civil',
                message: {
                    conversation: 'Olá, bom dia! Gostaria de informações sobre os produtos de vocês.'
                },
                messageType: 'conversation',
                messageTimestamp: Math.floor(Date.now() / 1000)
            }
        }
    },
    {
        id: 'webhook_public_quote',
        provider: 'meta',
        title: '👤 Público Externo: Solicitar Orçamento (Opção 1)',
        description: 'Cliente externo solicitando proposta de Brita 1 e CBUQ para entrega CIF em obra.',
        senderPhone: '5511999998888',
        senderCategory: 'public',
        messageText: '1 - Solicitar Orçamento: preciso de 80t de brita 1 e 40t de CBUQ para amanhã',
        samplePayload: {
            object: 'whatsapp_business_account',
            entry: [
                {
                    id: 'WABA_ACCOUNT_01',
                    changes: [
                        {
                            value: {
                                messaging_product: 'whatsapp',
                                metadata: { display_phone_number: '551140049999', phone_number_id: 'PN_8810' },
                                contacts: [{ profile: { name: 'Roberto Construtor' }, wa_id: '5511999998888' }],
                                messages: [
                                    {
                                        from: '5511999998888',
                                        id: 'wamid.HBgLMjU1MTE...',
                                        timestamp: Math.floor(Date.now() / 1000).toString(),
                                        type: 'text',
                                        text: {
                                            body: '1 - Solicitar Orçamento: preciso de 80t de brita 1 e 40t de CBUQ para amanhã'
                                        }
                                    }
                                ]
                            },
                            field: 'messages'
                        }
                    ]
                }
            ]
        }
    },
    {
        id: 'webhook_public_tracking',
        provider: 'zapi',
        title: '👤 Público Externo: 2ª Via / Rastreio (Opção 2)',
        description: 'Cliente existente com pedido em andamento solicitando rastreio da entrega e 2ª via de boleto.',
        senderPhone: '5511977776666',
        senderCategory: 'public',
        messageText: '2 - Já sou cliente. Gostaria de saber onde está o caminhão do pedido PED-1082 e a 2ª via.',
        samplePayload: {
            instanceId: 'ZAPI_INST_4412',
            messageId: 'ZAPI_MSG_2084',
            phone: '5511977776666',
            senderName: 'Construtora Horizonte',
            text: {
                message: '2 - Já sou cliente. Gostaria de saber onde está o caminhão do pedido PED-1082 e a 2ª via.'
            },
            type: 'ReceivedCallback',
            momment: Date.now()
        }
    },
    {
        id: 'webhook_collab_approval',
        provider: 'evolution',
        title: '👷 Colaborador Cadastrado: Aprovação Alçada ("SIM")',
        description: 'Gestor interno aprovando liberação comercial ou compra emergencial pelo WhatsApp.',
        senderPhone: '5511988887777',
        senderCategory: 'collaborator',
        messageText: 'SIM',
        samplePayload: {
            event: 'messages.upsert',
            instance: 'infracore-producao',
            data: {
                key: {
                    remoteJid: '5511988887777@s.whatsapp.net',
                    fromMe: false,
                    id: 'EVO_MSG_APPR_88'
                },
                pushName: 'Diretor Roberto',
                message: {
                    conversation: 'SIM'
                },
                messageType: 'conversation',
                messageTimestamp: Math.floor(Date.now() / 1000)
            }
        }
    },
    {
        id: 'webhook_collab_fuel',
        provider: 'zapi',
        title: '👷 Colaborador Cadastrado: Apontamento de Frota',
        description: 'Motorista CC-04 registrando abastecimento de diesel e horímetro no ERP.',
        senderPhone: '5511966665555',
        senderCategory: 'collaborator',
        messageText: 'Abastecimento CC-04 190L Diesel S10 km 184200.',
        samplePayload: {
            instanceId: 'ZAPI_INST_4412',
            messageId: 'ZAPI_MSG_1048',
            phone: '5511966665555',
            senderName: 'Carlos Motorista',
            text: {
                message: 'Abastecimento CC-04 190L Diesel S10 km 184200.'
            },
            photo: 'https://storage.infracore.com.br/receipts/fuel_190.jpg',
            type: 'ReceivedCallback',
            momment: Date.now()
        }
    },
    {
        id: 'webhook_collab_balance',
        provider: 'meta',
        title: '👷 Colaborador Cadastrado: Consulta Rápida ("SALDO")',
        description: 'Gerente financeiro consultando posição de caixa e contas a pagar do dia.',
        senderPhone: '5511955554444',
        senderCategory: 'collaborator',
        messageText: 'SALDO',
        samplePayload: {
            object: 'whatsapp_business_account',
            entry: [
                {
                    id: 'WABA_ACCOUNT_01',
                    changes: [
                        {
                            value: {
                                messaging_product: 'whatsapp',
                                metadata: { display_phone_number: '551140049999', phone_number_id: 'PN_8810' },
                                contacts: [{ profile: { name: 'Mariana Controladoria' }, wa_id: '5511955554444' }],
                                messages: [
                                    {
                                        from: '5511955554444',
                                        id: 'wamid.HBgLMjU1MTE...',
                                        timestamp: Math.floor(Date.now() / 1000).toString(),
                                        type: 'text',
                                        text: { body: 'SALDO' }
                                    }
                                ]
                            },
                            field: 'messages'
                        }
                    ]
                }
            ]
        }
    }
];
