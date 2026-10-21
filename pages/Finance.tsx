import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
   Upload,
   Plus,
   TrendingUp,
   ArrowUp,
   ArrowDown,
   Eye,
   Paperclip,
   Calendar,
   CreditCard,
   Settings,
   Edit2,
   Trash2,
   List,
   FolderOpen,
   X,
   Save,
   CheckCircle,
   DollarSign,
   Filter,
   MoreVertical,
   Download,
   Landmark,
   AlertCircle,
   Search,
   PieChart,
   ChevronRight,
   ChevronDown,
   Printer,
   Loader,
   AlertTriangle,
   CheckSquare,
   Square,
   RefreshCw,
   BarChart3,
   ShieldCheck,
   ArrowRight,
   Layers,
   FileText,
   Undo2,
   Clock,
   Info,
   Copy,
   Check,
   Star,
   Building2,
   QrCode,
   Wallet
} from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { BarChart, Bar, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, AreaChart, Area, Legend } from 'recharts';
import { useApp } from '../context/AppContext';
import { Transaction, Sale } from '../types';
import { printDocument } from '../utils/exportUtils';
import { toDeterministicUUID, updateItem } from '../src/services/api';
import { isSupabaseConfigured } from '../src/lib/supabase';

type FinanceTab = 'overview' | 'cashflow' | 'ledger' | 'receivables' | 'payables' | 'accounts' | 'planning';

const formatMoney = (value: number) => {
   return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
};

// Helper to parse dates in DD/MM/YYYY or YYYY-MM-DD
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

// Brazilian Bank Institutions (FEBRABAN codes, branding & color schemes)
const BRAZILIAN_BANKS = [
   { code: '341', name: 'Itaú Unibanco S.A.', shortName: 'Itaú', color: 'bg-orange-600', badgeColor: 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-900/50' },
   { code: '237', name: 'Banco Bradesco S.A.', shortName: 'Bradesco', color: 'bg-red-600', badgeColor: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900/50' },
   { code: '001', name: 'Banco do Brasil S.A.', shortName: 'Banco do Brasil', color: 'bg-yellow-500', badgeColor: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-900/50' },
   { code: '104', name: 'Caixa Econômica Federal', shortName: 'Caixa', color: 'bg-blue-600', badgeColor: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-900/50' },
   { code: '033', name: 'Banco Santander (Brasil) S.A.', shortName: 'Santander', color: 'bg-red-700', badgeColor: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900/50' },
   { code: '260', name: 'Nu Pagamentos S.A. (Nubank)', shortName: 'Nubank', color: 'bg-purple-700', badgeColor: 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-900/50' },
   { code: '077', name: 'Banco Inter S.A.', shortName: 'Banco Inter', color: 'bg-orange-500', badgeColor: 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-900/50' },
   { code: '756', name: 'Banco Cooperativo Sicoob S.A.', shortName: 'Sicoob', color: 'bg-teal-700', badgeColor: 'bg-teal-500/10 text-teal-700 dark:text-teal-400 border-teal-200 dark:border-teal-900/50' },
   { code: '748', name: 'Banco Cooperativo Sicredi S.A.', shortName: 'Sicredi', color: 'bg-emerald-700', badgeColor: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50' },
   { code: '422', name: 'Banco Safra S.A.', shortName: 'Safra', color: 'bg-amber-800', badgeColor: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/50' },
   { code: '336', name: 'Banco C6 S.A. (C6 Bank)', shortName: 'C6 Bank', color: 'bg-slate-900', badgeColor: 'bg-slate-500/10 text-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700' },
   { code: '212', name: 'Banco Original S.A.', shortName: 'Original', color: 'bg-green-600', badgeColor: 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-200 dark:border-green-900/50' },
   { code: '041', name: 'Banco do Estado do RS (Banrisul)', shortName: 'Banrisul', color: 'bg-sky-700', badgeColor: 'bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-900/50' },
   { code: '000', name: 'Caixa Interno / Gaveta / Tesouraria', shortName: 'Caixa Físico', color: 'bg-emerald-600', badgeColor: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50' },
   { code: '999', name: 'Outro Banco ou Instituição', shortName: 'Outro Banco', color: 'bg-cyan-600', badgeColor: 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border-cyan-200 dark:border-cyan-900/50' },
];

const ACCOUNT_COLORS = [
   { color: 'bg-orange-600', label: 'Laranja (Itaú / Inter)' },
   { color: 'bg-red-600', label: 'Vermelho (Bradesco / Santander)' },
   { color: 'bg-blue-600', label: 'Azul (Caixa / Banrisul)' },
   { color: 'bg-yellow-500', label: 'Amarelo (Banco do Brasil)' },
   { color: 'bg-purple-700', label: 'Roxo (Nubank)' },
   { color: 'bg-teal-700', label: 'Teal (Sicoob)' },
   { color: 'bg-emerald-600', label: 'Esmeralda (Sicredi / Caixa)' },
   { color: 'bg-cyan-600', label: 'Ciano (InfraCore)' },
   { color: 'bg-slate-900', label: 'Grafite Escuro (C6 Bank)' },
   { color: 'bg-amber-800', label: 'Dourado / Bronze (Safra)' },
];

const getPixKeyPlaceholder = (type: string) => {
   switch (type) {
      case 'CNPJ': return '00.000.000/0001-00';
      case 'CPF': return '000.000.000-00';
      case 'E-mail': return 'financeiro@empresa.com.br';
      case 'Telefone': return '(11) 99999-9999';
      case 'Chave Aleatória': return '123e4567-e89b-12d3-a456-426614174000';
      default: return 'Informe a chave PIX da conta';
   }
};

const Finance = () => {
   const {
      transactions, financials, addTransaction, deleteTransaction, importTransactions, updateTransactionStatus, updateTransaction,
      accounts, addAccount, deleteAccount,
      planOfAccounts, addPlanAccount, deletePlanAccount, updatePlanAccount, hasPermission, currentUser, settings,
      sales, addAuditLog
   } = useApp();
   const { addToast } = useToast();

   const [activeTab, setActiveTab] = useState<FinanceTab>('overview');
   const [isModalOpen, setIsModalOpen] = useState(false);
   const [isSubmitting, setIsSubmitting] = useState(false);
   const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
   const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);

   // Selection State for Batch Actions
   const [selectedTxIds, setSelectedTxIds] = useState<string[]>([]);

   // Settlement (Baixa Financeira) Modal State
   const [isSettlementModalOpen, setIsSettlementModalOpen] = useState(false);
   const [settlementTargetTxs, setSettlementTargetTxs] = useState<Transaction[]>([]);
   const [settlementForm, setSettlementForm] = useState({
      date: new Date().toLocaleDateString('pt-BR'),
      accountId: '',
      paymentMethod: 'PIX',
      interest: 0,
      discount: 0,
      authCode: '',
      notes: '',
      allowOverdraft: false
   });

   // Settlement Reversal (Estorno de Baixa) Modal State
   const [isReversalModalOpen, setIsReversalModalOpen] = useState(false);
   const [reversalTargetTx, setReversalTargetTx] = useState<Transaction | null>(null);
   const [reversalReason, setReversalReason] = useState('');

   // Cash Flow Specific State
   const [cashflowPeriod, setCashflowPeriod] = useState<'30d' | 'month' | 'next30' | 'next60' | 'next90' | 'year'>('month');
   const [cashflowAccountFilter, setCashflowAccountFilter] = useState<string>('all');

   // Standard Transaction Form
   const [formData, setFormData] = useState<Partial<Transaction>>({
      type: 'Despesa',
      date: new Date().toLocaleDateString('pt-BR'),
      status: 'Pendente',
      account: 'Bradesco PJ'
   });

   // Default active bank account helper
   const defaultAccount = useMemo(() => {
      return accounts.find(a => a.isDefault) || accounts[0] || null;
   }, [accounts]);

   // Account Form State & Enhancements
   const [accountForm, setAccountForm] = useState<any>({
      id: '',
      name: 'Itaú Unibanco',
      bankCode: '341',
      bankName: 'Itaú Unibanco S.A.',
      type: 'Conta Corrente',
      balance: 0,
      initialBalanceDate: new Date().toLocaleDateString('pt-BR'),
      agency: '',
      agencyDigit: '',
      accountNumber: '',
      accountDigit: '',
      pixKeyType: 'CNPJ',
      pixKey: '',
      creditLimit: 0,
      color: 'bg-orange-600',
      isDefault: false,
      notes: ''
   });
   const [copiedPixId, setCopiedPixId] = useState<string | null>(null);
   const [accountSearchTerm, setAccountSearchTerm] = useState('');

   const handleCopyPix = (accId: string, pixKey: string) => {
      if (!pixKey) return;
      navigator.clipboard.writeText(pixKey);
      setCopiedPixId(accId);
      addToast(`Chave PIX copiada: ${pixKey}`, 'success');
      setTimeout(() => setCopiedPixId(null), 2500);
   };

   const handleSetDefaultAccount = (targetAcc: any) => {
      accounts.forEach(a => {
         const isTarget = a.id === targetAcc.id;
         if (Boolean(a.isDefault) !== isTarget) {
            addAccount({ ...a, isDefault: isTarget });
            if (isSupabaseConfigured()) {
               updateItem('financial_accounts', a.id, { isDefault: isTarget }).catch(() => {});
            }
         }
      });
      addToast(`Conta "${targetAcc.name}" definida como Conta Padrão do ERP.`, 'success');
      addAuditLog({
         userId: currentUser?.id || 'system',
         userName: currentUser?.name || 'Administrador',
         action: 'Alteração de Conta Padrão',
         module: 'Financeiro',
         details: `A conta ${targetAcc.name} foi definida como conta padrão do ERP para baixas e faturamento.`,
         severity: 'info'
      });
   };

   const openNewAccountModal = () => {
      setAccountForm({
         id: '',
         name: 'Itaú Unibanco',
         bankCode: '341',
         bankName: 'Itaú Unibanco S.A.',
         type: 'Conta Corrente',
         balance: 0,
         initialBalanceDate: new Date().toLocaleDateString('pt-BR'),
         agency: '',
         agencyDigit: '',
         accountNumber: '',
         accountDigit: '',
         pixKeyType: 'CNPJ',
         pixKey: '',
         creditLimit: 0,
         color: 'bg-orange-600',
         isDefault: accounts.length === 0,
         notes: ''
      });
      setIsAccountModalOpen(true);
   };

   const openEditAccountModal = (acc: any) => {
      setAccountForm({
         id: acc.id,
         name: acc.name || '',
         bankCode: acc.bankCode || acc.code || '',
         bankName: acc.bankName || '',
         type: acc.type || 'Conta Corrente',
         balance: acc.initialBalance !== undefined ? acc.initialBalance : (acc.balance || 0),
         initialBalanceDate: acc.initialBalanceDate || '',
         agency: acc.agency || '',
         agencyDigit: acc.agencyDigit || '',
         accountNumber: acc.accountNumber || '',
         accountDigit: acc.accountDigit || '',
         pixKeyType: acc.pixKeyType || 'CNPJ',
         pixKey: acc.pixKey || '',
         creditLimit: acc.creditLimit || 0,
         color: acc.color || 'bg-blue-600',
         isDefault: Boolean(acc.isDefault),
         notes: acc.notes || ''
      });
      setIsAccountModalOpen(true);
   };

   const handleSaveAccount = (e: React.FormEvent) => {
      e.preventDefault();
      if (!accountForm.name?.trim()) {
         addToast("Informe o nome de identificação da conta.", 'warning');
         return;
      }

      const isEditing = Boolean(accountForm.id);
      const accountId = isEditing
         ? accountForm.id
         : (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `acc-${Date.now()}`);

      const initialBal = Number(accountForm.balance || 0);
      const creditLim = Number(accountForm.creditLimit || 0);
      const isDefaultAcc = Boolean(accountForm.isDefault) || accounts.length === 0;

      const accountPayload: any = {
         ...accountForm,
         id: accountId,
         name: accountForm.name.trim(),
         bankCode: accountForm.bankCode || '',
         bankName: accountForm.bankName || accountForm.name.trim(),
         type: accountForm.type || 'Conta Corrente',
         balance: initialBal,
         initialBalance: initialBal,
         creditLimit: creditLim,
         initialBalanceDate: accountForm.initialBalanceDate || new Date().toLocaleDateString('pt-BR'),
         agency: accountForm.agency || '',
         agencyDigit: accountForm.agencyDigit || '',
         accountNumber: accountForm.accountNumber || '',
         accountDigit: accountForm.accountDigit || '',
         pixKeyType: accountForm.pixKeyType || 'Nenhuma',
         pixKey: accountForm.pixKey?.trim() || '',
         color: accountForm.color || 'bg-blue-600',
         isDefault: isDefaultAcc,
         notes: accountForm.notes?.trim() || ''
      };

      // Se marcada como padrão, desmarca as demais contas
      if (isDefaultAcc) {
         accounts.forEach(a => {
            if (a.id !== accountId && a.isDefault) {
               addAccount({ ...a, isDefault: false });
               if (isSupabaseConfigured()) {
                  updateItem('financial_accounts', a.id, { isDefault: false }).catch(() => {});
               }
            }
         });
      }

      addAccount(accountPayload);
      if (isSupabaseConfigured() && isEditing) {
         updateItem('financial_accounts', accountId, accountPayload).catch(err => {
            console.warn("Erro ao sincronizar atualização de conta bancária:", err);
         });
      }

      addAuditLog({
         userId: currentUser?.id || 'system',
         userName: currentUser?.name || 'Administrador',
         action: isEditing ? 'Atualização de Conta Bancária' : 'Criação de Conta Bancária',
         module: 'Financeiro',
         details: `Conta ${accountPayload.name} (${accountPayload.type}) ${isEditing ? 'atualizada' : 'cadastrada'} com saldo inicial de ${formatMoney(initialBal)}.${isDefaultAcc ? ' (Definida como padrão)' : ''}`,
         severity: 'info'
      });

      addToast(isEditing ? "Conta bancária atualizada com sucesso!" : "Conta bancária cadastrada com sucesso!", 'success');
      setIsAccountModalOpen(false);
   };

   // Filters
   const [searchTerm, setSearchTerm] = useState('');
   const [categoryFilter, setCategoryFilter] = useState('Todas');
   const [statusFilter, setStatusFilter] = useState<'Todos' | 'Pendente' | 'Conciliado' | 'Vencido'>('Todos');

   // Plan of Accounts State
   const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
   const [editingPlan, setEditingPlan] = useState<{ id: string, name: string, parentId: string | null, type?: 'Receita' | 'Despesa' } | null>(null);
   const [planForm, setPlanForm] = useState<{ name: string, parentId: string, type: 'Receita' | 'Despesa' }>({
      name: '', parentId: '', type: 'Despesa'
   });
   const [planSearchTerm, setPlanSearchTerm] = useState('');
   const [planTypeFilter, setPlanTypeFilter] = useState<'Todos' | 'Receita' | 'Despesa'>('Todos');
   const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

   const toggleGroupExpand = (groupId: string) => {
      setExpandedGroups(prev => ({ ...prev, [groupId]: !prev[groupId] }));
   };

   const expandAllGroups = () => {
      const all: Record<string, boolean> = {};
      planOfAccounts.forEach(g => { all[g.id] = true; });
      setExpandedGroups(all);
   };

   const collapseAllGroups = () => {
      setExpandedGroups({});
   };

   // Corporate Info
   const companyInfo = useMemo(() => ({
      name: settings?.companyName || 'InfraCore Engenharia e Tecnologia Ltda',
      tradeName: settings?.tradeName || 'InfraCore ERP',
      document: settings?.document || '12.345.678/0001-99',
      address: settings?.address || 'Rua da Tecnologia, 100 - Industrial, SP',
      phone: settings?.phone || '(11) 4002-8922',
      email: settings?.email || 'financeiro@infracore.com',
      stateRegistry: settings?.technical?.stateRegistry || '123.456.789.110'
   }), [settings]);

   // Plan of Accounts Save
   const handleSavePlan = (e: React.FormEvent) => {
      e.preventDefault();
      if (!planForm.name.trim()) {
         addToast("O nome da categoria é obrigatório.", 'warning');
         return;
      }

      if (editingPlan) {
         updatePlanAccount(editingPlan.id, planForm.name.trim(), planForm.parentId || null);
         addToast("Categoria contábil atualizada com sucesso!", 'success');
      } else {
         const distinctParentId = planForm.parentId === '' ? null : planForm.parentId;
         addPlanAccount(distinctParentId, planForm.name.trim(), planForm.type);
         addToast("Nova categoria contábil criada com sucesso!", 'success');
      }
      setIsPlanModalOpen(false);
      setEditingPlan(null);
      setPlanForm({ name: '', parentId: '', type: 'Despesa' });
   };

   const openPlanModal = (plan?: any, parentId: string | null = null) => {
      if (plan) {
         setEditingPlan({ id: plan.id, name: plan.name, parentId, type: plan.type });
         setPlanForm({ name: plan.name, parentId: parentId || '', type: plan.type || 'Despesa' });
      } else {
         setEditingPlan(null);
         setPlanForm({ name: '', parentId: parentId || '', type: 'Despesa' });
      }
      setIsPlanModalOpen(true);
   };

   // Export Plan of Accounts with Corporate Header
   const handleExportPlanOfAccounts = () => {
      const rows: string[] = [];
      rows.push(`"CODIGO";"NOME";"TIPO";"NIVEL";"QTD_LANCAMENTOS";"TOTAL_MOVIMENTADO"`);

      planOfAccounts.forEach(group => {
         const groupTxs = transactions.filter(t => t.ledgerCode?.startsWith(group.code) || t.category === group.name);
         const groupTotal = groupTxs.reduce((sum, t) => sum + t.amount, 0);
         rows.push(`"${group.code}";"${group.name}";"${group.type}";"SINTETICA (GRUPO)";"${groupTxs.length}";"${groupTotal.toFixed(2)}"`);

         group.children?.forEach((child: any) => {
            const childTxs = transactions.filter(t => t.ledgerCode === child.code || t.category === child.name || t.ledgerName === child.name);
            const childTotal = childTxs.reduce((sum, t) => sum + t.amount, 0);
            rows.push(`"${child.code}";"${child.name}";"${group.type}";"ANALITICA";"${childTxs.length}";"${childTotal.toFixed(2)}"`);
         });
      });

      const header = [
         `# =========================================================================`,
         `# INFRAGORE ERP - ESTRUTURA OFICIAL DO PLANO DE CONTAS`,
         `# Razão Social: ${companyInfo.name} | CNPJ: ${companyInfo.document}`,
         `# Emissão: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')} por ${currentUser?.name || 'Administrador'}`,
         `# =========================================================================`,
         ``
      ].join('\n');

      const csvContent = '\uFEFF' + header + rows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `plano_de_contas_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      addToast("Plano de Contas exportado com sucesso!", 'success');
   };

   // Filtering Logic for Transactions
   const filteredTransactions = useMemo(() => {
      return transactions.filter(tx => {
         const matchesSearch = tx.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            tx.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (tx.account && tx.account.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (tx.documentNumber && tx.documentNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (tx.partnerName && tx.partnerName.toLowerCase().includes(searchTerm.toLowerCase()));
         const matchesCategory = categoryFilter === 'Todas' || tx.type === categoryFilter;
         const matchesStatus = statusFilter === 'Todos' || tx.status === statusFilter;
         return matchesSearch && matchesCategory && matchesStatus;
      });
   }, [transactions, searchTerm, categoryFilter, statusFilter]);

   const receivables = useMemo(() => {
      return transactions.filter(tx => tx.type === 'Receita' && tx.status !== 'Conciliado' && tx.status !== 'Cancelado');
   }, [transactions]);

   const payables = useMemo(() => {
      return transactions.filter(tx => tx.type === 'Despesa' && tx.status !== 'Conciliado' && tx.status !== 'Cancelado');
   }, [transactions]);

   // =========================================================================
   // RECONCILIAÇÃO AUTOMÁTICA DE VENDAS A PRAZO & BOLETOS -> CONTAS A RECEBER
   // =========================================================================
   const formatToLocaleDate = (dateStr?: string): string => {
      if (!dateStr) return new Date().toLocaleDateString('pt-BR');
      if (dateStr.includes('/')) return dateStr;
      if (dateStr.includes('-')) {
         const parts = dateStr.split('T')[0].split('-');
         if (parts.length === 3) {
            return `${parts[2].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[0]}`;
         }
      }
      const d = new Date(dateStr);
      return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString('pt-BR');
   };

   const addDaysToDate = (baseDate: Date, days: number): string => {
      const d = new Date(baseDate);
      d.setDate(d.getDate() + days);
      return d.toLocaleDateString('pt-BR');
   };

   const getPaymentMethodDisplay = (method?: string): string => {
      const m = (method || '').toLowerCase();
      if (m === 'boleto') return 'Boleto Bancário';
      if (m === 'prazo') return 'A Prazo / Crediário';
      if (m === 'credit') return 'Cartão de Crédito';
      if (m === 'debit') return 'Cartão de Débito';
      if (m === 'pix') return 'PIX';
      if (m === 'money') return 'Dinheiro';
      if (m === 'transfer') return 'Transferência Bancária';
      return method ? method.toUpperCase() : 'A Prazo';
   };

   const isSaleNeedingReceivable = (sale: Sale): boolean => {
      if (!sale || !sale.id || (sale.amount || 0) <= 0) return false;
      if (sale.status === 'Cancelado') return false;
      const method = (sale.paymentMethod || '').toLowerCase();
      const isDeferred = ['boleto', 'prazo', 'credit', 'crediario', 'faturado', 'duplicata', 'cheque'].includes(method);
      const isPending = sale.status === 'Pendente';
      const hasInstallments = (sale.installments || 0) > 1;
      return isDeferred || isPending || hasInstallments;
   };

   const getMatchingTransactionsForSale = (sale: Sale, allTransactions: Transaction[]): Transaction[] => {
      const docBase = sale.documentNumber || (sale.id && sale.id.startsWith('S-') ? sale.id.slice(2) : sale.id.slice(0, 8));
      return allTransactions.filter(tx => {
         if (tx.originId && tx.originId === sale.id) return true;
         if (tx.id && (tx.id.includes(sale.id) || tx.id === toDeterministicUUID(`TX-SALE-${sale.id}-P1`))) return true;
         if (tx.originModule === 'Vendas' && docBase && tx.documentNumber) {
            if (tx.documentNumber === docBase || tx.documentNumber.startsWith(`${docBase}-`)) {
               return true;
            }
         }
         return false;
      });
   };

   const isSaleSynced = (sale: Sale, allTransactions: Transaction[]): boolean => {
      const matching = getMatchingTransactionsForSale(sale, allTransactions);
      if (matching.length === 0) return false;

      const numInstallments = sale.installments && sale.installments > 1 ? sale.installments : 1;
      if (numInstallments > 1 && matching.length < numInstallments) {
         return false;
      }

      return true;
   };

   const generateTransactionsForSale = (sale: Sale): Transaction[] => {
      const numInstallments = sale.installments && sale.installments > 1 ? sale.installments : 1;
      const totalAmount = Number(sale.amount || 0);
      const saleDate = sale.date || new Date().toLocaleDateString('pt-BR');
      const baseDate = parseDateString(saleDate);

      const defaultAcc = accounts.find(a => a.isDefault) || accounts[0] || { id: 'acc-1', name: 'Caixa Geral' };
      const targetAccount = accounts.find(a => a.id === sale.accountId) || defaultAcc;
      const defaultAccountId = sale.accountId || targetAccount.id;
      const defaultAccountName = sale.account || targetAccount.name;

      const docBase = sale.documentNumber || (sale.id && sale.id.startsWith('S-') ? sale.id.slice(2) : sale.id.slice(0, 8));
      const txsToCreate: Transaction[] = [];

      if (numInstallments > 1) {
         const baseInstallment = Number((totalAmount / numInstallments).toFixed(2));
         const sumOthers = Number((baseInstallment * (numInstallments - 1)).toFixed(2));
         const lastInstallment = Number((totalAmount - sumOthers).toFixed(2));

         for (let i = 1; i <= numInstallments; i++) {
            let dueDate = addDaysToDate(baseDate, i * 30);
            if (sale.installmentDueDates && sale.installmentDueDates[i - 1]) {
               dueDate = formatToLocaleDate(sale.installmentDueDates[i - 1]);
            }

            const parcelAmount = i === numInstallments ? lastInstallment : baseInstallment;

            const instTx: Transaction = {
               id: toDeterministicUUID(`TX-SALE-${sale.id}-P${i}`),
               date: saleDate,
               dueDate: dueDate,
               description: `Venda #${docBase} - ${sale.clientName || 'Cliente'} (${i}/${numInstallments})`,
               category: '1.01.01 - Receita de Vendas',
               ledgerCode: sale.ledgerCode || '1.01.01',
               ledgerName: sale.ledgerName || 'Receita de Vendas',
               accountId: defaultAccountId,
               account: defaultAccountName,
               amount: parcelAmount,
               status: 'Pendente',
               type: 'Receita',
               documentNumber: `${docBase}-${i}/${numInstallments}`,
               partnerId: sale.clientId || sale.partnerId,
               partnerName: sale.clientName || sale.partnerName || 'Cliente',
               originModule: 'Vendas',
               originId: sale.id,
               paymentMethod: getPaymentMethodDisplay(sale.paymentMethod),
               competenceDate: saleDate,
               notes: `Lançamento automático de Contas a Receber referente à Venda #${docBase} via ${getPaymentMethodDisplay(sale.paymentMethod)} - Parcela ${i}/${numInstallments}`
            };

            txsToCreate.push(instTx);
         }
      } else {
         const dueDate = sale.dueDate
            ? formatToLocaleDate(sale.dueDate)
            : addDaysToDate(baseDate, Number(settings?.operational?.defaultPaymentTerm) || 30);

         const singleTx: Transaction = {
            id: toDeterministicUUID(`TX-SALE-${sale.id}-P1`),
            date: saleDate,
            dueDate: dueDate,
            description: `Venda #${docBase} - ${sale.clientName || 'Cliente'}`,
            category: '1.01.01 - Receita de Vendas',
            ledgerCode: sale.ledgerCode || '1.01.01',
            ledgerName: sale.ledgerName || 'Receita de Vendas',
            accountId: defaultAccountId,
            account: defaultAccountName,
            amount: totalAmount,
            status: 'Pendente',
            type: 'Receita',
            documentNumber: docBase,
            partnerId: sale.clientId || sale.partnerId,
            partnerName: sale.clientName || sale.partnerName || 'Cliente',
            originModule: 'Vendas',
            originId: sale.id,
            paymentMethod: getPaymentMethodDisplay(sale.paymentMethod),
            competenceDate: saleDate,
            notes: `Lançamento automático de Contas a Receber referente à Venda #${docBase} via ${getPaymentMethodDisplay(sale.paymentMethod)}`
         };

         txsToCreate.push(singleTx);
      }

      return txsToCreate;
   };

   // Missing Term/Boleto sales detection
   const unreconciledSales = useMemo(() => {
      if (!Array.isArray(sales)) return [];
      return sales.filter(s => isSaleNeedingReceivable(s) && !isSaleSynced(s, transactions));
   }, [sales, transactions]);

   const [isSyncingSales, setIsSyncingSales] = useState(false);
   const syncedSaleIdsRef = useRef<Set<string>>(new Set());
   const isAutoSyncingRef = useRef<boolean>(false);

   // Auto-reconciliation of term/boleto sales
   useEffect(() => {
      if (!Array.isArray(sales) || sales.length === 0 || isAutoSyncingRef.current) return;

      const unSynced = sales.filter(s => isSaleNeedingReceivable(s) && !isSaleSynced(s, transactions) && !syncedSaleIdsRef.current.has(s.id));
      if (unSynced.length === 0) return;

      isAutoSyncingRef.current = true;
      unSynced.forEach(s => syncedSaleIdsRef.current.add(s.id));

      let generatedCount = 0;
      unSynced.forEach(sale => {
         const matching = getMatchingTransactionsForSale(sale, transactions);
         const numInstallments = sale.installments && sale.installments > 1 ? sale.installments : 1;
         if (numInstallments > 1 && matching.length === 1 && !matching[0].description.includes('(1/')) {
            deleteTransaction(matching[0].id);
         }
         const newTxs = generateTransactionsForSale(sale);
         newTxs.forEach(tx => {
            addTransaction(tx);
            generatedCount++;
         });
      });

      if (generatedCount > 0) {
         addToast(
            `Sincronização Contas a Receber: ${generatedCount} títulos gerados a partir de ${unSynced.length} venda(s) a prazo/boleto.`,
            'info',
            5000
         );
      }

      const timer = setTimeout(() => {
         isAutoSyncingRef.current = false;
      }, 1000);

      return () => clearTimeout(timer);
   }, [sales, transactions, addTransaction, addToast]);

   // Manual Trigger for Synchronization
   const handleManualSyncSales = () => {
      if (!Array.isArray(sales) || sales.length === 0) {
         addToast("Nenhuma venda encontrada no sistema para sincronização.", 'info');
         return;
      }

      setIsSyncingSales(true);
      try {
         const unSynced = sales.filter(s => isSaleNeedingReceivable(s) && !isSaleSynced(s, transactions));

         if (unSynced.length === 0) {
            addToast("Todas as vendas a prazo e boletos já estão sincronizadas com o Contas a Receber.", 'info');
            setIsSyncingSales(false);
            return;
         }

         unSynced.forEach(s => syncedSaleIdsRef.current.add(s.id));

         let createdCount = 0;
         unSynced.forEach(sale => {
            const matching = getMatchingTransactionsForSale(sale, transactions);
            const numInstallments = sale.installments && sale.installments > 1 ? sale.installments : 1;
            if (numInstallments > 1 && matching.length === 1 && !matching[0].description.includes('(1/')) {
               deleteTransaction(matching[0].id);
            }
            const newTxs = generateTransactionsForSale(sale);
            newTxs.forEach(tx => {
               addTransaction(tx);
               createdCount++;
            });
         });

         addToast(
            `Sucesso: ${createdCount} títulos de Contas a Receber gerados a partir de ${unSynced.length} venda(s) a prazo/boleto!`,
            'success',
            6000
         );
      } catch (err) {
         console.error("Erro ao sincronizar vendas a prazo:", err);
         addToast("Erro ao processar a sincronização das vendas.", 'error');
      } finally {
         setTimeout(() => {
            setIsSyncingSales(false);
         }, 500);
      }
   };

   // Enhanced Filtered Lists for Receivables and Payables with Search & Status
   const filteredReceivables = useMemo(() => {
      return transactions.filter(tx => {
         if (tx.type !== 'Receita' || tx.status === 'Cancelado') return false;

         if (statusFilter === 'Todos') {
            if (tx.status === 'Conciliado') return false;
         } else if (tx.status !== statusFilter) {
            return false;
         }

         if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase();
            const matches = (tx.description || '').toLowerCase().includes(term) ||
               (tx.category || '').toLowerCase().includes(term) ||
               (tx.ledgerName || '').toLowerCase().includes(term) ||
               (tx.account || '').toLowerCase().includes(term) ||
               (tx.documentNumber || '').toLowerCase().includes(term) ||
               (tx.partnerName || '').toLowerCase().includes(term) ||
               (tx.paymentMethod || '').toLowerCase().includes(term);
            if (!matches) return false;
         }

         return true;
      });
   }, [transactions, searchTerm, statusFilter]);

   const filteredPayables = useMemo(() => {
      return transactions.filter(tx => {
         if (tx.type !== 'Despesa' || tx.status === 'Cancelado') return false;

         if (statusFilter === 'Todos') {
            if (tx.status === 'Conciliado') return false;
         } else if (tx.status !== statusFilter) {
            return false;
         }

         if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase();
            const matches = (tx.description || '').toLowerCase().includes(term) ||
               (tx.category || '').toLowerCase().includes(term) ||
               (tx.ledgerName || '').toLowerCase().includes(term) ||
               (tx.account || '').toLowerCase().includes(term) ||
               (tx.documentNumber || '').toLowerCase().includes(term) ||
               (tx.partnerName || '').toLowerCase().includes(term) ||
               (tx.paymentMethod || '').toLowerCase().includes(term);
            if (!matches) return false;
         }

         return true;
      });
   }, [transactions, searchTerm, statusFilter]);

   const currentTabTransactions = useMemo(() => {
      if (activeTab === 'ledger') return filteredTransactions;
      if (activeTab === 'receivables') return filteredReceivables;
      if (activeTab === 'payables') return filteredPayables;
      return [];
   }, [activeTab, filteredTransactions, filteredReceivables, filteredPayables]);

   // Overview 6-Month Chart Data
   const chartData = useMemo(() => {
      const last6Months = Array.from({ length: 6 }, (_, i) => {
         const d = new Date();
         d.setMonth(d.getMonth() - (5 - i));
         return {
            month: d.getMonth(),
            year: d.getFullYear(),
            name: d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '').toUpperCase()
         };
      });

      return last6Months.map(period => {
         const periodTrans = transactions.filter(t => {
            if (!t.date) return false;
            const parsed = parseDateString(t.date);
            return parsed.getMonth() === period.month && parsed.getFullYear() === period.year;
         });

         const income = periodTrans.filter(t => t.type === 'Receita').reduce((sum, t) => sum + t.amount, 0);
         const expense = periodTrans.filter(t => t.type === 'Despesa').reduce((sum, t) => sum + t.amount, 0);

         return {
            name: period.name,
            income,
            expense,
            balance: income - expense
         };
      });
   }, [transactions]);

   // =========================================================================
   // ADVANCED CASH FLOW (FLUXO DE CAIXA DFC & PROJEÇÃO)
   // =========================================================================
   const cashFlowData = useMemo(() => {
      const now = new Date();
      let startDate = new Date();
      let endDate = new Date();

      switch (cashflowPeriod) {
         case '30d':
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            endDate = now;
            break;
         case 'month':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
            break;
         case 'next30':
            startDate = now;
            endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
            break;
         case 'next60':
            startDate = now;
            endDate = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
            break;
         case 'next90':
            startDate = now;
            endDate = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
            break;
         case 'year':
            startDate = new Date(now.getFullYear(), 0, 1);
            endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
            break;
      }

      // Filter transactions for period and account
      const relevantTxs = transactions.filter(t => {
         if (t.status === 'Cancelado') return false;
         if (cashflowAccountFilter !== 'all' && t.accountId !== cashflowAccountFilter && t.account !== cashflowAccountFilter) {
            return false;
         }
         const txDate = parseDateString(t.dueDate || t.date);
         return txDate >= startDate && txDate <= endDate;
      }).sort((a, b) => parseDateString(a.dueDate || a.date).getTime() - parseDateString(b.dueDate || b.date).getTime());

      // Initial Cash Balance for context
      const initialCash = cashflowAccountFilter === 'all'
         ? accounts.reduce((acc, a) => acc + (a.balance || 0), 0)
         : (accounts.find(a => a.id === cashflowAccountFilter)?.balance || 0);

      // Aggregate realized & projected
      let totalRealizedInflow = 0;
      let totalRealizedOutflow = 0;
      let totalProjectedInflow = 0;
      let totalProjectedOutflow = 0;

      let runningBalance = initialCash;
      const timelineItems: Array<{
         id: string;
         date: string;
         rawDate: Date;
         description: string;
         category: string;
         account: string;
         type: 'Receita' | 'Despesa';
         status: string;
         amount: number;
         runningBalance: number;
         isRealized: boolean;
      }> = [];

      relevantTxs.forEach(t => {
         const isRealized = t.status === 'Conciliado';
         const isReceita = t.type === 'Receita';

         if (isRealized) {
            if (isReceita) totalRealizedInflow += t.amount;
            else totalRealizedOutflow += t.amount;
         } else {
            if (isReceita) totalProjectedInflow += t.amount;
            else totalProjectedOutflow += t.amount;
         }

         runningBalance += isReceita ? t.amount : -t.amount;

         timelineItems.push({
            id: t.id,
            date: t.dueDate || t.date,
            rawDate: parseDateString(t.dueDate || t.date),
            description: t.description,
            category: t.ledgerName || t.category || 'Geral',
            account: t.account || 'Não especificada',
            type: t.type,
            status: t.status,
            amount: t.amount,
            runningBalance,
            isRealized
         });
      });

      // Chart series grouped by day
      const dailyMap: Record<string, { date: string; displayDate: string; inflows: number; outflows: number; balance: number }> = {};
      let chartRunning = initialCash;

      timelineItems.forEach(item => {
         const key = item.rawDate.toISOString().split('T')[0];
         if (!dailyMap[key]) {
            dailyMap[key] = {
               date: key,
               displayDate: item.date,
               inflows: 0,
               outflows: 0,
               balance: chartRunning
            };
         }
         if (item.type === 'Receita') dailyMap[key].inflows += item.amount;
         else dailyMap[key].outflows += item.amount;

         chartRunning += item.type === 'Receita' ? item.amount : -item.amount;
         dailyMap[key].balance = chartRunning;
      });

      const chartTimeline = Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date));

      const totalInflow = totalRealizedInflow + totalProjectedInflow;
      const totalOutflow = totalRealizedOutflow + totalProjectedOutflow;
      const netPeriod = totalInflow - totalOutflow;
      const finalProjectedBalance = initialCash + netPeriod;

      return {
         initialCash,
         totalRealizedInflow,
         totalRealizedOutflow,
         totalProjectedInflow,
         totalProjectedOutflow,
         totalInflow,
         totalOutflow,
         netPeriod,
         finalProjectedBalance,
         timelineItems,
         chartTimeline
      };
   }, [transactions, accounts, cashflowPeriod, cashflowAccountFilter]);

   // =========================================================================
   // VALIDAÇÕES RIGOROSAS DE BAIXA FINANCEIRA & CONCILIAÇÃO EM LOTE
   // =========================================================================

   // Helper de Proteção contra Dupla Baixa (tx.status === 'Pago' || tx.status === 'Conciliado')
   const isAlreadySettled = (tx: Transaction): boolean => {
      const status = (tx.status as string) || '';
      return status === 'Pago' || status === 'Conciliado';
   };

   // Helper para Atualização Sincronizada do Saldo em financial_accounts
   const syncAccountBalance = async (accountId: string, delta: number): Promise<number | undefined> => {
      const targetAcc = accounts.find(a => a.id === accountId);
      if (!targetAcc) return undefined;

      const currentBalance = Number(targetAcc.balance || 0);
      const newBalance = Number((currentBalance + delta).toFixed(2));

      const updatedAcc = {
         ...targetAcc,
         balance: newBalance,
         updated_at: new Date().toISOString()
      };

      // 1. Atualiza o estado do AppContext e propaga cross-tab via syncAdd
      addAccount(updatedAcc);

      // 2. Sincronização persistente na tabela financial_accounts no Supabase
      if (isSupabaseConfigured()) {
         try {
            await updateItem('financial_accounts', targetAcc.id, { balance: newBalance });
         } catch (dbErr) {
            console.warn(`Erro ao sincronizar saldo da conta "${targetAcc.name}" em financial_accounts:`, dbErr);
         }
      }

      return newBalance;
   };

   const openSettlementModal = (txs: Transaction[]) => {
      if (!txs || txs.length === 0) {
         addToast("Nenhuma transação selecionada para liquidação.", 'warning');
         return;
      }

      // Check if any is already canceled
      if (txs.some(t => t.status === 'Cancelado')) {
         addToast("Não é possível liquidar transações canceladas.", 'error');
         return;
      }

      // Proteção contra Dupla Baixa: verificar se algum título já possui status 'Pago' ou 'Conciliado'
      const alreadyPaidTxs = txs.filter(t => isAlreadySettled(t));
      if (alreadyPaidTxs.length === txs.length) {
         addToast(
            `🚫 Proteção contra Dupla Baixa: O(s) ${alreadyPaidTxs.length} título(s) selecionado(s) já constam como baixados (status: 'Pago' / 'Conciliado'). Nenhuma operação duplicada foi permitida.`,
            'error',
            6000
         );
         addAuditLog({
            userId: currentUser?.id || 'system',
            userName: currentUser?.name || 'Administrador',
            action: 'Bloqueio de Dupla Baixa',
            module: 'Financeiro',
            details: `Abertura de baixa bloqueada. Todos os ${alreadyPaidTxs.length} títulos já possuem status 'Pago' ou 'Conciliado': ${alreadyPaidTxs.map(t => t.documentNumber || t.id.slice(-6)).join(', ')}.`,
            severity: 'warning'
         });
         return;
      }

      let eligibleTxs = txs;
      if (alreadyPaidTxs.length > 0) {
         addToast(
            `⚠️ Proteção contra Dupla Baixa: ${alreadyPaidTxs.length} título(s) já estavam quitados ('Pago'/'Conciliado') e foram removidos do lote para evitar duplicidade.`,
            'warning',
            5000
         );
         addAuditLog({
            userId: currentUser?.id || 'system',
            userName: currentUser?.name || 'Administrador',
            action: 'Filtro de Dupla Baixa',
            module: 'Financeiro',
            details: `Títulos já quitados ignorados na abertura do lote: ${alreadyPaidTxs.map(t => t.documentNumber || t.id.slice(-6)).join(', ')}.`,
            severity: 'warning'
         });
         eligibleTxs = txs.filter(t => !isAlreadySettled(t));
      }

      // Conta Padrão: prioriza a conta do título se definida ou a Conta Padrão do ERP
      const defAcc = accounts.find(a => a.isDefault) || accounts[0];
      const firstAccId = eligibleTxs[0]?.accountId || defAcc?.id || '';

      setSettlementTargetTxs(eligibleTxs);
      setSettlementForm({
         date: new Date().toLocaleDateString('pt-BR'),
         accountId: firstAccId,
         paymentMethod: eligibleTxs[0]?.paymentMethod || 'PIX',
         interest: 0,
         discount: 0,
         authCode: '',
         notes: '',
         allowOverdraft: false
      });
      setIsSettlementModalOpen(true);
   };

   // Calculations for settlement
   const settlementTotals = useMemo(() => {
      const originalTotal = settlementTargetTxs.reduce((sum, t) => sum + t.amount, 0);
      const interest = Number(settlementForm.interest || 0);
      const discount = Number(settlementForm.discount || 0);
      const finalTotal = Math.max(0.01, originalTotal + interest - discount);

      const targetAccount = accounts.find(a => a.id === settlementForm.accountId);
      const currentBalance = targetAccount ? Number(targetAccount.balance || 0) : 0;

      const isExpense = settlementTargetTxs.every(t => t.type === 'Despesa');
      const isIncome = settlementTargetTxs.every(t => t.type === 'Receita');

      let projectedBalance = currentBalance;
      if (isExpense) {
         projectedBalance = currentBalance - finalTotal;
      } else if (isIncome) {
         projectedBalance = currentBalance + finalTotal;
      }

      const hasNegativeBalanceRisk = isExpense && projectedBalance < 0;

      return {
         originalTotal,
         interest,
         discount,
         finalTotal,
         targetAccount,
         currentBalance,
         projectedBalance,
         isExpense,
         isIncome,
         hasNegativeBalanceRisk
      };
   }, [settlementTargetTxs, settlementForm, accounts]);

   const handleConfirmSettlement = async (e: React.FormEvent) => {
      e.preventDefault();

      if (!settlementForm.accountId) {
         addToast("Selecione uma conta bancária para efetivar a baixa.", 'error');
         return;
      }

      if (!settlementForm.date || !settlementForm.date.trim()) {
         addToast("Informe uma data válida para a liquidação.", 'error');
         return;
      }

      // Proteção rigorosa contra Dupla Baixa revalidando com o estado mais atual de transactions
      const alreadyPaidTxs = settlementTargetTxs.filter(target => {
         const live = transactions.find(t => t.id === target.id) || target;
         return isAlreadySettled(live);
      });

      if (alreadyPaidTxs.length > 0) {
         if (alreadyPaidTxs.length === settlementTargetTxs.length) {
            addToast(
               `🚫 Proteção contra Dupla Baixa: Todos os ${alreadyPaidTxs.length} títulos já constam como baixados (status: 'Pago' / 'Conciliado'). Operação cancelada.`,
               'error',
               6000
            );
            addAuditLog({
               userId: currentUser?.id || 'system',
               userName: currentUser?.name || 'Administrador',
               action: 'Bloqueio de Dupla Baixa em Confirmação',
               module: 'Financeiro',
               details: `Tentativa de liquidação duplicada impedida para os títulos: ${alreadyPaidTxs.map(t => t.documentNumber || t.id.slice(-6)).join(', ')}.`,
               severity: 'warning'
            });
            setIsSettlementModalOpen(false);
            setSettlementTargetTxs([]);
            setSelectedTxIds([]);
            return;
         }

         addToast(
            `⚠️ Proteção contra Dupla Baixa: ${alreadyPaidTxs.length} título(s) já estavam baixados ('Pago'/'Conciliado') e foram desconsiderados.`,
            'warning',
            5000
         );
      }

      const validTxsToSettle = settlementTargetTxs.filter(target => {
         const live = transactions.find(t => t.id === target.id) || target;
         return !isAlreadySettled(live) && live.status !== 'Cancelado';
      });

      if (validTxsToSettle.length === 0) {
         addToast("Nenhum título pendente elegível para baixa financeira.", 'info');
         setIsSettlementModalOpen(false);
         setSettlementTargetTxs([]);
         setSelectedTxIds([]);
         return;
      }

      // Overdraft / Insufficient balance guard
      if (settlementTotals.hasNegativeBalanceRisk) {
         const isAdmin = currentUser?.username === 'admin' || hasPermission('all') || hasPermission('finance.admin');
         if (!isAdmin) {
            addToast(`🚫 BAIXA BLOQUEADA: Saldo insuficiente na conta "${settlementTotals.targetAccount?.name}". Esta operação requer autorização expressa da diretoria.`, 'error', 6000);
            return;
         }
         if (!settlementForm.allowOverdraft) {
            addToast(`⚠️ SALDO A DESCOBERTO: A conta ficará negativa em ${formatMoney(Math.abs(settlementTotals.projectedBalance))}. Marque a autorização formal para prosseguir.`, 'warning', 6000);
            return;
         }
      }

      setIsSubmitting(true);
      await new Promise(resolve => setTimeout(resolve, 600));

      const selectedAcc = settlementTotals.targetAccount;
      const count = validTxsToSettle.length;

      try {
         // Atualizar transações com carimbo de auditoria
         validTxsToSettle.forEach((tx) => {
            const adjustedAmount = count === 1
               ? settlementTotals.finalTotal
               : tx.amount;

            const auditStamp = `[BAIXA EFETUADA em ${settlementForm.date} por ${currentUser?.name || 'Administrador'}]: Conta ${selectedAcc?.name} | Forma: ${settlementForm.paymentMethod}${settlementForm.interest > 0 ? ` | Juros/Multa: ${formatMoney(settlementForm.interest)}` : ''}${settlementForm.discount > 0 ? ` | Desconto: ${formatMoney(settlementForm.discount)}` : ''}${settlementForm.authCode ? ` | Aut: ${settlementForm.authCode}` : ''}${settlementForm.notes ? ` | Obs: ${settlementForm.notes}` : ''}`;

            const updatedTx: Transaction = {
               ...tx,
               status: 'Conciliado',
               date: settlementForm.date,
               accountId: selectedAcc?.id || tx.accountId,
               account: selectedAcc?.name || tx.account,
               paymentMethod: settlementForm.paymentMethod,
               amount: adjustedAmount,
               notes: tx.notes ? `${tx.notes}\n${auditStamp}` : auditStamp
            };

            updateTransaction(updatedTx);
         });

         // 2. Atualização Sincronizada do Saldo em financial_accounts
         const rawBaseSum = validTxsToSettle.reduce((sum, t) => sum + t.amount, 0);
         const adjustedSum = count === 1 ? settlementTotals.finalTotal : (rawBaseSum + settlementForm.interest - settlementForm.discount);
         const netBalanceDelta = settlementTotals.isExpense ? -adjustedSum : +adjustedSum;

         let newAccBalance = selectedAcc?.balance;
         if (selectedAcc) {
            newAccBalance = await syncAccountBalance(selectedAcc.id, netBalanceDelta);
         }

         // 3. Registro em audit_logs
         addAuditLog({
            userId: currentUser?.id || 'system',
            userName: currentUser?.name || 'Administrador',
            action: count > 1 ? 'Conciliação em Lote' : 'Baixa de Título',
            module: 'Financeiro',
            details: `Liquidação de ${count} título(s). Valor líquido movimentado: ${formatMoney(Math.abs(netBalanceDelta))}. Conta ${netBalanceDelta >= 0 ? 'creditada' : 'debitada'}: ${selectedAcc?.name || 'Caixa Geral'}. Forma: ${settlementForm.paymentMethod}${settlementForm.interest > 0 ? ` | Juros: ${formatMoney(settlementForm.interest)}` : ''}${settlementForm.discount > 0 ? ` | Desconto: ${formatMoney(settlementForm.discount)}` : ''}. Saldo atualizado da conta: ${formatMoney(newAccBalance ?? 0)}. Títulos: ${validTxsToSettle.map(t => `${t.documentNumber || t.id.slice(-6)} (${t.type})`).join(', ')}.`,
            severity: 'info'
         });

         addToast(`Liquidação concluída! ${count} título(s) baixado(s) com sucesso na conta ${selectedAcc?.name}.`, 'success', 5000);
         setIsSettlementModalOpen(false);
         setSettlementTargetTxs([]);
         setSelectedTxIds([]);
      } catch (err) {
         console.error("Settlement error:", err);
         addToast("Erro ao processar baixa financeira.", 'error');
      } finally {
         setIsSubmitting(false);
      }
   };

   // =========================================================================
   // CONCILIAÇÃO RÁPIDA DIRETA EM LOTE (BATCH RECONCILIATION)
   // =========================================================================
   const handleDirectBatchReconciliation = async () => {
      const selectedTxs = transactions.filter(t => selectedTxIds.includes(t.id));
      if (selectedTxs.length === 0) {
         addToast("Nenhum título selecionado para conciliação em lote.", 'warning');
         return;
      }

      // 1. Proteção contra Dupla Baixa (tx.status === 'Pago' || tx.status === 'Conciliado')
      const alreadyPaidTxs = selectedTxs.filter(t => isAlreadySettled(t));
      if (alreadyPaidTxs.length === selectedTxs.length) {
         addToast(
            `🚫 Proteção contra Dupla Baixa: Todos os ${alreadyPaidTxs.length} títulos selecionados já possuem status 'Pago' ou 'Conciliado'.`,
            'error',
            6000
         );
         addAuditLog({
            userId: currentUser?.id || 'system',
            userName: currentUser?.name || 'Administrador',
            action: 'Bloqueio de Dupla Baixa em Lote',
            module: 'Financeiro',
            details: `Tentativa de conciliação direta em lote bloqueada. Todos os ${alreadyPaidTxs.length} títulos já estavam quitados (status 'Pago'/'Conciliado'): ${alreadyPaidTxs.map(t => t.documentNumber || t.id.slice(-6)).join(', ')}.`,
            severity: 'warning'
         });
         setSelectedTxIds([]);
         return;
      }

      const pendingTxs = selectedTxs.filter(t => !isAlreadySettled(t) && t.status !== 'Cancelado');
      if (pendingTxs.length === 0) {
         addToast("Nenhum título pendente elegível para conciliação.", 'info');
         setSelectedTxIds([]);
         return;
      }

      if (alreadyPaidTxs.length > 0) {
         addToast(
            `⚠️ Proteção contra Dupla Baixa: ${alreadyPaidTxs.length} título(s) já estavam quitados ('Pago'/'Conciliado') e foram ignorados.`,
            'warning',
            5000
         );
      }

      const defaultAccount = accounts[0] || { id: 'acc-1', name: 'Caixa Geral', balance: 0 };
      const currentDateStr = new Date().toLocaleDateString('pt-BR');

      setIsSubmitting(true);
      try {
         // Agrupar deltas por conta bancária de destino
         const accountDeltas: Record<string, { delta: number, accountName: string, count: number }> = {};

         pendingTxs.forEach(tx => {
            const accId = tx.accountId || defaultAccount.id;
            const accObj = accounts.find(a => a.id === accId) || defaultAccount;
            const accName = accObj.name || tx.account || defaultAccount.name;

            if (!accountDeltas[accId]) {
               accountDeltas[accId] = { delta: 0, accountName: accName, count: 0 };
            }

            const impact = tx.type === 'Receita' ? tx.amount : -tx.amount;
            accountDeltas[accId].delta += impact;
            accountDeltas[accId].count += 1;

            const auditStamp = `[CONCILIAÇÃO EM LOTE em ${currentDateStr} por ${currentUser?.name || 'Administrador'}]: Status alterado para Conciliado | Conta: ${accName}`;

            const updatedTx: Transaction = {
               ...tx,
               status: 'Conciliado',
               date: tx.date || currentDateStr,
               accountId: accId,
               account: accName,
               notes: tx.notes ? `${tx.notes}\n${auditStamp}` : auditStamp
            };

            updateTransaction(updatedTx);
         });

         // 2. Atualização Sincronizada do Saldo em financial_accounts para cada conta afetada
         const updatedBalancesSummary: string[] = [];
         for (const [accId, data] of Object.entries(accountDeltas)) {
            const newBal = await syncAccountBalance(accId, data.delta);
            if (newBal !== undefined) {
               updatedBalancesSummary.push(`${data.accountName}: ${formatMoney(newBal)}`);
            }
         }

         // 3. Registro em audit_logs
         const totalVal = pendingTxs.reduce((sum, t) => sum + t.amount, 0);
         addAuditLog({
            userId: currentUser?.id || 'system',
            userName: currentUser?.name || 'Administrador',
            action: 'Conciliação em Lote Direta',
            module: 'Financeiro',
            details: `Conciliação em lote executada para ${pendingTxs.length} título(s). Total movimentado: ${formatMoney(totalVal)}. Contas sincronizadas: ${updatedBalancesSummary.join('; ')}. Títulos: ${pendingTxs.map(t => `${t.documentNumber || t.id.slice(-6)} (${t.type})`).join(', ')}. ${alreadyPaidTxs.length > 0 ? `Proteção contra dupla baixa impediu a re-baixa de ${alreadyPaidTxs.length} título(s).` : ''}`,
            severity: 'info'
         });

         addToast(
            `Conciliação em lote concluída! ${pendingTxs.length} título(s) baixados e saldos bancários atualizados com sucesso.`,
            'success',
            5000
         );
         setSelectedTxIds([]);
      } catch (err) {
         console.error("Erro na conciliação em lote:", err);
         addToast("Erro ao processar conciliação em lote.", 'error');
      } finally {
         setIsSubmitting(false);
      }
   };

   // =========================================================================
   // ESTORNO DE BAIXA (REVERSÃO PARA PENDENTE COM RESTITUIÇÃO DE SALDO & AUDITORIA)
   // =========================================================================
   const openReversalModal = (tx: Transaction) => {
      setReversalTargetTx(tx);
      setReversalReason('');
      setIsReversalModalOpen(true);
   };

   const handleConfirmReversal = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!reversalTargetTx) return;

      if (!reversalReason.trim() || reversalReason.trim().length < 5) {
         addToast("Por favor, informe a justificativa detalhada para o estorno (mínimo 5 caracteres).", 'warning');
         return;
      }

      const auditStamp = `[ESTORNO DE BAIXA em ${new Date().toLocaleDateString('pt-BR')} por ${currentUser?.name || 'Administrador'}]: Motivo: ${reversalReason.trim()}`;

      const updatedTx: Transaction = {
         ...reversalTargetTx,
         status: 'Pendente',
         notes: reversalTargetTx.notes ? `${reversalTargetTx.notes}\n${auditStamp}` : auditStamp
      };

      updateTransaction(updatedTx);

      // Reverter o saldo na conta bancária correspondente
      const reversalDelta = reversalTargetTx.type === 'Receita' ? -reversalTargetTx.amount : +reversalTargetTx.amount;
      const targetAccId = reversalTargetTx.accountId || accounts[0]?.id;
      let newBal: number | undefined = undefined;
      if (targetAccId) {
         newBal = await syncAccountBalance(targetAccId, reversalDelta);
      }

      // Registro do estorno em audit_logs
      addAuditLog({
         userId: currentUser?.id || 'system',
         userName: currentUser?.name || 'Administrador',
         action: 'Estorno de Baixa Financeira',
         module: 'Financeiro',
         details: `Estorno de baixa efetuado para o título #${reversalTargetTx.documentNumber || reversalTargetTx.id.slice(-6)} (${reversalTargetTx.description}). Valor: ${formatMoney(reversalTargetTx.amount)}. Motivo: ${reversalReason.trim()}. Saldo recalculado da conta: ${newBal !== undefined ? formatMoney(newBal) : 'N/A'}.`,
         severity: 'warning'
      });

      addToast(`Baixa estornada com sucesso! O título #${reversalTargetTx.id?.slice(-6).toUpperCase()} retornou ao status Pendente e o saldo bancário foi ajustado.`, 'info');
      setIsReversalModalOpen(false);
      setReversalTargetTx(null);
      setReversalReason('');
   };

   // Save or Update standard transaction
   const handleSaveTransaction = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!formData.description || !formData.amount) {
         addToast("Preencha a descrição e o valor do lançamento.", 'warning');
         return;
      }

      setIsSubmitting(true);

      const selectedAccount = planOfAccounts.flatMap(g => g.children || []).find(c => c.id === formData.ledgerCode) ||
         planOfAccounts.find(g => g.id === formData.ledgerCode);

      const newTx: Transaction = {
         ...formData,
         id: selectedTransaction ? selectedTransaction.id : Date.now().toString(),
         date: formData.date || new Date().toLocaleDateString('pt-BR'),
         dueDate: formData.dueDate || formData.date || new Date().toLocaleDateString('pt-BR'),
         description: formData.description || '',
         amount: Number(formData.amount),
         category: selectedAccount?.name || formData.category || 'Outros',
         account: formData.account || 'Bradesco PJ',
         accountId: accounts.find(a => a.name === formData.account)?.id || '',
         status: formData.status || 'Pendente',
         type: formData.type || 'Despesa',
         ledgerCode: selectedAccount?.code || '',
         ledgerName: selectedAccount?.name || ''
      } as Transaction;

      await new Promise(resolve => setTimeout(resolve, 500));

      if (selectedTransaction) {
         updateTransaction(newTx);
         addToast("Lançamento atualizado com sucesso!", 'success');
      } else {
         // Balance Validation on direct creation with Conciliado
         if (newTx.type === 'Despesa' && newTx.status === 'Conciliado') {
            const txAccount = accounts.find(a => a.id === newTx.accountId);
            if (txAccount && txAccount.balance - newTx.amount < 0) {
               const isAdmin = currentUser?.username === 'admin' || hasPermission('all');
               if (!isAdmin) {
                  addToast(`🚫 OPERAÇÃO BLOQUEADA: Saldo insuficiente na conta "${txAccount.name}".`, 'error');
                  setIsSubmitting(false);
                  return;
               }
            }
         }
         addTransaction(newTx);
         addToast("Lançamento registrado com sucesso!", 'success');
      }

      setIsModalOpen(false);
      setSelectedTransaction(null);
      setFormData({
         type: 'Despesa',
         date: new Date().toLocaleDateString('pt-BR'),
         status: 'Pendente',
         account: 'Bradesco PJ',
         partnerName: '',
         documentNumber: '',
         competenceDate: '',
         costCenter: '',
         notes: '',
         paymentMethod: 'Boleto'
      });
      setIsSubmitting(false);
   };

   // Corporate Print for Receipts / Vouchers
   const handlePrintTransactionVoucher = (tx: Transaction) => {
      const isReceipt = tx.type === 'Receita';
      const voucherTitle = isReceipt ? 'COMPROVANTE DE RECEBIMENTO' : 'COMPROVANTE DE PAGAMENTO';
      const voucherProtocol = `REC-${tx.id?.slice(-8).toUpperCase() || Date.now().toString().slice(-8)}`;

      const html = `
         <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 30px; color: #1e293b; max-width: 800px; margin: 0 auto; line-height: 1.5;">
            <!-- Corporate Header -->
            <div style="border-bottom: 3px solid #0891b2; padding-bottom: 20px; margin-bottom: 25px; display: flex; justify-content: space-between; align-items: flex-start;">
               <div>
                  <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 5px;">
                     <div style="width: 32px; height: 32px; background: #0891b2; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; font-weight: 900; font-size: 16px;">IC</div>
                     <h1 style="margin: 0; font-size: 22px; font-weight: 900; color: #0f172a; text-transform: uppercase; letter-spacing: -0.5px;">${companyInfo.name}</h1>
                  </div>
                  <p style="margin: 2px 0; font-size: 11px; font-weight: bold; color: #475569;">CNPJ: ${companyInfo.document} | IE: ${companyInfo.stateRegistry}</p>
                  <p style="margin: 2px 0; font-size: 11px; color: #64748b;">${companyInfo.address}</p>
                  <p style="margin: 2px 0; font-size: 11px; color: #64748b;">${companyInfo.phone} • ${companyInfo.email}</p>
               </div>
               <div style="text-align: right;">
                  <span style="display: inline-block; padding: 4px 10px; background: ${isReceipt ? '#dcfce7' : '#fee2e2'}; color: ${isReceipt ? '#15803d' : '#b91c1c'}; font-size: 11px; font-weight: 800; border-radius: 6px; text-transform: uppercase;">
                     ${voucherTitle}
                  </span>
                  <p style="margin: 6px 0 2px 0; font-family: monospace; font-size: 13px; font-weight: 800; color: #0891b2;">${voucherProtocol}</p>
                  <p style="margin: 2px 0; font-size: 10px; color: #64748b;">Emissão: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}</p>
               </div>
            </div>

            <!-- Value Badge -->
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px; margin-bottom: 25px; text-align: center;">
               <span style="font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 1px;">Valor Liquidado</span>
               <h2 style="font-size: 36px; font-weight: 900; color: ${isReceipt ? '#16a34a' : '#0f172a'}; margin: 5px 0;">${formatMoney(tx.amount)}</h2>
               <span style="display: inline-flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 700; color: ${tx.status === 'Conciliado' ? '#16a34a' : '#d97706'};">
                  ● Situação: ${tx.status.toUpperCase()}
               </span>
            </div>

            <!-- Transaction Details Table -->
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px; font-size: 12px;">
               <tbody>
                  <tr style="border-bottom: 1px solid #f1f5f9;">
                     <td style="padding: 10px; font-weight: bold; color: #64748b; width: 35%;">Descrição:</td>
                     <td style="padding: 10px; font-weight: bold; color: #0f172a;">${tx.description}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #f1f5f9; background: #fafafa;">
                     <td style="padding: 10px; font-weight: bold; color: #64748b;">${isReceipt ? 'Pagador / Cliente:' : 'Beneficiário / Fornecedor:'}</td>
                     <td style="padding: 10px; color: #0f172a;">${tx.partnerName || '-'}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #f1f5f9;">
                     <td style="padding: 10px; font-weight: bold; color: #64748b;">Data do Movimento:</td>
                     <td style="padding: 10px; color: #0f172a;">${tx.date} ${tx.dueDate ? `(Vencimento original: ${tx.dueDate})` : ''}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #f1f5f9; background: #fafafa;">
                     <td style="padding: 10px; font-weight: bold; color: #64748b;">Conta Bancária / Caixa:</td>
                     <td style="padding: 10px; color: #0f172a;">${tx.account || '-'}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #f1f5f9;">
                     <td style="padding: 10px; font-weight: bold; color: #64748b;">Forma de Liquidação:</td>
                     <td style="padding: 10px; color: #0f172a;">${tx.paymentMethod || 'Não informado'}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #f1f5f9; background: #fafafa;">
                     <td style="padding: 10px; font-weight: bold; color: #64748b;">Categoria / Plano de Contas:</td>
                     <td style="padding: 10px; color: #0f172a;">${tx.ledgerCode ? `${tx.ledgerCode} - ` : ''}${tx.ledgerName || tx.category}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #f1f5f9;">
                     <td style="padding: 10px; font-weight: bold; color: #64748b;">Centro de Custo:</td>
                     <td style="padding: 10px; color: #0f172a;">${tx.costCenter || 'Geral'}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #f1f5f9; background: #fafafa;">
                     <td style="padding: 10px; font-weight: bold; color: #64748b;">Nº do Documento / Nota Fiscal:</td>
                     <td style="padding: 10px; color: #0f172a;">${tx.documentNumber || '-'}</td>
                  </tr>
                  ${tx.notes ? `
                  <tr>
                     <td style="padding: 10px; font-weight: bold; color: #64748b; vertical-align: top;">Histórico & Auditoria:</td>
                     <td style="padding: 10px; color: #475569; font-family: monospace; font-size: 11px; white-space: pre-wrap;">${tx.notes}</td>
                  </tr>
                  ` : ''}
               </tbody>
            </table>

            <!-- Signatures Block -->
            <div style="margin-top: 50px; display: grid; grid-template-columns: 1fr 1fr; gap: 40px; padding-top: 20px; border-top: 1px dashed #cbd5e1;">
               <div style="text-align: center;">
                  <div style="border-bottom: 1px solid #475569; margin-bottom: 8px; height: 40px;"></div>
                  <p style="margin: 0; font-size: 11px; font-weight: bold; color: #0f172a;">${currentUser?.name || 'Responsável Financeiro'}</p>
                  <p style="margin: 2px 0 0 0; font-size: 10px; color: #64748b;">Operador / Controladoria</p>
               </div>
               <div style="text-align: center;">
                  <div style="border-bottom: 1px solid #475569; margin-bottom: 8px; height: 40px;"></div>
                  <p style="margin: 0; font-size: 11px; font-weight: bold; color: #0f172a;">${tx.partnerName || 'Favorecido / Destinatário'}</p>
                  <p style="margin: 2px 0 0 0; font-size: 10px; color: #64748b;">Assinatura / Visto de Quitação</p>
               </div>
            </div>

            <!-- Corporate Disclaimer Footer -->
            <div style="margin-top: 40px; padding-top: 15px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; font-size: 9px; color: #94a3b8;">
               <span>Autenticação eletrônica InfraCore ERP® • Sistema Integrado de Gestão</span>
               <span>Protocolo: ${voucherProtocol}</span>
            </div>
         </div>
      `;

      printDocument(voucherTitle, html);
   };

   // CSV Import Handler
   const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
         try {
            const csvData = event.target?.result as string;
            if (!csvData) return;

            const lines = csvData.split('\n');
            let importedCount = 0;
            const startIndex = lines[0].toLowerCase().includes('data') ? 1 : 0;

            for (let i = startIndex; i < lines.length; i++) {
               const line = lines[i].trim();
               if (!line) continue;

               const cols = line.split(/[;,]/).map(c => c.trim().replace(/^"|"$/g, ''));
               if (cols.length >= 3) {
                  const date = cols[0];
                  const description = cols[1];
                  let amountStr = cols[2];
                  if (amountStr.includes('.') && amountStr.includes(',')) {
                     amountStr = amountStr.replace(/\./g, '').replace(',', '.');
                  } else if (amountStr.includes(',')) {
                     amountStr = amountStr.replace(',', '.');
                  }
                  const amount = Math.abs(parseFloat(amountStr));

                  let type: 'Receita' | 'Despesa' = 'Despesa';
                  if (cols[3]) {
                     const t = cols[3].toLowerCase();
                     if (t.includes('receita') || t.includes('crédito') || t.includes('entrada')) type = 'Receita';
                  } else {
                     if (!cols[2].includes('-')) type = 'Receita';
                  }

                  const category = cols[4] || 'Importado';

                  if (description && !isNaN(amount)) {
                     addTransaction({
                        id: `IMP-${Date.now()}-${i}`,
                        date: date,
                        dueDate: date,
                        description: description,
                        amount: amount,
                        type: type,
                        category: category,
                        status: 'Conciliado',
                        account: accounts[0]?.name || 'Conta Padrão',
                        accountId: accounts[0]?.id || '',
                        ledgerCode: '',
                        ledgerName: category
                     });
                     importedCount++;
                  }
               }
            }

            if (importedCount > 0) {
               addToast(`Importação concluída! ${importedCount} transações adicionadas.`, 'success');
            } else {
               addToast("Nenhuma transação válida encontrada no arquivo.", 'warning');
            }
         } catch (error) {
            console.error("Import Error:", error);
            addToast("Erro ao processar arquivo.", 'error');
         }
      };

      reader.readAsText(file);
      e.target.value = '';
   };

   // UI Components
   const NavButton = ({ id, label, icon: Icon, colorClass = "text-slate-500", badgeCount }: any) => (
      <button
         onClick={() => {
            setActiveTab(id);
            setSelectedTxIds([]);
         }}
         className={`
            px-4 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2.5 whitespace-nowrap relative
            ${activeTab === id
               ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/10 dark:bg-white dark:text-slate-900'
               : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:hover:bg-slate-800 dark:text-slate-400'
            }
         `}
      >
         <Icon size={18} className={activeTab === id ? 'text-cyan-400' : colorClass} />
         {label}
         {typeof badgeCount === 'number' && badgeCount > 0 && (
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${activeTab === id ? 'bg-cyan-500 text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'}`}>
               {badgeCount}
            </span>
         )}
      </button>
   );

   const KpiCard = ({ title, value, subtext, icon: Icon, color, trend }: any) => (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-slate-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
         <div className={`absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity ${color}`}>
            <Icon size={64} />
         </div>
         <div className="relative">
            <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">{title}</p>
            <h3 className="text-2xl lg:text-3xl font-black text-slate-900 dark:text-white mb-2">{value}</h3>
            {subtext && (
               <div className="flex items-center gap-1.5">
                  {trend && (
                     <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${trend === 'up' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {trend === 'up' ? '+' : '-'}2.5%
                     </span>
                  )}
                  <span className={`text-[10px] font-bold ${color}`}>{subtext}</span>
               </div>
            )}
         </div>
      </div>
   );

   // Selection Toggle Helper
   const handleToggleSelectAll = (list: Transaction[]) => {
      if (selectedTxIds.length === list.length) {
         setSelectedTxIds([]);
      } else {
         setSelectedTxIds(list.map(t => t.id));
      }
   };

   const handleToggleSelectOne = (id: string) => {
      setSelectedTxIds(prev =>
         prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
      );
   };

   return (
      <div className="flex flex-col gap-6 animate-in fade-in duration-500">

         {/* Top Header & Navigation */}
         <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-white dark:bg-gray-800 p-2.5 rounded-2xl shadow-sm border border-slate-100 dark:border-gray-700">
            <div className="flex overflow-x-auto p-1 gap-1 no-scrollbar items-center">
               <NavButton id="overview" label="Dashboard" icon={PieChart} />
               <NavButton id="cashflow" label="Fluxo de Caixa (DFC)" icon={TrendingUp} colorClass="text-cyan-500" />
               <div className="w-px bg-slate-200 dark:bg-gray-700 mx-1 h-6 hidden md:block"></div>
               <NavButton id="ledger" label="Livro Caixa" icon={List} />
               <NavButton id="receivables" label="A Receber" icon={ArrowDown} colorClass="text-green-500" badgeCount={receivables.length} />
               <NavButton id="payables" label="A Pagar" icon={ArrowUp} colorClass="text-red-500" badgeCount={payables.length} />
               <div className="w-px bg-slate-200 dark:bg-gray-700 mx-1 h-6 hidden md:block"></div>
               <NavButton id="accounts" label="Bancos & Caixa" icon={Landmark} />
               <NavButton id="planning" label="Plano de Contas" icon={FolderOpen} />
            </div>

            {(hasPermission('finance.edit_transaction') || hasPermission('finance.approve') || currentUser?.username === 'admin') && (
               <button
                  onClick={() => {
                     setSelectedTransaction(null);
                     setFormData({
                        type: 'Despesa',
                        date: new Date().toLocaleDateString('pt-BR'),
                        dueDate: new Date().toLocaleDateString('pt-BR'),
                        status: 'Pendente',
                        account: accounts.find(a => a.isDefault)?.name || accounts[0]?.name || 'Caixa Geral',
                        accountId: accounts.find(a => a.isDefault)?.id || accounts[0]?.id,
                        paymentMethod: 'Boleto',
                        costCenter: 'Administrativo'
                     });
                     setIsModalOpen(true);
                  }}
                  className="mx-2 xl:mx-0 px-6 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-cyan-600/20 transition-all flex items-center justify-center gap-2 whitespace-nowrap shrink-0"
               >
                  <Plus size={18} /> Novo Lançamento
               </button>
            )}
         </div>

         {/* ========================================================================= */}
         {/* BATCH ACTION BAR (QUANDO HOUVER ITENS SELECIONADOS) */}
         {/* ========================================================================= */}
         {selectedTxIds.length > 0 && (
            <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-4 animate-in slide-in-from-top duration-300">
               <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500 flex items-center justify-center font-bold text-white text-sm">
                     {selectedTxIds.length}
                  </div>
                  <div>
                     <p className="text-sm font-bold">
                        {selectedTxIds.length} título(s) selecionado(s) para liquidação
                     </p>
                     <p className="text-xs text-slate-400">
                        Total acumulado: {formatMoney(transactions.filter(t => selectedTxIds.includes(t.id)).reduce((acc, t) => acc + t.amount, 0))}
                     </p>
                  </div>
               </div>

               <div className="flex flex-wrap items-center gap-2">
                  <button
                     onClick={() => setSelectedTxIds([])}
                     className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-all cursor-pointer"
                  >
                     Desmarcar Todos
                  </button>
                  <button
                     onClick={handleDirectBatchReconciliation}
                     disabled={isSubmitting}
                     className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/20 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                     title="Conciliar títulos pendentes selecionados diretamente com proteção contra dupla baixa e atualização sincronizada do saldo"
                  >
                     <ShieldCheck size={16} /> Conciliação Direta em Lote
                  </button>
                  <button
                     onClick={() => {
                        const targetTxs = transactions.filter(t => selectedTxIds.includes(t.id));
                        openSettlementModal(targetTxs);
                     }}
                     className="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-cyan-500/20 flex items-center gap-2 transition-all cursor-pointer"
                     title="Abrir conferência detalhada com juros, descontos e conta bancária específica"
                  >
                     <CheckCircle size={16} /> Liquidação Detalhada
                  </button>
               </div>
            </div>
         )}

         {/* ========================================================================= */}
         {/* MODAL DE LIQUIDAÇÃO FINANCEIRA / BAIXA (COM VALIDAÇÕES RIGOROSAS) */}
         {/* ========================================================================= */}
         {isSettlementModalOpen && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
               <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-xl shadow-2xl border border-slate-100 dark:border-slate-700 animate-in fade-in zoom-in duration-300 overflow-hidden text-left max-h-[92vh] flex flex-col">
                  {/* Modal Header */}
                  <div className="p-6 border-b dark:border-gray-700 bg-slate-50/80 dark:bg-gray-700/50 flex items-center justify-between shrink-0">
                     <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-xl ${settlementTotals.isExpense ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                           {settlementTotals.isExpense ? <ArrowUp size={20} /> : <ArrowDown size={20} />}
                        </div>
                        <div>
                           <h3 className="text-lg font-black text-slate-900 dark:text-white">
                              {settlementTotals.isExpense ? 'Liquidação de Contas a Pagar (Baixa)' : 'Liquidação de Contas a Receber (Recebimento)'}
                           </h3>
                           <p className="text-xs text-slate-500 font-medium">
                              {settlementTargetTxs.length} lançamento(s) selecionado(s) para efetivação contábil.
                           </p>
                        </div>
                     </div>
                     <button
                        onClick={() => setIsSettlementModalOpen(false)}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-2 rounded-lg"
                     >
                        <X size={20} />
                     </button>
                  </div>

                  {/* Modal Body */}
                  <form onSubmit={handleConfirmSettlement} className="p-6 overflow-y-auto space-y-5 custom-scrollbar">

                     {/* Summary Card */}
                     <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
                        <div className="flex justify-between items-center mb-3 text-xs">
                           <span className="font-bold text-slate-500">Títulos a Liquidar</span>
                           <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{settlementTargetTxs.length} título(s)</span>
                        </div>
                        <div className="space-y-1.5 max-h-28 overflow-y-auto pr-1">
                           {settlementTargetTxs.map(t => (
                              <div key={t.id} className="flex justify-between items-center text-xs py-1 border-b border-slate-100 dark:border-slate-800">
                                 <span className="text-slate-700 dark:text-slate-300 truncate max-w-[260px] font-medium">
                                    {t.description}
                                 </span>
                                 <span className="font-black text-slate-900 dark:text-white font-mono">
                                    {formatMoney(t.amount)}
                                 </span>
                              </div>
                           ))}
                        </div>
                        <div className="mt-3 pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
                           <span className="text-xs font-black text-slate-500 uppercase tracking-wider">Subtotal Original</span>
                           <span className="text-sm font-black text-slate-900 dark:text-white">{formatMoney(settlementTotals.originalTotal)}</span>
                        </div>
                     </div>

                     {/* Settlement Parameters */}
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                           <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 ml-1">
                              Data da Liquidação / Efetivação *
                           </label>
                           <input
                              required
                              type="text"
                              className="w-full rounded-xl border border-slate-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white px-4 py-3 font-bold text-sm"
                              placeholder="DD/MM/AAAA"
                              value={settlementForm.date}
                              onChange={e => setSettlementForm({ ...settlementForm, date: e.target.value })}
                           />
                        </div>

                        <div>
                           <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 ml-1">
                              Forma de Liquidação *
                           </label>
                           <select
                              required
                              className="w-full rounded-xl border border-slate-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white px-4 py-3 text-sm font-bold"
                              value={settlementForm.paymentMethod}
                              onChange={e => setSettlementForm({ ...settlementForm, paymentMethod: e.target.value })}
                           >
                              <option value="PIX">PIX (Instantâneo)</option>
                              <option value="Boleto">Boleto Bancário</option>
                              <option value="Transferência">TED / DOC / Transferência</option>
                              <option value="Dinheiro">Dinheiro (Espécie)</option>
                              <option value="Cartão Débito">Cartão de Débito</option>
                              <option value="Cartão Crédito">Cartão de Crédito</option>
                              <option value="Cheque">Cheque</option>
                           </select>
                        </div>
                     </div>

                     {/* Financial Account & Live Balance Validation */}
                     <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 ml-1">
                           Conta Financeira de Débito/Crédito *
                        </label>
                        <select
                           required
                           className="w-full rounded-xl border border-slate-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white px-4 py-3 text-sm font-bold cursor-pointer"
                           value={settlementForm.accountId}
                           onChange={e => setSettlementForm({ ...settlementForm, accountId: e.target.value })}
                        >
                           <option value="">Selecione a conta...</option>
                           {accounts.map(acc => (
                              <option key={acc.id} value={acc.id}>
                                 {acc.name} — Saldo Disponível: {formatMoney(acc.balance)}
                              </option>
                           ))}
                        </select>

                        {/* Account Balance Inspection Box */}
                        {settlementTotals.targetAccount && (
                           <div className={`mt-2.5 p-3.5 rounded-xl border text-xs ${settlementTotals.hasNegativeBalanceRisk ? 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300' : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'}`}>
                              <div className="flex justify-between items-center mb-1">
                                 <span>Saldo Atual em Conta:</span>
                                 <strong className="font-mono">{formatMoney(settlementTotals.currentBalance)}</strong>
                              </div>
                              <div className="flex justify-between items-center font-bold">
                                 <span>Saldo Projetado após a Baixa:</span>
                                 <strong className={`font-mono ${settlementTotals.projectedBalance < 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                    {formatMoney(settlementTotals.projectedBalance)}
                                 </strong>
                              </div>

                              {settlementTotals.hasNegativeBalanceRisk && (
                                 <div className="mt-3 pt-2 border-t border-red-200 dark:border-red-800 flex items-start gap-2">
                                    <AlertTriangle size={18} className="text-red-500 shrink-0 mt-0.5" />
                                    <div>
                                       <p className="font-black text-red-700 dark:text-red-300 text-[11px]">
                                          ALERTA DE SALDO A DESCOBERTO:
                                       </p>
                                       <p className="text-[10px] text-red-600 dark:text-red-400">
                                          O valor da baixa excede o saldo disponível na conta selecionada.
                                       </p>

                                       <label className="flex items-center gap-2 mt-2 cursor-pointer font-bold text-[11px] text-red-900 dark:text-red-200">
                                          <input
                                             type="checkbox"
                                             checked={settlementForm.allowOverdraft}
                                             onChange={e => setSettlementForm({ ...settlementForm, allowOverdraft: e.target.checked })}
                                             className="rounded text-red-600 focus:ring-red-500 w-4 h-4"
                                          />
                                          Autorizo a liquidação em regime de limite especial / a descoberto
                                       </label>
                                    </div>
                                 </div>
                              )}
                           </div>
                        )}
                     </div>

                     {/* Interest & Discount Adjustments */}
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                           <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 ml-1">
                              Juros / Multa por Atraso (R$)
                           </label>
                           <input
                              type="number"
                              step="0.01"
                              min="0"
                              className="w-full rounded-xl border border-slate-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white px-4 py-2.5 font-bold text-sm"
                              placeholder="0,00"
                              value={settlementForm.interest || ''}
                              onChange={e => setSettlementForm({ ...settlementForm, interest: Number(e.target.value) })}
                           />
                        </div>

                        <div>
                           <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 ml-1">
                              Desconto / Abatimento (R$)
                           </label>
                           <input
                              type="number"
                              step="0.01"
                              min="0"
                              className="w-full rounded-xl border border-slate-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white px-4 py-2.5 font-bold text-sm"
                              placeholder="0,00"
                              value={settlementForm.discount || ''}
                              onChange={e => setSettlementForm({ ...settlementForm, discount: Number(e.target.value) })}
                           />
                        </div>
                     </div>

                     {/* Final Amount Display */}
                     <div className="p-4 bg-cyan-50 dark:bg-cyan-950/30 rounded-2xl border border-cyan-200 dark:border-cyan-800 flex justify-between items-center">
                        <div>
                           <span className="text-[10px] font-black text-cyan-700 dark:text-cyan-400 uppercase tracking-widest block">
                              Valor Final Efetivo da Baixa
                           </span>
                           <span className="text-xs text-slate-500">
                              (Original {formatMoney(settlementTotals.originalTotal)} + Juros {formatMoney(settlementTotals.interest)} - Desc. {formatMoney(settlementTotals.discount)})
                           </span>
                        </div>
                        <span className="text-2xl font-black text-cyan-700 dark:text-cyan-300 font-mono">
                           {formatMoney(settlementTotals.finalTotal)}
                        </span>
                     </div>

                     {/* Authentication Code & Notes */}
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                           <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 ml-1">
                              Nº Comprovante / Autenticação Bancária
                           </label>
                           <input
                              type="text"
                              className="w-full rounded-xl border border-slate-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white px-4 py-2.5 font-bold text-xs"
                              placeholder="Ex: AUT-8472919-PIX"
                              value={settlementForm.authCode}
                              onChange={e => setSettlementForm({ ...settlementForm, authCode: e.target.value })}
                           />
                        </div>

                        <div>
                           <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 ml-1">
                              Observações da Liquidação
                           </label>
                           <input
                              type="text"
                              className="w-full rounded-xl border border-slate-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white px-4 py-2.5 font-medium text-xs"
                              placeholder="Ex: Pagamento autorizado pelo diretor"
                              value={settlementForm.notes}
                              onChange={e => setSettlementForm({ ...settlementForm, notes: e.target.value })}
                           />
                        </div>
                     </div>

                     {/* Action Buttons */}
                     <div className="pt-3 flex gap-3">
                        <button
                           type="button"
                           onClick={() => setIsSettlementModalOpen(false)}
                           className="flex-1 py-3.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold rounded-xl text-xs hover:bg-slate-200 transition-all"
                        >
                           Cancelar
                        </button>
                        <button
                           type="submit"
                           disabled={isSubmitting || (settlementTotals.hasNegativeBalanceRisk && !settlementForm.allowOverdraft)}
                           className="flex-[2] py-3.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black rounded-xl text-xs uppercase tracking-wider shadow-xl shadow-cyan-600/30 flex items-center justify-center gap-2 transition-all"
                        >
                           {isSubmitting ? (
                              <>
                                 <Loader size={16} className="animate-spin" /> Processando Baixa...
                              </>
                           ) : (
                              <>
                                 <CheckCircle size={16} /> Confirmar Liquidação Contábil
                              </>
                           )}
                        </button>
                     </div>
                  </form>
               </div>
            </div>
         )}

         {/* ========================================================================= */}
         {/* MODAL DE ESTORNO DE BAIXA */}
         {/* ========================================================================= */}
         {isReversalModalOpen && reversalTargetTx && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
               <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-md shadow-2xl border border-slate-100 dark:border-slate-700 p-6 animate-in fade-in zoom-in duration-200">
                  <div className="flex items-center gap-3 mb-4 text-amber-600">
                     <div className="p-3 bg-amber-100 dark:bg-amber-950/40 rounded-2xl">
                        <Undo2 size={24} />
                     </div>
                     <div>
                        <h3 className="text-lg font-black text-slate-900 dark:text-white">Estorno de Liquidação</h3>
                        <p className="text-xs text-slate-500">Reabrir título como Pendente</p>
                     </div>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
                     Você está prestes a reverter a baixa do título <strong>"{reversalTargetTx.description}"</strong> no valor de <strong>{formatMoney(reversalTargetTx.amount)}</strong>. O saldo da conta será recalculado automaticamente.
                  </p>

                  <form onSubmit={handleConfirmReversal} className="space-y-4">
                     <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 ml-1">
                           Justificativa / Motivo do Estorno *
                        </label>
                        <textarea
                           required
                           className="w-full rounded-xl border border-slate-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white p-3 text-xs font-medium resize-none h-24"
                           placeholder="Ex: Baixa realizada na conta errada / Cheque devolvido..."
                           value={reversalReason}
                           onChange={e => setReversalReason(e.target.value)}
                        />
                     </div>

                     <div className="flex gap-3 pt-2">
                        <button
                           type="button"
                           onClick={() => setIsReversalModalOpen(false)}
                           className="flex-1 py-3 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold rounded-xl text-xs hover:bg-slate-200 transition-all"
                        >
                           Cancelar
                        </button>
                        <button
                           type="submit"
                           className="flex-[2] py-3 bg-amber-600 hover:bg-amber-500 text-white font-black rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-amber-600/20 flex items-center justify-center gap-2 transition-all"
                        >
                           <Undo2 size={16} /> Confirmar Estorno
                        </button>
                     </div>
                  </form>
               </div>
            </div>
         )}

         {/* ========================================================================= */}
         {/* TAB: DASHBOARD (OVERVIEW) */}
         {/* ========================================================================= */}
         {activeTab === 'overview' && (
            <div className="space-y-6">
               {/* KPIs */}
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <KpiCard
                     title="Caixa Disponível"
                     value={formatMoney(financials.balance)}
                     subtext="Saldo Real em Contas"
                     color="text-slate-900"
                     icon={Landmark}
                     trend="up"
                  />
                  <KpiCard
                     title="A Receber (Previsão)"
                     value={formatMoney(financials.receivables)}
                     subtext={`${receivables.length} títulos pendentes`}
                     color="text-green-600"
                     icon={ArrowDown}
                  />
                  <KpiCard
                     title="A Pagar (Previsão)"
                     value={formatMoney(financials.payables)}
                     subtext={`${payables.length} títulos pendentes`}
                     color="text-red-600"
                     icon={ArrowUp}
                  />
                  <KpiCard
                     title="Lucro Líquido do Período"
                     value={formatMoney(financials.totalRevenue - financials.totalExpenses)}
                     subtext="Receitas - Despesas Realizadas"
                     color={financials.totalRevenue - financials.totalExpenses >= 0 ? 'text-emerald-600' : 'text-red-600'}
                     icon={TrendingUp}
                  />
               </div>

               {/* Charts & Accounts */}
               <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                  <div className="xl:col-span-2 bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-gray-700">
                     <div className="flex justify-between items-center mb-6">
                        <div>
                           <h3 className="font-bold text-slate-800 dark:text-white text-base">Evolução de Fluxo Financeiro (Últimos 6 Meses)</h3>
                           <p className="text-xs text-slate-500">Comparativo mensal entre entradas e saídas</p>
                        </div>
                        <div className="flex gap-4">
                           <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-teal-400"></div>
                              <span className="text-xs font-bold text-slate-500">Entradas</span>
                           </div>
                           <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-pink-400"></div>
                              <span className="text-xs font-bold text-slate-500">Saídas</span>
                           </div>
                        </div>
                     </div>
                     <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                           <BarChart data={chartData} barGap={8}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} dy={10} />
                              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={v => `R$ ${v / 1000}k`} />
                              <Tooltip
                                 cursor={{ fill: '#f8fafc' }}
                                 formatter={(v: any) => [formatMoney(Number(v)), '']}
                                 contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                              />
                              <Bar dataKey="income" fill="#2dd4bf" radius={[6, 6, 0, 0]} barSize={28} name="Entradas" />
                              <Bar dataKey="expense" fill="#f472b6" radius={[6, 6, 0, 0]} barSize={28} name="Saídas" />
                           </BarChart>
                        </ResponsiveContainer>
                     </div>
                  </div>

                  <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-gray-700 flex flex-col">
                     <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-slate-800 dark:text-white">Contas Bancárias & Caixa</h3>
                        <span className="text-[10px] font-black text-cyan-600 uppercase bg-cyan-50 dark:bg-cyan-900/40 px-2 py-0.5 rounded">
                           {accounts.length} Ativas
                        </span>
                     </div>
                     <div className="space-y-3 overflow-y-auto flex-1 custom-scrollbar pr-1">
                        {accounts.map(acc => (
                           <div
                              key={acc.id}
                              onClick={() => {
                                 setSearchTerm(acc.name);
                                 setActiveTab('ledger');
                              }}
                              className="p-4 rounded-xl border border-slate-100 dark:border-gray-700 bg-slate-50 dark:bg-gray-700/30 flex justify-between items-center group hover:border-cyan-300 transition-colors cursor-pointer"
                           >
                              <div className="flex items-center gap-3">
                                 <div className={`w-10 h-10 rounded-xl ${acc.color} text-white flex items-center justify-center shadow-md`}>
                                    <Landmark size={18} />
                                 </div>
                                 <div>
                                    <p className="text-sm font-bold text-slate-800 dark:text-white">{acc.name}</p>
                                    <p className="text-[10px] text-slate-400 font-medium uppercase">{acc.type}</p>
                                 </div>
                              </div>
                              <span className={`text-sm font-black font-mono ${acc.balance < 0 ? 'text-red-600' : 'text-slate-800 dark:text-white'}`}>
                                 {formatMoney(acc.balance)}
                              </span>
                           </div>
                        ))}
                     </div>
                     <button
                        onClick={() => setActiveTab('accounts')}
                        className="mt-4 w-full py-3 text-cyan-600 text-xs font-bold uppercase border border-cyan-100 hover:bg-cyan-50 rounded-xl transition-colors flex items-center justify-center gap-1.5"
                     >
                        Gerenciar Contas <ChevronRight size={14} />
                     </button>
                  </div>
               </div>
            </div>
         )}

         {/* ========================================================================= */}
         {/* TAB: FLUXO DE CAIXA (DFC & PROJEÇÃO) - NOVO & APRIMORADO */}
         {/* ========================================================================= */}
         {activeTab === 'cashflow' && (
            <div className="space-y-6 animate-in fade-in duration-300">
               {/* Controls & Filter Bar */}
               <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-gray-700 flex flex-col lg:flex-row items-center justify-between gap-4">
                  <div>
                     <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                        <TrendingUp size={22} className="text-cyan-600" /> Demonstrativo de Fluxo de Caixa (DFC) & Projeção
                     </h2>
                     <p className="text-xs text-slate-500 mt-1">
                        Análise de liquidez, conciliação e projeção orçamentária para controle financeiro da empresa.
                     </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                     {/* Period Selector */}
                     <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl">
                        {[
                           { id: '30d', label: 'Últimos 30d' },
                           { id: 'month', label: 'Mês Atual' },
                           { id: 'next30', label: 'Próximos 30d' },
                           { id: 'next60', label: 'Próximos 60d' },
                           { id: 'next90', label: 'Próximos 90d' },
                           { id: 'year', label: 'Ano Todo' }
                        ].map(item => (
                           <button
                              key={item.id}
                              onClick={() => setCashflowPeriod(item.id as any)}
                              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${cashflowPeriod === item.id ? 'bg-white dark:bg-slate-700 text-cyan-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                           >
                              {item.label}
                           </button>
                        ))}
                     </div>

                     {/* Account Filter */}
                     <select
                        value={cashflowAccountFilter}
                        onChange={e => setCashflowAccountFilter(e.target.value)}
                        className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300"
                     >
                        <option value="all">Todas as Contas (Consolidado)</option>
                        {accounts.map(acc => (
                           <option key={acc.id} value={acc.id}>{acc.name}</option>
                        ))}
                     </select>

                     {/* Export DFC */}
                     <button
                        onClick={() => {
                           const headers = 'Data;Descricao;Categoria;Conta;Tipo;Status;Valor;SaldoAcumulado\n';
                           const rows = cashFlowData.timelineItems.map(item =>
                              `"${item.date}";"${item.description}";"${item.category}";"${item.account}";"${item.type}";"${item.status}";"${item.amount.toFixed(2)}";"${item.runningBalance.toFixed(2)}"`
                           ).join('\n');

                           const corporateHeader = [
                              `# =========================================================================`,
                              `# INFRAGORE ERP - DEMONSTRATIVO DE FLUXO DE CAIXA (DFC)`,
                              `# Razão Social: ${companyInfo.name} | CNPJ: ${companyInfo.document}`,
                              `# Período: ${cashflowPeriod.toUpperCase()} | Emissão: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}`,
                              `# Saldo Inicial: ${cashFlowData.initialCash.toFixed(2)} | Saldo Final Projetado: ${cashFlowData.finalProjectedBalance.toFixed(2)}`,
                              `# =========================================================================`,
                              ``
                           ].join('\n');

                           const blob = new Blob(['\uFEFF' + corporateHeader + headers + rows], { type: 'text/csv;charset=utf-8;' });
                           const url = URL.createObjectURL(blob);
                           const a = document.createElement('a');
                           a.href = url;
                           a.download = `fluxo_de_caixa_dfc_${new Date().toISOString().split('T')[0]}.csv`;
                           a.click();
                           URL.revokeObjectURL(url);
                           addToast("DFC exportado em formato CSV corporativo!", 'success');
                        }}
                        className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-sm"
                     >
                        <Download size={14} /> Exportar DFC
                     </button>
                  </div>
               </div>

               {/* Cash Flow Summary Cards */}
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-slate-100 dark:border-gray-700 shadow-sm">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Saldo Inicial</p>
                     <h4 className="text-xl font-black text-slate-800 dark:text-white font-mono">{formatMoney(cashFlowData.initialCash)}</h4>
                     <p className="text-[10px] text-slate-400 mt-1">Disponível no Início</p>
                  </div>

                  <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-slate-100 dark:border-gray-700 shadow-sm">
                     <p className="text-[10px] font-black text-emerald-500 uppercase tracking-wider mb-1">Total de Entradas</p>
                     <h4 className="text-xl font-black text-emerald-600 font-mono">+{formatMoney(cashFlowData.totalInflow)}</h4>
                     <p className="text-[10px] text-slate-400 mt-1">
                        {formatMoney(cashFlowData.totalRealizedInflow)} real. | {formatMoney(cashFlowData.totalProjectedInflow)} prev.
                     </p>
                  </div>

                  <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-slate-100 dark:border-gray-700 shadow-sm">
                     <p className="text-[10px] font-black text-rose-500 uppercase tracking-wider mb-1">Total de Saídas</p>
                     <h4 className="text-xl font-black text-rose-600 font-mono">-{formatMoney(cashFlowData.totalOutflow)}</h4>
                     <p className="text-[10px] text-slate-400 mt-1">
                        {formatMoney(cashFlowData.totalRealizedOutflow)} real. | {formatMoney(cashFlowData.totalProjectedOutflow)} prev.
                     </p>
                  </div>

                  <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-slate-100 dark:border-gray-700 shadow-sm">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Resultado Líquido</p>
                     <h4 className={`text-xl font-black font-mono ${cashFlowData.netPeriod >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {formatMoney(cashFlowData.netPeriod)}
                     </h4>
                     <p className="text-[10px] text-slate-400 mt-1">Variação do Período</p>
                  </div>

                  <div className={`p-5 rounded-2xl border shadow-sm ${cashFlowData.finalProjectedBalance < 0 ? 'bg-red-50 dark:bg-red-950/20 border-red-200 text-red-900' : 'bg-white dark:bg-gray-800 border-slate-100 dark:border-gray-700'}`}>
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Saldo Final Projetado</p>
                     <h4 className={`text-xl font-black font-mono ${cashFlowData.finalProjectedBalance < 0 ? 'text-red-600' : 'text-cyan-600'}`}>
                        {formatMoney(cashFlowData.finalProjectedBalance)}
                     </h4>
                     <span className={`inline-block text-[9px] font-black uppercase px-2 py-0.5 rounded-full mt-1 ${cashFlowData.finalProjectedBalance < 0 ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                        {cashFlowData.finalProjectedBalance < 0 ? '⚠️ Alerta de Caixa' : '✓ Liquidez Positiva'}
                     </span>
                  </div>
               </div>

               {/* Cash Flow Balance Curve & Movement Chart */}
               <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-gray-700">
                  <div className="flex justify-between items-center mb-6">
                     <div>
                        <h3 className="font-bold text-slate-800 dark:text-white text-base">Curva de Saldo Acumulado & Movimentações Diárias</h3>
                        <p className="text-xs text-slate-500">Trajetória prevista do caixa corporativo</p>
                     </div>
                     <div className="flex items-center gap-4 text-xs font-bold text-slate-500">
                        <span className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-cyan-500"></div> Saldo Acumulado</span>
                        <span className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-emerald-400"></div> Entradas</span>
                        <span className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-rose-400"></div> Saídas</span>
                     </div>
                  </div>

                  <div className="h-80 w-full">
                     {cashFlowData.chartTimeline.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                           <AreaChart data={cashFlowData.chartTimeline}>
                              <defs>
                                 <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.25} />
                                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                                 </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                              <XAxis dataKey="displayDate" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} dy={10} />
                              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={v => `R$ ${v / 1000}k`} />
                              <Tooltip
                                 formatter={(v: any) => [formatMoney(Number(v)), '']}
                                 contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                              />
                              <Area type="monotone" dataKey="balance" stroke="#0891b2" strokeWidth={3} fillOpacity={1} fill="url(#balanceGradient)" name="Saldo Acumulado" />
                           </AreaChart>
                        </ResponsiveContainer>
                     ) : (
                        <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                           Nenhuma movimentação identificada para este período.
                        </div>
                     )}
                  </div>
               </div>

               {/* Detailed DFC Table */}
               <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-slate-100 dark:border-gray-700 overflow-hidden">
                  <div className="p-5 border-b border-slate-100 dark:border-gray-700 flex justify-between items-center">
                     <div>
                        <h3 className="font-bold text-slate-900 dark:text-white text-base">Extrato Detalhado do Fluxo de Caixa</h3>
                        <p className="text-xs text-slate-500">Cronograma ordenado por data de vencimento/liquidação</p>
                     </div>
                     <span className="text-xs font-bold text-slate-500">{cashFlowData.timelineItems.length} lançamentos</span>
                  </div>

                  <div className="overflow-x-auto max-h-[460px] custom-scrollbar">
                     <table className="w-full text-xs text-left">
                        <thead className="bg-slate-50 dark:bg-gray-700/50 text-[10px] uppercase font-black text-slate-400 sticky top-0 z-10">
                           <tr>
                              <th className="px-5 py-3">Data</th>
                              <th className="px-5 py-3">Descrição</th>
                              <th className="px-5 py-3">Categoria</th>
                              <th className="px-5 py-3">Conta</th>
                              <th className="px-5 py-3 text-center">Status</th>
                              <th className="px-5 py-3 text-right">Entrada</th>
                              <th className="px-5 py-3 text-right">Saída</th>
                              <th className="px-5 py-3 text-right">Saldo Acumulado</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-gray-700">
                           {cashFlowData.timelineItems.map((item, index) => (
                              <tr key={`${item.id}-${index}`} className="hover:bg-slate-50 dark:hover:bg-gray-700/40 transition-colors">
                                 <td className="px-5 py-3 font-mono text-slate-500 whitespace-nowrap">{item.date}</td>
                                 <td className="px-5 py-3 font-bold text-slate-800 dark:text-slate-200">{item.description}</td>
                                 <td className="px-5 py-3 text-slate-500">{item.category}</td>
                                 <td className="px-5 py-3 text-slate-500">{item.account}</td>
                                 <td className="px-5 py-3 text-center">
                                    <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${item.isRealized ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                       {item.isRealized ? '✓ Conciliado' : '⏳ Previsto'}
                                    </span>
                                 </td>
                                 <td className="px-5 py-3 text-right font-black font-mono text-emerald-600">
                                    {item.type === 'Receita' ? formatMoney(item.amount) : '-'}
                                 </td>
                                 <td className="px-5 py-3 text-right font-black font-mono text-rose-600">
                                    {item.type === 'Despesa' ? formatMoney(item.amount) : '-'}
                                 </td>
                                 <td className={`px-5 py-3 text-right font-black font-mono ${item.runningBalance < 0 ? 'text-rose-600' : 'text-slate-900 dark:text-white'}`}>
                                    {formatMoney(item.runningBalance)}
                                 </td>
                              </tr>
                           ))}
                        </tbody>
                     </table>
                  </div>
               </div>
            </div>
         )}

         {/* ========================================================================= */}
         {/* TAB: LIVRO CAIXA, CONTAS A RECEBER OU CONTAS A PAGAR */}
         {/* ========================================================================= */}
         {(activeTab === 'ledger' || activeTab === 'receivables' || activeTab === 'payables') && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-slate-100 dark:border-gray-700 overflow-hidden">
               {/* Controls Bar */}
               <div className="p-6 border-b border-slate-100 dark:border-gray-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                     <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        {activeTab === 'ledger' ? <List className="text-cyan-600" /> : activeTab === 'receivables' ? <ArrowDown className="text-green-500" /> : <ArrowUp className="text-red-500" />}
                        {activeTab === 'ledger' ? 'Livro Caixa Geral' : activeTab === 'receivables' ? 'Contas a Receber' : 'Contas a Pagar'}
                     </h3>
                     <p className="text-xs text-slate-500 mt-1">
                        {activeTab === 'ledger'
                           ? 'Histórico completo de transações e movimentações financeiras'
                           : activeTab === 'receivables'
                              ? 'Títulos em aberto e controle de recebimentos com baixa validada'
                              : 'Obrigações e pagamentos a fornecedores com conferência de saldo'}
                     </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                     {/* Search */}
                     <div className="relative">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                           type="text"
                           placeholder="Buscar lançamentos..."
                           value={searchTerm}
                           onChange={e => setSearchTerm(e.target.value)}
                           className="pl-9 pr-4 py-2 bg-slate-50 dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-xl text-xs font-bold w-48 focus:ring-2 focus:ring-cyan-500"
                        />
                     </div>

                     {/* Status Filter */}
                     <select
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value as any)}
                        className="py-2 px-3 bg-slate-50 dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300"
                     >
                        <option value="Todos">Status: Todos</option>
                        <option value="Pendente">Pendentes</option>
                        <option value="Conciliado">Conciliados (Baixados)</option>
                        <option value="Vencido">Vencidos</option>
                     </select>

                     {/* Sincronização Manual de Vendas a Prazo / Boletos */}
                     {activeTab === 'receivables' && (
                        <button
                           onClick={handleManualSyncSales}
                           disabled={isSyncingSales}
                           className="py-2 px-3 bg-cyan-50 hover:bg-cyan-100 text-cyan-700 dark:bg-cyan-950/40 dark:hover:bg-cyan-900/40 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                           title="Sincronizar Vendas a Prazo e Boletos com Contas a Receber"
                        >
                           <RefreshCw size={14} className={isSyncingSales ? 'animate-spin' : ''} />
                           <span>Sincronizar Vendas</span>
                           {unreconciledSales.length > 0 && (
                              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-500 text-white font-black animate-pulse">
                                 {unreconciledSales.length}
                              </span>
                           )}
                        </button>
                     )}

                     {/* Import OFX/CSV */}
                     <label className="p-2.5 text-slate-500 hover:text-cyan-600 bg-slate-50 hover:bg-slate-100 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-xl cursor-pointer transition-colors" title="Importar Extrato OFX/CSV">
                        <Upload size={16} />
                        <input type="file" className="hidden" onChange={handleImport} accept=".csv,.ofx,.xlsx" />
                     </label>

                     {/* Export CSV */}
                     <button
                        onClick={() => {
                           const list = currentTabTransactions;
                           const headers = 'Data;Vencimento;Descricao;Categoria;Conta;Tipo;Valor;Status\n';
                           const rows = list.map(t => `"${t.date}";"${t.dueDate || t.date}";"${t.description}";"${t.ledgerName || t.category}";"${t.account}";"${t.type}";"${t.amount.toFixed(2)}";"${t.status}"`).join('\n');
                           const corporateHeader = [
                              `# =========================================================================`,
                              `# INFRAGORE ERP - RELATÓRIO FINANCEIRO: ${activeTab.toUpperCase()}`,
                              `# Razão Social: ${companyInfo.name} | CNPJ: ${companyInfo.document}`,
                              `# Emissão: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}`,
                              `# =========================================================================`,
                              ``
                           ].join('\n');
                           const blob = new Blob(['\uFEFF' + corporateHeader + headers + rows], { type: 'text/csv;charset=utf-8;' });
                           const url = URL.createObjectURL(blob);
                           const a = document.createElement('a');
                           a.href = url;
                           a.download = `financeiro_${activeTab}_${new Date().toISOString().split('T')[0]}.csv`;
                           a.click();
                           URL.revokeObjectURL(url);
                           addToast("Exportação concluída!", 'success');
                        }}
                        className="p-2.5 text-slate-500 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-xl transition-colors"
                        title="Exportar CSV Corporativo"
                     >
                        <Download size={16} />
                     </button>
                  </div>
               </div>

               {/* Banner de Alerta para Vendas a Prazo/Boleto Pendentes de Sincronização */}
               {activeTab === 'receivables' && unreconciledSales.length > 0 && (
                  <div className="mx-6 my-4 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-300">
                     <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400 shrink-0">
                           <AlertCircle size={20} />
                        </div>
                        <div>
                           <p className="text-xs font-bold text-amber-900 dark:text-amber-200">
                              {unreconciledSales.length} {unreconciledSales.length === 1 ? 'venda a prazo/boleto identificada' : 'vendas a prazo/boletos identificadas'} sem títulos no Contas a Receber
                           </p>
                           <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-0.5">
                              Existem vendas com cobrança a prazo ou boleto que ainda não geraram títulos. Clique ao lado para sincronizar.
                           </p>
                        </div>
                     </div>
                     <button
                        onClick={handleManualSyncSales}
                        disabled={isSyncingSales}
                        className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-md shadow-amber-600/20 flex items-center gap-2 transition-all shrink-0 cursor-pointer disabled:opacity-50"
                     >
                        <RefreshCw size={14} className={isSyncingSales ? 'animate-spin' : ''} />
                        {isSyncingSales ? 'Sincronizando...' : 'Sincronizar Agora'}
                     </button>
                  </div>
               )}

               {/* Table */}
               <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                     <thead className="text-[10px] uppercase text-slate-400 bg-slate-50 dark:bg-gray-700/50 font-black tracking-wider">
                        <tr>
                           <th className="px-4 py-4 text-center w-12">
                              <input
                                 type="checkbox"
                                 checked={selectedTxIds.length > 0 && selectedTxIds.length === currentTabTransactions.length}
                                 onChange={() => handleToggleSelectAll(currentTabTransactions)}
                                 className="rounded border-slate-300 text-cyan-600 focus:ring-cyan-500 w-4 h-4 cursor-pointer"
                              />
                           </th>
                           <th className="px-4 py-4">Data / Vencimento</th>
                           <th className="px-6 py-4">Descrição & Favorecido</th>
                           <th className="px-6 py-4">Categoria (Plano)</th>
                           <th className="px-6 py-4">Conta Bancária</th>
                           <th className="px-6 py-4 text-right">Valor</th>
                           <th className="px-6 py-4 text-center">Status</th>
                           <th className="px-6 py-4 text-right">Ações de Baixa</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100 dark:divide-gray-700">
                        {currentTabTransactions.map(tx => {
                           const isSelected = selectedTxIds.includes(tx.id);
                           const isSettled = isAlreadySettled(tx);

                           return (
                              <tr
                                 key={tx.id}
                                 className={`hover:bg-slate-50 dark:hover:bg-gray-700/40 transition-colors group ${isSelected ? 'bg-cyan-50/50 dark:bg-cyan-950/20' : ''}`}
                              >
                                 <td className="px-4 py-4 text-center">
                                    <input
                                       type="checkbox"
                                       checked={isSelected}
                                       onChange={() => handleToggleSelectOne(tx.id)}
                                       className="rounded border-slate-300 text-cyan-600 focus:ring-cyan-500 w-4 h-4 cursor-pointer"
                                    />
                                 </td>
                                 <td className="px-4 py-4 font-mono text-xs text-slate-500 whitespace-nowrap">
                                    <div>{tx.dueDate || tx.date}</div>
                                    {tx.dueDate && tx.dueDate !== tx.date && (
                                       <span className="text-[10px] text-slate-400">Emissão: {tx.date}</span>
                                    )}
                                 </td>
                                 <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                       <div className={`p-2 rounded-lg shrink-0 ${tx.type === 'Receita' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                          {tx.type === 'Receita' ? <ArrowDown size={14} /> : <ArrowUp size={14} />}
                                       </div>
                                       <div>
                                          <p className="font-bold text-slate-800 dark:text-slate-200">{tx.description}</p>
                                          {(tx.partnerName || (tx.originModule === 'Vendas' && tx.originId && sales.find(s => s.id === tx.originId)?.clientName)) && (
                                             <p className="text-[10px] text-slate-400 font-semibold">
                                                {tx.partnerName || (tx.originId && sales.find(s => s.id === tx.originId)?.clientName)}
                                             </p>
                                          )}
                                          <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                             {tx.documentNumber && (
                                                <span className="text-[10px] text-cyan-600 font-mono font-bold bg-cyan-50 dark:bg-cyan-950/50 px-1.5 py-0.5 rounded">
                                                   Doc: {tx.documentNumber}
                                                </span>
                                             )}
                                             {(() => {
                                                const match = (tx.description || '').match(/\((\d+\/\d+)\)/) || (tx.documentNumber || '').match(/-(\d+\/\d+)$/);
                                                if (match) {
                                                   return (
                                                      <span className="text-[10px] text-amber-700 dark:text-amber-300 font-bold bg-amber-50 dark:bg-amber-950/50 px-1.5 py-0.5 rounded border border-amber-200/50 dark:border-amber-800/50">
                                                         Parcela {match[1]}
                                                      </span>
                                                   );
                                                }
                                                return null;
                                             })()}
                                             {(tx.paymentMethod || (tx.originModule === 'Vendas' && tx.originId && sales.find(s => s.id === tx.originId)?.paymentMethod)) && (
                                                <span className="text-[10px] text-slate-600 dark:text-slate-300 font-semibold bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded">
                                                   {tx.paymentMethod || getPaymentMethodDisplay(sales.find(s => s.id === tx.originId)?.paymentMethod)}
                                                </span>
                                             )}
                                             {tx.originModule === 'Vendas' && (
                                                <span className="text-[9px] text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/50 px-1.5 py-0.5 rounded border border-emerald-200/50 dark:border-emerald-800/50">
                                                   Vendas
                                                </span>
                                             )}
                                          </div>
                                       </div>
                                    </div>
                                 </td>
                                 <td className="px-6 py-4">
                                    <span className="inline-block px-2.5 py-1 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 uppercase">
                                       {tx.ledgerName || tx.category}
                                    </span>
                                 </td>
                                 <td className="px-6 py-4 text-xs font-semibold text-slate-500">
                                    {tx.account}
                                 </td>
                                 <td className={`px-6 py-4 text-right font-black font-mono text-sm ${tx.type === 'Receita' ? 'text-green-600' : 'text-slate-900 dark:text-white'}`}>
                                    {formatMoney(tx.amount)}
                                 </td>
                                 <td className="px-6 py-4 text-center">
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${isSettled ? 'bg-green-100 text-green-700' :
                                       tx.status === 'Pendente' ? 'bg-amber-100 text-amber-700' :
                                          tx.status === 'Vencido' ? 'bg-rose-100 text-rose-700' :
                                             'bg-slate-100 text-slate-600'
                                       }`}>
                                       <div className={`w-1.5 h-1.5 rounded-full ${isSettled ? 'bg-green-500' : tx.status === 'Pendente' ? 'bg-amber-500' : 'bg-rose-500'}`}></div>
                                       {tx.status}
                                    </span>
                                 </td>
                                 <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-1">
                                       {/* Botão de Baixa / Liquidação Validada */}
                                       {!isSettled && hasPermission('finance.reconcile') && (
                                          <button
                                             onClick={() => openSettlementModal([tx])}
                                             className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center gap-1 transition-all"
                                             title="Efetuar Baixa / Liquidação"
                                          >
                                             <CheckCircle size={14} /> Baixar
                                          </button>
                                       )}

                                       {/* Botão de Estorno de Baixa */}
                                       {isSettled && hasPermission('finance.reconcile') && (
                                          <button
                                             onClick={() => openReversalModal(tx)}
                                             className="px-2 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold text-xs flex items-center gap-1 transition-all"
                                             title="Estornar Baixa"
                                          >
                                             <Undo2 size={13} /> Estornar
                                          </button>
                                       )}

                                       {/* Imprimir Comprovante Corporativo */}
                                       <button
                                          onClick={() => handlePrintTransactionVoucher(tx)}
                                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                                          title="Imprimir Comprovante Corporativo"
                                       >
                                          <Printer size={15} />
                                       </button>

                                       {/* Editar */}
                                       {hasPermission('finance.transact') && (
                                          <button
                                             onClick={() => {
                                                setSelectedTransaction(tx);
                                                setFormData(tx);
                                                setIsModalOpen(true);
                                             }}
                                             className="p-1.5 text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors"
                                             title="Editar Lançamento"
                                          >
                                             <Edit2 size={15} />
                                          </button>
                                       )}

                                       {/* Excluir */}
                                       {hasPermission('finance.delete') && (
                                          <button
                                             onClick={() => {
                                                addToast("Deseja realmente excluir esta transação?", 'warning', 5000, {
                                                   label: 'EXCLUIR',
                                                   onClick: () => deleteTransaction(tx.id)
                                                });
                                             }}
                                             className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                             title="Excluir"
                                          >
                                             <Trash2 size={15} />
                                          </button>
                                       )}
                                    </div>
                                 </td>
                              </tr>
                           );
                        })}
                        {currentTabTransactions.length === 0 && (
                           <tr>
                              <td colSpan={8} className="py-12 text-center text-slate-400">
                                 <div className="flex flex-col items-center justify-center gap-2">
                                    <Info size={32} className="text-slate-300 dark:text-gray-600" />
                                    <p className="font-bold text-slate-600 dark:text-slate-300 text-sm">
                                       Nenhum título ou lançamento encontrado
                                    </p>
                                    <p className="text-xs text-slate-400 max-w-sm">
                                       {activeTab === 'receivables'
                                          ? 'Não há contas a receber pendentes com os filtros atuais. Se novas vendas a prazo foram emitidas, utilize o botão "Sincronizar Vendas".'
                                          : 'Nenhum lançamento corresponde aos filtros ou critérios de busca informados.'}
                                    </p>
                                 </div>
                              </td>
                           </tr>
                        )}
                     </tbody>
                  </table>
               </div>
            </div>
         )}

         {/* ========================================================================= */}
         {/* TAB: BANCOS & CAIXA */}
         {/* ========================================================================= */}
         {activeTab === 'accounts' && (
            <div className="space-y-6 animate-in fade-in duration-300">
               {/* Resumo Consolidado de Contas */}
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-gray-700 flex items-center gap-4">
                     <div className="w-12 h-12 rounded-xl bg-cyan-50 dark:bg-cyan-900/30 text-cyan-600 flex items-center justify-center shrink-0">
                        <Landmark size={24} />
                     </div>
                     <div>
                        <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Saldo Consolidado</p>
                        <p className={`text-xl font-black font-mono ${accounts.reduce((s, a) => s + (Number(a.balance) || 0), 0) < 0 ? 'text-red-600' : 'text-slate-900 dark:text-white'}`}>
                           {formatMoney(accounts.reduce((s, a) => s + (Number(a.balance) || 0), 0))}
                        </p>
                        <p className="text-[11px] text-slate-400 font-medium mt-0.5">Disponível em caixas & bancos</p>
                     </div>
                  </div>

                  <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-gray-700 flex items-center gap-4">
                     <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center shrink-0">
                        <Wallet size={24} />
                     </div>
                     <div>
                        <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total com Limites</p>
                        <p className="text-xl font-black font-mono text-slate-900 dark:text-white">
                           {formatMoney(accounts.reduce((s, a) => s + (Number(a.balance) || 0) + (Number(a.creditLimit) || 0), 0))}
                        </p>
                        <p className="text-[11px] text-slate-400 font-medium mt-0.5">Saldo + Cheque Especial</p>
                     </div>
                  </div>

                  <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-gray-700 flex items-center gap-4">
                     <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-900/30 text-amber-500 flex items-center justify-center shrink-0">
                        <Star size={24} className="fill-amber-400 text-amber-500" />
                     </div>
                     <div>
                        <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Conta Padrão ERP</p>
                        <p className="text-sm font-black text-slate-900 dark:text-white truncate max-w-[160px]">
                           {accounts.find(a => a.isDefault)?.name || accounts[0]?.name || 'Nenhuma definida'}
                        </p>
                        <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                           {accounts.find(a => a.isDefault)?.type || 'Sugerida para baixas'}
                        </p>
                     </div>
                  </div>

                  <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-gray-700 flex items-center gap-4">
                     <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-900/30 text-purple-600 flex items-center justify-center shrink-0">
                        <Building2 size={24} />
                     </div>
                     <div>
                        <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Contas Ativas</p>
                        <p className="text-xl font-black font-mono text-slate-900 dark:text-white">
                           {accounts.length} {accounts.length === 1 ? 'Conta' : 'Contas'}
                        </p>
                        <p className="text-[11px] text-slate-400 font-medium mt-0.5">Bancos, caixas & fintechs</p>
                     </div>
                  </div>
               </div>

               {/* Barra de Ações & Busca */}
               <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-gray-700">
                  <div className="relative flex-1 max-w-md">
                     <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                     <input
                        type="text"
                        placeholder="Buscar por banco, agência, conta, nome ou chave PIX..."
                        value={accountSearchTerm}
                        onChange={e => setAccountSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-xl text-xs font-bold text-slate-800 dark:text-white focus:ring-2 focus:ring-cyan-500 transition-all"
                     />
                  </div>

                  <div className="flex items-center gap-3">
                     <button
                        onClick={openNewAccountModal}
                        className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-cyan-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
                     >
                        <Plus size={16} /> Nova Conta Bancária
                     </button>
                  </div>
               </div>

               {/* Grid de Cards de Contas Bancárias */}
               <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {accounts
                     .filter(acc => {
                        if (!accountSearchTerm) return true;
                        const term = accountSearchTerm.toLowerCase();
                        return (
                           acc.name?.toLowerCase().includes(term) ||
                           acc.bankName?.toLowerCase().includes(term) ||
                           acc.bankCode?.toLowerCase().includes(term) ||
                           acc.agency?.toLowerCase().includes(term) ||
                           acc.accountNumber?.toLowerCase().includes(term) ||
                           acc.pixKey?.toLowerCase().includes(term) ||
                           acc.type?.toLowerCase().includes(term)
                        );
                     })
                     .map(acc => {
                        const isDefault = Boolean(acc.isDefault);
                        const creditLimitNum = Number(acc.creditLimit || 0);
                        const totalAvailable = Number(acc.balance || 0) + creditLimitNum;

                        return (
                           <div
                              key={acc.id}
                              className={`bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border transition-all duration-200 relative overflow-hidden group hover:shadow-md ${
                                 isDefault ? 'border-amber-400/60 dark:border-amber-500/40 ring-1 ring-amber-400/30' : 'border-slate-100 dark:border-gray-700'
                              }`}
                           >
                              {/* Glowing background halo */}
                              <div className={`absolute top-0 right-0 w-32 h-32 rounded-full ${acc.color || 'bg-blue-600'} opacity-10 blur-3xl -mr-12 -mt-12 group-hover:opacity-20 transition-opacity`}></div>

                              <div className="relative flex flex-col h-full justify-between gap-5">
                                 {/* Top row: Bank icon, badges & action buttons */}
                                 <div className="flex justify-between items-start gap-3">
                                    <div className="flex items-center gap-3">
                                       <div className={`w-12 h-12 rounded-2xl ${acc.color || 'bg-blue-600'} text-white flex items-center justify-center shadow-md shadow-slate-900/10 shrink-0`}>
                                          <Landmark size={22} />
                                       </div>
                                       <div>
                                          <div className="flex items-center gap-1.5 flex-wrap">
                                             {acc.bankCode && acc.bankCode !== '999' && (
                                                <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-slate-100 dark:bg-gray-700 text-slate-600 dark:text-slate-300 font-mono">
                                                   COMPE {acc.bankCode}
                                                </span>
                                             )}
                                             {isDefault && (
                                                <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-300 dark:border-amber-800 flex items-center gap-1">
                                                   <Star size={10} className="fill-amber-500" /> PADRÃO ERP
                                                </span>
                                             )}
                                          </div>
                                          <h4 className="text-lg font-black text-slate-900 dark:text-white mt-1 leading-tight">{acc.name}</h4>
                                          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{acc.type || 'Conta Corrente'}</p>
                                       </div>
                                    </div>

                                    {/* Action buttons */}
                                    <div className="flex items-center gap-1 shrink-0">
                                       {!isDefault && (
                                          <button
                                             onClick={() => handleSetDefaultAccount(acc)}
                                             className="p-2 text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/30 rounded-xl transition-colors cursor-pointer"
                                             title="Definir como Conta Padrão do ERP"
                                          >
                                             <Star size={16} />
                                          </button>
                                       )}
                                       <button
                                          onClick={() => openEditAccountModal(acc)}
                                          className="p-2 text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 dark:hover:bg-cyan-950/30 rounded-xl transition-colors cursor-pointer"
                                          title="Editar Conta Bancária"
                                       >
                                          <Edit2 size={16} />
                                       </button>
                                       {hasPermission('finance.delete') && (
                                          <button
                                             onClick={() => {
                                                addToast(`Excluir conta "${acc.name}"?`, 'warning', 5000, {
                                                   label: 'EXCLUIR',
                                                   onClick: () => deleteAccount(acc.id)
                                                });
                                             }}
                                             className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-colors cursor-pointer"
                                             title="Excluir Conta"
                                          >
                                             <Trash2 size={16} />
                                          </button>
                                       )}
                                    </div>
                                 </div>

                                 {/* Middle row: Agency, Account Number & Bank Name */}
                                 <div className="bg-slate-50 dark:bg-gray-700/40 p-3.5 rounded-2xl border border-slate-100 dark:border-gray-600/50 space-y-2">
                                    <div className="flex justify-between items-center text-xs">
                                       <span className="text-slate-400 font-bold uppercase text-[10px]">Agência</span>
                                       <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                                          {acc.agency ? `${acc.agency}${acc.agencyDigit ? '-' + acc.agencyDigit : ''}` : 'Não informada'}
                                       </span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs border-t border-slate-100 dark:border-gray-600/30 pt-1.5">
                                       <span className="text-slate-400 font-bold uppercase text-[10px]">Nº Conta</span>
                                       <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                                          {acc.accountNumber ? `${acc.accountNumber}${acc.accountDigit ? '-' + acc.accountDigit : ''}` : 'Não informada'}
                                       </span>
                                    </div>

                                    {/* PIX Key integration pill */}
                                    {acc.pixKey ? (
                                       <div className="flex items-center justify-between border-t border-slate-100 dark:border-gray-600/30 pt-2 gap-2">
                                          <div className="flex items-center gap-1.5 overflow-hidden">
                                             <QrCode size={14} className="text-cyan-600 shrink-0" />
                                             <span className="text-[10px] font-bold text-slate-500 uppercase shrink-0">PIX ({acc.pixKeyType || 'Chave'}):</span>
                                             <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 truncate" title={acc.pixKey}>
                                                {acc.pixKey}
                                             </span>
                                          </div>
                                          <button
                                             onClick={() => handleCopyPix(acc.id, acc.pixKey)}
                                             className="px-2.5 py-1 bg-white dark:bg-gray-800 hover:bg-slate-100 dark:hover:bg-gray-700 text-slate-700 dark:text-slate-300 text-[10px] font-bold rounded-lg border border-slate-200 dark:border-gray-600 transition-colors flex items-center gap-1 shrink-0 cursor-pointer shadow-xs"
                                             title="Copiar chave PIX"
                                          >
                                             {copiedPixId === acc.id ? (
                                                <>
                                                   <Check size={12} className="text-emerald-500" />
                                                   <span className="text-emerald-600">Copiado!</span>
                                                </>
                                             ) : (
                                                <>
                                                   <Copy size={12} className="text-slate-400" />
                                                   <span>Copiar</span>
                                                </>
                                             )}
                                          </button>
                                       </div>
                                    ) : (
                                       <div className="flex items-center justify-between border-t border-slate-100 dark:border-gray-600/30 pt-1.5">
                                          <span className="text-[10px] text-slate-400 font-medium">Sem chave PIX cadastrada</span>
                                          <button
                                             onClick={() => openEditAccountModal(acc)}
                                             className="text-[10px] font-bold text-cyan-600 hover:text-cyan-500 cursor-pointer"
                                          >
                                             + Cadastrar PIX
                                          </button>
                                       </div>
                                    )}
                                 </div>

                                 {/* Bottom: Balances & Limits */}
                                 <div>
                                    <div className="flex justify-between items-baseline mb-1">
                                       <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Saldo Atual</span>
                                       {creditLimitNum > 0 && (
                                          <span className="text-[10px] text-slate-400 font-medium">
                                             Limite: <strong className="text-slate-700 dark:text-slate-300 font-mono">{formatMoney(creditLimitNum)}</strong>
                                          </span>
                                       )}
                                    </div>
                                    <div className="flex items-baseline justify-between">
                                       <p className={`text-2xl font-black font-mono ${acc.balance < 0 ? 'text-red-600' : 'text-slate-900 dark:text-white'}`}>
                                          {formatMoney(acc.balance)}
                                       </p>
                                       {creditLimitNum > 0 && (
                                          <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono" title="Saldo Atual + Limite Especial">
                                             Disp: {formatMoney(totalAvailable)}
                                          </p>
                                       )}
                                    </div>

                                    {acc.initialBalanceDate && (
                                       <p className="text-[10px] text-slate-400 font-medium mt-1">
                                          Saldo de abertura: {formatMoney(acc.initialBalance || 0)} em {acc.initialBalanceDate}
                                       </p>
                                    )}
                                 </div>

                                 {/* Footer Actions */}
                                 <div className="flex items-center gap-2 border-t border-slate-100 dark:border-gray-700 pt-3">
                                    <button
                                       onClick={() => {
                                          setSearchTerm(acc.name);
                                          setActiveTab('ledger');
                                       }}
                                       className="flex-1 py-2 px-3 bg-slate-50 dark:bg-gray-700/60 hover:bg-slate-100 dark:hover:bg-gray-700 text-cyan-600 dark:text-cyan-400 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                                    >
                                       Ver Extrato <ChevronRight size={14} />
                                    </button>
                                    <button
                                       onClick={() => {
                                          setSelectedTransaction(null);
                                          setFormData({
                                             type: 'Despesa',
                                             date: new Date().toLocaleDateString('pt-BR'),
                                             dueDate: new Date().toLocaleDateString('pt-BR'),
                                             status: 'Pendente',
                                             account: acc.name,
                                             accountId: acc.id,
                                             paymentMethod: acc.pixKey ? 'PIX' : 'Transferência',
                                             costCenter: 'Administrativo'
                                          });
                                          setIsModalOpen(true);
                                       }}
                                       className="py-2 px-3 bg-slate-100 dark:bg-gray-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1 cursor-pointer"
                                       title="Lançar transação nesta conta"
                                    >
                                       <Plus size={14} /> Lançar
                                    </button>
                                 </div>
                              </div>
                           </div>
                        );
                     })}
               </div>

               {accounts.length === 0 && (
                  <div className="bg-white dark:bg-gray-800 p-12 rounded-3xl text-center border border-slate-100 dark:border-gray-700">
                     <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-gray-700 text-slate-400 flex items-center justify-center mx-auto mb-4">
                        <Landmark size={32} />
                     </div>
                     <h4 className="text-base font-bold text-slate-800 dark:text-white mb-1">
                        Nenhuma conta bancária cadastrada
                     </h4>
                     <p className="text-xs text-slate-400 max-w-md mx-auto mb-5">
                        Cadastre suas contas correntes, poupanças, caixas internos e chaves PIX para gerenciar saldos e liquidações.
                     </p>
                     <button
                        onClick={openNewAccountModal}
                        className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-cyan-600/20 transition-all inline-flex items-center gap-2 cursor-pointer"
                     >
                        <Plus size={16} /> Cadastrar Primeira Conta
                     </button>
                  </div>
               )}
            </div>
         )}

         {/* ========================================================================= */}
         {/* TAB: PLANO DE CONTAS ESTRUTURADO - APRIMORADO */}
         {/* ========================================================================= */}
         {activeTab === 'planning' && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-slate-100 dark:border-gray-700 overflow-hidden animate-in fade-in duration-300 space-y-6 p-6">
               <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-gray-700 pb-6">
                  <div>
                     <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <FolderOpen className="text-cyan-600" /> Plano de Contas Estruturado
                     </h3>
                     <p className="text-xs text-slate-500 mt-1">
                        Hierarquia analítica e sintética para classificação de receitas, despesas e centros de custo.
                     </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                     <div className="relative">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                           type="text"
                           placeholder="Filtrar categorias..."
                           value={planSearchTerm}
                           onChange={e => setPlanSearchTerm(e.target.value)}
                           className="pl-9 pr-4 py-2 bg-slate-50 dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-xl text-xs font-bold w-48 focus:ring-2 focus:ring-cyan-500"
                        />
                     </div>

                     <select
                        value={planTypeFilter}
                        onChange={e => setPlanTypeFilter(e.target.value as any)}
                        className="py-2 px-3 bg-slate-50 dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300"
                     >
                        <option value="Todos">Tipo: Todos</option>
                        <option value="Receita">Apenas Receitas</option>
                        <option value="Despesa">Apenas Despesas</option>
                     </select>

                     <button
                        onClick={expandAllGroups}
                        className="px-3 py-2 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold rounded-xl hover:bg-slate-200 transition-colors"
                     >
                        Expandir Tudo
                     </button>
                     <button
                        onClick={collapseAllGroups}
                        className="px-3 py-2 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold rounded-xl hover:bg-slate-200 transition-colors"
                     >
                        Recolher Tudo
                     </button>

                     <button
                        onClick={handleExportPlanOfAccounts}
                        className="px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors"
                     >
                        <Download size={14} /> Exportar CSV
                     </button>

                     <button
                        onClick={() => openPlanModal()}
                        className="px-4 py-2 bg-cyan-600 text-white text-xs font-bold rounded-xl hover:bg-cyan-500 transition-colors flex items-center gap-2 shadow-md shadow-cyan-600/20"
                     >
                        <Plus size={14} /> Nova Categoria
                     </button>
                  </div>
               </div>

               {/* Plano de Contas Hierarchical View */}
               <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                     <thead className="bg-slate-50 dark:bg-gray-700/50 text-[10px] uppercase font-black text-slate-400">
                        <tr>
                           <th className="px-6 py-4 w-28">Código</th>
                           <th className="px-6 py-4">Nome da Conta Contábil</th>
                           <th className="px-6 py-4 text-center">Tipo</th>
                           <th className="px-6 py-4 text-center">Classificação</th>
                           <th className="px-6 py-4 text-center">Movimentações</th>
                           <th className="px-6 py-4 text-right">Volume Alocado</th>
                           <th className="px-6 py-4 text-right">Ações</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100 dark:divide-gray-700">
                        {planOfAccounts.filter(group => {
                           const matchesType = planTypeFilter === 'Todos' || group.type === planTypeFilter;
                           const matchesSearch = !planSearchTerm ||
                              group.name.toLowerCase().includes(planSearchTerm.toLowerCase()) ||
                              group.code.toLowerCase().includes(planSearchTerm.toLowerCase()) ||
                              group.children?.some((c: any) => c.name.toLowerCase().includes(planSearchTerm.toLowerCase()) || c.code.toLowerCase().includes(planSearchTerm.toLowerCase()));
                           return matchesType && matchesSearch;
                        }).map(group => {
                           const isExpanded = expandedGroups[group.id] !== false; // Default expanded
                           const groupTxs = transactions.filter(t => t.ledgerCode?.startsWith(group.code) || t.category === group.name);
                           const groupTotal = groupTxs.reduce((sum, t) => sum + t.amount, 0);

                           return (
                              <React.Fragment key={group.id}>
                                 {/* Synthetic Group Row */}
                                 <tr className="bg-slate-50/70 dark:bg-gray-800/80 hover:bg-slate-100 dark:hover:bg-gray-700 transition-colors group">
                                    <td className="px-6 py-3 font-mono font-black text-slate-900 dark:text-white">
                                       {group.code}
                                    </td>
                                    <td className="px-6 py-3 font-black text-slate-900 dark:text-white">
                                       <div className="flex items-center gap-2">
                                          <button
                                             onClick={() => toggleGroupExpand(group.id)}
                                             className="p-1 hover:bg-slate-200 dark:hover:bg-slate-600 rounded text-slate-500"
                                          >
                                             {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                          </button>
                                          <FolderOpen size={16} className={group.type === 'Receita' ? 'text-emerald-500' : 'text-rose-500'} />
                                          <span>{group.name}</span>
                                       </div>
                                    </td>
                                    <td className="px-6 py-3 text-center">
                                       <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${group.type === 'Receita' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                          {group.type}
                                       </span>
                                    </td>
                                    <td className="px-6 py-3 text-center">
                                       <span className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-200 text-[10px] font-black uppercase">
                                          SINTÉTICA (GRUPO)
                                       </span>
                                    </td>
                                    <td className="px-6 py-3 text-center font-bold text-slate-600 dark:text-slate-300 font-mono text-xs">
                                       {groupTxs.length} lançamento(s)
                                    </td>
                                    <td className="px-6 py-3 text-right font-black font-mono text-slate-900 dark:text-white">
                                       {formatMoney(groupTotal)}
                                    </td>
                                    <td className="px-6 py-3 text-right">
                                       <div className="flex justify-end gap-1 opacity-20 group-hover:opacity-100 transition-opacity">
                                          <button
                                             onClick={() => openPlanModal(null, group.id)}
                                             className="p-1.5 text-slate-400 hover:text-cyan-600 rounded"
                                             title="Nova Subconta"
                                          >
                                             <Plus size={16} />
                                          </button>
                                          <button
                                             onClick={() => openPlanModal(group, null)}
                                             className="p-1.5 text-slate-400 hover:text-cyan-600 rounded"
                                             title="Editar Grupo"
                                          >
                                             <Edit2 size={16} />
                                          </button>
                                          {hasPermission('finance.delete') && (
                                             <button
                                                onClick={() => {
                                                   addToast(`Excluir grupo "${group.name}" e todas suas subcategorias?`, 'warning', 5000, {
                                                      label: 'EXCLUIR',
                                                      onClick: () => deletePlanAccount(group.id, null)
                                                   });
                                                }}
                                                className="p-1.5 text-slate-400 hover:text-red-500 rounded"
                                                title="Excluir Grupo"
                                             >
                                                <Trash2 size={16} />
                                             </button>
                                          )}
                                       </div>
                                    </td>
                                 </tr>

                                 {/* Analytical Subaccounts Rows */}
                                 {isExpanded && group.children?.filter((child: any) => {
                                    if (!planSearchTerm) return true;
                                    return child.name.toLowerCase().includes(planSearchTerm.toLowerCase()) ||
                                       child.code.toLowerCase().includes(planSearchTerm.toLowerCase());
                                 }).map((child: any) => {
                                    const childTxs = transactions.filter(t => t.ledgerCode === child.code || t.category === child.name || t.ledgerName === child.name);
                                    const childTotal = childTxs.reduce((sum, t) => sum + t.amount, 0);

                                    return (
                                       <tr key={child.id} className="hover:bg-slate-50 dark:hover:bg-gray-700/50 transition-colors group">
                                          <td className="px-6 py-2.5 font-mono text-xs text-slate-400 pl-12 border-l-4 border-transparent hover:border-cyan-400">
                                             {child.code}
                                          </td>
                                          <td className="px-6 py-2.5 text-slate-700 dark:text-slate-300 font-semibold pl-12">
                                             {child.name}
                                          </td>
                                          <td className="px-6 py-2.5 text-center text-xs text-slate-400">
                                             {group.type}
                                          </td>
                                          <td className="px-6 py-2.5 text-center">
                                             <span className="px-2 py-0.5 rounded bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 text-slate-500 text-[10px] font-bold">
                                                ANALÍTICA
                                             </span>
                                          </td>
                                          <td className="px-6 py-2.5 text-center font-mono text-xs text-slate-500">
                                             {childTxs.length}
                                          </td>
                                          <td className="px-6 py-2.5 text-right font-bold font-mono text-slate-700 dark:text-slate-300">
                                             {formatMoney(childTotal)}
                                          </td>
                                          <td className="px-6 py-2.5 text-right">
                                             <div className="flex justify-end gap-1 opacity-10 group-hover:opacity-100 transition-opacity">
                                                <button
                                                   onClick={() => openPlanModal(child, group.id)}
                                                   className="p-1.5 text-slate-400 hover:text-cyan-600 rounded"
                                                   title="Editar Subcategoria"
                                                >
                                                   <Edit2 size={14} />
                                                </button>
                                                {hasPermission('finance.delete') && (
                                                   <button
                                                      onClick={() => {
                                                         addToast(`Excluir categoria "${child.name}"?`, 'warning', 5000, {
                                                            label: 'EXCLUIR',
                                                            onClick: () => deletePlanAccount(child.id, group.id)
                                                         });
                                                      }}
                                                      className="p-1.5 text-slate-400 hover:text-red-500 rounded"
                                                      title="Excluir Subcategoria"
                                                   >
                                                      <Trash2 size={14} />
                                                   </button>
                                                )}
                                             </div>
                                          </td>
                                       </tr>
                                    );
                                 })}
                              </React.Fragment>
                           );
                        })}
                     </tbody>
                  </table>
               </div>
            </div>
         )}

         {/* ========================================================================= */}
         {/* STANDARD TRANSACTION MODAL (NOVO / EDITAR LANÇAMENTO) */}
         {/* ========================================================================= */}
         {isModalOpen && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
               <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-md shadow-2xl border border-slate-100 dark:border-slate-700 animate-in fade-in zoom-in duration-300 overflow-hidden text-left max-h-[92vh] flex flex-col">
                  <div className="flex items-center justify-between p-6 border-b dark:border-gray-700 bg-slate-50/50 dark:bg-gray-700/50 shrink-0">
                     <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <CreditCard className="text-cyan-600" />
                        {selectedTransaction ? 'Editar Lançamento' : 'Novo Lançamento'}
                     </h3>
                     <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                        <X size={24} />
                     </button>
                  </div>

                  <form onSubmit={handleSaveTransaction} className="p-6 space-y-4 overflow-y-auto custom-scrollbar">
                     {/* Toggle Type */}
                     <div className="flex bg-slate-100 dark:bg-gray-700 p-1.5 rounded-xl">
                        <button
                           type="button"
                           onClick={() => setFormData({ ...formData, type: 'Receita' })}
                           className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${formData.type === 'Receita' ? 'bg-white dark:bg-gray-600 text-green-600 shadow-sm' : 'text-slate-500'}`}
                        >
                           <ArrowDown size={16} /> Receita
                        </button>
                        <button
                           type="button"
                           onClick={() => setFormData({ ...formData, type: 'Despesa' })}
                           className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${formData.type === 'Despesa' ? 'bg-white dark:bg-gray-600 text-red-600 shadow-sm' : 'text-slate-500'}`}
                        >
                           <ArrowUp size={16} /> Despesa
                        </button>
                     </div>

                     <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 ml-1">Descrição *</label>
                        <input
                           required
                           type="text"
                           className="w-full rounded-xl border border-slate-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white px-4 py-2.5 font-semibold text-sm"
                           placeholder="Ex: Fornecedor de Brita / Venda de Asfalto"
                           value={formData.description || ''}
                           onChange={e => setFormData({ ...formData, description: e.target.value })}
                        />
                     </div>

                     <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 ml-1">Beneficiário / Pagador</label>
                        <input
                           type="text"
                           className="w-full rounded-xl border border-slate-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white px-4 py-2.5 font-semibold text-sm"
                           placeholder="Nome do Cliente ou Fornecedor"
                           value={formData.partnerName || ''}
                           onChange={e => setFormData({ ...formData, partnerName: e.target.value })}
                        />
                     </div>

                     <div className="grid grid-cols-2 gap-4">
                        <div>
                           <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 ml-1">Valor (R$) *</label>
                           <input
                              required
                              type="number"
                              step="0.01"
                              className="w-full rounded-xl border border-slate-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white px-4 py-2.5 font-bold text-sm"
                              placeholder="0,00"
                              value={formData.amount || ''}
                              onChange={e => setFormData({ ...formData, amount: Number(e.target.value) })}
                           />
                        </div>
                        <div>
                           <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 ml-1">Nº Documento / NF</label>
                           <input
                              type="text"
                              className="w-full rounded-xl border border-slate-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white px-4 py-2.5 font-bold text-sm"
                              placeholder="NF-1234"
                              value={formData.documentNumber || ''}
                              onChange={e => setFormData({ ...formData, documentNumber: e.target.value })}
                           />
                        </div>
                     </div>

                     <div className="grid grid-cols-2 gap-4">
                        <div>
                           <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 ml-1">Data Vencimento *</label>
                           <input
                              type="text"
                              className="w-full rounded-xl border border-slate-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white px-4 py-2.5 font-bold text-center text-xs"
                              placeholder="DD/MM/AAAA"
                              value={formData.dueDate || formData.date || ''}
                              onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                           />
                        </div>
                        <div>
                           <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 ml-1">Data Emissão / Caixa</label>
                           <input
                              type="text"
                              className="w-full rounded-xl border border-slate-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white px-4 py-2.5 font-bold text-center text-xs"
                              placeholder="DD/MM/AAAA"
                              value={formData.date || ''}
                              onChange={e => setFormData({ ...formData, date: e.target.value })}
                           />
                        </div>
                     </div>

                     <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 ml-1">Categoria (Plano de Contas) *</label>
                        <select
                           required
                           className="w-full rounded-xl border border-slate-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white px-4 py-2.5 text-xs font-semibold"
                           value={formData.ledgerCode || ''}
                           onChange={e => setFormData({ ...formData, ledgerCode: e.target.value })}
                        >
                           <option value="">Selecione...</option>
                           {planOfAccounts.filter(g => g.type === formData.type).map(group => (
                              <optgroup key={group.id} label={group.name} className="font-bold">
                                 {group.children?.map((child: any) => (
                                    <option key={child.id} value={child.id}>{child.code} - {child.name}</option>
                                 ))}
                              </optgroup>
                           ))}
                        </select>
                     </div>

                     <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 ml-1">Conta Bancária *</label>
                        <select
                           className="w-full rounded-xl border border-slate-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white px-4 py-2.5 text-xs font-bold"
                           value={formData.account}
                           onChange={e => {
                              const acc = accounts.find(a => a.name === e.target.value);
                              setFormData({ ...formData, account: e.target.value, accountId: acc?.id });
                           }}
                        >
                           {accounts.map(acc => (
                              <option key={acc.id} value={acc.name}>
                                 {acc.name} ({formatMoney(acc.balance)})
                              </option>
                           ))}
                        </select>
                     </div>

                     <div className="grid grid-cols-2 gap-4">
                        <div>
                           <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 ml-1">Forma de Pagamento</label>
                           <select
                              className="w-full rounded-xl border border-slate-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white px-4 py-2 text-xs font-semibold"
                              value={formData.paymentMethod || 'Boleto'}
                              onChange={e => setFormData({ ...formData, paymentMethod: e.target.value })}
                           >
                              <option value="Boleto">Boleto</option>
                              <option value="PIX">PIX</option>
                              <option value="Transferência">TED / DOC</option>
                              <option value="Dinheiro">Dinheiro</option>
                              <option value="Cartão Crédito">Cartão de Crédito</option>
                              <option value="Cartão Débito">Cartão de Débito</option>
                           </select>
                        </div>
                        <div>
                           <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 ml-1">Centro de Custo</label>
                           <input
                              type="text"
                              className="w-full rounded-xl border border-slate-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white px-4 py-2 text-xs font-semibold"
                              placeholder="Ex: Usina 1"
                              value={formData.costCenter || ''}
                              onChange={e => setFormData({ ...formData, costCenter: e.target.value })}
                           />
                        </div>
                     </div>

                     <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 ml-1">Status do Lançamento</label>
                        <select
                           className="w-full rounded-xl border border-slate-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white px-4 py-2 text-xs font-bold"
                           value={formData.status}
                           onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                        >
                           <option value="Pendente">Pendente (Aberto)</option>
                           <option value="Conciliado">Conciliado (Liquidado)</option>
                           <option value="Vencido">Vencido</option>
                        </select>
                     </div>

                     <div className="pt-2 flex gap-3">
                        <button
                           type="button"
                           onClick={() => setIsModalOpen(false)}
                           className="flex-1 py-3 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold rounded-xl text-xs hover:bg-slate-200 transition-all"
                        >
                           Cancelar
                        </button>
                        <button
                           type="submit"
                           disabled={isSubmitting}
                           className="flex-[2] py-3 bg-cyan-600 text-white font-bold rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-cyan-600/30 hover:bg-cyan-500 transition-all flex items-center justify-center gap-2"
                        >
                           {isSubmitting ? <Loader className="animate-spin" size={16} /> : 'Salvar Lançamento'}
                        </button>
                     </div>
                  </form>
               </div>
            </div>
         )}

         {/* ========================================================================= */}
         {/* PLAN OF ACCOUNTS MODAL */}
         {/* ========================================================================= */}
         {isPlanModalOpen && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
               <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-md shadow-2xl border border-slate-100 dark:border-slate-700 p-6 animate-in fade-in zoom-in duration-300">
                  <div className="flex items-center justify-between pb-4 border-b dark:border-gray-700 mb-5">
                     <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <FolderOpen className="text-cyan-600" />
                        {editingPlan ? 'Editar Categoria Contábil' : 'Nova Categoria no Plano de Contas'}
                     </h3>
                     <button onClick={() => setIsPlanModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                        <X size={20} />
                     </button>
                  </div>

                  <form onSubmit={handleSavePlan} className="space-y-4">
                     <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 ml-1">Nome da Categoria *</label>
                        <input
                           required
                           type="text"
                           className="w-full rounded-xl border border-slate-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white px-4 py-2.5 font-semibold text-sm"
                           placeholder="Ex: Aquisição de Matéria-Prima"
                           value={planForm.name}
                           onChange={e => setPlanForm({ ...planForm, name: e.target.value })}
                        />
                     </div>

                     <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 ml-1">Grupo Sintético (Pai)</label>
                        <select
                           className="w-full rounded-xl border border-slate-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white px-4 py-2.5 text-xs font-semibold"
                           value={planForm.parentId}
                           onChange={e => setPlanForm({ ...planForm, parentId: e.target.value })}
                           disabled={!!editingPlan && planForm.parentId !== ''}
                        >
                           <option value="">(Nenhum - Criar Grupo Raiz / Sintético)</option>
                           {planOfAccounts.map(g => (
                              <option key={g.id} value={g.id}>{g.code} - {g.name} ({g.type})</option>
                           ))}
                        </select>
                     </div>

                     {planForm.parentId === '' && (
                        <div>
                           <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 ml-1">Tipo de Movimentação</label>
                           <div className="flex bg-slate-100 dark:bg-gray-700 p-1.5 rounded-xl">
                              <button
                                 type="button"
                                 onClick={() => setPlanForm({ ...planForm, type: 'Receita' })}
                                 className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${planForm.type === 'Receita' ? 'bg-white dark:bg-gray-600 text-green-600 shadow-sm' : 'text-slate-500'}`}
                              >
                                 <ArrowDown size={14} /> Receita
                              </button>
                              <button
                                 type="button"
                                 onClick={() => setPlanForm({ ...planForm, type: 'Despesa' })}
                                 className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${planForm.type === 'Despesa' ? 'bg-white dark:bg-gray-600 text-red-600 shadow-sm' : 'text-slate-500'}`}
                              >
                                 <ArrowUp size={14} /> Despesa
                              </button>
                           </div>
                        </div>
                     )}

                     <div className="flex gap-3 pt-3">
                        <button
                           type="button"
                           onClick={() => setIsPlanModalOpen(false)}
                           className="flex-1 py-3 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold rounded-xl text-xs hover:bg-slate-200 transition-all"
                        >
                           Cancelar
                        </button>
                        <button
                           type="submit"
                           className="flex-[2] py-3 bg-cyan-600 text-white font-bold rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-cyan-600/20 hover:bg-cyan-500 transition-all"
                        >
                           Salvar Categoria
                        </button>
                     </div>
                  </form>
               </div>
            </div>
         )}

         {/* ========================================================================= */}
         {/* BANK ACCOUNT MODAL (NOVA / EDITAR CONTA BANCÁRIA) */}
         {/* ========================================================================= */}
         {isAccountModalOpen && (
            <div className="fixed inset-0 bg-black/65 backdrop-blur-sm z-50 flex items-center justify-center p-4">
               <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-xl shadow-2xl border border-slate-100 dark:border-slate-700 animate-in fade-in zoom-in duration-300 max-h-[92vh] flex flex-col overflow-hidden text-left">
                  {/* Modal Header */}
                  <div className="flex items-center justify-between p-6 border-b dark:border-gray-700 bg-slate-50/50 dark:bg-gray-700/50 shrink-0">
                     <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-cyan-50 dark:bg-cyan-900/40 text-cyan-600 flex items-center justify-center">
                           <Landmark size={20} />
                        </div>
                        <div>
                           <h3 className="text-lg font-black text-gray-900 dark:text-white">
                              {accountForm.id ? 'Editar Conta Bancária' : 'Nova Conta Bancária / Caixa'}
                           </h3>
                           <p className="text-xs text-slate-400 font-medium">
                              Configure instituição FEBRABAN, agência/conta, chave PIX e limites operacionais.
                           </p>
                        </div>
                     </div>
                     <button
                        onClick={() => setIsAccountModalOpen(false)}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-2 rounded-lg cursor-pointer"
                     >
                        <X size={20} />
                     </button>
                  </div>

                  {/* Modal Body / Form */}
                  <form onSubmit={handleSaveAccount} className="p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1">
                     {/* 1. Seleção de Instituição Bancária Brasileira (FEBRABAN) */}
                     <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 ml-1">
                           Instituição Bancária (FEBRABAN)
                        </label>
                        <select
                           className="w-full rounded-xl border border-slate-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white px-4 py-2.5 text-xs font-bold focus:ring-2 focus:ring-cyan-500"
                           value={accountForm.bankCode || '999'}
                           onChange={e => {
                              const selectedCode = e.target.value;
                              const selectedBank = BRAZILIAN_BANKS.find(b => b.code === selectedCode);
                              if (selectedBank) {
                                 const isCustom = selectedCode === '999';
                                 const isCash = selectedCode === '000';
                                 const isDefaultPresetName = !accountForm.name || BRAZILIAN_BANKS.some(b => b.shortName === accountForm.name || b.name === accountForm.name);
                                 setAccountForm({
                                    ...accountForm,
                                    bankCode: isCustom ? '' : selectedBank.code,
                                    bankName: isCustom ? '' : selectedBank.name,
                                    name: isDefaultPresetName ? (isCustom ? '' : selectedBank.shortName) : accountForm.name,
                                    color: selectedBank.color,
                                    type: isCash ? 'Caixa Físico' : (accountForm.type === 'Caixa Físico' ? 'Conta Corrente' : accountForm.type)
                                 });
                              }
                           }}
                        >
                           {BRAZILIAN_BANKS.map(bank => (
                              <option key={bank.code} value={bank.code}>
                                 {bank.code !== '999' && bank.code !== '000' ? `${bank.code} - ${bank.name}` : bank.name}
                              </option>
                           ))}
                        </select>
                     </div>

                     {/* 2. Nome de Identificação no ERP */}
                     <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 ml-1">
                           Nome de Identificação da Conta no ERP *
                        </label>
                        <input
                           required
                           type="text"
                           className="w-full rounded-xl border border-slate-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white px-4 py-2.5 font-bold text-sm focus:ring-2 focus:ring-cyan-500"
                           placeholder="Ex: Itaú Unibanco - Matriz PJ"
                           value={accountForm.name}
                           onChange={e => setAccountForm({ ...accountForm, name: e.target.value })}
                        />
                     </div>

                     {/* 3. Tipo de Conta & Código COMPE */}
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                           <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 ml-1">
                              Tipo de Conta
                           </label>
                           <select
                              className="w-full rounded-xl border border-slate-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white px-4 py-2.5 text-xs font-bold focus:ring-2 focus:ring-cyan-500"
                              value={accountForm.type || 'Conta Corrente'}
                              onChange={e => setAccountForm({ ...accountForm, type: e.target.value })}
                           >
                              <option value="Conta Corrente">Conta Corrente</option>
                              <option value="Conta Poupança">Conta Poupança</option>
                              <option value="Conta Investimento">Conta Investimento / Aplicação</option>
                              <option value="Caixa Físico">Caixa Físico (Dinheiro em Espécie)</option>
                              <option value="Conta de Pagamento">Conta de Pagamento / Fintech</option>
                           </select>
                        </div>
                        <div>
                           <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 ml-1">
                              Código de Compensação (COMPE)
                           </label>
                           <input
                              type="text"
                              maxLength={4}
                              className="w-full rounded-xl border border-slate-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white px-4 py-2.5 font-mono text-xs font-bold focus:ring-2 focus:ring-cyan-500"
                              placeholder="Ex: 341"
                              value={accountForm.bankCode || ''}
                              onChange={e => setAccountForm({ ...accountForm, bankCode: e.target.value })}
                           />
                        </div>
                     </div>

                     {/* 4. Dados de Agência e Conta Corrente com Dígitos */}
                     <div className="grid grid-cols-4 gap-3">
                        <div className="col-span-3 sm:col-span-2">
                           <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 ml-1">
                              Agência
                           </label>
                           <input
                              type="text"
                              className="w-full rounded-xl border border-slate-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white px-4 py-2.5 font-semibold text-xs focus:ring-2 focus:ring-cyan-500"
                              placeholder="Ex: 0001"
                              value={accountForm.agency || ''}
                              onChange={e => setAccountForm({ ...accountForm, agency: e.target.value })}
                           />
                        </div>
                        <div className="col-span-1 sm:col-span-1">
                           <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 ml-1">
                              Dígito
                           </label>
                           <input
                              type="text"
                              maxLength={2}
                              className="w-full rounded-xl border border-slate-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white px-3 py-2.5 font-semibold text-xs text-center focus:ring-2 focus:ring-cyan-500 uppercase"
                              placeholder="X"
                              value={accountForm.agencyDigit || ''}
                              onChange={e => setAccountForm({ ...accountForm, agencyDigit: e.target.value })}
                           />
                        </div>
                        <div className="col-span-3 sm:col-span-2">
                           <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 ml-1">
                              Nº da Conta
                           </label>
                           <input
                              type="text"
                              className="w-full rounded-xl border border-slate-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white px-4 py-2.5 font-semibold text-xs focus:ring-2 focus:ring-cyan-500"
                              placeholder="Ex: 12345"
                              value={accountForm.accountNumber || ''}
                              onChange={e => setAccountForm({ ...accountForm, accountNumber: e.target.value })}
                           />
                        </div>
                        <div className="col-span-1 sm:col-span-1">
                           <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 ml-1">
                              Dígito
                           </label>
                           <input
                              type="text"
                              maxLength={2}
                              className="w-full rounded-xl border border-slate-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white px-3 py-2.5 font-semibold text-xs text-center focus:ring-2 focus:ring-cyan-500 uppercase"
                              placeholder="0"
                              value={accountForm.accountDigit || ''}
                              onChange={e => setAccountForm({ ...accountForm, accountDigit: e.target.value })}
                           />
                        </div>
                     </div>

                     {/* 5. Seção Chave PIX */}
                     <div className="bg-slate-50 dark:bg-gray-700/40 p-4 rounded-2xl border border-slate-100 dark:border-gray-600/50 space-y-3">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-white">
                           <QrCode size={16} className="text-cyan-600" />
                           <span>Chave PIX da Conta</span>
                           <span className="text-[10px] font-normal text-slate-400">(usada em cobranças e faturamentos)</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                           <div>
                              <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 ml-1">Tipo de Chave</label>
                              <select
                                 className="w-full rounded-xl border border-slate-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-cyan-500"
                                 value={accountForm.pixKeyType || 'CNPJ'}
                                 onChange={e => setAccountForm({ ...accountForm, pixKeyType: e.target.value })}
                              >
                                 <option value="CNPJ">CNPJ</option>
                                 <option value="CPF">CPF</option>
                                 <option value="E-mail">E-mail</option>
                                 <option value="Telefone">Celular / Telefone</option>
                                 <option value="Chave Aleatória">Chave Aleatória (EVP)</option>
                                 <option value="Nenhuma">Nenhuma / Não possui</option>
                              </select>
                           </div>
                           <div className="sm:col-span-2">
                              <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 ml-1">Chave PIX</label>
                              <input
                                 type="text"
                                 disabled={accountForm.pixKeyType === 'Nenhuma'}
                                 className="w-full rounded-xl border border-slate-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white px-4 py-2 font-mono text-xs font-semibold focus:ring-2 focus:ring-cyan-500 disabled:opacity-50"
                                 placeholder={getPixKeyPlaceholder(accountForm.pixKeyType || 'CNPJ')}
                                 value={accountForm.pixKey || ''}
                                 onChange={e => setAccountForm({ ...accountForm, pixKey: e.target.value })}
                              />
                           </div>
                        </div>
                     </div>

                     {/* 6. Parâmetros Financeiros: Saldo Inicial, Data de Corte & Limite Especial */}
                     <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                           <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 ml-1">
                              Saldo Inicial (R$) *
                           </label>
                           <input
                              required
                              type="number"
                              step="0.01"
                              className="w-full rounded-xl border border-slate-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white px-4 py-2.5 font-bold text-sm focus:ring-2 focus:ring-cyan-500"
                              placeholder="0,00"
                              value={accountForm.balance}
                              onChange={e => setAccountForm({ ...accountForm, balance: e.target.value })}
                           />
                        </div>
                        <div>
                           <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 ml-1">
                              Data de Abertura / Corte
                           </label>
                           <input
                              type="text"
                              className="w-full rounded-xl border border-slate-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white px-4 py-2.5 font-semibold text-xs focus:ring-2 focus:ring-cyan-500"
                              placeholder="DD/MM/AAAA"
                              value={accountForm.initialBalanceDate || ''}
                              onChange={e => setAccountForm({ ...accountForm, initialBalanceDate: e.target.value })}
                           />
                        </div>
                        <div>
                           <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 ml-1">
                              Limite Especial (R$)
                           </label>
                           <input
                              type="number"
                              step="0.01"
                              className="w-full rounded-xl border border-slate-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white px-4 py-2.5 font-bold text-sm focus:ring-2 focus:ring-cyan-500"
                              placeholder="0,00"
                              value={accountForm.creditLimit || ''}
                              onChange={e => setAccountForm({ ...accountForm, creditLimit: e.target.value })}
                           />
                        </div>
                     </div>

                     {/* 7. Conta Padrão do ERP */}
                     <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-300 dark:border-amber-900/50 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                           <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                              <Star size={18} className={accountForm.isDefault ? 'fill-amber-500' : ''} />
                           </div>
                           <div>
                              <p className="text-xs font-black text-slate-800 dark:text-white">Definir como Conta Padrão do ERP</p>
                              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                                 Pré-selecionada nas baixas de Contas a Receber, Contas a Pagar e novos lançamentos.
                              </p>
                           </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer shrink-0">
                           <input
                              type="checkbox"
                              checked={Boolean(accountForm.isDefault)}
                              onChange={e => setAccountForm({ ...accountForm, isDefault: e.target.checked })}
                              className="sr-only peer"
                           />
                           <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                        </label>
                     </div>

                     {/* 8. Cor do Card */}
                     <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 ml-1">Cor do Card</label>
                        <div className="flex gap-2 flex-wrap pt-1">
                           {ACCOUNT_COLORS.map(({ color, label }) => (
                              <button
                                 type="button"
                                 key={color}
                                 onClick={() => setAccountForm({ ...accountForm, color })}
                                 className={`w-8 h-8 rounded-full ${color} transition-all cursor-pointer ${
                                    accountForm.color === color ? 'ring-4 ring-offset-2 ring-cyan-500 scale-110' : 'opacity-70 hover:opacity-100'
                                 }`}
                                 title={label}
                              />
                           ))}
                        </div>
                     </div>

                     {/* 9. Observações Internas */}
                     <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 ml-1">Observações Internas (Opcional)</label>
                        <input
                           type="text"
                           className="w-full rounded-xl border border-slate-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white px-4 py-2 font-semibold text-xs focus:ring-2 focus:ring-cyan-500"
                           placeholder="Ex: Gerente de conta: Marcos (11) 98765-4321, finalidade operacional, etc."
                           value={accountForm.notes || ''}
                           onChange={e => setAccountForm({ ...accountForm, notes: e.target.value })}
                        />
                     </div>

                     {/* Action Buttons */}
                     <div className="flex gap-3 pt-3 border-t border-slate-100 dark:border-gray-700">
                        <button
                           type="button"
                           onClick={() => setIsAccountModalOpen(false)}
                           className="flex-1 py-3 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold rounded-xl text-xs hover:bg-slate-200 transition-all cursor-pointer"
                        >
                           Cancelar
                        </button>
                        <button
                           type="submit"
                           className="flex-[2] py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-cyan-600/20 transition-all cursor-pointer flex items-center justify-center gap-2"
                        >
                           {accountForm.id ? 'Salvar Alterações' : 'Cadastrar Conta Bancária'}
                        </button>
                     </div>
                  </form>
               </div>
            </div>
         )}

      </div>
   );
};

export default Finance;
