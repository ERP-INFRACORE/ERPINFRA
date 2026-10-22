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
   Percent,
   Check,
   Layers,
   RefreshCw,
   Inbox,
   Lock,
   Info,
   Phone,
   Mail,
   Building2,
   Disc,
   MapPin
} from 'lucide-react';
import { BarChart, Bar, ResponsiveContainer, Tooltip, XAxis, CartesianGrid } from 'recharts';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { PurchaseOrder, PurchaseItem, Supplier, InventoryItem, MaintenanceRecord, Employee } from '../types';
import { printDocument, exportToCSV } from '../utils/exportUtils';

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
      tires,
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

   const [activeTab, setActiveTab] = useState<'dashboard' | 'orders' | 'approval' | 'new-order' | 'suppliers' | 'inventory'>('dashboard');
   const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);
   const [isSubmitting, setIsSubmitting] = useState(false);

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

   // Inventory Management States (Estoque Geral)
   const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
   const [isStockModalOpen, setIsStockModalOpen] = useState(false);
   const [stockForm, setStockForm] = useState<Partial<InventoryItem>>({
      name: '', category: 'Insumos', quantity: 0, minStock: 0, unit: 'un', price: 0, location: ''
   });

   // Supplier Management States
   const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
   const [supForm, setSupForm] = useState<Partial<Supplier>>({
      status: 'Ativo', registeredAt: new Date().toLocaleDateString('pt-BR')
   });
   const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
   const [supplierSearch, setSupplierSearch] = useState('');
   const [supplierStatusFilter, setSupplierStatusFilter] = useState<'Todos' | 'Ativo' | 'Inativo'>('Todos');
   const [supplierCategoryFilter, setSupplierCategoryFilter] = useState('Todas');
   const [selectedSupplierDetailId, setSelectedSupplierDetailId] = useState<string | null>(null);

   // Search & Filter for Orders
   const [searchTerm, setSearchTerm] = useState('');
   const [statusFilter, setStatusFilter] = useState<string>('Todos');
   const [orderTypeFilter, setOrderTypeFilter] = useState<string>('Todos');
   const [catalogSearch, setCatalogSearch] = useState('');
   const [stockSearch, setStockSearch] = useState('');
   const [stockLevelFilter, setStockLevelFilter] = useState<'Todos' | 'Crítico' | 'Normal' | 'Excedente'>('Todos');
   const [stockCategoryFilter, setStockCategoryFilter] = useState<string>('Todas');

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
         addToast("Novo item cadastrado no estoque geral!", 'success');
      }
      setIsStockModalOpen(false);
      setEditingItem(null);
      setStockForm({ name: '', category: 'Insumos', quantity: 0, minStock: 0, unit: 'un', price: 0, location: '' });
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

   // Categories & Filtered Suppliers for Suppliers Master-Detail List
   const supplierCategories = useMemo(() => {
      return Array.from(new Set(suppliers.map(s => s.category).filter(Boolean)));
   }, [suppliers]);

   const filteredSuppliers = useMemo(() => {
      return suppliers.filter(s => {
         const term = supplierSearch.toLowerCase().trim();
         const matchesSearch = !term ||
            s.name.toLowerCase().includes(term) ||
            (s.tradeName && s.tradeName.toLowerCase().includes(term)) ||
            s.document.toLowerCase().includes(term) ||
            s.category.toLowerCase().includes(term) ||
            (s.contactPerson && s.contactPerson.toLowerCase().includes(term)) ||
            (s.email && s.email.toLowerCase().includes(term)) ||
            (s.phone && s.phone.includes(term));

         const matchesStatus = supplierStatusFilter === 'Todos' || s.status === supplierStatusFilter;
         const matchesCategory = supplierCategoryFilter === 'Todas' || s.category === supplierCategoryFilter;

         return matchesSearch && matchesStatus && matchesCategory;
      });
   }, [suppliers, supplierSearch, supplierStatusFilter, supplierCategoryFilter]);

   const activeDetailSupplier = useMemo(() => {
      if (selectedSupplierDetailId) {
         const found = suppliers.find(s => s.id === selectedSupplierDetailId);
         if (found) return found;
      }
      return filteredSuppliers[0] || null;
   }, [suppliers, selectedSupplierDetailId, filteredSuppliers]);

   // Unified General Inventory (Insumos + Peças de Manutenção + Pneus da Frota em Estoque)
   const unifiedInventory = useMemo(() => {
      const standardItems = (inventory || []).map(item => ({
         ...item,
         sourceType: 'inventory' as const,
         location: item.location || 'Almoxarifado Central',
         serials: undefined as string[] | undefined
      }));

      // Gather fleet tires in warehouse (status 'Estoque' or 'Novo')
      const existingNames = new Set(standardItems.map(i => i.name.toLowerCase()));
      const warehouseTires = (tires || []).filter(t => t.status === 'Estoque' || t.status === 'Novo');

      const groupedTires = new Map<string, { tire: typeof warehouseTires[0]; count: number; serials: string[] }>();
      warehouseTires.forEach(t => {
         const key = `${t.brand} ${t.model} ${t.size}`.trim();
         const existing = groupedTires.get(key);
         if (existing) {
            existing.count += 1;
            existing.serials.push(t.serialNumber);
         } else {
            groupedTires.set(key, { tire: t, count: 1, serials: [t.serialNumber] });
         }
      });

      const synthesizedTires: (InventoryItem & { sourceType: 'tire'; serials?: string[] })[] = [];
      groupedTires.forEach((grp, key) => {
         const itemName = `Pneu ${key}`;
         if (!existingNames.has(itemName.toLowerCase())) {
            synthesizedTires.push({
               id: `TIRE-${grp.tire.id}`,
               name: itemName,
               category: 'Pneus',
               quantity: grp.count,
               unit: 'un',
               price: 1850,
               costPrice: 1650,
               minStock: 2,
               location: 'Borracharia / Box Frota',
               sourceType: 'tire',
               serials: grp.serials
            });
         }
      });

      return [...standardItems, ...synthesizedTires];
   }, [inventory, tires]);

   const stockCategories = useMemo(() => {
      const cats = new Set<string>(['Insumos', 'Peças de Manutenção', 'Pneus', 'Consumíveis', 'Matéria Prima', 'Ferramentas']);
      unifiedInventory.forEach(item => {
         if (item.category) cats.add(item.category);
      });
      return Array.from(cats);
   }, [unifiedInventory]);

   const filteredStockItems = useMemo(() => {
      return unifiedInventory.filter(item => {
         const term = stockSearch.toLowerCase().trim();
         const matchesSearch = !term ||
            item.name.toLowerCase().includes(term) ||
            item.category.toLowerCase().includes(term) ||
            (item.location && item.location.toLowerCase().includes(term)) ||
            (item.serials && item.serials.some(s => s.toLowerCase().includes(term)));

         const matchesCategory = stockCategoryFilter === 'Todas' || item.category === stockCategoryFilter;

         const matchesLevel = stockLevelFilter === 'Todos'
            ? true
            : stockLevelFilter === 'Crítico'
            ? item.quantity <= item.minStock
            : stockLevelFilter === 'Excedente'
            ? item.quantity > (item.maxStock || item.minStock * 3 || 100)
            : item.quantity > item.minStock;

         return matchesSearch && matchesCategory && matchesLevel;
      });
   }, [unifiedInventory, stockSearch, stockCategoryFilter, stockLevelFilter]);

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
                  Gestão integrada de compras, autorização de pedidos e controle de estoque.
               </p>
            </div>
            <div className="flex items-center gap-2">
               
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
                  
                  { id: 'orders', label: 'Histórico de Pedidos', icon: FileText },
                  { id: 'approval', label: 'Central de Aprovações', icon: ShieldCheck, badge: purchaseOrders.filter(o => o.status === 'Pendente').length },
                  { id: 'new-order', label: 'Nova Compra (OCP)', icon: Plus },
                  { id: 'suppliers', label: 'Fornecedores', icon: Users },
                  { id: 'inventory', label: 'Estoque Geral', icon: Warehouse }
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
                           <Users size={22} />
                        </div>
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 font-black">
                           {suppliers.filter(s => s.status === 'Ativo').length} Ativos
                        </span>
                     </div>
                     <p className="text-xs text-slate-400 font-bold uppercase mb-1">Fornecedores Homologados</p>
                     <h3 className="text-2xl font-black text-indigo-600">
                        {suppliers.length} Parceiros
                     </h3>
                     <div className="mt-2 text-[10px] text-slate-400">Base homologada para suprimentos</div>
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
                           <Warehouse size={18} />
                           <span className="text-[10px] font-black uppercase tracking-wider">Diretriz de Suprimentos</span>
                        </div>
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Controle de Suprimentos & Estoque Geral</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                           A entrada física e contábil de insumos, peças de manutenção e pneus ocorre diretamente através da conferência de entrega e recebimento de Ordens de Compra aprovadas.
                        </p>
                     </div>
                     <div className="pt-4 border-t border-slate-100 dark:border-gray-700 mt-4">
                        <button
                           onClick={() => setActiveTab('inventory')}
                           className="w-full py-2.5 bg-cyan-50 dark:bg-cyan-900/30 hover:bg-cyan-100 text-cyan-700 dark:text-cyan-300 rounded-xl font-bold uppercase text-xs tracking-wider transition-colors flex items-center justify-center gap-2"
                        >
                           <Warehouse size={15} /> Consultar Estoque Geral
                        </button>
                     </div>
                  </div>
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

         {/* TAB 6: FORNECEDORES (LISTA COM DETALHES) */}
         {activeTab === 'suppliers' && (
            <div className="space-y-4 animate-in fade-in duration-300">
               {/* Controls Bar */}
               <div className="flex flex-col md:flex-row gap-3 items-center justify-between bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-gray-700">
                  <div className="relative w-full md:w-96">
                     <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                     <input
                        type="text"
                        placeholder="Buscar por razão social, CNPJ, categoria, contato..."
                        value={supplierSearch}
                        onChange={e => setSupplierSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-cyan-500"
                     />
                  </div>

                  <div className="flex items-center gap-2 overflow-x-auto no-scrollbar w-full md:w-auto">
                     <select
                        value={supplierCategoryFilter}
                        onChange={e => setSupplierCategoryFilter(e.target.value)}
                        className="px-3 py-1.5 bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-xl text-xs font-bold text-slate-600 dark:text-gray-300 outline-none"
                     >
                        <option value="Todas">Todas Categorias</option>
                        {supplierCategories.map(c => (
                           <option key={c} value={c}>{c}</option>
                        ))}
                     </select>

                     {(['Todos', 'Ativo', 'Inativo'] as const).map(f => (
                        <button
                           key={f}
                           type="button"
                           onClick={() => setSupplierStatusFilter(f)}
                           className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                              supplierStatusFilter === f
                                 ? 'bg-slate-900 text-white shadow-sm'
                                 : 'bg-slate-50 text-slate-500 border border-slate-100 hover:bg-slate-100 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600'
                           }`}
                        >
                           {f}
                        </button>
                     ))}

                     <button
                        onClick={() => {
                           setEditingSupplier(null);
                           setSupForm({ status: 'Ativo', registeredAt: new Date().toLocaleDateString('pt-BR') });
                           setIsSupplierModalOpen(true);
                        }}
                        className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold uppercase ml-2 flex items-center gap-1.5 transition-colors shadow-sm whitespace-nowrap"
                     >
                        <Plus size={14} /> Novo Fornecedor
                     </button>
                  </div>
               </div>

               {/* Master-Detail Layout */}
               <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  {/* Master List (5 cols) */}
                  <div className="lg:col-span-5 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-slate-100 dark:border-gray-700 overflow-hidden flex flex-col">
                     <div className="p-3.5 border-b border-slate-100 dark:border-gray-700 flex justify-between items-center bg-slate-50/60 dark:bg-gray-800/60">
                        <span className="text-[11px] font-black uppercase text-slate-500 tracking-wider">
                           Fornecedores Homologados ({filteredSuppliers.length})
                        </span>
                        <span className="text-[10px] text-slate-400">Clique para inspecionar</span>
                     </div>

                     <div className="divide-y divide-slate-100 dark:divide-gray-700 max-h-[720px] overflow-y-auto">
                        {filteredSuppliers.length === 0 ? (
                           <div className="p-8 text-center text-slate-400 text-xs">
                              <Users size={32} className="mx-auto mb-2 text-slate-300" />
                              Nenhum fornecedor encontrado com os filtros atuais.
                           </div>
                        ) : (
                           filteredSuppliers.map(sup => {
                              const isSelected = activeDetailSupplier?.id === sup.id;
                              const supOrders = purchaseOrders.filter(o => o.supplierId === sup.id);
                              const totalPurchased = supOrders.reduce((a, b) => a + b.total, 0);

                              return (
                                 <button
                                    key={sup.id}
                                    type="button"
                                    onClick={() => setSelectedSupplierDetailId(sup.id)}
                                    className={`w-full text-left p-4 transition-all flex items-start gap-3.5 relative ${
                                       isSelected
                                          ? 'bg-cyan-50/70 dark:bg-cyan-950/30 border-l-4 border-l-cyan-600'
                                          : 'hover:bg-slate-50 dark:hover:bg-gray-700/50 border-l-4 border-l-transparent'
                                    }`}
                                 >
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs shrink-0 transition-colors ${
                                       isSelected
                                          ? 'bg-cyan-600 text-white'
                                          : 'bg-slate-100 dark:bg-gray-700 text-slate-600 dark:text-gray-300'
                                    }`}>
                                       {sup.initials || sup.name.slice(0, 2).toUpperCase()}
                                    </div>

                                    <div className="min-w-0 flex-1">
                                       <div className="flex items-center justify-between gap-2 mb-0.5">
                                          <h4 className="font-bold text-xs text-slate-900 dark:text-white truncate">
                                             {sup.name}
                                          </h4>
                                          <span className={`px-2 py-0.2 rounded-full text-[9px] font-black uppercase shrink-0 ${
                                             sup.status === 'Ativo'
                                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                                : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'
                                          }`}>
                                             {sup.status}
                                          </span>
                                       </div>

                                       <p className="text-[11px] text-slate-500 dark:text-gray-400 truncate mb-1.5">
                                          {sup.category} • CNPJ: {sup.document}
                                       </p>

                                       <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-100 dark:border-gray-700/60">
                                          <span>{supOrders.length} ordens</span>
                                          <span className="font-bold font-mono text-slate-700 dark:text-gray-300">
                                             {formatCurrency(totalPurchased)}
                                          </span>
                                       </div>
                                    </div>
                                 </button>
                              );
                           })
                        )}
                     </div>
                  </div>

                  {/* Detail View (7 cols) */}
                  <div className="lg:col-span-7">
                     {activeDetailSupplier ? (() => {
                        const sup = activeDetailSupplier;
                        const supOrders = purchaseOrders.filter(o => o.supplierId === sup.id);
                        const totalPurchased = supOrders.reduce((a, b) => a + b.total, 0);
                        const avgTicket = supOrders.length > 0 ? (totalPurchased / supOrders.length) : 0;

                        return (
                           <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-slate-100 dark:border-gray-700 p-6 space-y-6 animate-in fade-in duration-200">
                              {/* Header Card */}
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-gray-700">
                                 <div className="flex items-start gap-4">
                                    <div className="w-14 h-14 bg-cyan-600 text-white rounded-2xl flex items-center justify-center font-black text-lg shadow-md shadow-cyan-600/20 shrink-0">
                                       {sup.initials || sup.name.slice(0, 2).toUpperCase()}
                                    </div>
                                    <div>
                                       <div className="flex items-center gap-2 mb-1">
                                          <h3 className="font-bold text-lg text-slate-900 dark:text-white leading-tight">
                                             {sup.name}
                                          </h3>
                                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                             sup.status === 'Ativo'
                                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                                : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'
                                          }`}>
                                             {sup.status}
                                          </span>
                                       </div>
                                       {sup.tradeName && (
                                          <p className="text-xs font-semibold text-slate-500 mb-1">
                                             Nome Fantasia: {sup.tradeName}
                                          </p>
                                       )}
                                       <p className="text-xs text-slate-400">
                                          Categoria: <strong className="text-slate-600 dark:text-slate-300">{sup.category}</strong> • CNPJ/CPF: <strong className="text-slate-600 dark:text-slate-300">{sup.document}</strong>
                                       </p>
                                    </div>
                                 </div>

                                 <div className="flex items-center gap-2 self-start sm:self-center">
                                    <button
                                       type="button"
                                       onClick={() => {
                                          setEditingSupplier(sup);
                                          setSupForm(sup);
                                          setIsSupplierModalOpen(true);
                                       }}
                                       className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-slate-700 dark:text-gray-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                                    >
                                       <Edit2 size={14} /> Editar
                                    </button>
                                    <button
                                       type="button"
                                       onClick={() => {
                                          setSelectedSupplier(sup.id);
                                          setActiveTab('new-order');
                                       }}
                                       className="px-3.5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow transition-colors"
                                    >
                                       <Plus size={14} /> Nova Compra
                                    </button>
                                 </div>
                              </div>

                              {/* KPI Strip */}
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                 <div className="bg-slate-50 dark:bg-gray-900/50 p-3.5 rounded-xl border border-slate-100 dark:border-gray-700">
                                    <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Volume Comprado</span>
                                    <span className="text-sm font-black font-mono text-cyan-600">{formatCurrency(totalPurchased)}</span>
                                 </div>
                                 <div className="bg-slate-50 dark:bg-gray-900/50 p-3.5 rounded-xl border border-slate-100 dark:border-gray-700">
                                    <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Ordens Totais</span>
                                    <span className="text-sm font-black text-slate-800 dark:text-white">{supOrders.length} pedidos</span>
                                 </div>
                                 <div className="bg-slate-50 dark:bg-gray-900/50 p-3.5 rounded-xl border border-slate-100 dark:border-gray-700">
                                    <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Ticket Médio</span>
                                    <span className="text-sm font-black font-mono text-slate-800 dark:text-white">{formatCurrency(avgTicket)}</span>
                                 </div>
                                 <div className="bg-slate-50 dark:bg-gray-900/50 p-3.5 rounded-xl border border-slate-100 dark:border-gray-700">
                                    <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Cadastrado em</span>
                                    <span className="text-xs font-bold text-slate-700 dark:text-gray-300">{sup.registeredAt || 'Não informado'}</span>
                                 </div>
                              </div>

                              {/* Informações de Contato e Fiscais */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                 <div className="p-4 bg-slate-50 dark:bg-gray-900/40 rounded-xl border border-slate-100 dark:border-gray-700/80 space-y-2.5">
                                    <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-gray-300 mb-2">
                                       <Phone size={14} className="text-cyan-600" />
                                       Contato & Comunicação
                                    </div>
                                    <div className="text-xs">
                                       <span className="text-slate-400 block text-[10px] uppercase font-bold">Responsável</span>
                                       <span className="font-semibold text-slate-800 dark:text-white">{sup.contactPerson || 'Não informado'}</span>
                                    </div>
                                    <div className="text-xs">
                                       <span className="text-slate-400 block text-[10px] uppercase font-bold">Telefone</span>
                                       <span className="font-semibold text-slate-800 dark:text-white">{sup.phone || 'Não informado'}</span>
                                    </div>
                                    <div className="text-xs">
                                       <span className="text-slate-400 block text-[10px] uppercase font-bold">E-mail Comercial</span>
                                       <span className="font-semibold text-slate-800 dark:text-white break-all">{sup.email || 'Não informado'}</span>
                                    </div>
                                 </div>

                                 <div className="p-4 bg-slate-50 dark:bg-gray-900/40 rounded-xl border border-slate-100 dark:border-gray-700/80 space-y-2.5">
                                    <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-gray-300 mb-2">
                                       <Building2 size={14} className="text-cyan-600" />
                                       Dados Cadastrais & Fiscais
                                    </div>
                                    <div className="text-xs">
                                       <span className="text-slate-400 block text-[10px] uppercase font-bold">Razão Social</span>
                                       <span className="font-semibold text-slate-800 dark:text-white">{sup.name}</span>
                                    </div>
                                    <div className="text-xs">
                                       <span className="text-slate-400 block text-[10px] uppercase font-bold">CNPJ / CPF</span>
                                       <span className="font-semibold font-mono text-slate-800 dark:text-white">{sup.document}</span>
                                    </div>
                                    <div className="text-xs">
                                       <span className="text-slate-400 block text-[10px] uppercase font-bold">Segmento / Categoria</span>
                                       <span className="font-semibold text-slate-800 dark:text-white">{sup.category}</span>
                                    </div>
                                 </div>
                              </div>

                              {/* Histórico Recente de Ordens de Compra */}
                              <div className="space-y-3 pt-2">
                                 <div className="flex justify-between items-center">
                                    <h4 className="text-xs font-black uppercase text-slate-700 dark:text-gray-300 tracking-wider">
                                       Histórico de Ordens com este Fornecedor ({supOrders.length})
                                    </h4>
                                    {supOrders.length > 0 && (
                                       <button
                                          type="button"
                                          onClick={() => {
                                             setSearchTerm(sup.name);
                                             setActiveTab('orders');
                                          }}
                                          className="text-[11px] font-bold text-cyan-600 hover:text-cyan-700 dark:text-cyan-400"
                                       >
                                          Ver todas no Histórico →
                                       </button>
                                    )}
                                 </div>

                                 {supOrders.length === 0 ? (
                                    <div className="p-6 bg-slate-50 dark:bg-gray-900/30 rounded-xl border border-dashed border-slate-200 dark:border-gray-700 text-center">
                                       <p className="text-xs text-slate-400 mb-2">Nenhuma ordem de compra registrada para este fornecedor.</p>
                                       <button
                                          type="button"
                                          onClick={() => {
                                             setSelectedSupplier(sup.id);
                                             setActiveTab('new-order');
                                          }}
                                          className="px-3 py-1.5 bg-cyan-600 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1"
                                       >
                                          <Plus size={13} /> Emitir Primeira Compra
                                       </button>
                                    </div>
                                 ) : (
                                    <div className="border border-slate-100 dark:border-gray-700 rounded-xl overflow-hidden">
                                       <table className="w-full text-left text-xs">
                                          <thead className="bg-slate-50 dark:bg-gray-700/50 text-[10px] font-bold text-slate-400 uppercase">
                                             <tr>
                                                <th className="p-3">Ordem</th>
                                                <th className="p-3">Data</th>
                                                <th className="p-3">Itens</th>
                                                <th className="p-3 text-right">Valor Total</th>
                                                <th className="p-3 text-center">Status</th>
                                             </tr>
                                          </thead>
                                          <tbody className="divide-y divide-slate-100 dark:divide-gray-700">
                                             {supOrders.slice(0, 5).map(o => (
                                                <tr
                                                   key={o.id}
                                                   onClick={() => setSelectedOrder(o)}
                                                   className="hover:bg-slate-50 dark:hover:bg-gray-700/40 cursor-pointer transition-colors"
                                                >
                                                   <td className="p-3 font-mono font-bold text-cyan-600">{o.id}</td>
                                                   <td className="p-3 text-slate-600 dark:text-gray-300">{o.date}</td>
                                                   <td className="p-3 text-slate-600 dark:text-gray-300 truncate max-w-[150px]">
                                                      {o.items.map(it => it.name).join(', ')}
                                                   </td>
                                                   <td className="p-3 text-right font-mono font-bold text-slate-800 dark:text-white">
                                                      {formatCurrency(o.total)}
                                                   </td>
                                                   <td className="p-3 text-center">
                                                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${getStatusColor(o.status)}`}>
                                                         {o.status}
                                                      </span>
                                                   </td>
                                                </tr>
                                             ))}
                                          </tbody>
                                       </table>
                                    </div>
                                 )}
                              </div>
                           </div>
                        );
                     })() : (
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-slate-100 dark:border-gray-700 p-12 text-center text-slate-400">
                           <Users size={40} className="mx-auto mb-3 text-slate-300" />
                           <h4 className="font-bold text-sm text-slate-700 dark:text-gray-200">Nenhum fornecedor selecionado</h4>
                           <p className="text-xs text-slate-400 mt-1">Selecione um fornecedor na lista ao lado para ver sua ficha completa e histórico de compras.</p>
                        </div>
                     )}
                  </div>
               </div>
            </div>
         )}

         {/* TAB 7: ESTOQUE GERAL (INSUMOS, PEÇAS E PNEUS) */}
         {activeTab === 'inventory' && (
            <div className="space-y-4 animate-in fade-in duration-300">
               {/* Search and Filters */}
               <div className="flex flex-col md:flex-row gap-3 items-center justify-between bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-gray-700">
                  <div className="relative w-full md:w-96">
                     <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                     <input
                        type="text"
                        value={stockSearch}
                        onChange={e => setStockSearch(e.target.value)}
                        placeholder="Buscar por item, código, categoria ou localização..."
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-cyan-500"
                     />
                  </div>

                  <div className="flex items-center gap-2 overflow-x-auto no-scrollbar w-full md:w-auto">
                     {/* Category Select Filter */}
                     <select
                        value={stockCategoryFilter}
                        onChange={e => setStockCategoryFilter(e.target.value)}
                        className="px-3 py-1.5 bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-xl text-xs font-bold text-slate-600 dark:text-gray-300 outline-none"
                     >
                        <option value="Todas">Todas Categorias</option>
                        {stockCategories.map(cat => (
                           <option key={cat} value={cat}>{cat}</option>
                        ))}
                     </select>

                     {/* Level Filters */}
                     {(['Todos', 'Crítico', 'Normal', 'Excedente'] as const).map(f => (
                        <button
                           type="button"
                           key={f}
                           onClick={() => setStockLevelFilter(f)}
                           className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                              stockLevelFilter === f
                                 ? 'bg-slate-900 text-white shadow-sm'
                                 : 'bg-slate-50 text-slate-500 border border-slate-100 hover:bg-slate-100 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600'
                           }`}
                        >
                           {f}
                        </button>
                     ))}

                     {isAdmin && (
                        <button
                           onClick={() => {
                              setEditingItem(null);
                              setStockForm({ name: '', category: 'Insumos', quantity: 0, minStock: 0, unit: 'un', price: 0, location: '' });
                              setIsStockModalOpen(true);
                           }}
                           className="px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold uppercase ml-2 flex items-center gap-1.5 transition-colors shadow-sm whitespace-nowrap"
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
                        <strong>Política de Suprimentos:</strong> A entrada física e contábil de estoque (insumos, peças e pneus) é realizada <strong>exclusivamente através do recebimento de Ordens de Compra</strong>. Cadastros e ajustes avulsos são restritos a administradores.
                     </span>
                  </div>
               )}

               {/* Clean General Inventory Table */}
               <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-slate-100 dark:border-gray-700 overflow-hidden">
                  <div className="p-3.5 border-b border-slate-100 dark:border-gray-700 flex justify-between items-center bg-slate-50/60 dark:bg-gray-800/60">
                     <span className="text-[11px] font-black uppercase text-slate-500 tracking-wider">
                        Itens no Estoque Geral ({filteredStockItems.length})
                     </span>
                     <span className="text-[10px] text-slate-400">Insumos Industriais • Peças de Manutenção • Pneus da Frota</span>
                  </div>

                  <div className="overflow-x-auto">
                     <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 dark:bg-gray-700/50 text-slate-500 dark:text-gray-300 font-bold text-[10px] uppercase border-b border-slate-200 dark:border-gray-700 tracking-wider">
                           <tr>
                              <th className="px-5 py-3.5">Item / Especificação</th>
                              <th className="px-5 py-3.5">Localização Física</th>
                              <th className="px-5 py-3.5 text-center">Status</th>
                              <th className="px-5 py-3.5 text-center">Saldo / Quantidade</th>
                              <th className="px-5 py-3.5 text-right">Preço Médio / Custo</th>
                              <th className="px-5 py-3.5 text-right">Ações</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-gray-700">
                           {filteredStockItems.length === 0 ? (
                              <tr>
                                 <td colSpan={6} className="px-6 py-12 text-center text-slate-400 text-xs">
                                    <Package size={36} className="mx-auto mb-2 text-slate-300" />
                                    Nenhum item localizado no estoque geral com os filtros aplicados.
                                 </td>
                              </tr>
                           ) : (
                              filteredStockItems.map(item => {
                                 const isCritical = item.quantity <= item.minStock;
                                 const isExcess = item.maxStock ? item.quantity > item.maxStock : item.quantity > (item.minStock * 3 || 100);
                                 const cat = (item.category || '').toLowerCase();
                                 const isTire = cat.includes('pneu');
                                 const isPart = cat.includes('peça') || cat.includes('manuten');

                                 return (
                                    <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-gray-700/50 transition-colors group">
                                       <td className="px-5 py-3.5">
                                          <div className="flex items-center gap-3">
                                             <div className={`p-2.5 rounded-xl shrink-0 ${
                                                isTire
                                                   ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400'
                                                   : isPart
                                                   ? 'bg-teal-50 text-teal-600 dark:bg-teal-950/30 dark:text-teal-400'
                                                   : 'bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400'
                                             }`}>
                                                {isTire ? <Disc size={18} /> : isPart ? <Wrench size={18} /> : <Package size={18} />}
                                             </div>
                                             <div className="min-w-0">
                                                <p className="font-bold text-slate-900 dark:text-white text-xs truncate">{item.name}</p>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                   <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded bg-slate-100 dark:bg-gray-700 text-slate-600 dark:text-gray-300">
                                                      {item.category}
                                                   </span>
                                                   {item.serials && item.serials.length > 0 && (
                                                      <span className="text-[10px] text-amber-600 font-mono font-medium">
                                                         Fogo: {item.serials.slice(0, 3).join(', ')}{item.serials.length > 3 ? ` (+${item.serials.length - 3})` : ''}
                                                      </span>
                                                   )}
                                                </div>
                                             </div>
                                          </div>
                                       </td>
                                       <td className="px-5 py-3.5">
                                          <div className="flex items-center gap-1.5 text-slate-600 dark:text-gray-300 text-xs">
                                             <MapPin size={13} className="text-cyan-600 shrink-0" />
                                             <span className="truncate">{item.location || 'Almoxarifado Central'}</span>
                                          </div>
                                       </td>
                                       <td className="px-5 py-3.5 text-center">
                                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${
                                             isCritical
                                                ? 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900'
                                                : isExcess
                                                ? 'bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-950/30 dark:text-sky-400 dark:border-sky-900'
                                                : 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900'
                                          }`}>
                                             {isCritical ? 'REPOSIÇÃO' : isExcess ? 'EXCEDENTE' : 'DISPONÍVEL'}
                                          </span>
                                       </td>
                                       <td className="px-5 py-3.5 text-center">
                                          <div className="flex flex-col items-center">
                                             <span className={`font-black font-mono text-xs ${isCritical ? 'text-rose-600' : 'text-slate-800 dark:text-white'}`}>
                                                {item.quantity} {item.unit}
                                             </span>
                                             <span className="text-[10px] text-slate-400 font-medium">Mín: {item.minStock} {item.unit}</span>
                                          </div>
                                       </td>
                                       <td className="px-5 py-3.5 text-right font-mono">
                                          <div className="flex flex-col items-end">
                                             <span className="font-bold text-slate-900 dark:text-white text-xs">
                                                {formatCurrency(item.price || item.costPrice || 0)}
                                             </span>
                                             <span className="text-[10px] text-slate-400">
                                                Total: {formatCurrency((item.price || item.costPrice || 0) * item.quantity)}
                                             </span>
                                          </div>
                                       </td>
                                       <td className="px-5 py-3.5 text-right">
                                          <div className="flex items-center justify-end gap-1.5">
                                             <button
                                                type="button"
                                                onClick={() => {
                                                   addItemToOrder(item);
                                                   setActiveTab('new-order');
                                                }}
                                                className="p-1.5 text-cyan-600 hover:bg-cyan-50 dark:hover:bg-cyan-950/40 rounded-lg transition-colors border border-transparent hover:border-cyan-100"
                                                title="Solicitar Reposição / Emitir Compra"
                                             >
                                                <ShoppingBag size={16} />
                                             </button>
                                             {isAdmin && (
                                                <>
                                                   <button
                                                      type="button"
                                                      onClick={() => {
                                                         setEditingItem(item);
                                                         setStockForm({
                                                            ...item,
                                                            location: item.location || ''
                                                         });
                                                         setIsStockModalOpen(true);
                                                      }}
                                                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                                      title="Editar Item"
                                                   >
                                                      <Edit2 size={16} />
                                                   </button>
                                                   <button
                                                      type="button"
                                                      onClick={() => addToast(`Remover "${item.name}" do catálogo?`, 'warning', 5000, {
                                                         label: 'EXCLUIR',
                                                         onClick: () => deleteStockItem(item.id)
                                                      })}
                                                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                                                      title="Excluir"
                                                   >
                                                      <Trash2 size={16} />
                                                   </button>
                                                </>
                                             )}
                                          </div>
                                       </td>
                                    </tr>
                                 );
                              })
                           )}
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
                              {editingItem ? 'Editar Item no Estoque Geral' : 'Novo Item no Estoque Geral'}
                           </h3>
                           <p className="text-xs text-slate-500">Parâmetros de saldo, localização física, ponto de reposição e precificação</p>
                        </div>
                     </div>
                     <button onClick={() => setIsStockModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                        <X size={20} />
                     </button>
                  </div>
                  <form onSubmit={handleSaveStock}>
                     <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
                        <div>
                           <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Nome do Item / Material / Peça</label>
                           <input
                              type="text"
                              placeholder="Ex: Pneu Radial 295/80 R22.5, Filtro de Óleo, Cimento CP-II..."
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
                                 className="w-full bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-xl p-2.5 text-xs font-bold"
                                 value={stockForm.category || ''}
                                 onChange={e => setStockForm({ ...stockForm, category: e.target.value })}
                                 required
                              >
                                 <option value="">Selecione...</option>
                                 <option value="Insumos">Insumos Industriais</option>
                                 <option value="Peças de Manutenção">Peças de Manutenção</option>
                                 <option value="Pneus">Pneus & Rodagem</option>
                                 <option value="Matéria Prima">Matéria Prima</option>
                                 <option value="Acabamentos">Acabamentos</option>
                                 <option value="Ferramentas">Ferramentas</option>
                                 <option value="Equipamentos">Equipamentos</option>
                                 <option value="Consumíveis">Consumíveis / EPIs</option>
                                 <option value="Outros">Outros</option>
                              </select>
                           </div>
                           <div>
                              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Unidade</label>
                              <select
                                 className="w-full bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-xl p-2.5 text-xs font-bold"
                                 value={stockForm.unit || ''}
                                 onChange={e => setStockForm({ ...stockForm, unit: e.target.value })}
                                 required
                              >
                                 <option value="">Selecione...</option>
                                 <option value="un">UN (Unidade)</option>
                                 <option value="kit">KIT (Kit / Conjunto)</option>
                                 <option value="par">PAR (Par)</option>
                                 <option value="kg">KG (Quilos)</option>
                                 <option value="ton">TON (Toneladas)</option>
                                 <option value="m³">M³ (Metros Cúbicos)</option>
                                 <option value="m²">M² (Metros Quadrados)</option>
                                 <option value="m">M (Metros Lineares)</option>
                                 <option value="l">L (Litros)</option>
                                 <option value="sc">SC (Sacos)</option>
                              </select>
                           </div>
                        </div>
                        <div>
                           <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Localização Física no Almoxarifado</label>
                           <input
                              type="text"
                              placeholder="Ex: Galpão Central - Prateleira B3 / Box Borracharia / Almox. Frota"
                              className="w-full bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-xl p-2.5 text-xs font-bold"
                              value={stockForm.location || ''}
                              onChange={e => setStockForm({ ...stockForm, location: e.target.value })}
                           />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                           <div>
                              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Quantidade Atual em Saldo</label>
                              <input
                                 type="number"
                                 className="w-full bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-xl p-2.5 text-xs font-bold"
                                 value={stockForm.quantity || 0}
                                 onChange={e => setStockForm({ ...stockForm, quantity: Number(e.target.value) })}
                                 required
                              />
                           </div>
                           <div>
                              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Estoque Mínimo (Ponto de Alerta)</label>
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
                              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Preço Referência (R$)</label>
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