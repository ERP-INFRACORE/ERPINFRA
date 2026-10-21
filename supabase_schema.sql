-- ============================================
-- INFRACORE ERP - SCHEMA COMPLETO DO SUPABASE
-- Execute este script no SQL Editor do Supabase
-- ============================================
-- Criado em: 2026-01-01
-- Versão: 1.0
-- ============================================

-- Habilita extensão UUID se não existir
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABELAS DE CONFIGURAÇÃO E USUÁRIOS
-- ============================================

-- Perfis de Acesso (Roles)
CREATE TABLE IF NOT EXISTS app_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    permissions JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Usuários do Sistema
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255),
    email VARCHAR(255),
    "roleId" UUID REFERENCES app_roles(id),
    status VARCHAR(20) DEFAULT 'Ativo',
    "lastLogin" TIMESTAMP WITH TIME ZONE,
    avatar TEXT,
    "registeredAt" VARCHAR(50),
    "employeeId" UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Configurações do Sistema
CREATE TABLE IF NOT EXISTS settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "companyName" VARCHAR(255),
    "tradeName" VARCHAR(255),
    document VARCHAR(50),
    "stateReg" VARCHAR(50),
    email VARCHAR(255),
    phone VARCHAR(50),
    website VARCHAR(255),
    address TEXT,
    "bankDetails" JSONB,
    currency VARCHAR(10) DEFAULT 'BRL',
    language VARCHAR(10) DEFAULT 'pt-BR',
    theme VARCHAR(20) DEFAULT 'light',
    "interfaceDensity" VARCHAR(30) DEFAULT 'comfortable',
    "enableAnimations" BOOLEAN DEFAULT true,
    notifications JSONB DEFAULT '{}'::jsonb,
    technical JSONB DEFAULT '{}'::jsonb,
    backup JSONB DEFAULT '{}'::jsonb,
    operational JSONB DEFAULT '{}'::jsonb,
    integrations JSONB DEFAULT '{}'::jsonb,
    "emailConfig" JSONB DEFAULT '{}'::jsonb,
    documents JSONB DEFAULT '{}'::jsonb,
    performance JSONB DEFAULT '{}'::jsonb,
    "dataSecurity" JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Log de Auditoria
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "userId" UUID,
    "userName" VARCHAR(255),
    action VARCHAR(100),
    module VARCHAR(100),
    details TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    severity VARCHAR(20) DEFAULT 'info',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TABELAS DE CADASTROS
-- ============================================

-- Clientes
CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    document VARCHAR(50),
    "stateReg" VARCHAR(50),
    email VARCHAR(255),
    phone VARCHAR(50),
    address JSONB,
    "contactPerson" VARCHAR(255),
    "creditLimit" NUMERIC(15,2),
    "paymentTerms" VARCHAR(50),
    status VARCHAR(20) DEFAULT 'Ativo',
    type VARCHAR(50) DEFAULT 'Matriz',
    "registeredAt" VARCHAR(50),
    initials VARCHAR(10),
    "colorClass" VARCHAR(50),
    attachments JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Fornecedores
CREATE TABLE IF NOT EXISTS suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    "tradeName" VARCHAR(255),
    document VARCHAR(50),
    "stateReg" VARCHAR(50),
    email VARCHAR(255),
    phone VARCHAR(50),
    address JSONB,
    "contactPerson" VARCHAR(255),
    category VARCHAR(100),
    "bankInfo" JSONB,
    status VARCHAR(20) DEFAULT 'Ativo',
    "registeredAt" VARCHAR(50),
    initials VARCHAR(10),
    attachments JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Funcionários
CREATE TABLE IF NOT EXISTS employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    role VARCHAR(100),
    department VARCHAR(100),
    status VARCHAR(20) DEFAULT 'Ativo',
    "admissionDate" VARCHAR(50),
    salary NUMERIC(15,2),
    email VARCHAR(255),
    phone VARCHAR(50),
    address JSONB,
    cpf VARCHAR(20),
    photo TEXT,
    "vacationDaysAvailable" INTEGER DEFAULT 30,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TABELAS DE ESTOQUE
-- ============================================

-- Itens de Inventário
CREATE TABLE IF NOT EXISTS inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    quantity NUMERIC(15,3) DEFAULT 0,
    unit VARCHAR(20),
    price NUMERIC(15,2),
    "costPrice" NUMERIC(15,2),
    "minStock" NUMERIC(15,3) DEFAULT 0,
    "maxStock" NUMERIC(15,3),
    location VARCHAR(100),
    barcode VARCHAR(100),
    ncm VARCHAR(20),
    weight NUMERIC(15,4),
    brand VARCHAR(100),
    "supplierId" UUID,
    color VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Movimentações de Estoque
CREATE TABLE IF NOT EXISTS stock_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "itemId" UUID REFERENCES inventory(id),
    "itemName" VARCHAR(255),
    type VARCHAR(20),
    quantity NUMERIC(15,3),
    date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reason TEXT,
    "documentId" VARCHAR(100),
    "userId" UUID,
    "userName" VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TABELAS FINANCEIRAS
-- ============================================

-- Contas Financeiras (Banco, Caixa, etc.)
CREATE TABLE IF NOT EXISTS financial_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50),
    balance NUMERIC(15,2) DEFAULT 0,
    "initialBalance" NUMERIC(15,2) DEFAULT 0,
    "bankName" VARCHAR(100),
    "bankCode" VARCHAR(20),
    nickname VARCHAR(100),
    agency VARCHAR(30),
    "accountNumber" VARCHAR(50),
    "pixType" VARCHAR(30),
    "pixKey" VARCHAR(255),
    color VARCHAR(50),
    code VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transações Financeiras
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date VARCHAR(50),
    "dueDate" VARCHAR(50),
    "competenceDate" VARCHAR(50),
    description TEXT,
    category VARCHAR(100),
    "costCenter" VARCHAR(100),
    "paymentMethod" VARCHAR(100),
    "accountId" UUID,
    account VARCHAR(100),
    amount NUMERIC(15,2),
    status VARCHAR(20) DEFAULT 'Pendente',
    type VARCHAR(20),
    "documentNumber" VARCHAR(100),
    "partnerId" UUID,
    "partnerName" VARCHAR(255),
    "originModule" VARCHAR(50),
    "originId" UUID,
    "ledgerCode" VARCHAR(50),
    "ledgerName" VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TABELAS DE VENDAS
-- ============================================

-- Vendas
CREATE TABLE IF NOT EXISTS sales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date VARCHAR(50),
    "dueDate" VARCHAR(50),
    description TEXT,
    category VARCHAR(100),
    "accountId" UUID,
    account VARCHAR(100),
    amount NUMERIC(15,2),
    status VARCHAR(20) DEFAULT 'Pendente',
    type VARCHAR(20) DEFAULT 'Receita',
    "documentNumber" VARCHAR(100),
    "clientId" UUID REFERENCES clients(id),
    "clientName" VARCHAR(255),
    items JSONB DEFAULT '[]'::jsonb,
    "paymentMethod" VARCHAR(100),
    installments INTEGER DEFAULT 1,
    "installmentDueDates" JSONB,
    "weightTicket" VARCHAR(100),
    "measuredWeight" NUMERIC(15,3),
    "dispatchStatus" VARCHAR(50),
    "vehicleId" UUID,
    "driverName" VARCHAR(255),
    "tareWeight" NUMERIC(15,3),
    "grossWeight" NUMERIC(15,3),
    "netWeight" NUMERIC(15,3),
    "weightNotes" TEXT,
    "ledgerCode" VARCHAR(50),
    "ledgerName" VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Orçamentos
CREATE TABLE IF NOT EXISTS budgets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "clientId" UUID REFERENCES clients(id),
    "clientName" VARCHAR(255),
    date VARCHAR(50),
    items JSONB DEFAULT '[]'::jsonb,
    subtotal NUMERIC(15,2),
    discount NUMERIC(15,2) DEFAULT 0,
    total NUMERIC(15,2),
    status VARCHAR(20) DEFAULT 'Aberto',
    "expiryDate" VARCHAR(50),
    "tareWeight" NUMERIC(15,3),
    "grossWeight" NUMERIC(15,3),
    "netWeight" NUMERIC(15,3),
    "weightNotes" TEXT,
    "paymentMethod" VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Itens do Orçamento (opcional, para normalização)
CREATE TABLE IF NOT EXISTS budget_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "budgetId" UUID REFERENCES budgets(id) ON DELETE CASCADE,
    "productId" UUID,
    name VARCHAR(255),
    quantity NUMERIC(15,3),
    unit VARCHAR(20),
    price NUMERIC(15,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TABELAS DE COMPRAS
-- ============================================

-- Ordens de Compra
CREATE TABLE IF NOT EXISTS purchase_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "supplierId" UUID REFERENCES suppliers(id),
    "supplierName" VARCHAR(255),
    date VARCHAR(50),
    "competenceDate" VARCHAR(50),
    items JSONB DEFAULT '[]'::jsonb,
    subtotal NUMERIC(15,2),
    tax NUMERIC(15,2),
    "shippingCost" NUMERIC(15,2),
    total NUMERIC(15,2),
    status VARCHAR(20) DEFAULT 'Pendente',
    "receivedAt" VARCHAR(50),
    "paymentTerms" VARCHAR(100),
    "targetAccountId" UUID,
    attachments JSONB DEFAULT '[]'::jsonb,
    "ledgerCode" VARCHAR(50),
    "ledgerName" VARCHAR(255),
    "accountId" UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Itens da transação (opcional)
CREATE TABLE IF NOT EXISTS transaction_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "transactionId" UUID REFERENCES transactions(id) ON DELETE CASCADE,
    "productId" UUID,
    name VARCHAR(255),
    quantity NUMERIC(15,3),
    unit VARCHAR(20),
    price NUMERIC(15,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TABELAS DE FROTA
-- ============================================

-- Veículos da Frota
CREATE TABLE IF NOT EXISTS fleet (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255),
    plate VARCHAR(20),
    model VARCHAR(100),
    brand VARCHAR(100),
    year INTEGER,
    type VARCHAR(50),
    status VARCHAR(30) DEFAULT 'Operacional',
    "fuelType" VARCHAR(30),
    "fuelLevel" INTEGER,
    km NUMERIC(15,2) DEFAULT 0,
    "nextMaintenanceKm" NUMERIC(15,2),
    "insuranceExpiry" VARCHAR(50),
    "driverId" UUID,
    chassis VARCHAR(100),
    renavam VARCHAR(50),
    color VARCHAR(30),
    "colorName" VARCHAR(50),
    "lastMaintenance" VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Registros de Manutenção
CREATE TABLE IF NOT EXISTS maintenance_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "vehicleId" UUID REFERENCES fleet(id),
    date VARCHAR(50),
    type VARCHAR(30),
    description TEXT,
    cost NUMERIC(15,2),
    km NUMERIC(15,2),
    mechanic VARCHAR(255),
    attachments JSONB DEFAULT '[]'::jsonb,
    "ledgerCode" VARCHAR(50),
    "ledgerName" VARCHAR(255),
    "productId" UUID,
    "productQuantity" NUMERIC(15,3),
    "debitAccountId" UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Registros de Abastecimento
CREATE TABLE IF NOT EXISTS fuel_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "vehicleId" UUID REFERENCES fleet(id),
    date VARCHAR(50),
    liters NUMERIC(15,3),
    cost NUMERIC(15,2),
    "pricePerLiter" NUMERIC(15,4),
    km NUMERIC(15,2),
    "fuelType" VARCHAR(30),
    "stationName" VARCHAR(255),
    "invoiceNumber" VARCHAR(100),
    "financialAccountId" UUID,
    "isPaid" BOOLEAN DEFAULT false,
    "ledgerCode" VARCHAR(50),
    "ledgerName" VARCHAR(255),
    attachments JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Pneus
CREATE TABLE IF NOT EXISTS tires (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "serialNumber" VARCHAR(100),
    brand VARCHAR(100),
    model VARCHAR(100),
    size VARCHAR(50),
    status VARCHAR(30) DEFAULT 'Novo',
    "currentVehicleId" UUID REFERENCES fleet(id),
    position VARCHAR(20),
    "installKm" NUMERIC(15,2),
    "currentKm" NUMERIC(15,2) DEFAULT 0,
    "maxKm" NUMERIC(15,2),
    "recapCount" INTEGER DEFAULT 0,
    history JSONB DEFAULT '[]'::jsonb,
    "stockItemId" UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Histórico de Pneus
CREATE TABLE IF NOT EXISTS tire_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "tireId" UUID REFERENCES tires(id) ON DELETE CASCADE,
    date VARCHAR(50),
    type VARCHAR(30),
    km NUMERIC(15,2),
    notes TEXT,
    "vehicleId" UUID,
    position VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TABELAS DE PRODUÇÃO
-- ============================================

-- Unidades de Produção
CREATE TABLE IF NOT EXISTS production_units (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100),
    status VARCHAR(30) DEFAULT 'Operando',
    capacity VARCHAR(50),
    location VARCHAR(255),
    "currentLoad" INTEGER DEFAULT 0,
    temp NUMERIC(10,2),
    power VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Fórmulas de Produção
CREATE TABLE IF NOT EXISTS production_formulas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    type VARCHAR(30),
    ingredients JSONB DEFAULT '[]'::jsonb,
    "outputProductId" UUID,
    outputs JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ordens de Produção
CREATE TABLE IF NOT EXISTS production_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "orderNumber" VARCHAR(100),
    "productName" VARCHAR(255),
    "productId" UUID,
    "formulaId" UUID REFERENCES production_formulas(id),
    quantity NUMERIC(15,3),
    status VARCHAR(30) DEFAULT 'Planejado',
    "startDate" VARCHAR(50),
    "dueDate" VARCHAR(50),
    priority VARCHAR(20) DEFAULT 'Média',
    progress INTEGER DEFAULT 0,
    "unitId" UUID REFERENCES production_units(id),
    batch VARCHAR(100),
    operator VARCHAR(255),
    "qualityTests" JSONB DEFAULT '[]'::jsonb,
    "rawMaterialsDeducted" BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TABELAS DE RH
-- ============================================

-- Folha de Pagamento
CREATE TABLE IF NOT EXISTS payroll (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "employeeId" UUID REFERENCES employees(id),
    "employeeName" VARCHAR(255),
    month VARCHAR(20),
    "baseSalary" NUMERIC(15,2),
    benefits NUMERIC(15,2),
    overtime NUMERIC(15,2),
    discounts NUMERIC(15,2),
    additions NUMERIC(15,2),
    "totalNet" NUMERIC(15,2),
    status VARCHAR(20) DEFAULT 'Pendente',
    "paymentDate" VARCHAR(50),
    "paidAt" VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Registro de Ponto
CREATE TABLE IF NOT EXISTS time_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "employeeId" UUID REFERENCES employees(id),
    date VARCHAR(50),
    "checkIn" VARCHAR(20),
    "checkOut" VARCHAR(20),
    "lunchStart" VARCHAR(20),
    "lunchEnd" VARCHAR(20),
    "totalHours" VARCHAR(20),
    status VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Férias
CREATE TABLE IF NOT EXISTS vacations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "employeeId" UUID REFERENCES employees(id),
    "employeeName" VARCHAR(255),
    "startDate" VARCHAR(50),
    "endDate" VARCHAR(50),
    days INTEGER,
    status VARCHAR(20) DEFAULT 'Solicitado',
    "requestedAt" VARCHAR(50),
    "approvedBy" VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Adiantamento Salarial
CREATE TABLE IF NOT EXISTS salary_advances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "employeeId" UUID REFERENCES employees(id),
    "employeeName" VARCHAR(255),
    amount NUMERIC(15,2),
    reason TEXT,
    status VARCHAR(20) DEFAULT 'Pendente',
    "requestDate" VARCHAR(50),
    "deductFromMonth" VARCHAR(20),
    notes TEXT,
    "approvedBy" VARCHAR(255),
    "paidAt" VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- ÍNDICES PARA PERFORMANCE (Opcional - execute depois se desejar)
-- ============================================
-- Descomente para criar índices de performance:

-- CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
-- CREATE INDEX IF NOT EXISTS idx_clients_document ON clients(document);
-- CREATE INDEX IF NOT EXISTS idx_suppliers_status ON suppliers(status);
-- CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(status);
-- CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
-- CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
-- CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
-- CREATE INDEX IF NOT EXISTS idx_sales_clientId ON sales("clientId");
-- CREATE INDEX IF NOT EXISTS idx_sales_status ON sales(status);
-- CREATE INDEX IF NOT EXISTS idx_inventory_category ON inventory(category);
-- CREATE INDEX IF NOT EXISTS idx_fleet_status ON fleet(status);
-- CREATE INDEX IF NOT EXISTS idx_fleet_plate ON fleet(plate);
-- CREATE INDEX IF NOT EXISTS idx_production_orders_status ON production_orders(status);
-- CREATE INDEX IF NOT EXISTS idx_payroll_employeeId ON payroll("employeeId");
-- CREATE INDEX IF NOT EXISTS idx_payroll_month ON payroll(month);

-- ============================================
-- ROW LEVEL SECURITY (RLS) - Básico
-- ============================================
-- Habilitar RLS para proteção de dados (opcional)
-- ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Política para permitir acesso autenticado (ajuste conforme necessidade)
-- CREATE POLICY "Enable all access for authenticated users" ON clients
--     FOR ALL USING (auth.role() = 'authenticated');

-- ============================================
-- FIM DO SCHEMA
-- ============================================
-- Schema criado com sucesso!
-- Total de tabelas: 26
-- ============================================
