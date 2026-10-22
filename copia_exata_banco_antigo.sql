-- ==========================================================
-- INFRACORE ERP - COPIA EXATA DO BANCO ANTIGO
-- Execute este script no SQL Editor do Supabase NOVO
-- Projeto de destino: ucjizjocapdntcyrrmuh
-- ==========================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabela: payroll
CREATE TABLE IF NOT EXISTS public."payroll" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "employee_id" UUID,
    "employee_name" TEXT,
    "month" TEXT,
    "base_salary" NUMERIC,
    "benefits" NUMERIC,
    "overtime" NUMERIC,
    "discounts" NUMERIC,
    "total_net" NUMERIC,
    "status" TEXT,
    "paid_at" DATE,
    "created_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    "updated_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

-- Tabela: budget_items
CREATE TABLE IF NOT EXISTS public."budget_items" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "budgetId" UUID,
    "productId" UUID,
    "name" VARCHAR(255),
    "quantity" NUMERIC,
    "unit" VARCHAR(255),
    "price" NUMERIC,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela: production_formulas
CREATE TABLE IF NOT EXISTS public."production_formulas" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "name" TEXT,
    "category" TEXT,
    "output_product_id" UUID,
    "ingredients" JSONB DEFAULT '[]'::jsonb,
    "created_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    "updated_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

-- Tabela: production_orders
CREATE TABLE IF NOT EXISTS public."production_orders" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "order_number" TEXT,
    "product_name" TEXT,
    "product_id" UUID,
    "formula_id" UUID,
    "quantity" NUMERIC,
    "status" TEXT,
    "start_date" DATE,
    "due_date" DATE,
    "priority" TEXT,
    "progress" INTEGER,
    "unit_id" UUID,
    "batch" TEXT,
    "operator" TEXT,
    "quality_tests" JSONB DEFAULT '[]'::jsonb,
    "raw_materials_deducted" BOOLEAN,
    "created_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    "updated_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

-- Tabela: tire_history
CREATE TABLE IF NOT EXISTS public."tire_history" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "tireId" UUID,
    "date" VARCHAR(255),
    "type" VARCHAR(255),
    "km" NUMERIC,
    "notes" TEXT,
    "vehicleId" UUID,
    "position" VARCHAR(255),
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela: app_roles
CREATE TABLE IF NOT EXISTS public."app_roles" (
    "id" TEXT PRIMARY KEY,
    "name" TEXT,
    "description" TEXT,
    "permissions" JSONB DEFAULT '[]'::jsonb,
    "created_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    "updated_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

-- Tabela: clients
CREATE TABLE IF NOT EXISTS public."clients" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "name" TEXT,
    "document" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "status" TEXT,
    "type" TEXT,
    "registered_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    "initials" TEXT,
    "color_class" TEXT,
    "attachments" JSONB DEFAULT '[]'::jsonb,
    "created_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    "updated_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    "address_street" TEXT,
    "address_number" TEXT,
    "address_city" TEXT,
    "address_state" TEXT,
    "address_zip" TEXT,
    "credit_limit" NUMERIC,
    "contact_person" TEXT
);

-- Tabela: settings
CREATE TABLE IF NOT EXISTS public."settings" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "company_name" TEXT,
    "trade_name" TEXT,
    "document" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "currency" TEXT,
    "language" TEXT,
    "theme" TEXT,
    "notifications" JSONB DEFAULT '[]'::jsonb,
    "technical" JSONB DEFAULT '[]'::jsonb,
    "backup" JSONB DEFAULT '[]'::jsonb,
    "created_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    "updated_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

-- Tabela: transactions
CREATE TABLE IF NOT EXISTS public."transactions" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "date" DATE,
    "description" TEXT,
    "category" TEXT,
    "account" TEXT,
    "amount" NUMERIC,
    "status" TEXT,
    "type" TEXT,
    "ledger_code" TEXT,
    "ledger_name" TEXT,
    "created_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    "updated_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    "due_date" DATE,
    "account_id" TEXT,
    "partner_id" UUID,
    "document_number" TEXT,
    "origin_module" TEXT,
    "origin_id" UUID
);

-- Tabela: employees
CREATE TABLE IF NOT EXISTS public."employees" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "name" TEXT,
    "role" TEXT,
    "department" TEXT,
    "status" TEXT,
    "admission_date" DATE,
    "salary" NUMERIC,
    "email" TEXT,
    "phone" TEXT,
    "birth_date" DATE,
    "bank_account" TEXT,
    "pix_key" TEXT,
    "vacation_days_available" INTEGER,
    "attachments" JSONB DEFAULT '[]'::jsonb,
    "created_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    "updated_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

-- Tabela: maintenance_records
CREATE TABLE IF NOT EXISTS public."maintenance_records" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "vehicleId" UUID,
    "date" VARCHAR(255),
    "type" VARCHAR(255),
    "description" TEXT,
    "cost" NUMERIC,
    "km" NUMERIC,
    "mechanic" VARCHAR(255),
    "attachments" JSONB DEFAULT '[]'::jsonb,
    "ledgerCode" VARCHAR(255),
    "ledgerName" VARCHAR(255),
    "productId" UUID,
    "productQuantity" NUMERIC,
    "debitAccountId" UUID,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela: suppliers
CREATE TABLE IF NOT EXISTS public."suppliers" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "name" TEXT,
    "trade_name" TEXT,
    "document" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "category" TEXT,
    "status" TEXT,
    "registered_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    "initials" TEXT,
    "attachments" JSONB DEFAULT '[]'::jsonb,
    "created_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    "updated_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    "bank_info" JSONB DEFAULT '[]'::jsonb
);

-- Tabela: time_logs
CREATE TABLE IF NOT EXISTS public."time_logs" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "employee_id" UUID,
    "date" DATE,
    "check_in" TIME,
    "check_out" TIME,
    "status" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    "updated_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

-- Tabela: salary_advances
CREATE TABLE IF NOT EXISTS public."salary_advances" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "employee_id" UUID,
    "employee_name" TEXT,
    "amount" NUMERIC,
    "request_date" DATE,
    "status" TEXT,
    "approved_by" TEXT,
    "paid_at" DATE,
    "deduct_from_month" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    "updated_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

-- Tabela: sales
CREATE TABLE IF NOT EXISTS public."sales" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "client_id" UUID,
    "client_name" TEXT,
    "date" DATE,
    "items" JSONB DEFAULT '[]'::jsonb,
    "payment_method" TEXT,
    "amount" NUMERIC,
    "category" TEXT,
    "account" TEXT,
    "status" TEXT,
    "type" TEXT,
    "created_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    "updated_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    "installments" INTEGER,
    "weight_ticket" TEXT,
    "measured_weight" NUMERIC
);

-- Tabela: fuel_logs
CREATE TABLE IF NOT EXISTS public."fuel_logs" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "vehicleId" UUID,
    "date" VARCHAR(255),
    "liters" NUMERIC,
    "cost" NUMERIC,
    "pricePerLiter" NUMERIC,
    "km" NUMERIC,
    "fuelType" VARCHAR(255),
    "stationName" VARCHAR(255),
    "invoiceNumber" VARCHAR(255),
    "financialAccountId" UUID,
    "isPaid" BOOLEAN,
    "ledgerCode" VARCHAR(255),
    "ledgerName" VARCHAR(255),
    "attachments" JSONB DEFAULT '[]'::jsonb,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela: stock_movements
CREATE TABLE IF NOT EXISTS public."stock_movements" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "itemId" UUID,
    "itemName" VARCHAR(255),
    "type" VARCHAR(255),
    "quantity" NUMERIC,
    "date" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "reason" TEXT,
    "documentId" VARCHAR(255),
    "userId" UUID,
    "userName" VARCHAR(255),
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela: financial_accounts
CREATE TABLE IF NOT EXISTS public."financial_accounts" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "name" TEXT,
    "type" TEXT,
    "bank_name" TEXT,
    "initial_balance" NUMERIC,
    "current_balance" NUMERIC,
    "status" TEXT,
    "created_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

-- Tabela: transaction_items
CREATE TABLE IF NOT EXISTS public."transaction_items" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "transactionId" UUID,
    "productId" UUID,
    "name" VARCHAR(255),
    "quantity" NUMERIC,
    "unit" VARCHAR(255),
    "price" NUMERIC,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela: inventory
CREATE TABLE IF NOT EXISTS public."inventory" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "name" TEXT,
    "category" TEXT,
    "quantity" NUMERIC,
    "unit" TEXT,
    "price" NUMERIC,
    "min_stock" NUMERIC,
    "color" TEXT,
    "supplier_id" UUID,
    "created_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    "updated_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    "ncm" TEXT,
    "barcode" TEXT,
    "location" TEXT,
    "weight" NUMERIC,
    "brand" TEXT
);

-- Tabela: users
CREATE TABLE IF NOT EXISTS public."users" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "name" TEXT,
    "email" TEXT,
    "role_id" TEXT,
    "status" TEXT,
    "last_login" TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    "avatar" TEXT,
    "registered_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    "created_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    "updated_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

-- Tabela: production_units
CREATE TABLE IF NOT EXISTS public."production_units" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "name" TEXT,
    "type" TEXT,
    "status" TEXT,
    "capacity" TEXT,
    "current_load" INTEGER,
    "temp" INTEGER,
    "power" TEXT,
    "allowed_categories" JSONB DEFAULT '[]'::jsonb,
    "created_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    "updated_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

-- Tabela: tires
CREATE TABLE IF NOT EXISTS public."tires" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "serial_number" TEXT,
    "brand" TEXT,
    "model" TEXT,
    "size" TEXT,
    "status" TEXT,
    "current_vehicle_id" UUID,
    "position" TEXT,
    "install_km" INTEGER,
    "current_km" INTEGER,
    "max_km" INTEGER,
    "recap_count" INTEGER,
    "history" JSONB DEFAULT '[]'::jsonb,
    "created_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    "updated_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

-- Tabela: purchase_orders
CREATE TABLE IF NOT EXISTS public."purchase_orders" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "supplier_id" UUID,
    "supplier_name" TEXT,
    "date" DATE,
    "items" JSONB DEFAULT '[]'::jsonb,
    "subtotal" NUMERIC,
    "tax" NUMERIC,
    "total" NUMERIC,
    "status" TEXT,
    "received_at" DATE,
    "account_id" TEXT,
    "ledger_code" TEXT,
    "ledger_name" TEXT,
    "attachments" JSONB DEFAULT '[]'::jsonb,
    "created_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    "updated_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    "payment_terms" TEXT,
    "target_account_id" TEXT,
    "shipping_cost" NUMERIC
);

-- Tabela: fleet
CREATE TABLE IF NOT EXISTS public."fleet" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "name" TEXT,
    "brand" TEXT,
    "year" INTEGER,
    "plate" TEXT,
    "type" TEXT,
    "status" TEXT,
    "fuel_level" INTEGER,
    "last_maintenance" DATE,
    "km" INTEGER,
    "maintenance_history" JSONB DEFAULT '[]'::jsonb,
    "fuel_logs" JSONB DEFAULT '[]'::jsonb,
    "attachments" JSONB DEFAULT '[]'::jsonb,
    "created_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    "updated_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

-- Tabela: audit_logs
CREATE TABLE IF NOT EXISTS public."audit_logs" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "userId" UUID,
    "userName" VARCHAR(255),
    "action" VARCHAR(255),
    "module" VARCHAR(255),
    "details" TEXT,
    "timestamp" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "severity" VARCHAR(255),
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela: vacations
CREATE TABLE IF NOT EXISTS public."vacations" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "employee_id" UUID,
    "employee_name" TEXT,
    "start_date" DATE,
    "end_date" DATE,
    "days" INTEGER,
    "status" TEXT,
    "requested_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    "approved_by" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    "updated_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

-- Tabela: budgets
CREATE TABLE IF NOT EXISTS public."budgets" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "client_id" UUID,
    "client_name" TEXT,
    "date" DATE,
    "items" JSONB DEFAULT '[]'::jsonb,
    "subtotal" NUMERIC,
    "discount" NUMERIC,
    "total" NUMERIC,
    "status" TEXT,
    "expiry_date" DATE,
    "created_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    "updated_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

-- ==========================================================
-- DADOS MIGRADOS DO BANCO ANTIGO
-- ==========================================================

-- Dados: app_roles
INSERT INTO public.app_roles ("id", "name", "description", "permissions") VALUES ('admin', 'Administrador', 'Acesso total ao sistema', '["all"]'::jsonb) ON CONFLICT ("id") DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, permissions = EXCLUDED.permissions;
INSERT INTO public.app_roles ("id", "name", "description", "permissions") VALUES ('manager', 'Gerente', 'Gestão de módulos operacionais', '["sales.view","sales.create","purchases.view","inventory.view"]'::jsonb) ON CONFLICT ("id") DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, permissions = EXCLUDED.permissions;
INSERT INTO public.app_roles ("id", "name", "description", "permissions") VALUES ('operator', 'Operador', 'Operação de campo e produção', '["production.view","fleet.view"]'::jsonb) ON CONFLICT ("id") DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, permissions = EXCLUDED.permissions;
INSERT INTO public.app_roles ("id", "name", "description", "permissions") VALUES ('1766984128943', 'Funcionário 3', 'ponto', '["point.in"]'::jsonb) ON CONFLICT ("id") DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, permissions = EXCLUDED.permissions;
INSERT INTO public.app_roles ("id", "name", "description", "permissions") VALUES ('1767490381826', 'vv', '', '["sales.view","sales.create"]'::jsonb) ON CONFLICT ("id") DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, permissions = EXCLUDED.permissions;

-- Dados: settings
INSERT INTO public.settings ("id", "company_name", "trade_name", "document", "email", "phone", "address", "currency", "language", "theme") VALUES ('cb7dca65-931a-4b9f-a8d8-39c7bbbe4dde', 'Construsys Engenharia Ltda', 'Construsys ERP', '12.345.678/0001-99', 'contato@construsys.com', '(11) 4002-8922', 'Rua da Tecnologia, 100 - Industrial, SP', 'BRL', 'pt-BR', 'dark') ON CONFLICT ("id") DO NOTHING;

-- Usuário inicial Admin
INSERT INTO public.users ("name", "email", "role_id", "status") VALUES ('Administrador', 'admin@infracore.com', 'admin', 'Ativo') ON CONFLICT DO NOTHING;

-- Publicação Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.app_roles, public.users, public.settings, public.clients, public.suppliers, public.employees, public.inventory, public.sales, public.transactions, public.fleet;
