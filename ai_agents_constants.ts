import {
    AIAgentsConfig,
    AIAgentSettings,
    AIAgentNumberLink,
    AppRole,
    AppSettings,
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
}

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

/** Proteções do agente de código. São exibidas na tela, mas DEVEM ser aplicadas no servidor. */
export const CODE_AGENT_GUARDRAILS: string[] = [
    'Somente usuários com perfil de Super Administrador e número previamente cadastrado podem falar com este agente.',
    'Nunca grava direto na branch principal: toda alteração vira uma branch com Pull Request para revisão humana.',
    'Toda proposta exige aprovação explícita de um administrador antes de ser aplicada.',
    'Arquivos sensíveis são bloqueados para edição: .env*, chaves de API e credenciais.',
    'Alterações em banco de dados (SQL) são entregues como script para execução manual, nunca executadas pelo agente.',
    'Todas as solicitações, propostas e aprovações ficam registradas na Auditoria.'
];

export const CODE_AGENT_PROTECTED_PATHS: string[] = ['.env', '.env.*', 'supabase_schema.sql', 'reset_db.sql', 'src/lib/supabase.ts'];

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
    const m = /^(\d{2})(\d{2})(\d{4,5})(\d{4})$/.exec(digits || '');
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
