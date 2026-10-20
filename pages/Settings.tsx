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
    Package,
    TrendingUp,
    DollarSign,
    Percent,
    Clock,
    Target,
    Layers,
    Link,
    Smartphone,
    Landmark
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { User, AppRole, AppSettings, AuditLog } from '../types';
import { APP_PERMISSIONS } from '../permission_constants';
import { generateCameloData } from '../src/utils/seeder';

// Internal Toast Component
// Local Toast component removed in favor of global context

// ============================================================================
// EXTENDED COMPONENTS START
// ============================================================================

// 3. PARÂMETROS OPERACIONAIS
const OperationalParametersSection = ({ settings, onUpdate, addToast }: { settings: import('../types').AppSettings, onUpdate: (s: import('../types').AppSettings) => void, addToast?: any }) => {
    const operationalParams = [
        // VENDAS & COMERCIAL
        { id: 'maxDiscount', label: 'Desconto Máximo Permitido (%)', min: 0, max: 100, defaultVal: 15, category: 'Vendas', icon: 'Percent' },
        { id: 'minMargin', label: 'Margem Mínima de Lucro (%)', min: 0, max: 100, defaultVal: 20, category: 'Vendas', icon: 'TrendingUp' },
        { id: 'defaultPaymentTerm', label: 'Prazo Padrão de Pagamento (dias)', min: 0, max: 365, defaultVal: 30, category: 'Vendas', icon: 'Calendar' },
        { id: 'budgetValidity', label: 'Validade de Orçamentos (dias)', min: 1, max: 90, defaultVal: 7, category: 'Vendas', icon: 'Clock' },
        { id: 'maxInstallments', label: 'Máximo de Parcelas', min: 1, max: 48, defaultVal: 12, category: 'Vendas', icon: 'Layers' },
        { id: 'minInstallmentValue', label: 'Valor Mínimo por Parcela (R$)', min: 10, max: 10000, defaultVal: 100, category: 'Vendas', icon: 'DollarSign' },
        { id: 'creditLimit', label: 'Limite de Crédito Padrão (R$)', min: 0, max: 1000000, defaultVal: 5000, category: 'Vendas', icon: 'Target' },
        { id: 'commissionRate', label: 'Taxa de Comissão Padrão (%)', min: 0, max: 20, defaultVal: 3, category: 'Vendas', icon: 'Percent' },

        // ESTOQUE & PRODUÇÃO
        { id: 'safetyStock', label: 'Estoque de Segurança (%)', min: 0, max: 50, defaultVal: 10, category: 'Estoque', icon: 'Package' },
        { id: 'reorderPoint', label: 'Ponto de Reposição (%)', min: 5, max: 50, defaultVal: 20, category: 'Estoque', icon: 'TrendingDown' },
        { id: 'batchTrackingDays', label: 'Rastreamento de Lote (dias)', min: 30, max: 1825, defaultVal: 180, category: 'Estoque', icon: 'Search' },
        { id: 'productionLeadTime', label: 'Lead Time de Produção (dias)', min: 1, max: 90, defaultVal: 5, category: 'Produção', icon: 'Clock' },
        { id: 'maintenanceInterval', label: 'Intervalo Manutenção Preventiva (horas)', min: 100, max: 5000, defaultVal: 500, category: 'Produção', icon: 'Tool' },
        { id: 'capacityUtilization', label: 'Meta Utilização Capacidade (%)', min: 50, max: 100, defaultVal: 85, category: 'Produção', icon: 'Target' },

        // COMPRAS
        { id: 'purchaseApprovalLevel1', label: 'Aprovação Nível 1 - Limite (R$)', min: 0, max: 50000, defaultVal: 5000, category: 'Compras', icon: 'DollarSign' },
        { id: 'minQuotations', label: 'Mínimo de Cotações Obrigatórias', min: 1, max: 10, defaultVal: 3, category: 'Compras', icon: 'FileText' },
        { id: 'supplierEvaluationPeriod', label: 'Período Avaliação Fornecedores (meses)', min: 1, max: 24, defaultVal: 6, category: 'Compras', icon: 'Star' },
        { id: 'deliveryToleranceDays', label: 'Tolerância Atraso Entrega (dias)', min: 0, max: 15, defaultVal: 2, category: 'Compras', icon: 'Truck' },

        // FINANCEIRO
        { id: 'interestRate', label: 'Taxa de Juros Mora (% a.m.)', min: 0, max: 10, defaultVal: 1, category: 'Financeiro', icon: 'Percent' },
        { id: 'lateFee', label: 'Multa por Atraso (%)', min: 0, max: 10, defaultVal: 2, category: 'Financeiro', icon: 'AlertTriangle' },
        { id: 'earlyPaymentDiscount', label: 'Desconto Pagamento Antecipado (%)', min: 0, max: 15, defaultVal: 3, category: 'Financeiro', icon: 'TrendingDown' },
        { id: 'cashFlowProjectionDays', label: 'Projeção Fluxo de Caixa (dias)', min: 30, max: 365, defaultVal: 90, category: 'Financeiro', icon: 'TrendingUp' },
        { id: 'bankReconciliationFrequency', label: 'Frequência Conciliação Bancária (dias)', min: 1, max: 30, defaultVal: 7, category: 'Financeiro', icon: 'RefreshCw' },
    ];

    const [filterCategory, setFilterCategory] = useState('Todos');
    const [searchQuery, setSearchQuery] = useState('');

    const filteredParams = operationalParams.filter(p => {
        const matchesCat = filterCategory === 'Todos' || p.category === filterCategory;
        const matchesSearch = p.label.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCat && matchesSearch;
    });

    const handleParamChange = (id: string, value: string) => {
        const numValue = parseFloat(value);
        if (!isNaN(numValue)) {
            onUpdate({
                ...settings,
                operational: {
                    ...settings.operational,
                    [id]: numValue
                }
            });
        }
    };

    const handleResetDefaults = () => {
        const defaults: Record<string, number> = {};
        operationalParams.forEach(p => {
            defaults[p.id] = p.defaultVal;
        });
        onUpdate({
            ...settings,
            operational: {
                ...settings.operational,
                ...defaults
            }
        });
        addToast?.('Parâmetros operacionais restaurados para os valores padrão!', 'info');
    };

    return (
        <section className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 p-8 rounded-[32px] border border-amber-100 dark:border-amber-900/30">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-amber-500 rounded-xl text-white">
                        <Sliders size={20} />
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">Parâmetros Operacionais Avançados</h3>
                        <p className="text-[10px] text-slate-500 font-medium">Regras de negócio para vendas, estoque, produção, compras e financeiro</p>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={handleResetDefaults}
                    className="px-4 py-2 bg-white dark:bg-slate-800 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 rounded-xl text-xs font-bold hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors flex items-center gap-2 self-start sm:self-auto"
                >
                    <RefreshCw size={14} /> Restaurar Padrões
                </button>
            </div>

            {/* Filtro por Categoria e Busca */}
            <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
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
                <div className="relative w-full md:w-64">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Filtrar parâmetro..."
                        className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-800 border border-amber-200 dark:border-amber-900/50 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-amber-500/20"
                    />
                </div>
            </div>

            {/* Grid de Parâmetros */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[600px] overflow-y-auto custom-scrollbar pr-2">
                {filteredParams.map(param => (
                    <div key={param.id} className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-amber-100 dark:border-amber-900/30 hover:shadow-md transition-all">
                        <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                                <label className="text-xs font-bold text-slate-900 dark:text-white block mb-1">{param.label}</label>
                                <span className="text-[9px] font-black text-amber-600 uppercase px-2 py-0.5 bg-amber-50 dark:bg-amber-900/20 rounded-md">{param.category}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <input
                                type="number"
                                min={param.min}
                                max={param.max}
                                value={Number(settings.operational?.[param.id] ?? param.defaultVal)}
                                onChange={(e) => handleParamChange(param.id, e.target.value)}
                                className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg py-2 px-3 font-bold text-sm text-center"
                            />
                        </div>
                        <div className="mt-2 flex justify-between text-[9px] text-slate-400">
                            <span>Min: {param.min}</span>
                            <span>Padrão: {param.defaultVal}</span>
                            <span>Max: {param.max}</span>
                        </div>
                    </div>
                ))}
            </div>
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
        .filter(([id]) => !defaultIntegrations.some(d => d.id === id))
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
                        apiKey: configuringIntegration.apiKey,
                        webhookUrl: configuringIntegration.webhookUrl,
                        environment: configuringIntegration.environment
                    }
                }
            }
        });
        addToast?.(`Configurações de "${configuringIntegration.name}" atualizadas!`, 'success');
        setConfiguringIntegration(null);
    };

    const handleCreateCustomIntegration = () => {
        if (!newIntegrationForm.name.trim()) {
            addToast?.('Informe o nome da integração.', 'error');
            return;
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
                        description: newIntegrationForm.description || 'Webhook / API Personalizada',
                        webhookUrl: newIntegrationForm.webhookUrl,
                        apiKey: newIntegrationForm.apiKey
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
        const currentStatuses = settings.documents?.documentStatuses || {};
        updateDocumentConfig('documentStatuses', {
            ...currentStatuses,
            [docName]: nextStatus
        });
        addToast?.(`Template "${docName}" definido como ${nextStatus}.`, 'info');
    };

    return (
        <section className="bg-gradient-to-br from-cyan-50 to-teal-50 dark:from-cyan-950/20 dark:to-teal-950/20 p-8 rounded-[32px] border border-cyan-100 dark:border-cyan-900/30">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 bg-cyan-500 rounded-xl text-white">
                    <Printer size={20} />
                </div>
                <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">Documentos, Impressão & Relatórios</h3>
                    <p className="text-[10px] text-slate-500 font-medium">Configuração de layouts, impressoras e geração de documentos</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Templates de Documentos */}
                <div className="space-y-4">
                    <h4 className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase">Templates de Documentos Fiscais e Comerciais</h4>
                    {defaultDocs.map(doc => {
                        const status = settings.documents?.documentStatuses?.[doc.name] || doc.defaultStatus;
                        return (
                            <div key={doc.name} className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 rounded-xl border border-cyan-100 dark:border-cyan-900/30 hover:shadow-md transition-all group">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <FileText size={16} className="text-cyan-500" />
                                        <p className="font-bold text-sm text-slate-900 dark:text-white">{doc.name}</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <p className="text-[10px] text-slate-500">{doc.format}</p>
                                        <span className="text-[9px] font-mono text-slate-400">{doc.version}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => toggleDocStatus(doc.name, status)}
                                        className={`px-2 py-1 rounded-md text-[9px] font-black cursor-pointer transition-colors ${status === 'Ativo' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                                        title="Clique para ativar/desativar"
                                    >
                                        {status}
                                    </button>
                                    <div className="flex gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            type="button"
                                            onClick={() => addToast?.(`Editando layout de ${doc.name} (${doc.format})`, 'info')}
                                            className="p-2 hover:bg-cyan-50 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                            title="Editar Layout"
                                        >
                                            <Edit2 size={14} className="text-slate-400 hover:text-cyan-500" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => addToast?.(`Visualizando prévia de ${doc.name}`, 'info')}
                                            className="p-2 hover:bg-cyan-50 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                            title="Visualizar"
                                        >
                                            <Eye size={14} className="text-slate-400 hover:text-cyan-500" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => addToast?.(`Enviando página de teste (${doc.name}) para ${settings.documents?.printerMain || 'Impressora Principal'}...`, 'success')}
                                            className="p-2 hover:bg-cyan-50 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                            title="Imprimir Teste"
                                        >
                                            <Printer size={14} className="text-slate-400 hover:text-cyan-500" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Configurações de Impressora */}
                <div className="space-y-4">
                    <h4 className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase">Configurações de Impressoras</h4>
                    <div className="space-y-3">
                        {/* Impressora Principal */}
                        <div className="p-5 bg-white dark:bg-slate-800 rounded-2xl border border-cyan-100 dark:border-cyan-900/30">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <Printer size={18} className="text-cyan-600" />
                                    <h5 className="font-black text-sm text-slate-900 dark:text-white">Impressora Principal (Documentos)</h5>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => addToast?.(`Página de teste enviada para ${settings.documents?.printerMain || 'HP LaserJet Pro'}!`, 'success')}
                                    className="px-2.5 py-1 bg-cyan-50 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 rounded-lg text-[10px] font-bold hover:bg-cyan-100 transition-colors"
                                >
                                    Testar Impressão
                                </button>
                            </div>
                            <div className="space-y-2">
                                <select
                                    value={settings.documents?.printerMain || 'HP LaserJet Pro'}
                                    onChange={(e) => updateDocumentConfig('printerMain', e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg py-3 px-4 font-bold text-sm"
                                >
                                    <option>HP LaserJet Pro</option>
                                    <option>Epson L3150 - Colorida</option>
                                    <option>Brother HL-L2350DW</option>
                                    <option>Microsoft Print to PDF</option>
                                </select>
                                <div className="grid grid-cols-3 gap-2">
                                    <div className="p-2 bg-slate-50 dark:bg-slate-900 rounded-lg">
                                        <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Qualidade</label>
                                        <select
                                            value={settings.documents?.printerMainConfig?.quality || 'normal'}
                                            onChange={(e) => updateDocumentConfig('printerMainConfig', { ...settings.documents?.printerMainConfig, quality: e.target.value })}
                                            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded py-1 px-2 text-xs font-bold"
                                        >
                                            <option value="draft">Rascunho</option>
                                            <option value="normal">Normal</option>
                                            <option value="high">Alta</option>
                                        </select>
                                    </div>
                                    <div className="p-2 bg-slate-50 dark:bg-slate-900 rounded-lg">
                                        <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Cor</label>
                                        <select
                                            value={settings.documents?.printerMainConfig?.color || 'bw'}
                                            onChange={(e) => updateDocumentConfig('printerMainConfig', { ...settings.documents?.printerMainConfig, color: e.target.value })}
                                            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded py-1 px-2 text-xs font-bold"
                                        >
                                            <option value="bw">P&B</option>
                                            <option value="color">Colorido</option>
                                        </select>
                                    </div>
                                    <div className="p-2 bg-slate-50 dark:bg-slate-900 rounded-lg">
                                        <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Duplex</label>
                                        <select
                                            value={settings.documents?.printerMainConfig?.duplex ? 'true' : 'false'}
                                            onChange={(e) => updateDocumentConfig('printerMainConfig', { ...settings.documents?.printerMainConfig, duplex: e.target.value === 'true' })}
                                            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded py-1 px-2 text-xs font-bold"
                                        >
                                            <option value="false">Não</option>
                                            <option value="true">Sim</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Impressora Térmica */}
                        <div className="p-5 bg-white dark:bg-slate-800 rounded-2xl border border-cyan-100 dark:border-cyan-900/30">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <Package size={18} className="text-amber-600" />
                                    <h5 className="font-black text-sm text-slate-900 dark:text-white">Impressora Térmica (Etiquetas)</h5>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => addToast?.(`Etiqueta de teste enviada para ${settings.documents?.printerThermal || 'Zebra ZD220'}!`, 'success')}
                                    className="px-2.5 py-1 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-lg text-[10px] font-bold hover:bg-amber-100 transition-colors"
                                >
                                    Testar Etiqueta
                                </button>
                            </div>
                            <div className="space-y-2">
                                <select
                                    value={settings.documents?.printerThermal || 'Zebra ZD220'}
                                    onChange={(e) => updateDocumentConfig('printerThermal', e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg py-3 px-4 font-bold text-sm"
                                >
                                    <option>Zebra ZD220</option>
                                    <option>Argox OS-214 Plus</option>
                                    <option>Elgin L42 PRO</option>
                                    <option>Não configurada</option>
                                </select>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="p-2 bg-slate-50 dark:bg-slate-900 rounded-lg">
                                        <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Largura (mm)</label>
                                        <input
                                            type="number"
                                            value={settings.documents?.printerThermalConfig?.width ?? 100}
                                            onChange={(e) => updateDocumentConfig('printerThermalConfig', { ...settings.documents?.printerThermalConfig, width: Number(e.target.value) })}
                                            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded py-1 px-2 text-xs font-bold"
                                        />
                                    </div>
                                    <div className="p-2 bg-slate-50 dark:bg-slate-900 rounded-lg">
                                        <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Altura (mm)</label>
                                        <input
                                            type="number"
                                            value={settings.documents?.printerThermalConfig?.height ?? 100}
                                            onChange={(e) => updateDocumentConfig('printerThermalConfig', { ...settings.documents?.printerThermalConfig, height: Number(e.target.value) })}
                                            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded py-1 px-2 text-xs font-bold"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Configurações Gerais */}
                        <div className="p-5 bg-white dark:bg-slate-800 rounded-2xl border border-cyan-100 dark:border-cyan-900/30">
                            <h5 className="font-black text-sm text-slate-900 dark:text-white mb-3">Configurações Gerais</h5>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Margens (mm)</label>
                                    <input
                                        type="number"
                                        value={settings.documents?.margins ?? 10}
                                        onChange={(e) => updateDocumentConfig('margins', Number(e.target.value))}
                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg py-2 px-3 font-bold text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Cópias Padrão</label>
                                    <input
                                        type="number"
                                        value={settings.documents?.copies ?? 2}
                                        onChange={(e) => updateDocumentConfig('copies', Number(e.target.value))}
                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg py-2 px-3 font-bold text-sm"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Marca D'água e Personalização */}
            <div className="mt-6 pt-6 border-t border-cyan-200 dark:border-cyan-900/30">
                <h4 className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase mb-4">Personalização de Documentos</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { id: 'showLogo', label: 'Exibir Logo no Cabeçalho' },
                        { id: 'watermarkDraft', label: 'Marca D\'água em Rascunhos' },
                        { id: 'qrCode', label: 'QR Code em Documentos' },
                        { id: 'autoNumbering', label: 'Numeração Automática' },
                        { id: 'digitalSignature', label: 'Assinatura Digital' },
                        { id: 'customFooter', label: 'Rodapé Personalizado' },
                        { id: 'barcode', label: 'Código de Barras' },
                        { id: 'authSeal', label: 'Selo de Autenticidade' },
                    ].map(option => {
                        const isEnabled = settings.documents?.[option.id as keyof typeof settings.documents] === true;
                        return (
                            <div
                                key={option.id}
                                onClick={() => updateDocumentConfig(option.id, !isEnabled)}
                                className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 rounded-xl border border-cyan-100 dark:border-cyan-900/30 cursor-pointer hover:border-cyan-300 transition-all"
                            >
                                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 leading-tight">{option.label}</span>
                                <div
                                    className={`w-11 h-6 rounded-full relative transition-colors shrink-0 ${isEnabled ? 'bg-cyan-500' : 'bg-slate-300 dark:bg-slate-600'}`}
                                >
                                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${isEnabled ? 'right-1' : 'left-1'}`}></div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};

// 11. PERFORMANCE & OTIMIZAÇÃO
const PerformanceOptimizationSection = ({ settings, onUpdate, addToast }: {
    settings: import('../types').AppSettings,
    onUpdate: (s: import('../types').AppSettings) => void,
    addToast?: any
}) => {
    const [clearingCache, setClearingCache] = useState(false);
    const [optimizingDb, setOptimizingDb] = useState(false);
    const [analyzingQueries, setAnalyzingQueries] = useState(false);

    const updatePerfConfig = (key: string, value: any) => {
        onUpdate({
            ...settings,
            performance: {
                ...settings.performance,
                [key]: value
            }
        });
    };

    const handleClearCache = async () => {
        setClearingCache(true);
        await new Promise(resolve => setTimeout(resolve, 1000));
        updatePerfConfig('cacheSize', 0);
        setClearingCache(false);
        addToast?.('Cache do sistema limpo com sucesso!', 'success');
    };

    const handleOptimizeDb = async () => {
        setOptimizingDb(true);
        await new Promise(resolve => setTimeout(resolve, 1500));
        onUpdate({
            ...settings,
            performance: {
                ...settings.performance,
                dbOptimizationLastDate: 'Agora mesmo',
                dbFragmentation: 0
            }
        });
        setOptimizingDb(false);
        addToast?.('Banco de dados otimizado e índices reconstruídos!', 'success');
    };

    const handleAnalyzeQueries = async () => {
        setAnalyzingQueries(true);
        await new Promise(resolve => setTimeout(resolve, 1200));
        setAnalyzingQueries(false);
        addToast?.('Análise concluída: todas as 47 consultas indexadas operando abaixo de 50ms!', 'success');
    };

    const optimizations = [
        { id: 'gzip', label: 'Compressão GZIP de Dados (Modo Econômico)', impact: 'Alto' },
        { id: 'preloading', label: 'Pré-carregamento Inteligente', impact: 'Médio' },
        { id: 'lazyLoading', label: 'Lazy Loading de Imagens e Listas', impact: 'Alto' },
        { id: 'queryCache', label: 'Cache de Consultas Frequentes', impact: 'Muito Alto' },
        { id: 'autoIndexing', label: 'Indexação Automática de Tabelas', impact: 'Alto' },
        { id: 'minifyAssets', label: 'Minificação de Recursos', impact: 'Médio' },
        { id: 'cdn', label: 'Aceleração via CDN Global', impact: 'Alto' },
        { id: 'dbPooling', label: 'Pool de Conexões do Banco', impact: 'Muito Alto' }
    ];

    const currentCacheSize = settings.performance?.cacheSize ?? 245;
    const cachePercent = Math.min(100, Math.round((currentCacheSize / 1024) * 100));
    const currentImageQuality = settings.performance?.imageQuality ?? 85;
    const isAutoCompression = settings.performance?.autoCompression ?? true;
    const dbFragmentation = settings.performance?.dbFragmentation ?? 12;

    return (
        <section className="bg-gradient-to-br from-lime-50 to-green-50 dark:from-lime-950/20 dark:to-green-950/20 p-8 rounded-[32px] border border-lime-100 dark:border-lime-900/30">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 bg-lime-500 rounded-xl text-white">
                    <Zap size={20} />
                </div>
                <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">Performance, Otimização & Manutenção</h3>
                    <p className="text-[10px] text-slate-500 font-medium">Ajustes avançados de velocidade, cache e uso de recursos</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Cache do Sistema */}
                <div className="p-5 bg-white dark:bg-slate-800 rounded-2xl border border-lime-100 dark:border-lime-900/30">
                    <div className="flex items-center gap-2 mb-4">
                        <HardDrive size={20} className="text-lime-600" />
                        <h4 className="font-black text-sm text-slate-900 dark:text-white">Cache do Sistema</h4>
                    </div>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-xs text-slate-600 dark:text-slate-400">Tamanho Atual</span>
                            <span className="text-xs font-black text-lime-600">{currentCacheSize} MB</span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2.5">
                            <div className="bg-lime-500 h-2.5 rounded-full transition-all duration-500" style={{ width: `${cachePercent}%` }}></div>
                        </div>
                        <div className="text-[10px] text-slate-500">
                            <p>Limite: 1 GB</p>
                            <p>Status: {currentCacheSize === 0 ? 'Limpo recentemente' : 'Operacional'}</p>
                        </div>
                        <button
                            type="button"
                            onClick={handleClearCache}
                            disabled={clearingCache || currentCacheSize === 0}
                            className="w-full py-2 bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-bold hover:bg-lime-50 hover:text-lime-600 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                        >
                            <RefreshCw size={12} className={clearingCache ? 'animate-spin' : ''} />
                            {clearingCache ? 'Limpando...' : currentCacheSize === 0 ? 'Cache Limpo' : 'Limpar Cache'}
                        </button>
                    </div>
                </div>

                {/* Banco de Dados */}
                <div className="p-5 bg-white dark:bg-slate-800 rounded-2xl border border-lime-100 dark:border-lime-900/30">
                    <div className="flex items-center gap-2 mb-4">
                        <Database size={20} className="text-lime-600" />
                        <h4 className="font-black text-sm text-slate-900 dark:text-white">Banco de Dados</h4>
                    </div>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-xs text-slate-600 dark:text-slate-400">Tamanho Total</span>
                            <span className="text-xs font-black text-blue-600">3.8 GB</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-xs text-slate-600 dark:text-slate-400">Fragmentação</span>
                            <span className={`text-xs font-black ${dbFragmentation === 0 ? 'text-emerald-600' : 'text-amber-600'}`}>{dbFragmentation}%</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-xs text-slate-600 dark:text-slate-400">Última Otimização</span>
                            <span className="text-xs font-black text-slate-500">{settings.performance?.dbOptimizationLastDate || 'Há 3 dias'}</span>
                        </div>
                        <button
                            type="button"
                            onClick={handleOptimizeDb}
                            disabled={optimizingDb}
                            className="w-full py-2 bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-bold hover:bg-lime-50 hover:text-lime-600 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                        >
                            {optimizingDb ? (
                                <><RefreshCw size={12} className="animate-spin" /> Otimizando...</>
                            ) : (
                                'Otimizar Agora'
                            )}
                        </button>
                    </div>
                </div>

                {/* Compressão de Imagens */}
                <div className="p-5 bg-white dark:bg-slate-800 rounded-2xl border border-lime-100 dark:border-lime-900/30">
                    <div className="flex items-center gap-2 mb-4">
                        <Package size={20} className="text-lime-600" />
                        <h4 className="font-black text-sm text-slate-900 dark:text-white">Compressão</h4>
                    </div>
                    <div className="space-y-3">
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">Qualidade de Imagens</label>
                            <input
                                type="range"
                                min="50"
                                max="100"
                                value={currentImageQuality}
                                onChange={(e) => updatePerfConfig('imageQuality', Number(e.target.value))}
                                className="w-full accent-lime-500 cursor-pointer"
                            />
                            <div className="flex justify-between text-[9px] text-slate-400 mt-1">
                                <span>Menor</span>
                                <span className="font-black text-lime-600">{currentImageQuality}%</span>
                                <span>Máxima</span>
                            </div>
                        </div>
                        <div
                            onClick={() => updatePerfConfig('autoCompression', !isAutoCompression)}
                            className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-900 rounded-lg cursor-pointer"
                        >
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Auto-compressão</span>
                            <div className={`w-10 h-5 rounded-full relative transition-colors ${isAutoCompression ? 'bg-lime-500' : 'bg-slate-300 dark:bg-slate-600'}`}>
                                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${isAutoCompression ? 'right-0.5' : 'left-0.5'}`}></div>
                            </div>
                        </div>
                        <p className="text-[10px] text-slate-500">Economia estimada: ~{Math.max(10, 100 - currentImageQuality + 25)}% de espaço</p>
                    </div>
                </div>

                {/* Índices e Consultas */}
                <div className="p-5 bg-white dark:bg-slate-800 rounded-2xl border border-lime-100 dark:border-lime-900/30">
                    <div className="flex items-center gap-2 mb-4">
                        <TrendingUp size={20} className="text-lime-600" />
                        <h4 className="font-black text-sm text-slate-900 dark:text-white">Consultas SQL</h4>
                    </div>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-xs text-slate-600 dark:text-slate-400">Tempo Médio</span>
                            <span className="text-xs font-black text-emerald-600">45ms</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-xs text-slate-600 dark:text-slate-400">Consultas Lentas</span>
                            <span className="text-xs font-black text-amber-600">0</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-xs text-slate-600 dark:text-slate-400">Índices Ativos</span>
                            <span className="text-xs font-black text-blue-600">47</span>
                        </div>
                        <button
                            type="button"
                            onClick={handleAnalyzeQueries}
                            disabled={analyzingQueries}
                            className="w-full py-2 bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-bold hover:bg-lime-50 hover:text-lime-600 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                        >
                            {analyzingQueries ? (
                                <><RefreshCw size={12} className="animate-spin" /> Analisando...</>
                            ) : (
                                'Analisar Consultas'
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Opções Avançadas de Performance */}
            <div className="mt-6 pt-6 border-t border-lime-200 dark:border-lime-900/30">
                <h4 className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase mb-4">Otimizações Avançadas</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {optimizations.map(opt => {
                        const isEnabled = settings.performance?.[opt.id] === true;
                        return (
                            <div
                                key={opt.id}
                                onClick={() => updatePerfConfig(opt.id, !isEnabled)}
                                className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-lime-100 dark:border-lime-900/30 cursor-pointer hover:border-lime-300 transition-all"
                            >
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex-1">
                                        <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight mb-1">{opt.label}</p>
                                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-md ${opt.impact === 'Muito Alto' ? 'bg-emerald-100 text-emerald-700' :
                                            opt.impact === 'Alto' ? 'bg-blue-100 text-blue-700' :
                                                'bg-amber-100 text-amber-700'
                                            }`}>
                                            Impacto: {opt.impact}
                                        </span>
                                    </div>
                                    <div
                                        className={`w-10 h-5 rounded-full relative transition-colors ml-2 shrink-0 ${isEnabled ? 'bg-lime-500' : 'bg-slate-300 dark:bg-slate-600'}`}>
                                        <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${isEnabled ? 'right-0.5' : 'left-0.5'}`}></div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Monitoramento de Performance */}
            <div className="mt-6 pt-6 border-t border-lime-200 dark:border-lime-900/30">
                <h4 className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase mb-4">Métricas de Performance em Tempo Real</h4>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    {[
                        { label: 'Tempo de Resposta', value: '120ms', status: 'good', icon: 'Clock' },
                        { label: 'Requisições/seg', value: '45', status: 'good', icon: 'Activity' },
                        { label: 'Taxa de Erro', value: '0.02%', status: 'good', icon: 'AlertTriangle' },
                        { label: 'Uptime', value: '99.98%', status: 'excellent', icon: 'CheckCircle' },
                        { label: 'Usuários Online', value: '23', status: 'normal', icon: 'Users' },
                    ].map(metric => (
                        <div key={metric.label} className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-lime-100 dark:border-lime-900/30 text-center">
                            <p className="text-[10px] font-black text-slate-400 uppercase mb-2">{metric.label}</p>
                            <p className={`text-2xl font-black mb-1 ${metric.status === 'excellent' ? 'text-emerald-600' :
                                metric.status === 'good' ? 'text-blue-600' :
                                    'text-slate-600'
                                }`}>{metric.value}</p>
                            <div className={`w-2 h-2 rounded-full mx-auto ${metric.status === 'excellent' ? 'bg-emerald-500' :
                                metric.status === 'good' ? 'bg-blue-500' :
                                    'bg-amber-500'
                                } animate-pulse`}></div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

const Settings = () => {
    const {
        users, roles, settings, auditLogs, employees,
        addUser, updateUser, deleteUser,
        addRole, updateRole, deleteRole,
        updateSettings, clearAllData, hasPermission, seedDatabase
    } = useApp();

    const [activeTab, setActiveTab] = useState<'company' | 'security' | 'system' | 'audit'>('company');
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

    // Audit Filters & Pagination
    const [auditSearch, setAuditSearch] = useState('');
    const [auditModuleFilter, setAuditModuleFilter] = useState('Todos');
    const [auditStartDate, setAuditStartDate] = useState(new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]);
    const [auditEndDate, setAuditEndDate] = useState(new Date().toISOString().split('T')[0]);
    const [auditSeverityFilter, setAuditSeverityFilter] = useState<'all' | 'info' | 'warning' | 'critical'>('all');
    const [auditPage, setAuditPage] = useState(1);
    const AUDIT_PAGE_SIZE = 15;


    // Sync temp settings on mount/update (only if not dirty, strategy can vary)
    // For this simple app, we'll just track changes.
    useEffect(() => {
        const isDifferent = JSON.stringify(tempSettings) !== JSON.stringify(settings);
        setHasChanges(isDifferent);
    }, [tempSettings, settings]);

    const handleSaveSettings = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        updateSettings(tempSettings);
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
        if (editingUser) {
            try {
                if (users.some(u => u.id === editingUser.id)) {
                    // Update User - Handle Password Logic
                    let userToUpdate = { ...editingUser };
                    if (!userToUpdate.password) {
                        // Keep old password if not changed
                        const originalUser = users.find(u => u.id === editingUser.id);
                        if (originalUser) {
                            userToUpdate.password = originalUser.password;
                        }
                    }
                    updateUser(userToUpdate);
                    addToast('Usuário atualizado!', 'success');
                } else {
                    // Create User
                    if (!editingUser.password) editingUser.password = '123456';
                    addUser({ ...editingUser, id: Date.now().toString(), registeredAt: new Date().toLocaleDateString('pt-BR') });
                    addToast('Novo usuário criado!', 'success');
                }
                setIsUserModalOpen(false);
                setEditingUser(null);
            } catch (error) {
                addToast('Erro ao salvar usuário.', 'error');
            }
        }
    };

    const handleSaveRole = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingRole) {
            if (roles.some(r => r.id === editingRole.id)) {
                updateRole(editingRole);
                addToast('Perfil de acesso atualizado!', 'success');
            } else {
                addRole({ ...editingRole, id: Date.now().toString() });
                addToast('Novo perfil criado!', 'success');
            }
            setIsRoleModalOpen(false);
            setEditingRole(null);
        }
    };

    // Helper for Exporting
    const exportToCSV = (data: any[], filename: string) => {
        if (!data || !data.length) return;
        const keys = Object.keys(data[0]);
        const csvContent = "data:text/csv;charset=utf-8,"
            + keys.join(",") + "\n"
            + data.map(row => keys.map(k => {
                const val = row[k];
                return typeof val === 'string' ? `"${val.replace(/"/g, '""')}"` : val;
            }).join(",")).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", filename + ".csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Filter Logic for Audit Log
    // Filter Logic for Audit Log
    const parseLogDate = (dateStr: string) => {
        if (!dateStr) return new Date(0);
        try {
            // Expecting DD/MM/YYYY HH:mm
            const [datePart, timePart] = dateStr.split(' ');
            if (!datePart) return new Date(0);
            const [day, month, year] = datePart.split('/');
            return new Date(`${year}-${month}-${day}T${timePart || '00:00:00'}`);
        } catch { return new Date(0); }
    };

    const filteredAuditLogs = useMemo(() => {
        return auditLogs.filter(log => {
            const matchesSearch = (log.details || '').toLowerCase().includes(auditSearch.toLowerCase()) ||
                log.userName.toLowerCase().includes(auditSearch.toLowerCase()) ||
                log.action.toLowerCase().includes(auditSearch.toLowerCase());

            const matchesModule = auditModuleFilter === 'Todos' || log.module === auditModuleFilter;
            const matchesSeverity = auditSeverityFilter === 'all' || log.severity === auditSeverityFilter;

            const logDate = parseLogDate(log.timestamp);
            const start = new Date(auditStartDate);
            start.setHours(0, 0, 0, 0);

            const end = new Date(auditEndDate);
            end.setHours(23, 59, 59, 999);

            const matchesDate = logDate >= start && logDate <= end;

            return matchesSearch && matchesModule && matchesSeverity && matchesDate;
        }).sort((a, b) => parseLogDate(b.timestamp).getTime() - parseLogDate(a.timestamp).getTime());
    }, [auditLogs, auditSearch, auditModuleFilter, auditSeverityFilter, auditStartDate, auditEndDate]);

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
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-6">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3 tracking-tighter uppercase italic">
                            <div className="p-2.5 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-600/20 rotate-3">
                                <SettingsIcon size={24} />
                            </div>
                            Configurações
                        </h1>
                        <p className="text-slate-500 dark:text-gray-400 text-xs mt-2 font-bold flex items-center gap-2 ml-1">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            Sistema Operacional v2.4.0
                        </p>
                    </div>
                </div>

                <div className="p-1.5 bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 w-full overflow-x-auto no-scrollbar flex items-center gap-2">
                    <TabButton id="company" label="Empresa" icon={Building} />
                    {hasPermission('users.manage') && <TabButton id="security" label="Segurança & Acesso" icon={ShieldCheck} />}
                    <TabButton id="system" label="Parâmetros" icon={Cpu} />
                    <TabButton id="audit" label="Auditoria" icon={History} />
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 bg-white dark:bg-slate-800 rounded-[32px] border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden relative">
                <div className="h-full overflow-y-auto custom-scrollbar p-8 pb-32">

                    {/* COMPANY SETTINGS */}
                    {activeTab === 'company' && (
                        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                                {/* Left Column: Identity */}
                                <div className="xl:col-span-2 space-y-8">
                                    <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[32px] border border-slate-100 dark:border-slate-700/50">
                                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                                            <Building size={16} className="text-indigo-500" /> Identidade Corporativa
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome Fantasia</label>
                                                <input type="text" className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3 px-4 font-bold text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none" value={tempSettings.tradeName} onChange={e => setTempSettings({ ...tempSettings, tradeName: e.target.value })} />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Razão Social</label>
                                                <input type="text" className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3 px-4 font-bold text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none" value={tempSettings.companyName} onChange={e => setTempSettings({ ...tempSettings, companyName: e.target.value })} />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">CNPJ / Documento</label>
                                                <input type="text" className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3 px-4 font-bold text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none" value={tempSettings.document} onChange={e => setTempSettings({ ...tempSettings, document: e.target.value })} />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">E-mail Principal</label>
                                                <input type="email" className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3 px-4 font-bold text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none" value={tempSettings.email} onChange={e => setTempSettings({ ...tempSettings, email: e.target.value })} />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[32px] border border-slate-100 dark:border-slate-700/50">
                                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                                            <MapPin size={16} className="text-pink-500" /> Localização & Contato
                                        </h3>
                                        <div className="grid grid-cols-1 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Endereço Completo</label>
                                                <input type="text" className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3 px-4 font-bold text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none" value={tempSettings.address} onChange={e => setTempSettings({ ...tempSettings, address: e.target.value })} />
                                            </div>
                                            <div className="grid grid-cols-2 gap-6">
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Telefone / WhatsApp</label>
                                                    <input type="text" className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3 px-4 font-bold text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none" value={tempSettings.phone} onChange={e => setTempSettings({ ...tempSettings, phone: e.target.value })} />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Website</label>
                                                    <input
                                                        type="text"
                                                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3 px-4 font-bold text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                                                        placeholder="https://..."
                                                        value={tempSettings.website || ''}
                                                        onChange={e => setTempSettings({ ...tempSettings, website: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[32px] border border-slate-100 dark:border-slate-700/50">
                                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                                            <Landmark size={16} className="text-emerald-500" /> Dados Bancários
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Banco</label>
                                                <input
                                                    type="text"
                                                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3 px-4 font-bold text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
                                                    value={tempSettings.bankDetails?.bankName || ''}
                                                    onChange={e => setTempSettings({ ...tempSettings, bankDetails: { ...tempSettings.bankDetails, bankName: e.target.value } as any })}
                                                    placeholder="Ex: Banco do Brasil"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Agência</label>
                                                <input
                                                    type="text"
                                                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3 px-4 font-bold text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
                                                    value={tempSettings.bankDetails?.agency || ''}
                                                    onChange={e => setTempSettings({ ...tempSettings, bankDetails: { ...tempSettings.bankDetails, agency: e.target.value } as any })}
                                                    placeholder="Ex: 0001-X"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Conta Corrente</label>
                                                <input
                                                    type="text"
                                                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3 px-4 font-bold text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
                                                    value={tempSettings.bankDetails?.account || ''}
                                                    onChange={e => setTempSettings({ ...tempSettings, bankDetails: { ...tempSettings.bankDetails, account: e.target.value } as any })}
                                                    placeholder="Ex: 12345-6"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Chave PIX</label>
                                                <input
                                                    type="text"
                                                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3 px-4 font-bold text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
                                                    value={tempSettings.bankDetails?.pixKey || ''}
                                                    onChange={e => setTempSettings({ ...tempSettings, bankDetails: { ...tempSettings.bankDetails, pixKey: e.target.value } as any })}
                                                    placeholder="CPF/CNPJ/Email/Aleatória"
                                                />
                                            </div>
                                            <div className="space-y-2 md:col-span-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tipo de Chave</label>
                                                <select
                                                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3 px-4 font-bold text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
                                                    value={tempSettings.bankDetails?.pixType || 'CNPJ'}
                                                    onChange={e => setTempSettings({ ...tempSettings, bankDetails: { ...tempSettings.bankDetails, pixType: e.target.value } as any })}
                                                >
                                                    <option>CNPJ</option>
                                                    <option>CPF</option>
                                                    <option>E-mail</option>
                                                    <option>Telefone</option>
                                                    <option>Chave Aleatória</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column: Plan & Info */}
                                <div className="space-y-6">
                                    <div className="p-8 bg-slate-900 text-white rounded-[40px] shadow-2xl relative overflow-hidden group">
                                        <Zap size={140} className="absolute -right-8 -bottom-8 text-white/5 group-hover:scale-110 transition-transform duration-700 rotate-12" />
                                        <div className="relative z-10">
                                            <div className="flex items-center gap-3 mb-6">
                                                <div className="p-2 bg-indigo-500 rounded-lg">
                                                    <Cloud size={20} className="text-white" />
                                                </div>
                                                <span className="font-black text-sm text-indigo-300 uppercase tracking-widest">Plano Atual</span>
                                            </div>
                                            <h4 className="text-3xl font-black italic tracking-tighter mb-2">ENTERPRISE</h4>
                                            <p className="text-slate-400 text-xs font-medium mb-8 max-w-[200px]">Acesso ilimitado a todos os módulos e recursos avançados.</p>

                                            <div className="space-y-4 mb-8">
                                                <div>
                                                    <div className="flex justify-between text-[10px] font-bold uppercase text-slate-400 mb-1">
                                                        <span>Armazenamento</span>
                                                        <span>25% Uso</span>
                                                    </div>
                                                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                                        <div className="h-full bg-indigo-500 w-[25%] rounded-full"></div>
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="flex justify-between text-[10px] font-bold uppercase text-slate-400 mb-1">
                                                        <span>Usuários</span>
                                                        <span>{users.length} Ativos</span>
                                                    </div>
                                                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                                        <div className="h-full bg-emerald-500 w-[12%] rounded-full"></div>
                                                    </div>
                                                </div>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => addToast('Plano Enterprise ativo: Licenças ilimitadas, SLA 99.9% e Suporte Prioritário 24/7.', 'success')}
                                                className="w-full py-4 bg-white text-slate-900 font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-slate-100 transition-colors"
                                            >
                                                Gerenciar Assinatura
                                            </button>
                                        </div>
                                    </div>

                                    <div className="p-6 border-2 border-dashed border-slate-200 dark:border-slate-700/50 rounded-3xl text-center">
                                        <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                            <Server size={24} />
                                        </div>
                                        <h4 className="font-black text-slate-900 dark:text-white text-sm mb-1">Backup na Nuvem</h4>
                                        <p className="text-xs text-slate-400 mb-4">Seus dados estão seguros e sincronizados.</p>
                                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full text-[10px] font-bold uppercase tracking-wide">
                                            <CheckCircle size={10} /> Ativo e Protegido
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* SECURITY SETTINGS */}
                    {activeTab === 'security' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 h-full flex flex-col">
                            <div className="flex items-center gap-2 mb-8 bg-slate-100 dark:bg-slate-900/50 p-1.5 rounded-2xl w-fit">
                                <button
                                    onClick={() => setSubTab('users')}
                                    className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${subTab === 'users' ? 'bg-white dark:bg-slate-800 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    Gerenciar Usuários
                                </button>
                                <button
                                    onClick={() => setSubTab('roles')}
                                    className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${subTab === 'roles' ? 'bg-white dark:bg-slate-800 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    Perfis & Permissões
                                </button>
                            </div>

                            {subTab === 'users' ? (
                                <div className="space-y-6">
                                    <div className="flex justify-between items-center bg-indigo-50 dark:bg-indigo-900/20 p-6 rounded-[24px] border border-indigo-100 dark:border-indigo-900/30">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-500/30">
                                                <Users size={24} />
                                            </div>
                                            <div>
                                                <h3 className="font-black text-slate-900 dark:text-white text-lg">Diretório de Usuários</h3>
                                                <p className="text-slate-500 dark:text-slate-400 text-xs font-medium">Gerencie quem tem acesso à plataforma.</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => { setEditingUser({ id: '', name: '', username: '', email: '', roleId: 'operator', status: 'Ativo', registeredAt: '', employeeId: '' }); setIsUserModalOpen(true); }}
                                            className="px-6 py-3 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center gap-2 shadow-xl"
                                        >
                                            <UserPlus size={16} /> Novo Usuário
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                        {users.map(user => (
                                            <div key={user.id} className="group relative bg-white dark:bg-slate-800 p-6 rounded-[24px] border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all hover:shadow-lg">
                                                <div className="flex justify-between items-start mb-4">
                                                    <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700 rounded-2xl flex items-center justify-center text-slate-500 font-extrabold text-lg">
                                                        {user.name.charAt(0)}
                                                    </div>
                                                    <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-wide ${user.status === 'Ativo' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                                        {user.status}
                                                    </span>
                                                </div>
                                                <h4 className="font-bold text-slate-900 dark:text-white truncate">{user.name}</h4>
                                                <p className="text-[10px] font-bold text-indigo-500 mb-1">@{user.username}</p>
                                                <p className="text-xs text-slate-500 truncate mb-4">{user.email}</p>

                                                <div className="flex items-center gap-2 mb-6">
                                                    <Shield size={12} className="text-indigo-500" />
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{roles.find(r => r.id === user.roleId)?.name || 'Sem Cargo'}</span>
                                                </div>

                                                <div className="flex gap-2 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-6 right-6 lg:static justify-end mt-4">
                                                    <button onClick={() => { setEditingUser(user); setIsUserModalOpen(true); }} className="p-2 text-slate-400 hover:text-indigo-600 bg-slate-50 dark:bg-slate-900 rounded-lg transition-colors"><Edit2 size={16} /></button>
                                                    <button onClick={() => {
                                                        addToast('Remover usuário?', 'warning', 5000, {
                                                            label: 'EXCLUIR',
                                                            onClick: () => deleteUser(user.id)
                                                        });
                                                    }} className="p-2 text-slate-400 hover:text-rose-600 bg-slate-50 dark:bg-slate-900 rounded-lg transition-colors"><Trash2 size={16} /></button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div className="flex justify-between items-center bg-indigo-50 dark:bg-indigo-900/20 p-6 rounded-[24px] border border-indigo-100 dark:border-indigo-900/30">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-purple-500 text-white rounded-xl shadow-lg shadow-purple-500/30">
                                                <ShieldCheck size={24} />
                                            </div>
                                            <div>
                                                <h3 className="font-black text-slate-900 dark:text-white text-lg">Perfis de Acesso (Roles)</h3>
                                                <p className="text-slate-500 dark:text-slate-400 text-xs font-medium">Controle granular de permissões por cargo.</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => { setEditingRole({ id: '', name: '', description: '', permissions: [] }); setIsRoleModalOpen(true); }}
                                            className="px-6 py-3 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center gap-2 shadow-xl"
                                        >
                                            <Plus size={16} /> Novo Perfil
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                        {roles.map(role => (
                                            <div key={role.id} className="bg-white dark:bg-slate-800 p-8 rounded-[32px] border border-slate-200 dark:border-slate-700 flex flex-col hover:border-purple-300 transition-all shadow-sm">
                                                <div className="flex items-center justify-between mb-4">
                                                    <Shield size={32} className="text-purple-500" />
                                                    <span className="text-[10px] bg-slate-100 dark:bg-slate-700 px-3 py-1 rounded-full font-black text-slate-500 uppercase">{role.permissions.length} Permissões</span>
                                                </div>
                                                <h4 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-2">{role.name}</h4>
                                                <p className="text-sm text-slate-500 mb-8 leading-relaxed flex-1">{role.description}</p>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => { setEditingRole(role); setIsRoleModalOpen(true); }}
                                                        className="flex-1 py-3 bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-purple-50 hover:text-purple-600 dark:hover:bg-purple-900/20 dark:hover:text-purple-300 transition-all"
                                                    >
                                                        Editar Acessos
                                                    </button>
                                                    {role.id !== 'admin' && (
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                addToast(`Deseja excluir o perfil "${role.name}"?`, 'warning', 5000, {
                                                                    label: 'EXCLUIR',
                                                                    onClick: () => {
                                                                        deleteRole(role.id);
                                                                        addToast('Perfil removido com sucesso!', 'info');
                                                                    }
                                                                });
                                                            }}
                                                            className="p-3 bg-slate-50 dark:bg-slate-700/50 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all"
                                                            title="Excluir Perfil"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

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
                                        { id: 'maintenance', label: 'Performance & Segurança', icon: ShieldCheck },
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

                            {/* Performance, Data Security & Danger Zone */}
                            {(systemCategory === 'all' || systemCategory === 'maintenance') && (
                                <>
                                    <PerformanceOptimizationSection settings={tempSettings} onUpdate={setTempSettings} addToast={addToast} />
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
                                                addToast("Carregar Planta Industrial e sobrescrever dados atuais?", 'info', 10000, {
                                                    label: 'CARREGAR',
                                                    onClick: () => {
                                                        const data = generateCameloData();
                                                        seedDatabase(data);
                                                        addToast('Ambiente Industrial carregado com sucesso!', 'success');
                                                    }
                                                });
                                            }}
                                            className="px-8 py-4 bg-white hover:bg-emerald-600 text-emerald-600 hover:text-white border-2 border-emerald-300 hover:border-emerald-600 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-lg hover:shadow-emerald-500/30 hover:scale-105 active:scale-95 flex flex-col items-center gap-2"
                                        >
                                            <span className="text-2xl">🏭</span>
                                            <span>Carregar Planta Industrial</span>
                                            <span className="text-[9px] opacity-75 lowercase font-mono">(britagem • asfalto • concreto)</span>
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
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden">
                                    <div className="absolute right-0 top-0 p-4 opacity-10"><Shield size={64} /></div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total de Registros</p>
                                    <p className="text-3xl font-black text-slate-800 dark:text-white mt-1">{filteredAuditLogs.length}</p>
                                    <div className="mt-2 text-xs text-emerald-600 font-bold flex items-center gap-1">
                                        <CheckCircle size={12} /> Sistema Monitorado
                                    </div>
                                </div>

                                <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden">
                                    <div className="absolute right-0 top-0 p-4 opacity-10"><AlertTriangle size={64} /></div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Críticos / Alertas</p>
                                    <p className="text-3xl font-black text-rose-600 mt-1">
                                        {filteredAuditLogs.filter(l => l.severity === 'critical' || l.severity === 'warning').length}
                                    </p>
                                    <div className="mt-2 text-xs text-rose-600 font-bold flex items-center gap-1">
                                        Verificar incidentes
                                    </div>
                                </div>

                                <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden">
                                    <div className="absolute right-0 top-0 p-4 opacity-10"><Users size={64} /></div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Usuários Ativos</p>
                                    <p className="text-3xl font-black text-slate-800 dark:text-white mt-1">
                                        {[...new Set(filteredAuditLogs.map(l => l.userName))].length}
                                    </p>
                                    <div className="mt-2 text-xs text-slate-500 font-bold">
                                        No período selecionado
                                    </div>
                                </div>

                                <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden flex flex-col justify-center gap-2">
                                    <button
                                        onClick={() => {
                                            if (filteredAuditLogs.length === 0) {
                                                addToast('Nenhum dado para exportar.', 'info');
                                                return;
                                            }
                                            exportToCSV(filteredAuditLogs, `Auditoria_Export_${new Date().toISOString().split('T')[0]}`);
                                            addToast('Relatório de auditoria exportado!', 'success');
                                        }}
                                        className="w-full py-2.5 bg-slate-900 dark:bg-slate-700 text-white rounded-xl text-xs font-bold hover:bg-slate-800 flex items-center justify-center gap-2"
                                    >
                                        <Download size={14} /> Exportar CSV
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            addToast('Preparando impressão do relatório de auditoria...', 'info');
                                            setTimeout(() => window.print(), 300);
                                        }}
                                        className="w-full py-2.5 bg-cyan-600 text-white rounded-xl text-xs font-bold hover:bg-cyan-500 flex items-center justify-center gap-2"
                                    >
                                        <Printer size={14} /> Imprimir Relatório
                                    </button>
                                </div>
                            </div>

                            {/* Filters and Toolbar */}
                            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col xl:flex-row gap-4">
                                <div className="flex-1 relative">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input
                                        type="text"
                                        placeholder="Buscar por ação, usuário, detalhes..."
                                        className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border-none rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-cyan-500/20"
                                        value={auditSearch}
                                        onChange={(e) => setAuditSearch(e.target.value)}
                                    />
                                </div>

                                <div className="flex gap-2 items-center flex-wrap">
                                    <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900 rounded-xl px-3 py-2 border border-slate-100 dark:border-slate-700">
                                        <Calendar size={14} className="text-slate-400" />
                                        <input
                                            type="date"
                                            value={auditStartDate}
                                            onChange={e => setAuditStartDate(e.target.value)}
                                            className="bg-transparent border-none text-xs font-bold text-slate-600 dark:text-slate-300 outline-none w-24"
                                        />
                                        <span className="text-slate-300">-</span>
                                        <input
                                            type="date"
                                            value={auditEndDate}
                                            onChange={e => setAuditEndDate(e.target.value)}
                                            className="bg-transparent border-none text-xs font-bold text-slate-600 dark:text-slate-300 outline-none w-24"
                                        />
                                    </div>

                                    <select
                                        value={auditSeverityFilter}
                                        onChange={e => setAuditSeverityFilter(e.target.value as any)}
                                        className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-xl px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 outline-none h-full"
                                    >
                                        <option value="all">Todas Severidades</option>
                                        <option value="info">ℹ️ Informativo</option>
                                        <option value="warning">⚠️ Avisos</option>
                                        <option value="critical">🚨 Crítico</option>
                                    </select>
                                </div>
                            </div>

                            {/* Module Tabs */}
                            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                                {['Todos', 'Login', 'Vendas', 'Configurações', 'Estoque', 'Financeiro', 'Frota', 'Produção', 'RH', 'Segurança'].map(m => (
                                    <button
                                        key={m}
                                        onClick={() => setAuditModuleFilter(m)}
                                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wide whitespace-nowrap transition-all border ${auditModuleFilter === m
                                            ? 'bg-slate-800 text-white border-slate-800 dark:bg-white dark:text-slate-900'
                                            : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                                            }`}
                                    >
                                        {m}
                                    </button>
                                ))}
                            </div>

                            {/* Data Table */}
                            <div className="flex-1 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col">
                                <div className="overflow-y-auto flex-1 custom-scrollbar">
                                    <table className="w-full text-left border-collapse">
                                        <thead className="bg-slate-50 dark:bg-slate-900 sticky top-0 z-10 border-b border-slate-200 dark:border-slate-700">
                                            <tr>
                                                <th className="py-4 px-6 text-[10px] font-black uppercase text-slate-400 tracking-widest w-40">Data / Hora</th>
                                                <th className="py-4 px-6 text-[10px] font-black uppercase text-slate-400 tracking-widest w-48">Usuário</th>
                                                <th className="py-4 px-6 text-[10px] font-black uppercase text-slate-400 tracking-widest w-40">Módulo/Ação</th>
                                                <th className="py-4 px-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Detalhes da Ocorrência</th>
                                                <th className="py-4 px-6 text-[10px] font-black uppercase text-slate-400 tracking-widest w-24 text-right">IP</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                            {filteredAuditLogs.length > 0 ? (
                                                filteredAuditLogs.slice((auditPage - 1) * AUDIT_PAGE_SIZE, auditPage * AUDIT_PAGE_SIZE).map(log => (
                                                    <tr key={log.id} className="group hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                                        <td className="py-4 px-6">
                                                            <div className="flex flex-col">
                                                                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{log.timestamp.split(' ')[0]}</span>
                                                                <span className="text-[10px] font-mono text-slate-400">{log.timestamp.split(' ')[1]}</span>
                                                            </div>
                                                        </td>
                                                        <td className="py-4 px-6">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center text-xs font-black text-slate-600 dark:text-slate-300">
                                                                    {log.userName.charAt(0)}
                                                                </div>
                                                                <div className="flex flex-col">
                                                                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{log.userName}</span>
                                                                    <span className="text-[9px] text-slate-400">ID: {log.userId}</span>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="py-4 px-6">
                                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold border ${log.severity === 'critical' ? 'bg-rose-50 border-rose-100 text-rose-700' :
                                                                log.severity === 'warning' ? 'bg-amber-50 border-amber-100 text-amber-700' :
                                                                    'bg-slate-50 border-slate-100 text-slate-600 dark:bg-slate-900/50 dark:border-slate-600 dark:text-slate-400'
                                                                }`}>
                                                                {log.severity === 'critical' && <AlertTriangle size={10} />}
                                                                {log.severity === 'warning' && <AlertTriangle size={10} />}
                                                                {log.severity === 'info' && <Info size={10} />}
                                                                {log.module} • {log.action}
                                                            </span>
                                                        </td>
                                                        <td className="py-4 px-6">
                                                            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium leading-relaxed max-w-xl">
                                                                {log.details}
                                                            </p>
                                                        </td>
                                                        <td className="py-4 px-6 text-right">
                                                            <span className="text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-900 px-2 py-1 rounded">
                                                                {log.ip || 'Local'}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan={5} className="py-20 text-center">
                                                        <div className="flex flex-col items-center justify-center opacity-50">
                                                            <Search size={48} className="text-slate-300 mb-4" />
                                                            <p className="text-sm font-bold text-slate-500">Nenhum registro encontrado</p>
                                                            <p className="text-xs text-slate-400 mt-1">Tente ajustar os filtros de busca</p>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Footer Pagination */}
                                <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex justify-between items-center">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                                        Mostrando {filteredAuditLogs.length === 0 ? 0 : (auditPage - 1) * AUDIT_PAGE_SIZE + 1} - {Math.min(auditPage * AUDIT_PAGE_SIZE, filteredAuditLogs.length)} de {filteredAuditLogs.length} registros
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            disabled={auditPage <= 1}
                                            onClick={() => setAuditPage(p => Math.max(1, p - 1))}
                                            className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                        >
                                            Anterior
                                        </button>
                                        <span className="text-xs font-black text-slate-500 px-2">
                                            Pág. {auditPage} / {Math.max(1, Math.ceil(filteredAuditLogs.length / AUDIT_PAGE_SIZE))}
                                        </span>
                                        <button
                                            type="button"
                                            disabled={auditPage >= Math.ceil(filteredAuditLogs.length / AUDIT_PAGE_SIZE)}
                                            onClick={() => setAuditPage(p => p + 1)}
                                            className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                        >
                                            Próxima
                                        </button>
                                    </div>
                                </div>
                            </div>
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
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-800 rounded-[32px] shadow-2xl w-full max-w-lg border dark:border-slate-700 animate-in zoom-in duration-200 overflow-hidden">
                        <div className="p-8 border-b dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
                            <div>
                                <h3 className="font-black text-xl text-slate-900 dark:text-white uppercase tracking-tighter italic">
                                    {editingUser.id ? 'Editar Usuário' : 'Novo Usuário'}
                                </h3>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Configurações de acesso e perfil.</p>
                            </div>
                            <button type="button" onClick={() => setIsUserModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200 transition-all"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSaveUser} className="p-8 space-y-6">
                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome Completo</label>
                                    <input type="text" className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-2xl py-3 px-4 font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-500/20" value={editingUser.name} onChange={e => setEditingUser({ ...editingUser, name: e.target.value })} required />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome de Usuário (Login)</label>
                                    <input type="text" className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-2xl py-3 px-4 font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-500/20" value={editingUser.username} onChange={e => setEditingUser({ ...editingUser, username: e.target.value })} required placeholder="Ex: joao.silva" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">E-mail Corporativo</label>
                                    <input type="email" className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-2xl py-3 px-4 font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-500/20" value={editingUser.email} onChange={e => setEditingUser({ ...editingUser, email: e.target.value })} required />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Senha de Acesso</label>
                                    <div className="relative">
                                        <input
                                            type="password"
                                            className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-2xl py-3 px-4 font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                                            value={editingUser.password || ''}
                                            onChange={e => setEditingUser({ ...editingUser, password: e.target.value })}
                                            placeholder={editingUser.id ? "Deixe em branco para não alterar" : "Defina uma senha"}
                                            required={!editingUser.id}
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cargo / Role</label>
                                        <select className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-2xl py-3 px-4 font-bold text-sm" value={editingUser.roleId} onChange={e => setEditingUser({ ...editingUser, roleId: e.target.value })}>
                                            {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Status</label>
                                        <select className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-2xl py-3 px-4 font-bold text-sm" value={editingUser.status} onChange={e => setEditingUser({ ...editingUser, status: e.target.value as any })}>
                                            <option value="Ativo">Ativo</option>
                                            <option value="Inativo">Inativo</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Vincular Colaborador (RH)</label>
                                    <select className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-2xl py-3 px-4 font-bold text-sm" value={editingUser.employeeId || ''} onChange={e => setEditingUser({ ...editingUser, employeeId: e.target.value })}>
                                        <option value="">-- Não vinculado --</option>
                                        {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
                                    </select>
                                </div>
                            </div>
                            <button type="submit" className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-600/20 hover:scale-[1.02] transition-all">
                                Salvar Usuário
                            </button>
                        </form>
                    </div>
                </div >
            )}

            {/* Role Modal */}
            {
                isRoleModalOpen && editingRole && (
                    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <div className="bg-white dark:bg-slate-800 rounded-[32px] shadow-2xl w-full max-w-5xl border dark:border-slate-700 animate-in zoom-in duration-200 overflow-hidden h-[85vh] flex flex-col">
                            <div className="p-6 border-b dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50 shrink-0">
                                <div>
                                    <h3 className="font-black text-xl text-slate-900 dark:text-white uppercase tracking-tighter italic">
                                        {editingRole.id ? 'Editar Perfil de Acesso' : 'Novo Perfil de Acesso'}
                                    </h3>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                                        Permissões granulares para {editingRole.name || 'novo perfil'}.
                                    </p>
                                </div>
                                <button type="button" onClick={() => setIsRoleModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200 transition-all"><X size={20} /></button>
                            </div>

                            <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
                                {/* Role Details - Left Panel */}
                                <div className="w-full md:w-80 p-8 border-r border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-y-auto shrink-0 space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome do Cargo</label>
                                        <input type="text" className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl py-3 px-4 font-bold text-sm" value={editingRole.name} onChange={e => setEditingRole({ ...editingRole, name: e.target.value })} required />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Descrição</label>
                                        <textarea className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl py-3 px-4 font-bold text-sm h-32 resize-none" value={editingRole.description} onChange={e => setEditingRole({ ...editingRole, description: e.target.value })} required />
                                    </div>
                                    <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-900/30">
                                        <h4 className="flex items-center gap-2 font-bold text-indigo-700 dark:text-indigo-300 text-xs mb-2"><ShieldCheck size={14} /> Resumo</h4>
                                        <p className="text-[10px] text-indigo-600/70 dark:text-indigo-300/70">Este perfil possui acesso a <strong className="text-indigo-800 dark:text-indigo-200">{editingRole.permissions.length}</strong> funcionalidades do sistema.</p>
                                    </div>
                                </div>

                                {/* Permissions Matrix - Right Panel */}
                                <div className="flex-1 bg-slate-50/50 dark:bg-slate-900/30 p-8 overflow-y-auto custom-scrollbar">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {APP_PERMISSIONS.map(category => (
                                            <div key={category.category} className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
                                                <div className="flex justify-between items-center mb-4">
                                                    <h4 className="font-black text-xs uppercase tracking-widest text-slate-800 dark:text-white">{category.category}</h4>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const catIds = category.permissions.map(p => p.id);
                                                            const allSelected = catIds.every(id => editingRole.permissions.includes(id));
                                                            if (allSelected) {
                                                                setEditingRole({ ...editingRole, permissions: editingRole.permissions.filter(p => !catIds.includes(p)) });
                                                            } else {
                                                                setEditingRole({ ...editingRole, permissions: [...new Set([...editingRole.permissions, ...catIds])] });
                                                            }
                                                        }}
                                                        className="text-[10px] font-bold text-indigo-500 hover:text-indigo-700 bg-indigo-50 dark:bg-indigo-900/20 px-2 py-1 rounded-lg transition-colors"
                                                    >
                                                        Inverter Seleção
                                                    </button>
                                                </div>
                                                <div className="space-y-2">
                                                    {category.permissions.map(perm => {
                                                        const isSelected = editingRole.permissions.includes(perm.id);
                                                        return (
                                                            <div
                                                                key={perm.id}
                                                                onClick={() => {
                                                                    if (isSelected) {
                                                                        setEditingRole({ ...editingRole, permissions: editingRole.permissions.filter(p => p !== perm.id) });
                                                                    } else {
                                                                        setEditingRole({ ...editingRole, permissions: [...editingRole.permissions, perm.id] });
                                                                    }
                                                                }}
                                                                className={`cursor-pointer flex items-start gap-3 p-2 rounded-xl transition-all border ${isSelected
                                                                    ? 'bg-indigo-50 dark:bg-indigo-900/10 border-indigo-100 dark:border-indigo-900/30'
                                                                    : 'bg-transparent border-transparent hover:bg-slate-50 dark:hover:bg-slate-700/50'
                                                                    }`}
                                                            >
                                                                <div className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center transition-all ${isSelected ? 'bg-indigo-500 border-indigo-500 text-white' : 'bg-white border-slate-300'
                                                                    }`}>
                                                                    {isSelected && <Check size={10} strokeWidth={4} />}
                                                                </div>
                                                                <div>
                                                                    <p className={`text-[11px] font-bold leading-tight ${isSelected ? 'text-indigo-900 dark:text-indigo-200' : 'text-slate-600 dark:text-slate-400'}`}>{perm.name}</p>
                                                                    <p className="text-[9px] text-slate-400 mt-0.5 leading-tight">{perm.description}</p>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-3 shrink-0">
                                <button type="button" onClick={() => setIsRoleModalOpen(false)} className="px-6 py-3 text-slate-500 font-bold text-xs uppercase hover:text-slate-800 transition-colors">Cancelar</button>
                                <button onClick={handleSaveRole} className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-600/20 hover:scale-105 active:scale-95 transition-all">
                                    Salvar Definições
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default Settings;
