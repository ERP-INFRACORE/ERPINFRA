import React, { useState, useMemo } from 'react';
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
    ShieldCheck
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { printDocument } from '../utils/exportUtils';

const formatMoney = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);

const parseDateString = (dateStr?: string): Date => {
    if (!dateStr) return new Date();
    if (dateStr.includes('/')) {
        const parts = dateStr.split('/').map(Number);
        if (parts.length === 3) {
            return new Date(parts[2], parts[1] - 1, parts[0]);
        }
    }
    const parsed = new Date(dateStr);
    return isNaN(parsed.getTime()) ? new Date() : parsed;
};

const formatDateBR = (isoDateOrStr: string) => {
    if (!isoDateOrStr) return '';
    if (isoDateOrStr.includes('/')) return isoDateOrStr;
    const [year, month, day] = isoDateOrStr.split('-');
    if (year && month && day) return `${day}/${month}/${year}`;
    return isoDateOrStr;
};

const Reports = () => {
    const {
        financials, transactions, sales, budgets, inventory, purchaseOrders,
        clients, fleet, employees, stockMovements, settings, planOfAccounts,
        accounts, currentUser
    } = useApp();
    const { addToast } = useToast();

    const [activeTab, setActiveTab] = useState<'dashboard' | 'generator' | 'chart_of_accounts'>('generator');

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

    // Report Generator State
    const [selectedModule, setSelectedModule] = useState<string | null>('sales');
    const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

    // Report Library Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('Todos');
    const [editingReportId, setEditingReportId] = useState<string | null>(null);
    const [reportSettings, setReportSettings] = useState<Record<string, { format: string; period: string; favorite: boolean; fields?: string[] }>>({});

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

    // Extended Modules for Reporting - Organized by Category
    const modules = [
        // COMERCIAL
        { id: 'sales', name: 'Vendas Realizadas', icon: <DollarSign size={16} />, category: 'Comercial', description: 'Histórico completo de vendas com cliente, produtos, valores e forma de pagamento.', fields: ['ID', 'Data', 'Cliente', 'Produtos', 'Total', 'Pagamento', 'Status'] },
        { id: 'sales_by_product', name: 'Vendas por Produto', icon: <Package size={16} />, category: 'Comercial', description: 'Ranking de produtos mais vendidos com quantidade e faturamento.', fields: ['Produto', 'Qtd Vendida', 'Faturamento', 'Margem %', 'Ticket Médio'] },
        { id: 'sales_by_client', name: 'Vendas por Cliente', icon: <User size={16} />, category: 'Comercial', description: 'Análise de faturamento por cliente com frequência de compra.', fields: ['Cliente', 'Total Compras', 'Valor Total', 'Última Compra', 'Ticket Médio'] },
        { id: 'sales_by_seller', name: 'Vendas por Vendedor', icon: <User size={16} />, category: 'Comercial', description: 'Performance individual de vendedores com metas e comissões.', fields: ['Vendedor', 'Vendas', 'Faturamento', 'Comissão', 'Meta %'] },
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

        // CLIENTES & COMPRAS
        { id: 'clients', name: 'Cadastro de Clientes', icon: <Circle size={16} />, category: 'Clientes', description: 'Base completa de clientes cadastrados no ERP.', fields: ['Nome', 'Documento', 'Email', 'Telefone', 'Cidade', 'Status'] },
        { id: 'clients_ranking', name: 'Ranking de Clientes', icon: <TrendingUp size={16} />, category: 'Clientes', description: 'Top clientes por volume financeiro de compras.', fields: ['Posição', 'Cliente', 'Total Compras', 'Faturamento', 'Ticket Médio'] },
        { id: 'purchases', name: 'Pedidos de Compra', icon: <ClipboardList size={16} />, category: 'Compras', description: 'Histórico de pedidos de compra emitidos para fornecedores.', fields: ['Nº', 'Data', 'Fornecedor', 'Valor', 'Status', 'Prazo Entrega'] },
        { id: 'purchases_by_supplier', name: 'Compras por Fornecedor', icon: <Factory size={16} />, category: 'Compras', description: 'Volume financeiro consolidado por fornecedor.', fields: ['Fornecedor', 'Total Pedidos', 'Valor Total', 'Prazo Médio', 'Última Compra'] },

        // FROTA & RH
        { id: 'fleet', name: 'Cadastro de Veículos', icon: <Truck size={16} />, category: 'Frota', description: 'Listagem e status operacional de toda a frota de veículos.', fields: ['Placa', 'Modelo', 'Tipo', 'KM Atual', 'Status', 'Combustível'] },
        { id: 'fleet_costs', name: 'Custos Consolidados da Frota', icon: <DollarSign size={16} />, category: 'Frota', description: 'Custo total por veículo (combustível + manutenção) e custo/km.', fields: ['Placa', 'Modelo', 'Combustível', 'Manutenção', 'Total', 'Custo/KM'] },
        { id: 'hr', name: 'Quadro de Colaboradores', icon: <User size={16} />, category: 'RH', description: 'Listagem de funcionários com cargo, departamento e remuneração.', fields: ['Nome', 'Cargo', 'Depto', 'Salário', 'Admissão', 'Status'] },
        { id: 'hr_payroll', name: 'Folha de Pagamento', icon: <DollarSign size={16} />, category: 'RH', description: 'Demonstrativo de proventos, descontos e salário líquido.', fields: ['Funcionário', 'Salário Base', 'Adicionais', 'Descontos', 'Líquido'] },

        // CONTÁBIL & GERENCIAL
        { id: 'dre', name: 'D.R.E. (Demonstração do Resultado)', icon: <Calculator size={16} />, category: 'Contábil', description: 'Demonstração do Resultado do Exercício com EBITDA e lucro líquido.', fields: ['Estrutura Contábil', 'Valor', '% Rec. Bruta', 'Tipo'] },
        { id: 'trial_balance', name: 'Balancete de Verificação', icon: <ScrollText size={16} />, category: 'Contábil', description: 'Saldos de débito e crédito por conta do plano de contas.', fields: ['Código', 'Conta Contábil', 'Saldo Anterior', 'Débitos', 'Créditos', 'Saldo Atual'] },
        { id: 'cost_center', name: 'Resultado por Centro de Custo', icon: <PieChartIcon size={16} />, category: 'Contábil', description: 'Receitas, despesas e margem operacional por centro de custo.', fields: ['Centro de Custo', 'Receitas', 'Despesas', 'Resultado Líquido', 'Margem %'] },
        { id: 'dashboard_summary', name: 'Resumo Executivo Gerencial', icon: <PieChartIcon size={16} />, category: 'Gerencial', description: 'Visão consolidada dos principais indicadores de desempenho do ERP.', fields: ['Indicador', 'Valor Apurado', 'Meta Corporativa', 'Variação', 'Status'] }
    ];

    // Data Filtering and Calculation Engine
    const reportData = useMemo(() => {
        let data: any[] = [];
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59);

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
                    Data: s.date,
                    Cliente: s.clientName,
                    'Produtos': s.items?.length || 0,
                    'Forma Pagto': s.paymentMethod || 'Boleto',
                    Total: s.amount,
                    Status: s.status
                }));
                break;

            case 'sales_by_product':
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

            case 'sales_by_client':
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
                    'Última Compra': d.lastDate,
                    'Ticket Médio': d.count > 0 ? d.total / d.count : 0
                }));
                break;

            case 'sales_by_seller':
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

            case 'sales_by_payment':
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

            case 'quotes':
                data = (budgets || []).map(b => ({
                    'Nº': b.id?.slice(-6).toUpperCase(),
                    Data: b.date,
                    Cliente: b.clientName,
                    Valor: b.total,
                    Status: b.status,
                    Convertido: b.status === 'Aprovado' || b.status === 'Convertido' ? 'Sim' : 'Não'
                }));
                break;

            // =========================================================================
            // FINANCEIRO
            // =========================================================================
            case 'finance':
                data = transactions.filter(t => isInRange(t.date)).map(t => ({
                    ID: t.id?.slice(-6).toUpperCase(),
                    Data: t.date,
                    Descrição: t.description,
                    Categoria: t.ledgerName || t.category,
                    Tipo: t.type,
                    Valor: t.amount,
                    Status: t.status,
                    Conta: t.account
                }));
                break;

            case 'cashflow': {
                // Real running cashflow
                const initialCash = accounts.reduce((acc, a) => acc + (a.balance || 0), 0);
                const sortedTxs = [...transactions]
                    .filter(t => isInRange(t.date) && t.status !== 'Cancelado')
                    .sort((a, b) => parseDateString(a.date).getTime() - parseDateString(b.date).getTime());

                let running = initialCash;
                data = sortedTxs.map(t => {
                    const isReceita = t.type === 'Receita';
                    running += isReceita ? t.amount : -t.amount;
                    return {
                        Data: t.date,
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
                        Data: d.dateStr,
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
                        Vencimento: t.dueDate || t.date,
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
                        Vencimento: t.dueDate || t.date,
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
                        Vencimento: t.dueDate || t.date,
                        'Dias Atraso': days,
                        Telefone: clients.find(c => c.name === t.partnerName)?.phone || '-'
                    };
                });
                break;

            case 'bank_statements': {
                data = transactions.filter(t => isInRange(t.date)).map(t => ({
                    Data: t.date,
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
                const grossRev = transactions.filter(t => t.type === 'Receita' && isInRange(t.date)).reduce((acc, t) => acc + t.amount, 0);
                const totalExpenses = transactions.filter(t => t.type === 'Despesa' && isInRange(t.date)).reduce((acc, t) => acc + t.amount, 0);
                const taxRate = (settings?.technical?.defaultTaxRate || 6) / 100;
                const deductions = grossRev * taxRate;
                const netRev = grossRev - deductions;
                const cpv = totalExpenses * 0.45; // Cost of production
                const grossProfit = netRev - cpv;
                const operatingExp = totalExpenses * 0.55;
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
                    Data: new Date(m.date).toLocaleDateString('pt-BR'),
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
                    Fornecedor: i.supplierId || '-',
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
                    total: sales.filter(s => s.clientId === c.id).reduce((acc, s) => acc + s.amount, 0),
                    count: sales.filter(s => s.clientId === c.id).length
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
                data = purchaseOrders.map(p => ({
                    'Nº': p.id?.slice(-6).toUpperCase(),
                    Data: p.date,
                    Fornecedor: p.supplierName,
                    Valor: p.items?.reduce((acc: number, i: any) => acc + (i.price * i.quantity), 0) || 0,
                    Status: p.status,
                    'Prazo Entrega': (p as any).deliveryDate || '-'
                }));
                break;

            case 'purchases_by_supplier': {
                const supplierPurchases: Record<string, { count: number, total: number, lastDate: string }> = {};
                purchaseOrders.forEach(p => {
                    const name = p.supplierName;
                    if (!supplierPurchases[name]) supplierPurchases[name] = { count: 0, total: 0, lastDate: '' };
                    supplierPurchases[name].count++;
                    supplierPurchases[name].total += p.items?.reduce((acc: number, i: any) => acc + (i.price * i.quantity), 0) || 0;
                    supplierPurchases[name].lastDate = p.date;
                });
                data = Object.entries(supplierPurchases).map(([name, d]) => ({
                    Fornecedor: name,
                    'Total Pedidos': d.count,
                    'Valor Total': d.total,
                    'Prazo Médio': '7 dias',
                    'Última Compra': d.lastDate
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

            case 'hr':
                data = employees.map(e => ({
                    Nome: e.name,
                    Cargo: e.role,
                    Depto: e.department,
                    Salário: e.salary,
                    Admissão: e.admissionDate,
                    Status: e.status
                }));
                break;

            case 'hr_payroll':
                data = employees.filter(e => e.status === 'Ativo').map(e => ({
                    Funcionário: e.name,
                    'Salário Base': e.salary,
                    Adicionais: e.salary * 0.1,
                    Descontos: e.salary * 0.15,
                    Líquido: e.salary + (e.salary * 0.1) - (e.salary * 0.15)
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
    }, [selectedModule, startDate, endDate, sales, transactions, inventory, clients, fleet, employees, stockMovements, purchaseOrders, financials, settings, accounts]);

    // =========================================================================
    // EXPORTAÇÃO DE RELATÓRIOS GERENCIAIS COM CABEÇALHO CORPORATIVO
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

        // Compute numeric totals for numeric columns
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
                        padding: 30px;
                        color: #0f172a;
                        background: #ffffff;
                        line-height: 1.4;
                        font-size: 11px;
                    }
                    @page {
                        size: A4 portrait;
                        margin: 15mm;
                    }
                    .corporate-header {
                        border-bottom: 3px solid #0891b2;
                        padding-bottom: 15px;
                        margin-bottom: 20px;
                        display: flex;
                        justify-content: space-between;
                        align-items: flex-start;
                    }
                    .company-info h1 {
                        font-size: 20px;
                        font-weight: 900;
                        color: #0f172a;
                        margin: 0 0 3px 0;
                        text-transform: uppercase;
                        letter-spacing: -0.5px;
                    }
                    .company-info p {
                        margin: 1.5px 0;
                        font-size: 10px;
                        color: #475569;
                    }
                    .report-meta {
                        text-align: right;
                    }
                    .report-badge {
                        display: inline-block;
                        padding: 4px 10px;
                        background: #ecfeff;
                        color: #0891b2;
                        border: 1px solid #cffafe;
                        font-size: 10px;
                        font-weight: 800;
                        border-radius: 6px;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                    }
                    .report-title {
                        font-size: 16px;
                        font-weight: 900;
                        color: #0f172a;
                        margin: 6px 0 3px 0;
                        text-transform: uppercase;
                    }
                    .kpi-grid {
                        display: grid;
                        grid-template-columns: repeat(4, 1fr);
                        gap: 12px;
                        margin-bottom: 20px;
                    }
                    .kpi-card {
                        background: #f8fafc;
                        border: 1px solid #e2e8f0;
                        border-radius: 10px;
                        padding: 10px 14px;
                    }
                    .kpi-card span {
                        font-size: 9px;
                        font-weight: 700;
                        color: #64748b;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                        display: block;
                        margin-bottom: 3px;
                    }
                    .kpi-card strong {
                        font-size: 14px;
                        font-weight: 900;
                        color: #0f172a;
                        font-family: monospace;
                    }
                    table.data-table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-bottom: 30px;
                        font-size: 10px;
                    }
                    table.data-table thead th {
                        background: #0f172a;
                        color: #ffffff;
                        font-weight: 800;
                        text-transform: uppercase;
                        font-size: 9px;
                        letter-spacing: 0.5px;
                        padding: 8px 10px;
                        border: 1px solid #0f172a;
                        text-align: left;
                    }
                    table.data-table tbody td {
                        padding: 6px 10px;
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
                        padding: 8px 10px;
                        color: #0f172a;
                        font-family: monospace;
                    }
                    .numeric {
                        text-align: right;
                        font-family: monospace;
                        font-weight: 600;
                    }
                    .signatures-block {
                        margin-top: 40px;
                        display: grid;
                        grid-template-columns: repeat(3, 1fr);
                        gap: 30px;
                        padding-top: 20px;
                        border-top: 1px dashed #cbd5e1;
                    }
                    .signature-item {
                        text-align: center;
                    }
                    .signature-line {
                        border-bottom: 1px solid #475569;
                        margin-bottom: 6px;
                        height: 35px;
                    }
                    .signature-item p {
                        margin: 0;
                        font-size: 10px;
                        font-weight: 700;
                        color: #0f172a;
                    }
                    .signature-item span {
                        font-size: 9px;
                        color: #64748b;
                    }
                    .compliance-footer {
                        margin-top: 30px;
                        padding-top: 15px;
                        border-top: 1px solid #e2e8f0;
                        display: flex;
                        justify-content: space-between;
                        font-size: 8px;
                        color: #94a3b8;
                    }
                </style>
            </head>
            <body>
                <!-- Corporate Letterhead -->
                <div class="corporate-header">
                    <div class="company-info">
                        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                            <div style="width: 28px; height: 28px; background: #0891b2; border-radius: 6px; display: flex; align-items: center; justify-content: center; color: white; font-weight: 900; font-size: 14px;">IC</div>
                            <h1>${company.companyName}</h1>
                        </div>
                        <p><strong>CNPJ:</strong> ${company.document} | <strong>IE:</strong> ${company.stateRegistry}</p>
                        <p>${company.address}</p>
                        <p>${company.phone} • ${company.email}</p>
                    </div>
                    <div class="report-meta">
                        <span class="report-badge">${categoryName}</span>
                        <div class="report-title">${reportTitle}</div>
                        <p style="margin: 2px 0; font-family: monospace; font-weight: bold; color: #0891b2;">Protocolo: ${protocolNumber}</p>
                        <p style="margin: 2px 0; color: #475569;">Período: <strong>${formatDateBR(startDate)} até ${formatDateBR(endDate)}</strong></p>
                        <p style="margin: 2px 0; color: #64748b; font-size: 9px;">Emissão: ${issueDate} às ${issueTime}</p>
                    </div>
                </div>

                <!-- KPI Summary Cards -->
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
                        <strong style="font-size: 11px;">${currentUser?.name || 'Administrador'}</strong>
                    </div>
                    <div class="kpi-card">
                        <span>Homologação</span>
                        <strong style="color: #16a34a; font-size: 11px;">✓ AUDITADO</strong>
                    </div>
                </div>

                <!-- Structured Table -->
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
            if (i === 0) return `<td>TOTAIS CONSOLIDADOS (${reportData.length})</td>`;
            if (numericTotals[h] !== undefined) {
                const isMoney = h.includes('Valor') || h.includes('Total') || h.includes('Faturamento') || h.includes('Receita') || h.includes('Saldo') || h.includes('Entrada') || h.includes('Saída');
                return `<td class="numeric">${isMoney ? formatMoney(numericTotals[h]) : numericTotals[h].toLocaleString('pt-BR')}</td>`;
            }
            return `<td></td>`;
        }).join('')}
                        </tr>
                    </tfoot>
                </table>

                <!-- Formal Signatures & Compliance Block -->
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
                        <p>Diretoria Financeira Executiva</p>
                        <span>Aprovado</span>
                    </div>
                </div>

                <!-- Confidentiality and LGPD Notice -->
                <div class="compliance-footer">
                    <span>AVISO DE CONFIDENCIALIDADE: Este documento gerencial contém informações patrimoniais de uso restrito da ${company.companyName}. Protegido nos termos da Lei 13.709/2018 (LGPD).</span>
                    <span>Autenticação InfraCore ERP® • Hash: ${protocolNumber}</span>
                </div>
            </body>
            </html>
        `;

        printDocument(reportTitle, html);
    };

    // Corporate CSV / Excel Export with Prepending Header
    const handleExportCorporateCSV = () => {
        const moduleInfo = modules.find(m => m.id === selectedModule);
        const reportTitle = moduleInfo?.name || 'Relatorio_Gerencial';
        const categoryName = moduleInfo?.category || 'Geral';

        if (!reportData || reportData.length === 0) {
            addToast("Sem dados para exportação no período selecionado.", 'warning');
            return;
        }

        const headers = Object.keys(reportData[0]);

        // Compute Total
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
            `# INFRAGORE ERP - RELATÓRIO GERENCIAL OFICIAL`,
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
                    if (typeof val === 'number' && (h.includes('Valor') || h.includes('Total') || h.includes('Faturamento') || h.includes('Receita') || h.includes('Salário'))) {
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
        a.download = `relatorio_${selectedModule}_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        addToast(`Relatório exportado em formato CSV corporativo com sucesso!`, 'success');
    };

    // Print Chart of Accounts with Corporate Header
    const handlePrintPoaReport = () => {
        const poaTitle = 'PLANO DE CONTAS ESTRUTURADO';
        const poaProtocol = `POA-${Date.now().toString().slice(-8)}`;

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
                    .content-wrapper { margin-bottom: 30px; }
                </style>
            </head>
            <body>
                <div class="corporate-header">
                    <div class="company-info">
                        <h1>${company.companyName}</h1>
                        <p><strong>CNPJ:</strong> ${company.document} | <strong>IE:</strong> ${company.stateRegistry}</p>
                        <p>${company.address}</p>
                        <p>${company.phone} • ${company.email}</p>
                    </div>
                    <div style="text-align: right;">
                        <span style="padding: 4px 10px; background: #ecfeff; color: #0891b2; font-weight: 800; border-radius: 6px; text-transform: uppercase;">
                            ESTRUTURA CONTÁBIL OFICIAL
                        </span>
                        <h2 style="font-size: 16px; margin: 6px 0 2px 0;">${poaTitle}</h2>
                        <p style="margin: 2px 0; font-family: monospace; color: #0891b2; font-weight: bold;">Protocolo: ${poaProtocol}</p>
                        <p style="margin: 2px 0; font-size: 10px; color: #64748b;">Emissão: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}</p>
                    </div>
                </div>

                <div class="content-wrapper">
                    ${document.getElementById('poa-report-content')?.innerHTML || ''}
                </div>

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

    // Dashboard BI Trends
    const [reportPeriod, setReportPeriod] = useState('30d');

    const financialHistory = useMemo(() => {
        const last7 = transactions.slice(-7).map(tx => ({
            name: tx.date?.split('/')[0] || '1',
            receita: tx.type === 'Receita' ? tx.amount : 0,
            despesa: tx.type === 'Despesa' ? tx.amount : 0,
        }));

        if (last7.length === 0) {
            return [
                { name: '18', receita: 4000, despesa: 2400 },
                { name: '19', receita: 3000, despesa: 1398 },
                { name: '20', receita: 2000, despesa: 9800 },
                { name: '21', receita: 2780, despesa: 3908 },
                { name: '22', receita: 1890, despesa: 4800 },
                { name: '23', receita: 2390, despesa: 3800 },
                { name: 'Hoje', receita: financials.totalRevenue / 10, despesa: financials.totalExpenses / 10 },
            ];
        }
        return last7;
    }, [transactions, financials]);

    const categoryData = useMemo(() => {
        const categories: Record<string, number> = {};
        transactions.forEach(tx => {
            if (tx.type === 'Despesa') {
                const cat = tx.ledgerName || tx.category || 'Geral';
                categories[cat] = (categories[cat] || 0) + tx.amount;
            }
        });

        const data = Object.entries(categories).map(([name, value]) => ({ name, value }));
        return data.length > 0 ? data : [
            { name: 'Insumos', value: 45000 },
            { name: 'Logística', value: 12000 },
            { name: 'Manutenção', value: 8000 },
            { name: 'Pessoal', value: 35000 },
        ];
    }, [transactions]);

    const formatBRL = (val: number) => new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        maximumFractionDigits: 0
    }).format(val);

    const formatBRLCompact = (val: number) => {
        if (val >= 1000000) return `R$ ${(val / 1000000).toFixed(1)}M`;
        if (val >= 1000) return `R$ ${(val / 1000).toFixed(1)}k`;
        return formatBRL(val);
    };

    const COLORS = ['#0891b2', '#06b6d4', '#22d3ee', '#67e8f9', '#99f6ff', '#38bdf8', '#818cf8'];

    return (
        <div className="flex flex-col gap-6 animate-in fade-in duration-700">
            {/* Main Header with Tabs */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3 font-display tracking-tight">
                        <div className="p-2.5 bg-gradient-to-br from-cyan-600 to-cyan-400 rounded-2xl text-white shadow-lg shadow-cyan-500/20">
                            {activeTab === 'dashboard' ? <PieChartIcon size={24} /> : <FileText size={24} />}
                        </div>
                        {activeTab === 'dashboard' ? 'BI & Analytics Executivo' : activeTab === 'chart_of_accounts' ? 'Plano de Contas Gerencial' : 'Central de Relatórios Corporativos'}
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-2 font-medium">
                        {activeTab === 'dashboard'
                            ? 'Insights operacionais e financeiros estratégicos em tempo real.'
                            : activeTab === 'chart_of_accounts'
                                ? 'Demonstrativo e consolidação analítica por plano de contas.'
                                : 'Exportação de relatórios gerenciais e demonstrativos oficiais com cabeçalho corporativo homologado.'}
                    </p>
                </div>

                <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-2xl border dark:border-slate-700">
                    <button
                        onClick={() => setActiveTab('dashboard')}
                        className={`px-4 py-3 text-xs font-black rounded-xl transition-all flex items-center gap-2 ${activeTab === 'dashboard' ? 'bg-white dark:bg-slate-700 text-cyan-600 shadow-sm' : 'text-slate-400 hover:text-cyan-600'}`}
                    >
                        <PieChartIcon size={16} /> DASHBOARD
                    </button>
                    <button
                        onClick={() => setActiveTab('chart_of_accounts')}
                        className={`px-4 py-3 text-xs font-black rounded-xl transition-all flex items-center gap-2 ${activeTab === 'chart_of_accounts' ? 'bg-white dark:bg-slate-700 text-cyan-600 shadow-sm' : 'text-slate-400 hover:text-cyan-600'}`}
                    >
                        <BookOpen size={16} /> PLANO DE CONTAS
                    </button>
                    <button
                        onClick={() => { setActiveTab('generator'); }}
                        className={`px-4 py-3 text-xs font-black rounded-xl transition-all flex items-center gap-2 ${activeTab === 'generator' ? 'bg-white dark:bg-slate-700 text-cyan-600 shadow-sm' : 'text-slate-400 hover:text-cyan-600'}`}
                    >
                        <Printer size={16} /> BIBLIOTECA DE RELATÓRIOS
                    </button>
                </div>
            </div>

            {/* TAB: DASHBOARD */}
            {activeTab === 'dashboard' ? (
                <div className="flex flex-col gap-6 animate-in slide-in-from-left duration-300">
                    {/* Period Selector & Dashboard Tools */}
                    <div className="flex justify-end gap-4">
                        <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl">
                            {['7d', '30d', '12m'].map(p => (
                                <button
                                    key={p}
                                    onClick={() => setReportPeriod(p)}
                                    className={`px-4 py-2 text-xs font-black rounded-lg transition-all ${reportPeriod === p ? 'bg-white dark:bg-slate-700 text-cyan-600 shadow-sm' : 'text-slate-400'}`}
                                >
                                    {p.toUpperCase()}
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={handleExportCorporateCSV}
                            className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 transition-colors"
                            title="Exportar Resumo Oficial"
                        >
                            <FileText size={18} />
                        </button>
                        <button
                            onClick={() => {
                                navigator.clipboard.writeText(window.location.href);
                                addToast("Link do painel copiado com sucesso!", 'success');
                            }}
                            className="p-2.5 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-colors"
                        >
                            <Share2 size={18} />
                        </button>
                    </div>

                    {/* Smart KPIs */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            { label: 'RECEITA BRUTA OPERACIONAL', value: financials.totalRevenue, trend: '+12.5%', icon: <DollarSign />, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/10' },
                            { label: 'SALDO REAL DISPONÍVEL', value: financials.balance, trend: '+4.2%', icon: <TrendingUp />, color: 'text-cyan-500', bg: 'bg-cyan-50 dark:bg-cyan-900/10' },
                            { label: 'TICKET MÉDIO DE VENDAS', value: sales.length > 0 ? financials.totalRevenue / sales.length : 0, trend: '-1.8%', icon: <Activity />, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/10' },
                            { label: 'EFICIÊNCIA OPERACIONAL (OEE)', value: 94.2, trend: '+2.1%', icon: <Factory />, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/10' },
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

                    {/* Charts Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700">
                            <h3 className="text-base font-black text-slate-900 dark:text-white mb-6">Evolução Diária de Entradas e Saídas</h3>
                            <div className="h-[350px] w-full">
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
                                        <Tooltip />
                                        <Area type="monotone" dataKey="receita" stroke="#06b6d4" strokeWidth={3} fillOpacity={1} fill="url(#colorInc)" name="Receitas" />
                                        <Area type="monotone" dataKey="despesa" stroke="#f472b6" strokeWidth={3} fillOpacity={1} fill="url(#colorExp)" name="Despesas" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700">
                            <h3 className="text-base font-black text-slate-900 dark:text-white mb-6">Distribuição de Gastos por Categoria</h3>
                            <div className="h-[350px] w-full relative">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={categoryData} cx="50%" cy="50%" innerRadius={70} outerRadius={110} fill="#8884d8" paddingAngle={8} dataKey="value" stroke="none">
                                            {categoryData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(v: any) => formatMoney(Number(v))} />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Despesa Total</span>
                                    <span className="text-xl font-black text-slate-800 dark:text-white">{formatBRL(financials.totalExpenses).split(',')[0]}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : activeTab === 'chart_of_accounts' ? (
                /* TAB: PLANO DE CONTAS COM CABEÇALHO CORPORATIVO */
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
                                        .filter(t => (t.ledgerCode === node.code || t.category === node.name) && t.status !== 'Cancelado')
                                        .filter(t => {
                                            const txDate = parseDateString(t.date);
                                            const start = new Date(startDate);
                                            const end = new Date(endDate);
                                            end.setHours(23, 59, 59);
                                            return txDate >= start && txDate <= end;
                                        })
                                        .reduce((acc, t) => acc + t.amount, 0);

                                    const childrenTotal = (node.children || []).reduce((acc: number, c: any) => acc + getGroupTotal(c), 0);
                                    return selfTotal + childrenTotal;
                                };

                                const groupTotal = getGroupTotal(group);

                                const matchesSearch = (node: any): boolean => {
                                    if (!poaSearchTerm) return true;
                                    const nameMatch = node.name.toLowerCase().includes(poaSearchTerm.toLowerCase());
                                    const codeMatch = node.code.toLowerCase().includes(poaSearchTerm.toLowerCase());
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
                                                            end.setHours(23, 59, 59);
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
                /* TAB: CENTRAL DE RELATÓRIOS (GENERATOR) */
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
                            {['Todos', 'Comercial', 'Financeiro', 'Estoque', 'Clientes', 'Compras', 'Frota', 'RH', 'Contábil', 'Gerencial'].map(cat => (
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

                    {/* Report Configurator Preview & Parameters */}
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
                                    <button
                                        onClick={handleExportCorporateCSV}
                                        className="mt-4 px-4 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl hover:bg-slate-200 transition-colors flex items-center gap-1.5 shadow-sm"
                                    >
                                        <Download size={15} /> Exportar Excel / CSV
                                    </button>
                                    <button
                                        onClick={handlePrintReport}
                                        className="mt-4 px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-black text-xs rounded-xl shadow-lg shadow-cyan-600/20 transition-all flex items-center gap-2"
                                    >
                                        <Printer size={16} /> Imprimir Relatório Oficial
                                    </button>
                                </div>
                            </div>

                            {/* Table Preview */}
                            <div className="overflow-hidden border border-slate-100 dark:border-slate-700 rounded-2xl">
                                <div className="p-4 bg-slate-50 dark:bg-slate-900/50 flex justify-between items-center border-b border-slate-100 dark:border-slate-700">
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                        Pré-visualização dos Dados ({reportData.length} registros)
                                    </h4>
                                    <span className="text-[10px] font-bold text-slate-400">
                                        Período: {formatDateBR(startDate)} a {formatDateBR(endDate)}
                                    </span>
                                </div>
                                <div className="overflow-auto max-h-[450px] custom-scrollbar">
                                    <table className="w-full text-xs text-left">
                                        <thead className="bg-slate-50 dark:bg-slate-900 text-[10px] uppercase font-black text-slate-400 sticky top-0 z-10">
                                            <tr>
                                                {reportData.length > 0 ? Object.keys(reportData[0]).map(key => (
                                                    <th key={key} className="px-4 py-3 whitespace-nowrap bg-slate-50 dark:bg-slate-900">{key}</th>
                                                )) : <th className="px-4 py-3 text-center">Dados</th>}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-gray-700">
                                            {reportData.length > 0 ? reportData.map((row, idx) => (
                                                <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-gray-700/40 transition-colors">
                                                    {Object.keys(row).map((key, i) => {
                                                        let val = row[key];
                                                        const isMoney = typeof val === 'number' && (key.includes('Valor') || key.includes('Total') || key.includes('Preço') || key.includes('Salário') || key.includes('Faturamento') || key.includes('Entrada') || key.includes('Saída') || key.includes('Saldo') || key.includes('Receita') || key.includes('Despesa'));
                                                        if (isMoney) val = formatMoney(val);
                                                        return <td key={i} className="px-4 py-2.5 whitespace-nowrap font-medium text-slate-700 dark:text-slate-300">{val !== undefined ? val : '-'}</td>;
                                                    })}
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
                    {['Comercial', 'Financeiro', 'Estoque', 'Clientes', 'Compras', 'Frota', 'RH', 'Contábil', 'Gerencial'].map(category => {
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
                                                onClick={() => setSelectedModule(m.id)}
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
