import React, { useState, useMemo, useEffect } from 'react';
import {
   ShoppingBag,
   Truck,
   Wrench,
   Fuel,
   Package,
   Plus,
   FileText,
   AlertTriangle,
   Clock,
   TrendingDown,
   TrendingUp,
   ChevronRight,
   CheckCircle,
   Search,
   Filter,
   X,
   Trash2,
   Save,
   ArrowRight,
   MoreVertical,
   DollarSign,
   Calendar,
   Warehouse,
   Tag,
   AlertCircle,
   Paperclip,
   Upload,
   XCircle,
   File,
   PieChart as PieIcon,
   BarChart as BarIcon,
   Users,
   Printer,
   Edit2,
   ClipboardCheck,
   ShieldCheck,
   Settings,
   Loader,
   CheckSquare,
   Square,
   Download,
   Award,
   Coins,
   Percent,
   Check,
   Layers,
   RefreshCw,
   Inbox,
   Lock,
   Info
} from 'lucide-react';
import { BarChart, Bar, ResponsiveContainer, Tooltip, XAxis, CartesianGrid } from 'recharts';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { PurchaseOrder, PurchaseItem, Supplier, InventoryItem, MaintenanceRecord, Employee } from '../types';
import { printDocument, exportToCSV } from '../utils/exportUtils';

// Quotation Interfaces (Gestão de Cotações & Mapa Comparativo)
export interface SupplierQuoteEntry {
   supplierId: string;
   supplierName: string;
   unitPrice: number;
   totalPrice: number;
   deliveryDays: number;
   paymentTerms: string;
   notes?: string;
}

export interface Quotation {
   id: string;
   title: string;
   date: string;
   expiryDate: string;
   requestedBy: string;
   status: 'Em Cotação' | 'Analisada' | 'Aprovada' | 'Cancelada';
   items: {
      productId: string;
      productName: string;
      quantity: number;
      unit: string;
   }[];
   supplierQuotes: SupplierQuoteEntry[];
   winningSupplierId?: string;
   winningOrderId?: string;
   notes?: string;
}

const INITIAL_MOCK_QUOTATIONS: Quotation[] = [
   {
      id: 'COT-2026-001',
      title: 'Cimento Portland CP-II F 32 a Granel (20 Toneladas)',
      date: '15/01/2026',
      expiryDate: '25/01/2026',
      requestedBy: 'Engenharia de Produção',
      status: 'Analisada',
      items: [
         { productId: 'p1', productName: 'Cimento CP-II F 32 Granel', quantity: 20, unit: 'ton' }
      ],
      supplierQuotes: [
         {
            supplierId: 's1',
            supplierName: 'Cimento Nacional SA',
            unitPrice: 420.00,
            totalPrice: 8400.00,
            deliveryDays: 3,
            paymentTerms: '30 DDL',
            notes: 'Frete FOB incluso para entrega na Usina'
         },
         {
            supplierId: 's2',
            supplierName: 'Votoran Cimentos Brasil',
            unitPrice: 445.00,
            totalPrice: 8900.00,
            deliveryDays: 5,
            paymentTerms: '28 DDL',
            notes: 'Pagamento via boleto faturado'
         },
         {
            supplierId: 's3',
            supplierName: 'InterCement Indústria',
            unitPrice: 460.00,
            totalPrice: 9200.00,
            deliveryDays: 7,
            paymentTerms: '15 DDL',
            notes: 'Estoque sob encomenda'
         }
      ],
      notes: 'Cotação tripla obrigatória para reposição do silo 01.'
   },
   {
      id: 'COT-2026-002',
      title: 'Agregados Brita 1 e Areia Média Lavada (50 m³)',
      date: '18/01/2026',
      expiryDate: '28/01/2026',
      requestedBy: 'Gestão de Suprimentos',
      status: 'Em Cotação',
      items: [
         { productId: 'p2', productName: 'Brita 1 Granítica', quantity: 30, unit: 'm³' },
         { productId: 'p3', productName: 'Areia Média Lavada', quantity: 20, unit: 'm³' }
      ],
      supplierQuotes: [
         {
            supplierId: 's4',
            supplierName: 'Pedreira Santa Rita Ltda',
            unitPrice: 85.00,
            totalPrice: 4250.00,
            deliveryDays: 2,
            paymentTerms: '30 DDL',
            notes: 'Entrega imediata em caçambas traçadas'
         },
         {
            supplierId: 's5',
            supplierName: 'Mineradora Rio Branco',
            unitPrice: 92.00,
            totalPrice: 4600.00,
            deliveryDays: 3,
            paymentTerms: '15 DDL',
            notes: 'Material ensaiado com laudo de granulometria'
         },
         {
            supplierId: 's6',
            supplierName: 'Agregados São Bento',
            unitPrice: 98.00,
            totalPrice: 4900.00,
            deliveryDays: 1,
            paymentTerms: 'À Vista',
            notes: 'Frete cobrado à parte'
         }
      ],
      notes: 'Insumos fundamentais para ordens de concreto estrutural.'
   }
];

const Purchases = () => {
   const {
      fleet,
      updateVehicleStatus,
      addTransaction,
      suppliers,
      addSupplier,
      updateSupplier,
      transactions,
      inventory,
      purchaseOrders,
      addPurchaseOrder,
      updatePurchaseOrder,
      receivePurchaseOrder,
      addStockItem,
      updateStockItem,
      deleteStockItem,
      accounts,
      addFuelLog,
      employees,
      currentUser,
      hasPermission,
      addMaintenanceRecord,
   } = useApp();

   const { addToast } = useToast();

   const isAdmin = currentUser?.roleId === 'admin' || currentUser?.username === 'admin' || hasPermission('all') || hasPermission('inventory.admin');

   const [activeTab, setActiveTab] = useState<'dashboard' | 'quotations' | 'orders' | 'approval' | 'new-order' | 'suppliers' | 'inventory'>('dashboard');
   const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);
   const [isSubmitting, setIsSubmitting] = useState(false);

   // Quotations Local State (with LocalStorage persistence)
   const [quotations, setQuotations] = useState<Quotation[]>(() => {
      try {
         const saved = localStorage.getItem('infracore_quotations');
         return saved ? JSON.parse(saved) : INITIAL_MOCK_QUOTATIONS;
      } catch (e) {
         return INITIAL_MOCK_QUOTATIONS;
      }
   });

   useEffect(() => {
      try {
         localStorage.setItem('infracore_quotations', JSON.stringify(quotations));
      } catch (e) {
         console.error('Failed to save quotations to localStorage', e);
      }
   }, [quotations]);

   const [quotationSearch, setQuotationSearch] = useState('');
   const [quotationStatusFilter, setQuotationStatusFilter] = useState<string>('Todas');
   const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);
   const [isNewQuotationModalOpen, setIsNewQuotationModalOpen] = useState(false);

   // New Quotation Form
   const [newQuotationForm, setNewQuotationForm] = useState<{
      title: string;
      requestedBy: string;
      expiryDate: string;
      notes: string;
      items: { productId: string; productName: string; quantity: number; unit: string }[];
      quotes: {
         supplierId: string;
         supplierName: string;
         unitPrice: number;
         totalPrice: number;
         deliveryDays: number;
         paymentTerms: string;
         notes: string;
      }[];
   }>({
      title: '',
      requestedBy: 'Almoxarifado Central',
      expiryDate: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0],
      notes: '',
      items: [{ productId: '', productName: '', quantity: 10, unit: 'kg' }],
      quotes: [
         { supplierId: '', supplierName: '', unitPrice: 0, totalPrice: 0, deliveryDays: 3, paymentTerms: '30 DDL', notes: '' },
         { supplierId: '', supplierName: '', unitPrice: 0, totalPrice: 0, deliveryDays: 5, paymentTerms: '30 DDL', notes: '' },
         { supplierId: '', supplierName: '', unitPrice: 0, totalPrice: 0, deliveryDays: 7, paymentTerms: '30 DDL', notes: '' }
      ]
   });

   // Delivery Inspection Modal State (Conferência de Recebimento)
   const [isReceiveInspectionModalOpen, setIsReceiveInspectionModalOpen] = useState(false);
   const [inspectingOrder, setInspectingOrder] = useState<PurchaseOrder | null>(null);
   const [inspectionInvoiceNumber, setInspectionInvoiceNumber] = useState('');
   const [inspectionReceivedDate, setInspectionReceivedDate] = useState(new Date().toLocaleDateString('pt-BR'));
   const [inspectionAccountId, setInspectionAccountId] = useState('');
   const [inspectionNotes, setInspectionNotes] = useState('');

   // Batch Approval State (Aprovação em Lote)
   const [selectedOrderIdsForApproval, setSelectedOrderIdsForApproval] = useState<string[]>([]);

   // New Order Form States
   const [selectedSupplier, setSelectedSupplier] = useState<string>('');
   const [orderItems, setOrderItems] = useState<PurchaseItem[]>([]);
   const [isStockDirect, setIsStockDirect] = useState(true);
   const [tempAttachments, setTempAttachments] = useState<any[]>([]);

   // Financial & Shipping
   const [paymentTerms, setPaymentTerms] = useState<string>('30 DDL');
   const [shippingCost, setShippingCost] = useState<number>(0);
   const [sourceAccount, setSourceAccount] = useState<string>('');

   // Inventory Management States
   const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
   const [isStockModalOpen, setIsStockModalOpen] = useState(false);
   const [stockForm, setStockForm] = useState<Partial<InventoryItem>>({
      name: '', category: 'Insumos', quantity: 0, minStock: 0, unit: 'kg', price: 0
   });

   // Supplier Management States
   const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
   const [supForm, setSupForm] = useState<Partial<Supplier>>({
      status: 'Ativo', registeredAt: new Date().toLocaleDateString('pt-BR')
   });
   const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

   // Search & Filter for Orders
   const [searchTerm, setSearchTerm] = useState('');
   const [statusFilter, setStatusFilter] = useState<string>('Todos');
   const [orderTypeFilter, setOrderTypeFilter] = useState<string>('Todos');
   const [catalogSearch, setCatalogSearch] = useState('');
   const [stockSearch, setStockSearch] = useState('');
   const [stockLevelFilter, setStockLevelFilter] = useState<'Todos' | 'Crítico' | 'Normal' | 'Excedente'>('Todos');

   // OSM States (Maintenance)
   const [isOSMModalOpen, setIsOSMModalOpen] = useState(false);
   const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
   const [osmForm, setOsmForm] = useState<Partial<MaintenanceRecord>>({
      type: 'Preventiva',
      date: new Date().toISOString().split('T')[0],
      cost: 0,
      km: 0,
      attachments: []
   });

   // ODO States (Operational Expense)
   const [isODOModalOpen, setIsODOModalOpen] = useState(false);
   const [odoForm, setOdoForm] = useState<{
      description: string;
      date: string;
      value: number;
      category: string;
      ledgerCode: string;
      supplierId: string;
      supplierName: string;
      paymentMethod: string;
      installments: number;
      account: string;
      competenceDate: string;
      attachments: any[];
   }>({
      description: '',
      date: new Date().toISOString().split('T')[0],
      value: 0,
      category: 'Despesas Administrativas',
      ledgerCode: '2.05.04',
      supplierId: '',
      supplierName: 'Fornecedor Diverso',
      paymentMethod: 'Boleto',
      installments: 1,
      account: '',
      competenceDate: new Date().toISOString().slice(0, 7),
      attachments: []
   });

   // ODP States (Personnel Expense)
   const [isODPModalOpen, setIsODPModalOpen] = useState(false);
   const [odpForm, setOdpForm] = useState<{
      employeeId: string;
      type: string;
      ledgerCode: string;
      value: number;
      date: string;
      competenceDate: string;
      description: string;
      paymentMethod: string;
      account: string;
   }>({
      employeeId: '',
      type: 'Salários e Ordenados',
      ledgerCode: '2.04.01',
      value: 0,
      date: new Date().toISOString().split('T')[0],
      competenceDate: new Date().toISOString().slice(0, 7),
      description: '',
      paymentMethod: 'Transferência Bancária',
      account: ''
   });

   // ODA States (Supply/Fuel Expense)
   const [isODAModalOpen, setIsODAModalOpen] = useState(false);
   const [odaForm, setOdaForm] = useState<{
      vehicleId: string;
      driverId: string;
      stationId: string;
      stationName: string;
      fuelType: string;
      liters: number;
      pricePerLiter: number;
      totalValue: number;
      km: number;
      date: string;
      competenceDate: string;
      paymentMethod: string;
      account: string;
      description: string;
   }>({
      vehicleId: '',
      driverId: '',
      stationId: '',
      stationName: '',
      fuelType: 'Diesel S-10',
      liters: 0,
      pricePerLiter: 0,
      totalValue: 0,
      km: 0,
      date: new Date().toISOString().split('T')[0],
      competenceDate: new Date().toISOString().slice(0, 7),
      paymentMethod: 'Cartão de Crédito Corp.',
      account: '',
      description: ''
   });

   // Format currency helper
   const formatCurrency = (val: number) => {
      return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
   };

   // Cart Management
   const addItemToOrder = (product: InventoryItem) => {
      const exists = orderItems.find(item => item.id === product.id);
      if (exists) {
         setOrderItems(orderItems.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item));
      } else {
         setOrderItems([...orderItems, {
            id: product.id,
            name: product.name,
            quantity: 1,
            unit: product.unit,
            price: product.price
         }]);
      }
   };

   const removeItem = (id: string) => {
      setOrderItems(orderItems.filter(item => item.id !== id));
   };

   const updateItemQuantity = (id: string, qty: number) => {
      setOrderItems(orderItems.map(item => item.id === id ? { ...item, quantity: Math.max(0.1, qty) } : item));
   };

   const orderSubtotal = orderItems.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);
   const orderTotal = orderSubtotal + shippingCost;

   const handleCreateOrder = async () => {
      if (isSubmitting) return;

      if (!selectedSupplier || orderItems.length === 0) {
         addToast("Selecione um fornecedor e adicione itens à ordem.", 'warning');
         return;
      }

      setIsSubmitting(true);
      await new Promise(resolve => setTimeout(resolve, 800));

      const supplier = suppliers.find(s => s.id === selectedSupplier);
      const newOrder: PurchaseOrder = {
         id: `PO-${Date.now()}`,
         supplierId: selectedSupplier,
         supplierName: supplier?.name || 'Fornecedor Desconhecido',
         date: new Date().toLocaleDateString('pt-BR'),
         items: orderItems,
         subtotal: orderSubtotal,
         total: orderTotal,
         status: 'Pendente',
         attachments: tempAttachments,
         paymentTerms,
         shippingCost,
         targetAccountId: sourceAccount
      };

      addPurchaseOrder(newOrder);
      addToast(`Ordem de Compra #${newOrder.id} enviada para a Central de Aprovações!`, 'success');

      setOrderItems([]);
      setSelectedSupplier('');
      setTempAttachments([]);
      setShippingCost(0);
      setSourceAccount('');
      setActiveTab('orders');
      setIsSubmitting(false);
   };

   const handleApproveOrder = (order: PurchaseOrder) => {
      addToast(`Confirmar aprovação da ordem #${order.id}?`, 'info', 10000, {
         label: 'APROVAR',
         onClick: () => {
            updatePurchaseOrder({ ...order, status: 'Aprovado' });
            addToast(`Ordem #${order.id} aprovada! Pronta para faturamento e recebimento.`, 'success');
         }
      });
   };

   const handleRejectOrder = (order: PurchaseOrder) => {
      addToast(`Rejeitar ordem #${order.id}? Ela será cancelada.`, 'warning', 10000, {
         label: 'REJEITAR',
         onClick: () => {
            updatePurchaseOrder({ ...order, status: 'Cancelado' });
            addToast(`Ordem #${order.id} cancelada.`, 'error');
         }
      });
   };

   // Open Inspection Modal for Receiving
   const handleOpenReceiveInspection = (order: PurchaseOrder) => {
      if (order.status !== 'Aprovado') {
         addToast("A ordem precisa ser APROVADA antes de ser recebida.", 'warning');
         return;
      }
      setInspectingOrder(order);
      setInspectionInvoiceNumber('');
      setInspectionReceivedDate(new Date().toLocaleDateString('pt-BR'));
      setInspectionAccountId(order.targetAccountId || accounts[0]?.id || '');
      setInspectionNotes('');
      setIsReceiveInspectionModalOpen(true);
   };

   // Confirm Receipt from Inspection Modal
   const handleConfirmReceiveOrder = () => {
      if (!inspectingOrder) return;
      receivePurchaseOrder(inspectingOrder.id);
      addToast(`Recebimento da ordem #${inspectingOrder.id} confirmado com sucesso! Estoque e contas a pagar integrados.`, 'success');
      setIsReceiveInspectionModalOpen(false);
      setInspectingOrder(null);
   };

   // Batch Approve Selected Orders
   const handleBatchApprove = () => {
      if (selectedOrderIdsForApproval.length === 0) {
         addToast("Nenhuma ordem selecionada para aprovação em lote.", 'warning');
         return;
      }

      addToast(`Aprovar ${selectedOrderIdsForApproval.length} ordens selecionadas?`, 'info', 8000, {
         label: 'CONFIRMAR TODAS',
         onClick: () => {
            selectedOrderIdsForApproval.forEach(id => {
               const ord = purchaseOrders.find(o => o.id === id);
               if (ord && ord.status === 'Pendente') {
                  updatePurchaseOrder({ ...ord, status: 'Aprovado' });
               }
            });
            addToast(`${selectedOrderIdsForApproval.length} ordens foram aprovadas com sucesso!`, 'success');
            setSelectedOrderIdsForApproval([]);
         }
      });
   };

   // Quotation Approval -> Generates Official Purchase Order
   const handleApproveQuotation = (quotation: Quotation, winningQuote: SupplierQuoteEntry) => {
      addToast(`Aprovar cotação com ${winningQuote.supplierName} (${formatCurrency(winningQuote.totalPrice)})?`, 'info', 10000, {
         label: 'GERAR PEDIDO DE COMPRA',
         onClick: () => {
            const poId = `PO-COT-${Date.now()}`;
            const officialOrder: PurchaseOrder = {
               id: poId,
               supplierId: winningQuote.supplierId,
               supplierName: winningQuote.supplierName,
               date: new Date().toLocaleDateString('pt-BR'),
               items: quotation.items.map(it => ({
                  id: it.productId || `ITM-${Date.now()}`,
                  name: it.productName,
                  quantity: it.quantity,
                  unit: it.unit,
                  price: winningQuote.unitPrice
               })),
               subtotal: winningQuote.totalPrice,
               total: winningQuote.totalPrice,
               status: 'Aprovado', // Directly approved by executive decision
               paymentTerms: winningQuote.paymentTerms,
               ledgerCode: '2.02.03',
               ledgerName: 'Insumos Industriais (Cotação Aprovada)'
            };

            addPurchaseOrder(officialOrder);

            // Update Quotation Status
            setQuotations(prev => prev.map(q => q.id === quotation.id ? {
               ...q,
               status: 'Aprovada' as const,
               winningSupplierId: winningQuote.supplierId,
               winningOrderId: poId
            } : q));

            addToast(`Cotação aprovada! Ordem de Compra Oficial #${poId} gerada e autorizada.`, 'success');
            setActiveTab('orders');
         }
      });
   };

   const handleSaveStock = (e: React.FormEvent) => {
      e.preventDefault();
      if (!isAdmin) {
         addToast("Apenas administradores podem cadastrar itens ou realizar ajustes avulsos de estoque.", 'error');
         setIsStockModalOpen(false);
         return;
      }
      const item = {
         ...stockForm,
         id: editingItem?.id || `ITM-${Date.now()}`,
      } as InventoryItem;

      if (editingItem) {
         updateStockItem(item);
         addToast("Item de estoque atualizado!", 'success');
      } else {
         addStockItem(item);
         addToast("Novo insumo cadastrado no estoque!", 'success');
      }
      setIsStockModalOpen(false);
      setEditingItem(null);
      setStockForm({ name: '', category: 'Insumos', quantity: 0, minStock: 0, unit: 'kg', price: 0 });
   };

   const handleSaveSupplier = (e: React.FormEvent) => {
      e.preventDefault();
      const supplier = {
         ...supForm,
         id: editingSupplier?.id || `SUP-${Date.now()}`,
      } as Supplier;

      if (editingSupplier) {
         updateSupplier(supplier);
         addToast("Fornecedor atualizado!", 'success');
      } else {
         addSupplier(supplier);
         addToast("Fornecedor cadastrado com sucesso!", 'success');
      }
      setIsSupplierModalOpen(false);
      setEditingSupplier(null);
      setSupForm({ status: 'Ativo', registeredAt: new Date().toLocaleDateString('pt-BR') });
   };

   // Export Orders to CSV
   const handleExportOrdersCSV = () => {
      const data = filteredOrders.map(o => ({
         'ID Ordem': o.id,
         'Data': o.date,
         'Fornecedor': o.supplierName,
         'Qtd Itens': o.items.length,
         'Valor Total': o.total,
         'Status': o.status,
         'Condicao Pagamento': o.paymentTerms || '-',
         'Classificacao': o.ledgerName || 'Material de Consumo'
      }));
      exportToCSV(data, 'Ordens_de_Compra_InfraCore');
      addToast("Histórico de compras exportado para CSV!", 'success');
   };

   // Export Quotations to CSV
   const handleExportQuotationsCSV = () => {
      const data = filteredQuotations.map(q => {
         const quotesSorted = [...q.supplierQuotes].sort((a, b) => a.totalPrice - b.totalPrice);
         const best = quotesSorted[0];
         return {
            'ID Cotacao': q.id,
            'Titulo': q.title,
            'Data': q.date,
            'Validade': q.expiryDate,
            'Status': q.status,
            'Melhor Fornecedor': best?.supplierName || '-',
            'Melhor Preco Total': best?.totalPrice || 0,
            'Prazo Entrega': best ? `${best.deliveryDays} dias` : '-'
         };
      });
      exportToCSV(data, 'Mapa_Comparativo_Cotacoes');
      addToast("Mapa de cotações exportado!", 'success');
   };

   // Filtered Orders
   const filteredOrders = useMemo(() => {
      return purchaseOrders.filter(order => {
         const matchesTerm = order.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.items.some(i => i.name.toLowerCase().includes(searchTerm.toLowerCase()));

         const matchesStatus = statusFilter === 'Todos' || order.status === statusFilter;

         let matchesType = true;
         if (orderTypeFilter === 'OCP') matchesType = order.id.startsWith('PO-');
         else if (orderTypeFilter === 'OSM') matchesType = order.id.startsWith('M-') || order.ledgerCode?.startsWith('2.02.02') === true;
         else if (orderTypeFilter === 'ODO') matchesType = order.id.startsWith('ODO-');
         else if (orderTypeFilter === 'ODP') matchesType = order.id.startsWith('ODP-');
         else if (orderTypeFilter === 'ODA') matchesType = order.id.startsWith('ODA-');

         return matchesTerm && matchesStatus && matchesType;
      });
   }, [purchaseOrders, searchTerm, statusFilter, orderTypeFilter]);

   // Filtered Quotations
   const filteredQuotations = useMemo(() => {
      return quotations.filter(q => {
         const matchesSearch = !quotationSearch.trim() ||
            q.id.toLowerCase().includes(quotationSearch.toLowerCase()) ||
            q.title.toLowerCase().includes(quotationSearch.toLowerCase()) ||
            q.supplierQuotes.some(sq => sq.supplierName.toLowerCase().includes(quotationSearch.toLowerCase()));

         const matchesStatus = quotationStatusFilter === 'Todas' || q.status === quotationStatusFilter;

         return matchesSearch && matchesStatus;
      });
   }, [quotations, quotationSearch, quotationStatusFilter]);

   const handlePrintPurchaseOrder = (order: PurchaseOrder) => {
      const html = `
         <div class="header">
            <div class="company-info">
               <h1 style="color: #0891b2; font-size:24px; margin:0;">INFRACORE ERP</h1>
               <p style="margin:2px 0; color:#64748b; font-size:12px;">Sistemas de Gestão para Engenharia e Indústria</p>
            </div>
            <div class="doc-info" style="text-align: right;">
               <h2 style="margin:0; font-size:18px;">ORDEM DE COMPRA OFICIAL</h2>
               <p style="margin:2px 0; font-size:12px;">Nº: <strong>${order.id}</strong> | Emissão: ${order.date}</p>
            </div>
         </div>

         <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:16px; margin:20px 0; display:grid; grid-template-columns:1fr 1fr; gap:20px;">
            <div>
               <h3 style="margin:0 0 6px 0; font-size:11px; text-transform:uppercase; color:#64748b;">DADOS DO FORNECEDOR</h3>
               <p style="margin:0; font-size:15px; font-weight:bold; color:#1e293b;">${order.supplierName}</p>
               <p style="margin:4px 0 0 0; font-size:12px; color:#475569;">Condição de Pagamento: <strong>${order.paymentTerms || 'Conforme Acordo'}</strong></p>
            </div>
            <div>
               <h3 style="margin:0 0 6px 0; font-size:11px; text-transform:uppercase; color:#64748b;">SITUAÇÃO DO PEDIDO</h3>
               <p style="margin:0; font-size:15px; font-weight:bold; color:#0891b2;">${order.status.toUpperCase()}</p>
               <p style="margin:4px 0 0 0; font-size:12px; color:#475569;">Plano Contábil: <strong>${order.ledgerName || 'Material de Consumo'}</strong></p>
            </div>
         </div>

         <table style="width:100%; border-collapse:collapse; margin-top:10px;">
            <thead>
               <tr style="background:#f1f5f9; text-align:left; font-size:11px; text-transform:uppercase; color:#475569;">
                  <th style="padding:10px; border:1px solid #cbd5e1;">Descrição do Item</th>
                  <th style="padding:10px; border:1px solid #cbd5e1; text-align:center;">Qtd</th>
                  <th style="padding:10px; border:1px solid #cbd5e1; text-align:center;">UN</th>
                  <th style="padding:10px; border:1px solid #cbd5e1; text-align:right;">Valor Unit.</th>
                  <th style="padding:10px; border:1px solid #cbd5e1; text-align:right;">Subtotal</th>
               </tr>
            </thead>
            <tbody>
               ${order.items.map(item => `
                  <tr style="font-size:12px;">
                     <td style="padding:8px 10px; border:1px solid #cbd5e1;"><strong>${item.name}</strong></td>
                     <td style="padding:8px 10px; border:1px solid #cbd5e1; text-align:center;">${item.quantity}</td>
                     <td style="padding:8px 10px; border:1px solid #cbd5e1; text-align:center;">${item.unit || 'UN'}</td>
                     <td style="padding:8px 10px; border:1px solid #cbd5e1; text-align:right;">${formatCurrency(item.price)}</td>
                     <td style="padding:8px 10px; border:1px solid #cbd5e1; text-align:right; font-weight:bold;">${formatCurrency(item.price * item.quantity)}</td>
                  </tr>
               `).join('')}
            </tbody>
         </table>

         <div style="margin-top:20px; text-align:right; border-top:2px solid #0891b2; padding-top:10px;">
            <p style="margin:0; font-size:16px; font-weight:900; color:#0e7490;">VALOR TOTAL DO PEDIDO: ${formatCurrency(order.total)}</p>
         </div>

         <div style="margin-top: 40px; border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px; font-size: 11px; color: #475569; background:#fbfcfe;">
            <h4 style="margin: 0 0 6px 0; font-size: 11px; color: #0891b2; text-transform:uppercase;">INSTRUÇÕES DE ENTREGA & FISCAL</h4>
            <p style="margin: 2px 0;">1. O recebimento está condicionado à apresentação do DANFE correspondente e conferência física.</p>
            <p style="margin: 2px 0;">2. Em caso de divergência de qualidade ou quantidade, o lote será rejeitado na portaria.</p>
            <p style="margin: 2px 0;">3. Dados cadastrais e faturamento conforme emitido pelo departamento de suprimentos.</p>
         </div>

         <div style="margin-top: 60px; display: grid; grid-template-columns: 1fr 1fr; gap: 40px;">
            <div style="border-top: 1px solid #000; text-align:center; font-size:11px; padding-top:6px;">Gestor de Compras / Suprimentos</div>
            <div style="border-top: 1px solid #000; text-align:center; font-size:11px; padding-top:6px;">Diretoria de Operações / Aprovação</div>
         </div>
      `;
      printDocument(`Ordem_Compra_${order.id}_${order.supplierName.replace(/\s+/g, '_')}`, html);
   };

   // Print Quotation Comparison Sheet
   const handlePrintQuotationSheet = (quotation: Quotation) => {
      const sortedQuotes = [...quotation.supplierQuotes].sort((a, b) => a.totalPrice - b.totalPrice);
      const lowest = sortedQuotes[0];
      const highest = sortedQuotes[sortedQuotes.length - 1];
      const savings = highest ? highest.totalPrice - lowest.totalPrice : 0;

      const html = `
         <div class="header">
            <div class="company-info">
               <h1 style="color: #0891b2; font-size:24px; margin:0;">INFRACORE SUPRIMENTOS</h1>
               <p style="margin:2px 0; color:#64748b; font-size:12px;">Mapa Comparativo de Cotações (Mínimo 3 Cotações)</p>
            </div>
            <div class="doc-info" style="text-align: right;">
               <h2 style="margin:0; font-size:18px;">MAPA DE COTAÇÃO</h2>
               <p style="margin:2px 0; font-size:12px;">ID: <strong>${quotation.id}</strong> | Data: ${quotation.date}</p>
            </div>
         </div>

         <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:16px; margin:20px 0;">
            <p style="margin:0; font-size:16px; font-weight:bold; color:#1e293b;">OBJETO: ${quotation.title.toUpperCase()}</p>
            <p style="margin:4px 0 0 0; font-size:12px; color:#64748b;">Solicitado por: <strong>${quotation.requestedBy}</strong> | Status: <strong>${quotation.status}</strong></p>
         </div>

         <h3 style="font-size:12px; text-transform:uppercase; color:#475569;">Quadro Comparativo de Propostas</h3>
         <table style="width:100%; border-collapse:collapse; margin-top:10px;">
            <thead>
               <tr style="background:#f1f5f9; text-align:left; font-size:11px; text-transform:uppercase; color:#475569;">
                  <th style="padding:10px; border:1px solid #cbd5e1;">Fornecedor</th>
                  <th style="padding:10px; border:1px solid #cbd5e1; text-align:center;">Prazo Entrega</th>
                  <th style="padding:10px; border:1px solid #cbd5e1; text-align:center;">Condição Pgto</th>
                  <th style="padding:10px; border:1px solid #cbd5e1; text-align:right;">Valor Proposta</th>
                  <th style="padding:10px; border:1px solid #cbd5e1; text-align:center;">Classificação</th>
               </tr>
            </thead>
            <tbody>
               ${sortedQuotes.map((q, idx) => `
                  <tr style="font-size:12px; ${idx === 0 ? 'background:#ecfdf5;' : ''}">
                     <td style="padding:10px; border:1px solid #cbd5e1;"><strong>${q.supplierName}</strong> ${idx === 0 ? '<span style="color:#059669; font-weight:bold;">★ MELHOR PREÇO</span>' : ''}</td>
                     <td style="padding:10px; border:1px solid #cbd5e1; text-align:center;">${q.deliveryDays} dias</td>
                     <td style="padding:10px; border:1px solid #cbd5e1; text-align:center;">${q.paymentTerms}</td>
                     <td style="padding:10px; border:1px solid #cbd5e1; text-align:right; font-weight:bold;">${formatCurrency(q.totalPrice)}</td>
                     <td style="padding:10px; border:1px solid #cbd5e1; text-align:center;">${idx + 1}º Lugar</td>
                  </tr>
               `).join('')}
            </tbody>
         </table>

         <div style="margin-top:20px; background:#ecfdf5; border:1px solid #a7f3d0; padding:15px; border-radius:8px;">
            <p style="margin:0; font-size:13px; font-weight:bold; color:#065f46;">
               Economia estimada de ${formatCurrency(savings)} contratando o fornecedor vencedor (${lowest?.supplierName}).
            </p>
         </div>

         <div style="margin-top: 60px; display: grid; grid-template-columns: 1fr 1fr; gap: 40px;">
            <div style="border-top: 1px solid #000; text-align:center; font-size:11px; padding-top:6px;">Analista de Suprimentos / Comprador</div>
            <div style="border-top: 1px solid #000; text-align:center; font-size:11px; padding-top:6px;">Parecer da Diretoria / Aprovação</div>
         </div>
      `;
      printDocument(`Mapa_Cotacao_${quotation.id}`, html);
   };

   const getStatusColor = (status: string) => {
      switch (status) {
         case 'Recebido': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200';
         case 'Pendente': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200';
         case 'Aprovado': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200';
         case 'Cancelado': return 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 border-rose-200';
         default: return 'bg-gray-100 text-gray-500';
      }
   };

   const handleSaveOSM = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedVehicleId) return;
      if (isSubmitting) return;

      try {
         setIsSubmitting(true);
         await new Promise(resolve => setTimeout(resolve, 800));

         const record: MaintenanceRecord = {
            id: `M-${Date.now()}`,
            vehicleId: selectedVehicleId,
            date: osmForm.date || '',
            type: osmForm.type as any || 'Preventiva',
            description: osmForm.description || '',
            cost: Number(osmForm.cost) || 0,
            km: Number(osmForm.km) || 0,
            mechanic: osmForm.mechanic,
            attachments: osmForm.attachments,
            productId: osmForm.productId,
            productQuantity: osmForm.productQuantity,
            debitAccountId: osmForm.debitAccountId,
            ledgerCode: osmForm.ledgerCode,
            ledgerName: osmForm.ledgerName
         };

         addMaintenanceRecord(selectedVehicleId, record);
         addToast("OSM gerada com sucesso e integrada à frota!", 'success');
         setIsOSMModalOpen(false);
         setOsmForm({
            type: 'Preventiva',
            date: new Date().toISOString().split('T')[0],
            cost: 0,
            km: 0,
            attachments: []
         });
      } catch (error) {
         console.error(error);
         addToast("Erro ao processar OSM.", 'error');
      } finally {
         setIsSubmitting(false);
      }
   };

   const handleSaveODO = async (e: React.FormEvent) => {
      e.preventDefault();
      if (isSubmitting) return;

      try {
         setIsSubmitting(true);
         await new Promise(resolve => setTimeout(resolve, 800));

         const selectedSup = suppliers.find(s => s.id === odoForm.supplierId);
         const finalSupplierName = selectedSup ? selectedSup.name : odoForm.supplierName;

         const newOrder: PurchaseOrder = {
            id: `ODO-${Date.now()}`,
            supplierId: odoForm.supplierId || 'DVERSO',
            supplierName: finalSupplierName,
            date: new Date(odoForm.date).toLocaleDateString('pt-BR'),
            items: [{
               id: `SERV-${Date.now()}`,
               name: odoForm.description,
               quantity: 1,
               unit: 'SV',
               price: odoForm.value
            }],
            subtotal: odoForm.value,
            total: odoForm.value,
            status: 'Pendente',
            attachments: odoForm.attachments,
            paymentTerms: odoForm.paymentMethod,
            shippingCost: 0,
            ledgerName: odoForm.category,
            targetAccountId: odoForm.account,
            ledgerCode: odoForm.ledgerCode,
            competenceDate: odoForm.competenceDate
         };

         addPurchaseOrder(newOrder);
         addToast("ODO gerada e enviada para aprovação financeira!", 'success');
         setIsODOModalOpen(false);
         setOdoForm({
            description: '',
            date: new Date().toISOString().split('T')[0],
            value: 0,
            category: 'Despesas Administrativas',
            ledgerCode: '2.05.04',
            supplierId: '',
            supplierName: 'Fornecedor Diverso',
            paymentMethod: 'Boleto',
            installments: 1,
            account: '',
            competenceDate: new Date().toISOString().slice(0, 7),
            attachments: []
         });
      } catch (error) {
         console.error(error);
         addToast("Erro ao processar ODO.", 'error');
      } finally {
         setIsSubmitting(false);
      }
   };

   const handleSaveODP = async (e: React.FormEvent) => {
      e.preventDefault();
      if (isSubmitting) return;

      try {
         setIsSubmitting(true);
         await new Promise(resolve => setTimeout(resolve, 800));

         const employee = employees.find(emp => emp.id === odpForm.employeeId);
         if (!employee) {
            addToast("Funcionário não encontrado.", 'error');
            return;
         }

         const newOrder: PurchaseOrder = {
            id: `ODP-${Date.now()}`,
            supplierId: employee.id,
            supplierName: employee.name,
            date: new Date(odpForm.date).toLocaleDateString('pt-BR'),
            items: [{
               id: `SERV-${Date.now()}`,
               name: `${odpForm.type}: ${odpForm.description}`,
               quantity: 1,
               unit: 'UN',
               price: odpForm.value
            }],
            subtotal: odpForm.value,
            total: odpForm.value,
            status: 'Pendente',
            attachments: [],
            paymentTerms: odpForm.paymentMethod,
            shippingCost: 0,
            ledgerName: odpForm.type,
            targetAccountId: odpForm.account,
            ledgerCode: odpForm.ledgerCode,
            competenceDate: odpForm.competenceDate
         };

         addPurchaseOrder(newOrder);
         addToast("ODP gerada com sucesso e enviada para aprovação!", 'success');
         setIsODPModalOpen(false);
         setOdpForm({
            employeeId: '',
            type: 'Salários e Ordenados',
            ledgerCode: '2.04.01',
            value: 0,
            date: new Date().toISOString().split('T')[0],
            competenceDate: new Date().toISOString().slice(0, 7),
            description: '',
            paymentMethod: 'Transferência Bancária',
            account: ''
         });
      } catch (error) {
         console.error(error);
         addToast("Erro ao processar ODP.", 'error');
      } finally {
         setIsSubmitting(false);
      }
   };

   const handleSaveODA = async (e: React.FormEvent) => {
      e.preventDefault();
      if (isSubmitting) return;

      if (!odaForm.vehicleId || !odaForm.stationId) {
         addToast("Selecione o veículo e o posto de abastecimento.", 'warning');
         return;
      }

      try {
         setIsSubmitting(true);
         await new Promise(resolve => setTimeout(resolve, 800));

         const vehicle = fleet.find(v => v.id === odaForm.vehicleId);
         const station = suppliers.find(s => s.id === odaForm.stationId);
         const driver = employees.find(e => e.id === odaForm.driverId);

         if (!vehicle || !station) return;

         const newOrder: PurchaseOrder = {
            id: `ODA-${Date.now()}`,
            supplierId: station.id,
            supplierName: station.name,
            date: new Date(odaForm.date).toLocaleDateString('pt-BR'),
            items: [{
               id: `FUEL-${Date.now()}`,
               name: `${odaForm.fuelType} - ${vehicle.plate} (${vehicle.name})`,
               quantity: odaForm.liters,
               unit: 'L',
               price: odaForm.pricePerLiter
            }],
            subtotal: odaForm.totalValue,
            total: odaForm.totalValue,
            status: 'Pendente',
            attachments: [],
            paymentTerms: odaForm.paymentMethod,
            shippingCost: 0,
            ledgerName: 'Combustíveis e Lubrificantes',
            targetAccountId: odaForm.account,
            ledgerCode: '2.03.02',
            competenceDate: odaForm.competenceDate
         };

         addPurchaseOrder(newOrder);

         const fuelLog: any = {
            id: `LOG-ODA-${Date.now()}`,
            vehicleId: vehicle.id,
            date: odaForm.date,
            liters: odaForm.liters,
            cost: odaForm.totalValue,
            km: odaForm.km,
            fuelType: odaForm.fuelType,
            ledgerCode: '2.03.02',
            ledgerName: 'Combustíveis e Lubrificantes',
            pricePerLiter: odaForm.pricePerLiter,
            isPaid: false,
            attachments: [],
            driverName: driver ? driver.name : 'Motorista não informado'
         };

         addFuelLog(vehicle.id, fuelLog);
         addToast("ODA gerada com sucesso e ticket registrado na frota!", 'success');
         setIsODAModalOpen(false);
         setOdaForm({
            vehicleId: '',
            driverId: '',
            stationId: '',
            stationName: '',
            fuelType: 'Diesel S-10',
            liters: 0,
            pricePerLiter: 0,
            totalValue: 0,
            km: 0,
            date: new Date().toISOString().split('T')[0],
            competenceDate: new Date().toISOString().slice(0, 7),
            paymentMethod: 'Cartão de Crédito Corp.',
            account: '',
            description: ''
         });
      } catch (error) {
         console.error(error);
         addToast("Erro ao processar ODA.", 'error');
      } finally {
         setIsSubmitting(false);
      }
   };

   return (
      <div className="flex flex-col gap-6 animate-in fade-in duration-500 pb-10">
         {/* Header */}
         <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
               <h2 className="text-2xl font-bold text-slate-900 dark:text-white font-display flex items-center gap-2">
                  <ShoppingBag className="text-cyan-600" />
                  Módulo de Compras & Suprimentos
               </h2>
               <p className="text-slate-500 dark:text-gray-400 text-sm mt-1">
                  Gestão integrada de cotações, mapa comparativo, autorização de pedidos e controle de estoque.
               </p>
            </div>
            <div className="flex items-center gap-2">
               <button
                  onClick={() => setIsNewQuotationModalOpen(true)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition-all"
               >
                  <Coins size={15} /> Nova Cotação (RFQ)
               </button>
               <button
                  onClick={() => setActiveTab('new-order')}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition-all"
               >
                  <Plus size={15} /> Novo Pedido
               </button>
            </div>
         </div>

         {/* Navigation Tabs */}
         <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex space-x-6 overflow-x-auto no-scrollbar">
               {[
                  { id: 'dashboard', label: 'Painel Geral', icon: BarIcon },
                  { id: 'quotations', label: 'Cotações & Mapa Comparativo', icon: Coins },
                  { id: 'orders', label: 'Histórico de Pedidos', icon: FileText },
                  { id: 'approval', label: 'Central de Aprovações', icon: ShieldCheck, badge: purchaseOrders.filter(o => o.status === 'Pendente').length },
                  { id: 'new-order', label: 'Nova Compra (OCP)', icon: Plus },
                  { id: 'suppliers', label: 'Fornecedores', icon: Users },
                  { id: 'inventory', label: 'Estoque de Insumos', icon: Warehouse }
               ].map(tab => {
                  const Icon = tab.icon;
                  return (
                     <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`py-3.5 px-2 border-b-2 font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 whitespace-nowrap ${
                           activeTab === tab.id
                              ? 'border-cyan-500 text-cyan-600 dark:text-cyan-400'
                              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                        }`}
                     >
                        <Icon size={16} />
                        {tab.label}
                        {tab.badge ? (
                           <span className="ml-1 px-1.5 py-0.2 bg-amber-500 text-white rounded-full text-[9px] font-black">
                              {tab.badge}
                           </span>
                        ) : null}
                     </button>
                  );
               })}
            </nav>
         </div>

         {/* TAB 1: DASHBOARD */}
         {activeTab === 'dashboard' && (
            <div className="space-y-6">
               {/* Quick Action Buttons */}
               <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                  <button
                     onClick={() => setActiveTab('new-order')}
                     className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 hover:border-cyan-500 dark:hover:border-cyan-500 rounded-xl shadow-sm hover:shadow transition-all text-left group"
                  >
                     <div className="p-2.5 bg-cyan-50 dark:bg-cyan-900/30 text-cyan-600 rounded-lg group-hover:scale-105 transition-transform">
                        <Plus size={18} />
                     </div>
                     <div className="min-w-0">
                        <span className="text-xs font-black text-slate-800 dark:text-white block truncate">OCP • Compra</span>
                        <span className="text-[10px] text-slate-400 block truncate">Insumos & Estoque</span>
                     </div>
                  </button>

                  <button
                     onClick={() => setIsOSMModalOpen(true)}
                     className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 hover:border-teal-500 dark:hover:border-teal-500 rounded-xl shadow-sm hover:shadow transition-all text-left group"
                  >
                     <div className="p-2.5 bg-teal-50 dark:bg-teal-900/30 text-teal-600 rounded-lg group-hover:scale-105 transition-transform">
                        <Wrench size={18} />
                     </div>
                     <div className="min-w-0">
                        <span className="text-xs font-black text-slate-800 dark:text-white block truncate">OSM • Serviço</span>
                        <span className="text-[10px] text-slate-400 block truncate">Manutenção Frota</span>
                     </div>
                  </button>

                  <button
                     onClick={() => setIsODOModalOpen(true)}
                     className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 hover:border-indigo-500 dark:hover:border-indigo-500 rounded-xl shadow-sm hover:shadow transition-all text-left group"
                  >
                     <div className="p-2.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-lg group-hover:scale-105 transition-transform">
                        <FileText size={18} />
                     </div>
                     <div className="min-w-0">
                        <span className="text-xs font-black text-slate-800 dark:text-white block truncate">ODO • Despesa</span>
                        <span className="text-[10px] text-slate-400 block truncate">Geral / Operacional</span>
                     </div>
                  </button>

                  <button
                     onClick={() => setIsODPModalOpen(true)}
                     className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 hover:border-fuchsia-500 dark:hover:border-fuchsia-500 rounded-xl shadow-sm hover:shadow transition-all text-left group"
                  >
                     <div className="p-2.5 bg-fuchsia-50 dark:bg-fuchsia-900/30 text-fuchsia-600 rounded-lg group-hover:scale-105 transition-transform">
                        <Users size={18} />
                     </div>
                     <div className="min-w-0">
                        <span className="text-xs font-black text-slate-800 dark:text-white block truncate">ODP • Pessoal</span>
                        <span className="text-[10px] text-slate-400 block truncate">Salários & RH</span>
                     </div>
                  </button>

                  <button
                     onClick={() => setIsODAModalOpen(true)}
                     className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 hover:border-amber-500 dark:hover:border-amber-500 rounded-xl shadow-sm hover:shadow transition-all text-left group"
                  >
                     <div className="p-2.5 bg-amber-50 dark:bg-amber-900/30 text-amber-600 rounded-lg group-hover:scale-105 transition-transform">
                        <Fuel size={18} />
                     </div>
                     <div className="min-w-0">
                        <span className="text-xs font-black text-slate-800 dark:text-white block truncate">ODA • Combustível</span>
                        <span className="text-[10px] text-slate-400 block truncate">Abastecimento Frota</span>
                     </div>
                  </button>
               </div>

               {/* Stats KPI Strip */}
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-gray-700">
                     <div className="flex justify-between items-start mb-3">
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-xl">
                           <ShoppingBag size={22} />
                        </div>
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700">Total Geral</span>
                     </div>
                     <p className="text-xs text-slate-400 font-bold uppercase mb-1">Volume de Compras</p>
                     <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                        {formatCurrency(purchaseOrders.reduce((acc, curr) => acc + curr.total, 0))}
                     </h3>
                     <div className="mt-2 text-[10px] text-slate-400">{purchaseOrders.length} ordens registradas no sistema</div>
                  </div>

                  <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-gray-700">
                     <div className="flex justify-between items-start mb-3">
                        <div className="p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-600 rounded-xl">
                           <Clock size={22} />
                        </div>
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-black">
                           {purchaseOrders.filter(o => o.status === 'Pendente').length}
                        </span>
                     </div>
                     <p className="text-xs text-slate-400 font-bold uppercase mb-1">Aguardando Autorização</p>
                     <h3 className="text-2xl font-black text-amber-600">
                        {formatCurrency(purchaseOrders.filter(o => o.status === 'Pendente').reduce((acc, curr) => acc + curr.total, 0))}
                     </h3>
                     <div className="mt-2 text-[10px] text-slate-400">Ordens pendentes na central de aprovação</div>
                  </div>

                  <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-gray-700">
                     <div className="flex justify-between items-start mb-3">
                        <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-xl">
                           <Coins size={22} />
                        </div>
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 font-black">
                           {quotations.filter(q => q.status === 'Em Cotação' || q.status === 'Analisada').length}
                        </span>
                     </div>
                     <p className="text-xs text-slate-400 font-bold uppercase mb-1">Cotações em Andamento</p>
                     <h3 className="text-2xl font-black text-indigo-600">
                        {quotations.length} RFQs
                     </h3>
                     <div className="mt-2 text-[10px] text-slate-400">Processos de tomada de preço abertos</div>
                  </div>

                  <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-gray-700">
                     <div className="flex justify-between items-start mb-3">
                        <div className="p-3 bg-rose-50 dark:bg-rose-900/20 text-rose-600 rounded-xl">
                           <AlertCircle size={22} />
                        </div>
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 font-black">
                           {inventory.filter(i => i.quantity < i.minStock).length} Críticos
                        </span>
                     </div>
                     <p className="text-xs text-slate-400 font-bold uppercase mb-1">Reposição de Insumos</p>
                     <h3 className="text-2xl font-black text-rose-600">Alerta de Estoque</h3>
                     <div className="mt-2 text-[10px] text-slate-400">Insumos abaixo do estoque de segurança</div>
                  </div>
               </div>

               {/* Chart & Quick Preview */}
               <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-slate-200 dark:border-gray-700 p-6">
                     <div className="flex items-center justify-between mb-6">
                        <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                           <BarIcon className="text-cyan-600" size={18} />
                           Volume de Despesas Mensal
                        </h3>
                     </div>
                     <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                           <BarChart data={[
                              { name: 'Jul', total: 45000 },
                              { name: 'Ago', total: 52000 },
                              { name: 'Set', total: 38000 },
                              { name: 'Out', total: 61000 },
                              { name: 'Nov', total: 47000 },
                              { name: 'Dez', total: 55000 },
                           ]}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                              <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none' }} />
                              <Bar dataKey="total" fill="#0891b2" radius={[4, 4, 0, 0]} barSize={30} />
                           </BarChart>
                        </ResponsiveContainer>
                     </div>
                  </div>

                  <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-gray-700 flex flex-col justify-between">
                     <div>
                        <div className="flex items-center gap-2 text-cyan-600 dark:text-cyan-400 mb-2">
                           <Coins size={18} />
                           <span className="text-[10px] font-black uppercase tracking-wider">Diretriz de Suprimentos</span>
                        </div>
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Política de Cotação Mínima</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                           Aquisições de insumos acima de R$ 5.000,00 exigem mapa comparativo com no mínimo 3 propostas de fornecedores homologados para garantir melhores custos e prazos.
                        </p>
                     </div>
                     <div className="pt-4 border-t border-slate-100 dark:border-gray-700 mt-4">
                        <button
                           onClick={() => setActiveTab('quotations')}
                           className="w-full py-2.5 bg-cyan-50 dark:bg-cyan-900/30 hover:bg-cyan-100 text-cyan-700 dark:text-cyan-300 rounded-xl font-bold uppercase text-xs tracking-wider transition-colors flex items-center justify-center gap-2"
                        >
                           <Coins size={15} /> Acessar Mapa de Cotações
                        </button>
                     </div>
                  </div>
               </div>
            </div>
         )}

         {/* TAB 2: COTAÇÕES & MAPA COMPARATIVO */}
         {activeTab === 'quotations' && (
            <div className="space-y-6">
               {/* Quotations Header Control */}
               <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-gray-700 flex flex-col md:flex-row gap-4 items-center justify-between">
                  <div className="relative w-full md:w-96">
                     <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                     <input
                        type="text"
                        placeholder="Buscar cotação, objeto ou fornecedor..."
                        value={quotationSearch}
                        onChange={e => setQuotationSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                     />
                  </div>

                  <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                     <div className="flex items-center gap-1.5 text-xs text-slate-400 font-bold">
                        <Filter size={14} /> Status:
                     </div>
                     <select
                        value={quotationStatusFilter}
                        onChange={e => setQuotationStatusFilter(e.target.value)}
                        className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                     >
                        <option value="Todas">Todas as Cotações</option>
                        <option value="Em Cotação">Em Cotação</option>
                        <option value="Analisada">Analisada</option>
                        <option value="Aprovada">Aprovada</option>
                        <option value="Cancelada">Cancelada</option>
                     </select>

                     <button
                        onClick={handleExportQuotationsCSV}
                        className="px-3 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                        title="Exportar CSV"
                     >
                        <Download size={14} /> CSV
                     </button>

                     <button
                        onClick={() => setIsNewQuotationModalOpen(true)}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-indigo-600/20"
                     >
                        <Plus size={14} /> Nova Cotação (RFQ)
                     </button>
                  </div>
               </div>

               {/* Quotations Cards with Comparative Matrix */}
               <div className="space-y-6">
                  {filteredQuotations.map(quotation => {
                     const sortedQuotes = [...quotation.supplierQuotes].sort((a, b) => a.totalPrice - b.totalPrice);
                     const bestProposal = sortedQuotes[0];
                     const worstProposal = sortedQuotes[sortedQuotes.length - 1];
                     const savings = worstProposal ? (worstProposal.totalPrice - bestProposal.totalPrice) : 0;
                     const savingsPercent = worstProposal && worstProposal.totalPrice > 0 ? (savings / worstProposal.totalPrice) * 100 : 0;

                     return (
                        <div key={quotation.id} className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-gray-700 space-y-6">
                           <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 dark:border-gray-700 pb-4">
                              <div>
                                 <div className="flex items-center gap-2 mb-1">
                                    <span className="font-mono text-xs font-black text-indigo-600 dark:text-indigo-400">#{quotation.id}</span>
                                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                       quotation.status === 'Aprovada' ? 'bg-emerald-100 text-emerald-700' :
                                       quotation.status === 'Analisada' ? 'bg-indigo-100 text-indigo-700' :
                                       quotation.status === 'Em Cotação' ? 'bg-amber-100 text-amber-700' :
                                       'bg-slate-100 text-slate-600'
                                    }`}>
                                       {quotation.status}
                                    </span>
                                    <span className="text-xs text-slate-400 font-medium">• Validade: {quotation.expiryDate}</span>
                                 </div>
                                 <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight">{quotation.title}</h3>
                                 <p className="text-xs text-slate-500 mt-0.5">Solicitante: <strong>{quotation.requestedBy}</strong> | Itens: {quotation.items.map(i => `${i.quantity} ${i.unit} ${i.productName}`).join(', ')}</p>
                              </div>

                              <div className="flex items-center gap-3">
                                 {savings > 0 && (
                                    <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 px-3 py-1.5 rounded-xl text-right">
                                       <span className="text-[9px] font-black uppercase text-emerald-600 block">Economia Máxima</span>
                                       <span className="text-sm font-black text-emerald-700 dark:text-emerald-400">{formatCurrency(savings)} ({savingsPercent.toFixed(1)}%)</span>
                                    </div>
                                 )}

                                 <button
                                    onClick={() => handlePrintQuotationSheet(quotation)}
                                    className="p-2 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-indigo-600 rounded-xl transition-colors"
                                    title="Imprimir Mapa Comparativo"
                                 >
                                    <Printer size={16} />
                                 </button>
                              </div>
                           </div>

                           {/* Comparative Matrix Grid */}
                           <div>
                              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-1.5">
                                 <Award size={13} className="text-amber-500" /> Comparativo de Fornecedores ({quotation.supplierQuotes.length} Cotações)
                              </h4>

                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                 {sortedQuotes.map((quote, idx) => {
                                    const isLowest = idx === 0;
                                    const isApprovedWinner = quotation.winningSupplierId === quote.supplierId;

                                    return (
                                       <div
                                          key={idx}
                                          className={`p-4 rounded-2xl border transition-all relative flex flex-col justify-between ${
                                             isApprovedWinner ? 'bg-emerald-50/70 dark:bg-emerald-900/30 border-emerald-400 ring-2 ring-emerald-500' :
                                             isLowest ? 'bg-indigo-50/40 dark:bg-indigo-900/20 border-indigo-300' :
                                             'bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-700'
                                          }`}
                                       >
                                          {isLowest && (
                                             <div className="absolute -top-2.5 right-4 bg-emerald-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm flex items-center gap-1">
                                                <Award size={10} /> Melhor Preço
                                             </div>
                                          )}

                                          <div>
                                             <div className="flex justify-between items-start mb-2">
                                                <h5 className="font-bold text-sm text-slate-800 dark:text-white leading-tight">{quote.supplierName}</h5>
                                                <span className="text-[10px] font-black text-slate-400">{idx + 1}º Lugar</span>
                                             </div>

                                             <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                                                <div className="flex justify-between">
                                                   <span className="text-slate-400 text-[11px]">Valor Unitário:</span>
                                                   <span className="font-mono font-bold">{formatCurrency(quote.unitPrice)}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                   <span className="text-slate-400 text-[11px]">Prazo de Entrega:</span>
                                                   <span className="font-bold">{quote.deliveryDays} dias úteis</span>
                                                </div>
                                                <div className="flex justify-between">
                                                   <span className="text-slate-400 text-[11px]">Condição de Pgto:</span>
                                                   <span className="font-bold">{quote.paymentTerms}</span>
                                                </div>
                                                {quote.notes && (
                                                   <p className="text-[10px] text-slate-400 italic pt-1 border-t border-slate-100 dark:border-slate-800">
                                                      "{quote.notes}"
                                                   </p>
                                                )}
                                             </div>
                                          </div>

                                          <div className="pt-4 mt-3 border-t border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
                                             <div>
                                                <span className="text-[9px] font-black uppercase text-slate-400 block">Total Proposta</span>
                                                <span className={`text-base font-black ${isLowest ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-800 dark:text-white'}`}>
                                                   {formatCurrency(quote.totalPrice)}
                                                </span>
                                             </div>

                                             {quotation.status !== 'Aprovada' && quotation.status !== 'Cancelada' && (
                                                <button
                                                   onClick={() => handleApproveQuotation(quotation, quote)}
                                                   className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-1 shadow-sm ${
                                                      isLowest
                                                         ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                                                         : 'bg-white dark:bg-slate-700 hover:bg-slate-100 text-slate-700 dark:text-slate-200 border border-slate-200'
                                                   }`}
                                                >
                                                   <Check size={12} /> Contratar
                                                </button>
                                             )}

                                             {isApprovedWinner && (
                                                <span className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg text-[9px] font-black uppercase flex items-center gap-1">
                                                   <CheckCircle size={11} /> Contratado
                                                </span>
                                             )}
                                          </div>
                                       </div>
                                    );
                                 })}
                              </div>
                           </div>
                        </div>
                     );
                  })}

                  {filteredQuotations.length === 0 && (
                     <div className="bg-white dark:bg-gray-800 rounded-3xl p-12 text-center border border-slate-200 dark:border-gray-700">
                        <Inbox size={40} className="mx-auto text-slate-300 mb-3" />
                        <h4 className="text-base font-bold text-slate-700 dark:text-slate-300">Nenhuma cotação encontrada</h4>
                        <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">Cadastre solicitações de cotação para comparar propostas e escolher a melhor oferta de insumos.</p>
                        <button
                           onClick={() => setIsNewQuotationModalOpen(true)}
                           className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold uppercase inline-flex items-center gap-1.5"
                        >
                           <Plus size={14} /> Cadastrar Nova Cotação
                        </button>
                     </div>
                  )}
               </div>
            </div>
         )}

         {/* TAB 3: HISTÓRICO DE ORDENS / PEDIDOS */}
         {activeTab === 'orders' && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-slate-200 dark:border-gray-700 overflow-hidden">
               {/* Filters */}
               <div className="p-4 border-b border-slate-100 dark:border-gray-700 flex flex-col md:flex-row gap-4 justify-between items-center">
                  <div className="relative w-full md:w-80">
                     <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                     <input
                        type="text"
                        placeholder="Buscar fornecedor, ID ou item..."
                        className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 dark:border-gray-600 dark:bg-gray-700 text-xs font-medium outline-none"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                     />
                  </div>

                  <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                     <select
                        className="p-2 border border-slate-200 dark:border-gray-600 dark:bg-gray-700 rounded-lg text-xs font-bold"
                        value={orderTypeFilter}
                        onChange={(e) => setOrderTypeFilter(e.target.value)}
                     >
                        <option value="Todos">Tipo: Todos</option>
                        <option value="OCP">OCP (Insumos / Estoque)</option>
                        <option value="OSM">OSM (Manutenção)</option>
                        <option value="ODO">ODO (Operacional)</option>
                        <option value="ODP">ODP (Pessoal / RH)</option>
                        <option value="ODA">ODA (Abastecimento)</option>
                     </select>

                     <select
                        className="p-2 border border-slate-200 dark:border-gray-600 dark:bg-gray-700 rounded-lg text-xs font-bold"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                     >
                        <option value="Todos">Status: Todos</option>
                        <option value="Pendente">Pendente</option>
                        <option value="Aprovado">Aprovado</option>
                        <option value="Recebido">Recebido</option>
                        <option value="Cancelado">Cancelado</option>
                     </select>

                     <button
                        onClick={handleExportOrdersCSV}
                        className="flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-lg text-xs font-bold hover:bg-gray-50 transition-colors"
                        title="Exportar CSV"
                     >
                        <Download size={14} /> Exportar CSV
                     </button>
                  </div>
               </div>

               {/* Table */}
               <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                     <thead className="bg-slate-50 dark:bg-gray-700/50 text-slate-600 dark:text-gray-300 font-bold text-xs uppercase border-b border-slate-200 dark:border-gray-700">
                        <tr>
                           <th className="px-6 py-3">ID Ordem / Data</th>
                           <th className="px-6 py-3">Fornecedor / Beneficiário</th>
                           <th className="px-6 py-3">Itens / Descrição</th>
                           <th className="px-6 py-3 text-right">Valor Total</th>
                           <th className="px-6 py-3 text-center">Status / Fluxo</th>
                           <th className="px-6 py-3 text-right">Ações</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-50 dark:divide-gray-700">
                        {filteredOrders.map(order => (
                           <tr key={order.id} className="hover:bg-slate-50/80 dark:hover:bg-gray-700/50 transition-colors group">
                              <td className="px-6 py-4">
                                 <p className="font-mono text-xs font-black text-cyan-700 dark:text-cyan-400">{order.id}</p>
                                 <p className="text-[10px] text-slate-500 mt-0.5">{order.date}</p>
                              </td>
                              <td className="px-6 py-4">
                                 <p className="font-bold text-slate-800 dark:text-white">{order.supplierName}</p>
                                 <span className="text-[10px] text-slate-400">{order.ledgerName || 'Material de Consumo'}</span>
                              </td>
                              <td className="px-6 py-4">
                                 <div className="flex flex-col gap-0.5">
                                    {order.items.slice(0, 2).map((it, idx) => (
                                       <span key={idx} className="text-[10px] text-slate-500 font-medium">• {it.quantity} {it.unit} {it.name}</span>
                                    ))}
                                    {order.items.length > 2 && <span className="text-[10px] text-cyan-600 font-bold">+ {order.items.length - 2} itens</span>}
                                 </div>
                              </td>
                              <td className="px-6 py-4 text-right font-black text-slate-900 dark:text-white">
                                 {formatCurrency(order.total)}
                              </td>
                              <td className="px-6 py-4 text-center">
                                 <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${getStatusColor(order.status)}`}>
                                    {order.status}
                                 </span>
                                 <div className="flex items-center justify-center gap-1 mt-1 text-[8px] font-bold text-slate-400">
                                    <span className={order.status ? 'text-cyan-600' : ''}>1. Emissão</span>
                                    <span>→</span>
                                    <span className={order.status === 'Aprovado' || order.status === 'Recebido' ? 'text-blue-600' : ''}>2. Aprovação</span>
                                    <span>→</span>
                                    <span className={order.status === 'Recebido' ? 'text-emerald-600' : ''}>3. Entrada</span>
                                 </div>
                              </td>
                              <td className="px-6 py-4 text-right">
                                 <div className="flex items-center justify-end gap-1.5">
                                    {order.status === 'Pendente' && (
                                       <button
                                          onClick={() => handleApproveOrder(order)}
                                          className="p-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-bold transition-colors"
                                          title="Aprovar Pedido"
                                       >
                                          <Check size={15} />
                                       </button>
                                    )}

                                    {order.status === 'Aprovado' && (
                                       <button
                                          onClick={() => handleOpenReceiveInspection(order)}
                                          className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg text-[10px] font-black uppercase hover:bg-emerald-500 transition-colors shadow-sm flex items-center gap-1"
                                          title="Receber e Dar Entrada"
                                       >
                                          <Package size={12} /> Receber
                                       </button>
                                    )}

                                    <button
                                       onClick={() => setSelectedOrder(order)}
                                       className="p-1.5 text-slate-400 hover:text-cyan-600 rounded-lg transition-colors"
                                       title="Ver Detalhes"
                                    >
                                       <ArrowRight size={16} />
                                    </button>
                                    <button
                                       onClick={() => handlePrintPurchaseOrder(order)}
                                       className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg transition-colors"
                                       title="Imprimir Pedido"
                                    >
                                       <Printer size={16} />
                                    </button>
                                 </div>
                              </td>
                           </tr>
                        ))}
                        {filteredOrders.length === 0 && (
                           <tr>
                              <td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic">
                                 Nenhuma ordem encontrada para os filtros aplicados.
                              </td>
                           </tr>
                        )}
                     </tbody>
                  </table>
               </div>
            </div>
         )}

         {/* TAB 4: CENTRAL DE APROVAÇÕES (APPROVAL) */}
         {activeTab === 'approval' && (
            <div className="space-y-6">
               <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-8 rounded-3xl shadow-xl border border-slate-700 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                     <h2 className="text-2xl font-black mb-1 flex items-center gap-3">
                        <ShieldCheck className="text-emerald-400" size={28} />
                        Central de Autorização & Alçadas
                     </h2>
                     <p className="text-slate-400 text-xs font-medium">
                        Ordens pendentes aguardando liberação formal para faturamento e entrada física no almoxarifado.
                     </p>
                  </div>
                  <div className="flex items-center gap-4">
                     <div className="text-right bg-white/5 p-3 rounded-2xl border border-white/10">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Total Pendente</p>
                        <p className="text-2xl font-black text-emerald-400">
                           {formatCurrency(purchaseOrders.filter(o => o.status === 'Pendente').reduce((acc, curr) => acc + curr.total, 0))}
                        </p>
                     </div>
                     {selectedOrderIdsForApproval.length > 0 && (
                        <button
                           onClick={handleBatchApprove}
                           className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-2xl text-xs uppercase tracking-wider shadow-lg flex items-center gap-2"
                        >
                           <ShieldCheck size={16} /> Aprovar Selecionadas ({selectedOrderIdsForApproval.length})
                        </button>
                     )}
                  </div>
               </div>

               {/* Orders list awaiting approval */}
               <div className="space-y-4">
                  {purchaseOrders.filter(o => o.status === 'Pendente').map(order => {
                     const isSelected = selectedOrderIdsForApproval.includes(order.id);

                     return (
                        <div key={order.id} className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-gray-700 relative overflow-hidden group hover:shadow-md transition-all">
                           <div className="absolute top-0 left-0 w-2 h-full bg-amber-400"></div>
                           <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
                              <div className="flex items-start gap-4 flex-1">
                                 <button
                                    onClick={() => {
                                       if (isSelected) {
                                          setSelectedOrderIdsForApproval(prev => prev.filter(id => id !== order.id));
                                       } else {
                                          setSelectedOrderIdsForApproval(prev => [...prev, order.id]);
                                       }
                                    }}
                                    className="mt-1 text-slate-400 hover:text-indigo-600"
                                 >
                                    {isSelected ? <CheckSquare size={20} className="text-indigo-600" /> : <Square size={20} />}
                                 </button>

                                 <div>
                                    <div className="flex items-center gap-2 mb-1.5">
                                       <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 rounded-full text-[9px] font-black uppercase tracking-wider border border-amber-200">
                                          Aguardando Análise
                                       </span>
                                       <span className="text-xs font-mono font-bold text-slate-400">#{order.id}</span>
                                       <span className="text-xs text-slate-400">• {order.date}</span>
                                    </div>
                                    <h3 className="text-lg font-black text-slate-800 dark:text-white leading-tight">{order.supplierName}</h3>
                                    <p className="text-xs text-slate-500 mt-1">
                                       {order.items.length} itens • Condição: <strong className="text-slate-700 dark:text-slate-300">{order.paymentTerms || '30 DDL'}</strong>
                                       {order.ledgerName && ` • Classificação: ${order.ledgerName}`}
                                    </p>
                                 </div>
                              </div>

                              <div className="flex gap-6 items-center border-l dark:border-slate-700 pl-6 w-full lg:w-auto justify-between lg:justify-end">
                                 <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase">Valor Total</p>
                                    <p className="text-2xl font-black text-slate-900 dark:text-white">{formatCurrency(order.total)}</p>
                                 </div>
                                 <div className="flex gap-2">
                                    <button
                                       onClick={() => handleRejectOrder(order)}
                                       className="px-4 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-500 hover:text-rose-600 rounded-xl font-bold uppercase text-[10px] transition-colors"
                                    >
                                       Rejeitar
                                    </button>
                                    <button
                                       onClick={() => handleApproveOrder(order)}
                                       className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black uppercase text-xs shadow-md shadow-emerald-600/20 flex items-center gap-1.5"
                                    >
                                       <ShieldCheck size={16} /> Autorizar
                                    </button>
                                 </div>
                              </div>
                           </div>

                           <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700 flex gap-3 overflow-x-auto pb-1">
                              {order.items.map(item => (
                                 <div key={item.id} className="min-w-[140px] p-2.5 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-100 dark:border-slate-700 text-xs">
                                    <p className="font-bold text-slate-700 dark:text-slate-300 truncate">{item.name}</p>
                                    <div className="flex justify-between mt-1 text-[10px] text-slate-500">
                                       <span>{item.quantity} {item.unit}</span>
                                       <span className="font-bold text-emerald-600">{formatCurrency(item.price * item.quantity)}</span>
                                    </div>
                                 </div>
                              ))}
                           </div>
                        </div>
                     );
                  })}

                  {purchaseOrders.filter(o => o.status === 'Pendente').length === 0 && (
                     <div className="p-12 text-center bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-gray-700">
                        <CheckCircle size={36} className="mx-auto text-emerald-500 mb-2" />
                        <h4 className="font-bold text-slate-700 dark:text-slate-300">Todas as ordens de compra estão autorizadas!</h4>
                        <p className="text-xs text-slate-400 mt-1">Nenhum pedido pendente de aprovação no momento.</p>
                     </div>
                  )}
               </div>
            </div>
         )}

         {/* TAB 5: NOVA COMPRA (NEW ORDER) */}
         {activeTab === 'new-order' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in slide-in-from-right duration-300">
               {/* Left: Product Selector */}
               <div className="lg:col-span-2 space-y-6">
                  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-slate-200 dark:border-gray-700 p-6">
                     <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                        <Search size={20} className="text-cyan-600" />
                        Catálogo de Insumos & Matérias-Primas
                     </h3>
                     <div className="relative mb-6">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                           type="text"
                           value={catalogSearch}
                           onChange={e => setCatalogSearch(e.target.value)}
                           placeholder="Buscar por nome, categoria ou código..."
                           className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white text-xs font-bold outline-none focus:ring-2 focus:ring-cyan-500"
                        />
                     </div>

                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto pr-2">
                        {inventory
                           .filter(item =>
                              !catalogSearch.trim() ||
                              item.name.toLowerCase().includes(catalogSearch.toLowerCase()) ||
                              item.category.toLowerCase().includes(catalogSearch.toLowerCase())
                           )
                           .map(item => (
                           <button
                              key={item.id}
                              onClick={() => addItemToOrder(item)}
                              className="group p-4 bg-slate-50 dark:bg-gray-700/30 border border-slate-200 dark:border-gray-600 rounded-xl text-left hover:border-cyan-500 hover:bg-white dark:hover:bg-gray-700 transition-all"
                           >
                              <div className="flex justify-between items-start">
                                 <div>
                                    <p className="font-bold text-sm text-slate-800 dark:text-white">{item.name}</p>
                                    <p className="text-[10px] text-slate-500 dark:text-gray-400 mt-0.5">{item.category} • {item.unit}</p>
                                 </div>
                                 <Plus className="text-slate-300 group-hover:text-cyan-600 group-hover:scale-110 transition-all" size={18} />
                              </div>
                              <div className="mt-3 flex items-end justify-between">
                                 <span className="text-sm font-bold text-cyan-700 dark:text-cyan-400">{formatCurrency(item.price)}</span>
                                 <span className={`text-[10px] ${item.quantity < item.minStock ? 'text-red-500 font-bold' : 'text-slate-400'}`}>Estoque: {item.quantity}</span>
                              </div>
                           </button>
                        ))}
                     </div>
                  </div>
               </div>

               {/* Right: Cart & Supplier */}
               <div className="flex flex-col gap-6">
                  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-slate-200 dark:border-gray-700 flex flex-col h-full overflow-hidden">
                     <div className="p-4 bg-slate-50 dark:bg-gray-700/50 border-b border-slate-100 dark:border-gray-700">
                        <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                           <ShoppingBag size={18} className="text-cyan-600" />
                           Resumo do Pedido de Compra
                        </h3>
                     </div>

                     <div className="p-4 space-y-4 flex-1">
                        <div>
                           <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Fornecedor Homologado</label>
                           <select
                              className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white text-xs font-bold outline-none focus:ring-1 focus:ring-cyan-500"
                              value={selectedSupplier}
                              onChange={(e) => setSelectedSupplier(e.target.value)}
                           >
                              <option value="">Selecione um fornecedor...</option>
                              {suppliers.map(s => (
                                 <option key={s.id} value={s.id}>{s.name} ({s.category})</option>
                              ))}
                           </select>
                        </div>

                        <div className="space-y-3">
                           <label className="block text-xs font-bold text-slate-500 uppercase">Itens Selecionados ({orderItems.length})</label>
                           <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                              {orderItems.map(item => (
                                 <div key={item.id} className="p-2.5 border border-slate-100 dark:border-gray-700 rounded-xl bg-slate-50/50 dark:bg-gray-800/50 flex flex-col gap-2">
                                    <div className="flex justify-between items-start">
                                       <p className="text-xs font-bold truncate max-w-[150px]">{item.name}</p>
                                       <button onClick={() => removeItem(item.id)} className="text-slate-400 hover:text-red-500 px-1"><X size={14} /></button>
                                    </div>
                                    <div className="flex items-center justify-between">
                                       <div className="flex items-center gap-2">
                                          <input
                                             type="number"
                                             step="0.1"
                                             className="w-20 p-1 text-xs border rounded-lg dark:bg-gray-700 dark:text-white text-center font-bold"
                                             value={item.quantity}
                                             onChange={(e) => updateItemQuantity(item.id, parseFloat(e.target.value) || 0)}
                                          />
                                          <span className="text-[10px] text-slate-500">{item.unit}</span>
                                       </div>
                                       <span className="text-xs font-black text-cyan-600">{formatCurrency(item.price * item.quantity)}</span>
                                    </div>
                                 </div>
                              ))}
                              {orderItems.length === 0 && (
                                 <div className="py-8 text-center text-slate-400 text-xs italic">Nenhum insumo selecionado no carrinho.</div>
                              )}
                           </div>
                        </div>

                        {/* Attachments Section */}
                        <div className="pt-3 border-t border-slate-100 dark:border-gray-700">
                           <h4 className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                              <Paperclip size={13} className="text-cyan-600" /> Notas & Cotações Anexas
                           </h4>
                           <div className="border-2 border-dashed border-slate-100 dark:border-gray-700 rounded-xl p-3 flex flex-col items-center justify-center text-center cursor-pointer hover:border-cyan-400 transition-colors relative">
                              <input
                                 type="file"
                                 className="absolute inset-0 opacity-0 cursor-pointer"
                                 onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                       const at = { id: Date.now().toString(), name: file.name, date: new Date().toLocaleDateString('pt-BR'), size: (file.size / 1024).toFixed(1) + ' KB', type: file.type };
                                       setTempAttachments([...tempAttachments, at]);
                                    }
                                 }}
                              />
                              <Upload size={16} className="text-slate-300 mb-1" />
                              <span className="text-[9px] font-bold text-slate-400 uppercase">Anexar proposta / minuta</span>
                           </div>

                           <div className="space-y-1 mt-2 max-h-20 overflow-y-auto">
                              {tempAttachments.map(at => (
                                 <div key={at.id} className="flex items-center justify-between p-1.5 bg-slate-50 dark:bg-gray-800 rounded-lg text-xs">
                                    <span className="text-[10px] truncate max-w-[150px]">{at.name}</span>
                                    <button type="button" onClick={() => setTempAttachments(tempAttachments.filter(a => a.id !== at.id))} className="text-slate-300 hover:text-rose-500">
                                       <XCircle size={12} />
                                    </button>
                                 </div>
                              ))}
                           </div>
                        </div>

                        {/* Financial Settings */}
                        <div className="pt-3 border-t border-slate-100 dark:border-gray-700 space-y-3">
                           <div>
                              <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Condição de Pagamento</label>
                              <select
                                 className="w-full p-2 bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-600 rounded-lg text-xs font-bold"
                                 value={paymentTerms}
                                 onChange={e => setPaymentTerms(e.target.value)}
                              >
                                 <option value="À Vista">À Vista</option>
                                 <option value="15 DDL">15 Dias</option>
                                 <option value="28 DDL">28 Dias</option>
                                 <option value="30 DDL">30 Dias</option>
                                 <option value="30/60 DDL">30/60 Dias</option>
                                 <option value="30/60/90 DDL">30/60/90 Dias</option>
                              </select>
                           </div>
                           <div className="grid grid-cols-2 gap-3">
                              <div>
                                 <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Frete (R$)</label>
                                 <input
                                    type="number"
                                    className="w-full p-2 bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-600 rounded-lg text-xs font-bold"
                                    value={shippingCost}
                                    onChange={e => setShippingCost(parseFloat(e.target.value) || 0)}
                                 />
                              </div>
                              <div>
                                 <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Conta Prevista</label>
                                 <select
                                    className="w-full p-2 bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-600 rounded-lg text-xs font-bold"
                                    value={sourceAccount}
                                    onChange={e => setSourceAccount(e.target.value)}
                                 >
                                    <option value="">Selecione...</option>
                                    {accounts.map(acc => (
                                       <option key={acc.id} value={acc.id}>{acc.name}</option>
                                    ))}
                                 </select>
                              </div>
                           </div>
                        </div>
                     </div>

                     {/* Totals & Submit */}
                     <div className="p-4 bg-slate-50 dark:bg-gray-700/50 border-t border-slate-200 dark:border-gray-600 space-y-4">
                        <div className="flex justify-between items-center text-sm">
                           <span className="text-slate-500 font-bold">Subtotal:</span>
                           <span className="font-bold">{formatCurrency(orderSubtotal)}</span>
                        </div>
                        <div className="flex justify-between items-center text-lg">
                           <span className="font-bold text-slate-800 dark:text-white">Total:</span>
                           <span className="font-black text-cyan-600">{formatCurrency(orderTotal)}</span>
                        </div>

                        <button
                           onClick={() => handleCreateOrder()}
                           disabled={isSubmitting}
                           className={`w-full py-4 bg-cyan-600 hover:bg-cyan-500 rounded-xl text-xs font-black text-white shadow-lg transition-all flex items-center justify-center gap-2 uppercase tracking-wide ${isSubmitting ? 'opacity-75 cursor-not-allowed' : ''}`}
                        >
                           {isSubmitting ? <Loader className="animate-spin" size={16} /> : <ShieldCheck size={16} />}
                           {isSubmitting ? 'Processando...' : 'Enviar para Central de Aprovações'}
                        </button>
                     </div>
                  </div>
               </div>
            </div>
         )}

         {/* TAB 6: FORNECEDORES */}
         {activeTab === 'suppliers' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
               {suppliers.map(sup => (
                  <div key={sup.id} className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-gray-700 hover:border-cyan-200 transition-all group flex flex-col justify-between">
                     <div>
                        <div className="flex justify-between items-start mb-4">
                           <div className="w-12 h-12 bg-slate-100 dark:bg-gray-700 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-cyan-50 group-hover:text-cyan-600 transition-colors">
                              <Users size={24} />
                           </div>
                           <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${sup.status === 'Ativo' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                              {sup.status}
                           </span>
                        </div>
                        <h4 className="font-bold text-slate-900 dark:text-white text-lg leading-tight mb-1">{sup.name}</h4>
                        <p className="text-xs text-slate-500 mb-4">{sup.category} • {sup.document}</p>

                        <div className="space-y-2 border-t dark:border-gray-700 pt-4 mt-4">
                           <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-gray-400">
                              <Calendar size={14} className="text-slate-400" />
                              Cadastrado em: {sup.registeredAt}
                           </div>
                           <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-gray-400">
                              <DollarSign size={14} className="text-slate-400" />
                              Total Comprado: {formatCurrency(purchaseOrders.filter(o => o.supplierId === sup.id).reduce((a, b) => a + b.total, 0))}
                           </div>
                        </div>
                     </div>

                     <div className="mt-6 flex gap-2">
                        <button
                           type="button"
                           onClick={() => {
                              setEditingSupplier(sup);
                              setSupForm(sup);
                              setIsSupplierModalOpen(true);
                           }}
                           className="flex-1 py-2 bg-slate-50 dark:bg-gray-700 text-slate-600 dark:text-gray-300 rounded-lg text-xs font-bold hover:bg-cyan-50 hover:text-cyan-600 transition-colors"
                        >
                           Editar
                        </button>
                        <button
                           onClick={() => {
                              setSelectedSupplier(sup.id);
                              setActiveTab('new-order');
                           }}
                           className="flex-1 py-2 bg-cyan-600 text-white rounded-lg text-xs font-bold hover:bg-cyan-700 transition-colors"
                        >
                           Nova Ordem
                        </button>
                     </div>
                  </div>
               ))}

               <button
                  onClick={() => {
                     setEditingSupplier(null);
                     setSupForm({ status: 'Ativo', registeredAt: new Date().toLocaleDateString('pt-BR') });
                     setIsSupplierModalOpen(true);
                  }}
                  className="bg-slate-50/50 dark:bg-gray-800/50 border-2 border-dashed border-slate-200 dark:border-gray-700 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 text-slate-400 hover:border-cyan-300 hover:text-cyan-500 transition-all group min-h-[250px]"
               >
                  <div className="p-3 bg-white dark:bg-gray-700 rounded-full group-hover:scale-110 transition-transform shadow-sm">
                     <Plus size={32} />
                  </div>
                  <span className="font-bold text-sm">Adicionar Novo Fornecedor</span>
               </button>
            </div>
         )}

         {/* TAB 7: ESTOQUE DE INSUMOS */}
         {activeTab === 'inventory' && (
            <div className="space-y-6 animate-in fade-in duration-300">
               {/* Search and Filters */}
               <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-gray-700">
                  <div className="relative w-full md:w-96">
                     <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                     <input
                        type="text"
                        value={stockSearch}
                        onChange={e => setStockSearch(e.target.value)}
                        placeholder="Buscar item, categoria ou código..."
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 dark:border-gray-600 dark:bg-gray-700 text-sm outline-none"
                     />
                  </div>

                  <div className="flex items-center gap-2 overflow-x-auto no-scrollbar w-full md:w-auto">
                     {(['Todos', 'Crítico', 'Normal', 'Excedente'] as const).map(f => (
                        <button
                           type="button"
                           key={f}
                           onClick={() => setStockLevelFilter(f)}
                           className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${stockLevelFilter === f ? 'bg-slate-900 text-white shadow-md' : 'bg-slate-50 text-slate-500 border border-slate-100'}`}
                        >
                           {f}
                        </button>
                     ))}

                     {isAdmin && (
                        <button
                           onClick={() => {
                              setEditingItem(null);
                              setStockForm({ name: '', category: 'Insumos', quantity: 0, minStock: 0, unit: 'kg', price: 0 });
                              setIsStockModalOpen(true);
                           }}
                           className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-xs font-bold uppercase ml-2 flex items-center gap-1 transition-colors shadow-sm"
                        >
                           <Plus size={14} /> Novo Item
                        </button>
                     )}

                     {!isAdmin && (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-500 bg-slate-100 dark:bg-gray-700/60 dark:text-gray-400 border border-slate-200 dark:border-gray-600 ml-2 whitespace-nowrap" title="Entradas de estoque ocorrem exclusivamente através do recebimento de Ordens de Compra.">
                           <Lock size={12} className="text-amber-500" />
                           <span>Entrada via compras</span>
                        </div>
                     )}
                  </div>
               </div>

               {!isAdmin && (
                  <div className="flex items-center gap-3 p-3.5 bg-blue-50/70 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 rounded-xl text-xs text-blue-800 dark:text-blue-300">
                     <Info size={16} className="text-blue-600 dark:text-blue-400 shrink-0" />
                     <span>
                        <strong>Política de Suprimentos:</strong> A entrada física e contábil de estoque é realizada <strong>exclusivamente através do recebimento de Ordens de Compra</strong>. Cadastro avulso e ajustes manuais de saldo são restritos a administradores.
                     </span>
                  </div>
               )}

               {/* Inventory List */}
               <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-slate-200 dark:border-gray-700 overflow-hidden">
                  <div className="overflow-x-auto">
                     <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 dark:bg-gray-700/50 text-slate-600 dark:text-gray-300 font-bold text-xs uppercase border-b border-slate-200 dark:border-gray-700">
                           <tr>
                              <th className="px-6 py-4">Item / Categoria</th>
                              <th className="px-6 py-4 text-center">Status</th>
                              <th className="px-6 py-4 text-center">Quantidade</th>
                              <th className="px-6 py-4 text-right">Preço Médio</th>
                              <th className="px-6 py-4 text-right">Ações</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-gray-700">
                           {inventory
                              .filter(item => {
                                 const matchesSearch =
                                    !stockSearch.trim() ||
                                    item.name.toLowerCase().includes(stockSearch.toLowerCase()) ||
                                    item.category.toLowerCase().includes(stockSearch.toLowerCase());
                                 const matchesLevel =
                                    stockLevelFilter === 'Todos'
                                       ? true
                                       : stockLevelFilter === 'Crítico'
                                       ? item.quantity <= item.minStock
                                       : stockLevelFilter === 'Excedente'
                                       ? item.quantity > (item.maxStock || item.minStock * 3 || 100)
                                       : item.quantity > item.minStock;
                                 return matchesSearch && matchesLevel;
                              })
                              .map(item => (
                              <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-gray-700/50 transition-colors group">
                                 <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                       <div className={`p-2 rounded-lg ${item.category === 'Insumos' ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-500'}`}>
                                          <Package size={20} />
                                       </div>
                                       <div>
                                          <p className="font-bold text-slate-900 dark:text-white">{item.name}</p>
                                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{item.category}</p>
                                       </div>
                                    </div>
                                 </td>
                                 <td className="px-6 py-4 text-center">
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold border ${item.quantity < item.minStock
                                       ? 'bg-rose-100 text-rose-700 border-rose-200'
                                       : 'bg-emerald-100 text-emerald-700 border-emerald-200'
                                       }`}>
                                       {item.quantity < item.minStock ? 'REPOSIÇÃO' : 'DISPONÍVEL'}
                                    </span>
                                 </td>
                                 <td className="px-6 py-4 text-center">
                                    <div className="flex flex-col items-center">
                                       <span className={`font-bold ${item.quantity < item.minStock ? 'text-rose-600' : 'text-slate-700 dark:text-white'}`}>
                                          {item.quantity} {item.unit}
                                       </span>
                                       <span className="text-[10px] text-slate-400">Mín: {item.minStock}</span>
                                    </div>
                                 </td>
                                 <td className="px-6 py-4 text-right font-mono font-medium text-slate-600 dark:text-gray-300">
                                    {formatCurrency(item.price)}
                                 </td>
                                 <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                       <button
                                          onClick={() => {
                                             addItemToOrder(item);
                                             setActiveTab('new-order');
                                          }}
                                          className="p-2 text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors border border-transparent hover:border-cyan-100"
                                          title="Solicitar Reposição"
                                       >
                                          <ShoppingBag size={18} />
                                       </button>
                                       {isAdmin && (
                                          <>
                                             <button
                                                onClick={() => { setEditingItem(item); setStockForm(item); setIsStockModalOpen(true); }}
                                                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-lg transition-colors"
                                                title="Editar"
                                             >
                                                <Edit2 size={18} />
                                             </button>
                                             <button
                                                onClick={() => addToast('Remover este item do catálogo?', 'warning', 5000, {
                                                   label: 'EXCLUIR',
                                                   onClick: () => deleteStockItem(item.id)
                                                })}
                                                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                                title="Excluir"
                                             >
                                                <Trash2 size={18} />
                                             </button>
                                          </>
                                       )}
                                    </div>
                                 </td>
                              </tr>
                           ))}
                        </tbody>
                     </table>
                  </div>
               </div>
            </div>
         )}

         {/* MODAL: CONFERÊNCIA DE RECEBIMENTO DE ENTREGA */}
         {isReceiveInspectionModalOpen && inspectingOrder && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
               <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-xl border dark:border-gray-700 animate-in zoom-in duration-200 overflow-hidden my-6">
                  <div className="p-5 border-b dark:border-gray-700 bg-slate-50 dark:bg-gray-800/50 flex justify-between items-center">
                     <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-600 text-white rounded-xl">
                           <Package size={18} />
                        </div>
                        <div>
                           <h3 className="font-bold text-base text-slate-900 dark:text-white">Conferência de Recebimento</h3>
                           <p className="text-xs text-slate-500">Ordem #{inspectingOrder.id} • {inspectingOrder.supplierName}</p>
                        </div>
                     </div>
                     <button onClick={() => setIsReceiveInspectionModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                        <X size={20} />
                     </button>
                  </div>

                  <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
                     <div className="bg-slate-50 dark:bg-slate-900/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                        <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">Itens Conferidos no Descarregamento</h4>
                        <div className="space-y-2">
                           {inspectingOrder.items.map((it, idx) => (
                              <div key={idx} className="flex justify-between items-center text-xs border-b border-slate-100 dark:border-slate-800 pb-1.5">
                                 <span className="font-bold text-slate-700 dark:text-slate-300">{it.name}</span>
                                 <span className="font-mono font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded">
                                    {it.quantity} {it.unit}
                                 </span>
                              </div>
                           ))}
                        </div>
                     </div>

                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                           <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Número da NF (DANFE)</label>
                           <input
                              type="text"
                              placeholder="Ex: NF-e 045.192"
                              value={inspectionInvoiceNumber}
                              onChange={e => setInspectionInvoiceNumber(e.target.value)}
                              className="w-full bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-xl p-2.5 text-xs font-bold"
                           />
                        </div>
                        <div>
                           <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Data Efetiva de Recebimento</label>
                           <input
                              type="text"
                              value={inspectionReceivedDate}
                              onChange={e => setInspectionReceivedDate(e.target.value)}
                              className="w-full bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-xl p-2.5 text-xs font-bold"
                           />
                        </div>
                     </div>

                     <div>
                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Conta Financeira para Lançamento do Contas a Pagar</label>
                        <select
                           value={inspectionAccountId}
                           onChange={e => setInspectionAccountId(e.target.value)}
                           className="w-full bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-xl p-2.5 text-xs font-bold"
                        >
                           {accounts.map(acc => (
                              <option key={acc.id} value={acc.id}>{acc.name} ({formatCurrency(acc.balance)})</option>
                           ))}
                        </select>
                     </div>

                     <div>
                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Observações de Recebimento / Vistoria</label>
                        <textarea
                           placeholder="Lote íntegro, amostra coletada para laboratório, certificado de conformidade anexo..."
                           value={inspectionNotes}
                           onChange={e => setInspectionNotes(e.target.value)}
                           rows={2}
                           className="w-full bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-xl p-2.5 text-xs font-medium"
                        />
                     </div>
                  </div>

                  <div className="p-5 bg-slate-50 dark:bg-gray-800/80 border-t dark:border-gray-700 flex gap-3">
                     <button
                        type="button"
                        onClick={() => setIsReceiveInspectionModalOpen(false)}
                        className="flex-1 py-2.5 bg-white dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-gray-600 transition-colors uppercase"
                     >
                        Cancelar
                     </button>
                     <button
                        type="button"
                        onClick={handleConfirmReceiveOrder}
                        className="flex-[2] py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs uppercase tracking-wider shadow transition-colors flex items-center justify-center gap-2"
                     >
                        <CheckCircle size={15} /> Confirmar Entrada no Estoque
                     </button>
                  </div>
               </div>
            </div>
         )}

         {/* MODAL: NOVA COTAÇÃO (RFQ) */}
         {isNewQuotationModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
               <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-xl border dark:border-gray-700 animate-in zoom-in duration-200 overflow-hidden my-6">
                  <div className="p-5 border-b dark:border-gray-700 bg-slate-50 dark:bg-gray-800/50 flex justify-between items-center">
                     <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-600 text-white rounded-xl">
                           <Coins size={18} />
                        </div>
                        <div>
                           <h3 className="font-bold text-base text-slate-900 dark:text-white">Criar Solicitação de Cotação (RFQ)</h3>
                           <p className="text-xs text-slate-500">Mínimo 3 fornecedores para comparação de preços e prazos</p>
                        </div>
                     </div>
                     <button onClick={() => setIsNewQuotationModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                        <X size={20} />
                     </button>
                  </div>

                  <form
                     onSubmit={(e) => {
                        e.preventDefault();
                        const quoteId = `COT-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
                        const createdQuotation: Quotation = {
                           id: quoteId,
                           title: newQuotationForm.title,
                           date: new Date().toLocaleDateString('pt-BR'),
                           expiryDate: newQuotationForm.expiryDate,
                           requestedBy: newQuotationForm.requestedBy,
                           status: 'Em Cotação',
                           items: newQuotationForm.items,
                           supplierQuotes: newQuotationForm.quotes.filter(q => q.supplierName.trim() !== '')
                        };
                        setQuotations(prev => [createdQuotation, ...prev]);
                        addToast(`Cotação #${quoteId} criada com sucesso!`, 'success');
                        setIsNewQuotationModalOpen(false);
                     }}
                  >
                     <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
                        <div>
                           <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Título / Objeto da Cotação</label>
                           <input
                              type="text"
                              placeholder="Ex: Fornecimento de 50 Toneladas de Cimento CP-II"
                              value={newQuotationForm.title}
                              onChange={e => setNewQuotationForm({ ...newQuotationForm, title: e.target.value })}
                              required
                              className="w-full bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-xl p-2.5 text-xs font-bold"
                           />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                           <div>
                              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Departamento Solicitante</label>
                              <input
                                 type="text"
                                 value={newQuotationForm.requestedBy}
                                 onChange={e => setNewQuotationForm({ ...newQuotationForm, requestedBy: e.target.value })}
                                 required
                                 className="w-full bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-xl p-2.5 text-xs font-bold"
                              />
                           </div>
                           <div>
                              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Prazo Limite / Validade</label>
                              <input
                                 type="date"
                                 value={newQuotationForm.expiryDate}
                                 onChange={e => setNewQuotationForm({ ...newQuotationForm, expiryDate: e.target.value })}
                                 required
                                 className="w-full bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-xl p-2.5 text-xs font-bold"
                              />
                           </div>
                        </div>

                        {/* Item */}
                        <div className="p-4 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-100 dark:border-slate-800 space-y-2">
                           <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">Item Cotado</label>
                           <div className="grid grid-cols-3 gap-2">
                              <div className="col-span-2">
                                 <select
                                    value={newQuotationForm.items[0]?.productId}
                                    onChange={e => {
                                       const selected = inventory.find(i => i.id === e.target.value);
                                       const itms = [...newQuotationForm.items];
                                       itms[0] = {
                                          productId: e.target.value,
                                          productName: selected ? selected.name : 'Insumo',
                                          quantity: itms[0]?.quantity || 10,
                                          unit: selected ? selected.unit : 'un'
                                       };
                                       setNewQuotationForm({ ...newQuotationForm, items: itms });
                                    }}
                                    required
                                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2 text-xs font-bold"
                                 >
                                    <option value="">Selecione o produto do estoque...</option>
                                    {inventory.map(i => (
                                       <option key={i.id} value={i.id}>{i.name} ({i.unit})</option>
                                    ))}
                                 </select>
                              </div>
                              <div>
                                 <input
                                    type="number"
                                    placeholder="Quantidade"
                                    value={newQuotationForm.items[0]?.quantity}
                                    onChange={e => {
                                       const itms = [...newQuotationForm.items];
                                       itms[0] = { ...itms[0], quantity: Number(e.target.value) };
                                       setNewQuotationForm({ ...newQuotationForm, items: itms });
                                    }}
                                    required
                                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2 text-xs font-bold"
                                 />
                              </div>
                           </div>
                        </div>

                        {/* Supplier Quotes (3 Suppliers) */}
                        <div className="space-y-2.5">
                           <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">Propostas dos Fornecedores (Mínimo 3)</label>
                           {newQuotationForm.quotes.map((q, idx) => (
                              <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700">
                                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    <div>
                                       <select
                                          value={q.supplierId}
                                          onChange={e => {
                                             const sup = suppliers.find(s => s.id === e.target.value);
                                             const nq = [...newQuotationForm.quotes];
                                             nq[idx] = { ...nq[idx], supplierId: e.target.value, supplierName: sup ? sup.name : '' };
                                             setNewQuotationForm({ ...newQuotationForm, quotes: nq });
                                          }}
                                          required
                                          className="w-full bg-white dark:bg-slate-800 border rounded-lg p-2 text-xs font-bold"
                                       >
                                          <option value="">Selecione o Fornecedor {idx + 1}...</option>
                                          {suppliers.map(s => (
                                             <option key={s.id} value={s.id}>{s.name}</option>
                                          ))}
                                       </select>
                                    </div>
                                    <div className="flex gap-2">
                                       <input
                                          type="number"
                                          step="0.01"
                                          placeholder="Preço Unit. (R$)"
                                          value={q.unitPrice || ''}
                                          onChange={e => {
                                             const price = Number(e.target.value);
                                             const qty = newQuotationForm.items[0]?.quantity || 1;
                                             const nq = [...newQuotationForm.quotes];
                                             nq[idx] = { ...nq[idx], unitPrice: price, totalPrice: price * qty };
                                             setNewQuotationForm({ ...newQuotationForm, quotes: nq });
                                          }}
                                          required
                                          className="w-full bg-white dark:bg-slate-800 border rounded-lg p-2 text-xs font-bold"
                                       />
                                       <input
                                          type="number"
                                          placeholder="Prazo (dias)"
                                          value={q.deliveryDays}
                                          onChange={e => {
                                             const nq = [...newQuotationForm.quotes];
                                             nq[idx] = { ...nq[idx], deliveryDays: Number(e.target.value) };
                                             setNewQuotationForm({ ...newQuotationForm, quotes: nq });
                                          }}
                                          className="w-24 bg-white dark:bg-slate-800 border rounded-lg p-2 text-xs font-bold"
                                       />
                                    </div>
                                 </div>
                              </div>
                           ))}
                        </div>
                     </div>

                     <div className="p-5 bg-slate-50 dark:bg-gray-800/80 border-t dark:border-gray-700 flex gap-3">
                        <button
                           type="button"
                           onClick={() => setIsNewQuotationModalOpen(false)}
                           className="flex-1 py-2.5 bg-white dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 transition-colors uppercase"
                        >
                           Cancelar
                        </button>
                        <button
                           type="submit"
                           className="flex-[2] py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs uppercase tracking-wider shadow transition-colors flex items-center justify-center gap-2"
                        >
                           <Save size={15} /> Salvar Cotação
                        </button>
                     </div>
                  </form>
               </div>
            </div>
         )}

         {/* ORDER DETAILS MODAL */}
         {selectedOrder && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
               <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl border dark:border-gray-700 animate-in zoom-in duration-200 overflow-hidden">
                  <div className="p-6 border-b dark:border-gray-700 flex justify-between items-center bg-slate-50 dark:bg-gray-800/50">
                     <div>
                        <h3 className="font-bold text-xl text-slate-900 dark:text-white flex items-center gap-2">
                           Ordem {selectedOrder.id}
                           <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusColor(selectedOrder.status)}`}>
                              {selectedOrder.status}
                           </span>
                        </h3>
                        <p className="text-xs text-slate-500 mt-1">Data: {selectedOrder.date} • Fornecedor: {selectedOrder.supplierName}</p>
                     </div>
                     <button onClick={() => setSelectedOrder(null)} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
                  </div>

                  <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                     <div>
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Itens da Ordem</h4>
                        <div className="bg-slate-50 dark:bg-gray-900/50 rounded-xl overflow-hidden border border-slate-100 dark:border-gray-700">
                           <table className="w-full text-sm">
                              <thead className="bg-slate-100 dark:bg-gray-800 text-[10px] font-black uppercase text-slate-500">
                                 <tr>
                                    <th className="px-4 py-2 text-left">Item</th>
                                    <th className="px-4 py-2 text-center">Quant.</th>
                                    <th className="px-4 py-2 text-right">Preço</th>
                                    <th className="px-4 py-2 text-right">Total</th>
                                 </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 dark:divide-gray-700">
                                 {selectedOrder.items.map((it, idx) => (
                                    <tr key={idx}>
                                       <td className="px-4 py-3 font-bold text-slate-700 dark:text-gray-300">{it.name}</td>
                                       <td className="px-4 py-3 text-center">{it.quantity} {it.unit}</td>
                                       <td className="px-4 py-3 text-right">{formatCurrency(it.price)}</td>
                                       <td className="px-4 py-3 text-right font-bold">{formatCurrency(it.price * it.quantity)}</td>
                                    </tr>
                                 ))}
                              </tbody>
                              <tfoot className="bg-slate-50 dark:bg-gray-800/50 font-bold">
                                 <tr>
                                    <td colSpan={3} className="px-4 py-3 text-right uppercase text-[10px] text-slate-500">Total da Ordem</td>
                                    <td className="px-4 py-3 text-right text-cyan-600">{formatCurrency(selectedOrder.total)}</td>
                                 </tr>
                              </tfoot>
                           </table>
                        </div>
                     </div>

                     <div className="grid grid-cols-2 gap-6">
                        <div>
                           <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Classificação Financeira</h4>
                           <div className="p-3 bg-cyan-50 dark:bg-cyan-900/10 rounded-lg border border-cyan-100 dark:border-cyan-900/30">
                              <p className="text-[10px] font-mono font-bold text-cyan-700 dark:text-cyan-400">[{selectedOrder.ledgerCode || '2.02.03'}]</p>
                              <p className="text-xs font-bold text-cyan-900 dark:text-cyan-200">{selectedOrder.ledgerName || 'Material de Consumo'}</p>
                           </div>
                        </div>
                        <div>
                           <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Anexos ({selectedOrder.attachments?.length || 0})</h4>
                           <div className="space-y-1.5">
                              {selectedOrder.attachments?.map(at => (
                                 <div key={at.id} className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-gray-700 rounded-lg border dark:border-gray-600">
                                    <File size={14} className="text-cyan-600" />
                                    <span className="text-[10px] font-bold truncate flex-1">{at.name}</span>
                                    <span className="text-[8px] text-slate-400">{at.size}</span>
                                 </div>
                              ))}
                              {(!selectedOrder.attachments || selectedOrder.attachments.length === 0) && (
                                 <p className="text-[10px] text-slate-400 italic">Nenhum comprovante anexado.</p>
                              )}
                           </div>
                        </div>
                     </div>
                  </div>

                  <div className="p-6 bg-slate-50 dark:bg-gray-800/80 border-t dark:border-gray-700 flex justify-end gap-3">
                     <button
                        onClick={() => handlePrintPurchaseOrder(selectedOrder)}
                        className="px-6 py-2 bg-white dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-slate-50 transition-colors"
                     >
                        <Printer size={16} /> Imprimir / PDF
                     </button>
                     <button onClick={() => setSelectedOrder(null)} className="px-6 py-2 bg-white dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-xl text-sm font-bold">Fechar</button>
                     {selectedOrder.status === 'Aprovado' && (
                        <button
                           onClick={() => {
                              setSelectedOrder(null);
                              handleOpenReceiveInspection(selectedOrder);
                           }}
                           className="px-6 py-2 bg-green-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-green-600/20"
                        >
                           Receber Material
                        </button>
                     )}
                  </div>
               </div>
            </div>
         )}

         {/* STOCK ITEM MODAL */}
         {isStockModalOpen && isAdmin && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
               <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-xl border dark:border-gray-700 animate-in zoom-in duration-200 overflow-hidden my-6">
                  <div className="p-5 border-b dark:border-gray-700 bg-slate-50 dark:bg-gray-800/50 flex justify-between items-center">
                     <div className="flex items-center gap-3">
                        <div className="p-2 bg-cyan-600 text-white rounded-xl">
                           <Package size={18} />
                        </div>
                        <div>
                           <h3 className="font-bold text-base text-slate-900 dark:text-white">
                              {editingItem ? 'Editar Item de Estoque' : 'Novo Item de Estoque'}
                           </h3>
                           <p className="text-xs text-slate-500">Parâmetros de saldo, ponto de reposição e precificação</p>
                        </div>
                     </div>
                     <button onClick={() => setIsStockModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                        <X size={20} />
                     </button>
                  </div>
                  <form onSubmit={handleSaveStock}>
                     <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
                        <div>
                           <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Nome do Item / Insumo</label>
                           <input
                              type="text"
                              className="w-full bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-xl p-2.5 text-xs font-bold"
                              value={stockForm.name || ''}
                              onChange={e => setStockForm({ ...stockForm, name: e.target.value })}
                              required
                           />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                           <div>
                              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Categoria</label>
                              <select
                                 className="w-full bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-xl p-2.5 text-xs font-bold uppercase"
                                 value={stockForm.category || ''}
                                 onChange={e => setStockForm({ ...stockForm, category: e.target.value })}
                                 required
                              >
                                 <option value="">Selecione...</option>
                                 <option value="Insumos">Insumos</option>
                                 <option value="Matéria Prima">Matéria Prima</option>
                                 <option value="Acabamentos">Acabamentos</option>
                                 <option value="Ferramentas">Ferramentas</option>
                                 <option value="Equipamentos">Equipamentos</option>
                                 <option value="Consumíveis">Consumíveis</option>
                                 <option value="Outros">Outros</option>
                              </select>
                           </div>
                           <div>
                              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Unidade</label>
                              <select
                                 className="w-full bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-xl p-2.5 text-xs font-bold uppercase"
                                 value={stockForm.unit || ''}
                                 onChange={e => setStockForm({ ...stockForm, unit: e.target.value })}
                                 required
                              >
                                 <option value="">Selecione...</option>
                                 <option value="un">UN (Unidade)</option>
                                 <option value="kg">KG (Quilos)</option>
                                 <option value="ton">TON (Toneladas)</option>
                                 <option value="m³">M³ (Metros Cúb.)</option>
                                 <option value="m²">M² (Metros Quad.)</option>
                                 <option value="m">M (Metros Lineares)</option>
                                 <option value="l">L (Litros)</option>
                                 <option value="sc">SC (Sacos)</option>
                              </select>
                           </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                           <div>
                              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Quantidade Atual</label>
                              <input
                                 type="number"
                                 className="w-full bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-xl p-2.5 text-xs font-bold"
                                 value={stockForm.quantity || 0}
                                 onChange={e => setStockForm({ ...stockForm, quantity: Number(e.target.value) })}
                                 required
                              />
                           </div>
                           <div>
                              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Estoque Mínimo (Alerta)</label>
                              <input
                                 type="number"
                                 className="w-full bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-xl p-2.5 text-xs font-bold"
                                 value={stockForm.minStock || 0}
                                 onChange={e => setStockForm({ ...stockForm, minStock: Number(e.target.value) })}
                                 required
                              />
                           </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                           <div>
                              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Preço de Custo (R$)</label>
                              <input
                                 type="number"
                                 step="0.01"
                                 className="w-full bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-xl p-2.5 text-xs font-bold"
                                 value={stockForm.costPrice ?? stockForm.price ?? 0}
                                 onChange={e => setStockForm({ ...stockForm, costPrice: Number(e.target.value), price: stockForm.price || Number(e.target.value) })}
                              />
                           </div>
                           <div>
                              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Preço Unitário Referência (R$)</label>
                              <input
                                 type="number"
                                 step="0.01"
                                 className="w-full bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-xl p-2.5 text-xs font-bold"
                                 value={stockForm.price || 0}
                                 onChange={e => setStockForm({ ...stockForm, price: Number(e.target.value) })}
                                 required
                              />
                           </div>
                        </div>
                     </div>
                     <div className="p-5 bg-slate-50 dark:bg-gray-800/80 border-t dark:border-gray-700 flex gap-3">
                        <button
                           type="button"
                           onClick={() => setIsStockModalOpen(false)}
                           className="flex-1 py-2.5 bg-white dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 transition-colors uppercase"
                        >
                           Cancelar
                        </button>
                        <button
                           type="submit"
                           className="flex-[2] py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl text-xs uppercase tracking-wider shadow transition-colors flex items-center justify-center gap-2"
                        >
                           <Save size={15} /> Salvar Item
                        </button>
                     </div>
                  </form>
               </div>
            </div>
         )}

         {/* SUPPLIER MODAL */}
         {isSupplierModalOpen && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
               <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-xl border dark:border-gray-700 animate-in zoom-in duration-200 overflow-hidden my-6">
                  <div className="p-5 border-b dark:border-gray-700 bg-slate-50 dark:bg-gray-800/50 flex justify-between items-center">
                     <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-600 text-white rounded-xl">
                           <Truck size={18} />
                        </div>
                        <div>
                           <h3 className="font-bold text-base text-slate-900 dark:text-white">
                              {editingSupplier ? 'Editar Fornecedor' : 'Novo Fornecedor'}
                           </h3>
                           <p className="text-xs text-slate-500">Cadastro de fornecedores homologados e prestadores</p>
                        </div>
                     </div>
                     <button type="button" onClick={() => setIsSupplierModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                        <X size={20} />
                     </button>
                  </div>
                  <form onSubmit={handleSaveSupplier}>
                     <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
                        <div>
                           <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Razão Social / Nome</label>
                           <input
                              type="text"
                              className="w-full bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-xl p-2.5 text-xs font-bold"
                              value={supForm.name || ''}
                              onChange={e => setSupForm({ ...supForm, name: e.target.value })}
                              required
                           />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                           <div>
                              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">CNPJ / CPF</label>
                              <input
                                 type="text"
                                 className="w-full bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-xl p-2.5 text-xs font-bold"
                                 value={supForm.document || ''}
                                 onChange={e => setSupForm({ ...supForm, document: e.target.value })}
                                 required
                              />
                           </div>
                           <div>
                              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Categoria</label>
                              <input
                                 type="text"
                                 placeholder="Ex: Insumos, Combustível, Manutenção..."
                                 className="w-full bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-xl p-2.5 text-xs font-bold"
                                 value={supForm.category || ''}
                                 onChange={e => setSupForm({ ...supForm, category: e.target.value })}
                                 required
                              />
                           </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                           <div>
                              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Telefone</label>
                              <input
                                 type="text"
                                 className="w-full bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-xl p-2.5 text-xs font-bold"
                                 value={supForm.phone || ''}
                                 onChange={e => setSupForm({ ...supForm, phone: e.target.value })}
                              />
                           </div>
                           <div>
                              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">E-mail</label>
                              <input
                                 type="email"
                                 className="w-full bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-xl p-2.5 text-xs font-bold"
                                 value={supForm.email || ''}
                                 onChange={e => setSupForm({ ...supForm, email: e.target.value })}
                              />
                           </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                           <div>
                              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Contato Responsável</label>
                              <input
                                 type="text"
                                 className="w-full bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-xl p-2.5 text-xs font-bold"
                                 value={supForm.contactPerson || ''}
                                 onChange={e => setSupForm({ ...supForm, contactPerson: e.target.value })}
                              />
                           </div>
                           <div>
                              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Status</label>
                              <select
                                 className="w-full bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-xl p-2.5 text-xs font-bold"
                                 value={supForm.status || 'Ativo'}
                                 onChange={e => setSupForm({ ...supForm, status: e.target.value as any })}
                              >
                                 <option value="Ativo">Ativo</option>
                                 <option value="Inativo">Inativo</option>
                              </select>
                           </div>
                        </div>
                     </div>
                     <div className="p-5 bg-slate-50 dark:bg-gray-800/80 border-t dark:border-gray-700 flex gap-3">
                        <button
                           type="button"
                           onClick={() => setIsSupplierModalOpen(false)}
                           className="flex-1 py-2.5 bg-white dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 transition-colors uppercase"
                        >
                           Cancelar
                        </button>
                        <button
                           type="submit"
                           className="flex-[2] py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs uppercase tracking-wider shadow transition-colors flex items-center justify-center gap-2"
                        >
                           <Save size={15} /> {editingSupplier ? 'Atualizar Fornecedor' : 'Cadastrar Fornecedor'}
                        </button>
                     </div>
                  </form>
               </div>
            </div>
         )}

         {/* OSM MODAL */}
         {isOSMModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
               <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-xl border dark:border-gray-700 animate-in zoom-in duration-200 overflow-hidden my-6">
                  <div className="p-5 border-b dark:border-gray-700 bg-slate-50 dark:bg-gray-800/50 flex justify-between items-center">
                     <div className="flex items-center gap-3">
                        <div className="p-2 bg-teal-600 text-white rounded-xl">
                           <Wrench size={18} />
                        </div>
                        <div>
                           <h3 className="font-bold text-base text-slate-900 dark:text-white">Ordem de Serviço de Manutenção (OSM)</h3>
                           <p className="text-xs text-slate-500">Manutenção preventiva, corretiva ou preditiva de frota</p>
                        </div>
                     </div>
                     <button onClick={() => setIsOSMModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                        <X size={20} />
                     </button>
                  </div>
                  <form onSubmit={handleSaveOSM}>
                     <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                           <div>
                              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Veículo / Equipamento</label>
                              <select
                                 className="w-full bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-xl p-2.5 text-xs font-bold"
                                 value={selectedVehicleId}
                                 onChange={e => setSelectedVehicleId(e.target.value)}
                                 required
                              >
                                 <option value="">Selecione o ativo...</option>
                                 {fleet.map(v => <option key={v.id} value={v.id}>{v.plate} - {v.name}</option>)}
                              </select>
                           </div>
                           <div>
                              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Data da Manutenção</label>
                              <input
                                 type="date"
                                 className="w-full bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-xl p-2.5 text-xs font-bold"
                                 value={osmForm.date}
                                 onChange={e => setOsmForm({ ...osmForm, date: e.target.value })}
                                 required
                              />
                           </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                           <div>
                              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Tipo de Manutenção</label>
                              <select
                                 className="w-full bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-xl p-2.5 text-xs font-bold"
                                 value={osmForm.type}
                                 onChange={e => setOsmForm({ ...osmForm, type: e.target.value as any })}
                                 required
                              >
                                 <option value="Preventiva">Preventiva</option>
                                 <option value="Corretiva">Corretiva</option>
                                 <option value="Preditiva">Preditiva</option>
                              </select>
                           </div>
                           <div>
                              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">KM / Horímetro Atual</label>
                              <input
                                 type="number"
                                 className="w-full bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-xl p-2.5 text-xs font-bold"
                                 placeholder="0"
                                 value={osmForm.km || ''}
                                 onChange={e => setOsmForm({ ...osmForm, km: Number(e.target.value) })}
                                 required
                              />
                           </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                           <div>
                              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Custo Estimado (R$)</label>
                              <input
                                 type="number"
                                 className="w-full bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-xl p-2.5 text-xs font-bold"
                                 placeholder="0.00"
                                 value={osmForm.cost || ''}
                                 onChange={e => setOsmForm({ ...osmForm, cost: Number(e.target.value) })}
                                 required
                              />
                           </div>
                           <div>
                              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Conta Financeira para Débito</label>
                              <select
                                 className="w-full bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-xl p-2.5 text-xs font-bold"
                                 value={osmForm.debitAccountId || ''}
                                 onChange={e => setOsmForm({ ...osmForm, debitAccountId: e.target.value })}
                                 required
                              >
                                 <option value="">Selecione a conta...</option>
                                 {accounts.map(acc => (
                                    <option key={acc.id} value={acc.id}>{acc.name} ({formatCurrency(acc.balance)})</option>
                                 ))}
                              </select>
                           </div>
                        </div>

                        <div>
                           <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Descrição do Serviço</label>
                           <textarea
                              className="w-full bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-xl p-2.5 text-xs font-medium"
                              placeholder="Ex: Troca de óleo, filtros, reparo mecânico, alinhamento..."
                              value={osmForm.description}
                              onChange={e => setOsmForm({ ...osmForm, description: e.target.value })}
                              required
                              rows={2}
                           />
                        </div>

                        <div className="p-4 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-100 dark:border-slate-800 space-y-2">
                           <h4 className="text-xs font-bold text-teal-600 dark:text-teal-400">Peças e Insumos do Almoxarifado (Opcional)</h4>
                           <div className="grid grid-cols-3 gap-2">
                              <div className="col-span-2">
                                 <select
                                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2 text-xs font-bold"
                                    value={osmForm.productId || ''}
                                    onChange={e => setOsmForm({ ...osmForm, productId: e.target.value, productQuantity: e.target.value ? (osmForm.productQuantity || 1) : 0 })}
                                 >
                                    <option value="">Nenhum produto retirado...</option>
                                    {inventory.map(item => (
                                       <option key={item.id} value={item.id}>{item.name} (Estoque: {item.quantity})</option>
                                    ))}
                                 </select>
                              </div>
                              <div>
                                 <input
                                    type="number"
                                    min="0"
                                    step="0.1"
                                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2 text-xs font-bold"
                                    value={osmForm.productQuantity || ''}
                                    onChange={e => setOsmForm({ ...osmForm, productQuantity: Number(e.target.value) })}
                                    disabled={!osmForm.productId}
                                    placeholder="Qtd: 1"
                                 />
                              </div>
                           </div>
                        </div>

                        <div>
                           <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Classificação Contábil</label>
                           <select
                              className="w-full bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-xl p-2.5 text-xs font-bold"
                              value={osmForm.ledgerCode}
                              onChange={e => {
                                 const options: any = {
                                    '2.02.02': 'Manutenção de Frota',
                                    '2.02.03': 'IPVA / Taxas / Seguros',
                                    '2.02.04': 'Pneus / Rodagem'
                                 };
                                 setOsmForm({ ...osmForm, ledgerCode: e.target.value, ledgerName: options[e.target.value] });
                              }}
                           >
                              <option value="2.02.02">2.02.02 - Manutenção de Frota</option>
                              <option value="2.02.03">2.02.03 - IPVA / Taxas / Seguros</option>
                              <option value="2.02.04">2.02.04 - Pneus / Rodagem</option>
                           </select>
                        </div>
                     </div>

                     <div className="p-5 bg-slate-50 dark:bg-gray-800/80 border-t dark:border-gray-700 flex gap-3">
                        <button
                           type="button"
                           onClick={() => setIsOSMModalOpen(false)}
                           className="flex-1 py-2.5 bg-white dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 transition-colors uppercase"
                        >
                           Cancelar
                        </button>
                        <button
                           type="submit"
                           disabled={isSubmitting}
                           className={`flex-[2] py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl text-xs uppercase tracking-wider shadow transition-colors flex items-center justify-center gap-2 ${isSubmitting ? 'opacity-75 cursor-not-allowed' : ''}`}
                        >
                           {isSubmitting ? <Loader className="animate-spin" size={15} /> : <Save size={15} />}
                           {isSubmitting ? 'Processando...' : 'Confirmar OSM'}
                        </button>
                     </div>
                  </form>
               </div>
            </div>
         )}

         {/* ODO MODAL */}
         {isODOModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
               <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-xl border dark:border-gray-700 animate-in zoom-in duration-200 overflow-hidden my-6">
                  <div className="p-5 border-b dark:border-gray-700 bg-slate-50 dark:bg-gray-800/50 flex justify-between items-center">
                     <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-600 text-white rounded-xl">
                           <FileText size={18} />
                        </div>
                        <div>
                           <h3 className="font-bold text-base text-slate-900 dark:text-white">Ordem de Despesa Operacional (ODO)</h3>
                           <p className="text-xs text-slate-500">Lançamento de despesas administrativas, concessionárias e serviços</p>
                        </div>
                     </div>
                     <button onClick={() => setIsODOModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                        <X size={20} />
                     </button>
                  </div>
                  <form onSubmit={handleSaveODO}>
                     <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                           <div>
                              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Categoria (Plano de Contas)</label>
                              <select
                                 className="w-full bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-xl p-2.5 text-xs font-bold"
                                 value={odoForm.ledgerCode}
                                 onChange={e => {
                                    const code = e.target.value;
                                    const options: Record<string, string> = {
                                       '2.02.01': 'Material de Escritório',
                                       '2.02.05': 'Energia Elétrica',
                                       '2.02.06': 'Água e Esgoto',
                                       '2.02.07': 'Telefonia e Internet',
                                       '2.02.08': 'Aluguel e Condomínio',
                                       '2.03.01': 'Serviços de Terceiros',
                                       '2.03.02': 'Limpeza e Conservação',
                                       '2.03.03': 'Manutenção Predial',
                                       '2.03.04': 'Licenças e Softwares',
                                       '2.03.05': 'Marketing e Publicidade',
                                       '2.04.01': 'Impostos Federais',
                                       '2.04.02': 'Impostos Municipais',
                                       '2.05.01': 'Viagens e Hospedagem',
                                       '2.02.09': 'Combustível (Uso Geral)',
                                       '2.02.99': 'Outras Despesas Gerais'
                                    };
                                    setOdoForm({
                                       ...odoForm,
                                       ledgerCode: code,
                                       category: options[code],
                                       description: odoForm.description === '' ? options[code] : odoForm.description
                                    });
                                 }}
                              >
                                 <optgroup label="Despesas Administrativas">
                                    <option value="2.02.01">2.02.01 - Material de Escritório</option>
                                    <option value="2.02.05">2.02.05 - Energia Elétrica</option>
                                    <option value="2.02.06">2.02.06 - Água e Esgoto</option>
                                    <option value="2.02.07">2.02.07 - Telefonia e Internet</option>
                                    <option value="2.02.08">2.02.08 - Aluguel e Condomínio</option>
                                    <option value="2.02.09">2.02.09 - Combustível (Uso Geral)</option>
                                 </optgroup>
                                 <optgroup label="Serviços Tomados">
                                    <option value="2.03.01">2.03.01 - Serviços de Terceiros</option>
                                    <option value="2.03.02">2.03.02 - Limpeza e Conservação</option>
                                    <option value="2.03.03">2.03.03 - Manutenção Predial</option>
                                    <option value="2.03.04">2.03.04 - Licenças e Softwares</option>
                                    <option value="2.03.05">2.03.05 - Marketing e Publicidade</option>
                                 </optgroup>
                                 <optgroup label="Impostos e Taxas">
                                    <option value="2.04.01">2.04.01 - Impostos Federais</option>
                                    <option value="2.04.02">2.04.02 - Impostos Municipais</option>
                                 </optgroup>
                              </select>
                           </div>
                           <div>
                              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Mês de Competência</label>
                              <input
                                 type="month"
                                 className="w-full bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-xl p-2.5 text-xs font-bold"
                                 value={odoForm.competenceDate}
                                 onChange={e => setOdoForm({ ...odoForm, competenceDate: e.target.value })}
                                 required
                              />
                           </div>
                        </div>

                        <div>
                           <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Descrição Detalhada</label>
                           <input
                              type="text"
                              className="w-full bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-xl p-2.5 text-xs font-bold"
                              placeholder="Ex: Fatura de Energia Elétrica referente a 01/2026"
                              value={odoForm.description}
                              onChange={e => setOdoForm({ ...odoForm, description: e.target.value })}
                              required
                           />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                           <div>
                              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Valor Total (R$)</label>
                              <input
                                 type="number"
                                 className="w-full bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-xl p-2.5 text-xs font-bold"
                                 placeholder="0.00"
                                 value={odoForm.value || ''}
                                 onChange={e => setOdoForm({ ...odoForm, value: Number(e.target.value) })}
                                 required
                              />
                           </div>
                           <div>
                              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Método de Pagamento</label>
                              <select
                                 className="w-full bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-xl p-2.5 text-xs font-bold"
                                 value={odoForm.paymentMethod}
                                 onChange={e => setOdoForm({ ...odoForm, paymentMethod: e.target.value })}
                              >
                                 <option value="Boleto">Boleto Bancário</option>
                                 <option value="Pix">Pix / Transferência</option>
                                 <option value="Cartão de Crédito">Cartão de Crédito Corp.</option>
                                 <option value="Débito em Conta">Débito Automático</option>
                              </select>
                           </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                           <div>
                              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Beneficiário / Fornecedor</label>
                              <select
                                 className="w-full bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-xl p-2.5 text-xs font-bold"
                                 value={odoForm.supplierId}
                                 onChange={e => {
                                    const supid = e.target.value;
                                    const sup = suppliers.find(s => s.id === supid);
                                    setOdoForm({
                                       ...odoForm,
                                       supplierId: supid,
                                       supplierName: sup ? sup.name : 'Fornecedor Diverso'
                                    });
                                 }}
                              >
                                 <option value="">-- Selecione na Lista --</option>
                                 {suppliers.map(s => (
                                    <option key={s.id} value={s.id}>{s.name} ({s.category})</option>
                                 ))}
                                 <option value="DVERSO">Outro / Não Cadastrado</option>
                              </select>
                           </div>
                           <div>
                              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Conta de Saída</label>
                              <select
                                 className="w-full bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-xl p-2.5 text-xs font-bold"
                                 value={odoForm.account}
                                 onChange={e => setOdoForm({ ...odoForm, account: e.target.value })}
                                 required
                              >
                                 <option value="">Selecione a conta...</option>
                                 {accounts.map(acc => (
                                    <option key={acc.id} value={acc.id}>{acc.name} ({formatCurrency(acc.balance)})</option>
                                 ))}
                              </select>
                           </div>
                        </div>
                     </div>

                     <div className="p-5 bg-slate-50 dark:bg-gray-800/80 border-t dark:border-gray-700 flex gap-3">
                        <button
                           type="button"
                           onClick={() => setIsODOModalOpen(false)}
                           className="flex-1 py-2.5 bg-white dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 transition-colors uppercase"
                        >
                           Cancelar
                        </button>
                        <button
                           type="submit"
                           disabled={isSubmitting}
                           className={`flex-[2] py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs uppercase tracking-wider shadow transition-colors flex items-center justify-center gap-2 ${isSubmitting ? 'opacity-75 cursor-not-allowed' : ''}`}
                        >
                           {isSubmitting ? <Loader className="animate-spin" size={15} /> : <Save size={15} />}
                           {isSubmitting ? 'Processando...' : 'Lançar Despesa'}
                        </button>
                     </div>
                  </form>
               </div>
            </div>
         )}

         {/* ODP MODAL */}
         {isODPModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
               <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-xl border dark:border-gray-700 animate-in zoom-in duration-200 overflow-hidden my-6">
                  <div className="p-5 border-b dark:border-gray-700 bg-slate-50 dark:bg-gray-800/50 flex justify-between items-center">
                     <div className="flex items-center gap-3">
                        <div className="p-2 bg-fuchsia-600 text-white rounded-xl">
                           <Users size={18} />
                        </div>
                        <div>
                           <h3 className="font-bold text-base text-slate-900 dark:text-white">Ordem de Despesa de Pessoal (ODP)</h3>
                           <p className="text-xs text-slate-500">Folha de pagamento, benefícios, diárias e adiantamentos</p>
                        </div>
                     </div>
                     <button onClick={() => setIsODPModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                        <X size={20} />
                     </button>
                  </div>
                  <form onSubmit={handleSaveODP}>
                     <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
                        <div>
                           <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Colaborador (RH)</label>
                           <select
                              className="w-full bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-xl p-2.5 text-xs font-bold"
                              value={odpForm.employeeId}
                              onChange={e => setOdpForm({ ...odpForm, employeeId: e.target.value })}
                              required
                           >
                              <option value="">Selecione o colaborador...</option>
                              {employees.map(emp => (
                                 <option key={emp.id} value={emp.id}>{emp.name} - {emp.role}</option>
                              ))}
                           </select>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                           <div>
                              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Categoria da Despesa</label>
                              <select
                                 className="w-full bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-xl p-2.5 text-xs font-bold"
                                 value={odpForm.ledgerCode}
                                 onChange={e => {
                                    const code = e.target.value;
                                    const options: Record<string, string> = {
                                       '2.01.01': 'Salários e Ordenados',
                                       '2.01.02': 'Adiantamento Salarial',
                                       '2.01.03': 'Férias',
                                       '2.01.04': '13º Salário',
                                       '2.01.05': 'Vale Transporte',
                                       '2.01.06': 'Vale Refeição / Alimentação',
                                       '2.01.07': 'Rescisões',
                                       '2.01.08': 'Bônus e Premiações',
                                       '2.01.09': 'Reembolso de Despesas',
                                       '2.01.99': 'Outras Despesas com Pessoal'
                                    };
                                    setOdpForm({
                                       ...odpForm,
                                       ledgerCode: code,
                                       type: options[code],
                                       description: odpForm.description === '' ? options[code] : odpForm.description
                                    });
                                 }}
                              >
                                 <option value="2.01.01">2.01.01 - Salários e Ordenados</option>
                                 <option value="2.01.02">2.01.02 - Adiantamento Salarial</option>
                                 <option value="2.01.03">2.01.03 - Férias</option>
                                 <option value="2.01.04">2.01.04 - 13º Salário</option>
                                 <option value="2.01.05">2.01.05 - Vale Transporte</option>
                                 <option value="2.01.06">2.01.06 - Vale Refeição / Alimentação</option>
                                 <option value="2.01.08">2.01.08 - Bônus e Premiações</option>
                              </select>
                           </div>
                           <div>
                              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Valor (R$)</label>
                              <input
                                 type="number"
                                 className="w-full bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-xl p-2.5 text-xs font-bold"
                                 placeholder="0.00"
                                 value={odpForm.value || ''}
                                 onChange={e => setOdpForm({ ...odpForm, value: Number(e.target.value) })}
                                 required
                              />
                           </div>
                        </div>

                        <div>
                           <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Descrição / Observação</label>
                           <input
                              type="text"
                              className="w-full bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-xl p-2.5 text-xs font-bold"
                              placeholder="Detalhes adicionais do lançamento..."
                              value={odpForm.description}
                              onChange={e => setOdpForm({ ...odpForm, description: e.target.value })}
                           />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                           <div>
                              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Data de Pagamento</label>
                              <input
                                 type="date"
                                 className="w-full bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-xl p-2.5 text-xs font-bold"
                                 value={odpForm.date}
                                 onChange={e => setOdpForm({ ...odpForm, date: e.target.value })}
                                 required
                              />
                           </div>
                           <div>
                              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Conta de Saída</label>
                              <select
                                 className="w-full bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-xl p-2.5 text-xs font-bold"
                                 value={odpForm.account}
                                 onChange={e => setOdpForm({ ...odpForm, account: e.target.value })}
                                 required
                              >
                                 <option value="">Selecione a conta...</option>
                                 {accounts.map(acc => (
                                    <option key={acc.id} value={acc.id}>{acc.name} ({formatCurrency(acc.balance)})</option>
                                 ))}
                              </select>
                           </div>
                        </div>
                     </div>

                     <div className="p-5 bg-slate-50 dark:bg-gray-800/80 border-t dark:border-gray-700 flex gap-3">
                        <button
                           type="button"
                           onClick={() => setIsODPModalOpen(false)}
                           className="flex-1 py-2.5 bg-white dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 transition-colors uppercase"
                        >
                           Cancelar
                        </button>
                        <button
                           type="submit"
                           disabled={isSubmitting}
                           className={`flex-[2] py-2.5 bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-bold rounded-xl text-xs uppercase tracking-wider shadow transition-colors flex items-center justify-center gap-2 ${isSubmitting ? 'opacity-75 cursor-not-allowed' : ''}`}
                        >
                           {isSubmitting ? <Loader className="animate-spin" size={15} /> : <Save size={15} />}
                           {isSubmitting ? 'Processando...' : 'Lançar ODP'}
                        </button>
                     </div>
                  </form>
               </div>
            </div>
         )}

         {/* ODA MODAL */}
         {isODAModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
               <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-xl border dark:border-gray-700 animate-in zoom-in duration-200 overflow-hidden my-6">
                  <div className="p-5 border-b dark:border-gray-700 bg-slate-50 dark:bg-gray-800/50 flex justify-between items-center">
                     <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-600 text-white rounded-xl">
                           <Fuel size={18} />
                        </div>
                        <div>
                           <h3 className="font-bold text-base text-slate-900 dark:text-white">Ordem de Abastecimento (ODA)</h3>
                           <p className="text-xs text-slate-500">Controle de abastecimento, combustível e hodômetro da frota</p>
                        </div>
                     </div>
                     <button onClick={() => setIsODAModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                        <X size={20} />
                     </button>
                  </div>
                  <form onSubmit={handleSaveODA}>
                     <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                           <div>
                              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Veículo</label>
                              <select
                                 className="w-full bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-xl p-2.5 text-xs font-bold"
                                 value={odaForm.vehicleId}
                                 onChange={e => setOdaForm({ ...odaForm, vehicleId: e.target.value })}
                                 required
                              >
                                 <option value="">Selecione o veículo...</option>
                                 {fleet.map(v => (
                                    <option key={v.id} value={v.id}>{v.plate} - {v.name}</option>
                                 ))}
                              </select>
                           </div>
                           <div>
                              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Motorista Responsável</label>
                              <select
                                 className="w-full bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-xl p-2.5 text-xs font-bold"
                                 value={odaForm.driverId}
                                 onChange={e => setOdaForm({ ...odaForm, driverId: e.target.value })}
                                 required
                              >
                                 <option value="">Selecione o motorista...</option>
                                 {employees.map(emp => (
                                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                                 ))}
                              </select>
                           </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                           <div>
                              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Posto de Combustível / Fornecedor</label>
                              <select
                                 className="w-full bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-xl p-2.5 text-xs font-bold"
                                 value={odaForm.stationId}
                                 onChange={e => {
                                    const sup = suppliers.find(s => s.id === e.target.value);
                                    setOdaForm({ ...odaForm, stationId: e.target.value, stationName: sup ? sup.name : '' });
                                 }}
                                 required
                              >
                                 <option value="">Selecione o posto...</option>
                                 {suppliers.map(s => (
                                    <option key={s.id} value={s.id}>{s.name} ({s.category})</option>
                                 ))}
                              </select>
                           </div>
                           <div>
                              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Tipo de Combustível</label>
                              <select
                                 className="w-full bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-xl p-2.5 text-xs font-bold"
                                 value={odaForm.fuelType}
                                 onChange={e => setOdaForm({ ...odaForm, fuelType: e.target.value })}
                              >
                                 <option value="Diesel S-10">Diesel S-10</option>
                                 <option value="Diesel S-500">Diesel S-500</option>
                                 <option value="Gasolina">Gasolina</option>
                                 <option value="Etanol">Etanol</option>
                                 <option value="Arla 32">Arla 32</option>
                                 <option value="GNV">GNV</option>
                              </select>
                           </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                           <div>
                              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Litros (L)</label>
                              <input
                                 type="number"
                                 step="0.01"
                                 className="w-full bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-xl p-2.5 text-xs font-bold"
                                 value={odaForm.liters || ''}
                                 onChange={e => {
                                    const l = Number(e.target.value);
                                    setOdaForm({ ...odaForm, liters: l, totalValue: l * odaForm.pricePerLiter });
                                 }}
                                 required
                              />
                           </div>
                           <div>
                              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Preço Unit. (R$)</label>
                              <input
                                 type="number"
                                 step="0.001"
                                 className="w-full bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-xl p-2.5 text-xs font-bold"
                                 value={odaForm.pricePerLiter || ''}
                                 onChange={e => {
                                    const p = Number(e.target.value);
                                    setOdaForm({ ...odaForm, pricePerLiter: p, totalValue: odaForm.liters * p });
                                 }}
                                 required
                              />
                           </div>
                           <div>
                              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Total (R$)</label>
                              <input
                                 type="text"
                                 className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 font-black text-emerald-600 dark:text-emerald-400 text-xs"
                                 value={formatCurrency(odaForm.totalValue)}
                                 disabled
                              />
                           </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                           <div>
                              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">KM Atual (Odômetro)</label>
                              <input
                                 type="number"
                                 className="w-full bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-xl p-2.5 text-xs font-bold"
                                 value={odaForm.km || ''}
                                 onChange={e => setOdaForm({ ...odaForm, km: Number(e.target.value) })}
                                 required
                              />
                           </div>
                           <div>
                              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Conta de Saída</label>
                              <select
                                 className="w-full bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-xl p-2.5 text-xs font-bold"
                                 value={odaForm.account}
                                 onChange={e => setOdaForm({ ...odaForm, account: e.target.value })}
                                 required
                              >
                                 <option value="">Selecione a conta...</option>
                                 {accounts.map(acc => (
                                    <option key={acc.id} value={acc.id}>{acc.name} ({formatCurrency(acc.balance)})</option>
                                 ))}
                              </select>
                           </div>
                        </div>
                     </div>

                     <div className="p-5 bg-slate-50 dark:bg-gray-800/80 border-t dark:border-gray-700 flex gap-3">
                        <button
                           type="button"
                           onClick={() => setIsODAModalOpen(false)}
                           className="flex-1 py-2.5 bg-white dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 transition-colors uppercase"
                        >
                           Cancelar
                        </button>
                        <button
                           type="submit"
                           disabled={isSubmitting}
                           className={`flex-[2] py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-xs uppercase tracking-wider shadow transition-colors flex items-center justify-center gap-2 ${isSubmitting ? 'opacity-75 cursor-not-allowed' : ''}`}
                        >
                           {isSubmitting ? <Loader className="animate-spin" size={15} /> : <Save size={15} />}
                           {isSubmitting ? 'Processando...' : 'Lançar ODA'}
                        </button>
                     </div>
                  </form>
               </div>
            </div>
         )}
      </div>
   );
};

export default Purchases;