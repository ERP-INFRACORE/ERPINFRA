export interface PermissionItem {
    id: string;
    name: string;
    description: string;
}

export interface PermissionCategory {
    category: string;
    permissions: PermissionItem[];
}

export const APP_PERMISSIONS: PermissionCategory[] = [
    {
        category: 'Vendas & CRM', // Sales
        permissions: [
            { id: 'sales.view', name: 'Visualizar Vendas', description: 'Ver lista de pedidos e orçamentos' },
            { id: 'sales.create', name: 'Criar Venda/Orçamento', description: 'Lançar novos orçamentos ou vendas' },
            { id: 'sales.edit', name: 'Editar Registros', description: 'Alterar pedidos ou orçamentos em aberto' },
            { id: 'sales.approve', name: 'Aprovar Orçamentos', description: 'Converter orçamentos em vendas efetivas' },
            { id: 'sales.cancel', name: 'Cancelar/Excluir', description: 'Cancelar ou remover vendas do sistema' },
            { id: 'clients.view', name: 'Visualizar Clientes', description: 'Acesso à base de clientes' },
            { id: 'clients.create', name: 'Cadastrar Clientes', description: 'Adicionar novos clientes' },
            { id: 'clients.edit', name: 'Editar Clientes', description: 'Alterar dados cadastrais de clientes' },
            { id: 'clients.delete', name: 'Excluir Clientes', description: 'Remover clientes da base' },
            { id: 'clients.financial', name: 'Dados Financeiros (Cliente)', description: 'Ver/Editar crédito e prazos' },
            { id: 'clients.manage', name: 'Gestão Completa de Clientes', description: 'Acesso unificado a visualização, criação e alteração' },
            { id: 'sales.pdv', name: 'Operação de PDV (Frente de Caixa)', description: 'Permissão para operar terminal de ponto de venda e emissão de cupom/venda rápida' },
            { id: 'sales.view.sales', name: 'Visualizar Vendas (Compatibilidade)', description: 'Identificador compatível para consulta comercial' },
            { id: 'sales.create.sales', name: 'Criar Vendas (Compatibilidade)', description: 'Identificador compatível para lançamento de pedidos' }
        ]
    },
    {
        category: 'Financeiro', // Finance
        permissions: [
            { id: 'finance.dashboard', name: 'Visualizar Dashboard', description: 'Ver indicadores financeiros gerais' },
            { id: 'finance.view_transactions', name: 'Ver Transações', description: 'Listar receitas e despesas' },
            { id: 'finance.add_revenue', name: 'Lançar Receitas', description: 'Adicionar novas entradas manuais' },
            { id: 'finance.add_expense', name: 'Lançar Despesas', description: 'Registrar contas a pagar/saídas' },
            { id: 'finance.edit_transaction', name: 'Editar Transações', description: 'Alterar lançamentos existentes' },
            { id: 'finance.approve', name: 'Conciliar/Baixar', description: 'Confirmar pagamentos e recebimentos' },
            { id: 'finance.manage_accounts', name: 'Gerir Contas Bancárias', description: 'Cadastrar bancos e caixas' },
            { id: 'finance.manage_plan', name: 'Gerir Plano de Contas', description: 'Criar/Editar categorias financeiras' },
            { id: 'finance.reports', name: 'Relatórios Financeiros', description: 'DRE, Fluxo de Caixa e Extratos' },
            { id: 'finance.delete_transaction', name: 'Excluir Transações', description: 'Remover lançamentos e contas do fluxo financeiro' },
            { id: 'finance.admin', name: 'Administração Financeira', description: 'Acesso pleno a configurações bancárias e operações críticas' },
            { id: 'finance.reconcile', name: 'Conciliação e Baixas', description: 'Compatibilidade com conciliação bancária' },
            { id: 'finance.transact', name: 'Operações de Caixa', description: 'Compatibilidade com movimentações de receitas/despesas' }
        ]
    },
    {
        category: 'Compras & Suprimentos', // Purchases
        permissions: [
            { id: 'purchases.view', name: 'Visualizar Pedidos', description: 'Ver histórico de compras' },
            { id: 'purchases.create', name: 'Criar Pedido Compra', description: 'Lançar novas ordens de compra' },
            { id: 'purchases.edit', name: 'Editar Pedidos', description: 'Alterar pedidos pendentes' },
            { id: 'purchases.approve', name: 'Aprovar Compras', description: 'Autorizar pedidos de compra' },
            { id: 'purchases.receive', name: 'Receber Mercadoria', description: 'Processar entrada de nota fiscal' },
            { id: 'suppliers.view', name: 'Visualizar Fornecedores', description: 'Ver lista de fornecedores' },
            { id: 'suppliers.manage', name: 'Gerir Fornecedores', description: 'Cadastrar, editar e excluir fornecedores' },
        ]
    },
    {
        category: 'Estoque de Materiais', // Inventory
        permissions: [
            { id: 'inventory.view', name: 'Visualizar Estoque', description: 'Consultar saldos e itens' },
            { id: 'inventory.create', name: 'Cadastrar Produtos', description: 'Adicionar novos itens ao cadastro' },
            { id: 'inventory.edit', name: 'Editar Produtos', description: 'Alterar dados de itens existentes' },
            { id: 'inventory.adjust', name: 'Ajuste Manual', description: 'Lançar perdas, sobras ou correções' },
            { id: 'inventory.history', name: 'Ver Histórico', description: 'Auditar movimentações de estoque' },
            { id: 'inventory.manage', name: 'Gestão Geral de Estoque', description: 'Cadastrar, alterar e ajustar saldos' },
        ]
    },
    {
        category: 'Produção Industrial', // Production
        permissions: [
            { id: 'production.view', name: 'Visualizar Produção', description: 'Ver ordens de produção (OPs)' },
            { id: 'production.create', name: 'Criar O.P.', description: 'Planejar nova produção' },
            { id: 'production.execute', name: 'Executar/Apontar', description: 'Iniciar, pausar e finalizar OPs' },
            { id: 'production.formulas', name: 'Gerir Fórmulas/Traços', description: 'Criar composições de produtos' },
            { id: 'production.units', name: 'Gerir Usinas', description: 'Configurar unidades fabris' },
            { id: 'quality.manage', name: 'Controle de Qualidade', description: 'Lançar e gerir testes de laboratório' },
        ]
    },
    {
        category: 'Frota & Logística', // Fleet
        permissions: [
            { id: 'fleet.view', name: 'Visualizar Frota', description: 'Ver lista de veículos e ativos' },
            { id: 'fleet.manage', name: 'Gerir Veículos', description: 'Cadastrar/Editar caminhões e máquinas' },
            { id: 'fleet.maintenance', name: 'Gerir Manutenções', description: 'Lançar ordens de serviço e custos' },
            { id: 'fleet.fuel', name: 'Controle de Combustível', description: 'Lançar e gerir abastecimentos' },
            { id: 'fleet.tires', name: 'Gestão de Pneus', description: 'Controle de vidas, rodízios e descartes' },
        ]
    },
    {
        category: 'Recursos Humanos (RH)', // HR
        permissions: [
            { id: 'hr.view', name: 'Visualizar Colaboradores', description: 'Acesso ao diretório de funcionários' },
            { id: 'hr.manage', name: 'Gerir Cadastros', description: 'Admissão, edição e documentação' },
            { id: 'hr.payroll', name: 'Folha de Pagamento', description: 'Calcular e fechar pagamentos' },
            { id: 'hr.time', name: 'Controle de Ponto', description: 'Gerir registros de jornada' },
            { id: 'hr.vacations', name: 'Gestão de Férias', description: 'Agendar e aprovar férias' },
            { id: 'hr.advances', name: 'Vales & Adiantamentos', description: 'Gerir solicitações financeiras' },
            { id: 'hr.manage_employees', name: 'Gestão de Colaboradores', description: 'Administração geral do quadro de funcionários' },
            { id: 'employees.view', name: 'Visualizar Funcionários (Legado)', description: 'Compatibilidade com visualização de RH' },
            { id: 'employees.manage', name: 'Gerir Funcionários (Legado)', description: 'Compatibilidade com gestão de RH' },
        ]
    },
    {
        category: 'Sistema & Segurança', // Settings
        permissions: [
            { id: 'settings.view', name: 'Acessar Configurações', description: 'Entrar no módulo de ajustes' },
            { id: 'settings.company', name: 'Dados da Empresa', description: 'Alterar cadastro da organização' },
            { id: 'settings.system', name: 'Parâmetros de Sistema', description: 'Configurar fiscal, backup e performance' },
            { id: 'users.manage', name: 'Gerir Usuários', description: 'Criar e editar logins de acesso' },
            { id: 'roles.manage', name: 'Gerir Perfis (Roles)', description: 'Criar e editar níveis de permissão' },
            { id: 'audit.view', name: 'Ver Auditoria', description: 'Acesso aos logs de segurança' },
        ]
    },
    {
        category: 'Agentes de IA & WhatsApp',
        permissions: [
            { id: 'ai.agents.view', name: 'Ver Agentes de IA', description: 'Visualizar agentes e vínculos de WhatsApp' },
            { id: 'ai.agents.manage', name: 'Gerir Agentes de IA', description: 'Ativar agentes e autorizar números de WhatsApp' },
        ]
    },
    {
        category: 'Dashboard & BI',
        permissions: [
            { id: 'dashboard.view', name: 'Visualizar Dashboard', description: 'Acesso à tela inicial e indicadores gerais' },
            { id: 'reports.view_basic', name: 'Relatórios Básicos', description: 'Listagens simples de sistema' },
            { id: 'reports.view_advanced', name: 'Relatórios Avançados (BI)', description: 'Análises complexas e gráficos' },
        ]
    }
];

export const ALL_PERMISSIONS_FLAT: PermissionItem[] = APP_PERMISSIONS.flatMap(cat => cat.permissions);

export const PERMISSION_MAP: Record<string, PermissionItem> = ALL_PERMISSIONS_FLAT.reduce((acc, item) => {
    acc[item.id] = item;
    return acc;
}, {} as Record<string, PermissionItem>);

export const PERMISSION_ALIAS_MAP: Record<string, string[]> = {
    'sales.view': ['sales.view.sales', 'sales.pdv'],
    'sales.pdv': ['sales.view', 'sales.create'],
    'sales.view.sales': ['sales.view'],
    'sales.create': ['sales.create.sales', 'sales.pdv'],
    'sales.create.sales': ['sales.create'],
    'clients.manage': ['clients.view', 'clients.create', 'clients.edit'],
    'employees.view': ['hr.view'],
    'employees.manage': ['hr.manage', 'hr.payroll'],
    'hr.manage_employees': ['hr.manage'],
    'inventory.manage': ['inventory.create', 'inventory.edit', 'inventory.adjust'],
    'finance.view': ['finance.dashboard', 'finance.view_transactions'],
    'finance.reconcile': ['finance.approve', 'finance.edit_transaction'],
    'finance.transact': ['finance.add_revenue', 'finance.add_expense'],
    'finance.delete': ['finance.manage_accounts', 'finance.edit_transaction', 'finance.delete_transaction'],
    'finance.delete_transaction': ['finance.edit_transaction', 'finance.approve', 'finance.delete'],
    'finance.admin': ['finance.dashboard', 'finance.view_transactions', 'finance.add_revenue', 'finance.add_expense', 'finance.edit_transaction', 'finance.approve', 'finance.manage_accounts', 'finance.manage_plan', 'finance.reports', 'finance.delete_transaction']
};

export const CANONICAL_ROLE_IDS: Record<string, string> = {
    admin: 'e881e024-16e0-4014-b1b4-edebafdd1dd2',
    manager_com: '956f087e-459c-4771-a7f5-5a111117a18d',
    analista_com_fin: '11ed5b7b-996e-4330-85a2-6e68d0127168',
    salesperson: '79cc1542-13a8-4bce-8607-c37308a00e40',
    vendedor2: '414da3d5-0000-4000-8000-0000414da3d5',
    manager_stock: 'b2a64923-ab83-4e23-81df-61b547959349',
    buyer_asst: '0798a51f-0000-4000-8000-00000798a51f',
    warehouseman: '3768cfb7-0000-4000-8000-00003768cfb7',
    manager_fin: '57acab58-d7b0-4d01-8040-d9de24c8e0f3',
    financial: 'f44d7b06-b15a-4966-819d-6fcbc0e0724c',
    operator: '76beebef-2996-4037-8510-454a01193705',
    fleet_manager: '53b585bc-0000-4000-8000-000053b585bc',
    hr_analyst: '62a599b3-0000-4000-8000-000062a599b3'
};

export const toCanonicalRoleId = (roleIdOrAlias: string): string => {
    if (!roleIdOrAlias) return roleIdOrAlias;
    const clean = roleIdOrAlias.toLowerCase().trim();
    return CANONICAL_ROLE_IDS[clean] || roleIdOrAlias;
};

export const getPermissionLabel = (id: string): string => PERMISSION_MAP[id]?.name || id;

export const isValidPermission = (id: string): boolean => {
    if (id === 'all' || id === '*') return true;
    return id in PERMISSION_MAP || id in PERMISSION_ALIAS_MAP;
};

export const getInitialRouteForUser = (
    user: { roleId?: string; username?: string } | null,
    roles: { id: string; name?: string }[]
): string => {
    if (!user) return '/';
    const userRole = roles.find(r => r.id === user.roleId || r.id === toCanonicalRoleId(user.roleId || ''));
    const roleName = userRole?.name?.toLowerCase().trim() || '';
    const roleId = (userRole?.id || user.roleId || '').toLowerCase().trim();

    const isPurchasesLanding =
        roleId === 'manager_com' ||
        roleId === 'analista_com_fin' ||
        roleId === CANONICAL_ROLE_IDS.manager_com ||
        roleId === CANONICAL_ROLE_IDS.analista_com_fin ||
        roleName === 'gerente comercial' ||
        roleName === 'analista comercial e financeiro' ||
        (roleName.includes('comercial') && roleName.includes('financeiro'));

    return isPurchasesLanding ? '/purchases' : '/';
};
