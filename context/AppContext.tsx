import React, { createContext, useContext, useState, useMemo, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../src/lib/supabase';
import * as api from '../src/services/api';
import { isValidUUID, generateUUID, toDeterministicUUID } from '../src/services/api';
import {
  Client, Transaction, FleetVehicle, Sale, InventoryItem, Budget, Supplier,
  Employee, PurchaseOrder, MaintenanceRecord, FuelLog, PayrollRecord, TimeLog, Tire, TireHistory,
  ProductionOrder, ProductionFormula, QualityTest, ProductionUnit, User, AppRole, AppSettings, AuditLog,
  Vacation, SalaryAdvance, StockMovement
} from '../types';
// MOCK_CLIENTS, MOCK_TRANSACTIONS, MOCK_FLEET imports removed for clean implementation

// Initial Mock Inventory
// Initial Mock Inventory - CLEARED
const INITIAL_INVENTORY: InventoryItem[] = [];

const INITIAL_BUDGETS: Budget[] = [];

const INITIAL_SUPPLIERS: Supplier[] = [];

const INITIAL_EMPLOYEES: Employee[] = [];

const INITIAL_TIRES: Tire[] = [];

const INITIAL_FORMULAS: ProductionFormula[] = [];

const INITIAL_PRODUCTION_UNITS: ProductionUnit[] = [];

const INITIAL_ROLES: AppRole[] = [
  {
    id: 'admin',
    name: 'Administrador',
    description: 'Acesso total e irrestrito ao sistema.',
    permissions: ['all']
  },
  {
    id: 'manager_com',
    name: 'Gerente Comercial',
    description: 'Gestão completa de vendas, clientes e equipe comercial.',
    permissions: [
      'dashboard.view',
      'sales.view', 'sales.create', 'sales.edit', 'sales.approve', 'sales.cancel',
      'clients.view', 'clients.create', 'clients.edit', 'clients.delete', 'clients.financial'
    ]
  },
  {
    id: 'salesperson',
    name: 'Vendedor',
    description: 'Acesso padrão para força de vendas.',
    permissions: [
      'sales.view', 'sales.create', 'clients.view', 'clients.create', 'clients.edit'
    ]
  },
  {
    id: 'manager_stock',
    name: 'Gestor de Estoque',
    description: 'Controle total de inventário e compras.',
    permissions: [
      'dashboard.view',
      'inventory.view', 'inventory.create', 'inventory.edit', 'inventory.adjust', 'inventory.history',
      'purchases.view', 'purchases.create', 'purchases.approve', 'purchases.receive',
      'suppliers.view', 'suppliers.manage'
    ]
  },
  {
    id: 'operator',
    name: 'Operador de Campo',
    description: 'Focado em execução de ordens e manutenção.',
    permissions: [
      'production.execute', 'fleet.view', 'fleet.maintenance', 'fleet.fuel'
    ]
  },
  {
    id: 'financial',
    name: 'Analista Financeiro',
    description: 'Contas a pagar/receber e fluxo de caixa.',
    permissions: [
      'dashboard.view',
      'finance.dashboard', 'finance.view_transactions', 'finance.add_revenue', 'finance.add_expense',
      'finance.edit_transaction', 'finance.approve', 'finance.manage_accounts', 'finance.manage_plan', 'finance.reports'
    ]
  }
];

const INITIAL_USERS: User[] = [
  { id: '1', name: 'Admin InfraCore', username: 'admin', password: '123', email: 'admin@infracore.com', roleId: 'admin', status: 'Ativo', registeredAt: '01/01/2023' },
  { id: '2', name: 'Gerência Vendas', username: 'vendas', password: '123', email: 'vendas@infracore.com', roleId: 'manager_com', status: 'Ativo', registeredAt: '15/05/2023' },
];

const INITIAL_SETTINGS: AppSettings = {
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
  // Expanded Defaults
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

const INITIAL_AUDIT_LOGS: AuditLog[] = [
  { id: '1', userId: '1', userName: 'Admin InfraCore', action: 'Login no Sistema', module: 'Login', timestamp: '01/01/2026 08:00', severity: 'info', details: 'Login realizado com sucesso via senha', ip: '192.168.1.100' },
  { id: '2', userId: '1', userName: 'Admin InfraCore', action: 'Alteração de Configuração', module: 'Configurações', timestamp: '01/01/2026 08:05', severity: 'warning', details: 'Alterou o tema para Escuro', ip: '192.168.1.100' },
  { id: '3', userId: '2', userName: 'Gerência Vendas', action: 'Nova Venda', module: 'Vendas', timestamp: '01/01/2026 09:15', severity: 'info', details: 'Venda #1034 criada para Cliente Exemplo', ip: '192.168.1.102' },
  { id: '4', userId: '1', userName: 'Admin InfraCore', action: 'Exclusão de Usuário', module: 'Configurações', timestamp: '01/01/2026 10:30', severity: 'critical', details: 'Usuário temp_user removido permanentemente', ip: '192.168.1.100' },
  { id: '5', userId: '2', userName: 'Gerência Vendas', action: 'Falha de Login', module: 'Login', timestamp: '01/01/2026 11:00', severity: 'warning', details: 'Senha incorreta (3 tentativas)', ip: '192.168.1.105' },
  { id: '6', userId: '1', userName: 'Admin InfraCore', action: 'Backup Manual', module: 'Segurança', timestamp: '01/01/2026 12:00', severity: 'info', details: 'Backup completo do banco de dados executado', ip: '192.168.1.100' },
  { id: '7', userId: '1', userName: 'Admin InfraCore', action: 'Atualização de Estoque', module: 'Estoque', timestamp: '01/01/2026 14:20', severity: 'info', details: 'Ajuste manual de inventário: Cimento CP-II (+50 un)', ip: '192.168.1.100' },
  { id: '8', userId: 'financial', userName: 'Analista Financeiro', action: 'Pagamento Realizado', module: 'Financeiro', timestamp: '01/01/2026 15:45', severity: 'info', details: 'Conta de Energia (Ref: 12/2025) paga via Boleto', ip: '192.168.1.108' },
];

interface AppContextType {
  clients: Client[];
  suppliers: Supplier[];
  employees: Employee[];
  transactions: Transaction[];
  sales: Sale[];
  budgets: Budget[];
  purchaseOrders: PurchaseOrder[];
  fleet: FleetVehicle[];
  inventory: InventoryItem[];
  stockMovements: StockMovement[];
  payroll: PayrollRecord[];
  timeLogs: TimeLog[];
  tires: Tire[];
  productionOrders: ProductionOrder[];
  formulas: ProductionFormula[];
  productionUnits: ProductionUnit[];
  users: User[];
  roles: AppRole[];
  settings: AppSettings;
  auditLogs: AuditLog[];
  accounts: any[]; // Assuming 'any' for now based on INITIAL_ACCOUNTS structure
  planOfAccounts: any[]; // Assuming 'any' for now based on INITIAL_PLAN_OF_ACCOUNTS structure

  currentUser: User | null;
  login: (username: string, password?: string, rememberMe?: boolean) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  hasPermission: (permissionId: string) => boolean;

  addClient: (client: Client) => void;
  updateClient: (client: Client) => void;
  deleteClient: (id: string) => void;

  addSupplier: (supplier: Supplier) => void;
  updateSupplier: (supplier: Supplier) => void;
  deleteSupplier: (id: string) => void;

  addEmployee: (employee: Employee) => void;
  updateEmployee: (employee: Employee) => void;
  deleteEmployee: (id: string) => void;

  addPayroll: (record: PayrollRecord) => void;
  payPayroll: (id: string) => void;
  addTimeLog: (log: TimeLog) => void;

  // Vacations
  vacations: Vacation[];
  addVacation: (vacation: Vacation) => void;
  updateVacationStatus: (id: string, status: Vacation['status'], approvedBy?: string) => void;
  deleteVacation: (id: string) => void;

  // Salary Advances
  salaryAdvances: SalaryAdvance[];
  addSalaryAdvance: (advance: SalaryAdvance) => void;
  updateAdvanceStatus: (id: string, status: SalaryAdvance['status'], approvedBy?: string) => void;
  paySalaryAdvance: (id: string) => void;
  deleteAdvance: (id: string) => void;

  addTransaction: (transaction: Transaction) => void;
  updateTransaction: (transaction: Transaction) => void;
  updateTransactionStatus: (id: string, status: Transaction['status'], date?: string) => void;
  deleteTransaction: (id: string) => void;
  importTransactions: (file: any) => void;
  addSale: (sale: Sale) => void;
  addBudget: (budget: Budget) => void;
  updateBudget: (budget: Budget) => void;
  updateBudgetStatus: (id: string, status: Budget['status']) => void;

  addPurchaseOrder: (order: PurchaseOrder) => void;
  updatePurchaseOrder: (order: PurchaseOrder) => void;
  receivePurchaseOrder: (id: string) => void;

  addVehicle: (vehicle: FleetVehicle) => void;
  updateVehicle: (vehicle: FleetVehicle) => void;
  updateVehicleStatus: (id: string, status: FleetVehicle['status']) => void;
  deleteVehicle: (id: string) => void;
  addMaintenanceRecord: (vehicleId: string, record: MaintenanceRecord) => void;
  addFuelLog: (vehicleId: string, log: FuelLog) => void;

  addTire: (tire: Tire) => void;
  updateTire: (tire: Tire) => void;
  deleteTire: (id: string) => void;
  addTireHistory: (tireId: string, entry: TireHistory) => void;
  deleteTireHistory: (tireId: string, historyId: string) => void;

  deleteMaintenanceRecord: (vehicleId: string, recordId: string) => void;
  deleteFuelLog: (vehicleId: string, logId: string) => void;

  addStockItem: (item: InventoryItem) => void;
  updateStock: (itemId: string, quantityDelta: number, reason?: string, documentId?: string) => void;
  updateStockItem: (item: InventoryItem) => void;
  deleteStockItem: (id: string) => void;

  // Production
  addProductionOrder: (order: ProductionOrder) => void;
  updateProductionOrder: (order: ProductionOrder) => void;
  deleteProductionOrder: (id: string) => void;
  startProduction: (id: string) => void;
  completeProduction: (id: string) => void;
  addFormula: (formula: ProductionFormula) => void;
  updateFormula: (formula: ProductionFormula) => void;
  deleteFormula: (id: string) => void; // Added
  addQualityTest: (orderId: string, test: QualityTest) => void;

  addProductionUnit: (unit: ProductionUnit) => void;
  updateProductionUnit: (unit: ProductionUnit) => void;
  deleteProductionUnit: (id: string) => void;

  addUser: (user: User) => void;
  updateUser: (user: User) => void;
  deleteUser: (id: string) => void;
  addRole: (role: AppRole) => void;
  updateRole: (role: AppRole) => void;
  deleteRole: (id: string) => void;
  updateSettings: (settings: AppSettings) => void;

  addAccount: (acc: any) => void; // Added
  deleteAccount: (id: string) => void; // Added
  addPlanAccount: (parentId: string | null, name: string, type?: 'Receita' | 'Despesa') => void; // Updated
  deletePlanAccount: (id: string, parentId?: string | null) => void; // Updated
  updatePlanAccount: (id: string, name: string, parentId?: string | null) => void; // Updated

  clearAllData: () => void;
  addAuditLog: (log: Omit<AuditLog, 'id' | 'timestamp'>) => void;
  seedDatabase: (data: any) => void;
  financials: {
    totalRevenue: number;
    totalExpenses: number;
    balance: number;
    projectedBalance: number;
    receivables: number;
    payables: number;
    recentTransactions: Transaction[];
  };
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEY = 'infracore_erp_data';

const INITIAL_ACCOUNTS = [
  { id: 'acc-1', name: 'Caixa Geral', type: 'Espécie', balance: 0, color: 'bg-emerald-600', code: 'Gaveta / Cofre' }
];

const INITIAL_PLAN_OF_ACCOUNTS = [
  // ==================================================================================
  // GRUPO 1: RECEITAS OPERACIONAIS (ENTRADAS)
  // ==================================================================================
  {
    id: '1', code: '1.01', name: 'Receita Operacional Bruta', type: 'Receita', children: [
      // 1.01.01 - Britagem / Agregados
      { id: '10101', code: '1.01.01', name: 'Venda de Agregados (Brita/Areia/Pó)' },
      { id: '10102', code: '1.01.02', name: 'Venda de Rachão/Pedra de Mão' },

      // 1.01.03 - Concreto
      { id: '10103', code: '1.01.03', name: 'Venda de Concreto Usinado' },
      { id: '10104', code: '1.01.04', name: 'Serviço de Bombeamento de Concreto' },

      // 1.01.05 - Asfalto
      { id: '10105', code: '1.01.05', name: 'Venda de Massa Asfáltica (CBUQ)' },
      { id: '10106', code: '1.01.06', name: 'Venda de Emulsão Asfáltica' },

      // 1.01.07 - Engenharia e Obras
      { id: '10107', code: '1.01.07', name: 'Execução de Obras de Pavimentação' },
      { id: '10108', code: '1.01.08', name: 'Obras de Infraestrutura e Terraplenagem' },
      { id: '10109', code: '1.01.09', name: 'Obras de Arte Especiais (Pontes/Viadutos)' },

      // Outros
      { id: '10110', code: '1.01.10', name: 'Locação de Equipamentos e Maquinário' },
      { id: '10111', code: '1.01.11', name: 'Serviços de Laboratório/Tecnológicos' }
    ]
  },
  {
    id: '2', code: '1.02', name: 'Outras Receitas', type: 'Receita', children: [
      { id: '10201', code: '1.02.01', name: 'Venda de Ativo Imobilizado (Ganho Capital)' },
      { id: '10202', code: '1.02.02', name: 'Rendimentos Financeiros' },
      { id: '10203', code: '1.02.03', name: 'Recuperação de Despesas' },
    ]
  },

  // ==================================================================================
  // GRUPO 2: CUSTOS E DESPESAS (SAÍDAS)
  // ==================================================================================

  // ----------------------------------------------------------------------------------
  // 2.01 - DEDUÇÕES DA RECEITA
  // ----------------------------------------------------------------------------------
  {
    id: '4', code: '2.01', name: 'Impostos e Deduções s/ Vendas', type: 'Despesa', children: [
      { id: '20101', code: '2.01.01', name: 'ICMS s/ Vendas' },
      { id: '20102', code: '2.01.02', name: 'ISSQN s/ Serviços' },
      { id: '20103', code: '2.01.03', name: 'PIS/COFINS' },
      { id: '20104', code: '2.01.04', name: 'Simples Nacional (se aplicável)' },
      { id: '20105', code: '2.01.05', name: 'Devoluções e Cancelamentos' },
    ]
  },

  // ----------------------------------------------------------------------------------
  // 2.02 - CUSTOS DIRETOS DE PRODUÇÃO (CPV / CSP)
  // ----------------------------------------------------------------------------------
  {
    id: '5', code: '2.02', name: 'Custos Diretos de Produção (Industrial/Obras)', type: 'Despesa', children: [
      // Insumos Britagem
      { id: '20201', code: '2.02.01', name: 'Insumos Britagem: Explosivos e Detonação' },
      { id: '20202', code: '2.02.02', name: 'Insumos Britagem: Peças de Desgaste (Manganês/Correias)' },

      // Insumos Concreto
      { id: '20203', code: '2.02.03', name: 'Insumos Concreto: Cimento' },
      { id: '20204', code: '2.02.04', name: 'Insumos Concreto: Aditivos Químicos' },
      { id: '20205', code: '2.02.05', name: 'Insumos Concreto: Agregados de Terceiros' },

      // Insumos Asfalto
      { id: '20206', code: '2.02.06', name: 'Insumos Asfalto: CAP / Cimento Asfáltico' },
      { id: '20207', code: '2.02.07', name: 'Insumos Asfalto: Emulsão e Polímeros' },
      { id: '20208', code: '2.02.08', name: 'Insumos Asfalto: Combustível Usina (Xisto/Óleo BPF)' },

      // Insumos Obras
      { id: '20209', code: '2.02.09', name: 'Materiais de Obra: Aço e Ferragens' },
      { id: '20210', code: '2.02.10', name: 'Materiais de Obra: Tubos e Drenagem' },
      { id: '20211', code: '2.02.11', name: 'Materiais de Obra: Sinalização Viária' },
      { id: '20212', code: '2.02.12', name: 'Subempreiteiros e Serviços Terceirizados' },

      // Energia e Mão de Obra Fabril
      { id: '20213', code: '2.02.13', name: 'Energia Elétrica Industrial (Usinas)' },
      { id: '20214', code: '2.02.14', name: 'Mão de Obra Direta (Operacional Produção)' },
    ]
  },

  // ----------------------------------------------------------------------------------
  // 2.03 - MANUTENÇÃO E FROTA
  // ----------------------------------------------------------------------------------
  {
    id: '9', code: '2.03', name: 'Manutenção e Custos de Frota', type: 'Despesa', children: [
      { id: '20301', code: '2.03.01', name: 'Combustível Diesel (Abastecimento Interno)' },
      { id: '20302', code: '2.03.02', name: 'Combustível Diesel (Abastecimento Externo/Rota)' },
      { id: '20303', code: '2.03.03', name: 'Manutenção Linha Amarela (Máquinas Pesadas)' },
      { id: '20304', code: '2.03.04', name: 'Manutenção Frota Rodoviária (Caminhões)' },
      { id: '20305', code: '2.03.05', name: 'Manutenção Usinas e Instalações Industriais' },
      { id: '20306', code: '2.03.06', name: 'Pneus, Câmaras e Recapagens' },
      { id: '20307', code: '2.03.07', name: 'Locação de Equipamentos de Terceiros' },
    ]
  },

  // ----------------------------------------------------------------------------------
  // 2.04 - DESPESAS COM PESSOAL (ADMINISTRATIVO)
  // ----------------------------------------------------------------------------------
  {
    id: '6', code: '2.04', name: 'Despesas com Pessoal (Administrativo)', type: 'Despesa', children: [
      { id: '20401', code: '2.04.01', name: 'Salários Administrativos' },
      { id: '20402', code: '2.04.02', name: 'Pró-Labore Diretores' },
      { id: '20403', code: '2.04.03', name: 'Encargos Sociais (INSS/FGTS) - Adm' },
      { id: '20404', code: '2.04.04', name: 'Benefícios (VA/VR/VT/Plano Saúde)' },
      { id: '20405', code: '2.04.05', name: 'EPIs e Uniformes (Geral)' },
    ]
  },

  // ----------------------------------------------------------------------------------
  // 2.05 - DESPESAS ADMINISTRATIVAS E GERAIS
  // ----------------------------------------------------------------------------------
  {
    id: '7', code: '2.05', name: 'Despesas Administrativas Gerais', type: 'Despesa', children: [
      { id: '20501', code: '2.05.01', name: 'Aluguel e Condomínio' },
      { id: '20502', code: '2.05.02', name: 'Energia Elétrica (Escritório)' },
      { id: '20503', code: '2.05.03', name: 'Telefonia e Internet' },
      { id: '20504', code: '2.05.04', name: 'Material de Escritório e Limpeza' },
      { id: '20505', code: '2.05.05', name: 'Serviços Profissionais (Contábil/Jurídico/TI)' },
      { id: '20506', code: '2.05.06', name: 'Seguros Gerais' },
      { id: '20507', code: '2.05.07', name: 'Viagens e Estadias (Administrativo)' },
    ]
  },

  // ----------------------------------------------------------------------------------
  // 2.06 - DESPESAS COMERCIAIS
  // ----------------------------------------------------------------------------------
  {
    id: '8', code: '2.06', name: 'Despesas Comerciais', type: 'Despesa', children: [
      { id: '20601', code: '2.06.01', name: 'Comissões de Vendas' },
      { id: '20602', code: '2.06.02', name: 'Marketing e Publicidade' },
      { id: '20603', code: '2.06.03', name: 'Brindes e Eventos' },
    ]
  },

  // ----------------------------------------------------------------------------------
  // 2.07 - DESPESAS FINANCEIRAS E TRIBUTÁRIAS
  // ----------------------------------------------------------------------------------
  {
    id: '10', code: '2.07', name: 'Despesas Financeiras e Tributárias', type: 'Despesa', children: [
      { id: '20701', code: '2.07.01', name: 'Tarifas Bancárias' },
      { id: '20702', code: '2.07.02', name: 'Juros Pagos' },
      { id: '20703', code: '2.07.03', name: 'IPTU / IPVA / Taxas Diversas' },
    ]
  },

  // ----------------------------------------------------------------------------------
  // 2.09 - INVESTIMENTOS (CAPEX)
  // ----------------------------------------------------------------------------------
  {
    id: '12', code: '2.09', name: 'Investimentos (CAPEX)', type: 'Despesa', children: [
      { id: '20901', code: '2.09.01', name: 'Aquisição de Máquinas e Equipamentos' },
      { id: '20902', code: '2.09.02', name: 'Reforma/Revitalização de Máquinas' },
      { id: '20903', code: '2.09.03', name: 'Construção Civil (Instalações)' },
      { id: '20904', code: '2.09.04', name: 'Veículos Leves e Utilitários' },
      { id: '20905', code: '2.09.05', name: 'Móveis e Tecnologia' },
    ]
  },
];

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>(INITIAL_SUPPLIERS);
  const [employees, setEmployees] = useState<Employee[]>(INITIAL_EMPLOYEES);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>(INITIAL_BUDGETS);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [fleet, setFleet] = useState<FleetVehicle[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>(INITIAL_INVENTORY);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const [payroll, setPayroll] = useState<PayrollRecord[]>([]);
  const [timeLogs, setTimeLogs] = useState<TimeLog[]>([]);
  const [vacations, setVacations] = useState<Vacation[]>([]);
  const [salaryAdvances, setSalaryAdvances] = useState<SalaryAdvance[]>([]);
  const [tires, setTires] = useState<Tire[]>(INITIAL_TIRES);
  const [productionOrders, setProductionOrders] = useState<ProductionOrder[]>([]);
  const [formulas, setFormulas] = useState<ProductionFormula[]>(INITIAL_FORMULAS);
  const [productionUnits, setProductionUnits] = useState<ProductionUnit[]>(INITIAL_PRODUCTION_UNITS);
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [roles, setRoles] = useState<AppRole[]>(INITIAL_ROLES);
  const [settings, setSettings] = useState<AppSettings>(INITIAL_SETTINGS);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(INITIAL_AUDIT_LOGS);
  const [accounts, setAccounts] = useState<any[]>(INITIAL_ACCOUNTS);
  const [planOfAccounts, setPlanOfAccounts] = useState<any[]>(INITIAL_PLAN_OF_ACCOUNTS);

  // Cross-Tab Synchronization Configuration
  const CROSS_TAB_CHANNEL_NAME = 'infracore_erp_cross_tab_sync';
  const TAB_INSTANCE_ID = useMemo(() => {
    return typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2);
  }, []);

  const broadcastCrossTab = useCallback((msg: {
    type: 'MUTATION' | 'STOCK_MUTATION' | 'SALE_INVOICED' | 'PO_RECEIVED' | 'AUTH_SYNC' | 'FULL_SYNC';
    table?: string;
    action?: 'add' | 'update' | 'delete';
    id?: string;
    item?: any;
    payload?: any;
  }) => {
    const fullMsg = {
      ...msg,
      senderTabId: TAB_INSTANCE_ID,
      msgId: Math.random().toString(36).slice(2),
      _t: Date.now()
    };

    if (typeof window !== 'undefined') {
      if ('BroadcastChannel' in window) {
        try {
          const bc = new BroadcastChannel(CROSS_TAB_CHANNEL_NAME);
          bc.postMessage(fullMsg);
          bc.close();
        } catch (err) {
          console.warn('BroadcastChannel error:', err);
        }
      }
      try {
        localStorage.setItem('infracore_cross_tab_event', JSON.stringify(fullMsg));
      } catch {}
    }
  }, [TAB_INSTANCE_ID]);

  // Auth State
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('infracore_current_user') || sessionStorage.getItem('infracore_current_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const persistCurrentUser = (user: User | null, rememberMe: boolean = true) => {
    setCurrentUser(user);
    try {
      if (!user) {
        localStorage.removeItem('infracore_current_user');
        sessionStorage.removeItem('infracore_current_user');
      } else {
        const safeUser = { ...user, password: '' };
        if (rememberMe) {
          localStorage.setItem('infracore_current_user', JSON.stringify(safeUser));
        } else {
          sessionStorage.setItem('infracore_current_user', JSON.stringify(safeUser));
        }
      }
    } catch (e) {
      console.error('Failed to persist session', e);
    }
    broadcastCrossTab({
      type: 'AUTH_SYNC',
      payload: { user }
    });
  };

  const login = async (username: string, password?: string, rememberMe: boolean = true): Promise<{ success: boolean; message?: string }> => {
    let user = users.find(u => u.username === username);

    // Emergency admin login for empty database
    if (!user && users.length === 0 && username === 'admin' && password === '123') {
      const mockAdmin = INITIAL_USERS.find(u => u.username === 'admin');
      if (mockAdmin) {
        if (roles.length === 0) setRoles(INITIAL_ROLES);
        persistCurrentUser(mockAdmin, rememberMe);
        return { success: true, message: 'Acesso de Configuração Inicial' };
      }
    }

    if (!user) {
      return { success: false, message: 'Usuário não encontrado.' };
    }

    if (user.status !== 'Ativo') {
      return { success: false, message: 'Usuário inativo ou bloqueado.' };
    }

    if (user.password !== password) {
      return { success: false, message: 'Senha incorreta.' };
    }

    persistCurrentUser(user, rememberMe);
    return { success: true };
  };

  const logout = () => {
    persistCurrentUser(null);
  };

  const hasPermission = useCallback((permissionId: string) => {
    if (!currentUser) return false;

    if (currentUser.roleId === 'admin' || currentUser.username?.toLowerCase() === 'admin') {
      return true;
    }

    const userRole = roles.find(
      r =>
        r.id === currentUser.roleId ||
        (currentUser.roleId === 'manager' && r.id === 'manager_com') ||
        (currentUser.roleId === 'admin' && /^(adm|admin|administrador|super\s*admin)/i.test(r.name?.trim() || ''))
    );
    if (!userRole) return false;

    if (
      userRole.permissions.includes('all') ||
      userRole.permissions.includes('*') ||
      /^(adm|admin|administrador|super\s*admin)/i.test(userRole.name?.trim() || '')
    ) {
      return true;
    }

    if (userRole.permissions.includes(permissionId)) return true;

    // Comprehensive bidirectional alias mapping across modules
    const aliasMap: Record<string, string[]> = {
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

      // Finance
      'finance.view': ['finance.dashboard', 'finance.view_transactions'],
      'finance.dashboard': ['finance.view'],
      'finance.reconcile': ['finance.approve', 'finance.edit_transaction'],
      'finance.transact': ['finance.add_revenue', 'finance.add_expense'],
      'finance.delete': ['finance.manage_accounts', 'finance.edit_transaction', 'finance.approve', 'finance.delete_transaction'],
      'finance.delete_transaction': ['finance.delete', 'finance.edit_transaction', 'finance.approve', 'finance.manage_accounts'],
      'finance.admin': ['finance.manage_accounts', 'finance.manage_plan', 'finance.approve', 'finance.dashboard'],

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

    const aliases = aliasMap[permissionId];
    if (aliases && aliases.some(a => userRole.permissions.includes(a))) {
      return true;
    }

    return false;
  }, [currentUser, roles]);

  // Load Remote Supabase Data
  const loadSupabaseData = async () => {
    if (!isSupabaseConfigured()) return;

    try {
      const [
        cl, su, emp, inv, tr, fl, ti, us, ro, set, sa, po, pro, prf, pru, fac, pay, stm,
        bud, tml, vac, adv, aud, maint, fuel
      ] = await Promise.all([
        api.fetchData<Client>('clients'),
        api.fetchData<Supplier>('suppliers'),
        api.fetchData<Employee>('employees'),
        api.fetchData<InventoryItem>('inventory'),
        api.fetchData<Transaction>('transactions'),
        api.fetchData<FleetVehicle>('fleet'),
        api.fetchData<Tire>('tires'),
        api.fetchData<User>('users'),
        api.fetchRoles(),
        api.fetchData<AppSettings>('settings'),

        // All Additional Tables
        api.fetchData<Sale>('sales'),
        api.fetchData<PurchaseOrder>('purchase_orders'),
        api.fetchData<ProductionOrder>('production_orders'),
        api.fetchData<ProductionFormula>('production_formulas'),
        api.fetchData<ProductionUnit>('production_units'),
        api.fetchData<any>('financial_accounts'),
        api.fetchData<PayrollRecord>('payroll'),
        api.fetchData<StockMovement>('stock_movements').catch(() => []),
        api.fetchData<Budget>('budgets').catch(() => []),
        api.fetchData<TimeLog>('time_logs').catch(() => []),
        api.fetchData<Vacation>('vacations').catch(() => []),
        api.fetchData<SalaryAdvance>('salary_advances').catch(() => []),
        api.fetchData<AuditLog>('audit_logs').catch(() => []),
        api.fetchData<MaintenanceRecord>('maintenance_records').catch(() => []),
        api.fetchData<FuelLog>('fuel_logs').catch(() => [])
      ]);

      if (cl && cl.length > 0) setClients(cl);
      if (su && su.length > 0) setSuppliers(su);
      if (emp && emp.length > 0) setEmployees(emp);
      if (inv && inv.length > 0) setInventory(inv);
      if (tr && tr.length > 0) setTransactions(tr);
      if (ti && ti.length > 0) setTires(ti);
      if (us && us.length > 0) setUsers(us);
      if (ro && ro.length > 0) setRoles(ro);
      if (set && set.length > 0) setSettings(set[0]);

      if (fl && fl.length > 0) {
        const enrichedFleet = fl.map(v => ({
          ...v,
          maintenanceHistory: maint && maint.length > 0 ? maint.filter(m => m.vehicleId === v.id) : (v.maintenanceHistory || []),
          fuelLogs: fuel && fuel.length > 0 ? fuel.filter(f => f.vehicleId === v.id) : (v.fuelLogs || [])
        }));
        setFleet(enrichedFleet);
      }

      if (sa && sa.length > 0) setSales(sa);
      if (po && po.length > 0) setPurchaseOrders(po);
      if (pro && pro.length > 0) setProductionOrders(pro);
      if (prf && prf.length > 0) setFormulas(prf);
      if (pru && pru.length > 0) setProductionUnits(pru);
      if (fac && fac.length > 0) setAccounts(fac);
      if (pay && pay.length > 0) setPayroll(pay);
      if (stm && stm.length > 0) setStockMovements(stm);
      if (bud && bud.length > 0) setBudgets(bud);
      if (tml && tml.length > 0) setTimeLogs(tml);
      if (vac && vac.length > 0) setVacations(vac);
      if (adv && adv.length > 0) setSalaryAdvances(adv);
      if (aud && aud.length > 0) setAuditLogs(aud);

      // Auto-Seed: If database is completely empty, populate initial structure
      if (us && us.length === 0 && ro && ro.length === 0 && cl && cl.length === 0) {
        try {
          const roleMap: Record<string, string> = {};
          for (const role of INITIAL_ROLES) {
            const { id, ...rest } = role;
            const cleanRole = await api.createItem<AppRole>('app_roles', rest);
            if (cleanRole) roleMap[role.id] = cleanRole.id;
          }

          for (const user of INITIAL_USERS) {
            const { id, roleId, ...rest } = user;
            const newRoleId = roleMap[roleId] || roleId;
            await api.createItem('users', { ...rest, roleId: newRoleId });
          }

          if (set && set.length === 0) {
            await api.createItem('settings', INITIAL_SETTINGS);
          }

          for (const item of INITIAL_SUPPLIERS) {
            const { id, ...rest } = item;
            await api.createItem('suppliers', rest);
          }

          for (const item of INITIAL_EMPLOYEES) {
            const { id, ...rest } = item;
            await api.createItem('employees', rest);
          }

          for (const item of INITIAL_INVENTORY) {
            await api.createItem('inventory', item);
          }

          for (const item of INITIAL_PRODUCTION_UNITS) {
            const { id, ...rest } = item;
            await api.createItem('production_units', rest);
          }

          for (const item of INITIAL_FORMULAS) {
            const { id, ...rest } = item;
            await api.createItem('production_formulas', rest);
          }

          const latestUsers = await api.fetchData<User>('users');
          if (latestUsers && latestUsers.length > 0) {
            setUsers(latestUsers);
          }
        } catch (seedErr) {
          console.error('Seeding failed:', seedErr);
        }
      }
    } catch (e) {
      console.error('Failed to load Supabase data', e);
    }
  };

  // Initial Load from LocalStorage and Remote Database
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        if (data.clients) setClients(data.clients);
        if (data.suppliers) setSuppliers(data.suppliers);
        if (data.employees) setEmployees(data.employees);
        if (data.transactions) setTransactions(data.transactions);
        if (data.sales) setSales(data.sales);
        if (data.budgets) setBudgets(data.budgets);
        if (data.purchaseOrders) setPurchaseOrders(data.purchaseOrders);
        if (data.fleet) setFleet(data.fleet);
        if (data.inventory) setInventory(data.inventory);
        if (data.payroll) setPayroll(data.payroll);
        if (data.timeLogs) setTimeLogs(data.timeLogs);
        if (data.vacations) setVacations(data.vacations);
        if (data.salaryAdvances) setSalaryAdvances(data.salaryAdvances);
        if (data.tires) setTires(data.tires);
        if (data.productionOrders) setProductionOrders(data.productionOrders);
        if (data.formulas) setFormulas(data.formulas);
        if (data.productionUnits) setProductionUnits(data.productionUnits);
        if (data.users) setUsers(data.users);
        if (data.roles) setRoles(data.roles);
        if (data.settings) setSettings(data.settings);
        if (data.auditLogs) setAuditLogs(data.auditLogs);
        if (data.stockMovements) setStockMovements(data.stockMovements);
        if (data.accounts) setAccounts(data.accounts);
        if (data.planOfAccounts && data.planOfAccounts.length > 0) {
          setPlanOfAccounts(data.planOfAccounts);
        }
      }
    } catch (e) {
      console.error('Failed to load persistence', e);
    }

    loadSupabaseData();
  }, []);

  // Save to LocalStorage on state change
  useEffect(() => {
    const data = {
      clients, suppliers, employees, transactions, sales, budgets, purchaseOrders, fleet, inventory, payroll, timeLogs, vacations, salaryAdvances, tires,
      productionOrders, formulas, productionUnits, users, roles, settings, auditLogs, accounts, planOfAccounts, stockMovements
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('Failed to save to localStorage quota', e);
    }
  }, [clients, suppliers, employees, transactions, sales, budgets, purchaseOrders, fleet, inventory, payroll, timeLogs, vacations, salaryAdvances, tires, productionOrders, formulas, productionUnits, users, roles, settings, auditLogs, accounts, planOfAccounts, stockMovements]);

  // Reactive Cross-Tab Listener
  useEffect(() => {
    const processedMsgIds = new Set<string>();

    const handleMessage = (msg: any) => {
      if (!msg || msg.senderTabId === TAB_INSTANCE_ID) return;
      if (msg.msgId) {
        if (processedMsgIds.has(msg.msgId)) return;
        processedMsgIds.add(msg.msgId);
        if (processedMsgIds.size > 200) {
          const first = processedMsgIds.values().next().value;
          if (first) processedMsgIds.delete(first);
        }
      }

      switch (msg.type) {
        case 'MUTATION': {
          const { table, action, id, item } = msg;
          if (!table) return;

          const applyToSetter = (setter: React.Dispatch<React.SetStateAction<any[]>>) => {
            if (action === 'add' && item) {
              setter(prev => prev.some(i => i.id === item.id) ? prev : [item, ...prev]);
            } else if (action === 'update' && item) {
              setter(prev => prev.map(i => i.id === id ? { ...i, ...item } : i));
            } else if (action === 'delete' && id) {
              setter(prev => prev.filter(i => i.id !== id));
            }
          };

          const setterMap: Record<string, React.Dispatch<React.SetStateAction<any[]>>> = {
            clients: setClients,
            suppliers: setSuppliers,
            employees: setEmployees,
            transactions: setTransactions,
            sales: setSales,
            budgets: setBudgets,
            purchase_orders: setPurchaseOrders,
            fleet: setFleet,
            inventory: setInventory,
            stock_movements: setStockMovements,
            payroll: setPayroll,
            time_logs: setTimeLogs,
            vacations: setVacations,
            salary_advances: setSalaryAdvances,
            tires: setTires,
            production_orders: setProductionOrders,
            production_formulas: setFormulas,
            production_units: setProductionUnits,
            users: setUsers,
            app_roles: setRoles,
            audit_logs: setAuditLogs,
            financial_accounts: setAccounts
          };

          if (table === 'settings' && item) {
            setSettings(item);
          } else if (setterMap[table]) {
            applyToSetter(setterMap[table]);
          }
          break;
        }

        case 'STOCK_MUTATION': {
          const { itemId, quantityDelta, movement } = msg.payload || {};
          if (itemId && typeof quantityDelta === 'number') {
            setInventory(prev => prev.map(item => item.id === itemId ? { ...item, quantity: item.quantity + quantityDelta } : item));
          }
          if (movement) {
            setStockMovements(prev => prev.some(m => m.id === movement.id) ? prev : [movement, ...prev]);
          }
          break;
        }

        case 'SALE_INVOICED': {
          const { sale, transactions: newTxs, stockUpdates } = msg.payload || {};
          if (sale) {
            setSales(prev => prev.some(s => s.id === sale.id) ? prev : [sale, ...prev]);
          }
          if (Array.isArray(newTxs) && newTxs.length > 0) {
            setTransactions(prev => {
              const existingIds = new Set(prev.map(t => t.id));
              const uniqueNew = newTxs.filter(t => !existingIds.has(t.id));
              return [...uniqueNew, ...prev];
            });
          }
          if (Array.isArray(stockUpdates) && stockUpdates.length > 0) {
            setInventory(prev => {
              const deltaMap = new Map(stockUpdates.map(u => [u.itemId, u.quantityDelta]));
              return prev.map(item => {
                const delta = deltaMap.get(item.id);
                return delta !== undefined ? { ...item, quantity: item.quantity + (delta as number) } : item;
              });
            });
          }
          break;
        }

        case 'PO_RECEIVED': {
          const { order, transaction, stockUpdates } = msg.payload || {};
          if (order) {
            setPurchaseOrders(prev => prev.map(o => o.id === order.id ? order : o));
          }
          if (transaction) {
            setTransactions(prev => prev.some(t => t.id === transaction.id) ? prev : [transaction, ...prev]);
          }
          if (Array.isArray(stockUpdates) && stockUpdates.length > 0) {
            setInventory(prev => {
              const deltaMap = new Map(stockUpdates.map(u => [u.itemId, u.quantityDelta]));
              return prev.map(item => {
                const delta = deltaMap.get(item.id);
                return delta !== undefined ? { ...item, quantity: item.quantity + (delta as number) } : item;
              });
            });
          }
          break;
        }

        case 'AUTH_SYNC': {
          const { user } = msg.payload || {};
          setCurrentUser(user || null);
          break;
        }

        case 'FULL_SYNC': {
          try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
              const parsed = JSON.parse(raw);
              if (parsed.sales) setSales(parsed.sales);
              if (parsed.transactions) setTransactions(parsed.transactions);
              if (parsed.inventory) setInventory(parsed.inventory);
              if (parsed.stockMovements) setStockMovements(parsed.stockMovements);
              if (parsed.fleet) setFleet(parsed.fleet);
              if (parsed.clients) setClients(parsed.clients);
              if (parsed.suppliers) setSuppliers(parsed.suppliers);
              if (parsed.employees) setEmployees(parsed.employees);
              if (parsed.purchaseOrders) setPurchaseOrders(parsed.purchaseOrders);
              if (parsed.accounts) setAccounts(parsed.accounts);
            }
          } catch {}
          break;
        }
      }
    };

    let bc: BroadcastChannel | null = null;
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        bc = new BroadcastChannel(CROSS_TAB_CHANNEL_NAME);
        bc.onmessage = (event) => handleMessage(event.data);
      } catch {}
    }

    const onStorage = (event: StorageEvent) => {
      if (event.key === 'infracore_cross_tab_event' && event.newValue) {
        try {
          const data = JSON.parse(event.newValue);
          handleMessage(data);
        } catch {}
      } else if (event.key === 'infracore_current_user') {
        try {
          const user = event.newValue ? JSON.parse(event.newValue) : null;
          setCurrentUser(user);
        } catch {}
      }
    };

    window.addEventListener('storage', onStorage);

    return () => {
      if (bc) bc.close();
      window.removeEventListener('storage', onStorage);
    };
  }, [TAB_INSTANCE_ID]);

  // Reactive Supabase Realtime Listener
  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    const channel = supabase.channel('infracore-erp-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public' }, (payload) => {
        const { eventType, table, new: newRow, old: oldRow } = payload;
        if (!table) return;

        const handleRealtimeTable = (setter: React.Dispatch<React.SetStateAction<any[]>>) => {
          if (eventType === 'INSERT' && newRow) {
            setter(prev => prev.some(item => item.id === (newRow as any).id) ? prev : [newRow as any, ...prev]);
          } else if (eventType === 'UPDATE' && newRow) {
            setter(prev => prev.map(item => item.id === (newRow as any).id ? { ...item, ...newRow } : item));
          } else if (eventType === 'DELETE' && oldRow) {
            setter(prev => prev.filter(item => item.id !== (oldRow as any).id));
          }
        };

        const rtMap: Record<string, React.Dispatch<React.SetStateAction<any[]>>> = {
          clients: setClients,
          suppliers: setSuppliers,
          employees: setEmployees,
          transactions: setTransactions,
          sales: setSales,
          budgets: setBudgets,
          purchase_orders: setPurchaseOrders,
          inventory: setInventory,
          stock_movements: setStockMovements,
          payroll: setPayroll,
          time_logs: setTimeLogs,
          vacations: setVacations,
          salary_advances: setSalaryAdvances,
          tires: setTires,
          production_orders: setProductionOrders,
          production_formulas: setFormulas,
          production_units: setProductionUnits,
          users: setUsers,
          app_roles: setRoles,
          audit_logs: setAuditLogs,
          financial_accounts: setAccounts
        };

        if (table === 'settings' && newRow) {
          setSettings(newRow as AppSettings);
        } else if (table === 'fleet') {
          if (eventType === 'INSERT' && newRow) {
            setFleet(prev => prev.some(v => v.id === (newRow as any).id) ? prev : [newRow as FleetVehicle, ...prev]);
          } else if (eventType === 'UPDATE' && newRow) {
            setFleet(prev => prev.map(v => v.id === (newRow as any).id ? { ...v, ...newRow } : v));
          } else if (eventType === 'DELETE' && oldRow) {
            setFleet(prev => prev.filter(v => v.id !== (oldRow as any).id));
          }
        } else if (table === 'maintenance_records') {
          if (eventType === 'INSERT' && newRow) {
            setFleet(prev => prev.map(v => v.id === (newRow as any).vehicleId ? { ...v, maintenanceHistory: [newRow as MaintenanceRecord, ...(v.maintenanceHistory || [])] } : v));
          }
        } else if (table === 'fuel_logs') {
          if (eventType === 'INSERT' && newRow) {
            setFleet(prev => prev.map(v => v.id === (newRow as any).vehicleId ? { ...v, fuelLogs: [newRow as FuelLog, ...(v.fuelLogs || [])] } : v));
          }
        } else if (rtMap[table]) {
          handleRealtimeTable(rtMap[table]);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const clearAllData = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    broadcastCrossTab({ type: 'FULL_SYNC' });
    window.location.reload();
  }, [broadcastCrossTab]);

  const addAuditLog = (logData: Omit<AuditLog, 'id' | 'timestamp'>) => {
    const newLog: AuditLog = {
      id: generateUUID(),
      timestamp: new Date().toLocaleString('pt-BR'),
      ...logData
    };
    syncAdd('audit_logs', newLog, setAuditLogs);
  };

  // Generic Synchronizer Helpers
  const syncAdd = async (table: string, item: any, setter: React.Dispatch<React.SetStateAction<any[]>>) => {
    const itemWithUUID = {
      ...item,
      id: isValidUUID(item?.id) ? item.id : (item?.id ? toDeterministicUUID(item.id) : generateUUID())
    };

    // Optimistic update
    setter(prev => [itemWithUUID, ...prev.filter(i => i.id !== itemWithUUID.id)]);

    // Broadcast mutation to other tabs
    broadcastCrossTab({
      type: 'MUTATION',
      table,
      action: 'add',
      id: itemWithUUID.id,
      item: itemWithUUID
    });

    if (isSupabaseConfigured()) {
      try {
        const saved = await api.createItem(table, itemWithUUID);
        if (saved && (saved as any).id) {
          setter(prev => prev.map(i => i.id === itemWithUUID.id ? { ...itemWithUUID, ...(saved as any) } : i));
          broadcastCrossTab({
            type: 'MUTATION',
            table,
            action: 'update',
            id: (saved as any).id,
            item: { ...itemWithUUID, ...(saved as any) }
          });
        }
      } catch (e) {
        console.error(`Sync add error for table ${table}:`, e);
      }
    }
  };

  const syncUpdate = async (table: string, id: string, item: any, setter: React.Dispatch<React.SetStateAction<any[]>>) => {
    setter(prev => prev.map(i => i.id === id ? { ...i, ...item } : i));

    // Broadcast mutation to other tabs
    broadcastCrossTab({
      type: 'MUTATION',
      table,
      action: 'update',
      id,
      item
    });

    if (isSupabaseConfigured()) {
      try {
        await api.updateItem(table, id, item);
      } catch (e) {
        console.error(`Sync update error for table ${table}:`, e);
      }
    }
  };

  const syncDelete = async (table: string, id: string, setter: React.Dispatch<React.SetStateAction<any[]>>) => {
    setter(prev => prev.filter(i => i.id !== id));

    // Broadcast mutation to other tabs
    broadcastCrossTab({
      type: 'MUTATION',
      table,
      action: 'delete',
      id
    });

    if (isSupabaseConfigured()) {
      try {
        await api.deleteItem(table, id);
      } catch (e) {
        console.error(`Sync delete error for table ${table}:`, e);
      }
    }
  };

  // Specific Entities
  const addClient = (client: Client) => syncAdd('clients', client, setClients);
  const updateClient = (client: Client) => syncUpdate('clients', client.id, client, setClients);
  const deleteClient = (id: string) => {
    const item = clients.find(c => c.id === id);
    syncDelete('clients', id, setClients);
    addAuditLog({
      userId: currentUser?.id || 'system',
      userName: currentUser?.name || 'Sistema',
      action: 'Exclusão de Cliente',
      module: 'Cadastros',
      details: `Cliente ${item?.name || id} foi removido.`,
      severity: 'warning'
    });
  };

  const addSupplier = (supplier: Supplier) => syncAdd('suppliers', supplier, setSuppliers);
  const updateSupplier = (supplier: Supplier) => syncUpdate('suppliers', supplier.id, supplier, setSuppliers);
  const deleteSupplier = (id: string) => {
    const item = suppliers.find(s => s.id === id);
    syncDelete('suppliers', id, setSuppliers);
    addAuditLog({
      userId: currentUser?.id || 'system',
      userName: currentUser?.name || 'Sistema',
      action: 'Exclusão de Fornecedor',
      module: 'Cadastros',
      details: `Fornecedor ${item?.name || id} foi removido.`,
      severity: 'warning'
    });
  };

  const addEmployee = (employee: Employee) => syncAdd('employees', employee, setEmployees);
  const updateEmployee = (employee: Employee) => syncUpdate('employees', employee.id, employee, setEmployees);
  const deleteEmployee = (id: string) => {
    const item = employees.find(e => e.id === id);
    syncDelete('employees', id, setEmployees);
    addAuditLog({
      userId: currentUser?.id || 'system',
      userName: currentUser?.name || 'Sistema',
      action: 'Exclusão de Colaborador',
      module: 'RH',
      details: `Colaborador ${item?.name || id} foi removido.`,
      severity: 'warning'
    });
  };

  const addUser = (user: User) => syncAdd('users', user, setUsers);
  const updateUser = (updated: User) => syncUpdate('users', updated.id, updated, setUsers);
  const deleteUser = (id: string) => {
    const item = users.find(u => u.id === id);
    syncDelete('users', id, setUsers);
    addAuditLog({
      userId: currentUser?.id || 'system',
      userName: currentUser?.name || 'Sistema',
      action: 'Exclusão de Usuário',
      module: 'Configurações',
      details: `Usuário ${item?.username || id} foi removido.`,
      severity: 'critical'
    });
  };

  const addRole = (role: AppRole) => syncAdd('app_roles', role, setRoles);
  const updateRole = (updated: AppRole) => syncUpdate('app_roles', updated.id, updated, setRoles);
  const deleteRole = (id: string) => {
    const item = roles.find(r => r.id === id);
    syncDelete('app_roles', id, setRoles);
    addAuditLog({
      userId: currentUser?.id || 'system',
      userName: currentUser?.name || 'Sistema',
      action: 'Exclusão de Perfil',
      module: 'Configurações',
      details: `Perfil ${item?.name || id} foi removido.`,
      severity: 'critical'
    });
  };

  const updateSettings = (updated: AppSettings) => {
    setSettings(updated);
    broadcastCrossTab({
      type: 'MUTATION',
      table: 'settings',
      action: 'update',
      id: 'settings',
      item: updated
    });
    if (isSupabaseConfigured()) api.updateSettings(updated);
  };

  // Inventory
  const addStockItem = (item: InventoryItem) => syncAdd('inventory', item, setInventory);
  const updateStockItem = (item: InventoryItem) => syncUpdate('inventory', item.id, item, setInventory);
  const deleteStockItem = (id: string) => {
    const item = inventory.find(i => i.id === id);
    syncDelete('inventory', id, setInventory);
    addAuditLog({
      userId: currentUser?.id || 'system',
      userName: currentUser?.name || 'Sistema',
      action: 'Exclusão de Item de Estoque',
      module: 'Estoque',
      details: `Item ${item?.name || id} foi excluído.`,
      severity: 'warning'
    });
  };

  const updateStock = (itemId: string, quantityDelta: number, reason: string = 'Ajuste Manual', documentId?: string) => {
    let movementToLog: StockMovement | null = null;
    let updatedItem: InventoryItem | null = null;

    setInventory(prev => prev.map(item => {
      if (item.id === itemId) {
        const newQty = item.quantity + quantityDelta;
        updatedItem = { ...item, quantity: newQty };

        const movement: StockMovement = {
          id: generateUUID(),
          itemId: item.id,
          itemName: item.name,
          type: quantityDelta >= 0 ? 'Entrada' : 'Saída',
          quantity: Math.abs(quantityDelta),
          date: new Date().toISOString(),
          reason: reason,
          documentId: documentId,
          userId: currentUser?.id ? (isValidUUID(currentUser.id) ? currentUser.id : toDeterministicUUID(currentUser.id)) : undefined,
          userName: currentUser?.name
        };
        movementToLog = movement;

        return updatedItem;
      }
      return item;
    }));

    if (movementToLog) {
      const mv = movementToLog as StockMovement;
      setStockMovements(prev => [mv, ...prev]);

      // Broadcast to other tabs
      broadcastCrossTab({
        type: 'STOCK_MUTATION',
        payload: { itemId, quantityDelta, movement: mv }
      });

      if (isSupabaseConfigured()) {
        if (updatedItem) {
          api.updateItem('inventory', itemId, { quantity: (updatedItem as InventoryItem).quantity }).catch(e => console.error('Error updating stock item in Supabase', e));
        }
        api.createItem('stock_movements', mv).catch(e => console.error('Error logging stock movement in Supabase', e));
      }
    }
  };

  // Payroll
  const addPayroll = (record: PayrollRecord) => syncAdd('payroll', record, setPayroll);
  const payPayroll = (id: string) => {
    const p = payroll.find(r => r.id === id);
    if (!p || p.status === 'Pago') return;

    const updated: PayrollRecord = {
      ...p,
      status: 'Pago' as const,
      paidAt: new Date().toLocaleDateString('pt-BR')
    };

    syncUpdate('payroll', id, updated, setPayroll);
  };

  // Time Tracking
  const addTimeLog = (log: TimeLog) => syncAdd('time_logs', log, setTimeLogs);

  // Vacations
  const addVacation = (vacation: Vacation) => {
    syncAdd('vacations', vacation, setVacations);
    if (vacation.status === 'Aprovado') {
      setEmployees(prev => prev.map(emp => {
        if (emp.id === vacation.employeeId) {
          const newDays = Math.max(0, (emp.vacationDaysAvailable || 30) - vacation.days);
          if (isSupabaseConfigured()) api.updateItem('employees', emp.id, { vacationDaysAvailable: newDays }).catch(() => {});
          return { ...emp, vacationDaysAvailable: newDays };
        }
        return emp;
      }));
    }
  };

  const updateVacationStatus = (id: string, status: Vacation['status'], approvedBy?: string) => {
    setVacations(prev => prev.map(vac => {
      if (vac.id === id) {
        const updated = { ...vac, status, approvedBy };
        if (isSupabaseConfigured()) api.updateItem('vacations', id, { status, approvedBy });

        if (status === 'Aprovado' && vac.status !== 'Aprovado') {
          setEmployees(emps => emps.map(emp => {
            if (emp.id === vac.employeeId) {
              const newDays = Math.max(0, (emp.vacationDaysAvailable || 30) - vac.days);
              if (isSupabaseConfigured()) api.updateItem('employees', emp.id, { vacationDaysAvailable: newDays }).catch(() => {});
              return { ...emp, vacationDaysAvailable: newDays };
            }
            return emp;
          }));
        }

        if (status === 'Rejeitado' && vac.status === 'Aprovado') {
          setEmployees(emps => emps.map(emp => {
            if (emp.id === vac.employeeId) {
              const newDays = (emp.vacationDaysAvailable || 0) + vac.days;
              if (isSupabaseConfigured()) api.updateItem('employees', emp.id, { vacationDaysAvailable: newDays }).catch(() => {});
              return { ...emp, vacationDaysAvailable: newDays };
            }
            return emp;
          }));
        }

        broadcastCrossTab({
          type: 'MUTATION',
          table: 'vacations',
          action: 'update',
          id,
          item: updated
        });

        return updated;
      }
      return vac;
    }));
  };

  const deleteVacation = (id: string) => {
    const vacation = vacations.find(v => v.id === id);
    if (vacation && vacation.status === 'Aprovado') {
      setEmployees(prev => prev.map(emp => {
        if (emp.id === vacation.employeeId) {
          const newDays = (emp.vacationDaysAvailable || 0) + vacation.days;
          if (isSupabaseConfigured()) api.updateItem('employees', emp.id, { vacationDaysAvailable: newDays }).catch(() => {});
          return { ...emp, vacationDaysAvailable: newDays };
        }
        return emp;
      }));
    }
    syncDelete('vacations', id, setVacations);
  };

  // Salary Advances
  const addSalaryAdvance = (advance: SalaryAdvance) => syncAdd('salary_advances', advance, setSalaryAdvances);

  const updateAdvanceStatus = (id: string, status: SalaryAdvance['status'], approvedBy?: string) => {
    setSalaryAdvances(prev => prev.map(adv => {
      if (adv.id === id) {
        const updated = { ...adv, status, approvedBy };
        if (isSupabaseConfigured()) api.updateItem('salary_advances', id, { status, approvedBy });
        broadcastCrossTab({
          type: 'MUTATION',
          table: 'salary_advances',
          action: 'update',
          id,
          item: updated
        });
        return updated;
      }
      return adv;
    }));
  };

  const paySalaryAdvance = (id: string) => {
    setSalaryAdvances(prev => prev.map(adv => {
      if (adv.id === id && adv.status === 'Aprovado') {
        const paidAt = new Date().toLocaleDateString('pt-BR');
        const updated = { ...adv, status: 'Pago' as const, paidAt };
        if (isSupabaseConfigured()) api.updateItem('salary_advances', id, { status: 'Pago', paidAt });
        broadcastCrossTab({
          type: 'MUTATION',
          table: 'salary_advances',
          action: 'update',
          id,
          item: updated
        });
        return updated;
      }
      return adv;
    }));
  };

  const deleteAdvance = (id: string) => syncDelete('salary_advances', id, setSalaryAdvances);

  // Transactions
  const updateTransactionStatus = (id: string, status: Transaction['status'], date?: string) => {
    setTransactions(prev => prev.map(t => {
      if (t.id === id) {
        const updateData: Partial<Transaction> = { status };
        if (date && status === 'Conciliado') {
          updateData.date = date;
        }

        if (isSupabaseConfigured()) {
          api.updateItem('transactions', id, updateData);
        }

        const updated = { ...t, ...updateData };
        broadcastCrossTab({
          type: 'MUTATION',
          table: 'transactions',
          action: 'update',
          id,
          item: updated
        });
        return updated;
      }
      return t;
    }));
  };

  const importTransactions = (_file: any) => {
    alert('Importação via arquivo não implementada com Supabase ainda.');
  };

  const addTransaction = (t: Transaction) => {
    if (transactions.some(existing => existing.id === t.id)) {
      console.warn(`Transaction ${t.id} already exists. Skipping.`);
      return;
    }
    syncAdd('transactions', t, setTransactions);
  };

  const updateTransaction = (t: Transaction) => {
    syncUpdate('transactions', t.id, t, setTransactions);
  };

  const deleteTransaction = (id: string) => syncDelete('transactions', id, setTransactions);

  // Sales (Faturamento)
  const addSale = (sale: Sale) => {
    const saleId = isValidUUID(sale.id) ? sale.id : toDeterministicUUID(sale.id);
    const saleWithUUID: Sale = {
      ...sale,
      id: saleId,
      clientId: sale.clientId ? (isValidUUID(sale.clientId) ? sale.clientId : toDeterministicUUID(sale.clientId)) : sale.clientId,
      accountId: sale.accountId ? (isValidUUID(sale.accountId) ? sale.accountId : toDeterministicUUID(sale.accountId)) : sale.accountId,
      vehicleId: sale.vehicleId ? (isValidUUID(sale.vehicleId) ? sale.vehicleId : toDeterministicUUID(sale.vehicleId)) : sale.vehicleId,
      documentNumber: sale.documentNumber || (sale.id && sale.id.startsWith('S-') ? sale.id.slice(2) : saleId.slice(0, 8))
    };

    if (sales.some(s => s.id === saleWithUUID.id)) return;

    // 1. Optimistic Add Sale
    setSales(prev => [saleWithUUID, ...prev]);

    // 2. Financial Transactions
    const numInstallments = sale.installments && sale.installments > 1 ? sale.installments : 1;
    const parseDate = (dateStr: string) => {
      if (!dateStr) return new Date();
      const parts = dateStr.split('/');
      if (parts.length === 3) {
        return new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
      }
      return new Date(dateStr);
    };

    const addDays = (date: Date, days: number) => {
      const result = new Date(date);
      result.setDate(result.getDate() + days);
      return result.toLocaleDateString('pt-BR');
    };

    const txsToCreate: Transaction[] = [];

    if (numInstallments > 1) {
      const baseDate = parseDate(sale.date);
      const installmentValue = Number((sale.amount / numInstallments).toFixed(2));

      for (let i = 1; i <= numInstallments; i++) {
        let dueDate = addDays(baseDate, i * 30);
        if (sale.installmentDueDates && sale.installmentDueDates[i - 1]) {
          const parts = sale.installmentDueDates[i - 1].split('-');
          if (parts.length === 3) {
            dueDate = `${parts[2]}/${parts[1]}/${parts[0]}`;
          } else {
            dueDate = sale.installmentDueDates[i - 1];
          }
        }

        const installmentTx: Transaction = {
          id: toDeterministicUUID(`${saleWithUUID.id}-inst-${i}`),
          date: saleWithUUID.date,
          dueDate: dueDate,
          description: `${saleWithUUID.description} (${i}/${numInstallments})`,
          category: saleWithUUID.category || 'Vendas',
          accountId: saleWithUUID.accountId,
          account: saleWithUUID.account || 'Caixa Geral',
          amount: installmentValue,
          status: 'Pendente',
          type: 'Receita',
          originModule: 'Vendas',
          originId: saleWithUUID.id,
          documentNumber: `${saleWithUUID.documentNumber}-${i}/${numInstallments}`,
          partnerId: saleWithUUID.clientId,
          partnerName: saleWithUUID.clientName,
          ledgerCode: saleWithUUID.ledgerCode || '1.01.01',
          ledgerName: saleWithUUID.ledgerName || 'Receita de Vendas'
        };
        txsToCreate.push(installmentTx);
      }
    } else {
      const singleTx: Transaction = {
        id: toDeterministicUUID(`${saleWithUUID.id}-tx`),
        date: saleWithUUID.date,
        dueDate: saleWithUUID.dueDate || saleWithUUID.date,
        description: saleWithUUID.description,
        category: saleWithUUID.category || 'Vendas',
        accountId: saleWithUUID.accountId,
        account: saleWithUUID.account || 'Caixa Geral',
        amount: saleWithUUID.amount,
        status: saleWithUUID.status || 'Pendente',
        type: 'Receita',
        originModule: 'Vendas',
        originId: saleWithUUID.id,
        documentNumber: saleWithUUID.documentNumber,
        partnerId: saleWithUUID.clientId,
        partnerName: saleWithUUID.clientName,
        ledgerCode: saleWithUUID.ledgerCode || '1.01.01',
        ledgerName: saleWithUUID.ledgerName || 'Receita de Vendas'
      };
      txsToCreate.push(singleTx);
    }

    setTransactions(prev => [...txsToCreate, ...prev]);

    // 3. Update stock for sold items
    const stockUpdates: Array<{ itemId: string, quantityDelta: number }> = [];
    if (Array.isArray(saleWithUUID.items)) {
      saleWithUUID.items.forEach(item => {
        const delta = -Number(item.quantity);
        stockUpdates.push({ itemId: item.id, quantityDelta: delta });
        updateStock(item.id, delta, `Venda #${saleWithUUID.documentNumber || saleWithUUID.id.slice(0, 8)}`, saleWithUUID.id);
      });
    }

    // 4. Broadcast all changes in one comprehensive payload so other tabs update reactively
    broadcastCrossTab({
      type: 'SALE_INVOICED',
      payload: {
        sale: saleWithUUID,
        transactions: txsToCreate,
        stockUpdates
      }
    });

    // 5. Sync to Supabase
    if (isSupabaseConfigured()) {
      api.createItem('sales', saleWithUUID).catch(e => console.error('Error saving sale to Supabase', e));
      for (const tx of txsToCreate) {
        api.createItem('transactions', tx).catch(e => console.error('Error saving sale transaction to Supabase', e));
      }
    }
  };

  // Budgets
  const addBudget = (budget: Budget) => syncAdd('budgets', budget, setBudgets);
  const updateBudget = (budget: Budget) => syncUpdate('budgets', budget.id, budget, setBudgets);
  const updateBudgetStatus = (id: string, status: Budget['status']) => {
    setBudgets(prev => prev.map(b => {
      if (b.id === id) {
        const updated = { ...b, status };
        if (isSupabaseConfigured()) api.updateItem('budgets', id, { status });
        broadcastCrossTab({
          type: 'MUTATION',
          table: 'budgets',
          action: 'update',
          id,
          item: updated
        });
        return updated;
      }
      return b;
    }));
  };

  // Purchases (Suprimentos)
  const addPurchaseOrder = (order: PurchaseOrder) => {
    if (purchaseOrders.some(p => p.id === order.id)) return;

    const orderWithLedger = {
      ...order,
      ledgerCode: order.ledgerCode || '2.02.03',
      ledgerName: order.ledgerName || 'Material de Consumo'
    };
    syncAdd('purchase_orders', orderWithLedger, setPurchaseOrders);

    if (order.status === 'Recebido') {
      const expenseId = toDeterministicUUID(`exp-${order.id}`);
      const expense: Transaction = {
        id: expenseId,
        date: order.date,
        dueDate: order.date,
        description: `Compra: ${order.supplierName}`,
        category: 'Insumos',
        amount: order.total,
        account: order.targetAccountId ? (accounts.find(a => a.id === order.targetAccountId)?.name || 'Caixa Geral') : 'Caixa Geral',
        accountId: order.targetAccountId ? (isValidUUID(order.targetAccountId) ? order.targetAccountId : toDeterministicUUID(order.targetAccountId)) : '',
        type: 'Despesa',
        status: 'Pendente',
        originModule: 'Compras',
        originId: order.id ? (isValidUUID(order.id) ? order.id : toDeterministicUUID(order.id)) : undefined,
        ledgerCode: '2.02.03',
        ledgerName: 'Material de Consumo'
      };
      addTransaction(expense);
      if (Array.isArray(order.items)) {
        order.items.forEach(item => updateStock(item.id, Number(item.quantity), `Compra PO #${order.id.slice(0, 8)}`, order.id));
      }
    }
  };

  const updatePurchaseOrder = (order: PurchaseOrder) => syncUpdate('purchase_orders', order.id, order, setPurchaseOrders);

  const receivePurchaseOrder = (id: string) => {
    let orderToUpdate: PurchaseOrder | null = null;
    let expenseTx: Transaction | null = null;
    const stockUpdates: Array<{ itemId: string, quantityDelta: number }> = [];

    setPurchaseOrders(prev => prev.map(order => {
      if (order.id === id && order.status !== 'Recebido') {
        const receivedDate = new Date().toLocaleDateString('pt-BR');
        const updated: PurchaseOrder = {
          ...order,
          status: 'Recebido' as const,
          receivedAt: receivedDate,
          ledgerCode: order.ledgerCode || '2.02.03',
          ledgerName: order.ledgerName || 'Material de Consumo'
        };
        orderToUpdate = updated;

        const targetAccountId = order.targetAccountId || order.accountId || 'acc-1';
        const targetAccount = accounts.find(a => a.id === targetAccountId);
        const expenseId = toDeterministicUUID(`exp-${order.id}`);

        expenseTx = {
          id: expenseId,
          date: receivedDate,
          dueDate: receivedDate,
          description: `Compra PO #${order.id.slice(0, 8)}: ${order.supplierName}`,
          category: 'Insumos',
          amount: order.total,
          account: targetAccount?.name || 'Caixa Geral',
          accountId: targetAccount?.id ? (isValidUUID(targetAccount.id) ? targetAccount.id : toDeterministicUUID(targetAccount.id)) : toDeterministicUUID(targetAccountId),
          type: 'Despesa',
          status: 'Pendente',
          originModule: 'Compras',
          originId: order.id ? (isValidUUID(order.id) ? order.id : toDeterministicUUID(order.id)) : undefined,
          ledgerCode: '2.02.03',
          ledgerName: 'Material de Consumo'
        };

        return updated;
      }
      return order;
    }));

    if (orderToUpdate) {
      const ord = orderToUpdate as PurchaseOrder;

      if (expenseTx) {
        const tx = expenseTx as Transaction;
        setTransactions(prev => prev.some(t => t.id === tx.id) ? prev : [tx, ...prev]);
        if (isSupabaseConfigured()) {
          api.createItem('transactions', tx).catch(e => console.error('Error saving PO transaction to Supabase', e));
        }
      }

      if (Array.isArray(ord.items)) {
        ord.items.forEach(item => {
          const qty = Number(item.quantity);
          stockUpdates.push({ itemId: item.id, quantityDelta: qty });
          updateStock(item.id, qty, `Entrada PO #${ord.id.slice(0, 8)}`, ord.id);

          // Update weighted average cost (Custo Médio Ponderado)
          setInventory(prev => prev.map(invItem => {
            if (invItem.id === item.id) {
              const prevQty = Math.max(0, invItem.quantity - qty);
              const prevCost = invItem.costPrice || invItem.price || 0;
              const newUnitPrice = item.price || prevCost;
              const totalCost = (prevQty * prevCost) + (qty * newUnitPrice);
              const totalQty = prevQty + qty;
              const weightedCost = totalQty > 0 ? Number((totalCost / totalQty).toFixed(2)) : newUnitPrice;
              const updatedInv = { ...invItem, costPrice: weightedCost };
              if (isSupabaseConfigured()) {
                api.updateItem('inventory', invItem.id, { costPrice: weightedCost }).catch(() => {});
              }
              return updatedInv;
            }
            return invItem;
          }));
        });
      }

      if (isSupabaseConfigured()) {
        api.updateItem('purchase_orders', ord.id, ord).catch(e => console.error('Error updating PO in Supabase', e));
      }

      broadcastCrossTab({
        type: 'PO_RECEIVED',
        payload: {
          order: ord,
          transaction: expenseTx,
          stockUpdates
        }
      });
    }
  };

  // Fleet
  const addVehicle = (vehicle: FleetVehicle) => syncAdd('fleet', vehicle, setFleet);
  const updateVehicle = (updatedVehicle: FleetVehicle) => syncUpdate('fleet', updatedVehicle.id, updatedVehicle, setFleet);
  const updateVehicleStatus = (id: string, status: FleetVehicle['status']) => {
    setFleet(prev => prev.map(v => {
      if (v.id === id) {
        const updated = { ...v, status };
        if (isSupabaseConfigured()) api.updateItem('fleet', id, { status });
        broadcastCrossTab({
          type: 'MUTATION',
          table: 'fleet',
          action: 'update',
          id,
          item: updated
        });
        return updated;
      }
      return v;
    }));
  };
  const deleteVehicle = (id: string) => {
    const v = fleet.find(item => item.id === id);
    syncDelete('fleet', id, setFleet);
    addAuditLog({
      userId: currentUser?.id || 'system',
      userName: currentUser?.name || 'Sistema',
      action: 'Exclusão de Veículo',
      module: 'Frota',
      details: `Veículo ${v?.plate || id} (${v?.name || ''}) removido.`,
      severity: 'warning'
    });
  };

  const addMaintenanceRecord = (vehicleId: string, record: MaintenanceRecord) => {
    const vehicle = fleet.find(v => v.id === vehicleId);
    if (!vehicle) return;

    const recordId = isValidUUID(record.id) ? record.id : toDeterministicUUID(record.id);
    const ledgerCode = record.ledgerCode || '2.02.02';
    const ledgerName = record.ledgerName || 'Manutenção de Frota';

    const recordWithLedger: MaintenanceRecord = {
      ...record,
      id: recordId,
      vehicleId,
      ledgerCode,
      ledgerName
    };

    const debitAccount = accounts.find(a => a.id === record.debitAccountId);
    const expenseTxId = toDeterministicUUID(`maint-${recordId}`);
    const expense: Transaction = {
      id: expenseTxId,
      date: record.date,
      dueDate: record.date,
      description: `Manutenção: ${vehicle.plate} - ${record.description}`,
      category: 'Manutenção',
      account: debitAccount?.name || 'Caixa Geral',
      accountId: debitAccount?.id ? (isValidUUID(debitAccount.id) ? debitAccount.id : toDeterministicUUID(debitAccount.id)) : (record.debitAccountId ? toDeterministicUUID(record.debitAccountId) : ''),
      amount: record.cost,
      status: 'Conciliado',
      type: 'Despesa',
      originModule: 'Frota',
      originId: vehicleId ? (isValidUUID(vehicleId) ? vehicleId : toDeterministicUUID(vehicleId)) : undefined,
      ledgerCode,
      ledgerName
    };

    addTransaction(expense);

    if (record.productId && record.productQuantity) {
      updateStock(record.productId, -record.productQuantity, `Manutenção Veículo ${vehicle.plate}`, recordId);
    }

    const newKm = Math.max(vehicle.km || 0, record.km || 0);

    setFleet(prev => prev.map(v => {
      if (v.id === vehicleId) {
        return {
          ...v,
          maintenanceHistory: [recordWithLedger, ...(v.maintenanceHistory || [])],
          km: newKm,
          lastMaintenance: record.date
        };
      }
      return v;
    }));

    broadcastCrossTab({
      type: 'MUTATION',
      table: 'fleet',
      action: 'update',
      id: vehicleId,
      item: { km: newKm, lastMaintenance: record.date }
    });

    if (isSupabaseConfigured()) {
      api.createItem('maintenance_records', recordWithLedger).catch(e => console.error('Error saving maintenance record to Supabase', e));
      api.updateItem('fleet', vehicleId, { km: newKm, lastMaintenance: record.date }).catch(e => console.error('Error updating fleet km in Supabase', e));
    }
  };

  const deleteMaintenanceRecord = (vehicleId: string, recordId: string) => {
    const vehicle = fleet.find(v => v.id === vehicleId);
    if (!vehicle) return;

    const recordToDelete = vehicle.maintenanceHistory?.find(r => r.id === recordId);
    if (recordToDelete) {
      if (recordToDelete.productId && recordToDelete.productQuantity) {
        updateStock(recordToDelete.productId, recordToDelete.productQuantity, `Estorno Manutenção Veículo ${vehicle.plate}`, recordId);
      }
      const expenseTxId = toDeterministicUUID(`maint-${recordId}`);
      deleteTransaction(expenseTxId);
    }

    setFleet(prev => prev.map(v => {
      if (v.id === vehicleId) {
        return {
          ...v,
          maintenanceHistory: v.maintenanceHistory?.filter(r => r.id !== recordId) || []
        };
      }
      return v;
    }));

    if (isSupabaseConfigured()) {
      api.deleteItem('maintenance_records', recordId).catch(e => console.error('Error deleting maintenance record in Supabase', e));
    }
  };

  const addFuelLog = (vehicleId: string, log: FuelLog) => {
    const vehicle = fleet.find(v => v.id === vehicleId);
    if (!vehicle) return;

    const logId = isValidUUID(log.id) ? log.id : toDeterministicUUID(log.id);
    const ledgerCode = log.ledgerCode || '2.02.01';
    const ledgerName = log.ledgerName || 'Combustível';

    const logWithLedger: FuelLog = {
      ...log,
      id: logId,
      vehicleId,
      ledgerCode,
      ledgerName
    };

    const expenseTxId = toDeterministicUUID(`fuel-${logId}`);
    const expense: Transaction = {
      id: expenseTxId,
      date: log.date,
      dueDate: log.date,
      description: `Abastecimento: ${vehicle.plate} - ${log.liters}L`,
      category: 'Combustível',
      account: 'Caixa Geral',
      accountId: '',
      amount: log.cost,
      status: 'Conciliado',
      type: 'Despesa',
      originModule: 'Frota',
      originId: vehicleId ? (isValidUUID(vehicleId) ? vehicleId : toDeterministicUUID(vehicleId)) : undefined,
      ledgerCode,
      ledgerName
    };

    addTransaction(expense);

    const newKm = Math.max(vehicle.km || 0, log.km || 0);

    setFleet(prev => prev.map(v => {
      if (v.id === vehicleId) {
        return {
          ...v,
          fuelLogs: [logWithLedger, ...(v.fuelLogs || [])],
          km: newKm
        };
      }
      return v;
    }));

    broadcastCrossTab({
      type: 'MUTATION',
      table: 'fleet',
      action: 'update',
      id: vehicleId,
      item: { km: newKm }
    });

    if (isSupabaseConfigured()) {
      api.createItem('fuel_logs', logWithLedger).catch(e => console.error('Error saving fuel log to Supabase', e));
      api.updateItem('fleet', vehicleId, { km: newKm }).catch(e => console.error('Error updating fleet km in Supabase', e));
    }
  };

  const deleteFuelLog = (vehicleId: string, logId: string) => {
    const expenseTxId = toDeterministicUUID(`fuel-${logId}`);
    deleteTransaction(expenseTxId);

    setFleet(prev => prev.map(v => {
      if (v.id === vehicleId) {
        return {
          ...v,
          fuelLogs: v.fuelLogs?.filter(l => l.id !== logId) || []
        };
      }
      return v;
    }));

    if (isSupabaseConfigured()) {
      api.deleteItem('fuel_logs', logId).catch(e => console.error('Error deleting fuel log in Supabase', e));
    }
  };

  // Tires
  const addTire = (tire: Tire) => syncAdd('tires', tire, setTires);
  const updateTire = (updatedTire: Tire) => syncUpdate('tires', updatedTire.id, updatedTire, setTires);
  const deleteTire = (id: string) => {
    const t = tires.find(item => item.id === id);
    syncDelete('tires', id, setTires);
    addAuditLog({
      userId: currentUser?.id || 'system',
      userName: currentUser?.name || 'Sistema',
      action: 'Exclusão de Pneu',
      module: 'Frota',
      details: `Pneu ${t?.serialNumber || id} (${t?.brand || ''}) removido.`,
      severity: 'warning'
    });
  };

  const addTireHistory = (tireId: string, entry: TireHistory) => {
    const entryId = isValidUUID(entry.id) ? entry.id : toDeterministicUUID(entry.id);
    const entryWithId: TireHistory = { ...entry, id: entryId };

    setTires(prev => prev.map(t => {
      if (t.id === tireId) {
        const updated = {
          ...t,
          history: [entryWithId, ...(t.history || [])],
          currentKm: Math.max(t.currentKm || 0, entry.km || 0)
        };

        if (entry.type === 'Retirada') {
          updated.status = 'Estoque';
          updated.currentVehicleId = undefined;
          updated.position = undefined;
        } else if (entry.type === 'Instalação' || entry.type === 'Rodízio') {
          updated.status = 'Em uso';
          updated.currentVehicleId = entry.vehicleId;
          updated.position = entry.position;
          if (entry.type === 'Instalação') updated.installKm = entry.km;
        } else if (entry.type === 'Recapagem') {
          updated.status = 'Novo';
          updated.recapCount = (updated.recapCount || 0) + 1;
        }

        if (isSupabaseConfigured()) {
          api.updateItem('tires', tireId, updated);
          api.createItem('tire_history', { ...entryWithId, tireId });
        }

        broadcastCrossTab({
          type: 'MUTATION',
          table: 'tires',
          action: 'update',
          id: tireId,
          item: updated
        });

        return updated;
      }
      return t;
    }));
  };

  const deleteTireHistory = (tireId: string, historyId: string) => {
    setTires(prev => prev.map(t => {
      if (t.id === tireId) {
        const updatedHistory = (t.history || []).filter(h => h.id !== historyId);
        const updated = { ...t, history: updatedHistory };
        if (isSupabaseConfigured()) {
          api.updateItem('tires', tireId, { history: updatedHistory });
          api.deleteItem('tire_history', historyId);
        }
        broadcastCrossTab({
          type: 'MUTATION',
          table: 'tires',
          action: 'update',
          id: tireId,
          item: updated
        });
        return updated;
      }
      return t;
    }));
  };

  // Production
  const addProductionOrder = (order: ProductionOrder) => syncAdd('production_orders', order, setProductionOrders);
  const updateProductionOrder = (order: ProductionOrder) => syncUpdate('production_orders', order.id, order, setProductionOrders);
  const deleteProductionOrder = (id: string) => {
    const o = productionOrders.find(item => item.id === id);
    syncDelete('production_orders', id, setProductionOrders);
    addAuditLog({
      userId: currentUser?.id || 'system',
      userName: currentUser?.name || 'Sistema',
      action: 'Exclusão de Ordem de Produção',
      module: 'Produção',
      details: `OP #${o?.orderNumber || id} removida.`,
      severity: 'warning'
    });
  };

  const addFormula = (formula: ProductionFormula) => syncAdd('production_formulas', formula, setFormulas);
  const updateFormula = (formula: ProductionFormula) => syncUpdate('production_formulas', formula.id, formula, setFormulas);
  const deleteFormula = (id: string) => syncDelete('production_formulas', id, setFormulas);

  const addProductionUnit = (unit: ProductionUnit) => syncAdd('production_units', unit, setProductionUnits);
  const updateProductionUnit = (unit: ProductionUnit) => syncUpdate('production_units', unit.id, unit, setProductionUnits);
  const deleteProductionUnit = (id: string) => syncDelete('production_units', id, setProductionUnits);

  const startProduction = (id: string) => {
    let orderToUpdate: ProductionOrder | null = null;
    const stockDeductions: Array<{ productId: string, qty: number }> = [];

    setProductionOrders(prev => prev.map(o => {
      if (o.id === id) {
        const updated = { ...o, status: 'Em Produção' as const, progress: 10 };
        orderToUpdate = updated;

        if (!o.rawMaterialsDeducted) {
          const formula = formulas.find(f => f.id === o.formulaId);
          if (formula) {
            if (formula.type === 'Britagem') {
              const input = formula.ingredients?.[0];
              if (input && input.productId) {
                stockDeductions.push({ productId: input.productId, qty: o.quantity });
              }
            } else if (Array.isArray(formula.ingredients)) {
              formula.ingredients.forEach(ing => {
                if (ing.productId) {
                  stockDeductions.push({ productId: ing.productId, qty: ing.qty * o.quantity });
                }
              });
            }
            updated.rawMaterialsDeducted = true;
          }
        }
        return updated;
      }
      return o;
    }));

    if (orderToUpdate) {
      const ord = orderToUpdate as ProductionOrder;
      stockDeductions.forEach(d => {
        updateStock(d.productId, -d.qty, `Produção OP #${ord.orderNumber || ord.id.slice(0, 8)}`, ord.id);
      });

      if (isSupabaseConfigured()) {
        api.updateItem('production_orders', id, { status: 'Em Produção', progress: 10, rawMaterialsDeducted: ord.rawMaterialsDeducted }).catch(() => {});
      }

      broadcastCrossTab({
        type: 'MUTATION',
        table: 'production_orders',
        action: 'update',
        id,
        item: ord
      });
    }
  };

  const completeProduction = (id: string) => {
    let orderToUpdate: ProductionOrder | null = null;
    const stockAdditions: Array<{ productId: string, qty: number }> = [];

    setProductionOrders(prev => prev.map(o => {
      if (o.id === id) {
        const updated = { ...o, status: 'Finalizado' as const, progress: 100 };
        orderToUpdate = updated;

        const formula = formulas.find(f => f.id === o.formulaId);
        if (formula?.type === 'Britagem') {
          if (Array.isArray(formula.outputs)) {
            formula.outputs.forEach(out => {
              if (out.productId) {
                const yieldQty = o.quantity * (out.percentage / 100);
                stockAdditions.push({ productId: out.productId, qty: yieldQty });
              }
            });
          }
        } else if (o.productId) {
          stockAdditions.push({ productId: o.productId, qty: o.quantity });
        }
        return updated;
      }
      return o;
    }));

    if (orderToUpdate) {
      const ord = orderToUpdate as ProductionOrder;
      stockAdditions.forEach(a => {
        updateStock(a.productId, a.qty, `Produção Concluída OP #${ord.orderNumber || ord.id.slice(0, 8)}`, ord.id);
      });

      if (isSupabaseConfigured()) {
        api.updateItem('production_orders', id, { status: 'Finalizado', progress: 100 }).catch(() => {});
      }

      broadcastCrossTab({
        type: 'MUTATION',
        table: 'production_orders',
        action: 'update',
        id,
        item: ord
      });
    }
  };

  const addQualityTest = (orderId: string, test: QualityTest) => {
    setProductionOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        const updatedTests = [test, ...(o.qualityTests || [])];
        if (isSupabaseConfigured()) api.updateItem('production_orders', orderId, { qualityTests: updatedTests });
        broadcastCrossTab({
          type: 'MUTATION',
          table: 'production_orders',
          action: 'update',
          id: orderId,
          item: { qualityTests: updatedTests }
        });
        return { ...o, qualityTests: updatedTests };
      }
      return o;
    }));
  };

  // Financial Accounts and Plan of Accounts
  const addAccount = (acc: any) => syncAdd('financial_accounts', acc, setAccounts);
  const deleteAccount = (id: string) => {
    const acc = accounts.find(a => a.id === id);
    syncDelete('financial_accounts', id, setAccounts);
    addAuditLog({
      userId: currentUser?.id || 'system',
      userName: currentUser?.name || 'Sistema',
      action: 'Exclusão de Conta Financeira',
      module: 'Financeiro',
      details: `Conta ${acc?.name || id} foi removida.`,
      severity: 'warning'
    });
  };

  const addPlanAccount = (parentId: string | null, name: string, type: 'Receita' | 'Despesa' = 'Despesa') => {
    setPlanOfAccounts(prev => {
      let updatedState: any[];
      if (!parentId) {
        const newId = generateUUID();
        const nextCode = (prev.length + 1).toString() + ".01";
        updatedState = [...prev, {
          id: newId,
          code: nextCode,
          name,
          type,
          children: []
        }];
      } else {
        updatedState = prev.map(group => {
          if (group.id === parentId) {
            return {
              ...group,
              children: [...(group.children || []), {
                id: generateUUID(),
                code: `${group.code}.${(group.children?.length || 0) + 1}`,
                name,
                type: group.type
              }]
            };
          }
          return group;
        });
      }

      broadcastCrossTab({
        type: 'FULL_SYNC'
      });
      return updatedState;
    });
  };

  const deletePlanAccount = (id: string, parentId?: string | null) => {
    setPlanOfAccounts(prev => {
      let updatedState: any[];
      if (!parentId) {
        updatedState = prev.filter(g => g.id !== id);
      } else {
        updatedState = prev.map(group => {
          if (group.id === parentId) {
            return { ...group, children: group.children?.filter((c: any) => c.id !== id) };
          }
          return group;
        });
      }

      broadcastCrossTab({
        type: 'FULL_SYNC'
      });
      return updatedState;
    });

    addAuditLog({
      userId: currentUser?.id || 'system',
      userName: currentUser?.name || 'Sistema',
      action: 'Exclusão de Categoria no Plano de Contas',
      module: 'Financeiro',
      details: `Categoria de conta ID ${id} foi removida.`,
      severity: 'warning'
    });
  };

  const updatePlanAccount = (id: string, name: string, parentId?: string | null) => {
    setPlanOfAccounts(prev => {
      let updatedState: any[];
      if (!parentId) {
        updatedState = prev.map(g => g.id === id ? { ...g, name } : g);
      } else {
        updatedState = prev.map(group => {
          if (group.id === parentId) {
            return {
              ...group,
              children: group.children?.map((c: any) => c.id === id ? { ...c, name } : c)
            };
          }
          return group;
        });
      }

      broadcastCrossTab({
        type: 'FULL_SYNC'
      });
      return updatedState;
    });
  };

  // Dynamic Account Balance Calculation
  const calculatedAccounts = useMemo(() => {
    return accounts.map(acc => {
      const accTxs = transactions.filter(t =>
        t.status === 'Conciliado' &&
        (t.accountId === acc.id || t.account === acc.name)
      );

      const totalIncome = accTxs
        .filter(t => t.type === 'Receita')
        .reduce((sum, t) => sum + t.amount, 0);

      const totalExpense = accTxs
        .filter(t => t.type === 'Despesa')
        .reduce((sum, t) => sum + t.amount, 0);

      const startBalance = acc.initialBalance !== undefined ? acc.initialBalance : (acc.balance || 0);

      return {
        ...acc,
        balance: startBalance + totalIncome - totalExpense,
        initialBalance: startBalance
      };
    });
  }, [accounts, transactions]);

  // Financial Health & Dashboard Metrics (Real-Time Reactive)
  const financials = useMemo(() => {
    const realizedRevenue = transactions
      .filter(t => t.type === 'Receita' && t.status === 'Conciliado')
      .reduce((acc, curr) => acc + curr.amount, 0);

    const realizedExpenses = transactions
      .filter(t => t.type === 'Despesa' && t.status === 'Conciliado')
      .reduce((acc, curr) => acc + curr.amount, 0);

    const totalInitialBalance = accounts.reduce((sum, acc) => sum + (acc.initialBalance !== undefined ? acc.initialBalance : (acc.balance || 0)), 0);

    const projectedRevenue = transactions
      .filter(t => t.type === 'Receita' && t.status !== 'Cancelado')
      .reduce((acc, curr) => acc + curr.amount, 0);

    const projectedExpenses = transactions
      .filter(t => t.type === 'Despesa' && t.status !== 'Cancelado')
      .reduce((acc, curr) => acc + curr.amount, 0);

    return {
      totalRevenue: realizedRevenue,
      totalExpenses: realizedExpenses,
      balance: totalInitialBalance + realizedRevenue - realizedExpenses,
      projectedBalance: totalInitialBalance + projectedRevenue - projectedExpenses,
      receivables: projectedRevenue - realizedRevenue,
      payables: projectedExpenses - realizedExpenses,
      recentTransactions: transactions.slice(0, 10)
    };
  }, [transactions, accounts]);

  const seedDatabase = (data: any) => {
    if (data.settings) setSettings(data.settings);
    if (data.employees) setEmployees(data.employees);
    if (data.clients) setClients(data.clients);
    if (data.suppliers) setSuppliers(data.suppliers);
    if (data.inventory) setInventory(data.inventory);
    if (data.fleet) setFleet(data.fleet);
    if (data.transactions) setTransactions(data.transactions);
    if (data.sales) setSales(data.sales);
    if (data.budgets) setBudgets(data.budgets);
    if (data.purchaseOrders) setPurchaseOrders(data.purchaseOrders);
    if (data.stockMovements) setStockMovements(data.stockMovements);
    if (data.auditLogs) setAuditLogs(data.auditLogs);
    if (data.productionOrders) setProductionOrders(data.productionOrders);
    if (data.formulas) setFormulas(data.formulas);
    if (data.productionUnits) setProductionUnits(data.productionUnits);
  };

  return (
    <AppContext.Provider value={{
      clients, suppliers, employees, transactions, sales, budgets, purchaseOrders, fleet, inventory, payroll, timeLogs, vacations, salaryAdvances, tires,
      productionOrders, formulas, productionUnits, users, roles, settings, auditLogs, stockMovements,
      accounts: calculatedAccounts,
      planOfAccounts,
      currentUser, login, logout, hasPermission,
      addClient, updateClient, deleteClient,
      addSupplier, updateSupplier, deleteSupplier,
      addEmployee, updateEmployee, deleteEmployee,
      addPayroll, payPayroll, addTimeLog,
      addVacation, updateVacationStatus, deleteVacation,
      addSalaryAdvance, updateAdvanceStatus, paySalaryAdvance, deleteAdvance,
      addTransaction, updateTransaction, updateTransactionStatus, deleteTransaction, importTransactions, addSale, addBudget, updateBudget, updateBudgetStatus,
      addPurchaseOrder, updatePurchaseOrder, receivePurchaseOrder,
      addStockItem, updateStock, updateStockItem, deleteStockItem,
      addVehicle, updateVehicle, updateVehicleStatus, deleteVehicle,
      addMaintenanceRecord, deleteMaintenanceRecord, addFuelLog, deleteFuelLog,
      addTire, updateTire, deleteTire, addTireHistory, deleteTireHistory,
      addProductionOrder, updateProductionOrder, deleteProductionOrder,
      startProduction, completeProduction, addFormula, updateFormula, deleteFormula, addQualityTest,
      addProductionUnit, updateProductionUnit, deleteProductionUnit,
      addUser, updateUser, deleteUser, addRole, updateRole, deleteRole, updateSettings,
      addAccount, deleteAccount, addPlanAccount, deletePlanAccount, updatePlanAccount,
      clearAllData, addAuditLog, seedDatabase, financials
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};