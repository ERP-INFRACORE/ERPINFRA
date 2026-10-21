import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
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
  User as UserIcon
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import AIAuditAgent from './AIAuditAgent';

const Layout = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const { currentUser, logout, hasPermission, roles } = useApp();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const currentRoleName = React.useMemo(() => {
    return roles.find(r => r.id === currentUser?.roleId)?.name || 'Usuário';
  }, [currentUser, roles]);

  const navItems = [
    { name: 'Dashboard', path: '/', icon: <LayoutDashboard size={18} /> },
    { name: 'Cadastros', path: '/clients', icon: <Users size={18} />, permission: 'clients.view' },
    { name: 'Faturamento', path: '/sales', icon: <ShoppingCart size={18} />, permission: 'sales.view' },
    { name: 'Custos e Despesas', path: '/purchases', icon: <ShoppingBag size={18} />, permission: 'purchases.view' },
    { name: 'Produção', path: '/production', icon: <Construction size={18} />, permission: 'production.view' },
    { name: 'Financeiro', path: '/finance', icon: <DollarSign size={18} />, permission: 'finance.dashboard' },
    { name: 'RH', path: '/hr', icon: <Briefcase size={18} />, permission: 'hr.view' },
    { name: 'Frota', path: '/fleet', icon: <Truck size={18} />, permission: 'fleet.view' },
    { name: 'Relatórios', path: '/reports', icon: <FileText size={18} />, permission: 'reports.view_basic' },
    { name: 'Configurações', path: '/settings', icon: <Settings size={18} />, permission: 'settings.view' },
  ].filter(item => !item.permission || hasPermission(item.permission));

  return (
    <div className="bg-slate-50 dark:bg-slate-900 min-h-screen text-slate-900 dark:text-white flex flex-col font-body">
      {/* Modern Clean Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-50 h-16 shadow-soft">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 h-full">
          <div className="flex items-center justify-between h-full gap-4 lg:gap-8">

            {/* Logo Area */}
            <div className="flex items-center gap-2.5 shrink-0 cursor-pointer">
              <div className="bg-cyan-600 text-white p-1.5 rounded-lg">
                <Construction size={20} strokeWidth={2.5} />
              </div>
              <div className="flex flex-col">
                <h1 className="text-slate-900 dark:text-white text-lg font-bold leading-none tracking-tight font-display">InfraCore</h1>
              </div>
            </div>

            {/* Horizontal Navigation - Modules as Tabs */}
            <nav className="flex items-center gap-0.5 xl:gap-1 flex-nowrap flex-1 justify-center lg:justify-start ml-2 xl:ml-4">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ease-in-out flex items-center gap-2 whitespace-nowrap ${isActive
                      ? 'bg-slate-100 text-cyan-700 dark:bg-cyan-900/20 dark:text-cyan-400 font-bold'
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
                className="px-2 xl:px-4 py-2 rounded-full text-[11px] lg:text-xs xl:text-sm font-medium text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:text-slate-400 dark:hover:text-rose-400 dark:hover:bg-rose-900/20 transition-all duration-200 ease-in-out flex items-center gap-1.5 xl:gap-2 whitespace-nowrap"
              >
                <span className="block transform scale-90 xl:scale-100"><LogOut size={18} /></span>
                <span>Sair</span>
              </button>
            </nav>

            {/* User Profile */}
            <div className="flex items-center gap-4 ml-auto">
              <div className="hidden lg:flex flex-col items-end mr-2">
                <span className="text-sm font-bold text-slate-800 dark:text-white leading-none">{currentUser?.name || 'Visitante'}</span>
                <span className="text-[10px] uppercase font-black tracking-wider text-slate-400 mt-1">{currentRoleName}</span>
              </div>
              <div className="flex items-center gap-2 pl-4 border-l border-slate-200 dark:border-slate-700">
                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500 overflow-hidden shadow-inner ring-2 ring-white dark:ring-slate-800">
                  {currentUser?.avatar ? <img src={currentUser.avatar} alt="Avatar" className="w-full h-full object-cover" /> : <UserIcon size={20} />}
                </div>
              </div>
            </div>
          </div>
        </div>


      </header>

      {/* Main Content - Reduced vertical padding for better density */}
      <main className="flex-1 max-w-[1600px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        <Outlet />
      </main>

      {/* Global Floating AI Audit Agent */}
      <AIAuditAgent mode="floating" />

      {/* Footer */}
      <footer className="bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 mt-auto">
        <div className="max-w-[1600px] mx-auto px-4 py-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center text-xs text-slate-500 font-medium">
          <p>© 2024 InfraCore ERP. Todos os direitos reservados.</p>
          <div className="flex gap-6 mt-2 md:mt-0">
            <a href="#" className="hover:text-cyan-600 transition-colors">Termos de Uso</a>
            <a href="#" className="hover:text-cyan-600 transition-colors">Política de Privacidade</a>
            <a href="#" className="hover:text-cyan-600 transition-colors">Suporte Técnico</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;