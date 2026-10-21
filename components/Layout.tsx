import React, { useState, useEffect, useMemo } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  ShoppingCart,
  ShoppingBag,
  DollarSign,
  Briefcase,
  FileText,
  Bell,
  Menu,
  Construction,
  Search,
  ChevronDown,
  Truck,
  Settings,
  LogOut,
  User as UserIcon,
  Sliders,
  Sun,
  Moon,
  Maximize2,
  Minimize2,
  PanelLeft,
  Layers,
  Sparkles,
  RotateCcw,
  X,
  AlertTriangle,
  CheckCircle2,
  Package,
  ArrowRight,
  Activity,
  Database,
  Command
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { isSupabaseConfigured } from '../src/lib/supabase';
import AIAuditAgent from './AIAuditAgent';

type NavMode = 'classic' | 'sidebar' | 'dual-deck' | 'floating-dock';
type VisualStyle = 'original' | 'scada' | 'bento-glass';
type DensityMode = 'compact' | 'standard' | 'comfortable';
type ContainerWidthMode = '1600' | 'full';
type AccentTheme = 'cyan' | 'indigo' | 'emerald' | 'amber';

interface LayoutPreferences {
  navMode: NavMode;
  visualStyle: VisualStyle;
  density: DensityMode;
  containerWidth: ContainerWidthMode;
  accent: AccentTheme;
  theme: 'light' | 'dark';
  showCustomizerBar: boolean;
  sidebarCollapsed: boolean;
}

const DEFAULT_PREFS: LayoutPreferences = {
  navMode: 'classic',
  visualStyle: 'original',
  density: 'standard',
  containerWidth: '1600',
  accent: 'cyan',
  theme: 'light',
  showCustomizerBar: true,
  sidebarCollapsed: false
};

const formatCurrency = (val: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);

const Layout = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isNotificationsExpanded, setIsNotificationsExpanded] = useState(false);
  const [notifFilter, setNotifFilter] = useState<'all' | 'critical' | 'ops' | 'finance'>('all');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');

  const {
    currentUser,
    logout,
    hasPermission,
    roles,
    settings,
    updateSettings,
    inventory,
    transactions,
    payroll,
    fleet,
    budgets,
    productionOrders,
    productionUnits,
    clients,
    sales,
    vacations,
    salaryAdvances,
    financials
  } = useApp();

  const navigate = useNavigate();
  const location = useLocation();

  // Load persisted layout preferences without ever losing the original default
  const [prefs, setPrefs] = useState<LayoutPreferences>(() => {
    try {
      const saved = localStorage.getItem('infracore_layout_prefs_v2');
      if (saved) {
        return { ...DEFAULT_PREFS, ...JSON.parse(saved) };
      }
    } catch {
      // ignore storage errors
    }
    return {
      ...DEFAULT_PREFS,
      theme: settings?.theme === 'dark' ? 'dark' : 'light',
      density: (settings?.interfaceDensity as DensityMode) || 'standard'
    };
  });

  useEffect(() => {
    try {
      localStorage.setItem('infracore_layout_prefs_v2', JSON.stringify(prefs));
    } catch {
      // ignore storage errors
    }
    if (prefs.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [prefs]);

  // Global Ctrl+K shortcut for Command Palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      } else if (e.key === 'Escape') {
        setIsSearchOpen(false);
        setIsNotificationsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const updatePref = <K extends keyof LayoutPreferences>(key: K, value: LayoutPreferences[K]) => {
    setPrefs(prev => ({ ...prev, [key]: value }));
    if (key === 'theme' && settings) {
      updateSettings({ ...settings, theme: value as 'light' | 'dark' });
    }
    if (key === 'density' && settings) {
      updateSettings({ ...settings, interfaceDensity: value as any });
    }
  };

  const resetToOriginalLayout = () => {
    setPrefs({
      ...DEFAULT_PREFS,
      showCustomizerBar: true
    });
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const currentRoleName = useMemo(() => {
    return roles.find(r => r.id === currentUser?.roleId)?.name || 'Usuário';
  }, [currentUser, roles]);

  const navItems = [
    { name: 'Dashboard', path: '/', icon: <LayoutDashboard size={18} />, group: 'Operação' },
    { name: 'Cadastros', path: '/clients', icon: <Users size={18} />, permission: 'clients.view', group: 'Comercial' },
    { name: 'Faturamento', path: '/sales', icon: <ShoppingCart size={18} />, permission: 'sales.view', group: 'Comercial' },
    { name: 'Custos e Despesas', path: '/purchases', icon: <ShoppingBag size={18} />, permission: 'purchases.view', group: 'Suprimentos' },
    { name: 'Produção', path: '/production', icon: <Construction size={18} />, permission: 'production.view', group: 'Operação' },
    { name: 'Financeiro', path: '/finance', icon: <DollarSign size={18} />, permission: 'finance.dashboard', group: 'Gestão' },
    { name: 'RH', path: '/hr', icon: <Briefcase size={18} />, permission: 'hr.view', group: 'Gestão' },
    { name: 'Frota', path: '/fleet', icon: <Truck size={18} />, permission: 'fleet.view', group: 'Suprimentos' },
    { name: 'Relatórios', path: '/reports', icon: <FileText size={18} />, permission: 'reports.view_basic', group: 'Governança' },
    { name: 'Configurações', path: '/settings', icon: <Settings size={18} />, permission: 'settings.view', group: 'Governança' },
  ].filter(item => !item.permission || hasPermission(item.permission));

  // Real-time system notifications (respecting settings.notifications preferences)
  const systemNotifications = useMemo(() => {
    const list: Array<{
      id: string;
      title: string;
      description: string;
      detail: string;
      category: 'critical' | 'ops' | 'finance';
      severity: 'high' | 'medium' | 'low';
      path: string;
      badge: string;
    }> = [];

    // 1. Critical Stock
    const lowStockItems = (inventory || []).filter(i => i.quantity <= (i.minStock || 0));
    if (lowStockItems.length > 0 && (settings?.notifications?.stockAlerts ?? true)) {
      list.push({
        id: 'notif-stock',
        title: `Estoque Crítico (${lowStockItems.length} ${lowStockItems.length === 1 ? 'item' : 'itens'})`,
        description: `Insumos atingiram ou ficaram abaixo do estoque mínimo de segurança.`,
        detail: lowStockItems.slice(0, 4).map(i => `${i.name} (${i.quantity} ${i.unit || 'un'})`).join(' • '),
        category: 'critical',
        severity: 'high',
        path: '/purchases',
        badge: 'Almoxarifado'
      });
    }

    // 2. Pending / Overdue Payables
    const pendingPayables = (transactions || []).filter(
      t => t.type === 'Despesa' && (t.status === 'Pendente' || t.status === 'Vencido')
    );
    if (pendingPayables.length > 0 && (settings?.notifications?.overdueFinance ?? true)) {
      const totalPending = pendingPayables.reduce((acc, t) => acc + (t.amount || 0), 0);
      list.push({
        id: 'notif-finance-pay',
        title: `Contas a Pagar Pendentes (${pendingPayables.length})`,
        description: `Existem lançamentos aguardando baixa ou conciliação bancária.`,
        detail: `Total pendente: ${formatCurrency(totalPending)}`,
        category: 'finance',
        severity: 'high',
        path: '/finance',
        badge: 'Financeiro'
      });
    }

    // 3. Pending Receivables
    const pendingReceivables = (transactions || []).filter(
      t => t.type === 'Receita' && t.status === 'Pendente'
    );
    if (pendingReceivables.length > 0 && (settings?.notifications?.overdueFinance ?? true)) {
      const totalRec = pendingReceivables.reduce((acc, t) => acc + (t.amount || 0), 0);
      list.push({
        id: 'notif-finance-rec',
        title: `Recebíveis em Aberto (${pendingReceivables.length})`,
        description: `Títulos de clientes aguardando compensação ou recebimento.`,
        detail: `Total a receber: ${formatCurrency(totalRec)}`,
        category: 'finance',
        severity: 'medium',
        path: '/finance',
        badge: 'Tesouraria'
      });
    }

    // 4. Payroll & HR Pending
    const pendingPayroll = (payroll || []).filter(p => p.status === 'Pendente');
    const pendingVacations = (vacations || []).filter(v => v.status === 'Solicitado');
    const pendingAdvances = (salaryAdvances || []).filter(a => a.status === 'Pendente');
    if (pendingPayroll.length > 0 || pendingVacations.length > 0 || pendingAdvances.length > 0) {
      list.push({
        id: 'notif-hr',
        title: `Pendências de RH & Folha (${pendingPayroll.length + pendingVacations.length + pendingAdvances.length})`,
        description: `${pendingPayroll.length} folha(s) pendente(s), ${pendingVacations.length} férias solicitadas e ${pendingAdvances.length} adiantamento(s).`,
        detail: `Acesse o módulo de RH para aprovar ou liberar pagamentos.`,
        category: 'finance',
        severity: pendingPayroll.length > 0 ? 'high' : 'medium',
        path: '/hr',
        badge: 'Recursos Humanos'
      });
    }

    // 5. Fleet Maintenance
    const maintVehicles = (fleet || []).filter(
      v => v.status === 'Manutenção' || (v.nextMaintenanceKm && v.km >= v.nextMaintenanceKm - 500)
    );
    if (maintVehicles.length > 0 && (settings?.notifications?.fleetMaintenance ?? true)) {
      list.push({
        id: 'notif-fleet',
        title: `Alerta de Frota & Manutenção (${maintVehicles.length} veículo${maintVehicles.length === 1 ? '' : 's'})`,
        description: `Veículos em manutenção ou próximos da revisão preventiva por KM.`,
        detail: maintVehicles.map(v => `${v.plate} (${v.name || v.model})`).join(' • '),
        category: 'ops',
        severity: 'medium',
        path: '/fleet',
        badge: 'Frota Pesada'
      });
    }

    // 6. Open Budgets
    const openBudgets = (budgets || []).filter(b => b.status === 'Aberto' || b.status === 'Pendente');
    if (openBudgets.length > 0) {
      const totalBudgets = openBudgets.reduce((acc, b) => acc + (b.total || 0), 0);
      list.push({
        id: 'notif-budgets',
        title: `Orçamentos Aguardando Aprovação (${openBudgets.length})`,
        description: `Propostas comerciais prontas para conversão em venda/pesagem.`,
        detail: `Volume em negociação: ${formatCurrency(totalBudgets)}`,
        category: 'ops',
        severity: 'low',
        path: '/sales',
        badge: 'Comercial'
      });
    }

    // 7. Production Units & Active Orders
    const activeOrders = (productionOrders || []).filter(o => o.status === 'Em Produção');
    if (activeOrders.length > 0 && (settings?.notifications?.productionUpdates ?? true)) {
      list.push({
        id: 'notif-production',
        title: `Ordens de Produção em Andamento (${activeOrders.length})`,
        description: `Usinas operando com ordens ativas no chão de fábrica.`,
        detail: activeOrders.map(o => `${o.orderNumber || o.productName} (${o.progress || 0}%)`).join(' • '),
        category: 'ops',
        severity: 'low',
        path: '/production',
        badge: 'PCP & Usinas'
      });
    }

    return list;
  }, [inventory, transactions, payroll, vacations, salaryAdvances, fleet, budgets, productionOrders, settings]);

  const filteredNotifications = useMemo(() => {
    if (notifFilter === 'all') return systemNotifications;
    return systemNotifications.filter(n => n.category === notifFilter);
  }, [systemNotifications, notifFilter]);

  // Accent color dynamic classes
  const accentBadgeClass = {
    cyan: 'bg-cyan-600 text-white',
    indigo: 'bg-indigo-600 text-white',
    emerald: 'bg-emerald-600 text-white',
    amber: 'bg-amber-500 text-slate-950'
  }[prefs.accent];

  const activeNavClass = {
    cyan: 'bg-slate-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400 font-bold',
    indigo: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 font-bold',
    emerald: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 font-bold',
    amber: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 font-bold'
  }[prefs.accent];

  const containerClass = prefs.containerWidth === 'full' ? 'max-w-full px-4 sm:px-8' : 'max-w-[1600px] px-4 sm:px-6 lg:px-8';
  const mainPaddingClass =
    prefs.density === 'compact'
      ? 'py-3 text-[13px]'
      : prefs.density === 'comfortable'
      ? 'py-8'
      : 'py-6';

  const bgSurfaceClass =
    prefs.visualStyle === 'scada'
      ? 'bg-slate-950 text-slate-100'
      : prefs.visualStyle === 'bento-glass'
      ? 'bg-gradient-to-br from-slate-50 via-cyan-50/40 to-indigo-50/40 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/30 text-slate-900 dark:text-white'
      : 'bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white';

  // Quick Global Search Results (Ctrl+K)
  const searchResults = useMemo(() => {
    const q = globalSearchQuery.trim().toLowerCase();
    if (!q) return [];
    const results: Array<{ type: string; label: string; sub: string; path: string }> = [];

    navItems.forEach(item => {
      if (item.name.toLowerCase().includes(q)) {
        results.push({ type: 'Módulo', label: item.name, sub: `Ir para ${item.path}`, path: item.path });
      }
    });
    (clients || []).forEach(c => {
      if (c.name?.toLowerCase().includes(q) || c.document?.toLowerCase().includes(q)) {
        results.push({ type: 'Cliente', label: c.name, sub: c.document || c.phone || '', path: '/clients' });
      }
    });
    (fleet || []).forEach(v => {
      if (v.plate?.toLowerCase().includes(q) || v.name?.toLowerCase().includes(q) || v.model?.toLowerCase().includes(q)) {
        results.push({ type: 'Frota', label: `${v.plate} - ${v.name || v.model}`, sub: v.status, path: '/fleet' });
      }
    });
    (inventory || []).forEach(i => {
      if (i.name?.toLowerCase().includes(q) || i.category?.toLowerCase().includes(q)) {
        results.push({ type: 'Estoque', label: i.name, sub: `Saldo: ${i.quantity} ${i.unit || 'un'}`, path: '/purchases' });
      }
    });
    return results.slice(0, 8);
  }, [globalSearchQuery, navItems, clients, fleet, inventory]);

  return (
    <div className={`${bgSurfaceClass} min-h-screen flex flex-col font-body transition-colors duration-200`}>
      {/* =====================================================================
          OPÇÃO 12: BARRA DE PERSONALIZAÇÃO EM TEMPO REAL (EXPANSÍVEL)
          Mantém 100% da estrutura antiga e adiciona opções de alternância
         ===================================================================== */}
      {prefs.showCustomizerBar && (
        <div className="bg-slate-900 text-slate-200 border-b border-slate-800 z-[60] text-xs transition-all">
          <div className={`${containerClass} mx-auto py-2 flex flex-wrap items-center justify-between gap-2`}>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-gradient-to-r from-cyan-500 to-indigo-500 text-white font-black text-[10px] uppercase tracking-wider flex items-center gap-1 shadow-sm">
                <Sliders size={11} /> Barra de Personalização
              </span>
              <span className="hidden xl:inline text-[11px] text-slate-400">
                Alterne modos sem perder o layout original:
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* 1. Modo de Navegação */}
              <div className="flex items-center bg-slate-800/90 p-0.5 rounded-lg border border-slate-700">
                <span className="text-[10px] font-bold text-slate-400 px-2 hidden sm:inline">Navegação:</span>
                {[
                  { id: 'classic', label: 'Clássico (Original)' },
                  { id: 'sidebar', label: 'Sidebar Lateral' },
                  { id: 'dual-deck', label: 'Topo 2 Andares' },
                  { id: 'floating-dock', label: 'Dock Flutuante' }
                ].map(mode => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => updatePref('navMode', mode.id as NavMode)}
                    className={`px-2 py-1 rounded-md text-[11px] font-bold transition-all ${
                      prefs.navMode === mode.id
                        ? 'bg-cyan-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>

              {/* 2. Estilo Visual */}
              <div className="flex items-center bg-slate-800/90 p-0.5 rounded-lg border border-slate-700">
                <span className="text-[10px] font-bold text-slate-400 px-2 hidden md:inline">Visual:</span>
                {[
                  { id: 'original', label: 'Original' },
                  { id: 'scada', label: 'Industrial COI' },
                  { id: 'bento-glass', label: 'Bento Glass' }
                ].map(st => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => updatePref('visualStyle', st.id as VisualStyle)}
                    className={`px-2 py-1 rounded-md text-[11px] font-bold transition-all ${
                      prefs.visualStyle === st.id
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>

              {/* 3. Densidade */}
              <div className="hidden lg:flex items-center bg-slate-800/90 p-0.5 rounded-lg border border-slate-700">
                <span className="text-[10px] font-bold text-slate-400 px-2">Densidade:</span>
                {[
                  { id: 'compact', label: 'Compacto' },
                  { id: 'standard', label: 'Padrão' },
                  { id: 'comfortable', label: 'Confortável' }
                ].map(d => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => updatePref('density', d.id as DensityMode)}
                    className={`px-2 py-1 rounded-md text-[11px] font-bold transition-all ${
                      prefs.density === d.id
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>

              {/* 4. Largura (1600px vs Fluido) */}
              <button
                type="button"
                onClick={() => updatePref('containerWidth', prefs.containerWidth === '1600' ? 'full' : '1600')}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[11px] font-bold text-slate-300 flex items-center gap-1"
                title="Alternar largura entre 1600px (Original) e Tela Cheia (100%)"
              >
                {prefs.containerWidth === 'full' ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
                <span>{prefs.containerWidth === 'full' ? 'Tela 100%' : '1600px'}</span>
              </button>

              {/* 5. Cor de Destaque */}
              <div className="hidden sm:flex items-center gap-1 bg-slate-800 px-2 py-1 rounded-lg border border-slate-700">
                {(
                  [
                    { id: 'cyan', color: 'bg-cyan-500', title: 'Azul Original' },
                    { id: 'indigo', color: 'bg-indigo-500', title: 'Índigo Executivo' },
                    { id: 'emerald', color: 'bg-emerald-500', title: 'Esmeralda Operacional' },
                    { id: 'amber', color: 'bg-amber-500', title: 'Âmbar Industrial' }
                  ] as const
                ).map(acc => (
                  <button
                    key={acc.id}
                    type="button"
                    title={acc.title}
                    onClick={() => updatePref('accent', acc.id)}
                    className={`w-3.5 h-3.5 rounded-full ${acc.color} transition-transform ${
                      prefs.accent === acc.id ? 'scale-125 ring-2 ring-white' : 'opacity-60 hover:opacity-100'
                    }`}
                  />
                ))}
              </div>

              {/* 6. Tema Claro / Escuro */}
              <button
                type="button"
                onClick={() => updatePref('theme', prefs.theme === 'dark' ? 'light' : 'dark')}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[11px] font-bold text-amber-300 flex items-center gap-1"
                title="Alternar entre Modo Claro e Modo Escuro"
              >
                {prefs.theme === 'dark' ? <Sun size={12} /> : <Moon size={12} />}
                <span>{prefs.theme === 'dark' ? 'Claro' : 'Escuro'}</span>
              </button>

              {/* 7. Restaurar Original */}
              <button
                type="button"
                onClick={resetToOriginalLayout}
                className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-rose-950/60 hover:text-rose-300 border border-slate-700 text-[11px] font-bold text-slate-400 flex items-center gap-1 transition-colors"
                title="Restaurar exatamente o layout original"
              >
                <RotateCcw size={11} />
                <span className="hidden sm:inline">Original</span>
              </button>

              {/* Ocultar barra */}
              <button
                type="button"
                onClick={() => updatePref('showCustomizerBar', false)}
                className="p-1 text-slate-400 hover:text-white rounded-md"
                title="Recolher barra de personalização"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          FITA DE TELEMETRIA INDUSTRIAL (Exibida quando Visual = Industrial COI)
         ===================================================================== */}
      {prefs.visualStyle === 'scada' && (
        <div className="bg-slate-900 border-b border-amber-500/30 text-xs font-mono text-slate-300 py-1.5 px-4">
          <div className={`${containerClass} mx-auto flex flex-wrap items-center justify-between gap-2`}>
            <div className="flex items-center gap-4">
              <span className="px-2 py-0.5 rounded bg-amber-500 text-slate-950 font-black">
                COI • TELEMETRIA AO VIVO
              </span>
              <span className="text-emerald-400">
                ● USINAS OPERANDO: {(productionUnits || []).filter(u => u.status === 'Operando').length}/{(productionUnits || []).length || 0}
              </span>
              <span className="text-cyan-400">
                ● FROTA ATIVA: {(fleet || []).filter(v => v.status === 'Operacional').length}/{(fleet || []).length || 0}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-amber-300">
                SALDO CAIXA: {formatCurrency(financials?.balance || 0)}
              </span>
              <span className={isSupabaseConfigured ? 'text-emerald-400' : 'text-amber-400'}>
                {isSupabaseConfigured ? '🟢 SUPABASE ONLINE' : '🟡 MODO LOCAL'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          HEADER PRINCIPAL (ESTRUTURA ORIGINAL PRESERVADA + MELHORIAS)
         ===================================================================== */}
      <header
        className={`${
          prefs.visualStyle === 'bento-glass'
            ? 'bg-white/85 dark:bg-slate-800/85 backdrop-blur-xl'
            : 'bg-white dark:bg-slate-800'
        } border-b border-slate-200 dark:border-slate-700 sticky top-0 z-50 ${
          prefs.navMode === 'dual-deck' ? 'h-auto py-2' : 'h-16'
        } shadow-soft`}
      >
        <div className={`${containerClass} mx-auto h-full`}>
          <div className="flex items-center justify-between h-full gap-2 lg:gap-4">
            {/* Mobile Hamburger Button + Logo Area */}
            <div className="flex items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700"
                title="Abrir Menu"
              >
                <Menu size={20} />
              </button>
              <div
                onClick={() => navigate('/')}
                className="flex items-center gap-2.5 shrink-0 cursor-pointer"
              >
                <div className={`${accentBadgeClass} p-1.5 rounded-lg shadow-sm`}>
                  <Construction size={20} strokeWidth={2.5} />
                </div>
                <div className="flex flex-col">
                  <h1 className="text-slate-900 dark:text-white text-lg font-bold leading-none tracking-tight font-display">
                    InfraCore
                  </h1>
                </div>
              </div>
            </div>

            {/* Horizontal Navigation - Modules as Tabs (Preserved Original Structure) */}
            {prefs.navMode !== 'sidebar' && (
              <nav className="hidden lg:flex items-center gap-0.5 xl:gap-1 overflow-x-auto no-scrollbar min-w-0 flex-1 justify-start ml-2 xl:ml-4">
                {navItems.map(item => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                      `px-2.5 xl:px-3 py-2 rounded-lg text-xs xl:text-sm font-medium transition-all duration-200 ease-in-out flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                        isActive
                          ? activeNavClass
                          : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-700/50'
                      }`
                    }
                  >
                    {item.icon}
                    <span>{item.name}</span>
                  </NavLink>
                ))}
                <button
                  onClick={handleLogout}
                  className="px-2.5 xl:px-3 py-2 rounded-full text-xs xl:text-sm font-medium text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:text-slate-400 dark:hover:text-rose-400 dark:hover:bg-rose-900/20 transition-all duration-200 ease-in-out flex items-center gap-1.5 whitespace-nowrap shrink-0"
                >
                  <LogOut size={17} />
                  <span>Sair</span>
                </button>
              </nav>
            )}

            {/* When in Sidebar Mode, show Breadcrumb + Quick Search in Header */}
            {prefs.navMode === 'sidebar' && (
              <div className="hidden lg:flex items-center gap-3 flex-1 ml-4">
                <button
                  type="button"
                  onClick={() => updatePref('sidebarCollapsed', !prefs.sidebarCollapsed)}
                  className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-cyan-600"
                  title="Recolher / Expandir Sidebar Lateral"
                >
                  <PanelLeft size={18} />
                </button>
                <div className="text-xs font-bold text-slate-400">
                  InfraCore ERP <span className="mx-1">/</span>
                  <span className="text-slate-800 dark:text-white uppercase">
                    {navItems.find(n => n.path === location.pathname)?.name || 'Visão Geral'}
                  </span>
                </div>
              </div>
            )}

            {/* Right Actions: Search (Ctrl+K), Customizer Toggle, Notifications Bell & User Profile */}
            <div className="flex items-center gap-2 shrink-0 ml-auto">
              {/* Quick Search Button (Ctrl+K) */}
              <button
                type="button"
                onClick={() => setIsSearchOpen(true)}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-700/70 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-1.5 text-xs font-bold"
                title="Busca Rápida Global (Ctrl+K)"
              >
                <Search size={16} />
                <span className="hidden 2xl:inline text-[11px] text-slate-400">Ctrl+K</span>
              </button>

              {/* Toggle Personalization Bar Button */}
              <button
                type="button"
                onClick={() => updatePref('showCustomizerBar', !prefs.showCustomizerBar)}
                className={`p-2 rounded-xl border transition-all flex items-center gap-1.5 text-xs font-bold ${
                  prefs.showCustomizerBar
                    ? 'bg-cyan-50 dark:bg-cyan-950/50 border-cyan-300 dark:border-cyan-700 text-cyan-700 dark:text-cyan-300'
                    : 'bg-slate-100 dark:bg-slate-700/70 border-transparent text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
                title="Mostrar / Ocultar Barra de Personalização de Layout (Opção 12)"
              >
                <Sliders size={16} />
                <span className="hidden xl:inline text-[11px]">Layout</span>
              </button>

              {/* Notification Bell Button (Opens Full Unclipped Notification Window) */}
              <button
                type="button"
                onClick={() => setIsNotificationsOpen(prev => !prev)}
                className={`relative p-2 rounded-xl border transition-all flex items-center justify-center ${
                  isNotificationsOpen
                    ? 'bg-rose-50 dark:bg-rose-950/50 border-rose-300 dark:border-rose-700 text-rose-600 dark:text-rose-300'
                    : 'bg-slate-100 dark:bg-slate-700/70 border-transparent text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
                title="Abrir Janela Completa de Notificações"
              >
                <Bell size={18} />
                {systemNotifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-600 text-white text-[10px] font-black flex items-center justify-center shadow-sm">
                    {systemNotifications.length}
                  </span>
                )}
              </button>

              {/* User Profile (Preserved Original Structure) */}
              <div className="hidden xl:flex flex-col items-end mr-1 pl-2">
                <span className="text-sm font-bold text-slate-800 dark:text-white leading-none">
                  {currentUser?.name || 'Visitante'}
                </span>
                <span className="text-[10px] uppercase font-black tracking-wider text-slate-400 mt-1">
                  {currentRoleName}
                </span>
              </div>
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-700">
                <div className="w-9 h-9 xl:w-10 xl:h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500 overflow-hidden shadow-inner ring-2 ring-white dark:ring-slate-800">
                  {currentUser?.avatar ? (
                    <img src={currentUser.avatar} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <UserIcon size={20} />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Second Deck when in Dual-Deck Mode */}
          {prefs.navMode === 'dual-deck' && (
            <div className="hidden lg:flex items-center justify-between pt-2 mt-2 border-t border-slate-100 dark:border-slate-700/60 text-xs">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold text-[10px]">
                  ● {isSupabaseConfigured ? 'Supabase Sincronizado' : 'Armazenamento Local Ativo'}
                </span>
                <span className="text-slate-400">|</span>
                <span className="text-slate-500 dark:text-slate-400 font-medium">
                  Módulo Ativo:{' '}
                  <strong className="text-slate-800 dark:text-white">
                    {navItems.find(n => n.path === location.pathname)?.name || 'Dashboard'}
                  </strong>
                </span>
              </div>
              <div className="flex items-center gap-4 text-[11px] font-bold text-slate-500 dark:text-slate-400">
                <span>Alertas Ativos: <strong className="text-rose-500">{systemNotifications.length}</strong></span>
                <span>Caixa: <strong className="text-emerald-600 dark:text-emerald-400">{formatCurrency(financials?.balance || 0)}</strong></span>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* =====================================================================
          MENU MOBILE / TABLET DE PÁTIO (Drawer Responsivo)
         ===================================================================== */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[100] lg:hidden flex">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs" onClick={() => setIsMobileMenuOpen(false)} />
          <div className="relative w-72 max-w-[85vw] bg-white dark:bg-slate-900 h-full shadow-2xl border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between p-4 z-10 overflow-y-auto">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className={`${accentBadgeClass} p-1.5 rounded-lg`}>
                    <Construction size={18} />
                  </div>
                  <span className="font-bold text-base text-slate-900 dark:text-white">InfraCore ERP</span>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="space-y-1">
                {navItems.map(item => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `px-3 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-3 transition-all ${
                        isActive
                          ? activeNavClass
                          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`
                    }
                  >
                    {item.icon}
                    <span>{item.name}</span>
                  </NavLink>
                ))}
              </div>
            </div>
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={handleLogout}
                className="w-full py-2.5 px-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-bold text-sm flex items-center justify-center gap-2"
              >
                <LogOut size={16} /> Sair do Sistema
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          JANELA DE NOTIFICAÇÕES 100% VISÍVEL (Sem Cortes, Com Rolagem & Expansão)
         ===================================================================== */}
      {isNotificationsOpen && (
        <div className="fixed inset-0 z-[150] pointer-events-none flex justify-end">
          {/* Backdrop click to close */}
          <div
            className="fixed inset-0 bg-black/20 backdrop-blur-[1px] pointer-events-auto"
            onClick={() => setIsNotificationsOpen(false)}
          />

          <div
            className={`pointer-events-auto relative z-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl flex flex-col transition-all duration-200 ${
              isNotificationsExpanded
                ? 'w-full max-w-xl h-screen rounded-none sm:rounded-l-3xl'
                : 'mt-16 mr-2 sm:mr-6 w-[calc(100vw-1rem)] sm:w-[460px] max-h-[calc(100vh-5rem)] rounded-3xl'
            } overflow-hidden`}
          >
            {/* Header da Janela de Notificações */}
            <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
                  <Bell size={18} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-black uppercase tracking-wider">Central de Notificações</h3>
                    <span className="px-2 py-0.5 text-[10px] font-black rounded-full bg-rose-600 text-white">
                      {systemNotifications.length}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Alertas operacionais, estoque, financeiro e frota em tempo real
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setIsNotificationsExpanded(!isNotificationsExpanded)}
                  className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                  title={isNotificationsExpanded ? 'Modo Janela Compacta' : 'Expandir para Altura Total'}
                >
                  {isNotificationsExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                </button>
                <button
                  type="button"
                  onClick={() => setIsNotificationsOpen(false)}
                  className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                  title="Fechar Janela de Notificações"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Abas de Filtro da Janela de Notificações */}
            <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex items-center gap-1.5 overflow-x-auto shrink-0">
              {[
                { id: 'all', label: `Todas (${systemNotifications.length})` },
                {
                  id: 'critical',
                  label: `Estoque & Críticos (${systemNotifications.filter(n => n.category === 'critical').length})`
                },
                {
                  id: 'finance',
                  label: `Financeiro & RH (${systemNotifications.filter(n => n.category === 'finance').length})`
                },
                {
                  id: 'ops',
                  label: `Frota & Operação (${systemNotifications.filter(n => n.category === 'ops').length})`
                }
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setNotifFilter(tab.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    notifFilter === tab.id
                      ? 'bg-slate-900 dark:bg-cyan-600 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-cyan-400'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Corpo Rolável 100% Visível */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {filteredNotifications.length === 0 ? (
                <div className="py-12 text-center space-y-2">
                  <CheckCircle2 size={40} className="text-emerald-500 mx-auto" />
                  <p className="text-sm font-bold text-slate-800 dark:text-white">
                    Nenhuma pendência nesta categoria!
                  </p>
                  <p className="text-xs text-slate-500">
                    Todos os indicadores monitorados estão dentro dos parâmetros normais.
                  </p>
                </div>
              ) : (
                filteredNotifications.map(item => (
                  <div
                    key={item.id}
                    onClick={() => {
                      navigate(item.path);
                      setIsNotificationsOpen(false);
                    }}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer hover:shadow-md flex flex-col gap-2 ${
                      item.severity === 'high'
                        ? 'bg-rose-50/70 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/60 hover:border-rose-400'
                        : item.severity === 'medium'
                        ? 'bg-amber-50/70 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/60 hover:border-amber-400'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-cyan-400'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span
                        className={`px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                          item.severity === 'high'
                            ? 'bg-rose-600 text-white'
                            : item.severity === 'medium'
                            ? 'bg-amber-500 text-slate-950'
                            : 'bg-cyan-600 text-white'
                        }`}
                      >
                        {item.badge}
                      </span>
                      <span className="text-xs font-bold text-cyan-600 dark:text-cyan-400 flex items-center gap-1 shrink-0">
                        Abrir aba <ArrowRight size={13} />
                      </span>
                    </div>
                    <h4 className="text-sm font-black text-slate-900 dark:text-white leading-snug">
                      {item.title}
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {item.description}
                    </p>
                    <div className="text-xs font-mono font-bold text-slate-700 dark:text-slate-200 bg-white/80 dark:bg-slate-900/70 px-3 py-2 rounded-xl border border-slate-200/70 dark:border-slate-700/70 break-words">
                      {item.detail}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Rodapé da Janela de Notificações */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/90 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between shrink-0 text-xs">
              <button
                type="button"
                onClick={() => {
                  navigate('/settings');
                  setIsNotificationsOpen(false);
                }}
                className="font-bold text-slate-600 dark:text-slate-300 hover:text-cyan-600 flex items-center gap-1.5"
              >
                <Settings size={14} /> Configurar Preferências de Alertas
              </button>
              <button
                type="button"
                onClick={() => setIsNotificationsExpanded(!isNotificationsExpanded)}
                className="font-bold text-cyan-600 dark:text-cyan-400 hover:underline"
              >
                {isNotificationsExpanded ? 'Reduzir Janela' : 'Ver em Altura Total'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL DE BUSCA GLOBAL (Ctrl + K)
         ===================================================================== */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-[160] bg-black/60 backdrop-blur-xs flex items-start justify-center pt-16 sm:pt-24 p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3">
              <Search size={18} className="text-cyan-600 shrink-0" />
              <input
                type="text"
                autoFocus
                value={globalSearchQuery}
                onChange={e => setGlobalSearchQuery(e.target.value)}
                placeholder="Buscar módulo, cliente, placa de veículo ou insumo..."
                className="w-full bg-transparent text-sm font-bold text-slate-900 dark:text-white outline-none"
              />
              <button
                type="button"
                onClick={() => setIsSearchOpen(false)}
                className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-500"
              >
                ESC
              </button>
            </div>
            <div className="max-h-80 overflow-y-auto p-3 space-y-1">
              {globalSearchQuery.trim() === '' ? (
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase text-slate-400 px-2 py-1">
                    Navegação Rápida
                  </p>
                  {navItems.map(item => (
                    <button
                      key={item.path}
                      type="button"
                      onClick={() => {
                        navigate(item.path);
                        setIsSearchOpen(false);
                      }}
                      className="w-full px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-200"
                    >
                      <span className="flex items-center gap-2">
                        {item.icon} {item.name}
                      </span>
                      <span className="text-slate-400 font-mono">{item.path}</span>
                    </button>
                  ))}
                </div>
              ) : searchResults.length === 0 ? (
                <p className="py-8 text-center text-xs text-slate-400">
                  Nenhum resultado encontrado para "{globalSearchQuery}".
                </p>
              ) : (
                searchResults.map((r, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      navigate(r.path);
                      setIsSearchOpen(false);
                      setGlobalSearchQuery('');
                    }}
                    className="w-full px-3 py-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between text-left transition-colors"
                  >
                    <div>
                      <span className="px-2 py-0.5 rounded bg-cyan-50 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300 text-[10px] font-black uppercase mr-2">
                        {r.type}
                      </span>
                      <span className="text-xs font-bold text-slate-900 dark:text-white">{r.label}</span>
                    </div>
                    <span className="text-xs text-slate-400">{r.sub}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          CORPO PRINCIPAL (Suporta Modo Clássico Original E Modo Sidebar Lateral)
         ===================================================================== */}
      <div className="flex-1 flex min-h-0">
        {/* Optional Collapsible Left Sidebar when navMode === 'sidebar' */}
        {prefs.navMode === 'sidebar' && (
          <aside
            className={`hidden lg:flex flex-col justify-between bg-slate-900 text-white border-r border-slate-800 transition-all duration-200 shrink-0 ${
              prefs.sidebarCollapsed ? 'w-20' : 'w-60'
            }`}
          >
            <div className="p-3 space-y-1.5">
              <div className="flex items-center justify-between px-2 py-1.5 mb-2 border-b border-slate-800">
                {!prefs.sidebarCollapsed && (
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Módulos do ERP
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => updatePref('sidebarCollapsed', !prefs.sidebarCollapsed)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 mx-auto"
                  title={prefs.sidebarCollapsed ? 'Expandir Menu' : 'Recolher Menu'}
                >
                  <PanelLeft size={16} />
                </button>
              </div>
              {navItems.map(item => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  title={item.name}
                  className={({ isActive }) =>
                    `px-3 py-2.5 rounded-xl text-xs font-bold flex items-center gap-3 transition-all ${
                      isActive
                        ? `${accentBadgeClass} shadow-md`
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    } ${prefs.sidebarCollapsed ? 'justify-center' : ''}`
                  }
                >
                  <span className="shrink-0">{item.icon}</span>
                  {!prefs.sidebarCollapsed && <span className="truncate">{item.name}</span>}
                </NavLink>
              ))}
            </div>

            <div className="p-3 border-t border-slate-800">
              <button
                onClick={handleLogout}
                title="Sair do Sistema"
                className={`w-full px-3 py-2.5 rounded-xl text-xs font-bold text-rose-400 hover:bg-rose-950/50 flex items-center gap-2 transition-colors ${
                  prefs.sidebarCollapsed ? 'justify-center' : ''
                }`}
              >
                <LogOut size={16} />
                {!prefs.sidebarCollapsed && <span>Encerrar Sessão</span>}
              </button>
            </div>
          </aside>
        )}

        {/* Main Content - Preserves original max-w-[1600px] unless Full Width is toggled */}
        <main className={`flex-1 ${containerClass} mx-auto w-full ${mainPaddingClass} min-w-0`}>
          <Outlet />
        </main>
      </div>

      {/* =====================================================================
          DOCK FLUTUANTE INFERIOR (Exibido quando navMode === 'floating-dock')
         ===================================================================== */}
      {prefs.navMode === 'floating-dock' && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 hidden md:flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-slate-900/95 text-white shadow-2xl border border-slate-700 backdrop-blur-md">
          {navItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                  isActive
                    ? `${accentBadgeClass} scale-105 shadow-sm`
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`
              }
            >
              {item.icon}
              <span className="hidden xl:inline">{item.name}</span>
            </NavLink>
          ))}
        </div>
      )}

      {/* Global Floating AI Audit Agent */}
      <AIAuditAgent mode="floating" />

      {/* Footer (Preserved Original Structure) */}
      <footer className="bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 mt-auto">
        <div className={`${containerClass} mx-auto py-4 flex flex-col md:flex-row justify-between items-center text-xs text-slate-500 font-medium`}>
          <p>© 2026 InfraCore ERP. Todos os direitos reservados.</p>
          <div className="flex gap-6 mt-2 md:mt-0">
            <a href="#/settings" className="hover:text-cyan-600 transition-colors">Termos de Uso</a>
            <a href="#/settings" className="hover:text-cyan-600 transition-colors">Política de Privacidade</a>
            <a href="#/settings" className="hover:text-cyan-600 transition-colors">Suporte Técnico</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
