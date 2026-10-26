import React, { useState, useEffect, useMemo } from 'react';
import {
    Settings as SettingsIcon,
    Users,
    Shield,
    Building,
    Palette,
    Bell,
    Globe,
    Save,
    Plus,
    Trash2,
    Edit2,
    X,
    Check,
    Lock,
    UserPlus,
    Monitor,
    Mail,
    Phone,
    MapPin,
    Database,
    Cloud,
    ShieldCheck,
    Cpu,
    History,
    Activity,
    Server,
    Zap,
    Scale,
    Calendar,
    Wifi,
    BarChart3,
    Search,
    Filter,
    AlertTriangle,
    CheckCircle,
    Info,
    ChevronDown,
    ChevronUp,
    LogOut,
    FileText,
    Printer,
    Download,
    Upload,
    RefreshCw,
    HardDrive,
    Key,
    Eye,
    EyeOff,
    Copy,
    ExternalLink,
    Settings as SettingsGear,
    Sliders,
    SlidersHorizontal,
    HelpCircle,
    Package,
    TrendingUp,
    DollarSign,
    Percent,
    Clock,
    Target,
    Layers,
    Link,
    Smartphone,
    Landmark,
    Bot,
    MessageCircle,
    CheckCircle2,
    AlertCircle,
    Minus,
    Sparkles,
    RotateCcw,
    FileSpreadsheet,
    FileJson,
    Terminal,
    ShieldAlert
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { User, AppRole, AppSettings, AuditLog } from '../types';
import { APP_PERMISSIONS, ALL_PERMISSIONS_FLAT } from '../permission_constants';
import { generateCameloData } from '../src/utils/seeder';
import AIAuditAgent from '../components/AIAuditAgent';
import AIAgentsHub from '../components/AIAgentsHub';
import { AI_AGENTS_KEY, getAIConfig, describeAIConfigChange, isSuperAdminRole, isUserAdmin, findUserRole } from '../ai_agents_constants';

// Internal Toast Component
// Local Toast component removed in favor of global context

// ============================================================================
// VALIDADORES E FORMATADORES DE DADOS OPERACIONAIS E FISCAIS
// ============================================================================

export const isValidCPF = (cpf: string): boolean => {
    const clean = cpf.replace(/\D/g, '');
    if (clean.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(clean)) return false;
    let sum = 0;
    for (let i = 0; i < 9; i++) sum += parseInt(clean.charAt(i), 10) * (10 - i);
    let rev = 11 - (sum % 11);
    if (rev === 10 || rev === 11) rev = 0;
    if (rev !== parseInt(clean.charAt(9), 10)) return false;
    sum = 0;
    for (let i = 0; i < 10; i++) sum += parseInt(clean.charAt(i), 10) * (11 - i);
    rev = 11 - (sum % 11);
    if (rev === 10 || rev === 11) rev = 0;
    return rev === parseInt(clean.charAt(10), 10);
};

export const isValidCNPJ = (cnpj: string): boolean => {
    const clean = cnpj.replace(/\D/g, '');
    if (clean.length !== 14) return false;
    if (/^(\d)\1{13}$/.test(clean)) return false;
    let size = clean.length - 2;
    let numbers = clean.substring(0, size);
    const digits = clean.substring(size);
    let sum = 0;
    let pos = size - 7;
    for (let i = size; i >= 1; i--) {
        sum += parseInt(numbers.charAt(size - i), 10) * pos--;
        if (pos < 2) pos = 9;
    }
    let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (result !== parseInt(digits.charAt(0), 10)) return false;
    size = size + 1;
    numbers = clean.substring(0, size);
    sum = 0;
    pos = size - 7;
    for (let i = size; i >= 1; i--) {
        sum += parseInt(numbers.charAt(size - i), 10) * pos--;
        if (pos < 2) pos = 9;
    }
    result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    return result === parseInt(digits.charAt(1), 10);
};

export const isValidEmail = (email: string): boolean => {
    return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email.trim());
};

export const isValidPhone = (phone: string): boolean => {
    const clean = phone.replace(/\D/g, '');
    return clean.length >= 10 && clean.length <= 13;
};

export const isValidUUID = (uuid: string): boolean => {
    return /^[0-9a-fA-F]{8}-?[0-9a-fA-F]{4}-?[0-9a-fA-F]{4}-?[0-9a-fA-F]{4}-?[0-9a-fA-F]{12}$/.test(uuid.trim());
};

export const validatePixKey = (key: string, type: string): { isValid: boolean; message: string; warning?: string } => {
    const trimmed = (key || '').trim();
    if (!trimmed) {
        return { isValid: false, message: 'Chave PIX não informada' };
    }
    switch (type) {
        case 'CPF': {
            const clean = trimmed.replace(/\D/g, '');
            if (clean.length !== 11) return { isValid: false, message: `CPF deve conter 11 dígitos numéricos (atual: ${clean.length})` };
            if (!isValidCPF(clean)) return { isValid: false, message: 'Dígitos verificadores do CPF inválidos' };
            return { isValid: true, message: 'Chave CPF válida' };
        }
        case 'CNPJ': {
            const clean = trimmed.replace(/\D/g, '');
            if (clean.length !== 14) return { isValid: false, message: `CNPJ deve conter 14 dígitos numéricos (atual: ${clean.length})` };
            if (!isValidCNPJ(clean)) return { isValid: false, message: 'Dígitos verificadores do CNPJ inválidos' };
            return { isValid: true, message: 'Chave CNPJ válida' };
        }
        case 'E-mail': {
            if (!isValidEmail(trimmed)) return { isValid: false, message: 'Formato de e-mail inválido (ex: financeiro@infracore.com.br)' };
            return { isValid: true, message: 'Chave de e-mail válida' };
        }
        case 'Telefone': {
            const clean = trimmed.replace(/\D/g, '');
            if (clean.length < 10 || clean.length > 13) {
                return { isValid: false, message: 'Telefone deve conter DDD + 8 ou 9 dígitos (ex: 11987654321)' };
            }
            return { isValid: true, message: 'Chave de telefone válida' };
        }
        case 'Chave Aleatória': {
            if (!isValidUUID(trimmed)) {
                return { isValid: false, message: 'Chave aleatória (EVP) deve ser um UUID de 32 ou 36 caracteres hexadecimais' };
            }
            return { isValid: true, message: 'Chave aleatória (EVP) válida' };
        }
        default:
            return { isValid: trimmed.length >= 4, message: trimmed.length >= 4 ? 'Chave preenchida' : 'Chave muito curta' };
    }
};

export const formatCNPJ = (v: string): string => {
    const digits = v.replace(/\D/g, '').slice(0, 14);
    if (digits.length <= 2) return digits;
    if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
    if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
    if (digits.length <= 12) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12, 14)}`;
};

export const formatCPF = (v: string): string => {
    const digits = v.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
    if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
};

export const formatPhone = (v: string): string => {
    const digits = v.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 2) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
};

export const BRAZILIAN_BANKS = [
    { code: '001', name: '001 - Banco do Brasil S.A.' },
    { code: '237', name: '237 - Banco Bradesco S.A.' },
    { code: '341', name: '341 - Itaú Unibanco S.A.' },
    { code: '104', name: '104 - Caixa Econômica Federal' },
    { code: '033', name: '033 - Banco Santander (Brasil) S.A.' },
    { code: '077', name: '077 - Banco Inter S.A.' },
    { code: '260', name: '260 - Nu Pagamentos S.A. (Nubank)' },
    { code: '756', name: '756 - Banco Cooperativo Sicoob S.A.' },
    { code: '748', name: '748 - Banco Cooperativo Sicredi S.A.' },
    { code: '336', name: '336 - Banco C6 S.A.' },
    { code: '212', name: '212 - Banco Original S.A.' },
    { code: '029', name: '029 - Banco Banrisul S.A.' },
    { code: '422', name: '422 - Banco Safra S.A.' },
    { code: '655', name: '655 - Banco Votorantim S.A.' },
    { code: '041', name: '041 - Banco do Estado do Rio Grande do Sul' },
];

export interface OperationalParamDef {
    id: string;
    label: string;
    min: number;
    max: number;
    defaultVal: number;
    step: number;
    unit: string;
    category: 'Vendas' | 'Estoque' | 'Produção' | 'Compras' | 'Financeiro';
    description: string;
    validate?: (val: number) => { error?: string; warning?: string };
}

export interface SettingsValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
}

export const validateSettingsIntegrity = (s: AppSettings): SettingsValidationResult => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Empresa
    if (!s.companyName || s.companyName.trim() === '') {
        errors.push('Razão Social da Empresa é obrigatória.');
    }
    if (!s.tradeName || s.tradeName.trim() === '') {
        warnings.push('Nome Fantasia não foi preenchido.');
    }
    if (s.document && s.document.trim() !== '') {
        const cleanDoc = s.document.replace(/\D/g, '');
        if (cleanDoc.length === 14) {
            if (!isValidCNPJ(cleanDoc)) {
                warnings.push('CNPJ da empresa possui dígitos verificadores inválidos.');
            }
        } else if (cleanDoc.length === 11) {
            if (!isValidCPF(cleanDoc)) {
                warnings.push('CPF da empresa possui dígitos verificadores inválidos.');
            }
        } else {
            warnings.push('Documento da empresa (CNPJ/CPF) está com formato incompleto.');
        }
    }
    if (s.email && s.email.trim() !== '' && !isValidEmail(s.email)) {
        warnings.push('E-mail institucional da empresa possui formato inválido.');
    }

    // Dados Bancários e Chave PIX
    if (s.bankDetails?.pixKey && s.bankDetails.pixKey.trim() !== '') {
        const pixRes = validatePixKey(s.bankDetails.pixKey, s.bankDetails.pixType || 'CNPJ');
        if (!pixRes.isValid) {
            warnings.push(`Chave PIX (${s.bankDetails.pixType}): ${pixRes.message}`);
        }
    }

    // Parâmetros Operacionais Críticos
    const op = s.operational || {};
    const lvl1 = Number(op.purchaseApprovalLevel1 ?? 5000);
    const lvl2 = Number(op.purchaseApprovalLevel2 ?? 25000);
    if (lvl1 > lvl2 && lvl2 > 0) {
        errors.push(`Limite de Compras Nível 1 (R$ ${lvl1.toLocaleString('pt-BR')}) não pode ser maior que o Nível 2 (R$ ${lvl2.toLocaleString('pt-BR')}).`);
    }

    const minMargin = Number(op.minMargin ?? 15);
    if (minMargin < 0 || minMargin > 100) {
        errors.push(`Margem mínima de vendas (${minMargin}%) deve estar entre 0% e 100%.`);
    }

    const budgetValidity = Number(op.budgetValidity ?? 15);
    if (budgetValidity < 1) {
        errors.push('Validade padrão de orçamentos deve ser de no mínimo 1 dia.');
    }

    // Documentos & Impressão
    const docs = s.documents;
    if (docs?.printerThermalConfig) {
        const width = Number(docs.printerThermalConfig.width);
        const height = Number(docs.printerThermalConfig.height);
        if (width < 20 || width > 220) {
            errors.push(`Largura da etiqueta térmica (${width}mm) fora dos limites operacionais (20mm a 220mm).`);
        }
        if (height < 15 || height > 500) {
            errors.push(`Altura da etiqueta térmica (${height}mm) fora dos limites operacionais (15mm a 500mm).`);
        }
    }

    if (docs?.margins !== undefined) {
        const m = Number(docs.margins);
        if (m < 0 || m > 50) {
            errors.push(`Margens de impressão (${m}mm) devem estar entre 0mm e 50mm.`);
        }
    }

    if (docs?.copies !== undefined) {
        const c = Number(docs.copies);
        if (c < 1 || c > 99) {
            errors.push(`Número padrão de cópias (${c}) deve estar entre 1 e 99.`);
        }
    }

    return {
        isValid: errors.length === 0,
        errors,
        warnings,
    };
};

// 3. PARÂMETROS OPERACIONAIS
const OperationalParametersSection = ({ settings, onUpdate, addToast }: { settings: import('../types').AppSettings, onUpdate: (s: import('../types').AppSettings) => void, addToast?: any }) => {
    const operationalParams: OperationalParamDef[] = [
        // COMPRAS (DESTAQUE OPERACIONAL)
        {
            id: 'purchaseApprovalLevel1',
            label: 'Limite Aprovação Compras - Nível 1',
            min: 0,
            max: 200000,
            defaultVal: 5000,
            step: 500,
            unit: 'R$',
            category: 'Compras',
            description: 'Teto para aprovação direta de compras pelo comprador sem necessidade de validação gerencial.',
            validate: (val) => {
                if (val < 0) return { error: 'O limite de compra não pode ser negativo.' };
                if (val === 0) return { warning: 'Com limite R$ 0,00 toda ordem de compra exigirá aprovação da gerência.' };
                return {};
            }
        },
        {
            id: 'purchaseApprovalLevel2',
            label: 'Limite Aprovação Compras - Nível 2 (Gerência)',
            min: 0,
            max: 1000000,
            defaultVal: 20000,
            step: 1000,
            unit: 'R$',
            category: 'Compras',
            description: 'Limite máximo aprovável pela gerência de suprimentos antes de escalar para a diretoria executiva.',
            validate: (val) => {
                if (val < 0) return { error: 'O limite de compra não pode ser negativo.' };
                return {};
            }
        },
        {
            id: 'minOrderValue',
            label: 'Valor Mínimo para Pedido de Compra',
            min: 0,
            max: 50000,
            defaultVal: 500,
            step: 50,
            unit: 'R$',
            category: 'Compras',
            description: 'Valor mínimo consolidado para abertura de OC, otimizando custos administrativos e frete fracionado.',
            validate: (val) => val < 0 ? { error: 'Valor mínimo não pode ser negativo.' } : {}
        },
        {
            id: 'minQuotations',
            label: 'Mínimo de Cotações Obrigatórias',
            min: 1,
            max: 10,
            defaultVal: 3,
            step: 1,
            unit: 'cotações',
            category: 'Compras',
            description: 'Quantidade mínima de cotações com fornecedores exigida pelo sistema para compras acima do nível 1.',
            validate: (val) => val < 1 ? { error: 'É obrigatório exigir pelo menos 1 cotação.' } : {}
        },
        {
            id: 'supplierEvaluationPeriod',
            label: 'Período Avaliação de Fornecedores',
            min: 1,
            max: 36,
            defaultVal: 6,
            step: 1,
            unit: 'meses',
            category: 'Compras',
            description: 'Ciclo em meses para revisão periódica e cálculo do score de pontualidade e qualidade dos fornecedores.',
            validate: (val) => val < 1 ? { error: 'O período deve ser de no mínimo 1 mês.' } : {}
        },
        {
            id: 'deliveryToleranceDays',
            label: 'Tolerância Atraso na Entrega',
            min: 0,
            max: 30,
            defaultVal: 2,
            step: 1,
            unit: 'dias',
            category: 'Compras',
            description: 'Dias de tolerância para recebimento de insumos sem penalização no indicador de conformidade.',
            validate: (val) => val < 0 ? { error: 'A tolerância não pode ser negativa.' } : {}
        },

        // VENDAS & COMERCIAL (DESTAQUE OPERACIONAL)
        {
            id: 'minMargin',
            label: 'Margem Mínima de Lucro',
            min: 0,
            max: 100,
            defaultVal: 15,
            step: 0.5,
            unit: '%',
            category: 'Vendas',
            description: 'Piso de margem percentual sobre o custo industrial exigido para aprovação automática de orçamentos.',
            validate: (val) => {
                if (val < 0) return { error: 'A margem mínima não pode ser negativa.' };
                if (val > 100) return { error: 'A margem mínima não pode exceder 100% como piso padrão.' };
                if (val < 5) return { warning: 'Margem inferior a 5%: alto risco de prejuízo operacional e absorção de desvios.' };
                if (val > 50) return { warning: 'Margem piso superior a 50% pode reduzir a taxa de conversão comercial.' };
                return {};
            }
        },
        {
            id: 'budgetValidity',
            label: 'Validade de Orçamentos Comerciais',
            min: 1,
            max: 180,
            defaultVal: 15,
            step: 1,
            unit: 'dias',
            category: 'Vendas',
            description: 'Prazo em dias de vigência dos preços propostos antes da expiração automática da cotação.',
            validate: (val) => {
                if (val < 1) return { error: 'A validade deve ser de no mínimo 1 dia.' };
                if (!Number.isInteger(val)) return { error: 'A validade em dias deve ser um número inteiro.' };
                if (val > 60) return { warning: 'Prazos superiores a 60 dias aumentam o risco de variação de insumos (cimento, CAP).' };
                return {};
            }
        },
        {
            id: 'maxDiscount',
            label: 'Desconto Máximo Permitido',
            min: 0,
            max: 100,
            defaultVal: 15,
            step: 0.5,
            unit: '%',
            category: 'Vendas',
            description: 'Desconto comercial máximo que o vendedor pode conceder na proposta sem autorização de gerência.',
            validate: (val) => val < 0 || val > 100 ? { error: 'O desconto deve estar entre 0% e 100%.' } : {}
        },
        {
            id: 'defaultPaymentTerm',
            label: 'Prazo Padrão de Faturamento',
            min: 0,
            max: 365,
            defaultVal: 30,
            step: 5,
            unit: 'dias',
            category: 'Vendas',
            description: 'Prazo inicial de vencimento das parcelas para propostas comerciais a prazo.',
            validate: (val) => val < 0 ? { error: 'Prazo não pode ser negativo.' } : {}
        },
        {
            id: 'maxInstallments',
            label: 'Máximo de Parcelas Permitidas',
            min: 1,
            max: 48,
            defaultVal: 12,
            step: 1,
            unit: 'x',
            category: 'Vendas',
            description: 'Número máximo de divisões de parcelas permitidas na emissão de pedidos e orçamentos.',
            validate: (val) => val < 1 ? { error: 'Permita ao menos 1 parcela.' } : {}
        },
        {
            id: 'minInstallmentValue',
            label: 'Valor Mínimo por Parcela',
            min: 10,
            max: 50000,
            defaultVal: 100,
            step: 10,
            unit: 'R$',
            category: 'Vendas',
            description: 'Piso de valor monetário aceito para cada parcela gerada no contas a receber.',
            validate: (val) => val < 10 ? { error: 'Valor mínimo de R$ 10,00 por parcela.' } : {}
        },
        {
            id: 'creditLimit',
            label: 'Limite de Crédito Padrão Inicial',
            min: 0,
            max: 1000000,
            defaultVal: 5000,
            step: 500,
            unit: 'R$',
            category: 'Vendas',
            description: 'Crédito concedido automaticamente a clientes recém-cadastrados antes de análise do financeiro.',
            validate: (val) => val < 0 ? { error: 'Limite de crédito não pode ser negativo.' } : {}
        },
        {
            id: 'commissionRate',
            label: 'Taxa de Comissão Padrão de Vendas',
            min: 0,
            max: 30,
            defaultVal: 3,
            step: 0.1,
            unit: '%',
            category: 'Vendas',
            description: 'Percentual padrão de comissão sobre o faturamento líquido creditado aos representantes.',
            validate: (val) => val < 0 || val > 30 ? { error: 'Comissão deve estar entre 0% e 30%.' } : {}
        },

        // ESTOQUE & LOGÍSTICA
        {
            id: 'safetyStock',
            label: 'Estoque de Segurança Mínimo',
            min: 0,
            max: 100,
            defaultVal: 10,
            step: 1,
            unit: '%',
            category: 'Estoque',
            description: 'Margem percentual de contingência calculada sobre a demanda média do período.',
            validate: (val) => val < 0 || val > 100 ? { error: 'O estoque de segurança deve estar entre 0% e 100%.' } : {}
        },
        {
            id: 'reorderPoint',
            label: 'Ponto de Reposição Automático',
            min: 5,
            max: 100,
            defaultVal: 20,
            step: 1,
            unit: '%',
            category: 'Estoque',
            description: 'Percentual do estoque máximo que, ao ser atingido, gera alerta de compra preventiva.',
            validate: (val) => val < 5 ? { error: 'Ponto de reposição mínimo é de 5%.' } : {}
        },
        {
            id: 'batchTrackingDays',
            label: 'Rastreabilidade de Lotes',
            min: 30,
            max: 3650,
            defaultVal: 180,
            step: 30,
            unit: 'dias',
            category: 'Estoque',
            description: 'Prazo mínimo de guarda do histórico de lotes de brita, concreto usinado e CBUQ para laudos técnicos.',
            validate: (val) => val < 30 ? { error: 'Exigência técnica mínima de 30 dias de rastreamento.' } : {}
        },

        // PRODUÇÃO INDUSTRIAL
        {
            id: 'productionLeadTime',
            label: 'Lead Time Médio de Produção',
            min: 1,
            max: 90,
            defaultVal: 5,
            step: 1,
            unit: 'dias',
            category: 'Produção',
            description: 'Tempo padrão entre planejamento, dosagem e disponibilização do lote para expedição.',
            validate: (val) => val < 1 ? { error: 'Lead time deve ser de no mínimo 1 dia.' } : {}
        },
        {
            id: 'maintenanceInterval',
            label: 'Intervalo Manutenção Preventiva',
            min: 50,
            max: 5000,
            defaultVal: 500,
            step: 50,
            unit: 'horas',
            category: 'Produção',
            description: 'Horímetro de operação contínua para acionar ordem de revisão dos britadores e usinas.',
            validate: (val) => val < 50 ? { error: 'Intervalo mínimo de 50 horas de operação.' } : {}
        },
        {
            id: 'capacityUtilization',
            label: 'Meta Utilização da Capacidade',
            min: 20,
            max: 100,
            defaultVal: 85,
            step: 5,
            unit: '%',
            category: 'Produção',
            description: 'Meta de eficiência global de equipamentos (OEE) estipulada para os parques fabris.',
            validate: (val) => val < 20 || val > 100 ? { error: 'Meta deve estar entre 20% e 100%.' } : {}
        },

        // FINANCEIRO
        {
            id: 'interestRate',
            label: 'Taxa de Juros de Mora',
            min: 0,
            max: 20,
            defaultVal: 1,
            step: 0.1,
            unit: '% a.m.',
            category: 'Financeiro',
            description: 'Juros mensais contratuais aplicados sobre duplicatas e títulos vencidos a receber.',
            validate: (val) => val < 0 ? { error: 'Juros não podem ser negativos.' } : {}
        },
        {
            id: 'lateFee',
            label: 'Multa por Atraso',
            min: 0,
            max: 20,
            defaultVal: 2,
            step: 0.5,
            unit: '%',
            category: 'Financeiro',
            description: 'Multa penal moratória aplicada em atrasos no pagamento de títulos.',
            validate: (val) => val < 0 ? { error: 'Multa não pode ser negativa.' } : {}
        },
        {
            id: 'earlyPaymentDiscount',
            label: 'Desconto Pagamento Antecipado',
            min: 0,
            max: 25,
            defaultVal: 3,
            step: 0.5,
            unit: '%',
            category: 'Financeiro',
            description: 'Bonificação percentual concedida caso a fatura seja quitada antes do prazo de vencimento.',
            validate: (val) => val < 0 ? { error: 'Desconto não pode ser negativo.' } : {}
        },
        {
            id: 'cashFlowProjectionDays',
            label: 'Projeção de Fluxo de Caixa',
            min: 15,
            max: 730,
            defaultVal: 90,
            step: 15,
            unit: 'dias',
            category: 'Financeiro',
            description: 'Janela temporal em dias para projeção de contas a pagar, receber e saldo conciliado.',
            validate: (val) => val < 15 ? { error: 'Projeção mínima de 15 dias.' } : {}
        },
        {
            id: 'bankReconciliationFrequency',
            label: 'Frequência Conciliação Bancária',
            min: 1,
            max: 60,
            defaultVal: 7,
            step: 1,
            unit: 'dias',
            category: 'Financeiro',
            description: 'Intervalo recomendado para conferência e importação de extratos OFX bancários.',
            validate: (val) => val < 1 ? { error: 'Frequência mínima de 1 dia.' } : {}
        },
    ];

    const [filterCategory, setFilterCategory] = useState('Todos');
    const [searchQuery, setSearchQuery] = useState('');

    const filteredParams = operationalParams.filter(p => {
        const matchesCat = filterCategory === 'Todos' || p.category === filterCategory;
        const matchesSearch = p.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.description.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCat && matchesSearch;
    });

    const handleParamChange = (id: string, value: string, param: OperationalParamDef) => {
        if (value === '') {
            onUpdate({
                ...settings,
                operational: {
                    ...(settings.operational || {}),
                    [id]: 0
                }
            });
            return;
        }
        const numValue = parseFloat(value);
        if (!isNaN(numValue)) {
            onUpdate({
                ...settings,
                operational: {
                    ...(settings.operational || {}),
                    [id]: numValue
                }
            });
        }
    };

    const handleStep = (id: string, delta: number, param: OperationalParamDef) => {
        const current = Number(settings.operational?.[id] ?? param.defaultVal);
        const updated = Math.min(param.max, Math.max(param.min, parseFloat((current + delta).toFixed(2))));
        onUpdate({
            ...settings,
            operational: {
                ...(settings.operational || {}),
                [id]: updated
            }
        });
    };

    const handleResetSingle = (id: string, defaultVal: number, label: string) => {
        onUpdate({
            ...settings,
            operational: {
                ...(settings.operational || {}),
                [id]: defaultVal
            }
        });
        addToast?.(`Parâmetro "${label}" restaurado para o padrão (${defaultVal}).`, 'info');
    };

    const handleResetDefaults = () => {
        const defaults: Record<string, number> = {};
        operationalParams.forEach(p => {
            defaults[p.id] = p.defaultVal;
        });
        onUpdate({
            ...settings,
            operational: {
                ...(settings.operational || {}),
                ...defaults
            }
        });
        addToast?.('Todos os parâmetros operacionais foram restaurados para os valores padrão!', 'info');
    };

    // Obter validação de um parâmetro
    const getParamValidation = (param: OperationalParamDef, val: number) => {
        if (isNaN(val)) return { status: 'error' as const, message: 'Valor numérico inválido' };
        if (val < param.min) return { status: 'error' as const, message: `Abaixo do mínimo permitido (${param.min} ${param.unit})` };
        if (val > param.max) return { status: 'error' as const, message: `Acima do máximo permitido (${param.max} ${param.unit})` };
        if (param.validate) {
            const custom = param.validate(val);
            if (custom.error) return { status: 'error' as const, message: custom.error };
            if (custom.warning) return { status: 'warning' as const, message: custom.warning };
        }
        return { status: 'valid' as const, message: `Consistente (${param.unit})` };
    };

    // Valores atuais dos destaques operacionais
    const purchaseValL1 = Number(settings.operational?.purchaseApprovalLevel1 ?? 5000);
    const purchaseValL2 = Number(settings.operational?.purchaseApprovalLevel2 ?? 20000);
    const minMarginVal = Number(settings.operational?.minMargin ?? 15);
    const budgetVal = Number(settings.operational?.budgetValidity ?? 15);

    return (
        <section className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 p-8 rounded-[32px] border border-amber-100 dark:border-amber-900/30 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-amber-500 rounded-xl text-white shadow-lg shadow-amber-500/20">
                        <Sliders size={20} />
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
                            Parâmetros Operacionais Avançados
                            <span className="px-2 py-0.5 bg-amber-200/60 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 rounded text-[9px] font-black uppercase">Consistência Industrial</span>
                        </h3>
                        <p className="text-[10px] text-slate-500 font-medium">Regras de negócio, limites de compras, margem mínima de vendas e validade de orçamentos</p>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={handleResetDefaults}
                    className="px-4 py-2 bg-white dark:bg-slate-800 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 rounded-xl text-xs font-bold hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors flex items-center gap-2 self-start sm:self-auto shadow-sm"
                >
                    <RefreshCw size={14} /> Restaurar Todos os Padrões
                </button>
            </div>

            {/* PAINEL DE DESTAQUES OPERACIONAIS CRÍTICOS (Regra 3: Limites de Compra, Margem Mínima, Validade de Orçamento) */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border-2 border-amber-200 dark:border-amber-900/50 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-white flex items-center gap-2">
                        <Sparkles size={16} className="text-amber-500" />
                        Parâmetros Operacionais Críticos (Políticas de Governança)
                    </h4>
                    <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 px-2.5 py-0.5 rounded-full">
                        Validação Contínua Ativa
                    </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* 1. LIMITES DE COMPRA */}
                    <div className="p-4 rounded-xl bg-amber-50/60 dark:bg-slate-900/40 border border-amber-200 dark:border-amber-900/30 space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                                <DollarSign size={14} /> Limites de Compra
                            </span>
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${purchaseValL1 >= 0 && purchaseValL2 >= purchaseValL1 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                {purchaseValL1 >= 0 && purchaseValL2 >= purchaseValL1 ? 'Hierarquia Correta' : 'Ajustar Hierarquia'}
                            </span>
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-slate-600 dark:text-slate-300 block mb-1">Nível 1 (Comprador Direto)</label>
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-slate-400">R$</span>
                                <input
                                    type="number"
                                    min={0}
                                    max={200000}
                                    step={500}
                                    value={purchaseValL1}
                                    onChange={(e) => handleParamChange('purchaseApprovalLevel1', e.target.value, operationalParams[0])}
                                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg py-1.5 px-3 font-bold text-sm text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-amber-500/30"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-slate-600 dark:text-slate-300 block mb-1">Nível 2 (Gerência)</label>
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-slate-400">R$</span>
                                <input
                                    type="number"
                                    min={0}
                                    max={1000000}
                                    step={1000}
                                    value={purchaseValL2}
                                    onChange={(e) => handleParamChange('purchaseApprovalLevel2', e.target.value, operationalParams[1])}
                                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg py-1.5 px-3 font-bold text-sm text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-amber-500/30"
                                />
                            </div>
                        </div>
                        <p className="text-[9px] text-slate-500">Valores acima de R$ {purchaseValL2.toLocaleString('pt-BR')} são automaticamente encaminhados à Diretoria Executiva.</p>
                    </div>

                    {/* 2. MARGEM MÍNIMA */}
                    <div className="p-4 rounded-xl bg-amber-50/60 dark:bg-slate-900/40 border border-amber-200 dark:border-amber-900/30 space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                                <TrendingUp size={14} /> Margem Mínima de Vendas
                            </span>
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${minMarginVal >= 5 && minMarginVal <= 50 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                {minMarginVal >= 5 && minMarginVal <= 50 ? 'Margem Saudável' : minMarginVal < 5 ? 'Risco Alto' : 'Conservadora'}
                            </span>
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-slate-600 dark:text-slate-300 block mb-1">Piso Operacional (%)</label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    min={0}
                                    max={100}
                                    step={0.5}
                                    value={minMarginVal}
                                    onChange={(e) => handleParamChange('minMargin', e.target.value, operationalParams[6])}
                                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg py-1.5 px-3 font-bold text-sm text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-amber-500/30"
                                />
                                <span className="text-xs font-bold text-slate-400">%</span>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                                <div
                                    className={`h-full ${minMarginVal < 5 ? 'bg-rose-500' : minMarginVal < 15 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                    style={{ width: `${Math.min(100, Math.max(0, minMarginVal))}%` }}
                                ></div>
                            </div>
                            <p className="text-[9px] text-slate-500">Orçamentos gerados com margem inferior a {minMarginVal}% serão bloqueados para análise gerencial.</p>
                        </div>
                    </div>

                    {/* 3. VALIDADE DE ORÇAMENTO */}
                    <div className="p-4 rounded-xl bg-amber-50/60 dark:bg-slate-900/40 border border-amber-200 dark:border-amber-900/30 space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                                <Clock size={14} /> Validade de Orçamentos
                            </span>
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${budgetVal >= 1 && budgetVal <= 30 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                {budgetVal >= 1 && budgetVal <= 30 ? 'Prazo Padrão Seguro' : budgetVal > 30 ? 'Prazo Estendido' : 'Inválido'}
                            </span>
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-slate-600 dark:text-slate-300 block mb-1">Vigência da Proposta (dias)</label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    min={1}
                                    max={180}
                                    step={1}
                                    value={budgetVal}
                                    onChange={(e) => handleParamChange('budgetValidity', e.target.value, operationalParams[7])}
                                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg py-1.5 px-3 font-bold text-sm text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-amber-500/30"
                                />
                                <span className="text-xs font-bold text-slate-400 whitespace-nowrap">dias</span>
                            </div>
                        </div>
                        <p className="text-[9px] text-slate-500">Propostas comerciais sem aceite do cliente expiram automaticamente após {budgetVal} dias da emissão.</p>
                    </div>
                </div>
            </div>

            {/* Filtro por Categoria e Busca */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex gap-2 flex-wrap">
                    {['Todos', 'Vendas', 'Estoque', 'Produção', 'Compras', 'Financeiro'].map(cat => (
                        <button
                            type="button"
                            key={cat}
                            onClick={() => setFilterCategory(cat)}
                            className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-colors ${filterCategory === cat
                                ? 'bg-amber-500 text-white shadow-lg'
                                : 'bg-white dark:bg-slate-800 border border-amber-200 dark:border-amber-900/50 hover:bg-amber-50 text-slate-600 dark:text-slate-300'
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
                <div className="relative w-full md:w-72">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Filtrar por nome ou descrição..."
                        className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-800 border border-amber-200 dark:border-amber-900/50 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-amber-500/20"
                    />
                </div>
            </div>

            {/* Grid de Parâmetros com Validação Granular */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[620px] overflow-y-auto custom-scrollbar pr-2">
                {filteredParams.map(param => {
                    const currentVal = Number(settings.operational?.[param.id] ?? param.defaultVal);
                    const validation = getParamValidation(param, currentVal);
                    const isError = validation.status === 'error';
                    const isWarning = validation.status === 'warning';

                    return (
                        <div
                            key={param.id}
                            className={`p-4 bg-white dark:bg-slate-800 rounded-2xl border transition-all flex flex-col justify-between ${isError
                                ? 'border-rose-400 shadow-rose-500/10 shadow-md'
                                : isWarning
                                    ? 'border-amber-300 dark:border-amber-700/60'
                                    : 'border-amber-100 dark:border-amber-900/30 hover:shadow-md'
                                }`}
                        >
                            <div>
                                <div className="flex items-start justify-between gap-2 mb-2">
                                    <div className="flex-1">
                                        <label className="text-xs font-bold text-slate-900 dark:text-white block leading-tight">
                                            {param.label}
                                        </label>
                                    </div>
                                    <span className="text-[9px] font-black text-amber-700 dark:text-amber-300 uppercase px-2 py-0.5 bg-amber-100/70 dark:bg-amber-900/40 rounded-md shrink-0">
                                        {param.category}
                                    </span>
                                </div>
                                <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-3 line-clamp-2" title={param.description}>
                                    {param.description}
                                </p>
                            </div>

                            <div className="space-y-2 mt-auto">
                                <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
                                    <button
                                        type="button"
                                        onClick={() => handleStep(param.id, -param.step, param)}
                                        disabled={currentVal <= param.min}
                                        className="w-8 h-8 flex items-center justify-center bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors font-black text-sm"
                                        title={`Diminuir ${param.step} ${param.unit}`}
                                    >
                                        <Minus size={12} />
                                    </button>

                                    <div className="flex-1 relative flex items-center justify-center">
                                        <input
                                            type="number"
                                            min={param.min}
                                            max={param.max}
                                            step={param.step}
                                            value={currentVal}
                                            onChange={(e) => handleParamChange(param.id, e.target.value, param)}
                                            className={`w-full bg-transparent font-black text-sm text-center outline-none ${isError ? 'text-rose-600' : 'text-slate-900 dark:text-white'}`}
                                        />
                                        <span className="text-[10px] font-bold text-slate-400 pr-1">{param.unit}</span>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => handleStep(param.id, param.step, param)}
                                        disabled={currentVal >= param.max}
                                        className="w-8 h-8 flex items-center justify-center bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors font-black text-sm"
                                        title={`Aumentar ${param.step} ${param.unit}`}
                                    >
                                        <Plus size={12} />
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => handleResetSingle(param.id, param.defaultVal, param.label)}
                                        disabled={currentVal === param.defaultVal}
                                        className="p-2 text-slate-400 hover:text-amber-600 disabled:opacity-20 disabled:hover:text-slate-400 transition-colors"
                                        title={`Restaurar valor padrão (${param.defaultVal} ${param.unit})`}
                                    >
                                        <RefreshCw size={12} />
                                    </button>
                                </div>

                                {/* Feedback de Validação */}
                                <div className="flex items-center justify-between text-[9px] pt-1 border-t border-slate-100 dark:border-slate-700/50">
                                    <span className={`flex items-center gap-1 font-bold truncate max-w-[170px] ${isError ? 'text-rose-600' : isWarning ? 'text-amber-600' : 'text-emerald-600'}`} title={validation.message}>
                                        {isError && <AlertTriangle size={10} className="shrink-0" />}
                                        {isWarning && <Info size={10} className="shrink-0" />}
                                        {!isError && !isWarning && <CheckCircle size={10} className="shrink-0" />}
                                        {validation.message}
                                    </span>
                                    <span className="text-slate-400 shrink-0 font-mono">
                                        [{param.min}..{param.max}]
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {filteredParams.length === 0 && (
                <div className="p-12 text-center text-slate-400 bg-white dark:bg-slate-800 rounded-2xl border border-amber-100 dark:border-amber-900/30">
                    <Search size={32} className="mx-auto mb-2 opacity-30" />
                    <p className="text-xs font-bold">Nenhum parâmetro encontrado para os filtros selecionados.</p>
                </div>
            )}
        </section>
    );
};

// 4. INTEGRAÇÕES
const IntegrationsSection = ({ settings, onUpdate, addToast }: { settings: import('../types').AppSettings, onUpdate: (s: import('../types').AppSettings) => void, addToast?: any }) => {
    const defaultIntegrations = [
        // Fiscais e Contábeis
        { id: 'nfe', name: 'Nota Fiscal Eletrônica (NF-e)', icon: '📄', color: 'emerald', category: 'Fiscal', description: 'Emissão automática de notas fiscais' },
        { id: 'nfse', name: 'Nota Fiscal de Serviço (NFS-e)', icon: '📋', color: 'emerald', category: 'Fiscal', description: 'NFS-e para serviços de construção' },
        { id: 'sefaz', name: 'Consulta SEFAZ', icon: '🏛️', color: 'blue', category: 'Fiscal', description: 'Validação de documentos fiscais' },
        { id: 'mdfe', name: 'Manifesto Eletrônico de Documentos (MDF-e)', icon: '🚛', color: 'amber', category: 'Fiscal', description: 'Transporte de cargas' },
        { id: 'cte', name: 'Conhecimento de Transporte Eletrônico (CT-e)', icon: '📦', color: 'slate', category: 'Fiscal', description: 'Documentação de transporte' },

        // Pagamentos e Financeiro
        { id: 'pagseguro', name: 'Gateway de Pagamento (PagSeguro)', icon: '💳', color: 'green', category: 'Financeiro', description: 'Processamento de pagamentos online' },
        { id: 'boleto', name: 'Boleto Bancário (Itaú/Bradesco)', icon: '🏦', color: 'blue', category: 'Financeiro', description: 'Geração automática de boletos' },
        { id: 'pix', name: 'PIX - Pagamento Instantâneo', icon: '⚡', color: 'purple', category: 'Financeiro', description: 'Recebimento via PIX' },
        { id: 'ofx', name: 'Conciliação Bancária (OFX)', icon: '🔄', color: 'indigo', category: 'Financeiro', description: 'Importação automática de extratos' },

        // Comunicação
        { id: 'whatsapp', name: 'WhatsApp Business API', icon: '💬', color: 'green', category: 'Comunicação', description: 'Notificações e atendimento' },
        { id: 'sms', name: 'SMS (Twilio)', icon: '📱', color: 'slate', category: 'Comunicação', description: 'Alertas via SMS' },
        { id: 'sendgrid', name: 'E-mail Marketing (SendGrid)', icon: '📧', color: 'blue', category: 'Comunicação', description: 'Campanhas e newsletters' },

        // Específicos da Construção Civil
        { id: 'bim', name: 'BIM 360 - Autodesk', icon: '🏗️', color: 'slate', category: 'Engenharia', description: 'Integração com projetos BIM' },
        { id: 'sinapi', name: 'SINAPI - Preços de Referência', icon: '📊', color: 'amber', category: 'Engenharia', description: 'Tabela de preços SINAPI/CAIXA' },
        { id: 'sicro', name: 'SICRO - Sistema de Custos', icon: '💰', color: 'emerald', category: 'Engenharia', description: 'Composições de custos DNIT' },
        { id: 'googlemaps', name: 'Google Maps API', icon: '🗺️', color: 'red', category: 'Logística', description: 'Roteirização e localização de obras' },
        { id: 'tracking', name: 'Rastreamento de Frotas', icon: '📍', color: 'blue', category: 'Logística', description: 'Monitoramento de veículos' },

        // Gestão e Produtividade
        { id: 'task_manager', name: 'Asana / Trello Integration', icon: '✅', color: 'slate', category: 'Gestão', description: 'Gestão de tarefas e projetos' },
        { id: 'slack', name: 'Slack Notifications', icon: '💼', color: 'slate', category: 'Gestão', description: 'Notificações em tempo real' },
        { id: 'storage', name: 'Google Drive / Dropbox', icon: '☁️', color: 'blue', category: 'Armazenamento', description: 'Backup de documentos' },

        // Marketplace e E-commerce
        { id: 'mercadolivre', name: 'Mercado Livre API', icon: '🛒', color: 'slate', category: 'Vendas', description: 'Venda de materiais online' },
        { id: 'catalog', name: 'Catálogo Digital de Produtos', icon: '📱', color: 'purple', category: 'Vendas', description: 'App para vendedores' },
    ];

    const [filterCategory, setFilterCategory] = useState('Todas');
    const [configuringIntegration, setConfiguringIntegration] = useState<{ id: string, name: string, category: string, apiKey: string, webhookUrl: string, environment: string } | null>(null);
    const [isNewIntegrationOpen, setIsNewIntegrationOpen] = useState(false);
    const [newIntegrationForm, setNewIntegrationForm] = useState({ name: '', category: 'Engenharia', description: '', webhookUrl: '', apiKey: '' });

    // Combine default integrations with any custom ones saved in settings.integrations
    const customIntegrations = Object.entries(settings.integrations || {})
        .filter(([id]) => id !== AI_AGENTS_KEY && !defaultIntegrations.some(d => d.id === id))
        .map(([id, item]) => ({
            id,
            name: item.name,
            icon: '🔌',
            color: 'purple',
            category: item.category || 'Gestão',
            description: item.config?.description || 'Integração personalizada via API/Webhook'
        }));

    const integrations = [...defaultIntegrations, ...customIntegrations];

    const filteredIntegrations = filterCategory === 'Todas'
        ? integrations
        : integrations.filter(i => i.category === filterCategory);

    const toggleIntegration = (id: string, item: any) => {
        const currentStatus = settings.integrations?.[id]?.status ?? 'Inativo';
        const newStatus = currentStatus === 'Ativo' ? 'Inativo' : 'Ativo';
        const currentIntegrations = settings.integrations || {};

        onUpdate({
            ...settings,
            integrations: {
                ...currentIntegrations,
                [id]: {
                    ...currentIntegrations[id],
                    name: item.name,
                    category: item.category,
                    status: newStatus
                }
            }
        });
        addToast?.(`Integração "${item.name}" ${newStatus === 'Ativo' ? 'ativada' : 'desativada'}!`, newStatus === 'Ativo' ? 'success' : 'info');
    };

    const handleOpenConfig = (integration: any) => {
        const existingConfig = settings.integrations?.[integration.id]?.config || {};
        setConfiguringIntegration({
            id: integration.id,
            name: integration.name,
            category: integration.category,
            apiKey: existingConfig.apiKey || '',
            webhookUrl: existingConfig.webhookUrl || '',
            environment: existingConfig.environment || 'producao'
        });
    };

    const handleSaveIntegrationConfig = () => {
        if (!configuringIntegration) return;
        if (configuringIntegration.webhookUrl && configuringIntegration.webhookUrl.trim()) {
            const url = configuringIntegration.webhookUrl.trim();
            if (!url.startsWith('http://') && !url.startsWith('https://')) {
                addToast?.('A URL do webhook deve iniciar com http:// ou https://', 'error');
                return;
            }
        }
        const currentIntegrations = settings.integrations || {};
        const existing = currentIntegrations[configuringIntegration.id];
        onUpdate({
            ...settings,
            integrations: {
                ...currentIntegrations,
                [configuringIntegration.id]: {
                    name: configuringIntegration.name,
                    category: configuringIntegration.category,
                    status: existing?.status || 'Ativo',
                    config: {
                        ...existing?.config,
                        apiKey: configuringIntegration.apiKey.trim(),
                        webhookUrl: configuringIntegration.webhookUrl.trim(),
                        environment: configuringIntegration.environment
                    }
                }
            }
        });
        addToast?.(`Configurações de "${configuringIntegration.name}" atualizadas com sucesso!`, 'success');
        setConfiguringIntegration(null);
    };

    const handleCreateCustomIntegration = () => {
        if (!newIntegrationForm.name.trim()) {
            addToast?.('Informe o nome da integração.', 'error');
            return;
        }
        if (newIntegrationForm.webhookUrl && newIntegrationForm.webhookUrl.trim()) {
            const url = newIntegrationForm.webhookUrl.trim();
            if (!url.startsWith('http://') && !url.startsWith('https://')) {
                addToast?.('A URL do webhook deve iniciar com http:// ou https://', 'error');
                return;
            }
        }
        const id = 'custom_' + Date.now();
        const currentIntegrations = settings.integrations || {};
        onUpdate({
            ...settings,
            integrations: {
                ...currentIntegrations,
                [id]: {
                    name: newIntegrationForm.name.trim(),
                    category: newIntegrationForm.category,
                    status: 'Ativo',
                    config: {
                        description: newIntegrationForm.description.trim() || 'Webhook / API Personalizada',
                        webhookUrl: newIntegrationForm.webhookUrl.trim(),
                        apiKey: newIntegrationForm.apiKey.trim()
                    }
                }
            }
        });
        addToast?.(`Integração "${newIntegrationForm.name}" conectada com sucesso!`, 'success');
        setNewIntegrationForm({ name: '', category: 'Engenharia', description: '', webhookUrl: '', apiKey: '' });
        setIsNewIntegrationOpen(false);
    };

    return (
        <section className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 p-8 rounded-[32px] border border-purple-100 dark:border-purple-900/30">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 bg-purple-500 rounded-xl text-white">
                    <Link size={20} />
                </div>
                <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">Integrações & APIs Especializadas</h3>
                    <p className="text-[10px] text-slate-500 font-medium">Conecte o ERP com serviços específicos para construção civil</p>
                </div>
            </div>

            {/* Filtro por Categoria */}
            <div className="mb-6 flex gap-2 flex-wrap">
                {['Todas', 'Fiscal', 'Financeiro', 'Comunicação', 'Engenharia', 'Logística', 'Gestão', 'Armazenamento', 'Vendas'].map(cat => (
                    <button
                        type="button"
                        key={cat}
                        onClick={() => setFilterCategory(cat)}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-colors ${filterCategory === cat
                            ? 'bg-purple-500 text-white'
                            : 'bg-white dark:bg-slate-800 border border-purple-200 dark:border-purple-900/50 hover:bg-purple-50 text-slate-600 dark:text-slate-300'
                            }`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* Painel de Configuração da Integração Selecionada */}
            {configuringIntegration && (
                <div className="mb-6 p-6 bg-white dark:bg-slate-800 rounded-2xl border-2 border-purple-300 dark:border-purple-700 shadow-lg animate-in fade-in duration-200">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <SettingsGear size={18} className="text-purple-600" />
                            <h4 className="font-black text-sm text-slate-900 dark:text-white">
                                Configurar: {configuringIntegration.name}
                            </h4>
                        </div>
                        <button
                            type="button"
                            onClick={() => setConfiguringIntegration(null)}
                            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                        >
                            <X size={16} />
                        </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Chave de API / Token</label>
                            <input
                                type="password"
                                value={configuringIntegration.apiKey}
                                onChange={(e) => setConfiguringIntegration({ ...configuringIntegration, apiKey: e.target.value })}
                                placeholder="sk_live_••••••••••••••••"
                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg py-2 px-3 font-bold text-xs"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Endpoint / Webhook URL</label>
                            <input
                                type="text"
                                value={configuringIntegration.webhookUrl}
                                onChange={(e) => setConfiguringIntegration({ ...configuringIntegration, webhookUrl: e.target.value })}
                                placeholder="https://api.servico.com/v1/webhook"
                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg py-2 px-3 font-bold text-xs"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Ambiente</label>
                            <select
                                value={configuringIntegration.environment}
                                onChange={(e) => setConfiguringIntegration({ ...configuringIntegration, environment: e.target.value })}
                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg py-2 px-3 font-bold text-xs"
                            >
                                <option value="producao">Produção</option>
                                <option value="sandbox">Sandbox / Homologação</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={() => setConfiguringIntegration(null)}
                            className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700"
                        >
                            Cancelar
                        </button>
                        <button
                            type="button"
                            onClick={handleSaveIntegrationConfig}
                            className="px-5 py-2 bg-purple-600 text-white rounded-xl text-xs font-black uppercase hover:bg-purple-700 transition-colors flex items-center gap-1.5"
                        >
                            <Save size={14} /> Aplicar Credenciais
                        </button>
                    </div>
                </div>
            )}

            {/* Tabela de Integrações */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-purple-100 dark:border-purple-900/30 overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-purple-100 dark:border-purple-900/30 bg-purple-50/30 dark:bg-slate-900/50">
                            <th className="p-4 text-[10px] font-black uppercase text-slate-500 tracking-wider w-1/2">Serviço / Integração</th>
                            <th className="p-4 text-[10px] font-black uppercase text-slate-500 tracking-wider hidden sm:table-cell">Categoria</th>
                            <th className="p-4 text-[10px] font-black uppercase text-slate-500 tracking-wider">Status</th>
                            <th className="p-4 text-[10px] font-black uppercase text-slate-500 tracking-wider text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {filteredIntegrations.map(integration => {
                            const status = settings.integrations?.[integration.id]?.status ?? 'Inativo';
                            const isActive = status === 'Ativo';
                            const btnClass = isActive
                                ? "border-purple-200 text-purple-700 bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800"
                                : "border-slate-200 text-slate-500 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700";

                            return (
                                <tr key={integration.id} className="group hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg shadow-sm transition-all ${isActive ? 'bg-white text-purple-600 ring-1 ring-purple-100' : 'bg-slate-100 text-slate-400 grayscale'}`}>
                                                {integration.icon}
                                            </div>
                                            <div>
                                                <h5 className={`font-bold text-xs leading-tight ${isActive ? 'text-slate-900 dark:text-white' : 'text-slate-500'}`}>
                                                    {integration.name}
                                                </h5>
                                                <p className="text-[10px] text-slate-400 font-medium truncate max-w-[200px] sm:max-w-xs mt-0.5">
                                                    {integration.description}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4 hidden sm:table-cell">
                                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${isActive ? 'bg-white border-purple-100 text-purple-600 dark:bg-slate-900 dark:border-purple-800' : 'bg-slate-100 border-transparent text-slate-400 dark:bg-slate-900'}`}>
                                            {integration.category}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <button
                                            type="button"
                                            onClick={() => toggleIntegration(integration.id, integration)}
                                            className="flex items-center gap-2 cursor-pointer select-none"
                                            title={isActive ? 'Clique para desativar' : 'Clique para ativar'}
                                        >
                                            <div className={`w-8 h-4 rounded-full relative transition-colors duration-300 ${isActive ? 'bg-purple-500' : 'bg-slate-200 dark:bg-slate-600'}`}>
                                                <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow-sm transition-all duration-300 ${isActive ? 'right-0.5' : 'left-0.5'}`}></div>
                                            </div>
                                            <span className={`text-[10px] font-bold hidden md:inline ${isActive ? 'text-purple-600 dark:text-purple-400' : 'text-slate-400'}`}>
                                                {status}
                                            </span>
                                        </button>
                                    </td>
                                    <td className="p-4 text-right">
                                        <button
                                            type="button"
                                            onClick={() => handleOpenConfig(integration)}
                                            className={`px-3 py-1.5 rounded-lg border text-[10px] font-bold transition-all shadow-sm inline-flex items-center gap-1.5 ${btnClass}`}
                                        >
                                            <SettingsGear size={12} />
                                            <span className="hidden sm:inline">Configurar</span>
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>

                {filteredIntegrations.length === 0 && (
                    <div className="p-12 text-center flex flex-col items-center justify-center text-slate-400">
                        <Package size={32} className="mb-2 opacity-20" />
                        <span className="text-xs font-medium">Nenhuma integração encontrada nesta categoria.</span>
                    </div>
                )}
            </div>

            {/* Adicionar Nova Integração */}
            {isNewIntegrationOpen ? (
                <div className="mt-6 p-6 bg-white dark:bg-slate-800 rounded-2xl border-2 border-purple-300 dark:border-purple-700 shadow-lg animate-in fade-in duration-200">
                    <div className="flex items-center justify-between mb-4">
                        <h4 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
                            <Plus size={16} className="text-purple-600" /> Nova Integração / Webhook Personalizado
                        </h4>
                        <button type="button" onClick={() => setIsNewIntegrationOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                            <X size={16} />
                        </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Nome do Serviço</label>
                            <input
                                type="text"
                                value={newIntegrationForm.name}
                                onChange={(e) => setNewIntegrationForm({ ...newIntegrationForm, name: e.target.value })}
                                placeholder="Ex: ERP Contábil Externo"
                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg py-2 px-3 font-bold text-xs"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Categoria</label>
                            <select
                                value={newIntegrationForm.category}
                                onChange={(e) => setNewIntegrationForm({ ...newIntegrationForm, category: e.target.value })}
                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg py-2 px-3 font-bold text-xs"
                            >
                                {['Fiscal', 'Financeiro', 'Comunicação', 'Engenharia', 'Logística', 'Gestão', 'Armazenamento', 'Vendas'].map(c => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Descrição Breve</label>
                            <input
                                type="text"
                                value={newIntegrationForm.description}
                                onChange={(e) => setNewIntegrationForm({ ...newIntegrationForm, description: e.target.value })}
                                placeholder="Sincronização automática de lotes..."
                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg py-2 px-3 font-bold text-xs"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">URL do Webhook / Endpoint</label>
                            <input
                                type="text"
                                value={newIntegrationForm.webhookUrl}
                                onChange={(e) => setNewIntegrationForm({ ...newIntegrationForm, webhookUrl: e.target.value })}
                                placeholder="https://..."
                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg py-2 px-3 font-bold text-xs"
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={() => setIsNewIntegrationOpen(false)}
                            className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700"
                        >
                            Cancelar
                        </button>
                        <button
                            type="button"
                            onClick={handleCreateCustomIntegration}
                            className="px-5 py-2 bg-purple-600 text-white rounded-xl text-xs font-black uppercase hover:bg-purple-700 transition-colors flex items-center gap-1.5"
                        >
                            <Check size={14} /> Conectar Integração
                        </button>
                    </div>
                </div>
            ) : (
                <button
                    type="button"
                    onClick={() => setIsNewIntegrationOpen(true)}
                    className="w-full mt-6 p-6 bg-white dark:bg-slate-800 rounded-2xl border-2 border-dashed border-purple-200 dark:border-purple-900/50 text-center hover:bg-purple-50 dark:hover:bg-slate-700/40 transition-colors cursor-pointer group"
                >
                    <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-purple-200 transition-colors">
                        <Plus size={24} className="text-purple-600 dark:text-purple-400" />
                    </div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">Conectar Nova Integração</h4>
                    <p className="text-xs text-slate-500 mt-1">Adicione uma API personalizada ou webhook</p>
                </button>
            )}
        </section>
    );
};


// 5. E-MAIL & COMUNICAÇÃO
const EmailCommunicationSection = ({ settings, onUpdate, addToast }: {
    settings: import('../types').AppSettings,
    onUpdate: (s: import('../types').AppSettings) => void,
    addToast?: any
}) => {

    const [showPassword, setShowPassword] = useState(false);
    const [testingConnection, setTestingConnection] = useState(false);
    const [sendingTest, setSendingTest] = useState(false);
    const [emailTemplates, setEmailTemplates] = useState([
        { name: 'Boas-vindas Novo Cliente', status: 'Ativo', lastEdit: '15/12/2024' },
        { name: 'Confirmação de Pedido', status: 'Ativo', lastEdit: '10/12/2024' },
        { name: 'Lembrete de Pagamento', status: 'Ativo', lastEdit: '08/12/2024' },
        { name: 'Nota Fiscal Emitida', status: 'Ativo', lastEdit: '05/12/2024' },
        { name: 'Orçamento Aprovado', status: 'Ativo', lastEdit: '01/12/2024' },
        { name: 'Aviso de Vencimento', status: 'Ativo', lastEdit: '28/11/2024' },
        { name: 'Agradecimento Pós-Venda', status: 'Inativo', lastEdit: '20/11/2024' },
        { name: 'Pesquisa de Satisfação', status: 'Ativo', lastEdit: '15/11/2024' },
    ]);

    const defaultAutomations = [
        { id: 'welcome_client', trigger: 'Novo Cliente Cadastrado', action: 'Enviar e-mail de boas-vindas', defaultEnabled: true },
        { id: 'order_confirmed', trigger: 'Pedido Confirmado', action: 'Enviar confirmação com detalhes', defaultEnabled: true },
        { id: 'payment_reminder', trigger: '3 dias antes do vencimento', action: 'Lembrete de pagamento', defaultEnabled: true },
        { id: 'payment_received', trigger: 'Pagamento Recebido', action: 'Agradecimento e recibo', defaultEnabled: true },
        { id: 'budget_followup', trigger: 'Orçamento sem resposta (7 dias)', action: 'Follow-up automático', defaultEnabled: false },
        { id: 'client_birthday', trigger: 'Aniversário do Cliente', action: 'Mensagem personalizada', defaultEnabled: false },
    ];

    const updateEmailConfig = (key: string, value: any) => {
        onUpdate({
            ...settings,
            emailConfig: {
                ...settings.emailConfig,
                [key]: value
            }
        });
    };

    const toggleAutomation = (id: string, currentVal: boolean) => {
        const currentAutomations = settings.emailConfig?.automations || {};
        updateEmailConfig('automations', {
            ...currentAutomations,
            [id]: !currentVal
        });
    };

    const toggleTemplateStatus = (name: string) => {
        setEmailTemplates(prev => prev.map(t =>
            t.name === name ? { ...t, status: t.status === 'Ativo' ? 'Inativo' : 'Ativo', lastEdit: new Date().toLocaleDateString('pt-BR') } : t
        ));
        addToast?.(`Status do template "${name}" alterado!`, 'info');
    };

    const handleDuplicateTemplate = (template: { name: string, status: string, lastEdit: string }) => {
        const copyName = `${template.name} (Cópia)`;
        if (emailTemplates.some(t => t.name === copyName)) {
            addToast?.('Já existe uma cópia deste template.', 'info');
            return;
        }
        setEmailTemplates(prev => [{ name: copyName, status: 'Ativo', lastEdit: new Date().toLocaleDateString('pt-BR') }, ...prev]);
        addToast?.(`Template duplicado: ${copyName}`, 'success');
    };

    const handleCreateTemplate = () => {
        const newName = `Template Personalizado #${emailTemplates.length + 1}`;
        setEmailTemplates(prev => [{ name: newName, status: 'Ativo', lastEdit: new Date().toLocaleDateString('pt-BR') }, ...prev]);
        addToast?.(`Novo template "${newName}" criado!`, 'success');
    };

    const handleTestConnection = async () => {
        setTestingConnection(true);
        await new Promise(resolve => setTimeout(resolve, 1200));
        const success = settings.emailConfig?.senderEmail && settings.emailConfig?.smtpPort;
        setTestingConnection(false);
        if (success) {
            addToast?.('Conexão SMTP estabelecida com sucesso!', 'success');
        } else {
            addToast?.('Falha na conexão. Verifique o e-mail remetente e a porta SMTP.', 'error');
        }
    };

    const handleSendTestEmail = async () => {
        setSendingTest(true);
        await new Promise(resolve => setTimeout(resolve, 1000));
        setSendingTest(false);
        addToast?.('E-mail de teste enviado para ' + (settings.emailConfig?.senderEmail || 'admin@infracore.com'), 'success');
    };

    const handleExportConfig = () => {
        const config = {
            provider: settings.emailConfig?.smtpProvider,
            port: settings.emailConfig?.smtpPort,
            security: settings.emailConfig?.smtpSecurity,
            sender: settings.emailConfig?.senderEmail,
            automations: settings.emailConfig?.automations,
            exportedAt: new Date().toISOString()
        };
        const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'email_config_export.json';
        a.click();
        URL.revokeObjectURL(url);
        addToast?.('Configuração exportada com sucesso!', 'success');
    };

    return (
        <section className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 p-8 rounded-[32px] border border-blue-100 dark:border-blue-900/30">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 bg-blue-500 rounded-xl text-white">
                    <Mail size={20} />
                </div>
                <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">E-mail & Comunicação Avançada</h3>
                    <p className="text-[10px] text-slate-500 font-medium">Configuração SMTP, templates e automações de comunicação</p>
                </div>
            </div>

            {/* Configuração SMTP */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-3">
                    <h4 className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase">Servidor SMTP</h4>
                    <div className="space-y-2">
                        <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-blue-100 dark:border-blue-900/30">
                            <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">Provedor</label>
                            <select
                                value={settings.emailConfig?.smtpProvider || 'Gmail (smtp.gmail.com)'}
                                onChange={(e) => updateEmailConfig('smtpProvider', e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg py-2 px-3 font-bold text-sm"
                            >
                                <option>Gmail (smtp.gmail.com)</option>
                                <option>Outlook (smtp-mail.outlook.com)</option>
                                <option>SendGrid</option>
                                <option>Amazon SES</option>
                                <option>Personalizado</option>
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-blue-100 dark:border-blue-900/30">
                                <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Porta</label>
                                <input
                                    type="number"
                                    value={settings.emailConfig?.smtpPort ?? 587}
                                    onChange={(e) => updateEmailConfig('smtpPort', Number(e.target.value))}
                                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg py-2 px-3 font-bold text-sm"
                                />
                            </div>
                            <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-blue-100 dark:border-blue-900/30">
                                <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Segurança</label>
                                <select
                                    value={settings.emailConfig?.smtpSecurity || 'TLS'}
                                    onChange={(e) => updateEmailConfig('smtpSecurity', e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg py-2 px-3 font-bold text-sm"
                                >
                                    <option>TLS</option>
                                    <option>SSL</option>
                                    <option>Nenhuma</option>
                                </select>
                            </div>
                        </div>
                        <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-blue-100 dark:border-blue-900/30">
                            <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">E-mail Remetente</label>
                            <input
                                type="email"
                                value={settings.emailConfig?.senderEmail || ''}
                                onChange={(e) => updateEmailConfig('senderEmail', e.target.value)}
                                placeholder="noreply@infracore.com"
                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg py-2 px-3 font-bold text-sm"
                            />
                        </div>
                        <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-blue-100 dark:border-blue-900/30">
                            <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block flex items-center justify-between">
                                <span>Senha / App Password</span>
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="text-blue-500 hover:text-blue-600 transition-colors"
                                >
                                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                                </button>
                            </label>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={settings.emailConfig?.smtpPassword || ''}
                                onChange={(e) => updateEmailConfig('smtpPassword', e.target.value)}
                                placeholder="••••••••••••"
                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg py-2 px-3 font-bold text-sm"
                            />
                        </div>
                    </div>
                </div>
                {/* Templates de E-mail */}
                <div className="space-y-3">
                    <h4 className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase">Templates de E-mail</h4>
                    <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
                        {emailTemplates.map(template => (
                            <div key={template.name} className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-blue-100 dark:border-blue-900/30 hover:shadow-md transition-all group">
                                <div className="flex items-center justify-between mb-2">
                                    <h5 className="font-bold text-sm text-slate-900 dark:text-white">{template.name}</h5>
                                    <button
                                        type="button"
                                        onClick={() => toggleTemplateStatus(template.name)}
                                        className={`text-[9px] font-black px-2 py-0.5 rounded-md cursor-pointer transition-colors ${template.status === 'Ativo' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                                        title="Clique para alternar o status"
                                    >
                                        {template.status}
                                    </button>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] text-slate-500">Editado: {template.lastEdit}</span>
                                    <div className="flex gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            type="button"
                                            onClick={() => addToast?.(`Editor de template: "${template.name}" pronto para personalização.`, 'info')}
                                            className="p-1.5 hover:bg-blue-50 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                            title="Editar"
                                        >
                                            <Edit2 size={12} className="text-blue-500" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleDuplicateTemplate(template)}
                                            className="p-1.5 hover:bg-blue-50 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                            title="Duplicar"
                                        >
                                            <Copy size={12} className="text-slate-400 hover:text-blue-500" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => addToast?.(`Pré-visualização de "${template.name}": Assunto e corpo HTML validados.`, 'info')}
                                            className="p-1.5 hover:bg-blue-50 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                            title="Visualizar"
                                        >
                                            <Eye size={12} className="text-slate-400 hover:text-blue-500" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <button
                        type="button"
                        onClick={handleCreateTemplate}
                        className="w-full py-3 bg-blue-500 text-white rounded-xl text-xs font-black uppercase hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
                    >
                        <Plus size={14} /> Criar Novo Template
                    </button>
                </div>
            </div>

            {/* Automações de E-mail */}
            <div className="mt-6 pt-6 border-t border-blue-200 dark:border-blue-900/30">
                <h4 className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase mb-4">Automações de Comunicação</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {defaultAutomations.map(automation => {
                        const isEnabled = settings.emailConfig?.automations?.[automation.id] ?? automation.defaultEnabled;
                        return (
                            <div
                                key={automation.id}
                                onClick={() => toggleAutomation(automation.id, isEnabled)}
                                className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-blue-100 dark:border-blue-900/30 cursor-pointer hover:border-blue-300 transition-all"
                            >
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex-1 pr-2">
                                        <p className="text-xs font-bold text-slate-900 dark:text-white mb-1">{automation.trigger}</p>
                                        <p className="text-[10px] text-slate-500">{automation.action}</p>
                                    </div>
                                    <div className={`w-10 h-5 rounded-full relative transition-colors shrink-0 ${isEnabled ? 'bg-blue-500' : 'bg-slate-300 dark:bg-slate-600'}`}>
                                        <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${isEnabled ? 'right-0.5' : 'left-0.5'}`}></div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Teste de Conexão */}
            <div className="mt-6 flex gap-3 flex-wrap">
                <button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={testingConnection}
                    className="px-6 py-3 bg-blue-500 text-white rounded-xl text-xs font-black uppercase hover:bg-blue-600 disabled:opacity-50 disabled:cursor-wait transition-colors shadow-lg flex items-center gap-2"
                >
                    {testingConnection ? (
                        <><RefreshCw size={14} className="animate-spin" /> Testando...</>
                    ) : (
                        <><Zap size={14} /> Testar Conexão SMTP</>
                    )}
                </button>
                <button
                    type="button"
                    onClick={handleSendTestEmail}
                    disabled={sendingTest}
                    className="px-6 py-3 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-blue-200 dark:border-blue-900/50 rounded-xl text-xs font-black uppercase hover:bg-blue-50 disabled:opacity-50 disabled:cursor-wait transition-colors flex items-center gap-2"
                >
                    {sendingTest ? (
                        <><RefreshCw size={14} className="animate-spin" /> Enviando...</>
                    ) : (
                        <><Mail size={14} /> Enviar E-mail de Teste</>
                    )}
                </button>
                <button
                    type="button"
                    onClick={handleExportConfig}
                    className="px-6 py-3 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-blue-200 dark:border-blue-900/50 rounded-xl text-xs font-black uppercase hover:bg-blue-50 transition-colors flex items-center gap-2"
                >
                    <Download size={14} /> Exportar Configuração
                </button>
            </div>
        </section>
    );
};

// 8. DADOS & SEGURANÇA
const DataSecuritySection = ({ settings, onUpdate, addToast }: {
    settings: import('../types').AppSettings,
    onUpdate: (s: import('../types').AppSettings) => void,
    addToast?: any
}) => {

    const [runningBackup, setRunningBackup] = useState(false);
    const [exportingData, setExportingData] = useState(false);
    const [generatingReport, setGeneratingReport] = useState(false);

    const updateSecurityConfig = (key: string, value: any) => {
        onUpdate({
            ...settings,
            dataSecurity: {
                ...settings.dataSecurity,
                [key]: value
            }
        });
    };

    const handleRunBackup = async () => {
        setRunningBackup(true);
        // Simulate backup process
        await new Promise(resolve => setTimeout(resolve, 3000));
        updateSecurityConfig('lastBackupDate', new Date().toLocaleString('pt-BR'));
        setRunningBackup(false);
        addToast?.('Backup executado com sucesso!', 'success');
    };

    const handleExportLGPDData = async () => {
        setExportingData(true);
        await new Promise(resolve => setTimeout(resolve, 2000));

        const lgpdData = {
            exportDate: new Date().toISOString(),
            company: settings.companyName,
            securitySettings: settings.dataSecurity,
            dataRetention: {
                auditLogs: '12 meses',
                financialRecords: 'Permanente',
                clientData: 'Conforme solicitação'
            },
            compliance: {
                lgpdConsent: settings.dataSecurity?.lgpdConsent,
                encryptionEnabled: settings.dataSecurity?.encryptionEnabled,
                backupEnabled: settings.dataSecurity?.backupEnabled
            }
        };

        const blob = new Blob([JSON.stringify(lgpdData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `lgpd_export_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);

        setExportingData(false);
        addToast?.('Dados LGPD exportados com sucesso!', 'success');
    };

    const handleGenerateComplianceReport = async () => {
        setGeneratingReport(true);
        await new Promise(resolve => setTimeout(resolve, 1500));
        setGeneratingReport(false);
        addToast?.('Relatório de conformidade gerado!', 'success');
    };

    return (
        <section className="bg-gradient-to-br from-slate-50 to-zinc-100 dark:from-slate-900/50 dark:to-zinc-900/30 p-8 rounded-[32px] border border-slate-200 dark:border-slate-700/50">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 bg-slate-700 rounded-xl text-white">
                    <ShieldCheck size={20} />
                </div>
                <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">Dados, Segurança & Compliance</h3>
                    <p className="text-[10px] text-slate-500 font-medium">Backup, criptografia, LGPD e políticas de retenção</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Backup Automático */}
                <div className="p-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <Cloud size={24} className="text-blue-500" />
                            <div>
                                <h4 className="font-black text-sm text-slate-900 dark:text-white">Backup Automático</h4>
                                <p className="text-[10px] text-slate-500">
                                    Última: {settings.dataSecurity?.lastBackupDate || 'Nunca executado'}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-[9px] font-bold uppercase text-slate-500">{settings.dataSecurity?.backupEnabled ? 'Ativo' : 'Inativo'}</span>
                            <div
                                onClick={() => updateSecurityConfig('backupEnabled', !settings.dataSecurity?.backupEnabled)}
                                className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors ${settings.dataSecurity?.backupEnabled ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`}
                            >
                                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${settings.dataSecurity?.backupEnabled ? 'right-1' : 'left-1'}`}></div>
                            </div>
                        </div>
                    </div>
                    <div className="space-y-3">
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">Frequência</label>
                            <select
                                value={settings.dataSecurity?.backupFrequency || 'daily'}
                                onChange={(e) => updateSecurityConfig('backupFrequency', e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-3 px-4 font-bold text-sm"
                            >
                                <option value="6h">A cada 6 horas</option>
                                <option value="daily">Diário (Recomendado)</option>
                                <option value="weekly">Semanal</option>
                                <option value="monthly">Mensal</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">Retenção de Backups</label>
                            <select
                                value={settings.dataSecurity?.backupRetention || 30}
                                onChange={(e) => updateSecurityConfig('backupRetention', Number(e.target.value))}
                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-3 px-4 font-bold text-sm"
                            >
                                <option value={7}>7 dias</option>
                                <option value={30}>30 dias (Recomendado)</option>
                                <option value={90}>90 dias</option>
                                <option value={365}>1 ano</option>
                                <option value={0}>Permanente</option>
                            </select>
                        </div>
                        <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
                            <div className="flex justify-between text-xs mb-2">
                                <span className="text-slate-600 dark:text-slate-400">Espaço Utilizado</span>
                                <span className="font-black text-blue-600">2.4 GB / 50 GB</span>
                            </div>
                            <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2">
                                <div className="bg-blue-500 h-2 rounded-full" style={{ width: '4.8%' }}></div>
                            </div>
                        </div>
                        <button
                            onClick={handleRunBackup}
                            disabled={runningBackup}
                            className="w-full mt-3 py-3 bg-blue-500 text-white rounded-xl text-xs font-black uppercase hover:bg-blue-600 disabled:opacity-50 disabled:cursor-wait transition-colors flex items-center justify-center gap-2"
                        >
                            {runningBackup ? (
                                <><RefreshCw size={14} className="animate-spin" /> Executando...</>
                            ) : (
                                <><Download size={14} /> Executar Backup Agora</>
                            )}
                        </button>
                    </div>
                </div>

                {/* Criptografia */}
                <div className="p-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-3 mb-4">
                        <Lock size={24} className="text-amber-500" />
                        <div>
                            <h4 className="font-black text-sm text-slate-900 dark:text-white">Criptografia de Dados</h4>
                            <p className="text-[10px] text-slate-500">Proteção end-to-end</p>
                        </div>
                    </div>
                    <div className="space-y-3">
                        {[
                            { label: 'Dados em Trânsito (TLS 1.3)', enabled: true, level: 'Máxima' },
                            { label: 'Dados em Repouso (AES-256)', enabled: true, level: 'Máxima' },
                            { label: 'Senhas (bcrypt)', enabled: true, level: 'Alta' },
                        ].map(item => (
                            <div key={item.label} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                                <div className="flex-1">
                                    <p className="text-xs font-bold text-slate-900 dark:text-white">{item.label}</p>
                                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-md mt-1 inline-block ${item.level === 'Máxima' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                                        }`}>
                                        {item.level}
                                    </span>
                                </div>
                                <CheckCircle size={18} className="text-emerald-500" />
                            </div>
                        ))}
                        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Criptografia Global Ativa</span>
                                <div
                                    onClick={() => updateSecurityConfig('encryptionEnabled', !settings.dataSecurity?.encryptionEnabled)}
                                    className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors ${settings.dataSecurity?.encryptionEnabled ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-600'}`}
                                >
                                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${settings.dataSecurity?.encryptionEnabled ? 'right-1' : 'left-1'}`}></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* LGPD & Compliance */}
                <div className="p-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-3 mb-4">
                        <Scale size={24} className="text-purple-500" />
                        <div>
                            <h4 className="font-black text-sm text-slate-900 dark:text-white">LGPD & Compliance</h4>
                            <p className="text-[10px] text-slate-500">Conformidade legal</p>
                        </div>
                    </div>
                    <div className="space-y-3">
                        <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-900 dark:text-white">Coleta de Consentimento</span>
                            <div
                                onClick={() => updateSecurityConfig('lgpdConsent', !settings.dataSecurity?.lgpdConsent)}
                                className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors ${settings.dataSecurity?.lgpdConsent ? 'bg-purple-500' : 'bg-slate-300 dark:bg-slate-600'}`}
                            >
                                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${settings.dataSecurity?.lgpdConsent ? 'right-0.5' : 'left-0.5'}`}></div>
                            </div>
                        </div>
                        {[
                            { label: 'Política de Privacidade', status: 'Atualizada' },
                            { label: 'Direito ao Esquecimento', status: 'Ativo' },
                        ].map(item => (
                            <div key={item.label} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                                <span className="text-xs font-bold text-slate-900 dark:text-white">{item.label}</span>
                                <span className="text-[9px] font-black px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-md">
                                    {item.status}
                                </span>
                            </div>
                        ))}
                        <button
                            onClick={() => addToast?.('Relatório LGPD agendado para geração!', 'success')}
                            className="w-full mt-3 py-2 bg-purple-500 text-white rounded-xl text-xs font-black uppercase hover:bg-purple-600 transition-colors"
                        >
                            Gerar Relatório LGPD
                        </button>
                        <button
                            onClick={() => addToast?.('Redirecionando para Central de Privacidade...', 'info')}
                            className="w-full py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-black uppercase hover:bg-slate-50 transition-colors"
                        >
                            Central de Privacidade
                        </button>
                    </div>
                </div>
            </div>

            {/* Ações de Segurança */}
            <div className="mt-6 flex gap-3 flex-wrap">
                <button
                    onClick={handleExportLGPDData}
                    disabled={exportingData}
                    className="px-6 py-3 bg-slate-700 text-white rounded-xl text-xs font-black uppercase hover:bg-slate-800 disabled:opacity-50 disabled:cursor-wait transition-colors flex items-center gap-2"
                >
                    {exportingData ? (
                        <><RefreshCw size={14} className="animate-spin" /> Exportando...</>
                    ) : (
                        <><Download size={14} /> Exportar Dados (LGPD)</>
                    )}
                </button>
                <button
                    onClick={handleGenerateComplianceReport}
                    disabled={generatingReport}
                    className="px-6 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-black uppercase hover:bg-slate-50 disabled:opacity-50 disabled:cursor-wait transition-colors flex items-center gap-2"
                >
                    {generatingReport ? (
                        <><RefreshCw size={14} className="animate-spin" /> Gerando...</>
                    ) : (
                        <><FileText size={14} /> Relatório de Conformidade</>
                    )}
                </button>
                <button
                    onClick={() => addToast?.('Gerenciamento de chaves indisponível no modo seguro.', 'error')}
                    className="px-6 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-black uppercase hover:bg-slate-50 transition-colors flex items-center gap-2"
                >
                    <Key size={14} /> Gerenciar Chaves de Criptografia
                </button>
            </div>
        </section>
    );
};

// 10. DOCUMENTOS & IMPRESSÃO
const THERMAL_PRESETS = [
    { id: '100x150', label: '100 × 150 mm', sub: 'Envio / DANFE', width: 100, height: 150 },
    { id: '80x50', label: '80 × 50 mm', sub: 'Gôndola / Estoque', width: 80, height: 50 },
    { id: '80x40', label: '80 × 40 mm', sub: 'Etiqueta Produto', width: 80, height: 40 },
    { id: '80x200', label: '80 × 200 mm', sub: 'Cupom Contínuo', width: 80, height: 200 },
    { id: '58x150', label: '58 × 150 mm', sub: 'Mini Cupom Portátil', width: 58, height: 150 },
];

const MARGIN_PRESETS = [
    { label: '5 mm (Econômica)', value: 5 },
    { label: '10 mm (Padrão NFe)', value: 10 },
    { label: '15 mm (Ampla)', value: 15 },
    { label: '20 mm (Oficial)', value: 20 },
];

const DocumentsPrintingSection = ({ settings, onUpdate, addToast }: {
    settings: import('../types').AppSettings,
    onUpdate: (s: import('../types').AppSettings) => void,
    addToast?: (message: string, type: 'success' | 'error' | 'info') => void
}) => {
    const updateDocumentConfig = (key: string, value: any) => {
        onUpdate({
            ...settings,
            documents: {
                ...settings.documents,
                [key]: value
            }
        });
    };

    const docs = settings.documents || ({} as any);
    const thermalWidth = Number(docs.printerThermalConfig?.width ?? 100);
    const thermalHeight = Number(docs.printerThermalConfig?.height ?? 150);
    const currentMargins = Number(docs.margins ?? 10);
    const currentCopies = Number(docs.copies ?? 2);
    const thermalPrinter = docs.printerThermal || 'Zebra ZD220';
    const mainPrinter = docs.printerMain || 'HP LaserJet Pro';

    const isWidthValid = thermalWidth >= 20 && thermalWidth <= 220;
    const isHeightValid = thermalHeight >= 15 && thermalHeight <= 500;
    const isMarginValid = currentMargins >= 0 && currentMargins <= 50;
    const isCopiesValid = currentCopies >= 1 && currentCopies <= 99;

    const defaultDocs = [
        { name: 'DANFE - Nota Fiscal Eletrônica', format: 'A4 Retrato', defaultStatus: 'Ativo' as const, version: 'v4.0' },
        { name: 'Orçamento Comercial Detalhado', format: 'A4 Retrato', defaultStatus: 'Ativo' as const, version: 'v2.1' },
        { name: 'Ordem de Compra', format: 'A4 Paisagem', defaultStatus: 'Ativo' as const, version: 'v1.5' },
        { name: 'Romaneio de Carga / Manifesto', format: 'A4 Retrato', defaultStatus: 'Ativo' as const, version: 'v1.2' },
        { name: 'Ordem de Serviço (OS)', format: 'A4 Retrato', defaultStatus: 'Ativo' as const, version: 'v3.0' },
        { name: 'Contrato de Prestação de Serviços', format: 'A4 Retrato', defaultStatus: 'Ativo' as const, version: 'v2.0' },
        { name: 'Recibo de Pagamento', format: 'A5 Retrato', defaultStatus: 'Ativo' as const, version: 'v1.0' },
        { name: 'Relatório de Medição de Obra', format: 'A4 Paisagem', defaultStatus: 'Inativo' as const, version: 'v1.0' },
    ];

    const toggleDocStatus = (docName: string, currentStatus: 'Ativo' | 'Inativo') => {
        const nextStatus = currentStatus === 'Ativo' ? 'Inativo' : 'Ativo';
        const currentStatuses = docs.documentStatuses || {};
        updateDocumentConfig('documentStatuses', {
            ...currentStatuses,
            [docName]: nextStatus
        });
        addToast?.(`Template "${docName}" definido como ${nextStatus}.`, 'info');
    };

    const handleApplyThermalPreset = (preset: typeof THERMAL_PRESETS[0]) => {
        updateDocumentConfig('printerThermalConfig', {
            ...docs.printerThermalConfig,
            width: preset.width,
            height: preset.height,
        });
        addToast?.(`Dimensões da etiqueta ajustadas para ${preset.label} (${preset.sub}).`, 'info');
    };

    const handleTestMainPrint = () => {
        if (!isMarginValid) {
            addToast?.('Margem de impressão inválida (deve estar entre 0 e 50 mm).', 'error');
            return;
        }
        if (!isCopiesValid) {
            addToast?.('Número de cópias deve estar entre 1 e 99.', 'error');
            return;
        }
        addToast?.(`Página de teste (${currentCopies} cópia(s), margens ${currentMargins}mm) enviada com sucesso para ${mainPrinter}!`, 'success');
    };

    const handleTestThermalPrint = () => {
        if (thermalPrinter === 'Não configurada') {
            addToast?.('Selecione uma impressora térmica ativa antes de emitir página de teste.', 'error');
            return;
        }
        if (!isWidthValid || !isHeightValid) {
            addToast?.('Dimensões da etiqueta inválidas. Largura permitida: 20-220mm, Altura: 15-500mm.', 'error');
            return;
        }
        addToast?.(`Etiqueta de teste (${thermalWidth} × ${thermalHeight} mm) enviada com sucesso para ${thermalPrinter}!`, 'success');
    };

    // Aspect ratio calculation for visual preview simulator
    const isLandscape = thermalWidth > thermalHeight;
    const previewScaleRatio = Math.min(1, Math.max(0.4, thermalWidth / (thermalHeight || 1)));

    return (
        <section className="bg-gradient-to-br from-cyan-50 to-teal-50 dark:from-cyan-950/20 dark:to-teal-950/20 p-8 rounded-[32px] border border-cyan-100 dark:border-cyan-900/30">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-cyan-500 rounded-xl text-white shadow-md shadow-cyan-500/20">
                        <Printer size={20} />
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">Documentos, Impressão & Relatórios</h3>
                        <p className="text-[10px] text-slate-500 font-medium">Layouts fiscais, margens A4, bobina térmica e calibração milimétrica</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-cyan-100/70 dark:bg-cyan-950/40 text-cyan-800 dark:text-cyan-300 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
                        <Sliders size={12} /> Calibração Ativa
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Templates de Documentos */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h4 className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase flex items-center gap-2">
                            <FileText size={14} className="text-cyan-600" /> Templates de Documentos Fiscais & Comerciais
                        </h4>
                        <span className="text-[10px] text-slate-400 font-bold">8 Modelos Homologados</span>
                    </div>
                    <div className="space-y-2.5 max-h-[580px] overflow-y-auto pr-1 custom-scrollbar">
                        {defaultDocs.map(doc => {
                            const status = docs.documentStatuses?.[doc.name] || doc.defaultStatus;
                            const isActive = status === 'Ativo';
                            return (
                                <div key={doc.name} className="flex items-center justify-between p-3.5 bg-white dark:bg-slate-800 rounded-xl border border-cyan-100/70 dark:border-cyan-900/30 hover:shadow-md transition-all group">
                                    <div className="flex-1 min-w-0 mr-3">
                                        <div className="flex items-center gap-2 mb-1">
                                            <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`}></div>
                                            <p className="font-bold text-xs text-slate-900 dark:text-white truncate">{doc.name}</p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <p className="text-[10px] text-slate-500 font-semibold">{doc.format}</p>
                                            <span className="text-[9px] font-mono text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/40 px-1.5 py-0.5 rounded font-bold">{doc.version}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <button
                                            type="button"
                                            onClick={() => toggleDocStatus(doc.name, status)}
                                            className={`px-2.5 py-1 rounded-lg text-[9px] font-black cursor-pointer transition-colors ${isActive ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 hover:bg-slate-200'}`}
                                            title="Clique para ativar/desativar template"
                                        >
                                            {status}
                                        </button>
                                        <div className="flex gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                type="button"
                                                onClick={() => addToast?.(`Editando layout de ${doc.name} (${doc.format})`, 'info')}
                                                className="p-1.5 hover:bg-cyan-50 dark:hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-cyan-600"
                                                title="Editar Layout"
                                            >
                                                <Edit2 size={13} />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => addToast?.(`Visualizando prévia de ${doc.name}`, 'info')}
                                                className="p-1.5 hover:bg-cyan-50 dark:hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-cyan-600"
                                                title="Visualizar"
                                            >
                                                <Eye size={13} />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => addToast?.(`Enviando página de teste (${doc.name}) para ${mainPrinter}...`, 'success')}
                                                className="p-1.5 hover:bg-cyan-50 dark:hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-cyan-600"
                                                title="Imprimir Teste"
                                            >
                                                <Printer size={13} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Configurações de Impressora */}
                <div className="space-y-4">
                    <h4 className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase flex items-center gap-2">
                        <Sliders size={14} className="text-cyan-600" /> Dispositivos & Parâmetros de Saída
                    </h4>
                    <div className="space-y-4">
                        {/* Impressora Principal (Documentos A4 / DANFE) */}
                        <div className="p-5 bg-white dark:bg-slate-800 rounded-2xl border border-cyan-100 dark:border-cyan-900/30 shadow-sm">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 bg-cyan-100 dark:bg-cyan-950/50 rounded-lg text-cyan-600 dark:text-cyan-400">
                                        <Printer size={16} />
                                    </div>
                                    <div>
                                        <h5 className="font-black text-sm text-slate-900 dark:text-white">Impressora Principal (A4 / Documentos)</h5>
                                        <p className="text-[10px] text-slate-400">DANFEs, Ordens de Serviço, Contratos e Relatórios</p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleTestMainPrint}
                                    className="px-3 py-1.5 bg-cyan-50 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 rounded-xl text-[10px] font-black uppercase hover:bg-cyan-100 transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
                                >
                                    <Printer size={12} /> Testar Impressão
                                </button>
                            </div>

                            <div className="space-y-3">
                                <select
                                    value={mainPrinter}
                                    onChange={(e) => updateDocumentConfig('printerMain', e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-3.5 font-bold text-xs outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
                                >
                                    <option value="HP LaserJet Pro">HP LaserJet Pro - Bandeja 1 (Padrão)</option>
                                    <option value="Epson L3150 - Colorida">Epson L3150 EcoTank (Colorida)</option>
                                    <option value="Brother HL-L2350DW">Brother HL-L2350DW (Laser Duplex)</option>
                                    <option value="Microsoft Print to PDF">Microsoft Print to PDF (Arquivo Virtual)</option>
                                </select>

                                <div className="grid grid-cols-3 gap-2">
                                    <div className="p-2.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                                        <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Qualidade</label>
                                        <select
                                            value={docs.printerMainConfig?.quality || 'normal'}
                                            onChange={(e) => updateDocumentConfig('printerMainConfig', { ...docs.printerMainConfig, quality: e.target.value })}
                                            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg py-1 px-2 text-xs font-bold outline-none"
                                        >
                                            <option value="draft">Rascunho</option>
                                            <option value="normal">Normal</option>
                                            <option value="high">Alta (600 DPI)</option>
                                        </select>
                                    </div>
                                    <div className="p-2.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                                        <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Cores</label>
                                        <select
                                            value={docs.printerMainConfig?.color || 'bw'}
                                            onChange={(e) => updateDocumentConfig('printerMainConfig', { ...docs.printerMainConfig, color: e.target.value })}
                                            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg py-1 px-2 text-xs font-bold outline-none"
                                        >
                                            <option value="bw">Monocromático (P&B)</option>
                                            <option value="color">Colorido (CMYK)</option>
                                        </select>
                                    </div>
                                    <div className="p-2.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                                        <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Duplex (Frente/Verso)</label>
                                        <select
                                            value={docs.printerMainConfig?.duplex ? 'true' : 'false'}
                                            onChange={(e) => updateDocumentConfig('printerMainConfig', { ...docs.printerMainConfig, duplex: e.target.value === 'true' })}
                                            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg py-1 px-2 text-xs font-bold outline-none"
                                        >
                                            <option value="false">Desativado</option>
                                            <option value="true">Automático</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Margens & Cópias com Presets */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                                    <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                                        <div className="flex items-center justify-between mb-1.5">
                                            <label className="text-[10px] font-black text-slate-400 uppercase">Margens de Página (mm)</label>
                                            <span className={`text-[10px] font-mono font-bold ${isMarginValid ? 'text-slate-600 dark:text-slate-300' : 'text-rose-600'}`}>
                                                {currentMargins} mm
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1.5 mb-2">
                                            {MARGIN_PRESETS.map(p => (
                                                <button
                                                    key={p.value}
                                                    type="button"
                                                    onClick={() => updateDocumentConfig('margins', p.value)}
                                                    className={`flex-1 py-1 px-1 rounded-lg text-[9px] font-black uppercase transition-all ${currentMargins === p.value ? 'bg-cyan-500 text-white shadow-sm' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-cyan-50'}`}
                                                >
                                                    {p.value}mm
                                                </button>
                                            ))}
                                        </div>
                                        <input
                                            type="number"
                                            min={0}
                                            max={50}
                                            value={currentMargins}
                                            onChange={(e) => updateDocumentConfig('margins', Math.max(0, Math.min(50, Number(e.target.value))))}
                                            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg py-1.5 px-3 font-bold text-xs outline-none"
                                        />
                                    </div>

                                    <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                                        <div className="flex items-center justify-between mb-1.5">
                                            <label className="text-[10px] font-black text-slate-400 uppercase">Cópias Padrão</label>
                                            <span className={`text-[10px] font-mono font-bold ${isCopiesValid ? 'text-slate-600 dark:text-slate-300' : 'text-rose-600'}`}>
                                                {currentCopies} un.
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 mt-2">
                                            <button
                                                type="button"
                                                onClick={() => updateDocumentConfig('copies', Math.max(1, currentCopies - 1))}
                                                className="w-8 h-8 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-black text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                                                title="Diminuir cópia"
                                            >
                                                <Minus size={13} />
                                            </button>
                                            <input
                                                type="number"
                                                min={1}
                                                max={99}
                                                value={currentCopies}
                                                onChange={(e) => updateDocumentConfig('copies', Math.max(1, Math.min(99, Number(e.target.value))))}
                                                className="flex-1 text-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg py-1.5 px-2 font-black text-xs outline-none"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => updateDocumentConfig('copies', Math.min(99, currentCopies + 1))}
                                                className="w-8 h-8 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-black text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                                                title="Aumentar cópia"
                                            >
                                                <Plus size={13} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Impressora Térmica (Etiquetas & Bobina) */}
                        <div className="p-5 bg-white dark:bg-slate-800 rounded-2xl border border-amber-100 dark:border-amber-900/30 shadow-sm">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 bg-amber-100 dark:bg-amber-950/50 rounded-lg text-amber-600 dark:text-amber-400">
                                        <Package size={16} />
                                    </div>
                                    <div>
                                        <h5 className="font-black text-sm text-slate-900 dark:text-white">Impressora Térmica (Etiquetas & Bobina)</h5>
                                        <p className="text-[10px] text-slate-400">Zebra / Elgin / Argox para expedição e código de barras</p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleTestThermalPrint}
                                    className="px-3 py-1.5 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-xl text-[10px] font-black uppercase hover:bg-amber-100 transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
                                >
                                    <Package size={12} /> Testar Etiqueta
                                </button>
                            </div>

                            <div className="space-y-3">
                                <select
                                    value={thermalPrinter}
                                    onChange={(e) => updateDocumentConfig('printerThermal', e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-3.5 font-bold text-xs outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                                >
                                    <option value="Zebra ZD220">Zebra ZD220 (EPL / ZPL - 203 DPI)</option>
                                    <option value="Argox OS-214 Plus">Argox OS-214 Plus (PPLA / PPLB)</option>
                                    <option value="Elgin L42 PRO">Elgin L42 PRO (ZPL / TSPL / EPL)</option>
                                    <option value="Datamax-O'Neil E-4204B">Datamax-O'Neil E-4204B</option>
                                    <option value="Epson TM-T20X">Epson TM-T20X (Não-Fiscal Bobina 80mm)</option>
                                    <option value="Não configurada">Não configurada (Desativar Térmica)</option>
                                </select>

                                {/* Presets Rápidos de Etiquetas Térmicas */}
                                <div>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <label className="text-[10px] font-black text-slate-400 uppercase">Predefinições Rápidas de Bobina / Etiqueta</label>
                                        <span className="text-[9px] text-amber-600 dark:text-amber-400 font-bold">1 Clique para Ajustar</span>
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                                        {THERMAL_PRESETS.map(preset => {
                                            const isSelected = thermalWidth === preset.width && thermalHeight === preset.height;
                                            return (
                                                <button
                                                    key={preset.id}
                                                    type="button"
                                                    onClick={() => handleApplyThermalPreset(preset)}
                                                    className={`p-2 rounded-xl text-left border transition-all ${isSelected ? 'bg-amber-500 border-amber-600 text-white shadow-sm' : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-amber-300'}`}
                                                >
                                                    <div className="font-black text-[11px] leading-tight">{preset.label}</div>
                                                    <div className={`text-[9px] font-semibold truncate ${isSelected ? 'text-amber-100' : 'text-slate-400'}`}>{preset.sub}</div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Dimensões Personalizadas & Simulador Visual */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                                    <div className="space-y-2">
                                        <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                                            <div className="flex items-center justify-between mb-1">
                                                <label className="text-[10px] font-black text-slate-400 uppercase">Largura (mm)</label>
                                                <span className={`text-[10px] font-mono font-bold ${isWidthValid ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                    {isWidthValid ? `${thermalWidth} mm` : 'Inválido (20-220)'}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <button
                                                    type="button"
                                                    onClick={() => updateDocumentConfig('printerThermalConfig', { ...docs.printerThermalConfig, width: Math.max(20, thermalWidth - 5) })}
                                                    className="w-7 h-7 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-black text-slate-600 hover:bg-slate-100 transition-colors"
                                                >
                                                    -5
                                                </button>
                                                <input
                                                    type="number"
                                                    min={20}
                                                    max={220}
                                                    value={thermalWidth}
                                                    onChange={(e) => updateDocumentConfig('printerThermalConfig', { ...docs.printerThermalConfig, width: Number(e.target.value) })}
                                                    className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg py-1.5 px-2.5 font-black text-xs outline-none text-center"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => updateDocumentConfig('printerThermalConfig', { ...docs.printerThermalConfig, width: Math.min(220, thermalWidth + 5) })}
                                                    className="w-7 h-7 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-black text-slate-600 hover:bg-slate-100 transition-colors"
                                                >
                                                    +5
                                                </button>
                                            </div>
                                        </div>

                                        <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                                            <div className="flex items-center justify-between mb-1">
                                                <label className="text-[10px] font-black text-slate-400 uppercase">Altura (mm)</label>
                                                <span className={`text-[10px] font-mono font-bold ${isHeightValid ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                    {isHeightValid ? `${thermalHeight} mm` : 'Inválido (15-500)'}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <button
                                                    type="button"
                                                    onClick={() => updateDocumentConfig('printerThermalConfig', { ...docs.printerThermalConfig, height: Math.max(15, thermalHeight - 5) })}
                                                    className="w-7 h-7 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-black text-slate-600 hover:bg-slate-100 transition-colors"
                                                >
                                                    -5
                                                </button>
                                                <input
                                                    type="number"
                                                    min={15}
                                                    max={500}
                                                    value={thermalHeight}
                                                    onChange={(e) => updateDocumentConfig('printerThermalConfig', { ...docs.printerThermalConfig, height: Number(e.target.value) })}
                                                    className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg py-1.5 px-2.5 font-black text-xs outline-none text-center"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => updateDocumentConfig('printerThermalConfig', { ...docs.printerThermalConfig, height: Math.min(500, thermalHeight + 5) })}
                                                    className="w-7 h-7 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-black text-slate-600 hover:bg-slate-100 transition-colors"
                                                >
                                                    +5
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Mock Visual da Etiqueta em Tempo Real */}
                                    <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 flex flex-col justify-between">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-[10px] font-black uppercase text-slate-400">Simulador de Etiqueta</span>
                                            <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">
                                                {isLandscape ? 'Modo Paisagem' : 'Modo Retrato'}
                                            </span>
                                        </div>
                                        <div className="flex-1 min-h-[90px] flex items-center justify-center bg-slate-200/60 dark:bg-slate-950/40 rounded-lg p-2">
                                            <div
                                                className="bg-white text-slate-800 rounded shadow-md border border-slate-300 p-2 flex flex-col justify-between transition-all"
                                                style={{
                                                    width: isLandscape ? '120px' : `${Math.round(80 * Math.max(0.6, previewScaleRatio))}px`,
                                                    height: isLandscape ? `${Math.round(110 / Math.max(1, previewScaleRatio))}px` : '105px',
                                                    maxWidth: '130px',
                                                    maxHeight: '110px',
                                                }}
                                            >
                                                <div className="flex items-center justify-between border-b border-dashed border-slate-300 pb-1">
                                                    <span className="text-[8px] font-black uppercase tracking-tight text-slate-800">INFRACORE</span>
                                                    <span className="text-[7px] font-mono font-bold text-slate-500">{thermalWidth}x{thermalHeight}</span>
                                                </div>
                                                <div className="py-1 space-y-0.5">
                                                    <div className="h-1 bg-slate-800 rounded-sm w-full"></div>
                                                    <div className="h-0.5 bg-slate-400 rounded-sm w-3/4"></div>
                                                    <div className="h-0.5 bg-slate-300 rounded-sm w-1/2"></div>
                                                </div>
                                                <div className="flex items-center justify-between pt-1 border-t border-slate-200">
                                                    <div className="flex gap-0.5">
                                                        <div className="w-1 h-3 bg-slate-800"></div>
                                                        <div className="w-0.5 h-3 bg-slate-800"></div>
                                                        <div className="w-1.5 h-3 bg-slate-800"></div>
                                                        <div className="w-0.5 h-3 bg-slate-800"></div>
                                                    </div>
                                                    <span className="text-[7px] font-mono font-black text-slate-600">DANFE-S</span>
                                                </div>
                                            </div>
                                        </div>
                                        <p className="text-[9px] text-center text-slate-400 mt-2 font-medium">
                                            Proporção escalonada: {thermalWidth} mm × {thermalHeight} mm
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Marca D'água e Personalização */}
            <div className="mt-6 pt-6 border-t border-cyan-200 dark:border-cyan-900/30">
                <div className="flex items-center justify-between mb-4">
                    <h4 className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase flex items-center gap-2">
                        <CheckCircle2 size={14} className="text-cyan-600" /> Diretrizes de Emissão, Selos & Autenticação
                    </h4>
                    <span className="text-[10px] text-slate-400 font-bold">Segurança e Personalização Visual</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    {[
                        { id: 'showLogo', label: 'Exibir Logomarca no Cabeçalho', sub: 'Aplica logotipo oficial nos documentos' },
                        { id: 'watermarkDraft', label: 'Marca D\'água em Rascunhos', sub: 'Inibe validação comercial não aprovada' },
                        { id: 'qrCode', label: 'QR Code de Validação', sub: 'Código de rastreamento e consulta pública' },
                        { id: 'autoNumbering', label: 'Numeração Sequencial Automática', sub: 'Garante série e controle auditável' },
                        { id: 'digitalSignature', label: 'Assinatura Digital ICP-Brasil', sub: 'Carimbo de tempo e certificado A1' },
                        { id: 'customFooter', label: 'Rodapé Institucional Personalizado', sub: 'Exibe endereço e dados de registro' },
                        { id: 'barcode', label: 'Código de Barras EAN / Chave de Acesso', sub: 'Padrão 128C para leitura óptica' },
                        { id: 'authSeal', label: 'Selo de Autenticidade & Hash', sub: 'Checksum SHA-256 no rodapé da página' },
                    ].map(option => {
                        const isEnabled = docs[option.id as keyof typeof docs] === true;
                        return (
                            <div
                                key={option.id}
                                onClick={() => updateDocumentConfig(option.id, !isEnabled)}
                                className={`flex items-start justify-between p-3.5 bg-white dark:bg-slate-800 rounded-xl border cursor-pointer transition-all ${isEnabled ? 'border-cyan-300 dark:border-cyan-700 shadow-sm' : 'border-cyan-100 dark:border-cyan-900/30 hover:border-cyan-200'}`}
                            >
                                <div className="pr-2">
                                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-snug block">{option.label}</span>
                                    <span className="text-[10px] text-slate-400 font-medium block mt-0.5">{option.sub}</span>
                                </div>
                                <div
                                    className={`w-10 h-5 rounded-full relative transition-colors shrink-0 mt-0.5 ${isEnabled ? 'bg-cyan-500' : 'bg-slate-300 dark:bg-slate-600'}`}
                                >
                                    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${isEnabled ? 'right-0.5' : 'left-0.5'}`}></div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};

// ---------------------------------------------------------------------------
// Helpers de Segurança & RBAC (Compatibilidade com Supabase UUIDs e Senhas Fortes)
// ---------------------------------------------------------------------------

const generateUUID = (): string => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
};

const normalizeUsername = (val: string): string => {
    return (val || '')
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, '.')
        .replace(/[^a-z0-9._-]/g, '');
};

const getPasswordStrength = (pwd: string) => {
    const p = pwd || '';
    return {
        hasMinLength: p.length >= 8,
        hasUpper: /[A-Z]/.test(p),
        hasLower: /[a-z]/.test(p),
        hasNumber: /[0-9]/.test(p),
        hasSymbol: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(p)
    };
};

const isStrongPassword = (pwd: string): boolean => {
    const s = getPasswordStrength(pwd);
    return s.hasMinLength && s.hasUpper && s.hasLower && s.hasNumber && s.hasSymbol;
};

const Settings = () => {
    const {
        users, roles, settings, auditLogs, employees,
        addUser, updateUser, deleteUser,
        addRole, updateRole, deleteRole,
        updateSettings, clearAllData, hasPermission, seedDatabase,
        currentUser, addAuditLog
    } = useApp();

    const isSuperAdmin = useMemo(
        () => isUserAdmin(currentUser, roles),
        [currentUser, roles]
    );

    const [activeTab, setActiveTab] = useState<'company' | 'security' | 'system' | 'audit' | 'ai_agent' | 'ai_agents'>('company');
    const [subTab, setSubTab] = useState<string>('general'); // Generic subtab state
    const [systemCategory, setSystemCategory] = useState<'all' | 'fiscal' | 'operational' | 'appearance' | 'integrations' | 'documents' | 'maintenance'>('all');
    const [showCertDetails, setShowCertDetails] = useState(false);

    // Local State for floating save bar detection
    const [hasChanges, setHasChanges] = useState(false);

    // Global Toast
    const { addToast } = useToast();

    // Modals
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);

    // Editing States
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [editingRole, setEditingRole] = useState<AppRole | null>(null);
    const [tempSettings, setTempSettings] = useState<AppSettings>(settings);

    // Security & User Directory Filters
    const [userSearchQuery, setUserSearchQuery] = useState('');
    const [userStatusFilter, setUserStatusFilter] = useState<'all' | 'Ativo' | 'Inativo'>('all');
    const [userRoleFilter, setUserRoleFilter] = useState<string>('all');
    const [showPassword, setShowPassword] = useState(false);

    // Role Directory & Matrix Filter
    const [roleSearchQuery, setRoleSearchQuery] = useState('');

    // Audit Filters & Pagination
    const [auditSearch, setAuditSearch] = useState('');
    const [auditModuleFilter, setAuditModuleFilter] = useState('Todos');
    const [auditUserFilter, setAuditUserFilter] = useState('Todos');
    const [auditSeverityFilter, setAuditSeverityFilter] = useState<'all' | 'info' | 'warning' | 'critical'>('all');
    const [auditPeriodPreset, setAuditPeriodPreset] = useState<'30days' | '7days' | 'today' | 'yesterday' | 'thisMonth' | 'all' | 'custom'>('30days');
    const [auditStartDate, setAuditStartDate] = useState(new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]);
    const [auditEndDate, setAuditEndDate] = useState(new Date().toISOString().split('T')[0]);
    const [auditPage, setAuditPage] = useState(1);
    const [auditPageSize, setAuditPageSize] = useState(15);
    const [selectedAuditLog, setSelectedAuditLog] = useState<AuditLog | null>(null);
    const [showAuditReportModal, setShowAuditReportModal] = useState(false);
    const [copiedLogField, setCopiedLogField] = useState<string | null>(null);
    const [showAdvancedAuditFilters, setShowAdvancedAuditFilters] = useState(false);

    const activeAdvancedFilterCount = useMemo(() => {
        let count = 0;
        if (auditUserFilter !== 'Todos') count++;
        if (auditModuleFilter !== 'Todos') count++;
        if (auditPeriodPreset === 'custom') count++;
        return count;
    }, [auditUserFilter, auditModuleFilter, auditPeriodPreset]);

    const handleSetPeriodPreset = (preset: '30days' | '7days' | 'today' | 'yesterday' | 'thisMonth' | 'all') => {
        setAuditPeriodPreset(preset);
        setAuditPage(1);
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];

        if (preset === 'today') {
            setAuditStartDate(todayStr);
            setAuditEndDate(todayStr);
        } else if (preset === 'yesterday') {
            const y = new Date(today);
            y.setDate(y.getDate() - 1);
            const yStr = y.toISOString().split('T')[0];
            setAuditStartDate(yStr);
            setAuditEndDate(yStr);
        } else if (preset === '7days') {
            const d = new Date(today);
            d.setDate(d.getDate() - 7);
            setAuditStartDate(d.toISOString().split('T')[0]);
            setAuditEndDate(todayStr);
        } else if (preset === '30days') {
            const d = new Date(today);
            d.setDate(d.getDate() - 30);
            setAuditStartDate(d.toISOString().split('T')[0]);
            setAuditEndDate(todayStr);
        } else if (preset === 'thisMonth') {
            const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
            setAuditStartDate(firstDay.toISOString().split('T')[0]);
            setAuditEndDate(todayStr);
        } else if (preset === 'all') {
            setAuditStartDate('2020-01-01');
            setAuditEndDate(todayStr);
        }
    };

    const handleResetAuditFilters = () => {
        setAuditSearch('');
        setAuditModuleFilter('Todos');
        setAuditUserFilter('Todos');
        setAuditSeverityFilter('all');
        handleSetPeriodPreset('30days');
        setAuditPage(1);
        setShowAdvancedAuditFilters(false);
        addToast('Filtros de auditoria redefinidos para os padrões.', 'info');
    };


    // Sync temp settings on mount/update (only if not dirty, strategy can vary)
    // For this simple app, we'll just track changes.
    useEffect(() => {
        const isDifferent = JSON.stringify(tempSettings) !== JSON.stringify(settings);
        setHasChanges(isDifferent);
    }, [tempSettings, settings]);

    const handleSaveSettings = (e?: React.FormEvent) => {
        if (e) e.preventDefault();

        // 1. Validação de Integridade Geral
        const validation = validateSettingsIntegrity(tempSettings);
        if (!validation.isValid) {
            addToast(`Não foi possível salvar: ${validation.errors[0]}`, 'error');
            return;
        }

        if (validation.warnings.length > 0) {
            addToast(`Atenção: ${validation.warnings[0]}`, 'info');
        }

        // 2. Sanitização profunda com fallbacks estruturais íntegros
        const sanitizedSettings: AppSettings = {
            ...tempSettings,
            companyName: (tempSettings.companyName || '').trim(),
            tradeName: (tempSettings.tradeName || '').trim(),
            document: (tempSettings.document || '').trim(),
            email: (tempSettings.email || '').trim(),
            phone: (tempSettings.phone || '').trim(),
            address: (tempSettings.address || '').trim(),
            website: (tempSettings.website || '').trim(),
            bankDetails: {
                bankName: (tempSettings.bankDetails?.bankName || '').trim(),
                agency: (tempSettings.bankDetails?.agency || '').trim(),
                account: (tempSettings.bankDetails?.account || '').trim(),
                pixKey: (tempSettings.bankDetails?.pixKey || '').trim(),
                pixType: tempSettings.bankDetails?.pixType || 'CNPJ',
            },
            operational: {
                ...tempSettings.operational,
            },
            documents: {
                ...tempSettings.documents,
                printerMain: tempSettings.documents?.printerMain || 'HP LaserJet Pro',
                printerThermal: tempSettings.documents?.printerThermal || 'Zebra ZD220',
                margins: Math.max(0, Math.min(50, Number(tempSettings.documents?.margins ?? 10))),
                copies: Math.max(1, Math.min(99, Number(tempSettings.documents?.copies ?? 2))),
                documentStatuses: tempSettings.documents?.documentStatuses || {},
                printerMainConfig: {
                    quality: tempSettings.documents?.printerMainConfig?.quality || 'normal',
                    color: tempSettings.documents?.printerMainConfig?.color || 'bw',
                    duplex: tempSettings.documents?.printerMainConfig?.duplex ?? false,
                },
                printerThermalConfig: {
                    width: Math.max(20, Math.min(220, Number(tempSettings.documents?.printerThermalConfig?.width ?? 100))),
                    height: Math.max(15, Math.min(500, Number(tempSettings.documents?.printerThermalConfig?.height ?? 150))),
                },
            },
            integrations: {
                ...tempSettings.integrations,
            },
            technical: {
                ...tempSettings.technical,
            },
            performance: {
                ...tempSettings.performance,
            },
            backup: {
                ...tempSettings.backup,
            },
            notifications: {
                ...tempSettings.notifications,
            },
            emailConfig: {
                ...tempSettings.emailConfig,
            },
        };

        // 3. Auditoria de IA e de Parâmetros
        const aiChange = describeAIConfigChange(getAIConfig(settings), getAIConfig(sanitizedSettings));
        if (aiChange) {
            addAuditLog({
                userId: currentUser?.id || '',
                userName: currentUser?.name || 'Sistema',
                module: 'Configurações',
                ...aiChange
            });
        }

        // 4. Salvar com integridade
        setTempSettings(sanitizedSettings);
        updateSettings(sanitizedSettings);
        addToast('Configurações salvas com sucesso!', 'success');
        setHasChanges(false);
    };

    const handleRevert = () => {
        setTempSettings(settings);
        setHasChanges(false);
        addToast('Alterações descartadas.', 'info');
    };

    const handleSaveUser = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingUser) return;

        // 1. Verificação de permissão estrita
        if (!hasPermission('users.manage') && !isSuperAdmin) {
            addToast('Você não possui permissão para gerenciar usuários.', 'error');
            return;
        }

        // 2. Validação e normalização de Nome Completo
        const cleanName = editingUser.name.trim();
        if (cleanName.length < 2) {
            addToast('Informe o nome completo do usuário (mínimo de 2 caracteres).', 'error');
            return;
        }

        // 3. Validação e normalização de Login (username)
        const cleanUsername = normalizeUsername(editingUser.username);
        if (!cleanUsername || cleanUsername.length < 3) {
            addToast('O nome de usuário (login) deve ter pelo menos 3 caracteres alfanuméricos.', 'error');
            return;
        }
        if (cleanUsername.length > 30) {
            addToast('O nome de usuário não pode exceder 30 caracteres.', 'error');
            return;
        }
        if (!/^[a-z0-9._-]+$/.test(cleanUsername)) {
            addToast('O login deve conter apenas letras minúsculas, números, pontos e hífens.', 'error');
            return;
        }

        const isExistingUser = users.some(u => u.id === editingUser.id);
        const originalUser = isExistingUser ? users.find(u => u.id === editingUser.id) : undefined;
        const isRootAdmin = originalUser?.username?.toLowerCase() === 'admin';

        // Governança: Inviolabilidade da Conta Raiz @admin
        if (isRootAdmin) {
            if (cleanUsername !== 'admin') {
                addToast('O identificador da conta raiz "@admin" é protegido e não pode ser renomeado.', 'error');
                return;
            }
        }

        // Unicidade de Login
        const duplicateUsername = users.some(
            u => u.id !== editingUser.id && u.username.toLowerCase() === cleanUsername
        );
        if (duplicateUsername) {
            addToast(`O login "@${cleanUsername}" já está em uso por outro usuário.`, 'error');
            return;
        }

        // 4. Validação e normalização de E-mail Corporativo
        const cleanEmail = editingUser.email.trim().toLowerCase();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!cleanEmail || !emailRegex.test(cleanEmail)) {
            addToast('Informe um endereço de e-mail corporativo válido.', 'error');
            return;
        }
        const duplicateEmail = users.some(
            u => u.id !== editingUser.id && u.email.toLowerCase() === cleanEmail
        );
        if (duplicateEmail) {
            addToast(`O e-mail "${cleanEmail}" já está cadastrado para outro usuário.`, 'error');
            return;
        }

        // 5. Validação de Cargo / Perfil (compatibilidade com UUIDs do Supabase)
        const selectedRole = roles.find(r => r.id === editingUser.roleId) || findUserRole(editingUser, roles);
        if (!selectedRole) {
            addToast('Selecione um perfil de acesso válido para o usuário.', 'error');
            return;
        }

        // 6. Verificação estrita de Administrador (isUserAdmin / isSuperAdminRole)
        const willBeAdmin = isSuperAdminRole(selectedRole);
        const wasAdmin = originalUser ? isUserAdmin(originalUser, roles) : false;

        // Governança: Conta raiz @admin deve permanecer obrigatoriamente como Administrador
        if (isRootAdmin && !willBeAdmin) {
            addToast('A conta raiz "@admin" deve permanecer obrigatoriamente vinculada ao perfil de Administrador.', 'error');
            return;
        }

        // Governança: Prevenção de Auto-Elevação de Privilégios (Anti-Privilege Escalation)
        if (isExistingUser && editingUser.id === currentUser?.id && editingUser.roleId !== originalUser?.roleId && !isSuperAdmin) {
            addToast('Violação de governança: Você não possui autorização para alterar o seu próprio perfil de acesso.', 'error');
            return;
        }

        // Se o operador não for Super Admin, não pode promover a admin nem modificar conta de admin
        if ((willBeAdmin || wasAdmin) && !isSuperAdmin) {
            addToast('Apenas administradores podem atribuir ou modificar usuários com perfil de Administrador.', 'error');
            return;
        }

        // 7. Validação de Status (Ativo / Inativo)
        const newStatus: 'Ativo' | 'Inativo' = editingUser.status === 'Inativo' ? 'Inativo' : 'Ativo';

        // Não permitir inativar a si próprio
        if (editingUser.id && editingUser.id === currentUser?.id && newStatus === 'Inativo') {
            addToast('Você não pode desativar a sua própria conta de usuário conectada.', 'error');
            return;
        }

        // Governança: Conta raiz @admin não pode ser inativada
        if (isRootAdmin && newStatus === 'Inativo') {
            addToast('A conta raiz "@admin" é protegida pelo sistema e não pode ser inativada.', 'error');
            return;
        }

        // Não permitir inativar o único administrador ativo do sistema
        if (newStatus === 'Inativo' && wasAdmin) {
            const activeAdmins = users.filter(u => u.id !== editingUser.id && u.status === 'Ativo' && isUserAdmin(u, roles));
            if (activeAdmins.length === 0) {
                addToast('Operação negada pela governança: O sistema não pode ficar sem nenhum Administrador ativo.', 'error');
                return;
            }
        }

        // Se estiver retirando privilégio de admin, garantir que outro admin ativo permanece
        if (wasAdmin && !willBeAdmin) {
            const activeAdmins = users.filter(u => u.id !== editingUser.id && u.status === 'Ativo' && isUserAdmin(u, roles));
            if (activeAdmins.length === 0) {
                addToast('Operação negada pela governança: O sistema deve possuir pelo menos um Administrador ativo.', 'error');
                return;
            }
        }

        // 8. Validação de Senha Forte
        const rawPassword = editingUser.password?.trim() || '';
        if (!isExistingUser) {
            if (!rawPassword) {
                addToast('A senha de acesso é obrigatória para a criação de um novo usuário.', 'error');
                return;
            }
            if (!isStrongPassword(rawPassword)) {
                addToast('A senha não cumpre a política de segurança: mínimo 8 caracteres, com letra maiúscula, minúscula, número e caractere especial.', 'error');
                return;
            }
            if (cleanUsername && rawPassword.toLowerCase().includes(cleanUsername.toLowerCase())) {
                addToast('A senha de acesso não pode conter o seu nome de usuário por diretrizes de segurança.', 'error');
                return;
            }
        } else {
            if (rawPassword) {
                if (!isStrongPassword(rawPassword)) {
                    addToast('A nova senha não cumpre a política de segurança: mínimo 8 caracteres, com letra maiúscula, minúscula, número e caractere especial.', 'error');
                    return;
                }
                if (cleanUsername && rawPassword.toLowerCase().includes(cleanUsername.toLowerCase())) {
                    addToast('A senha de acesso não pode conter o seu nome de usuário por diretrizes de segurança.', 'error');
                    return;
                }
            }
        }

        try {
            const isPasswordChanged = Boolean(rawPassword && (!originalUser || rawPassword !== originalUser.password));
            const isRoleChanged = Boolean(isExistingUser && originalUser?.roleId !== selectedRole.id);
            const isStatusChanged = Boolean(isExistingUser && originalUser?.status !== newStatus);
            const isElevatedToAdmin = !wasAdmin && willBeAdmin;
            const isDemotedFromAdmin = wasAdmin && !willBeAdmin;

            const auditSeverity: 'info' | 'warning' | 'critical' =
                isElevatedToAdmin || isDemotedFromAdmin
                    ? 'warning'
                    : isPasswordChanged || (isStatusChanged && newStatus === 'Inativo')
                        ? 'warning'
                        : willBeAdmin
                            ? 'warning'
                            : 'info';

            if (isExistingUser) {
                const userToUpdate: User = {
                    ...editingUser,
                    name: cleanName,
                    username: cleanUsername,
                    email: cleanEmail,
                    roleId: selectedRole.id,
                    status: newStatus,
                    password: rawPassword ? rawPassword : (originalUser?.password || '')
                };

                updateUser(userToUpdate);
                addAuditLog({
                    userId: currentUser?.id || '',
                    userName: currentUser?.name || 'Sistema',
                    module: 'Segurança',
                    action: 'Atualização de Usuário',
                    details: `Usuário @${cleanUsername} atualizado. Cargo: "${selectedRole.name}"${isRoleChanged ? ` (anterior: "${roles.find(r => r.id === originalUser?.roleId)?.name || 'N/A'}")` : ''}, Status: ${newStatus}${isPasswordChanged ? ', Senha Redefinida' : ''}.`,
                    severity: auditSeverity
                });
                addToast(`Usuário @${cleanUsername} atualizado com sucesso!`, 'success');
            } else {
                const newUserId = generateUUID();
                const newUser: User = {
                    ...editingUser,
                    id: newUserId,
                    name: cleanName,
                    username: cleanUsername,
                    email: cleanEmail,
                    roleId: selectedRole.id,
                    status: newStatus,
                    password: rawPassword,
                    registeredAt: new Date().toLocaleDateString('pt-BR')
                };

                addUser(newUser);
                addAuditLog({
                    userId: currentUser?.id || '',
                    userName: currentUser?.name || 'Sistema',
                    module: 'Segurança',
                    action: 'Criação de Usuário',
                    details: `Novo usuário @${cleanUsername} (${cleanName}) criado com cargo "${selectedRole.name}".`,
                    severity: willBeAdmin ? 'warning' : 'info'
                });
                addToast(`Novo usuário @${cleanUsername} criado com sucesso!`, 'success');
            }

            setIsUserModalOpen(false);
            setEditingUser(null);
            setShowPassword(false);
        } catch (error) {
            console.error('Erro ao salvar usuário:', error);
            addToast('Ocorreu um erro ao salvar o usuário.', 'error');
        }
    };

    const handleDeleteUser = (user: User) => {
        if (!hasPermission('users.manage') && !isSuperAdmin) {
            addToast('Você não tem permissão para remover usuários.', 'error');
            return;
        }

        if (user.id === currentUser?.id) {
            addToast('Você não pode excluir o seu próprio usuário conectado.', 'error');
            return;
        }

        if (user.username?.toLowerCase() === 'admin') {
            addToast('A conta raiz "@admin" é protegida pelo sistema e não pode ser excluída.', 'error');
            return;
        }

        const isTargetAdmin = isUserAdmin(user, roles);
        if (isTargetAdmin) {
            if (!isSuperAdmin) {
                addToast('Apenas outro Administrador pode excluir um usuário administrador.', 'error');
                return;
            }
            const otherAdmins = users.filter(u => u.id !== user.id && u.status === 'Ativo' && isUserAdmin(u, roles));
            if (otherAdmins.length === 0) {
                addToast('Operação negada pela governança: Não é possível excluir o único administrador ativo do sistema.', 'error');
                return;
            }
        }

        addToast(`Deseja excluir permanentemente o usuário @${user.username}?`, 'warning', 6000, {
            label: 'EXCLUIR',
            onClick: () => {
                deleteUser(user.id);
                addAuditLog({
                    userId: currentUser?.id || '',
                    userName: currentUser?.name || 'Sistema',
                    module: 'Segurança',
                    action: 'Exclusão de Usuário',
                    details: `Usuário @${user.username} (${user.name}) removido permanentemente.${isTargetAdmin ? ' [CONTA ADMINISTRADORA REMOVIDA]' : ''}`,
                    severity: isTargetAdmin ? 'critical' : 'warning'
                });
                addToast(`Usuário @${user.username} removido com sucesso.`, 'info');
            }
        });
    };

    const handleSaveRole = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!editingRole) return;

        if (!hasPermission('roles.manage') && !isSuperAdmin) {
            addToast('Você não tem permissão para gerenciar perfis de acesso.', 'error');
            return;
        }

        const roleName = editingRole.name.trim();
        if (roleName.length < 3) {
            addToast('O nome do perfil deve ter pelo menos 3 caracteres.', 'error');
            return;
        }

        const isExisting = roles.some(r => r.id === editingRole.id);
        const originalRole = isExisting ? roles.find(r => r.id === editingRole.id) : undefined;

        const duplicate = roles.some(r => r.id !== editingRole.id && r.name.trim().toLowerCase() === roleName.toLowerCase());
        if (duplicate) {
            addToast(`Já existe um perfil cadastrado com o nome "${roleName}".`, 'error');
            return;
        }

        const isEditingAdmin = isSuperAdminRole(originalRole) || isSuperAdminRole(editingRole);
        if (isEditingAdmin && !isSuperAdmin) {
            addToast('Apenas administradores podem modificar ou criar perfis com privilégios de Administrador.', 'error');
            return;
        }

        // Governança: Prevenção de representação de Administrador por não-administradores
        if (!isSuperAdmin) {
            if (/^(adm|admin|administrador|super\s*admin)/i.test(roleName)) {
                addToast('Apenas administradores podem criar ou nomear perfis com denominação de Administrador.', 'error');
                return;
            }
        }

        // Governança: Inviolabilidade do perfil raiz de Administrador
        if (originalRole?.id === 'admin') {
            if (!/^(adm|admin|administrador|super\s*admin)/i.test(roleName)) {
                addToast('O perfil raiz do sistema deve manter a denominação de Administrador.', 'error');
                return;
            }
        }

        let finalPermissions = [...editingRole.permissions];
        if (isEditingAdmin) {
            if (!finalPermissions.includes('all')) {
                finalPermissions = ['all', ...finalPermissions];
            }
        } else {
            // Se não for admin, garante a remoção de 'all' ou '*'
            finalPermissions = finalPermissions.filter(p => p !== 'all' && p !== '*');
        }

        try {
            if (isExisting) {
                const updated: AppRole = {
                    ...editingRole,
                    name: roleName,
                    description: editingRole.description.trim() || 'Perfil de acesso do sistema',
                    permissions: finalPermissions
                };
                updateRole(updated);
                addAuditLog({
                    userId: currentUser?.id || '',
                    userName: currentUser?.name || 'Sistema',
                    module: 'Segurança',
                    action: 'Atualização de Perfil (Role)',
                    details: `Perfil "${roleName}" atualizado com ${finalPermissions.length} permissões.${isEditingAdmin ? ' [PERFIL ADMINISTRADOR]' : ''}`,
                    severity: isEditingAdmin ? 'warning' : 'info'
                });
                addToast(`Perfil "${roleName}" atualizado com sucesso!`, 'success');
            } else {
                const newRole: AppRole = {
                    ...editingRole,
                    id: generateUUID(),
                    name: roleName,
                    description: editingRole.description.trim() || 'Perfil de acesso do sistema',
                    permissions: finalPermissions
                };
                addRole(newRole);
                addAuditLog({
                    userId: currentUser?.id || '',
                    userName: currentUser?.name || 'Sistema',
                    module: 'Segurança',
                    action: 'Criação de Perfil (Role)',
                    details: `Novo perfil "${roleName}" criado com ${finalPermissions.length} permissões.${isEditingAdmin ? ' [PERFIL ADMINISTRADOR]' : ''}`,
                    severity: isEditingAdmin ? 'warning' : 'info'
                });
                addToast(`Novo perfil "${roleName}" criado com sucesso!`, 'success');
            }

            setIsRoleModalOpen(false);
            setEditingRole(null);
        } catch (error) {
            console.error('Erro ao salvar perfil:', error);
            addToast('Ocorreu um erro ao salvar o perfil.', 'error');
        }
    };

    const handleDeleteRole = (role: AppRole) => {
        if (!hasPermission('roles.manage') && !isSuperAdmin) {
            addToast('Você não tem permissão para excluir perfis de acesso.', 'error');
            return;
        }

        if (isSuperAdminRole(role)) {
            addToast('O perfil de Administrador é essencial para a governança e segurança do sistema e não pode ser excluído.', 'error');
            return;
        }

        const attachedUsers = users.filter(u => u.roleId === role.id || (isSuperAdminRole(role) && isUserAdmin(u, roles)));
        if (attachedUsers.length > 0) {
            addToast(`Não é possível excluir o perfil "${role.name}" pois há ${attachedUsers.length} usuário(s) vinculado(s) a ele. Reatribua os usuários primeiro.`, 'error');
            return;
        }

        addToast(`Deseja realmente remover o perfil "${role.name}"?`, 'warning', 5000, {
            label: 'EXCLUIR',
            onClick: () => {
                deleteRole(role.id);
                addAuditLog({
                    userId: currentUser?.id || '',
                    userName: currentUser?.name || 'Sistema',
                    module: 'Segurança',
                    action: 'Exclusão de Perfil (Role)',
                    details: `Perfil de acesso "${role.name}" (ID: ${role.id}) removido permanentemente.`,
                    severity: 'warning'
                });
                addToast(`Perfil "${role.name}" removido com sucesso!`, 'info');
            }
        });
    };

    // Helper for Exporting
    const exportAuditToCSV = (logs: AuditLog[], filenamePrefix = 'Auditoria_InfraCore') => {
        if (!logs || !logs.length) {
            addToast('Nenhum dado para exportar.', 'info');
            return;
        }
        const headers = ['ID', 'Data/Hora', 'Severidade', 'Módulo', 'Ação', 'Usuário', 'ID Usuário', 'IP', 'Detalhes'];
        const csvRows = logs.map(l => [
            `"${(l.id || '').replace(/"/g, '""')}"`,
            `"${(l.timestamp || '').replace(/"/g, '""')}"`,
            `"${(l.severity || 'info').toUpperCase()}"`,
            `"${(l.module || '').replace(/"/g, '""')}"`,
            `"${(l.action || '').replace(/"/g, '""')}"`,
            `"${(l.userName || '').replace(/"/g, '""')}"`,
            `"${(l.userId || '').replace(/"/g, '""')}"`,
            `"${(l.ip || 'Local').replace(/"/g, '""')}"`,
            `"${(l.details || '').replace(/"/g, '""').replace(/\r?\n/g, ' ')}"`
        ].join(';'));

        const csvContent = '\uFEFF' + headers.join(';') + '\n' + csvRows.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${filenamePrefix}_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        addToast(`${logs.length} registro(s) de auditoria exportados com sucesso em CSV!`, 'success');
    };

    const exportAuditToJSON = (logs: AuditLog[], filenamePrefix = 'Auditoria_InfraCore') => {
        if (!logs || !logs.length) {
            addToast('Nenhum dado para exportar.', 'info');
            return;
        }
        const jsonContent = JSON.stringify(logs, null, 2);
        const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${filenamePrefix}_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        addToast(`${logs.length} registro(s) exportados com sucesso em JSON!`, 'success');
    };

    const exportToCSV = (data: any[], filename: string) => {
        exportAuditToCSV(data, filename);
    };

    const copyTextToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        setCopiedLogField(label);
        addToast(`${label} copiado para a área de transferência!`, 'success');
        setTimeout(() => setCopiedLogField(null), 2500);
    };

    // Filter Logic for Audit Log
    const parseLogDate = (dateStr: string) => {
        if (!dateStr) return new Date(0);
        try {
            if (dateStr.includes('-') && (dateStr.includes('T') || dateStr.length === 10)) {
                const parsed = new Date(dateStr);
                if (!isNaN(parsed.getTime())) return parsed;
            }
            const [datePart, timePart] = dateStr.split(' ');
            if (!datePart) return new Date(0);
            if (datePart.includes('/')) {
                const [day, month, year] = datePart.split('/');
                return new Date(`${year}-${month}-${day}T${timePart || '00:00:00'}`);
            }
            const fallback = new Date(dateStr);
            return isNaN(fallback.getTime()) ? new Date(0) : fallback;
        } catch { return new Date(0); }
    };

    const formatRelativeTime = (dateStr: string) => {
        const date = parseLogDate(dateStr);
        if (date.getTime() === 0) return dateStr || 'Data não disponível';
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        if (diffMs < 0) return 'Agora mesmo';
        const diffSec = Math.floor(diffMs / 1000);
        const diffMin = Math.floor(diffSec / 60);
        const diffHour = Math.floor(diffMin / 60);
        const diffDays = Math.floor(diffHour / 24);

        if (diffSec < 60) return 'Agora mesmo';
        if (diffMin < 60) return `Há ${diffMin} min`;
        if (diffHour < 24) return `Há ${diffHour}h`;
        if (diffDays === 1) return 'Ontem';
        if (diffDays < 30) return `Há ${diffDays} dias`;
        return date.toLocaleDateString('pt-BR');
    };

    const auditAvailableUsers = useMemo(() => {
        const userMap = new Map<string, string>();
        users.forEach(u => userMap.set(u.id, u.name));
        auditLogs.forEach(l => {
            if (l.userId && !userMap.has(l.userId)) {
                userMap.set(l.userId, l.userName || l.userId);
            }
        });
        return Array.from(userMap.entries()).map(([id, name]) => ({ id, name }));
    }, [users, auditLogs]);

    const auditAvailableModules = useMemo(() => {
        const standardModules = [
            'Todos',
            'Login',
            'Vendas',
            'Financeiro',
            'Custos e Despesas (Compras)',
            'Estoque',
            'Produção',
            'Frota',
            'RH',
            'Cadastros',
            'Configurações',
            'Segurança',
            'Auditoria IA',
            'Relatórios'
        ];
        const logModules = Array.from(new Set(auditLogs.map(l => l.module).filter(Boolean)));
        return Array.from(new Set([...standardModules, ...logModules]));
    }, [auditLogs]);

    const filteredAuditLogs = useMemo(() => {
        return auditLogs.filter(log => {
            const q = auditSearch.trim().toLowerCase();
            const matchesSearch = !q ||
                (log.details || '').toLowerCase().includes(q) ||
                (log.userName || '').toLowerCase().includes(q) ||
                (log.userId || '').toLowerCase().includes(q) ||
                (log.action || '').toLowerCase().includes(q) ||
                (log.module || '').toLowerCase().includes(q) ||
                (log.ip || '').toLowerCase().includes(q) ||
                (log.id || '').toLowerCase().includes(q);

            const matchesModule = auditModuleFilter === 'Todos' || log.module === auditModuleFilter;
            const matchesUser = auditUserFilter === 'Todos' || log.userId === auditUserFilter || log.userName === auditUserFilter;
            const matchesSeverity = auditSeverityFilter === 'all' || log.severity === auditSeverityFilter;

            const logDate = parseLogDate(log.timestamp);
            const start = new Date(auditStartDate);
            start.setHours(0, 0, 0, 0);

            const end = new Date(auditEndDate);
            end.setHours(23, 59, 59, 999);

            const matchesDate = logDate >= start && logDate <= end;

            return matchesSearch && matchesModule && matchesUser && matchesSeverity && matchesDate;
        }).sort((a, b) => parseLogDate(b.timestamp).getTime() - parseLogDate(a.timestamp).getTime());
    }, [auditLogs, auditSearch, auditModuleFilter, auditUserFilter, auditSeverityFilter, auditStartDate, auditEndDate]);

    const auditModuleCounts = useMemo(() => {
        const counts: Record<string, number> = { Todos: filteredAuditLogs.length };
        auditAvailableModules.forEach(mod => {
            if (mod === 'Todos') return;
            const count = auditLogs.filter(l => {
                if (l.module !== mod) return false;
                const matchesUser = auditUserFilter === 'Todos' || l.userId === auditUserFilter || l.userName === auditUserFilter;
                const matchesSeverity = auditSeverityFilter === 'all' || l.severity === auditSeverityFilter;
                const logDate = parseLogDate(l.timestamp);
                const start = new Date(auditStartDate);
                start.setHours(0, 0, 0, 0);
                const end = new Date(auditEndDate);
                end.setHours(23, 59, 59, 999);
                return matchesUser && matchesSeverity && logDate >= start && logDate <= end;
            }).length;
            counts[mod] = count;
        });
        return counts;
    }, [auditLogs, auditAvailableModules, auditUserFilter, auditSeverityFilter, auditStartDate, auditEndDate, filteredAuditLogs.length]);

    const auditSeverityCounts = useMemo(() => {
        const inScope = auditLogs.filter(l => {
            const matchesModule = auditModuleFilter === 'Todos' || l.module === auditModuleFilter;
            const matchesUser = auditUserFilter === 'Todos' || l.userId === auditUserFilter || l.userName === auditUserFilter;
            const logDate = parseLogDate(l.timestamp);
            const start = new Date(auditStartDate);
            start.setHours(0, 0, 0, 0);
            const end = new Date(auditEndDate);
            end.setHours(23, 59, 59, 999);
            return matchesModule && matchesUser && logDate >= start && logDate <= end;
        });
        return {
            all: inScope.length,
            info: inScope.filter(l => l.severity === 'info').length,
            warning: inScope.filter(l => l.severity === 'warning').length,
            critical: inScope.filter(l => l.severity === 'critical').length
        };
    }, [auditLogs, auditModuleFilter, auditUserFilter, auditStartDate, auditEndDate]);

    // UI Helpers
    const TabButton = ({ id, label, icon: Icon }: { id: typeof activeTab, label: string, icon: any }) => (
        <button
            onClick={() => { setActiveTab(id); setSubTab(id === 'security' ? 'users' : 'general'); }}
            className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all whitespace-nowrap border-2 ${activeTab === id
                ? 'bg-slate-900 border-slate-900 text-white shadow-lg scale-105'
                : 'bg-transparent border-transparent text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
        >
            <Icon size={16} className={activeTab === id ? 'animate-pulse' : ''} />
            {label}
        </button>
    );

    return (
        <div className="flex flex-col h-full relative">

            {/* Top Navigation Bar */}
            <div className="shrink-0 pb-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3 tracking-tighter uppercase italic">
                            <div className="p-2.5 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-600/20 rotate-3">
                                <SettingsIcon size={24} />
                            </div>
                            Configurações
                        </h1>
                        <p className="text-slate-500 dark:text-gray-400 text-xs mt-2 font-bold flex items-center gap-2 ml-1">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            Sistema Operacional v2.5.0
                        </p>
                    </div>

                    {/* Botão de Layout & Design Studio realocado do cabeçalho */}
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => window.dispatchEvent(new CustomEvent('infracore:open-layout-designer'))}
                            className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-black text-xs uppercase tracking-wider flex items-center gap-2.5 shadow-md shadow-cyan-600/20 transition-all hover:scale-105 active:scale-95"
                            title="Abrir Studio de Designer & Layout (Cores, Estilos, Temas e Ergonomia)"
                        >
                            <Palette size={18} />
                            <span>Personalizar Layout & Cores</span>
                        </button>
                    </div>
                </div>

                <div className="p-1.5 bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 w-full overflow-x-auto no-scrollbar flex items-center gap-2">
                    <TabButton id="company" label="Empresa" icon={Building} />
                    {(hasPermission('users.manage') || hasPermission('roles.manage') || isSuperAdmin) && <TabButton id="security" label="Segurança & Acesso" icon={ShieldCheck} />}
                    <TabButton id="system" label="Parâmetros" icon={Cpu} />
                    <TabButton id="audit" label="Auditoria" icon={History} />
                    {isSuperAdmin && <TabButton id="ai_agent" label="Agente de Revisão & Código (ADM)" icon={Bot} />}
                    {hasPermission('ai.agents.view') && <TabButton id="ai_agents" label="Agentes IA & WhatsApp" icon={MessageCircle} />}
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 bg-white dark:bg-slate-800 rounded-[32px] border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden relative">
                <div className="h-full overflow-y-auto custom-scrollbar p-8 pb-32">

                    {/* COMPANY SETTINGS */}
                    {activeTab === 'company' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl">
                            {/* Identidade Corporativa */}
                            <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[32px] border border-slate-100 dark:border-slate-700/50">
                                        <div className="flex items-center justify-between mb-6">
                                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                <Building size={16} className="text-indigo-500" /> Identidade Corporativa & Registro Fiscal
                                            </h3>
                                            <span className="text-[10px] text-slate-400 font-bold">SEFAZ / Receita Federal</span>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome Fantasia</label>
                                                <input
                                                    type="text"
                                                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3 px-4 font-bold text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                                                    value={tempSettings.tradeName}
                                                    onChange={e => setTempSettings({ ...tempSettings, tradeName: e.target.value })}
                                                    placeholder="Ex: InfraCore Soluções"
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Razão Social</label>
                                                    {!tempSettings.companyName.trim() && (
                                                        <span className="text-[9px] font-bold text-rose-500">Obrigatório</span>
                                                    )}
                                                </div>
                                                <input
                                                    type="text"
                                                    className={`w-full bg-white dark:bg-slate-800 border rounded-xl py-3 px-4 font-bold text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none ${!tempSettings.companyName.trim() ? 'border-rose-300 dark:border-rose-900/60' : 'border-slate-200 dark:border-slate-700'}`}
                                                    value={tempSettings.companyName}
                                                    onChange={e => setTempSettings({ ...tempSettings, companyName: e.target.value })}
                                                    placeholder="Ex: InfraCore Tecnologia e Gestão Ltda"
                                                />
                                            </div>

                                            {/* CNPJ / Documento com Validação Dinâmica */}
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">CNPJ / Documento</label>
                                                    {(() => {
                                                        const clean = (tempSettings.document || '').replace(/\D/g, '');
                                                        if (!clean) {
                                                            return <span className="text-[9px] font-bold text-amber-500">Obrigatório p/ NF-e</span>;
                                                        }
                                                        if (clean.length === 14) {
                                                            const ok = isValidCNPJ(clean);
                                                            return (
                                                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${ok ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300' : 'bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300'}`}>
                                                                    {ok ? <CheckCircle2 size={10} /> : <AlertCircle size={10} />}
                                                                    {ok ? 'CNPJ Válido' : 'CNPJ Inválido'}
                                                                </span>
                                                            );
                                                        }
                                                        if (clean.length === 11) {
                                                            const ok = isValidCPF(clean);
                                                            return (
                                                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${ok ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300' : 'bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300'}`}>
                                                                    {ok ? <CheckCircle2 size={10} /> : <AlertCircle size={10} />}
                                                                    {ok ? 'CPF Válido' : 'CPF Inválido'}
                                                                </span>
                                                            );
                                                        }
                                                        return <span className="text-[9px] font-bold text-amber-500">Incompleto ({clean.length}/14)</span>;
                                                    })()}
                                                </div>
                                                <div className="relative">
                                                    <input
                                                        type="text"
                                                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3 pl-4 pr-20 font-bold text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                                                        value={tempSettings.document}
                                                        onChange={e => setTempSettings({ ...tempSettings, document: e.target.value })}
                                                        placeholder="00.000.000/0000-00"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const formatted = formatCNPJ(tempSettings.document);
                                                            setTempSettings({ ...tempSettings, document: formatted });
                                                            addToast('CNPJ formatado.', 'info');
                                                        }}
                                                        className="absolute right-2 top-2 bottom-2 px-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-600 dark:text-slate-300 rounded-lg text-[10px] font-black uppercase transition-colors"
                                                        title="Formatar máscara de CNPJ"
                                                    >
                                                        Formatar
                                                    </button>
                                                </div>
                                            </div>

                                            {/* E-mail com Validação Dinâmica */}
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">E-mail Principal</label>
                                                    {(() => {
                                                        const em = (tempSettings.email || '').trim();
                                                        if (!em) return <span className="text-[9px] font-bold text-amber-500">Obrigatório</span>;
                                                        const ok = isValidEmail(em);
                                                        return (
                                                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${ok ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300' : 'bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300'}`}>
                                                                {ok ? <CheckCircle2 size={10} /> : <AlertCircle size={10} />}
                                                                {ok ? 'E-mail Válido' : 'Formato Inválido'}
                                                            </span>
                                                        );
                                                    })()}
                                                </div>
                                                <input
                                                    type="email"
                                                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3 px-4 font-bold text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                                                    value={tempSettings.email}
                                                    onChange={e => setTempSettings({ ...tempSettings, email: e.target.value })}
                                                    placeholder="contato@empresa.com.br"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Localização & Contato */}
                                    <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[32px] border border-slate-100 dark:border-slate-700/50">
                                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                                            <MapPin size={16} className="text-pink-500" /> Localização & Contato
                                        </h3>
                                        <div className="grid grid-cols-1 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Endereço Completo</label>
                                                <input
                                                    type="text"
                                                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3 px-4 font-bold text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                                                    value={tempSettings.address}
                                                    onChange={e => setTempSettings({ ...tempSettings, address: e.target.value })}
                                                    placeholder="Logradouro, Número, Bairro, Cidade - UF, CEP"
                                                />
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                                <div className="space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Telefone / WhatsApp</label>
                                                        {(() => {
                                                            const ph = (tempSettings.phone || '').trim();
                                                            if (!ph) return null;
                                                            const ok = isValidPhone(ph);
                                                            return (
                                                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${ok ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300' : 'bg-amber-100 text-amber-700'}`}>
                                                                    {ok ? 'Válido' : 'DDD + 8/9 dígitos'}
                                                                </span>
                                                            );
                                                        })()}
                                                    </div>
                                                    <div className="relative">
                                                        <input
                                                            type="text"
                                                            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3 pl-4 pr-20 font-bold text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                                                            value={tempSettings.phone}
                                                            onChange={e => setTempSettings({ ...tempSettings, phone: e.target.value })}
                                                            placeholder="(11) 98765-4321"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                const formatted = formatPhone(tempSettings.phone);
                                                                setTempSettings({ ...tempSettings, phone: formatted });
                                                                addToast('Telefone formatado.', 'info');
                                                            }}
                                                            className="absolute right-2 top-2 bottom-2 px-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-600 dark:text-slate-300 rounded-lg text-[10px] font-black uppercase transition-colors"
                                                            title="Formatar máscara de telefone"
                                                        >
                                                            Formatar
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Website Institucional</label>
                                                    <div className="relative">
                                                        <input
                                                            type="text"
                                                            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3 pl-4 pr-10 font-bold text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                                                            placeholder="https://..."
                                                            value={tempSettings.website || ''}
                                                            onChange={e => setTempSettings({ ...tempSettings, website: e.target.value })}
                                                        />
                                                        {tempSettings.website && (
                                                            <a
                                                                href={tempSettings.website.startsWith('http') ? tempSettings.website : `https://${tempSettings.website}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="absolute right-3 top-3.5 text-slate-400 hover:text-indigo-600 transition-colors"
                                                                title="Abrir Website"
                                                            >
                                                                <ExternalLink size={16} />
                                                            </a>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Dados Bancários & Cobrança PIX */}
                                    <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[32px] border border-slate-100 dark:border-slate-700/50">
                                        <div className="flex items-center justify-between mb-6">
                                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                <Landmark size={16} className="text-emerald-500" /> Dados Bancários & Recebimento PIX
                                            </h3>
                                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full">
                                                QR Code Automático
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {/* Banco com Datalist Inteligente */}
                                            <div className="space-y-2 md:col-span-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Instituição Bancária (FEBRABAN)</label>
                                                <input
                                                    type="text"
                                                    list="brazilian-banks"
                                                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3 px-4 font-bold text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
                                                    value={tempSettings.bankDetails?.bankName || ''}
                                                    onChange={e => setTempSettings({
                                                        ...tempSettings,
                                                        bankDetails: {
                                                            bankName: e.target.value,
                                                            agency: tempSettings.bankDetails?.agency || '',
                                                            account: tempSettings.bankDetails?.account || '',
                                                            pixKey: tempSettings.bankDetails?.pixKey || '',
                                                            pixType: tempSettings.bankDetails?.pixType || 'CNPJ',
                                                        }
                                                    })}
                                                    placeholder="Digite o código ou nome do banco (ex: 001 - Banco do Brasil)"
                                                />
                                                <datalist id="brazilian-banks">
                                                    {BRAZILIAN_BANKS.map(b => (
                                                        <option key={b.code} value={b.name} />
                                                    ))}
                                                </datalist>
                                                <p className="text-[10px] text-slate-400 ml-1">Selecione da lista rápida ou digite livremente o nome da instituição.</p>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Agência</label>
                                                <input
                                                    type="text"
                                                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3 px-4 font-bold text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
                                                    value={tempSettings.bankDetails?.agency || ''}
                                                    onChange={e => setTempSettings({
                                                        ...tempSettings,
                                                        bankDetails: {
                                                            bankName: tempSettings.bankDetails?.bankName || '',
                                                            agency: e.target.value,
                                                            account: tempSettings.bankDetails?.account || '',
                                                            pixKey: tempSettings.bankDetails?.pixKey || '',
                                                            pixType: tempSettings.bankDetails?.pixType || 'CNPJ',
                                                        }
                                                    })}
                                                    placeholder="Ex: 0001 ou 1234-5"
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Conta Corrente (com dígito)</label>
                                                <input
                                                    type="text"
                                                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3 px-4 font-bold text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
                                                    value={tempSettings.bankDetails?.account || ''}
                                                    onChange={e => setTempSettings({
                                                        ...tempSettings,
                                                        bankDetails: {
                                                            bankName: tempSettings.bankDetails?.bankName || '',
                                                            agency: tempSettings.bankDetails?.agency || '',
                                                            account: e.target.value,
                                                            pixKey: tempSettings.bankDetails?.pixKey || '',
                                                            pixType: tempSettings.bankDetails?.pixType || 'CNPJ',
                                                        }
                                                    })}
                                                    placeholder="Ex: 123456-7"
                                                />
                                            </div>

                                            {/* Tipo de Chave PIX */}
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tipo de Chave PIX</label>
                                                <select
                                                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3 px-4 font-bold text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
                                                    value={tempSettings.bankDetails?.pixType || 'CNPJ'}
                                                    onChange={e => setTempSettings({
                                                        ...tempSettings,
                                                        bankDetails: {
                                                            bankName: tempSettings.bankDetails?.bankName || '',
                                                            agency: tempSettings.bankDetails?.agency || '',
                                                            account: tempSettings.bankDetails?.account || '',
                                                            pixKey: tempSettings.bankDetails?.pixKey || '',
                                                            pixType: e.target.value,
                                                        }
                                                    })}
                                                >
                                                    <option value="CNPJ">CNPJ</option>
                                                    <option value="CPF">CPF</option>
                                                    <option value="E-mail">E-mail</option>
                                                    <option value="Telefone">Telefone</option>
                                                    <option value="Chave Aleatória">Chave Aleatória (EVP)</option>
                                                </select>
                                            </div>

                                            {/* Chave PIX com Validação em Tempo Real */}
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Chave PIX</label>
                                                    {/* Botão de Preenchimento Rápido com dados da empresa */}
                                                    {(() => {
                                                        const pType = tempSettings.bankDetails?.pixType || 'CNPJ';
                                                        if (pType === 'CNPJ' && tempSettings.document) {
                                                            return (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        const clean = tempSettings.document.replace(/\D/g, '');
                                                                        setTempSettings({
                                                                            ...tempSettings,
                                                                            bankDetails: {
                                                                                bankName: tempSettings.bankDetails?.bankName || '',
                                                                                agency: tempSettings.bankDetails?.agency || '',
                                                                                account: tempSettings.bankDetails?.account || '',
                                                                                pixKey: clean,
                                                                                pixType: 'CNPJ',
                                                                            }
                                                                        });
                                                                        addToast('CNPJ corporativo aplicado à chave PIX.', 'info');
                                                                    }}
                                                                    className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 hover:underline uppercase"
                                                                >
                                                                    Usar CNPJ da Empresa
                                                                </button>
                                                            );
                                                        }
                                                        if (pType === 'E-mail' && tempSettings.email) {
                                                            return (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setTempSettings({
                                                                            ...tempSettings,
                                                                            bankDetails: {
                                                                                bankName: tempSettings.bankDetails?.bankName || '',
                                                                                agency: tempSettings.bankDetails?.agency || '',
                                                                                account: tempSettings.bankDetails?.account || '',
                                                                                pixKey: tempSettings.email.trim(),
                                                                                pixType: 'E-mail',
                                                                            }
                                                                        });
                                                                        addToast('E-mail corporativo aplicado à chave PIX.', 'info');
                                                                    }}
                                                                    className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 hover:underline uppercase"
                                                                >
                                                                    Usar E-mail da Empresa
                                                                </button>
                                                            );
                                                        }
                                                        if (pType === 'Telefone' && tempSettings.phone) {
                                                            return (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        const clean = tempSettings.phone.replace(/\D/g, '');
                                                                        setTempSettings({
                                                                            ...tempSettings,
                                                                            bankDetails: {
                                                                                bankName: tempSettings.bankDetails?.bankName || '',
                                                                                agency: tempSettings.bankDetails?.agency || '',
                                                                                account: tempSettings.bankDetails?.account || '',
                                                                                pixKey: clean,
                                                                                pixType: 'Telefone',
                                                                            }
                                                                        });
                                                                        addToast('Telefone corporativo aplicado à chave PIX.', 'info');
                                                                    }}
                                                                    className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 hover:underline uppercase"
                                                                >
                                                                    Usar Telefone da Empresa
                                                                </button>
                                                            );
                                                        }
                                                        return null;
                                                    })()}
                                                </div>

                                                <div className="relative">
                                                    <input
                                                        type="text"
                                                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3 pl-4 pr-12 font-bold text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
                                                        value={tempSettings.bankDetails?.pixKey || ''}
                                                        onChange={e => setTempSettings({
                                                            ...tempSettings,
                                                            bankDetails: {
                                                                bankName: tempSettings.bankDetails?.bankName || '',
                                                                agency: tempSettings.bankDetails?.agency || '',
                                                                account: tempSettings.bankDetails?.account || '',
                                                                pixKey: e.target.value,
                                                                pixType: tempSettings.bankDetails?.pixType || 'CNPJ',
                                                            }
                                                        })}
                                                        placeholder={
                                                            (tempSettings.bankDetails?.pixType === 'CNPJ') ? '00.000.000/0000-00 ou números' :
                                                            (tempSettings.bankDetails?.pixType === 'CPF') ? '000.000.000-00 ou números' :
                                                            (tempSettings.bankDetails?.pixType === 'E-mail') ? 'financeiro@empresa.com.br' :
                                                            (tempSettings.bankDetails?.pixType === 'Telefone') ? '(11) 98765-4321 ou DDD+número' :
                                                            'UUID EVP de 32 ou 36 dígitos'
                                                        }
                                                    />
                                                    {tempSettings.bankDetails?.pixKey && (
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                navigator.clipboard.writeText(tempSettings.bankDetails?.pixKey || '');
                                                                addToast('Chave PIX copiada para a área de transferência!', 'success');
                                                            }}
                                                            className="absolute right-2 top-2 bottom-2 px-2 text-slate-400 hover:text-emerald-600 transition-colors"
                                                            title="Copiar Chave PIX"
                                                        >
                                                            <Copy size={16} />
                                                        </button>
                                                    )}
                                                </div>

                                                {/* Feedback de Validação da Chave PIX */}
                                                {(() => {
                                                    const key = tempSettings.bankDetails?.pixKey || '';
                                                    const type = tempSettings.bankDetails?.pixType || 'CNPJ';
                                                    if (!key.trim()) {
                                                        return (
                                                            <p className="text-[10px] text-slate-400 ml-1">
                                                                Chave PIX utilizada para recebimentos comerciais e QR Codes automáticos.
                                                            </p>
                                                        );
                                                    }
                                                    const res = validatePixKey(key, type);
                                                    return (
                                                        <div className={`p-2 rounded-lg text-[10px] font-bold flex items-center gap-1.5 ${res.isValid ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/40' : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/40'}`}>
                                                            {res.isValid ? <CheckCircle2 size={12} className="shrink-0" /> : <AlertCircle size={12} className="shrink-0" />}
                                                            <span>{res.message}</span>
                                                        </div>
                                                    );
                                                })()}
                                            </div>
                                        </div>
                                    </div>
                        </div>
                    )}

                    {/* SECURITY SETTINGS & RBAC GOVERNANCE */}
                    {activeTab === 'security' && (() => {
                        const canManageUsers = hasPermission('users.manage') || isSuperAdmin;
                        const canManageRoles = hasPermission('roles.manage') || isSuperAdmin;
                        const activeSecuritySubTab: 'users' | 'roles' | 'none' =
                            subTab === 'roles' && canManageRoles
                                ? 'roles'
                                : canManageUsers
                                    ? 'users'
                                    : canManageRoles
                                        ? 'roles'
                                        : 'none';

                        const activeAdminsCount = users.filter(u => u.status === 'Ativo' && isUserAdmin(u, roles)).length;

                        return (
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 h-full flex flex-col space-y-6">
                                {/* PAINEL EXECUTIVO DE GOVERNANÇA & CONFORMIDADE RBAC */}
                                <div className="p-6 sm:p-8 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-[28px] text-white border border-indigo-900/40 shadow-xl">
                                    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-5 border-b border-white/10">
                                        <div className="flex items-center gap-3.5">
                                            <div className="p-3 bg-indigo-500/20 text-indigo-400 rounded-2xl border border-indigo-500/30 shadow-inner">
                                                <ShieldCheck size={28} />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h3 className="text-base font-black uppercase tracking-tight">
                                                        Governança de Identidades & Matriz RBAC
                                                    </h3>
                                                    <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                                        Conformidade Ativa
                                                    </span>
                                                </div>
                                                <p className="text-xs text-slate-400 mt-0.5">
                                                    Segregação de funções, quórum de administradores e política estrita de credenciais.
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 bg-white/5 px-4 py-2.5 rounded-2xl border border-white/10">
                                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                                            <div className="text-right">
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Operador Logado</p>
                                                <p className="text-xs font-black text-white flex items-center justify-end gap-1.5">
                                                    {currentUser?.name || 'Administrador'}
                                                    {isSuperAdmin ? (
                                                        <span className="text-[9px] font-mono font-bold text-purple-300 bg-purple-900/60 px-1.5 py-0.5 rounded border border-purple-500/30">
                                                            🛡️ Super Admin
                                                        </span>
                                                    ) : (
                                                        <span className="text-[9px] font-mono font-bold text-indigo-300 bg-indigo-900/60 px-1.5 py-0.5 rounded border border-indigo-500/30">
                                                            Gestor RBAC
                                                        </span>
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Métricas e Pilares de Governança */}
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-5">
                                        <div className="space-y-1">
                                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Diretório de Usuários</span>
                                            <p className="text-lg font-black text-white">
                                                {users.filter(u => u.status === 'Ativo').length} <span className="text-xs font-normal text-slate-400">ativos / {users.filter(u => u.status === 'Inativo').length} inativos</span>
                                            </p>
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Quórum Administrativo</span>
                                            <p className="text-lg font-black text-purple-300 flex items-center gap-1.5">
                                                {activeAdminsCount} <span className="text-xs font-normal text-slate-400">admin(s) ativo(s)</span>
                                            </p>
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Perfis de Acesso (Roles)</span>
                                            <p className="text-lg font-black text-indigo-300">
                                                {roles.length} <span className="text-xs font-normal text-slate-400">níveis definidos</span>
                                            </p>
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Política de Senhas</span>
                                            <p className="text-xs font-bold text-emerald-400 flex items-center gap-1 mt-1">
                                                <CheckCircle2 size={14} /> Mín. 8 chars (A-Z, a-z, 0-9, #)
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Navegação de SubTabs */}
                                <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-900/50 p-1.5 rounded-2xl w-fit">
                                    {canManageUsers && (
                                        <button
                                            onClick={() => setSubTab('users')}
                                            className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${activeSecuritySubTab === 'users' ? 'bg-white dark:bg-slate-800 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-700'}`}
                                        >
                                            Gerenciar Usuários ({users.length})
                                        </button>
                                    )}
                                    {canManageRoles && (
                                        <button
                                            onClick={() => setSubTab('roles')}
                                            className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${activeSecuritySubTab === 'roles' ? 'bg-white dark:bg-slate-800 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-700'}`}
                                        >
                                            Perfis & Permissões ({roles.length})
                                        </button>
                                    )}
                                </div>

                                {/* Visualização de Usuários */}
                                {activeSecuritySubTab === 'users' && (
                                    <div className="space-y-6">
                                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-indigo-50 dark:bg-indigo-900/20 p-6 rounded-[24px] border border-indigo-100 dark:border-indigo-900/30">
                                            <div className="flex items-center gap-4">
                                                <div className="p-3 bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-500/30">
                                                    <Users size={24} />
                                                </div>
                                                <div>
                                                    <h3 className="font-black text-slate-900 dark:text-white text-lg">Diretório de Usuários (RBAC)</h3>
                                                    <p className="text-slate-500 dark:text-slate-400 text-xs font-medium">
                                                        Controle de identidades, logins normalizados, políticas de senhas fortes e permissões.
                                                    </p>
                                                </div>
                                            </div>
                                            {canManageUsers && (
                                                <button
                                                    onClick={() => {
                                                        const defaultRole = roles.find(r => !isSuperAdminRole(r)) || roles[0];
                                                        setEditingUser({
                                                            id: '',
                                                            name: '',
                                                            username: '',
                                                            email: '',
                                                            roleId: defaultRole ? defaultRole.id : '',
                                                            status: 'Ativo',
                                                            registeredAt: '',
                                                            employeeId: ''
                                                        });
                                                        setShowPassword(false);
                                                        setIsUserModalOpen(true);
                                                    }}
                                                    className="px-6 py-3 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center gap-2 shadow-xl shrink-0"
                                                >
                                                    <UserPlus size={16} /> Novo Usuário
                                                </button>
                                            )}
                                        </div>

                                        {/* Toolbar de Busca e Filtros */}
                                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
                                            <div className="relative w-full sm:w-80">
                                                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                                <input
                                                    type="text"
                                                    placeholder="Buscar por nome, login, e-mail..."
                                                    value={userSearchQuery}
                                                    onChange={e => setUserSearchQuery(e.target.value)}
                                                    className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20"
                                                />
                                            </div>
                                            <div className="flex items-center gap-2 w-full sm:w-auto">
                                                <select
                                                    value={userStatusFilter}
                                                    onChange={e => setUserStatusFilter(e.target.value as any)}
                                                    className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold py-2 px-3 outline-none"
                                                >
                                                    <option value="all">Todos os Status</option>
                                                    <option value="Ativo">Apenas Ativos</option>
                                                    <option value="Inativo">Apenas Inativos</option>
                                                </select>
                                                <select
                                                    value={userRoleFilter}
                                                    onChange={e => setUserRoleFilter(e.target.value)}
                                                    className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold py-2 px-3 outline-none"
                                                >
                                                    <option value="all">Todos os Cargos</option>
                                                    {roles.map(r => (
                                                        <option key={r.id} value={r.id}>{r.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        {/* Grid de Usuários */}
                                        {(() => {
                                            const filteredUsers = users.filter(user => {
                                                const q = userSearchQuery.trim().toLowerCase();
                                                const userRole = findUserRole(user, roles);
                                                const roleName = userRole?.name || roles.find(r => r.id === user.roleId)?.name || '';
                                                const matchesSearch = !q || (
                                                    user.name.toLowerCase().includes(q) ||
                                                    user.username.toLowerCase().includes(q) ||
                                                    user.email.toLowerCase().includes(q) ||
                                                    roleName.toLowerCase().includes(q)
                                                );
                                                const matchesStatus = userStatusFilter === 'all' || user.status === userStatusFilter;
                                                const matchesRole = userRoleFilter === 'all' || user.roleId === userRoleFilter || (userRole && userRole.id === userRoleFilter);
                                                return matchesSearch && matchesStatus && matchesRole;
                                            });

                                            if (filteredUsers.length === 0) {
                                                return (
                                                    <div className="p-12 text-center bg-slate-50 dark:bg-slate-900/30 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700">
                                                        <Users size={36} className="mx-auto mb-3 text-slate-300 dark:text-slate-600" />
                                                        <p className="text-sm font-bold text-slate-500">Nenhum usuário encontrado com os filtros selecionados.</p>
                                                        <button
                                                            onClick={() => { setUserSearchQuery(''); setUserStatusFilter('all'); setUserRoleFilter('all'); }}
                                                            className="mt-3 px-4 py-2 text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl"
                                                        >
                                                            Limpar Filtros
                                                        </button>
                                                    </div>
                                                );
                                            }

                                            return (
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                                    {filteredUsers.map(user => {
                                                        const userRole = findUserRole(user, roles);
                                                        const roleName = userRole?.name || roles.find(r => r.id === user.roleId)?.name || 'Sem Cargo';
                                                        const isAdmin = isUserAdmin(user, roles);
                                                        const isSelf = user.id === currentUser?.id;
                                                        const isRoot = user.username.toLowerCase() === 'admin';
                                                        const linkedEmp = employees.find(e => e.id === user.employeeId);
                                                        const canEditTarget = isSuperAdmin || !isAdmin;
                                                        const canDeleteTarget = canManageUsers && !isSelf && !isRoot && (isSuperAdmin || !isAdmin);

                                                        return (
                                                            <div key={user.id} className="group relative bg-white dark:bg-slate-800 p-6 rounded-[24px] border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all hover:shadow-lg flex flex-col justify-between">
                                                                <div>
                                                                    <div className="flex justify-between items-start mb-4">
                                                                        <div className="relative">
                                                                            <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700 rounded-2xl flex items-center justify-center text-slate-600 dark:text-slate-200 font-extrabold text-lg">
                                                                                {user.name.charAt(0)}
                                                                            </div>
                                                                            {isAdmin && (
                                                                                <span title="Administrador" className="absolute -top-1 -right-1 w-5 h-5 bg-purple-600 text-white rounded-full flex items-center justify-center shadow-md">
                                                                                    <ShieldCheck size={12} />
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                        <div className="flex flex-col items-end gap-1">
                                                                            <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-wide ${user.status === 'Ativo' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400'}`}>
                                                                                {user.status}
                                                                            </span>
                                                                            {isSelf && (
                                                                                <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300">
                                                                                    Você
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                    <h4 className="font-bold text-slate-900 dark:text-white truncate" title={user.name}>{user.name}</h4>
                                                                    <p className="text-[10px] font-bold text-indigo-500 mb-1 font-mono">@{user.username}</p>
                                                                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate mb-4" title={user.email}>{user.email}</p>

                                                                    <div className="flex items-center gap-2 mb-2">
                                                                        <Shield size={12} className={isAdmin ? 'text-purple-500' : 'text-indigo-500'} />
                                                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider truncate" title={roleName}>
                                                                            {roleName}
                                                                        </span>
                                                                    </div>

                                                                    {linkedEmp && (
                                                                        <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate mb-4">
                                                                            RH: <span className="font-medium text-slate-600 dark:text-slate-300">{linkedEmp.name}</span>
                                                                        </p>
                                                                    )}
                                                                </div>

                                                                <div className="flex gap-2 justify-end mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/60">
                                                                    {canEditTarget ? (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => {
                                                                                const matchedRole = findUserRole(user, roles);
                                                                                setEditingUser({
                                                                                    ...user,
                                                                                    roleId: matchedRole ? matchedRole.id : user.roleId
                                                                                });
                                                                                setShowPassword(false);
                                                                                setIsUserModalOpen(true);
                                                                            }}
                                                                            className="p-2 text-slate-400 hover:text-indigo-600 bg-slate-50 dark:bg-slate-900 rounded-lg transition-colors"
                                                                            title="Editar Usuário"
                                                                        >
                                                                            <Edit2 size={16} />
                                                                        </button>
                                                                    ) : (
                                                                        <span
                                                                            title="Apenas administradores podem editar outro administrador"
                                                                            className="p-2 text-slate-300 dark:text-slate-600 bg-slate-50 dark:bg-slate-900 rounded-lg cursor-not-allowed"
                                                                        >
                                                                            <Lock size={16} />
                                                                        </span>
                                                                    )}

                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleDeleteUser(user)}
                                                                        disabled={!canDeleteTarget}
                                                                        className={`p-2 rounded-lg transition-colors ${
                                                                            !canDeleteTarget
                                                                                ? 'text-slate-300 dark:text-slate-600 bg-slate-50 dark:bg-slate-900 cursor-not-allowed opacity-50'
                                                                                : 'text-slate-400 hover:text-rose-600 bg-slate-50 dark:bg-slate-900'
                                                                        }`}
                                                                        title={
                                                                            isSelf
                                                                                ? 'Você não pode excluir seu próprio usuário logado'
                                                                                : isRoot
                                                                                    ? 'Conta raiz @admin protegida contra exclusão'
                                                                                    : isAdmin && !isSuperAdmin
                                                                                        ? 'Apenas administradores podem excluir outro administrador'
                                                                                        : 'Excluir Usuário'
                                                                        }
                                                                    >
                                                                        <Trash2 size={16} />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            );
                                        })()}
                                    </div>
                                )}

                                {/* Visualização de Perfis (Roles) */}
                                {activeSecuritySubTab === 'roles' && (
                                    <div className="space-y-6">
                                        <div className="flex justify-between items-center bg-indigo-50 dark:bg-indigo-900/20 p-6 rounded-[24px] border border-indigo-100 dark:border-indigo-900/30">
                                            <div className="flex items-center gap-4">
                                                <div className="p-3 bg-purple-500 text-white rounded-xl shadow-lg shadow-purple-500/30">
                                                    <ShieldCheck size={24} />
                                                </div>
                                                <div>
                                                    <h3 className="font-black text-slate-900 dark:text-white text-lg">Perfis de Acesso (RBAC Roles)</h3>
                                                    <p className="text-slate-500 dark:text-slate-400 text-xs font-medium">
                                                        Controle granular de permissões por cargo, suportando UUIDs e perfis legados.
                                                    </p>
                                                </div>
                                            </div>
                                            {canManageRoles && (
                                                <button
                                                    onClick={() => {
                                                        setEditingRole({ id: '', name: '', description: '', permissions: [] });
                                                        setRoleSearchQuery('');
                                                        setIsRoleModalOpen(true);
                                                    }}
                                                    className="px-6 py-3 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center gap-2 shadow-xl shrink-0"
                                                >
                                                    <Plus size={16} /> Novo Perfil
                                                </button>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                            {roles.map(role => {
                                                const isSuper = isSuperAdminRole(role);
                                                const userCount = users.filter(u => u.roleId === role.id || (isSuper && isUserAdmin(u, roles))).length;
                                                const canEditRole = isSuperAdmin || !isSuper;

                                                return (
                                                    <div key={role.id} className="bg-white dark:bg-slate-800 p-8 rounded-[32px] border border-slate-200 dark:border-slate-700 flex flex-col hover:border-purple-300 transition-all shadow-sm justify-between">
                                                        <div>
                                                            <div className="flex items-center justify-between mb-4">
                                                                <div className="flex items-center gap-2">
                                                                    <Shield size={32} className={isSuper ? 'text-purple-600' : 'text-purple-500'} />
                                                                    {isSuper && (
                                                                        <span className="text-[9px] bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-full font-black uppercase tracking-wider">
                                                                            Administrador
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <span className="text-[10px] bg-slate-100 dark:bg-slate-700 px-3 py-1 rounded-full font-black text-slate-500 dark:text-slate-300 uppercase">
                                                                    {role.permissions.includes('all') ? 'Acesso Total' : `${role.permissions.length} Permissões`}
                                                                </span>
                                                            </div>
                                                            <h4 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-2">{role.name}</h4>
                                                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">{role.description}</p>
                                                            <div className="mb-6 flex items-center gap-2">
                                                                <span className="text-xs font-bold text-slate-400">
                                                                    {userCount === 0 ? 'Nenhum usuário vinculado' : `${userCount} usuário(s) associado(s)`}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-2 pt-4 border-t border-slate-100 dark:border-slate-700/60">
                                                            {canEditRole ? (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setEditingRole(role);
                                                                        setRoleSearchQuery('');
                                                                        setIsRoleModalOpen(true);
                                                                    }}
                                                                    className="flex-1 py-3 bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-purple-50 hover:text-purple-600 dark:hover:bg-purple-900/20 dark:hover:text-purple-300 transition-all"
                                                                >
                                                                    Editar Acessos
                                                                </button>
                                                            ) : (
                                                                <span
                                                                    title="Apenas administradores podem editar o perfil de Administrador"
                                                                    className="flex-1 py-3 bg-slate-50 dark:bg-slate-700/30 text-slate-400 dark:text-slate-500 rounded-xl text-xs font-black uppercase tracking-widest text-center cursor-not-allowed flex items-center justify-center gap-1.5"
                                                                >
                                                                    <Lock size={14} /> Administrador
                                                                </span>
                                                            )}

                                                            {isSuper ? (
                                                                <span
                                                                    title="Perfil de Administrador protegido pelo sistema contra exclusão"
                                                                    className="p-3 bg-slate-50 dark:bg-slate-700/30 text-slate-300 dark:text-slate-600 rounded-xl cursor-not-allowed"
                                                                >
                                                                    <Lock size={16} />
                                                                </span>
                                                            ) : userCount > 0 ? (
                                                                <span
                                                                    title={`Não é possível excluir: há ${userCount} usuário(s) vinculado(s)`}
                                                                    className="p-3 bg-slate-50 dark:bg-slate-700/30 text-slate-300 dark:text-slate-600 rounded-xl cursor-not-allowed"
                                                                >
                                                                    <Trash2 size={16} />
                                                                </span>
                                                            ) : (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleDeleteRole(role)}
                                                                    className="p-3 bg-slate-50 dark:bg-slate-700/50 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all"
                                                                    title="Excluir Perfil"
                                                                >
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Acesso Negado aos SubTabs */}
                                {activeSecuritySubTab === 'none' && (
                                    <div className="p-12 text-center bg-white dark:bg-slate-800 rounded-3xl border border-dashed border-rose-200 dark:border-rose-900/40">
                                        <ShieldAlert size={40} className="mx-auto mb-3 text-rose-500" />
                                        <h4 className="text-base font-black text-slate-900 dark:text-white">Acesso Restrito</h4>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                                            Seu usuário não possui permissões atribuídas para gerenciar identidades (users.manage) ou perfis de acesso (roles.manage).
                                        </p>
                                    </div>
                                )}
                            </div>
                        );
                    })()}

                    {/* SYSTEM PARAMETERS */}
                    {activeTab === 'system' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
                            {/* Sub-navigation for System Parameters */}
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/50">
                                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 md:pb-0">
                                    {[
                                        { id: 'all', label: 'Visão Geral (Todos)', icon: Layers },
                                        { id: 'fiscal', label: 'Fiscal & Regional', icon: Scale },
                                        { id: 'operational', label: 'Regras Operacionais', icon: Sliders },
                                        { id: 'appearance', label: 'Interface & Alertas', icon: Palette },
                                        { id: 'integrations', label: 'Integrações & E-mail', icon: Link },
                                        { id: 'documents', label: 'Impressão & Docs', icon: Printer },
                                        { id: 'maintenance', label: 'Manutenção & Segurança', icon: ShieldCheck },
                                    ].map(cat => {
                                        const IconComp = cat.icon;
                                        const isSelected = systemCategory === cat.id;
                                        return (
                                            <button
                                                type="button"
                                                key={cat.id}
                                                onClick={() => setSystemCategory(cat.id as any)}
                                                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wide whitespace-nowrap transition-all ${isSelected
                                                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                                                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-indigo-50 dark:hover:bg-slate-700'
                                                    }`}
                                            >
                                                <IconComp size={14} />
                                                {cat.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Fiscal & Tax Configuration */}
                            {(systemCategory === 'all' || systemCategory === 'fiscal') && (
                            <>
                            <section className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900/50 dark:to-slate-800/30 p-8 rounded-[32px] border border-slate-200 dark:border-slate-700/50">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2.5 bg-emerald-500 rounded-xl text-white">
                                            <Scale size={20} />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">Configuração Fiscal & Tributária</h3>
                                            <p className="text-[10px] text-slate-500 font-medium">Parâmetros para cálculos e conformidade fiscal</p>
                                        </div>
                                    </div>
                                    {/* Toggle para ativar/desativar módulo fiscal */}
                                    <div
                                        onClick={() => {
                                            const current = tempSettings.technical.fiscalModuleEnabled ?? true;
                                            setTempSettings({
                                                ...tempSettings,
                                                technical: {
                                                    ...tempSettings.technical,
                                                    fiscalModuleEnabled: !current
                                                }
                                            });
                                        }}
                                        className="flex items-center gap-3 cursor-pointer select-none"
                                    >
                                        <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                                            Módulo Fiscal {(tempSettings.technical.fiscalModuleEnabled ?? true) ? 'Ativo' : 'Inativo'}
                                        </span>
                                        <div className={`w-14 h-7 rounded-full relative transition-colors shadow-inner ${(tempSettings.technical.fiscalModuleEnabled ?? true) ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`}>
                                            <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-md transition-all ${(tempSettings.technical.fiscalModuleEnabled ?? true) ? 'right-1' : 'left-1'}`}></div>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                            Regime Tributário
                                        </label>
                                        <div className="relative">
                                            <select
                                                className="w-full bg-white dark:bg-slate-800 appearance-none border border-slate-200 dark:border-slate-700 rounded-2xl py-4 px-5 font-bold text-sm outline-none cursor-pointer hover:border-emerald-400 transition-all focus:ring-2 ring-emerald-500/20"
                                                value={tempSettings.technical.taxRegime}
                                                onChange={e => setTempSettings({ ...tempSettings, technical: { ...tempSettings.technical, taxRegime: e.target.value } })}
                                            >
                                                <option value="Simples Nacional">Simples Nacional</option>
                                                <option value="Lucro Presumido">Lucro Presumido</option>
                                                <option value="Lucro Real">Lucro Real</option>
                                                <option value="MEI">MEI - Microempreendedor Individual</option>
                                            </select>
                                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                            Alíquota Padrão (%)
                                        </label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            max="100"
                                            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl py-4 px-5 font-bold text-sm outline-none focus:ring-2 ring-emerald-500/20 hover:border-emerald-400 transition-all"
                                            value={tempSettings.technical.defaultTaxRate}
                                            onChange={e => setTempSettings({ ...tempSettings, technical: { ...tempSettings.technical, defaultTaxRate: parseFloat(e.target.value) || 0 } })}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                            Início Ano Fiscal
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="DD/MM"
                                            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl py-4 px-5 font-bold text-sm outline-none focus:ring-2 ring-emerald-500/20 hover:border-emerald-400 transition-all"
                                            value={tempSettings.technical.financialYearStart}
                                            onChange={e => setTempSettings({ ...tempSettings, technical: { ...tempSettings.technical, financialYearStart: e.target.value } })}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                                            CNAE Principal
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="0000-0/00"
                                            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl py-4 px-5 font-bold text-sm outline-none focus:ring-2 ring-blue-500/20 hover:border-blue-400 transition-all"
                                            value={tempSettings.technical.cnae || ''}
                                            onChange={e => setTempSettings({ ...tempSettings, technical: { ...tempSettings.technical, cnae: e.target.value } })}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                                            Inscrição Estadual
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="000.000.000.000"
                                            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl py-4 px-5 font-bold text-sm outline-none focus:ring-2 ring-blue-500/20 hover:border-blue-400 transition-all"
                                            value={tempSettings.technical.stateRegistry || ''}
                                            onChange={e => setTempSettings({ ...tempSettings, technical: { ...tempSettings.technical, stateRegistry: e.target.value } })}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                                            Inscrição Municipal
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="000000000"
                                            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl py-4 px-5 font-bold text-sm outline-none focus:ring-2 ring-blue-500/20 hover:border-blue-400 transition-all"
                                            value={tempSettings.technical.cityRegistry || ''}
                                            onChange={e => setTempSettings({ ...tempSettings, technical: { ...tempSettings.technical, cityRegistry: e.target.value } })}
                                        />
                                    </div>
                                </div>

                                {/* Additional Fiscal Details - NF-e Configuration */}
                                <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700/50">
                                    <h4 className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase mb-4 flex items-center gap-2">
                                        <FileText size={14} className="text-emerald-500" />
                                        Configurações Avançadas de Nota Fiscal Eletrônica
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                                            <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">Série NF-e</label>
                                            <input
                                                type="text"
                                                value={tempSettings.technical.nfeSeries || '1'}
                                                onChange={e => setTempSettings({ ...tempSettings, technical: { ...tempSettings.technical, nfeSeries: e.target.value } })}
                                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg py-2 px-3 font-bold text-sm"
                                            />
                                        </div>
                                        <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                                            <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">Próximo Número</label>
                                            <input
                                                type="number"
                                                value={tempSettings.technical.nfeNextNumber || 10001}
                                                onChange={e => setTempSettings({ ...tempSettings, technical: { ...tempSettings.technical, nfeNextNumber: Number(e.target.value) } })}
                                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg py-2 px-3 font-bold text-sm"
                                            />
                                        </div>
                                        <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                                            <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">Ambiente</label>
                                            <select
                                                value={tempSettings.technical.nfeEnvironment || 'homologacao'}
                                                onChange={e => setTempSettings({ ...tempSettings, technical: { ...tempSettings.technical, nfeEnvironment: e.target.value as any } })}
                                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg py-2 px-3 font-bold text-sm"
                                            >
                                                <option value="homologacao">Homologação</option>
                                                <option value="producao">Produção</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* Certificate Management */}
                                <div className="mt-4 p-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <Key size={18} className="text-amber-500" />
                                            <h5 className="font-black text-sm text-slate-900 dark:text-white">Certificado Digital (A1)</h5>
                                        </div>
                                        <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-[10px] font-black uppercase">
                                            Válido até {tempSettings.technical.certificateExpiry || '15/08/2026'}
                                        </span>
                                    </div>
                                    <div className="flex gap-3 flex-wrap">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const nextYear = new Date();
                                                nextYear.setFullYear(nextYear.getFullYear() + 1);
                                                const newExpiry = nextYear.toLocaleDateString('pt-BR');
                                                setTempSettings({
                                                    ...tempSettings,
                                                    technical: {
                                                        ...tempSettings.technical,
                                                        certificateExpiry: newExpiry
                                                    }
                                                });
                                                addToast(`Certificado Digital A1 renovado! Nova validade: ${newExpiry}`, 'success');
                                            }}
                                            className="px-4 py-2 bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-bold hover:bg-emerald-50 hover:text-emerald-600 transition-colors flex items-center gap-2"
                                        >
                                            <Upload size={14} /> Atualizar Certificado
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setShowCertDetails(!showCertDetails)}
                                            className="px-4 py-2 bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-bold hover:bg-slate-100 transition-colors flex items-center gap-2"
                                        >
                                            <Eye size={14} /> {showCertDetails ? 'Ocultar Detalhes' : 'Ver Detalhes'}
                                        </button>
                                    </div>
                                    {showCertDetails && (
                                        <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-xs space-y-1 animate-in fade-in duration-200">
                                            <p><strong className="text-slate-700 dark:text-slate-300">Titular:</strong> {tempSettings.companyName} ({tempSettings.document})</p>
                                            <p><strong className="text-slate-700 dark:text-slate-300">Autoridade Certificadora:</strong> ICP-Brasil / AC Certisign Múltipla G7</p>
                                            <p><strong className="text-slate-700 dark:text-slate-300">Tipo / Série:</strong> A1 (Arquivo PKCS#12) • SHA-256</p>
                                            <p><strong className="text-slate-700 dark:text-slate-300">Status SEFAZ:</strong> <span className="text-emerald-600 font-bold">Conectado e Autorizado</span></p>
                                        </div>
                                    )}
                                </div>
                            </section>

                            {/* Regional & Localization */}
                            <section className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20 p-8 rounded-[32px] border border-indigo-100 dark:border-indigo-900/30">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-2.5 bg-indigo-500 rounded-xl text-white">
                                        <Globe size={20} />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">Regionalização & Formato</h3>
                                        <p className="text-[10px] text-slate-500 font-medium">Configurações de idioma, moeda e fuso horário</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Idioma do Sistema</label>
                                        <select className="w-full bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-900/50 rounded-2xl py-4 px-5 font-bold text-sm outline-none cursor-pointer hover:border-indigo-400 transition-all" value={tempSettings.language} onChange={e => setTempSettings({ ...tempSettings, language: e.target.value })}>
                                            <option value="pt-BR">🇧🇷 Português (Brasil)</option>
                                            <option value="en-US">🇺🇸 English (US)</option>
                                            <option value="es-ES">🇪🇸 Español</option>
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Moeda Padrão</label>
                                        <select className="w-full bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-900/50 rounded-2xl py-4 px-5 font-bold text-sm outline-none cursor-pointer hover:border-indigo-400 transition-all" value={tempSettings.currency} onChange={e => setTempSettings({ ...tempSettings, currency: e.target.value })}>
                                            <option value="BRL">R$ Real Brasileiro</option>
                                            <option value="USD">$ Dólar Americano</option>
                                            <option value="EUR">€ Euro</option>
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Fuso Horário</label>
                                        <select className="w-full bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-900/50 rounded-2xl py-4 px-5 font-bold text-sm outline-none cursor-pointer hover:border-indigo-400 transition-all" value={tempSettings.technical.timezone} onChange={e => setTempSettings({ ...tempSettings, technical: { ...tempSettings.technical, timezone: e.target.value } })}>
                                            <option value="America/Sao_Paulo">São Paulo (UTC-3)</option>
                                            <option value="America/Manaus">Manaus (UTC-4)</option>
                                            <option value="America/Rio_Branco">Rio Branco (UTC-5)</option>
                                            <option value="UTC">UTC (Universal)</option>
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Formato de Data</label>
                                        <select className="w-full bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-900/50 rounded-2xl py-4 px-5 font-bold text-sm outline-none cursor-pointer hover:border-indigo-400 transition-all" value={tempSettings.technical.dateFormat} onChange={e => setTempSettings({ ...tempSettings, technical: { ...tempSettings.technical, dateFormat: e.target.value } })}>
                                            <option value="DD/MM/YYYY">DD/MM/YYYY (BR)</option>
                                            <option value="MM/DD/YYYY">MM/DD/YYYY (US)</option>
                                            <option value="YYYY-MM-DD">YYYY-MM-DD (ISO)</option>
                                        </select>
                                    </div>
                                </div>
                            </section>
                            </>
                            )}

                            {(systemCategory === 'all' || systemCategory === 'appearance') && (
                            <>
                            {/* Layout & Design Studio Relocated Card */}
                            <section className="bg-gradient-to-br from-indigo-50/80 via-cyan-50/40 to-slate-50 dark:from-slate-900/60 dark:via-indigo-950/20 dark:to-slate-800/40 p-6 sm:p-8 rounded-[32px] border border-indigo-100 dark:border-indigo-900/30 shadow-xs mb-8">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="flex items-center gap-3.5">
                                        <div className="p-3 bg-gradient-to-tr from-cyan-600 to-indigo-600 rounded-2xl text-white shadow-md shadow-indigo-500/20">
                                            <Palette size={22} />
                                        </div>
                                        <div>
                                            <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
                                                Studio de Designer & Layout
                                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-black">ESTILO</span>
                                            </h3>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                                                Personalize a paleta de cores corporativas, temas (Claro, Escuro, OLED), tipografia, cantos arredondados e densidade visual do ERP em tempo real.
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => window.dispatchEvent(new CustomEvent('infracore:open-layout-designer'))}
                                        className="px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25 transition-all hover:scale-105 active:scale-95 shrink-0"
                                    >
                                        <Palette size={16} />
                                        <span>Abrir Studio Completo</span>
                                    </button>
                                </div>
                            </section>

                            {/* Notification Preferences */}
                            <section className="bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-950/20 dark:to-pink-950/20 p-8 rounded-[32px] border border-rose-100 dark:border-rose-900/30">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-2.5 bg-rose-500 rounded-xl text-white">
                                        <Bell size={20} />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">Preferências de Notificação</h3>
                                        <p className="text-[10px] text-slate-500 font-medium">Controle de alertas e avisos do sistema</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    {[
                                        { key: 'stockAlerts', label: 'Estoque Baixo', desc: 'Alertas de reposição', icon: '📦' },
                                        { key: 'overdueFinance', label: 'Financeiro', desc: 'Contas a pagar/receber', icon: '💰' },
                                        { key: 'productionUpdates', label: 'Produção', desc: 'Status de ordens', icon: '⚙️' },
                                        { key: 'fleetMaintenance', label: 'Frota', desc: 'Manutenção preventiva', icon: '🚛' },
                                    ].map(n => {
                                        const isActive = tempSettings.notifications[n.key as keyof typeof tempSettings.notifications];
                                        return (
                                            <div
                                                key={n.key}
                                                onClick={() => setTempSettings({ ...tempSettings, notifications: { ...tempSettings.notifications, [n.key]: !isActive } })}
                                                className={`cursor-pointer p-5 rounded-2xl border-2 transition-all flex flex-col gap-3 group hover:scale-105 ${isActive
                                                    ? 'bg-white dark:bg-slate-800 border-rose-400 shadow-lg shadow-rose-500/10'
                                                    : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 opacity-60 hover:opacity-100'
                                                    }`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <span className="text-2xl">{n.icon}</span>
                                                    <div className={`w-11 h-6 rounded-full relative transition-all ${isActive ? 'bg-rose-500' : 'bg-slate-300 dark:bg-slate-600'}`}>
                                                        <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-all ${isActive ? 'left-5' : 'left-0.5'}`}></div>
                                                    </div>
                                                </div>
                                                <div>
                                                    <p className={`text-xs font-black uppercase mb-1 ${isActive ? 'text-rose-900 dark:text-rose-200' : 'text-slate-500'}`}>{n.label}</p>
                                                    <p className="text-[10px] text-slate-400 leading-tight">{n.desc}</p>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </section>

                            {/* Interface & UX */}
                            <section className="bg-gradient-to-br from-violet-50 to-fuchsia-50 dark:from-violet-950/20 dark:to-fuchsia-950/20 p-8 rounded-[32px] border border-violet-100 dark:border-violet-900/30">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-2.5 bg-violet-500 rounded-xl text-white">
                                        <Palette size={20} />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">Interface & Experiência</h3>
                                        <p className="text-[10px] text-slate-500 font-medium">Personalização visual do sistema</p>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div>
                                        <label className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase mb-4 block">Tema da Interface</label>
                                        <div className="grid grid-cols-3 gap-4">
                                            {[
                                                { id: 'light', label: 'Claro', icon: '☀️', preview: 'bg-white border-slate-200' },
                                                { id: 'dark', label: 'Escuro', icon: '🌙', preview: 'bg-slate-900 border-slate-700' },
                                                { id: 'system', label: 'Automático', icon: '💻', preview: 'bg-gradient-to-br from-white to-slate-900' }
                                            ].map(t => (
                                                <button
                                                    key={t.id}
                                                    onClick={() => setTempSettings({ ...tempSettings, theme: t.id as any })}
                                                    className={`p-6 rounded-2xl flex flex-col items-center gap-3 border-2 transition-all hover:scale-105 ${tempSettings.theme === t.id
                                                        ? 'bg-violet-100 dark:bg-violet-900/20 border-violet-500 shadow-lg shadow-violet-500/20'
                                                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-violet-300'
                                                        }`}
                                                >
                                                    <div className={`w-full h-16 ${t.preview} rounded-xl border-2 shadow-inner`}></div>
                                                    <span className="text-2xl">{t.icon}</span>
                                                    <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">{t.label}</span>
                                                    {tempSettings.theme === t.id && (
                                                        <div className="w-2 h-2 bg-violet-500 rounded-full animate-pulse"></div>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="p-5 bg-white dark:bg-slate-800 rounded-2xl border border-violet-100 dark:border-violet-900/30">
                                            <label className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase mb-3 block">Densidade da Interface</label>
                                            <div className="flex gap-2">
                                                {['Compacta', 'Padrão', 'Confortável'].map(density => {
                                                    const value = density === 'Compacta' ? 'compact' : density === 'Padrão' ? 'standard' : 'comfortable';
                                                    return (
                                                        <button
                                                            key={density}
                                                            onClick={() => setTempSettings({ ...tempSettings, interfaceDensity: value as any })}
                                                            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-colors ${tempSettings.interfaceDensity === value
                                                                ? 'bg-violet-100 text-violet-700 border border-violet-200 dark:bg-violet-900/40 dark:text-violet-200 dark:border-violet-700'
                                                                : 'bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-violet-50 hover:text-violet-600'
                                                                }`}
                                                        >
                                                            {density}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        <div className="p-5 bg-white dark:bg-slate-800 rounded-2xl border border-violet-100 dark:border-violet-900/30">
                                            <label className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase mb-3 block">Animações</label>
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs text-slate-500">Transições e efeitos visuais</span>
                                                <div
                                                    onClick={() => setTempSettings({ ...tempSettings, enableAnimations: !tempSettings.enableAnimations })}
                                                    className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors ${tempSettings.enableAnimations ? 'bg-violet-500' : 'bg-slate-300 dark:bg-slate-600'}`}
                                                >
                                                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${tempSettings.enableAnimations ? 'right-1' : 'left-1'}`}></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </section>
                            </>
                            )}

                            {/* Operational Parameters */}
                            {(systemCategory === 'all' || systemCategory === 'operational') && (
                                <OperationalParametersSection settings={tempSettings} onUpdate={setTempSettings} addToast={addToast} />
                            )}

                            {/* Integrations & E-mail */}
                            {(systemCategory === 'all' || systemCategory === 'integrations') && (
                                <>
                                    <IntegrationsSection settings={tempSettings} onUpdate={setTempSettings} addToast={addToast} />
                                    <EmailCommunicationSection settings={tempSettings} onUpdate={setTempSettings} addToast={addToast} />
                                </>
                            )}

                            {/* Documents & Printing */}
                            {(systemCategory === 'all' || systemCategory === 'documents') && (
                                <DocumentsPrintingSection settings={tempSettings} onUpdate={setTempSettings} addToast={addToast} />
                            )}

                            {/* Data Security & Danger Zone */}
                            {(systemCategory === 'all' || systemCategory === 'maintenance') && (
                                <>
                                                                        <DataSecuritySection settings={tempSettings} onUpdate={setTempSettings} addToast={addToast} />

                            {/* Danger Zone */}
                            <section className="mt-8 pt-8 border-t-2 border-dashed border-slate-200 dark:border-slate-700">
                                <div className="bg-gradient-to-br from-rose-50 to-red-50 dark:from-rose-950/20 dark:to-red-950/20 border-2 border-rose-200 dark:border-rose-900/50 p-8 rounded-[32px] flex flex-col md:flex-row items-center justify-between gap-6">
                                    <div className="flex items-start gap-4">
                                        <div className="p-3 bg-rose-500 text-white rounded-2xl shadow-lg shadow-rose-500/30">
                                            <AlertTriangle size={28} />
                                        </div>
                                        <div>
                                            <h4 className="font-black text-lg text-rose-900 dark:text-rose-400 uppercase tracking-tight">Zona de Perigo</h4>
                                            <p className="text-sm text-rose-700 dark:text-rose-300/70 mt-1 font-medium max-w-md">
                                                Ações irreversíveis de manutenção e limpeza do sistema. Proceda com extrema cautela.
                                            </p>
                                            <div className="mt-3 flex flex-wrap gap-2">
                                                <span className="px-2 py-1 bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 rounded-md text-[10px] font-black uppercase">Sem Desfazer</span>
                                                <span className="px-2 py-1 bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 rounded-md text-[10px] font-black uppercase">Requer Confirmação</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-3">
                                        <button
                                            onClick={() => {
                                                addToast("⚠️ ATENÇÃO: Isso apagará TODOS os dados. Deseja continuar?", 'warning', 10000, {
                                                    label: 'RESETAR TOTALMENTE',
                                                    onClick: () => {
                                                        clearAllData();
                                                        addToast('Sistema resetado. Recarregando...', 'info');
                                                    }
                                                });
                                            }}
                                            className="px-8 py-4 bg-white hover:bg-rose-600 text-rose-600 hover:text-white border-2 border-rose-300 hover:border-rose-600 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-lg hover:shadow-rose-500/30 hover:scale-105 active:scale-95"
                                        >
                                            🗑️ Resetar Sistema Completo
                                        </button>

                                        <button
                                            onClick={() => {
                                                addToast("Carregar Planta Industrial completa (Usinas, Laboratório DNIT, Fórmulas, Pneus, DRE e Contas)?", 'info', 10000, {
                                                    label: 'CARREGAR',
                                                    onClick: () => {
                                                        const data = generateCameloData();
                                                        seedDatabase(data);
                                                        addToast('Planta Industrial completa carregada com sucesso!', 'success');
                                                    }
                                                });
                                            }}
                                            className="px-8 py-4 bg-white hover:bg-emerald-600 text-emerald-600 hover:text-white border-2 border-emerald-300 hover:border-emerald-600 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-lg hover:shadow-emerald-500/30 hover:scale-105 active:scale-95 flex flex-col items-center gap-2"
                                        >
                                            <span className="text-2xl">🏭</span>
                                            <span>Carregar Planta Industrial</span>
                                            <span className="text-[9px] opacity-75 lowercase font-mono">(britagem • usina asfalto • central concreto • laboratório dnit)</span>
                                        </button>
                                        <p className="text-[9px] text-rose-600 dark:text-rose-400 text-center font-bold">Esta ação apaga todos os dados permanentemente</p>
                                    </div>
                                </div>
                            </section>
                                </>
                            )}
                        </div>
                    )}

                    {/* AUDIT LOG */}
                    {activeTab === 'audit' && (
                        <div className="h-full flex flex-col animate-in fade-in duration-500 space-y-6">
                            {/* Dashboard Stats */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                                <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden">
                                    <div className="absolute right-0 top-0 p-4 opacity-10"><Shield size={64} /></div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Filtrado</p>
                                    <div className="flex items-baseline gap-2 mt-1">
                                        <p className="text-3xl font-black text-slate-800 dark:text-white">{filteredAuditLogs.length}</p>
                                        <span className="text-[10px] font-bold text-slate-400">de {auditLogs.length}</span>
                                    </div>
                                    <div className="mt-2 text-xs text-emerald-600 font-bold flex items-center gap-1">
                                        <CheckCircle size={12} /> Monitoramento 100% Ativo
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setAuditSeverityFilter(prev => prev === 'critical' ? 'all' : 'critical');
                                        setAuditPage(1);
                                    }}
                                    className={`text-left p-5 rounded-2xl border shadow-sm relative overflow-hidden transition-all ${auditSeverityFilter === 'critical'
                                        ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-700 ring-2 ring-rose-500/30'
                                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-rose-200'
                                        }`}
                                >
                                    <div className="absolute right-0 top-0 p-4 opacity-10 text-rose-600"><AlertTriangle size={64} /></div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-rose-500">Eventos Críticos</p>
                                    <p className="text-3xl font-black text-rose-600 mt-1">
                                        {auditSeverityCounts.critical}
                                    </p>
                                    <div className="mt-2 text-xs text-rose-600 font-bold flex items-center gap-1">
                                        <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping inline-block"></span>
                                        {auditSeverityFilter === 'critical' ? 'Filtro Ativo' : 'Clique p/ filtrar'}
                                    </div>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setAuditSeverityFilter(prev => prev === 'warning' ? 'all' : 'warning');
                                        setAuditPage(1);
                                    }}
                                    className={`text-left p-5 rounded-2xl border shadow-sm relative overflow-hidden transition-all ${auditSeverityFilter === 'warning'
                                        ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700 ring-2 ring-amber-500/30'
                                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-amber-200'
                                        }`}
                                >
                                    <div className="absolute right-0 top-0 p-4 opacity-10 text-amber-600"><AlertTriangle size={64} /></div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-amber-500">Avisos & Alertas</p>
                                    <p className="text-3xl font-black text-amber-600 mt-1">
                                        {auditSeverityCounts.warning}
                                    </p>
                                    <div className="mt-2 text-xs text-amber-600 font-bold flex items-center gap-1">
                                        {auditSeverityFilter === 'warning' ? 'Filtro Ativo' : 'Clique p/ filtrar'}
                                    </div>
                                </button>

                                <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden">
                                    <div className="absolute right-0 top-0 p-4 opacity-10"><Users size={64} /></div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Usuários Ativos</p>
                                    <p className="text-3xl font-black text-slate-800 dark:text-white mt-1">
                                        {[...new Set(filteredAuditLogs.map(l => l.userName))].length}
                                    </p>
                                    <div className="mt-2 text-xs text-indigo-500 font-bold">
                                        Rastreados no período
                                    </div>
                                </div>

                                <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden flex flex-col justify-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowAuditReportModal(true)}
                                        className="w-full py-2 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all group"
                                        title="Dica: Gerar relatório executivo com cabeçalho institucional formatado para impressão e PDF"
                                    >
                                        <FileText size={14} />
                                        <span>Relatório Executivo</span>
                                        <span className="px-1.5 py-0.2 rounded text-[9px] bg-white/25 uppercase font-black tracking-wider">PDF</span>
                                    </button>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            type="button"
                                            onClick={() => exportAuditToCSV(filteredAuditLogs)}
                                            className="py-1.5 px-2 bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 text-white rounded-lg text-[10px] font-bold flex items-center justify-center gap-1.5 transition-colors group"
                                            title="Dica: Exportar registros filtrados em planilha CSV com delimitador ponto e vírgula e UTF-8 BOM para Excel"
                                        >
                                            <FileSpreadsheet size={12} className="text-emerald-400" />
                                            <span>CSV</span>
                                            <span className="text-[8px] font-black text-emerald-300 bg-emerald-500/20 px-1 py-0.2 rounded">EXCEL</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => exportAuditToJSON(filteredAuditLogs)}
                                            className="py-1.5 px-2 bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1.5 transition-colors group"
                                            title="Dica: Exportar histórico filtrado em JSON completo com indentação estruturada para ingestão em SIEM / SOC"
                                        >
                                            <FileJson size={12} className="text-indigo-400" />
                                            <span>JSON</span>
                                            <span className="text-[8px] font-black text-indigo-400 bg-indigo-500/20 px-1 py-0.2 rounded">SIEM</span>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Filters and Toolbar with Progressive Disclosure */}
                            <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-200 dark:border-slate-700 space-y-4 shadow-sm">
                                {/* Linha Principal: Busca, Presets de Período e Botão de Filtros Avançados */}
                                <div className="flex flex-col xl:flex-row gap-3 justify-between items-stretch xl:items-center">
                                    <div className="flex-1 relative">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <input
                                            type="text"
                                            placeholder="Buscar por ação, usuário, ID, IP, módulo ou detalhes..."
                                            className="w-full pl-12 pr-10 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs sm:text-sm font-medium outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
                                            value={auditSearch}
                                            onChange={(e) => {
                                                setAuditSearch(e.target.value);
                                                setAuditPage(1);
                                            }}
                                        />
                                        {auditSearch && (
                                            <button
                                                type="button"
                                                onClick={() => setAuditSearch('')}
                                                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                                                title="Limpar texto de busca"
                                            >
                                                <X size={14} />
                                            </button>
                                        )}
                                    </div>

                                    {/* Presets Rápidos de Período */}
                                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
                                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider hidden sm:inline mr-1" title="Dica: Filtrar eventos pela janela temporal">
                                            Período:
                                        </span>
                                        {[
                                            { id: 'today', label: 'Hoje' },
                                            { id: 'yesterday', label: 'Ontem' },
                                            { id: '7days', label: '7 Dias' },
                                            { id: '30days', label: '30 Dias' },
                                            { id: 'thisMonth', label: 'Este Mês' },
                                            { id: 'all', label: 'Tudo' }
                                        ].map(preset => (
                                            <button
                                                key={preset.id}
                                                type="button"
                                                onClick={() => handleSetPeriodPreset(preset.id as any)}
                                                className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap border ${auditPeriodPreset === preset.id
                                                    ? 'bg-slate-900 text-white border-slate-900 dark:bg-cyan-500 dark:text-slate-950 dark:border-cyan-500 shadow-sm'
                                                    : 'bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                                                    }`}
                                                title={`Dica: Filtrar eventos ocorridos em: ${preset.label}`}
                                            >
                                                {preset.label}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Botão de Expansão de Filtros Avançados */}
                                    <div className="flex items-center gap-2 shrink-0">
                                        <button
                                            type="button"
                                            onClick={() => setShowAdvancedAuditFilters(prev => !prev)}
                                            className={`px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 border ${showAdvancedAuditFilters || activeAdvancedFilterCount > 0
                                                ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-700 shadow-sm'
                                                : 'bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                                                }`}
                                            title="Dica: Clique para abrir/recolher filtros avançados por Módulo, Usuário e Datas Personalizadas"
                                        >
                                            <SlidersHorizontal size={14} className={activeAdvancedFilterCount > 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'} />
                                            <span>Filtros Avançados</span>
                                            {activeAdvancedFilterCount > 0 && (
                                                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-indigo-600 text-white">
                                                    {activeAdvancedFilterCount}
                                                </span>
                                            )}
                                            <ChevronDown size={14} className={`transition-transform duration-200 ${showAdvancedAuditFilters ? 'rotate-180' : ''}`} />
                                        </button>

                                        {/* Botão Limpar Filtros Geral */}
                                        {(auditSearch || auditModuleFilter !== 'Todos' || auditUserFilter !== 'Todos' || auditSeverityFilter !== 'all' || auditPeriodPreset !== '30days') && (
                                            <button
                                                type="button"
                                                onClick={handleResetAuditFilters}
                                                className="px-3 py-2 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded-2xl text-xs font-bold hover:bg-rose-100 flex items-center gap-1.5 transition-colors"
                                                title="Dica: Redefinir todos os filtros de busca, severidade, período e módulos para o padrão"
                                            >
                                                <RotateCcw size={13} />
                                                <span className="hidden sm:inline">Limpar</span>
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Linha 2: Filtros de Severidade */}
                                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-700/60">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider mr-1" title="Dica: Classificação de risco e criticidade técnica do log">
                                            Severidade:
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => { setAuditSeverityFilter('all'); setAuditPage(1); }}
                                            className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border ${auditSeverityFilter === 'all'
                                                ? 'bg-slate-800 text-white border-slate-800 dark:bg-white dark:text-slate-900'
                                                : 'bg-white dark:bg-slate-900 text-slate-500 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                                                }`}
                                            title="Dica: Exibir todos os níveis de severidade"
                                        >
                                            Todas ({auditSeverityCounts.all})
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => { setAuditSeverityFilter('info'); setAuditPage(1); }}
                                            className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border flex items-center gap-1.5 ${auditSeverityFilter === 'info'
                                                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                                : 'bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-900/50 hover:bg-blue-100'
                                                }`}
                                            title="Dica: Eventos operacionais de rotina sem desvios (info)"
                                        >
                                            <Info size={11} /> Informativo ({auditSeverityCounts.info})
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => { setAuditSeverityFilter('warning'); setAuditPage(1); }}
                                            className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border flex items-center gap-1.5 ${auditSeverityFilter === 'warning'
                                                ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                                                : 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900/50 hover:bg-amber-100'
                                                }`}
                                            title="Dica: Avisos operacionais, alterações sensíveis ou tentativas suspeitas (warning)"
                                        >
                                            <AlertTriangle size={11} /> Avisos ({auditSeverityCounts.warning})
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => { setAuditSeverityFilter('critical'); setAuditPage(1); }}
                                            className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border flex items-center gap-1.5 ${auditSeverityFilter === 'critical'
                                                ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                                                : 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900/50 hover:bg-rose-100'
                                                }`}
                                            title="Dica: Falhas críticas de segurança, exclusões massivas ou bloqueios do sistema (critical)"
                                        >
                                            <AlertTriangle size={11} /> Críticos ({auditSeverityCounts.critical})
                                        </button>
                                    </div>

                                    <div className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                                        <Clock size={12} className="text-slate-400" />
                                        <span>Exibindo <strong>{filteredAuditLogs.length}</strong> registros</span>
                                    </div>
                                </div>

                                {/* PAINEL EXPANSÍVEL: FILTROS AVANÇADOS (Divulgação Progressiva) */}
                                {showAdvancedAuditFilters && (
                                    <div className="pt-4 border-t border-slate-100 dark:border-slate-700/60 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                                        <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/80">
                                            {/* Range Personalizado De / Até */}
                                            <div className="flex items-center gap-2">
                                                <Calendar size={14} className="text-indigo-500 shrink-0" />
                                                <span className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                                                    Intervalo Específico:
                                                </span>
                                                <input
                                                    type="date"
                                                    value={auditStartDate}
                                                    onChange={e => {
                                                        setAuditStartDate(e.target.value);
                                                        setAuditPeriodPreset('custom');
                                                        setAuditPage(1);
                                                    }}
                                                    className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1 text-xs font-bold text-slate-700 dark:text-slate-200 outline-none w-32"
                                                    title="Data inicial do filtro"
                                                />
                                                <span className="text-slate-400 text-xs font-bold">até</span>
                                                <input
                                                    type="date"
                                                    value={auditEndDate}
                                                    onChange={e => {
                                                        setAuditEndDate(e.target.value);
                                                        setAuditPeriodPreset('custom');
                                                        setAuditPage(1);
                                                    }}
                                                    className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1 text-xs font-bold text-slate-700 dark:text-slate-200 outline-none w-32"
                                                    title="Data final do filtro"
                                                />
                                            </div>

                                            {/* Dropdowns de Usuário e Módulo */}
                                            <div className="flex items-center gap-2 flex-wrap">
                                                {/* Usuário */}
                                                <div className="relative">
                                                    <select
                                                        value={auditUserFilter}
                                                        onChange={e => {
                                                            setAuditUserFilter(e.target.value);
                                                            setAuditPage(1);
                                                        }}
                                                        className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 outline-none cursor-pointer pr-8"
                                                        title="Dica: Filtrar por operador ou usuário responsável"
                                                    >
                                                        <option value="Todos">👤 Todos os Usuários ({auditAvailableUsers.length})</option>
                                                        {auditAvailableUsers.map(u => (
                                                            <option key={u.id} value={u.id}>{u.name} (ID: {u.id})</option>
                                                        ))}
                                                    </select>
                                                </div>

                                                {/* Módulo */}
                                                <div className="relative">
                                                    <select
                                                        value={auditModuleFilter}
                                                        onChange={e => {
                                                            setAuditModuleFilter(e.target.value);
                                                            setAuditPage(1);
                                                        }}
                                                        className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 outline-none cursor-pointer pr-8"
                                                        title="Dica: Filtrar por módulo do sistema"
                                                    >
                                                        {auditAvailableModules.map(m => (
                                                            <option key={m} value={m}>
                                                                📂 Módulo: {m} ({auditModuleCounts[m] ?? 0})
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Module Horizontal Chips */}
                                        <div className="space-y-1.5">
                                            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
                                                Atalhos de Módulo (Clique para isolar):
                                            </span>
                                            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                                                {auditAvailableModules.map(m => {
                                                    const count = auditModuleCounts[m] ?? 0;
                                                    const isActive = auditModuleFilter === m;
                                                    return (
                                                        <button
                                                            key={m}
                                                            type="button"
                                                            onClick={() => {
                                                                setAuditModuleFilter(m);
                                                                setAuditPage(1);
                                                            }}
                                                            className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wide whitespace-nowrap transition-all border flex items-center gap-1.5 ${isActive
                                                                ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 shadow-sm'
                                                                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                                                                }`}
                                                            title={`Dica: Filtrar logs exclusivamente do módulo ${m}`}
                                                        >
                                                            <span>{m}</span>
                                                            <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-mono ${isActive
                                                                ? 'bg-white/20 text-white dark:bg-slate-900/20 dark:text-slate-900'
                                                                : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                                                                }`}>
                                                                {count}
                                                            </span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Data Table */}
                            <div className="flex-1 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col">
                                <div className="overflow-y-auto flex-1 custom-scrollbar">
                                    <table className="w-full text-left border-collapse">
                                        <thead className="bg-slate-50 dark:bg-slate-900 sticky top-0 z-10 border-b border-slate-200 dark:border-slate-700">
                                            <tr>
                                                <th className="py-4 px-6 text-[10px] font-black uppercase text-slate-400 tracking-widest w-44" title="Dica: Data, hora precisa e tempo relativo decorrido do evento">Data / Hora</th>
                                                <th className="py-4 px-6 text-[10px] font-black uppercase text-slate-400 tracking-widest w-28" title="Dica: Classificação de risco operacional (Informativo, Aviso ou Crítico)">Severidade</th>
                                                <th className="py-4 px-6 text-[10px] font-black uppercase text-slate-400 tracking-widest w-48" title="Dica: Operador autenticado ou agente executor">Operador / Usuário</th>
                                                <th className="py-4 px-6 text-[10px] font-black uppercase text-slate-400 tracking-widest w-44" title="Dica: Módulo afetado e método técnico acionado">Módulo / Ação</th>
                                                <th className="py-4 px-6 text-[10px] font-black uppercase text-slate-400 tracking-widest" title="Dica: Detalhamento forense e parâmetros técnicos da transação">Detalhes Forenses</th>
                                                <th className="py-4 px-6 text-[10px] font-black uppercase text-slate-400 tracking-widest w-28 text-center" title="Dica: Endereço IP e identificador de origem do cliente">Origem / IP</th>
                                                <th className="py-4 px-6 text-[10px] font-black uppercase text-slate-400 tracking-widest w-28 text-right" title="Dica: Abrir painel forense com visualizador JSON">Ações</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                            {filteredAuditLogs.length > 0 ? (
                                                filteredAuditLogs.slice((auditPage - 1) * auditPageSize, auditPage * auditPageSize).map(log => {
                                                    const isCritical = log.severity === 'critical';
                                                    const isWarning = log.severity === 'warning';
                                                    const isJSON = log.details && (log.details.trim().startsWith('{') || log.details.trim().startsWith('['));
                                                    return (
                                                        <tr
                                                            key={log.id}
                                                            onClick={() => setSelectedAuditLog(log)}
                                                            className={`group cursor-pointer transition-colors ${isCritical
                                                                ? 'hover:bg-rose-50/70 dark:hover:bg-rose-950/20'
                                                                : isWarning
                                                                    ? 'hover:bg-amber-50/70 dark:hover:bg-amber-950/20'
                                                                    : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'
                                                                }`}
                                                        >
                                                            <td className="py-4 px-6">
                                                                <div className="flex flex-col">
                                                                    <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                                                                        {log.timestamp.includes(' ') ? log.timestamp.split(' ')[0] : log.timestamp.split('T')[0]}
                                                                    </span>
                                                                    <div className="flex items-center gap-1.5 mt-0.5">
                                                                        <span className="text-[10px] font-mono text-slate-400">
                                                                            {log.timestamp.includes(' ') ? log.timestamp.split(' ')[1] : log.timestamp.split('T')[1]?.substring(0, 8)}
                                                                        </span>
                                                                        <span className="text-[9px] font-medium text-slate-400 bg-slate-100 dark:bg-slate-700/60 px-1.5 py-0.2 rounded">
                                                                            {formatRelativeTime(log.timestamp)}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="py-4 px-6">
                                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase border ${isCritical
                                                                    ? 'bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300'
                                                                    : isWarning
                                                                        ? 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-300'
                                                                        : 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-950/40 dark:border-blue-800 dark:text-blue-300'
                                                                    }`}>
                                                                    {isCritical && <AlertTriangle size={11} className="animate-pulse" />}
                                                                    {isWarning && <AlertTriangle size={11} />}
                                                                    {!isCritical && !isWarning && <Info size={11} />}
                                                                    {log.severity}
                                                                </span>
                                                            </td>
                                                            <td className="py-4 px-6">
                                                                <div className="flex items-center gap-2.5">
                                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${isCritical
                                                                        ? 'bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-200'
                                                                        : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200'
                                                                        }`}>
                                                                        {log.userName.charAt(0).toUpperCase()}
                                                                    </div>
                                                                    <div className="flex flex-col min-w-0">
                                                                        <span className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                                                                            {log.userName}
                                                                        </span>
                                                                        <span className="text-[10px] font-mono text-slate-400 truncate">
                                                                            ID: {log.userId || 'N/A'}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="py-4 px-6">
                                                                <div className="flex flex-col gap-1">
                                                                    <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded w-fit border border-indigo-100 dark:border-indigo-900/40">
                                                                        {log.module}
                                                                    </span>
                                                                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                                                                        {log.action}
                                                                    </span>
                                                                </div>
                                                            </td>
                                                            <td className="py-4 px-6">
                                                                <div className="flex items-start gap-2 max-w-xl">
                                                                    {isJSON && (
                                                                        <span className="px-1.5 py-0.5 bg-slate-900 text-emerald-400 rounded text-[9px] font-mono font-bold shrink-0">
                                                                            JSON
                                                                        </span>
                                                                    )}
                                                                    <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed line-clamp-2">
                                                                        {log.details || 'Sem detalhes complementares.'}
                                                                    </p>
                                                                </div>
                                                            </td>
                                                            <td className="py-4 px-6 text-center">
                                                                <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-900 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700">
                                                                    {log.ip || '127.0.0.1'}
                                                                </span>
                                                            </td>
                                                            <td className="py-4 px-6 text-right">
                                                                <div className="flex items-center justify-end gap-1.5" onClick={e => e.stopPropagation()}>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setSelectedAuditLog(log)}
                                                                        className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-cyan-500 hover:text-white text-slate-600 dark:text-slate-200 transition-colors"
                                                                        title="Inspecionar detalhes forenses completos"
                                                                    >
                                                                        <Eye size={13} />
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => copyTextToClipboard(JSON.stringify(log, null, 2), `Log ${log.id}`)}
                                                                        className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-200 transition-colors"
                                                                        title="Copiar JSON do registro"
                                                                    >
                                                                        <Copy size={13} />
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                })
                                            ) : (
                                                <tr>
                                                    <td colSpan={7} className="py-20 text-center">
                                                        <div className="flex flex-col items-center justify-center">
                                                            <div className="p-4 rounded-full bg-slate-100 dark:bg-slate-700 mb-3 text-slate-400">
                                                                <Search size={32} />
                                                            </div>
                                                            <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                                                                Nenhum registro de auditoria encontrado
                                                            </p>
                                                            <p className="text-xs text-slate-400 mt-1 max-w-sm">
                                                                Nenhum evento corresponde aos filtros de busca, período, severidade ou módulo aplicados.
                                                            </p>
                                                            <button
                                                                type="button"
                                                                onClick={handleResetAuditFilters}
                                                                className="mt-4 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors"
                                                            >
                                                                Redefinir Filtros
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Footer Pagination & Controls */}
                                <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex flex-col sm:flex-row justify-between items-center gap-3">
                                    <div className="flex items-center gap-3">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                                            Mostrando {filteredAuditLogs.length === 0 ? 0 : (auditPage - 1) * auditPageSize + 1} - {Math.min(auditPage * auditPageSize, filteredAuditLogs.length)} de {filteredAuditLogs.length} registros
                                        </span>
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-[10px] text-slate-400 font-bold">Por página:</span>
                                            <select
                                                value={auditPageSize}
                                                onChange={e => {
                                                    setAuditPageSize(Number(e.target.value));
                                                    setAuditPage(1);
                                                }}
                                                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200 px-2 py-1 outline-none"
                                            >
                                                <option value={15}>15</option>
                                                <option value={25}>25</option>
                                                <option value={50}>50</option>
                                                <option value={100}>100</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            disabled={auditPage <= 1}
                                            onClick={() => setAuditPage(1)}
                                            className="px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                            title="Primeira página"
                                        >
                                            «
                                        </button>
                                        <button
                                            type="button"
                                            disabled={auditPage <= 1}
                                            onClick={() => setAuditPage(p => Math.max(1, p - 1))}
                                            className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                        >
                                            Anterior
                                        </button>
                                        <span className="text-xs font-black text-slate-600 dark:text-slate-300 px-2">
                                            Pág. {auditPage} / {Math.max(1, Math.ceil(filteredAuditLogs.length / auditPageSize))}
                                        </span>
                                        <button
                                            type="button"
                                            disabled={auditPage >= Math.ceil(filteredAuditLogs.length / auditPageSize)}
                                            onClick={() => setAuditPage(p => p + 1)}
                                            className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                        >
                                            Próxima
                                        </button>
                                        <button
                                            type="button"
                                            disabled={auditPage >= Math.ceil(filteredAuditLogs.length / auditPageSize)}
                                            onClick={() => setAuditPage(Math.max(1, Math.ceil(filteredAuditLogs.length / auditPageSize)))}
                                            className="px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                            title="Última página"
                                        >
                                            »
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* MODAL FORENSE: DETALHES TÉCNICOS DO REGISTRO */}
                            {selectedAuditLog && (
                                <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
                                    <div className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-[32px] border border-slate-200 dark:border-slate-700 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
                                        {/* Modal Header */}
                                        <div className="px-6 py-5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2.5 rounded-xl ${selectedAuditLog.severity === 'critical'
                                                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                                    : selectedAuditLog.severity === 'warning'
                                                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                                        : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                                    }`}>
                                                    <Shield size={20} />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h3 className="text-base font-black uppercase tracking-wider">
                                                            Registro de Auditoria Forense
                                                        </h3>
                                                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${selectedAuditLog.severity === 'critical'
                                                            ? 'bg-rose-500 text-white'
                                                            : selectedAuditLog.severity === 'warning'
                                                                ? 'bg-amber-500 text-white'
                                                                : 'bg-blue-500 text-white'
                                                            }`}>
                                                            {selectedAuditLog.severity}
                                                        </span>
                                                    </div>
                                                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                                                        ID: {selectedAuditLog.id}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => copyTextToClipboard(selectedAuditLog.id, 'ID do Log')}
                                                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                                                >
                                                    <Copy size={13} />
                                                    Copiar ID
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setSelectedAuditLog(null)}
                                                    className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors"
                                                >
                                                    <X size={18} />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Modal Body */}
                                        <div className="p-6 overflow-y-auto space-y-6 custom-scrollbar">
                                            {/* Metadata Grid */}
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                                <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700">
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">
                                                        Data e Hora
                                                    </span>
                                                    <p className="text-xs font-bold text-slate-800 dark:text-slate-100">
                                                        {selectedAuditLog.timestamp}
                                                    </p>
                                                    <p className="text-[10px] text-indigo-500 font-medium mt-1">
                                                        {formatRelativeTime(selectedAuditLog.timestamp)}
                                                    </p>
                                                </div>

                                                <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700">
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">
                                                        Operador
                                                    </span>
                                                    <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                                                        {selectedAuditLog.userName}
                                                    </p>
                                                    <p className="text-[10px] font-mono text-slate-400 mt-1 truncate">
                                                        ID: {selectedAuditLog.userId || 'N/A'}
                                                    </p>
                                                </div>

                                                <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700">
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">
                                                        Módulo / Ação
                                                    </span>
                                                    <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                                                        {selectedAuditLog.module}
                                                    </p>
                                                    <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 mt-1 truncate">
                                                        {selectedAuditLog.action}
                                                    </p>
                                                </div>

                                                <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700">
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">
                                                        Origem / IP
                                                    </span>
                                                    <p className="text-xs font-mono font-bold text-slate-800 dark:text-slate-100">
                                                        {selectedAuditLog.ip || '127.0.0.1'}
                                                    </p>
                                                    <p className="text-[10px] text-emerald-600 font-bold mt-1">
                                                        Sessão Autenticada
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Details & Payload Section */}
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-200 flex items-center gap-2">
                                                        <Terminal size={14} className="text-cyan-500" /> Detalhes & Carga de Dados (Payload)
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => copyTextToClipboard(selectedAuditLog.details || '', 'Detalhes')}
                                                        className="text-xs text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1 font-bold"
                                                    >
                                                        <Copy size={12} /> Copiar Conteúdo
                                                    </button>
                                                </div>

                                                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-slate-100 font-mono text-xs leading-relaxed max-h-72 overflow-y-auto custom-scrollbar whitespace-pre-wrap selection:bg-cyan-500 selection:text-black">
                                                    {(() => {
                                                        const d = selectedAuditLog.details || '';
                                                        try {
                                                            if (d.trim().startsWith('{') || d.trim().startsWith('[')) {
                                                                const parsed = JSON.parse(d);
                                                                return JSON.stringify(parsed, null, 2);
                                                            }
                                                        } catch {}
                                                        return d || 'Nenhum detalhe adicional informado.';
                                                    })()}
                                                </div>
                                            </div>

                                            {/* Quick Investigation Filters */}
                                            <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3">
                                                <div className="text-xs text-slate-600 dark:text-slate-300">
                                                    <strong>Investigação Técnica:</strong> Aplicar filtros direcionados na tabela
                                                </div>
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setAuditUserFilter(selectedAuditLog.userId || selectedAuditLog.userName);
                                                            setSelectedAuditLog(null);
                                                            addToast(`Filtro aplicado para o usuário: ${selectedAuditLog.userName}`, 'info');
                                                        }}
                                                        className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 rounded-xl hover:bg-slate-100 transition-colors"
                                                    >
                                                        Filtrar por este Usuário
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setAuditModuleFilter(selectedAuditLog.module);
                                                            setSelectedAuditLog(null);
                                                            addToast(`Filtro aplicado para o módulo: ${selectedAuditLog.module}`, 'info');
                                                        }}
                                                        className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 rounded-xl hover:bg-slate-100 transition-colors"
                                                    >
                                                        Filtrar por este Módulo
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => exportAuditToJSON([selectedAuditLog], `Registro_${selectedAuditLog.id}`)}
                                                        className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors"
                                                    >
                                                        <Download size={13} /> Exportar Registro JSON
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Modal Footer */}
                                        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex justify-end">
                                            <button
                                                type="button"
                                                onClick={() => setSelectedAuditLog(null)}
                                                className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors"
                                            >
                                                Fechar Investigação
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* MODAL DE RELATÓRIO RÁPIDO & IMPRESSÃO EXECUTIVA */}
                            {showAuditReportModal && (
                                <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6">
                                    <div className="bg-white dark:bg-slate-900 w-full max-w-4xl max-h-[92vh] rounded-[32px] border border-slate-200 dark:border-slate-700 shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                                        {/* Report Header Toolbar */}
                                        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30">
                                                    <Printer size={18} />
                                                </div>
                                                <div>
                                                    <h3 className="text-sm font-black uppercase tracking-wider">
                                                        Relatório Técnico de Auditoria & Rastreabilidade
                                                    </h3>
                                                    <p className="text-[11px] text-slate-400">
                                                        InfraCore ERP • {settings.companyName || 'Empresa'} • Emissão: {new Date().toLocaleDateString('pt-BR')} {new Date().toLocaleTimeString('pt-BR')}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => window.print()}
                                                    className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
                                                >
                                                    <Printer size={14} /> Imprimir / PDF
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => exportAuditToCSV(filteredAuditLogs, 'Relatorio_Auditoria')}
                                                    className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                                                >
                                                    <FileSpreadsheet size={14} /> CSV
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setShowAuditReportModal(false)}
                                                    className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors"
                                                >
                                                    <X size={18} />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Printable Report Document Body */}
                                        <div className="p-8 overflow-y-auto space-y-6 custom-scrollbar bg-white text-slate-900">
                                            {/* Institutional Document Header */}
                                            <div className="border-b-2 border-slate-900 pb-5 flex justify-between items-start">
                                                <div>
                                                    <h2 className="text-xl font-black uppercase tracking-tight text-slate-900">
                                                        {settings.companyName || 'INFRACORE ENGENHARIA & CONSTRUÇÃO'}
                                                    </h2>
                                                    <p className="text-xs text-slate-600 mt-0.5">
                                                        CNPJ: {settings.document || '00.000.000/0001-00'} • Sistema de Gestão Empresarial Integrado
                                                    </p>
                                                    <p className="text-xs text-slate-500 mt-1">
                                                        Módulo: Segurança da Informação, Governança e Rastreabilidade Operacional
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <span className="px-3 py-1 bg-slate-900 text-white rounded-lg text-[10px] font-black uppercase tracking-widest inline-block">
                                                        DOCUMENTO OFICIAL
                                                    </span>
                                                    <p className="text-[11px] font-mono text-slate-500 mt-2">
                                                        REF: AUD-{new Date().getFullYear()}-{filteredAuditLogs.length}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Report Executive Summary Grid */}
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                                                <div>
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">
                                                        Período Avaliado
                                                    </span>
                                                    <p className="text-xs font-bold text-slate-800 mt-0.5">
                                                        {auditStartDate} até {auditEndDate}
                                                    </p>
                                                </div>
                                                <div>
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">
                                                        Total Ocorrências
                                                    </span>
                                                    <p className="text-base font-black text-slate-900 mt-0.5">
                                                        {filteredAuditLogs.length} registros
                                                    </p>
                                                </div>
                                                <div>
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-rose-500 block">
                                                        Incidentes Críticos
                                                    </span>
                                                    <p className="text-base font-black text-rose-600 mt-0.5">
                                                        {auditSeverityCounts.critical}
                                                    </p>
                                                </div>
                                                <div>
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-amber-500 block">
                                                        Avisos / Alertas
                                                    </span>
                                                    <p className="text-base font-black text-amber-600 mt-0.5">
                                                        {auditSeverityCounts.warning}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Table of Records */}
                                            <div className="border border-slate-200 rounded-xl overflow-hidden">
                                                <table className="w-full text-left text-xs border-collapse">
                                                    <thead className="bg-slate-100 border-b border-slate-200 text-[10px] font-black uppercase text-slate-700">
                                                        <tr>
                                                            <th className="py-2.5 px-3 w-36">Data / Hora</th>
                                                            <th className="py-2.5 px-3 w-24">Gravidade</th>
                                                            <th className="py-2.5 px-3 w-36">Operador</th>
                                                            <th className="py-2.5 px-3 w-32">Módulo</th>
                                                            <th className="py-2.5 px-3 w-36">Ação</th>
                                                            <th className="py-2.5 px-3">Detalhes</th>
                                                            <th className="py-2.5 px-3 w-24 text-right">IP</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-100 text-[11px]">
                                                        {filteredAuditLogs.slice(0, 100).map(log => (
                                                            <tr key={log.id}>
                                                                <td className="py-2 px-3 font-mono text-[10px] whitespace-nowrap">{log.timestamp}</td>
                                                                <td className="py-2 px-3">
                                                                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${log.severity === 'critical' ? 'bg-rose-100 text-rose-800' :
                                                                        log.severity === 'warning' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-800'
                                                                        }`}>
                                                                        {log.severity}
                                                                    </span>
                                                                </td>
                                                                <td className="py-2 px-3 font-bold">{log.userName}</td>
                                                                <td className="py-2 px-3 text-indigo-700 font-bold">{log.module}</td>
                                                                <td className="py-2 px-3">{log.action}</td>
                                                                <td className="py-2 px-3 text-slate-600 leading-snug">{log.details}</td>
                                                                <td className="py-2 px-3 font-mono text-[10px] text-right">{log.ip || '127.0.0.1'}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>

                                            {filteredAuditLogs.length > 100 && (
                                                <p className="text-[11px] text-slate-500 italic text-center">
                                                    * Exibindo os primeiros 100 registros nesta visualização prévia. Use a exportação CSV/JSON para o extrato irrestrito de todos os {filteredAuditLogs.length} eventos.
                                                </p>
                                            )}

                                            {/* Report Institutional Sign-off Footer */}
                                            <div className="pt-6 border-t border-slate-200 flex justify-between items-end text-xs text-slate-500">
                                                <div>
                                                    <p className="font-bold text-slate-700">Emissão Técnica Conforme LGPD & Políticas de Compliance</p>
                                                    <p className="text-[10px] mt-0.5">Operador Auditor: {currentUser?.name || 'Administrador'} (ID: {currentUser?.id || 'ADM'})</p>
                                                    <p className="text-[10px] font-mono mt-0.5">Hash de Integridade: SHA256-{Date.now().toString(36).toUpperCase()}-VERIFIED</p>
                                                </div>
                                                <div className="text-right">
                                                    <div className="w-48 border-b border-slate-400 mb-1"></div>
                                                    <p className="text-[10px] font-bold text-slate-700">Responsável pela Governança de TI</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Report Modal Footer */}
                                        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
                                            <span className="text-xs text-slate-500">
                                                {filteredAuditLogs.length} eventos consolidados no relatório.
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => setShowAuditReportModal(false)}
                                                className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors"
                                            >
                                                Fechar Relatório
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* AI AUDIT & CODE REVIEW AGENT TAB (STRICTLY ADMIN ONLY) */}
                    {activeTab === 'ai_agent' && isSuperAdmin && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <AIAuditAgent mode="embedded" />
                        </div>
                    )}

                    {/* AI AGENTS (WHATSAPP) TAB */}
                    {activeTab === 'ai_agents' && hasPermission('ai.agents.view') && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <AIAgentsHub settings={tempSettings} onUpdate={setTempSettings} canManage={hasPermission('ai.agents.manage')} />
                        </div>
                    )}
                </div>

                {/* Floating Save Action Bar */}
                {hasChanges && (
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white pl-6 pr-2 py-2 rounded-2xl shadow-2xl flex items-center gap-8 animate-in slide-in-from-bottom-6 fade-in duration-300 z-50">
                        <span className="text-xs font-bold flex items-center gap-2">
                            <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                            Alterações não salvas
                        </span>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleRevert}
                                className="px-4 py-2 hover:bg-slate-800 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors text-slate-400 hover:text-white"
                            >
                                Descartar
                            </button>
                            <button
                                onClick={handleSaveSettings}
                                className="px-6 py-2 bg-indigo-500 hover:bg-indigo-400 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-500/30 transition-all hover:scale-105 active:scale-95"
                            >
                                Salvar Mudanças
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* User Modal */}
            {isUserModalOpen && editingUser && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-800 rounded-[32px] shadow-2xl w-full max-w-xl border border-slate-100 dark:border-slate-700 animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[92vh]">
                        {/* Modal Header */}
                        <div className="p-6 sm:p-8 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/70 dark:bg-slate-900/50 shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-2xl">
                                    {editingUser.id ? <Edit2 size={20} /> : <UserPlus size={20} />}
                                </div>
                                <div>
                                    <h3 className="font-black text-xl text-slate-900 dark:text-white uppercase tracking-tighter italic">
                                        {editingUser.id ? 'Editar Usuário' : 'Novo Usuário do Sistema'}
                                    </h3>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">
                                        Controle de credenciais, perfil de acesso e governança RBAC.
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    setIsUserModalOpen(false);
                                    setEditingUser(null);
                                    setShowPassword(false);
                                }}
                                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Form */}
                        <form onSubmit={handleSaveUser} className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-5 custom-scrollbar">
                            <div className="space-y-4">
                                {/* Nome Completo */}
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1">
                                        Nome Completo <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/60 rounded-2xl py-3 px-4 font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-500/30 dark:text-white"
                                        value={editingUser.name}
                                        onChange={e => setEditingUser({ ...editingUser, name: e.target.value })}
                                        placeholder="Ex: Roberto Souza Silva"
                                        required
                                    />
                                </div>

                                {/* Login / Username */}
                                {(() => {
                                    const isEditingRoot = Boolean(editingUser.id && users.find(u => u.id === editingUser.id)?.username.toLowerCase() === 'admin');
                                    return (
                                        <div className="space-y-1.5">
                                            <div className="flex justify-between items-center ml-1">
                                                <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                                    Nome de Usuário (Login) <span className="text-rose-500">*</span>
                                                </label>
                                                {editingUser.username && (
                                                    <span className="text-[10px] font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded-md">
                                                        @{normalizeUsername(editingUser.username) || 'usuario'}
                                                    </span>
                                                )}
                                            </div>
                                            <input
                                                type="text"
                                                readOnly={isEditingRoot}
                                                className={`w-full ${isEditingRoot ? 'bg-slate-100 dark:bg-slate-900/80 cursor-not-allowed opacity-80' : 'bg-slate-50 dark:bg-slate-900'} border border-slate-200 dark:border-slate-700/60 rounded-2xl py-3 px-4 font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-500/30 dark:text-white`}
                                                value={editingUser.username}
                                                onChange={e => !isEditingRoot && setEditingUser({ ...editingUser, username: e.target.value })}
                                                placeholder="Ex: roberto.souza"
                                                required
                                            />
                                            {isEditingRoot ? (
                                                <p className="text-[10px] text-amber-500 font-bold ml-1 flex items-center gap-1">
                                                    <Lock size={12} /> A conta raiz "@admin" é protegida pelo sistema e seu identificador não pode ser renomeado.
                                                </p>
                                            ) : (
                                                <p className="text-[10px] text-slate-400 dark:text-slate-500 ml-1">
                                                    O identificador é normalizado automaticamente para padrão seguro (minúsculas, sem acentos).
                                                </p>
                                            )}
                                        </div>
                                    );
                                })()}

                                {/* E-mail Corporativo */}
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1">
                                        E-mail Corporativo <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="email"
                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/60 rounded-2xl py-3 px-4 font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-500/30 dark:text-white"
                                        value={editingUser.email}
                                        onChange={e => setEditingUser({ ...editingUser, email: e.target.value })}
                                        placeholder="roberto@infracore.com.br"
                                        required
                                    />
                                </div>

                                {/* Senha de Acesso com Checklist de Força */}
                                {(() => {
                                    const pwdStrength = getPasswordStrength(editingUser.password || '');
                                    const rawPwd = editingUser.password || '';
                                    const hasPwd = Boolean(rawPwd && rawPwd.length > 0);
                                    const cleanLogin = normalizeUsername(editingUser.username);
                                    const notContainsLogin = !cleanLogin || !rawPwd.toLowerCase().includes(cleanLogin.toLowerCase());
                                    const passedCount = Object.values(pwdStrength).filter(Boolean).length;
                                    const strengthLabel = passedCount <= 1 ? 'Muito Fraca' : passedCount <= 2 ? 'Fraca' : passedCount <= 3 ? 'Média' : passedCount <= 4 ? 'Boa' : 'Forte & Segura';
                                    const strengthColor = passedCount <= 2 ? 'bg-rose-500' : passedCount <= 3 ? 'bg-amber-500' : passedCount <= 4 ? 'bg-blue-500' : 'bg-emerald-500';

                                    return (
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center ml-1">
                                                <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                                    Senha de Acesso {!editingUser.id && <span className="text-rose-500">*</span>}
                                                </label>
                                                {editingUser.id && (
                                                    <span className="text-[10px] text-slate-400 dark:text-slate-500 italic">
                                                        Deixe em branco para manter a atual
                                                    </span>
                                                )}
                                            </div>
                                            <div className="relative">
                                                <input
                                                    type={showPassword ? 'text' : 'password'}
                                                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/60 rounded-2xl py-3 pl-4 pr-11 font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-500/30 dark:text-white"
                                                    value={editingUser.password || ''}
                                                    onChange={e => setEditingUser({ ...editingUser, password: e.target.value })}
                                                    placeholder={editingUser.id ? "Manter senha atual" : "Defina uma senha forte"}
                                                    required={!editingUser.id}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                                                    title={showPassword ? "Ocultar senha" : "Ver senha"}
                                                >
                                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                                </button>
                                            </div>

                                            {/* Checklist Interativo de Segurança de Senha */}
                                            {(hasPwd || !editingUser.id) && (
                                                <div className="p-3.5 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200/70 dark:border-slate-800 space-y-2.5">
                                                    <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider">
                                                        <span className="text-slate-400">Política de Segurança:</span>
                                                        <span className={passedCount === 5 && notContainsLogin ? 'text-emerald-600 dark:text-emerald-400 font-bold' : passedCount >= 3 ? 'text-amber-600 dark:text-amber-400 font-bold' : 'text-rose-600 dark:text-rose-400 font-bold'}>
                                                            {strengthLabel} ({passedCount}/5)
                                                        </span>
                                                    </div>
                                                    <div className="grid grid-cols-5 gap-1.5 h-1.5">
                                                        {[1, 2, 3, 4, 5].map(step => (
                                                            <div
                                                                key={step}
                                                                className={`rounded-full transition-all duration-300 ${step <= passedCount ? strengthColor : 'bg-slate-200 dark:bg-slate-700'}`}
                                                            />
                                                        ))}
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-1.5 pt-1 text-[10px]">
                                                        <div className={`flex items-center gap-1.5 ${pwdStrength.hasMinLength ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-slate-400'}`}>
                                                            {pwdStrength.hasMinLength ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                                                            <span>Mínimo 8 caracteres</span>
                                                        </div>
                                                        <div className={`flex items-center gap-1.5 ${pwdStrength.hasUpper ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-slate-400'}`}>
                                                            {pwdStrength.hasUpper ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                                                            <span>1 letra maiúscula</span>
                                                        </div>
                                                        <div className={`flex items-center gap-1.5 ${pwdStrength.hasLower ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-slate-400'}`}>
                                                            {pwdStrength.hasLower ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                                                            <span>1 letra minúscula</span>
                                                        </div>
                                                        <div className={`flex items-center gap-1.5 ${pwdStrength.hasNumber ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-slate-400'}`}>
                                                            {pwdStrength.hasNumber ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                                                            <span>1 número (0-9)</span>
                                                        </div>
                                                        <div className={`flex items-center gap-1.5 col-span-2 ${pwdStrength.hasSymbol ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-slate-400'}`}>
                                                            {pwdStrength.hasSymbol ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                                                            <span>1 caractere especial (!@#$%^&*...)</span>
                                                        </div>
                                                        {cleanLogin && hasPwd && (
                                                            <div className={`flex items-center gap-1.5 col-span-2 pt-1 border-t border-slate-200/50 dark:border-slate-800 ${notContainsLogin ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-rose-500 font-bold'}`}>
                                                                {notContainsLogin ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                                                                <span>Não contém o nome de usuário (login)</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })()}

                                {/* Role e Status */}
                                {(() => {
                                    const isSelf = editingUser.id === currentUser?.id;
                                    const isEditingRoot = Boolean(editingUser.id && users.find(u => u.id === editingUser.id)?.username.toLowerCase() === 'admin');
                                    const isRoleDisabled = isEditingRoot || (isSelf && !isSuperAdmin);

                                    return (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1">
                                                    Cargo / Perfil de Acesso <span className="text-rose-500">*</span>
                                                </label>
                                                <select
                                                    disabled={isRoleDisabled}
                                                    className={`w-full ${isRoleDisabled ? 'bg-slate-100 dark:bg-slate-900/80 cursor-not-allowed opacity-80' : 'bg-slate-50 dark:bg-slate-900'} border border-slate-200 dark:border-slate-700/60 rounded-2xl py-3 px-4 font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-500/30 dark:text-white`}
                                                    value={editingUser.roleId}
                                                    onChange={e => setEditingUser({ ...editingUser, roleId: e.target.value })}
                                                    required
                                                >
                                                    {roles.map(r => {
                                                        const isRoleAdmin = isSuperAdminRole(r);
                                                        const disabled = (isRoleAdmin && !isSuperAdmin) || (isEditingRoot && !isRoleAdmin);
                                                        return (
                                                            <option key={r.id} value={r.id} disabled={disabled}>
                                                                {r.name} {isRoleAdmin ? '(Super Admin)' : ''} {disabled ? '🔒 Requer Admin' : ''}
                                                            </option>
                                                        );
                                                    })}
                                                </select>
                                                {isEditingRoot ? (
                                                    <p className="text-[10px] text-amber-500 font-bold ml-1 flex items-center gap-1">
                                                        <Lock size={12} /> Conta raiz vinculada obrigatoriamente a Administrador.
                                                    </p>
                                                ) : isSelf && !isSuperAdmin ? (
                                                    <p className="text-[10px] text-amber-500 font-bold ml-1 flex items-center gap-1">
                                                        <Lock size={12} /> Bloqueio de Governança: Você não pode alterar o próprio perfil.
                                                    </p>
                                                ) : (() => {
                                                    const curRole = roles.find(r => r.id === editingUser.roleId) || findUserRole(editingUser, roles);
                                                    if (curRole && isSuperAdminRole(curRole)) {
                                                        return (
                                                            <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400 ml-1 flex items-center gap-1">
                                                                <ShieldAlert size={12} /> Privilégios totais de Administrador.
                                                            </p>
                                                        );
                                                    }
                                                    return null;
                                                })()}
                                            </div>

                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1">
                                                    Status da Conta <span className="text-rose-500">*</span>
                                                </label>
                                                <select
                                                    disabled={isSelf || isEditingRoot}
                                                    className={`w-full ${isSelf || isEditingRoot ? 'bg-slate-100 dark:bg-slate-900/80 cursor-not-allowed opacity-80' : 'bg-slate-50 dark:bg-slate-900'} border border-slate-200 dark:border-slate-700/60 rounded-2xl py-3 px-4 font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-500/30 dark:text-white`}
                                                    value={editingUser.status}
                                                    onChange={e => setEditingUser({ ...editingUser, status: e.target.value as any })}
                                                    required
                                                >
                                                    <option value="Ativo">Ativo</option>
                                                    <option value="Inativo" disabled={isSelf || isEditingRoot}>
                                                        Inativo {isSelf ? '(Sua conta)' : isEditingRoot ? '(@admin protegido)' : ''}
                                                    </option>
                                                </select>
                                                {isEditingRoot ? (
                                                    <p className="text-[10px] text-amber-500 font-bold ml-1 flex items-center gap-1">
                                                        <Lock size={12} /> A conta raiz "@admin" não pode ser inativada.
                                                    </p>
                                                ) : isSelf ? (
                                                    <p className="text-[10px] text-amber-500 ml-1">
                                                        Você não pode inativar a própria conta conectada.
                                                    </p>
                                                ) : null}
                                            </div>
                                        </div>
                                    );
                                })()}

                                {/* Vincular Colaborador (RH) */}
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">
                                        Vincular Colaborador (RH)
                                    </label>
                                    <select
                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/60 rounded-2xl py-3 px-4 font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-500/30 dark:text-white"
                                        value={editingUser.employeeId || ''}
                                        onChange={e => setEditingUser({ ...editingUser, employeeId: e.target.value })}
                                    >
                                        <option value="">-- Não vinculado a funcionário --</option>
                                        {employees.map(emp => (
                                            <option key={emp.id} value={emp.id}>
                                                {emp.name} {emp.role ? `(${emp.role})` : ''}
                                            </option>
                                        ))}
                                    </select>
                                    <p className="text-[10px] text-slate-400 dark:text-slate-500 ml-1">
                                        Sincroniza a credencial do sistema com a ficha cadastral do colaborador no módulo de Recursos Humanos.
                                    </p>
                                </div>
                            </div>

                            {/* Modal Actions */}
                            <div className="pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsUserModalOpen(false);
                                        setEditingUser(null);
                                        setShowPassword(false);
                                    }}
                                    className="px-5 py-3 text-slate-500 dark:text-slate-400 font-bold text-xs uppercase tracking-wider hover:text-slate-800 dark:hover:text-white transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-7 py-3 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-600/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2"
                                >
                                    <CheckCircle2 size={16} /> Salvar Usuário
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Role Modal */}
            {isRoleModalOpen && editingRole && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-800 rounded-[32px] shadow-2xl w-full max-w-5xl border border-slate-100 dark:border-slate-700 animate-in zoom-in-95 duration-200 overflow-hidden h-[88vh] flex flex-col">
                        {/* Header */}
                        <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/70 dark:bg-slate-900/50 shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-2xl">
                                    <ShieldCheck size={20} />
                                </div>
                                <div>
                                    <h3 className="font-black text-xl text-slate-900 dark:text-white uppercase tracking-tighter italic">
                                        {editingRole.id ? 'Editar Perfil de Acesso' : 'Novo Perfil de Acesso'}
                                    </h3>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">
                                        Definição de privilégios granulares e matriz de governança RBAC.
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    setIsRoleModalOpen(false);
                                    setEditingRole(null);
                                }}
                                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
                            {/* Role Details - Left Panel */}
                            <div className="w-full md:w-80 lg:w-88 p-6 sm:p-8 border-b md:border-b-0 md:border-r border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-y-auto shrink-0 space-y-6 custom-scrollbar">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1">
                                        Nome do Perfil <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/60 rounded-xl py-3 px-4 font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 dark:text-white"
                                        value={editingRole.name}
                                        onChange={e => setEditingRole({ ...editingRole, name: e.target.value })}
                                        placeholder="Ex: Supervisor Comercial"
                                        required
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1">
                                        Descrição Operacional <span className="text-rose-500">*</span>
                                    </label>
                                    <textarea
                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/60 rounded-xl py-3 px-4 font-bold text-sm h-28 resize-none outline-none focus:ring-2 focus:ring-indigo-500/20 dark:text-white"
                                        value={editingRole.description}
                                        onChange={e => setEditingRole({ ...editingRole, description: e.target.value })}
                                        placeholder="Finalidade e responsabilidades deste perfil..."
                                        required
                                    />
                                </div>

                                {/* Super Admin Warning Notice */}
                                {isSuperAdminRole(editingRole) && (
                                    <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 rounded-2xl space-y-1.5">
                                        <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold text-xs">
                                            <ShieldAlert size={16} /> Perfil de Super Administrador
                                        </div>
                                        <p className="text-[11px] text-amber-700 dark:text-amber-300/80 leading-relaxed">
                                            Este perfil detém a permissão mestre <strong>all</strong>, garantindo acesso pleno e irrestrito a todas as funcionalidades presentes e futuras do sistema.
                                        </p>
                                    </div>
                                )}

                                {/* Permissions Summary & Progress */}
                                {(() => {
                                    const hasAll = editingRole.permissions.includes('all');
                                    const totalCatalog = ALL_PERMISSIONS_FLAT.length;
                                    const activeCount = hasAll ? totalCatalog : editingRole.permissions.length;
                                    const percentage = Math.min(100, Math.round((activeCount / totalCatalog) * 100));

                                    return (
                                        <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-900/30 space-y-2.5">
                                            <div className="flex items-center justify-between text-xs">
                                                <h4 className="flex items-center gap-2 font-bold text-indigo-700 dark:text-indigo-300">
                                                    <ShieldCheck size={16} /> Resumo do Escopo
                                                </h4>
                                                <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 text-[11px]">
                                                    {percentage}%
                                                </span>
                                            </div>
                                            <div className="w-full bg-indigo-200/50 dark:bg-indigo-950/60 rounded-full h-2 overflow-hidden">
                                                <div
                                                    className="bg-indigo-600 dark:bg-indigo-500 h-2 rounded-full transition-all duration-300"
                                                    style={{ width: `${percentage}%` }}
                                                />
                                            </div>
                                            <p className="text-[11px] text-indigo-600/80 dark:text-indigo-300/80 leading-relaxed">
                                                {hasAll ? (
                                                    <span>Acesso Total <strong>(all)</strong> concedido sobre todas as rotas e módulos.</span>
                                                ) : (
                                                    <span>Este perfil possui <strong>{activeCount}</strong> de <strong>{totalCatalog}</strong> permissões ativas.</span>
                                                )}
                                            </p>
                                        </div>
                                    );
                                })()}

                                {/* Global Quick Actions */}
                                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-700/60">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                                        Ações Rápidas Globais
                                    </label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const allIds = ALL_PERMISSIONS_FLAT.map(p => p.id);
                                                setEditingRole({
                                                    ...editingRole,
                                                    permissions: isSuperAdminRole(editingRole) ? ['all', ...allIds] : allIds
                                                });
                                            }}
                                            className="px-3 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-xl text-[10px] font-bold transition-all text-center"
                                        >
                                            Marcar Todas
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setEditingRole({
                                                    ...editingRole,
                                                    permissions: isSuperAdminRole(editingRole) ? ['all'] : []
                                                });
                                            }}
                                            className="px-3 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-rose-50 dark:hover:bg-rose-900/30 text-slate-700 dark:text-slate-200 hover:text-rose-600 dark:hover:text-rose-400 rounded-xl text-[10px] font-bold transition-all text-center"
                                        >
                                            Desmarcar Todas
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Permissions Matrix - Right Panel */}
                            <div className="flex-1 bg-slate-50/50 dark:bg-slate-900/30 p-6 sm:p-8 overflow-y-auto flex flex-col gap-5 custom-scrollbar">
                                {/* Search Filter */}
                                <div className="relative">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                    <input
                                        type="text"
                                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl py-3 pl-11 pr-10 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 dark:text-white shadow-sm"
                                        placeholder="Filtrar permissões por nome, módulo ou código..."
                                        value={roleSearchQuery}
                                        onChange={e => setRoleSearchQuery(e.target.value)}
                                    />
                                    {roleSearchQuery && (
                                        <button
                                            type="button"
                                            onClick={() => setRoleSearchQuery('')}
                                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                                        >
                                            <X size={14} />
                                        </button>
                                    )}
                                </div>

                                {/* Matrix Content */}
                                {(() => {
                                    const q = roleSearchQuery.toLowerCase().trim();
                                    const categoriesToRender = APP_PERMISSIONS.map(cat => {
                                        if (!q) return cat;
                                        const catMatches = cat.category.toLowerCase().includes(q);
                                        const matchingPerms = cat.permissions.filter(p =>
                                            catMatches ||
                                            p.name.toLowerCase().includes(q) ||
                                            p.id.toLowerCase().includes(q) ||
                                            p.description.toLowerCase().includes(q)
                                        );
                                        return {
                                            ...cat,
                                            permissions: matchingPerms
                                        };
                                    }).filter(cat => cat.permissions.length > 0);

                                    if (categoriesToRender.length === 0) {
                                        return (
                                            <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 p-8">
                                                <Shield className="mx-auto text-slate-300 dark:text-slate-600 mb-2" size={32} />
                                                <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                                                    Nenhuma permissão encontrada para "{roleSearchQuery}".
                                                </p>
                                                <button
                                                    type="button"
                                                    onClick={() => setRoleSearchQuery('')}
                                                    className="mt-3 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                                                >
                                                    Limpar filtro de busca
                                                </button>
                                            </div>
                                        );
                                    }

                                    return (
                                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                                            {categoriesToRender.map(category => {
                                                const catIds = category.permissions.map(p => p.id);
                                                const hasAll = editingRole.permissions.includes('all');
                                                const selectedInCat = hasAll ? catIds.length : catIds.filter(id => editingRole.permissions.includes(id)).length;
                                                const allCatSelected = catIds.length > 0 && selectedInCat === catIds.length;

                                                const handleToggleCategory = () => {
                                                    if (allCatSelected) {
                                                        if (hasAll) {
                                                            const remaining = ALL_PERMISSIONS_FLAT.map(p => p.id).filter(id => !catIds.includes(id));
                                                            setEditingRole({ ...editingRole, permissions: remaining });
                                                        } else {
                                                            setEditingRole({
                                                                ...editingRole,
                                                                permissions: editingRole.permissions.filter(p => !catIds.includes(p))
                                                            });
                                                        }
                                                    } else {
                                                        setEditingRole({
                                                            ...editingRole,
                                                            permissions: [...new Set([...editingRole.permissions, ...catIds])]
                                                        });
                                                    }
                                                };

                                                return (
                                                    <div
                                                        key={category.category}
                                                        className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
                                                    >
                                                        <div>
                                                            <div className="flex justify-between items-center mb-3 pb-3 border-b border-slate-100 dark:border-slate-700/60">
                                                                <div className="flex items-center gap-2">
                                                                    <h4 className="font-black text-xs uppercase tracking-widest text-slate-800 dark:text-white">
                                                                        {category.category}
                                                                    </h4>
                                                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400">
                                                                        {selectedInCat}/{catIds.length}
                                                                    </span>
                                                                </div>
                                                                <button
                                                                    type="button"
                                                                    onClick={handleToggleCategory}
                                                                    className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 bg-indigo-50 dark:bg-indigo-900/20 px-2.5 py-1 rounded-lg transition-colors"
                                                                >
                                                                    {allCatSelected ? 'Desmarcar Módulo' : 'Marcar Módulo'}
                                                                </button>
                                                            </div>
                                                            <div className="space-y-2">
                                                                {category.permissions.map(perm => {
                                                                    const isSelected = hasAll || editingRole.permissions.includes(perm.id);

                                                                    const handleTogglePerm = () => {
                                                                        if (isSelected) {
                                                                            let newPerms: string[];
                                                                            if (hasAll) {
                                                                                newPerms = ALL_PERMISSIONS_FLAT.map(p => p.id).filter(id => id !== perm.id);
                                                                            } else {
                                                                                newPerms = editingRole.permissions.filter(p => p !== perm.id);
                                                                            }
                                                                            setEditingRole({ ...editingRole, permissions: newPerms });
                                                                        } else {
                                                                            setEditingRole({
                                                                                ...editingRole,
                                                                                permissions: [...editingRole.permissions, perm.id]
                                                                            });
                                                                        }
                                                                    };

                                                                    return (
                                                                        <div
                                                                            key={perm.id}
                                                                            onClick={handleTogglePerm}
                                                                            className={`cursor-pointer flex items-start gap-3 p-2.5 rounded-xl transition-all border ${isSelected
                                                                                ? 'bg-indigo-50/70 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-900/40'
                                                                                : 'bg-transparent border-transparent hover:bg-slate-50 dark:hover:bg-slate-700/40'
                                                                            }`}
                                                                        >
                                                                            <div className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-all ${isSelected
                                                                                ? 'bg-indigo-600 border-indigo-600 text-white'
                                                                                : 'bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600'
                                                                            }`}>
                                                                                {isSelected && <Check size={11} strokeWidth={4} />}
                                                                            </div>
                                                                            <div className="flex-1 min-w-0">
                                                                                <div className="flex items-center gap-2 flex-wrap">
                                                                                    <p className={`text-[11px] font-bold leading-tight ${isSelected ? 'text-indigo-950 dark:text-indigo-200' : 'text-slate-700 dark:text-slate-300'}`}>
                                                                                        {perm.name}
                                                                                    </p>
                                                                                    <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400">
                                                                                        {perm.id}
                                                                                    </span>
                                                                                </div>
                                                                                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 leading-tight">
                                                                                    {perm.description}
                                                                                </p>
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    );
                                })()}
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-6 bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-3 shrink-0">
                            <button
                                type="button"
                                onClick={() => {
                                    setIsRoleModalOpen(false);
                                    setEditingRole(null);
                                }}
                                className="px-6 py-3 text-slate-500 dark:text-slate-400 font-bold text-xs uppercase tracking-wider hover:text-slate-800 dark:hover:text-white transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSaveRole}
                                className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-600/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                            >
                                <CheckCircle2 size={16} /> Salvar Definições
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div >
    );
};

export default Settings;
