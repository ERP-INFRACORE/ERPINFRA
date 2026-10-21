import React, { useMemo } from 'react';
import { NavLink } from 'react-router-dom';
import {
  TrendingUp,
  TrendingDown,
  Truck,
  DollarSign,
  Package,
  Activity,
  Users,
  ShoppingCart,
  Calendar,
  Layers,
  Search,
  ArrowRight,
  PieChart,
  BarChart3,
  Wallet,
  AlertCircle
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, PieChart as RechartsPieChart, Pie, Cell, Legend
} from 'recharts';
import { useApp } from '../context/AppContext';

// Helper for currency formatting
const formatMoney = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 2
  }).format(value);
};

const Dashboard = () => {
  const {
    financials, fleet, transactions, sales, budgets,
    employees, inventory, payroll, hasPermission
  } = useApp();

  if (!hasPermission('dashboard.view')) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-500">
        <AlertCircle size={48} className="mb-4 text-slate-300" />
        <h2 className="text-xl font-bold text-slate-700 dark:text-slate-300">Acesso Restrito</h2>
        <p className="text-sm">Seu perfil não possui permissão para visualizar o Dashboard.</p>
      </div>
    );
  }

  // --- Real-time Calculations ---

  // 1. Monthly Financial Data for Chart (Last 6 Months)
  const chartData = useMemo(() => {
    const today = new Date();
    const data: { name: string; Receita: number; Despesa: number; }[] = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthName = d.toLocaleString('pt-BR', { month: 'short' });
      const monthKey = `${d.getMonth()}/${d.getFullYear()}`; // Simple key for filtering if needed

      // Filter transactions for this month (approximate for now, or match precisely)
      // Note: In a real app we'd parse dates carefully. Assuming DD/MM/YYYY format in 'date' field.
      const monthTransactions = transactions.filter(t => {
        const [day, month, year] = t.date.split('/').map(Number);
        return month === d.getMonth() + 1 && year === d.getFullYear(); // Month is 1-indexed in date string
      });

      const income = monthTransactions
        .filter(t => t.type === 'Receita' && t.status !== 'Cancelado')
        .reduce((sum, t) => sum + t.amount, 0);

      const expense = monthTransactions
        .filter(t => t.type === 'Despesa' && t.status !== 'Cancelado')
        .reduce((sum, t) => sum + t.amount, 0);

      data.push({
        name: monthName.charAt(0).toUpperCase() + monthName.slice(1),
        Receita: income,
        Despesa: expense
      });
    }
    return data;
  }, [transactions]);

  // 2. Expense Categories for Pie Chart
  const expenseCategories = useMemo(() => {
    const categories: Record<string, number> = {};
    transactions
      .filter(t => t.type === 'Despesa' && t.status !== 'Cancelado')
      .forEach(t => {
        const cat = t.category || 'Outros';
        categories[cat] = (categories[cat] || 0) + t.amount;
      });

    return Object.entries(categories)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5); // Top 5
  }, [transactions]);

  // 3. Operational KPIs
  const activeVehicles = fleet.filter(v => v.status === 'Operacional').length;
  const fleetTotal = fleet.length || 1;
  const fleetAvailability = Math.round((activeVehicles / fleetTotal) * 100);

  const pendingSales = budgets.filter(b => b.status === 'Aberto').length;
  const salesToday = sales.filter(s => s.date === new Date().toLocaleDateString('pt-BR')).reduce((acc, s) => acc + s.amount, 0);

  const lowStockCount = inventory.filter(i => i.quantity <= i.minStock).length;
  const pendingPayrollCount = payroll.filter(p => p.status === 'Pendente').length;

  // Dynamic Monthly Growth & Payables Ratio
  const monthlyGrowthPct = useMemo(() => {
    if (chartData.length < 2) return 0;
    const curr = chartData[chartData.length - 1].Receita - chartData[chartData.length - 1].Despesa;
    const prev = chartData[chartData.length - 2].Receita - chartData[chartData.length - 2].Despesa;
    if (prev === 0) return curr > 0 ? 100 : 0;
    return Number((((curr - prev) / Math.abs(prev)) * 100).toFixed(1));
  }, [chartData]);

  const payablesRatioPct = useMemo(() => {
    const totalOut = financials.totalExpenses + financials.payables;
    if (totalOut <= 0) return 0;
    return Math.min(100, Math.round((financials.payables / totalOut) * 100));
  }, [financials]);

  // Colors for Charts
  const COLORS = ['#0ea5e9', '#ef4444', '#eab308', '#8b5cf6', '#10b981'];

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-500 pb-10">

      {/* --- Header Section --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-xl text-white shadow-lg shadow-indigo-500/20">
              <Layers size={24} />
            </div>
            Visão Geral
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mt-1 ml-1">
            Bem-vindo ao cockpit do <span className="text-indigo-600 dark:text-indigo-400 font-bold">InfraCore ERP</span>
          </p>
        </div>

        <div className="flex items-center gap-3 bg-white dark:bg-slate-800 p-2 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="px-4 py-2 bg-slate-50 dark:bg-slate-900 rounded-xl flex items-center gap-2 border border-slate-100 dark:border-slate-800">
            <Calendar size={16} className="text-indigo-500" />
            <span className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase">
              {new Date().toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'long' })}
            </span>
          </div>
          <NavLink to="/reports" title="Pesquisar nos Relatórios" className="p-2.5 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl text-slate-400 hover:text-indigo-500 transition-colors">
            <Search size={20} />
          </NavLink>
        </div>
      </div>

      {/* --- Quick Access Toolbar --- */}
      <div className="flex flex-col lg:flex-row gap-4 mb-2">
        {/* Main Action: Nova Venda */}
        <NavLink to="/sales" className="lg:min-w-[240px] flex items-center justify-between p-6 bg-indigo-600 rounded-[2rem] shadow-xl shadow-indigo-600/20 group hover:scale-[1.02] active:scale-[0.98] transition-all relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 bg-white/5 rounded-full -mr-4 -mt-4 opacity-50"></div>
          <div className="relative z-10">
            <p className="text-[10px] font-bold text-indigo-200 uppercase tracking-wider mb-1">Ação Rápida</p>
            <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Nova Venda</h3>
          </div>
          <div className="relative z-10 p-3 bg-white/20 rounded-2xl text-white group-hover:bg-white group-hover:text-indigo-600 transition-colors shadow-lg">
            <ShoppingCart size={24} />
          </div>
        </NavLink>

        {/* Module Shortcuts */}
        <div className="flex-1 grid grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-3">
          {[
            { label: 'Vendas', path: '/sales', icon: ShoppingCart },
            { label: 'Compras', path: '/purchases', icon: Package },
            { label: 'Cadastros', path: '/clients', icon: Users },
            { label: 'Produção', path: '/production', icon: Layers },
            { label: 'Financeiro', path: '/finance', icon: DollarSign },
            { label: 'RH', path: '/hr', icon: Users },
            { label: 'Relatórios', path: '/reports', icon: PieChart },
            { label: 'Frota', path: '/fleet', icon: Truck },
          ].map((mod, i) => (
            <NavLink key={i} to={mod.path} className="flex flex-col items-center justify-center p-3 bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm hover:border-indigo-500/30 hover:shadow-lg hover:-translate-y-1 transition-all group">
              <mod.icon size={22} className="mb-2 text-slate-400 group-hover:text-indigo-500 transition-colors" />
              <span className="text-[9px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400">{mod.label}</span>
            </NavLink>
          ))}
        </div>
      </div>

      {/* --- Financial KPI Cards --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">

        {/* Balance Card */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-700 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform duration-500">
            <Wallet size={100} />
          </div>
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-2xl">
                <DollarSign size={24} />
              </div>
              <span className="text-[10px] font-black uppercase text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-lg">
                Real
              </span>
            </div>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Saldo Atual</p>
            <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">
              {formatMoney(financials.balance)}
            </h3>
            <div className="mt-4 flex items-center gap-2 text-xs font-bold text-slate-400">
              <span className={`${monthlyGrowthPct >= 0 ? 'text-emerald-500' : 'text-rose-500'} flex items-center gap-1`}>
                {monthlyGrowthPct >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                {monthlyGrowthPct >= 0 ? `+${monthlyGrowthPct}%` : `${monthlyGrowthPct}%`}
              </span>
              vs mês anterior
            </div>
          </div>
        </div>

        {/* Sales Card */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-700 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform duration-500">
            <ShoppingCart size={100} />
          </div>
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-2xl">
                <Activity size={24} />
              </div>
              <span className="text-[10px] font-black uppercase text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-lg">
                Hoje
              </span>
            </div>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Vendas do Dia</p>
            <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">
              {formatMoney(salesToday)}
            </h3>
            <div className="mt-4 flex items-center gap-2 text-xs font-bold text-slate-400">
              <span className="text-slate-500">{pendingSales} orçamentos abertos</span>
            </div>
          </div>
        </div>

        {/* Payables Card */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-700 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform duration-500">
            <TrendingDown size={100} />
          </div>
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-rose-50 dark:bg-rose-900/20 text-rose-600 rounded-2xl">
                <TrendingDown size={24} />
              </div>
              <span className="text-[10px] font-black uppercase text-rose-600 bg-rose-50 dark:bg-rose-900/20 px-2 py-1 rounded-lg">
                Pendente
              </span>
            </div>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Contas a Pagar</p>
            <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">
              {formatMoney(financials.payables)}
            </h3>
            <div className="mt-4 w-full bg-slate-100 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
              <div className="h-full bg-rose-500 rounded-full" style={{ width: `${payablesRatioPct}%` }}></div>
            </div>
          </div>
        </div>

        {/* Fleet/Ops Card */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-700 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform duration-500">
            <Truck size={100} />
          </div>
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-600 rounded-2xl">
                <Truck size={24} />
              </div>
              <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-lg ${fleetAvailability >= 80 ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                {fleetAvailability}% Op.
              </span>
            </div>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Frota Ativa</p>
            <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">
              {activeVehicles} <span className="text-lg text-slate-400 font-bold">/ {fleetTotal}</span>
            </h3>
            <div className="mt-4 flex gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className={`h-1.5 flex-1 rounded-full ${i < (fleetAvailability / 20) ? 'bg-amber-500' : 'bg-slate-100 dark:bg-slate-700'}`}></div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* --- Charts Section --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Main Cash Flow Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-8 rounded-[2rem] border border-slate-100 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">Fluxo de Caixa</h3>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Receitas vs Despesas (Últimos 6 meses)</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-indigo-500"></span>
                <span className="text-[10px] font-black text-slate-500 uppercase">Receita</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500"></span>
                <span className="text-[10px] font-black text-slate-500 uppercase">Despesa</span>
              </div>
            </div>
          </div>

          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRec" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorDesp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 700 }}
                  dy={10}
                />
                <YAxis
                  hide
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderColor: '#334155',
                    borderRadius: '12px',
                    color: '#f8fafc',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                  }}
                  itemStyle={{ fontSize: 12, fontWeight: 600 }}
                  labelStyle={{ color: '#94a3b8', marginBottom: 8, fontSize: 11, fontWeight: 800, textTransform: 'uppercase' }}
                  formatter={(value: number) => formatMoney(value)}
                />
                <Area
                  type="monotone"
                  dataKey="Receita"
                  stroke="#6366f1"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorRec)"
                />
                <Area
                  type="monotone"
                  dataKey="Despesa"
                  stroke="#f43f5e"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorDesp)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expenses Pie Chart */}
        <div className="bg-white dark:bg-slate-800 p-8 rounded-[2rem] border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col">
          <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight mb-2">Despesas</h3>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-6">Por Categoria</p>

          <div className="flex-1 min-h-[250px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPieChart>
                <Pie
                  data={expenseCategories}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {expenseCategories.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => formatMoney(value)}
                  contentStyle={{ borderRadius: '12px', border: 'none', backgroundColor: '#0f172a', color: '#fff' }}
                />
                <Legend
                  layout="horizontal"
                  verticalAlign="bottom"
                  align="center"
                  iconType="circle"
                  wrapperStyle={{ fontSize: '10px', fontWeight: 700, paddingTop: '20px' }}
                />
              </RechartsPieChart>
            </ResponsiveContainer>
            {/* Center Text */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none pb-8">
              <span className="text-xs font-black text-slate-400 uppercase">Top 5</span>
            </div>
          </div>
        </div>
      </div>

      {/* --- Alerts Section --- */}
      <div className="w-full">
        <div className="bg-slate-900 text-white p-6 sm:p-8 rounded-[2rem] shadow-xl relative">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
            <div>
              <h3 className="text-xl font-black uppercase tracking-tight mb-1 flex items-center gap-3">
                <div className="w-2.5 h-2.5 bg-rose-500 rounded-full animate-pulse"></div>
                Central de Notificações Completa
              </h3>
              <p className="text-slate-400 text-sm">
                Resumo em tempo real de todas as pendências críticas, operacionais e financeiras do sistema.
              </p>
            </div>
            <NavLink
              to="/settings"
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-slate-200 transition-colors self-start md:self-auto"
            >
              Configurar Alertas
            </NavLink>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6 relative z-10">
            {/* 1. Low Stock Alert */}
            <NavLink
              to="/purchases"
              className="flex items-center gap-4 p-4 bg-white/10 rounded-2xl hover:bg-white/20 transition-all border border-white/10"
            >
              <div className={`p-3 rounded-xl shrink-0 ${lowStockCount > 0 ? 'bg-orange-500/20 text-orange-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                <Package size={24} />
              </div>
              <div className="min-w-0 flex-1">
                <p className={`text-[10px] font-black uppercase tracking-wider ${lowStockCount > 0 ? 'text-orange-400' : 'text-emerald-400'}`}>
                  Estoque & Almoxarifado
                </p>
                <p className="text-base font-bold truncate">
                  {lowStockCount > 0 ? `${lowStockCount} itens em nível crítico` : 'Estoque regularizado'}
                </p>
              </div>
              <ArrowRight size={16} className="ml-auto text-white/40 shrink-0" />
            </NavLink>

            {/* 2. Payables Alert */}
            <NavLink
              to="/finance"
              className="flex items-center gap-4 p-4 bg-white/10 rounded-2xl hover:bg-white/20 transition-all border border-white/10"
            >
              <div className={`p-3 rounded-xl shrink-0 ${financials.payables > 0 ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                <DollarSign size={24} />
              </div>
              <div className="min-w-0 flex-1">
                <p className={`text-[10px] font-black uppercase tracking-wider ${financials.payables > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  Contas a Pagar Pendentes
                </p>
                <p className="text-base font-bold truncate">
                  {financials.payables > 0 ? formatMoney(financials.payables) : 'Nenhuma pendência'}
                </p>
              </div>
              <ArrowRight size={16} className="ml-auto text-white/40 shrink-0" />
            </NavLink>

            {/* 3. Payroll Alert */}
            <NavLink
              to="/hr"
              className="flex items-center gap-4 p-4 bg-white/10 rounded-2xl hover:bg-white/20 transition-all border border-white/10"
            >
              <div className={`p-3 rounded-xl shrink-0 ${pendingPayrollCount > 0 ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                <Users size={24} />
              </div>
              <div className="min-w-0 flex-1">
                <p className={`text-[10px] font-black uppercase tracking-wider ${pendingPayrollCount > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  Folha de Pagamento & RH
                </p>
                <p className="text-base font-bold truncate">
                  {pendingPayrollCount > 0 ? `${pendingPayrollCount} folha(s) pendente(s)` : 'Folha em dia'}
                </p>
              </div>
              <ArrowRight size={16} className="ml-auto text-white/40 shrink-0" />
            </NavLink>

            {/* 4. Fleet Alert */}
            <NavLink
              to="/fleet"
              className="flex items-center gap-4 p-4 bg-white/10 rounded-2xl hover:bg-white/20 transition-all border border-white/10"
            >
              <div className="p-3 bg-indigo-500/20 text-indigo-400 rounded-xl shrink-0">
                <Truck size={24} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-wider">Frota Operacional</p>
                <p className="text-base font-bold truncate">
                  {activeVehicles}/{fleet.length || 0} ativos ({fleetAvailability}%)
                </p>
              </div>
              <ArrowRight size={16} className="ml-auto text-white/40 shrink-0" />
            </NavLink>

            {/* 5. Open Budgets Alert */}
            <NavLink
              to="/sales"
              className="flex items-center gap-4 p-4 bg-white/10 rounded-2xl hover:bg-white/20 transition-all border border-white/10"
            >
              <div className="p-3 bg-cyan-500/20 text-cyan-400 rounded-xl shrink-0">
                <ShoppingCart size={24} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-black text-cyan-400 uppercase tracking-wider">Orçamentos em Aberto</p>
                <p className="text-base font-bold truncate">
                  {pendingSales > 0 ? `${pendingSales} proposta(s) aberta(s)` : 'Sem propostas pendentes'}
                </p>
              </div>
              <ArrowRight size={16} className="ml-auto text-white/40 shrink-0" />
            </NavLink>

            {/* 6. Receivables Alert */}
            <NavLink
              to="/finance"
              className="flex items-center gap-4 p-4 bg-white/10 rounded-2xl hover:bg-white/20 transition-all border border-white/10"
            >
              <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-xl shrink-0">
                <Wallet size={24} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-black text-emerald-400 uppercase tracking-wider">Contas a Receber</p>
                <p className="text-base font-bold truncate">
                  {formatMoney(financials.receivables)}
                </p>
              </div>
              <ArrowRight size={16} className="ml-auto text-white/40 shrink-0" />
            </NavLink>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Dashboard;