import React, { useState, useMemo, useEffect } from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell,
    AreaChart,
    Area
} from 'recharts';
import {
    FileText,
    Download,
    Calendar,
    TrendingUp,
    DollarSign,
    Share2,
    Printer,
    Mail,
    ChevronDown,
    ChevronUp,
    Loader,
    ArrowUpRight,
    ArrowDownRight,
    Circle,
    Package,
    Activity,
    Factory,
    RefreshCw,
    ExternalLink,
    AlertTriangle,
    TrendingDown,
    PieChart as PieChartIcon,
    BarChart3,
    Truck,
    BookOpen,
    Calculator,
    ScrollText,
    ClipboardList,
    Landmark,
    User,
    UserPlus,
    Search,
    X,
    Settings,
    Plus,
    Minus,
    Maximize2,
    Minimize2,
    CheckCircle,
    ShieldCheck,
    SlidersHorizontal,
    ArrowUpDown,
    CheckSquare,
    Square,
    Eye,
    EyeOff
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { printDocument, exportDashboardToExcel, exportCustomTableToCSV } from '../utils/exportUtils';

const formatMoney = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);

const parseDateString = (dateStr?: string): Date => {
    if (!dateStr) return new Date();
    if (dateStr.includes('/')) {
        const parts = dateStr.split(' ')[0].split('/').map(Number);
        if (parts.length === 3) {
            return new Date(parts[2], parts[1] - 1, parts[0], 12, 0, 0);
        }
    }
    if (dateStr.includes('-')) {
        const datePart = dateStr.split('T')[0];
        const parts = datePart.split('-').map(Number);
        if (parts.length === 3) {
            return new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0);
        }
    }
    const parsed = new Date(dateStr);
    return isNaN(parsed.getTime()) ? new Date() : parsed;
};

const formatDateBR = (isoDateOrStr?: string) => {
    if (!isoDateOrStr) return '';
    if (isoDateOrStr.includes('/')) return isoDateOrStr;
    const datePart = isoDateOrStr.split('T')[0];
    const [year, month, day] = datePart.split('-');
    if (year && month && day) return `${day}/${month}/${year}`;
    return isoDateOrStr;
};

interface ReportPreferences {
    visibleColumns: string[];
    sortField?: string;
    sortOrder?: 'asc' | 'desc';
    statusFilter?: string;
    orientation?: 'portrait' | 'landscape';
    showSignatures?: boolean;
}

const Reports = () => {
    const {
        financials, transactions, sales, budgets, inventory, purchaseOrders,
        clients, fleet, employees, stockMovements, settings, planOfAccounts,
        accounts, currentUser,
        productionOrders = [], productionUnits = [], formulas = [],
        tires = [], auditLogs = [], suppliers = [], payroll = []
    } = useApp();
    const { addToast } = useToast();

    // Main 4 Navigation Tabs: 'dashboard' | 'dre' | 'chart_of_accounts' | 'generator'
    const [activeTab, setActiveTab] = useState<'dashboard' | 'dre' | 'chart_of_accounts' | 'generator'>('generator');

    // DRE View Selector: 'gerencial' | 'contabil' | 'mensal' | 'centro_custo'
    const [dreViewMode, setDreViewMode] = useState<'gerencial' | 'contabil' | 'mensal' | 'centro_custo'>('gerencial');

    // Chart of Accounts State
    const [poaSearchTerm, setPoaSearchTerm] = useState('');
    const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});

    const toggleNode = (id: string) => {
        setExpandedNodes(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const expandAll = () => {
        const allIds: Record<string, boolean> = {};
        const traverse = (nodes: any[]) => {
            nodes.forEach(n => {
                allIds[n.id] = true;
                if (n.children) traverse(n.children);
            });
        };
        traverse(planOfAccounts);
        setExpandedNodes(allIds);
    };

    const collapseAll = () => {
        setExpandedNodes({});
    };

    // Report Generator State (null by default so no report is fixed/pinned initially)
    const [selectedModule, setSelectedModule] = useState<string | null>(null);
    const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

    // Report Library Filters & Customization Toolbar State
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('Todos');
    const [showCustomizer, setShowCustomizer] = useState(false);

    // Active Customization State per Report
    const [visibleColumns, setVisibleColumns] = useState<string[]>([]);
    const [sortField, setSortField] = useState<string | null>(null);
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
    const [statusFilter, setStatusFilter] = useState<string>('Todos');
    const [printOrientation, setPrintOrientation] = useState<'portrait' | 'landscape'>('portrait');
    const [printShowSignatures, setPrintShowSignatures] = useState<boolean>(true);

    // Dashboard BI Trends State & Period Selection
    const [reportPeriod, setReportPeriod] = useState<'7d' | '30d' | '12m'>('30d');

    // Company Data
    const company = useMemo(() => ({
        companyName: settings?.companyName || 'InfraCore Engenharia e Tecnologia Ltda',
        tradeName: settings?.tradeName || 'InfraCore ERP',
        document: settings?.document || '12.345.678/0001-99',
        stateRegistry: settings?.technical?.stateRegistry || '123.456.789.110',
        email: settings?.email || 'contato@infracore.com',
        phone: settings?.phone || '(11) 4002-8922',
        address: settings?.address || 'Rua da Tecnologia, 100 - Distrito Industrial, SP'
    }), [settings]);

    // Extended Modules for Reporting - Organized by Category (39 Total Models)
    const modules = useMemo(() => [
        // COMERCIAL
        { id: 'sales', name: 'Vendas Realizadas', icon: <DollarSign size={16} />, category: 'Comercial', description: 'Histórico completo de vendas com cliente, produtos, valores e forma de pagamento.', fields: ['ID', 'Data', 'Cliente', 'Produtos', 'Total', 'Forma Pagto', 'Status'] },
        { id: 'sales_by_product', name: 'Vendas por Produto', icon: <Package size={16} />, category: 'Comercial', description: 'Ranking de produtos mais vendidos com quantidade e faturamento.', fields: ['Produto', 'Qtd Vendida', 'Faturamento', 'Margem %', 'Ticket Médio'] },
        { id: 'sales_by_client', name: 'Vendas por Cliente', icon: <User size={16} />, category: 'Comercial', description: 'Análise de faturamento por cliente com frequência de compra.', fields: ['Cliente', 'Total Compras', 'Valor Total', 'Última Compra', 'Ticket Médio'] },
        { id: 'sales_by_seller', name: 'Vendas por Vendedor', icon: <User size={16} />, category: 'Comercial', description: 'Performance individual de vendedores com metas e comissões.', fields: ['Vendedor', 'Vendas', 'Faturamento', 'Comissão (5%)', 'Meta %'] },
        { id: 'sales_by_payment', name: 'Vendas por Forma de Pagamento', icon: <DollarSign size={16} />, category: 'Comercial', description: 'Distribuição de vendas por método de pagamento (PIX, cartão, boleto).', fields: ['Forma Pagto', 'Qtd Vendas', 'Valor Total', '% do Total', 'Ticket Médio'] },
        { id: 'quotes', name: 'Orçamentos Emitidos', icon: <FileText size={16} />, category: 'Comercial', description: 'Listagem de orçamentos com taxa de conversão.', fields: ['Nº', 'Data', 'Cliente', 'Valor', 'Status', 'Convertido'] },

        // FINANCEIRO
        { id: 'finance', name: 'Transações Financeiras', icon: <TrendingUp size={16} />, category: 'Financeiro', description: 'Todas as movimentações de receitas e despesas realizadas e previstas.', fields: ['ID', 'Data', 'Descrição', 'Categoria', 'Tipo', 'Valor', 'Status', 'Conta'] },
        { id: 'cashflow', name: 'Fluxo de Caixa Realizado (Extrato)', icon: <Activity size={16} />, category: 'Financeiro', description: 'Demonstrativo detalhado de entradas, saídas e evolução diária do saldo acumulado.', fields: ['Data', 'Descrição', 'Categoria', 'Conta', 'Entrada', 'Saída', 'Saldo Acumulado', 'Status'] },
        { id: 'cashflow_projection', name: 'Projeção de Caixa por Período', icon: <TrendingUp size={16} />, category: 'Financeiro', description: 'Previsão orçamentária por faixas de vencimento com saldo futuro estimado.', fields: ['Faixa de Vencimento', 'A Receber (Previsto)', 'A Pagar (Previsto)', 'Resultado Operacional', 'Saldo Projetado', 'Situação'] },
        { id: 'cashflow_daily', name: 'Fluxo de Caixa Diário Consolidado', icon: <Calendar size={16} />, category: 'Financeiro', description: 'Resumo diário consolidado com saldo inicial, entradas, saídas e saldo final.', fields: ['Data', 'Saldo Inicial', 'Entradas', 'Saídas', 'Saldo do Dia', 'Saldo Final'] },
        { id: 'receivables', name: 'Contas a Receber', icon: <ArrowUpRight size={16} />, category: 'Financeiro', description: 'Títulos e duplicatas a receber com vencimentos e status de cobrança.', fields: ['Nº', 'Cliente', 'Valor', 'Vencimento', 'Forma Pagto', 'Dias em Aberto', 'Status'] },
        { id: 'receivables_aging', name: 'Aging de Recebíveis', icon: <Activity size={16} />, category: 'Financeiro', description: 'Análise por faixa de vencimento (A Vencer, 1-30d, 31-60d, 61-90d, 90+d).', fields: ['Cliente', 'A Vencer', '1-30 dias', '31-60 dias', '61-90 dias', '90+ dias', 'Total a Receber'] },
        { id: 'payables', name: 'Contas a Pagar', icon: <ArrowDownRight size={16} />, category: 'Financeiro', description: 'Obrigações e compromissos financeiros pendentes com fornecedores.', fields: ['Nº', 'Fornecedor', 'Valor', 'Vencimento', 'Dias para Vencimento', 'Status'] },
        { id: 'payables_aging', name: 'Aging de Pagáveis', icon: <Activity size={16} />, category: 'Financeiro', description: 'Contas a pagar agrupadas por faixas de vencimento.', fields: ['Fornecedor', 'A Vencer', '1-30 dias', '31-60 dias', '61-90 dias', '90+ dias', 'Total a Pagar'] },
        { id: 'overdue', name: 'Inadimplência e Títulos em Atraso', icon: <AlertTriangle size={16} />, category: 'Financeiro', description: 'Títulos vencidos e não quitados com cálculo de dias de atraso.', fields: ['Cliente', 'Documento', 'Valor', 'Vencimento', 'Dias Atraso', 'Telefone'] },
        { id: 'bank_statements', name: 'Extrato por Conta Bancária', icon: <Landmark size={16} />, category: 'Financeiro', description: 'Movimentação analítica discriminada por conta bancária e caixa.', fields: ['Data', 'Conta Bancária', 'Histórico', 'Documento', 'Entrada (Crédito)', 'Saída (Débito)', 'Saldo'] },
        { id: 'expense_by_category', name: 'Despesas por Categoria', icon: <PieChartIcon size={16} />, category: 'Financeiro', description: 'Distribuição analítica de gastos por categoria do plano de contas.', fields: ['Categoria', 'Valor Total', '% do Total', 'Qtd Lançamentos', 'Média por Lançamento'] },
        { id: 'revenue_by_source', name: 'Receitas por Origem', icon: <TrendingUp size={16} />, category: 'Financeiro', description: 'Classificação de receitas por categoria e canal de faturamento.', fields: ['Origem / Categoria', 'Valor Total', '% do Total', 'Qtd Lançamentos', 'Ticket Médio'] },
        { id: 'financial_ratios', name: 'Indicadores Financeiros (KPIs)', icon: <Activity size={16} />, category: 'Financeiro', description: 'Métricas de liquidez, margem operacional, inadimplência e cobertura de caixa.', fields: ['Indicador', 'Valor Apurado', 'Meta / Referência', 'Status Operacional', 'Tendência'] },

        // ESTOQUE
        { id: 'inventory', name: 'Posição de Estoque', icon: <Package size={16} />, category: 'Estoque', description: 'Saldo atual de todos os produtos e insumos em estoque.', fields: ['ID', 'Produto', 'Categoria', 'Qtd', 'Unidade', 'Preço Venda', 'Valor Total'] },
        { id: 'stock_movements', name: 'Movimentação de Estoque', icon: <RefreshCw size={16} />, category: 'Estoque', description: 'Histórico de entradas e saídas de produtos com motivo e usuário.', fields: ['Data', 'Hora', 'Produto', 'Tipo', 'Qtd', 'Motivo', 'Usuário'] },
        { id: 'stock_min', name: 'Estoque Mínimo (Ponto de Reposição)', icon: <AlertTriangle size={16} />, category: 'Estoque', description: 'Produtos abaixo do ponto de pedido que necessitam reposição.', fields: ['Produto', 'Estoque Atual', 'Mínimo', 'Faltando', 'Fornecedor', 'Último Pedido'] },
        { id: 'stock_value', name: 'Valorização de Estoque', icon: <DollarSign size={16} />, category: 'Estoque', description: 'Valor financeiro do estoque por custo e preço de venda com margem calculada.', fields: ['Produto', 'Qtd', 'Custo Unit.', 'Custo Total', 'Preço Venda', 'Margem %'] },

        // PRODUÇÃO INDUSTRIAL
        { id: 'production_orders', name: 'Ordens de Produção e Rendimento', icon: <Factory size={16} />, category: 'Produção', description: 'Controle de fabricação industrial, fórmulas, quantidades e status de avanço.', fields: ['Ordem', 'Produto', 'Qtd Planejada', 'Início', 'Previsão', 'Status', 'Progresso', 'Operador'] },
        { id: 'production_units', name: 'Desempenho de Usinas e OEE', icon: <Activity size={16} />, category: 'Produção', description: 'Monitoramento das usinas de asfalto/concreto com carga nominal, temperatura e disponibilidade.', fields: ['Usina / Planta', 'Tipo', 'Capacidade Nominal', 'Carga Atual %', 'Temperatura (°C)', 'Potência', 'Status'] },

        // CLIENTES & COMPRAS
        { id: 'clients', name: 'Cadastro de Clientes', icon: <Circle size={16} />, category: 'Clientes', description: 'Base completa de clientes cadastrados no ERP.', fields: ['Nome', 'Documento', 'Email', 'Telefone', 'Cidade', 'Status'] },
        { id: 'clients_ranking', name: 'Ranking de Clientes', icon: <TrendingUp size={16} />, category: 'Clientes', description: 'Top clientes por volume financeiro de compras.', fields: ['Posição', 'Cliente', 'Total Compras', 'Faturamento', 'Ticket Médio'] },
        { id: 'purchases', name: 'Pedidos de Compra', icon: <ClipboardList size={16} />, category: 'Compras', description: 'Histórico de pedidos de compra emitidos para fornecedores.', fields: ['Nº', 'Data', 'Fornecedor', 'Valor', 'Status', 'Prazo Entrega'] },
        { id: 'purchases_by_supplier', name: 'Compras por Fornecedor', icon: <Factory size={16} />, category: 'Compras', description: 'Volume financeiro consolidado por fornecedor.', fields: ['Fornecedor', 'Total Pedidos', 'Valor Total', 'Prazo Médio', 'Última Compra'] },

        // FROTA & RH
        { id: 'fleet', name: 'Cadastro de Veículos', icon: <Truck size={16} />, category: 'Frota', description: 'Listagem e status operacional de toda a frota de veículos.', fields: ['Placa', 'Modelo', 'Tipo', 'KM Atual', 'Status', 'Combustível'] },
        { id: 'fleet_costs', name: 'Custos Consolidados da Frota', icon: <DollarSign size={16} />, category: 'Frota', description: 'Custo total por veículo (combustível + manutenção) e custo/km.', fields: ['Placa', 'Modelo', 'Combustível', 'Manutenção', 'Total', 'Custo/KM'] },
        { id: 'tires_management', name: 'Gestão e Vida Útil de Pneus', icon: <Activity size={16} />, category: 'Frota', description: 'Controle individual de pneus, veículos instalados, KM percorrido e histórico de recapagem.', fields: ['Fogo / Série', 'Marca / Modelo', 'Veículo Instalado', 'Posição', 'KM Rodado', 'Recapagens', 'Status'] },
        { id: 'hr', name: 'Quadro de Colaboradores', icon: <User size={16} />, category: 'RH', description: 'Listagem de funcionários com cargo, departamento e remuneração.', fields: ['Nome', 'Cargo', 'Depto', 'Salário', 'Admissão', 'Status'] },
        { id: 'hr_payroll', name: 'Folha de Pagamento', icon: <DollarSign size={16} />, category: 'RH', description: 'Demonstrativo de proventos, descontos de INSS/IRRF e salário líquido apurado.', fields: ['Funcionário', 'Salário Base', 'Adicionais / Benefícios', 'Descontos (INSS/IRRF)', 'Líquido'] },

        // CONTÁBIL & GERENCIAL
        { id: 'dre', name: 'D.R.E. (Demonstração do Resultado)', icon: <Calculator size={16} />, category: 'Contábil', description: 'Demonstração do Resultado do Exercício com EBITDA e lucro líquido segregando CPV de despesas operacionais.', fields: ['Estrutura Contábil', 'Valor', '% Rec. Bruta', 'Tipo'] },
        { id: 'trial_balance', name: 'Balancete de Verificação', icon: <ScrollText size={16} />, category: 'Contábil', description: 'Saldos de débito e crédito por conta do plano de contas.', fields: ['Código', 'Conta Contábil', 'Saldo Anterior', 'Débitos', 'Créditos', 'Saldo Atual'] },
        { id: 'cost_center', name: 'Resultado por Centro de Custo', icon: <PieChartIcon size={16} />, category: 'Contábil', description: 'Receitas, despesas e margem operacional por centro de custo.', fields: ['Centro de Custo', 'Receitas', 'Despesas', 'Resultado Líquido', 'Margem %'] },
        { id: 'audit_trail', name: 'Trilha de Auditoria e Governança', icon: <ShieldCheck size={16} />, category: 'Gerencial', description: 'Logs de eventos, ações de usuários, severidade de segurança e registros de auditoria.', fields: ['Data/Hora', 'Usuário', 'Ação', 'Módulo', 'Severidade', 'Detalhes', 'IP'] },
        { id: 'dashboard_summary', name: 'Resumo Executivo Gerencial', icon: <PieChartIcon size={16} />, category: 'Gerencial', description: 'Visão consolidada dos principais indicadores de desempenho do ERP.', fields: ['Indicador', 'Valor Apurado', 'Meta Corporativa', 'Variação', 'Status'] }
    ], []);

    // Load and Persist Preferences in LocalStorage when selectedModule changes
    useEffect(() => {
        if (!selectedModule) return;
        const mod = modules.find(m => m.id === selectedModule);
        const defaultFields = mod?.fields || [];

        try {
            const saved = localStorage.getItem(`infracore_report_prefs_${selectedModule}`);
            if (saved) {
                const prefs: ReportPreferences = JSON.parse(saved);
                setVisibleColumns(prefs.visibleColumns && prefs.visibleColumns.length > 0 ? prefs.visibleColumns : defaultFields);
                setSortField(prefs.sortField || null);
                setSortOrder(prefs.sortOrder || 'asc');
                setStatusFilter(prefs.statusFilter || 'Todos');
                setPrintOrientation(prefs.orientation || 'portrait');
                setPrintShowSignatures(prefs.showSignatures !== undefined ? prefs.showSignatures : true);
                return;
            }
        } catch (e) {
            console.error('Error loading report preferences:', e);
        }

        // Defaults
        setVisibleColumns(defaultFields);
        setSortField(null);
        setSortOrder('asc');
        setStatusFilter('Todos');
        setPrintOrientation('portrait');
        setPrintShowSignatures(true);
    }, [selectedModule, modules]);

    const persistPreferences = (updates: Partial<ReportPreferences>) => {
        if (!selectedModule) return;
        const mod = modules.find(m => m.id === selectedModule);
        const current: ReportPreferences = {
            visibleColumns: updates.visibleColumns !== undefined ? updates.visibleColumns : visibleColumns,
            sortField: updates.sortField !== undefined ? updates.sortField : (sortField || undefined),
            sortOrder: updates.sortOrder !== undefined ? updates.sortOrder : sortOrder,
            statusFilter: updates.statusFilter !== undefined ? updates.statusFilter : statusFilter,
            orientation: updates.orientation !== undefined ? updates.orientation : printOrientation,
            showSignatures: updates.showSignatures !== undefined ? updates.showSignatures : printShowSignatures
        };

        try {
            localStorage.setItem(`infracore_report_prefs_${selectedModule}`, JSON.stringify(current));
        } catch (e) {
            console.error('Error saving report preferences:', e);
        }
    };

    // Toggle Column Visibility
    const toggleColumn = (col: string) => {
        const next = visibleColumns.includes(col)
            ? visibleColumns.filter(c => c !== col)
            : [...visibleColumns, col];

        if (next.length === 0) {
            addToast("Pelo menos uma coluna deve permanecer visível.", 'warning');
            return;
        }

        setVisibleColumns(next);
        persistPreferences({ visibleColumns: next });
    };

    // Toggle Sorting Column
    const handleSort = (col: string) => {
        let nextOrder: 'asc' | 'desc' = 'asc';
        if (sortField === col) {
            nextOrder = sortOrder === 'asc' ? 'desc' : 'asc';
        }
        setSortField(col);
        setSortOrder(nextOrder);
        persistPreferences({ sortField: col, sortOrder: nextOrder });
    };

    // Preset Date Ranges
    const setDatePreset = (preset: 'thisMonth' | 'lastQuarter' | 'thisYear') => {
        const d = new Date();
        if (preset === 'thisMonth') {
            setStartDate(new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0]);
            setEndDate(new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0]);
        } else if (preset === 'lastQuarter') {
            const currentQuarter = Math.floor(d.getMonth() / 3);
            const quarterStartMonth = (currentQuarter - 1) * 3;
            setStartDate(new Date(d.getFullYear(), quarterStartMonth, 1).toISOString().split('T')[0]);
            setEndDate(new Date(d.getFullYear(), quarterStartMonth + 3, 0).toISOString().split('T')[0]);
        } else if (preset === 'thisYear') {
            setStartDate(new Date(d.getFullYear(), 0, 1).toISOString().split('T')[0]);
            setEndDate(new Date(d.getFullYear(), 11, 31).toISOString().split('T')[0]);
        }
    };

    // Data Filtering and Calculation Engine
    const reportDataRaw = useMemo(() => {
        let data: any[] = [];
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        const isInRange = (dateStr?: string) => {
            if (!dateStr) return true;
            const parsed = parseDateString(dateStr);
            return parsed >= start && parsed <= end;
        };

        switch (selectedModule) {
            // COMERCIAL
            case 'sales':
                data = sales.filter(s => isInRange(s.date)).map(s => ({
                    ID: s.id?.slice(-6).toUpperCase(),
                    Data: formatDateBR(s.date),
                    Cliente: s.clientName,
                    'Produtos': s.items?.length || 0,
                    'Forma Pagto': s.paymentMethod || 'Boleto',
                    Total: s.amount,
                    Status: s.status
                }));
                break;

            case 'sales_by_product': {
                const productSales: Record<string, { qty: number, revenue: number, cost: number }> = {};
                sales.filter(s => isInRange(s.date)).forEach(s => {
                    s.items?.forEach(item => {
                        if (!productSales[item.name]) productSales[item.name] = { qty: 0, revenue: 0, cost: 0 };
                        productSales[item.name].qty += item.quantity;
                        productSales[item.name].revenue += item.price * item.quantity;
                        productSales[item.name].cost += ((item as any).costPrice || item.price * 0.6) * item.quantity;
                    });
                });
                data = Object.entries(productSales).sort((a, b) => b[1].revenue - a[1].revenue).map(([name, d]) => ({
                    Produto: name,
                    'Qtd Vendida': d.qty,
                    Faturamento: d.revenue,
                    'Margem %': d.revenue > 0 ? ((1 - d.cost / d.revenue) * 100).toFixed(1) + '%' : '0%',
                    'Ticket Médio': d.qty > 0 ? d.revenue / d.qty : 0
                }));
                break;
            }

            case 'sales_by_client': {
                const clientSales: Record<string, { count: number, total: number, lastDate: string }> = {};
                sales.filter(s => isInRange(s.date)).forEach(s => {
                    const name = s.clientName || 'Consumidor Final';
                    if (!clientSales[name]) clientSales[name] = { count: 0, total: 0, lastDate: '' };
                    clientSales[name].count++;
                    clientSales[name].total += s.amount;
                    clientSales[name].lastDate = s.date;
                });
                data = Object.entries(clientSales).sort((a, b) => b[1].total - a[1].total).map(([name, d]) => ({
                    Cliente: name,
                    'Total Compras': d.count,
                    'Valor Total': d.total,
                    'Última Compra': formatDateBR(d.lastDate),
                    'Ticket Médio': d.count > 0 ? d.total / d.count : 0
                }));
                break;
            }

            case 'sales_by_seller': {
                const sellerSales: Record<string, { sales: number, revenue: number }> = {};
                sales.filter(s => isInRange(s.date)).forEach(s => {
                    const seller = (s as any).seller || 'Vendedor Comercial';
                    if (!sellerSales[seller]) sellerSales[seller] = { sales: 0, revenue: 0 };
                    sellerSales[seller].sales++;
                    sellerSales[seller].revenue += s.amount;
                });
                data = Object.entries(sellerSales).map(([name, d]) => ({
                    Vendedor: name,
                    Vendas: d.sales,
                    Faturamento: d.revenue,
                    'Comissão (5%)': d.revenue * 0.05,
                    'Meta %': Math.min(100, Math.round((d.revenue / 50000) * 100)) + '%'
                }));
                break;
            }

            case 'sales_by_payment': {
                const paymentSales: Record<string, { count: number, total: number }> = {};
                const totalSales = sales.filter(s => isInRange(s.date)).reduce((acc, s) => acc + s.amount, 0);
                sales.filter(s => isInRange(s.date)).forEach(s => {
                    const method = s.paymentMethod || 'Não informado';
                    if (!paymentSales[method]) paymentSales[method] = { count: 0, total: 0 };
                    paymentSales[method].count++;
                    paymentSales[method].total += s.amount;
                });
                data = Object.entries(paymentSales).sort((a, b) => b[1].total - a[1].total).map(([name, d]) => ({
                    'Forma Pagto': name,
                    'Qtd Vendas': d.count,
                    'Valor Total': d.total,
                    '% do Total': totalSales > 0 ? ((d.total / totalSales) * 100).toFixed(1) + '%' : '0%',
                    'Ticket Médio': d.count > 0 ? d.total / d.count : 0
                }));
                break;
            }

            case 'quotes':
                data = (budgets || []).filter(b => isInRange(b.date)).map(b => {
                    const numId = (b as any).budgetNumber
                        ? String((b as any).budgetNumber)
                        : (b.id && /^\d+$/.test(b.id) ? b.id : (b.id?.replace(/\D/g, '') || b.id));
                    return {
                        'Nº': numId,
                        Data: formatDateBR(b.date),
                        Cliente: b.clientName,
                        Valor: b.total,
                        Status: b.status,
                        Convertido: b.status === 'Convertido' ? 'Sim' : 'Não'
                    };
                });
                break;

            // FINANCEIRO
            case 'finance':
                data = transactions.filter(t => isInRange(t.date)).map(t => ({
                    ID: t.id?.slice(-6).toUpperCase(),
                    Data: formatDateBR(t.date),
                    Descrição: t.description,
                    Categoria: t.ledgerName || t.category,
                    Tipo: t.type,
                    Valor: t.amount,
                    Status: t.status,
                    Conta: t.account
                }));
                break;

            case 'cashflow': {
                const movementsAfterStart = transactions.filter(t => {
                    if (t.status === 'Cancelado') return false;
                    const tDate = parseDateString(t.date);
                    return tDate >= start;
                });
                const netAfterStart = movementsAfterStart.reduce((acc, t) => acc + (t.type === 'Receita' ? t.amount : -t.amount), 0);
                const balanceAtStart = financials.balance - netAfterStart;

                const sortedTxs = [...transactions]
                    .filter(t => isInRange(t.date) && t.status !== 'Cancelado')
                    .sort((a, b) => parseDateString(a.date).getTime() - parseDateString(b.date).getTime());

                let running = balanceAtStart;
                data = sortedTxs.map(t => {
                    const isReceita = t.type === 'Receita';
                    running += isReceita ? t.amount : -t.amount;
                    return {
                        Data: formatDateBR(t.date),
                        Descrição: t.description,
                        Categoria: t.ledgerName || t.category,
                        Conta: t.account || '-',
                        Entrada: isReceita ? t.amount : 0,
                        Saída: !isReceita ? t.amount : 0,
                        'Saldo Acumulado': running,
                        Status: t.status === 'Conciliado' ? '✓ Conciliado' : '⏳ Pendente'
                    };
                });
                break;
            }

            case 'cashflow_projection': {
                const now = new Date();
                const pendingRec = transactions.filter(t => t.type === 'Receita' && t.status !== 'Conciliado' && t.status !== 'Cancelado');
                const pendingPay = transactions.filter(t => t.type === 'Despesa' && t.status !== 'Conciliado' && t.status !== 'Cancelado');

                const buckets = [
                    { id: 'overdue', label: 'Títulos em Atraso (Vencidos)', minDays: -9999, maxDays: -1 },
                    { id: 'today', label: 'Vencem Hoje', minDays: 0, maxDays: 0 },
                    { id: 'd7', label: 'Próximos 7 dias', minDays: 1, maxDays: 7 },
                    { id: 'd15', label: '8 a 15 dias', minDays: 8, maxDays: 15 },
                    { id: 'd30', label: '16 a 30 dias', minDays: 16, maxDays: 30 },
                    { id: 'd60', label: '31 a 60 dias', minDays: 31, maxDays: 60 },
                    { id: 'd90', label: '61 a 90 dias', minDays: 61, maxDays: 90 },
                    { id: 'd90plus', label: 'Mais de 90 dias', minDays: 91, maxDays: 9999 }
                ];

                let accumulatedProjected = financials.balance;
                data = buckets.map(bucket => {
                    const rec = pendingRec.filter(t => {
                        const days = Math.floor((parseDateString(t.dueDate || t.date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                        return days >= bucket.minDays && days <= bucket.maxDays;
                    }).reduce((sum, t) => sum + t.amount, 0);

                    const pay = pendingPay.filter(t => {
                        const days = Math.floor((parseDateString(t.dueDate || t.date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                        return days >= bucket.minDays && days <= bucket.maxDays;
                    }).reduce((sum, t) => sum + t.amount, 0);

                    const net = rec - pay;
                    accumulatedProjected += net;

                    return {
                        'Faixa de Vencimento': bucket.label,
                        'A Receber (Previsto)': rec,
                        'A Pagar (Previsto)': pay,
                        'Resultado Operacional': net,
                        'Saldo Projetado': accumulatedProjected,
                        Situação: accumulatedProjected < 0 ? '⚠️ Caixa Negativo' : '✓ Liquidez Positiva'
                    };
                });
                break;
            }

            case 'cashflow_daily': {
                const dayMap: Record<string, { initial: number; in: number; out: number; dateStr: string }> = {};
                const sortedTxs = [...transactions]
                    .filter(t => isInRange(t.date) && t.status !== 'Cancelado')
                    .sort((a, b) => parseDateString(a.date).getTime() - parseDateString(b.date).getTime());

                sortedTxs.forEach(t => {
                    const key = t.date;
                    if (!dayMap[key]) dayMap[key] = { initial: 0, in: 0, out: 0, dateStr: key };
                    if (t.type === 'Receita') dayMap[key].in += t.amount;
                    else dayMap[key].out += t.amount;
                });

                let running = financials.balance;
                data = Object.values(dayMap).map(d => {
                    const net = d.in - d.out;
                    const finalBal = running + net;
                    const row = {
                        Data: formatDateBR(d.dateStr),
                        'Saldo Inicial': running,
                        Entradas: d.in,
                        Saídas: d.out,
                        'Saldo do Dia': net,
                        'Saldo Final': finalBal
                    };
                    running = finalBal;
                    return row;
                });
                break;
            }

            case 'receivables':
                data = transactions.filter(t => t.type === 'Receita' && t.status !== 'Conciliado' && t.status !== 'Cancelado').map(t => {
                    const diffDays = Math.floor((parseDateString(t.dueDate || t.date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                    return {
                        'Nº': t.documentNumber || t.id?.slice(-6).toUpperCase(),
                        Cliente: t.partnerName || t.description,
                        Valor: t.amount,
                        Vencimento: formatDateBR(t.dueDate || t.date),
                        'Forma Pagto': t.paymentMethod || 'A Prazo',
                        'Dias em Aberto': diffDays < 0 ? `${Math.abs(diffDays)} dias em atraso` : `${diffDays} dias a vencer`,
                        Status: t.status
                    };
                });
                break;

            case 'receivables_aging': {
                const clientMap: Record<string, { toCome: number, d30: number, d60: number, d90: number, d90plus: number, total: number }> = {};
                transactions.filter(t => t.type === 'Receita' && t.status !== 'Conciliado' && t.status !== 'Cancelado').forEach(t => {
                    const name = t.partnerName || t.description || 'Cliente';
                    if (!clientMap[name]) clientMap[name] = { toCome: 0, d30: 0, d60: 0, d90: 0, d90plus: 0, total: 0 };
                    const diff = Math.floor((new Date().getTime() - parseDateString(t.dueDate || t.date).getTime()) / (1000 * 60 * 60 * 24));
                    if (diff <= 0) clientMap[name].toCome += t.amount;
                    else if (diff <= 30) clientMap[name].d30 += t.amount;
                    else if (diff <= 60) clientMap[name].d60 += t.amount;
                    else if (diff <= 90) clientMap[name].d90 += t.amount;
                    else clientMap[name].d90plus += t.amount;
                    clientMap[name].total += t.amount;
                });
                data = Object.entries(clientMap).map(([client, d]) => ({
                    Cliente: client,
                    'A Vencer': d.toCome,
                    '1-30 dias': d.d30,
                    '31-60 dias': d.d60,
                    '61-90 dias': d.d90,
                    '90+ dias': d.d90plus,
                    'Total a Receber': d.total
                }));
                break;
            }

            case 'payables':
                data = transactions.filter(t => t.type === 'Despesa' && t.status !== 'Conciliado' && t.status !== 'Cancelado').map(t => {
                    const diffDays = Math.floor((parseDateString(t.dueDate || t.date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                    return {
                        'Nº': t.id?.slice(-6).toUpperCase(),
                        Fornecedor: t.partnerName || t.description,
                        Valor: t.amount,
                        Vencimento: formatDateBR(t.dueDate || t.date),
                        'Dias para Vencimento': diffDays < 0 ? `${Math.abs(diffDays)} dias em atraso` : `${diffDays} dias a vencer`,
                        Status: t.status
                    };
                });
                break;

            case 'payables_aging': {
                const supMap: Record<string, { toCome: number, d30: number, d60: number, d90: number, d90plus: number, total: number }> = {};
                transactions.filter(t => t.type === 'Despesa' && t.status !== 'Conciliado' && t.status !== 'Cancelado').forEach(t => {
                    const name = t.partnerName || t.description || 'Fornecedor';
                    if (!supMap[name]) supMap[name] = { toCome: 0, d30: 0, d60: 0, d90: 0, d90plus: 0, total: 0 };
                    const diff = Math.floor((new Date().getTime() - parseDateString(t.dueDate || t.date).getTime()) / (1000 * 60 * 60 * 24));
                    if (diff <= 0) supMap[name].toCome += t.amount;
                    else if (diff <= 30) supMap[name].d30 += t.amount;
                    else if (diff <= 60) supMap[name].d60 += t.amount;
                    else if (diff <= 90) supMap[name].d90 += t.amount;
                    else supMap[name].d90plus += t.amount;
                    supMap[name].total += t.amount;
                });
                data = Object.entries(supMap).map(([sup, d]) => ({
                    Fornecedor: sup,
                    'A Vencer': d.toCome,
                    '1-30 dias': d.d30,
                    '31-60 dias': d.d60,
                    '61-90 dias': d.d90,
                    '90+ dias': d.d90plus,
                    'Total a Pagar': d.total
                }));
                break;
            }

            case 'overdue':
                data = transactions.filter(t => t.type === 'Receita' && (t.status === 'Vencido' || (t.status === 'Pendente' && parseDateString(t.dueDate || t.date) < new Date()))).map(t => {
                    const days = Math.max(0, Math.floor((new Date().getTime() - parseDateString(t.dueDate || t.date).getTime()) / (1000 * 60 * 60 * 24)));
                    return {
                        Cliente: t.partnerName || t.description,
                        Documento: t.documentNumber || t.id?.slice(-6).toUpperCase(),
                        Valor: t.amount,
                        Vencimento: formatDateBR(t.dueDate || t.date),
                        'Dias Atraso': days,
                        Telefone: clients.find(c => c.name === t.partnerName)?.phone || '-'
                    };
                });
                break;

            case 'bank_statements': {
                data = transactions.filter(t => isInRange(t.date)).map(t => ({
                    Data: formatDateBR(t.date),
                    'Conta Bancária': t.account || 'Caixa Geral',
                    Histórico: t.description,
                    Documento: t.documentNumber || t.id?.slice(-6).toUpperCase(),
                    'Entrada (Crédito)': t.type === 'Receita' ? t.amount : 0,
                    'Saída (Débito)': t.type === 'Despesa' ? t.amount : 0,
                    Saldo: t.amount
                }));
                break;
            }

            case 'expense_by_category': {
                const catTotals: Record<string, { total: number; count: number }> = {};
                const expTxs = transactions.filter(t => t.type === 'Despesa' && isInRange(t.date));
                const grandTotal = expTxs.reduce((sum, t) => sum + t.amount, 0);

                expTxs.forEach(t => {
                    const cat = t.ledgerName || t.category || 'Geral';
                    if (!catTotals[cat]) catTotals[cat] = { total: 0, count: 0 };
                    catTotals[cat].total += t.amount;
                    catTotals[cat].count++;
                });

                data = Object.entries(catTotals).sort((a, b) => b[1].total - a[1].total).map(([cat, d]) => ({
                    Categoria: cat,
                    'Valor Total': d.total,
                    '% do Total': grandTotal > 0 ? ((d.total / grandTotal) * 100).toFixed(1) + '%' : '0%',
                    'Qtd Lançamentos': d.count,
                    'Média por Lançamento': d.count > 0 ? d.total / d.count : 0
                }));
                break;
            }

            case 'revenue_by_source': {
                const revTotals: Record<string, { total: number; count: number }> = {};
                const revTxs = transactions.filter(t => t.type === 'Receita' && isInRange(t.date));
                const grandTotal = revTxs.reduce((sum, t) => sum + t.amount, 0);

                revTxs.forEach(t => {
                    const cat = t.ledgerName || t.category || 'Vendas';
                    if (!revTotals[cat]) revTotals[cat] = { total: 0, count: 0 };
                    revTotals[cat].total += t.amount;
                    revTotals[cat].count++;
                });

                data = Object.entries(revTotals).sort((a, b) => b[1].total - a[1].total).map(([cat, d]) => ({
                    'Origem / Categoria': cat,
                    'Valor Total': d.total,
                    '% do Total': grandTotal > 0 ? ((d.total / grandTotal) * 100).toFixed(1) + '%' : '0%',
                    'Qtd Lançamentos': d.count,
                    'Ticket Médio': d.count > 0 ? d.total / d.count : 0
                }));
                break;
            }

            case 'financial_ratios': {
                const totalRev = transactions.filter(t => t.type === 'Receita' && isInRange(t.date)).reduce((sum, t) => sum + t.amount, 0);
                const totalExp = transactions.filter(t => t.type === 'Despesa' && isInRange(t.date)).reduce((sum, t) => sum + t.amount, 0);
                const netMargin = totalRev > 0 ? ((totalRev - totalExp) / totalRev) * 100 : 0;
                const overdueAmount = transactions.filter(t => t.type === 'Receita' && t.status === 'Vencido').reduce((sum, t) => sum + t.amount, 0);
                const defaultRate = financials.receivables > 0 ? (overdueAmount / financials.receivables) * 100 : 0;
                const dailyBurn = totalExp > 0 ? totalExp / 30 : 1;
                const cashCoverageDays = Math.round(financials.balance / dailyBurn);

                data = [
                    { Indicador: 'Margem Operacional Líquida', 'Valor Apurado': `${netMargin.toFixed(1)}%`, 'Meta / Referência': '>= 15%', 'Status Operacional': netMargin >= 15 ? '✓ Saudável' : '⚠️ Atenção', Tendência: 'Alta' },
                    { Indicador: 'Índice de Inadimplência', 'Valor Apurado': `${defaultRate.toFixed(1)}%`, 'Meta / Referência': '< 5%', 'Status Operacional': defaultRate < 5 ? '✓ Baixo Risco' : '⚠️ Crítico', Tendência: 'Estável' },
                    { Indicador: 'Cobertura de Caixa Disponível', 'Valor Apurado': `${cashCoverageDays} dias`, 'Meta / Referência': '>= 60 dias', 'Status Operacional': cashCoverageDays >= 60 ? '✓ Excelente' : '⚠️ Alerta', Tendência: 'Alta' },
                    { Indicador: 'Capital de Giro Líquido Estimado', 'Valor Apurado': formatMoney(financials.balance + financials.receivables - financials.payables), 'Meta / Referência': '> R$ 0,00', 'Status Operacional': (financials.balance + financials.receivables - financials.payables) > 0 ? '✓ Positivo' : '❌ Negativo', Tendência: 'Alta' },
                    { Indicador: 'Índice de Liquidez Corrente', 'Valor Apurado': financials.payables > 0 ? ((financials.balance + financials.receivables) / financials.payables).toFixed(2) + 'x' : 'N/A', 'Meta / Referência': '>= 1.50x', 'Status Operacional': '✓ Conforme', Tendência: 'Alta' }
                ];
                break;
            }

            // CONTÁBIL
            case 'dre': {
                const grossRev = transactions.filter(t => t.type === 'Receita' && isInRange(t.date) && t.status !== 'Cancelado').reduce((acc, t) => acc + t.amount, 0);
                const expTxs = transactions.filter(t => t.type === 'Despesa' && isInRange(t.date) && t.status !== 'Cancelado');
                const totalExpenses = expTxs.reduce((acc, t) => acc + t.amount, 0);

                let cpv = 0;
                let operatingExp = 0;
                expTxs.forEach(t => {
                    const cat = (t.ledgerName || t.category || '').toLowerCase();
                    const code = (t.ledgerCode || '').toLowerCase();
                    const isCost = code.startsWith('3') || cat.includes('custo') || cat.includes('cpv') || cat.includes('insumo') || cat.includes('matéria') || cat.includes('materia') || cat.includes('produção') || cat.includes('combustível') || cat.includes('manutenção') || cat.includes('fornecedor');
                    if (isCost) {
                        cpv += t.amount;
                    } else {
                        operatingExp += t.amount;
                    }
                });

                if (cpv === 0 && totalExpenses > 0) {
                    cpv = totalExpenses * 0.45;
                    operatingExp = totalExpenses * 0.55;
                }

                const taxRate = (settings?.technical?.defaultTaxRate || 6) / 100;
                const deductions = grossRev * taxRate;
                const netRev = grossRev - deductions;
                const grossProfit = netRev - cpv;
                const ebitda = grossProfit - operatingExp;
                const taxesIRPJ = Math.max(0, ebitda * 0.15);
                const netProfit = ebitda - taxesIRPJ;

                data = [
                    { 'Estrutura Contábil': '1. RECEITA OPERACIONAL BRUTA', Valor: grossRev, '% Rec. Bruta': '100.0%', Tipo: 'Receita' },
                    { 'Estrutura Contábil': '   (-) Deduções da Receita e Impostos sobre Vendas', Valor: -deductions, '% Rec. Bruta': `${(taxRate * 100).toFixed(1)}%`, Tipo: 'Dedução' },
                    { 'Estrutura Contábil': '2. RECEITA OPERACIONAL LÍQUIDA', Valor: netRev, '% Rec. Bruta': `${grossRev > 0 ? ((netRev / grossRev) * 100).toFixed(1) : 0}%`, Tipo: 'Subtotal' },
                    { 'Estrutura Contábil': '   (-) Custos dos Produtos/Serviços Vendidos (CPV/CSP)', Valor: -cpv, '% Rec. Bruta': `${grossRev > 0 ? ((cpv / grossRev) * 100).toFixed(1) : 0}%`, Tipo: 'Custo' },
                    { 'Estrutura Contábil': '3. LUCRO BRUTO OPERACIONAL', Valor: grossProfit, '% Rec. Bruta': `${grossRev > 0 ? ((grossProfit / grossRev) * 100).toFixed(1) : 0}%`, Tipo: 'Subtotal' },
                    { 'Estrutura Contábil': '   (-) Despesas Operacionais (Administrativas/Comerciais)', Valor: -operatingExp, '% Rec. Bruta': `${grossRev > 0 ? ((operatingExp / grossRev) * 100).toFixed(1) : 0}%`, Tipo: 'Despesa' },
                    { 'Estrutura Contábil': '4. RESULTADO OPERACIONAL (EBITDA)', Valor: ebitda, '% Rec. Bruta': `${grossRev > 0 ? ((ebitda / grossRev) * 100).toFixed(1) : 0}%`, Tipo: 'Subtotal' },
                    { 'Estrutura Contábil': '   (-) Provisão para IRPJ e Contribuição Social', Valor: -taxesIRPJ, '% Rec. Bruta': `${grossRev > 0 ? ((taxesIRPJ / grossRev) * 100).toFixed(1) : 0}%`, Tipo: 'Tributo' },
                    { 'Estrutura Contábil': '5. LUCRO LÍQUIDO DO EXERCÍCIO', Valor: netProfit, '% Rec. Bruta': `${grossRev > 0 ? ((netProfit / grossRev) * 100).toFixed(1) : 0}%`, Tipo: 'Resultado Final' }
                ];
                break;
            }

            case 'trial_balance': {
                const balances: Record<string, { code: string; debits: number; credits: number }> = {};
                transactions.filter(t => isInRange(t.date)).forEach(t => {
                    const key = t.ledgerName || t.category || 'Geral';
                    const code = t.ledgerCode || '1.01';
                    if (!balances[key]) balances[key] = { code, debits: 0, credits: 0 };
                    if (t.type === 'Despesa') balances[key].debits += t.amount;
                    else balances[key].credits += t.amount;
                });

                data = Object.entries(balances).map(([name, d]) => ({
                    Código: d.code,
                    'Conta Contábil': name,
                    'Saldo Anterior': 0,
                    Débitos: d.debits,
                    Créditos: d.credits,
                    'Saldo Atual': d.credits - d.debits
                }));
                break;
            }

            case 'cost_center': {
                const ccMap: Record<string, { rev: number; exp: number }> = {};
                transactions.filter(t => isInRange(t.date)).forEach(t => {
                    const cc = t.costCenter || 'Administrativo';
                    if (!ccMap[cc]) ccMap[cc] = { rev: 0, exp: 0 };
                    if (t.type === 'Receita') ccMap[cc].rev += t.amount;
                    else ccMap[cc].exp += t.amount;
                });

                data = Object.entries(ccMap).map(([cc, d]) => {
                    const net = d.rev - d.exp;
                    return {
                        'Centro de Custo': cc,
                        Receitas: d.rev,
                        Despesas: d.exp,
                        'Resultado Líquido': net,
                        'Margem %': d.rev > 0 ? ((net / d.rev) * 100).toFixed(1) + '%' : 'N/A'
                    };
                });
                break;
            }

            // ESTOQUE
            case 'inventory':
                data = inventory.map(i => ({
                    ID: i.id?.slice(-6).toUpperCase(),
                    Produto: i.name,
                    Categoria: i.category,
                    Qtd: i.quantity,
                    Unidade: i.unit,
                    'Preço Venda': i.price,
                    'Valor Total': i.price * i.quantity
                }));
                break;

            case 'stock_movements':
                data = stockMovements.filter(m => isInRange(m.date)).map(m => ({
                    Data: formatDateBR(m.date),
                    Hora: new Date(m.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
                    Produto: m.itemName,
                    Tipo: m.type,
                    Qtd: m.quantity,
                    Motivo: m.reason || '-',
                    Usuário: m.userName || 'Sistema'
                }));
                break;

            case 'stock_min':
                data = inventory.filter(i => i.quantity < (i.minStock || 10)).map(i => ({
                    Produto: i.name,
                    'Estoque Atual': i.quantity,
                    Mínimo: i.minStock || 10,
                    Faltando: Math.max(0, (i.minStock || 10) - i.quantity),
                    Fornecedor: suppliers.find(s => s.id === i.supplierId)?.name || i.supplierId || 'Almoxarifado Geral',
                    'Último Pedido': '-'
                }));
                break;

            case 'stock_value':
                data = inventory.map(i => {
                    const cost = i.costPrice || i.price * 0.6;
                    return {
                        Produto: i.name,
                        Qtd: i.quantity,
                        'Custo Unit.': cost,
                        'Custo Total': cost * i.quantity,
                        'Preço Venda': i.price,
                        'Margem %': ((1 - cost / i.price) * 100).toFixed(1) + '%'
                    };
                });
                break;

            // PRODUÇÃO INDUSTRIAL
            case 'production_orders':
                data = (productionOrders || []).filter(p => isInRange(p.startDate || p.dueDate)).map(p => ({
                    Ordem: p.orderNumber || p.id?.slice(-6).toUpperCase(),
                    Produto: p.productName,
                    'Qtd Planejada': p.quantity,
                    'Início': formatDateBR(p.startDate),
                    'Previsão': formatDateBR(p.dueDate),
                    Status: p.status,
                    Progresso: `${p.progress || 0}%`,
                    Operador: p.operator || 'Geral'
                }));
                break;

            case 'production_units':
                data = (productionUnits || []).map(u => ({
                    'Usina / Planta': u.name,
                    Tipo: u.type,
                    'Capacidade Nominal': u.capacity,
                    'Carga Atual %': `${u.currentLoad || 0}%`,
                    'Temperatura (°C)': `${u.temp || 0}°C`,
                    'Potência': u.power || '-',
                    Status: u.status
                }));
                break;

            // CLIENTES & COMPRAS
            case 'clients':
                data = clients.map(c => ({
                    Nome: c.name,
                    Documento: c.document,
                    Email: c.email,
                    Telefone: c.phone,
                    Cidade: c.address?.city || '-',
                    Status: c.status
                }));
                break;

            case 'clients_ranking': {
                const clientTotals = clients.map(c => ({
                    ...c,
                    total: sales.filter(s => s.clientId === c.id && isInRange(s.date)).reduce((acc, s) => acc + s.amount, 0),
                    count: sales.filter(s => s.clientId === c.id && isInRange(s.date)).length
                })).sort((a, b) => b.total - a.total);

                data = clientTotals.slice(0, 20).map((c, i) => ({
                    Posição: i + 1,
                    Cliente: c.name,
                    'Total Compras': c.count,
                    Faturamento: c.total,
                    'Ticket Médio': c.count > 0 ? c.total / c.count : 0
                }));
                break;
            }

            case 'purchases':
                data = purchaseOrders.filter(p => isInRange(p.date)).map(p => ({
                    'Nº': p.id?.slice(-6).toUpperCase(),
                    Data: formatDateBR(p.date),
                    Fornecedor: p.supplierName,
                    Valor: p.items?.reduce((acc: number, i: any) => acc + (i.price * i.quantity), 0) || p.total || 0,
                    Status: p.status,
                    'Prazo Entrega': (p as any).deliveryDate ? formatDateBR((p as any).deliveryDate) : '-'
                }));
                break;

            case 'purchases_by_supplier': {
                const supplierPurchases: Record<string, { count: number, total: number, lastDate: string }> = {};
                purchaseOrders.filter(p => isInRange(p.date)).forEach(p => {
                    const name = p.supplierName || 'Fornecedor';
                    if (!supplierPurchases[name]) supplierPurchases[name] = { count: 0, total: 0, lastDate: '' };
                    supplierPurchases[name].count++;
                    supplierPurchases[name].total += p.items?.reduce((acc: number, i: any) => acc + (i.price * i.quantity), 0) || p.total || 0;
                    supplierPurchases[name].lastDate = p.date;
                });
                data = Object.entries(supplierPurchases).map(([name, d]) => ({
                    Fornecedor: name,
                    'Total Pedidos': d.count,
                    'Valor Total': d.total,
                    'Prazo Médio': '7 dias',
                    'Última Compra': formatDateBR(d.lastDate)
                }));
                break;
            }

            // FROTA & RH
            case 'fleet':
                data = fleet.map(f => ({
                    Placa: f.plate,
                    Modelo: f.model || f.name,
                    Tipo: f.type,
                    'KM Atual': f.km,
                    Status: f.status,
                    Combustível: f.fuelType || 'Diesel'
                }));
                break;

            case 'fleet_costs':
                data = fleet.map(f => {
                    const fuelCost = (f.fuelLogs || (f as any).fuelHistory || []).reduce((acc: number, fuel: any) => acc + (fuel.cost || 0), 0);
                    const maintCost = (f.maintenanceHistory || []).reduce((acc: number, m: any) => acc + (m.cost || 0), 0);
                    return {
                        Placa: f.plate,
                        Modelo: f.model || f.name,
                        Combustível: fuelCost,
                        Manutenção: maintCost,
                        Total: fuelCost + maintCost,
                        'Custo/KM': f.km > 0 ? ((fuelCost + maintCost) / f.km).toFixed(2) : '-'
                    };
                });
                break;

            case 'tires_management':
                data = (tires || []).map(t => {
                    const vehicle = fleet.find(f => f.id === t.currentVehicleId);
                    return {
                        'Fogo / Série': t.serialNumber,
                        'Marca / Modelo': `${t.brand} ${t.model}`,
                        'Veículo Instalado': vehicle ? `${vehicle.plate} (${vehicle.name || vehicle.model})` : 'Almoxarifado / Estoque',
                        Posição: t.position || 'Sobressalente',
                        'KM Rodado': t.currentKm ? `${t.currentKm.toLocaleString('pt-BR')} km` : '0 km',
                        'Recapagens': t.recapCount || 0,
                        Status: t.status
                    };
                });
                break;

            case 'hr':
                data = employees.map(e => ({
                    Nome: e.name,
                    Cargo: e.role,
                    Depto: e.department,
                    Salário: e.salary,
                    Admissão: formatDateBR(e.admissionDate),
                    Status: e.status
                }));
                break;

            case 'hr_payroll':
                data = employees.filter(e => e.status === 'Ativo').map(e => {
                    const empPayroll = (payroll || []).find((p: any) => p.employeeId === e.id);
                    const base = empPayroll?.baseSalary || e.salary;
                    const add = empPayroll?.additions || empPayroll?.overtime || (base * 0.08);
                    const discounts = empPayroll?.discounts || (base * 0.11);
                    const net = empPayroll?.totalNet || (base + add - discounts);

                    return {
                        Funcionário: e.name,
                        'Salário Base': base,
                        'Adicionais / Benefícios': add,
                        'Descontos (INSS/IRRF)': discounts,
                        Líquido: net
                    };
                });
                break;

            case 'audit_trail':
                data = (auditLogs || []).map(l => ({
                    'Data/Hora': l.timestamp,
                    'Usuário': l.userName,
                    'Ação': l.action,
                    'Módulo': l.module,
                    'Severidade': l.severity?.toUpperCase() || 'INFO',
                    'Detalhes': l.details,
                    'IP': l.ip || '127.0.0.1'
                }));
                break;

            case 'dashboard_summary':
                data = [
                    { Indicador: 'Faturamento Bruto', 'Valor Apurado': formatMoney(financials.totalRevenue), 'Meta Corporativa': 'R$ 100.000,00', Variação: '+12.5%', Status: '✓ Atingido' },
                    { Indicador: 'Saldo Disponível de Caixa', 'Valor Apurado': formatMoney(financials.balance), 'Meta Corporativa': 'R$ 30.000,00', Variação: '+8.0%', Status: '✓ Atingido' },
                    { Indicador: 'Contas a Receber', 'Valor Apurado': formatMoney(financials.receivables), 'Meta Corporativa': 'Fluxo Saudável', Variação: '+4.5%', Status: '✓ Conforme' },
                    { Indicador: 'Contas a Pagar', 'Valor Apurado': formatMoney(financials.payables), 'Meta Corporativa': 'Controlado', Variação: '-2.0%', Status: '✓ Conforme' },
                    { Indicador: 'Clientes Ativos', 'Valor Apurado': clients.filter(c => c.status === 'Ativo').length, 'Meta Corporativa': '100 Clientes', Variação: '+5.0%', Status: '✓ Atingido' },
                    { Indicador: 'Produtos em Estoque', 'Valor Apurado': inventory.length, 'Meta Corporativa': 'Amplo Catálogo', Variação: '+15.0%', Status: '✓ Atingido' }
                ];
                break;

            default:
                data = [{ Mensagem: 'Selecione um relatório para visualizar os dados.' }];
        }
        return data;
    }, [selectedModule, startDate, endDate, sales, transactions, inventory, clients, fleet, employees, stockMovements, purchaseOrders, financials, settings, accounts, productionOrders, productionUnits, tires, auditLogs, suppliers, payroll]);

    // Unique Status list for contextual filtering
    const availableStatuses = useMemo(() => {
        if (!reportDataRaw || reportDataRaw.length === 0) return [];
        const statusSet = new Set<string>();
        reportDataRaw.forEach(row => {
            const st = row['Status'] || row['Situação'];
            if (st && typeof st === 'string') statusSet.add(st);
        });
        return Array.from(statusSet);
    }, [reportDataRaw]);

    // Filtered, Sorted and Column-Filtered Data according to user preferences
    const reportData = useMemo(() => {
        if (!reportDataRaw || reportDataRaw.length === 0) return [];
        if (reportDataRaw[0]?.Mensagem) return reportDataRaw;

        let filtered = [...reportDataRaw];

        // 1. Contextual Status Filter
        if (statusFilter && statusFilter !== 'Todos') {
            filtered = filtered.filter(row => {
                const st = row['Status'] || row['Situação'];
                return st === statusFilter;
            });
        }

        // 2. Dynamic Sorting
        if (sortField) {
            filtered.sort((a, b) => {
                let valA = a[sortField];
                let valB = b[sortField];

                if (valA === undefined || valA === null) return 1;
                if (valB === undefined || valB === null) return -1;

                if (typeof valA === 'number' && typeof valB === 'number') {
                    return sortOrder === 'asc' ? valA - valB : valB - valA;
                }

                const strA = String(valA).toLowerCase();
                const strB = String(valB).toLowerCase();
                return sortOrder === 'asc' ? strA.localeCompare(strB) : strB.localeCompare(strA);
            });
        }

        // 3. Dynamic Column Selection
        if (visibleColumns && visibleColumns.length > 0) {
            filtered = filtered.map(row => {
                const pruned: Record<string, any> = {};
                visibleColumns.forEach(col => {
                    if (row[col] !== undefined) {
                        pruned[col] = row[col];
                    }
                });
                return pruned;
            });
        }

        return filtered;
    }, [reportDataRaw, statusFilter, sortField, sortOrder, visibleColumns]);

    // Badges and cell formatting
    const renderCellContent = (colKey: string, val: any) => {
        if (val === undefined || val === null || val === '') return <span className="text-slate-300">-</span>;

        const isStatusCol = colKey === 'Status' || colKey === 'Situação' || colKey === 'Convertido';
        if (isStatusCol && typeof val === 'string') {
            const clean = val.toLowerCase();
            let badgeStyle = 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200 border-slate-200';
            if (clean.includes('pago') || clean.includes('conciliado') || clean.includes('ativo') || clean.includes('conforme') || clean.includes('operando') || clean.includes('aprovado') || clean.includes('sim') || clean.includes('positiva') || clean.includes('atingido') || clean.includes('saudável') || clean.includes('baixo risco') || clean.includes('excelente')) {
                badgeStyle = 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200';
            } else if (clean.includes('pendente') || clean.includes('aberto') || clean.includes('atenção') || clean.includes('alerta') || clean.includes('produção') || clean.includes('aguardando')) {
                badgeStyle = 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200';
            } else if (clean.includes('vencido') || clean.includes('cancelado') || clean.includes('crítico') || clean.includes('parado') || clean.includes('reprovado') || clean.includes('não') || clean.includes('negativo')) {
                badgeStyle = 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border-rose-200';
            }

            return (
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${badgeStyle}`}>
                    {val}
                </span>
            );
        }

        const isMoney = typeof val === 'number' && (colKey.includes('Valor') || colKey.includes('Total') || colKey.includes('Preço') || colKey.includes('Salário') || colKey.includes('Faturamento') || colKey.includes('Entrada') || colKey.includes('Saída') || colKey.includes('Saldo') || colKey.includes('Receita') || colKey.includes('Despesa') || colKey.includes('Líquido') || colKey.includes('Comissão'));
        if (isMoney) {
            return (
                <span className={`font-mono font-semibold ${val < 0 ? 'text-rose-600' : 'text-slate-800 dark:text-slate-200'}`}>
                    {formatMoney(val)}
                </span>
            );
        }

        if (typeof val === 'number') {
            return <span className="font-mono">{val.toLocaleString('pt-BR')}</span>;
        }

        return <span className="truncate">{val}</span>;
    };

    // =========================================================================
    // EXPORTAÇÃO E IMPRESSÃO DE RELATÓRIOS GERENCIAIS COM PERSONALIZAÇÃO
    // =========================================================================

    const handlePrintReport = () => {
        const moduleInfo = modules.find(m => m.id === selectedModule);
        const reportTitle = moduleInfo?.name || 'Relatório Gerencial';
        const categoryName = moduleInfo?.category || 'Geral';

        if (!reportData || reportData.length === 0) {
            addToast("Sem dados para impressão no período selecionado.", 'warning');
            return;
        }

        const headers = Object.keys(reportData[0]);

        const numericTotals: Record<string, number> = {};
        let grandMonetaryTotal = 0;

        headers.forEach(h => {
            let isNumericCol = true;
            let sum = 0;
            reportData.forEach(row => {
                const val = row[h];
                if (typeof val === 'number') {
                    sum += val;
                } else {
                    isNumericCol = false;
                }
            });
            if (isNumericCol) {
                numericTotals[h] = sum;
                if (h.includes('Valor') || h.includes('Total') || h.includes('Faturamento') || h.includes('Receita') || h.includes('Saldo') || h.includes('Entrada')) {
                    grandMonetaryTotal += sum;
                }
            }
        });

        const protocolNumber = `REL-${Date.now().toString().slice(-8)}`;
        const issueDate = new Date().toLocaleDateString('pt-BR');
        const issueTime = new Date().toLocaleTimeString('pt-BR');

        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8" />
                <title>${reportTitle} - ${company.companyName}</title>
                <style>
                    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap');
                    body {
                        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                        padding: ${printOrientation === 'landscape' ? '20px' : '30px'};
                        color: #0f172a;
                        background: #ffffff;
                        line-height: 1.4;
                        font-size: 10px;
                    }
                    @page {
                        size: A4 ${printOrientation};
                        margin: 12mm;
                    }
                    .corporate-header {
                        border-bottom: 3px solid #0891b2;
                        padding-bottom: 12px;
                        margin-bottom: 16px;
                        display: flex;
                        justify-content: space-between;
                        align-items: flex-start;
                    }
                    .company-info h1 {
                        font-size: 18px;
                        font-weight: 900;
                        color: #0f172a;
                        margin: 0 0 2px 0;
                        text-transform: uppercase;
                        letter-spacing: -0.5px;
                    }
                    .company-info p {
                        margin: 1px 0;
                        font-size: 9px;
                        color: #475569;
                    }
                    .report-meta {
                        text-align: right;
                    }
                    .report-badge {
                        display: inline-block;
                        padding: 3px 8px;
                        background: #ecfeff;
                        color: #0891b2;
                        border: 1px solid #cffafe;
                        font-size: 9px;
                        font-weight: 800;
                        border-radius: 6px;
                        text-transform: uppercase;
                    }
                    .report-title {
                        font-size: 15px;
                        font-weight: 900;
                        color: #0f172a;
                        margin: 4px 0 2px 0;
                        text-transform: uppercase;
                    }
                    .kpi-grid {
                        display: grid;
                        grid-template-columns: repeat(4, 1fr);
                        gap: 10px;
                        margin-bottom: 16px;
                    }
                    .kpi-card {
                        background: #f8fafc;
                        border: 1px solid #e2e8f0;
                        border-radius: 8px;
                        padding: 8px 12px;
                    }
                    .kpi-card span {
                        font-size: 8px;
                        font-weight: 700;
                        color: #64748b;
                        text-transform: uppercase;
                        display: block;
                        margin-bottom: 2px;
                    }
                    .kpi-card strong {
                        font-size: 13px;
                        font-weight: 900;
                        color: #0f172a;
                        font-family: monospace;
                    }
                    table.data-table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-bottom: 24px;
                        font-size: 9px;
                    }
                    table.data-table thead th {
                        background: #0f172a;
                        color: #ffffff;
                        font-weight: 800;
                        text-transform: uppercase;
                        font-size: 8.5px;
                        letter-spacing: 0.5px;
                        padding: 6px 8px;
                        border: 1px solid #0f172a;
                        text-align: left;
                    }
                    table.data-table tbody td {
                        padding: 5px 8px;
                        border: 1px solid #f1f5f9;
                        color: #1e293b;
                    }
                    table.data-table tbody tr:nth-child(even) {
                        background-color: #f8fafc;
                    }
                    table.data-table tfoot td {
                        background: #f1f5f9;
                        border-top: 2px solid #0f172a;
                        font-weight: 900;
                        padding: 6px 8px;
                        color: #0f172a;
                        font-family: monospace;
                    }
                    .numeric {
                        text-align: right;
                        font-family: monospace;
                        font-weight: 600;
                    }
                    .signatures-block {
                        margin-top: 30px;
                        display: grid;
                        grid-template-columns: repeat(3, 1fr);
                        gap: 25px;
                        padding-top: 15px;
                        border-top: 1px dashed #cbd5e1;
                    }
                    .signature-item {
                        text-align: center;
                    }
                    .signature-line {
                        border-bottom: 1px solid #475569;
                        margin-bottom: 4px;
                        height: 28px;
                    }
                    .signature-item p {
                        margin: 0;
                        font-size: 9px;
                        font-weight: 700;
                        color: #0f172a;
                    }
                    .signature-item span {
                        font-size: 8px;
                        color: #64748b;
                    }
                    .compliance-footer {
                        margin-top: 25px;
                        padding-top: 12px;
                        border-top: 1px solid #e2e8f0;
                        display: flex;
                        justify-content: space-between;
                        font-size: 8px;
                        color: #94a3b8;
                    }
                </style>
            </head>
            <body>
                <div class="corporate-header">
                    <div class="company-info">
                        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 3px;">
                            <div style="width: 24px; height: 24px; background: #0891b2; border-radius: 5px; display: flex; align-items: center; justify-content: center; color: white; font-weight: 900; font-size: 12px;">IC</div>
                            <h1>${company.companyName}</h1>
                        </div>
                        <p><strong>CNPJ:</strong> ${company.document} | <strong>IE:</strong> ${company.stateRegistry}</p>
                        <p>${company.address} • ${company.phone}</p>
                    </div>
                    <div class="report-meta">
                        <span class="report-badge">${categoryName}</span>
                        <div class="report-title">${reportTitle}</div>
                        <p style="margin: 2px 0; font-family: monospace; font-weight: bold; color: #0891b2;">Protocolo: ${protocolNumber}</p>
                        <p style="margin: 2px 0; color: #475569;">Período: <strong>${formatDateBR(startDate)} até ${formatDateBR(endDate)}</strong></p>
                        <p style="margin: 2px 0; color: #64748b; font-size: 8px;">Emissão: ${issueDate} às ${issueTime}</p>
                    </div>
                </div>

                <div class="kpi-grid">
                    <div class="kpi-card">
                        <span>Total de Registros</span>
                        <strong>${reportData.length} itens</strong>
                    </div>
                    <div class="kpi-card">
                        <span>Volume Consolidado</span>
                        <strong>${grandMonetaryTotal > 0 ? formatMoney(grandMonetaryTotal) : '-'}</strong>
                    </div>
                    <div class="kpi-card">
                        <span>Emissor Responsável</span>
                        <strong style="font-size: 10px;">${currentUser?.name || 'Administrador'}</strong>
                    </div>
                    <div class="kpi-card">
                        <span>Homologação</span>
                        <strong style="color: #16a34a; font-size: 10px;">✓ AUDITADO</strong>
                    </div>
                </div>

                <table class="data-table">
                    <thead>
                        <tr>
                            ${headers.map(h => `<th>${h}</th>`).join('')}
                        </tr>
                    </thead>
                    <tbody>
                        ${reportData.map(row => `
                            <tr>
                                ${headers.map(h => {
            let val = row[h];
            const isMoney = typeof val === 'number' && (h.includes('Valor') || h.includes('Total') || h.includes('Preço') || h.includes('Salário') || h.includes('Faturamento') || h.includes('Entrada') || h.includes('Saída') || h.includes('Saldo') || h.includes('Receita') || h.includes('Despesa'));
            if (isMoney) val = formatMoney(val);
            const isNum = typeof row[h] === 'number';
            return `<td class="${isNum ? 'numeric' : ''}">${val !== undefined && val !== null ? val : '-'}</td>`;
        }).join('')}
                            </tr>
                        `).join('')}
                    </tbody>
                    <tfoot>
                        <tr>
                            ${headers.map((h, i) => {
            if (i === 0) return `<td>TOTAIS (${reportData.length})</td>`;
            if (numericTotals[h] !== undefined) {
                const isMoney = h.includes('Valor') || h.includes('Total') || h.includes('Faturamento') || h.includes('Receita') || h.includes('Saldo') || h.includes('Entrada') || h.includes('Saída');
                return `<td class="numeric">${isMoney ? formatMoney(numericTotals[h]) : numericTotals[h].toLocaleString('pt-BR')}</td>`;
            }
            return `<td></td>`;
        }).join('')}
                        </tr>
                    </tfoot>
                </table>

                ${printShowSignatures ? `
                    <div class="signatures-block">
                        <div class="signature-item">
                            <div class="signature-line"></div>
                            <p>${currentUser?.name || 'Responsável Técnico'}</p>
                            <span>Elaborado por (Emissor)</span>
                        </div>
                        <div class="signature-item">
                            <div class="signature-line"></div>
                            <p>Controladoria & Auditoria Interna</p>
                            <span>Conferido e Homologado</span>
                        </div>
                        <div class="signature-item">
                            <div class="signature-line"></div>
                            <p>Diretoria Executiva</p>
                            <span>Aprovado</span>
                        </div>
                    </div>
                ` : ''}

                <div class="compliance-footer">
                    <span>AVISO DE CONFIDENCIALIDADE: Documento de uso corporativo da ${company.companyName}. Lei 13.709/2018 (LGPD).</span>
                    <span>Autenticação InfraCore ERP® • Hash: ${protocolNumber}</span>
                </div>
            </body>
            </html>
        `;

        printDocument(reportTitle, html, { orientation: printOrientation });
    };

    // Corporate CSV / Excel Export with Prepending Header and Custom Visible Columns
    const handleExportCorporateCSV = () => {
        const moduleInfo = modules.find(m => m.id === selectedModule);
        const reportTitle = moduleInfo?.name || 'Relatorio_Gerencial';
        const categoryName = moduleInfo?.category || 'Geral';

        if (!reportData || reportData.length === 0) {
            addToast("Sem dados para exportação no período selecionado.", 'warning');
            return;
        }

        const headers = Object.keys(reportData[0]);

        let totalVal = 0;
        reportData.forEach(row => {
            headers.forEach(h => {
                if (typeof row[h] === 'number' && (h.includes('Valor') || h.includes('Total') || h.includes('Faturamento') || h.includes('Receita'))) {
                    totalVal += row[h];
                }
            });
        });

        const corporateMetadataHeader = [
            `# =========================================================================`,
            `# INFRACORE ERP - RELATÓRIO GERENCIAL OFICIAL`,
            `# Razão Social: ${company.companyName} | CNPJ: ${company.document}`,
            `# Inscrição Estadual: ${company.stateRegistry} | Endereço: ${company.address}`,
            `# Relatório: ${reportTitle} | Categoria: ${categoryName}`,
            `# Período de Apuração: ${formatDateBR(startDate)} até ${formatDateBR(endDate)}`,
            `# Emissão: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')} | Emitido por: ${currentUser?.name || 'Administrador'}`,
            `# Total de Registros: ${reportData.length} | Volume Consolidado: ${totalVal > 0 ? formatMoney(totalVal) : 'N/A'}`,
            `# =========================================================================`,
            ``
        ].join('\n');

        const csvRows = [
            headers.join(';'),
            ...reportData.map(row =>
                headers.map(h => {
                    let val = row[h] ?? '';
                    if (typeof val === 'number') {
                        val = val.toFixed(2).replace('.', ',');
                    }
                    if (typeof val === 'string' && (val.includes(';') || val.includes('\n') || val.includes('"'))) {
                        val = `"${val.replace(/"/g, '""')}"`;
                    }
                    return val;
                }).join(';')
            )
        ].join('\n');

        const blob = new Blob(['\uFEFF' + corporateMetadataHeader + csvRows], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `relatorio_${selectedModule || 'gerencial'}_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        addToast(`Relatório exportado em formato CSV corporativo com sucesso!`, 'success');
    };

    // Print Chart of Accounts with Corporate Header
    const handlePrintPoaReport = () => {
        const poaTitle = 'PLANO DE CONTAS ESTRUTURADO';
        const poaProtocol = `POA-${Date.now().toString().slice(-8)}`;

        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        const getGroupTotal = (node: any): number => {
            const selfTotal = transactions
                .filter(t => (t.ledgerCode === node.code || t.category === node.name || t.ledgerName === node.name) && t.status !== 'Cancelado')
                .filter(t => {
                    const txDate = parseDateString(t.date);
                    return txDate >= start && txDate <= end;
                })
                .reduce((acc, t) => acc + t.amount, 0);

            const childrenTotal = (node.children || []).reduce((acc: number, c: any) => acc + getGroupTotal(c), 0);
            return selfTotal + childrenTotal;
        };

        let poaRowsHtml = '';
        planOfAccounts.forEach(group => {
            const groupTotal = getGroupTotal(group);
            const isRev = group.type === 'Receita';
            const color = isRev ? '#16a34a' : '#dc2626';

            poaRowsHtml += `
                <tr style="background-color: #f1f5f9; font-weight: 800; border-top: 2px solid #cbd5e1;">
                    <td style="padding: 8px 10px; font-family: monospace; color: ${color}; width: 120px;">${group.code}</td>
                    <td style="padding: 8px 10px; text-transform: uppercase;"><strong>${group.name}</strong> <span style="font-size: 9px; color: #64748b; font-weight: normal;">(Sintética)</span></td>
                    <td style="padding: 8px 10px; text-align: right; font-family: monospace; color: ${color}; width: 150px;">${formatMoney(groupTotal)}</td>
                </tr>
            `;

            (group.children || []).forEach((child: any) => {
                const childTotal = transactions
                    .filter(t => (t.ledgerCode === child.code || t.category === child.name || t.ledgerName === child.name) && t.status !== 'Cancelado')
                    .filter(t => {
                        const txDate = parseDateString(t.date);
                        return txDate >= start && txDate <= end;
                    })
                    .reduce((acc, t) => acc + t.amount, 0);

                poaRowsHtml += `
                    <tr style="border-bottom: 1px solid #f1f5f9;">
                        <td style="padding: 6px 10px 6px 28px; font-family: monospace; color: #64748b;">${child.code}</td>
                        <td style="padding: 6px 10px; color: #334155;">${child.name} <span style="font-size: 8px; color: #94a3b8;">(Analítica)</span></td>
                        <td style="padding: 6px 10px; text-align: right; font-family: monospace; font-weight: 600;">${formatMoney(childTotal)}</td>
                    </tr>
                `;
            });
        });

        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8" />
                <title>Plano de Contas - ${company.companyName}</title>
                <style>
                    body {
                        font-family: 'Segoe UI', Inter, sans-serif;
                        padding: 30px;
                        color: #0f172a;
                        line-height: 1.4;
                        font-size: 11px;
                    }
                    .corporate-header {
                        border-bottom: 3px solid #0891b2;
                        padding-bottom: 15px;
                        margin-bottom: 25px;
                        display: flex;
                        justify-content: space-between;
                        align-items: flex-start;
                    }
                    .company-info h1 {
                        font-size: 20px;
                        font-weight: 900;
                        margin: 0 0 3px 0;
                        text-transform: uppercase;
                    }
                    .company-info p {
                        margin: 1.5px 0;
                        font-size: 10px;
                        color: #475569;
                    }
                    table.poa-table {
                        width: 100%;
                        border-collapse: collapse;
                        font-size: 10px;
                        margin-bottom: 30px;
                    }
                    table.poa-table thead th {
                        background: #0f172a;
                        color: #ffffff;
                        font-weight: 800;
                        text-transform: uppercase;
                        font-size: 9px;
                        padding: 8px 10px;
                        text-align: left;
                    }
                    .signatures-block {
                        margin-top: 40px;
                        display: grid;
                        grid-template-columns: repeat(2, 1fr);
                        gap: 40px;
                        padding-top: 20px;
                        border-top: 1px dashed #cbd5e1;
                    }
                    .signature-item { text-align: center; }
                    .signature-line { border-bottom: 1px solid #475569; margin-bottom: 6px; height: 35px; }
                    .signature-item p { margin: 0; font-size: 10px; font-weight: 700; }
                    .signature-item span { font-size: 9px; color: #64748b; }
                </style>
            </head>
            <body>
                <div class="corporate-header">
                    <div class="company-info">
                        <h1>${company.companyName}</h1>
                        <p><strong>CNPJ:</strong> ${company.document} | <strong>IE:</strong> ${company.stateRegistry}</p>
                        <p>${company.address} • ${company.phone}</p>
                    </div>
                    <div style="text-align: right;">
                        <span style="padding: 4px 10px; background: #ecfeff; color: #0891b2; font-weight: 800; border-radius: 6px; text-transform: uppercase;">
                            ESTRUTURA CONTÁBIL OFICIAL
                        </span>
                        <h2 style="font-size: 16px; margin: 6px 0 2px 0;">${poaTitle}</h2>
                        <p style="margin: 2px 0; font-family: monospace; color: #0891b2; font-weight: bold;">Protocolo: ${poaProtocol}</p>
                        <p style="margin: 2px 0; font-size: 10px; color: #64748b;">Período: ${formatDateBR(startDate)} até ${formatDateBR(endDate)}</p>
                    </div>
                </div>

                <table class="poa-table">
                    <thead>
                        <tr>
                            <th style="width: 120px;">Código</th>
                            <th>Conta Contábil / Descrição</th>
                            <th style="text-align: right; width: 150px;">Saldo do Período</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${poaRowsHtml}
                    </tbody>
                </table>

                <div class="signatures-block">
                    <div class="signature-item">
                        <div class="signature-line"></div>
                        <p>${currentUser?.name || 'Responsável Técnico'}</p>
                        <span>Elaborado por (Emissor)</span>
                    </div>
                    <div class="signature-item">
                        <div class="signature-line"></div>
                        <p>Diretoria de Controladoria & Contabilidade</p>
                        <span>Aprovado e Homologado</span>
                    </div>
                </div>
            </body>
            </html>
        `;

        printDocument(poaTitle, html);
    };

    // Export Official Consolidated Dashboard to CSV
    const handleExportDashboard = () => {
        exportDashboardToExcel({
            financials,
            transactions,
            sales,
            employees,
            inventory,
            fleet,
            settings,
            clients
        });
        addToast("Relatório Executivo Consolidado exportado com sucesso!", 'success');
    };

    // =========================================================================
    // DINÂMICA DE BI: CÁLCULOS DINÂMICOS DO DASHBOARD CONECTADOS AO PERÍODO
    // =========================================================================

    const periodDays = reportPeriod === '7d' ? 7 : reportPeriod === '30d' ? 30 : 365;
    const now = new Date();
    const periodCutoff = useMemo(() => new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000), [periodDays]);
    const prevPeriodCutoff = useMemo(() => new Date(now.getTime() - periodDays * 2 * 24 * 60 * 60 * 1000), [periodDays]);

    const periodTransactions = useMemo(() => {
        return transactions.filter(t => {
            const d = parseDateString(t.date);
            return d >= periodCutoff && d <= now && t.status !== 'Cancelado';
        });
    }, [transactions, periodCutoff]);

    const prevPeriodTransactions = useMemo(() => {
        return transactions.filter(t => {
            const d = parseDateString(t.date);
            return d >= prevPeriodCutoff && d < periodCutoff && t.status !== 'Cancelado';
        });
    }, [transactions, prevPeriodCutoff, periodCutoff]);

    const periodRevenue = useMemo(() => {
        return periodTransactions.filter(t => t.type === 'Receita').reduce((sum, t) => sum + t.amount, 0);
    }, [periodTransactions]);

    const periodExpenses = useMemo(() => {
        return periodTransactions.filter(t => t.type === 'Despesa').reduce((sum, t) => sum + t.amount, 0);
    }, [periodTransactions]);

    const prevPeriodRevenue = useMemo(() => {
        return prevPeriodTransactions.filter(t => t.type === 'Receita').reduce((sum, t) => sum + t.amount, 0);
    }, [prevPeriodTransactions]);

    const revenueTrend = useMemo(() => {
        if (prevPeriodRevenue === 0) return periodRevenue > 0 ? '+100%' : '0%';
        const diff = ((periodRevenue - prevPeriodRevenue) / prevPeriodRevenue) * 100;
        return (diff >= 0 ? '+' : '') + diff.toFixed(1) + '%';
    }, [periodRevenue, prevPeriodRevenue]);

    const periodSales = useMemo(() => {
        return sales.filter(s => {
            const d = parseDateString(s.date);
            return d >= periodCutoff && d <= now;
        });
    }, [sales, periodCutoff]);

    const avgTicket = useMemo(() => {
        const totalSalesVal = periodSales.reduce((acc, s) => acc + s.amount, 0);
        return periodSales.length > 0 ? totalSalesVal / periodSales.length : 0;
    }, [periodSales]);

    const calculatedOEE = useMemo(() => {
        if (productionUnits.length > 0) {
            const avgLoad = productionUnits.reduce((acc, u) => acc + (u.currentLoad || 0), 0) / productionUnits.length;
            return Math.max(10, Math.min(100, avgLoad));
        }
        if (productionOrders.length > 0) {
            const finished = productionOrders.filter(p => p.status === 'Finalizado').length;
            return Math.round((finished / productionOrders.length) * 100);
        }
        return 94.2;
    }, [productionUnits, productionOrders]);

    // Daily Timeline for AreaChart
    const financialHistory = useMemo(() => {
        const dayMap: Record<string, { name: string; receita: number; despesa: number; time: number }> = {};

        periodTransactions.forEach(tx => {
            const dateObj = parseDateString(tx.date);
            const dayKey = `${String(dateObj.getDate()).padStart(2, '0')}/${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
            if (!dayMap[dayKey]) {
                dayMap[dayKey] = { name: dayKey, receita: 0, despesa: 0, time: dateObj.getTime() };
            }
            if (tx.type === 'Receita') dayMap[dayKey].receita += tx.amount;
            else dayMap[dayKey].despesa += tx.amount;
        });

        const sorted = Object.values(dayMap).sort((a, b) => a.time - b.time);
        if (sorted.length > 0) return sorted;

        return [
            { name: 'Início', receita: 0, despesa: 0 },
            { name: 'Hoje', receita: periodRevenue, despesa: periodExpenses }
        ];
    }, [periodTransactions, periodRevenue, periodExpenses]);

    // Monthly Comparative (Bar Chart)
    const monthlyComparisonData = useMemo(() => {
        const monthsMap: Record<string, { month: string; receita: number; despesa: number; time: number }> = {};
        transactions.filter(t => t.status !== 'Cancelado').forEach(t => {
            const d = parseDateString(t.date);
            const mKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
            const mLabel = `${monthNames[d.getMonth()]}/${String(d.getFullYear()).slice(-2)}`;

            if (!monthsMap[mKey]) {
                monthsMap[mKey] = { month: mLabel, receita: 0, despesa: 0, time: new Date(d.getFullYear(), d.getMonth(), 1).getTime() };
            }

            if (t.type === 'Receita') monthsMap[mKey].receita += t.amount;
            else monthsMap[mKey].despesa += t.amount;
        });

        const list = Object.values(monthsMap).sort((a, b) => a.time - b.time).slice(-6);
        return list.length > 0 ? list : [
            { month: 'Ago/26', receita: 45000, despesa: 32000, time: 1 },
            { month: 'Set/26', receita: 58000, despesa: 41000, time: 2 },
            { month: 'Out/26', receita: periodRevenue || 64000, despesa: periodExpenses || 45000, time: 3 }
        ];
    }, [transactions, periodRevenue, periodExpenses]);

    // Cost Centers Bar Data
    const costCenterData = useMemo(() => {
        const ccMap: Record<string, { name: string; receitas: number; despesas: number; resultado: number }> = {};
        periodTransactions.forEach(t => {
            const cc = t.costCenter || 'Administrativo';
            if (!ccMap[cc]) ccMap[cc] = { name: cc, receitas: 0, despesas: 0, resultado: 0 };
            if (t.type === 'Receita') ccMap[cc].receitas += t.amount;
            else ccMap[cc].despesas += t.amount;
        });

        return Object.values(ccMap).map(c => ({
            ...c,
            resultado: c.receitas - c.despesas
        })).sort((a, b) => b.receitas - a.receitas);
    }, [periodTransactions]);

    const categoryData = useMemo(() => {
        const categories: Record<string, number> = {};
        periodTransactions.forEach(tx => {
            if (tx.type === 'Despesa') {
                const cat = tx.ledgerName || tx.category || 'Geral';
                categories[cat] = (categories[cat] || 0) + tx.amount;
            }
        });

        const data = Object.entries(categories).map(([name, value]) => ({ name, value }));
        return data.length > 0 ? data : [
            { name: 'Sem despesas no período', value: 1 }
        ];
    }, [periodTransactions]);

    const formatBRL = (val: number) => new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        maximumFractionDigits: 0
    }).format(val || 0);

    const formatBRLCompact = (val: number) => {
        if (val >= 1000000) return `R$ ${(val / 1000000).toFixed(1)}M`;
        if (val >= 1000) return `R$ ${(val / 1000).toFixed(1)}k`;
        return formatBRL(val);
    };

    const COLORS = ['#0891b2', '#06b6d4', '#22d3ee', '#67e8f9', '#99f6ff', '#38bdf8', '#818cf8'];

    // =========================================================================
    // MOTOR DE D.R.E. E CONTROLADORIA (4 MODELOS INTEGRADOS)
    // =========================================================================

    const dreCalculations = useMemo(() => {
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        const isInDreRange = (dateStr?: string) => {
            if (!dateStr) return true;
            const parsed = parseDateString(dateStr);
            return parsed >= start && parsed <= end;
        };

        const dreTxs = transactions.filter(t => isInDreRange(t.date) && t.status !== 'Cancelado');
        const grossRev = dreTxs.filter(t => t.type === 'Receita').reduce((sum, t) => sum + t.amount, 0);
        const expTxs = dreTxs.filter(t => t.type === 'Despesa');
        const totalExp = expTxs.reduce((sum, t) => sum + t.amount, 0);

        const taxRate = (settings?.technical?.defaultTaxRate || 6) / 100;
        const deductions = grossRev * taxRate;
        const netRev = grossRev - deductions;

        let cpv = 0;
        let operatingExp = 0;
        expTxs.forEach(t => {
            const cat = (t.ledgerName || t.category || '').toLowerCase();
            const code = (t.ledgerCode || '').toLowerCase();
            const isCost = code.startsWith('3') || cat.includes('custo') || cat.includes('cpv') || cat.includes('insumo') || cat.includes('matéria') || cat.includes('materia') || cat.includes('produção') || cat.includes('combustível') || cat.includes('manutenção') || cat.includes('fornecedor');
            if (isCost) {
                cpv += t.amount;
            } else {
                operatingExp += t.amount;
            }
        });

        if (cpv === 0 && totalExp > 0) {
            cpv = totalExp * 0.45;
            operatingExp = totalExp * 0.55;
        }

        const grossProfit = netRev - cpv;
        const ebitda = grossProfit - operatingExp;
        const depreciation = operatingExp * 0.08; // 8% de depreciação de maquinários e veículos
        const ebit = ebitda - depreciation;
        const financialExpenses = grossRev * 0.015; // 1.5% tarifas/despesas bancárias líquidas
        const taxesIRPJ = Math.max(0, (ebit - financialExpenses) * 0.15);
        const netProfit = ebit - financialExpenses - taxesIRPJ;
        const netMargin = grossRev > 0 ? (netProfit / grossRev) * 100 : 0;

        // Break-even (Ponto de Equilíbrio Operacional)
        const contributionMarginPercent = netRev > 0 ? (grossProfit / netRev) : 0.4;
        const breakEvenPoint = contributionMarginPercent > 0 ? operatingExp / contributionMarginPercent : 0;

        return {
            grossRev,
            deductions,
            netRev,
            cpv,
            grossProfit,
            operatingExp,
            ebitda,
            depreciation,
            ebit,
            financialExpenses,
            taxesIRPJ,
            netProfit,
            netMargin,
            breakEvenPoint,
            dreTxs
        };
    }, [transactions, startDate, endDate, settings]);

    // Model 3: DRE Monthly Matrix Data
    const dreMonthlyMatrix = useMemo(() => {
        const matrixMap: Record<string, { label: string; gross: number; cpv: number; opex: number; net: number }> = {};
        const dreTxs = transactions.filter(t => t.status !== 'Cancelado');

        dreTxs.forEach(t => {
            const d = parseDateString(t.date);
            const mKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
            const mLabel = `${monthNames[d.getMonth()]}/${String(d.getFullYear()).slice(-2)}`;

            if (!matrixMap[mKey]) {
                matrixMap[mKey] = { label: mLabel, gross: 0, cpv: 0, opex: 0, net: 0 };
            }

            if (t.type === 'Receita') {
                matrixMap[mKey].gross += t.amount;
            } else {
                const cat = (t.ledgerName || t.category || '').toLowerCase();
                const code = (t.ledgerCode || '').toLowerCase();
                const isCost = code.startsWith('3') || cat.includes('custo') || cat.includes('cpv') || cat.includes('insumo') || cat.includes('produção') || cat.includes('combustível') || cat.includes('manutenção');
                if (isCost) matrixMap[mKey].cpv += t.amount;
                else matrixMap[mKey].opex += t.amount;
            }
        });

        return Object.entries(matrixMap).sort((a, b) => a[0].localeCompare(b[0])).map(([_, d]) => {
            const netRev = d.gross * 0.94;
            const grossProfit = netRev - d.cpv;
            const ebitda = grossProfit - d.opex;
            const net = ebitda * 0.85;
            return {
                ...d,
                netRev,
                grossProfit,
                ebitda,
                net
            };
        });
    }, [transactions]);

    // Model 4: DRE by Cost Center
    const dreByCostCenter = useMemo(() => {
        const centers: Record<string, { center: string; gross: number; cpv: number; opex: number }> = {};
        const dreTxs = dreCalculations.dreTxs;

        dreTxs.forEach(t => {
            const cc = t.costCenter || 'Administrativo';
            if (!centers[cc]) centers[cc] = { center: cc, gross: 0, cpv: 0, opex: 0 };

            if (t.type === 'Receita') {
                centers[cc].gross += t.amount;
            } else {
                const cat = (t.ledgerName || t.category || '').toLowerCase();
                const code = (t.ledgerCode || '').toLowerCase();
                const isCost = code.startsWith('3') || cat.includes('custo') || cat.includes('cpv') || cat.includes('insumo') || cat.includes('produção');
                if (isCost) centers[cc].cpv += t.amount;
                else centers[cc].opex += t.amount;
            }
        });

        return Object.values(centers).map(c => {
            const netRev = c.gross * 0.94;
            const grossProfit = netRev - c.cpv;
            const result = grossProfit - c.opex;
            const margin = c.gross > 0 ? ((result / c.gross) * 100).toFixed(1) + '%' : 'N/A';
            return {
                ...c,
                netRev,
                grossProfit,
                result,
                margin
            };
        }).sort((a, b) => b.gross - a.gross);
    }, [dreCalculations]);

    const dreCostCenterTotals = useMemo(() => {
        let totalGross = 0;
        let totalCpv = 0;
        let totalOpex = 0;
        let totalResult = 0;
        dreByCostCenter.forEach(c => {
            totalGross += c.gross;
            totalCpv += c.cpv;
            totalOpex += c.opex;
            totalResult += c.result;
        });
        const totalNetRev = totalGross * 0.94;
        const totalMarginPct = totalGross > 0 ? (totalResult / totalGross) * 100 : 0;
        return {
            totalGross,
            totalCpv,
            totalOpex,
            totalResult,
            totalNetRev,
            totalMarginPct: `${totalMarginPct.toFixed(1)}%`,
            count: dreByCostCenter.length
        };
    }, [dreByCostCenter]);

    // Print Official DRE Report with Letterhead and Auditing Signatures
    const handlePrintOfficialDre = () => {
        const title = `DEMONSTRAÇÃO DO RESULTADO DO EXERCÍCIO (${dreViewMode.toUpperCase()})`;
        const protocol = `DRE-${Date.now().toString().slice(-8)}`;

        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8" />
                <title>${title} - ${company.companyName}</title>
                <style>
                    body {
                        font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif;
                        padding: 30px;
                        color: #0f172a;
                        line-height: 1.4;
                        font-size: 11px;
                    }
                    @page { size: A4 portrait; margin: 15mm; }
                    .header {
                        border-bottom: 3px solid #0891b2;
                        padding-bottom: 15px;
                        margin-bottom: 20px;
                        display: flex;
                        justify-content: space-between;
                        align-items: flex-start;
                    }
                    table.dre-table {
                        width: 100%;
                        border-collapse: collapse;
                        font-size: 10px;
                        margin-bottom: 25px;
                    }
                    table.dre-table th {
                        background: #0f172a;
                        color: #ffffff;
                        font-weight: 800;
                        text-transform: uppercase;
                        padding: 8px 10px;
                        text-align: left;
                    }
                    table.dre-table td {
                        padding: 7px 10px;
                        border-bottom: 1px solid #f1f5f9;
                    }
                    .row-subtotal { background-color: #f8fafc; font-weight: 800; color: #0891b2; }
                    .row-final { background-color: #ecfeff; font-weight: 900; font-size: 11px; border-top: 2px solid #0891b2; }
                    .numeric { text-align: right; font-family: monospace; font-weight: bold; }
                    .signatures-block {
                        margin-top: 40px;
                        display: grid;
                        grid-template-columns: repeat(3, 1fr);
                        gap: 25px;
                        padding-top: 20px;
                        border-top: 1px dashed #cbd5e1;
                    }
                    .signature-item { text-align: center; }
                    .signature-line { border-bottom: 1px solid #475569; margin-bottom: 5px; height: 30px; }
                    .signature-item p { margin: 0; font-size: 10px; font-weight: 700; }
                    .signature-item span { font-size: 8px; color: #64748b; }
                </style>
            </head>
            <body>
                <div class="header">
                    <div>
                        <h1 style="font-size: 18px; margin: 0 0 2px 0;">${company.companyName}</h1>
                        <p style="margin: 0; font-size: 9px; color: #475569;">CNPJ: ${company.document} | IE: ${company.stateRegistry}</p>
                        <p style="margin: 0; font-size: 9px; color: #475569;">${company.address}</p>
                    </div>
                    <div style="text-align: right;">
                        <span style="padding: 3px 8px; background: #ecfeff; color: #0891b2; font-weight: 800; border-radius: 4px; font-size: 9px;">CONTROLADORIA CORPORATIVA</span>
                        <h2 style="font-size: 14px; margin: 4px 0 2px 0;">${title}</h2>
                        <p style="margin: 0; font-family: monospace; color: #0891b2; font-weight: bold;">Protocolo: ${protocol}</p>
                        <p style="margin: 0; font-size: 9px; color: #64748b;">Período: ${formatDateBR(startDate)} até ${formatDateBR(endDate)}</p>
                    </div>
                </div>

                <table class="dre-table">
                    <thead>
                        <tr>
                            <th>Linha Contábil / Estrutura Analítica</th>
                            <th style="text-align: right; width: 140px;">Valor (R$)</th>
                            <th style="text-align: right; width: 100px;">% Rec. Bruta</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><strong>1. RECEITA OPERACIONAL BRUTA</strong></td>
                            <td class="numeric">${formatMoney(dreCalculations.grossRev)}</td>
                            <td class="numeric">100.0%</td>
                        </tr>
                        <tr>
                            <td style="padding-left: 20px;">(-) Deduções da Receita e Impostos sobre Vendas</td>
                            <td class="numeric" style="color: #e11d48;">-${formatMoney(dreCalculations.deductions)}</td>
                            <td class="numeric">${dreCalculations.grossRev > 0 ? ((dreCalculations.deductions / dreCalculations.grossRev) * 100).toFixed(1) : 0}%</td>
                        </tr>
                        <tr class="row-subtotal">
                            <td><strong>2. RECEITA OPERACIONAL LÍQUIDA</strong></td>
                            <td class="numeric">${formatMoney(dreCalculations.netRev)}</td>
                            <td class="numeric">${dreCalculations.grossRev > 0 ? ((dreCalculations.netRev / dreCalculations.grossRev) * 100).toFixed(1) : 0}%</td>
                        </tr>
                        <tr>
                            <td style="padding-left: 20px;">(-) Custos dos Produtos e Serviços Vendidos (CPV/CSP)</td>
                            <td class="numeric" style="color: #e11d48;">-${formatMoney(dreCalculations.cpv)}</td>
                            <td class="numeric">${dreCalculations.grossRev > 0 ? ((dreCalculations.cpv / dreCalculations.grossRev) * 100).toFixed(1) : 0}%</td>
                        </tr>
                        <tr class="row-subtotal">
                            <td><strong>3. LUCRO BRUTO OPERACIONAL</strong></td>
                            <td class="numeric">${formatMoney(dreCalculations.grossProfit)}</td>
                            <td class="numeric">${dreCalculations.grossRev > 0 ? ((dreCalculations.grossProfit / dreCalculations.grossRev) * 100).toFixed(1) : 0}%</td>
                        </tr>
                        <tr>
                            <td style="padding-left: 20px;">(-) Despesas Operacionais (Administrativas e Comerciais)</td>
                            <td class="numeric" style="color: #e11d48;">-${formatMoney(dreCalculations.operatingExp)}</td>
                            <td class="numeric">${dreCalculations.grossRev > 0 ? ((dreCalculations.operatingExp / dreCalculations.grossRev) * 100).toFixed(1) : 0}%</td>
                        </tr>
                        <tr class="row-subtotal" style="color: #0d9488;">
                            <td><strong>4. RESULTADO OPERACIONAL ANTES DOS JUROS E TRIBUTOS (EBITDA)</strong></td>
                            <td class="numeric">${formatMoney(dreCalculations.ebitda)}</td>
                            <td class="numeric">${dreCalculations.grossRev > 0 ? ((dreCalculations.ebitda / dreCalculations.grossRev) * 100).toFixed(1) : 0}%</td>
                        </tr>
                        <tr>
                            <td style="padding-left: 20px;">(-) Depreciação e Amortização de Ativos</td>
                            <td class="numeric" style="color: #e11d48;">-${formatMoney(dreCalculations.depreciation)}</td>
                            <td class="numeric">${dreCalculations.grossRev > 0 ? ((dreCalculations.depreciation / dreCalculations.grossRev) * 100).toFixed(1) : 0}%</td>
                        </tr>
                        <tr>
                            <td style="padding-left: 20px;">(-) Despesas Financeiras Líquidas</td>
                            <td class="numeric" style="color: #e11d48;">-${formatMoney(dreCalculations.financialExpenses)}</td>
                            <td class="numeric">${dreCalculations.grossRev > 0 ? ((dreCalculations.financialExpenses / dreCalculations.grossRev) * 100).toFixed(1) : 0}%</td>
                        </tr>
                        <tr>
                            <td style="padding-left: 20px;">(-) Provisão para IRPJ e Contribuição Social</td>
                            <td class="numeric" style="color: #e11d48;">-${formatMoney(dreCalculations.taxesIRPJ)}</td>
                            <td class="numeric">${dreCalculations.grossRev > 0 ? ((dreCalculations.taxesIRPJ / dreCalculations.grossRev) * 100).toFixed(1) : 0}%</td>
                        </tr>
                        <tr class="row-final">
                            <td><strong>5. RESULTADO LÍQUIDO DO EXERCÍCIO (LUCRO LÍQUIDO)</strong></td>
                            <td class="numeric" style="color: ${dreCalculations.netProfit >= 0 ? '#16a34a' : '#e11d48'};">${formatMoney(dreCalculations.netProfit)}</td>
                            <td class="numeric" style="color: ${dreCalculations.netProfit >= 0 ? '#16a34a' : '#e11d48'};">${dreCalculations.netMargin.toFixed(1)}%</td>
                        </tr>
                    </tbody>
                </table>

                <div class="signatures-block">
                    <div class="signature-item">
                        <div class="signature-line"></div>
                        <p>${currentUser?.name || 'Responsável Técnico'}</p>
                        <span>Elaborado por (Emissor)</span>
                    </div>
                    <div class="signature-item">
                        <div class="signature-line"></div>
                        <p>Gerência de Controladoria</p>
                        <span>Conferido e Homologado</span>
                    </div>
                    <div class="signature-item">
                        <div class="signature-line"></div>
                        <p>Diretoria Financeira Executiva</p>
                        <span>Aprovado</span>
                    </div>
                </div>
            </body>
            </html>
        `;

        printDocument(title, html);
    };

    // Export DRE to CSV
    const handleExportDreCSV = () => {
        const metadata = `# INFRACORE ERP - DEMONSTRAÇÃO DO RESULTADO (${dreViewMode.toUpperCase()}) | ${company.companyName} | Período: ${formatDateBR(startDate)} a ${formatDateBR(endDate)}`;

        if (dreViewMode === 'mensal') {
            const headers = ['Mês/Ano', 'Receita Bruta (R$)', 'Receita Líquida (R$)', 'CPV (R$)', 'Lucro Bruto (R$)', 'Despesas Operacionais (R$)', 'EBITDA (R$)', 'Lucro Líquido (R$)'];
            const rows = dreMonthlyMatrix.map(m => [
                m.label,
                m.gross,
                m.netRev,
                m.cpv,
                m.grossProfit,
                m.opex,
                m.ebitda,
                m.net
            ]);
            exportCustomTableToCSV(headers, rows, `DRE_Mensal_Comparativa`, metadata);
        } else if (dreViewMode === 'centro_custo') {
            const headers = ['Centro de Custo', 'Receita Bruta (R$)', 'Custos Diretos (R$)', 'Despesas Alocadas (R$)', 'Resultado Operacional (R$)', 'Margem %'];
            const rows = dreByCostCenter.map(c => [
                c.center,
                c.gross,
                c.cpv,
                c.opex,
                c.result,
                c.margin
            ]);
            exportCustomTableToCSV(headers, rows, `DRE_Centros_Custo`, metadata);
        } else {
            const headers = ['Estrutura Analítica', 'Valor (R$)', '% Rec. Bruta'];
            const rows = [
                ['1. RECEITA OPERACIONAL BRUTA', dreCalculations.grossRev, '100.0%'],
                ['   (-) Deduções e Impostos', -dreCalculations.deductions, `${dreCalculations.grossRev > 0 ? ((dreCalculations.deductions / dreCalculations.grossRev) * 100).toFixed(1) : 0}%`],
                ['2. RECEITA OPERACIONAL LÍQUIDA', dreCalculations.netRev, `${dreCalculations.grossRev > 0 ? ((dreCalculations.netRev / dreCalculations.grossRev) * 100).toFixed(1) : 0}%`],
                ['   (-) Custos dos Produtos Vendidos (CPV)', -dreCalculations.cpv, `${dreCalculations.grossRev > 0 ? ((dreCalculations.cpv / dreCalculations.grossRev) * 100).toFixed(1) : 0}%`],
                ['3. LUCRO BRUTO OPERACIONAL', dreCalculations.grossProfit, `${dreCalculations.grossRev > 0 ? ((dreCalculations.grossProfit / dreCalculations.grossRev) * 100).toFixed(1) : 0}%`],
                ['   (-) Despesas Operacionais (Adm/Comerciais)', -dreCalculations.operatingExp, `${dreCalculations.grossRev > 0 ? ((dreCalculations.operatingExp / dreCalculations.grossRev) * 100).toFixed(1) : 0}%`],
                ['4. RESULTADO OPERACIONAL (EBITDA)', dreCalculations.ebitda, `${dreCalculations.grossRev > 0 ? ((dreCalculations.ebitda / dreCalculations.grossRev) * 100).toFixed(1) : 0}%`],
                ['   (-) Depreciação e Amortização', -dreCalculations.depreciation, `${dreCalculations.grossRev > 0 ? ((dreCalculations.depreciation / dreCalculations.grossRev) * 100).toFixed(1) : 0}%`],
                ['   (-) IRPJ / CSLL e Encargos', -dreCalculations.taxesIRPJ, `${dreCalculations.grossRev > 0 ? ((dreCalculations.taxesIRPJ / dreCalculations.grossRev) * 100).toFixed(1) : 0}%`],
                ['5. LUCRO LÍQUIDO DO EXERCÍCIO', dreCalculations.netProfit, `${dreCalculations.netMargin.toFixed(1)}%`]
            ];
            exportCustomTableToCSV(headers, rows, `DRE_Oficial_${dreViewMode}`, metadata);
        }

        addToast("Demonstração D.R.E. exportada com sucesso em Excel / CSV!", 'success');
    };

    return (
        <div className="flex flex-col gap-6 animate-in fade-in duration-700">
            {/* Main Header with 4 Navigation Tabs */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3 font-display tracking-tight">
                        <div className="p-2.5 bg-gradient-to-br from-cyan-600 to-cyan-400 rounded-2xl text-white shadow-lg shadow-cyan-500/20">
                            {activeTab === 'dashboard' ? <PieChartIcon size={24} /> : activeTab === 'dre' ? <Calculator size={24} /> : activeTab === 'chart_of_accounts' ? <BookOpen size={24} /> : <FileText size={24} />}
                        </div>
                        {activeTab === 'dashboard'
                            ? 'BI & Analytics Executivo'
                            : activeTab === 'dre'
                                ? 'D.R.E. & Controladoria Corporativa'
                                : activeTab === 'chart_of_accounts'
                                    ? 'Plano de Contas Gerencial'
                                    : 'Central de Relatórios Corporativos'}
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-2 font-medium">
                        {activeTab === 'dashboard'
                            ? 'Insights operacionais, fluxo de caixa e rentabilidade apurados em tempo real.'
                            : activeTab === 'dre'
                                ? 'Demonstração do Resultado do Exercício com EBITDA, Margem de Contribuição e Análise por Centro de Custo.'
                                : activeTab === 'chart_of_accounts'
                                    ? 'Demonstrativo e consolidação analítica oficial por plano de contas contábil.'
                                    : 'Biblioteca com 39 relatórios corporativos com personalização avançada de colunas, ordenação e filtros.'}
                    </p>
                </div>

                <div className="flex bg-slate-100 dark:bg-slate-900 p-1.5 rounded-2xl border dark:border-slate-700 flex-wrap gap-1">
                    <button
                        onClick={() => setActiveTab('dashboard')}
                        className={`px-4 py-2.5 text-xs font-black rounded-xl transition-all flex items-center gap-2 ${activeTab === 'dashboard' ? 'bg-white dark:bg-slate-700 text-cyan-600 shadow-sm' : 'text-slate-400 hover:text-cyan-600'}`}
                    >
                        <PieChartIcon size={16} /> DASHBOARD
                    </button>
                    <button
                        onClick={() => setActiveTab('dre')}
                        className={`px-4 py-2.5 text-xs font-black rounded-xl transition-all flex items-center gap-2 ${activeTab === 'dre' ? 'bg-white dark:bg-slate-700 text-cyan-600 shadow-sm' : 'text-slate-400 hover:text-cyan-600'}`}
                    >
                        <Calculator size={16} /> D.R.E. & CONTROLADORIA
                    </button>
                    <button
                        onClick={() => setActiveTab('chart_of_accounts')}
                        className={`px-4 py-2.5 text-xs font-black rounded-xl transition-all flex items-center gap-2 ${activeTab === 'chart_of_accounts' ? 'bg-white dark:bg-slate-700 text-cyan-600 shadow-sm' : 'text-slate-400 hover:text-cyan-600'}`}
                    >
                        <BookOpen size={16} /> PLANO DE CONTAS
                    </button>
                    <button
                        onClick={() => setActiveTab('generator')}
                        className={`px-4 py-2.5 text-xs font-black rounded-xl transition-all flex items-center gap-2 ${activeTab === 'generator' ? 'bg-white dark:bg-slate-700 text-cyan-600 shadow-sm' : 'text-slate-400 hover:text-cyan-600'}`}
                    >
                        <Printer size={16} /> BIBLIOTECA DE RELATÓRIOS
                    </button>
                </div>
            </div>

            {/* =========================================================================
                TAB 1: DASHBOARD (BI & ANALYTICS EXECUTIVO)
            ========================================================================= */}
            {activeTab === 'dashboard' ? (
                <div className="flex flex-col gap-6 animate-in slide-in-from-left duration-300">
                    {/* Period Selector & Dashboard Tools */}
                    <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Período de Análise:</span>
                            <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl">
                                {(['7d', '30d', '12m'] as const).map(p => (
                                    <button
                                        key={p}
                                        onClick={() => setReportPeriod(p)}
                                        className={`px-3 py-1.5 text-xs font-black rounded-lg transition-all ${reportPeriod === p ? 'bg-white dark:bg-slate-700 text-cyan-600 shadow-sm' : 'text-slate-400'}`}
                                    >
                                        {p.toUpperCase()}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={handleExportDashboard}
                                className="px-4 py-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400 rounded-xl transition-colors text-xs font-bold flex items-center gap-1.5"
                                title="Exportar Resumo Executivo Oficial (Excel/CSV)"
                            >
                                <Download size={15} /> Exportar Resumo Oficial
                            </button>
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(window.location.href);
                                    addToast("Link do painel copiado com sucesso!", 'success');
                                }}
                                className="p-2 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-colors"
                                title="Compartilhar"
                            >
                                <Share2 size={16} />
                            </button>
                        </div>
                    </div>

                    {/* Smart KPIs */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            { label: `RECEITA (${reportPeriod.toUpperCase()})`, value: periodRevenue, trend: revenueTrend, icon: <DollarSign />, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/10' },
                            { label: 'SALDO REAL DISPONÍVEL', value: financials.balance, trend: '+4.2%', icon: <TrendingUp />, color: 'text-cyan-500', bg: 'bg-cyan-50 dark:bg-cyan-900/10' },
                            { label: 'TICKET MÉDIO DE VENDAS', value: avgTicket, trend: periodSales.length > 0 ? `${periodSales.length} vendas` : 'Sem vendas', icon: <Activity />, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/10' },
                            { label: 'EFICIÊNCIA OPERACIONAL (OEE)', value: calculatedOEE, trend: productionUnits.length > 0 ? `${productionUnits.length} Usinas` : 'Estimado', icon: <Factory />, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/10' },
                        ].map((kpi, i) => (
                            <div key={i} className="bg-white dark:bg-slate-800 p-8 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-700 group hover:shadow-xl transition-all duration-300">
                                <div className="flex justify-between items-start mb-6">
                                    <div className={`p-4 rounded-2xl ${kpi.bg} ${kpi.color} group-hover:scale-110 transition-transform`}>
                                        {kpi.icon}
                                    </div>
                                    <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg ${kpi.trend.startsWith('+') ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}>
                                        {kpi.trend}
                                    </span>
                                </div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{kpi.label}</p>
                                <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">
                                    {kpi.label.includes('EFICIÊNCIA') ? kpi.value.toFixed(1) + '%' : formatBRLCompact(kpi.value)}
                                </h3>
                            </div>
                        ))}
                    </div>

                    {/* D.R.E. EXECUTIVE WIDGET CARD */}
                    <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-8 rounded-3xl shadow-xl border border-slate-700 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-700">
                            <div>
                                <span className="px-3 py-1 bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-lg text-[10px] font-black uppercase tracking-widest">
                                    Controladoria em Tempo Real
                                </span>
                                <h2 className="text-2xl font-black mt-2 tracking-tight flex items-center gap-2">
                                    <Calculator className="text-cyan-400" />
                                    Demonstrativo do Resultado do Exercício (D.R.E. Síntese)
                                </h2>
                                <p className="text-slate-400 text-xs mt-1">
                                    Resultado operacional líquido, EBITDA consolidado e margem operacional apurada.
                                </p>
                            </div>

                            <button
                                onClick={() => setActiveTab('dre')}
                                className="px-5 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-black text-xs rounded-xl shadow-lg shadow-cyan-600/30 transition-all flex items-center gap-2 self-start lg:self-auto cursor-pointer"
                            >
                                <Calculator size={16} /> Abrir Painel Completo D.R.E. & Controladoria
                            </button>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 pt-6">
                            <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Receita Bruta</span>
                                <strong className="text-lg font-black font-mono text-emerald-400">{formatMoney(dreCalculations.grossRev)}</strong>
                                <span className="text-[10px] text-slate-400 block mt-1">100% Base</span>
                            </div>
                            <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">(-) Deduções/Impostos</span>
                                <strong className="text-lg font-black font-mono text-rose-400">-{formatMoney(dreCalculations.deductions)}</strong>
                                <span className="text-[10px] text-slate-400 block mt-1">Simples/ISS/ICMS</span>
                            </div>
                            <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">(-) Custos CPV/CSP</span>
                                <strong className="text-lg font-black font-mono text-amber-400">-{formatMoney(dreCalculations.cpv)}</strong>
                                <span className="text-[10px] text-slate-400 block mt-1">Produção & Insumos</span>
                            </div>
                            <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Lucro Bruto</span>
                                <strong className="text-lg font-black font-mono text-cyan-400">{formatMoney(dreCalculations.grossProfit)}</strong>
                                <span className="text-[10px] text-slate-400 block mt-1">Margem Bruta</span>
                            </div>
                            <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">EBITDA Operacional</span>
                                <strong className="text-lg font-black font-mono text-teal-400">{formatMoney(dreCalculations.ebitda)}</strong>
                                <span className="text-[10px] text-slate-400 block mt-1">Geração de Caixa</span>
                            </div>
                            <div className="bg-white/5 p-4 rounded-2xl border border-white/10 bg-cyan-950/20 border-cyan-500/30">
                                <span className="text-[10px] font-bold text-cyan-300 uppercase tracking-wider block mb-1">Lucro Líquido</span>
                                <strong className={`text-lg font-black font-mono ${dreCalculations.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    {formatMoney(dreCalculations.netProfit)}
                                </strong>
                                <span className="text-[10px] text-cyan-300 font-bold block mt-1">Margem: {dreCalculations.netMargin.toFixed(1)}%</span>
                            </div>
                        </div>
                    </div>

                    {/* Charts Section: Row 1 (Timeline Area & Expense Pie) */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700">
                            <h3 className="text-base font-black text-slate-900 dark:text-white mb-6">Evolução Diária de Entradas e Saídas ({reportPeriod.toUpperCase()})</h3>
                            <div className="h-[320px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={financialHistory} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorInc" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.2} />
                                                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#f472b6" stopOpacity={0.2} />
                                                <stop offset="95%" stopColor="#f472b6" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 700 }} dy={10} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                                        <Tooltip formatter={(v: any) => formatMoney(Number(v))} />
                                        <Area type="monotone" dataKey="receita" stroke="#06b6d4" strokeWidth={3} fillOpacity={1} fill="url(#colorInc)" name="Receitas" />
                                        <Area type="monotone" dataKey="despesa" stroke="#f472b6" strokeWidth={3} fillOpacity={1} fill="url(#colorExp)" name="Despesas" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700">
                            <h3 className="text-base font-black text-slate-900 dark:text-white mb-6">Distribuição de Gastos ({reportPeriod.toUpperCase()})</h3>
                            <div className="h-[320px] w-full relative">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={categoryData} cx="50%" cy="50%" innerRadius={65} outerRadius={105} fill="#8884d8" paddingAngle={8} dataKey="value" stroke="none">
                                            {categoryData.map((_, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(v: any) => formatMoney(Number(v))} />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Despesa Total</span>
                                    <span className="text-xl font-black text-slate-800 dark:text-white">
                                        {formatBRL(periodExpenses).split(',')[0]}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* NEW Charts Section: Row 2 (Monthly Comparative Bar Chart & Cost Centers) */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700">
                            <h3 className="text-base font-black text-slate-900 dark:text-white mb-6 flex items-center justify-between">
                                <span>Comparativo Mensal: Receitas vs Despesas</span>
                                <span className="text-xs text-slate-400 font-normal">Últimos meses</span>
                            </h3>
                            <div className="h-[280px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={monthlyComparisonData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 700 }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                                        <Tooltip formatter={(v: any) => formatMoney(Number(v))} />
                                        <Legend />
                                        <Bar dataKey="receita" fill="#0891b2" radius={[6, 6, 0, 0]} name="Receitas" />
                                        <Bar dataKey="despesa" fill="#f43f5e" radius={[6, 6, 0, 0]} name="Despesas" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700">
                            <h3 className="text-base font-black text-slate-900 dark:text-white mb-6 flex items-center justify-between">
                                <span>Resultado por Centro de Custo</span>
                                <span className="text-xs text-slate-400 font-normal">Receitas vs Despesas</span>
                            </h3>
                            <div className="space-y-4 max-h-[280px] overflow-y-auto custom-scrollbar pr-2">
                                {costCenterData.map((c, idx) => (
                                    <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                                        <div className="flex justify-between items-center mb-1.5">
                                            <strong className="text-xs text-slate-800 dark:text-white uppercase">{c.name}</strong>
                                            <span className={`font-mono text-xs font-black ${c.resultado >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                {formatMoney(c.resultado)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                                            <span>Receitas: <strong className="text-slate-600 dark:text-slate-300 font-mono">{formatMoney(c.receitas)}</strong></span>
                                            <span>Despesas: <strong className="text-slate-600 dark:text-slate-300 font-mono">{formatMoney(c.despesas)}</strong></span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            ) : activeTab === 'dre' ? (
                /* =========================================================================
                    TAB 2: D.R.E. & CONTROLADORIA CORPORATIVA (PAINEL COM 4 MODELOS)
                ========================================================================= */
                <div className="flex flex-col gap-6 animate-in slide-in-from-right duration-300">
                    {/* DRE Header Controls & Model Switcher */}
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 space-y-6">
                        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                                    <Calculator size={24} className="text-cyan-600" />
                                    Painel Executivo de D.R.E. & Controladoria
                                </h2>
                                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                                    Demonstração do Resultado por modelo gerencial, contábil oficial, histórico mensal e centros de custo.
                                </p>
                            </div>

                            <div className="flex flex-wrap gap-3 items-end">
                                <div>
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Início</label>
                                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold px-3 py-2" />
                                </div>
                                <div>
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Fim</label>
                                    <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold px-3 py-2" />
                                </div>
                                <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl">
                                    <button onClick={() => setDatePreset('thisMonth')} className="px-2.5 py-1.5 text-[11px] font-bold text-slate-600 dark:text-slate-300 hover:text-cyan-600">Este Mês</button>
                                    <button onClick={() => setDatePreset('lastQuarter')} className="px-2.5 py-1.5 text-[11px] font-bold text-slate-600 dark:text-slate-300 hover:text-cyan-600">Trimestre</button>
                                    <button onClick={() => setDatePreset('thisYear')} className="px-2.5 py-1.5 text-[11px] font-bold text-slate-600 dark:text-slate-300 hover:text-cyan-600">Ano</button>
                                </div>
                                <button
                                    onClick={handleExportDreCSV}
                                    className="px-4 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl hover:bg-slate-200 transition-colors flex items-center gap-1.5"
                                >
                                    <Download size={14} /> Exportar Excel
                                </button>
                                <button
                                    onClick={handlePrintOfficialDre}
                                    className="px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center gap-2"
                                >
                                    <Printer size={15} /> Imprimir D.R.E. Oficial
                                </button>
                            </div>
                        </div>

                        {/* 4 DRE View Modes Switcher */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-2">
                            {[
                                { id: 'gerencial', title: '1. D.R.E. Gerencial', desc: 'EBITDA, Margem de Contribuição & Break-even' },
                                { id: 'contabil', title: '2. D.R.E. Contábil Oficial', desc: 'Padrão Lei 6.404 / CFC com Análise Vertical' },
                                { id: 'mensal', title: '3. D.R.E. Mensal Comparativa', desc: 'Evolução matricial lado a lado mês a mês' },
                                { id: 'centro_custo', title: '4. D.R.E. por Centro de Custo', desc: 'Usinas, Obras, Pavimentação e Administrativo' },
                            ].map(m => (
                                <button
                                    key={m.id}
                                    onClick={() => setDreViewMode(m.id as any)}
                                    className={`p-4 rounded-2xl text-left border transition-all ${dreViewMode === m.id
                                        ? 'bg-cyan-50 border-cyan-500 dark:bg-cyan-950/30 dark:border-cyan-500 shadow-sm'
                                        : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-cyan-300'
                                        }`}
                                >
                                    <h4 className={`text-xs font-black ${dreViewMode === m.id ? 'text-cyan-700 dark:text-cyan-400' : 'text-slate-800 dark:text-slate-200'}`}>
                                        {m.title}
                                    </h4>
                                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{m.desc}</p>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* DRE Body based on Selected Model */}
                    <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700">
                        {dreViewMode === 'gerencial' ? (
                            /* MODEL 1: GERENCIAL COM EBITDA E PONTO DE EQUILÍBRIO */
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                    <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">EBITDA Gerencial</span>
                                        <strong className="text-2xl font-black font-mono text-teal-600">{formatMoney(dreCalculations.ebitda)}</strong>
                                        <span className="text-xs text-slate-500 block mt-1">Margem EBITDA: {dreCalculations.grossRev > 0 ? ((dreCalculations.ebitda / dreCalculations.grossRev) * 100).toFixed(1) : 0}%</span>
                                    </div>
                                    <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Margem de Contribuição</span>
                                        <strong className="text-2xl font-black font-mono text-cyan-600">{formatMoney(dreCalculations.grossProfit)}</strong>
                                        <span className="text-xs text-slate-500 block mt-1">Geração Bruta: {dreCalculations.grossRev > 0 ? ((dreCalculations.grossProfit / dreCalculations.grossRev) * 100).toFixed(1) : 0}%</span>
                                    </div>
                                    <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Ponto de Equilíbrio Operacional</span>
                                        <strong className="text-2xl font-black font-mono text-indigo-600">{formatMoney(dreCalculations.breakEvenPoint)}</strong>
                                        <span className="text-xs text-slate-500 block mt-1">Faturamento Mínimo para Cobrir Gastos</span>
                                    </div>
                                </div>

                                <table className="w-full text-xs">
                                    <thead className="bg-slate-50 dark:bg-slate-900 uppercase font-black text-slate-400 text-[10px]">
                                        <tr>
                                            <th className="px-4 py-3 text-left">Estrutura Gerencial</th>
                                            <th className="px-4 py-3 text-right">Valor Apurado (R$)</th>
                                            <th className="px-4 py-3 text-right">% Receita Bruta</th>
                                            <th className="px-4 py-3 text-left">Tipo Contábil</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700 font-medium">
                                        <tr className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                                            <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">1. RECEITA BRUTA OPERACIONAL</td>
                                            <td className="px-4 py-3 text-right font-mono font-bold">{formatMoney(dreCalculations.grossRev)}</td>
                                            <td className="px-4 py-3 text-right font-mono">100.0%</td>
                                            <td className="px-4 py-3 text-emerald-600 font-bold">Receita Bruta</td>
                                        </tr>
                                        <tr className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                                            <td className="px-4 py-3 pl-8 text-slate-600 dark:text-slate-300">(-) Deduções e Impostos sobre Faturamento</td>
                                            <td className="px-4 py-3 text-right font-mono text-rose-600">-{formatMoney(dreCalculations.deductions)}</td>
                                            <td className="px-4 py-3 text-right font-mono">{dreCalculations.grossRev > 0 ? ((dreCalculations.deductions / dreCalculations.grossRev) * 100).toFixed(1) : 0}%</td>
                                            <td className="px-4 py-3 text-rose-500">Tributos Indiretos</td>
                                        </tr>
                                        <tr className="bg-slate-50/70 dark:bg-slate-900/40 font-bold">
                                            <td className="px-4 py-3 text-cyan-600 dark:text-cyan-400">2. RECEITA OPERACIONAL LÍQUIDA</td>
                                            <td className="px-4 py-3 text-right font-mono">{formatMoney(dreCalculations.netRev)}</td>
                                            <td className="px-4 py-3 text-right font-mono">{dreCalculations.grossRev > 0 ? ((dreCalculations.netRev / dreCalculations.grossRev) * 100).toFixed(1) : 0}%</td>
                                            <td className="px-4 py-3 text-cyan-600">Subtotal Líquido</td>
                                        </tr>
                                        <tr className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                                            <td className="px-4 py-3 pl-8 text-slate-600 dark:text-slate-300">(-) Custos dos Produtos Vendidos (CPV / Insumos / Produção)</td>
                                            <td className="px-4 py-3 text-right font-mono text-rose-600">-{formatMoney(dreCalculations.cpv)}</td>
                                            <td className="px-4 py-3 text-right font-mono">{dreCalculations.grossRev > 0 ? ((dreCalculations.cpv / dreCalculations.grossRev) * 100).toFixed(1) : 0}%</td>
                                            <td className="px-4 py-3 text-amber-500">Custo Direto</td>
                                        </tr>
                                        <tr className="bg-slate-50/70 dark:bg-slate-900/40 font-bold">
                                            <td className="px-4 py-3 text-teal-600 dark:text-teal-400">3. LUCRO BRUTO OPERACIONAL (MARGEM DE CONTRIBUIÇÃO)</td>
                                            <td className="px-4 py-3 text-right font-mono">{formatMoney(dreCalculations.grossProfit)}</td>
                                            <td className="px-4 py-3 text-right font-mono">{dreCalculations.grossRev > 0 ? ((dreCalculations.grossProfit / dreCalculations.grossRev) * 100).toFixed(1) : 0}%</td>
                                            <td className="px-4 py-3 text-teal-600">Margem Contribuição</td>
                                        </tr>
                                        <tr className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                                            <td className="px-4 py-3 pl-8 text-slate-600 dark:text-slate-300">(-) Despesas Operacionais Administrativas e Comerciais</td>
                                            <td className="px-4 py-3 text-right font-mono text-rose-600">-{formatMoney(dreCalculations.operatingExp)}</td>
                                            <td className="px-4 py-3 text-right font-mono">{dreCalculations.grossRev > 0 ? ((dreCalculations.operatingExp / dreCalculations.grossRev) * 100).toFixed(1) : 0}%</td>
                                            <td className="px-4 py-3 text-rose-500">Gasto Operacional</td>
                                        </tr>
                                        <tr className="bg-cyan-50 dark:bg-cyan-950/20 font-black text-cyan-800 dark:text-cyan-300">
                                            <td className="px-4 py-3">4. RESULTADO OPERACIONAL ANTES DOS JUROS E TRIBUTOS (EBITDA)</td>
                                            <td className="px-4 py-3 text-right font-mono">{formatMoney(dreCalculations.ebitda)}</td>
                                            <td className="px-4 py-3 text-right font-mono">{dreCalculations.grossRev > 0 ? ((dreCalculations.ebitda / dreCalculations.grossRev) * 100).toFixed(1) : 0}%</td>
                                            <td className="px-4 py-3 text-cyan-600">Geração Caixa</td>
                                        </tr>
                                        <tr className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                                            <td className="px-4 py-3 pl-8 text-slate-600 dark:text-slate-300">(-) Provisão para IRPJ e Contribuição Social</td>
                                            <td className="px-4 py-3 text-right font-mono text-rose-600">-{formatMoney(dreCalculations.taxesIRPJ)}</td>
                                            <td className="px-4 py-3 text-right font-mono">{dreCalculations.grossRev > 0 ? ((dreCalculations.taxesIRPJ / dreCalculations.grossRev) * 100).toFixed(1) : 0}%</td>
                                            <td className="px-4 py-3 text-rose-500">Tributos Diretos</td>
                                        </tr>
                                        <tr className="bg-slate-900 text-white font-black text-sm">
                                            <td className="px-4 py-3.5">5. RESULTADO LÍQUIDO DO EXERCÍCIO (LUCRO LÍQUIDO)</td>
                                            <td className={`px-4 py-3.5 text-right font-mono ${dreCalculations.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                {formatMoney(dreCalculations.netProfit)}
                                            </td>
                                            <td className={`px-4 py-3.5 text-right font-mono ${dreCalculations.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                {dreCalculations.netMargin.toFixed(1)}%
                                            </td>
                                            <td className="px-4 py-3.5 text-emerald-400">Resultado Final</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        ) : dreViewMode === 'contabil' ? (
                            /* MODEL 2: DRE CONTÁBIL OFICIAL LEI 6.404 / CFC */
                            <div className="space-y-4">
                                <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-700 flex justify-between items-center text-xs">
                                    <span className="font-bold text-slate-600 dark:text-slate-300">Demonstração Contábil em Conformidade com a Lei 6.404/76 e Normas Brasileiras de Contabilidade (NBC TG / CFC)</span>
                                    <span className="px-2.5 py-1 bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200 font-bold rounded-lg text-[10px]">PADRÃO CFC OFICIAL</span>
                                </div>

                                <table className="w-full text-xs">
                                    <thead className="bg-slate-50 dark:bg-slate-900 uppercase font-black text-slate-400 text-[10px]">
                                        <tr>
                                            <th className="px-4 py-3 text-left">Estrutura Contábil Padronizada</th>
                                            <th className="px-4 py-3 text-right">Saldo do Exercício (R$)</th>
                                            <th className="px-4 py-3 text-right">Análise Vertical (AV %)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700 font-medium">
                                        <tr>
                                            <td className="px-4 py-2.5 font-bold">1. RECEITA OPERACIONAL BRUTA</td>
                                            <td className="px-4 py-2.5 text-right font-mono font-bold">{formatMoney(dreCalculations.grossRev)}</td>
                                            <td className="px-4 py-2.5 text-right font-mono">100.0%</td>
                                        </tr>
                                        <tr>
                                            <td className="px-4 py-2.5 pl-8 text-slate-500">(-) Impostos e Deduções Incidentes sobre Vendas</td>
                                            <td className="px-4 py-2.5 text-right font-mono text-rose-600">-{formatMoney(dreCalculations.deductions)}</td>
                                            <td className="px-4 py-2.5 text-right font-mono">{dreCalculations.grossRev > 0 ? ((dreCalculations.deductions / dreCalculations.grossRev) * 100).toFixed(1) : 0}%</td>
                                        </tr>
                                        <tr className="bg-slate-50 dark:bg-slate-900/30 font-bold">
                                            <td className="px-4 py-2.5">2. RECEITA OPERACIONAL LÍQUIDA</td>
                                            <td className="px-4 py-2.5 text-right font-mono">{formatMoney(dreCalculations.netRev)}</td>
                                            <td className="px-4 py-2.5 text-right font-mono">{dreCalculations.grossRev > 0 ? ((dreCalculations.netRev / dreCalculations.grossRev) * 100).toFixed(1) : 0}%</td>
                                        </tr>
                                        <tr>
                                            <td className="px-4 py-2.5 pl-8 text-slate-500">(-) Custo dos Produtos e Serviços Vendidos (CPV/CSP)</td>
                                            <td className="px-4 py-2.5 text-right font-mono text-rose-600">-{formatMoney(dreCalculations.cpv)}</td>
                                            <td className="px-4 py-2.5 text-right font-mono">{dreCalculations.grossRev > 0 ? ((dreCalculations.cpv / dreCalculations.grossRev) * 100).toFixed(1) : 0}%</td>
                                        </tr>
                                        <tr className="bg-slate-50 dark:bg-slate-900/30 font-bold">
                                            <td className="px-4 py-2.5">3. LUCRO BRUTO</td>
                                            <td className="px-4 py-2.5 text-right font-mono">{formatMoney(dreCalculations.grossProfit)}</td>
                                            <td className="px-4 py-2.5 text-right font-mono">{dreCalculations.grossRev > 0 ? ((dreCalculations.grossProfit / dreCalculations.grossRev) * 100).toFixed(1) : 0}%</td>
                                        </tr>
                                        <tr>
                                            <td className="px-4 py-2.5 pl-8 text-slate-500">(-) Despesas Administrativas e Gerais</td>
                                            <td className="px-4 py-2.5 text-right font-mono text-rose-600">-{formatMoney(dreCalculations.operatingExp * 0.7)}</td>
                                            <td className="px-4 py-2.5 text-right font-mono">{dreCalculations.grossRev > 0 ? (((dreCalculations.operatingExp * 0.7) / dreCalculations.grossRev) * 100).toFixed(1) : 0}%</td>
                                        </tr>
                                        <tr>
                                            <td className="px-4 py-2.5 pl-8 text-slate-500">(-) Despesas Comerciais e de Vendas</td>
                                            <td className="px-4 py-2.5 text-right font-mono text-rose-600">-{formatMoney(dreCalculations.operatingExp * 0.3)}</td>
                                            <td className="px-4 py-2.5 text-right font-mono">{dreCalculations.grossRev > 0 ? (((dreCalculations.operatingExp * 0.3) / dreCalculations.grossRev) * 100).toFixed(1) : 0}%</td>
                                        </tr>
                                        <tr className="bg-cyan-50 dark:bg-cyan-950/20 font-bold text-cyan-800 dark:text-cyan-300">
                                            <td className="px-4 py-2.5">4. RESULTADO OPERACIONAL ANTES DOS EFEITOS FINANCEIROS (EBITDA)</td>
                                            <td className="px-4 py-2.5 text-right font-mono">{formatMoney(dreCalculations.ebitda)}</td>
                                            <td className="px-4 py-2.5 text-right font-mono">{dreCalculations.grossRev > 0 ? ((dreCalculations.ebitda / dreCalculations.grossRev) * 100).toFixed(1) : 0}%</td>
                                        </tr>
                                        <tr>
                                            <td className="px-4 py-2.5 pl-8 text-slate-500">(-) Depreciação e Amortizações</td>
                                            <td className="px-4 py-2.5 text-right font-mono text-rose-600">-{formatMoney(dreCalculations.depreciation)}</td>
                                            <td className="px-4 py-2.5 text-right font-mono">{dreCalculations.grossRev > 0 ? ((dreCalculations.depreciation / dreCalculations.grossRev) * 100).toFixed(1) : 0}%</td>
                                        </tr>
                                        <tr>
                                            <td className="px-4 py-2.5 pl-8 text-slate-500">(-) Resultado Financeiro Líquido</td>
                                            <td className="px-4 py-2.5 text-right font-mono text-rose-600">-{formatMoney(dreCalculations.financialExpenses)}</td>
                                            <td className="px-4 py-2.5 text-right font-mono">{dreCalculations.grossRev > 0 ? ((dreCalculations.financialExpenses / dreCalculations.grossRev) * 100).toFixed(1) : 0}%</td>
                                        </tr>
                                        <tr>
                                            <td className="px-4 py-2.5 pl-8 text-slate-500">(-) Provisão para IRPJ e CSLL</td>
                                            <td className="px-4 py-2.5 text-right font-mono text-rose-600">-{formatMoney(dreCalculations.taxesIRPJ)}</td>
                                            <td className="px-4 py-2.5 text-right font-mono">{dreCalculations.grossRev > 0 ? ((dreCalculations.taxesIRPJ / dreCalculations.grossRev) * 100).toFixed(1) : 0}%</td>
                                        </tr>
                                        <tr className="bg-slate-900 text-white font-black">
                                            <td className="px-4 py-3">5. LUCRO LÍQUIDO DO EXERCÍCIO</td>
                                            <td className={`px-4 py-3 text-right font-mono ${dreCalculations.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                {formatMoney(dreCalculations.netProfit)}
                                            </td>
                                            <td className={`px-4 py-3 text-right font-mono ${dreCalculations.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                {dreCalculations.netMargin.toFixed(1)}%
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        ) : dreViewMode === 'mensal' ? (
                            /* MODEL 3: DRE MENSAL COMPARATIVA (MATRICIAL) */
                            <div className="space-y-4 overflow-x-auto custom-scrollbar">
                                <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">
                                    Evolução Matricial de D.R.E. por Mês
                                </h3>

                                <table className="w-full text-xs">
                                    <thead className="bg-slate-50 dark:bg-slate-900 uppercase font-black text-slate-400 text-[10px]">
                                        <tr>
                                            <th className="px-4 py-3 text-left">Mês / Ano</th>
                                            <th className="px-4 py-3 text-right">Receita Bruta</th>
                                            <th className="px-4 py-3 text-right">Receita Líquida</th>
                                            <th className="px-4 py-3 text-right">Custos (CPV)</th>
                                            <th className="px-4 py-3 text-right">Lucro Bruto</th>
                                            <th className="px-4 py-3 text-right">Despesas Oper.</th>
                                            <th className="px-4 py-3 text-right">EBITDA</th>
                                            <th className="px-4 py-3 text-right">Lucro Líquido</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700 font-medium">
                                        {dreMonthlyMatrix.map((m, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                                                <td className="px-4 py-2.5 font-bold text-slate-900 dark:text-white">{m.label}</td>
                                                <td className="px-4 py-2.5 text-right font-mono font-bold text-emerald-600">{formatMoney(m.gross)}</td>
                                                <td className="px-4 py-2.5 text-right font-mono">{formatMoney(m.netRev)}</td>
                                                <td className="px-4 py-2.5 text-right font-mono text-rose-500">-{formatMoney(m.cpv)}</td>
                                                <td className="px-4 py-2.5 text-right font-mono font-bold">{formatMoney(m.grossProfit)}</td>
                                                <td className="px-4 py-2.5 text-right font-mono text-rose-500">-{formatMoney(m.opex)}</td>
                                                <td className="px-4 py-2.5 text-right font-mono font-bold text-cyan-600">{formatMoney(m.ebitda)}</td>
                                                <td className={`px-4 py-2.5 text-right font-mono font-black ${m.net >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                    {formatMoney(m.net)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            /* MODEL 4: DRE POR CENTRO DE CUSTO */
                            <div className="space-y-6 animate-in fade-in duration-300">
                                {/* Header com Descrição */}
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div>
                                        <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                            Resultado Econômico Discriminado por Centro de Custo / Obras & Usinas
                                        </h3>
                                        <p className="text-xs text-slate-400 mt-0.5">
                                            Apropriação e rateio operacional de receitas diretas, CPV fabril e despesas alocadas por projeto.
                                        </p>
                                    </div>
                                    <div className="text-xs font-bold px-3 py-1.5 bg-slate-100 dark:bg-slate-900 rounded-xl text-slate-600 dark:text-slate-300 w-fit">
                                        {dreCostCenterTotals.count} Centros Ativos
                                    </div>
                                </div>

                                {/* KPIs Executivos de Centros de Custo */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Receita Direta Total</span>
                                        <strong className="text-xl font-black font-mono text-cyan-600">{formatMoney(dreCostCenterTotals.totalGross)}</strong>
                                        <span className="text-[11px] text-slate-500 block mt-1">100% da Receita de Obras</span>
                                    </div>
                                    <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Custos Diretos (CPV)</span>
                                        <strong className="text-xl font-black font-mono text-rose-600">-{formatMoney(dreCostCenterTotals.totalCpv)}</strong>
                                        <span className="text-[11px] text-slate-500 block mt-1">Insumos, Mão de Obra e Frota</span>
                                    </div>
                                    <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Despesas Alocadas</span>
                                        <strong className="text-xl font-black font-mono text-purple-600">-{formatMoney(dreCostCenterTotals.totalOpex)}</strong>
                                        <span className="text-[11px] text-slate-500 block mt-1">Rateio Administrativo</span>
                                    </div>
                                    <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Resultado Consolidado</span>
                                        <strong className={`text-xl font-black font-mono ${dreCostCenterTotals.totalResult >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                            {formatMoney(dreCostCenterTotals.totalResult)}
                                        </strong>
                                        <span className="text-[11px] font-bold text-slate-500 block mt-1">Margem Ponderada: {dreCostCenterTotals.totalMarginPct}</span>
                                    </div>
                                </div>

                                {/* Gráfico Comparativo Recharts BarChart */}
                                {dreByCostCenter.length > 0 && (
                                    <div className="p-5 bg-slate-50/60 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-700">
                                        <div className="flex items-center justify-between mb-4">
                                            <h4 className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
                                                <BarChart3 size={16} className="text-cyan-600" />
                                                Comparativo de Desempenho por Centro de Custo
                                            </h4>
                                            <span className="text-[11px] text-slate-400">Receita vs Custos Totais vs Resultado</span>
                                        </div>
                                        <div className="h-64 w-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart
                                                    data={dreByCostCenter.map(c => ({
                                                        name: c.center.length > 18 ? c.center.substring(0, 18) + '...' : c.center,
                                                        Receita: c.gross,
                                                        Gastos: c.cpv + c.opex,
                                                        Resultado: c.result
                                                    }))}
                                                    margin={{ top: 10, right: 10, left: 10, bottom: 25 }}
                                                >
                                                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                                                    <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-15} textAnchor="end" />
                                                    <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                                                    <Tooltip formatter={(value: number) => [formatMoney(value), '']} />
                                                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                                                    <Bar dataKey="Receita" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                                                    <Bar dataKey="Gastos" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                                                    <Bar dataKey="Resultado" fill="#10b981" radius={[4, 4, 0, 0]} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                )}

                                {/* Tabela Estruturada com Rodapé Totalizador */}
                                <div className="overflow-x-auto custom-scrollbar rounded-2xl border border-slate-200 dark:border-slate-700">
                                    <table className="w-full text-xs">
                                        <thead className="bg-slate-50 dark:bg-slate-900 uppercase font-black text-slate-400 text-[10px]">
                                            <tr>
                                                <th className="px-4 py-3 text-left">Centro de Custo / Unidade</th>
                                                <th className="px-4 py-3 text-right">Receita Direta</th>
                                                <th className="px-4 py-3 text-right">Custos Diretos (CPV)</th>
                                                <th className="px-4 py-3 text-right">Despesas Alocadas</th>
                                                <th className="px-4 py-3 text-right">Resultado Operacional</th>
                                                <th className="px-4 py-3 text-right">Margem %</th>
                                                <th className="px-4 py-3 text-center w-36">Desempenho</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700 font-medium bg-white dark:bg-slate-800">
                                            {dreByCostCenter.map((c, idx) => {
                                                const marginNum = parseFloat(c.margin);
                                                const isSuperavit = !isNaN(marginNum) && marginNum >= 20;
                                                const isHealthy = !isNaN(marginNum) && marginNum >= 10 && marginNum < 20;
                                                const isTight = !isNaN(marginNum) && marginNum >= 0 && marginNum < 10;
                                                const isDeficit = !isNaN(marginNum) && marginNum < 0;

                                                return (
                                                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                                        <td className="px-4 py-3 font-bold text-slate-900 dark:text-white uppercase flex items-center gap-2">
                                                            <span className="w-2 h-2 rounded-full bg-cyan-500"></span>
                                                            {c.center}
                                                        </td>
                                                        <td className="px-4 py-3 text-right font-mono font-bold text-emerald-600">{formatMoney(c.gross)}</td>
                                                        <td className="px-4 py-3 text-right font-mono text-rose-500">-{formatMoney(c.cpv)}</td>
                                                        <td className="px-4 py-3 text-right font-mono text-rose-500">-{formatMoney(c.opex)}</td>
                                                        <td className={`px-4 py-3 text-right font-mono font-black ${c.result >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                            {formatMoney(c.result)}
                                                        </td>
                                                        <td className="px-4 py-3 text-right font-mono font-bold">{c.margin}</td>
                                                        <td className="px-4 py-3 text-center">
                                                            <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase ${
                                                                isSuperavit
                                                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                                                    : isHealthy
                                                                    ? 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950/60 dark:text-cyan-300'
                                                                    : isTight
                                                                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                                                                    : isDeficit
                                                                    ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                                                                    : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                                                            }`}>
                                                                {isSuperavit ? 'Superavitária' : isHealthy ? 'Saudável' : isTight ? 'Margem Estreita' : isDeficit ? 'Déficit' : 'N/A'}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                        {/* Rodapé Totalizador Consolidado */}
                                        <tfoot className="bg-slate-900 text-white font-black text-xs border-t-2 border-cyan-500">
                                            <tr>
                                                <td className="px-4 py-3.5 uppercase tracking-wide flex items-center gap-2">
                                                    <CheckCircle size={14} className="text-cyan-400" />
                                                    CONSOLIDADO GERAL (TOTAL EMPRESA)
                                                </td>
                                                <td className="px-4 py-3.5 text-right font-mono text-emerald-400">
                                                    {formatMoney(dreCostCenterTotals.totalGross)}
                                                </td>
                                                <td className="px-4 py-3.5 text-right font-mono text-rose-300">
                                                    -{formatMoney(dreCostCenterTotals.totalCpv)}
                                                </td>
                                                <td className="px-4 py-3.5 text-right font-mono text-rose-300">
                                                    -{formatMoney(dreCostCenterTotals.totalOpex)}
                                                </td>
                                                <td className={`px-4 py-3.5 text-right font-mono text-sm ${dreCostCenterTotals.totalResult >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                    {formatMoney(dreCostCenterTotals.totalResult)}
                                                </td>
                                                <td className="px-4 py-3.5 text-right font-mono text-cyan-300 text-sm">
                                                    {dreCostCenterTotals.totalMarginPct}
                                                </td>
                                                <td className="px-4 py-3.5 text-center">
                                                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase ${
                                                        dreCostCenterTotals.totalResult >= 0
                                                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                                    }`}>
                                                        {dreCostCenterTotals.totalResult >= 0 ? 'Resultado Positivo' : 'Resultado Negativo'}
                                                    </span>
                                                </td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            ) : activeTab === 'chart_of_accounts' ? (
                /* =========================================================================
                    TAB 3: PLANO DE CONTAS COM CABEÇALHO CORPORATIVO
                ========================================================================= */
                <div className="flex flex-col gap-6 animate-in slide-in-from-right duration-300">
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 space-y-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                                    <BookOpen size={24} className="text-cyan-600" />
                                    Plano de Contas & Demonstração Contábil
                                </h2>
                                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                                    Estrutura hierárquica oficial para classificação orçamentária e conciliação de receitas e despesas.
                                </p>
                            </div>
                            <div className="flex gap-3 items-end">
                                <div>
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Início</label>
                                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold px-3 py-2" />
                                </div>
                                <div>
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Fim</label>
                                    <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold px-3 py-2" />
                                </div>
                                <button
                                    onClick={handlePrintPoaReport}
                                    className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center gap-2"
                                >
                                    <Printer size={15} /> Imprimir com Cabeçalho Corporativo
                                </button>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="relative flex-1">
                                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Filtrar contas contábeis por código ou nome..."
                                    value={poaSearchTerm}
                                    onChange={e => setPoaSearchTerm(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                                />
                            </div>
                            <button onClick={expandAll} className="px-3.5 py-2 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-200 transition-colors" title="Expandir Tudo">
                                <Maximize2 size={16} />
                            </button>
                            <button onClick={collapseAll} className="px-3.5 py-2 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-200 transition-colors" title="Recolher Tudo">
                                <Minimize2 size={16} />
                            </button>
                        </div>
                    </div>

                    {/* Report Content */}
                    <div id="poa-report-content" className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 min-h-[600px]">
                        <div className="space-y-6">
                            {planOfAccounts.map(group => {
                                const getGroupTotal = (node: any): number => {
                                    const selfTotal = transactions
                                        .filter(t => (t.ledgerCode === node.code || t.category === node.name || t.ledgerName === node.name) && t.status !== 'Cancelado')
                                        .filter(t => {
                                            const txDate = parseDateString(t.date);
                                            const start = new Date(startDate);
                                            const end = new Date(endDate);
                                            end.setHours(23, 59, 59, 999);
                                            return txDate >= start && txDate <= end;
                                        })
                                        .reduce((acc, t) => acc + t.amount, 0);

                                    const childrenTotal = (node.children || []).reduce((acc: number, c: any) => acc + getGroupTotal(c), 0);
                                    return selfTotal + childrenTotal;
                                };

                                const groupTotal = getGroupTotal(group);

                                const matchesSearch = (node: any): boolean => {
                                    if (!poaSearchTerm) return true;
                                    const nameMatch = node.name?.toLowerCase().includes(poaSearchTerm.toLowerCase());
                                    const codeMatch = node.code?.toLowerCase().includes(poaSearchTerm.toLowerCase());
                                    const childrenMatch = (node.children || []).some((c: any) => matchesSearch(c));
                                    return nameMatch || codeMatch || childrenMatch;
                                };

                                if (!matchesSearch(group)) return null;

                                const isRevenue = group.type === 'Receita';
                                const colorClass = isRevenue ? 'text-emerald-600' : 'text-rose-600';
                                const bgClass = isRevenue ? 'bg-emerald-50 dark:bg-emerald-900/10' : 'bg-rose-50 dark:bg-rose-900/10';
                                const isExpanded = expandedNodes[group.id] !== false;

                                return (
                                    <div key={group.id} className="space-y-2 border border-slate-100 dark:border-slate-700 rounded-2xl overflow-hidden">
                                        <div
                                            className={`flex items-center justify-between p-4 ${bgClass} transition-all cursor-pointer`}
                                            onClick={() => toggleNode(group.id)}
                                        >
                                            <div className="flex items-center gap-3">
                                                <button className={`p-1 rounded-lg ${colorClass}`}>
                                                    {isExpanded ? <Minus size={16} /> : <Plus size={16} />}
                                                </button>
                                                <span className={`font-mono font-black text-sm ${colorClass}`}>{group.code}</span>
                                                <h3 className="text-base font-black text-slate-900 dark:text-white uppercase">{group.name}</h3>
                                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white dark:bg-slate-800 text-slate-500 uppercase border border-slate-200 dark:border-slate-700">
                                                    Sintética
                                                </span>
                                            </div>
                                            <span className={`font-mono font-black text-sm ${colorClass}`}>
                                                {formatMoney(groupTotal)}
                                            </span>
                                        </div>

                                        {isExpanded && group.children && (
                                            <div className="p-2 space-y-1 bg-white dark:bg-slate-800">
                                                {group.children.map((child: any) => {
                                                    const childTotal = transactions
                                                        .filter(t => (t.ledgerCode === child.code || t.category === child.name || t.ledgerName === child.name) && t.status !== 'Cancelado')
                                                        .filter(t => {
                                                            const txDate = parseDateString(t.date);
                                                            const start = new Date(startDate);
                                                            const end = new Date(endDate);
                                                            end.setHours(23, 59, 59, 999);
                                                            return txDate >= start && txDate <= end;
                                                        })
                                                        .reduce((acc, t) => acc + t.amount, 0);

                                                    return (
                                                        <div key={child.id} className="flex justify-between items-center py-2 px-6 hover:bg-slate-50 dark:hover:bg-slate-700/40 rounded-xl text-xs transition-colors">
                                                            <div className="flex items-center gap-3">
                                                                <span className="font-mono text-slate-400 font-bold">{child.code}</span>
                                                                <span className="text-slate-700 dark:text-slate-300 font-semibold">{child.name}</span>
                                                            </div>
                                                            <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                                                                {formatMoney(childTotal)}
                                                            </span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            ) : (
                /* =========================================================================
                    TAB 4: CENTRAL DE RELATÓRIOS COM BARRA DE PERSONALIZAÇÃO AVANÇADA
                ========================================================================= */
                <div className="flex flex-col gap-6 animate-in slide-in-from-right duration-300">
                    {/* Filter and Category Pills */}
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col md:flex-row gap-4 items-center justify-between">
                        <div className="flex-1 relative w-full">
                            <input
                                type="text"
                                placeholder="Buscar relatório por nome ou descrição..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-cyan-500/20"
                            />
                            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                            {searchTerm && (
                                <button
                                    onClick={() => setSearchTerm('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                    <X size={16} />
                                </button>
                            )}
                        </div>
                        <div className="flex gap-2 flex-wrap">
                            {['Todos', 'Comercial', 'Financeiro', 'Estoque', 'Produção', 'Clientes', 'Compras', 'Frota', 'RH', 'Contábil', 'Gerencial'].map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setCategoryFilter(cat)}
                                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${categoryFilter === cat
                                        ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/20'
                                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                                        }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Report Configurator Preview & Parameters with Customization Toolbar */}
                    {selectedModule && (
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 space-y-6">
                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-700">
                                <div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-cyan-600 bg-cyan-50 dark:bg-cyan-900/40 px-2.5 py-1 rounded-md">
                                        {modules.find(m => m.id === selectedModule)?.category}
                                    </span>
                                    <h2 className="text-2xl font-black text-slate-900 dark:text-white mt-2 flex items-center gap-2">
                                        {modules.find(m => m.id === selectedModule)?.icon}
                                        {modules.find(m => m.id === selectedModule)?.name}
                                    </h2>
                                    <p className="text-xs text-slate-500 mt-1">
                                        {modules.find(m => m.id === selectedModule)?.description}
                                    </p>
                                </div>

                                <div className="flex flex-wrap items-center gap-3">
                                    <div>
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Data Início</label>
                                        <input
                                            type="date"
                                            value={startDate}
                                            onChange={e => setStartDate(e.target.value)}
                                            className="p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Data Fim</label>
                                        <input
                                            type="date"
                                            value={endDate}
                                            onChange={e => setEndDate(e.target.value)}
                                            className="p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                                        />
                                    </div>

                                    {/* Customizer Drawer Trigger */}
                                    <button
                                        onClick={() => setShowCustomizer(prev => !prev)}
                                        className={`mt-4 px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm ${showCustomizer ? 'bg-cyan-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200'}`}
                                    >
                                        <SlidersHorizontal size={15} /> Personalizar
                                    </button>

                                    <button
                                        onClick={handleExportCorporateCSV}
                                        className="mt-4 px-4 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl hover:bg-slate-200 transition-colors flex items-center gap-1.5 shadow-sm"
                                    >
                                        <Download size={15} /> Exportar Excel
                                    </button>
                                    <button
                                        onClick={handlePrintReport}
                                        className="mt-4 px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-black text-xs rounded-xl shadow-lg shadow-cyan-600/20 transition-all flex items-center gap-2"
                                    >
                                        <Printer size={16} /> Imprimir Relatório
                                    </button>
                                    <button
                                        onClick={() => setSelectedModule(null)}
                                        className="mt-4 p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-colors cursor-pointer"
                                        title="Fechar visualização"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>
                            </div>

                            {/* ADVANCED CUSTOMIZATION TOOLBAR PANEL */}
                            {showCustomizer && (
                                <div className="p-5 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-cyan-500/30 space-y-4 animate-in fade-in duration-200">
                                    <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-3">
                                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-white flex items-center gap-2">
                                            <SlidersHorizontal size={14} className="text-cyan-600" />
                                            Personalização do Relatório (Preferências Salvas Automaticamente)
                                        </h4>
                                        <button onClick={() => setShowCustomizer(false)} className="text-slate-400 hover:text-slate-600">
                                            <X size={14} />
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        {/* Column Selector */}
                                        <div>
                                            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-2">
                                                Colunas Visíveis ({visibleColumns.length} de {modules.find(m => m.id === selectedModule)?.fields.length})
                                            </label>
                                            <div className="space-y-1.5 max-h-40 overflow-y-auto custom-scrollbar p-1">
                                                {modules.find(m => m.id === selectedModule)?.fields.map(col => {
                                                    const isChecked = visibleColumns.includes(col);
                                                    return (
                                                        <label
                                                            key={col}
                                                            onClick={() => toggleColumn(col)}
                                                            className={`flex items-center gap-2 p-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${isChecked ? 'bg-white dark:bg-slate-800 text-cyan-600 shadow-xs' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                                                        >
                                                            {isChecked ? <CheckSquare size={14} className="text-cyan-600" /> : <Square size={14} className="text-slate-400" />}
                                                            <span>{col}</span>
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* Contextual Status Filter */}
                                        <div>
                                            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-2">
                                                Filtro Específico por Status
                                            </label>
                                            <select
                                                value={statusFilter}
                                                onChange={e => {
                                                    setStatusFilter(e.target.value);
                                                    persistPreferences({ statusFilter: e.target.value });
                                                }}
                                                className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                                            >
                                                <option value="Todos">Todos os Status</option>
                                                {availableStatuses.map(st => (
                                                    <option key={st} value={st}>{st}</option>
                                                ))}
                                            </select>

                                            <div className="mt-4">
                                                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-2">
                                                    Ordenação Inicial
                                                </label>
                                                <div className="flex gap-2">
                                                    <select
                                                        value={sortField || ''}
                                                        onChange={e => {
                                                            const col = e.target.value || null;
                                                            setSortField(col);
                                                            persistPreferences({ sortField: col || undefined });
                                                        }}
                                                        className="flex-1 p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                                                    >
                                                        <option value="">Padrão</option>
                                                        {modules.find(m => m.id === selectedModule)?.fields.map(col => (
                                                            <option key={col} value={col}>{col}</option>
                                                        ))}
                                                    </select>
                                                    <button
                                                        onClick={() => {
                                                            const next = sortOrder === 'asc' ? 'desc' : 'asc';
                                                            setSortOrder(next);
                                                            persistPreferences({ sortOrder: next });
                                                        }}
                                                        className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50"
                                                        title="Alternar Ascendente / Descendente"
                                                    >
                                                        <ArrowUpDown size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Print Layout Options */}
                                        <div>
                                            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-2">
                                                Configuração de Impressão (PDF / A4)
                                            </label>
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => {
                                                            setPrintOrientation('portrait');
                                                            persistPreferences({ orientation: 'portrait' });
                                                        }}
                                                        className={`flex-1 p-2 rounded-xl text-xs font-bold border ${printOrientation === 'portrait' ? 'bg-cyan-600 text-white border-cyan-600' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'}`}
                                                    >
                                                        Retrato (Vertical)
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setPrintOrientation('landscape');
                                                            persistPreferences({ orientation: 'landscape' });
                                                        }}
                                                        className={`flex-1 p-2 rounded-xl text-xs font-bold border ${printOrientation === 'landscape' ? 'bg-cyan-600 text-white border-cyan-600' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'}`}
                                                    >
                                                        Paisagem (Largo)
                                                    </button>
                                                </div>

                                                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer pt-1">
                                                    <input
                                                        type="checkbox"
                                                        checked={printShowSignatures}
                                                        onChange={e => {
                                                            setPrintShowSignatures(e.target.checked);
                                                            persistPreferences({ showSignatures: e.target.checked });
                                                        }}
                                                        className="rounded text-cyan-600"
                                                    />
                                                    <span>Exibir Bloco de Assinaturas Formais</span>
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Table Preview */}
                            <div className="overflow-hidden border border-slate-100 dark:border-slate-700 rounded-2xl">
                                <div className="p-4 bg-slate-50 dark:bg-slate-900/50 flex justify-between items-center border-b border-slate-100 dark:border-slate-700">
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                        Pré-visualização dos Dados ({reportData.length} registros)
                                    </h4>
                                    <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400">
                                        {sortField && (
                                            <span className="text-cyan-600 flex items-center gap-1">
                                                Ordenado por: {sortField} ({sortOrder.toUpperCase()})
                                            </span>
                                        )}
                                        <span>Período: {formatDateBR(startDate)} a {formatDateBR(endDate)}</span>
                                    </div>
                                </div>
                                <div className="overflow-auto max-h-[450px] custom-scrollbar">
                                    <table className="w-full text-xs text-left">
                                        <thead className="bg-slate-50 dark:bg-slate-900 text-[10px] uppercase font-black text-slate-400 sticky top-0 z-10">
                                            <tr>
                                                {reportData.length > 0 ? Object.keys(reportData[0]).map(key => (
                                                    <th
                                                        key={key}
                                                        onClick={() => handleSort(key)}
                                                        className="px-4 py-3 whitespace-nowrap bg-slate-50 dark:bg-slate-900 cursor-pointer hover:text-cyan-600 select-none transition-colors"
                                                    >
                                                        <div className="flex items-center gap-1.5">
                                                            <span>{key}</span>
                                                            {sortField === key ? (
                                                                sortOrder === 'asc' ? <ChevronUp size={12} className="text-cyan-600" /> : <ChevronDown size={12} className="text-cyan-600" />
                                                            ) : (
                                                                <ArrowUpDown size={10} className="text-slate-300 opacity-60" />
                                                            )}
                                                        </div>
                                                    </th>
                                                )) : <th className="px-4 py-3 text-center">Dados</th>}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-gray-700">
                                            {reportData.length > 0 ? reportData.map((row, idx) => (
                                                <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-gray-700/40 transition-colors">
                                                    {Object.keys(row).map((key, i) => (
                                                        <td key={i} className="px-4 py-2.5 whitespace-nowrap font-medium text-slate-700 dark:text-slate-300">
                                                            {renderCellContent(key, row[key])}
                                                        </td>
                                                    ))}
                                                </tr>
                                            )) : (
                                                <tr>
                                                    <td colSpan={6} className="py-12 text-center text-slate-400">
                                                        Nenhum dado encontrado para os filtros selecionados.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Reports Grid by Category */}
                    {['Comercial', 'Financeiro', 'Estoque', 'Produção', 'Clientes', 'Compras', 'Frota', 'RH', 'Contábil', 'Gerencial'].map(category => {
                        const filteredModules = modules.filter(m => {
                            const matchCategory = m.category === category;
                            const matchFilter = categoryFilter === 'Todos' || m.category === categoryFilter;
                            const matchSearch = searchTerm === '' ||
                                m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                m.description?.toLowerCase().includes(searchTerm.toLowerCase());
                            return matchCategory && matchFilter && matchSearch;
                        });

                        if (filteredModules.length === 0) return null;

                        const categoryColors: Record<string, string> = {
                            'Comercial': 'from-cyan-500 to-blue-600',
                            'Financeiro': 'from-emerald-500 to-teal-600',
                            'Estoque': 'from-amber-500 to-orange-600',
                            'Produção': 'from-orange-500 to-red-600',
                            'Clientes': 'from-violet-500 to-purple-600',
                            'Compras': 'from-rose-500 to-pink-600',
                            'Frota': 'from-slate-600 to-slate-700',
                            'RH': 'from-indigo-500 to-blue-600',
                            'Contábil': 'from-green-600 to-emerald-700',
                            'Gerencial': 'from-purple-600 to-indigo-700'
                        };

                        return (
                            <div key={category} className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className={`w-2 h-7 rounded-full bg-gradient-to-b ${categoryColors[category]}`}></div>
                                    <h3 className="text-lg font-black text-slate-900 dark:text-white">{category}</h3>
                                    <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-500 text-[10px] font-bold rounded-full">
                                        {filteredModules.length} relatórios
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                    {filteredModules.map((m: any) => {
                                        const isSelected = selectedModule === m.id;

                                        return (
                                            <div
                                                key={m.id}
                                                onClick={() => setSelectedModule(prev => prev === m.id ? null : m.id)}
                                                className={`bg-white dark:bg-slate-800 rounded-2xl border ${isSelected ? 'border-cyan-500 ring-2 ring-cyan-500/20 shadow-md' : 'border-slate-200 dark:border-slate-700 hover:border-cyan-300'} p-5 cursor-pointer transition-all group`}
                                            >
                                                <div className="flex items-start gap-3 mb-3">
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md bg-gradient-to-br ${categoryColors[category]} shrink-0`}>
                                                        {React.cloneElement(m.icon as any, { size: 18 })}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="text-sm font-black text-slate-900 dark:text-white truncate">{m.name}</h4>
                                                        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">{m.description}</p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-700 text-xs">
                                                    <span className="text-[10px] font-bold text-slate-400">
                                                        {(m.fields as string[]).length} colunas
                                                    </span>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setSelectedModule(m.id);
                                                            handlePrintReport();
                                                        }}
                                                        className="px-3 py-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-lg hover:bg-cyan-50 hover:text-cyan-600 transition-colors flex items-center gap-1 text-[10px]"
                                                    >
                                                        <Printer size={12} /> Emitir
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default Reports;
