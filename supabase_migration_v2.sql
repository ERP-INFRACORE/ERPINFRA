-- ==============================================================================
-- INFRACORE ERP - MIGRAÇÃO INCREMENTAL DE BACKEND (V2)
-- Compatibilidade Canônica snake_case, Novas Colunas e Plano de Contas / DRE
-- ==============================================================================

-- 1. Habilitar extensão de UUID (se não habilitada)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 2. TABELA HIERÁRQUICA DO PLANO DE CONTAS / DRE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS plan_of_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(20) DEFAULT 'Despesa', -- 'Receita' ou 'Despesa'
    parent_id UUID REFERENCES plan_of_accounts(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para busca rápida no plano de contas
CREATE INDEX IF NOT EXISTS idx_plan_of_accounts_code ON plan_of_accounts(code);
CREATE INDEX IF NOT EXISTS idx_plan_of_accounts_parent_id ON plan_of_accounts(parent_id);

-- RLS para plan_of_accounts
ALTER TABLE plan_of_accounts ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'plan_of_accounts' AND policyname = 'Permitir acesso completo a plan_of_accounts'
    ) THEN
        CREATE POLICY "Permitir acesso completo a plan_of_accounts" 
        ON plan_of_accounts FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;

-- Trigger de updated_at para plan_of_accounts
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'set_updated_at_plan_of_accounts'
    ) THEN
        CREATE TRIGGER set_updated_at_plan_of_accounts
        BEFORE UPDATE ON plan_of_accounts
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    END IF;
EXCEPTION
    WHEN undefined_function THEN
        -- Se a função genérica não existir, cria trigger seguro
        NULL;
END $$;

-- ==============================================================================
-- 3. ALINHAMENTO INCREMENTAL DE COLUNAS EM TABELAS EXISTENTES
-- ==============================================================================

-- Funcionários (RH): CNH, Categoria, Vencimento e Centro de Custo
ALTER TABLE employees ADD COLUMN IF NOT EXISTS cnh VARCHAR(30);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS cnh_category VARCHAR(10);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS cnh_expiry VARCHAR(50);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS cost_center VARCHAR(100);

-- Frota Pesada & Máquinas: Centro de Custo, Departamento e Telemetria
ALTER TABLE fleet ADD COLUMN IF NOT EXISTS cost_center VARCHAR(100);
ALTER TABLE fleet ADD COLUMN IF NOT EXISTS department VARCHAR(100);
ALTER TABLE fleet ADD COLUMN IF NOT EXISTS telemetry_data JSONB DEFAULT '{}'::jsonb;

-- Orçamentos Comerciais: Pesagens industriais e Condições de Pagamento
ALTER TABLE budgets ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id);
ALTER TABLE budgets ADD COLUMN IF NOT EXISTS client_name VARCHAR(255);
ALTER TABLE budgets ADD COLUMN IF NOT EXISTS expiry_date VARCHAR(50);
ALTER TABLE budgets ADD COLUMN IF NOT EXISTS tare_weight NUMERIC(15,3);
ALTER TABLE budgets ADD COLUMN IF NOT EXISTS gross_weight NUMERIC(15,3);
ALTER TABLE budgets ADD COLUMN IF NOT EXISTS net_weight NUMERIC(15,3);
ALTER TABLE budgets ADD COLUMN IF NOT EXISTS weight_notes TEXT;
ALTER TABLE budgets ADD COLUMN IF NOT EXISTS payment_method VARCHAR(100);

-- Vendas & PDV: Dados complementares de pesagem, despacho e DRE
ALTER TABLE sales ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id);
ALTER TABLE sales ADD COLUMN IF NOT EXISTS client_name VARCHAR(255);
ALTER TABLE sales ADD COLUMN IF NOT EXISTS payment_method VARCHAR(100);
ALTER TABLE sales ADD COLUMN IF NOT EXISTS weight_ticket VARCHAR(100);
ALTER TABLE sales ADD COLUMN IF NOT EXISTS measured_weight NUMERIC(15,3);
ALTER TABLE sales ADD COLUMN IF NOT EXISTS dispatch_status VARCHAR(50);
ALTER TABLE sales ADD COLUMN IF NOT EXISTS vehicle_id UUID REFERENCES fleet(id);
ALTER TABLE sales ADD COLUMN IF NOT EXISTS driver_name VARCHAR(255);
ALTER TABLE sales ADD COLUMN IF NOT EXISTS tare_weight NUMERIC(15,3);
ALTER TABLE sales ADD COLUMN IF NOT EXISTS gross_weight NUMERIC(15,3);
ALTER TABLE sales ADD COLUMN IF NOT EXISTS net_weight NUMERIC(15,3);
ALTER TABLE sales ADD COLUMN IF NOT EXISTS weight_notes TEXT;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS ledger_code VARCHAR(50);
ALTER TABLE sales ADD COLUMN IF NOT EXISTS ledger_name VARCHAR(255);

-- Transações Financeiras: Datas, Centros de Custo e DRE Contábil
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS due_date VARCHAR(50);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS competence_date VARCHAR(50);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS cost_center VARCHAR(100);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS payment_method VARCHAR(100);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS account_id UUID;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS document_number VARCHAR(100);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS partner_id UUID;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS partner_name VARCHAR(255);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS origin_module VARCHAR(50);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS origin_id UUID;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS ledger_code VARCHAR(50);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS ledger_name VARCHAR(255);

-- Ordens de Produção: Vinculações com Vendas, Clientes e Frotas
ALTER TABLE production_orders ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id);
ALTER TABLE production_orders ADD COLUMN IF NOT EXISTS sale_id UUID REFERENCES sales(id);
ALTER TABLE production_orders ADD COLUMN IF NOT EXISTS vehicle_id UUID REFERENCES fleet(id);
ALTER TABLE production_orders ADD COLUMN IF NOT EXISTS quality_tests JSONB DEFAULT '[]'::jsonb;
ALTER TABLE production_orders ADD COLUMN IF NOT EXISTS raw_materials_deducted BOOLEAN DEFAULT false;

-- Estoque e Inventário: Preço de Custo e Ponto de Reposição
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS cost_price NUMERIC(15,2);
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS min_stock NUMERIC(15,3) DEFAULT 0;
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS max_stock NUMERIC(15,3);
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS supplier_id UUID REFERENCES suppliers(id);

-- ==============================================================================
-- 4. ÍNDICES DE ALTA PERFORMANCE PARA O ERP
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_transactions_due_date ON transactions(due_date);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_ledger_code ON transactions(ledger_code);

CREATE INDEX IF NOT EXISTS idx_sales_client_id ON sales(client_id);
CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(date);

CREATE INDEX IF NOT EXISTS idx_budgets_client_id ON budgets(client_id);
CREATE INDEX IF NOT EXISTS idx_production_orders_status ON production_orders(status);
CREATE INDEX IF NOT EXISTS idx_fleet_plate ON fleet(plate);
CREATE INDEX IF NOT EXISTS idx_inventory_category ON inventory(category);
CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(status);
