import {
  InventoryItem,
  Budget,
  Supplier,
  Employee,
  Tire,
  ProductionFormula,
  ProductionUnit,
  AppRole,
  User,
  AppSettings,
  AuditLog,
  FinancialAccount,
  PlanOfAccountNode
} from '../../types';

export const STORAGE_KEY = 'infracore_erp_data';

export const INITIAL_INVENTORY: InventoryItem[] = [];
export const INITIAL_BUDGETS: Budget[] = [];
export const INITIAL_SUPPLIERS: Supplier[] = [];
export const INITIAL_EMPLOYEES: Employee[] = [];
export const INITIAL_TIRES: Tire[] = [];
export const INITIAL_FORMULAS: ProductionFormula[] = [];
export const INITIAL_PRODUCTION_UNITS: ProductionUnit[] = [];

export const INITIAL_ACCOUNTS: FinancialAccount[] = [
  {
    id: 'acc-1',
    name: 'Caixa Geral',
    type: 'Espécie',
    balance: 0,
    initialBalance: 0,
    color: 'bg-emerald-600',
    code: 'Gaveta / Cofre',
    isDefault: true,
    status: 'Ativo'
  }
];

export const INITIAL_ROLES: AppRole[] = [
  {
    id: 'admin',
    name: 'Administrador',
    description: 'Acesso total e irrestrito ao sistema.',
    permissions: ['all']
  },
  {
    id: 'manager_com',
    name: 'Gerente Comercial',
    description: 'Gestão completa de vendas, metas, orçamentos, aprovações, clientes e custos/despesas.',
    permissions: [
      'dashboard.view',
      'sales.view', 'sales.create', 'sales.edit', 'sales.approve', 'sales.cancel',
      'clients.view', 'clients.create', 'clients.edit', 'clients.delete', 'clients.financial',
      'purchases.view',
      'reports.view_basic', 'reports.view_advanced'
    ]
  },
  {
    id: 'analista_com_fin',
    name: 'Analista Comercial e Financeiro',
    description: 'Acompanhamento integrado de vendas, faturamento, custos/despesas e conciliação financeira.',
    permissions: [
      'dashboard.view',
      'sales.view', 'sales.create', 'sales.edit',
      'clients.view', 'clients.financial',
      'purchases.view',
      'finance.dashboard', 'finance.view_transactions', 'finance.reports',
      'reports.view_basic'
    ]
  },
  {
    id: 'salesperson',
    name: 'Vendedor',
    description: 'Força de vendas externa e atendimento comercial padrão.',
    permissions: [
      'sales.view', 'sales.create', 'sales.edit',
      'clients.view', 'clients.create', 'clients.edit'
    ]
  },
  {
    id: 'vendedor2',
    name: 'Vendedor Balcão / PDV',
    description: 'Operação exclusiva de PDV balcão e emissão rápida de vendas diretas.',
    permissions: [
      'sales.view', 'sales.create', 'sales.pdv'
    ]
  },
  {
    id: 'manager_stock',
    name: 'Gestor de Suprimentos',
    description: 'Controle estratégico de compras, inventários e fornecedores.',
    permissions: [
      'dashboard.view',
      'purchases.view', 'purchases.create', 'purchases.edit', 'purchases.approve', 'purchases.receive',
      'suppliers.view', 'suppliers.manage',
      'inventory.view', 'inventory.create', 'inventory.edit', 'inventory.adjust', 'inventory.history', 'inventory.manage',
      'reports.view_basic'
    ]
  },
  {
    id: 'buyer_asst',
    name: 'Auxiliar de Compras',
    description: 'Lançamento e consulta de ordens de compra e cotações com fornecedores.',
    permissions: [
      'purchases.view', 'purchases.create', 'suppliers.view'
    ]
  },
  {
    id: 'warehouseman',
    name: 'Almoxarife / Estoquista',
    description: 'Controle de saldo físico, movimentação manual e recebimento de ordens de compra.',
    permissions: [
      'inventory.view', 'inventory.adjust', 'inventory.history', 'purchases.receive'
    ]
  },
  {
    id: 'manager_fin',
    name: 'Gerente Financeiro',
    description: 'Gestão completa de tesouraria, fluxo de caixa, contas e plano de contas.',
    permissions: [
      'dashboard.view',
      'finance.dashboard', 'finance.view_transactions', 'finance.add_revenue', 'finance.add_expense',
      'finance.edit_transaction', 'finance.approve', 'finance.manage_accounts', 'finance.manage_plan',
      'finance.reports', 'finance.delete_transaction', 'finance.admin',
      'reports.view_advanced', 'audit.view'
    ]
  },
  {
    id: 'financial',
    name: 'Analista Financeiro',
    description: 'Lançamento de despesas/receitas e conciliações bancárias operacionais.',
    permissions: [
      'dashboard.view',
      'finance.dashboard', 'finance.view_transactions', 'finance.add_revenue', 'finance.add_expense',
      'finance.edit_transaction', 'finance.approve', 'finance.reports'
    ]
  },
  {
    id: 'operator',
    name: 'Operador Industrial',
    description: 'Execução e apontamento de ordens de produção em chão de fábrica.',
    permissions: [
      'production.view', 'production.execute'
    ]
  },
  {
    id: 'fleet_manager',
    name: 'Gestor de Frota',
    description: 'Controle operacional de veículos, manutenções, pneus e abastecimentos.',
    permissions: [
      'fleet.view', 'fleet.manage', 'fleet.maintenance', 'fleet.fuel', 'fleet.tires', 'reports.view_basic'
    ]
  },
  {
    id: 'hr_analyst',
    name: 'Analista de RH',
    description: 'Administração de pessoal, admissões, ponto, folha e férias.',
    permissions: [
      'hr.view', 'hr.manage', 'hr.payroll', 'hr.time', 'hr.vacations', 'hr.advances', 'hr.manage_employees'
    ]
  }
];

export const INITIAL_USERS: User[] = [
  { id: '1', name: 'Admin InfraCore', username: 'admin', password: '123', email: 'admin@infracore.com', roleId: 'admin', status: 'Ativo', registeredAt: '01/01/2026' },
  { id: '2', name: 'Roberto Comercial', username: 'gerente_com', password: '123', email: 'roberto.vendas@infracore.com', roleId: 'manager_com', status: 'Ativo', registeredAt: '01/01/2026' },
  { id: '3', name: 'Julio Analista Com/Fin', username: 'analista_cf', password: '123', email: 'analista.comfin@infracore.com', roleId: 'analista_com_fin', status: 'Ativo', registeredAt: '01/01/2026' },
  { id: '4', name: 'Lucas Vendedor', username: 'vendedor', password: '123', email: 'lucas.vendas@infracore.com', roleId: 'salesperson', status: 'Ativo', registeredAt: '01/01/2026' },
  { id: '5', name: 'Operador PDV Caixa', username: 'vendedor2', password: '123', email: 'balcao.pdv@infracore.com', roleId: 'vendedor2', status: 'Ativo', registeredAt: '01/01/2026' },
  { id: '6', name: 'Marcos Suprimentos', username: 'suprimentos', password: '123', email: 'marcos.compras@infracore.com', roleId: 'manager_stock', status: 'Ativo', registeredAt: '01/01/2026' },
  { id: '7', name: 'Juliana Auxiliar Compras', username: 'compras_aux', password: '123', email: 'juliana.compras@infracore.com', roleId: 'buyer_asst', status: 'Ativo', registeredAt: '01/01/2026' },
  { id: '8', name: 'Tiago Almoxarife', username: 'almoxarife', password: '123', email: 'tiago.estoque@infracore.com', roleId: 'warehouseman', status: 'Ativo', registeredAt: '01/01/2026' },
  { id: '9', name: 'Beatriz Controladoria', username: 'gerente_fin', password: '123', email: 'beatriz.financeiro@infracore.com', roleId: 'manager_fin', status: 'Ativo', registeredAt: '01/01/2026' },
  { id: '10', name: 'Gabriel Analista Financeiro', username: 'fin_analista', password: '123', email: 'gabriel.financeiro@infracore.com', roleId: 'financial', status: 'Ativo', registeredAt: '01/01/2026' },
  { id: '11', name: 'Carlos Operador Usina', username: 'operador_ind', password: '123', email: 'carlos.producao@infracore.com', roleId: 'operator', status: 'Ativo', registeredAt: '01/01/2026' },
  { id: '12', name: 'Fernando Gestor Frota', username: 'frotista', password: '123', email: 'fernando.frota@infracore.com', roleId: 'fleet_manager', status: 'Ativo', registeredAt: '01/01/2026' },
  { id: '13', name: 'Renata Recursos Humanos', username: 'rh_analista', password: '123', email: 'renata.rh@infracore.com', roleId: 'hr_analyst', status: 'Ativo', registeredAt: '01/01/2026' }
];

export const INITIAL_SETTINGS: AppSettings = {
  companyName: 'InfraCore Engenharia Ltda',
  tradeName: 'InfraCore ERP',
  document: '12.345.678/0001-99',
  email: 'contato@infracore.com',
  phone: '(11) 4002-8922',
  address: 'Rua da Tecnologia, 100 - Industrial, SP',
  bankDetails: {
    bankName: 'Banco do Brasil',
    agency: '0041-X',
    account: '44.021-X',
    pixKey: 'contato@infracore.com',
    pixType: 'E-mail'
  },
  currency: 'BRL',
  language: 'pt-BR',
  theme: 'dark',
  notifications: {
    stockAlerts: true,
    overdueFinance: true,
    productionUpdates: true,
    fleetMaintenance: true
  },
  technical: {
    taxRegime: 'Lucro Presumido',
    defaultTaxRate: 15.5,
    financialYearStart: '01/01',
    dateFormat: 'DD/MM/YYYY',
    timezone: 'America/Sao_Paulo'
  },
  backup: {
    autoBackup: true,
    frequency: 'daily',
    lastBackup: '22/12/2025 23:00'
  },
  operational: {
    maxDiscount: 15,
    minMargin: 20,
    defaultPaymentTerm: 30,
    budgetValidity: 7,
    maxInstallments: 12,
    minInstallmentValue: 100,
    creditLimit: 5000,
    overdueGracePeriod: 5,
    autoApprovalLimit: 10000,
    commissionRate: 3,
    priceTableCount: 3,
    quotaRenewalDays: 30,
    leadFollowupDays: 3,
    contractMinDuration: 12,
    warrantyPeriod: 12,
    safetyStock: 10,
    reorderPoint: 20,
    maxStockLevel: 90,
    inventoryCountFrequency: 90,
    batchTrackingDays: 180,
    wastePercentage: 2,
    productionLeadTime: 5,
    setupTime: 30,
    qualityControlSampling: 10,
    maintenanceInterval: 500,
    batchSize: 100,
    workShiftHours: 8,
    overtimeLimit: 20,
    scrapReworkLimit: 5,
    capacityUtilization: 85,
    purchaseApprovalLevel1: 5000,
    purchaseApprovalLevel2: 20000,
    minQuotations: 3,
    supplierEvaluationPeriod: 6,
    deliveryToleranceDays: 2,
    minOrderValue: 500,
    paymentTermNegotiation: 45,
    qualityInspectionRate: 20,
    returnPeriod: 7,
    contractRenewalAlert: 30,
    interestRate: 1,
    lateFee: 2,
    earlyPaymentDiscount: 3,
    cashFlowProjectionDays: 90,
    bankReconciliationFrequency: 7,
    minimumCashReserve: 10000,
    budgetVarianceAlert: 10,
    invoiceReminderDays: 3,
    creditCardProcessingFee: 3.5,
    fiscalYearStart: 1
  },
  integrations: {
    nfe: { name: 'Nota Fiscal Eletrônica (NF-e)', status: 'Ativo', category: 'Fiscal' },
    nfse: { name: 'Nota Fiscal de Serviço (NFS-e)', status: 'Ativo', category: 'Fiscal' },
    sefaz: { name: 'Consulta SEFAZ', status: 'Ativo', category: 'Fiscal' },
    mdfe: { name: 'Manifesto Eletrônico (MDF-e)', status: 'Ativo', category: 'Fiscal' },
    pagseguro: { name: 'Gateway PagSeguro', status: 'Ativo', category: 'Financeiro' },
    boleto: { name: 'Boleto Bancário', status: 'Ativo', category: 'Financeiro' },
    pix: { name: 'PIX', status: 'Ativo', category: 'Financeiro' },
    ofx: { name: 'Conciliação OFX', status: 'Ativo', category: 'Financeiro' },
    whatsapp: { name: 'WhatsApp Business API', status: 'Ativo', category: 'Comunicação' },
    sendgrid: { name: 'E-mail Marketing (SendGrid)', status: 'Ativo', category: 'Comunicação' },
    googlemaps: { name: 'Google Maps API', status: 'Ativo', category: 'Logística' },
    sinapi: { name: 'SINAPI', status: 'Ativo', category: 'Engenharia' },
    sicro: { name: 'SICRO', status: 'Ativo', category: 'Engenharia' }
  },
  emailConfig: {
    smtpServer: 'smtp.gmail.com',
    smtpPort: 587,
    senderEmail: 'noreply@infracore.com',
    templates: {
      budget: 'Olá, segue anexo o orçamento...',
      invoice: 'Prezado cliente, sua nota fiscal foi emitida...'
    }
  },
  documents: {
    printerMain: 'HP LaserJet Pro',
    printerThermal: 'Zebra ZD220',
    margins: 10,
    copies: 2,
    showLogo: true,
    watermarkDraft: true,
    qrCode: false,
    autoNumbering: true,
    digitalSignature: false,
    customFooter: true,
    barcode: true,
    authSeal: false
  },
  performance: {
    cacheSize: 245,
    imageQuality: 85,
    autoCompression: true,
    lazyLoading: true,
    preloading: false,
    gzip: true,
    autoIndexing: true,
    queryCache: true,
    minifyAssets: true,
    cdn: false,
    dbPooling: true
  }
};

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  { id: '1', userId: '1', userName: 'Admin InfraCore', action: 'Login no Sistema', module: 'Login', timestamp: '01/01/2026 08:00', severity: 'info', details: 'Login realizado com sucesso via senha', ip: '192.168.1.100' },
  { id: '2', userId: '1', userName: 'Admin InfraCore', action: 'Alteração de Configuração', module: 'Configurações', timestamp: '01/01/2026 08:05', severity: 'warning', details: 'Alterou o tema para Escuro', ip: '192.168.1.100' },
  { id: '3', userId: '2', userName: 'Gerência Vendas', action: 'Nova Venda', module: 'Vendas', timestamp: '01/01/2026 09:15', severity: 'info', details: 'Venda #1034 criada para Cliente Exemplo', ip: '192.168.1.102' },
  { id: '4', userId: '1', userName: 'Admin InfraCore', action: 'Exclusão de Usuário', module: 'Configurações', timestamp: '01/01/2026 10:30', severity: 'critical', details: 'Usuário temp_user removido permanentemente', ip: '192.168.1.100' },
  { id: '5', userId: '2', userName: 'Gerência Vendas', action: 'Falha de Login', module: 'Login', timestamp: '01/01/2026 11:00', severity: 'warning', details: 'Senha incorreta (3 tentativas)', ip: '192.168.1.105' },
  { id: '6', userId: '1', userName: 'Admin InfraCore', action: 'Backup Manual', module: 'Segurança', timestamp: '01/01/2026 12:00', severity: 'info', details: 'Backup completo do banco de dados executado', ip: '192.168.1.100' },
  { id: '7', userId: '1', userName: 'Admin InfraCore', action: 'Atualização de Estoque', module: 'Estoque', timestamp: '01/01/2026 14:20', severity: 'info', details: 'Ajuste manual de inventário: Cimento CP-II (+50 un)', ip: '192.168.1.100' },
  { id: '8', userId: 'financial', userName: 'Analista Financeiro', action: 'Pagamento Realizado', module: 'Financeiro', timestamp: '01/01/2026 15:45', severity: 'info', details: 'Conta de Energia (Ref: 12/2025) paga via Boleto', ip: '192.168.1.108' }
];

export const INITIAL_PLAN_OF_ACCOUNTS: PlanOfAccountNode[] = [
  {
    id: '1', code: '1.01', name: 'Receita Operacional Bruta', type: 'Receita', children: [
      { id: '10101', code: '1.01.01', name: 'Venda de Agregados (Brita/Areia/Pó)' },
      { id: '10102', code: '1.01.02', name: 'Venda de Rachão/Pedra de Mão' },
      { id: '10103', code: '1.01.03', name: 'Venda de Concreto Usinado' },
      { id: '10104', code: '1.01.04', name: 'Serviço de Bombeamento de Concreto' },
      { id: '10105', code: '1.01.05', name: 'Venda de Massa Asfáltica (CBUQ)' },
      { id: '10106', code: '1.01.06', name: 'Venda de Emulsão Asfáltica' },
      { id: '10107', code: '1.01.07', name: 'Execução de Obras de Pavimentação' },
      { id: '10108', code: '1.01.08', name: 'Obras de Infraestrutura e Terraplenagem' },
      { id: '10109', code: '1.01.09', name: 'Obras de Arte Especiais (Pontes/Viadutos)' },
      { id: '10110', code: '1.01.10', name: 'Locação de Equipamentos e Maquinário' },
      { id: '10111', code: '1.01.11', name: 'Serviços de Laboratório/Tecnológicos' }
    ]
  },
  {
    id: '2', code: '1.02', name: 'Outras Receitas', type: 'Receita', children: [
      { id: '10201', code: '1.02.01', name: 'Venda de Ativo Imobilizado (Ganho Capital)' },
      { id: '10202', code: '1.02.02', name: 'Rendimentos Financeiros' },
      { id: '10203', code: '1.02.03', name: 'Recuperação de Despesas' }
    ]
  },
  {
    id: '4', code: '2.01', name: 'Impostos e Deduções s/ Vendas', type: 'Despesa', children: [
      { id: '20101', code: '2.01.01', name: 'ICMS s/ Vendas' },
      { id: '20102', code: '2.01.02', name: 'ISSQN s/ Serviços' },
      { id: '20103', code: '2.01.03', name: 'PIS/COFINS' },
      { id: '20104', code: '2.01.04', name: 'Simples Nacional (se aplicável)' },
      { id: '20105', code: '2.01.05', name: 'Devoluções e Cancelamentos' }
    ]
  },
  {
    id: '5', code: '2.02', name: 'Custos Diretos de Produção (Industrial/Obras)', type: 'Despesa', children: [
      { id: '20201', code: '2.02.01', name: 'Insumos Britagem: Explosivos e Detonação' },
      { id: '20202', code: '2.02.02', name: 'Insumos Britagem: Peças de Desgaste (Manganês/Correias)' },
      { id: '20203', code: '2.02.03', name: 'Insumos Concreto: Cimento' },
      { id: '20204', code: '2.02.04', name: 'Insumos Concreto: Aditivos Químicos' },
      { id: '20205', code: '2.02.05', name: 'Insumos Concreto: Agregados de Terceiros' },
      { id: '20206', code: '2.02.06', name: 'Insumos Asfalto: CAP / Cimento Asfáltico' },
      { id: '20207', code: '2.02.07', name: 'Insumos Asfalto: Emulsão e Polímeros' },
      { id: '20208', code: '2.02.08', name: 'Insumos Asfalto: Combustível Usina (Xisto/Óleo BPF)' },
      { id: '20209', code: '2.02.09', name: 'Materiais de Obra: Aço e Ferragens' },
      { id: '20210', code: '2.02.10', name: 'Materiais de Obra: Tubos e Drenagem' },
      { id: '20211', code: '2.02.11', name: 'Materiais de Obra: Sinalização Viária' },
      { id: '20212', code: '2.02.12', name: 'Subempreiteiros e Serviços Terceirizados' },
      { id: '20213', code: '2.02.13', name: 'Energia Elétrica Industrial (Usinas)' },
      { id: '20214', code: '2.02.14', name: 'Mão de Obra Direta (Operacional Produção)' }
    ]
  },
  {
    id: '9', code: '2.03', name: 'Manutenção e Custos de Frota', type: 'Despesa', children: [
      { id: '20301', code: '2.03.01', name: 'Combustível Diesel (Abastecimento Interno)' },
      { id: '20302', code: '2.03.02', name: 'Combustível Diesel (Abastecimento Externo/Rota)' },
      { id: '20303', code: '2.03.03', name: 'Manutenção Linha Amarela (Máquinas Pesadas)' },
      { id: '20304', code: '2.03.04', name: 'Manutenção Frota Rodoviária (Caminhões)' },
      { id: '20305', code: '2.03.05', name: 'Manutenção Usinas e Instalações Industriais' },
      { id: '20306', code: '2.03.06', name: 'Pneus, Câmaras e Recapagens' },
      { id: '20307', code: '2.03.07', name: 'Locação de Equipamentos de Terceiros' }
    ]
  },
  {
    id: '6', code: '2.04', name: 'Despesas com Pessoal (Administrativo)', type: 'Despesa', children: [
      { id: '20401', code: '2.04.01', name: 'Salários Administrativos' },
      { id: '20402', code: '2.04.02', name: 'Pró-Labore Diretores' },
      { id: '20403', code: '2.04.03', name: 'Encargos Sociais (INSS/FGTS) - Adm' },
      { id: '20404', code: '2.04.04', name: 'Benefícios (VA/VR/VT/Plano Saúde)' },
      { id: '20405', code: '2.04.05', name: 'EPIs e Uniformes (Geral)' }
    ]
  },
  {
    id: '7', code: '2.05', name: 'Despesas Administrativas Gerais', type: 'Despesa', children: [
      { id: '20501', code: '2.05.01', name: 'Aluguel e Condomínio' },
      { id: '20502', code: '2.05.02', name: 'Energia Elétrica (Escritório)' },
      { id: '20503', code: '2.05.03', name: 'Telefonia e Internet' },
      { id: '20504', code: '2.05.04', name: 'Material de Escritório e Limpeza' },
      { id: '20505', code: '2.05.05', name: 'Serviços Profissionais (Contábil/Jurídico/TI)' },
      { id: '20506', code: '2.05.06', name: 'Seguros Gerais' },
      { id: '20507', code: '2.05.07', name: 'Viagens e Estadias (Administrativo)' }
    ]
  },
  {
    id: '8', code: '2.06', name: 'Despesas Comerciais', type: 'Despesa', children: [
      { id: '20601', code: '2.06.01', name: 'Comissões de Vendas' },
      { id: '20602', code: '2.06.02', name: 'Marketing e Publicidade' },
      { id: '20603', code: '2.06.03', name: 'Brindes e Eventos' }
    ]
  },
  {
    id: '10', code: '2.07', name: 'Despesas Financeiras e Tributárias', type: 'Despesa', children: [
      { id: '20701', code: '2.07.01', name: 'Tarifas Bancárias' },
      { id: '20702', code: '2.07.02', name: 'Juros Pagos' },
      { id: '20703', code: '2.07.03', name: 'IPTU / IPVA / Taxas Diversas' }
    ]
  },
  {
    id: '12', code: '2.09', name: 'Investimentos (CAPEX)', type: 'Despesa', children: [
      { id: '20901', code: '2.09.01', name: 'Aquisição de Máquinas e Equipamentos' },
      { id: '20902', code: '2.09.02', name: 'Reforma/Revitalização de Máquinas' },
      { id: '20903', code: '2.09.03', name: 'Construção Civil (Instalações)' },
      { id: '20904', code: '2.09.04', name: 'Veículos Leves e Utilitários' },
      { id: '20905', code: '2.09.05', name: 'Móveis e Tecnologia' }
    ]
  }
];

export const PERMISSION_ALIAS_MAP: Record<string, string[]> = {
  // Sales
  'sales.view': ['sales.view.sales', 'sales.create', 'sales.edit'],
  'sales.view.sales': ['sales.view'],
  'sales.create': ['sales.create.sales'],
  'sales.create.sales': ['sales.create'],
  'sales.manage': ['sales.view', 'sales.create', 'sales.edit', 'sales.approve'],

  // Clients
  'clients.manage': ['clients.view', 'clients.create', 'clients.edit'],
  'clients.view': ['clients.manage'],
  'clients.create': ['clients.manage'],
  'clients.edit': ['clients.manage'],
  'clients.delete': ['clients.manage'],

  // Suppliers
  'suppliers.manage': ['suppliers.view', 'purchases.manage', 'purchases.view'],
  'suppliers.view': ['suppliers.manage'],

  // HR & Employees
  'employees.view': ['hr.view'],
  'hr.view': ['employees.view'],
  'employees.manage': ['hr.manage', 'hr.payroll', 'hr.manage_employees'],
  'hr.manage': ['employees.manage', 'hr.manage_employees'],
  'hr.manage_employees': ['hr.manage', 'employees.manage'],
  'hr.payroll': ['employees.manage'],

  // Inventory
  'inventory.manage': ['inventory.create', 'inventory.edit', 'inventory.adjust', 'inventory.view'],
  'inventory.view': ['inventory.manage'],
  'inventory.create': ['inventory.manage'],
  'inventory.edit': ['inventory.manage'],
  'inventory.adjust': ['inventory.manage'],
  'inventory.history': ['inventory.manage'],

  // Fleet
  'fleet.manage': ['fleet.view', 'fleet.maintenance', 'fleet.fuel', 'fleet.tires'],
  'fleet.view': ['fleet.manage'],
  'fleet.maintenance': ['fleet.manage'],
  'fleet.fuel': ['fleet.manage'],

  // Purchases
  'purchases.manage': ['purchases.view', 'purchases.create', 'purchases.approve'],
  'purchases.view': ['purchases.manage'],
  'purchases.create': ['purchases.manage'],

  // Production
  'production.manage': ['production.orders', 'production.execute', 'production.formulas', 'production.units'],
  'production.orders': ['production.manage', 'production.execute'],
  'production.execute': ['production.manage'],

  // Finance
  'finance.view': ['finance.dashboard', 'finance.view_transactions'],
  'finance.dashboard': ['finance.view'],
  'finance.reconcile': ['finance.approve', 'finance.edit_transaction'],
  'finance.transact': ['finance.add_revenue', 'finance.add_expense'],
  'finance.delete': ['finance.manage_accounts', 'finance.edit_transaction', 'finance.approve', 'finance.delete_transaction'],
  'finance.delete_transaction': ['finance.delete', 'finance.admin'],
  'finance.admin': [
    'finance.dashboard', 'finance.view_transactions', 'finance.add_revenue', 'finance.add_expense',
    'finance.edit_transaction', 'finance.delete', 'finance.approve', 'finance.manage_accounts',
    'finance.manage_plan', 'finance.reports'
  ],
  'finance.manage': [
    'finance.dashboard', 'finance.view_transactions', 'finance.add_revenue', 'finance.add_expense',
    'finance.edit_transaction', 'finance.manage_accounts', 'finance.manage_plan'
  ],

  // Reports
  'reports.view': ['reports.view_basic', 'reports.view_advanced'],
  'reports.view_basic': ['reports.view', 'reports.view_advanced'],

  // Settings & System
  'settings.manage': ['settings.system', 'settings.company', 'settings.view'],
  'settings.view': ['settings.manage', 'settings.system', 'settings.company'],

  // AI Agents
  'ai.agents.view': ['ai.agents.manage'],
  'ai.agents.manage': ['ai.agents.view']
};
