export interface AppAttachment {
  id: string;
  name: string;
  type: string;
  date: string;
  size: string;
  url?: string;
}

export interface Address {
  street: string;
  number: string;
  complement?: string;
  district: string;
  neighborhood?: string;
  city: string;
  state: string; // UF
  zipCode: string; // CEP
}

export interface Client {
  id: string;
  name: string;
  document: string; // CPF/CNPJ
  email: string;
  phone: string;
  address?: Address; // Structured address
  contactPerson?: string;
  creditLimit?: number;
  paymentTerms?: string; // e.g., '30/60/90'
  status: 'Ativo' | 'Inativo';
  type: 'Matriz' | 'Filial' | 'Parceiro';
  registeredAt: string;
  initials: string;
  colorClass: string;
  attachments?: AppAttachment[];
}

export interface Supplier {
  id: string;
  name: string; // Razão Social
  tradeName?: string; // Nome Fantasia
  document: string; // CNPJ
  email: string;
  phone: string;
  address?: Address;
  contactPerson?: string;
  category: string; // e.g., 'Materiais', 'Serviços'
  bankInfo?: {
    bank: string;
    agency: string;
    account: string;
    pix?: string;
  };
  status: 'Ativo' | 'Inativo' | 'Bloqueado';
  registeredAt: string;
  initials: string;
  attachments?: AppAttachment[];
}

export interface Employee {
  id: string;
  name: string;
  role: string; // Cargo
  department: string;
  status: 'Ativo' | 'Férias' | 'Afastado' | 'Desligado';
  admissionDate: string;
  salary: number;
  email?: string;
  phone?: string;
  address?: Address;
  cpf?: string;
  photo?: string;
  vacationDaysAvailable?: number;
  cnh?: string;
  cnhCategory?: string;
  cnhExpiry?: string;
  costCenter?: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  description?: string;
  category: string;
  quantity: number;
  unit: string;
  price: number; // Selling Price
  costPrice?: number; // Cost Price for Margin Calc
  minStock: number;
  maxStock?: number;
  location?: string; // Prateleira/Bin
  barcode?: string; // EAN
  ncm?: string; // Fiscal
  weight?: number; // kg per unit (for scale integration)
  brand?: string;
  supplierId?: string;
  color?: string; // For UI
  unitCost?: number;
  lastPurchaseDate?: string;
  supplierName?: string;
}

export interface StockMovement {
  id: string;
  itemId: string;
  itemName: string;
  type: 'Entrada' | 'Saída' | 'Ajuste';
  quantity: number;
  date: string;
  reason: string;
  documentId?: string;
  userId?: string;
  userName?: string;
}

export interface Transaction {
  id: string;
  date: string;
  dueDate?: string; // Vencimento for Payables/Receivables
  description: string;
  category: string; // Plano de Contas Level 2
  accountId: string; // Financial Account ID (Banco, Caixa)
  account?: string; // Legacy/Display Name
  amount: number;
  status: 'Conciliado' | 'Pendente' | 'Vencido' | 'Cancelado';
  type: 'Receita' | 'Despesa';
  documentNumber?: string; // Invoice #
  partnerId?: string; // ClientID or SupplierID
  originModule?: 'Vendas' | 'Compras' | 'Frota' | 'RH' | 'Manual';
  originId?: string; // ID of Sale, PO, etc.
  ledgerCode?: string;
  ledgerName?: string;
  // Enhanced Details
  partnerName?: string; // Beneficiário / Pagador
  costCenter?: string;
  paymentMethod?: string;
  competenceDate?: string;
  notes?: string;
  // Cross-Domain & Reconciliation Extensions
  financialAccountId?: string;
  reconciliationDate?: string;
  settledAt?: string;
  tags?: string[];
}

export interface FinancialAccount {
  id: string;
  name: string;
  type: 'Corrente' | 'Poupança' | 'Investimento' | 'Espécie' | 'Cartão' | 'Outro' | string;
  balance: number;
  initialBalance?: number;
  initialBalanceDate?: string;
  color?: string;
  code?: string;
  bank?: string;
  bankCode?: string;
  bankName?: string;
  nickname?: string;
  agency?: string;
  agencyDigit?: string;
  accountNumber?: string;
  accountDigit?: string;
  creditLimit?: number;
  pixType?: string;
  pixKeyType?: string;
  pixKey?: string;
  isDefault?: boolean;
  status?: 'Ativo' | 'Inativo';
}

export interface PlanOfAccountNode {
  id: string;
  code: string;
  name: string;
  type?: 'Receita' | 'Despesa';
  parentId?: string | null;
  children?: PlanOfAccountNode[];
}

export interface SalesItem {
  id: string;
  name: string;
  detail: string;
  quantity: number;
  unit: string;
  price: number;
  // Conversion / Scale Support
  originalPrice?: number;
  originalUnit?: string;
  weight?: number; // Density or Unit Weight
}

export interface Sale extends Transaction {
  clientId: string;
  clientName: string;
  items: SalesItem[];
  paymentMethod?: string;
  installments?: number;
  installmentDueDates?: string[]; // Array of ISO date strings for each installment
  weightTicket?: string; // ID of scale ticket if used
  measuredWeight?: number; // Weight from scale

  // Dispatch / Logistics
  dispatchStatus?: 'Aguardando' | 'Em Pesagem' | 'Despachado' | 'Entregue';
  vehicleId?: string;
  driverName?: string;

  // Weighing Details
  tareWeight?: number; // Peso Entrada / Tara
  grossWeight?: number; // Peso Saída / Bruto
  netWeight?: number; // Peso Líquido
  weightNotes?: string;

  // Cross-Domain & Production Links
  productionOrderId?: string;
  costCenter?: string;
}

export interface PurchaseItem {
  id: string; // Product Link
  name: string;
  quantity: number;
  unit: string;
  price: number;
}

export interface PurchaseOrder {
  id: string;
  supplierId: string;
  supplierName: string;
  date: string;
  items: PurchaseItem[];
  subtotal: number;
  tax?: number;
  shippingCost?: number;
  total: number;
  status: 'Pendente' | 'Recebido' | 'Cancelado' | 'Aprovado';
  receivedAt?: string;
  paymentTerms?: string; // '30 dias', 'Avista'
  targetAccountId?: string; // Where money will come from (Previsão)
  attachments?: AppAttachment[];
  ledgerCode?: string;
  ledgerName?: string;
  accountId?: string;
  competenceDate?: string;
  costCenter?: string;
  department?: string;
}

export interface FuelLog {
  id: string;
  vehicleId: string;
  date: string;
  liters: number;
  cost: number; // Total Cost
  pricePerLiter: number;
  km: number;
  fuelType: 'Diesel' | 'Gasolina' | 'Etanol' | 'Arla 32';
  stationName?: string; // Posto
  invoiceNumber?: string; // Nota Fiscal
  financialAccountId?: string; // Source of Payment if cash/card
  isPaid: boolean;
  ledgerCode?: string;
  ledgerName?: string;
  attachments?: AppAttachment[];
}

export interface FleetVehicle {
  id: string;
  name: string; // Modelo/Nome do ativo (ex: "Volvo FH 540")
  plate: string;
  model?: string; // Modelo técnico (opcional, legado)
  brand?: string; // Marca (opcional)
  year?: number;
  type: 'Caminhão' | 'Carro' | 'Van' | 'Motocicleta' | 'Máquina' | 'Toco' | 'Truck' | 'Carreta LS' | 'Utilitário';
  status: 'Operacional' | 'Manutenção' | 'Em Rota' | 'Parado';
  fuelType?: 'Diesel' | 'Gasolina' | 'Etanol' | 'Flex' | 'Elétrico';
  fuelLevel?: number; // Nível de combustível (%)
  km: number;
  nextMaintenanceKm?: number;
  insuranceExpiry?: string;
  driverId?: string;
  chassis?: string;
  lastMaintenance?: string; // Data da última manutenção
  maintenanceHistory?: MaintenanceRecord[];
  fuelLogs?: FuelLog[];
  // Cross-Domain & Extended Telemetry
  renavam?: string;
  color?: string;
  colorName?: string;
  costCenter?: string;
  department?: string;
  telemetryData?: { speed?: number; latitude?: number; longitude?: number; lastUpdate?: string };
}

export interface MaintenanceRecord {
  id: string;
  vehicleId: string;
  date: string;
  type: 'Preventiva' | 'Corretiva' | 'Preditiva';
  description: string;
  cost: number;
  km: number;
  mechanic?: string;
  attachments?: AppAttachment[];
  ledgerCode?: string;
  ledgerName?: string;
  productId?: string;
  productQuantity?: number;
  debitAccountId?: string;
}
// Alias for backward compatibility if needed, or prefer MaintenanceRecord
export type VehicleMaintenance = MaintenanceRecord;

export interface ProductionUnit {
  id: string;
  name: string; // Plant 1
  type: string; // Usina Asfalto, Usina Concreto
  status: 'Operando' | 'Parado' | 'Manutenção';
  capacity: string; // 120ton/h
  location?: string;
  currentLoad: number; // %
  temp: number;
  power: string; // kW consumption
}

export interface QualityTest {
  id: string;
  type: string;
  result: string;
  minExpected: string;
  status: 'Aprovado' | 'Reprovado' | 'Pendente';
  testedAt: string;
  tester?: string;
}

export interface FormulaIngredient {
  productId: string;
  name: string;
  qty: number;
  unit: string;
}

export interface ProductionFormula {
  id: string;
  name: string;
  category: string;
  type?: 'Composicao' | 'Britagem'; // 'Composicao' (Standard) or 'Britagem' (Decomposition)
  ingredients: FormulaIngredient[];
  outputProductId?: string; // For Composicao
  outputs?: { productId: string; name: string; percentage: number; }[]; // For Britagem (Product + Yield %)
}

export interface ProductionOrder {
  id: string;
  orderNumber: string;
  productName: string;
  productId?: string;
  formulaId?: string;
  quantity: number;
  status: 'Planejado' | 'Em Produção' | 'Qualidade' | 'Finalizado' | 'Pausado' | 'Cancelado';
  startDate: string;
  dueDate: string;
  priority: 'Alta' | 'Média' | 'Baixa';
  progress: number;
  unitId?: string;
  batch?: string;
  operator?: string;
  qualityTests?: QualityTest[];
  rawMaterialsDeducted?: boolean;
  // Cross-Domain Links
  clientId?: string;
  saleId?: string;
  vehicleId?: string;
  costCenter?: string;
}

export interface Budget {
  id: string;
  clientId: string;
  clientName: string;
  date: string;
  items: SalesItem[];
  subtotal: number;
  discount: number;
  total: number;
  status: 'Aberto' | 'Aprovado' | 'Rejeitado' | 'Convertido' | 'Cancelado';
  expiryDate: string;
  tareWeight?: number;
  grossWeight?: number;
  netWeight?: number;
  weightNotes?: string;
  paymentMethod?: string;
}

export interface Tire {
  id: string;
  serialNumber: string;
  brand: string;
  model: string;
  size: string;
  status: 'Novo' | 'Em uso' | 'Recapagem' | 'Descartado' | 'Estoque';
  currentVehicleId?: string;
  position?: string;
  installKm?: number;
  currentKm: number;
  maxKm: number;
  recapCount: number;
  history: TireHistory[];
  stockItemId?: string;
}

export interface TireHistory {
  id: string;
  date: string;
  type: 'Instalação' | 'Rodízio' | 'Recapagem' | 'Inspeção' | 'Retirada';
  km: number;
  notes?: string;
  vehicleId?: string;
  position?: string;
}



export interface AppRole {
  id: string;
  name: string;
  description: string;
  permissions: string[]; // e.g., ['sales.view', 'sales.create', 'finance.admin']
}

export interface User {
  id: string;
  name: string;
  username: string; // Login ID
  password?: string; // Mock password
  email: string;
  roleId: string;
  status: 'Ativo' | 'Inativo';
  lastLogin?: string;
  avatar?: string;
  registeredAt: string;
  employeeId?: string; // Link to an employee profile
}

export interface AppSettings {
  companyName: string;
  tradeName: string;
  document: string;
  email: string;
  phone: string;
  website?: string;
  address: string;
  bankDetails?: {
    bankName: string;
    agency: string;
    account: string;
    pixKey: string;
    pixType: string;
  };
  currency: string;
  language: string;
  theme: 'light' | 'dark' | 'system';
  interfaceDensity?: 'compact' | 'standard' | 'comfortable';
  enableAnimations?: boolean;
  notifications: {
    stockAlerts: boolean;
    overdueFinance: boolean;
    productionUpdates: boolean;
    fleetMaintenance: boolean;
    [key: string]: boolean;
  };
  technical: {
    taxRegime: string;
    defaultTaxRate: number;
    financialYearStart: string;
    dateFormat: string;
    timezone: string;
    cnae?: string;
    stateRegistry?: string; // Inscrição Estadual
    cityRegistry?: string; // Inscrição Municipal
    nfeSeries?: string;
    nfeNextNumber?: number;
    nfeEnvironment?: 'homologacao' | 'producao';
    fiscalModuleEnabled?: boolean;
    certificateExpiry?: string;
  };
  backup: {
    autoBackup: boolean;
    frequency: 'daily' | 'weekly' | 'monthly';
    lastBackup?: string;
  };
  // New Enhanced Sections
  operational: {
    [key: string]: number | string | boolean;
  };
  integrations: {
    [key: string]: {
      name: string;
      status: 'Ativo' | 'Inativo';
      category: string;
      config?: any;
    };
  };
  emailConfig: {
    smtpProvider?: string;
    smtpServer: string;
    smtpPort: number;
    smtpSecurity?: string;
    senderEmail: string;
    senderPassword?: string;
    smtpPassword?: string;
    templates?: Record<string, string>;
    automations?: Record<string, boolean>;
  };
  documents: {
    printerMain: string;
    printerThermal: string;
    margins: number;
    copies: number;
    showLogo: boolean;
    watermarkDraft: boolean;
    qrCode: boolean;
    autoNumbering: boolean;
    digitalSignature: boolean;
    customFooter: boolean;
    barcode: boolean;
    authSeal: boolean;
    documentStatuses?: Record<string, 'Ativo' | 'Inativo'>;
    printerMainConfig?: {
      quality: 'draft' | 'normal' | 'high';
      color: 'bw' | 'color';
      duplex: boolean;
    };
    printerThermalConfig?: {
      width: number;
      height: number;
    };
  };
  performance: {
    cacheSize: number; // in MB (simulated)
    dbOptimizationLastDate?: string;
    dbFragmentation?: number;
    imageQuality: number; // 0-100
    autoCompression: boolean;
    lazyLoading: boolean;
    preloading: boolean;
    gzip: boolean;
    autoIndexing: boolean;
    queryCache: boolean;
    minifyAssets: boolean;
    cdn: boolean;
    dbPooling: boolean;
    [key: string]: any;
  };
  // Data Security & Compliance
  dataSecurity?: {
    backupEnabled: boolean;
    backupFrequency: '6h' | 'daily' | 'weekly' | 'monthly';
    backupRetention: number; // days
    backupTime?: string;
    lastBackupDate?: string;
    encryptionEnabled: boolean;
    lgpdConsent: boolean;
    auditLogs: boolean;
    dataRetentionDays: number;
    twoFactorAuth: boolean;
    sessionTimeout: number; // minutes
    passwordPolicy: 'basic' | 'medium' | 'strong';
    ipWhitelist?: string[];
  };
  config?: Record<string, any>;
}

export interface PayrollRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  month: string; // MM/YYYY
  baseSalary: number;
  benefits?: number;
  overtime?: number;
  discounts: number; // Replaces deductions
  additions?: number;
  totalNet: number; // Replaces netSalary
  status: 'Pendente' | 'Pago';
  paymentDate?: string;
  paidAt?: string;
}

export interface TimeLog {
  id: string;
  employeeId: string;
  date: string;
  checkIn: string;
  checkOut?: string;
  lunchStart?: string;
  lunchEnd?: string;
  totalHours?: string;
  status?: 'Regular' | 'Extra' | 'Atraso' | 'Presente' | 'Saída';
}

export interface Vacation {
  id: string;
  employeeId: string;
  employeeName: string;
  startDate: string;
  endDate: string;
  days?: number;
  status: 'Solicitado' | 'Aprovado' | 'Concluído' | 'Cancelado' | 'Rejeitado';
  requestedAt?: string;
  notes?: string;
}

export interface SalaryAdvance {
  id: string;
  employeeId: string;
  employeeName: string;
  amount: number;
  reason?: string;
  status: 'Pendente' | 'Aprovado' | 'Pago' | 'Rejeitado';
  requestDate: string;
  deductFromMonth: string;
  notes?: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  module: string; // 'Login', 'Vendas', 'Configurações', etc.
  details?: string;
  timestamp: string; // ISO String or Formatted
  severity: 'info' | 'warning' | 'critical';
  ip?: string;
}

// ============================================================================
// AGENTES DE IA (WhatsApp)
// Persistidos em settings.integrations['ai_agents_whatsapp'].config
// ============================================================================

/** Vínculo entre um usuário do sistema e um número de WhatsApp autorizado. */
export interface AIAgentNumberLink {
  id: string;
  userId: string;
  phone: string; // somente dígitos, com DDI (ex: 5511987654321)
  label?: string; // Apelido / Cargo no WhatsApp (ex: "Plantão Usina")
}

export interface AIAgentSettings {
  enabled: boolean;
  links: AIAgentNumberLink[];
  acceptAudio: boolean;
  acceptImages: boolean;
  requireConfirmation: boolean; // pede confirmação antes de gravar no ERP
  proactiveAlerts: boolean;     // permite mensagens iniciadas pelo agente
  customSystemPrompt?: string;  // Instruções personalizadas / regras extras para o agente
}

export interface AIGatewaySettings {
  provider: 'evolution' | 'zapi' | 'meta_cloud';
  instanceName: string;
  webhookUrl: string;
  senderPhone?: string; // Número remetente WhatsApp Business conectado
  scheduleMode?: '24x7' | 'commercial'; // 24/7 ou Comercial (07:00 às 19:00)
  confirmationTimeoutMinutes?: number; // Expiração de confirmação (SIM/NÃO) em minutos
}

export type AICodeProposalStatus = 'solicitada' | 'aguardando_aprovacao' | 'aprovada' | 'rejeitada' | 'aplicada';

export interface AICodeProposal {
  id: string;
  title: string;
  description: string;
  files: string[];
  requestedBy: string;
  createdAt: string; // ISO
  status: AICodeProposalStatus;
  origin: 'whatsapp' | 'painel';
  branch?: string;
  changeType?: 'Bugfix' | 'Refatoração' | 'Nova Funcionalidade' | 'Performance' | 'Segurança';
  priority?: 'Baixa' | 'Média' | 'Alta' | 'Urgente';
}

export interface AICodeAgentSettings {
  enabled: boolean;
  links: AIAgentNumberLink[];
  mode: 'suggest_only' | 'branch_and_pr';
  proposals: AICodeProposal[];
}

export interface AIAgentsConfig {
  gatewayEnabled: boolean;
  gateway: AIGatewaySettings;
  agents: Record<string, AIAgentSettings>;
  codeAgent: AICodeAgentSettings;
}