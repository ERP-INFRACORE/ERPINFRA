-- ==============================================================================
-- INFRACORE ERP - MIGRAÇÃO: CONTROLE TECNOLÓGICO (LAB) E CONFIGURAÇÕES EXTENDIDAS
-- Arquivo: supabase_migration_laboratory_and_settings.sql
-- ==============================================================================

-- 1. Criação da Tabela de Ensaios Laboratoriais DNIT
CREATE TABLE IF NOT EXISTS public.laboratory_tests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module VARCHAR(50) NOT NULL, -- 'asfalto', 'concreto', 'solos', 'agregados'
    category VARCHAR(100),
    test_code VARCHAR(100) NOT NULL,
    test_name VARCHAR(255) NOT NULL,
    standard_norm VARCHAR(100) NOT NULL,
    sample_type VARCHAR(255),
    batch_number VARCHAR(100),
    order_id UUID,
    order_number VARCHAR(100),
    product_name VARCHAR(255),
    unit_id UUID,
    unit_name VARCHAR(255),
    location_or_station TEXT,
    supplier_or_quarry TEXT,
    tested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    tester VARCHAR(255),
    supervisor VARCHAR(255),
    nominal_expected TEXT,
    result_value TEXT,
    status VARCHAR(50) DEFAULT 'Aprovado',
    conditional_release BOOLEAN DEFAULT FALSE,
    notes TEXT,
    bench_data JSONB DEFAULT '{}'::jsonb,
    metrics_calculated JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices de performance para busca laboratorial rápida
CREATE INDEX IF NOT EXISTS idx_lab_tests_module ON public.laboratory_tests(module);
CREATE INDEX IF NOT EXISTS idx_lab_tests_batch ON public.laboratory_tests(batch_number);
CREATE INDEX IF NOT EXISTS idx_lab_tests_date ON public.laboratory_tests(tested_at);

-- 2. Adição da Coluna 'config' JSONB na Tabela 'settings'
ALTER TABLE public.settings 
ADD COLUMN IF NOT EXISTS config JSONB DEFAULT '{}'::jsonb;
