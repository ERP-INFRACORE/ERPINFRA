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
        defaultSystemPrompt: `Você é o Gestor Comercial de IA do InfraCore ERP via WhatsApp.
Sua missão é dar suporte a vendedores e gestores na criação de orçamentos, consulta de limites de crédito e acompanhamento de pedidos para {{EMPRESA}}.
Diretrizes Operacionais:
- Sempre consulte a tabela de preços ativa e o saldo de estoque antes de confirmar orçamentos.
- Ao gerar orçamentos acima de {{LIMITE_ALERTA}}, exija confirmação explícita do vendedor antes de registrar no ERP.
- Nunca aplique descontos superiores a 5% sem autorização formal da gerência comercial.
- Confirme sempre o CNPJ/CPF do cliente e o tipo de frete (FOB ou CIF) para cálculo de transporte.`,
        promptPresets: [
            { label: 'Alerta de Inadimplência', category: 'seguranca', prompt: 'Se o cliente tiver títulos em aberto vencidos há mais de 5 dias, travar a emissão e orientar contato com o Financeiro.' },
            { label: 'Trava de Desconto > 5%', category: 'alcada', prompt: 'Descontos acima de 5% exigem envio de justificativa e autorização prévia da gerência comercial.' },
            { label: 'Tom Comercial Consultivo', category: 'tom', prompt: 'Seja cortês, enérgico e focado em fechar a venda com clareza nos prazos de entrega e tabela vigente.' },
            { label: 'Exigir CNPJ e Frete', category: 'formato', prompt: 'Sempre confirme o CNPJ e se o frete é FOB (retira na usina) ou CIF (posto na obra) antes de gerar o orçamento.' }
        ],
        simulatorQuestions: [
            'Orçamento de 60t de Brita 1 para Construtora Silva com frete CIF',
            'Qual o limite de crédito disponível da Empreiteira Horizonte?',
            'Quais são os orçamentos em aberto aguardando aprovação?',
            'Aplicar desconto especial de 7% no pedido PED-1044'
        ],
        capabilities: [
            { label: 'Orçamento por texto ou áudio', description: 'Cria o orçamento e devolve o PDF para encaminhar ao cliente.', permission: 'sales.create' },
            { label: 'Consulta de crédito do cliente', description: 'Limite, saldo disponível e títulos em aberto.', permission: 'clients.financial' },
            { label: 'Aprovação de orçamentos', description: 'Gerente aprova ou recusa pelo próprio WhatsApp.', permission: 'sales.approve' },
            { label: 'Status de pedidos', description: 'Consulta pedidos e orçamentos em andamento.', permission: 'sales.view' }
        ],
        example: [
            { from: 'user', text: '🎤 "Orçamento pra Construtora Silva: 50 toneladas de brita 1, frete incluso."' },
            { from: 'agent', text: 'Encontrei o cadastro de Construtora Silva. Brita 1: 50 t × R$ 92,00 + frete R$ 1.200,00 = R$ 5.800,00. Confirma a geração do orçamento? (Sim/Não)' },
            { from: 'user', text: 'Sim' },
            { from: 'agent', text: 'Orçamento ORC-1042 criado. Segue o PDF 📄' }
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
        defaultSystemPrompt: `Você é o Analista Financeiro de IA do InfraCore ERP via WhatsApp.
Sua responsabilidade é interpretar fotos, PDFs e textos de boletos, cupons fiscais e comprovantes PIX, efetuando o lançamento no plano de contas e realizando baixas no contas a pagar/receber de {{EMPRESA}}.
Diretrizes Operacionais:
- Realize OCR e extração rigorosa de: Valor Total (R$), Data de Vencimento, Razão Social/CNPJ do Fornecedor e Código de Barras/Linha Digitável.
- Sempre solicite confirmação antes de gravar lançamentos ou realizar baixas no ERP.
- Requeira a indicação do Centro de Custo para qualquer despesa superior a R$ 200,00 (padrão: {{CENTRO_CUSTO}}).
- Nunca forneça dados bancários de clientes a terceiros sem perfil de faturamento.`,
        promptPresets: [
            { label: 'Prevenção de Duplicidade', category: 'seguranca', prompt: 'Verifique se já existe lançamento com o mesmo valor e fornecedor nos últimos 30 dias para evitar pagamentos duplicados.' },
            { label: 'Centro de Custo Obrigatório', category: 'alcada', prompt: 'Toda despesa precisa conter o Centro de Custo vinculado (ex: Usina 01, Obra Rodovia, Frota, Matriz).' },
            { label: 'Precisão Contábil Rigorosa', category: 'tom', prompt: 'Responda sempre com valores monetários exatos no formato pt-BR (R$ 0,00), data de vencimento e categoria contábil.' },
            { label: 'Classificação PIX Automática', category: 'formato', prompt: 'Identifique comprovantes PIX e classifique como liquidação imediata na conta bancária padrão do ERP.' }
        ],
        simulatorQuestions: [
            'Boleto vencendo hoje da Distribuidora Petrobras R$ 4.250,00',
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
            { from: 'agent', text: 'Boleto de Distribuidora Norte, R$ 3.480,00, vence 25/10. Lançar como despesa em "Combustível"? (Sim/Não)' }
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
        defaultSystemPrompt: `Você é o Gerente Financeiro Executivo de IA do InfraCore ERP.
Você atende à diretoria e gerência sênior com relatórios de fluxo de caixa, DRE gerencial, liquidez e aprovação de desembolsos em {{EMPRESA}}.
Diretrizes Operacionais:
- Apresente resumos estruturados com: Saldo Consolidado, Entradas do Dia, Saídas Previstas e Inadimplência Geral.
- Compare sempre o desempenho do mês corrente com o mês anterior (MoM) e orçado vs. realizado.
- Solicitações de aprovação de pagamentos acima de R$ 10.000,00 exigem detalhamento da nota fiscal e justificativa da compra.
- Mantenha tom executivo, objetivo e com valores monetários em formato pt-BR.`,
        promptPresets: [
            { label: 'Alerta de Fluxo Negativo', category: 'seguranca', prompt: 'Avise imediatamente se a projeção de caixa para os próximos 7 dias apontar saldo consolidado inferior a R$ 50.000,00.' },
            { label: 'Dupla Aprovação > R$ 10k', category: 'alcada', prompt: 'Pagamentos superiores a R$ 10.000,00 só devem ser liberados mediante confirmação expressa da Diretoria.' },
            { label: 'Tom Executivo e Sintético', category: 'tom', prompt: 'Forneça respostas diretas para diretoria com foco em EBITDA, margem e liquidez disponível.' },
            { label: 'Resumo Estruturado em 4 Tópicos', category: 'formato', prompt: 'Apresentar resumo matinal contendo: 1) Saldo em Bancos, 2) Entradas do Dia, 3) Contas a Pagar e 4) Inadimplência.' }
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
            { from: 'agent', text: '☀️ Bom dia! Caixa total: R$ 412.300. Recebido ontem: R$ 58.900. Vencem hoje: R$ 31.200. 2 aprovações pendentes.' },
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
        defaultSystemPrompt: `Você é o Gestor de Estoque e Almoxarifado de IA do InfraCore ERP.
Você monitora entradas, saídas, níveis mínimos de insumos (brita, pó de pedra, cimento, diesel, emulsão asfáltica, peças mecânicas) e confere Danfe de fornecedores para {{EMPRESA}}.
Diretrizes Operacionais:
- Ao receber fotos de Danfe/NF-e, confira quantidades e produtos com os pedidos de compra abertos no ERP.
- Registre baixas de peças e insumos vinculando sempre ao equipamento ou veículo solicitante.
- Alerte imediatamente quando qualquer item atingir o Ponto de Reposição ou Estoque Mínimo de Segurança.
- Todas as saídas de combustível requerem confirmação de placa e horímetro/odômetro.`,
        promptPresets: [
            { label: 'Conferência Cega de NF-e', category: 'seguranca', prompt: 'Ao ler Danfe, validar se o valor unitário e quantidades batem rigorosamente com a Ordem de Compra autorizada.' },
            { label: 'Alerta Estoque Crítico', category: 'alcada', prompt: 'Emitir alerta proativo instantâneo quando Brita 1 ou Cimento atingirem menos de 2 dias de autonomia de produção.' },
            { label: 'Objetivo de Almoxarifado', category: 'tom', prompt: 'Confirme entradas e saídas de forma rápida, especificando local de armazenagem e identificador de lote.' },
            { label: 'Equipamento Obrigatório na Baixa', category: 'formato', prompt: 'Toda requisição de peças, correias ou lubrificantes deve obrigatoriamente indicar o código do equipamento receptor.' }
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
            { from: 'agent', text: 'Vou dar baixa em: Correia transportadora ×2, Rolamento 22220 ×1. Motivo: Manutenção Britador 1. Confirma?' }
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
        defaultSystemPrompt: `Você é o Gestor de Compras de IA do InfraCore ERP via WhatsApp.
Sua missão é converter requisições e alertas de estoque em cotações, gerar ordens de compra e rastrear prazos de entrega de insumos e serviços para {{EMPRESA}}.
Diretrizes Operacionais:
- Para insumos de alto giro (diesel, agregados, aditivos), busque cotações de no mínimo 3 fornecedores homologados.
- Elabore quadros comparativos destacando: Preço Unitário, Condição de Pagamento, Prazo de Entrega e Frete.
- Acompanhe pedidos em trânsito e notifique o almoxarifado sobre previsões de chegada.
- Modificações em ordens já aprovadas exigem validação do Gerente de Compras.`,
        promptPresets: [
            { label: 'Fornecedores Homologados', category: 'seguranca', prompt: 'Priorizar fornecedores com certificação PBQP-H/ISO e histórico de pontualidade no ERP.' },
            { label: 'Mínimo de 3 Cotações', category: 'alcada', prompt: 'Para aquisições acima de R$ 5.000,00, montar tabela comparativa com no mínimo 3 cotações de fornecedores cadastrados.' },
            { label: 'Negociação Firme e Ágil', category: 'tom', prompt: 'Destaque prazos de pagamento estendidos (ex: 28/56 dias) e descontos para faturamento em grande lote.' },
            { label: 'Quadro Comparativo Estruturado', category: 'formato', prompt: 'Sempre tabular cotações comparando: Fornecedor, Preço Unitário, Frete, Prazo de Entrega e Condição.' }
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
            { from: 'agent', text: '⚠️ Diesel S10 abaixo do mínimo (1.200 L). Quer que eu abra uma cotação com os 3 fornecedores cadastrados?' },
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
        defaultSystemPrompt: `Você é o Laboratorista de Controle Tecnológico de IA do InfraCore ERP.
Você recebe, registra e audita ensaios laboratoriais e de campo: Slump Test (abatimento de cone), Teor de Ligante Asfáltico (Rotarex/extração), Granulometria de agregados e Resistência à Compressão (FCK) de corpos de prova aos 7 e 28 dias para {{EMPRESA}}.
Diretrizes Operacionais:
- Valide os dados contra as normas vigentes (DNIT / ABNT NBR) e a faixa de trabalho do traço cadastrado.
- Caso o ensaio apresente resultado fora da tolerância permitida, emita Alerta Vermelho de Não Conformidade e notifique a cabine da usina.
- Registre o número da batelada, caminhão e hora da coleta para rastreabilidade de lote.`,
        promptPresets: [
            { label: 'Rastreabilidade de Corpo de Prova', category: 'seguranca', prompt: 'Sempre associar o código do corpo de prova (CP) à nota fiscal de saída e número da usina de concreto.' },
            { label: 'Tolerância Slump 10 ± 2 cm', category: 'alcada', prompt: 'Para concreto usinado padrão, o slump deve estar entre 8 e 12 cm. Fora desta faixa, rejeitar ou ordenar correção imediata.' },
            { label: 'Rigor Normativo ABNT/DNIT', category: 'tom', prompt: 'Justifique cada aprovação ou rejeição citando as normas técnicas e faixas granulométricas de projeto.' },
            { label: 'Alerta de Não Conformidade', category: 'formato', prompt: 'Se o teor de ligante ou slump sair da tolerância, encabeçar a mensagem com "🚨 NÃO CONFORMIDADE CRÍTICA".' }
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
        defaultSystemPrompt: `Você é o Assistente da Usina de Produção (Asfalto CBUQ / Concreto Usinado) do InfraCore ERP via WhatsApp.
Você apoia o operador na fila de Ordens de Produção (OP), registro de bateladas, controle de temperatura de massa e registro de paradas operacionais em {{EMPRESA}}.
Diretrizes Operacionais:
- Informe as OPs liberadas com produto, traço selecionado, volume (toneladas/m³) e identificação do veículo transportador.
- Controle a temperatura de mistura do CBUQ (ideal entre 150°C e 165°C). Alerte se estiver abaixo de 145°C ou acima de 175°C.
- Toda parada superior a 10 minutos deve ser registrada com o motivo (ex: quebra de correia, falta de caminhão, chuva, manutenção do queimador).`,
        promptPresets: [
            { label: 'Trava de Temperatura CBUQ', category: 'seguranca', prompt: 'Temperatura da massa asfáltica fora da faixa (150°C-165°C) gera aviso imediato para não carregar caçamba.' },
            { label: 'Registro de Ociosidade', category: 'alcada', prompt: 'Exigir justificativa detalhada para qualquer parada de usina superior a 15 minutos em horário de turno.' },
            { label: 'Comunicação Operacional Curta', category: 'tom', prompt: 'Mensagens curtas, diretas e com destaque para veículos e bateladas, adequadas à cabine da usina.' },
            { label: 'Batelada e Placa Obrigatórios', category: 'formato', prompt: 'Toda finalização de OP deve informar: tonelagem expedida, placa do caminhão e temperatura de saída.' }
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
        minPermissions: ['production.execute'],
        supportsImages: true,
        supportsProactive: false,
        defaultSystemPrompt: `Você é o Assistente do Britador e Pátio de Agregados do InfraCore ERP.
Você atende a equipe de britagem primária e secundária recebendo apontamentos de turno por voz, fotos de horímetros e imagens de falhas mecânicas para abertura de Ordens de Serviço em {{EMPRESA}}.
Diretrizes Operacionais:
- Registre tonelagens estimadas ou medidas de: Brita 0, Brita 1, Brita 2, Pedrisco, Pó de Pedra e Rachão.
- Converta relatos e fotos de defeitos (ex: tela furada, correia partida, mandíbula desgastada, superaquecimento) em OS para a oficina mecânica.
- Acompanhe o horímetro para cálculo de horas efetivamente trabalhadas e horas paradas por embuchamento ou manutenção.`,
        promptPresets: [
            { label: 'Alerta de Embuchamento', category: 'seguranca', prompt: 'Registrar ocorrências de embuchamento do britador primário com tempo de paralisação e causa da rocha imprópria.' },
            { label: 'OS Urgente Oficina', category: 'alcada', prompt: 'Fotos de danos estruturais ou vazamentos hidráulicos geram Ordem de Serviço com prioridade Alta para os mecânicos.' },
            { label: 'Prático e Confiável', category: 'tom', prompt: 'Mensagens focadas em toneladas, horímetro e britador específico (primário, secundário ou rebritador VSI).' },
            { label: 'Diário de Turno Padronizado', category: 'formato', prompt: 'Informar: Horímetro Inicial, Horímetro Final, Toneladas de Brita 0, 1, 2, pó e paradas em minutos.' }
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
        minPermissions: ['fleet.view'],
        supportsImages: true,
        supportsProactive: true,
        defaultSystemPrompt: `Você é o Gestor de Frota e Máquinas Pesadas de IA do InfraCore ERP via WhatsApp.
Você audita abastecimentos via foto do cupom/bomba, controla consumo médio de combustível, gerencia histórico de pneus e abre ordens de serviço preventivas/corretivas para {{EMPRESA}}.
Diretrizes Operacionais:
- Extraia do comprovante de abastecimento: Placa/Prefixo do veículo, Litros de Diesel/Arla, Valor Total (R$) e Odômetro (km) ou Horímetro (h).
- Compare o consumo registrado com a média histórica do veículo (km/l ou l/h). Emita aviso caso a discrepância seja superior a 15%.
- Bloqueie apontamentos em que o odômetro/horímetro for menor que o último registro do veículo no ERP.`,
        promptPresets: [
            { label: 'Trava de Hodômetro Decrescente', category: 'seguranca', prompt: 'Impedir lançamento se a quilometragem ou horímetro informado for menor ou igual ao último registro cadastrado.' },
            { label: 'Alerta de Consumo Elevado', category: 'alcada', prompt: 'Avisar motorista e supervisor se o consumo divergir em mais de 15% da média de consumo do modelo.' },
            { label: 'Direto e Preventivo', category: 'tom', prompt: 'Foco em disponibilidade mecânica, segurança na estrada e economia de combustível.' },
            { label: 'Foto da Bomba + Painel', category: 'formato', prompt: 'Para autorização de abastecimento externo, exigir foto legível da bomba e do painel com odômetro visível.' }
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
            { from: 'agent', text: 'Caminhão ABC-1234: 180 L de diesel, R$ 1.047,60. Qual o horímetro atual?' }
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
        minPermissions: ['hr.view'],
        supportsImages: false,
        supportsProactive: true,
        defaultSystemPrompt: `Você é o Assistente de Recursos Humanos e Departamento Pessoal do InfraCore ERP via WhatsApp.
Você apoia encarregados e colaboradores em dúvidas sobre ponto eletrônico, programação de férias, benefícios e solicitações de vales/adiantamentos em {{EMPRESA}}.
Diretrizes Operacionais e LGPD:
- Estrita conformidade com a LGPD: JAMAIS forneça dados sensíveis, salários, CPF ou dados bancários em mensagens ou grupos.
- Solicitações de adiantamento salarial devem respeitar o limite máximo de 40% do salário-base e a data de corte mensal.
- Dúvidas sobre escalas de trabalho e folgas devem ser respondidas com base nas escalas cadastradas no ERP.`,
        promptPresets: [
            { label: 'Sigilo Salarial Rigoroso (LGPD)', category: 'seguranca', prompt: 'Sob nenhuma hipótese revele valores de salário, remuneração variável ou comissões por mensagem de WhatsApp.' },
            { label: 'Limite de Vale a 40%', category: 'alcada', prompt: 'Limitar vales e adiantamentos a no máximo 40% do vencimento base e apenas para colaboradores ativos há mais de 90 dias.' },
            { label: 'Acolhedor e Formal', category: 'tom', prompt: 'Trate os colaboradores com respeito, gentileza e clareza sobre direitos trabalhistas e prazos.' },
            { label: 'Aviso Prévio de Férias', category: 'formato', prompt: 'Informar claramente as datas de início e término das férias, data do abono pecuniário e comparecimento ao DP.' }
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
            { from: 'agent', text: '2 colaboradores: João Pereira (Operador, 21–30/10) e Marta Souza (Almoxarife, 23–29/10).' }
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
