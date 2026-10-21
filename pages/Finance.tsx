import React, { useState } from 'react';
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
   Printer,
   Loader
} from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { BarChart, Bar, ResponsiveContainer, Tooltip, XAxis, CartesianGrid, AreaChart, Area } from 'recharts';
import { useApp } from '../context/AppContext';
import { Transaction } from '../types';

const Finance = () => {
   const {
      transactions, financials, addTransaction, deleteTransaction, importTransactions, updateTransactionStatus, updateTransaction,
      accounts, addAccount, deleteAccount,
      planOfAccounts, addPlanAccount, deletePlanAccount, updatePlanAccount, hasPermission, currentUser
   } = useApp();
   const { addToast } = useToast();

   const [activeTab, setActiveTab] = useState<'overview' | 'ledger' | 'receivables' | 'payables' | 'accounts' | 'planning'>('overview');
   const [isModalOpen, setIsModalOpen] = useState(false);
   const [isSubmitting, setIsSubmitting] = useState(false);
   const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
   const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);

   const [formData, setFormData] = useState<Partial<Transaction>>({
      type: 'Despesa',
      date: new Date().toLocaleDateString('pt-BR'),
      status: 'Pendente',
      account: 'Bradesco PJ'
   });

   const [accountForm, setAccountForm] = useState<any>({
      id: '', name: '', type: 'Conta Corrente', balance: 0, color: 'bg-blue-600', code: ''
   });

   // Filters
   const [searchTerm, setSearchTerm] = useState('');
   const [categoryFilter, setCategoryFilter] = useState('Todas');

   // Plan of Accounts State
   const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
   const [editingPlan, setEditingPlan] = useState<{ id: string, name: string, parentId: string | null, type?: 'Receita' | 'Despesa' } | null>(null);
   const [planForm, setPlanForm] = useState<{ name: string, parentId: string, type: 'Receita' | 'Despesa' }>({
      name: '', parentId: '', type: 'Despesa'
   });

   const handleSavePlan = (e: React.FormEvent) => {
      e.preventDefault();
      if (!planForm.name) return;

      if (editingPlan) {
         updatePlanAccount(editingPlan.id, planForm.name, planForm.parentId || null);
      } else {
         // If parentId is empty string, treat as null (Top Level)
         const distinctParentId = planForm.parentId === '' ? null : planForm.parentId;
         addPlanAccount(distinctParentId, planForm.name, planForm.type);
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

   const formatMoney = (value: number) => {
      return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
   };

   // Filtering Logic
   const filteredTransactions = transactions.filter(tx => {
      const matchesSearch = tx.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
         tx.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
         (tx.account && tx.account.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCategory = categoryFilter === 'Todas' || tx.type === categoryFilter;
      return matchesSearch && matchesCategory;
   });

   const receivables = transactions.filter(tx => tx.type === 'Receita' && tx.status !== 'Conciliado');
   const payables = transactions.filter(tx => tx.type === 'Despesa' && tx.status !== 'Conciliado');

   // Chart Data Calculation
   const chartData = React.useMemo(() => {
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
            const [d, m, y] = t.date.split('/').map(Number);
            return m - 1 === period.month && y === period.year;
         });

         const income = periodTrans.filter(t => t.type === 'Receita').reduce((sum, t) => sum + t.amount, 0);
         const expense = periodTrans.filter(t => t.type === 'Despesa').reduce((sum, t) => sum + t.amount, 0);

         return {
            name: period.name,
            income,
            expense
         };
      });
   }, [transactions]);


   // Handlers
   const handleSaveTransaction = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!formData.description || !formData.amount) return;

      setIsSubmitting(true);

      const selectedAccount = planOfAccounts.flatMap(g => g.children || []).find(c => c.id === formData.ledgerCode) ||
         planOfAccounts.find(g => g.id === formData.ledgerCode);

      const newTx: Transaction = {
         ...formData,
         id: selectedTransaction ? selectedTransaction.id : Date.now().toString(),
         date: formData.date || new Date().toLocaleDateString('pt-BR'),
         description: formData.description || '',
         amount: Number(formData.amount),
         category: selectedAccount?.name || 'Outros',
         account: formData.account || 'Bradesco PJ',
         accountId: accounts.find(a => a.name === formData.account)?.id || '',
         status: formData.status || 'Pendente',
         type: formData.type || 'Despesa',
         ledgerCode: selectedAccount?.code || '',
         ledgerName: selectedAccount?.name || ''
      } as Transaction;

      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 800));

      if (selectedTransaction) {
         updateTransaction(newTx);
         addToast("Transação atualizada com sucesso!", 'success');
      } else {
         // Balance Validation Logic
         if (newTx.type === 'Despesa' && newTx.status === 'Conciliado') {
            const txAccount = accounts.find(a => a.id === newTx.accountId);
            if (txAccount) {
               const currentBalance = txAccount.balance;
               const limit = 0; // Assuming 0 for now as Account interface usually lacks explicit overdraft limit
               if (currentBalance - newTx.amount < -limit) {
                  if (currentUser?.username === 'admin') {
                     addToast(`⚠️ ALERTA DE SALDO:
 A conta "${txAccount.name}" ficará com saldo negativo (Saldo Atual: ${formatMoney(currentBalance)} - Valor: ${formatMoney(newTx.amount)} = ${formatMoney(currentBalance - newTx.amount)}).
 Deseja autorizar esta operação?`, 'warning', 10000, {
                        label: 'AUTORIZAR',
                        onClick: () => {
                           addTransaction(newTx);
                           setIsModalOpen(false);
                        }
                     });
                     setIsSubmitting(false);
                     return;
                  } else {
                     addToast(`🚫 OPERAÇÃO BLOQUEADA: Saldo insuficiente na conta "${txAccount.name}".`, 'error');
                     setIsSubmitting(false);
                     return;
                  }
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
            const newTransactions: Transaction[] = [];

            // Detect format or assume standard: Date;Description;Value;Type;Category
            // Skipping header if present
            const startIndex = lines[0].toLowerCase().includes('data') ? 1 : 0;

            for (let i = startIndex; i < lines.length; i++) {
               const line = lines[i].trim();
               if (!line) continue;

               // Support common separators
               const cols = line.split(/[;,]/).map(c => c.trim().replace(/^"|"$/g, ''));

               if (cols.length >= 3) {
                  const date = cols[0];
                  const description = cols[1];
                  // Handle value formats like "1.000,00" or "1000.00"
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
                     // Try to infer from signed value if present
                     if (cols[2].includes('-')) type = 'Despesa';
                     else type = 'Receita';
                  }

                  const category = cols[4] || 'Importado';

                  if (description && !isNaN(amount)) {
                     newTransactions.push({
                        id: `IMP-${Date.now()}-${i}`,
                        date: date,
                        description: description,
                        amount: amount,
                        type: type,
                        category: category,
                        status: 'Conciliado', // Imports are usually realized
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
               // Batch add would be better, but loop is fine for now
               newTransactions.forEach(tx => addTransaction(tx));
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
      e.target.value = ''; // Reset input
   };

   // UI Components
   const NavButton = ({ id, label, icon: Icon, colorClass = "text-slate-500" }: any) => (
      <button
         onClick={() => setActiveTab(id)}
         className={`
            px-4 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2.5 whitespace-nowrap
            ${activeTab === id
               ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/10 dark:bg-white dark:text-slate-900'
               : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:hover:bg-slate-800 dark:text-slate-400'
            }
         `}
      >
         <Icon size={18} className={activeTab === id ? 'text-cyan-400' : colorClass} />
         {label}
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

   return (
      <div className="flex flex-col gap-6 animate-in fade-in duration-500">

         {/* Top Header & Navigation */}
         <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-white dark:bg-gray-800 p-2 rounded-2xl shadow-sm border border-slate-100 dark:border-gray-700">
            <div className="flex overflow-x-auto p-1 gap-1 no-scrollbar items-center">
               <NavButton id="overview" label="Dashboard" icon={PieChart} />
               <div className="w-px bg-slate-200 dark:bg-gray-700 mx-1 h-6 hidden md:block"></div>
               <NavButton id="ledger" label="Livro Caixa" icon={List} />
               <NavButton id="receivables" label="A Receber" icon={ArrowDown} colorClass="text-green-500" />
               <NavButton id="payables" label="A Pagar" icon={ArrowUp} colorClass="text-red-500" />
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
                        status: 'Pendente',
                        account: 'Bradesco PJ',
                        paymentMethod: 'Boleto',
                        costCenter: 'Administrativo'
                     });
                     setIsModalOpen(true);
                  }}
                  className="mx-2 xl:mx-0 px-6 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-cyan-600/20 transition-all flex items-center justify-center gap-2 whitespace-nowrap shrink-0"
               >
                  <Plus size={18} /> Novo Lançamento (Admin)
               </button>
            )}
         </div>

         {/* Transactions Modal */}
         {isModalOpen && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
               <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md shadow-2xl border border-slate-100 dark:border-slate-700 animate-in fade-in zoom-in duration-300 overflow-hidden text-left">
                  <div className="flex items-center justify-between p-6 border-b dark:border-gray-700 bg-slate-50/50 dark:bg-gray-700/50">
                     <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <CreditCard className="text-cyan-600" />
                        {selectedTransaction ? 'Editar Lançamento' : 'Novo Lançamento'}
                     </h3>
                     <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                        <X size={24} />
                     </button>
                  </div>

                  <form onSubmit={handleSaveTransaction} className="p-6 space-y-5">
                     {/* Toggle Type */}
                     <div className="flex bg-slate-100 dark:bg-gray-700 p-1.5 rounded-xl">
                        <button
                           type="button"
                           onClick={() => setFormData({ ...formData, type: 'Receita' })}
                           className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${formData.type === 'Receita' ? 'bg-white dark:bg-gray-600 text-green-600 shadow-sm border border-slate-100 dark:border-gray-500' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                           <ArrowDown size={16} /> Receita
                        </button>
                        <button
                           type="button"
                           onClick={() => setFormData({ ...formData, type: 'Despesa' })}
                           className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${formData.type === 'Despesa' ? 'bg-white dark:bg-gray-600 text-red-600 shadow-sm border border-slate-100 dark:border-gray-500' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                           <ArrowUp size={16} /> Despesa
                        </button>
                     </div>

                     <div className="space-y-4">
                        <div>
                           <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 ml-1">Descrição</label>
                           <input
                              required
                              type="text"
                              className="w-full rounded-xl border border-slate-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white px-4 py-3 font-semibold focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                              placeholder="Ex: Pagamento Fornecedor X"
                              value={formData.description || ''}
                              onChange={e => setFormData({ ...formData, description: e.target.value })}
                           />
                        </div>

                        <div>
                           <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 ml-1">Beneficiário / Pagador</label>
                           <input
                              type="text"
                              className="w-full rounded-xl border border-slate-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white px-4 py-3 font-semibold focus:ring-2 focus:ring-cyan-500"
                              placeholder="Nome do Cliente ou Fornecedor"
                              value={formData.partnerName || ''}
                              onChange={e => setFormData({ ...formData, partnerName: e.target.value })}
                           />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                           <div>
                              <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 ml-1">Valor (R$)</label>
                              <div className="relative">
                                 <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">R$</span>
                                 <input
                                    required
                                    type="number"
                                    step="0.01"
                                    className="w-full rounded-xl border border-slate-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white pl-10 pr-4 py-3 font-bold"
                                    placeholder="0,00"
                                    value={formData.amount || ''}
                                    onChange={e => setFormData({ ...formData, amount: Number(e.target.value) })}
                                 />
                              </div>
                           </div>
                           <div>
                              <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 ml-1">Nº Documento</label>
                              <input
                                 type="text"
                                 className="w-full rounded-xl border border-slate-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white px-4 py-3 font-bold"
                                 placeholder="NF-1234"
                                 value={formData.documentNumber || ''}
                                 onChange={e => setFormData({ ...formData, documentNumber: e.target.value })}
                              />
                           </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                           <div>
                              <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 ml-1">Data Pagamento/Recebimento</label>
                              <input
                                 type="text" // Using text to allow DD/MM/YYYY format or date picker if implemented differently
                                 className="w-full rounded-xl border border-slate-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white px-4 py-3 font-bold text-center"
                                 placeholder="DD/MM/AAAA"
                                 value={formData.date || ''}
                                 onChange={e => setFormData({ ...formData, date: e.target.value })}
                              />
                           </div>
                           <div>
                              <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 ml-1">Data Competência</label>
                              <input
                                 type="text"
                                 className="w-full rounded-xl border border-slate-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white px-4 py-3 font-bold text-center"
                                 placeholder="DD/MM/AAAA"
                                 value={formData.competenceDate || ''}
                                 onChange={e => setFormData({ ...formData, competenceDate: e.target.value })}
                              />
                           </div>
                        </div>

                        <div>
                           <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 ml-1">Categoria (Plano de Contas)</label>
                           <select
                              required
                              className="w-full rounded-xl border border-slate-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white px-4 py-3 text-sm font-semibold"
                              value={formData.ledgerCode || ''}
                              onChange={e => setFormData({ ...formData, ledgerCode: e.target.value })}
                           >
                              <option value="">Selecione...</option>
                              {planOfAccounts.filter(g => g.type === formData.type).map(group => (
                                 <optgroup key={group.id} label={group.name} className="font-bold">
                                    {group.children?.map(child => (
                                       <option key={child.id} value={child.id}>{child.code} - {child.name}</option>
                                    ))}
                                 </optgroup>
                              ))}
                           </select>
                        </div>

                        <div>
                           <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 ml-1">Conta Financeira</label>
                           <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
                              {accounts.map(acc => (
                                 <button
                                    type="button"
                                    key={acc.id}
                                    onClick={() => setFormData({ ...formData, account: acc.name, accountId: acc.id })}
                                    className={`p-2 rounded-lg border text-xs font-bold text-left transition-all ${formData.account === acc.name ? 'border-cyan-500 bg-cyan-50 text-cyan-700 dark:text-cyan-300 dark:bg-cyan-900/30' : 'border-slate-200 dark:border-gray-600 text-slate-500 hover:border-cyan-300'}`}
                                 >
                                    <span className="block truncate">{acc.name}</span>
                                 </button>
                              ))}
                           </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                           <div>
                              <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 ml-1">Forma de Pagamento</label>
                              <select
                                 className="w-full rounded-xl border border-slate-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white px-4 py-3 text-sm font-semibold"
                                 value={formData.paymentMethod || 'Boleto'}
                                 onChange={e => setFormData({ ...formData, paymentMethod: e.target.value })}
                              >
                                 <option value="Dinheiro">Dinheiro (Espécie)</option>
                                 <option value="Boleto">Boleto Bancário</option>
                                 <option value="PIX">PIX</option>
                                 <option value="Cartão Crédito">Cartão de Crédito</option>
                                 <option value="Cartão Débito">Cartão de Débito</option>
                                 <option value="Transferência">TED / DOC</option>
                                 <option value="Cheque">Cheque</option>
                              </select>
                           </div>
                           <div>
                              <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 ml-1">Centro de Custo</label>
                              <input
                                 type="text"
                                 className="w-full rounded-xl border border-slate-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white px-4 py-3 font-semibold"
                                 placeholder="Ex: Administrativo"
                                 value={formData.costCenter || ''}
                                 onChange={e => setFormData({ ...formData, costCenter: e.target.value })}
                              />
                           </div>
                        </div>

                        <div>
                           <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 ml-1">Observações</label>
                           <textarea
                              className="w-full rounded-xl border border-slate-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white px-4 py-3 text-sm font-medium resize-none h-20"
                              placeholder="Detalhes adicionais sobre a transação..."
                              value={formData.notes || ''}
                              onChange={e => setFormData({ ...formData, notes: e.target.value })}
                           />
                        </div>
                     </div>

                     <div className="pt-2 flex gap-3">
                        <button
                           type="button"
                           onClick={() => setIsModalOpen(false)}
                           className="flex-1 py-4 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-black rounded-2xl uppercase tracking-widest text-[10px] hover:bg-slate-200 dark:hover:bg-slate-600 transition-all"
                        >
                           Cancelar
                        </button>
                        <button
                           type="submit"
                           disabled={isSubmitting}
                           className="flex-[2] py-4 bg-cyan-600 text-white font-black rounded-2xl uppercase tracking-widest text-[10px] shadow-2xl shadow-cyan-600/30 hover:bg-cyan-500 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                           {isSubmitting ? (
                              <>
                                 <Loader className="animate-spin" size={18} /> Processando
                              </>
                           ) : (
                              'Confirmar'
                           )}
                        </button>
                     </div>
                  </form>
               </div>
            </div>
         )}

         {/* New Account Modal */}
         {isAccountModalOpen && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
               <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-lg shadow-2xl border border-slate-100 dark:border-slate-700 animate-in fade-in zoom-in duration-300 overflow-hidden text-left max-h-[90vh] overflow-y-auto custom-scrollbar">
                  <div className="flex items-center justify-between p-6 border-b dark:border-gray-700 bg-slate-50/50 dark:bg-gray-700/50 sticky top-0 z-10">
                     <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Landmark className="text-cyan-600" />
                        Nova Conta Bancária
                     </h3>
                     <button onClick={() => setIsAccountModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                        <X size={24} />
                     </button>
                  </div>

                  <form onSubmit={(e) => {
                     e.preventDefault();
                     addAccount({ ...accountForm, id: Date.now().toString(), balance: Number(accountForm.balance) });
                     setIsAccountModalOpen(false);
                  }} className="p-6 space-y-5">

                     {/* Instituição Financeira */}
                     <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 ml-1">Instituição Financeira</label>
                        <select
                           required
                           className="w-full rounded-xl border border-slate-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white px-4 py-3 font-semibold focus:ring-2 focus:ring-cyan-500 cursor-pointer"
                           value={accountForm.bankCode || ''}
                           onChange={e => {
                              const selectedBank = e.target.value;
                              const bankName = e.target.options[e.target.selectedIndex].text;
                              setAccountForm({
                                 ...accountForm,
                                 bankCode: selectedBank,
                                 name: selectedBank === 'outro' ? '' : bankName.split(' - ').slice(1).join(' - ') || bankName
                              });
                           }}
                        >
                           <option value="">Selecione o banco...</option>
                           <optgroup label="🏦 Bancos Tradicionais">
                              <option value="001">001 - Banco do Brasil S.A.</option>
                              <option value="033">033 - Banco Santander (Brasil) S.A.</option>
                              <option value="104">104 - Caixa Econômica Federal</option>
                              <option value="237">237 - Banco Bradesco S.A.</option>
                              <option value="341">341 - Banco Itaú S.A.</option>
                              <option value="399">399 - HSBC Bank Brasil S.A.</option>
                              <option value="422">422 - Banco Safra S.A.</option>
                              <option value="745">745 - Banco Citibank S.A.</option>
                           </optgroup>
                           <optgroup label="💜 Bancos Digitais">
                              <option value="077">077 - Banco Inter S.A.</option>
                              <option value="212">212 - Banco Original S.A.</option>
                              <option value="260">260 - Nu Pagamentos S.A. (Nubank)</option>
                              <option value="336">336 - Banco C6 S.A.</option>
                              <option value="290">290 - PagBank (PagSeguro)</option>
                              <option value="323">323 - Mercado Pago</option>
                              <option value="380">380 - PicPay Serviços S.A.</option>
                              <option value="403">403 - Cora SCD S.A.</option>
                           </optgroup>
                           <optgroup label="🏛️ Bancos de Investimento">
                              <option value="208">208 - Banco BTG Pactual S.A.</option>
                              <option value="102">102 - XP Investimentos</option>
                              <option value="386">386 - Nu Invest (Easynvest)</option>
                              <option value="735">735 - Banco Neon S.A.</option>
                              <option value="746">746 - Banco Modal S.A.</option>
                           </optgroup>
                           <optgroup label="🏢 Cooperativas">
                              <option value="748">748 - Sicredi</option>
                              <option value="756">756 - Sicoob</option>
                              <option value="091">091 - Unicred Central</option>
                              <option value="085">085 - Ailos</option>
                           </optgroup>
                           <optgroup label="🏗️ Bancos Regionais / Desenvolvimento">
                              <option value="041">041 - Banrisul</option>
                              <option value="070">070 - BRB - Banco de Brasília</option>
                              <option value="004">004 - Banco do Nordeste (BNB)</option>
                              <option value="003">003 - Banco da Amazônia (BASA)</option>
                              <option value="021">021 - Banestes</option>
                              <option value="047">047 - Banese</option>
                           </optgroup>
                           <optgroup label="💵 Caixa / Outros">
                              <option value="caixa">Caixa Físico (Dinheiro)</option>
                              <option value="cofre">Cofre</option>
                              <option value="outro">Outro (digitar nome)</option>
                           </optgroup>
                        </select>
                     </div>

                     {/* Nome personalizado se "outro" */}
                     {accountForm.bankCode === 'outro' && (
                        <div>
                           <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 ml-1">Nome da Conta / Banco</label>
                           <input
                              required
                              type="text"
                              className="w-full rounded-xl border border-slate-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white px-4 py-3 font-semibold focus:ring-2 focus:ring-cyan-500"
                              placeholder="Ex: Banco XYZ"
                              value={accountForm.name}
                              onChange={e => setAccountForm({ ...accountForm, name: e.target.value })}
                           />
                        </div>
                     )}

                     {/* Apelido da Conta */}
                     <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 ml-1">Apelido da Conta (opcional)</label>
                        <input
                           type="text"
                           className="w-full rounded-xl border border-slate-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white px-4 py-3 font-semibold focus:ring-2 focus:ring-cyan-500"
                           placeholder="Ex: Conta Principal, Reserva, etc."
                           value={accountForm.nickname || ''}
                           onChange={e => setAccountForm({ ...accountForm, nickname: e.target.value })}
                        />
                     </div>

                     {/* Tipo de Conta e Agência/Conta */}
                     {!['caixa', 'cofre'].includes(accountForm.bankCode) && accountForm.bankCode && (
                        <>
                           <div className="grid grid-cols-2 gap-4">
                              <div>
                                 <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 ml-1">Tipo de Conta</label>
                                 <select
                                    className="w-full rounded-xl border border-slate-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white px-4 py-3 font-semibold focus:ring-2 focus:ring-cyan-500 cursor-pointer"
                                    value={accountForm.type || 'Conta Corrente'}
                                    onChange={e => setAccountForm({ ...accountForm, type: e.target.value })}
                                 >
                                    <option value="Conta Corrente">Conta Corrente</option>
                                    <option value="Conta Poupança">Conta Poupança</option>
                                    <option value="Conta Salário">Conta Salário</option>
                                    <option value="Conta PJ">Conta Pessoa Jurídica</option>
                                    <option value="Conta Investimento">Conta Investimento</option>
                                 </select>
                              </div>
                              <div>
                                 <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 ml-1">Agência</label>
                                 <input
                                    type="text"
                                    className="w-full rounded-xl border border-slate-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white px-4 py-3 font-semibold focus:ring-2 focus:ring-cyan-500"
                                    placeholder="0001-X"
                                    value={accountForm.agency || ''}
                                    onChange={e => setAccountForm({ ...accountForm, agency: e.target.value })}
                                    maxLength={10}
                                 />
                              </div>
                           </div>

                           <div>
                              <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 ml-1">Número da Conta (com dígito)</label>
                              <input
                                 type="text"
                                 className="w-full rounded-xl border border-slate-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white px-4 py-3 font-semibold focus:ring-2 focus:ring-cyan-500"
                                 placeholder="12345-6"
                                 value={accountForm.accountNumber || ''}
                                 onChange={e => setAccountForm({ ...accountForm, accountNumber: e.target.value })}
                                 maxLength={15}
                              />
                           </div>
                        </>
                     )}

                     {/* Saldo Inicial */}
                     <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 ml-1">Saldo Inicial (R$)</label>
                        <div className="relative">
                           <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">R$</span>
                           <input
                              required
                              type="number"
                              step="0.01"
                              className="w-full rounded-xl border border-slate-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white pl-12 pr-4 py-3 font-bold focus:ring-2 focus:ring-cyan-500"
                              placeholder="0,00"
                              value={accountForm.balance}
                              onChange={e => setAccountForm({ ...accountForm, balance: e.target.value })}
                           />
                        </div>
                     </div>

                     {/* Chave PIX */}
                     {!['caixa', 'cofre'].includes(accountForm.bankCode) && accountForm.bankCode && (
                        <div className="pt-4 border-t border-slate-200 dark:border-gray-600">
                           <h4 className="text-xs font-black text-cyan-600 uppercase mb-3 flex items-center gap-2">
                              ⚡ Chave PIX (opcional)
                           </h4>
                           <div className="grid grid-cols-2 gap-4">
                              <div>
                                 <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 ml-1">Tipo de Chave</label>
                                 <select
                                    className="w-full rounded-xl border border-slate-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white px-4 py-3 font-semibold focus:ring-2 focus:ring-cyan-500 cursor-pointer"
                                    value={accountForm.pixType || ''}
                                    onChange={e => setAccountForm({ ...accountForm, pixType: e.target.value })}
                                 >
                                    <option value="">Nenhuma</option>
                                    <option value="CNPJ">CNPJ</option>
                                    <option value="CPF">CPF</option>
                                    <option value="E-mail">E-mail</option>
                                    <option value="Telefone">Telefone</option>
                                    <option value="Aleatória">Chave Aleatória</option>
                                 </select>
                              </div>
                              <div>
                                 <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 ml-1">Chave PIX</label>
                                 <input
                                    type="text"
                                    className="w-full rounded-xl border border-slate-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white px-4 py-3 font-semibold focus:ring-2 focus:ring-cyan-500"
                                    placeholder={
                                       accountForm.pixType === 'CNPJ' ? '00.000.000/0000-00' :
                                          accountForm.pixType === 'CPF' ? '000.000.000-00' :
                                             accountForm.pixType === 'E-mail' ? 'email@empresa.com' :
                                                accountForm.pixType === 'Telefone' ? '+55 11 99999-9999' :
                                                   accountForm.pixType === 'Aleatória' ? 'Cole a chave' : ''
                                    }
                                    value={accountForm.pixKey || ''}
                                    onChange={e => setAccountForm({ ...accountForm, pixKey: e.target.value })}
                                    disabled={!accountForm.pixType}
                                 />
                              </div>
                           </div>
                        </div>
                     )}

                     {/* Cor do Card */}
                     <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 ml-1">Cor de Identificação</label>
                        <div className="flex gap-2 flex-wrap">
                           {[
                              { color: 'bg-blue-600', label: 'Azul' },
                              { color: 'bg-green-600', label: 'Verde' },
                              { color: 'bg-orange-600', label: 'Laranja' },
                              { color: 'bg-purple-600', label: 'Roxo' },
                              { color: 'bg-pink-600', label: 'Rosa' },
                              { color: 'bg-cyan-600', label: 'Ciano' },
                              { color: 'bg-amber-600', label: 'Âmbar' },
                              { color: 'bg-slate-900', label: 'Escuro' }
                           ].map(({ color, label }) => (
                              <button
                                 type="button"
                                 key={color}
                                 onClick={() => setAccountForm({ ...accountForm, color })}
                                 className={`w-8 h-8 rounded-full ${color} transition-all ${accountForm.color === color ? 'ring-4 ring-offset-2 ring-cyan-500 scale-110' : 'opacity-70 hover:opacity-100 hover:scale-105'}`}
                                 title={label}
                              />
                           ))}
                        </div>
                     </div>

                     {/* Botões de Ação */}
                     <div className="pt-4 flex gap-3">
                        <button
                           type="button"
                           onClick={() => setIsAccountModalOpen(false)}
                           className="flex-1 py-4 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-black rounded-2xl uppercase tracking-widest text-[10px] hover:bg-slate-200 dark:hover:bg-slate-600 transition-all"
                        >
                           Cancelar
                        </button>
                        <button
                           type="submit"
                           className="flex-[2] py-4 bg-cyan-600 text-white font-black rounded-2xl uppercase tracking-widest text-[10px] shadow-2xl shadow-cyan-600/30 hover:bg-cyan-500 transition-all flex items-center justify-center gap-2"
                        >
                           <Plus size={18} />
                           Criar Conta
                        </button>
                     </div>
                  </form>
               </div>
            </div>
         )}

         {/* Plan of Accounts Modal */}
         {isPlanModalOpen && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
               <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md shadow-2xl border border-slate-100 dark:border-slate-700 animate-in fade-in zoom-in duration-300 overflow-hidden text-left">
                  <div className="flex items-center justify-between p-6 border-b dark:border-gray-700 bg-slate-50/50 dark:bg-gray-700/50">
                     <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <FolderOpen className="text-cyan-600" />
                        {editingPlan ? 'Editar Categoria' : 'Nova Categoria'}
                     </h3>
                     <button onClick={() => setIsPlanModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                        <X size={24} />
                     </button>
                  </div>

                  <form onSubmit={handleSavePlan} className="p-6 space-y-5">
                     <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 ml-1">Nome da Categoria</label>
                        <input
                           required
                           type="text"
                           className="w-full rounded-xl border border-slate-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white px-4 py-3 font-semibold focus:ring-2 focus:ring-cyan-500"
                           placeholder="Ex: Despesas de Marketing"
                           value={planForm.name}
                           onChange={e => setPlanForm({ ...planForm, name: e.target.value })}
                        />
                     </div>

                     <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 ml-1">Grupo Principal (Pai)</label>
                        <select
                           className="w-full rounded-xl border border-slate-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white px-4 py-3 text-sm font-semibold"
                           value={planForm.parentId}
                           onChange={e => setPlanForm({ ...planForm, parentId: e.target.value })}
                           disabled={!!editingPlan && planForm.parentId !== ''} // Lock parent if editing child (simplification)
                        >
                           <option value="">(Nenhum - Criar Grupo Raiz)</option>
                           {planOfAccounts.map(g => (
                              <option key={g.id} value={g.id}>{g.code} - {g.name} ({g.type})</option>
                           ))}
                        </select>
                     </div>

                     {planForm.parentId === '' && (
                        <div>
                           <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 ml-1">Tipo de Lançamento</label>
                           <div className="flex bg-slate-100 dark:bg-gray-700 p-1.5 rounded-xl">
                              <button
                                 type="button"
                                 onClick={() => setPlanForm({ ...planForm, type: 'Receita' })}
                                 className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${planForm.type === 'Receita' ? 'bg-white dark:bg-gray-600 text-green-600 shadow-sm border border-slate-100 dark:border-gray-500' : 'text-slate-500 hover:text-slate-700'}`}
                              >
                                 <ArrowDown size={16} /> Receita
                              </button>
                              <button
                                 type="button"
                                 onClick={() => setPlanForm({ ...planForm, type: 'Despesa' })}
                                 className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${planForm.type === 'Despesa' ? 'bg-white dark:bg-gray-600 text-red-600 shadow-sm border border-slate-100 dark:border-gray-500' : 'text-slate-500 hover:text-slate-700'}`}
                              >
                                 <ArrowUp size={16} /> Despesa
                              </button>
                           </div>
                        </div>
                     )}

                     <div className="flex gap-3 mt-4">
                        <button
                           type="button"
                           onClick={() => setIsPlanModalOpen(false)}
                           className="flex-1 py-4 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-black rounded-2xl uppercase tracking-widest text-[10px] hover:bg-slate-200 dark:hover:bg-slate-600 transition-all"
                        >
                           Cancelar
                        </button>
                        <button
                           type="submit"
                           className="flex-[2] py-4 bg-cyan-600 text-white font-black rounded-2xl uppercase tracking-widest text-[10px] shadow-2xl shadow-cyan-600/30 hover:bg-cyan-500 transition-all"
                        >
                           Confirmar
                        </button>
                     </div>
                  </form>
               </div>
            </div>
         )}

         {/* Main Content Area */}
         {activeTab === 'overview' && (
            <div className="space-y-6">
               {/* KPIs */}
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <KpiCard
                     title="Caixa Disponível"
                     value={formatMoney(financials.balance)}
                     subtext="Conciliado Real"
                     color="text-slate-900"
                     icon={Landmark}
                     trend="up"
                  />
                  <KpiCard
                     title="A Receber"
                     value={formatMoney(financials.receivables)}
                     subtext="Previsão de Entrada"
                     color="text-green-600"
                     icon={ArrowDown}
                  />
                  <KpiCard
                     title="A Pagar"
                     value={formatMoney(financials.payables)}
                     subtext="Previsão de Saída"
                     color="text-red-600"
                     icon={ArrowUp}
                  />
                  <KpiCard
                     title="Lucro Líquido"
                     value={formatMoney(financials.totalRevenue - financials.totalExpenses)}
                     subtext="Resultado do Período"
                     color={financials.totalRevenue - financials.totalExpenses >= 0 ? 'text-emerald-600' : 'text-red-600'}
                     icon={TrendingUp}
                  />
               </div>

               {/* Charts & Recent Activity */}
               <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                  <div className="xl:col-span-2 bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-gray-700">
                     <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-slate-800 dark:text-white">Fluxo de Caixa</h3>
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
                              <Tooltip
                                 cursor={{ fill: '#f8fafc' }}
                                 contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                              />
                              <Bar dataKey="income" fill="#2dd4bf" radius={[4, 4, 0, 0]} barSize={32} name="Entradas" />
                              <Bar dataKey="expense" fill="#f472b6" radius={[4, 4, 0, 0]} barSize={32} name="Saídas" />
                           </BarChart>
                        </ResponsiveContainer>
                     </div>
                  </div>

                  <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-gray-700 flex flex-col">
                     <h3 className="font-bold text-slate-800 dark:text-white mb-4">Contas Bancárias</h3>
                     <div className="space-y-4 overflow-y-auto flex-1 custom-scrollbar pr-2">
                        {accounts.map(acc => (
                           <div key={acc.id} className="p-4 rounded-xl border border-slate-100 dark:border-gray-700 bg-slate-50 dark:bg-gray-700/30 flex justify-between items-center group hover:border-cyan-300 transition-colors cursor-pointer">
                              <div className="flex items-center gap-3">
                                 <div className={`w-10 h-10 rounded-lg ${acc.color} text-white flex items-center justify-center shadow-lg shadow-cyan-900/10`}>
                                    <Landmark size={18} />
                                 </div>
                                 <div>
                                    <p className="text-sm font-bold text-slate-800 dark:text-white">{acc.name}</p>
                                    <p className="text-[10px] text-slate-400 font-medium uppercase">{acc.type}</p>
                                 </div>
                              </div>
                              <span className="text-sm font-black text-slate-700 dark:text-slate-200">{formatMoney(acc.balance)}</span>
                           </div>
                        ))}
                     </div>
                     <button onClick={() => setActiveTab('accounts')} className="mt-4 w-full py-3 text-cyan-600 text-xs font-bold uppercase border border-cyan-100 hover:bg-cyan-50 rounded-xl transition-colors">
                        Gerenciar Contas
                     </button>
                  </div>
               </div>
            </div>
         )}

         {/* Ledger View (Transactions List) */}
         {(activeTab === 'ledger' || activeTab === 'receivables' || activeTab === 'payables') && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-slate-100 dark:border-gray-700 overflow-hidden">
               <div className="p-6 border-b border-slate-100 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                     <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        {activeTab === 'ledger' ? <List className="text-cyan-600" /> : activeTab === 'receivables' ? <ArrowDown className="text-green-500" /> : <ArrowUp className="text-red-500" />}
                        {activeTab === 'ledger' ? 'Livro Caixa' : activeTab === 'receivables' ? 'Contas a Receber' : 'Contas a Pagar'}
                     </h3>
                     <p className="text-xs text-slate-500 mt-1">
                        {activeTab === 'ledger' ? 'Histórico completo de transações' : activeTab === 'receivables' ? 'Valores pendentes de recebimento' : 'Compromissos pendentes de pagamento'}
                     </p>
                  </div>
                  <div className="flex gap-2">
                     <div className="relative">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                           type="text"
                           placeholder="Buscar..."
                           value={searchTerm}
                           onChange={e => setSearchTerm(e.target.value)}
                           className="pl-10 pr-4 py-2 bg-slate-50 dark:bg-gray-700 border-none rounded-lg text-sm focus:ring-2 focus:ring-cyan-500 w-48"
                        />
                     </div>
                     <button className="p-2 text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg" title="Filtros Avançados">
                        <Filter size={18} />
                     </button>
                     <label className="p-2 text-slate-400 hover:text-cyan-600 bg-slate-50 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors" title="Importar OFX/CSV">
                        <Upload size={18} />
                        <input type="file" className="hidden" onChange={handleImport} accept=".csv,.ofx,.xlsx" />
                     </label>
                     <button
                        onClick={() => {
                           const list = activeTab === 'ledger' ? filteredTransactions : activeTab === 'receivables' ? receivables : payables;
                           const headers = 'Data,Vencimento,Descrição,Categoria,Conta,Tipo,Valor,Status\n';
                           const rows = list.map(t => `"${t.date}","${t.dueDate || t.date}","${t.description}","${t.ledgerName || t.category}","${t.account}","${t.type}","${t.amount}","${t.status}"`).join('\n');
                           const blob = new Blob(['\uFEFF' + headers + rows], { type: 'text/csv;charset=utf-8;' });
                           const url = URL.createObjectURL(blob);
                           const a = document.createElement('a');
                           a.href = url;
                           a.download = `financeiro_${activeTab}_${new Date().toISOString().split('T')[0]}.csv`;
                           a.click();
                        }}
                        className="p-2 text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg"
                        title="Exportar CSV"
                     >
                        <Download size={18} />
                     </button>
                  </div>
               </div>

               <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                     <thead className="text-[10px] uppercase text-slate-400 bg-slate-50 dark:bg-gray-700/50 font-black tracking-wider">
                        <tr>
                           <th className="px-6 py-4">Data / Vencimento</th>
                           <th className="px-6 py-4">Descrição</th>
                           <th className="px-6 py-4">Categoria</th>
                           <th className="px-6 py-4">Conta</th>
                           <th className="px-6 py-4 text-right">Valor</th>
                           <th className="px-6 py-4 text-center">Status</th>
                           <th className="px-6 py-4 text-right">Ações</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100 dark:divide-gray-700">
                        {(activeTab === 'ledger' ? filteredTransactions : activeTab === 'receivables' ? receivables : payables).map(tx => (
                           <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-gray-700/50 transition-colors group">
                              <td className="px-6 py-4 font-mono text-xs text-slate-500">{tx.dueDate || tx.date}</td>
                              <td className="px-6 py-4">
                                 <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${tx.type === 'Receita' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                       {tx.type === 'Receita' ? <ArrowDown size={14} /> : <ArrowUp size={14} />}
                                    </div>
                                    <span className="font-bold text-slate-700 dark:text-slate-200">{tx.description}</span>
                                 </div>
                              </td>
                              <td className="px-6 py-4">
                                 <span className="inline-block px-2 py-1 rounded text-[10px] font-bold bg-slate-100 text-slate-600 uppercase">
                                    {tx.ledgerName || tx.category}
                                 </span>
                              </td>
                              <td className="px-6 py-4 text-xs text-slate-500">{tx.account}</td>
                              <td className={`px-6 py-4 text-right font-black ${tx.type === 'Receita' ? 'text-green-600' : 'text-slate-800 dark:text-white'}`}>
                                 {formatMoney(tx.amount)}
                              </td>
                              <td className="px-6 py-4 text-center">
                                 <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${tx.status === 'Conciliado' ? 'bg-green-100 text-green-700' :
                                    tx.status === 'Pendente' ? 'bg-amber-100 text-amber-700' :
                                       'bg-slate-100 text-slate-600'
                                    }`}>
                                    <div className={`w-1.5 h-1.5 rounded-full ${tx.status === 'Conciliado' ? 'bg-green-500' : 'bg-amber-500'}`}></div>
                                    {tx.status}
                                 </span>
                              </td>
                              <td className="px-6 py-4 text-right">
                                 <div className="flex items-center justify-end gap-1 opacity-10 group-hover:opacity-100 transition-opacity">
                                    {hasPermission('finance.reconcile') && (
                                       <button
                                          onClick={() => {
                                             // Quick Conciliate/Undo
                                             const newStatus = tx.status === 'Conciliado' ? 'Pendente' : 'Conciliado';
                                             if (newStatus === 'Conciliado') {
                                                const date = prompt("Data da Conciliação:", new Date().toLocaleDateString('pt-BR'));
                                                if (date) updateTransactionStatus(tx.id, 'Conciliado', date);
                                             } else {
                                                updateTransactionStatus(tx.id, 'Pendente');
                                             }
                                          }}
                                          className={`p-1.5 rounded-lg transition-colors ${tx.status === 'Conciliado' ? 'text-green-600 bg-green-50' : 'text-slate-400 hover:text-cyan-600 hover:bg-slate-100'}`}
                                          title="Conciliar / Pagar"
                                       >
                                          <CheckCircle size={16} />
                                       </button>
                                    )}

                                    {hasPermission('finance.transact') && (
                                       <button
                                          onClick={() => {
                                             setSelectedTransaction(tx);
                                             setFormData(tx);
                                             setIsModalOpen(true);
                                          }}
                                          className="p-1.5 text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg"
                                          title="Editar"
                                       >
                                          <Edit2 size={16} />
                                       </button>
                                    )}

                                    {hasPermission('finance.delete') && (
                                       <button
                                          onClick={() => {
                                             addToast("Deseja excluir esta transação?", 'warning', 5000, {
                                                label: 'EXCLUIR',
                                                onClick: () => deleteTransaction(tx.id)
                                             });
                                          }}
                                          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg table-row-action"
                                       >
                                          <Trash2 size={16} />
                                       </button>
                                    )}

                                    <button
                                       onClick={() => {
                                          const printWindow = window.open('', '_blank');
                                          if (printWindow) {
                                             printWindow.document.write(`
                                                <html>
                                                   <head>
                                                      <title>Comprovante de Transação #${tx.id}</title>
                                                      <style>
                                                         body { font-family: 'Courier New', monospace; padding: 20px; max-width: 400px; margin: 0 auto; }
                                                         .header { text-align: center; margin-bottom: 20px; border-bottom: 1px dashed #000; padding-bottom: 10px; }
                                                         .row { display: flex; justify-content: space-between; margin-bottom: 5px; }
                                                         .label { font-weight: bold; }
                                                         .footer { margin-top: 20px; text-align: center; font-size: 10px; border-top: 1px dashed #000; padding-top: 10px; }
                                                         .amount { font-size: 1.2em; font-weight: bold; margin: 10px 0; text-align: center; }
                                                      </style>
                                                   </head>
                                                   <body>
                                                      <div class="header">
                                                         <h3>InfraCore ERP</h3>
                                                         <p>Comprovante de Movimentação</p>
                                                      </div>
                                                      <div class="content">
                                                         <div class="row"><span class="label">Data:</span> <span>${tx.date}</span></div>
                                                         <div class="row"><span class="label">ID:</span> <span>${tx.id}</span></div>
                                                         <div class="row"><span class="label">Tipo:</span> <span>${tx.type}</span></div>
                                                         <div class="row"><span class="label">Categoria:</span> <span>${tx.category}</span></div>
                                                         <div class="row"><span class="label">Conta:</span> <span>${tx.account}</span></div>
                                                         <hr style="border: 0; border-top: 1px dashed #ccc; margin: 10px 0;">
                                                         <div class="label">Descrição:</div>
                                                         <div>${tx.description}</div>
                                                         <div class="amount">R$ ${Number(tx.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                                                         <div class="row"><span class="label">Status:</span> <span>${tx.status}</span></div>
                                                      </div>
                                                      <div class="footer">
                                                         <p>Gerado em ${new Date().toLocaleString('pt-BR')}</p>
                                                         <p>InfraCore Systems</p>
                                                      </div>
                                                      <script>window.print();</script>
                                                   </body>
                                                </html>
                                             `);
                                             printWindow.document.close();
                                          }
                                       }}
                                       className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
                                       title="Imprimir Comprovante"
                                    >
                                       <Printer size={16} />
                                    </button>
                                 </div>
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </div>
         )}

         {/* Accounts Tab */}
         {activeTab === 'accounts' && (
            <div className="space-y-6 animate-in fade-in duration-300">
               <div className="flex justify-between items-center bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-gray-700">
                  <div>
                     <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Landmark className="text-cyan-600" /> Contas Bancárias & Caixa
                     </h3>
                     <p className="text-xs text-slate-500 mt-1">Gerencie os saldos iniciais e contas de movimento.</p>
                  </div>
                  <button onClick={() => { setAccountForm({ id: '', name: '', type: 'Conta Corrente', balance: 0, color: 'bg-blue-600', code: '' }); setIsAccountModalOpen(true); }} className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-2">
                     <Plus size={14} /> Nova Conta
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
                                    <button onClick={() => deleteAccount(acc.id)} className="p-2 text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                                 )}
                              </div>
                           </div>
                           <h4 className="text-xl font-black text-slate-900 dark:text-white mb-1">{acc.name}</h4>
                           <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">{acc.type}</p>
                           <div className="flex items-end justify-between border-t border-slate-100 dark:border-gray-700 pt-4">
                              <div>
                                 <p className="text-[10px] text-slate-400 font-bold uppercase mb-0.5">Saldo Atual</p>
                                 <p className="text-lg font-black text-slate-800 dark:text-white">{formatMoney(acc.balance)}</p>
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

         {/* Planning Tab */}
         {activeTab === 'planning' && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-slate-100 dark:border-gray-700 overflow-hidden animate-in fade-in duration-300">
               <div className="p-6 border-b border-slate-100 dark:border-gray-700 flex justify-between items-center">
                  <div>
                     <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <FolderOpen className="text-cyan-600" /> Plano de Contas
                     </h3>
                     <p className="text-xs text-slate-500 mt-1">Estrutura de Categorias de Receitas e Despesas.</p>
                  </div>
                  <button onClick={() => openPlanModal()} className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-2">
                     <Plus size={14} /> Nova Categoria
                  </button>
               </div>
               <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                     <thead className="bg-slate-50 dark:bg-gray-700/50 text-[10px] uppercase font-black text-slate-400">
                        <tr>
                           <th className="px-6 py-4">Código</th>
                           <th className="px-6 py-4">Nome da Categoria</th>
                           <th className="px-6 py-4 text-center">Tipo</th>
                           <th className="px-6 py-4 text-center">Nível</th>
                           <th className="px-6 py-4 text-right">Ações</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100 dark:divide-gray-700">
                        {planOfAccounts.map(group => (
                           <React.Fragment key={group.id}>
                              {/* Group Header */}
                              <tr className="bg-slate-50/50 dark:bg-gray-800/50 hover:bg-slate-100 dark:hover:bg-gray-700 transition-colors group">
                                 <td className="px-6 py-3 font-mono font-bold text-slate-700 dark:text-slate-300">{group.code}</td>
                                 <td className="px-6 py-3 font-black text-slate-800 dark:text-white flex items-center gap-2">
                                    <FolderOpen size={16} className="text-slate-400" /> {group.name}
                                 </td>
                                 <td className="px-6 py-3 text-center text-xs font-bold text-slate-500">{group.type}</td>
                                 <td className="px-6 py-3 text-center"><span className="px-2 py-0.5 rounded bg-slate-200 text-slate-600 text-[10px] font-bold">GRUPO</span></td>
                                 <td className="px-6 py-3 text-right">
                                    <div className="flex justify-end gap-1 opacity-10 group-hover:opacity-100 transition-opacity">
                                       <button onClick={() => openPlanModal(group, null)} className="p-1.5 text-slate-400 hover:text-cyan-600"><Edit2 size={16} /></button>
                                       {hasPermission('finance.delete') && (
                                          <button onClick={() => {
                                             addToast("Excluir Grupo e todas subcategorias?", 'warning', 5000, {
                                                label: 'EXCLUIR',
                                                onClick: () => deletePlanAccount(group.id, null)
                                             });
                                          }} className="p-1.5 text-slate-400 hover:text-red-500"><Trash2 size={16} /></button>
                                       )}
                                    </div>
                                 </td>
                              </tr>
                              {/* Children */}
                              {group.children?.map(child => (
                                 <tr key={child.id} className="hover:bg-slate-50 dark:hover:bg-gray-700/50 transition-colors group">
                                    <td className="px-6 py-3 font-mono text-xs text-slate-400 pl-10 border-l-4 border-transparent hover:border-cyan-400">{child.code}</td>
                                    <td className="px-6 py-3 text-slate-600 dark:text-slate-300 font-medium pl-10">{child.name}</td>
                                    <td className="px-6 py-3 text-center text-xs text-slate-400">{group.type}</td> {/* Inherited Type */}
                                    <td className="px-6 py-3 text-center"><span className="px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-400 text-[10px] font-bold">ANALÍTICA</span></td>
                                    <td className="px-6 py-3 text-right">
                                       <div className="flex justify-end gap-1 opacity-10 group-hover:opacity-100 transition-opacity">
                                          <button onClick={() => openPlanModal(child, group.id)} className="p-1.5 text-slate-400 hover:text-cyan-600"><Edit2 size={14} /></button>
                                          {hasPermission('finance.delete') && (
                                             <button onClick={() => {
                                                addToast("Excluir Categoria?", 'warning', 5000, {
                                                   label: 'EXCLUIR',
                                                   onClick: () => deletePlanAccount(child.id, group.id)
                                                });
                                             }} className="p-1.5 text-slate-400 hover:text-red-500"><Trash2 size={14} /></button>
                                          )}
                                       </div>
                                    </td>
                                 </tr>
                              ))}
                           </React.Fragment>
                        ))}
                     </tbody>
                  </table>
               </div>
            </div>
         )}

      </div>
   );
};

export default Finance;