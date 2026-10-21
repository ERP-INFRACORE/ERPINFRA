import React, { useState, useMemo } from 'react';
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
   Info
} from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { BarChart, Bar, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, AreaChart, Area, Legend } from 'recharts';
import { useApp } from '../context/AppContext';
import { Transaction } from '../types';
import { printDocument } from '../utils/exportUtils';

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

const Finance = () => {
   const {
      transactions, financials, addTransaction, deleteTransaction, importTransactions, updateTransactionStatus, updateTransaction,
      accounts, addAccount, deleteAccount,
      planOfAccounts, addPlanAccount, deletePlanAccount, updatePlanAccount, hasPermission, currentUser, settings
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

   // Account Form State
   const [accountForm, setAccountForm] = useState<any>({
      id: '', name: '', type: 'Conta Corrente', balance: 0, color: 'bg-blue-600', code: ''
   });

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
   // VALIDAÇÕES RIGOROSAS DE BAIXA FINANCEIRA (LIQUIDAÇÃO)
   // =========================================================================
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

      // Default account: first account or matching account
      const firstAccId = txs[0]?.accountId || accounts[0]?.id || '';

      setSettlementTargetTxs(txs);
      setSettlementForm({
         date: new Date().toLocaleDateString('pt-BR'),
         accountId: firstAccId,
         paymentMethod: txs[0]?.paymentMethod || 'PIX',
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
      const count = settlementTargetTxs.length;

      try {
         settlementTargetTxs.forEach((tx, index) => {
            // If single transaction, adjust amount if interest or discount was added
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
   // ESTORNO DE BAIXA (REVERSÃO PARA PENDENTE)
   // =========================================================================
   const openReversalModal = (tx: Transaction) => {
      setReversalTargetTx(tx);
      setReversalReason('');
      setIsReversalModalOpen(true);
   };

   const handleConfirmReversal = (e: React.FormEvent) => {
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
      addToast(`Baixa estornada com sucesso! O título #${reversalTargetTx.id?.slice(-6).toUpperCase()} retornou ao status Pendente.`, 'info');
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
                        account: accounts[0]?.name || 'Bradesco PJ',
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

               <div className="flex items-center gap-2">
                  <button
                     onClick={() => setSelectedTxIds([])}
                     className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-all"
                  >
                     Desmarcar Todos
                  </button>
                  <button
                     onClick={() => {
                        const targetTxs = transactions.filter(t => selectedTxIds.includes(t.id));
                        openSettlementModal(targetTxs);
                     }}
                     className="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-cyan-500/20 flex items-center gap-2 transition-all"
                  >
                     <CheckCircle size={16} /> Efetuar Baixa / Liquidação em Lote
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

                     {/* Import OFX/CSV */}
                     <label className="p-2.5 text-slate-500 hover:text-cyan-600 bg-slate-50 hover:bg-slate-100 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-xl cursor-pointer transition-colors" title="Importar Extrato OFX/CSV">
                        <Upload size={16} />
                        <input type="file" className="hidden" onChange={handleImport} accept=".csv,.ofx,.xlsx" />
                     </label>

                     {/* Export CSV */}
                     <button
                        onClick={() => {
                           const list = activeTab === 'ledger' ? filteredTransactions : activeTab === 'receivables' ? receivables : payables;
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

               {/* Table */}
               <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                     <thead className="text-[10px] uppercase text-slate-400 bg-slate-50 dark:bg-gray-700/50 font-black tracking-wider">
                        <tr>
                           <th className="px-4 py-4 text-center w-12">
                              <input
                                 type="checkbox"
                                 checked={selectedTxIds.length > 0 && selectedTxIds.length === (activeTab === 'ledger' ? filteredTransactions : activeTab === 'receivables' ? receivables : payables).length}
                                 onChange={() => handleToggleSelectAll(activeTab === 'ledger' ? filteredTransactions : activeTab === 'receivables' ? receivables : payables)}
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
                        {(activeTab === 'ledger' ? filteredTransactions : activeTab === 'receivables' ? receivables : payables).map(tx => {
                           const isSelected = selectedTxIds.includes(tx.id);
                           const isSettled = tx.status === 'Conciliado';

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
                                          {tx.partnerName && (
                                             <p className="text-[10px] text-slate-400 font-semibold">{tx.partnerName}</p>
                                          )}
                                          {tx.documentNumber && (
                                             <span className="text-[10px] text-cyan-600 font-mono font-bold">Doc: {tx.documentNumber}</span>
                                          )}
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
               <div className="flex justify-between items-center bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-gray-700">
                  <div>
                     <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Landmark className="text-cyan-600" /> Contas Bancárias & Caixa
                     </h3>
                     <p className="text-xs text-slate-500 mt-1">Gerencie as contas bancárias, chaves PIX e saldos operacionais.</p>
                  </div>
                  <button
                     onClick={() => {
                        setAccountForm({ id: '', name: '', type: 'Conta Corrente', balance: 0, color: 'bg-blue-600', code: '' });
                        setIsAccountModalOpen(true);
                     }}
                     className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-2"
                  >
                     <Plus size={14} /> Nova Conta Bancária
                  </button>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {accounts.map(acc => (
                     <div key={acc.id} className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-gray-700 relative overflow-hidden group">
                        <div className={`absolute top-0 right-0 w-24 h-24 rounded-full ${acc.color} opacity-10 blur-2xl -mr-10 -mt-10`}></div>
                        <div className="relative">
                           <div className="flex justify-between items-start mb-6">
                              <div className={`w-12 h-12 rounded-xl ${acc.color} text-white flex items-center justify-center shadow-lg shadow-cyan-900/10`}>
                                 <Landmark size={24} />
                              </div>
                              <div className="flex gap-1">
                                 {hasPermission('finance.delete') && (
                                    <button
                                       onClick={() => {
                                          addToast(`Excluir conta "${acc.name}"?`, 'warning', 5000, {
                                             label: 'EXCLUIR',
                                             onClick: () => deleteAccount(acc.id)
                                          });
                                       }}
                                       className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                                    >
                                       <Trash2 size={16} />
                                    </button>
                                 )}
                              </div>
                           </div>
                           <h4 className="text-xl font-black text-slate-900 dark:text-white mb-1">{acc.name}</h4>
                           <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{acc.type}</p>
                           {acc.agency && (
                              <p className="text-[11px] text-slate-500 font-mono mb-4">Agência: {acc.agency} | Conta: {acc.accountNumber || '-'}</p>
                           )}
                           <div className="flex items-end justify-between border-t border-slate-100 dark:border-gray-700 pt-4">
                              <div>
                                 <p className="text-[10px] text-slate-400 font-bold uppercase mb-0.5">Saldo Atual</p>
                                 <p className={`text-lg font-black font-mono ${acc.balance < 0 ? 'text-red-600' : 'text-slate-800 dark:text-white'}`}>
                                    {formatMoney(acc.balance)}
                                 </p>
                              </div>
                              <button
                                 onClick={() => {
                                    setSearchTerm(acc.name);
                                    setActiveTab('ledger');
                                 }}
                                 className="text-xs font-bold text-cyan-600 hover:text-cyan-700 flex items-center gap-1"
                              >
                                 Ver Extrato <ChevronRight size={14} />
                              </button>
                           </div>
                        </div>
                     </div>
                  ))}
               </div>
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
         {/* BANK ACCOUNT MODAL */}
         {/* ========================================================================= */}
         {isAccountModalOpen && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
               <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-lg shadow-2xl border border-slate-100 dark:border-slate-700 p-6 animate-in fade-in zoom-in duration-300 max-h-[90vh] overflow-y-auto custom-scrollbar">
                  <div className="flex items-center justify-between pb-4 border-b dark:border-gray-700 mb-5">
                     <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Landmark className="text-cyan-600" /> Nova Conta Bancária / Caixa
                     </h3>
                     <button onClick={() => setIsAccountModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                        <X size={20} />
                     </button>
                  </div>

                  <form onSubmit={(e) => {
                     e.preventDefault();
                     addAccount({ ...accountForm, id: Date.now().toString(), balance: Number(accountForm.balance || 0) });
                     addToast("Conta bancária criada com sucesso!", 'success');
                     setIsAccountModalOpen(false);
                  }} className="space-y-4">
                     <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 ml-1">Instituição / Banco *</label>
                        <input
                           required
                           type="text"
                           className="w-full rounded-xl border border-slate-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white px-4 py-2.5 font-bold text-sm"
                           placeholder="Ex: Banco Santander S.A."
                           value={accountForm.name}
                           onChange={e => setAccountForm({ ...accountForm, name: e.target.value })}
                        />
                     </div>

                     <div className="grid grid-cols-2 gap-4">
                        <div>
                           <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 ml-1">Tipo de Conta</label>
                           <select
                              className="w-full rounded-xl border border-slate-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white px-4 py-2.5 text-xs font-bold"
                              value={accountForm.type || 'Conta Corrente'}
                              onChange={e => setAccountForm({ ...accountForm, type: e.target.value })}
                           >
                              <option value="Conta Corrente">Conta Corrente</option>
                              <option value="Conta Poupança">Conta Poupança</option>
                              <option value="Conta Investimento">Conta Investimento</option>
                              <option value="Caixa Físico">Caixa Físico (Dinheiro)</option>
                           </select>
                        </div>

                        <div>
                           <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 ml-1">Saldo Inicial (R$) *</label>
                           <input
                              required
                              type="number"
                              step="0.01"
                              className="w-full rounded-xl border border-slate-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white px-4 py-2.5 font-bold text-sm"
                              placeholder="0,00"
                              value={accountForm.balance}
                              onChange={e => setAccountForm({ ...accountForm, balance: e.target.value })}
                           />
                        </div>
                     </div>

                     <div className="grid grid-cols-2 gap-4">
                        <div>
                           <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 ml-1">Agência</label>
                           <input
                              type="text"
                              className="w-full rounded-xl border border-slate-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white px-4 py-2.5 font-semibold text-xs"
                              placeholder="0001-X"
                              value={accountForm.agency || ''}
                              onChange={e => setAccountForm({ ...accountForm, agency: e.target.value })}
                           />
                        </div>
                        <div>
                           <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 ml-1">Nº Conta</label>
                           <input
                              type="text"
                              className="w-full rounded-xl border border-slate-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white px-4 py-2.5 font-semibold text-xs"
                              placeholder="12345-6"
                              value={accountForm.accountNumber || ''}
                              onChange={e => setAccountForm({ ...accountForm, accountNumber: e.target.value })}
                           />
                        </div>
                     </div>

                     <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 ml-1">Cor do Card</label>
                        <div className="flex gap-2 flex-wrap pt-1">
                           {[
                              { color: 'bg-blue-600', label: 'Azul' },
                              { color: 'bg-emerald-600', label: 'Verde' },
                              { color: 'bg-orange-600', label: 'Laranja' },
                              { color: 'bg-purple-600', label: 'Roxo' },
                              { color: 'bg-cyan-600', label: 'Ciano' },
                              { color: 'bg-slate-900', label: 'Escuro' }
                           ].map(({ color, label }) => (
                              <button
                                 type="button"
                                 key={color}
                                 onClick={() => setAccountForm({ ...accountForm, color })}
                                 className={`w-8 h-8 rounded-full ${color} transition-all ${accountForm.color === color ? 'ring-4 ring-offset-2 ring-cyan-500 scale-110' : 'opacity-70 hover:opacity-100'}`}
                                 title={label}
                              />
                           ))}
                        </div>
                     </div>

                     <div className="flex gap-3 pt-4">
                        <button
                           type="button"
                           onClick={() => setIsAccountModalOpen(false)}
                           className="flex-1 py-3 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold rounded-xl text-xs hover:bg-slate-200 transition-all"
                        >
                           Cancelar
                        </button>
                        <button
                           type="submit"
                           className="flex-[2] py-3 bg-cyan-600 text-white font-bold rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-cyan-600/20 hover:bg-cyan-500 transition-all"
                        >
                           Criar Conta
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
