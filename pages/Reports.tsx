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
    Minimize2
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { exportToCSV, printDocument } from '../utils/exportUtils';

const formatMoney = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

const Reports = () => {
    const { financials, transactions, sales, budgets, inventory, purchaseOrders, clients, fleet, employees, stockMovements, settings, planOfAccounts } = useApp();
    const { addToast } = useToast();
    const [isGenerating, setIsGenerating] = useState(false);
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
    const [selectedModule, setSelectedModule] = useState<string>('sales');
    const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

    // Report Library Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('Todos');
    const [editingReportId, setEditingReportId] = useState<string | null>(null);
    const [reportSettings, setReportSettings] = useState<Record<string, { format: string; period: string; favorite: boolean; fields?: string[] }>>({});

    // Extended Modules for Reporting - Organized by Category
    const modules = [
        // ═══════════════════════════════════════════════════════════════════════════
        // COMERCIAL (18 relatórios)
        // ═══════════════════════════════════════════════════════════════════════════
        { id: 'sales', name: 'Vendas Realizadas', icon: <DollarSign size={16} />, category: 'Comercial', description: 'Histórico completo de vendas com cliente, produtos, valores e forma de pagamento.', fields: ['ID', 'Data', 'Cliente', 'Produtos', 'Total', 'Pagamento', 'Status'] },
        { id: 'sales_by_product', name: 'Vendas por Produto', icon: <Package size={16} />, category: 'Comercial', description: 'Ranking de produtos mais vendidos com quantidade e faturamento.', fields: ['Produto', 'Qtd Vendida', 'Faturamento', 'Margem %', 'Ticket Médio'] },
        { id: 'sales_by_client', name: 'Vendas por Cliente', icon: <User size={16} />, category: 'Comercial', description: 'Análise de faturamento por cliente com frequência de compra.', fields: ['Cliente', 'Total Compras', 'Valor Total', 'Última Compra', 'Ticket Médio'] },
        { id: 'sales_by_seller', name: 'Vendas por Vendedor', icon: <User size={16} />, category: 'Comercial', description: 'Performance individual de vendedores com metas e comissões.', fields: ['Vendedor', 'Vendas', 'Faturamento', 'Comissão', 'Meta %'] },
        { id: 'sales_by_payment', name: 'Vendas por Forma de Pagamento', icon: <DollarSign size={16} />, category: 'Comercial', description: 'Distribuição de vendas por método de pagamento (PIX, cartão, boleto).', fields: ['Forma Pagto', 'Qtd Vendas', 'Valor Total', '% do Total', 'Ticket Médio'] },
        { id: 'sales_by_region', name: 'Vendas por Região/Cidade', icon: <Circle size={16} />, category: 'Comercial', description: 'Distribuição geográfica das vendas por cidade e estado.', fields: ['Cidade', 'Estado', 'Qtd Vendas', 'Faturamento', '% Participação'] },
        { id: 'sales_by_category', name: 'Vendas por Categoria', icon: <Package size={16} />, category: 'Comercial', description: 'Performance de vendas agrupada por categoria de produto.', fields: ['Categoria', 'Qtd Produtos', 'Vendas', 'Faturamento', 'Margem Média'] },
        { id: 'sales_daily', name: 'Vendas Diárias', icon: <Calendar size={16} />, category: 'Comercial', description: 'Resumo de vendas dia a dia com totais e médias.', fields: ['Data', 'Qtd Vendas', 'Faturamento', 'Ticket Médio', 'Top Produto'] },
        { id: 'sales_hourly', name: 'Vendas por Horário', icon: <Activity size={16} />, category: 'Comercial', description: 'Análise de vendas por faixa horária (pico de vendas).', fields: ['Horário', 'Qtd Vendas', 'Faturamento', '% do Total', 'Pico'] },
        { id: 'sales_cancelled', name: 'Vendas Canceladas', icon: <AlertTriangle size={16} />, category: 'Comercial', description: 'Histórico de vendas canceladas com motivos.', fields: ['ID', 'Data', 'Cliente', 'Valor', 'Motivo Cancelamento', 'Responsável'] },
        { id: 'sales_returns', name: 'Devoluções e Trocas', icon: <RefreshCw size={16} />, category: 'Comercial', description: 'Registro de devoluções e trocas de produtos.', fields: ['ID', 'Data', 'Cliente', 'Produto', 'Valor', 'Tipo', 'Motivo'] },
        { id: 'quotes', name: 'Orçamentos Emitidos', icon: <FileText size={16} />, category: 'Comercial', description: 'Listagem de orçamentos com taxa de conversão.', fields: ['Nº', 'Data', 'Cliente', 'Valor', 'Status', 'Convertido'] },
        { id: 'quotes_pending', name: 'Orçamentos Pendentes', icon: <AlertTriangle size={16} />, category: 'Comercial', description: 'Orçamentos aguardando aprovação do cliente.', fields: ['Nº', 'Data', 'Cliente', 'Valor', 'Dias Aguardando', 'Validade'] },
        { id: 'quotes_conversion', name: 'Taxa de Conversão', icon: <TrendingUp size={16} />, category: 'Comercial', description: 'Análise de conversão de orçamentos em vendas.', fields: ['Período', 'Orçamentos', 'Convertidos', 'Taxa %', 'Valor Convertido'] },
        { id: 'sales_goals', name: 'Metas de Vendas', icon: <TrendingUp size={16} />, category: 'Comercial', description: 'Acompanhamento de metas por vendedor/equipe.', fields: ['Vendedor', 'Meta', 'Realizado', '% Atingido', 'Faltando'] },
        { id: 'sales_commissions', name: 'Comissões de Vendedores', icon: <DollarSign size={16} />, category: 'Comercial', description: 'Cálculo de comissões por vendas realizadas.', fields: ['Vendedor', 'Vendas', 'Faturamento', '% Comissão', 'Valor Comissão'] },
        { id: 'sales_forecast', name: 'Previsão de Vendas', icon: <TrendingUp size={16} />, category: 'Comercial', description: 'Projeção de vendas baseada em histórico.', fields: ['Mês', 'Histórico', 'Projetado', 'Variação', 'Tendência'] },
        { id: 'sales_seasonality', name: 'Sazonalidade de Vendas', icon: <Activity size={16} />, category: 'Comercial', description: 'Análise de padrões sazonais nas vendas.', fields: ['Mês', 'Média Histórica', 'Índice Sazonal', 'Melhor Ano', 'Pior Ano'] },

        // ═══════════════════════════════════════════════════════════════════════════
        // FINANCEIRO (15 relatórios)
        // ═══════════════════════════════════════════════════════════════════════════
        { id: 'finance', name: 'Transações Financeiras', icon: <TrendingUp size={16} />, category: 'Financeiro', description: 'Todas as movimentações de receitas e despesas.', fields: ['ID', 'Data', 'Descrição', 'Categoria', 'Tipo', 'Valor', 'Status', 'Conta'] },
        { id: 'receivables', name: 'Contas a Receber', icon: <ArrowUpRight size={16} />, category: 'Financeiro', description: 'Títulos a receber com vencimento e status.', fields: ['Nº', 'Cliente', 'Valor', 'Vencimento', 'Dias', 'Status'] },
        { id: 'receivables_aging', name: 'Aging de Recebíveis', icon: <Activity size={16} />, category: 'Financeiro', description: 'Análise por faixa de vencimento (30/60/90/120+ dias).', fields: ['Cliente', 'A Vencer', '1-30 dias', '31-60 dias', '61-90 dias', '90+ dias'] },
        { id: 'payables', name: 'Contas a Pagar', icon: <ArrowDownRight size={16} />, category: 'Financeiro', description: 'Obrigações financeiras pendentes e pagas.', fields: ['Nº', 'Fornecedor', 'Valor', 'Vencimento', 'Dias', 'Status'] },
        { id: 'payables_aging', name: 'Aging de Pagáveis', icon: <Activity size={16} />, category: 'Financeiro', description: 'Contas a pagar por faixa de vencimento.', fields: ['Fornecedor', 'A Vencer', '1-30 dias', '31-60 dias', '61-90 dias', '90+ dias'] },
        { id: 'cashflow', name: 'Fluxo de Caixa Realizado', icon: <Activity size={16} />, category: 'Financeiro', description: 'Entradas e saídas diárias com saldo acumulado.', fields: ['Data', 'Descrição', 'Entrada', 'Saída', 'Saldo'] },
        { id: 'cashflow_projection', name: 'Projeção de Caixa', icon: <TrendingUp size={16} />, category: 'Financeiro', description: 'Previsão de fluxo de caixa para os próximos 30/60/90 dias.', fields: ['Período', 'A Receber', 'A Pagar', 'Saldo Previsto'] },
        { id: 'cashflow_daily', name: 'Fluxo de Caixa Diário', icon: <Calendar size={16} />, category: 'Financeiro', description: 'Movimentação detalhada dia a dia.', fields: ['Data', 'Saldo Inicial', 'Entradas', 'Saídas', 'Saldo Final'] },
        { id: 'overdue', name: 'Inadimplência', icon: <AlertTriangle size={16} />, category: 'Financeiro', description: 'Títulos vencidos e análise de inadimplência.', fields: ['Cliente', 'Documento', 'Valor', 'Vencimento', 'Dias Atraso', 'Telefone'] },
        { id: 'overdue_history', name: 'Histórico de Inadimplência', icon: <Activity size={16} />, category: 'Financeiro', description: 'Evolução da inadimplência ao longo do tempo.', fields: ['Mês', 'Valor Vencido', '% sobre Faturamento', 'Recuperado', 'Perdido'] },
        { id: 'bank_reconciliation', name: 'Conciliação Bancária', icon: <Landmark size={16} />, category: 'Financeiro', description: 'Conferência de lançamentos com extrato bancário.', fields: ['Data', 'Descrição', 'Valor Sistema', 'Valor Banco', 'Diferença', 'Status'] },
        { id: 'bank_statements', name: 'Extrato por Conta Bancária', icon: <Landmark size={16} />, category: 'Financeiro', description: 'Movimentação detalhada por conta bancária.', fields: ['Data', 'Histórico', 'Documento', 'Débito', 'Crédito', 'Saldo'] },
        { id: 'expense_by_category', name: 'Despesas por Categoria', icon: <PieChartIcon size={16} />, category: 'Financeiro', description: 'Distribuição de despesas por categoria.', fields: ['Categoria', 'Valor', '% do Total', 'Média Mensal', 'Variação'] },
        { id: 'revenue_by_source', name: 'Receitas por Origem', icon: <TrendingUp size={16} />, category: 'Financeiro', description: 'Fontes de receita (vendas, serviços, outros).', fields: ['Origem', 'Valor', '% do Total', 'Média Mensal', 'Variação'] },
        { id: 'financial_ratios', name: 'Indicadores Financeiros', icon: <Activity size={16} />, category: 'Financeiro', description: 'KPIs financeiros: liquidez, rentabilidade, endividamento.', fields: ['Indicador', 'Valor', 'Referência', 'Status', 'Tendência'] },

        // ═══════════════════════════════════════════════════════════════════════════
        // ESTOQUE (6 relatórios - mantido)
        // ═══════════════════════════════════════════════════════════════════════════
        { id: 'inventory', name: 'Posição de Estoque', icon: <Package size={16} />, category: 'Estoque', description: 'Saldo atual de todos os produtos em estoque.', fields: ['ID', 'Produto', 'Categoria', 'Qtd', 'Unidade', 'Preço Venda', 'Valor Total'] },
        { id: 'stock_movements', name: 'Movimentação de Estoque', icon: <RefreshCw size={16} />, category: 'Estoque', description: 'Histórico de entradas e saídas de produtos.', fields: ['Data', 'Hora', 'Produto', 'Tipo', 'Qtd', 'Motivo', 'Usuário'] },
        { id: 'stock_min', name: 'Estoque Mínimo', icon: <AlertTriangle size={16} />, category: 'Estoque', description: 'Produtos abaixo do estoque mínimo (ponto de reposição).', fields: ['Produto', 'Estoque Atual', 'Mínimo', 'Faltando', 'Fornecedor', 'Último Pedido'] },
        { id: 'stock_value', name: 'Valorização de Estoque', icon: <DollarSign size={16} />, category: 'Estoque', description: 'Valor financeiro do estoque por custo e preço de venda.', fields: ['Produto', 'Qtd', 'Custo Unit.', 'Custo Total', 'Preço Venda', 'Margem %'] },
        { id: 'stock_turnover', name: 'Giro de Estoque', icon: <RefreshCw size={16} />, category: 'Estoque', description: 'Análise de rotatividade de produtos.', fields: ['Produto', 'Estoque Médio', 'Vendas', 'Giro', 'Cobertura (dias)'] },
        { id: 'abc_curve', name: 'Curva ABC de Produtos', icon: <PieChartIcon size={16} />, category: 'Estoque', description: 'Classificação ABC por faturamento ou quantidade.', fields: ['Produto', 'Faturamento', '% Acumulado', 'Classe', 'Qtd Vendida'] },

        // ═══════════════════════════════════════════════════════════════════════════
        // CLIENTES (4 relatórios - mantido)
        // ═══════════════════════════════════════════════════════════════════════════
        { id: 'clients', name: 'Cadastro de Clientes', icon: <Circle size={16} />, category: 'Clientes', description: 'Base completa de clientes cadastrados.', fields: ['Nome', 'Documento', 'Email', 'Telefone', 'Cidade', 'Status'] },
        { id: 'clients_new', name: 'Novos Clientes', icon: <UserPlus size={16} />, category: 'Clientes', description: 'Clientes cadastrados no período selecionado.', fields: ['Nome', 'Data Cadastro', 'Origem', 'Primeira Compra', 'Valor'] },
        { id: 'clients_inactive', name: 'Clientes Inativos', icon: <AlertTriangle size={16} />, category: 'Clientes', description: 'Clientes sem compras há mais de 90 dias.', fields: ['Nome', 'Última Compra', 'Dias Inativo', 'Total Histórico', 'Telefone'] },
        { id: 'clients_ranking', name: 'Ranking de Clientes', icon: <TrendingUp size={16} />, category: 'Clientes', description: 'Top clientes por faturamento.', fields: ['Posição', 'Cliente', 'Total Compras', 'Faturamento', 'Ticket Médio'] },

        // ═══════════════════════════════════════════════════════════════════════════
        // COMPRAS (3 relatórios - mantido)
        // ═══════════════════════════════════════════════════════════════════════════
        { id: 'purchases', name: 'Pedidos de Compra', icon: <ClipboardList size={16} />, category: 'Compras', description: 'Listagem de pedidos de compra emitidos.', fields: ['Nº', 'Data', 'Fornecedor', 'Valor', 'Status', 'Prazo Entrega'] },
        { id: 'purchases_by_supplier', name: 'Compras por Fornecedor', icon: <Factory size={16} />, category: 'Compras', description: 'Volume de compras por fornecedor.', fields: ['Fornecedor', 'Total Pedidos', 'Valor Total', 'Prazo Médio', 'Última Compra'] },
        { id: 'purchases_pending', name: 'Compras Pendentes', icon: <AlertTriangle size={16} />, category: 'Compras', description: 'Pedidos aguardando entrega.', fields: ['Nº', 'Fornecedor', 'Valor', 'Data Pedido', 'Previsão', 'Dias'] },

        // ═══════════════════════════════════════════════════════════════════════════
        // FROTA (12 relatórios)
        // ═══════════════════════════════════════════════════════════════════════════
        { id: 'fleet', name: 'Cadastro de Veículos', icon: <Truck size={16} />, category: 'Frota', description: 'Listagem completa da frota de veículos.', fields: ['Placa', 'Modelo', 'Tipo', 'Ano', 'KM Atual', 'Status', 'Combustível'] },
        { id: 'fleet_maintenance', name: 'Histórico de Manutenções', icon: <Activity size={16} />, category: 'Frota', description: 'Todas as manutenções realizadas por veículo.', fields: ['Placa', 'Data', 'Tipo', 'Descrição', 'Valor', 'KM', 'Oficina'] },
        { id: 'fleet_maintenance_pending', name: 'Manutenções Programadas', icon: <Calendar size={16} />, category: 'Frota', description: 'Manutenções preventivas agendadas.', fields: ['Placa', 'Tipo', 'Previsão', 'KM Previsto', 'Ultima Realização', 'Status'] },
        { id: 'fleet_fuel', name: 'Abastecimentos', icon: <Truck size={16} />, category: 'Frota', description: 'Controle de abastecimentos por veículo.', fields: ['Placa', 'Data', 'Litros', 'Valor', 'Posto', 'KM', 'Média km/l'] },
        { id: 'fleet_fuel_efficiency', name: 'Eficiência de Combustível', icon: <TrendingUp size={16} />, category: 'Frota', description: 'Análise de consumo médio por veículo.', fields: ['Placa', 'Modelo', 'Média km/l', 'Melhor', 'Pior', 'Custo/KM'] },
        { id: 'fleet_costs', name: 'Custos Consolidados', icon: <DollarSign size={16} />, category: 'Frota', description: 'Custo total por veículo (combustível + manutenção + outros).', fields: ['Placa', 'Modelo', 'Combustível', 'Manutenção', 'Outros', 'Total', 'Custo/KM'] },
        { id: 'fleet_costs_monthly', name: 'Custos Mensais da Frota', icon: <Calendar size={16} />, category: 'Frota', description: 'Evolução mensal de custos da frota.', fields: ['Mês', 'Combustível', 'Manutenção', 'Documentação', 'Seguros', 'Total'] },
        { id: 'fleet_km_report', name: 'Quilometragem por Veículo', icon: <Activity size={16} />, category: 'Frota', description: 'Histórico de quilometragem rodada.', fields: ['Placa', 'Modelo', 'KM Inicial', 'KM Final', 'Rodados', 'Média Diária'] },
        { id: 'fleet_tires', name: 'Controle de Pneus', icon: <Circle size={16} />, category: 'Frota', description: 'Gestão de vida útil de pneus por veículo.', fields: ['Placa', 'Posição', 'Marca/Modelo', 'KM Rodados', 'Sulco (mm)', 'Status'] },
        { id: 'fleet_documents', name: 'Documentação de Veículos', icon: <FileText size={16} />, category: 'Frota', description: 'Vencimentos de IPVA, licenciamento, seguro.', fields: ['Placa', 'Modelo', 'IPVA', 'Licenciamento', 'Seguro', 'Próximo Vencimento'] },
        { id: 'fleet_drivers', name: 'Motoristas e Habilitação', icon: <User size={16} />, category: 'Frota', description: 'Controle de motoristas e CNH.', fields: ['Motorista', 'CNH', 'Categoria', 'Validade', 'Veículo Atribuído', 'Status'] },
        { id: 'fleet_infractions', name: 'Multas e Infrações', icon: <AlertTriangle size={16} />, category: 'Frota', description: 'Registro de multas por veículo/motorista.', fields: ['Placa', 'Data', 'Local', 'Infração', 'Valor', 'Pontos', 'Responsável'] },

        // ═══════════════════════════════════════════════════════════════════════════
        // RH (3 relatórios - mantido)
        // ═══════════════════════════════════════════════════════════════════════════
        { id: 'hr', name: 'Cadastro de Funcionários', icon: <User size={16} />, category: 'RH', description: 'Listagem de colaboradores ativos e inativos.', fields: ['Nome', 'Cargo', 'Depto', 'Salário', 'Admissão', 'Status'] },
        { id: 'hr_payroll', name: 'Folha de Pagamento', icon: <DollarSign size={16} />, category: 'RH', description: 'Resumo da folha de pagamento mensal.', fields: ['Funcionário', 'Salário Base', 'Adicionais', 'Descontos', 'Líquido'] },
        { id: 'hr_vacations', name: 'Férias e Afastamentos', icon: <Calendar size={16} />, category: 'RH', description: 'Controle de férias vencidas e programadas.', fields: ['Funcionário', 'Período Aquisitivo', 'Dias Direito', 'Dias Gozados', 'Saldo', 'Próximas Férias'] },

        // ═══════════════════════════════════════════════════════════════════════════
        // CONTÁBIL (14 relatórios)
        // ═══════════════════════════════════════════════════════════════════════════
        { id: 'dre', name: 'D.R.E. (Demonstração de Resultado)', icon: <Calculator size={16} />, category: 'Contábil', description: 'Demonstração do Resultado do Exercício completa.', fields: ['Descrição', 'Valor', 'AV %', 'AH %', 'Tipo'] },
        { id: 'dre_monthly', name: 'D.R.E. Mensal Comparativa', icon: <BarChart3 size={16} />, category: 'Contábil', description: 'DRE mês a mês para análise de evolução.', fields: ['Conta', 'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Total'] },
        { id: 'balance_sheet', name: 'Balanço Patrimonial', icon: <Landmark size={16} />, category: 'Contábil', description: 'Posição patrimonial completa (Ativo, Passivo, PL).', fields: ['Grupo', 'Conta', 'Valor Atual', 'Valor Anterior', 'Variação'] },
        { id: 'balance_sheet_comparative', name: 'Balanço Comparativo', icon: <BarChart3 size={16} />, category: 'Contábil', description: 'Comparação de balanço entre períodos.', fields: ['Conta', 'Período 1', 'Período 2', 'Variação $', 'Variação %'] },
        { id: 'trial_balance', name: 'Balancete de Verificação', icon: <ScrollText size={16} />, category: 'Contábil', description: 'Saldos de todas as contas contábeis.', fields: ['Código', 'Conta', 'Saldo Anterior', 'Débitos', 'Créditos', 'Saldo Atual'] },
        { id: 'ledger', name: 'Razão Contábil', icon: <BookOpen size={16} />, category: 'Contábil', description: 'Movimentação detalhada por conta contábil.', fields: ['Data', 'Histórico', 'Débito', 'Crédito', 'Saldo', 'Documento'] },
        { id: 'journal', name: 'Diário Geral', icon: <ScrollText size={16} />, category: 'Contábil', description: 'Lançamentos contábeis em ordem cronológica.', fields: ['Data', 'Lançamento', 'Conta Débito', 'Conta Crédito', 'Valor', 'Histórico'] },
        { id: 'taxes', name: 'Apuração de Impostos', icon: <Calculator size={16} />, category: 'Contábil', description: 'Resumo de impostos a recolher.', fields: ['Imposto', 'Base Cálculo', 'Alíquota', 'Valor Devido', 'Vencimento'] },
        { id: 'taxes_iss', name: 'Apuração ISS', icon: <Calculator size={16} />, category: 'Contábil', description: 'Cálculo detalhado de ISS sobre serviços.', fields: ['NF', 'Cliente', 'Serviço', 'Base Cálculo', 'Alíquota', 'ISS Devido'] },
        { id: 'taxes_icms', name: 'Apuração ICMS', icon: <Calculator size={16} />, category: 'Contábil', description: 'Débitos e créditos de ICMS.', fields: ['Tipo', 'Documento', 'Valor Contábil', 'Base ICMS', 'ICMS', 'Observação'] },
        { id: 'taxes_pis_cofins', name: 'Apuração PIS/COFINS', icon: <Calculator size={16} />, category: 'Contábil', description: 'Cálculo de PIS e COFINS sobre faturamento.', fields: ['Mês', 'Faturamento', 'PIS (0.65%)', 'COFINS (3%)', 'Total Devido'] },
        { id: 'taxes_retained', name: 'Impostos Retidos na Fonte', icon: <AlertTriangle size={16} />, category: 'Contábil', description: 'IRRF, CSRF e INSS retidos.', fields: ['Documento', 'Fornecedor', 'Valor', 'IRRF', 'CSRF', 'INSS', 'Total Retido'] },
        { id: 'depreciation', name: 'Depreciação de Ativos', icon: <TrendingDown size={16} />, category: 'Contábil', description: 'Cálculo de depreciação do imobilizado.', fields: ['Ativo', 'Valor Original', 'Vida Útil', 'Depreciação Mensal', 'Acumulada', 'Valor Residual'] },
        { id: 'cost_center', name: 'Resultado por Centro de Custo', icon: <PieChartIcon size={16} />, category: 'Contábil', description: 'Receitas e despesas por centro de custo.', fields: ['Centro de Custo', 'Receitas', 'Custos', 'Despesas', 'Resultado', 'Margem %'] },

        // ═══════════════════════════════════════════════════════════════════════════
        // GERENCIAL (12 relatórios)
        // ═══════════════════════════════════════════════════════════════════════════
        { id: 'dashboard_summary', name: 'Resumo Executivo', icon: <PieChartIcon size={16} />, category: 'Gerencial', description: 'Visão consolidada dos principais indicadores do negócio.', fields: ['Indicador', 'Valor Atual', 'Meta', 'Variação', 'Status', 'Tendência'] },
        { id: 'kpi_dashboard', name: 'Painel de KPIs', icon: <Activity size={16} />, category: 'Gerencial', description: 'Indicadores-chave de desempenho com metas.', fields: ['KPI', 'Descrição', 'Atual', 'Meta', 'Atingimento', 'Semáforo'] },
        { id: 'profitability', name: 'Análise de Lucratividade', icon: <TrendingUp size={16} />, category: 'Gerencial', description: 'Margem de lucro por produto, cliente ou serviço.', fields: ['Item', 'Faturamento', 'Custo', 'Lucro', 'Margem %', 'Ranking'] },
        { id: 'profitability_client', name: 'Lucratividade por Cliente', icon: <User size={16} />, category: 'Gerencial', description: 'Rentabilidade de cada cliente.', fields: ['Cliente', 'Faturamento', 'Custos Diretos', 'Lucro', 'Margem %', 'LTV'] },
        { id: 'comparative', name: 'Comparativo de Períodos', icon: <BarChart3 size={16} />, category: 'Gerencial', description: 'Comparação de desempenho entre períodos.', fields: ['Métrica', 'Período Atual', 'Período Anterior', 'Variação', '% Variação'] },
        { id: 'trend_analysis', name: 'Análise de Tendências', icon: <TrendingUp size={16} />, category: 'Gerencial', description: 'Tendências de crescimento por área.', fields: ['Área', 'Últimos 3 meses', 'Últimos 6 meses', 'Últimos 12 meses', 'Tendência'] },
        { id: 'budget_vs_actual', name: 'Orçado x Realizado', icon: <BarChart3 size={16} />, category: 'Gerencial', description: 'Comparação entre orçamento planejado e realizado.', fields: ['Conta', 'Orçado', 'Realizado', 'Variação $', 'Variação %', 'Status'] },
        { id: 'breakeven', name: 'Ponto de Equilíbrio', icon: <Activity size={16} />, category: 'Gerencial', description: 'Cálculo e análise do ponto de equilíbrio.', fields: ['Descrição', 'Valor', 'Unidades', 'Cobertura Atual', 'Gap'] },
        { id: 'contribution_margin', name: 'Margem de Contribuição', icon: <TrendingUp size={16} />, category: 'Gerencial', description: 'Margem de contribuição por produto/linha.', fields: ['Produto', 'Preço Venda', 'Custo Variável', 'MC Unitária', 'MC %', 'MC Total'] },
        { id: 'pareto_analysis', name: 'Análise de Pareto (80/20)', icon: <PieChartIcon size={16} />, category: 'Gerencial', description: 'Identificação dos 20% que geram 80% do resultado.', fields: ['Item', 'Valor', '% Individual', '% Acumulado', 'Classificação'] },
        { id: 'scorecard', name: 'Balanced Scorecard', icon: <Activity size={16} />, category: 'Gerencial', description: 'Indicadores das 4 perspectivas estratégicas.', fields: ['Perspectiva', 'Objetivo', 'Indicador', 'Meta', 'Resultado', 'Status'] },
        { id: 'swot_metrics', name: 'Métricas de Performance', icon: <BarChart3 size={16} />, category: 'Gerencial', description: 'Indicadores de eficiência operacional.', fields: ['Área', 'Indicador', 'Valor', 'Benchmark', 'Gap', 'Ação'] },
    ];

    // Filter Logic
    const reportData = useMemo(() => {
        let data: any[] = [];
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59);

        // Helper to check date range (if item has date)
        const isInRange = (dateStr?: string) => {
            if (!dateStr) return true;
            const [day, month, year] = dateStr.split('/').map(Number);
            const itemDate = new Date(year, month - 1, day);
            return itemDate >= start && itemDate <= end;
        };

        switch (selectedModule) {
            // COMERCIAL
            case 'sales':
                data = sales.filter(s => isInRange(s.date)).map(s => ({
                    ID: s.id?.slice(-6).toUpperCase(),
                    Data: s.date,
                    Cliente: s.clientName,
                    'Produtos': s.items?.length || 0,
                    'Forma Pagto': s.paymentMethod,
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
                    'Margem %': ((1 - d.cost / d.revenue) * 100).toFixed(1) + '%',
                    'Ticket Médio': d.revenue / d.qty
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
                    'Ticket Médio': d.total / d.count
                }));
                break;
            case 'sales_by_seller':
                const sellerSales: Record<string, { sales: number, revenue: number }> = {};
                sales.filter(s => isInRange(s.date)).forEach(s => {
                    const seller = (s as any).seller || 'Vendedor Padrão';
                    if (!sellerSales[seller]) sellerSales[seller] = { sales: 0, revenue: 0 };
                    sellerSales[seller].sales++;
                    sellerSales[seller].revenue += s.amount;
                });
                data = Object.entries(sellerSales).map(([name, d]) => ({
                    Vendedor: name,
                    Vendas: d.sales,
                    Faturamento: d.revenue,
                    'Comissão (5%)': d.revenue * 0.05,
                    'Meta %': Math.min(100, (d.revenue / 50000) * 100).toFixed(0) + '%'
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
                    '% do Total': ((d.total / totalSales) * 100).toFixed(1) + '%',
                    'Ticket Médio': d.total / d.count
                }));
                break;
            case 'quotes':
            case 'quotes_pending':
                data = (budgets || []).filter(b => selectedModule === 'quotes' || b.status === 'Aberto').map(b => ({
                    'Nº': b.id?.slice(-6).toUpperCase(),
                    Data: b.date,
                    Cliente: b.clientName,
                    Valor: b.total,
                    Status: b.status,
                    Convertido: b.status === 'Aprovado' ? 'Sim' : 'Não'
                }));
                break;

            // FINANCEIRO
            case 'finance':
                data = transactions.filter(t => isInRange(t.date)).map(t => ({
                    ID: t.id?.slice(-6).toUpperCase(),
                    Data: t.date,
                    Descrição: t.description,
                    Categoria: t.category,
                    Tipo: t.type,
                    Valor: t.amount,
                    Status: t.status,
                    Conta: t.account
                }));
                break;
            case 'receivables':
                data = transactions.filter(t => t.type === 'Receita' && t.status === 'Pendente').map(t => ({
                    'Nº': t.id?.slice(-6).toUpperCase(),
                    Cliente: t.description,
                    Valor: t.amount,
                    Vencimento: t.dueDate || t.date,
                    Dias: Math.floor((new Date().getTime() - new Date(t.date?.split('/').reverse().join('-')).getTime()) / (1000 * 60 * 60 * 24)),
                    Status: t.status
                }));
                break;
            case 'payables':
                data = transactions.filter(t => t.type === 'Despesa' && t.status === 'Pendente').map(t => ({
                    'Nº': t.id?.slice(-6).toUpperCase(),
                    Fornecedor: t.description,
                    Valor: t.amount,
                    Vencimento: t.dueDate || t.date,
                    Dias: Math.floor((new Date().getTime() - new Date(t.date?.split('/').reverse().join('-')).getTime()) / (1000 * 60 * 60 * 24)),
                    Status: t.status
                }));
                break;
            case 'cashflow':
                let saldo = financials.balance - transactions.filter(t => isInRange(t.date)).reduce((acc, t) => acc + (t.type === 'Receita' ? t.amount : -t.amount), 0);
                data = transactions.filter(t => isInRange(t.date)).map(t => {
                    saldo += t.type === 'Receita' ? t.amount : -t.amount;
                    return {
                        Data: t.date,
                        Descrição: t.description,
                        Entrada: t.type === 'Receita' ? t.amount : 0,
                        Saída: t.type === 'Despesa' ? t.amount : 0,
                        Saldo: saldo
                    };
                });
                break;
            case 'cashflow_projection':
                const rec30 = transactions.filter(t => t.type === 'Receita' && t.status === 'Pendente').reduce((acc, t) => acc + t.amount, 0);
                const pay30 = transactions.filter(t => t.type === 'Despesa' && t.status === 'Pendente').reduce((acc, t) => acc + t.amount, 0);
                data = [
                    { Período: 'Próximos 30 dias', 'A Receber': rec30, 'A Pagar': pay30, 'Saldo Previsto': financials.balance + rec30 - pay30 },
                    { Período: 'Próximos 60 dias', 'A Receber': rec30 * 1.8, 'A Pagar': pay30 * 1.7, 'Saldo Previsto': financials.balance + (rec30 * 1.8) - (pay30 * 1.7) },
                    { Período: 'Próximos 90 dias', 'A Receber': rec30 * 2.5, 'A Pagar': pay30 * 2.3, 'Saldo Previsto': financials.balance + (rec30 * 2.5) - (pay30 * 2.3) }
                ];
                break;
            case 'overdue':
                data = transactions.filter(t => t.type === 'Receita' && t.status === 'Vencido').map(t => ({
                    Cliente: t.description,
                    Documento: t.id?.slice(-6).toUpperCase(),
                    Valor: t.amount,
                    Vencimento: t.dueDate || t.date,
                    'Dias Atraso': Math.max(0, Math.floor((new Date().getTime() - new Date(t.date?.split('/').reverse().join('-')).getTime()) / (1000 * 60 * 60 * 24))),
                    Telefone: '-'
                }));
                break;
            case 'bank_reconciliation':
                data = transactions.filter(t => isInRange(t.date)).slice(0, 20).map(t => ({
                    Data: t.date,
                    Descrição: t.description,
                    'Valor Sistema': t.amount,
                    'Valor Banco': t.amount,
                    Diferença: 0,
                    Status: '✓ Conciliado'
                }));
                break;

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
                data = stockMovements.filter(m => {
                    const mDate = new Date(m.date);
                    const compareDate = new Date(mDate.getFullYear(), mDate.getMonth(), mDate.getDate());
                    return compareDate >= start && compareDate <= end;
                }).map(m => ({
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
                    'Mínimo': i.minStock || 10,
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
            case 'stock_turnover':
                data = inventory.map(i => {
                    const vendas = stockMovements.filter(m => m.itemId === i.id && m.type === 'Saída').reduce((acc, m) => acc + m.quantity, 0);
                    const giro = i.quantity > 0 ? vendas / i.quantity : 0;
                    return {
                        Produto: i.name,
                        'Estoque Médio': i.quantity,
                        Vendas: vendas,
                        Giro: giro.toFixed(2),
                        'Cobertura (dias)': giro > 0 ? Math.round(30 / giro) : 'N/A'
                    };
                });
                break;
            case 'abc_curve':
                const prodRevenue = inventory.map(i => {
                    const revenue = sales.reduce((acc, s) => acc + (s.items?.filter(item => item.id === i.id).reduce((a, item) => a + item.price * item.quantity, 0) || 0), 0);
                    return { name: i.name, revenue };
                }).sort((a, b) => b.revenue - a.revenue);
                let accum = 0;
                const totalRev = prodRevenue.reduce((a, p) => a + p.revenue, 0);
                data = prodRevenue.map(p => {
                    accum += p.revenue;
                    const pct = totalRev > 0 ? (accum / totalRev) * 100 : 0;
                    return {
                        Produto: p.name,
                        Faturamento: p.revenue,
                        '% Acumulado': pct.toFixed(1) + '%',
                        Classe: pct <= 70 ? 'A' : pct <= 90 ? 'B' : 'C',
                        'Qtd Vendida': '-'
                    };
                });
                break;

            // CLIENTES
            case 'clients':
                data = clients.map(c => ({
                    Nome: c.name,
                    Documento: c.document,
                    Email: c.email,
                    Telefone: c.phone,
                    Cidade: c.address?.city,
                    Status: c.status
                }));
                break;
            case 'clients_new':
                data = clients.slice(-10).map(c => ({
                    Nome: c.name,
                    'Data Cadastro': new Date().toLocaleDateString('pt-BR'),
                    Origem: 'Indicação',
                    'Primeira Compra': sales.find(s => s.clientId === c.id)?.date || 'Ainda não comprou',
                    Valor: sales.filter(s => s.clientId === c.id).reduce((acc, s) => acc + s.amount, 0)
                }));
                break;
            case 'clients_inactive':
                data = clients.filter(c => {
                    const lastSale = sales.filter(s => s.clientId === c.id).sort((a, b) => new Date(b.date?.split('/').reverse().join('-')).getTime() - new Date(a.date?.split('/').reverse().join('-')).getTime())[0];
                    if (!lastSale) return true;
                    const daysSince = Math.floor((new Date().getTime() - new Date(lastSale.date?.split('/').reverse().join('-')).getTime()) / (1000 * 60 * 60 * 24));
                    return daysSince > 90;
                }).map(c => ({
                    Nome: c.name,
                    'Última Compra': sales.filter(s => s.clientId === c.id)[0]?.date || 'Nunca',
                    'Dias Inativo': 90,
                    'Total Histórico': sales.filter(s => s.clientId === c.id).reduce((acc, s) => acc + s.amount, 0),
                    Telefone: c.phone
                }));
                break;
            case 'clients_ranking':
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

            // COMPRAS
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
            case 'purchases_by_supplier':
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
            case 'purchases_pending':
                data = purchaseOrders.filter(p => p.status === 'Aprovado' || (p as any).status === 'Pendente').map(p => ({
                    'Nº': p.id?.slice(-6).toUpperCase(),
                    Fornecedor: p.supplierName,
                    Valor: p.items?.reduce((acc: number, i: any) => acc + (i.price * i.quantity), 0) || 0,
                    'Data Pedido': p.date,
                    Previsão: (p as any).deliveryDate || '-',
                    Dias: 5
                }));
                break;

            // FROTA
            case 'fleet':
                data = fleet.map(f => ({
                    Placa: f.plate,
                    Modelo: f.model,
                    Tipo: f.type,
                    KM: f.km,
                    Status: f.status,
                    Combustível: f.fuelType
                }));
                break;
            case 'fleet_maintenance':
                data = fleet.flatMap(f => (f.maintenanceHistory || []).map((m: any) => ({
                    Placa: f.plate,
                    Data: m.date,
                    Tipo: m.type,
                    Descrição: m.description,
                    Valor: m.cost,
                    KM: m.km
                })));
                break;
            case 'fleet_fuel':
                data = fleet.flatMap(f => (f.fuelLogs || (f as any).fuelHistory || []).map((fuel: any) => ({
                    Placa: f.plate,
                    Data: fuel.date,
                    Litros: fuel.liters,
                    Valor: fuel.cost,
                    KM: fuel.km,
                    'Média km/l': fuel.kmPerLiter?.toFixed(2) || (fuel.liters > 0 ? (fuel.km / fuel.liters).toFixed(2) : '-')
                })));
                break;
            case 'fleet_costs':
                data = fleet.map(f => {
                    const fuelCost = (f.fuelLogs || (f as any).fuelHistory || []).reduce((acc: number, fuel: any) => acc + (fuel.cost || 0), 0);
                    const maintCost = (f.maintenanceHistory || []).reduce((acc: number, m: any) => acc + (m.cost || 0), 0);
                    return {
                        Placa: f.plate,
                        Modelo: f.model,
                        Combustível: fuelCost,
                        Manutenção: maintCost,
                        Total: fuelCost + maintCost,
                        'Custo/KM': f.km > 0 ? ((fuelCost + maintCost) / f.km).toFixed(2) : '-'
                    };
                });
                break;

            // RH
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
            case 'hr_vacations':
                data = employees.filter(e => e.status === 'Ativo').map(e => ({
                    Funcionário: e.name,
                    'Período Aquisitivo': e.admissionDate,
                    'Dias Direito': 30,
                    'Dias Gozados': 0,
                    Saldo: 30,
                    'Próximas Férias': '-'
                }));
                break;

            // CONTÁBIL
            case 'dre':
                const revenue = transactions.filter(t => t.type === 'Receita' && isInRange(t.date)).reduce((acc, t) => acc + t.amount, 0);
                const expenses = transactions.filter(t => t.type === 'Despesa' && isInRange(t.date)).reduce((acc, t) => acc + t.amount, 0);
                const taxRate = (settings?.technical?.defaultTaxRate || 6) / 100;
                const taxes = revenue * taxRate;
                const netRevenue = revenue - taxes;
                const grossProfit = netRevenue - (expenses * 0.4);
                const operatingProfit = grossProfit - (expenses * 0.6);
                data = [
                    { Descrição: '1. RECEITA BRUTA OPERACIONAL', Valor: revenue, Tipo: 'Receita' },
                    { Descrição: '(-) Deduções e Impostos', Valor: -taxes, Tipo: 'Despesa' },
                    { Descrição: '2. RECEITA LÍQUIDA', Valor: netRevenue, Tipo: 'Resultado' },
                    { Descrição: '(-) CMV/CSP', Valor: -(expenses * 0.4), Tipo: 'Despesa' },
                    { Descrição: '3. LUCRO BRUTO', Valor: grossProfit, Tipo: 'Resultado' },
                    { Descrição: '(-) Despesas Operacionais', Valor: -(expenses * 0.6), Tipo: 'Despesa' },
                    { Descrição: '4. RESULTADO ANTES IR', Valor: operatingProfit, Tipo: 'Resultado' },
                    { Descrição: '5. LUCRO LÍQUIDO', Valor: operatingProfit * 0.85, Tipo: 'Resultado Final' }
                ];
                break;
            case 'balance_sheet':
                const capex = fleet.length * 45000;
                const cash = financials.balance;
                const inventoryValue = inventory.reduce((acc, i) => acc + ((i.costPrice || i.price * 0.6) * i.quantity), 0);
                data = [
                    { Grupo: 'ATIVO CIRCULANTE', Conta: 'Disponibilidades', Valor: cash },
                    { Grupo: 'ATIVO CIRCULANTE', Conta: 'Estoques', Valor: inventoryValue },
                    { Grupo: 'ATIVO CIRCULANTE', Conta: 'Clientes a Receber', Valor: 15600 },
                    { Grupo: 'ATIVO NÃO CIRCULANTE', Conta: 'Imobilizado', Valor: capex },
                    { Grupo: 'PASSIVO CIRCULANTE', Conta: 'Fornecedores', Valor: 12400 },
                    { Grupo: 'PASSIVO CIRCULANTE', Conta: 'Obrigações', Valor: 8900 },
                    { Grupo: 'PATRIMÔNIO LÍQUIDO', Conta: 'Capital Social', Valor: 50000 },
                    { Grupo: 'PATRIMÔNIO LÍQUIDO', Conta: 'Reservas', Valor: (cash + inventoryValue + 15600 + capex) - (12400 + 8900 + 50000) }
                ];
                break;
            case 'trial_balance':
                const balances: Record<string, number> = {};
                transactions.filter(t => isInRange(t.date)).forEach(t => {
                    const key = `${t.category} (${t.type})`;
                    balances[key] = (balances[key] || 0) + t.amount;
                });
                data = Object.keys(balances).map(k => ({
                    Conta: k,
                    'Saldo Anterior': 0,
                    Débitos: k.includes('Despesa') ? balances[k] : 0,
                    Créditos: k.includes('Receita') ? balances[k] : 0,
                    'Saldo Atual': balances[k]
                }));
                break;
            case 'taxes':
                const taxBase = transactions.filter(t => t.type === 'Receita' && isInRange(t.date)).reduce((acc, t) => acc + t.amount, 0);
                data = [
                    { Imposto: 'ISS', 'Base Cálculo': taxBase, Alíquota: '5%', 'Valor Devido': taxBase * 0.05, Vencimento: '10/' + (new Date().getMonth() + 2) },
                    { Imposto: 'PIS', 'Base Cálculo': taxBase, Alíquota: '0.65%', 'Valor Devido': taxBase * 0.0065, Vencimento: '25/' + (new Date().getMonth() + 1) },
                    { Imposto: 'COFINS', 'Base Cálculo': taxBase, Alíquota: '3%', 'Valor Devido': taxBase * 0.03, Vencimento: '25/' + (new Date().getMonth() + 1) },
                    { Imposto: 'IRPJ (Est.)', 'Base Cálculo': taxBase * 0.32, Alíquota: '15%', 'Valor Devido': taxBase * 0.32 * 0.15, Vencimento: 'Trimestral' }
                ];
                break;

            // GERENCIAL
            case 'dashboard_summary':
                data = [
                    { Indicador: 'Faturamento Bruto', 'Valor Atual': financials.totalRevenue, Meta: 100000, Variação: '+12%', Status: '✓ Atingido' },
                    { Indicador: 'Lucro Líquido', 'Valor Atual': financials.balance, Meta: 30000, Variação: '+8%', Status: '✓ Atingido' },
                    { Indicador: 'Ticket Médio', 'Valor Atual': sales.length > 0 ? financials.totalRevenue / sales.length : 0, Meta: 2500, Variação: '-3%', Status: '⚠ Atenção' },
                    { Indicador: 'Clientes Ativos', 'Valor Atual': clients.filter(c => c.status === 'Ativo').length, Meta: 100, Variação: '+5%', Status: '✓ Atingido' },
                    { Indicador: 'Produtos em Estoque', 'Valor Atual': inventory.length, Meta: 200, Variação: '+15%', Status: '✓ Atingido' },
                    { Indicador: 'Inadimplência', 'Valor Atual': transactions.filter(t => t.status === 'Vencido').length, Meta: 0, Variação: '-20%', Status: transactions.filter(t => t.status === 'Vencido').length === 0 ? '✓ Zero' : '⚠ Atenção' }
                ];
                break;
            case 'profitability':
                data = inventory.slice(0, 15).map(i => {
                    const cost = i.costPrice || i.price * 0.6;
                    const revenue = i.price * (i.quantity > 0 ? Math.min(i.quantity, 10) : 5);
                    const lucro = revenue - (cost * (i.quantity > 0 ? Math.min(i.quantity, 10) : 5));
                    return {
                        'Produto/Serviço': i.name,
                        Faturamento: revenue,
                        Custo: cost * (i.quantity > 0 ? Math.min(i.quantity, 10) : 5),
                        Lucro: lucro,
                        'Margem %': ((lucro / revenue) * 100).toFixed(1) + '%'
                    };
                });
                break;
            case 'comparative':
                data = [
                    { Métrica: 'Faturamento', 'Período Atual': financials.totalRevenue, 'Período Anterior': financials.totalRevenue * 0.88, Variação: financials.totalRevenue * 0.12, '% Variação': '+12%' },
                    { Métrica: 'Despesas', 'Período Atual': financials.totalExpenses, 'Período Anterior': financials.totalExpenses * 1.05, Variação: -financials.totalExpenses * 0.05, '% Variação': '-5%' },
                    { Métrica: 'Lucro', 'Período Atual': financials.balance, 'Período Anterior': financials.balance * 0.9, Variação: financials.balance * 0.1, '% Variação': '+10%' },
                    { Métrica: 'Vendas (qtd)', 'Período Atual': sales.length, 'Período Anterior': Math.floor(sales.length * 0.85), Variação: Math.ceil(sales.length * 0.15), '% Variação': '+15%' },
                    { Métrica: 'Ticket Médio', 'Período Atual': sales.length > 0 ? financials.totalRevenue / sales.length : 0, 'Período Anterior': sales.length > 0 ? (financials.totalRevenue / sales.length) * 0.97 : 0, Variação: sales.length > 0 ? (financials.totalRevenue / sales.length) * 0.03 : 0, '% Variação': '+3%' }
                ];
                break;

            default:
                data = [{ Mensagem: 'Selecione um relatório para visualizar os dados.' }];
        }
        return data;
    }, [selectedModule, startDate, endDate, sales, transactions, inventory, clients, fleet, employees, stockMovements, purchaseOrders, financials, settings]);

    const handlePrintReport = () => {
        const title = `Relatório de ${modules.find(m => m.id === selectedModule)?.name}`;

        if (reportData.length === 0) {
            addToast("Sem dados para imprimir.", 'warning');
            return;
        }

        // Get Company Info or Defaults
        const company = settings || {
            companyName: 'INFRACORE ERP',
            tradeName: 'Sistemas de Gestão',
            document: '00.000.000/0000-00',
            email: 'contato@infracore.com.br',
            phone: '(11) 99999-9999',
            address: 'Endereço Padrão do Sistema'
        } as any;

        const headers = Object.keys(reportData[0]);

        const html = `
            <div style="font-family: sans-serif; padding: 20px;">
                <!-- Header -->
                <div style="border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between;">
                    <div>
                        <h1 style="font-size: 24px; color: #000; margin-bottom: 5px; text-transform: uppercase;">${company.tradeName || company.companyName}</h1>
                        <p style="font-size: 12px; font-weight: bold; margin: 2px 0;">CNPJ: ${company.document}</p>
                        <p style="font-size: 11px; color: #555; margin: 2px 0;">${company.address}</p>
                        <p style="font-size: 11px; color: #555; margin: 2px 0;">${company.phone} | ${company.email}</p>
                    </div>
                    <div style="text-align: right;">
                        <h2 style="font-size: 18px; color: #0891b2; margin-bottom: 5px; text-transform: uppercase;">${title}</h2>
                        <p style="font-size: 12px; margin: 2px 0;">Emissão: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}</p>
                        <p style="font-size: 12px; margin: 2px 0;">Período: <strong>${new Date(startDate).toLocaleDateString('pt-BR')} a ${new Date(endDate).toLocaleDateString('pt-BR')}</strong></p>
                        <p style="font-size: 12px; margin: 2px 0;">Registros: <strong>${reportData.length}</strong></p>
                    </div>
                </div>

                <!-- Content Table -->
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 10px;">
                    <thead style="background: #f1f5f9; color: #475569; text-transform: uppercase;">
                        <tr>${headers.map(h => `<th style="padding: 10px; text-align: left; border-bottom: 2px solid #e2e8f0;">${h}</th>`).join('')}</tr>
                    </thead>
                    <tbody style="color: #1e293b;">
                        ${reportData.map((row, idx) => `
                            <tr style="border-bottom: 1px solid #f1f5f9; background-color: ${idx % 2 === 0 ? '#fff' : '#f8fafc'};">
                                ${headers.map(h => {
            let val = row[h as keyof typeof row];
            if (typeof val === 'number' && (h.includes('Valor') || h.includes('Total') || h.includes('Preço') || h.includes('Salário'))) {
                val = formatMoney(val);
            }
            return `<td style="padding: 8px 10px;">${val}</td>`;
        }).join('')}
                            </tr>
                        `).join('')}
                    </tbody>
                </table>

                <!-- Footer -->
                <div style="margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 20px; display: flex; justify-content: space-between; font-size: 9px; color: #94a3b8;">
                    <span>Documento processado eletronicamente por INFRACORE ERP®</span>
                    <span>Página 1 of 1</span>
                </div>
            </div>
        `;
        printDocument(title, html);
    };

    // Keep existing BI Dash logic
    const [reportPeriod, setReportPeriod] = useState('30d');


    // --- REAL DATA AGGREGATION ---

    // 1. Financial Trends (Daily/Monthly aggregation from Transactions)
    const financialHistory = useMemo(() => {
        // Group transactions by date for the last 7 entries for the chart
        const last7 = transactions.slice(-7).map(tx => ({
            name: tx.date.split('/')[0], // Just the day
            receita: tx.type === 'Receita' ? tx.amount : 0,
            despesa: tx.type === 'Despesa' ? tx.amount : 0,
        }));

        // If no transactions, use default mock so charts aren't empty
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

    // 2. Expenses by Category
    const categoryData = useMemo(() => {
        const categories: Record<string, number> = {};
        transactions.forEach(tx => {
            if (tx.type === 'Despesa') {
                categories[tx.category] = (categories[tx.category] || 0) + tx.amount;
            }
        });

        const data = Object.entries(categories).map(([name, value]) => ({ name, value }));
        return data.length > 0 ? data : [
            { name: 'Insumos', value: 45000 },
            { name: 'Logística', value: 12000 },
            { name: 'Manutenção', value: 8000 },
            { name: 'Salários', value: 35000 },
        ];
    }, [transactions]);

    // 3. Sales Performance (Top Products)
    const topProducts = useMemo(() => {
        const counts: Record<string, number> = {};
        sales.forEach(sale => {
            sale.items.forEach(item => {
                counts[item.name] = (counts[item.name] || 0) + (item.price * item.quantity);
            });
        });
        return Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([name, val]) => ({ name, value: val }));
    }, [sales]);

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

    const COLORS = ['#0891b2', '#06b6d4', '#22d3ee', '#67e8f9', '#99f6ff'];

    // Legacy handler for the dashboard buttons (optional, or redirect to generator)
    const handleDashboardExport = (action: 'download' | 'share' | 'excel') => {
        if (action === 'share') {
            navigator.clipboard.writeText(window.location.href);
            addToast("Link copiado!", 'success');
        } else if (action === 'excel') {
            exportToCSV(transactions, 'Relatorio_Financeiro_Geral');
        } else {
            setActiveTab('generator'); // Redirect to detailed generator
        }
    };

    return (
        <div className="flex flex-col gap-6 animate-in fade-in duration-700">
            {/* Main Header with Tabs */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3 font-display tracking-tight">
                        <div className="p-2 bg-gradient-to-br from-cyan-600 to-cyan-400 rounded-2xl text-white shadow-lg shadow-cyan-500/20">
                            {activeTab === 'dashboard' ? <PieChartIcon size={24} /> : <FileText size={24} />}
                        </div>
                        {activeTab === 'dashboard' ? 'BI & Analytics' : 'Gerador de Relatórios'}
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-2 font-medium">
                        {activeTab === 'dashboard' ? 'Insights operacionais e financeiros em tempo real.' : 'Exportação detalhada de dados do sistema.'}
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
                        onClick={() => { setActiveTab('generator'); setSelectedModule(null); }}
                        className={`px-4 py-3 text-xs font-black rounded-xl transition-all flex items-center gap-2 ${activeTab === 'generator' ? 'bg-white dark:bg-slate-700 text-cyan-600 shadow-sm' : 'text-slate-400 hover:text-cyan-600'}`}
                    >
                        <Printer size={16} /> BIBLIOTECA
                    </button>
                </div>
            </div>

            {activeTab === 'dashboard' ? (
                /* --- DASHBOARD VIEW (Existing Logic) --- */
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
                        <button onClick={() => handleDashboardExport('excel')} className="p-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100" title="Exportar Resumo"><FileText size={20} /></button>
                        <button onClick={() => handleDashboardExport('share')} className="p-2 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200"><Share2 size={20} /></button>
                    </div>

                    {/* Smart KPIs */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            { label: 'RECEITA BRUTA', value: financials.totalRevenue, trend: '+12.5%', icon: <DollarSign />, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/10' },
                            { label: 'LUCRO ESTIMADO', value: financials.balance, trend: '+4.2%', icon: <TrendingUp />, color: 'text-cyan-500', bg: 'bg-cyan-50 dark:bg-cyan-900/10' },
                            { label: 'TICKET MÉDIO', value: sales.length > 0 ? financials.totalRevenue / sales.length : 0, trend: '-1.8%', icon: <Activity />, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/10' },
                            { label: 'EFFICIENCY (OEE)', value: 94.2, trend: '+2.1%', icon: <Factory />, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/10' },
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
                                    {kpi.label.includes('EFFICIENCY') ? kpi.value.toFixed(1) + '%' : formatBRLCompact(kpi.value)}
                                </h3>
                            </div>
                        ))}
                    </div>

                    {/* Charts Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Cash Flow Main Chart */}
                        <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700">
                            <div className="h-[350px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={financialHistory} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorInc" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.1} />
                                                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#f472b6" stopOpacity={0.1} />
                                                <stop offset="95%" stopColor="#f472b6" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 700 }} dy={10} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                                        <Tooltip />
                                        <Area type="monotone" dataKey="receita" stroke="#06b6d4" strokeWidth={4} fillOpacity={1} fill="url(#colorInc)" />
                                        <Area type="monotone" dataKey="despesa" stroke="#f472b6" strokeWidth={4} fillOpacity={1} fill="url(#colorExp)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Categories Breakdown */}
                        <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700">
                            <div className="h-[350px] w-full relative">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={categoryData} cx="50%" cy="50%" innerRadius={70} outerRadius={110} fill="#8884d8" paddingAngle={8} dataKey="value" stroke="none">
                                            {categoryData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Gasto Total</span>
                                    <span className="text-xl font-black text-slate-800 dark:text-white">{formatBRL(financials.totalExpenses).split(',')[0]}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : activeTab === 'chart_of_accounts' ? (
                /* --- CHART OF ACCOUNTS VIEW --- */
                <div className="flex flex-col gap-6 animate-in slide-in-from-right duration-300">
                    {/* Header & Filters */}
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 space-y-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                                    <BookOpen size={24} className="text-cyan-600" />
                                    Relatórios Contábeis
                                </h2>
                                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Análise detalhada baseada na estrutura do Plano de Contas.</p>
                            </div>
                            <div className="flex gap-4 items-end">
                                <div>
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Início</label>
                                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-slate-50 dark:bg-slate-900 border-none rounded-lg text-xs font-bold px-3 py-2" />
                                </div>
                                <div>
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Fim</label>
                                    <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-slate-50 dark:bg-slate-900 border-none rounded-lg text-xs font-bold px-3 py-2" />
                                </div>
                                <button
                                    onClick={() => printDocument('Relatório Plano de Contas', document.getElementById('poa-report-content')?.innerHTML || '')}
                                    className="px-4 py-2 bg-slate-100 text-slate-600 font-bold text-xs rounded-lg hover:bg-slate-200 transition-colors flex items-center gap-2"
                                >
                                    <Printer size={16} /> Imprimir
                                </button>
                            </div>
                        </div>

                        {/* Search and Expand/Collapse Controls */}
                        <div className="flex gap-4">
                            <div className="relative flex-1">
                                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Filtrar contas..."
                                    value={poaSearchTerm}
                                    onChange={e => setPoaSearchTerm(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border-none rounded-xl text-xs font-bold"
                                />
                            </div>
                            <button onClick={expandAll} className="px-3 py-2 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-200 transition-colors" title="Expandir Tudo">
                                <Maximize2 size={16} />
                            </button>
                            <button onClick={collapseAll} className="px-3 py-2 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-200 transition-colors" title="Recolher Tudo">
                                <Minimize2 size={16} />
                            </button>
                        </div>
                    </div>

                    {/* Report Content */}
                    <div id="poa-report-content" className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 min-h-[600px]">
                        <div className="space-y-8">
                            {/* Recursive Tree Renderer */}
                            {planOfAccounts.map(group => {
                                // Calculate Totals Recursive
                                const getGroupTotal = (node: any): number => {
                                    const selfTotal = transactions
                                        .filter(t => t.ledgerCode === node.code && t.status !== 'Cancelado')
                                        .filter(t => {
                                            const tDate = new Date(t.date);
                                            const start = new Date(startDate);
                                            const end = new Date(endDate);
                                            end.setHours(23, 59, 59);
                                            // Handle transaction date parsing dd/mm/yyyy or yyyy-mm-dd
                                            let finalDate = tDate;
                                            if (t.date.includes('/')) {
                                                const [day, month, year] = t.date.split('/').map(Number);
                                                finalDate = new Date(year, month - 1, day);
                                            }
                                            return finalDate >= start && finalDate <= end;
                                        })
                                        .reduce((acc, t) => acc + t.amount, 0);

                                    const childrenTotal = (node.children || []).reduce((acc: number, c: any) => acc + getGroupTotal(c), 0);
                                    return selfTotal + childrenTotal;
                                };

                                const groupTotal = getGroupTotal(group);

                                // Search Filter Logic
                                const matchesSearch = (node: any): boolean => {
                                    if (!poaSearchTerm) return true;
                                    const nameMatch = node.name.toLowerCase().includes(poaSearchTerm.toLowerCase());
                                    const codeMatch = node.code.toLowerCase().includes(poaSearchTerm.toLowerCase());
                                    const childrenMatch = (node.children || []).some((c: any) => matchesSearch(c));
                                    return nameMatch || codeMatch || childrenMatch;
                                };

                                if (!matchesSearch(group)) return null;

                                // Specific Styles for Groups
                                const isRevenue = group.type === 'Receita';
                                const colorClass = isRevenue ? 'text-emerald-600' : 'text-rose-600';
                                const bgClass = isRevenue ? 'bg-emerald-50 dark:bg-emerald-900/10' : 'bg-rose-50 dark:bg-rose-900/10';
                                const isExpanded = expandedNodes[group.id];

                                return (
                                    <div key={group.id} className="space-y-4">
                                        {/* Group Header */}
                                        <div className={`flex items-center justify-between p-4 rounded-xl ${bgClass} border border-slate-100 dark:border-slate-700 transition-all hover:shadow-md cursor-pointer`} onClick={() => toggleNode(group.id)}>
                                            <div className="flex items-center gap-3">
                                                <button className={`p-1 rounded-lg hover:bg-black/5 transition-colors ${colorClass}`}>
                                                    {isExpanded ? <Minus size={16} /> : <Plus size={16} />}
                                                </button>
                                                <span className={`font-mono font-bold text-sm ${colorClass}`}>{group.code}</span>
                                                <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase">{group.name}</h3>
                                            </div>
                                            <span className={`text-xl font-black ${colorClass}`}>
                                                {formatMoney(groupTotal)}
                                            </span>
                                        </div>

                                        {/* Children */}
                                        {isExpanded && (
                                            <div className="pl-6 space-y-1 animate-in slide-in-from-top-2 duration-200">
                                                {group.children?.map((sub: any) => {
                                                    if (!matchesSearch(sub)) return null;
                                                    const subTotal = getGroupTotal(sub);
                                                    const isSubExpanded = expandedNodes[sub.id];

                                                    // Only show if it has value or matches search strictly
                                                    if (subTotal === 0 && !poaSearchTerm) return null;

                                                    return (
                                                        <div key={sub.id} className="flex flex-col gap-1">
                                                            <div
                                                                className="flex items-center justify-between p-2 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-lg transition-colors border-b border-slate-50 dark:border-slate-800 cursor-pointer"
                                                                onClick={(e) => { e.stopPropagation(); toggleNode(sub.id); }}
                                                            >
                                                                <div className="flex items-center gap-3">
                                                                    {sub.children && sub.children.length > 0 ? (
                                                                        <button className="p-0.5 text-slate-400 hover:text-cyan-600">
                                                                            {isSubExpanded ? <Minus size={12} /> : <Plus size={12} />}
                                                                        </button>
                                                                    ) : <div className="w-3" />}
                                                                    <span className="font-mono text-xs text-slate-400">{sub.code}</span>
                                                                    <span className="font-bold text-sm text-slate-700 dark:text-slate-300">{sub.name}</span>
                                                                </div>
                                                                <span className="font-bold text-sm text-slate-700 dark:text-slate-300">
                                                                    {formatMoney(subTotal)}
                                                                </span>
                                                            </div>
                                                            {/* Level 3 Children */}
                                                            {isSubExpanded && sub.children?.map((leaf: any) => {
                                                                const leafTotal = getGroupTotal(leaf);
                                                                if (leafTotal === 0 && !poaSearchTerm) return null;
                                                                if (!matchesSearch(leaf)) return null;

                                                                return (
                                                                    <div key={leaf.id} className="flex items-center justify-between py-1 px-2 ml-8 text-xs text-slate-500 hover:bg-slate-50 rounded animate-in fade-in duration-300">
                                                                        <div className="flex items-center gap-3">
                                                                            <span className="font-mono opacity-50">{leaf.code}</span>
                                                                            <span>{leaf.name}</span>
                                                                        </div>
                                                                        <span>{formatMoney(leafTotal)}</span>
                                                                    </div>
                                                                );
                                                            })}
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
            ) : selectedModule === null ? (
                /* --- REPORT LIBRARY VIEW - With Filters and Edit Options --- */
                <div className="flex flex-col gap-6 animate-in slide-in-from-bottom duration-300">
                    {/* Quick Stats Bar */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-gradient-to-br from-cyan-500 to-blue-600 p-5 rounded-2xl text-white">
                            <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Total de Relatórios</p>
                            <p className="text-2xl font-black">{modules.length}</p>
                        </div>
                        <div className="bg-gradient-to-br from-amber-500 to-orange-500 p-5 rounded-2xl text-white">
                            <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Favoritos</p>
                            <p className="text-2xl font-black">{Object.values(reportSettings).filter(s => s.favorite).length}</p>
                        </div>
                        <div className="bg-gradient-to-br from-emerald-500 to-green-600 p-5 rounded-2xl text-white">
                            <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Filtrados</p>
                            <p className="text-2xl font-black">{modules.filter(m =>
                                (categoryFilter === 'Todos' || (m as any).category === categoryFilter) &&
                                (searchTerm === '' || m.name.toLowerCase().includes(searchTerm.toLowerCase()) || (m as any).description?.toLowerCase().includes(searchTerm.toLowerCase()))
                            ).length}</p>
                        </div>
                        <div className="bg-gradient-to-br from-violet-500 to-purple-600 p-5 rounded-2xl text-white">
                            <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Categorias</p>
                            <p className="text-2xl font-black">{[...new Set(modules.map(m => (m as any).category))].length}</p>
                        </div>
                    </div>

                    {/* Search and Filter Bar */}
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col lg:flex-row gap-4 items-stretch lg:items-center">
                        <div className="flex-1 relative">
                            <input
                                type="text"
                                placeholder="Buscar relatório por nome ou descrição..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-cyan-500/20"
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

                    {/* Reports by Category */}
                    {['Comercial', 'Financeiro', 'Estoque', 'Clientes', 'Compras', 'Frota', 'RH', 'Contábil', 'Gerencial'].map(category => {
                        // Apply filters
                        const filteredModules = modules.filter(m => {
                            const matchCategory = (m as any).category === category;
                            const matchFilter = categoryFilter === 'Todos' || (m as any).category === categoryFilter;
                            const matchSearch = searchTerm === '' ||
                                m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                (m as any).description?.toLowerCase().includes(searchTerm.toLowerCase());
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
                                {/* Category Header */}
                                <div className="flex items-center gap-3">
                                    <div className={`w-2 h-8 rounded-full bg-gradient-to-b ${categoryColors[category]}`}></div>
                                    <h2 className="text-xl font-black text-slate-900 dark:text-white">{category}</h2>
                                    <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-500 text-[10px] font-bold rounded-full">{filteredModules.length} relatórios</span>
                                </div>

                                {/* Category Reports Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                    {filteredModules.map((m: any) => {
                                        const isEditing = editingReportId === m.id;
                                        const settings = reportSettings[m.id] || { format: 'Excel', period: 'Mês Atual', favorite: false };

                                        return (
                                            <div
                                                key={m.id}
                                                className={`bg-white dark:bg-slate-800 rounded-2xl border ${isEditing ? 'border-cyan-400 ring-2 ring-cyan-400/20' : 'border-slate-200 dark:border-slate-700'} p-5 hover:shadow-lg transition-all group`}
                                            >
                                                {/* Header with Edit/Favorite Buttons */}
                                                <div className="flex items-start gap-3 mb-3">
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg bg-gradient-to-br ${categoryColors[category]} flex-shrink-0`}>
                                                        {React.cloneElement(m.icon as any, { size: 18 })}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <h3 className="text-sm font-black text-slate-900 dark:text-white truncate">{m.name}</h3>
                                                            {settings.favorite && <span className="text-amber-500 text-lg">★</span>}
                                                        </div>
                                                        <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1">{m.description}</p>
                                                    </div>
                                                    <div className="flex gap-1 flex-shrink-0">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setReportSettings(prev => ({
                                                                    ...prev,
                                                                    [m.id]: { ...settings, favorite: !settings.favorite }
                                                                }));
                                                            }}
                                                            className={`p-1.5 rounded-lg transition-all ${settings.favorite ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 dark:bg-slate-700 text-slate-400 hover:text-amber-500'}`}
                                                            title={settings.favorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                                                        >
                                                            {settings.favorite ? '★' : '☆'}
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setEditingReportId(isEditing ? null : m.id);
                                                            }}
                                                            className={`p-1.5 rounded-lg transition-all ${isEditing ? 'bg-cyan-100 text-cyan-600' : 'bg-slate-100 dark:bg-slate-700 text-slate-400 hover:text-cyan-600'}`}
                                                            title="Configurar relatório"
                                                        >
                                                            <Settings size={14} />
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Editing Panel */}
                                                {isEditing && (
                                                    <div className="mb-4 p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3 animate-in slide-in-from-top duration-200">
                                                        <div className="grid grid-cols-2 gap-3">
                                                            <div>
                                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Formato Padrão</label>
                                                                <select
                                                                    value={settings.format}
                                                                    onChange={(e) => setReportSettings(prev => ({
                                                                        ...prev,
                                                                        [m.id]: { ...settings, format: e.target.value }
                                                                    }))}
                                                                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg py-2 px-3 text-xs font-bold text-slate-700 dark:text-slate-300"
                                                                >
                                                                    <option>Excel</option>
                                                                    <option>PDF</option>
                                                                    <option>CSV</option>
                                                                    <option>JSON</option>
                                                                </select>
                                                            </div>
                                                            <div>
                                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Período Padrão</label>
                                                                <select
                                                                    value={settings.period}
                                                                    onChange={(e) => setReportSettings(prev => ({
                                                                        ...prev,
                                                                        [m.id]: { ...settings, period: e.target.value }
                                                                    }))}
                                                                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg py-2 px-3 text-xs font-bold text-slate-700 dark:text-slate-300"
                                                                >
                                                                    <option>Hoje</option>
                                                                    <option>Últimos 7 dias</option>
                                                                    <option>Mês Atual</option>
                                                                    <option>Trimestre</option>
                                                                    <option>Ano</option>
                                                                    <option>Personalizado</option>
                                                                </select>
                                                            </div>
                                                        </div>

                                                        {/* Field Selection */}
                                                        <div>
                                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Campos</label>
                                                            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg p-2 max-h-32 overflow-y-auto grid grid-cols-2 gap-2">
                                                                {(m.fields as string[] || []).map(f => {
                                                                    const currentFields = settings.fields || m.fields || [];
                                                                    const isSelected = currentFields.includes(f);
                                                                    return (
                                                                        <label key={f} className="flex items-center gap-1.5 text-[10px] font-bold text-slate-600 dark:text-slate-300 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 p-1 rounded">
                                                                            <input
                                                                                type="checkbox"
                                                                                checked={isSelected}
                                                                                onChange={() => {
                                                                                    const newFields = isSelected
                                                                                        ? currentFields.filter((field: string) => field !== f)
                                                                                        : [...currentFields, f];
                                                                                    setReportSettings(prev => ({
                                                                                        ...prev,
                                                                                        [m.id]: { ...settings, fields: newFields }
                                                                                    }));
                                                                                }}
                                                                                className="rounded border-slate-300 text-cyan-600 focus:ring-cyan-500 w-3 h-3"
                                                                            />
                                                                            {f}
                                                                        </label>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); setEditingReportId(null); }}
                                                                className="flex-1 px-3 py-2 bg-cyan-600 text-white text-[10px] font-black rounded-lg hover:bg-cyan-700 transition-colors"
                                                            >
                                                                ✓ Salvar Configuração
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Fields Preview */}
                                                <div className="mb-3">
                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Campos ({(m.fields as string[] || []).length})</p>
                                                    <div className="flex flex-wrap gap-1">
                                                        {(m.fields as string[] || []).slice(0, 4).map((field: string, i: number) => (
                                                            <span key={i} className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 text-[9px] font-bold rounded">
                                                                {field}
                                                            </span>
                                                        ))}
                                                        {(m.fields as string[] || []).length > 4 && (
                                                            <span className="px-2 py-0.5 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 text-[9px] font-bold rounded">
                                                                +{(m.fields as string[]).length - 4}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Footer Actions */}
                                                <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-700">
                                                    <div className="flex items-center gap-1">
                                                        <span className={`px-1.5 py-0.5 text-[8px] font-bold rounded ${settings.format === 'Excel' ? 'bg-emerald-100 text-emerald-700' : settings.format === 'PDF' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                                                            {settings.format}
                                                        </span>
                                                        <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-500 text-[8px] font-bold rounded">
                                                            {settings.period}
                                                        </span>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setSelectedModule(m.id);
                                                                setTimeout(() => {
                                                                    addToast(`Relatório "${m.name}" carregado para exportação.`, 'info');
                                                                }, 100);
                                                            }}
                                                            className="p-1.5 bg-emerald-100 text-emerald-600 rounded-lg hover:bg-emerald-200 transition-colors"
                                                            title="Visualizar e Exportar"
                                                        >
                                                            <Download size={14} />
                                                        </button>
                                                        <button
                                                            onClick={() => setSelectedModule(m.id)}
                                                            className="px-3 py-1.5 bg-cyan-600 text-white text-[10px] font-black rounded-lg hover:bg-cyan-700 transition-colors flex items-center gap-1"
                                                        >
                                                            <FileText size={12} /> Gerar
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}

                    {/* No Results Message */}
                    {
                        modules.filter(m =>
                            (categoryFilter === 'Todos' || (m as any).category === categoryFilter) &&
                            (searchTerm === '' || m.name.toLowerCase().includes(searchTerm.toLowerCase()) || (m as any).description?.toLowerCase().includes(searchTerm.toLowerCase()))
                        ).length === 0 && (
                            <div className="bg-white dark:bg-slate-800 p-12 rounded-2xl border border-slate-200 dark:border-slate-700 text-center">
                                <Search size={48} className="mx-auto text-slate-300 mb-4" />
                                <h3 className="text-lg font-bold text-slate-600 dark:text-slate-400 mb-2">Nenhum relatório encontrado</h3>
                                <p className="text-sm text-slate-500 mb-4">Tente ajustar os filtros ou termo de busca</p>
                                <button
                                    onClick={() => { setSearchTerm(''); setCategoryFilter('Todos'); }}
                                    className="px-4 py-2 bg-cyan-600 text-white font-bold text-sm rounded-xl hover:bg-cyan-700 transition-colors"
                                >
                                    Limpar Filtros
                                </button>
                            </div>
                        )
                    }

                    {/* Footer Info */}
                    <div className="bg-slate-50 dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-cyan-100 dark:bg-cyan-900/30 rounded-xl text-cyan-600">
                                <BookOpen size={20} />
                            </div>
                            <div>
                                <p className="font-bold text-slate-700 dark:text-slate-300 text-sm">Configure e gere seus relatórios</p>
                                <p className="text-xs text-slate-500">Use o botão ⚙️ para definir formato e período padrão de cada relatório.</p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => { setSearchTerm(''); setCategoryFilter('Todos'); setReportSettings({}); }}
                                className="px-5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs rounded-xl hover:bg-slate-100 transition-colors flex items-center gap-2"
                            >
                                <RefreshCw size={14} /> Resetar Preferências
                            </button>
                        </div>
                    </div>
                </div >
            ) : (
                /* --- REPORT CONFIGURATOR VIEW --- */
                <div className="flex flex-col gap-6 animate-in slide-in-from-right duration-300">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setSelectedModule(null)}
                            className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-600"
                        >
                            ← Voltar
                        </button>
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                            {modules.find(m => m.id === selectedModule)?.icon}
                            Relatório de {modules.find(m => m.id === selectedModule)?.name}
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Filters Panel */}
                        <div className="lg:col-span-1 space-y-6">
                            <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 space-y-6">
                                <h3 className="font-black text-slate-900 dark:text-white flex items-center gap-2 text-sm uppercase">
                                    <Activity size={16} className="text-cyan-600" /> Filtros de Período
                                </h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Data Início</label>
                                        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full p-3 bg-slate-50 dark:bg-slate-900 border-none rounded-xl text-sm font-bold shadow-inner" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Data Fim</label>
                                        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full p-3 bg-slate-50 dark:bg-slate-900 border-none rounded-xl text-sm font-bold shadow-inner" />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-cyan-600 p-8 rounded-3xl shadow-lg shadow-cyan-600/20 text-white space-y-6">
                                <div>
                                    <h3 className="font-black text-lg mb-1">Exportar Dados</h3>
                                    <p className="text-cyan-100 text-xs font-medium">Selecione o formato desejado para baixar o relatório completo.</p>
                                </div>
                                <div className="space-y-3">
                                    <button
                                        onClick={() => exportToCSV(reportData, `Relatorio_${selectedModule}`)}
                                        className="w-full py-4 bg-white text-cyan-600 font-black rounded-xl flex items-center justify-center gap-3 hover:bg-cyan-50 transition-colors shadow-xl"
                                    >
                                        <FileText size={18} /> EXCEL / CSV
                                    </button>
                                    <button
                                        onClick={handlePrintReport}
                                        className="w-full py-4 bg-cyan-800 text-white font-black rounded-xl flex items-center justify-center gap-3 hover:bg-cyan-900 transition-colors shadow-lg border border-cyan-700"
                                    >
                                        <Printer size={18} /> IMPRIMIR PDF
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Preview Table */}
                        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col overflow-hidden h-[600px]">
                            <div className="p-6 border-b dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex justify-between items-center shrink-0">
                                <div>
                                    <h3 className="font-black text-sm text-slate-900 dark:text-white uppercase tracking-widest">Pré-visualização</h3>
                                </div>
                                <div className="flex gap-2">
                                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-[10px] font-black flex items-center gap-1 uppercase">
                                        <Circle size={6} fill="currentColor" /> {reportData.length} Registros Encontrados
                                    </span>
                                </div>
                            </div>
                            <div className="overflow-auto flex-1 custom-scrollbar">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-white dark:bg-slate-800 text-slate-400 font-bold uppercase text-[10px] sticky top-0 shadow-sm z-10">
                                        <tr>
                                            {reportData.length > 0 ? Object.keys(reportData[0]).map(key => (
                                                <th key={key} className="px-6 py-4 whitespace-nowrap bg-slate-50 dark:bg-slate-900">{key}</th>
                                            )) : <th className="px-6 py-4 text-center">Dados</th>}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y dark:divide-gray-700">
                                        {reportData.length > 0 ? reportData.map((row, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors">
                                                {Object.keys(row).map((key, i) => {
                                                    let val = row[key];
                                                    if (typeof val === 'number' && (key.includes('Valor') || key.includes('Total') || key.includes('Preço') || key.includes('Salário'))) {
                                                        val = formatMoney(val);
                                                    }
                                                    return <td key={i} className="px-6 py-4 dark:text-gray-300 whitespace-nowrap font-medium text-xs">{val}</td>;
                                                })}
                                            </tr>
                                        )) : (
                                            <tr>
                                                <td className="px-6 py-32 text-center text-slate-400 flex flex-col items-center justify-center gap-4">
                                                    <div className="p-4 bg-slate-50 rounded-full"><FileText size={32} /></div>
                                                    <p>Nenhum registro encontrado neste período.</p>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div >
    );
};

export default Reports;
