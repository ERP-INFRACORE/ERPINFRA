import React, { useState, useMemo } from 'react';
import {
  ShoppingCart,
  RefreshCw,
  Trash2,
  CheckCircle,
  Printer,
  XCircle,
  Plus,
  Search,
  Package,
  CreditCard,
  Banknote,
  QrCode,
  User,
  Users,
  MoreVertical,
  Minus,
  Truck,
  FileText,
  FileSearch,
  FileJson,
  Barcode,
  Award,
  Landmark,
  Save,
  FileDown,
  Scale,
  X,
  Eye,
  AlertTriangle,
  Calendar,
  ArrowLeftRight,
  Download,
  ChevronRight,
  Activity,
  TrendingUp,
  Target,
  RotateCcw,
  UserPlus
} from 'lucide-react';
import { SalesItem, Client, Budget, Sale, AppSettings } from '../types';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { printDocument, exportToCSV } from '../utils/exportUtils';

// ==========================================
// MÁSCARAS E VALIDAÇÕES DEFENSIVAS BRASILEIRAS
// ==========================================

export const validateCPF = (cpf: string): boolean => {
  const clean = cpf.replace(/\D/g, '');
  if (clean.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(clean)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(clean.charAt(i), 10) * (10 - i);
  let rev = 11 - (sum % 11);
  if (rev === 10 || rev === 11) rev = 0;
  if (rev !== parseInt(clean.charAt(9), 10)) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(clean.charAt(i), 10) * (11 - i);
  rev = 11 - (sum % 11);
  if (rev === 10 || rev === 11) rev = 0;
  return rev === parseInt(clean.charAt(10), 10);
};

export const validateCNPJ = (cnpj: string): boolean => {
  const clean = cnpj.replace(/\D/g, '');
  if (clean.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(clean)) return false;
  let size = clean.length - 2;
  let numbers = clean.substring(0, size);
  const digits = clean.substring(size);
  let sum = 0;
  let pos = size - 7;
  for (let i = size; i >= 1; i--) {
    sum += parseInt(numbers.charAt(size - i), 10) * pos--;
    if (pos < 2) pos = 9;
  }
  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(0), 10)) return false;
  size = size + 1;
  numbers = clean.substring(0, size);
  sum = 0;
  pos = size - 7;
  for (let i = size; i >= 1; i--) {
    sum += parseInt(numbers.charAt(size - i), 10) * pos--;
    if (pos < 2) pos = 9;
  }
  result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  return result === parseInt(digits.charAt(1), 10);
};

export const validateCPFOrCNPJ = (doc: string): boolean => {
  const clean = doc.replace(/\D/g, '');
  if (clean.length === 11) return validateCPF(clean);
  if (clean.length === 14) return validateCNPJ(clean);
  return false;
};

export const formatCPFOrCNPJ = (val: string): string => {
  const clean = (val || '').replace(/\D/g, '');
  if (clean.length <= 11) {
    return clean
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  }
  return clean
    .slice(0, 14)
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
};

export const formatPhone = (val: string): string => {
  const clean = (val || '').replace(/\D/g, '').slice(0, 11);
  if (clean.length <= 10) {
    return clean
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2');
  }
  return clean
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2');
};

export const formatCEP = (val: string): string => {
  const clean = (val || '').replace(/\D/g, '').slice(0, 8);
  return clean.replace(/(\d{5})(\d)/, '$1-$2');
};

const formatMoney = (val: number | undefined | null) => {
  if (val === undefined || val === null || isNaN(val)) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
};

const getPaymentMethodLabel = (method: string | undefined | null) => {
  if (!method) return 'N/A';
  const map: Record<string, string> = {
    money: 'Dinheiro',
    pix: 'PIX',
    credit: 'Cartão',
    boleto: 'Boleto',
    prazo: 'A Prazo',
    transfer: 'Transferência'
  };
  return map[method] || method.toUpperCase();
};

const Sales = () => {
  const {
    sales,
    clients,
    addClient,
    addSale,
    inventory,
    budgets,
    addBudget,
    updateBudget,
    fleet,
    updateBudgetStatus,
    addTransaction,
    accounts,
    settings
  } = useApp();
  const { addToast } = useToast();

  // Robust data filtering with extreme safety checks
  const validSales = useMemo(() => {
    if (!Array.isArray(sales)) return [];
    return sales.filter(s => {
      return s &&
        typeof s === 'object' &&
        s.id &&
        typeof s.amount === 'number' &&
        Array.isArray(s.items);
    });
  }, [sales]);

  const validBudgets = useMemo(() => {
    if (!Array.isArray(budgets)) return [];
    return budgets.filter(b => {
      return b &&
        typeof b === 'object' &&
        b.status &&
        Array.isArray(b.items);
    });
  }, [budgets]);

  // Dashboard Calculations (Safe Mode)
  const dashboardStats = useMemo(() => {
    try {
      const today = new Date().toLocaleDateString('pt-BR');
      const totalToday = validSales
        .filter(s => s.date === today)
        .reduce((acc, s) => acc + (Number(s.amount) || 0), 0);

      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      const monthlyData = validSales.filter(s => {
        if (!s.date || typeof s.date !== 'string') return false;
        const parts = s.date.split('/');
        if (parts.length !== 3) return false;
        const month = parseInt(parts[1], 10) - 1;
        const year = parseInt(parts[2], 10);
        return month === currentMonth && year === currentYear;
      });

      const monthlyCount = monthlyData.length;
      const monthlyTotal = monthlyData.reduce((acc, s) => acc + (Number(s.amount) || 0), 0);
      const averageTicket = monthlyCount > 0 ? monthlyTotal / monthlyCount : 0;

      const monthlyTarget = 100000;
      const targetPercent = Math.min(Math.round((monthlyTotal / monthlyTarget) * 100), 100);

      return {
        totalToday,
        monthlyTotal,
        averageTicket,
        monthlyTarget,
        targetPercent,
        pendingBudgets: validBudgets.filter(b => b.status === 'Aberto').length
      };
    } catch (error) {
      console.error("Dashboard Calc Error:", error);
      return { totalToday: 0, monthlyTotal: 0, averageTicket: 0, monthlyTarget: 100000, targetPercent: 0, pendingBudgets: 0 };
    }
  }, [validSales, validBudgets]);

  const [activeTab, setActiveTab] = useState<'new' | 'history' | 'budgets' | 'dashboard'>('dashboard');
  const [mobileTab, setMobileTab] = useState<'catalog' | 'checkout'>('catalog');

  // Modal State
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);
  const [showNFE, setShowNFE] = useState<{ type: 'sale' | 'budget', data: any } | null>(null);

  // History & Budget Filters
  const [historySearchTerm, setHistorySearchTerm] = useState('');
  const [historyDate, setHistoryDate] = useState('');
  const [historyStatusFilter, setHistoryStatusFilter] = useState<'all' | 'Conciliado' | 'Pendente' | 'Cancelado'>('all');
  const [historyPaymentFilter, setHistoryPaymentFilter] = useState<'all' | 'money' | 'pix' | 'credit' | 'boleto' | 'prazo' | 'transfer'>('all');

  const [budgetSearchTerm, setBudgetSearchTerm] = useState('');
  const [budgetDateFilter, setBudgetDateFilter] = useState('');
  const [budgetStatusFilter, setBudgetStatusFilter] = useState<'all' | 'Aberto' | 'Aprovado' | 'Rejeitado' | 'Convertido'>('all');
  const [editingBudgetId, setEditingBudgetId] = useState<string | null>(null);

  // Quick Client Registration Modal State
  const [isQuickClientOpen, setIsQuickClientOpen] = useState(false);
  const [quickClientForm, setQuickClientForm] = useState({
    name: '',
    document: '',
    email: '',
    phone: '',
    creditLimit: '',
    type: 'Matriz' as 'Matriz' | 'Filial' | 'Parceiro',
    address: {
      zipCode: '',
      street: '',
      number: '',
      district: '',
      city: '',
      state: ''
    }
  });

  // Filtered History with comprehensive search and status consistency
  const filteredHistory = useMemo(() => {
    if (!Array.isArray(sales)) return [];
    const formattedFilterDate = historyDate ? historyDate.split('-').reverse().join('/') : '';
    const term = historySearchTerm.toLowerCase().trim();

    return sales.filter(s => {
      if (!s) return false;

      // Status filter
      if (historyStatusFilter !== 'all') {
        const currentStatus = s.status || 'Conciliado';
        if (currentStatus !== historyStatusFilter) return false;
      }

      // Payment method filter
      if (historyPaymentFilter !== 'all' && s.paymentMethod !== historyPaymentFilter) {
        return false;
      }

      // Date filter
      if (formattedFilterDate) {
        const saleDate = s.date || '';
        const matchesDate = saleDate.includes(formattedFilterDate) || (s.competenceDate && s.competenceDate.includes(historyDate));
        if (!matchesDate) return false;
      }

      // Search term (ID, Client, Payment, Account, Items, Driver)
      if (!term) return true;

      const clientName = (s.clientName || 'Cliente Avulso').toLowerCase();
      const saleId = String(s.id || '').toLowerCase();
      const payment = (s.paymentMethod || '').toLowerCase();
      const paymentLabel = getPaymentMethodLabel(s.paymentMethod).toLowerCase();
      const account = (s.account || '').toLowerCase();
      const driver = (s.driverName || '').toLowerCase();
      const itemsMatch = Array.isArray(s.items) && s.items.some(i => (i.name || '').toLowerCase().includes(term));

      return clientName.includes(term) ||
        saleId.includes(term) ||
        payment.includes(term) ||
        paymentLabel.includes(term) ||
        account.includes(term) ||
        driver.includes(term) ||
        itemsMatch;
    });
  }, [sales, historySearchTerm, historyDate, historyStatusFilter, historyPaymentFilter]);

  // Filtered Budgets with comprehensive search and status consistency
  const filteredBudgets = useMemo(() => {
    if (!Array.isArray(budgets)) return [];
    const formattedFilterDate = budgetDateFilter ? budgetDateFilter.split('-').reverse().join('/') : '';
    const term = budgetSearchTerm.toLowerCase().trim();

    return budgets.filter(b => {
      if (!b) return false;

      // Status filter
      if (budgetStatusFilter !== 'all' && b.status !== budgetStatusFilter) {
        return false;
      }

      // Date filter
      if (formattedFilterDate) {
        const bDate = b.date || '';
        if (!bDate.includes(formattedFilterDate)) return false;
      }

      // Search term (ID, Client, Items, Payment)
      if (!term) return true;

      const clientName = (b.clientName || '').toLowerCase();
      const budgetId = String(b.id || '').toLowerCase();
      const payment = (b.paymentMethod || '').toLowerCase();
      const itemsMatch = Array.isArray(b.items) && b.items.some(i => (i.name || '').toLowerCase().includes(term));

      return clientName.includes(term) ||
        budgetId.includes(term) ||
        payment.includes(term) ||
        itemsMatch;
    });
  }, [budgets, budgetSearchTerm, budgetStatusFilter, budgetDateFilter]);

  // Cart State
  const [cart, setCart] = useState<SalesItem[]>([]);
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [selectedVehicle, setSelectedVehicle] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('credit');
  const [discount, setDiscount] = useState<string>('0');
  const [account, setAccount] = useState<string>('');
  const [installments, setInstallments] = useState<number>(1);
  const [scaleWeight, setScaleWeight] = useState<number>(0);
  const [weightTicket, setWeightTicket] = useState<string>('');
  const [customDueDates, setCustomDueDates] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dispatch / Logistics State
  const [requiresWeighing, setRequiresWeighing] = useState(false);
  const [tareWeight, setTareWeight] = useState<number>(0);
  const [grossWeight, setGrossWeight] = useState<number>(0);
  const [driverName, setDriverName] = useState('');
  const [weightNotes, setWeightNotes] = useState('');
  const [dispatchStatus, setDispatchStatus] = useState<'Aguardando' | 'Em Pesagem' | 'Despachado'>('Aguardando');

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showCheckout, setShowCheckout] = useState(false);

  // Available Financial Accounts
  const financialAccounts = accounts.length > 0 ? accounts : [
    { id: 'acc-1', name: 'Banco do Brasil', type: 'Banco' },
    { id: 'acc-2', name: 'Caixa Interno', type: 'Caixa' }
  ];

  // Scale Simulation State
  const [isScaleConnected, setIsScaleConnected] = useState(true);

  // Local state for catalog selection quantities
  const [catalogQtys, setCatalogQtys] = useState<Record<string, number>>({});

  const updateCatalogQty = (id: string, val: number) => {
    setCatalogQtys(prev => ({ ...prev, [id]: Math.max(1, (prev[id] || 1) + val) }));
  };

  const handleCatalogInput = (id: string, val: string) => {
    const num = parseInt(val, 10) || 1;
    setCatalogQtys(prev => ({ ...prev, [id]: Math.max(1, num) }));
  };

  // Distinct Categories for Catalog Filter
  const categories = useMemo(() => {
    if (!Array.isArray(inventory)) return [];
    const set = new Set<string>();
    inventory.forEach(p => {
      if (p && p.category) set.add(p.category);
    });
    return Array.from(set).sort();
  }, [inventory]);

  // Filter products from Global Inventory with safety and category support
  const filteredProducts = useMemo(() => {
    if (!Array.isArray(inventory)) return [];
    const term = searchTerm.toLowerCase().trim();
    return inventory.filter(p => {
      if (!p) return false;
      if (selectedCategory !== 'all' && p.category !== selectedCategory) return false;
      if (!term) return true;

      const name = (p.name || '').toLowerCase();
      const category = (p.category || '').toLowerCase();
      const brand = (p.brand || '').toLowerCase();
      const barcode = (p.barcode || '').toLowerCase();
      const location = (p.location || '').toLowerCase();

      return name.includes(term) ||
        category.includes(term) ||
        brand.includes(term) ||
        barcode.includes(term) ||
        location.includes(term);
    });
  }, [inventory, searchTerm, selectedCategory]);

  // Cart Calculations
  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const discountStart = parseFloat(discount) || 0;
  const total = Math.max(0, subtotal - discountStart);

  // Weighing & Conversion Details for UI/Operator
  const weighingCalculations = useMemo(() => {
    if (!requiresWeighing || grossWeight <= tareWeight) return null;

    const netWeight = grossWeight - tareWeight;
    const netWeightTons = netWeight / 1000;

    // Find item that triggers weighing
    const bulkItem = cart.find(i => ['ton', 'm³', 'm3', 'kg'].includes(i.unit.toLowerCase()));
    if (!bulkItem) return { netWeight, netWeightTons };

    const unitLower = bulkItem.unit.toLowerCase();
    const density = bulkItem.weight ? bulkItem.weight / 1000 : 1; // ton/m3

    let convertedQty = netWeightTons;
    let explanation = "";

    if (unitLower === 'kg') {
      convertedQty = netWeight;
      explanation = `Carga Líquida: ${netWeight}kg.`;
    } else if (unitLower === 'ton') {
      explanation = `Peso Líquido: ${netWeight}kg ÷ 1000 = ${netWeightTons.toFixed(3)} ton.`;
    } else if (['m³', 'm3'].includes(unitLower)) {
      convertedQty = netWeightTons / density;
      explanation = `Conversão m³: ${netWeightTons.toFixed(3)} ton ÷ ${density.toFixed(3)} (Densidade) = ${convertedQty.toFixed(3)} m³.`;
    }

    return {
      netWeight,
      netWeightTons,
      bulkItem,
      density,
      convertedQty,
      explanation
    };
  }, [requiresWeighing, grossWeight, tareWeight, cart]);

  // Effect to reset installments for instant payments
  React.useEffect(() => {
    if (['money', 'pix', 'transfer'].includes(paymentMethod)) {
      setInstallments(1);
      setCustomDueDates([]);
    } else if (installments > 1) {
      const dates = Array.from({ length: installments }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() + ((i + 1) * 30));
        return d.toISOString().split('T')[0];
      });
      setCustomDueDates(dates);
    }
  }, [paymentMethod, installments]);

  const updateDueDate = (index: number, value: string) => {
    const newDates = [...customDueDates];
    newDates[index] = value;
    setCustomDueDates(newDates);
  };

  // Add To Cart with Defensive Validations and Stock Warnings
  const addToCart = (product: typeof inventory[0], qty: number = 1) => {
    if (!product || !product.id) return;

    const validQty = Math.max(1, qty);

    if (product.quantity <= 0) {
      addToast(`Aviso: Produto "${product.name}" sem saldo em estoque (0 ${product.unit}).`, 'warning', 3000);
    } else {
      const currentInCart = cart.find(i => i.id === product.id)?.quantity || 0;
      if ((currentInCart + validQty) > product.quantity) {
        addToast(`Aviso: Quantidade no carrinho (${currentInCart + validQty}) ultrapassa o estoque disponível (${product.quantity} ${product.unit}).`, 'warning', 3000);
      }
    }

    setCart(prev => {
      const existing = prev.find(i => i.id === product.id);
      if (existing) {
        return prev.map(i => i.id === product.id ? { ...i, quantity: i.quantity + validQty } : i);
      }
      return [...prev, {
        id: product.id,
        name: product.name,
        detail: product.category,
        quantity: validQty,
        unit: product.unit,
        price: product.price,
        originalPrice: product.price,
        originalUnit: product.unit,
        weight: product.weight
      }];
    });

    addToast(`"${product.name}" adicionado (${validQty} ${product.unit}).`, 'success', 1500);
  };

  const updateQuantity = (id: string, delta: number) => {
    const targetProduct = (inventory || []).find(p => p.id === id);

    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        if (delta > 0 && targetProduct && targetProduct.quantity > 0 && newQty > targetProduct.quantity) {
          addToast(`Atenção: Quantidade (${newQty}) excede o estoque disponível (${targetProduct.quantity} ${item.unit}).`, 'warning', 2500);
        }
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const handleReadScale = (id: string) => {
    if (!isScaleConnected) {
      addToast("Balança rodoviária não está conectada!", 'error');
      return;
    }
    const reading = (Math.random() * 20) + 5; // Weight in Tons

    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const density = item.weight ? item.weight / 1000 : 1;
        let newQty = reading;
        if (['m³', 'm3'].includes(item.unit.toLowerCase())) {
          newQty = reading / density;
        }
        return { ...item, quantity: parseFloat(newQty.toFixed(3)) };
      }
      return item;
    }));

    addToast("Peso capturado da balança rodoviária com sucesso!", 'success');
  };

  const toggleUnit = (id: string) => {
    setCart(prev => prev.map(item => {
      if (item.id === id && item.weight) {
        const density = item.weight / 1000;
        const unitLower = item.unit.toLowerCase();
        if (['m³', 'm3'].includes(unitLower)) {
          const newPrice = (item.originalPrice || item.price) / density;
          const newQty = item.quantity * density;
          return { ...item, unit: 'ton', price: newPrice, quantity: parseFloat(newQty.toFixed(3)) };
        } else if (unitLower === 'ton') {
          const newPrice = item.originalPrice || item.price * density;
          const newQty = item.quantity / density;
          return { ...item, unit: 'm³', price: newPrice, quantity: parseFloat(newQty.toFixed(3)), originalUnit: 'm³', originalPrice: newPrice };
        }
      }
      return item;
    }));
  };

  const removeFromCart = (id: string) => {
    const item = cart.find(i => i.id === id);
    setCart(prev => prev.filter(i => i.id !== id));
    if (item) {
      addToast(`"${item.name}" removido do carrinho.`, 'info', 1500);
    }
  };

  const clearForm = () => {
    setCart([]);
    setSelectedClient('');
    setSelectedVehicle('');
    setDiscount('0');
    setShowCheckout(false);
    setAccount('');
    setInstallments(1);
    setScaleWeight(0);
    setWeightTicket('');
    setWeightNotes('');
    setIsSubmitting(false);
    setEditingBudgetId(null);
  };

  // ==========================================
  // FINALIZAR VENDA COM VALIDAÇÕES DEFENSIVAS
  // ==========================================
  const handleFinalizeOrder = () => {
    if (cart.length === 0) {
      addToast("O carrinho está vazio. Adicione produtos para prosseguir.", 'warning');
      return;
    }
    if (!selectedClient) {
      addToast("Selecione um cliente para continuar.", 'warning');
      return;
    }
    if (!account) {
      addToast("Selecione uma conta financeira de destino para o recebimento.", 'warning');
      return;
    }

    const client = (clients || []).find(c => c.id === selectedClient);
    if (client && client.status === 'Inativo') {
      addToast("O cliente selecionado está inativo. Não é permitida a emissão de vendas para clientes inativos.", 'error');
      return;
    }

    const invalidItem = cart.find(i => isNaN(i.price) || i.price < 0 || isNaN(i.quantity) || i.quantity <= 0);
    if (invalidItem) {
      addToast(`O item "${invalidItem.name}" possui quantidade ou preço unitário inválido.`, 'error');
      return;
    }

    const discountVal = parseFloat(discount) || 0;
    if (discountVal < 0) {
      addToast("O valor do desconto não pode ser negativo.", 'error');
      return;
    }
    if (discountVal > subtotal) {
      addToast("O desconto não pode ser superior ao subtotal da venda.", 'error');
      return;
    }

    // Validation: Enforce Net Weight if Scale is Connected
    if (isScaleConnected && requiresWeighing) {
      if (!tareWeight || tareWeight <= 0) {
        addToast("É obrigatório informar a Tara (peso de entrada do veículo).", 'error');
        return;
      }
      if (!grossWeight || grossWeight <= 0) {
        addToast("É obrigatório informar o Peso Bruto (peso de saída do veículo).", 'error');
        return;
      }
      if (grossWeight <= tareWeight) {
        addToast("Erro de Pesagem: O Peso Bruto deve ser maior que a Tara para gerar o Peso Líquido.", 'error');
        return;
      }
    }

    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const saleId = `S-${Date.now()}`;
      const vehicle = (fleet || []).find(v => v.id === selectedVehicle);

      // Dispatch / Weighing Logic
      const netWeight = requiresWeighing && grossWeight > tareWeight ? grossWeight - tareWeight : undefined;

      // Recalculate based on Truck Weight if applicable (Scale Automatic Calculation)
      let finalItems = [...cart];
      let finalAmount = total;

      if (isScaleConnected && netWeight && netWeight > 0) {
        const bulkIndex = finalItems.findIndex(i => ['ton', 'm³', 'm3', 'kg'].includes(i.unit.toLowerCase()));
        if (bulkIndex !== -1) {
          const item = finalItems[bulkIndex];
          const netWeightTons = netWeight / 1000;
          let newQty = item.quantity;

          const unitLower = item.unit.toLowerCase();
          if (unitLower === 'kg') newQty = netWeight;
          else if (unitLower === 'ton') newQty = netWeightTons;
          else if (['m³', 'm3'].includes(unitLower)) {
            const density = item.weight ? item.weight / 1000 : 1;
            newQty = netWeightTons / density;
          }

          finalItems[bulkIndex] = { ...item, quantity: parseFloat(newQty.toFixed(3)) };
          const newSubtotal = finalItems.reduce((acc, i) => acc + (i.price * i.quantity), 0);
          finalAmount = Math.max(0, newSubtotal - discountVal);
        }
      }

      // Check credit limit
      if (['prazo', 'boleto'].includes(paymentMethod) && client?.creditLimit && finalAmount > client.creditLimit) {
        addToast(`Alerta de Crédito: A venda (${formatMoney(finalAmount)}) excede o limite cadastrado (${formatMoney(client.creditLimit)}).`, 'warning', 6000);
      }

      // Determine Status
      const isPaid = ['money', 'pix', 'debit', 'transfer'].includes(paymentMethod);
      const transactionStatus = isPaid ? 'Conciliado' : 'Pendente';

      // Calculate Due Date for Financial Records
      let finalDueDate: string | undefined = undefined;
      if (!isPaid && installments === 1) {
        const term = Number(settings?.operational?.defaultPaymentTerm) || 30;
        const d = new Date();
        d.setDate(d.getDate() + term);
        finalDueDate = d.toLocaleDateString('pt-BR');
      }

      const accountObj = financialAccounts.find(a => a.id === account);

      addSale({
        id: saleId,
        date: new Date().toLocaleDateString('pt-BR'),
        dueDate: finalDueDate,
        description: `Venda Direta${vehicle ? ` - Veículo: ${vehicle.plate}` : ''}`,
        category: 'Vendas',
        accountId: account,
        account: accountObj?.name || 'Caixa Geral',
        amount: finalAmount,
        status: transactionStatus,
        type: 'Receita',
        clientId: selectedClient,
        clientName: client?.name || 'Cliente Avulso',
        items: finalItems,
        paymentMethod,
        installments,
        installmentDueDates: customDueDates.length > 0 ? customDueDates : undefined,
        vehicleId: selectedVehicle,
        driverName: driverName,
        dispatchStatus: requiresWeighing ? 'Despachado' : 'Entregue',
        tareWeight: requiresWeighing ? tareWeight : undefined,
        grossWeight: requiresWeighing ? grossWeight : undefined,
        netWeight: netWeight,
        weightNotes: weightNotes || weighingCalculations?.explanation,
        weightTicket: weightTicket || undefined,
        partnerId: selectedClient || undefined,
        originModule: 'Vendas',
        originId: saleId,
        documentNumber: saleId.split('-')[1],
        ledgerCode: '1.01.01',
        ledgerName: 'Vendas de Mercadorias'
      });

      addToast("Venda realizada com sucesso!", 'success');
      clearForm();
      setActiveTab('history');
    } catch (err) {
      console.error("Erro ao registrar venda:", err);
      addToast("Ocorreu um erro ao registrar a venda no sistema.", 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ==========================================
  // SALVAR ORÇAMENTO COM VALIDAÇÃO
  // ==========================================
  const handleSaveBudget = () => {
    if (cart.length === 0) {
      addToast("Adicione ao menos um produto ao carrinho antes de salvar o orçamento.", 'warning');
      return;
    }
    if (!selectedClient) {
      addToast("Selecione um cliente para criar o orçamento.", 'warning');
      return;
    }

    const client = (clients || []).find(c => c.id === selectedClient);
    if (client && client.status === 'Inativo') {
      addToast("Atenção: O cliente selecionado está inativo no cadastro.", 'warning');
    }

    const discountVal = parseFloat(discount) || 0;
    if (discountVal < 0) {
      addToast("O valor do desconto não pode ser negativo.", 'error');
      return;
    }
    if (discountVal > subtotal) {
      addToast("O valor do desconto não pode ser superior ao subtotal.", 'error');
      return;
    }

    try {
      let finalItems = [...cart];
      let finalSubtotal = subtotal;
      let finalAmount = total;
      const calculatedNetWeight = requiresWeighing && grossWeight > tareWeight ? grossWeight - tareWeight : undefined;

      if (isScaleConnected && calculatedNetWeight && calculatedNetWeight > 0) {
        const bulkIndex = finalItems.findIndex(i => ['ton', 'm³', 'm3', 'kg'].includes(i.unit.toLowerCase()));
        if (bulkIndex !== -1) {
          const item = finalItems[bulkIndex];
          const netWeightTons = calculatedNetWeight / 1000;
          let newQty = item.quantity;

          const unitLower = item.unit.toLowerCase();
          if (unitLower === 'kg') newQty = calculatedNetWeight;
          else if (unitLower === 'ton') newQty = netWeightTons;
          else if (['m³', 'm3'].includes(unitLower)) {
            const density = item.weight ? item.weight / 1000 : 1;
            newQty = netWeightTons / density;
          }

          finalItems[bulkIndex] = { ...item, quantity: parseFloat(newQty.toFixed(3)) };
          finalSubtotal = finalItems.reduce((acc, i) => acc + (i.price * i.quantity), 0);
          finalAmount = Math.max(0, finalSubtotal - discountVal);
        }
      }

      const newBudget: Budget = {
        id: editingBudgetId || `B-${Date.now()}`,
        clientId: selectedClient,
        clientName: client?.name || 'Cliente Avulso',
        date: new Date().toLocaleDateString('pt-BR'),
        items: finalItems,
        subtotal: finalSubtotal,
        discount: discountVal,
        total: finalAmount,
        status: 'Aberto',
        expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR'),
        tareWeight: requiresWeighing ? tareWeight : undefined,
        grossWeight: requiresWeighing ? grossWeight : undefined,
        netWeight: calculatedNetWeight,
        weightNotes: weightNotes || weighingCalculations?.explanation,
        paymentMethod: paymentMethod
      };

      if (editingBudgetId) {
        updateBudget(newBudget);
        addToast("Orçamento atualizado com sucesso!", 'success');
      } else {
        addBudget(newBudget);
        addToast("Orçamento (Pré-Venda) salvo com sucesso!", 'success');
      }
      clearForm();
      setActiveTab('budgets');
    } catch (err) {
      console.error("Erro ao salvar orçamento:", err);
      addToast("Erro ao salvar proposta de orçamento.", 'error');
    }
  };

  // Converter Orçamento para Venda com validação
  const handleConvertBudgetToSale = (budget: Budget) => {
    if (budget.status === 'Convertido') {
      addToast(`O orçamento #${budget.id} já foi convertido anteriormente.`, 'warning');
      return;
    }

    addToast(`Deseja converter o orçamento #${budget.id} em uma venda definitiva?`, 'info', 10000, {
      label: 'CONFIRMAR',
      onClick: () => {
        try {
          const paymentMethod = budget.paymentMethod || 'credit';
          const isPaid = ['money', 'pix', 'debit', 'transfer'].includes(paymentMethod);
          const status = isPaid ? 'Conciliado' : 'Pendente';

          let conversionDueDate: string | undefined = undefined;
          if (!isPaid) {
            const term = Number(settings?.operational?.defaultPaymentTerm) || 30;
            const d = new Date();
            d.setDate(d.getDate() + term);
            conversionDueDate = d.toLocaleDateString('pt-BR');
          }

          const targetAcc = financialAccounts[0] || { id: 'acc-1', name: 'Caixa Geral' };

          addSale({
            id: `S-${Date.now()}`,
            date: new Date().toLocaleDateString('pt-BR'),
            dueDate: conversionDueDate,
            description: `Conversão de Orçamento #${budget.id}`,
            category: 'Vendas',
            accountId: targetAcc.id,
            account: targetAcc.name,
            amount: budget.total,
            status: status,
            type: 'Receita',
            clientId: budget.clientId,
            clientName: budget.clientName,
            items: budget.items,
            paymentMethod: paymentMethod,
            originModule: 'Vendas',
            originId: budget.id
          });

          updateBudgetStatus(budget.id, 'Convertido');
          addToast("Orçamento convertido em venda com sucesso! Estoque e financeiro atualizados.", 'success');
          setActiveTab('history');
        } catch (err) {
          console.error("Erro ao converter orçamento:", err);
          addToast("Erro ao converter orçamento em venda.", 'error');
        }
      }
    });
  };

  const handleUpdateBudgetStatus = (budgetId: string, newStatus: Budget['status']) => {
    try {
      updateBudgetStatus(budgetId, newStatus);
      const msg = newStatus === 'Aprovado' ? 'Orçamento aprovado com sucesso!' :
        newStatus === 'Rejeitado' ? 'Orçamento rejeitado.' :
        newStatus === 'Aberto' ? 'Orçamento reaberto.' :
        'Status do orçamento atualizado.';
      addToast(msg, newStatus === 'Aprovado' ? 'success' : 'info');
    } catch (err) {
      console.error(err);
      addToast('Erro ao atualizar status do orçamento.', 'error');
    }
  };

  // ==========================================
  // CADASTRO RÁPIDO DE CLIENTE (COM BLOQUEIO DE DUPLICIDADE)
  // ==========================================
  const handleSaveQuickClient = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = quickClientForm.name.trim();
    if (!trimmedName) {
      addToast("O nome ou razão social do cliente é obrigatório.", 'error');
      return;
    }

    const docClean = (quickClientForm.document || '').replace(/\D/g, '');
    if (docClean) {
      if (docClean.length !== 11 && docClean.length !== 14) {
        addToast("O CPF deve ter 11 dígitos ou o CNPJ deve ter 14 dígitos.", 'error');
        return;
      }
      if (!validateCPFOrCNPJ(docClean)) {
        addToast("CPF ou CNPJ inválido pelo dígito verificador.", 'error');
        return;
      }
      // Bloqueio de duplicidade
      const duplicate = (clients || []).find(
        c => (c.document || '').replace(/\D/g, '') === docClean
      );
      if (duplicate) {
        addToast(`Bloqueio de Duplicidade: Já existe um cliente com este CPF/CNPJ (${duplicate.name}).`, 'error');
        return;
      }
    }

    if (quickClientForm.email?.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(quickClientForm.email.trim())) {
      addToast("E-mail informado possui formato inválido.", 'error');
      return;
    }

    const newClientId = `c-${Date.now()}`;
    const newClient: Client = {
      id: newClientId,
      name: trimmedName,
      document: quickClientForm.document ? formatCPFOrCNPJ(quickClientForm.document) : '',
      email: quickClientForm.email.trim(),
      phone: quickClientForm.phone ? formatPhone(quickClientForm.phone) : '',
      status: 'Ativo',
      type: quickClientForm.type,
      registeredAt: new Date().toLocaleDateString('pt-BR'),
      initials: trimmedName.substring(0, 2).toUpperCase(),
      colorClass: 'bg-cyan-100 text-cyan-600',
      creditLimit: parseFloat(quickClientForm.creditLimit) || 0,
      address: quickClientForm.address
    };

    try {
      addClient(newClient);
      setSelectedClient(newClientId);
      setIsQuickClientOpen(false);
      setQuickClientForm({
        name: '',
        document: '',
        email: '',
        phone: '',
        creditLimit: '',
        type: 'Matriz',
        address: { zipCode: '', street: '', number: '', district: '', city: '', state: '' }
      });
      addToast(`Cliente "${trimmedName}" cadastrado e selecionado com sucesso!`, 'success');
    } catch (err) {
      console.error(err);
      addToast("Erro ao cadastrar cliente.", 'error');
    }
  };

  // ==========================================
  // EXPORTAÇÕES DE RELATÓRIO EM CSV
  // ==========================================
  const handleExportHistory = () => {
    if (filteredHistory.length === 0) {
      addToast("Nenhuma venda filtrada para exportar.", 'warning');
      return;
    }
    try {
      const dataToExport = filteredHistory.map(s => ({
        ID: s.id,
        Data: s.date,
        Cliente: s.clientName || 'Cliente Avulso',
        Valor_Total: s.amount,
        Forma_Pagamento: getPaymentMethodLabel(s.paymentMethod),
        Status: s.status || 'Conciliado',
        Conta_Financeira: s.account || '',
        Qtd_Itens: (s.items || []).length,
        Itens_Descricao: (s.items || []).map(i => `${i.name} (${i.quantity} ${i.unit})`).join('; ')
      }));
      exportToCSV(dataToExport, `Historico_Vendas_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}`);
      addToast("Relatório de vendas exportado com sucesso!", 'success');
    } catch (err) {
      console.error(err);
      addToast("Erro ao exportar histórico de vendas.", 'error');
    }
  };

  const handleExportBudgets = () => {
    if (filteredBudgets.length === 0) {
      addToast("Nenhum orçamento filtrado para exportar.", 'warning');
      return;
    }
    try {
      const dataToExport = filteredBudgets.map(b => ({
        ID: b.id,
        Data: b.date,
        Cliente: b.clientName,
        Subtotal: b.subtotal,
        Desconto: b.discount || 0,
        Total: b.total,
        Status: b.status,
        Validade: b.expiryDate,
        Forma_Pagamento: getPaymentMethodLabel(b.paymentMethod),
        Qtd_Itens: (b.items || []).length,
        Itens_Descricao: (b.items || []).map(i => `${i.name} (${i.quantity} ${i.unit})`).join('; ')
      }));
      exportToCSV(dataToExport, `Orcamentos_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}`);
      addToast("Orçamentos exportados com sucesso!", 'success');
    } catch (err) {
      console.error(err);
      addToast("Erro ao exportar orçamentos.", 'error');
    }
  };

  // Impressão do Orçamento com dados completos
  const handlePrintBudget = (budget: Budget) => {
    const company = settings || {
      companyName: 'INFRACORE ERP',
      tradeName: 'Sistemas de Gestão',
      document: '00.000.000/0000-00',
      email: 'contato@infracore.com.br',
      phone: '(11) 99999-9999',
      address: 'Endereço Padrão do Sistema',
      bankDetails: {
        bankName: 'Banco Padrão',
        agency: '0001',
        account: '00000-0',
        pixKey: 'financeiro@infracore.com',
        pixType: 'E-mail'
      }
    } as AppSettings;

    const client = (clients || []).find(c => c.id === budget.clientId);

    const html = `
      <div class="header" style="border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 30px;">
        <div class="company-info">
          <h1 style="font-size: 24px; color: #000; margin-bottom: 5px; text-transform: uppercase;">${company.tradeName || company.companyName}</h1>
          <p style="font-size: 12px; font-weight: bold; margin: 2px 0;">CNPJ: ${company.document}</p>
          <p style="font-size: 11px; color: #555; margin: 2px 0;">${company.address}</p>
          <p style="font-size: 11px; color: #555; margin: 2px 0;">${company.phone} | ${company.email}</p>
        </div>
        <div class="doc-info" style="text-align: right;">
          <h2 style="font-size: 18px; color: #f97316; margin-bottom: 5px;">ORÇAMENTO DE VENDA</h2>
          <p style="font-size: 14px; margin: 2px 0;">Nº: <strong>${budget.id.split('-')[1] || budget.id}</strong></p>
          <p style="font-size: 12px; margin: 2px 0;">Emissão: ${budget.date}</p>
        </div>
      </div>

      <div class="details-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px;">
        <div class="detail-box" style="background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0;">
          <h3 style="font-size: 11px; color: #94a3b8; font-weight: 800; letter-spacing: 0.05em; margin-bottom: 8px;">DADOS DO CLIENTE</h3>
          <p style="font-size: 14px; font-weight: bold; margin: 0 0 5px 0;">${budget.clientName}</p>
          ${client?.document ? `<p style="font-size: 12px; color: #64748b; margin: 0 0 4px 0;">CNPJ/CPF: <strong>${client.document}</strong></p>` : ''}
          ${client?.phone ? `<p style="font-size: 11px; color: #64748b; margin: 0 0 4px 0;">Telefone: ${client.phone}</p>` : ''}
          <p style="font-size: 12px; color: #64748b; margin: 0;">Validade da Proposta: <strong>${budget.expiryDate}</strong></p>
        </div>
        <div class="detail-box" style="background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0;">
          <h3 style="font-size: 11px; color: #94a3b8; font-weight: 800; letter-spacing: 0.05em; margin-bottom: 8px;">DETALHES DO PEDIDO</h3>
          <p style="font-size: 12px; margin: 0 0 4px 0;">Status: <span style="font-weight: bold; text-transform: uppercase; color: ${budget.status === 'Convertido' ? '#16a34a' : '#ea580c'}">${budget.status}</span></p>
          <p style="font-size: 12px; margin: 0;">Vendedor: Administrador</p>
        </div>
      </div>

      ${budget.netWeight ? `
      <div style="margin-bottom: 20px; padding: 12px; border: 1px dashed #cbd5e1; border-radius: 6px; background: #fff;">
        <h4 style="margin: 0 0 8px 0; font-size: 10px; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em;">Dados de Pesagem e Conversão</h4>
        <div style="display: flex; gap: 30px; font-size: 12px; font-family: monospace; margin-bottom: 8px; border-bottom: 1px solid #f1f5f9; padding-bottom: 8px;">
          <span><strong>Tara:</strong> ${budget.tareWeight} kg</span>
          <span><strong>Bruto:</strong> ${budget.grossWeight} kg</span>
          <span><strong>Líquido:</strong> ${budget.netWeight} kg</span>
        </div>
        ${budget.weightNotes ? `<div style="margin-top: 5px; font-size: 11px; color: #64748b; font-style: italic; border-top: 1px dashed #e2e8f0; padding-top: 5px;"><strong>Obs:</strong> ${budget.weightNotes}</div>` : ''}
      </div>
      ` : ''}

      <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
        <thead style="background: #f1f5f9; color: #475569; font-size: 10px; text-transform: uppercase;">
          <tr>
            <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e2e8f0;">Descrição do Produto</th>
            <th style="padding: 10px; text-align: right; border-bottom: 2px solid #e2e8f0;">Qtd</th>
            <th style="padding: 10px; text-align: center; border-bottom: 2px solid #e2e8f0;">Un</th>
            <th style="padding: 10px; text-align: right; border-bottom: 2px solid #e2e8f0;">Valor Unit.</th>
            <th style="padding: 10px; text-align: right; border-bottom: 2px solid #e2e8f0;">Total</th>
          </tr>
        </thead>
        <tbody style="font-size: 12px; color: #1e293b;">
          ${(budget.items || []).map((item) => `
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 12px 10px;">
                <div style="font-weight: bold;">${item.name}</div>
                <div style="font-size: 10px; color: #94a3b8;">${item.detail || ''}</div>
              </td>
              <td style="padding: 12px 10px; text-align: right;">${item.quantity}</td>
              <td style="padding: 12px 10px; text-align: center;">${item.unit || 'UN'}</td>
              <td style="padding: 12px 10px; text-align: right;">${formatMoney(item.price)}</td>
              <td style="padding: 12px 10px; text-align: right; font-weight: bold;">${formatMoney(item.price * item.quantity)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="totals" style="display: flex; flex-direction: column; align-items: flex-end; gap: 5px;">
        <div class="total-row" style="width: 200px; display: flex; justify-content: space-between; font-size: 12px; color: #64748b;">
          <span>Subtotal:</span>
          <span>${formatMoney(budget.subtotal)}</span>
        </div>
        <div class="total-row" style="width: 200px; display: flex; justify-content: space-between; font-size: 12px; color: #64748b;">
          <span>Descontos:</span>
          <span>${formatMoney(budget.discount || 0)}</span>
        </div>
        <div class="total-row total-final" style="width: 250px; display: flex; justify-content: space-between; font-size: 18px; font-weight: 900; color: #000; border-top: 2px solid #000; padding-top: 10px; margin-top: 5px;">
          <span>TOTAL A PAGAR:</span>
          <span>${formatMoney(budget.total)}</span>
        </div>
      </div>

      <div style="margin-top: 60px; border-top: 1px dotted #ccc; padding-top: 30px; display: flex; justify-content: space-between; gap: 40px;">
        <div style="flex: 1; text-align: center;">
          <div style="border-bottom: 1px solid #000; margin-bottom: 5px; height: 1px;"></div>
          <p style="font-size: 10px; text-transform: uppercase;">Assinatura do Responsável</p>
        </div>
        <div style="flex: 1; text-align: center;">
          <div style="border-bottom: 1px solid #000; margin-bottom: 5px; height: 1px;"></div>
          <p style="font-size: 10px; text-transform: uppercase;">${budget.clientName}</p>
        </div>
      </div>
    `;
    printDocument(`Orcamento_${budget.id}_${budget.clientName.replace(/\s+/g, '_')}`, html);
  };

  // Impressão do Recibo da Venda
  const handlePrintSale = (sale: Sale) => {
    const company = settings || {
      companyName: 'INFRACORE ERP',
      tradeName: 'Sistemas de Gestão',
      document: '00.000.000/0000-00',
      email: 'contato@infracore.com.br',
      phone: '(11) 99999-9999',
      address: 'Endereço Padrão do Sistema'
    } as AppSettings;

    const client = (clients || []).find(c => c.id === sale.clientId);

    const html = `
      <div class="header" style="text-align: center; border-bottom: 1px dashed #000; padding-bottom: 20px; margin-bottom: 20px;">
        <h2 style="margin: 0; font-size: 18px; text-transform: uppercase;">${company.tradeName || company.companyName}</h2>
        <p style="margin: 2px 0; font-size: 11px;">${company.address}</p>
        <p style="margin: 2px 0; font-size: 11px;">CNPJ: ${company.document}</p>
        <p style="margin: 2px 0; font-size: 11px;">${company.phone}</p>
      </div>

      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="margin: 0; font-size: 24px; font-weight: 900;">RECIBO DE VENDA</h1>
        <p style="margin: 5px 0 0 0; font-size: 14px;">Nº ${sale.id.split('-')[1] || sale.id}</p>
        <p style="margin: 0; font-size: 12px; color: #555;">${sale.date}</p>
      </div>

      <div style="margin-bottom: 20px; padding: 10px; border: 1px solid #eee; border-radius: 6px;">
        <p style="margin: 0 0 5px 0; font-size: 12px;"><strong>Cliente:</strong> ${sale.clientName}</p>
        ${client?.document ? `<p style="margin: 0 0 5px 0; font-size: 12px;"><strong>CPF/CNPJ:</strong> ${client.document}</p>` : ''}
        <p style="margin: 0 0 5px 0; font-size: 12px;"><strong>Método de Pagamento:</strong> ${getPaymentMethodLabel(sale.paymentMethod)}</p>
        ${sale.vehicleId ? `<p style="margin: 0; font-size: 12px;"><strong>Veículo:</strong> ${fleet.find(v => v.id === sale.vehicleId)?.plate || 'N/A'}</p>` : ''}
      </div>

      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <thead>
          <tr style="border-bottom: 1px solid #000;">
            <th style="font-size: 10px; text-align: left; padding: 5px 0;">DESCRIÇÃO</th>
            <th style="font-size: 10px; text-align: right; padding: 5px 0;">QTD</th>
            <th style="font-size: 10px; text-align: right; padding: 5px 0;">VL UN.</th>
            <th style="font-size: 10px; text-align: right; padding: 5px 0;">TOTAL</th>
          </tr>
        </thead>
        <tbody>
          ${(sale.items || []).map(item => `
            <tr style="border-bottom: 1px dashed #eee;">
              <td style="font-size: 11px; padding: 5px 0;">${item.name}</td>
              <td style="font-size: 11px; text-align: right; padding: 5px 0;">${item.quantity} ${item.unit}</td>
              <td style="font-size: 11px; text-align: right; padding: 5px 0;">${formatMoney(item.price)}</td>
              <td style="font-size: 11px; text-align: right; padding: 5px 0;">${formatMoney(item.price * item.quantity)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div style="border-top: 1px solid #000; padding-top: 10px; margin-bottom: 30px;">
        <div style="display: flex; justify-content: space-between; font-size: 16px; font-weight: bold;">
          <span>TOTAL PAGO:</span>
          <span>${formatMoney(sale.amount)}</span>
        </div>
      </div>

      <div style="text-align: center; font-size: 10px; color: #555; margin-top: 40px;">
        <p>Obrigado pela preferência!</p>
        <p>Documento sem valor fiscal.</p>
      </div>
    `;

    printDocument(`Recibo_${sale.id}`, html);
  };

  const selectedClientData = (clients || []).find(c => c.id === selectedClient);
  const danfeClient = showNFE ? (clients || []).find(c => c.id === showNFE.data.clientId) : null;

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] gap-4">
      {/* Quick Client Modal */}
      {isQuickClientOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-slate-800 rounded-[2rem] shadow-2xl w-full max-w-xl border border-slate-100 dark:border-slate-700 overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50">
              <div className="flex items-center gap-2">
                <UserPlus size={20} className="text-cyan-600" />
                <h3 className="text-lg font-black text-slate-900 dark:text-white">Cadastro Rápido de Cliente</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsQuickClientOpen(false)}
                className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-500"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveQuickClient} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Razão Social / Nome Completo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Construtora Horizonte Ltda"
                  value={quickClientForm.name}
                  onChange={e => setQuickClientForm({ ...quickClientForm, name: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl p-3 text-sm font-bold text-slate-800 dark:text-white focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">CPF ou CNPJ</label>
                  <input
                    type="text"
                    placeholder="00.000.000/0000-00 ou CPF"
                    value={quickClientForm.document}
                    onChange={e => setQuickClientForm({ ...quickClientForm, document: formatCPFOrCNPJ(e.target.value) })}
                    className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl p-3 text-sm font-medium focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Telefone / WhatsApp</label>
                  <input
                    type="text"
                    placeholder="(00) 00000-0000"
                    value={quickClientForm.phone}
                    onChange={e => setQuickClientForm({ ...quickClientForm, phone: formatPhone(e.target.value) })}
                    className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl p-3 text-sm font-medium focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">E-mail</label>
                  <input
                    type="email"
                    placeholder="financeiro@empresa.com"
                    value={quickClientForm.email}
                    onChange={e => setQuickClientForm({ ...quickClientForm, email: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl p-3 text-sm font-medium focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Limite de Crédito (R$)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0,00"
                    value={quickClientForm.creditLimit}
                    onChange={e => setQuickClientForm({ ...quickClientForm, creditLimit: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl p-3 text-sm font-bold text-emerald-600 focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-700">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Endereço (Opcional)</p>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">CEP</label>
                    <input
                      type="text"
                      placeholder="00000-000"
                      value={quickClientForm.address.zipCode}
                      onChange={e => setQuickClientForm({ ...quickClientForm, address: { ...quickClientForm.address, zipCode: formatCEP(e.target.value) } })}
                      className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl p-2.5 text-xs font-medium"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Cidade / UF</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Cidade"
                        value={quickClientForm.address.city}
                        onChange={e => setQuickClientForm({ ...quickClientForm, address: { ...quickClientForm.address, city: e.target.value } })}
                        className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl p-2.5 text-xs font-medium"
                      />
                      <input
                        type="text"
                        maxLength={2}
                        placeholder="UF"
                        value={quickClientForm.address.state}
                        onChange={e => setQuickClientForm({ ...quickClientForm, address: { ...quickClientForm.address, state: e.target.value.toUpperCase() } })}
                        className="w-14 bg-slate-50 dark:bg-slate-900 border-none rounded-xl p-2.5 text-xs font-bold uppercase text-center"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsQuickClientOpen(false)}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-cyan-600/20 transition-all flex items-center gap-2"
                >
                  <Save size={16} /> Salvar Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* NF-e Modal (DANFE Simulation) */}
      {showNFE && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-10 bg-black/60 backdrop-blur-sm overflow-hidden">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-5xl h-full flex flex-col animate-in zoom-in duration-200 text-black">
            <div className="p-4 border-b bg-gray-50 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <Barcode size={24} className="text-gray-700" />
                <span className="font-black text-xs uppercase tracking-widest text-gray-500">Visualização de Documento Fiscal (DANFE)</span>
              </div>
              <div className="flex gap-3">
                <button onClick={() => window.print()} className="px-6 py-2 bg-slate-900 text-white font-black text-xs rounded-lg flex items-center gap-2 hover:bg-black transition-all">
                  <Printer size={16} /> IMPRIMIR NF-e
                </button>
                <button onClick={() => setShowNFE(null)} className="p-2 text-gray-400 hover:text-red-500 transition-colors"><X size={24} /></button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 font-serif leading-tight printable-area bg-white">
              <div className="border-2 border-black p-4 space-y-4">
                <div className="grid grid-cols-12 gap-0 border-b-2 border-black -mx-4 -mt-4">
                  <div className="col-span-5 p-4 border-r-2 border-black">
                    <h2 className="text-xl font-black uppercase tracking-tighter">{settings?.companyName || settings?.tradeName || 'INFRACORE ERP SISTEMAS LTDA'}</h2>
                    <p className="text-[10px] font-bold uppercase">{settings?.address || 'AV. INDUSTRIAL, 1234 - DISTRITO INDUSTRIAL'}</p>
                    <p className="text-[10px] font-bold">CNPJ: {settings?.document || '00.000.000/0001-00'}</p>
                    <p className="text-[10px] font-bold">TEL: {settings?.phone || '(11) 4002-8922'} | {settings?.email || ''}</p>
                  </div>
                  <div className="col-span-3 p-4 border-r-2 border-black text-center flex flex-col justify-center">
                    <h3 className="text-lg font-black leading-none">DANFE</h3>
                    <p className="text-[8px] font-bold">DOCUMENTO AUXILIAR DA NOTA FISCAL ELETRÔNICA</p>
                    <div className="mt-2 text-left text-[9px] font-bold leading-tight">
                      <p>0 - ENTRADA</p>
                      <p>1 - SAÍDA</p>
                      <p className="text-sm font-black border border-black inline-block px-2 mt-1">1</p>
                    </div>
                    <p className="text-[10px] font-bold mt-2">Nº 000.123.456</p>
                    <p className="text-[10px] font-bold uppercase">SÉRIE: 001</p>
                  </div>
                  <div className="col-span-4 p-4 text-center">
                    <div className="bg-black text-white p-1 text-[8px] font-black uppercase mb-2">Chave de Acesso</div>
                    <div className="font-mono text-[10px] break-all tracking-tighter leading-none mb-4">
                      3523 1000 1234 5600 0100 5500 1000 1234 5612 3456 7890
                    </div>
                    <div className="border border-black p-1 text-[8px] font-bold">
                      Consulta de autenticidade no portal nacional da NF-e www.nfe.fazenda.gov.br
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-12 -mx-4 border-b-2 border-black">
                  <div className="col-span-8 p-2 border-r-2 border-black">
                    <p className="text-[8px] font-black uppercase">Natureza da Operação</p>
                    <p className="text-sm font-bold uppercase">VENDA DE MERCADORIA ADQUIRIDA DE TERCEIROS</p>
                  </div>
                  <div className="col-span-4 p-2">
                    <p className="text-[8px] font-black uppercase">Protocolo de Autorização</p>
                    <p className="text-sm font-bold uppercase">135230005512345 - 23/12/2023 14:22:15</p>
                  </div>
                </div>

                {/* Receiver Info com dados reais do cliente */}
                <div className="space-y-0.5 -mx-4">
                  <div className="bg-gray-100 p-1 text-[8px] font-black uppercase border-b-2 border-black">Destinatário / Remetente</div>
                  <div className="grid grid-cols-12 border-b-2 border-black">
                    <div className="col-span-9 p-2 border-r-2 border-black">
                      <p className="text-[8px] font-black uppercase">Nome / Razão Social</p>
                      <p className="text-sm font-bold uppercase">{showNFE.data.clientName || 'CONSUMIDOR FINAL'}</p>
                    </div>
                    <div className="col-span-3 p-2">
                      <p className="text-[8px] font-black uppercase">CNPJ / CPF</p>
                      <p className="text-sm font-bold uppercase">{danfeClient?.document || 'NÃO INFORMADO'}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-12 border-b-2 border-black">
                    <div className="col-span-6 p-2 border-r-2 border-black">
                      <p className="text-[8px] font-black uppercase">Endereço</p>
                      <p className="text-xs font-bold uppercase">{danfeClient?.address?.street ? `${danfeClient.address.street}, ${danfeClient.address.number || 'S/N'}` : 'NÃO INFORMADO'}</p>
                    </div>
                    <div className="col-span-3 p-2 border-r-2 border-black">
                      <p className="text-[8px] font-black uppercase">Bairro</p>
                      <p className="text-xs font-bold uppercase">{danfeClient?.address?.district || 'CENTRO'}</p>
                    </div>
                    <div className="col-span-3 p-2">
                      <p className="text-[8px] font-black uppercase">CEP</p>
                      <p className="text-xs font-bold uppercase">{danfeClient?.address?.zipCode || '00000-000'}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-0.5 -mx-4">
                  <div className="bg-gray-100 p-1 text-[8px] font-black uppercase border-b-2 border-black">Cálculo do Imposto</div>
                  <div className="grid grid-cols-5 border-b-2 border-black text-center divide-x-2 divide-black">
                    <div className="p-2"><p className="text-[8px] font-black uppercase">Base Cálc. ICMS</p><p className="text-xs font-bold">0,00</p></div>
                    <div className="p-2"><p className="text-[8px] font-black uppercase">Valor ICMS</p><p className="text-xs font-bold">0,00</p></div>
                    <div className="p-2"><p className="text-[8px] font-black uppercase">V. Total Frete</p><p className="text-xs font-bold">0,00</p></div>
                    <div className="p-2"><p className="text-[8px] font-black uppercase">V. Outras Desp.</p><p className="text-xs font-bold">0,00</p></div>
                    <div className="p-2"><p className="text-[8px] font-black uppercase">V. Total da Nota</p><p className="text-sm font-black">{formatMoney(showNFE.type === 'sale' ? showNFE.data.amount : showNFE.data.total)}</p></div>
                  </div>
                </div>

                {(showNFE.data.netWeight || (showNFE.type === 'sale' && showNFE.data.grossWeight)) && (
                  <div className="space-y-0.5 -mx-4">
                    <div className="bg-gray-100 p-1 text-[8px] font-black uppercase border-b-2 border-black flex items-center justify-between">
                      <span>Ticket de Pesagem Rodoviária</span>
                      <span>{showNFE.data.weightTicket ? `Ref: ${showNFE.data.weightTicket}` : 'Integrado'}</span>
                    </div>
                    <div className="grid grid-cols-3 border-b-2 border-black text-center divide-x-2 divide-black">
                      <div className="p-2"><p className="text-[8px] font-black uppercase">Peso Tara</p><p className="text-xs font-bold">{showNFE.data.tareWeight} kg</p></div>
                      <div className="p-2"><p className="text-[8px] font-black uppercase">Peso Bruto</p><p className="text-xs font-bold">{showNFE.data.grossWeight} kg</p></div>
                      <div className="p-2 bg-gray-50"><p className="text-[8px] font-black uppercase">Peso Líquido</p><p className="text-sm font-black">{showNFE.data.netWeight} kg</p></div>
                    </div>
                  </div>
                )}

                <div className="space-y-0.5 -mx-4 -mb-4">
                  <div className="bg-gray-100 p-1 text-[8px] font-black uppercase border-b-2 border-black">Dados dos Produtos / Serviços</div>
                  <table className="w-full text-center text-[9px] border-collapse">
                    <thead className="border-b-2 border-black font-black uppercase">
                      <tr className="divide-x-2 divide-black">
                        <th className="p-1 w-16">Cód. Prod</th>
                        <th className="p-1 text-left">Descrição do Produto</th>
                        <th className="p-1 w-12">NCM</th>
                        <th className="p-1 w-8">CST</th>
                        <th className="p-1 w-8">UND</th>
                        <th className="p-1 w-12">QTD</th>
                        <th className="p-1 w-20">V. Unit</th>
                        <th className="p-1 w-20">V. Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-300">
                      {(showNFE.data.items || []).map((item: any, idx: number) => (
                        <tr key={idx} className="divide-x-2 divide-gray-300">
                          <td className="p-1">0000{idx + 1}</td>
                          <td className="p-1 text-left font-bold uppercase">{item.name} {item.detail && `- ${item.detail}`}</td>
                          <td className="p-1">38011000</td>
                          <td className="p-1">0102</td>
                          <td className="p-1">{item.unit}</td>
                          <td className="p-1">{item.quantity}</td>
                          <td className="p-1">{formatMoney(item.price)}</td>
                          <td className="p-1 font-bold">{formatMoney(item.price * item.quantity)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="mt-8 flex justify-between items-end opacity-50 italic text-[10px]">
                <p>Documento gerado digitalmente pelo sistema InfraCore ERP. Autenticação via Blockchain integrada.</p>
                <div className="flex items-center gap-2">
                  <Award size={32} />
                  <p className="font-black border-t-2 border-black pt-1">RESPONSÁVEL PELA EMISSÃO</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sale Detail Modal */}
      {selectedSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl border border-gray-200 dark:border-gray-700 animate-in fade-in zoom-in duration-200 overflow-hidden">
            <div className="flex items-center justify-between p-6 bg-slate-50 dark:bg-gray-700/50 border-b dark:border-gray-700">
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <FileText className="text-cyan-600" />
                  Detalhes da Venda #{selectedSale.id.slice(-6)}
                </h3>
                <p className="text-xs text-slate-500 mt-1 uppercase font-bold tracking-wider">{selectedSale.date} • {selectedSale.clientName}</p>
              </div>
              <button onClick={() => setSelectedSale(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <X size={24} />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-slate-50 dark:bg-gray-700/30 p-4 rounded-xl border border-slate-100 dark:border-gray-600">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Informações de Pagamento</p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Forma:</span>
                      <span className="font-bold text-slate-900 dark:text-white uppercase">{getPaymentMethodLabel(selectedSale.paymentMethod)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Conta:</span>
                      <span className="font-bold text-slate-900 dark:text-white">{selectedSale.account}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Status:</span>
                      <span className={`font-bold px-2 py-0.5 rounded-full text-xs ${selectedSale.status === 'Pendente' ? 'text-amber-600 bg-amber-50 dark:bg-amber-900/20' : 'text-green-600 bg-green-50 dark:bg-green-900/20'}`}>
                        {(selectedSale.status || 'CONCILIADO').toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="bg-slate-50 dark:bg-gray-700/30 p-4 rounded-xl border border-slate-100 dark:border-gray-600 flex flex-col justify-center items-end">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Total da Venda</p>
                  <p className="text-3xl font-black text-cyan-600">{formatMoney(selectedSale.amount)}</p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Package size={16} /> Itens do Pedido
                </h4>
                <div className="border rounded-xl overflow-hidden dark:border-gray-700">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 dark:bg-gray-700 text-[10px] font-bold text-slate-400 uppercase">
                      <tr>
                        <th className="px-4 py-2">Item</th>
                        <th className="px-4 py-2 text-center">Qtd</th>
                        <th className="px-4 py-2 text-right">Preço</th>
                        <th className="px-4 py-2 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y dark:divide-gray-700">
                      {(selectedSale.items || []).map((item, idx) => (
                        <tr key={idx} className="dark:bg-gray-800">
                          <td className="px-4 py-3 font-bold text-slate-800 dark:text-gray-200">{item.name}</td>
                          <td className="px-4 py-3 text-center">{item.quantity} {item.unit}</td>
                          <td className="px-4 py-3 text-right">{formatMoney(item.price)}</td>
                          <td className="px-4 py-3 text-right font-bold text-slate-900 dark:text-white">{formatMoney(item.price * item.quantity)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => handlePrintSale(selectedSale)}
                  className="flex-1 py-3 bg-slate-100 dark:bg-gray-700 text-slate-700 dark:text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-slate-200 transition-colors"
                >
                  <Printer size={18} /> Imprimir Cupom
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowNFE({ type: 'sale', data: selectedSale });
                    setSelectedSale(null);
                  }}
                  className="flex-1 py-3 bg-cyan-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-cyan-700 shadow-lg shadow-cyan-600/20 transition-all"
                >
                  <FileDown size={18} /> Exportar NF-e
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Budget Detail Modal */}
      {selectedBudget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl border border-gray-200 dark:border-gray-700 animate-in fade-in zoom-in duration-200 overflow-hidden">
            <div className="flex items-center justify-between p-6 bg-orange-50 dark:bg-orange-900/20 border-b border-orange-100 dark:border-orange-800">
              <div>
                <h3 className="text-xl font-bold text-orange-900 dark:text-orange-400 flex items-center gap-2">
                  <Save className="text-orange-600" />
                  Orçamento #{selectedBudget.id}
                </h3>
                <p className="text-xs text-orange-700/60 mt-1 uppercase font-bold tracking-wider">Válido até: {selectedBudget.expiryDate}</p>
              </div>
              <button onClick={() => setSelectedBudget(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <X size={24} />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-700 rounded-xl border-2 border-dashed border-orange-200 dark:border-orange-800">
                <div className="flex items-center gap-3">
                  <div className="bg-orange-100 dark:bg-orange-900/40 p-2 rounded-lg text-orange-600"><User size={20} /></div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{selectedBudget.clientName}</p>
                    <p className="text-xs text-slate-500">Proposta de Venda Comercial</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Status</p>
                  <p className={`text-sm font-black ${selectedBudget.status === 'Convertido' ? 'text-green-600' : selectedBudget.status === 'Rejeitado' ? 'text-rose-600' : 'text-orange-600'}`}>
                    {selectedBudget.status.toUpperCase()}
                  </p>
                </div>
              </div>

              <div className="space-y-2 max-h-56 overflow-y-auto">
                {(selectedBudget.items || []).map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center p-2 rounded-lg bg-slate-50 dark:bg-gray-700/30">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded flex items-center justify-center bg-white text-[10px] font-bold dark:bg-gray-700 border">{idx + 1}</span>
                      <span className="text-sm font-medium">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-slate-400">{item.quantity} {item.unit} x {formatMoney(item.price)}</span>
                      <span className="text-sm font-bold">{formatMoney(item.price * item.quantity)}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-gray-700 flex justify-between items-center">
                <div className="text-slate-400 text-xs flex flex-col gap-1">
                  <p>Subtotal: {formatMoney(selectedBudget.subtotal)}</p>
                  <p>Desconto: {formatMoney(selectedBudget.discount)}</p>
                  <p className="mt-1">
                    <span className="bg-slate-100 dark:bg-gray-700 px-2 py-0.5 rounded text-[10px] font-black text-slate-500 uppercase tracking-wider">
                      Pagamento: {getPaymentMethodLabel(selectedBudget.paymentMethod)}
                    </span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-slate-500">Valor Total</p>
                  <p className="text-3xl font-black text-slate-900 dark:text-white">{formatMoney(selectedBudget.total)}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  onClick={() => handlePrintBudget(selectedBudget)}
                  className="flex-1 py-3 bg-white dark:bg-gray-700 border border-slate-200 dark:border-gray-600 text-slate-700 dark:text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors text-xs"
                >
                  <Printer size={16} /> Imprimir / PDF
                </button>
                {selectedBudget.status === 'Aberto' && (
                  <>
                    <button
                      onClick={() => {
                        handleUpdateBudgetStatus(selectedBudget.id, 'Aprovado');
                        setSelectedBudget(prev => prev ? { ...prev, status: 'Aprovado' } : null);
                      }}
                      className="px-4 py-3 bg-emerald-50 text-emerald-700 font-bold rounded-xl hover:bg-emerald-100 transition-colors text-xs flex items-center gap-1.5"
                    >
                      <CheckCircle size={16} /> Aprovar
                    </button>
                    <button
                      onClick={() => {
                        handleUpdateBudgetStatus(selectedBudget.id, 'Rejeitado');
                        setSelectedBudget(prev => prev ? { ...prev, status: 'Rejeitado' } : null);
                      }}
                      className="px-4 py-3 bg-rose-50 text-rose-700 font-bold rounded-xl hover:bg-rose-100 transition-colors text-xs flex items-center gap-1.5"
                    >
                      <XCircle size={16} /> Rejeitar
                    </button>
                  </>
                )}
                {(selectedBudget.status === 'Aberto' || selectedBudget.status === 'Aprovado') && (
                  <button
                    onClick={() => {
                      handleConvertBudgetToSale(selectedBudget);
                      setSelectedBudget(null);
                    }}
                    className="flex-[1.5] py-3 bg-green-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-green-700 shadow-lg shadow-green-600/20 transition-all uppercase tracking-wide text-xs"
                  >
                    <CheckCircle size={16} /> Converter em Venda
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Top Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2 font-display">
            <ShoppingCart className="text-cyan-600" />
            Faturamento e PDV
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Ponto de venda ágil, orçamentos e pedidos comerciais.</p>
        </div>
        <div className="flex bg-slate-100 dark:bg-slate-700 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'dashboard' ? 'bg-white dark:bg-slate-600 shadow-sm text-cyan-600 dark:text-white font-bold' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'}`}
          >
            <Activity size={16} />
            Painel Gerencial
          </button>
          <button
            onClick={() => setActiveTab('new')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'new' ? 'bg-white dark:bg-slate-600 shadow-sm text-slate-900 dark:text-white font-bold' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'}`}
          >
            <Plus size={16} />
            Nova Venda
          </button>
          <button
            onClick={() => setActiveTab('budgets')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'budgets' ? 'bg-white dark:bg-slate-600 shadow-sm text-slate-900 dark:text-white font-bold' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'}`}
          >
            <FileText size={16} />
            Orçamentos
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'history' ? 'bg-white dark:bg-slate-600 shadow-sm text-slate-900 dark:text-white font-bold' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'}`}
          >
            <RefreshCw size={16} />
            Histórico
          </button>
        </div>
      </div>

      {activeTab === 'dashboard' ? (
        <div className="flex-1 overflow-y-auto p-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* HERO: Meta Mensal */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-[2rem] shadow-2xl p-8 text-white relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="p-4 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-2xl text-white shadow-lg shadow-cyan-500/30">
                      <Target size={32} />
                    </div>
                    <div>
                      <h4 className="text-3xl font-black uppercase tracking-tight">Meta Mensal</h4>
                      <p className="text-cyan-300/70 text-sm font-medium">Acompanhamento Comercial em Tempo Real</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-end text-sm">
                      <span className="text-slate-400 font-bold">Progresso</span>
                      <span className="text-white font-black text-lg">{dashboardStats.targetPercent}% concluído</span>
                    </div>
                    <div className="w-full bg-slate-700/50 rounded-full h-6 overflow-hidden border border-slate-600 shadow-inner">
                      <div
                        className="bg-gradient-to-r from-cyan-500 via-cyan-400 to-emerald-400 h-full transition-all duration-1000 relative flex items-center justify-end pr-2"
                        style={{ width: `${Math.max(dashboardStats.targetPercent, 5)}%` }}
                      >
                        <span className="text-[10px] font-black text-white drop-shadow-md">{dashboardStats.targetPercent}%</span>
                      </div>
                    </div>
                    <div className="flex justify-between text-xs font-bold text-slate-500">
                      <span>R$ 0</span>
                      <span>{formatMoney(dashboardStats.monthlyTarget)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row lg:flex-col gap-4 lg:w-72">
                  <div className="flex-1 bg-gradient-to-br from-cyan-500/20 to-cyan-600/10 backdrop-blur-sm p-5 rounded-2xl border border-cyan-500/20">
                    <p className="text-[11px] font-black text-cyan-300 uppercase tracking-widest mb-2 flex items-center gap-2">
                      <TrendingUp size={14} /> Realizado
                    </p>
                    <p className="text-3xl font-black text-white">{formatMoney(dashboardStats.monthlyTotal)}</p>
                  </div>
                  <div className="flex-1 bg-white/5 backdrop-blur-sm p-5 rounded-2xl border border-white/10">
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                      <Target size={14} /> Objetivo
                    </p>
                    <p className="text-3xl font-black text-white">{formatMoney(dashboardStats.monthlyTarget)}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-cyan-600/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/4 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-purple-600/10 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/4 pointer-events-none"></div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-6 rounded-2xl shadow-lg shadow-emerald-500/20 text-white relative overflow-hidden group hover:scale-[1.02] transition-transform">
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                    <TrendingUp size={24} />
                  </div>
                  <span className="bg-white/20 text-white text-[10px] font-black px-2.5 py-1 rounded-lg uppercase">Hoje</span>
                </div>
                <p className="text-emerald-100 text-[11px] font-bold uppercase tracking-widest mb-1">Faturamento Diário</p>
                <h3 className="text-4xl font-black">{formatMoney(dashboardStats.totalToday)}</h3>
              </div>
            </div>

            <div className="bg-gradient-to-br from-cyan-500 to-cyan-600 p-6 rounded-2xl shadow-lg shadow-cyan-500/20 text-white relative overflow-hidden group hover:scale-[1.02] transition-transform">
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                    <Activity size={24} />
                  </div>
                  <span className="bg-white/20 text-white text-[10px] font-black px-2.5 py-1 rounded-lg uppercase">Média</span>
                </div>
                <p className="text-cyan-100 text-[11px] font-bold uppercase tracking-widest mb-1">Ticket Médio</p>
                <h3 className="text-4xl font-black">{formatMoney(dashboardStats.averageTicket)}</h3>
              </div>
            </div>

            <div className="bg-gradient-to-br from-amber-500 to-orange-500 p-6 rounded-2xl shadow-lg shadow-amber-500/20 text-white relative overflow-hidden group hover:scale-[1.02] transition-transform">
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                    <FileText size={24} />
                  </div>
                  <span className="bg-white/20 text-white text-[10px] font-black px-2.5 py-1 rounded-lg uppercase">Ação</span>
                </div>
                <p className="text-amber-100 text-[11px] font-bold uppercase tracking-widest mb-1">Orçamentos Pendentes</p>
                <h3 className="text-4xl font-black">{dashboardStats.pendingBudgets}</h3>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Ranking Vendas (Produtos) */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm col-span-1 lg:col-span-2">
              <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                <Package className="text-cyan-600" size={18} />
                Produtos Mais Vendidos
              </h3>
              <div className="space-y-4">
                {(() => {
                  const productSales: Record<string, number> = {};
                  (validSales || []).forEach(s => {
                    (s.items || []).forEach(i => {
                      if (i && i.name) {
                        productSales[i.name] = (productSales[i.name] || 0) + (Number(i.quantity) || 0);
                      }
                    });
                  });
                  const sorted = Object.entries(productSales).sort((a, b) => b[1] - a[1]).slice(0, 5);
                  if (sorted.length === 0) {
                    return <p className="text-xs text-slate-400 italic py-4">Nenhum produto faturado no histórico recente.</p>;
                  }
                  return sorted.map(([name, qtd], idx) => (
                    <div key={idx} className="flex items-center gap-4">
                      <span className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 text-xs font-black flex items-center justify-center">#{idx + 1}</span>
                      <div className="flex-1">
                        <div className="flex justify-between mb-1">
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">{name}</span>
                          <span className="text-xs font-bold text-cyan-600">{qtd} un.</span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                          <div className="bg-cyan-500 h-full rounded-full" style={{ width: `${Math.min(100, (qtd / (sorted[0][1] || 1)) * 100)}%` }}></div>
                        </div>
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </div>

            {/* Ranking Top Clientes */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
              <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                <Users className="text-amber-500" size={18} />
                Top Clientes
              </h3>
              <div className="space-y-3">
                {(() => {
                  const clientSales: Record<string, number> = {};
                  (validSales || []).forEach(s => {
                    const clientName = s.clientName || 'Cliente Avulso';
                    clientSales[clientName] = (clientSales[clientName] || 0) + (Number(s.amount) || 0);
                  });
                  const sorted = Object.entries(clientSales)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 5);
                  if (sorted.length === 0) {
                    return <p className="text-xs text-slate-400 italic py-4">Nenhuma venda registrada ainda.</p>;
                  }
                  return sorted.map(([name, val], idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 text-white flex items-center justify-center font-black text-xs shadow-sm">
                          {name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-800 dark:text-gray-200">{name}</p>
                          <p className="text-[10px] text-slate-400 uppercase">Cliente Comercial</p>
                        </div>
                      </div>
                      <span className="text-xs font-black text-slate-900 dark:text-white">{formatMoney(val)}</span>
                    </div>
                  ));
                })()}
              </div>
            </div>
          </div>

          {/* Vendas Recentes */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <h4 className="font-black text-lg text-slate-800 dark:text-white flex items-center gap-3">
                <div className="p-2 bg-cyan-50 dark:bg-cyan-900/20 rounded-xl text-cyan-600">
                  <Activity size={20} />
                </div>
                Vendas Recentes
              </h4>
              <button
                onClick={() => setActiveTab('history')}
                className="text-xs font-bold text-cyan-600 hover:text-cyan-700 uppercase tracking-wide flex items-center gap-1 hover:gap-2 transition-all"
              >
                Ver Todas <ChevronRight size={14} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {validSales.slice(0, 6).map(sale => (
                <div
                  key={sale.id}
                  className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-700 hover:border-cyan-300 dark:hover:border-cyan-600 hover:shadow-md transition-all group cursor-pointer"
                  onClick={() => setSelectedSale(sale)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center text-sm font-black text-white shadow-lg shadow-cyan-500/20 group-hover:scale-110 transition-transform">
                      {sale.items?.length || 0}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-black text-slate-800 dark:text-white uppercase truncate max-w-[140px]">{sale.clientName}</p>
                      <p className="text-[11px] text-slate-400 font-bold flex items-center gap-2">
                        <span>{sale.date}</span>
                        <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                        <span className="text-cyan-600">{getPaymentMethodLabel(sale.paymentMethod)}</span>
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-lg text-slate-900 dark:text-white">{formatMoney(sale.amount)}</p>
                    <p className="text-[10px] text-emerald-600 font-bold uppercase">{sale.status || 'Concluída'}</p>
                  </div>
                </div>
              ))}
            </div>

            {validSales.length === 0 && (
              <div className="text-center py-16 opacity-30 grayscale flex flex-col items-center gap-3">
                <TrendingUp size={60} strokeWidth={1} />
                <p className="text-sm font-black uppercase tracking-widest">Nenhuma venda registrada hoje</p>
                <p className="text-xs text-slate-400">As vendas faturadas aparecerão aqui automaticamente.</p>
              </div>
            )}
          </div>
        </div>
      ) : activeTab === 'new' ? (
        <div className="flex flex-col h-full overflow-hidden">
          {/* Mobile Tab Switcher */}
          <div className="lg:hidden grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-700/50 rounded-xl mb-4 shrink-0 mx-1">
            <button
              onClick={() => setMobileTab('catalog')}
              className={`py-2 text-sm font-bold rounded-lg transition-all ${mobileTab === 'catalog' ? 'bg-white dark:bg-slate-600 shadow text-cyan-600 dark:text-white' : 'text-slate-400'}`}
            >
              Catálogo
            </button>
            <button
              onClick={() => setMobileTab('checkout')}
              className={`py-2 text-sm font-bold rounded-lg transition-all ${mobileTab === 'checkout' ? 'bg-white dark:bg-slate-600 shadow text-cyan-600 dark:text-white' : 'text-slate-400'}`}
            >
              Carrinho ({cart.length})
            </button>
          </div>

          <div className="flex-1 flex flex-col lg:flex-row gap-6 h-full overflow-hidden relative">
            {/* Catalog - 30% width with category filter and search */}
            <div className={`w-full lg:w-[32%] shrink-0 flex flex-col gap-3 overflow-hidden h-full animate-in fade-in duration-500 ${mobileTab === 'catalog' ? 'flex' : 'hidden lg:flex'}`}>
              <div className="relative shrink-0 flex flex-col gap-2">
                <div className="flex gap-2">
                  <div className="relative group flex-1">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-cyan-600 transition-colors">
                      <Search size={16} />
                    </span>
                    <input
                      type="text"
                      className="block w-full pl-9 pr-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all font-bold text-xs"
                      placeholder="Buscar por nome, marca, código..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <button
                    className={`px-3 py-2 rounded-xl border flex items-center justify-center gap-1.5 font-black text-[10px] uppercase transition-all whitespace-nowrap ${isScaleConnected ? 'bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20' : 'bg-slate-50 border-slate-200 text-slate-400'}`}
                    onClick={() => setIsScaleConnected(!isScaleConnected)}
                    title={isScaleConnected ? 'Balança ativa no sistema' : 'Clique para simular conexão da balança'}
                  >
                    <Scale size={14} />
                    <span>{isScaleConnected ? 'Balança OK' : 'Sem Balança'}</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={selectedCategory}
                    onChange={e => setSelectedCategory(e.target.value)}
                    className="flex-1 py-1.5 px-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-300 focus:ring-1 focus:ring-cyan-500"
                  >
                    <option value="all">Todas as Categorias</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>

                  {(searchTerm || selectedCategory !== 'all') && (
                    <button
                      onClick={() => {
                        setSearchTerm('');
                        setSelectedCategory('all');
                      }}
                      title="Limpar filtros do catálogo"
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      <RotateCcw size={14} />
                    </button>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto pr-1 pb-10 custom-scrollbar flex flex-col gap-2">
                {filteredProducts.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 opacity-60">
                    <Package size={36} className="mx-auto mb-2" />
                    <p className="text-xs font-bold">Nenhum produto encontrado</p>
                  </div>
                ) : (
                  filteredProducts.map(product => {
                    const currentQty = catalogQtys[product.id] || 1;
                    return (
                      <div
                        key={product.id}
                        className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 hover:border-cyan-400 dark:hover:border-cyan-500 transition-all shadow-sm flex items-center p-3 gap-3 group"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                            <span className="text-[8px] font-black text-cyan-600 uppercase tracking-widest bg-cyan-50 dark:bg-cyan-900/20 px-1.5 py-0.5 rounded border border-cyan-100 dark:border-cyan-800/50 flex-shrink-0">
                              {product.category}
                            </span>
                            {product.quantity <= 0 ? (
                              <span className="text-[8px] font-bold text-rose-600 bg-rose-50 dark:bg-rose-900/20 px-1.5 py-0.5 rounded">
                                Sem Estoque
                              </span>
                            ) : product.quantity <= (product.minStock || 0) ? (
                              <span className="text-[8px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-1.5 py-0.5 rounded">
                                Baixo ({product.quantity})
                              </span>
                            ) : (
                              <span className="text-[8px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-1.5 py-0.5 rounded">
                                {product.quantity} {product.unit}
                              </span>
                            )}
                          </div>
                          <h4 className="font-black text-[11px] text-slate-800 dark:text-white uppercase truncate" title={product.name}>
                            {product.name}
                          </h4>
                          <p className="text-[12px] font-black text-slate-900 dark:text-cyan-400 mt-0.5">
                            {formatMoney(product.price)} <span className="text-[9px] text-slate-400 font-bold">/ {product.unit}</span>
                          </p>
                        </div>

                        <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900/50 p-1.5 rounded-xl border dark:border-slate-700">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => updateCatalogQty(product.id, -1)}
                              className="w-6 h-6 flex items-center justify-center rounded-lg bg-white dark:bg-slate-800 text-slate-400 hover:text-red-500 shadow-sm border dark:border-slate-700 transition-colors"
                            >
                              <Minus size={12} />
                            </button>
                            <input
                              type="number"
                              value={currentQty}
                              onChange={(e) => handleCatalogInput(product.id, e.target.value)}
                              className="w-10 text-center bg-transparent border-none p-0 text-sm font-black text-slate-900 dark:text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                            <button
                              onClick={() => updateCatalogQty(product.id, 1)}
                              className="w-6 h-6 flex items-center justify-center rounded-lg bg-white dark:bg-slate-800 text-slate-400 hover:text-cyan-600 shadow-sm border dark:border-slate-700 transition-colors"
                            >
                              <Plus size={12} />
                            </button>
                          </div>

                          <button
                            onClick={() => {
                              addToCart(product, currentQty);
                              setCatalogQtys(prev => ({ ...prev, [product.id]: 1 }));
                            }}
                            className="w-9 h-9 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl flex items-center justify-center shadow-lg shadow-cyan-600/20 active:scale-95 transition-all"
                            title="Adicionar ao Carrinho"
                          >
                            <Plus size={18} strokeWidth={3} />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Checkout - 68% width */}
            <div className={`flex-1 flex flex-col h-full ${mobileTab === 'checkout' ? 'flex' : 'hidden lg:flex'}`}>
              <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col h-full overflow-hidden relative">
                <div className="p-5 border-b dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/80">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-cyan-600 rounded-xl text-white shadow-lg shadow-cyan-600/20"><ShoppingCart size={22} /></div>
                    <div>
                      <h2 className="font-black text-xl text-slate-900 dark:text-white tracking-tight">Caixa / Checkout</h2>
                      <p className="text-xs text-slate-400 font-medium">Itens no pedido: {cart.length}</p>
                    </div>
                  </div>
                  {cart.length > 0 && (
                    <button onClick={() => { setCart([]); addToast("Carrinho limpo.", 'info'); }} className="px-3 py-1.5 text-xs font-bold text-red-500 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2">
                      <Trash2 size={14} /> Limpar Pedido
                    </button>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto p-0 bg-slate-50/50 dark:bg-slate-900/20">
                  {cart.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-6 grayscale opacity-50 p-6">
                      <ShoppingCart size={80} strokeWidth={1} />
                      <div className="text-center">
                        <p className="font-black text-xl text-slate-400">Ponto de Venda Vazio</p>
                        <p className="text-sm font-medium">Selecione produtos do catálogo para compor a venda ou orçamento</p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4">
                      <table className="w-full text-left border-separate border-spacing-y-2">
                        <thead className="text-[10px] uppercase font-black text-slate-400 hidden sm:table-header-group">
                          <tr>
                            <th className="pb-2 pl-4">Produto</th>
                            <th className="pb-2 text-center">Quantidade</th>
                            <th className="pb-2 text-right">Unitário</th>
                            <th className="pb-2 text-right">Total</th>
                            <th className="pb-2 w-10"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {cart.map(item => (
                            <tr key={item.id} className="group bg-white dark:bg-gray-800 shadow-sm rounded-xl border border-slate-100 dark:border-gray-700 hover:border-cyan-200 transition-all relative">
                              <td className="p-4 rounded-l-xl block sm:table-cell">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-gray-700 flex items-center justify-center text-slate-400 shrink-0"><Package size={18} /></div>
                                  <div>
                                    <p className="font-bold text-sm text-slate-900 dark:text-white leading-tight">{item.name}</p>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase">{item.detail}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="p-4 block sm:table-cell text-center">
                                <div className="flex items-center justify-between sm:justify-center gap-4 sm:gap-0">
                                  <span className="sm:hidden text-xs font-bold text-slate-500">Quantidade:</span>
                                  <div className="inline-flex items-center bg-slate-50 dark:bg-gray-900 rounded-lg p-1 border dark:border-gray-600">
                                    <button onClick={() => updateQuantity(item.id, -1)} className="p-1.5 hover:bg-white dark:hover:bg-gray-700 rounded text-slate-400 hover:text-cyan-600 transition-colors"><Minus size={14} /></button>
                                    <div className="flex flex-col items-center px-2 min-w-[30px]">
                                      <span className="text-sm font-black text-slate-800 dark:text-white">{item.quantity}</span>
                                      <span className="text-[9px] text-slate-400 uppercase leading-none">{item.unit}</span>
                                    </div>
                                    <button onClick={() => updateQuantity(item.id, 1)} className="p-1.5 hover:bg-white dark:hover:bg-gray-700 rounded text-slate-400 hover:text-cyan-600 transition-colors"><Plus size={14} /></button>
                                  </div>
                                </div>
                                {isScaleConnected && (['ton', 'm³', 'm3', 'kg'].includes(item.unit.toLowerCase())) && (
                                  <div className="flex justify-center gap-2 mt-2">
                                    <button onClick={() => handleReadScale(item.id)} className="text-[9px] bg-slate-900 text-white px-2 py-1 rounded hover:bg-cyan-600 flex items-center gap-1 font-bold"><Scale size={10} /> Ler Peso</button>
                                    {item.weight && (
                                      <button onClick={() => toggleUnit(item.id)} className="text-[9px] bg-cyan-100 text-cyan-700 px-2 py-1 rounded hover:bg-cyan-200 flex items-center gap-1 font-bold"><ArrowLeftRight size={10} /> Converter</button>
                                    )}
                                  </div>
                                )}
                              </td>
                              <td className="p-4 text-right hidden sm:table-cell">
                                <p className="text-xs font-bold text-slate-500 dark:text-slate-400">{formatMoney(item.price)}</p>
                              </td>
                              <td className="p-4 block sm:table-cell text-right">
                                <div className="flex justify-between sm:block items-center">
                                  <span className="sm:hidden text-xs font-bold text-slate-500">Total:</span>
                                  <p className="font-black text-base text-slate-900 dark:text-white">{formatMoney(item.price * item.quantity)}</p>
                                </div>
                              </td>
                              <td className="p-4 rounded-r-xl text-center absolute top-2 right-2 sm:static">
                                <button onClick={() => removeFromCart(item.id)} className="text-slate-300 hover:text-red-500 transition-colors bg-white sm:bg-transparent rounded-full p-1 sm:p-0 shadow-sm sm:shadow-none"><X size={18} /></button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                <div className="p-6 bg-white dark:bg-gray-800 border-t dark:border-slate-700 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] z-20">
                  {!showCheckout ? (
                    <div className="space-y-6">
                      <div className="flex justify-between items-end">
                        <span className="text-slate-400 text-sm font-bold uppercase tracking-wider mb-2">Subtotal da Venda</span>
                        <div className="text-right">
                          <span className="text-4xl font-black text-slate-900 dark:text-white tracking-tight block">{formatMoney(subtotal)}</span>
                          <span className="text-xs text-slate-400 font-bold uppercase">{cart.length} itens inclusos</span>
                        </div>
                      </div>
                      <button
                        disabled={cart.length === 0}
                        onClick={() => setShowCheckout(true)}
                        className="w-full py-5 bg-cyan-600 hover:bg-cyan-700 text-white font-black rounded-2xl shadow-xl shadow-cyan-600/30 text-lg transition-all flex items-center justify-center gap-3 disabled:grayscale disabled:opacity-50"
                      >
                        <CreditCard size={24} /> IR PARA O PAGAMENTO
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-5 animate-in slide-in-from-bottom duration-300 h-full overflow-hidden flex flex-col">
                      <div className="flex items-center justify-between shrink-0 mb-2">
                        <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2"><CreditCard size={20} className="text-cyan-600" /> Finalização Comercial</h3>
                        <button onClick={() => setShowCheckout(false)} className="text-xs font-bold text-cyan-600 hover:underline uppercase tracking-wide">Voltar ao Carrinho</button>
                      </div>

                      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-5">
                        <div className="space-y-4">
                          {/* Seletor de Cliente com botão de Cadastro Rápido */}
                          <div>
                            <div className="flex items-center justify-between mb-2 pl-1">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cliente Destinatário *</label>
                              <button
                                type="button"
                                onClick={() => setIsQuickClientOpen(true)}
                                className="text-[10px] font-black text-cyan-600 hover:text-cyan-700 uppercase tracking-wider flex items-center gap-1 hover:underline cursor-pointer"
                              >
                                <UserPlus size={12} /> + Novo Cliente
                              </button>
                            </div>
                            <div className="relative">
                              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                              <select
                                value={selectedClient}
                                onChange={e => setSelectedClient(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-gray-700 border-slate-200 dark:border-gray-600 rounded-xl text-sm font-bold shadow-sm focus:ring-2 focus:ring-cyan-500"
                              >
                                <option value="">Selecione o Cliente...</option>
                                {(clients || []).map(c => (
                                  <option key={c.id} value={c.id}>
                                    {c.name} {c.document ? `(${c.document})` : ''}
                                  </option>
                                ))}
                              </select>
                            </div>
                            {selectedClientData && (
                              <div className="mt-1.5 flex items-center justify-between text-[10px] font-bold text-slate-500 px-1">
                                <span>Doc: {selectedClientData.document || 'Não informado'}</span>
                                {selectedClientData.creditLimit !== undefined && selectedClientData.creditLimit > 0 && (
                                  <span className="text-emerald-600">Limite: {formatMoney(selectedClientData.creditLimit)}</span>
                                )}
                                <span className={selectedClientData.status === 'Ativo' ? 'text-emerald-600' : 'text-rose-500 font-bold'}>
                                  Status: {selectedClientData.status}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Forma de Pagamento */}
                          <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest pl-1">Forma de Pagamento</label>
                            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                              {['money', 'pix', 'transfer', 'credit', 'boleto', 'prazo'].map((method) => (
                                <button
                                  key={method}
                                  onClick={() => setPaymentMethod(method)}
                                  className={`p-3 rounded-xl border-2 font-black text-[9px] flex flex-col items-center justify-center gap-2 transition-all ${paymentMethod === method ? 'border-cyan-500 bg-cyan-50 text-cyan-600 dark:bg-cyan-900/20' : 'border-slate-100 dark:border-gray-700 text-slate-400 hover:bg-slate-50'}`}
                                >
                                  {method === 'money' && <><Banknote size={20} />DINHEIRO</>}
                                  {method === 'pix' && <><QrCode size={20} />PIX</>}
                                  {method === 'transfer' && <><ArrowLeftRight size={20} />TRANSFER.</>}
                                  {method === 'credit' && <><CreditCard size={20} />CARTÃO</>}
                                  {method === 'boleto' && <><Barcode size={20} />BOLETO</>}
                                  {method === 'prazo' && <><Calendar size={20} />A PRAZO</>}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="p-4 bg-slate-50 dark:bg-gray-700/30 rounded-xl border border-slate-100 dark:border-gray-600 space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Conta Financeira (Recebimento) *</label>
                                <select
                                  value={account}
                                  onChange={e => setAccount(e.target.value)}
                                  className="w-full p-2.5 bg-white dark:bg-gray-600 border border-slate-200 dark:border-gray-500 rounded-lg text-xs font-bold"
                                >
                                  <option value="">Selecione a conta...</option>
                                  {financialAccounts.map(acc => (
                                    <option key={acc.id} value={acc.id}>{acc.name}</option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Desconto (R$)</label>
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={discount}
                                  onChange={e => setDiscount(e.target.value)}
                                  className="w-full p-2.5 bg-white dark:bg-gray-600 border border-slate-200 dark:border-gray-500 rounded-lg text-xs font-bold text-rose-600"
                                  placeholder="0,00"
                                />
                              </div>
                            </div>

                            {!['money', 'pix', 'transfer'].includes(paymentMethod) && (
                              <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Parcelamento</label>
                                <select
                                  value={installments}
                                  onChange={e => setInstallments(Number(e.target.value))}
                                  className="w-full p-2.5 bg-white dark:bg-gray-600 border border-slate-200 dark:border-gray-500 rounded-lg text-xs font-bold"
                                >
                                  {[1, 2, 3, 4, 5, 6, 10, 12].map(n => (
                                    <option key={n} value={n}>{n}x {n > 1 ? 'sem juros' : 'à vista'}</option>
                                  ))}
                                </select>
                              </div>
                            )}

                            {installments > 1 && !['money', 'pix', 'transfer'].includes(paymentMethod) && (
                              <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Vencimento das Parcelas</label>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                  {customDueDates.map((date, idx) => (
                                    <div key={idx}>
                                      <input
                                        type="date"
                                        value={date}
                                        onChange={(e) => updateDueDate(idx, e.target.value)}
                                        className="w-full p-1.5 bg-white dark:bg-gray-600 rounded border border-slate-200 dark:border-gray-500 text-[10px] font-bold font-mono"
                                      />
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Logística e Despacho */}
                          <div className="bg-slate-50 dark:bg-gray-700/30 p-4 rounded-xl border border-slate-200 dark:border-gray-600 space-y-4">
                            <div className="flex items-center justify-between">
                              <h4 className="font-bold text-slate-700 dark:text-slate-300 text-sm flex items-center gap-2">
                                <Truck size={16} /> Logística e Despacho
                              </h4>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-slate-500">Requer Pesagem?</span>
                                <button
                                  onClick={() => setRequiresWeighing(!requiresWeighing)}
                                  className={`w-10 h-6 rounded-full p-1 transition-colors ${requiresWeighing ? 'bg-cyan-600' : 'bg-slate-300'}`}
                                >
                                  <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${requiresWeighing ? 'translate-x-4' : ''}`} />
                                </button>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Veículo (Frota)</label>
                                <select
                                  value={selectedVehicle}
                                  onChange={e => setSelectedVehicle(e.target.value)}
                                  className="w-full p-2.5 bg-white dark:bg-gray-600 border border-slate-200 dark:border-gray-500 rounded-lg text-xs font-bold"
                                >
                                  <option value="">Veículo Próprio / Terceiro</option>
                                  {(fleet || []).map(v => (
                                    <option key={v.id} value={v.id}>{v.plate} - {v.model || v.name}</option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Motorista</label>
                                <input
                                  type="text"
                                  value={driverName}
                                  onChange={e => setDriverName(e.target.value)}
                                  className="w-full p-2.5 bg-white dark:bg-gray-600 border border-slate-200 dark:border-gray-500 rounded-lg text-xs font-bold"
                                  placeholder="Nome do Condutor"
                                />
                              </div>
                            </div>

                            {requiresWeighing && (
                              <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-dashed border-cyan-200 dark:border-cyan-900/50 space-y-3 animate-in fade-in zoom-in duration-300">
                                <div className="flex justify-between items-center mb-2">
                                  <label className="text-[10px] font-black text-cyan-600 uppercase flex items-center gap-1">
                                    <Scale size={12} /> Balança Rodoviária
                                  </label>
                                  <span className="text-[9px] bg-cyan-100 text-cyan-700 px-2 py-0.5 rounded font-bold">CONECTADO</span>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-1">
                                    <p className="text-[10px] text-slate-500 font-bold uppercase">Tara (Entrada)</p>
                                    <div className="flex gap-2">
                                      <input
                                        type="number"
                                        value={tareWeight}
                                        onChange={e => setTareWeight(Number(e.target.value))}
                                        className="w-full p-1.5 text-right font-mono text-sm font-bold border rounded bg-slate-50 dark:bg-slate-700/50"
                                      />
                                      <button onClick={() => setTareWeight(Number((Math.random() * 5000 + 2000).toFixed(0)))} className="px-2 bg-slate-200 dark:bg-slate-600 rounded hover:bg-cyan-200 text-[10px] font-black uppercase">Ler</button>
                                    </div>
                                  </div>
                                  <div className="space-y-1">
                                    <p className="text-[10px] text-slate-500 font-bold uppercase">Bruto (Saída)</p>
                                    <div className="flex gap-2">
                                      <input
                                        type="number"
                                        value={grossWeight}
                                        onChange={e => setGrossWeight(Number(e.target.value))}
                                        className="w-full p-1.5 text-right font-mono text-sm font-bold border rounded bg-slate-50 dark:bg-slate-700/50"
                                      />
                                      <button onClick={() => setGrossWeight(Number((tareWeight + Math.random() * 10000).toFixed(0)))} className="px-2 bg-slate-200 dark:bg-slate-600 rounded hover:bg-cyan-200 text-[10px] font-black uppercase">Ler</button>
                                    </div>
                                  </div>
                                </div>

                                <div className="mt-2">
                                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Observações de Pesagem</label>
                                  <textarea
                                    value={weightNotes}
                                    onChange={e => setWeightNotes(e.target.value)}
                                    className="w-full p-2 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-gray-600 rounded-lg text-xs font-bold resize-none h-16 outline-none focus:border-cyan-500 transition-colors"
                                    placeholder="Ex: Carga molhada, Placa do reboque, Condições do veículo..."
                                  />
                                </div>

                                {weighingCalculations && (
                                  <div className="mt-3 p-3 bg-cyan-50 dark:bg-cyan-900/10 rounded-xl border border-cyan-100 dark:border-cyan-800/50">
                                    <div className="flex items-center gap-2 text-cyan-700 dark:text-cyan-400 font-bold text-[10px] uppercase mb-1">
                                      <AlertTriangle size={12} /> Detalhes da Conversão
                                    </div>
                                    <p className="text-xs font-mono text-cyan-600 dark:text-cyan-300 leading-relaxed">
                                      {weighingCalculations.explanation}
                                    </p>
                                    <div className="mt-2 flex justify-between items-center text-[10px] font-black text-cyan-800 dark:text-cyan-200">
                                      <span>EQUIVALÊNCIA:</span>
                                      <span className="bg-cyan-200 dark:bg-cyan-800 px-2 py-0.5 rounded">
                                        {weighingCalculations.convertedQty.toFixed(3)} {weighingCalculations.bulkItem?.unit}
                                      </span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Total Box */}
                          <div className="flex justify-between items-end p-5 bg-slate-900 dark:bg-black rounded-2xl text-white mt-4 shadow-xl border border-white/10">
                            <div className="flex flex-col">
                              <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Total do Pedido</span>
                              <div className="flex items-baseline gap-2">
                                <span className="text-4xl font-black text-cyan-400">{formatMoney(total).split(',')[0]}</span>
                                <span className="text-xl font-bold opacity-50">,{formatMoney(total).split(',')[1]}</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="text-[10px] font-bold text-slate-500 block">Itens: {cart.length}</span>
                              <span className="text-xs font-black text-emerald-400 uppercase">Pronto para Finalizar</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 shrink-0 pt-4 border-t border-slate-100 dark:border-slate-700">
                        <button onClick={handleSaveBudget} className="py-4 bg-white dark:bg-gray-700 text-slate-800 dark:text-white font-black rounded-2xl border border-slate-200 dark:border-gray-600 text-xs shadow-sm hover:bg-slate-50 transition-all flex flex-col items-center justify-center gap-1 cursor-pointer">
                          <Save size={16} /> SALVAR ORÇAMENTO
                        </button>
                        <button
                          onClick={handleFinalizeOrder}
                          disabled={isSubmitting}
                          className={`py-4 ${isSubmitting ? 'bg-cyan-800 cursor-not-allowed' : 'bg-cyan-600 hover:bg-cyan-700'} text-white font-black rounded-2xl shadow-lg shadow-cyan-600/30 text-xs transition-all flex flex-col items-center justify-center gap-1 cursor-pointer`}
                        >
                          {isSubmitting ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></div>
                          ) : (
                            <>
                              <CheckCircle size={16} /> FINALIZAR VENDA
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : activeTab === 'budgets' ? (
        /* Aba de Orçamentos */
        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden flex-1 flex flex-col animate-in slide-in-from-right duration-500">
          <div className="p-6 border-b dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-800/50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-600 rounded-xl text-white shadow-lg shadow-orange-600/20"><FileText size={20} /></div>
              <h3 className="font-black text-lg text-slate-800 dark:text-white">Gestão de Orçamentos</h3>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={budgetSearchTerm}
                  onChange={e => setBudgetSearchTerm(e.target.value)}
                  className="pl-9 pr-4 py-2 bg-white dark:bg-gray-700 border-none rounded-xl text-xs font-bold shadow-sm"
                  placeholder="Buscar por cliente, ID, item..."
                />
              </div>
              <select
                value={budgetStatusFilter}
                onChange={e => setBudgetStatusFilter(e.target.value as any)}
                className="py-2 px-3 bg-white dark:bg-gray-700 border-none rounded-xl text-xs font-bold shadow-sm text-slate-700 dark:text-slate-200 cursor-pointer"
              >
                <option value="all">Status: Todos</option>
                <option value="Aberto">Aberto</option>
                <option value="Aprovado">Aprovado</option>
                <option value="Rejeitado">Rejeitado</option>
                <option value="Convertido">Convertido</option>
              </select>
              <div className="relative">
                <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="date"
                  value={budgetDateFilter}
                  onChange={e => setBudgetDateFilter(e.target.value)}
                  className="pl-9 pr-4 py-2 bg-white dark:bg-gray-700 border-none rounded-xl text-xs font-bold shadow-sm"
                />
              </div>
              {(budgetSearchTerm || budgetStatusFilter !== 'all' || budgetDateFilter) && (
                <button
                  onClick={() => {
                    setBudgetSearchTerm('');
                    setBudgetStatusFilter('all');
                    setBudgetDateFilter('');
                  }}
                  title="Limpar filtros"
                  className="p-2 bg-slate-200 dark:bg-gray-600 text-slate-600 dark:text-slate-200 rounded-xl hover:bg-slate-300 transition-all cursor-pointer"
                >
                  <RotateCcw size={14} />
                </button>
              )}
              <button
                onClick={handleExportBudgets}
                title="Exportar orçamentos para CSV"
                className="p-2 bg-white dark:bg-gray-700 text-slate-600 dark:text-slate-200 hover:text-emerald-600 rounded-xl shadow-sm transition-all cursor-pointer"
              >
                <Download size={16} />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto flex-1 custom-scrollbar">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 dark:bg-gray-800 text-[10px] font-black text-slate-400 uppercase border-b dark:border-gray-700">
                <tr>
                  <th className="px-6 py-4">ID / Data</th>
                  <th className="px-6 py-4">Cliente Solicitante</th>
                  <th className="px-6 py-4 text-right">Valor Total</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-center">Validade</th>
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-gray-700">
                {filteredBudgets.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center gap-4 opacity-40">
                        <FileText size={64} strokeWidth={1} />
                        <p className="font-black text-slate-500">Nenhum orçamento encontrado com os filtros aplicados</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredBudgets.map(b => (
                    <tr key={b.id} className="group hover:bg-slate-50 dark:hover:bg-gray-700/50 transition-all">
                      <td className="px-6 py-5">
                        <p className="font-mono text-[10px] text-slate-400">#{b.id.split('-')[1]?.slice(-6) || b.id}</p>
                        <p className="font-bold text-slate-600 dark:text-slate-300">{b.date}</p>
                      </td>
                      <td className="px-6 py-5 font-black text-slate-900 dark:text-white">{b.clientName}</td>
                      <td className="px-6 py-5 text-right font-black text-lg text-orange-600">{formatMoney(b.total)}</td>
                      <td className="px-6 py-5 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase ${b.status === 'Aberto' ? 'bg-orange-100 text-orange-700' : b.status === 'Aprovado' ? 'bg-emerald-100 text-emerald-700' : b.status === 'Rejeitado' ? 'bg-rose-100 text-rose-700' : 'bg-green-100 text-green-700'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${b.status === 'Aberto' ? 'bg-orange-600' : b.status === 'Aprovado' ? 'bg-emerald-600' : b.status === 'Rejeitado' ? 'bg-rose-600' : 'bg-green-600'}`}></span>
                          {b.status}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-center text-xs font-bold text-slate-500">{b.expiryDate}</td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-20 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => setSelectedBudget(b)} className="p-2 text-slate-400 hover:text-cyan-600 hover:bg-white rounded-lg transition-all" title="Ver Detalhes"><Eye size={18} /></button>
                          <button onClick={() => handlePrintBudget(b)} className="p-2 text-slate-400 hover:text-cyan-600 hover:bg-white rounded-lg transition-all" title="Imprimir Orçamento"><Printer size={18} /></button>
                          {b.status === 'Aberto' && (
                            <>
                              <button
                                onClick={() => {
                                  setEditingBudgetId(b.id);
                                  setCart(b.items);
                                  setSelectedClient(b.clientId);
                                  setDiscount((b.discount || 0).toString());
                                  setActiveTab('new');
                                  setShowCheckout(true);
                                }}
                                className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all"
                                title="Editar Orçamento"
                              >
                                <MoreVertical size={18} className="rotate-90" />
                              </button>
                              <button
                                onClick={() => handleUpdateBudgetStatus(b.id, 'Aprovado')}
                                className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                                title="Aprovar Orçamento"
                              >
                                <CheckCircle size={18} />
                              </button>
                              <button
                                onClick={() => handleUpdateBudgetStatus(b.id, 'Rejeitado')}
                                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                                title="Rejeitar Orçamento"
                              >
                                <XCircle size={18} />
                              </button>
                            </>
                          )}
                          {b.status === 'Rejeitado' && (
                            <button
                              onClick={() => handleUpdateBudgetStatus(b.id, 'Aberto')}
                              className="p-2 text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-all"
                              title="Reabrir Orçamento"
                            >
                              <RefreshCw size={18} />
                            </button>
                          )}
                          {(b.status === 'Aberto' || b.status === 'Aprovado') && (
                            <button
                              onClick={() => handleConvertBudgetToSale(b)}
                              className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-600 hover:text-white transition-all"
                              title="Converter em Venda"
                            >
                              <CheckCircle size={18} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Aba de Histórico de Vendas */
        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden flex-1 flex flex-col animate-in fade-in duration-500">
          <div className="p-6 border-b dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-800/50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-600 rounded-xl text-white shadow-lg shadow-emerald-600/20"><RefreshCw size={20} /></div>
              <h3 className="font-black text-lg text-slate-800 dark:text-white">Relatório de Vendas</h3>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-cyan-600" size={16} />
                <input
                  type="text"
                  placeholder="Buscar cliente, ID, produto..."
                  className="pl-9 pr-4 py-2.5 bg-white dark:bg-gray-700 border-none rounded-xl text-xs font-bold shadow-sm w-48 sm:w-56"
                  value={historySearchTerm}
                  onChange={(e) => setHistorySearchTerm(e.target.value)}
                />
              </div>
              <select
                value={historyStatusFilter}
                onChange={e => setHistoryStatusFilter(e.target.value as any)}
                className="py-2.5 px-3 bg-white dark:bg-gray-700 border-none rounded-xl text-xs font-bold shadow-sm text-slate-700 dark:text-slate-200 cursor-pointer"
              >
                <option value="all">Status: Todos</option>
                <option value="Conciliado">Conciliado</option>
                <option value="Pendente">Pendente</option>
              </select>
              <select
                value={historyPaymentFilter}
                onChange={e => setHistoryPaymentFilter(e.target.value as any)}
                className="py-2.5 px-3 bg-white dark:bg-gray-700 border-none rounded-xl text-xs font-bold shadow-sm text-slate-700 dark:text-slate-200 cursor-pointer"
              >
                <option value="all">Pagamento: Todos</option>
                <option value="money">Dinheiro</option>
                <option value="pix">PIX</option>
                <option value="credit">Cartão</option>
                <option value="boleto">Boleto</option>
                <option value="prazo">A Prazo</option>
                <option value="transfer">Transferência</option>
              </select>
              <div className="relative">
                <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="date"
                  className="pl-9 pr-4 py-2.5 bg-white dark:bg-gray-700 border-none rounded-xl text-xs font-bold shadow-sm"
                  value={historyDate}
                  onChange={(e) => setHistoryDate(e.target.value)}
                />
              </div>
              {(historySearchTerm || historyStatusFilter !== 'all' || historyPaymentFilter !== 'all' || historyDate) && (
                <button
                  onClick={() => {
                    setHistorySearchTerm('');
                    setHistoryStatusFilter('all');
                    setHistoryPaymentFilter('all');
                    setHistoryDate('');
                  }}
                  title="Limpar filtros"
                  className="p-2.5 bg-slate-200 dark:bg-gray-600 text-slate-600 dark:text-slate-200 rounded-xl hover:bg-slate-300 transition-all cursor-pointer"
                >
                  <RotateCcw size={14} />
                </button>
              )}
              <button
                onClick={handleExportHistory}
                title="Exportar vendas para CSV"
                className="p-2.5 bg-white dark:bg-gray-700 text-slate-600 dark:text-slate-200 hover:text-emerald-600 rounded-xl shadow-sm transition-all cursor-pointer"
              >
                <Download size={16} />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto flex-1 custom-scrollbar">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 dark:bg-gray-800 text-[10px] font-black text-slate-400 uppercase border-b dark:border-gray-700">
                <tr>
                  <th className="px-6 py-4">Status / Data</th>
                  <th className="px-6 py-4">Cliente Atendido</th>
                  <th className="px-6 py-4 text-center">Itens / Volume</th>
                  <th className="px-6 py-4 text-right">Valor Final</th>
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-gray-700">
                {filteredHistory.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-20 text-center opacity-40">
                      <RefreshCw size={50} className="mx-auto mb-4 animate-spin-slow" />
                      <p className="font-black text-slate-500 uppercase tracking-widest text-xs">Sem lançamentos para os filtros aplicados</p>
                    </td>
                  </tr>
                ) : (
                  filteredHistory.map(sale => (
                    <tr key={sale.id} className="group hover:bg-slate-50 dark:hover:bg-gray-700 transition-all border-l-4 border-transparent hover:border-cyan-500">
                      <td className="px-6 py-5">
                        <div className="flex flex-col">
                          <span className={`inline-flex items-center gap-1 text-[10px] font-black uppercase mb-1 ${sale.status === 'Pendente' ? 'text-amber-600' : 'text-green-600'}`}>
                            <CheckCircle size={10} /> {sale.status || 'Concluída'}
                          </span>
                          <span className="text-sm font-bold text-slate-400">{sale.date}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <p className="font-black text-slate-900 dark:text-white">{sale.clientName || 'Cliente Avulso'}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">PEDIDO #{String(sale.id).slice(-6).toUpperCase()}</p>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 dark:bg-gray-700 rounded-full">
                          <Package size={14} className="text-slate-400" />
                          <span className="text-xs font-black text-slate-700 dark:text-gray-300">{(sale.items || []).length} ITENS</span>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <p className="font-black text-lg text-slate-900 dark:text-white">{formatMoney(sale.amount)}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{getPaymentMethodLabel(sale.paymentMethod)}</p>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => setSelectedSale(sale)} className="p-2.5 bg-white dark:bg-gray-700 rounded-xl shadow-sm border dark:border-gray-600 text-slate-400 hover:text-cyan-600 transition-all" title="Ver Detalhes"><Eye size={18} /></button>
                          <button onClick={() => setShowNFE({ type: 'sale', data: sale })} className="p-2.5 bg-white dark:bg-gray-700 rounded-xl shadow-sm border dark:border-gray-600 text-slate-400 hover:text-cyan-600 transition-all" title="Gerar DANFE"><FileSearch size={18} /></button>
                          <button onClick={() => handlePrintSale(sale)} className="p-2.5 bg-white dark:bg-gray-700 rounded-xl shadow-sm border dark:border-gray-600 text-slate-400 hover:text-cyan-600 transition-all" title="Imprimir Recibo"><Printer size={18} /></button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sales;
