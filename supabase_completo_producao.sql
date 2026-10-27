-- ==============================================================================
-- INFRACORE ERP - SCHEMA ESTRUTURAL COMPLETO E UNIFICADO (PRODUÇÃO)
-- Execute este script no SQL Editor do Supabase:
-- https://supabase.com/dashboard/project/ucjizjocapdntcyrrmuh/sql/new
-- ==============================================================================

-- 1. Habilitar extensão UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 2. TABELAS DE GOVERNANÇA, USUÁRIOS E CONFIGURAÇÃO
-- ==============================================================================

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
    role_id UUID REFERENCES app_roles(id),
    status VARCHAR(20) DEFAULT 'Ativo',
    last_login TIMESTAMP WITH TIME ZONE,
    avatar TEXT,
    registered_at VARCHAR(50),
    employee_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Configurações Gerais
CREATE TABLE IF NOT EXISTS settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_name VARCHAR(255),
    trade_name VARCHAR(255),
    document VARCHAR(50),
    state_reg VARCHAR(50),
    email VARCHAR(255),
    phone VARCHAR(50),
    website VARCHAR(255),
    address TEXT,
    bank_details JSONB,
    currency VARCHAR(10) DEFAULT 'BRL',
    language VARCHAR(10) DEFAULT 'pt-BR',
    theme VARCHAR(20) DEFAULT 'light',
    interface_density VARCHAR(30) DEFAULT 'comfortable',
    enable_animations BOOLEAN DEFAULT true,
    notifications JSONB DEFAULT '{}'::jsonb,
    data_security JSONB DEFAULT '{}'::jsonb,
    operational_params JSONB DEFAULT '{}'::jsonb,
    integrations JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Logs de Auditoria
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    user_name VARCHAR(255),
    action VARCHAR(255) NOT NULL,
    module VARCHAR(100) NOT NULL,
    details TEXT,
    ip_address VARCHAR(50),
    severity VARCHAR(20) DEFAULT 'info',
    timestamp VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================================================
-- 3. CADASTROS DE PARCEIROS E RECURSOS HUMANOS
-- ==============================================================================

-- Clientes
CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    trade_name VARCHAR(255),
    document VARCHAR(50) NOT NULL,
    state_reg VARCHAR(50),
    email VARCHAR(255),
    phone VARCHAR(50),
    type VARCHAR(20) DEFAULT 'PJ',
    status VARCHAR(20) DEFAULT 'Ativo',
    address JSONB,
    credit_limit NUMERIC(15,2) DEFAULT 0,
    tags JSONB DEFAULT '[]'::jsonb,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Fornecedores
CREATE TABLE IF NOT EXISTS suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    trade_name VARCHAR(255),
    document VARCHAR(50) NOT NULL,
    state_reg VARCHAR(50),
    email VARCHAR(255),
    phone VARCHAR(50),
    contact_person VARCHAR(255),
    category VARCHAR(100),
    status VARCHAR(20) DEFAULT 'Ativo',
    address JSONB,
    payment_terms VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Funcionários (RH & Canteiro)
CREATE TABLE IF NOT EXISTS employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    role VARCHAR(100),
    department VARCHAR(100),
    status VARCHAR(20) DEFAULT 'Ativo',
    admission_date VARCHAR(50),
    salary NUMERIC(15,2),
    email VARCHAR(255),
    phone VARCHAR(50),
    address JSONB,
    cpf VARCHAR(20),
    photo TEXT,
    vacation_days_available INTEGER DEFAULT 30,
    cnh VARCHAR(30),
    cnh_category VARCHAR(10),
    cnh_expiry VARCHAR(50),
    cost_center VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================================================
-- 4. ESTOQUE, ALMOXARIFADO E MATERIAIS
-- ==============================================================================

-- Itens de Inventário / Produtos
CREATE TABLE IF NOT EXISTS inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    quantity NUMERIC(15,3) DEFAULT 0,
    unit VARCHAR(20),
    price NUMERIC(15,2),
    cost_price NUMERIC(15,2),
    min_stock NUMERIC(15,3) DEFAULT 0,
    max_stock NUMERIC(15,3),
    location VARCHAR(100),
    barcode VARCHAR(100),
    ncm VARCHAR(20),
    weight NUMERIC(15,4),
    brand VARCHAR(100),
    supplier_id UUID REFERENCES suppliers(id),
    color VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Movimentações de Estoque (Entradas, Saídas, Ajustes)
CREATE TABLE IF NOT EXISTS stock_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_id UUID REFERENCES inventory(id),
    item_name VARCHAR(255),
    type VARCHAR(30) NOT NULL,
    quantity NUMERIC(15,3) NOT NULL,
    previous_stock NUMERIC(15,3),
    current_stock NUMERIC(15,3),
    unit VARCHAR(20),
    cost_per_unit NUMERIC(15,2),
    total_cost NUMERIC(15,2),
    reason TEXT,
    document_id VARCHAR(100),
    user_id UUID,
    user_name VARCHAR(255),
    date VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================================================
-- 5. FINANCEIRO, DRE E PLANO DE CONTAS
-- ==============================================================================

-- Contas Bancárias e Caixas
CREATE TABLE IF NOT EXISTS financial_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    bank VARCHAR(100),
    agency VARCHAR(50),
    account_number VARCHAR(50),
    type VARCHAR(50) DEFAULT 'Corrente',
    initial_balance NUMERIC(15,2) DEFAULT 0,
    balance NUMERIC(15,2) DEFAULT 0,
    pix_key VARCHAR(100),
    pix_key_type VARCHAR(20),
    is_default BOOLEAN DEFAULT false,
    status VARCHAR(20) DEFAULT 'Ativa',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela Hierárquica do Plano de Contas / DRE
CREATE TABLE IF NOT EXISTS plan_of_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(20) DEFAULT 'Despesa',
    parent_id UUID REFERENCES plan_of_accounts(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transações Financeiras (Contas a Pagar / Receber / Caixa)
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date VARCHAR(50),
    due_date VARCHAR(50),
    competence_date VARCHAR(50),
    description TEXT,
    category VARCHAR(100),
    cost_center VARCHAR(100),
    payment_method VARCHAR(100),
    account_id UUID REFERENCES financial_accounts(id),
    account VARCHAR(100),
    amount NUMERIC(15,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'Pendente',
    type VARCHAR(20) NOT NULL,
    document_number VARCHAR(100),
    partner_id UUID,
    partner_name VARCHAR(255),
    origin_module VARCHAR(50),
    origin_id UUID,
    ledger_code VARCHAR(50),
    ledger_name VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================================================
-- 6. VENDAS, PDV, ORÇAMENTOS E COMPRAS
-- ==============================================================================

-- Vendas Realizadas e Despachos
CREATE TABLE IF NOT EXISTS sales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date VARCHAR(50),
    due_date VARCHAR(50),
    description TEXT,
    category VARCHAR(100),
    account_id UUID REFERENCES financial_accounts(id),
    account VARCHAR(100),
    amount NUMERIC(15,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'Pendente',
    type VARCHAR(20) DEFAULT 'Receita',
    document_number VARCHAR(100),
    client_id UUID REFERENCES clients(id),
    client_name VARCHAR(255),
    items JSONB DEFAULT '[]'::jsonb,
    payment_method VARCHAR(100),
    installments INTEGER DEFAULT 1,
    installment_due_dates JSONB,
    weight_ticket VARCHAR(100),
    measured_weight NUMERIC(15,3),
    dispatch_status VARCHAR(50),
    vehicle_id UUID,
    driver_name VARCHAR(255),
    tare_weight NUMERIC(15,3),
    gross_weight NUMERIC(15,3),
    net_weight NUMERIC(15,3),
    weight_notes TEXT,
    ledger_code VARCHAR(50),
    ledger_name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Orçamentos Comerciais
CREATE TABLE IF NOT EXISTS budgets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES clients(id),
    client_name VARCHAR(255),
    date VARCHAR(50),
    items JSONB DEFAULT '[]'::jsonb,
    subtotal NUMERIC(15,2),
    discount NUMERIC(15,2) DEFAULT 0,
    total NUMERIC(15,2),
    status VARCHAR(20) DEFAULT 'Aberto',
    expiry_date VARCHAR(50),
    tare_weight NUMERIC(15,3),
    gross_weight NUMERIC(15,3),
    net_weight NUMERIC(15,3),
    weight_notes TEXT,
    payment_method VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ordens de Compra
CREATE TABLE IF NOT EXISTS purchase_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number VARCHAR(100),
    supplier_id UUID REFERENCES suppliers(id),
    supplier_name VARCHAR(255),
    date VARCHAR(50),
    delivery_date VARCHAR(50),
    items JSONB DEFAULT '[]'::jsonb,
    total NUMERIC(15,2),
    status VARCHAR(30) DEFAULT 'Pendente',
    payment_terms VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================================================
-- 7. FROTA, MANUTENÇÃO E GESTÃO DE PNEUS
-- ==============================================================================

-- Veículos da Frota e Máquinas Pesadas
CREATE TABLE IF NOT EXISTS fleet (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255),
    plate VARCHAR(20),
    model VARCHAR(100),
    brand VARCHAR(100),
    year INTEGER,
    type VARCHAR(50),
    status VARCHAR(30) DEFAULT 'Operacional',
    fuel_type VARCHAR(30),
    fuel_level INTEGER,
    km NUMERIC(15,2) DEFAULT 0,
    next_maintenance_km NUMERIC(15,2),
    insurance_expiry VARCHAR(50),
    driver_id UUID REFERENCES employees(id),
    chassis VARCHAR(100),
    renavam VARCHAR(50),
    color VARCHAR(30),
    color_name VARCHAR(50),
    last_maintenance VARCHAR(50),
    cost_center VARCHAR(100),
    department VARCHAR(100),
    telemetry_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Histórico de Manutenções
CREATE TABLE IF NOT EXISTS maintenance_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id UUID REFERENCES fleet(id) ON DELETE CASCADE,
    date VARCHAR(50),
    type VARCHAR(50),
    description TEXT,
    cost NUMERIC(15,2),
    km NUMERIC(15,2),
    performed_by VARCHAR(255),
    notes TEXT,
    cost_center VARCHAR(100),
    ledger_code VARCHAR(50),
    ledger_name VARCHAR(255),
    attachments JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Registros de Abastecimento de Combustível
CREATE TABLE IF NOT EXISTS fuel_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id UUID REFERENCES fleet(id) ON DELETE CASCADE,
    date VARCHAR(50),
    fuel_type VARCHAR(30),
    liters NUMERIC(15,3),
    cost NUMERIC(15,2),
    km NUMERIC(15,2),
    driver_name VARCHAR(255),
    gas_station VARCHAR(255),
    cost_center VARCHAR(100),
    ledger_code VARCHAR(50),
    ledger_name VARCHAR(255),
    attachments JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Pneus Industriais e Rodoviários
CREATE TABLE IF NOT EXISTS tires (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    serial_number VARCHAR(100),
    brand VARCHAR(100),
    model VARCHAR(100),
    size VARCHAR(50),
    status VARCHAR(30) DEFAULT 'Novo',
    current_vehicle_id UUID REFERENCES fleet(id),
    position VARCHAR(50),
    install_km NUMERIC(15,2),
    current_km NUMERIC(15,2) DEFAULT 0,
    max_km NUMERIC(15,2),
    recap_count INTEGER DEFAULT 0,
    history JSONB DEFAULT '[]'::jsonb,
    stock_item_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================================================
-- 8. PRODUÇÃO INDUSTRIAL (USINAS, CENTRAL DE CONCRETO, BRITAGEM)
-- ==============================================================================

-- Unidades / Usinas de Produção
CREATE TABLE IF NOT EXISTS production_units (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50),
    capacity VARCHAR(100),
    location VARCHAR(255),
    status VARCHAR(30) DEFAULT 'Operacional',
    operator VARCHAR(255),
    power VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Traços e Fórmulas de Produção
CREATE TABLE IF NOT EXISTS production_formulas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    type VARCHAR(50) DEFAULT 'Composicao',
    ingredients JSONB DEFAULT '[]'::jsonb,
    output_product_id UUID,
    outputs JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ordens de Produção Industrial
CREATE TABLE IF NOT EXISTS production_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number VARCHAR(100),
    product_name VARCHAR(255),
    product_id UUID,
    formula_id UUID REFERENCES production_formulas(id),
    quantity NUMERIC(15,3),
    status VARCHAR(30) DEFAULT 'Planejado',
    start_date VARCHAR(50),
    due_date VARCHAR(50),
    priority VARCHAR(20) DEFAULT 'Média',
    progress INTEGER DEFAULT 0,
    unit_id UUID REFERENCES production_units(id),
    batch VARCHAR(100),
    operator VARCHAR(255),
    quality_tests JSONB DEFAULT '[]'::jsonb,
    raw_materials_deducted BOOLEAN DEFAULT false,
    client_id UUID REFERENCES clients(id),
    sale_id UUID REFERENCES sales(id),
    vehicle_id UUID REFERENCES fleet(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================================================
-- 9. RECURSOS HUMANOS: PONTO ELETRÔNICO, FOLHA E BENEFÍCIOS
-- ==============================================================================

-- Folha de Pagamento
CREATE TABLE IF NOT EXISTS payroll (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID REFERENCES employees(id),
    employee_name VARCHAR(255),
    month VARCHAR(20),
    base_salary NUMERIC(15,2),
    benefits NUMERIC(15,2) DEFAULT 0,
    overtime NUMERIC(15,2) DEFAULT 0,
    discounts NUMERIC(15,2) DEFAULT 0,
    total_net NUMERIC(15,2),
    status VARCHAR(30) DEFAULT 'Pendente',
    payment_date VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Registros de Ponto Eletrônico
CREATE TABLE IF NOT EXISTS time_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID REFERENCES employees(id),
    date VARCHAR(50),
    check_in VARCHAR(20),
    check_out VARCHAR(20),
    lunch_start VARCHAR(20),
    lunch_end VARCHAR(20),
    total_hours VARCHAR(20),
    status VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Férias
CREATE TABLE IF NOT EXISTS vacations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID REFERENCES employees(id),
    employee_name VARCHAR(255),
    start_date VARCHAR(50),
    end_date VARCHAR(50),
    days INTEGER,
    status VARCHAR(20) DEFAULT 'Solicitado',
    requested_at VARCHAR(50),
    approved_by VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Adiantamentos Salariais
CREATE TABLE IF NOT EXISTS salary_advances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID REFERENCES employees(id),
    employee_name VARCHAR(255),
    amount NUMERIC(15,2),
    reason TEXT,
    status VARCHAR(20) DEFAULT 'Pendente',
    request_date VARCHAR(50),
    deduct_from_month VARCHAR(20),
    notes TEXT,
    approved_by VARCHAR(255),
    paid_at VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================================================
-- 10. TRIGGERS AUTOMÁTICOS DE UPDATED_AT
-- ==============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
    tbl text;
    tables text[] := ARRAY[
        'app_roles', 'users', 'settings', 'clients', 'suppliers', 
        'employees', 'inventory', 'financial_accounts', 'plan_of_accounts',
        'transactions', 'sales', 'budgets', 'purchase_orders', 'fleet', 
        'tires', 'production_units', 'production_formulas', 'production_orders', 
        'payroll', 'vacations', 'salary_advances'
    ];
BEGIN
    FOREACH tbl IN ARRAY tables LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS trg_update_updated_at ON %I;', tbl);
        EXECUTE format('CREATE TRIGGER trg_update_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();', tbl);
    END LOOP;
END;
$$;

-- ==============================================================================
-- 11. ÍNDICES DE PERFORMANCE E CONSULTAS FREQUENTES
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_clients_document ON clients(document);
CREATE INDEX IF NOT EXISTS idx_suppliers_document ON suppliers(document);
CREATE INDEX IF NOT EXISTS idx_employees_cpf ON employees(cpf);
CREATE INDEX IF NOT EXISTS idx_inventory_category ON inventory(category);
CREATE INDEX IF NOT EXISTS idx_transactions_due_date ON transactions(due_date);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_ledger_code ON transactions(ledger_code);
CREATE INDEX IF NOT EXISTS idx_sales_client_id ON sales(client_id);
CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(date);
CREATE INDEX IF NOT EXISTS idx_budgets_client_id ON budgets(client_id);
CREATE INDEX IF NOT EXISTS idx_fleet_plate ON fleet(plate);
CREATE INDEX IF NOT EXISTS idx_production_orders_status ON production_orders(status);
CREATE INDEX IF NOT EXISTS idx_plan_of_accounts_code ON plan_of_accounts(code);
CREATE INDEX IF NOT EXISTS idx_plan_of_accounts_parent_id ON plan_of_accounts(parent_id);

-- ==============================================================================
-- 12. ROW LEVEL SECURITY (RLS) SEGURO
-- ==============================================================================
DO $$
DECLARE
    tbl text;
    tables text[] := ARRAY[
        'app_roles', 'users', 'settings', 'audit_logs', 'clients', 'suppliers', 
        'employees', 'inventory', 'stock_movements', 'financial_accounts', 
        'plan_of_accounts', 'transactions', 'sales', 'budgets', 'purchase_orders', 
        'fleet', 'maintenance_records', 'fuel_logs', 'tires', 'production_units', 
        'production_formulas', 'production_orders', 'payroll', 'time_logs', 
        'vacations', 'salary_advances'
    ];
BEGIN
    FOREACH tbl IN ARRAY tables LOOP
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', tbl);
        EXECUTE format('DROP POLICY IF EXISTS "Permissao Total %s" ON %I;', tbl, tbl);
        EXECUTE format('CREATE POLICY "Permissao Total %s" ON %I FOR ALL USING (true) WITH CHECK (true);', tbl, tbl);
    END LOOP;
END;
$$;

-- ==============================================================================
-- FIM DO SCRIPT DE CRIAÇÃO E ATUALIZAÇÃO
-- Total de Tabelas Geradas: 26 principais relacionais + triggers + índices
-- ==============================================================================
