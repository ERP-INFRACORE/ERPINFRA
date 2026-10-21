
export const APP_PERMISSIONS = [
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
