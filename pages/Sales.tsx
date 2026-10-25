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
  TrendingDown,
  Target,
  RotateCcw,
  UserPlus,
  Percent,
  Settings,
  Sparkles,
  Filter
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';
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

const parseSafeDate = (dateStr?: string | null): Date | null => {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const trimmed = dateStr.trim();
  if (trimmed.includes('/')) {
    const parts = trimmed.split('/').map(p => parseInt(p, 10));
    if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
      return new Date(parts[2], parts[1] - 1, parts[0]);
    }
  }
  if (trimmed.includes('-')) {
    const parts = trimmed.split('-').map(p => parseInt(p, 10));
    if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
      return new Date(parts[0], parts[1] - 1, parts[2]);
    }
  }
  const d = new Date(trimmed);
  return isNaN(d.getTime()) ? null : d;
};

/**
 * Gera payload no padrão EMV do Banco Central do Brasil para PIX Estático (Copia e Cola).
 */
export const generatePixPayload = (key: string, name: string, city: string, amount: number, txid = 'INFRACORE'): string => {
  const f = (id: string, val: string) => id + String(val.length).padStart(2, '0') + val;
  const cleanKey = (key || '').trim();
  if (!cleanKey) return '';
  const cleanName = (name || 'INFRACORE')
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z0-9 ]/g, '')
    .trim()
    .substring(0, 25)
    .toUpperCase() || 'INFRACORE';
  const cleanCity = (city || 'CIDADE')
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z0-9 ]/g, '')
    .trim()
    .substring(0, 15)
    .toUpperCase() || 'BRASIL';
  const cleanTxid = (txid || 'INFRACORE').replace(/[^A-Za-z0-9]/g, '').substring(0, 25) || 'INFRACORE';
  const formattedAmount = amount > 0 ? amount.toFixed(2) : '';

  const gui = f('00', 'br.gov.bcb.pix');
  const k = f('01', cleanKey);
  const mai = f('26', gui + k);
  const mcc = f('52', '0000');
  const curr = f('53', '986');
  const amt = formattedAmount ? f('54', formattedAmount) : '';
  const cc = f('58', 'BR');
  const nm = f('59', cleanName);
  const ct = f('60', cleanCity);
  const add = f('62', f('05', cleanTxid));

  const payloadNoCRC = f('00', '01') + mai + mcc + curr + amt + cc + nm + ct + add + '6304';

  let crc = 0xFFFF;
  for (let i = 0; i < payloadNoCRC.length; i++) {
    crc ^= (payloadNoCRC.charCodeAt(i) << 8);
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xFFFF;
      } else {
        crc = (crc << 1) & 0xFFFF;
      }
    }
  }
  const crcHex = crc.toString(16).toUpperCase().padStart(4, '0');
  return payloadNoCRC + crcHex;
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

  // ==========================================
  // PAINEL GERENCIAL (METAS, KPIS, RECHARTS E CURVA ABC)
  // ==========================================

  // Metas Segmentadas (Salvas em LocalStorage)
  const [commercialTargets, setCommercialTargets] = useState<{ minimum: number; target: number; super: number }>(() => {
    try {
      const saved = localStorage.getItem('infracore_sales_commercial_targets');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (
          parsed &&
          typeof parsed.minimum === 'number' &&
          typeof parsed.target === 'number' &&
          typeof parsed.super === 'number'
        ) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Error loading commercial targets:', e);
    }
    return { minimum: 70000, target: 100000, super: 130000 };
  });

  const [showTargetModal, setShowTargetModal] = useState(false);
  const [tempTargets, setTempTargets] = useState(commercialTargets);

  const handleOpenTargetModal = () => {
    setTempTargets({ ...commercialTargets });
    setShowTargetModal(true);
  };

  const handleSaveTargets = () => {
    if (tempTargets.minimum <= 0 || tempTargets.target <= 0 || tempTargets.super <= 0) {
      addToast('Os valores das metas devem ser maiores que zero.', 'warning');
      return;
    }
    if (tempTargets.minimum >= tempTargets.target || tempTargets.target >= tempTargets.super) {
      addToast('A hierarquia deve respeitar: Meta Mínima < Meta Alvo < Supermeta.', 'warning');
      return;
    }
    setCommercialTargets(tempTargets);
    try {
      localStorage.setItem('infracore_sales_commercial_targets', JSON.stringify(tempTargets));
      addToast('Metas comerciais atualizadas com sucesso!', 'success');
      setShowTargetModal(false);
    } catch (e) {
      addToast('Erro ao salvar configurações de metas.', 'error');
    }
  };

  // Filtros de Período do Painel Gerencial
  type PeriodFilterType = 'today' | '7days' | 'thisMonth' | 'lastMonth' | 'custom';
  const [periodFilter, setPeriodFilter] = useState<PeriodFilterType>('thisMonth');
  const [customStartDate, setCustomStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split('T')[0];
  });
  const [customEndDate, setCustomEndDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

  const { currentRange, previousRange, periodLabel } = useMemo(() => {
    const now = new Date();
    let cStart: Date;
    let cEnd: Date;
    let pStart: Date;
    let pEnd: Date;
    let label = 'Mês Atual';

    if (periodFilter === 'today') {
      cStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      cEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      pStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0, 0);
      pEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999);
      label = 'Hoje';
    } else if (periodFilter === '7days') {
      cStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6, 0, 0, 0, 0);
      cEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      pStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 13, 0, 0, 0, 0);
      pEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7, 23, 59, 59, 999);
      label = 'Últimos 7 Dias';
    } else if (periodFilter === 'lastMonth') {
      cStart = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
      cEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      pStart = new Date(now.getFullYear(), now.getMonth() - 2, 1, 0, 0, 0, 0);
      pEnd = new Date(now.getFullYear(), now.getMonth() - 1, 0, 23, 59, 59, 999);
      label = 'Mês Anterior';
    } else if (periodFilter === 'custom') {
      const s = parseSafeDate(customStartDate);
      const e = parseSafeDate(customEndDate);
      cStart = s ? new Date(s.getFullYear(), s.getMonth(), s.getDate(), 0, 0, 0, 0) : new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      cEnd = e ? new Date(e.getFullYear(), e.getMonth(), e.getDate(), 23, 59, 59, 999) : new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      const diff = Math.max(1000 * 60 * 60 * 24, cEnd.getTime() - cStart.getTime());
      pEnd = new Date(cStart.getTime() - 1);
      pStart = new Date(pEnd.getTime() - diff);
      label = 'Personalizado';
    } else {
      // thisMonth
      cStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      cEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      pStart = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
      pEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      label = 'Mês Atual';
    }

    return {
      currentRange: { start: cStart, end: cEnd },
      previousRange: { start: pStart, end: pEnd },
      periodLabel: label
    };
  }, [periodFilter, customStartDate, customEndDate]);

  const isWithinDateRange = (dateStr?: string, range?: { start: Date; end: Date }) => {
    if (!dateStr || !range) return false;
    const d = parseSafeDate(dateStr);
    if (!d) return false;
    return d.getTime() >= range.start.getTime() && d.getTime() <= range.end.getTime();
  };

  const periodSales = useMemo(() => {
    return (validSales || []).filter(s => isWithinDateRange(s.date, currentRange));
  }, [validSales, currentRange]);

  const prevPeriodSales = useMemo(() => {
    return (validSales || []).filter(s => isWithinDateRange(s.date, previousRange));
  }, [validSales, previousRange]);

  const periodBudgets = useMemo(() => {
    return (validBudgets || []).filter(b => isWithinDateRange(b.date, currentRange));
  }, [validBudgets, currentRange]);

  // 4 KPIs Superiores Sincronizados
  const dashboardKpis = useMemo(() => {
    const currentRevenue = periodSales.reduce((acc, s) => acc + (Number(s.amount) || 0), 0);
    const prevRevenue = prevPeriodSales.reduce((acc, s) => acc + (Number(s.amount) || 0), 0);
    const revenueDelta = prevRevenue > 0
      ? ((currentRevenue - prevRevenue) / prevRevenue) * 100
      : (currentRevenue > 0 ? 100 : 0);

    const currentCount = periodSales.length;
    const prevCount = prevPeriodSales.length;
    const countDelta = prevCount > 0
      ? ((currentCount - prevCount) / prevCount) * 100
      : (currentCount > 0 ? 100 : 0);

    const currentTicket = currentCount > 0 ? currentRevenue / currentCount : 0;
    const prevTicket = prevCount > 0 ? prevRevenue / prevCount : 0;
    const ticketDelta = prevTicket > 0
      ? ((currentTicket - prevTicket) / prevTicket) * 100
      : (currentTicket > 0 ? 100 : 0);

    const totalBudgets = periodBudgets.length;
    const convertedBudgets = periodBudgets.filter(b => b.status === 'Convertido').length;
    const pendingBudgets = periodBudgets.filter(b => b.status === 'Aberto').length;
    const conversionRate = totalBudgets > 0 ? Math.round((convertedBudgets / totalBudgets) * 100) : 0;

    return {
      currentRevenue,
      prevRevenue,
      revenueDelta,
      currentCount,
      prevCount,
      countDelta,
      currentTicket,
      prevTicket,
      ticketDelta,
      totalBudgets,
      convertedBudgets,
      pendingBudgets,
      conversionRate
    };
  }, [periodSales, prevPeriodSales, periodBudgets]);

  // Velocidade Comercial e Projeção Mensal
  const commercialVelocity = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const currentDay = now.getDate();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysElapsed = Math.max(1, currentDay);
    const daysRemaining = Math.max(0, daysInMonth - currentDay);

    const monthSales = (validSales || []).filter(s => {
      const d = parseSafeDate(s.date);
      return d && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });
    const monthTotal = monthSales.reduce((acc, s) => acc + (Number(s.amount) || 0), 0);

    const dailyAvg = monthTotal / daysElapsed;
    const projectedTotal = dailyAvg * daysInMonth;

    const remainingToMin = Math.max(0, commercialTargets.minimum - monthTotal);
    const neededRateMin = daysRemaining > 0 ? remainingToMin / daysRemaining : 0;

    const remainingToTarget = Math.max(0, commercialTargets.target - monthTotal);
    const neededRateTarget = daysRemaining > 0 ? remainingToTarget / daysRemaining : 0;

    const remainingToSuper = Math.max(0, commercialTargets.super - monthTotal);
    const neededRateSuper = daysRemaining > 0 ? remainingToSuper / daysRemaining : 0;

    const pctMin = Math.min(100, Math.round((monthTotal / Math.max(commercialTargets.minimum, 1)) * 100));
    const pctTarget = Math.min(100, Math.round((monthTotal / Math.max(commercialTargets.target, 1)) * 100));
    const pctSuper = Math.min(100, Math.round((monthTotal / Math.max(commercialTargets.super, 1)) * 100));

    return {
      monthTotal,
      daysElapsed,
      daysRemaining,
      daysInMonth,
      dailyAvg,
      projectedTotal,
      neededRateMin,
      neededRateTarget,
      neededRateSuper,
      pctMin,
      pctTarget,
      pctSuper
    };
  }, [validSales, commercialTargets]);

  // Gráfico de Evolução Temporal
  const salesEvolutionData = useMemo(() => {
    const dayMap: Record<string, { dateLabel: string; faturamento: number; pedidos: number; rawDate: Date }> = {};
    const start = new Date(currentRange.start);
    const end = new Date(currentRange.end);
    const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays <= 62) {
      const cur = new Date(start);
      while (cur <= end) {
        const key = `${String(cur.getDate()).padStart(2, '0')}/${String(cur.getMonth() + 1).padStart(2, '0')}`;
        dayMap[key] = {
          dateLabel: key,
          faturamento: 0,
          pedidos: 0,
          rawDate: new Date(cur)
        };
        cur.setDate(cur.getDate() + 1);
      }
    }

    periodSales.forEach(s => {
      const d = parseSafeDate(s.date);
      if (!d) return;
      const key = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!dayMap[key]) {
        dayMap[key] = {
          dateLabel: key,
          faturamento: 0,
          pedidos: 0,
          rawDate: d
        };
      }
      dayMap[key].faturamento += Number(s.amount) || 0;
      dayMap[key].pedidos += 1;
    });

    return Object.values(dayMap).sort((a, b) => a.rawDate.getTime() - b.rawDate.getTime());
  }, [periodSales, currentRange]);

  // Gráfico de Distribuição por Forma de Pagamento
  const paymentDistributionData = useMemo(() => {
    const methodMap: Record<string, { name: string; value: number; count: number; color: string }> = {
      pix: { name: 'PIX', value: 0, count: 0, color: '#06b6d4' },
      prazo: { name: 'A Prazo', value: 0, count: 0, color: '#10b981' },
      credit: { name: 'Cartão', value: 0, count: 0, color: '#8b5cf6' },
      boleto: { name: 'Boleto', value: 0, count: 0, color: '#f59e0b' },
      money: { name: 'Dinheiro', value: 0, count: 0, color: '#3b82f6' },
      transfer: { name: 'Transferência', value: 0, count: 0, color: '#ec4899' },
      other: { name: 'Outros', value: 0, count: 0, color: '#64748b' }
    };

    let totalRevenue = 0;
    periodSales.forEach(s => {
      const methodKey = (s.paymentMethod || '').toLowerCase();
      const target = methodMap[methodKey] || methodMap['other'];
      const amt = Number(s.amount) || 0;
      target.value += amt;
      target.count += 1;
      totalRevenue += amt;
    });

    return Object.values(methodMap)
      .filter(m => m.value > 0)
      .map(m => ({
        ...m,
        percent: totalRevenue > 0 ? (m.value / totalRevenue) * 100 : 0
      }))
      .sort((a, b) => b.value - a.value);
  }, [periodSales]);

  // Curva ABC de Produtos e Clientes
  const [abcTab, setAbcTab] = useState<'products' | 'clients'>('products');
  const [abcSearch, setAbcSearch] = useState('');

  const abcProducts = useMemo(() => {
    const productMap: Record<string, { name: string; quantity: number; revenue: number; unit?: string }> = {};
    (periodSales || []).forEach(s => {
      (s.items || []).forEach(item => {
        if (!item || !item.name) return;
        const key = item.name.trim();
        if (!productMap[key]) {
          productMap[key] = {
            name: key,
            quantity: 0,
            revenue: 0,
            unit: item.unit || 'UN'
          };
        }
        const q = Number(item.quantity) || 0;
        const rev = Number((item as any).total) || (q * (Number(item.price) || 0));
        productMap[key].quantity += q;
        productMap[key].revenue += rev;
      });
    });

    const sorted = Object.values(productMap).sort((a, b) => b.revenue - a.revenue);
    const totalRev = sorted.reduce((sum, p) => sum + p.revenue, 0);

    let cumulative = 0;
    return sorted.map((p, idx) => {
      const share = totalRev > 0 ? (p.revenue / totalRev) * 100 : 0;
      cumulative += share;
      let classification: 'A' | 'B' | 'C' = 'C';
      if (cumulative <= 80 || idx === 0) {
        classification = 'A';
      } else if (cumulative <= 95) {
        classification = 'B';
      } else {
        classification = 'C';
      }
      return {
        ...p,
        rank: idx + 1,
        share,
        cumulative,
        classification
      };
    });
  }, [periodSales]);

  const abcClients = useMemo(() => {
    const clientMap: Record<string, { name: string; orders: number; revenue: number }> = {};
    (periodSales || []).forEach(s => {
      const name = (s.clientName || 'Cliente Avulso').trim();
      if (!clientMap[name]) {
        clientMap[name] = { name, orders: 0, revenue: 0 };
      }
      clientMap[name].orders += 1;
      clientMap[name].revenue += Number(s.amount) || 0;
    });

    const sorted = Object.values(clientMap).sort((a, b) => b.revenue - a.revenue);
    const totalRev = sorted.reduce((sum, c) => sum + c.revenue, 0);

    let cumulative = 0;
    return sorted.map((c, idx) => {
      const share = totalRev > 0 ? (c.revenue / totalRev) * 100 : 0;
      cumulative += share;
      let classification: 'A' | 'B' | 'C' = 'C';
      if (cumulative <= 80 || idx === 0) {
        classification = 'A';
      } else if (cumulative <= 95) {
        classification = 'B';
      } else {
        classification = 'C';
      }
      return {
        ...c,
        rank: idx + 1,
        share,
        cumulative,
        classification
      };
    });
  }, [periodSales]);

  const filteredAbcProducts = useMemo(() => {
    if (!abcSearch.trim()) return abcProducts;
    const term = abcSearch.toLowerCase();
    return abcProducts.filter(p => p.name.toLowerCase().includes(term));
  }, [abcProducts, abcSearch]);

  const filteredAbcClients = useMemo(() => {
    if (!abcSearch.trim()) return abcClients;
    const term = abcSearch.toLowerCase();
    return abcClients.filter(c => c.name.toLowerCase().includes(term));
  }, [abcClients, abcSearch]);

  const abcSummary = useMemo(() => {
    const currentList = abcTab === 'products' ? abcProducts : abcClients;
    const faixaA = currentList.filter(i => i.classification === 'A');
    const faixaB = currentList.filter(i => i.classification === 'B');
    const faixaC = currentList.filter(i => i.classification === 'C');

    const revA = faixaA.reduce((sum, i) => sum + i.revenue, 0);
    const revB = faixaB.reduce((sum, i) => sum + i.revenue, 0);
    const revC = faixaC.reduce((sum, i) => sum + i.revenue, 0);
    const totalRev = revA + revB + revC;

    return {
      countA: faixaA.length,
      revA,
      pctA: totalRev > 0 ? (revA / totalRev) * 100 : 0,
      countB: faixaB.length,
      revB,
      pctB: totalRev > 0 ? (revB / totalRev) * 100 : 0,
      countC: faixaC.length,
      revC,
      pctC: totalRev > 0 ? (revC / totalRev) * 100 : 0,
      totalRev
    };
  }, [abcTab, abcProducts, abcClients]);

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

  // Helper to extract or generate purely numeric sequential ID for budgets
  const getBudgetNumericId = (b?: Budget | null): number => {
    if (!b) return 0;
    if ((b as any).budgetNumber && Number((b as any).budgetNumber) > 0) {
      return Number((b as any).budgetNumber);
    }
    const cleanId = String(b.id || '').trim();
    if (/^\d+$/.test(cleanId)) {
      return parseInt(cleanId, 10);
    }
    const digitsOnly = cleanId.replace(/\D/g, '');
    if (digitsOnly && digitsOnly.length <= 8 && parseInt(digitsOnly, 10) > 0) {
      return parseInt(digitsOnly, 10);
    }
    return 0;
  };

  const getBudgetDisplayId = (b?: Budget | null): string => {
    if (!b) return '';
    const num = getBudgetNumericId(b);
    if (num > 0) return String(num);
    if (Array.isArray(budgets)) {
      const sorted = [...budgets].sort((x, y) => (x.date || '').localeCompare(y.date || ''));
      const idx = sorted.findIndex(item => item.id === b.id);
      if (idx >= 0) return String(idx + 1);
    }
    return '1';
  };

  const getNextBudgetNumber = (): string => {
    if (!Array.isArray(budgets) || budgets.length === 0) return '1';
    const numbers = budgets.map(b => getBudgetNumericId(b)).filter(n => n > 0);
    if (numbers.length === 0) return '1';
    const maxNumber = Math.max(...numbers);
    return String(maxNumber + 1);
  };

  // Filtered Budgets with comprehensive search, status consistency and ascending numeric ordering
  const filteredBudgets = useMemo(() => {
    if (!Array.isArray(budgets)) return [];
    const formattedFilterDate = budgetDateFilter ? budgetDateFilter.split('-').reverse().join('/') : '';
    const term = budgetSearchTerm.toLowerCase().trim();

    const filtered = budgets.filter(b => {
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

      // Search term (Numeric ID, Client, Items, Payment)
      if (!term) return true;

      const numId = getBudgetDisplayId(b);
      const clientName = (b.clientName || '').toLowerCase();
      const budgetId = String(b.id || '').toLowerCase();
      const payment = (b.paymentMethod || '').toLowerCase();
      const itemsMatch = Array.isArray(b.items) && b.items.some(i => (i.name || '').toLowerCase().includes(term));

      return numId.includes(term) ||
        clientName.includes(term) ||
        budgetId.includes(term) ||
        payment.includes(term) ||
        itemsMatch;
    });

    // Ordenar em ordem crescente por numeração de identificação
    return filtered.sort((a, b) => {
      const numA = Number(getBudgetDisplayId(a)) || 0;
      const numB = Number(getBudgetDisplayId(b)) || 0;
      return numA - numB;
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
  const [freightType, setFreightType] = useState<'CIF' | 'FOB' | 'Sem Frete'>('FOB');
  const [deliveryDays, setDeliveryDays] = useState<number>(5);
  const [commercialNotes, setCommercialNotes] = useState('');

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

  // Effect to reset installments for instant payments and calculate due dates for deferred
  React.useEffect(() => {
    if (['money', 'pix', 'transfer'].includes(paymentMethod)) {
      setInstallments(1);
      setCustomDueDates([]);
    } else {
      const numInst = Math.max(1, installments || 1);
      setCustomDueDates(prev => {
        if (prev.length === numInst) return prev;
        return Array.from({ length: numInst }, (_, i) => {
          const d = new Date();
          d.setDate(d.getDate() + ((i + 1) * 30));
          return d.toISOString().split('T')[0];
        });
      });
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
    setFreightType('FOB');
    setDeliveryDays(5);
    setCommercialNotes('');
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
      if (!isPaid) {
        if (customDueDates.length > 0 && customDueDates[0]) {
          const parts = customDueDates[0].split('-');
          if (parts.length === 3) {
            finalDueDate = `${parts[2]}/${parts[1]}/${parts[0]}`;
          } else {
            finalDueDate = customDueDates[0];
          }
        } else {
          const term = Number(settings?.operational?.defaultPaymentTerm) || 30;
          const d = new Date();
          d.setDate(d.getDate() + term);
          finalDueDate = d.toLocaleDateString('pt-BR');
        }
      }

      const accountObj = financialAccounts.find(a => a.id === account) || financialAccounts[0] || { id: 'acc-1', name: 'Caixa Geral' };
      const selectedAccountId = account || accountObj.id;
      const selectedAccountName = accountObj.name || 'Caixa Geral';
      const safeInstallments = Math.max(1, installments || 1);

      addSale({
        id: saleId,
        date: new Date().toLocaleDateString('pt-BR'),
        dueDate: finalDueDate,
        description: `Venda Direta${vehicle ? ` - Veículo: ${vehicle.plate}` : ''}`,
        category: 'Vendas',
        accountId: selectedAccountId,
        account: selectedAccountName,
        amount: finalAmount,
        status: transactionStatus,
        type: 'Receita',
        clientId: selectedClient,
        clientName: client?.name || 'Cliente Avulso',
        items: finalItems,
        paymentMethod,
        installments: safeInstallments,
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

      const isEditing = Boolean(editingBudgetId);
      const nextNumStr = getNextBudgetNumber();
      const budgetIdToUse = isEditing ? editingBudgetId! : nextNumStr;
      const budgetNumToUse = Number(budgetIdToUse.replace(/\D/g, '')) || Number(nextNumStr);

      const newBudget: Budget = {
        id: budgetIdToUse,
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
        paymentMethod: paymentMethod,
        installments: installments,
        budgetNumber: budgetNumToUse,
        freightType: freightType,
        deliveryDays: deliveryDays,
        commercialNotes: commercialNotes
      } as any;

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
    const displayNum = getBudgetDisplayId(budget);
    if (budget.status === 'Convertido') {
      addToast(`O orçamento #${displayNum} já foi convertido anteriormente.`, 'warning');
      return;
    }

    addToast(`Deseja converter o orçamento #${displayNum} em uma venda definitiva?`, 'info', 10000, {
      label: 'CONFIRMAR',
      onClick: () => {
        try {
          const paymentMethod = budget.paymentMethod || 'credit';
          const isPaid = ['money', 'pix', 'debit', 'transfer'].includes(paymentMethod);
          const status = isPaid ? 'Conciliado' : 'Pendente';
          const numInst = (budget as any).installments && Number((budget as any).installments) > 1 ? Number((budget as any).installments) : 1;

          let conversionDueDate: string | undefined = undefined;
          const instDueDates: string[] = [];
          if (!isPaid) {
            const term = Number(settings?.operational?.defaultPaymentTerm) || 30;
            const d = new Date();
            d.setDate(d.getDate() + term);
            conversionDueDate = d.toLocaleDateString('pt-BR');

            if (numInst > 1) {
              for (let i = 1; i <= numInst; i++) {
                const id = new Date();
                id.setDate(id.getDate() + (i * 30));
                instDueDates.push(id.toISOString().split('T')[0]);
              }
            }
          }

          const targetAcc = financialAccounts[0] || { id: 'acc-1', name: 'Caixa Geral' };

          addSale({
            id: `S-${Date.now()}`,
            date: new Date().toLocaleDateString('pt-BR'),
            dueDate: conversionDueDate,
            description: `Conversão de Orçamento #${displayNum}`,
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
            installments: numInst,
            installmentDueDates: instDueDates.length > 0 ? instDueDates : undefined,
            originModule: 'Vendas',
            originId: budget.id,
            ledgerCode: '1.01.01',
            ledgerName: 'Vendas de Mercadorias',
            freightType: (budget as any).freightType,
            deliveryDays: (budget as any).deliveryDays,
            commercialNotes: (budget as any).commercialNotes,
            tareWeight: budget.tareWeight,
            grossWeight: budget.grossWeight,
            netWeight: budget.netWeight,
            weightNotes: budget.weightNotes
          } as any);

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
        ID: getBudgetDisplayId(b),
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

  // Impressão da Proposta Comercial Executiva (Layout A4 Corporativo)
  const handlePrintBudget = (budget: Budget) => {
    const company = settings || {
      companyName: 'INFRACORE ERP SISTEMAS LTDA',
      tradeName: 'InfraCore ERP',
      document: '00.000.000/0001-00',
      email: 'comercial@infracore.com.br',
      phone: '(11) 4002-8922',
      address: 'Av. Industrial, 1200 - Distrito Industrial, São Paulo - SP',
      bankDetails: {
        bankName: 'Banco Inter / Santander',
        agency: '0001',
        account: '1234567-8',
        pixKey: 'financeiro@infracore.com.br',
        pixType: 'E-mail'
      }
    } as AppSettings;

    const client = (clients || []).find(c => c.id === budget.clientId);
    const budgetExtended = budget as any;
    const freight = budgetExtended.freightType || 'FOB';
    const freightLabel = freight === 'CIF' ? 'CIF (Frete Incluso por conta do Emitente)' :
      freight === 'Sem Frete' ? 'Sem Frete / Retirada no Local' :
      'FOB (Frete a pagar por conta do Destinatário)';
    const deliveryTerm = budgetExtended.deliveryDays ? `${budgetExtended.deliveryDays} dias úteis após confirmação/aceite` : '5 a 7 dias úteis após confirmação/aceite';
    const commercialNotes = budgetExtended.commercialNotes || '';
    const paymentLabel = getPaymentMethodLabel(budget.paymentMethod) || 'A Combinar';
    const numInstallments = budgetExtended.installments && Number(budgetExtended.installments) > 1 ? `${budgetExtended.installments}x` : 'À Vista';

    const bank = company.bankDetails || {
      bankName: 'Banco Padrão',
      agency: '0001',
      account: '00000-0',
      pixKey: company.email || 'financeiro@infracore.com.br',
      pixType: 'Chave Principal'
    };

    const pixKey = bank.pixKey || company.document || company.email || 'comercial@infracore.com.br';
    const pixPayload = generatePixPayload(
      pixKey,
      company.tradeName || company.companyName,
      'SAO PAULO',
      budget.total,
      getBudgetDisplayId(budget)
    );
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&margin=0&data=${encodeURIComponent(pixPayload || pixKey)}`;

    let clientAddressStr = 'Não Informado';
    if (client && client.address) {
      const a = client.address;
      const parts = [
        a.street ? `${a.street}${a.number ? `, ${a.number}` : ''}` : '',
        a.district ? `Bairro ${a.district}` : '',
        a.city ? `${a.city}${a.state ? `/${a.state}` : ''}` : '',
        a.zipCode ? `CEP: ${formatCEP(a.zipCode)}` : ''
      ].filter(Boolean);
      if (parts.length > 0) clientAddressStr = parts.join(' - ');
    }

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <title>Proposta Comercial #${getBudgetDisplayId(budget)} - ${budget.clientName}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
    
    @page {
      size: A4 portrait;
      margin: 10mm 12mm 12mm 12mm;
    }
    
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #0f172a;
      background: #ffffff;
      margin: 0;
      padding: 0;
      font-size: 10.5px;
      line-height: 1.4;
    }

    .container {
      width: 100%;
      max-width: 100%;
      margin: 0 auto;
    }

    .header-table {
      width: 100%;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 10px;
      margin-bottom: 12px;
    }

    .company-name {
      font-size: 18px;
      font-weight: 900;
      color: #0f172a;
      letter-spacing: -0.02em;
      margin: 0 0 2px 0;
      text-transform: uppercase;
    }

    .company-sub {
      font-size: 9.5px;
      color: #334155;
      margin: 1px 0;
    }

    .doc-badge-container {
      text-align: right;
    }

    .doc-type-pill {
      display: inline-block;
      background: #0f172a;
      color: #ffffff;
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      padding: 3px 10px;
      border-radius: 3px;
      margin-bottom: 4px;
    }

    .doc-id {
      font-size: 15px;
      font-weight: 900;
      color: #0f172a;
      margin: 1px 0;
    }

    .doc-date {
      font-size: 9.5px;
      color: #475569;
      margin: 1px 0;
    }

    .card-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin-bottom: 12px;
      page-break-inside: avoid;
    }

    .card {
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 4px;
      padding: 8px 12px;
    }

    .card-title {
      font-size: 8.5px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #0f172a;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 3px;
      margin: 0 0 6px 0;
      display: flex;
      justify-content: space-between;
    }

    .card-row {
      margin: 2.5px 0;
      font-size: 10px;
      color: #334155;
    }

    .card-row strong {
      color: #0f172a;
      font-weight: 700;
    }

    .badge-status {
      display: inline-block;
      padding: 1px 6px;
      border-radius: 3px;
      font-size: 8.5px;
      font-weight: 700;
      text-transform: uppercase;
      border: 1px solid #94a3b8;
      color: #0f172a;
    }

    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 12px;
      page-break-inside: auto;
    }

    .items-table thead th {
      background: #0f172a;
      color: #ffffff;
      font-size: 8.5px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      padding: 6px 8px;
      text-align: left;
    }

    .items-table thead th.text-right {
      text-align: right;
    }

    .items-table thead th.text-center {
      text-align: center;
    }

    .items-table tbody tr {
      border-bottom: 1px solid #e2e8f0;
      page-break-inside: avoid;
    }

    .items-table tbody tr:nth-child(even) {
      background: #fbfcfe;
    }

    .items-table tbody td {
      padding: 6px 8px;
      font-size: 9.5px;
      color: #0f172a;
      vertical-align: middle;
    }

    .financial-totals-block {
      border: 1px solid #cbd5e1;
      border-radius: 4px;
      padding: 10px 12px;
      margin-bottom: 12px;
      page-break-inside: avoid;
      display: grid;
      grid-template-columns: 1fr 1.1fr;
      gap: 16px;
      align-items: center;
    }

    .bank-details-clean h4 {
      margin: 0 0 4px 0;
      font-size: 9px;
      font-weight: 800;
      color: #0f172a;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .bank-grid-clean {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 4px 10px;
      font-size: 9.5px;
      color: #334155;
    }

    .pix-copia-cola-line {
      margin-top: 5px;
      font-size: 8px;
      font-family: monospace;
      color: #475569;
      background: #f8fafc;
      padding: 3px 6px;
      border-radius: 3px;
      border: 1px dashed #cbd5e1;
      word-break: break-all;
    }

    .totals-and-qr-box {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 14px;
      border-left: 1px solid #e2e8f0;
      padding-left: 14px;
    }

    .qr-discreet {
      text-align: center;
      flex-shrink: 0;
    }

    .qr-discreet img {
      width: 55px;
      height: 55px;
      display: block;
      margin: 0 auto;
      border: 1px solid #94a3b8;
      border-radius: 3px;
      padding: 2px;
      background: #ffffff;
    }

    .qr-discreet-label {
      font-size: 7.5px;
      font-weight: 800;
      text-transform: uppercase;
      color: #0f172a;
      margin-top: 2px;
    }

    .totals-column {
      min-width: 180px;
      text-align: right;
    }

    .totals-row-clean {
      display: flex;
      justify-content: space-between;
      font-size: 9.5px;
      color: #475569;
      margin: 2px 0;
    }

    .totals-final-clean {
      display: flex;
      justify-content: space-between;
      border-top: 1.5px solid #0f172a;
      padding-top: 4px;
      margin-top: 4px;
      font-size: 13px;
      font-weight: 900;
      color: #0f172a;
    }

    .terms-card-clean {
      border: 1px solid #cbd5e1;
      border-radius: 4px;
      padding: 8px 12px;
      margin-bottom: 16px;
      page-break-inside: avoid;
    }

    .terms-card-clean h4 {
      margin: 0 0 4px 0;
      font-size: 8.5px;
      font-weight: 800;
      text-transform: uppercase;
      color: #0f172a;
      letter-spacing: 0.04em;
    }

    .terms-card-clean ol {
      margin: 0;
      padding-left: 14px;
      font-size: 8.5px;
      color: #475569;
      line-height: 1.35;
    }

    .terms-card-clean li {
      margin-bottom: 2px;
    }

    .signatures-grid-clean {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 30px;
      margin-top: 24px;
      padding-top: 10px;
      page-break-inside: avoid;
    }

    .signature-block {
      text-align: center;
    }

    .signature-line {
      border-bottom: 1px solid #0f172a;
      margin-bottom: 4px;
      height: 1px;
    }

    .signature-name {
      font-size: 9.5px;
      font-weight: 800;
      color: #0f172a;
      text-transform: uppercase;
      margin: 0;
    }

    .signature-title {
      font-size: 8px;
      color: #64748b;
      margin: 1px 0 0 0;
    }

    .footer-clean {
      margin-top: 18px;
      padding-top: 6px;
      border-top: 1px solid #cbd5e1;
      font-size: 7.5px;
      color: #64748b;
      display: flex;
      justify-content: space-between;
      align-items: center;
      page-break-inside: avoid;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- CABEÇALHO LIMPO -->
    <table class="header-table">
      <tr>
        <td style="vertical-align: top;">
          <h1 class="company-name">${company.tradeName || company.companyName}</h1>
          <p class="company-sub"><strong>Razão Social:</strong> ${company.companyName}</p>
          <p class="company-sub"><strong>CNPJ:</strong> ${company.document} ${company.email ? `| <strong>E-mail:</strong> ${company.email}` : ''}</p>
          <p class="company-sub"><strong>Endereço:</strong> ${company.address}</p>
          <p class="company-sub"><strong>Contato Comercial:</strong> ${company.phone} ${company.website ? `| ${company.website}` : ''}</p>
        </td>
        <td style="vertical-align: top; text-align: right; width: 220px;">
          <div class="doc-badge-container">
            <span class="doc-type-pill">Proposta Comercial</span>
            <div class="doc-id">Nº ${getBudgetDisplayId(budget)}</div>
            <div class="doc-date">Emissão: <strong>${budget.date}</strong></div>
            <div class="doc-date">Validade: <strong>${budget.expiryDate}</strong></div>
            <div style="margin-top: 3px;">
              <span class="badge-status">${budget.status}</span>
            </div>
          </div>
        </td>
      </tr>
    </table>

    <!-- DADOS DO CLIENTE E CONDIÇÕES COMERCIAIS -->
    <div class="card-grid">
      <div class="card">
        <div class="card-title">
          <span>Cliente Destinatário</span>
          <span>Cód: ${budget.clientId || 'N/A'}</span>
        </div>
        <p class="card-row"><strong>Nome / Razão:</strong> ${budget.clientName}</p>
        <p class="card-row"><strong>CPF / CNPJ:</strong> ${client?.document || 'Não Informado'}</p>
        <p class="card-row"><strong>Telefone:</strong> ${client?.phone || 'Não Informado'}</p>
        <p class="card-row"><strong>E-mail:</strong> ${client?.email || 'Não Informado'}</p>
        <p class="card-row"><strong>Entrega:</strong> ${clientAddressStr}</p>
      </div>

      <div class="card">
        <div class="card-title">
          <span>Condições Comerciais e Logística</span>
          <span>InfraCore BETA</span>
        </div>
        <p class="card-row"><strong>Frete:</strong> ${freightLabel}</p>
        <p class="card-row"><strong>Prazo de Entrega:</strong> ${deliveryTerm}</p>
        <p class="card-row"><strong>Pagamento:</strong> ${paymentLabel} (${numInstallments})</p>
        <p class="card-row"><strong>Responsável:</strong> Administrador</p>
        ${commercialNotes ? `<p class="card-row"><strong>Obs:</strong> ${commercialNotes}</p>` : ''}
      </div>
    </div>

    <!-- PESAGEM SE HOUVER -->
    ${budget.netWeight ? `
    <div class="card" style="margin-bottom: 12px;">
      <div class="card-title">
        <span>Pesagem Rodoviária Integrada</span>
      </div>
      <div style="display: flex; gap: 20px; font-size: 9.5px; font-family: monospace;">
        <span><strong>Tara:</strong> ${budget.tareWeight || 0} kg</span>
        <span><strong>Bruto:</strong> ${budget.grossWeight || 0} kg</span>
        <span><strong>Líquido Faturado:</strong> <strong>${budget.netWeight} kg</strong></span>
      </div>
      ${budget.weightNotes ? `<p style="margin: 4px 0 0 0; font-size: 9px; color: #475569; font-style: italic;"><strong>Obs. Pesagem:</strong> ${budget.weightNotes}</p>` : ''}
    </div>
    ` : ''}

    <!-- TABELA DE ITENS -->
    <table class="items-table">
      <thead>
        <tr>
          <th style="width: 25px;" class="text-center">#</th>
          <th>Descrição do Material / Serviço</th>
          <th style="width: 45px;" class="text-center">UN</th>
          <th style="width: 60px;" class="text-right">QTD</th>
          <th style="width: 80px;" class="text-right">Preço Unit.</th>
          <th style="width: 90px;" class="text-right">Subtotal</th>
        </tr>
      </thead>
      <tbody>
        ${(budget.items || []).map((item, idx) => `
          <tr>
            <td class="text-center" style="font-weight: 700; color: #64748b;">${idx + 1}</td>
            <td>
              <div style="font-weight: 700;">${item.name}</div>
              ${item.detail ? `<div style="font-size: 8.5px; color: #64748b;">${item.detail}</div>` : ''}
            </td>
            <td class="text-center">${item.unit || 'UN'}</td>
            <td class="text-right" style="font-family: monospace; font-weight: 600;">${item.quantity}</td>
            <td class="text-right" style="font-family: monospace;">${formatMoney(item.price)}</td>
            <td class="text-right" style="font-weight: 700; font-family: monospace;">${formatMoney(item.price * item.quantity)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <!-- BLOCO FINANCEIRO INTEGRADO COM TOTAL E QR CODE ULTRA-DISCRETO (55x55) -->
    <div class="financial-totals-block">
      <div class="bank-details-clean">
        <h4>Dados Bancários para Quitação</h4>
        <div class="bank-grid-clean">
          <div><strong>Banco:</strong> ${bank.bankName || 'A Combinar'}</div>
          <div><strong>Agência:</strong> ${bank.agency || '0001'} | <strong>Conta:</strong> ${bank.account || '00000-0'}</div>
          <div style="grid-column: span 2;"><strong>Favorecido:</strong> ${company.companyName}</div>
          <div style="grid-column: span 2;"><strong>Chave PIX:</strong> <span style="font-family: monospace; font-weight: 700;">${pixKey}</span></div>
        </div>
        <div class="pix-copia-cola-line">
          <strong>PIX Copia e Cola:</strong> ${pixPayload || pixKey}
        </div>
      </div>

      <div class="totals-and-qr-box">
        <div class="qr-discreet">
          <img src="${qrCodeUrl}" alt="QR Code PIX (55x55)" />
          <div class="qr-discreet-label">PIX INSTANTÂNEO</div>
        </div>
        <div class="totals-column">
          <div class="totals-row-clean">
            <span>Subtotal:</span>
            <span style="font-family: monospace;">${formatMoney(budget.subtotal)}</span>
          </div>
          ${budget.discount > 0 ? `
          <div class="totals-row-clean">
            <span>Desconto:</span>
            <span style="font-family: monospace;">- ${formatMoney(budget.discount)}</span>
          </div>
          ` : ''}
          <div class="totals-row-clean">
            <span>Frete:</span>
            <span>${freight === 'CIF' ? 'Incluso' : 'Destinatário'}</span>
          </div>
          <div class="totals-final-clean">
            <span>TOTAL:</span>
            <span style="font-family: monospace;">${formatMoney(budget.total)}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- TERMOS E CLÁUSULAS -->
    <div class="terms-card-clean">
      <h4>Termos Gerais de Fornecimento</h4>
      <ol>
        <li><strong>Validade:</strong> Proposta válida impreterivelmente até <strong>${budget.expiryDate}</strong>, sujeita à confirmação de estoque e crédito.</li>
        <li><strong>Logística:</strong> Conforme modalidade <strong>${freight}</strong>, a descarga é de responsabilidade do comprador, ressalvado acordo formal.</li>
        <li><strong>Pagamento:</strong> Faturamento conforme condições aprovadas (${paymentLabel}). Vencimentos sujeitos a juros legais após prazo.</li>
        <li><strong>Garantia:</strong> Materiais fornecidos com garantia legal de qualidade e conformidade técnica.</li>
      </ol>
    </div>

    <!-- ASSINATURAS -->
    <div class="signatures-grid-clean">
      <div class="signature-block">
        <div class="signature-line"></div>
        <p class="signature-name">${company.tradeName || company.companyName}</p>
        <p class="signature-title">Emissor Autorizado</p>
      </div>

      <div class="signature-block">
        <div class="signature-line"></div>
        <p class="signature-name">${budget.clientName}</p>
        <p class="signature-title">De Acordo do Cliente (Data: ____/____/________)</p>
      </div>
    </div>

    <!-- RODAPÉ -->
    <div class="footer-clean">
      <span>InfraCore ERP Beta • Gestão Comercial</span>
      <span>Emissão: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}</span>
      <span>Autenticação: INFRA-${budget.id}-${Date.now().toString(36).toUpperCase()}</span>
    </div>
  </div>
</body>
</html>`;

    printDocument(`Proposta_Comercial_${getBudgetDisplayId(budget)}_${budget.clientName.replace(/\s+/g, '_')}`, html);
  };

  // Impressão do Recibo Executivo da Venda
  const handlePrintSale = (sale: Sale) => {
    const company = settings || {
      companyName: 'INFRACORE ERP SISTEMAS LTDA',
      tradeName: 'InfraCore ERP',
      document: '00.000.000/0001-00',
      email: 'contato@infracore.com.br',
      phone: '(11) 4002-8922',
      address: 'Av. Industrial, 1200 - Distrito Industrial, São Paulo - SP'
    } as AppSettings;

    const client = (clients || []).find(c => c.id === sale.clientId);
    const saleNum = sale.id.split('-')[1] || sale.id;
    const paymentLabel = getPaymentMethodLabel(sale.paymentMethod);
    const installmentsLabel = sale.installments && sale.installments > 1 ? `${sale.installments}x` : 'À Vista';

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <title>Recibo de Venda #${saleNum} - ${sale.clientName}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
    @page {
      size: A4 portrait;
      margin: 15mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      color: #0f172a;
      background: #ffffff;
      margin: 0;
      padding: 0;
      font-size: 11px;
      line-height: 1.45;
    }
    .header {
      text-align: center;
      border-bottom: 2px solid #0891b2;
      padding-bottom: 14px;
      margin-bottom: 18px;
    }
    .header h2 {
      margin: 0;
      font-size: 20px;
      font-weight: 900;
      color: #0891b2;
      text-transform: uppercase;
    }
    .header p {
      margin: 2px 0;
      font-size: 10px;
      color: #475569;
    }
    .title-box {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 10px 14px;
      margin-bottom: 16px;
    }
    .grid-info {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 16px;
    }
    .info-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 10px 14px;
    }
    .info-card h4 {
      margin: 0 0 6px 0;
      font-size: 9px;
      font-weight: 900;
      color: #0891b2;
      text-transform: uppercase;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 3px;
    }
    .info-card p {
      margin: 3px 0;
      font-size: 10.5px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 16px;
    }
    th {
      background: #0f172a;
      color: #fff;
      font-size: 9px;
      font-weight: 800;
      text-transform: uppercase;
      padding: 7px 8px;
      text-align: left;
    }
    td {
      padding: 7px 8px;
      border-bottom: 1px solid #e2e8f0;
      font-size: 10.5px;
    }
    tr:nth-child(even) td {
      background: #f8fafc;
    }
    .total-container {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 24px;
    }
    .total-box {
      width: 250px;
      background: #f8fafc;
      border: 2px solid #0f172a;
      border-radius: 6px;
      padding: 10px 14px;
      text-align: right;
    }
    .footer-receipt {
      margin-top: 35px;
      border-top: 1px dashed #cbd5e1;
      padding-top: 14px;
      text-align: center;
      font-size: 9.5px;
      color: #64748b;
    }
  </style>
</head>
<body>
  <div class="header">
    <h2>${company.tradeName || company.companyName}</h2>
    <p>CNPJ: ${company.document} | ${company.address}</p>
    <p>Telefone: ${company.phone} | E-mail: ${company.email}</p>
  </div>

  <div class="title-box">
    <div>
      <span style="font-size: 14px; font-weight: 900; text-transform: uppercase; color: #0f172a;">COMPROVANTE DE RECIBO DE VENDA</span>
      <p style="margin: 2px 0 0 0; font-size: 10px; color: #64748b;">Operação Comercial Finalizada e Registrada</p>
    </div>
    <div style="text-align: right;">
      <span style="font-size: 14px; font-weight: 900; color: #0891b2;">Nº ${saleNum}</span>
      <p style="margin: 2px 0 0 0; font-size: 10px; color: #64748b;">Emissão: ${sale.date}</p>
    </div>
  </div>

  <div class="grid-info">
    <div class="info-card">
      <h4>Dados do Destinatário</h4>
      <p><strong>Cliente:</strong> ${sale.clientName}</p>
      ${client?.document ? `<p><strong>CPF/CNPJ:</strong> ${client.document}</p>` : ''}
      ${client?.phone ? `<p><strong>Telefone:</strong> ${client.phone}</p>` : ''}
    </div>
    <div class="info-card">
      <h4>Dados da Transação</h4>
      <p><strong>Forma de Pagamento:</strong> ${paymentLabel} (${installmentsLabel})</p>
      <p><strong>Status Financeiro:</strong> <span style="font-weight: 800; color: ${sale.status === 'Conciliado' ? '#16a34a' : '#d97706'};">${sale.status || 'Conciliado'}</span></p>
      ${sale.vehicleId ? `<p><strong>Veículo / Placa:</strong> ${fleet.find(v => v.id === sale.vehicleId)?.plate || 'Frota'}</p>` : ''}
      ${sale.driverName ? `<p><strong>Condutor:</strong> ${sale.driverName}</p>` : ''}
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width: 25px; text-align: center;">#</th>
        <th>Descrição</th>
        <th style="width: 60px; text-align: center;">UN</th>
        <th style="width: 70px; text-align: right;">QTD</th>
        <th style="width: 90px; text-align: right;">Preço Unit.</th>
        <th style="width: 100px; text-align: right;">Total</th>
      </tr>
    </thead>
    <tbody>
      ${(sale.items || []).map((item, idx) => `
        <tr>
          <td style="text-align: center; color: #64748b;">${idx + 1}</td>
          <td><strong>${item.name}</strong></td>
          <td style="text-align: center;">${item.unit}</td>
          <td style="text-align: right; font-family: monospace;">${item.quantity}</td>
          <td style="text-align: right; font-family: monospace;">${formatMoney(item.price)}</td>
          <td style="text-align: right; font-weight: 700; font-family: monospace;">${formatMoney(item.price * item.quantity)}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="total-container">
    <div class="total-box">
      <div style="font-size: 10px; color: #64748b; text-transform: uppercase; font-weight: 700;">VALOR TOTAL PAGO</div>
      <div style="font-size: 20px; font-weight: 900; color: #0891b2; font-family: monospace;">${formatMoney(sale.amount)}</div>
    </div>
  </div>

  <div class="footer-receipt">
    <p style="margin: 0 0 3px 0; font-weight: 700;">Agradecemos pela preferência e confiança em nossos serviços!</p>
    <p style="margin: 0; font-size: 8.5px;">Documento de controle interno emitido eletronicamente via InfraCore ERP • Sem valor fiscal imediato.</p>
  </div>
</body>
</html>`;

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
                  Orçamento #{getBudgetDisplayId(selectedBudget)}
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

              {/* Detalhes Comerciais e Logística */}
              <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 dark:bg-gray-700/40 rounded-xl text-xs border border-slate-100 dark:border-gray-600">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Frete</span>
                  <span className="font-bold text-slate-700 dark:text-slate-200">
                    {(selectedBudget as any).freightType || 'FOB'} - {(selectedBudget as any).freightType === 'CIF' ? 'Incluso (Emitente)' : (selectedBudget as any).freightType === 'Sem Frete' ? 'Retirada no Local' : 'Destinatário'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Prazo de Entrega</span>
                  <span className="font-bold text-slate-700 dark:text-slate-200">
                    {(selectedBudget as any).deliveryDays ? `${(selectedBudget as any).deliveryDays} dias úteis` : '5 dias úteis (Padrão)'}
                  </span>
                </div>
                {(selectedBudget as any).commercialNotes && (
                  <div className="col-span-2 pt-1 border-t border-slate-200/60 dark:border-gray-600">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Condições Comerciais</span>
                    <span className="text-slate-600 dark:text-slate-300 font-medium">{(selectedBudget as any).commercialNotes}</span>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  onClick={() => handlePrintBudget(selectedBudget)}
                  className="flex-1 py-3 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-md shadow-cyan-600/20 transition-all text-xs"
                >
                  <Printer size={16} /> Imprimir Proposta Executiva A4
                </button>
                {selectedBudget.status !== 'Convertido' && (
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
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* BARRA DE FILTROS TEMPORAIS */}
          <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mr-1">
                <Filter size={14} className="text-cyan-600" /> Período:
              </span>
              {(
                [
                  { id: 'today', label: 'Hoje' },
                  { id: '7days', label: 'Últimos 7 Dias' },
                  { id: 'thisMonth', label: 'Mês Atual' },
                  { id: 'lastMonth', label: 'Mês Anterior' },
                  { id: 'custom', label: 'Personalizado' }
                ] as const
              ).map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setPeriodFilter(opt.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    periodFilter === opt.id
                      ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30 font-black'
                      : 'bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {periodFilter === 'custom' && (
              <div className="flex items-center gap-2 flex-wrap bg-slate-50 dark:bg-slate-900/60 p-2 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-bold text-slate-400">De:</span>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={e => setCustomStartDate(e.target.value)}
                    className="text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-bold text-slate-400">Até:</span>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={e => setCustomEndDate(e.target.value)}
                    className="text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  />
                </div>
              </div>
            )}

            <div className="text-right flex items-center md:justify-end gap-2 text-xs font-bold text-slate-400">
              <span className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-700/50 px-2.5 py-1 rounded-lg text-slate-600 dark:text-slate-300 text-[11px]">
                <Calendar size={12} className="text-cyan-600" />
                {periodLabel}
              </span>
              <span className="text-[11px] text-slate-400 hidden sm:inline">
                • Variação Δ% calculada vs. período anterior
              </span>
            </div>
          </div>

          {/* HERO: Metas Segmentadas e Velocidade Comercial */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-[2rem] shadow-2xl p-6 md:p-8 text-white relative overflow-hidden">
            <div className="relative z-10 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="p-3.5 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-2xl text-white shadow-lg shadow-cyan-500/30">
                    <Target size={28} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-2xl font-black uppercase tracking-tight">Metas Comerciais</h4>
                      <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] font-black uppercase rounded-full">
                        Mês Vigente
                      </span>
                    </div>
                    <p className="text-cyan-300/70 text-xs font-medium">Metas Segmentadas & Velocidade Comercial em Tempo Real</p>
                  </div>
                </div>

                <button
                  onClick={handleOpenTargetModal}
                  className="self-start sm:self-auto px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold text-xs flex items-center gap-2 border border-white/15 backdrop-blur-sm transition-all hover:scale-105 active:scale-95"
                >
                  <Settings size={14} className="text-cyan-400" />
                  Ajustar Metas
                </button>
              </div>

              {/* Barra de Progresso Multi-Estágio */}
              <div className="space-y-2 bg-white/5 p-4 md:p-5 rounded-2xl border border-white/10 backdrop-blur-sm">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs font-bold text-slate-300">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 uppercase text-[10px] tracking-wider">Faturado no Mês:</span>
                    <span className="text-white text-lg font-black">{formatMoney(commercialVelocity.monthTotal)}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] font-bold">
                    <span className={commercialVelocity.pctMin >= 100 ? 'text-emerald-400' : 'text-slate-400'}>
                      Mín: {commercialVelocity.pctMin}%
                    </span>
                    <span className="text-slate-600">•</span>
                    <span className={commercialVelocity.pctTarget >= 100 ? 'text-cyan-400' : 'text-slate-300'}>
                      Alvo: {commercialVelocity.pctTarget}%
                    </span>
                    <span className="text-slate-600">•</span>
                    <span className={commercialVelocity.pctSuper >= 100 ? 'text-purple-400' : 'text-slate-400'}>
                      Super: {commercialVelocity.pctSuper}%
                    </span>
                  </div>
                </div>

                {/* Trilho da Barra com Marcadores */}
                <div className="relative w-full bg-slate-700/60 rounded-full h-5 overflow-hidden border border-slate-600 shadow-inner">
                  <div
                    className="bg-gradient-to-r from-cyan-500 via-emerald-400 to-purple-500 h-full transition-all duration-1000 flex items-center justify-end pr-2 rounded-full"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.max(5, (commercialVelocity.monthTotal / Math.max(commercialTargets.super, 1)) * 100)
                      )}%`
                    }}
                  >
                    <span className="text-[10px] font-black text-slate-900 drop-shadow px-1 bg-white/80 rounded-full">
                      {Math.round((commercialVelocity.monthTotal / Math.max(commercialTargets.target, 1)) * 100)}%
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 text-[11px] font-bold text-slate-400 pt-1">
                  <div>
                    <span className="text-[9px] uppercase tracking-wider block text-slate-500">1. Mínima</span>
                    <span className="text-slate-300">{formatMoney(commercialTargets.minimum)}</span>
                  </div>
                  <div className="text-center">
                    <span className="text-[9px] uppercase tracking-wider block text-cyan-400">2. Alvo Principal</span>
                    <span className="text-white font-black">{formatMoney(commercialTargets.target)}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] uppercase tracking-wider block text-purple-400">3. Supermeta</span>
                    <span className="text-purple-300 font-bold">{formatMoney(commercialTargets.super)}</span>
                  </div>
                </div>
              </div>

              {/* Indicadores de Velocidade Comercial */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-cyan-500/20 to-cyan-600/10 backdrop-blur-sm p-4 rounded-2xl border border-cyan-500/25">
                  <p className="text-[10px] font-black text-cyan-300 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                    <Sparkles size={13} /> Projeção de Fechamento
                  </p>
                  <p className="text-2xl font-black text-white">{formatMoney(commercialVelocity.projectedTotal)}</p>
                  <p className="text-[11px] text-cyan-200/70 font-medium mt-1">
                    Ritmo atual: {formatMoney(commercialVelocity.dailyAvg)} / dia ({commercialVelocity.daysElapsed} de {commercialVelocity.daysInMonth} dias)
                  </p>
                </div>

                <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 backdrop-blur-sm p-4 rounded-2xl border border-emerald-500/25">
                  <p className="text-[10px] font-black text-emerald-300 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                    <TrendingUp size={13} /> Ritmo Diário Restante
                  </p>
                  <p className="text-2xl font-black text-white">
                    {commercialVelocity.monthTotal >= commercialTargets.target
                      ? commercialVelocity.monthTotal >= commercialTargets.super
                        ? 'Superada!'
                        : formatMoney(commercialVelocity.neededRateSuper)
                      : formatMoney(commercialVelocity.neededRateTarget)}
                    {commercialVelocity.monthTotal < commercialTargets.super && (
                      <span className="text-xs font-bold text-slate-300"> / dia</span>
                    )}
                  </p>
                  <p className="text-[11px] text-emerald-200/70 font-medium mt-1">
                    {commercialVelocity.monthTotal >= commercialTargets.target
                      ? commercialVelocity.monthTotal >= commercialTargets.super
                        ? 'Parabéns! Supermeta atingida no mês'
                        : `Meta Alvo batida! Restante p/ Supermeta (${commercialVelocity.daysRemaining} dias)`
                      : `Necessário p/ atingir Meta Alvo (${commercialVelocity.daysRemaining} dias restantes)`}
                  </p>
                </div>

                <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 backdrop-blur-sm p-4 rounded-2xl border border-purple-500/25">
                  <p className="text-[10px] font-black text-purple-300 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                    <Target size={13} /> Meta Alvo Principal
                  </p>
                  <p className="text-2xl font-black text-white">{formatMoney(commercialTargets.target)}</p>
                  <p className="text-[11px] text-purple-200/70 font-medium mt-1">
                    {commercialVelocity.monthTotal >= commercialTargets.target
                      ? `100% atingida (+${formatMoney(commercialVelocity.monthTotal - commercialTargets.target)})`
                      : `Faltam ${formatMoney(commercialTargets.target - commercialVelocity.monthTotal)} para atingir`}
                  </p>
                </div>
              </div>
            </div>

            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-cyan-600/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/4 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-purple-600/10 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/4 pointer-events-none"></div>
          </div>

          {/* 4 KPIS DINÂMICOS COM Δ% */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* KPI 1: Faturamento */}
            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm relative overflow-hidden group hover:border-cyan-500/40 transition-all">
              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Faturamento ({periodLabel})
                </span>
                <span
                  className={`text-[10px] font-black px-2 py-0.5 rounded-lg flex items-center gap-1 ${
                    dashboardKpis.revenueDelta >= 0
                      ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400'
                      : 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400'
                  }`}
                >
                  {dashboardKpis.revenueDelta >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                  {dashboardKpis.revenueDelta >= 0 ? '+' : ''}
                  {dashboardKpis.revenueDelta.toFixed(1)}%
                </span>
              </div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                {formatMoney(dashboardKpis.currentRevenue)}
              </h3>
              <p className="text-[11px] text-slate-400 font-medium mt-1">
                Período anterior: {formatMoney(dashboardKpis.prevRevenue)}
              </p>
            </div>

            {/* KPI 2: Ticket Médio */}
            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm relative overflow-hidden group hover:border-cyan-500/40 transition-all">
              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Ticket Médio</span>
                <span
                  className={`text-[10px] font-black px-2 py-0.5 rounded-lg flex items-center gap-1 ${
                    dashboardKpis.ticketDelta >= 0
                      ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400'
                      : 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400'
                  }`}
                >
                  {dashboardKpis.ticketDelta >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                  {dashboardKpis.ticketDelta >= 0 ? '+' : ''}
                  {dashboardKpis.ticketDelta.toFixed(1)}%
                </span>
              </div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                {formatMoney(dashboardKpis.currentTicket)}
              </h3>
              <p className="text-[11px] text-slate-400 font-medium mt-1">
                Período anterior: {formatMoney(dashboardKpis.prevTicket)}
              </p>
            </div>

            {/* KPI 3: Vendas Faturadas */}
            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm relative overflow-hidden group hover:border-cyan-500/40 transition-all">
              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Pedidos Faturados</span>
                <span
                  className={`text-[10px] font-black px-2 py-0.5 rounded-lg flex items-center gap-1 ${
                    dashboardKpis.countDelta >= 0
                      ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400'
                      : 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400'
                  }`}
                >
                  {dashboardKpis.countDelta >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                  {dashboardKpis.countDelta >= 0 ? '+' : ''}
                  {dashboardKpis.countDelta.toFixed(1)}%
                </span>
              </div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                {dashboardKpis.currentCount} <span className="text-sm font-bold text-slate-400">vendas</span>
              </h3>
              <p className="text-[11px] text-slate-400 font-medium mt-1">
                Período anterior: {dashboardKpis.prevCount} vendas
              </p>
            </div>

            {/* KPI 4: Conversão de Orçamentos */}
            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm relative overflow-hidden group hover:border-cyan-500/40 transition-all">
              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Taxa de Conversão</span>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-lg bg-cyan-50 text-cyan-600 dark:bg-cyan-950/40 dark:text-cyan-400">
                  {dashboardKpis.pendingBudgets} abertos
                </span>
              </div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                {dashboardKpis.conversionRate}%
              </h3>
              <p className="text-[11px] text-slate-400 font-medium mt-1">
                {dashboardKpis.convertedBudgets} convertidos de {dashboardKpis.totalBudgets} orçamentos
              </p>
            </div>
          </div>

          {/* GRÁFICOS ANALÍTICOS (EVOLUÇÃO & FORMAS DE PAGAMENTO) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Gráfico 1: Evolução Temporal das Vendas */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm col-span-1 lg:col-span-2 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <Activity className="text-cyan-600" size={18} />
                    Evolução Diária do Faturamento
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Receita faturada por dia no período ({periodLabel})
                  </p>
                </div>
                <span className="text-xs font-black text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/40 px-3 py-1 rounded-lg">
                  Total: {formatMoney(dashboardKpis.currentRevenue)}
                </span>
              </div>

              {salesEvolutionData.length > 0 ? (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={salesEvolutionData}>
                      <defs>
                        <linearGradient id="salesEvolutionGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#94a3b8" strokeOpacity={0.15} />
                      <XAxis
                        dataKey="dateLabel"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 11, fill: '#94a3b8' }}
                        dy={6}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 11, fill: '#94a3b8' }}
                        tickFormatter={(v: any) =>
                          Number(v) >= 1000 ? `R$ ${(Number(v) / 1000).toFixed(0)}k` : `R$ ${v}`
                        }
                      />
                      <RechartsTooltip
                        formatter={(val: any) => [formatMoney(Number(val)), 'Faturamento']}
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          border: '1px solid #334155',
                          borderRadius: '12px',
                          color: '#fff',
                          fontSize: '12px'
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="faturamento"
                        stroke="#06b6d4"
                        strokeWidth={3}
                        fill="url(#salesEvolutionGrad)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-xs italic">
                  <Activity size={36} className="mb-2 opacity-30 text-slate-400" />
                  Nenhum dado de venda para o período selecionado.
                </div>
              )}
            </div>

            {/* Gráfico 2: Formas de Pagamento (Donut + Legenda) */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col justify-between">
              <div className="mb-4">
                <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <CreditCard className="text-amber-500" size={18} />
                  Mix por Forma de Pagamento
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Distribuição da receita gerada</p>
              </div>

              {paymentDistributionData.length > 0 ? (
                <div>
                  <div className="h-44 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={paymentDistributionData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={75}
                          paddingAngle={4}
                          dataKey="value"
                          stroke="none"
                        >
                          {paymentDistributionData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <RechartsTooltip
                          formatter={(val: any) => [formatMoney(Number(val)), 'Faturado']}
                          contentStyle={{
                            backgroundColor: '#0f172a',
                            border: '1px solid #334155',
                            borderRadius: '12px',
                            color: '#fff',
                            fontSize: '12px'
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Legenda detalhada */}
                  <div className="space-y-2 mt-2 max-h-40 overflow-y-auto pr-1">
                    {paymentDistributionData.map((m, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between text-xs p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-750"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: m.color }}></span>
                          <span className="font-bold text-slate-700 dark:text-slate-300">{m.name}</span>
                          <span className="text-[10px] text-slate-400">({m.count})</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-slate-800 dark:text-white">{formatMoney(m.value)}</span>
                          <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                            {m.percent.toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-xs italic">
                  <CreditCard size={36} className="mb-2 opacity-30 text-slate-400" />
                  Nenhuma forma de pagamento registrada no período.
                </div>
              )}
            </div>
          </div>

          {/* CURVA ABC (PRODUTOS & CLIENTES) */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6 space-y-5">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h4 className="font-black text-lg text-slate-800 dark:text-white flex items-center gap-2">
                  <Package className="text-cyan-600" size={20} />
                  Curva ABC (Princípio de Pareto)
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Classificação de relevância sobre o faturamento do período selecionado
                </p>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex bg-slate-100 dark:bg-slate-700/60 p-1 rounded-xl">
                  <button
                    onClick={() => setAbcTab('products')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      abcTab === 'products'
                        ? 'bg-white dark:bg-slate-600 text-cyan-600 dark:text-white shadow-sm font-black'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Produtos ({abcProducts.length})
                  </button>
                  <button
                    onClick={() => setAbcTab('clients')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      abcTab === 'clients'
                        ? 'bg-white dark:bg-slate-600 text-cyan-600 dark:text-white shadow-sm font-black'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Clientes ({abcClients.length})
                  </button>
                </div>

                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={abcSearch}
                    onChange={e => setAbcSearch(e.target.value)}
                    placeholder="Filtrar por nome..."
                    className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  />
                </div>
              </div>
            </div>

            {/* Badges de Faixas da Curva ABC */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                    Faixa A (Vital ~80%)
                  </span>
                  <span className="text-xs font-black text-emerald-700 dark:text-emerald-400">
                    {abcSummary.pctA.toFixed(1)}%
                  </span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-lg font-black text-emerald-900 dark:text-emerald-200">
                    {formatMoney(abcSummary.revA)}
                  </span>
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    {abcSummary.countA} {abcTab === 'products' ? 'itens' : 'clientes'}
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-cyan-50 dark:bg-cyan-950/20 border border-cyan-200 dark:border-cyan-800/40">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-cyan-700 dark:text-cyan-400">
                    Faixa B (Intermediário ~15%)
                  </span>
                  <span className="text-xs font-black text-cyan-700 dark:text-cyan-400">
                    {abcSummary.pctB.toFixed(1)}%
                  </span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-lg font-black text-cyan-900 dark:text-cyan-200">
                    {formatMoney(abcSummary.revB)}
                  </span>
                  <span className="text-xs font-bold text-cyan-600 dark:text-cyan-400">
                    {abcSummary.countB} {abcTab === 'products' ? 'itens' : 'clientes'}
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Faixa C (Cauda Longa ~5%)
                  </span>
                  <span className="text-xs font-black text-slate-600 dark:text-slate-300">
                    {abcSummary.pctC.toFixed(1)}%
                  </span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-lg font-black text-slate-800 dark:text-slate-200">
                    {formatMoney(abcSummary.revC)}
                  </span>
                  <span className="text-xs font-bold text-slate-500">
                    {abcSummary.countC} {abcTab === 'products' ? 'itens' : 'clientes'}
                  </span>
                </div>
              </div>
            </div>

            {/* Tabela de Classificação ABC */}
            <div className="border border-slate-100 dark:border-slate-700 rounded-xl overflow-hidden">
              <div className="max-h-96 overflow-y-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-900/60 sticky top-0 z-10 border-b border-slate-100 dark:border-slate-700">
                    <tr>
                      <th className="px-4 py-3 font-black text-slate-400 uppercase text-[10px] w-12 text-center">#</th>
                      <th className="px-4 py-3 font-black text-slate-400 uppercase text-[10px]">
                        {abcTab === 'products' ? 'Produto' : 'Cliente'}
                      </th>
                      <th className="px-4 py-3 font-black text-slate-400 uppercase text-[10px] text-center">
                        {abcTab === 'products' ? 'Qtd Vendida' : 'Nº Pedidos'}
                      </th>
                      <th className="px-4 py-3 font-black text-slate-400 uppercase text-[10px] text-right">
                        Faturamento
                      </th>
                      <th className="px-4 py-3 font-black text-slate-400 uppercase text-[10px] text-right">
                        % Part.
                      </th>
                      <th className="px-4 py-3 font-black text-slate-400 uppercase text-[10px] text-right">
                        % Acum.
                      </th>
                      <th className="px-4 py-3 font-black text-slate-400 uppercase text-[10px] text-center">
                        Faixa
                      </th>
                      {abcTab === 'clients' && (
                        <th className="px-4 py-3 font-black text-slate-400 uppercase text-[10px] text-center w-20">
                          Ação
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {abcTab === 'products' ? (
                      filteredAbcProducts.length > 0 ? (
                        filteredAbcProducts.map(p => (
                          <tr key={p.rank} className="hover:bg-slate-50/70 dark:hover:bg-slate-900/40 transition-colors">
                            <td className="px-4 py-3 text-center font-bold text-slate-400">#{p.rank}</td>
                            <td className="px-4 py-3 font-bold text-slate-800 dark:text-slate-200 uppercase">{p.name}</td>
                            <td className="px-4 py-3 text-center font-bold text-cyan-600">
                              {p.quantity} {p.unit}
                            </td>
                            <td className="px-4 py-3 text-right font-black text-slate-900 dark:text-white">
                              {formatMoney(p.revenue)}
                            </td>
                            <td className="px-4 py-3 text-right font-bold text-slate-600 dark:text-slate-300">
                              {p.share.toFixed(1)}%
                            </td>
                            <td className="px-4 py-3 text-right font-bold text-slate-400">
                              {p.cumulative.toFixed(1)}%
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                  p.classification === 'A'
                                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                                    : p.classification === 'B'
                                    ? 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-700'
                                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-300 dark:border-slate-700'
                                }`}
                              >
                                Faixa {p.classification}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} className="text-center py-8 text-slate-400 text-xs italic">
                            Nenhum produto faturado no período selecionado.
                          </td>
                        </tr>
                      )
                    ) : filteredAbcClients.length > 0 ? (
                      filteredAbcClients.map(c => (
                        <tr key={c.rank} className="hover:bg-slate-50/70 dark:hover:bg-slate-900/40 transition-colors">
                          <td className="px-4 py-3 text-center font-bold text-slate-400">#{c.rank}</td>
                          <td className="px-4 py-3 font-bold text-slate-800 dark:text-slate-200 uppercase">{c.name}</td>
                          <td className="px-4 py-3 text-center font-bold text-cyan-600">{c.orders} pedidos</td>
                          <td className="px-4 py-3 text-right font-black text-slate-900 dark:text-white">
                            {formatMoney(c.revenue)}
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-slate-600 dark:text-slate-300">
                            {c.share.toFixed(1)}%
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-slate-400">
                            {c.cumulative.toFixed(1)}%
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                c.classification === 'A'
                                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                                  : c.classification === 'B'
                                  ? 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-700'
                                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-300 dark:border-slate-700'
                              }`}
                            >
                              Faixa {c.classification}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => {
                                setHistorySearchTerm(c.name);
                                setActiveTab('history');
                              }}
                              className="px-2 py-1 bg-slate-100 dark:bg-slate-700 hover:bg-cyan-600 hover:text-white text-slate-600 dark:text-slate-300 rounded-md font-bold text-[10px] transition-all"
                              title="Ver vendas deste cliente no histórico"
                            >
                              Filtrar
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={8} className="text-center py-8 text-slate-400 text-xs italic">
                          Nenhum cliente com compras no período selecionado.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* MODAL DE AJUSTE DE METAS COMERCIAIS */}
          {showTargetModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 max-w-md w-full p-6 space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 rounded-2xl">
                      <Target size={24} />
                    </div>
                    <div>
                      <h3 className="font-black text-lg text-slate-900 dark:text-white">Ajustar Metas Comerciais</h3>
                      <p className="text-xs text-slate-400">Configuração das metas segmentadas do mês</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowTargetModal(false)}
                    className="p-2 text-slate-400 hover:text-rose-500 rounded-xl transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-black uppercase text-slate-500 mb-1">
                      1. Meta Mínima (R$)
                    </label>
                    <input
                      type="number"
                      value={tempTargets.minimum}
                      onChange={e => setTempTargets({ ...tempTargets, minimum: Number(e.target.value) || 0 })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">Patamar de segurança comercial mínimo.</p>
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase text-cyan-600 dark:text-cyan-400 mb-1">
                      2. Meta Alvo Principal (R$)
                    </label>
                    <input
                      type="number"
                      value={tempTargets.target}
                      onChange={e => setTempTargets({ ...tempTargets, target: Number(e.target.value) || 0 })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-cyan-300 dark:border-cyan-700 rounded-xl font-black text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">Objetivo comercial padrão para a equipe.</p>
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase text-purple-600 dark:text-purple-400 mb-1">
                      3. Supermeta Desafiadora (R$)
                    </label>
                    <input
                      type="number"
                      value={tempTargets.super}
                      onChange={e => setTempTargets({ ...tempTargets, super: Number(e.target.value) || 0 })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">Gatilho de superação e bonificação comercial.</p>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => setShowTargetModal(false)}
                    className="px-4 py-2.5 text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveTargets}
                    className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl font-black text-xs shadow-lg shadow-cyan-600/30 transition-all hover:scale-105 active:scale-95"
                  >
                    Salvar Metas
                  </button>
                </div>
              </div>
            </div>
          )}
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
                              className="w-8 h-8 sm:w-6 sm:h-6 flex items-center justify-center rounded-lg bg-white dark:bg-slate-800 text-slate-400 hover:text-red-500 shadow-sm border dark:border-slate-700 transition-colors active:scale-95"
                            >
                              <Minus size={14} />
                            </button>
                            <input
                              type="number"
                              value={currentQty}
                              onChange={(e) => handleCatalogInput(product.id, e.target.value)}
                              className="w-10 text-center bg-transparent border-none p-0 text-sm font-black text-slate-900 dark:text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                            <button
                              onClick={() => updateCatalogQty(product.id, 1)}
                              className="w-8 h-8 sm:w-6 sm:h-6 flex items-center justify-center rounded-lg bg-white dark:bg-slate-800 text-slate-400 hover:text-cyan-600 shadow-sm border dark:border-slate-700 transition-colors active:scale-95"
                            >
                              <Plus size={14} />
                            </button>
                          </div>

                          <button
                            onClick={() => {
                              addToCart(product, currentQty);
                              setCatalogQtys(prev => ({ ...prev, [product.id]: 1 }));
                            }}
                            className="w-10 h-10 sm:w-9 sm:h-9 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl flex items-center justify-center shadow-lg shadow-cyan-600/20 active:scale-95 transition-all"
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

              {/* Botão Flutuante de Resumo do Carrinho no Mobile */}
              {cart.length > 0 && (
                <div className="lg:hidden sticky bottom-1 mx-2 p-2.5 bg-slate-900/95 dark:bg-black/95 backdrop-blur-md text-white rounded-2xl flex items-center justify-between shadow-2xl border border-white/20 z-30 animate-in slide-in-from-bottom-2">
                  <div className="flex flex-col pl-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{cart.length} {cart.length === 1 ? 'item' : 'itens'} no carrinho</span>
                    <span className="text-sm font-black text-cyan-400">{formatMoney(subtotal)}</span>
                  </div>
                  <button
                    onClick={() => setMobileTab('checkout')}
                    className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-cyan-600/30 active:scale-95 transition-all"
                  >
                    <ShoppingCart size={15} /> Ver Carrinho
                  </button>
                </div>
              )}
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

                {/* Lista Rolável de Itens do Carrinho com Barra de Rolagem à Direita */}
                <div className={`overflow-y-auto p-0 bg-slate-50/50 dark:bg-slate-900/20 custom-scrollbar pr-2 transition-all ${showCheckout ? 'max-h-36 shrink-0 border-b dark:border-slate-700' : 'flex-1'}`}>
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

                <div className={`bg-white dark:bg-gray-800 border-t dark:border-slate-700 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] z-20 transition-all ${showCheckout ? 'flex-1 flex flex-col min-h-0 overflow-hidden p-6' : 'shrink-0 p-6'}`}>
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

                      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          {/* BLOCO 1: IDENTIFICAÇÃO DO CLIENTE & CONTA FINANCEIRA */}
                          <div className="p-4 bg-slate-50/90 dark:bg-gray-700/40 rounded-2xl border border-slate-200/80 dark:border-gray-600/70 space-y-3.5 flex flex-col justify-between">
                            <div className="space-y-3">
                              <div className="flex items-center gap-2 pb-2 border-b border-slate-200/60 dark:border-gray-600/50">
                                <User size={15} className="text-cyan-600" />
                                <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-200">1. Cliente & Faturamento</span>
                              </div>

                              {/* Seletor de Cliente com botão de Cadastro Rápido */}
                              <div>
                                <div className="flex items-center justify-between mb-1.5 pl-0.5">
                                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Cliente Destinatário *</label>
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
                                    className="w-full pl-9 pr-3 py-2.5 sm:py-2 bg-white dark:bg-gray-800 border-slate-200 dark:border-gray-600 rounded-xl text-xs font-bold shadow-sm focus:ring-2 focus:ring-cyan-500 min-h-[42px] sm:min-h-0"
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
                                  <div className="mt-2 p-2 bg-white/80 dark:bg-gray-800/80 rounded-lg border border-slate-200/60 dark:border-gray-600/60 flex flex-wrap items-center justify-between text-[10px] font-bold text-slate-500 gap-1">
                                    <span>Doc: <strong className="text-slate-700 dark:text-slate-200">{selectedClientData.document || 'Não informado'}</strong></span>
                                    {selectedClientData.creditLimit !== undefined && selectedClientData.creditLimit > 0 && (
                                      <span className="text-emerald-600">Limite: {formatMoney(selectedClientData.creditLimit)}</span>
                                    )}
                                    <span className={selectedClientData.status === 'Ativo' ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded' : 'text-rose-500 font-bold bg-rose-50 dark:bg-rose-950/40 px-1.5 py-0.5 rounded'}>
                                      {selectedClientData.status}
                                    </span>
                                  </div>
                                )}
                              </div>

                              {/* Conta Financeira de Recebimento */}
                              <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase mb-1.5 tracking-widest pl-0.5">Conta Financeira (Recebimento) *</label>
                                <select
                                  value={account}
                                  onChange={e => setAccount(e.target.value)}
                                  className="w-full p-2.5 sm:p-2 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-600 rounded-xl text-xs font-bold text-slate-800 dark:text-white min-h-[42px] sm:min-h-0"
                                >
                                  <option value="">Selecione a conta...</option>
                                  {financialAccounts.map(acc => (
                                    <option key={acc.id} value={acc.id}>{acc.name}</option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          </div>

                          {/* BLOCO 2: CONDIÇÕES DE PAGAMENTO & DESCONTO */}
                          <div className="p-4 bg-slate-50/90 dark:bg-gray-700/40 rounded-2xl border border-slate-200/80 dark:border-gray-600/70 space-y-3.5">
                            <div className="flex items-center gap-2 pb-2 border-b border-slate-200/60 dark:border-gray-600/50">
                              <CreditCard size={15} className="text-cyan-600" />
                              <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-200">2. Pagamento & Condições</span>
                            </div>

                            {/* Forma de Pagamento */}
                            <div>
                              <label className="block text-[10px] font-black text-slate-500 uppercase mb-1.5 tracking-widest pl-0.5">Forma de Pagamento</label>
                              <div className="grid grid-cols-3 sm:grid-cols-6 lg:grid-cols-3 gap-1.5">
                                {['money', 'pix', 'transfer', 'credit', 'boleto', 'prazo'].map((method) => (
                                  <button
                                    key={method}
                                    onClick={() => setPaymentMethod(method)}
                                    className={`p-2 rounded-xl border-2 font-black text-[9px] flex flex-col items-center justify-center gap-1 transition-all min-h-[48px] sm:min-h-[42px] active:scale-95 ${paymentMethod === method ? 'border-cyan-500 bg-cyan-50 text-cyan-600 dark:bg-cyan-900/30 font-bold' : 'border-slate-100 dark:border-gray-700 text-slate-400 bg-white dark:bg-gray-800 hover:bg-slate-50'}`}
                                  >
                                    {method === 'money' && <><Banknote size={16} />DINHEIRO</>}
                                    {method === 'pix' && <><QrCode size={16} />PIX</>}
                                    {method === 'transfer' && <><ArrowLeftRight size={16} />TRANSF.</>}
                                    {method === 'credit' && <><CreditCard size={16} />CARTÃO</>}
                                    {method === 'boleto' && <><Barcode size={16} />BOLETO</>}
                                    {method === 'prazo' && <><Calendar size={16} />A PRAZO</>}
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                              <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase mb-1 tracking-widest pl-0.5">Desconto (R$)</label>
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={discount}
                                  onChange={e => setDiscount(e.target.value)}
                                  className="w-full p-2.5 sm:p-2 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-600 rounded-xl text-xs font-bold text-rose-600 min-h-[42px] sm:min-h-0"
                                  placeholder="0,00"
                                />
                              </div>

                              {!['money', 'pix', 'transfer'].includes(paymentMethod) ? (
                                <div>
                                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-1 tracking-widest pl-0.5">
                                    {['prazo', 'boleto'].includes(paymentMethod) ? 'Parcelamento' : 'Parcelamento'}
                                  </label>
                                  <select
                                    value={installments}
                                    onChange={e => setInstallments(Number(e.target.value))}
                                    className="w-full p-2.5 sm:p-2 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-600 rounded-xl text-xs font-bold min-h-[42px] sm:min-h-0"
                                  >
                                    {[1, 2, 3, 4, 5, 6, 10, 12].map(n => (
                                      <option key={n} value={n}>
                                        {['prazo', 'boleto'].includes(paymentMethod)
                                          ? `${n}x (${n === 1 ? '30 dias' : Array.from({ length: n }, (_, i) => (i + 1) * 30).join('/') + ' dias'})`
                                          : `${n}x ${n > 1 ? 'sem juros' : 'à vista'}`}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              ) : (
                                <div className="flex items-center text-[10px] text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-950/20 p-2 rounded-xl border border-emerald-100 dark:border-emerald-800/40">
                                  <span>✓ Pagamento à Vista</span>
                                </div>
                              )}
                            </div>

                            {!['money', 'pix', 'transfer'].includes(paymentMethod) && customDueDates.length > 0 && (
                              <div className="pt-2 border-t border-slate-200/60 dark:border-gray-600/60">
                                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 pl-0.5">
                                  {installments > 1 ? 'Vencimento das Parcelas' : 'Vencimento do Título'}
                                </label>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-24 overflow-y-auto pr-1">
                                  {customDueDates.map((date, idx) => (
                                    <div key={idx}>
                                      {installments > 1 && (
                                        <span className="text-[8px] font-bold text-slate-400 block mb-0.5">
                                          P{idx + 1}/{installments}
                                        </span>
                                      )}
                                      <input
                                        type="date"
                                        value={date}
                                        onChange={(e) => updateDueDate(idx, e.target.value)}
                                        className="w-full p-1.5 bg-white dark:bg-gray-800 rounded-lg border border-slate-200 dark:border-gray-600 text-[10px] font-bold font-mono"
                                      />
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* BLOCO 3: LOGÍSTICA, FRETE & PESAGEM */}
                          <div className="col-span-1 lg:col-span-2 p-4 bg-slate-50/90 dark:bg-gray-700/40 rounded-2xl border border-slate-200/80 dark:border-gray-600/70 space-y-3.5">
                            <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-gray-600/50">
                              <div className="flex items-center gap-2">
                                <Truck size={15} className="text-cyan-600" />
                                <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-200">3. Logística, Frete & Pesagem</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-[11px] font-bold text-slate-500">Requer Pesagem?</span>
                                <button
                                  type="button"
                                  onClick={() => setRequiresWeighing(!requiresWeighing)}
                                  className={`w-10 h-6 rounded-full p-1 transition-colors ${requiresWeighing ? 'bg-cyan-600' : 'bg-slate-300'}`}
                                >
                                  <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${requiresWeighing ? 'translate-x-4' : ''}`} />
                                </button>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                              <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase mb-1 tracking-widest pl-0.5">Modalidade de Frete</label>
                                <select
                                  value={freightType}
                                  onChange={e => setFreightType(e.target.value as 'CIF' | 'FOB' | 'Sem Frete')}
                                  className="w-full p-2.5 sm:p-2 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-600 rounded-xl text-xs font-bold text-slate-800 dark:text-white min-h-[42px] sm:min-h-0"
                                >
                                  <option value="FOB">FOB (Destinatário)</option>
                                  <option value="CIF">CIF (Emitente - Incluso)</option>
                                  <option value="Sem Frete">Sem Frete / Retirada</option>
                                </select>
                              </div>

                              <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase mb-1 tracking-widest pl-0.5">Prazo de Entrega (Dias Úteis)</label>
                                <input
                                  type="number"
                                  min={0}
                                  value={deliveryDays}
                                  onChange={e => setDeliveryDays(Math.max(0, parseInt(e.target.value) || 0))}
                                  className="w-full p-2.5 sm:p-2 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-600 rounded-xl text-xs font-bold text-slate-800 dark:text-white min-h-[42px] sm:min-h-0"
                                  placeholder="Ex: 5"
                                />
                              </div>

                              <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase mb-1 tracking-widest pl-0.5">Veículo (Frota)</label>
                                <select
                                  value={selectedVehicle}
                                  onChange={e => setSelectedVehicle(e.target.value)}
                                  className="w-full p-2.5 sm:p-2 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-600 rounded-xl text-xs font-bold min-h-[42px] sm:min-h-0"
                                >
                                  <option value="">Veículo Próprio / Terceiro</option>
                                  {(fleet || []).map(v => (
                                    <option key={v.id} value={v.id}>{v.plate} - {v.model || v.name}</option>
                                  ))}
                                </select>
                              </div>

                              <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase mb-1 tracking-widest pl-0.5">Motorista</label>
                                <input
                                  type="text"
                                  value={driverName}
                                  onChange={e => setDriverName(e.target.value)}
                                  className="w-full p-2.5 sm:p-2 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-600 rounded-xl text-xs font-bold min-h-[42px] sm:min-h-0"
                                  placeholder="Nome do Condutor"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="block text-[10px] font-black text-slate-500 uppercase mb-1 tracking-widest pl-0.5">Condições Comerciais / Observações da Proposta</label>
                              <input
                                type="text"
                                value={commercialNotes}
                                onChange={e => setCommercialNotes(e.target.value)}
                                className="w-full p-2.5 sm:p-2 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-600 rounded-xl text-xs font-bold text-slate-800 dark:text-white min-h-[42px] sm:min-h-0"
                                placeholder="Ex: Entrada 50% + saldo na entrega. Descarga por conta do cliente..."
                              />
                            </div>

                            {requiresWeighing && (
                              <div className="bg-white dark:bg-gray-800 p-3 rounded-xl border border-dashed border-cyan-200 dark:border-cyan-900/50 space-y-3 animate-in fade-in zoom-in duration-300">
                                <div className="flex justify-between items-center mb-1">
                                  <label className="text-[10px] font-black text-cyan-600 uppercase flex items-center gap-1">
                                    <Scale size={12} /> Balança Rodoviária Integrada
                                  </label>
                                  <span className="text-[9px] bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300 px-2 py-0.5 rounded font-bold">CONECTADO</span>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                  <div className="space-y-1">
                                    <p className="text-[10px] text-slate-500 font-bold uppercase">Tara (Entrada)</p>
                                    <div className="flex gap-2">
                                      <input
                                        type="number"
                                        value={tareWeight}
                                        onChange={e => setTareWeight(Number(e.target.value))}
                                        className="w-full p-2 sm:p-1.5 text-right font-mono text-sm font-bold border rounded-lg bg-slate-50 dark:bg-slate-700/50"
                                      />
                                      <button onClick={() => setTareWeight(Number((Math.random() * 5000 + 2000).toFixed(0)))} className="px-2.5 bg-slate-200 dark:bg-slate-600 rounded-lg hover:bg-cyan-200 text-[10px] font-black uppercase">Ler</button>
                                    </div>
                                  </div>
                                  <div className="space-y-1">
                                    <p className="text-[10px] text-slate-500 font-bold uppercase">Bruto (Saída)</p>
                                    <div className="flex gap-2">
                                      <input
                                        type="number"
                                        value={grossWeight}
                                        onChange={e => setGrossWeight(Number(e.target.value))}
                                        className="w-full p-2 sm:p-1.5 text-right font-mono text-sm font-bold border rounded-lg bg-slate-50 dark:bg-slate-700/50"
                                      />
                                      <button onClick={() => setGrossWeight(Number((tareWeight + Math.random() * 10000).toFixed(0)))} className="px-2.5 bg-slate-200 dark:bg-slate-600 rounded-lg hover:bg-cyan-200 text-[10px] font-black uppercase">Ler</button>
                                    </div>
                                  </div>
                                </div>

                                <div>
                                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Observações de Pesagem</label>
                                  <textarea
                                    value={weightNotes}
                                    onChange={e => setWeightNotes(e.target.value)}
                                    className="w-full p-2 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-gray-600 rounded-lg text-xs font-bold resize-none h-14 outline-none focus:border-cyan-500 transition-colors"
                                    placeholder="Ex: Carga molhada, Placa do reboque, Condições do veículo..."
                                  />
                                </div>

                                {weighingCalculations && (
                                  <div className="p-2.5 bg-cyan-50 dark:bg-cyan-900/10 rounded-xl border border-cyan-100 dark:border-cyan-800/50">
                                    <div className="flex items-center gap-2 text-cyan-700 dark:text-cyan-400 font-bold text-[10px] uppercase mb-1">
                                      <AlertTriangle size={12} /> Detalhes da Conversão
                                    </div>
                                    <p className="text-xs font-mono text-cyan-600 dark:text-cyan-300 leading-relaxed">
                                      {weighingCalculations.explanation}
                                    </p>
                                    <div className="mt-1.5 flex justify-between items-center text-[10px] font-black text-cyan-800 dark:text-cyan-200">
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
                        </div>

                        {/* Total Box */}
                        <div className="flex justify-between items-end p-4 sm:p-5 bg-slate-900 dark:bg-black rounded-2xl text-white mt-3 shadow-xl border border-white/10">
                          <div className="flex flex-col">
                            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Total do Pedido</span>
                            <div className="flex items-baseline gap-1.5">
                              <span className="text-3xl sm:text-4xl font-black text-cyan-400">{formatMoney(total).split(',')[0]}</span>
                              <span className="text-lg sm:text-xl font-bold opacity-50">,{formatMoney(total).split(',')[1]}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] font-bold text-slate-500 block">Itens: {cart.length}</span>
                            <span className="text-xs font-black text-emerald-400 uppercase">Pronto para Finalizar</span>
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
                <option value="Aberto">Em Aberto</option>
                <option value="Convertido">Convertido em Venda</option>
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
                        <p className="font-mono text-xs font-bold text-slate-700 dark:text-slate-200">#{getBudgetDisplayId(b)}</p>
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
                        <div className="flex items-center justify-end gap-1.5 opacity-20 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => setSelectedBudget(b)} className="p-2 text-slate-400 hover:text-cyan-600 hover:bg-white dark:hover:bg-gray-700 rounded-lg transition-all" title="Ver Detalhes"><Eye size={18} /></button>
                          <button onClick={() => handlePrintBudget(b)} className="p-2 text-slate-400 hover:text-cyan-600 hover:bg-white dark:hover:bg-gray-700 rounded-lg transition-all" title="Imprimir Orçamento"><Printer size={18} /></button>
                          {b.status !== 'Convertido' && (
                            <button
                              onClick={() => handleConvertBudgetToSale(b)}
                              className="px-2.5 py-1.5 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 rounded-lg hover:bg-emerald-600 hover:text-white transition-all flex items-center gap-1 font-bold text-xs"
                              title="Converter em Venda"
                            >
                              <ShoppingCart size={16} />
                              <span className="hidden sm:inline">Converter Venda</span>
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
