import React, { useState, useMemo } from 'react';
import {
    Factory,
    ClipboardList,
    CheckCircle,
    AlertTriangle,
    Play,
    Pause,
    Plus,
    Filter,
    X,
    Save,
    Thermometer,
    Zap,
    Circle,
    Beaker,
    User,
    Layers,
    Archive,
    FlaskConical,
    Trash2,
    Check,
    Edit2,
    Settings,
    Clock,
    Printer,
    Download,
    Search,
    Copy
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { ProductionOrder, InventoryItem, ProductionFormula, QualityTest, ProductionUnit } from '../types';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { exportToCSV, printDocument } from '../utils/exportUtils';

export interface StockShortageItem {
    productId: string;
    ingredientName: string;
    requiredQty: number;
    availableQty: number;
    shortageQty: number;
    unit: string;
}

export interface StockShortageCheckResult {
    hasShortage: boolean;
    shortages: StockShortageItem[];
    message: string;
}

let currentFormulasRef: ProductionFormula[] = [];
let currentInventoryRef: InventoryItem[] = [];

/**
 * Função auxiliar que multiplica a quantidade planejada da O.P. pelos ingredientes
 * da ProductionFormula e identifica qualquer insumo em inventory com saldo insuficiente.
 */
export const checkFormulaStockShortage = (
    order: { formulaId?: string; quantity?: number } | ProductionOrder,
    formulasList: ProductionFormula[] = currentFormulasRef,
    inventoryList: InventoryItem[] = currentInventoryRef
): StockShortageCheckResult => {
    const formula = formulasList.find(f => f.id === order.formulaId);
    const plannedQuantity = order.quantity || 0;

    if (!formula || !formula.ingredients || formula.ingredients.length === 0) {
        return {
            hasShortage: false,
            shortages: [],
            message: 'Nenhum ingrediente configurado na fórmula.'
        };
    }

    const shortages: StockShortageItem[] = [];

    formula.ingredients.forEach(ing => {
        const requiredQty = Number(((ing.qty || 0) * plannedQuantity).toFixed(3));

        // Busca o item no estoque pelo ID do produto ou fallback por nome
        const stockItem = inventoryList.find(i => i.id === ing.productId)
            || inventoryList.find(i => ing.name && i.name.toLowerCase().trim() === ing.name.toLowerCase().trim());

        const availableQty = stockItem ? stockItem.quantity : 0;
        const unit = ing.unit || stockItem?.unit || 'un';
        const ingredientName = ing.name || stockItem?.name || 'Insumo não identificado';

        if (availableQty < requiredQty) {
            shortages.push({
                productId: ing.productId || stockItem?.id || '',
                ingredientName,
                requiredQty,
                availableQty,
                shortageQty: Number((requiredQty - availableQty).toFixed(3)),
                unit
            });
        }
    });

    const hasShortage = shortages.length > 0;
    const message = hasShortage
        ? `Saldo insuficiente no estoque para: ${shortages.map(s => `${s.ingredientName} (Necessário: ${s.requiredQty} ${s.unit}, Disponível: ${s.availableQty} ${s.unit})`).join('; ')}`
        : 'Estoque suficiente para todos os insumos da fórmula.';

    return {
        hasShortage,
        shortages,
        message
    };
};

const Production = () => {
    const {
        inventory, productionOrders, formulas, productionUnits,
        addProductionOrder, updateProductionOrder, deleteProductionOrder,
        startProduction, completeProduction, addQualityTest,
        addProductionUnit, updateProductionUnit, deleteProductionUnit,
        addFormula, updateFormula, deleteFormula
    } = useApp();
    const { addToast } = useToast();

    // Sincroniza referências para invocações sem argumentos explícitos de lista
    currentFormulasRef = formulas;
    currentInventoryRef = inventory;
    const [activeTab, setActiveTab] = useState<'monitor' | 'orders' | 'formulas' | 'lab'>('monitor');

    const [selectedOrder, setSelectedOrder] = useState<ProductionOrder | null>(null);
    const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
    const [isEditOrderModalOpen, setIsEditOrderModalOpen] = useState(false);
    const [isTestModalOpen, setIsTestModalOpen] = useState(false);
    const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);
    const [isFormulaModalOpen, setIsFormulaModalOpen] = useState(false);

    const [editingUnit, setEditingUnit] = useState<ProductionUnit | null>(null);
    const [editingFormula, setEditingFormula] = useState<ProductionFormula | null>(null);
    const [editingOrder, setEditingOrder] = useState<ProductionOrder | null>(null);

    // Filter & Search states for Orders
    const [orderSearch, setOrderSearch] = useState('');
    const [orderStatusFilter, setOrderStatusFilter] = useState<string>('Todos');
    const [orderPriorityFilter, setOrderPriorityFilter] = useState<string>('Todas');
    const [orderUnitFilter, setOrderUnitFilter] = useState<string>('Todas');

    // Filter & Search states for Formulas
    const [formulaSearch, setFormulaSearch] = useState('');
    const [formulaCategoryFilter, setFormulaCategoryFilter] = useState<string>('Todas');

    // Forms State
    const [newOrder, setNewOrder] = useState<Partial<ProductionOrder>>({
        priority: 'Média',
        status: 'Planejado',
        progress: 0,
        unitId: 'u1',
        quantity: 100,
        batch: `L${new Date().getMonth() + 1}${new Date().getDate()}-${Math.floor(Math.random() * 100)}`
    });

    const [newTest, setNewTest] = useState<Partial<QualityTest>>({
        type: 'Slump Test',
        minExpected: '10 +/- 2',
        status: 'Pendente',
        testedAt: new Date().toISOString().split('T')[0]
    });

    const [formulaForm, setFormulaForm] = useState<Partial<ProductionFormula>>({
        type: 'Composicao',
        ingredients: [{ productId: '', name: '', qty: 0, unit: 'kg' }],
        outputs: [{ productId: '', name: '', percentage: 0 }]
    });

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
    };

    const calculateFormulaCost = (formula: ProductionFormula) => {
        if (!formula.ingredients || formula.ingredients.length === 0) return 0;
        return formula.ingredients.reduce((total, ing) => {
            const stockItem = inventory.find(i => i.id === ing.productId);
            const unitCost = stockItem?.costPrice ?? stockItem?.price ?? 0;
            return total + (ing.qty * unitCost);
        }, 0);
    };

    const handleSaveOrder = (e: React.FormEvent) => {
        e.preventDefault();
        const formula = formulas.find(f => f.id === newOrder.formulaId);
        const order: ProductionOrder = {
            id: Date.now().toString(),
            orderNumber: `OP-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
            productName: formula?.name || 'Produto Industrial',
            productId: formula?.outputProductId,
            formulaId: newOrder.formulaId,
            quantity: newOrder.quantity || 0,
            status: 'Planejado',
            startDate: new Date().toISOString().split('T')[0],
            dueDate: newOrder.dueDate || new Date(Date.now() + 86400000).toISOString().split('T')[0],
            priority: newOrder.priority || 'Média',
            progress: 0,
            unitId: newOrder.unitId,
            batch: newOrder.batch,
            operator: newOrder.operator,
            qualityTests: []
        };
        addProductionOrder(order);
        addToast(`Ordem de Produção #${order.orderNumber} emitida com sucesso!`, 'success');
        setIsOrderModalOpen(false);
    };

    const handleStartOrder = (order: ProductionOrder) => {
        const shortageCheck = checkFormulaStockShortage(order, formulas, inventory);
        if (shortageCheck.hasShortage) {
            const details = shortageCheck.shortages
                .map(s => `• ${s.ingredientName}: precisa de ${s.requiredQty.toLocaleString('pt-BR')} ${s.unit} (disponível: ${s.availableQty.toLocaleString('pt-BR')} ${s.unit})`)
                .join('\n');
            addToast(
                `Início de produção bloqueado! Saldo insuficiente no estoque:\n${details}`,
                'error',
                8000
            );
            return false;
        }

        startProduction(order.id);
        addToast(`Produção iniciada para OP #${order.orderNumber}!`, 'success');
        return true;
    };

    const handleUpdateExistingOrder = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingOrder) return;

        const currentOrder = productionOrders.find(o => o.id === editingOrder.id);
        if (editingOrder.status === 'Em Produção' && currentOrder?.status !== 'Em Produção' && !currentOrder?.rawMaterialsDeducted) {
            const shortageCheck = checkFormulaStockShortage(editingOrder, formulas, inventory);
            if (shortageCheck.hasShortage) {
                const details = shortageCheck.shortages
                    .map(s => `• ${s.ingredientName}: precisa de ${s.requiredQty.toLocaleString('pt-BR')} ${s.unit} (disponível: ${s.availableQty.toLocaleString('pt-BR')} ${s.unit})`)
                    .join('\n');
                addToast(
                    `Início de produção bloqueado! Saldo insuficiente no estoque:\n${details}`,
                    'error',
                    8000
                );
                return;
            }
        }

        updateProductionOrder(editingOrder);
        addToast(`Ordem #${editingOrder.orderNumber} atualizada!`, 'success');
        setIsEditOrderModalOpen(false);
        setEditingOrder(null);
    };

    const handleAddTest = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedOrder) {
            const test: QualityTest = {
                id: Date.now().toString(),
                type: newTest.type || '',
                result: newTest.result || '',
                minExpected: newTest.minExpected || '',
                status: newTest.status || 'Pendente',
                testedAt: newTest.testedAt || '',
                tester: newTest.tester
            };
            addQualityTest(selectedOrder.id, test);
            setSelectedOrder(prev => prev ? { ...prev, qualityTests: [test, ...(prev.qualityTests || [])] } : null);
            addToast(`Laudo de qualidade registrado para OP #${selectedOrder.orderNumber}!`, 'success');
            setIsTestModalOpen(false);
        }
    };

    const handleSaveUnit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingUnit) {
            if (productionUnits.some(u => u.id === editingUnit.id)) {
                updateProductionUnit(editingUnit);
                addToast("Unidade fabril atualizada!", 'success');
            } else {
                addProductionUnit({ ...editingUnit, id: Date.now().toString() });
                addToast("Nova unidade fabril cadastrada!", 'success');
            }
            setIsUnitModalOpen(false);
            setEditingUnit(null);
        }
    };

    const handleSaveFormula = (e: React.FormEvent) => {
        e.preventDefault();
        const formula: ProductionFormula = {
            id: editingFormula?.id || Date.now().toString(),
            name: formulaForm.name || '',
            category: formulaForm.category || 'Concreto',
            type: formulaForm.type || 'Composicao',
            outputProductId: formulaForm.outputProductId || 'p1',
            ingredients: formulaForm.ingredients || [],
            outputs: formulaForm.outputs || []
        } as ProductionFormula;

        if (editingFormula) {
            updateFormula(formula);
            addToast("Traço/Fórmula atualizado com sucesso!", 'success');
        } else {
            addFormula(formula);
            addToast("Novo traço cadastrado com sucesso!", 'success');
        }
        setIsFormulaModalOpen(false);
        setEditingFormula(null);
        setFormulaForm({ type: 'Composicao', ingredients: [{ productId: '', name: '', qty: 0, unit: 'kg' }], outputs: [{ productId: '', name: '', percentage: 0 }] });
    };

    const handleDuplicateFormula = (formula: ProductionFormula) => {
        const cloned: ProductionFormula = {
            ...formula,
            id: Date.now().toString(),
            name: `${formula.name} (Cópia)`,
            ingredients: formula.ingredients.map(ing => ({ ...ing })),
            outputs: formula.outputs ? formula.outputs.map(out => ({ ...out })) : undefined
        };
        addFormula(cloned);
        addToast(`Cópia do traço "${formula.name}" criada com sucesso!`, 'success');
    };

    const addIngredient = () => {
        setFormulaForm(prev => ({
            ...prev,
            ingredients: [...(prev.ingredients || []), { productId: '', name: '', qty: 0, unit: 'kg' }]
        }));
    };

    const addOutput = () => {
        setFormulaForm(prev => ({
            ...prev,
            outputs: [...(prev.outputs || []), { productId: '', name: '', percentage: 0 }]
        }));
    };

    const handlePauseOrder = (order: ProductionOrder) => {
        updateProductionOrder({ ...order, status: 'Pausado' });
        addToast(`O.P. #${order.orderNumber} pausada.`, 'warning');
    };

    const handleResumeOrder = (order: ProductionOrder) => {
        if (!order.rawMaterialsDeducted) {
            const shortageCheck = checkFormulaStockShortage(order, formulas, inventory);
            if (shortageCheck.hasShortage) {
                const details = shortageCheck.shortages
                    .map(s => `• ${s.ingredientName}: precisa de ${s.requiredQty.toLocaleString('pt-BR')} ${s.unit} (disponível: ${s.availableQty.toLocaleString('pt-BR')} ${s.unit})`)
                    .join('\n');
                addToast(
                    `Retomada bloqueada! Saldo insuficiente no estoque:\n${details}`,
                    'error',
                    8000
                );
                return;
            }
        }
        updateProductionOrder({ ...order, status: 'Em Produção' });
        addToast(`O.P. #${order.orderNumber} retomada.`, 'info');
    };

    const handleCancelOrder = (order: ProductionOrder) => {
        addToast(`Deseja cancelar a O.P. #${order.orderNumber}?`, 'warning', 6000, {
            label: 'CANCELAR O.P.',
            onClick: () => {
                updateProductionOrder({ ...order, status: 'Cancelado' });
                addToast(`O.P. #${order.orderNumber} cancelada.`, 'error');
            }
        });
    };

    const handleProgressIncrement = (order: ProductionOrder, delta: number) => {
        const nextProgress = Math.min(100, Math.max(0, order.progress + delta));
        updateProductionOrder({ ...order, progress: nextProgress });
        if (nextProgress === 100 && order.status !== 'Finalizado') {
            addToast(`O.P. #${order.orderNumber} atingiu 100%! Pode ser finalizada.`, 'info');
        }
    };

    const handleExportOrders = () => {
        const dataToExport = filteredOrders.map(o => ({
            'Numero OP': o.orderNumber,
            'Produto': o.productName,
            'Lote': o.batch || '-',
            'Quantidade': o.quantity,
            'Status': o.status,
            'Prioridade': o.priority,
            'Progresso': `${o.progress}%`,
            'Data Inicio': o.startDate,
            'Previsao Entrega': o.dueDate,
            'Operador': o.operator || 'Nao informado',
            'Unidade': productionUnits.find(u => u.id === o.unitId)?.name || o.unitId || '-'
        }));
        exportToCSV(dataToExport, 'Ordens_Producao_PCP');
        addToast("Relatório de Ordens de Produção exportado!", 'success');
    };

    const handlePrintFormulaSheet = (formula: ProductionFormula) => {
        const cost = calculateFormulaCost(formula);
        const html = `
            <div class="header">
                <div class="company-info">
                    <h1 style="color: #4f46e5; margin:0; font-size:24px;">INFRACORE PCP INDUSTRIAL</h1>
                    <p style="margin:2px 0; color:#64748b; font-size:12px;">Ficha Técnica de Traço e Especificação de Dosagem</p>
                </div>
                <div class="doc-info" style="text-align: right;">
                    <h2 style="margin:0; font-size:16px;">TRAÇO INDUSTRIAL</h2>
                    <p style="margin:2px 0; font-size:12px;">Emissão: ${new Date().toLocaleDateString('pt-BR')}</p>
                </div>
            </div>

            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 20px 0;">
                <p style="margin:0; font-size:16px; font-weight:bold; color:#1e293b;">NOME: ${formula.name.toUpperCase()}</p>
                <p style="margin:4px 0 0 0; font-size:12px; color:#64748b;">Categoria: <strong>${formula.category}</strong> | Tipo: <strong>${formula.type || 'Composição'}</strong> | Custo Estimado: <strong>${formatCurrency(cost)} / UN</strong></p>
            </div>

            <h3 style="font-size:12px; text-transform:uppercase; color:#475569; border-bottom:2px solid #e2e8f0; padding-bottom:6px;">Composição Nominal dos Insumos (Por Unidade)</h3>
            <table style="width:100%; border-collapse:collapse; margin-top:10px;">
                <thead>
                    <tr style="background:#f1f5f9; text-align:left; font-size:11px; text-transform:uppercase; color:#475569;">
                        <th style="padding:8px; border:1px solid #cbd5e1;">Insumo / Matéria-Prima</th>
                        <th style="padding:8px; border:1px solid #cbd5e1; text-align:center;">Dosagem Unitária</th>
                        <th style="padding:8px; border:1px solid #cbd5e1; text-align:center;">Unidade</th>
                        <th style="padding:8px; border:1px solid #cbd5e1; text-align:right;">Custo Aprox.</th>
                    </tr>
                </thead>
                <tbody>
                    ${formula.ingredients.map(ing => {
                        const itm = inventory.find(i => i.id === ing.productId);
                        const c = (itm?.costPrice ?? itm?.price ?? 0) * ing.qty;
                        return `
                            <tr style="font-size:12px; border-bottom:1px solid #e2e8f0;">
                                <td style="padding:8px; border:1px solid #cbd5e1;"><strong>${ing.name}</strong></td>
                                <td style="padding:8px; border:1px solid #cbd5e1; text-align:center;">${ing.qty}</td>
                                <td style="padding:8px; border:1px solid #cbd5e1; text-align:center;">${ing.unit}</td>
                                <td style="padding:8px; border:1px solid #cbd5e1; text-align:right;">${formatCurrency(c)}</td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>

            <div style="margin-top: 40px; display: grid; grid-template-columns: 1fr 1fr; gap: 40px; padding-top: 20px;">
                <div style="border-top: 1px solid #000; text-align:center; font-size:11px; padding-top:6px;">Engenheiro / Tecnologista Responsável</div>
                <div style="border-top: 1px solid #000; text-align:center; font-size:11px; padding-top:6px;">Operador da Usina / Balança</div>
            </div>
        `;
        printDocument(`Ficha_Traco_${formula.name.replace(/\s+/g, '_')}`, html);
    };

    const filteredOrders = useMemo(() => {
        return productionOrders.filter(o => {
            const matchesSearch = !orderSearch.trim() ||
                o.orderNumber.toLowerCase().includes(orderSearch.toLowerCase()) ||
                o.productName.toLowerCase().includes(orderSearch.toLowerCase()) ||
                (o.batch && o.batch.toLowerCase().includes(orderSearch.toLowerCase())) ||
                (o.operator && o.operator.toLowerCase().includes(orderSearch.toLowerCase()));

            const matchesStatus = orderStatusFilter === 'Todos' || o.status === orderStatusFilter;
            const matchesPriority = orderPriorityFilter === 'Todas' || o.priority === orderPriorityFilter;
            const matchesUnit = orderUnitFilter === 'Todas' || o.unitId === orderUnitFilter;

            return matchesSearch && matchesStatus && matchesPriority && matchesUnit;
        });
    }, [productionOrders, orderSearch, orderStatusFilter, orderPriorityFilter, orderUnitFilter]);

    const filteredFormulas = useMemo(() => {
        return formulas.filter(f => {
            const matchesSearch = !formulaSearch.trim() ||
                f.name.toLowerCase().includes(formulaSearch.toLowerCase()) ||
                f.ingredients.some(ing => ing.name.toLowerCase().includes(formulaSearch.toLowerCase()));

            const matchesCategory = formulaCategoryFilter === 'Todas' || f.category === formulaCategoryFilter;

            return matchesSearch && matchesCategory;
        });
    }, [formulas, formulaSearch, formulaCategoryFilter]);

    const formulaCategories = useMemo(() => {
        const cats = new Set<string>();
        formulas.forEach(f => { if (f.category) cats.add(f.category); });
        return ['Todas', ...Array.from(cats)];
    }, [formulas]);

    const chartData = useMemo(() => {
        const getDate = (dateStr: string) => {
            if (!dateStr) return new Date();
            if (dateStr.includes('/')) {
                const [d, m, y] = dateStr.split('/').map(Number);
                return new Date(y, m - 1, d);
            }
            return new Date(dateStr);
        };

        const last12Months = Array.from({ length: 12 }, (_, i) => {
            const d = new Date();
            d.setMonth(d.getMonth() - (11 - i));
            return {
                month: d.toLocaleString('pt-BR', { month: 'short' }).toUpperCase(),
                year: d.getFullYear(),
                monthIndex: d.getMonth(),
                fullDate: d
            };
        });

        return last12Months.map(time => {
            const volume = productionOrders
                .filter(o => {
                    const d = getDate(o.startDate);
                    return d.getMonth() === time.monthIndex && d.getFullYear() === time.year;
                })
                .reduce((acc, curr) => acc + curr.quantity, 0);

            return {
                name: `${time.month}/${time.year.toString().slice(2)}`,
                Produção: volume,
                Meta: 2000
            };
        });
    }, [productionOrders]);

    return (
        <div className="flex flex-col gap-6 animate-in fade-in duration-500 pb-10">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3 tracking-tight">
                        <div className="p-2.5 bg-indigo-600 rounded-2xl text-white shadow-xl shadow-indigo-600/20">
                            <Factory size={26} />
                        </div>
                        PCP & Chão de Fábrica
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-2 font-medium">
                        Planejamento, Controle da Produção, Dosagem de Traços e Operação de Usinas.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border dark:border-slate-700">
                        <button onClick={() => setActiveTab('monitor')} className={`px-4 py-2 text-[10px] font-black rounded-xl transition-all ${activeTab === 'monitor' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-400'}`}>MONITORAMENTO</button>
                        <button onClick={() => setActiveTab('orders')} className={`px-4 py-2 text-[10px] font-black rounded-xl transition-all ${activeTab === 'orders' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-400'}`}>ORDENS (O.P.)</button>
                        <button onClick={() => setActiveTab('formulas')} className={`px-4 py-2 text-[10px] font-black rounded-xl transition-all ${activeTab === 'formulas' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-400'}`}>TRAÇOS & DOSAGEM</button>
                        <button onClick={() => setActiveTab('lab')} className={`px-4 py-2 text-[10px] font-black rounded-xl transition-all ${activeTab === 'lab' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-400'}`}>LABORATÓRIO</button>
                    </div>

                    <button
                        onClick={() => {
                            setEditingUnit({ id: '', name: '', type: 'Britagem', status: 'Operando', capacity: '100 ton/h', currentLoad: 0, temp: 45, power: '120 kW' });
                            setIsUnitModalOpen(true);
                        }}
                        className="px-4 py-2.5 bg-slate-800 dark:bg-slate-700 text-white font-bold rounded-xl shadow hover:bg-slate-900 transition-all flex items-center gap-2 text-xs uppercase"
                    >
                        <Plus size={16} /> Nova Usina
                    </button>
                    <button
                        onClick={() => setIsOrderModalOpen(true)}
                        className="px-5 py-2.5 bg-indigo-600 text-white font-bold rounded-xl shadow-lg hover:bg-indigo-700 transition-all flex items-center gap-2 text-xs uppercase shadow-indigo-600/30"
                    >
                        <Plus size={16} /> Nova O.P.
                    </button>
                </div>
            </div>

            {/* TAB: MONITORAMENTO (CLEAN & DIRECT) */}
            {activeTab === 'monitor' && (
                <div className="space-y-6">
                    {/* Plant Status Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {productionUnits.map(unit => {
                            const activeOrder = productionOrders.find(o => o.unitId === unit.id && o.status === 'Em Produção');
                            return (
                                <div key={unit.id} className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 relative overflow-hidden group">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className={`p-3 rounded-xl ${unit.status === 'Operando' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'} shadow-sm`}>
                                            <Factory size={22} />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${unit.status === 'Operando' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                                                {unit.status.toUpperCase()}
                                            </span>
                                            <button
                                                onClick={() => { setEditingUnit(unit); setIsUnitModalOpen(true); }}
                                                className="p-1 text-slate-400 hover:text-indigo-600 transition-colors"
                                                title="Configurar Planta"
                                            >
                                                <Edit2 size={13} />
                                            </button>
                                        </div>
                                    </div>
                                    <h3 className="font-bold text-slate-800 dark:text-white uppercase text-sm mb-1">{unit.name}</h3>
                                    <p className="text-[10px] text-slate-400 font-medium">Tipo: <strong className="text-slate-600 dark:text-slate-300">{unit.type}</strong> • Cap: {unit.capacity}</p>

                                    {activeOrder ? (
                                        <div className="mt-4 p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl border border-indigo-100 dark:border-indigo-800">
                                            <div className="flex justify-between items-center mb-1.5">
                                                <span className="text-[9px] font-bold text-indigo-600 uppercase">OP: {activeOrder.orderNumber}</span>
                                                <span className="text-[10px] font-bold text-indigo-700">{activeOrder.progress}%</span>
                                            </div>
                                            <div className="h-1.5 w-full bg-indigo-200 dark:bg-indigo-900 rounded-full overflow-hidden">
                                                <div className="h-full bg-indigo-600 transition-all duration-500" style={{ width: `${activeOrder.progress}%` }}></div>
                                            </div>
                                            <p className="text-[10px] font-medium text-slate-600 dark:text-slate-400 mt-2 truncate">{activeOrder.productName}</p>
                                        </div>
                                    ) : (
                                        <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 flex items-center justify-center h-16 text-center">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase">Aguardando Carga</p>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-2 gap-4 mt-4 pt-3 border-t dark:border-slate-700 text-slate-500">
                                        <div className="flex items-center gap-1.5 text-xs font-semibold">
                                            <Thermometer size={14} className="text-orange-400" />
                                            <span>{unit.temp}°C</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-xs font-semibold">
                                            <Zap size={14} className="text-amber-400" />
                                            <span>{unit.power}</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Historical Production Chart (Clean Full Width) */}
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-slate-900 dark:text-white uppercase tracking-tight text-sm">
                                Volume de Produção Consolidado (Últimos 12 Meses)
                            </h3>
                            <div className="flex gap-4 text-[10px] font-bold uppercase">
                                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-indigo-600 rounded-full"></span> Realizado</span>
                                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-slate-300 dark:bg-slate-600 rounded-full"></span> Meta</span>
                            </div>
                        </div>
                        <div className="h-72 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.5} />
                                    <XAxis
                                        dataKey="name"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 700 }}
                                        dy={10}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 700 }}
                                    />
                                    <RechartsTooltip
                                        cursor={{ fill: '#F1F5F9', opacity: 0.5 }}
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Bar dataKey="Produção" fill="#6366F1" radius={[4, 4, 0, 0]} barSize={26} />
                                    <Bar dataKey="Meta" fill="#E2E8F0" radius={[4, 4, 0, 0]} barSize={26} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB: ORDENS DE PRODUÇÃO (O.P.) */}
            {activeTab === 'orders' && (
                <div className="space-y-6">
                    {/* Filters & Export Bar */}
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col md:flex-row gap-4 items-center justify-between">
                        <div className="relative w-full md:w-80">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input
                                type="text"
                                placeholder="Buscar OP, produto, lote ou operador..."
                                value={orderSearch}
                                onChange={e => setOrderSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>

                        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
                            <select
                                value={orderStatusFilter}
                                onChange={e => setOrderStatusFilter(e.target.value)}
                                className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                            >
                                <option value="Todos">Status: Todos</option>
                                <option value="Planejado">Planejado</option>
                                <option value="Em Produção">Em Produção</option>
                                <option value="Qualidade">Qualidade</option>
                                <option value="Pausado">Pausado</option>
                                <option value="Finalizado">Finalizado</option>
                                <option value="Cancelado">Cancelado</option>
                            </select>

                            <select
                                value={orderPriorityFilter}
                                onChange={e => setOrderPriorityFilter(e.target.value)}
                                className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                            >
                                <option value="Todas">Prioridade: Todas</option>
                                <option value="Alta">Alta</option>
                                <option value="Média">Média</option>
                                <option value="Baixa">Baixa</option>
                            </select>

                            <select
                                value={orderUnitFilter}
                                onChange={e => setOrderUnitFilter(e.target.value)}
                                className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                            >
                                <option value="Todas">Usinas: Todas</option>
                                {productionUnits.map(u => (
                                    <option key={u.id} value={u.id}>{u.name}</option>
                                ))}
                            </select>

                            <button
                                onClick={handleExportOrders}
                                className="px-3 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                            >
                                <Download size={14} /> Exportar CSV
                            </button>
                        </div>
                    </div>

                    {/* Orders Table */}
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 dark:bg-gray-800 text-[10px] font-black text-slate-400 uppercase border-b dark:border-gray-700">
                                    <tr>
                                        <th className="px-6 py-3.5">Status / OP</th>
                                        <th className="px-6 py-3.5">Produto / Lote</th>
                                        <th className="px-6 py-3.5">Prioridade / Prazos</th>
                                        <th className="px-6 py-3.5">Operador / Usina</th>
                                        <th className="px-6 py-3.5 text-center">Progresso</th>
                                        <th className="px-6 py-3.5 text-right">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y dark:divide-gray-700">
                                    {filteredOrders.map(o => (
                                        <tr
                                            key={o.id}
                                            className="hover:bg-slate-50 dark:hover:bg-indigo-900/10 transition-colors"
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                                                        o.status === 'Finalizado' ? 'bg-emerald-100 text-emerald-700' :
                                                        o.status === 'Em Produção' ? 'bg-indigo-100 text-indigo-700 animate-pulse' :
                                                        o.status === 'Qualidade' ? 'bg-amber-100 text-amber-700' :
                                                        o.status === 'Pausado' ? 'bg-orange-100 text-orange-700' :
                                                        o.status === 'Cancelado' ? 'bg-rose-100 text-rose-700' :
                                                        'bg-slate-100 text-slate-600'
                                                    }`}>
                                                        <Circle size={6} fill="currentColor" /> {o.status}
                                                    </span>
                                                    {o.status === 'Planejado' && checkFormulaStockShortage(o, formulas, inventory).hasShortage && (
                                                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-black uppercase bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                                                            Sem Estoque
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="font-mono text-xs text-indigo-600 dark:text-indigo-400 font-bold mt-1">#{o.orderNumber}</p>
                                            </td>

                                            <td className="px-6 py-4">
                                                <p className="font-bold text-slate-900 dark:text-white text-xs uppercase">{o.productName}</p>
                                                <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400">
                                                    <span>{o.quantity.toLocaleString()} UN</span>
                                                    <span>• Lote: {o.batch || '-'}</span>
                                                </div>
                                            </td>

                                            <td className="px-6 py-4">
                                                <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-bold uppercase mb-0.5 ${
                                                    o.priority === 'Alta' ? 'bg-rose-100 text-rose-700' :
                                                    o.priority === 'Média' ? 'bg-amber-100 text-amber-700' :
                                                    'bg-slate-100 text-slate-600'
                                                }`}>
                                                    {o.priority}
                                                </span>
                                                <p className="text-[10px] text-slate-400">Entrega: {o.dueDate || o.startDate}</p>
                                            </td>

                                            <td className="px-6 py-4">
                                                <p className="text-xs font-medium text-slate-700 dark:text-slate-300">{o.operator || 'Operador Padrão'}</p>
                                                <p className="text-[10px] text-slate-400">{productionUnits.find(u => u.id === o.unitId)?.name || 'Usina'}</p>
                                            </td>

                                            <td className="px-6 py-4 text-center">
                                                <div className="w-24 mx-auto bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full ${o.status === 'Finalizado' ? 'bg-emerald-500' : o.status === 'Pausado' ? 'bg-orange-400' : 'bg-indigo-600'}`}
                                                        style={{ width: `${o.progress}%` }}
                                                    ></div>
                                                </div>
                                                <span className="text-[10px] font-bold text-slate-400 mt-1 block">{o.progress}%</span>
                                            </td>

                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end items-center gap-1">
                                                    {o.status === 'Planejado' && (() => {
                                                        const shortage = checkFormulaStockShortage(o, formulas, inventory);
                                                        if (shortage.hasShortage) {
                                                            return (
                                                                <button
                                                                    onClick={() => handleStartOrder(o)}
                                                                    className="p-1.5 bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 border border-rose-300 dark:border-rose-800 rounded-lg hover:bg-rose-200 transition-colors"
                                                                    title={`Início Bloqueado: Insumos insuficientes (${shortage.shortages.map(s => s.ingredientName).join(', ')})`}
                                                                >
                                                                    <AlertTriangle size={14} />
                                                                </button>
                                                            );
                                                        }
                                                        return (
                                                            <button
                                                                onClick={() => handleStartOrder(o)}
                                                                className="p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors"
                                                                title="Iniciar Produção"
                                                            >
                                                                <Play size={14} />
                                                            </button>
                                                        );
                                                    })()}

                                                    {o.status === 'Em Produção' && (
                                                        <>
                                                            <button
                                                                onClick={() => handlePauseOrder(o)}
                                                                className="p-1.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
                                                                title="Pausar"
                                                            >
                                                                <Pause size={14} />
                                                            </button>
                                                            <button
                                                                onClick={() => { updateProductionOrder({ ...o, status: 'Qualidade', progress: 90 }); addToast(`OP #${o.orderNumber} em Qualidade!`, 'info'); }}
                                                                className="p-1.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600"
                                                                title="Enviar p/ Qualidade"
                                                            >
                                                                <FlaskConical size={14} />
                                                            </button>
                                                        </>
                                                    )}

                                                    {o.status === 'Pausado' && (
                                                        <button
                                                            onClick={() => handleResumeOrder(o)}
                                                            className="p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500"
                                                            title="Retomar"
                                                        >
                                                            <Play size={14} />
                                                        </button>
                                                    )}

                                                    {o.status === 'Qualidade' && (
                                                        <button
                                                            onClick={() => { completeProduction(o.id); addToast(`OP #${o.orderNumber} concluída!`, 'success'); }}
                                                            className="p-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500"
                                                            title="Concluir OP"
                                                        >
                                                            <CheckCircle size={14} />
                                                        </button>
                                                    )}

                                                    <button
                                                        onClick={() => { setEditingOrder(o); setIsEditOrderModalOpen(true); }}
                                                        className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg"
                                                        title="Editar"
                                                    >
                                                        <Edit2 size={14} />
                                                    </button>

                                                    <button
                                                        onClick={() => {
                                                            const formula = formulas.find(f => f.id === o.formulaId);
                                                            const printWindow = window.open('', '_blank');
                                                            if (printWindow) {
                                                                printWindow.document.write(`
                                                                    <html><head><title>OP #${o.orderNumber}</title><style>body{font-family:sans-serif;padding:30px;}table{width:100%;border-collapse:collapse;}th,td{border:1px solid #ddd;padding:8px;text-align:left;}</style></head><body>
                                                                    <h2>Ordem de Produção #${o.orderNumber}</h2>
                                                                    <p>Produto: <strong>${o.productName}</strong> | Quantidade: <strong>${o.quantity} UN</strong> | Lote: <strong>${o.batch || '-'}</strong></p>
                                                                    <p>Data: ${o.startDate} | Entrega: ${o.dueDate || o.startDate} | Status: ${o.status}</p>
                                                                    <h3>Insumos do Traço</h3>
                                                                    <table><thead><tr><th>Insumo</th><th>Qtd/UN</th><th>Total Necessário</th></tr></thead><tbody>
                                                                    ${(formula?.ingredients || []).map(i => `<tr><td>${i.name}</td><td>${i.qty} ${i.unit}</td><td><strong>${(i.qty * o.quantity).toFixed(2)} ${i.unit}</strong></td></tr>`).join('')}
                                                                    </tbody></table>
                                                                    <script>window.print();</script></body></html>
                                                                `);
                                                                printWindow.document.close();
                                                            }
                                                        }}
                                                        className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg"
                                                        title="Imprimir"
                                                    >
                                                        <Printer size={14} />
                                                    </button>

                                                    <button
                                                        onClick={() => { deleteProductionOrder(o.id); addToast(`OP #${o.orderNumber} removida.`, 'warning'); }}
                                                        className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg"
                                                        title="Excluir"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredOrders.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-10 text-center text-slate-400 italic text-xs">
                                                Nenhuma ordem de produção encontrada.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB: TRAÇOS & DOSAGEM */}
            {activeTab === 'formulas' && (
                <div className="space-y-6">
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col md:flex-row gap-4 items-center justify-between">
                        <div className="relative w-full md:w-80">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input
                                type="text"
                                placeholder="Buscar traço por nome ou insumo..."
                                value={formulaSearch}
                                onChange={e => setFormulaSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>

                        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
                            <select
                                value={formulaCategoryFilter}
                                onChange={e => setFormulaCategoryFilter(e.target.value)}
                                className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                            >
                                {formulaCategories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>

                            <button
                                onClick={() => {
                                    setEditingFormula(null);
                                    setFormulaForm({ type: 'Composicao', ingredients: [{ productId: '', name: '', qty: 0, unit: 'kg' }], outputs: [{ productId: '', name: '', percentage: 0 }] });
                                    setIsFormulaModalOpen(true);
                                }}
                                className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl text-xs uppercase flex items-center gap-1.5 shadow"
                            >
                                <Plus size={14} /> Novo Traço
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredFormulas.map(formula => {
                            const unitCost = calculateFormulaCost(formula);

                            return (
                                <div key={formula.id} className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col justify-between">
                                    <div>
                                        <div className="flex justify-between items-start mb-3">
                                            <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-slate-500 uppercase">
                                                {formula.category}
                                            </span>
                                            <span className="text-xs font-bold text-indigo-600">
                                                {formatCurrency(unitCost)} <span className="text-[10px] text-slate-400 font-normal">/ UN</span>
                                            </span>
                                        </div>

                                        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4 uppercase">{formula.name}</h3>

                                        <div className="space-y-2 mb-6">
                                            {formula.ingredients.map((ing, k) => (
                                                <div key={k} className="flex justify-between items-center text-xs border-b border-slate-50 dark:border-slate-700/60 pb-1.5">
                                                    <span className="text-slate-600 dark:text-slate-300">{ing.name}</span>
                                                    <span className="font-bold font-mono text-slate-800 dark:text-white">{ing.qty} {ing.unit}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t dark:border-slate-700 flex gap-2">
                                        <button
                                            onClick={() => { setEditingFormula(formula); setFormulaForm(formula); setIsFormulaModalOpen(true); }}
                                            className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                                        >
                                            <Edit2 size={13} /> Editar Traço
                                        </button>
                                        <button
                                            onClick={() => handleDuplicateFormula(formula)}
                                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                            title="Clonar"
                                        >
                                            <Copy size={14} />
                                        </button>
                                        <button
                                            onClick={() => handlePrintFormulaSheet(formula)}
                                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                            title="Ficha Técnica"
                                        >
                                            <Printer size={14} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* TAB: LABORATÓRIO */}
            {activeTab === 'lab' && (
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white uppercase tracking-tight">Controle Laboratorial</h3>
                            <p className="text-xs text-slate-400">Ensaios de resistência e testes técnicos das bateladas produzidas.</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {productionOrders.flatMap(o => (o.qualityTests || []).map(t => ({ ...t, orderNum: o.orderNumber, prodName: o.productName }))).map((test, i) => (
                            <div key={i} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-xs text-slate-800 dark:text-white uppercase">{test.type}</span>
                                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${test.status === 'Aprovado' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                            {test.status}
                                        </span>
                                    </div>
                                    <p className="text-[10px] text-slate-400 mt-0.5">{test.prodName} (#{test.orderNum}) • Técnico: {test.tester || 'Lab'}</p>
                                </div>
                                <div className="text-right">
                                    <span className="text-[10px] text-slate-400 block uppercase">Resultado</span>
                                    <span className="text-sm font-bold text-indigo-600">{test.result}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* STANDARDIZED MODAL: NOVA ORDEM DE PRODUÇÃO */}
            {isOrderModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-xl border dark:border-slate-700 animate-in zoom-in duration-200 overflow-hidden my-8">
                        <div className="p-6 border-b dark:border-slate-700 flex justify-between items-center">
                            <div>
                                <h3 className="font-bold text-lg text-slate-900 dark:text-white uppercase">Emitir Ordem de Produção (O.P.)</h3>
                                <p className="text-xs text-slate-500">Programação de batelada para usina fabril.</p>
                            </div>
                            <button onClick={() => setIsOrderModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSaveOrder} className="p-6 space-y-4">
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Unidade Fabril / Usina</label>
                                <select className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs font-bold" value={newOrder.unitId} onChange={e => setNewOrder({ ...newOrder, unitId: e.target.value })} required>
                                    {productionUnits.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Traço / Processo Produtivo</label>
                                <select className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs font-bold" value={newOrder.formulaId || ''} onChange={e => setNewOrder({ ...newOrder, formulaId: e.target.value })} required>
                                    <option value="">Selecione o traço...</option>
                                    {formulas.map(f => <option key={f.id} value={f.id}>{f.name} ({f.category})</option>)}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Quantidade Total (UN)</label>
                                    <input type="number" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs font-bold" value={newOrder.quantity || ''} onChange={e => setNewOrder({ ...newOrder, quantity: Number(e.target.value) })} required min="1" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Lote (Batch)</label>
                                    <input type="text" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs font-bold" value={newOrder.batch} onChange={e => setNewOrder({ ...newOrder, batch: e.target.value.toUpperCase() })} required />
                                </div>
                            </div>

                            {/* Alerta prévio de estoque para a fórmula selecionada */}
                            {newOrder.formulaId && (() => {
                                const shortageCheck = checkFormulaStockShortage({ formulaId: newOrder.formulaId, quantity: newOrder.quantity }, formulas, inventory);
                                if (shortageCheck.hasShortage) {
                                    return (
                                        <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-800 dark:text-amber-300">
                                            <div className="flex items-center gap-1.5 font-bold mb-1">
                                                <AlertTriangle size={14} className="text-amber-600 shrink-0" />
                                                <span>Atenção: Saldo insuficiente para iniciar imediatamente</span>
                                            </div>
                                            <div className="text-[10px] space-y-0.5 pl-5 opacity-90">
                                                {shortageCheck.shortages.map((s, idx) => (
                                                    <p key={idx}>
                                                        • {s.ingredientName}: necessário {s.requiredQty.toLocaleString('pt-BR')} {s.unit} (disponível: {s.availableQty.toLocaleString('pt-BR')} {s.unit})
                                                    </p>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                }
                                return null;
                            })()}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Operador Responsável</label>
                                    <input type="text" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs font-bold" placeholder="Ex: Carlos Santos" value={newOrder.operator || ''} onChange={e => setNewOrder({ ...newOrder, operator: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Prioridade</label>
                                    <select className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs font-bold" value={newOrder.priority} onChange={e => setNewOrder({ ...newOrder, priority: e.target.value as any })}>
                                        <option value="Baixa">Baixa</option>
                                        <option value="Média">Média</option>
                                        <option value="Alta">Alta</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Previsão de Entrega</label>
                                <input
                                    type="date"
                                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs font-bold"
                                    value={newOrder.dueDate || ''}
                                    onChange={e => setNewOrder({ ...newOrder, dueDate: e.target.value })}
                                />
                            </div>
                            <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex gap-3">
                                <button type="button" onClick={() => setIsOrderModalOpen(false)} className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold rounded-xl text-xs uppercase">Cancelar</button>
                                <button type="submit" className="flex-[2] py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs uppercase tracking-wider shadow">Confirmar e Emitir</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* STANDARDIZED MODAL: EDITAR O.P. */}
            {isEditOrderModalOpen && editingOrder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-xl border dark:border-slate-700 animate-in zoom-in duration-200 overflow-hidden my-8">
                        <div className="p-6 border-b dark:border-slate-700 flex justify-between items-center">
                            <div>
                                <h3 className="font-bold text-lg text-slate-900 dark:text-white uppercase">Editar Ordem #{editingOrder.orderNumber}</h3>
                                <p className="text-xs text-slate-500">Alteração de parâmetros operacionais.</p>
                            </div>
                            <button onClick={() => { setIsEditOrderModalOpen(false); setEditingOrder(null); }} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleUpdateExistingOrder} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Status</label>
                                    <select
                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs font-bold"
                                        value={editingOrder.status}
                                        onChange={e => setEditingOrder({ ...editingOrder, status: e.target.value as any })}
                                    >
                                        <option value="Planejado">Planejado</option>
                                        <option value="Em Produção">Em Produção</option>
                                        <option value="Qualidade">Qualidade</option>
                                        <option value="Pausado">Pausado</option>
                                        <option value="Finalizado">Finalizado</option>
                                        <option value="Cancelado">Cancelado</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Prioridade</label>
                                    <select
                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs font-bold"
                                        value={editingOrder.priority}
                                        onChange={e => setEditingOrder({ ...editingOrder, priority: e.target.value as any })}
                                    >
                                        <option value="Baixa">Baixa</option>
                                        <option value="Média">Média</option>
                                        <option value="Alta">Alta</option>
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Quantidade</label>
                                    <input
                                        type="number"
                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs font-bold"
                                        value={editingOrder.quantity}
                                        onChange={e => setEditingOrder({ ...editingOrder, quantity: Number(e.target.value) })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Progresso Físico (%)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs font-bold"
                                        value={editingOrder.progress}
                                        onChange={e => setEditingOrder({ ...editingOrder, progress: Number(e.target.value) })}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Operador</label>
                                    <input
                                        type="text"
                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs font-bold"
                                        value={editingOrder.operator || ''}
                                        onChange={e => setEditingOrder({ ...editingOrder, operator: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Data Limite</label>
                                    <input
                                        type="date"
                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs font-bold"
                                        value={editingOrder.dueDate || ''}
                                        onChange={e => setEditingOrder({ ...editingOrder, dueDate: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex gap-3">
                                <button type="button" onClick={() => { setIsEditOrderModalOpen(false); setEditingOrder(null); }} className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold rounded-xl text-xs uppercase">Cancelar</button>
                                <button type="submit" className="flex-[2] py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs uppercase tracking-wider shadow">Salvar Alterações</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* STANDARDIZED MODAL: TRAÇO / FÓRMULA */}
            {isFormulaModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-xl border dark:border-slate-700 animate-in zoom-in duration-200 overflow-hidden my-8">
                        <div className="p-6 border-b dark:border-slate-700 flex justify-between items-center">
                            <div>
                                <h3 className="font-bold text-lg text-slate-900 dark:text-white uppercase">{editingFormula ? 'Editar Traço' : 'Novo Traço / Fórmula'}</h3>
                                <p className="text-xs text-slate-500">Especificação técnica de componentes.</p>
                            </div>
                            <button onClick={() => setIsFormulaModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSaveFormula} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Nome do Traço</label>
                                    <input type="text" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs font-bold" value={formulaForm.name || ''} onChange={e => setFormulaForm({ ...formulaForm, name: e.target.value })} required />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Categoria</label>
                                    <input type="text" placeholder="Ex: Concreto, Britagem..." className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs font-bold" value={formulaForm.category || ''} onChange={e => setFormulaForm({ ...formulaForm, category: e.target.value })} required />
                                </div>
                            </div>

                            <div className="pt-2">
                                <div className="flex justify-between items-center mb-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase">Insumos da Mistura</label>
                                    <button type="button" onClick={addIngredient} className="text-indigo-600 text-xs font-bold uppercase flex items-center gap-1">+ Insumo</button>
                                </div>
                                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                                    {formulaForm.ingredients?.map((ing, idx) => (
                                        <div key={idx} className="flex gap-2 items-center">
                                            <select
                                                className="flex-[2] bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs font-bold"
                                                value={ing.productId}
                                                onChange={e => {
                                                    const newIngs = [...(formulaForm.ingredients || [])];
                                                    const selected = inventory.find(i => i.id === e.target.value);
                                                    newIngs[idx] = { ...ing, productId: e.target.value, name: selected?.name || '', unit: selected?.unit || 'kg' };
                                                    setFormulaForm({ ...formulaForm, ingredients: newIngs });
                                                }}
                                                required
                                            >
                                                <option value="">Selecione insumo...</option>
                                                {inventory.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                                            </select>
                                            <input
                                                type="number"
                                                step="0.01"
                                                placeholder="Qtd"
                                                className="w-20 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs font-bold text-center"
                                                value={ing.qty}
                                                onChange={e => {
                                                    const newIngs = [...(formulaForm.ingredients || [])];
                                                    newIngs[idx] = { ...ing, qty: Number(e.target.value) };
                                                    setFormulaForm({ ...formulaForm, ingredients: newIngs });
                                                }}
                                                required
                                            />
                                            <span className="text-[10px] text-slate-400 w-6">{ing.unit}</span>
                                            <button type="button" onClick={() => setFormulaForm({ ...formulaForm, ingredients: formulaForm.ingredients?.filter((_, i) => i !== idx) })} className="text-slate-300 hover:text-rose-500">
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex gap-3">
                                <button type="button" onClick={() => setIsFormulaModalOpen(false)} className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold rounded-xl text-xs uppercase">Cancelar</button>
                                <button type="submit" className="flex-[2] py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs uppercase tracking-wider shadow">Salvar Traço</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* STANDARDIZED MODAL: UNIDADE / USINA */}
            {isUnitModalOpen && editingUnit && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-xl border dark:border-slate-700 animate-in zoom-in duration-200 overflow-hidden my-8">
                        <div className="p-6 border-b dark:border-slate-700 flex justify-between items-center">
                            <div>
                                <h3 className="font-bold text-lg text-slate-900 dark:text-white uppercase">Configurar Planta / Usina</h3>
                                <p className="text-xs text-slate-500">Parâmetros operacionais e capacidade nominal.</p>
                            </div>
                            <button onClick={() => setIsUnitModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSaveUnit} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Nome da Usina</label>
                                    <input type="text" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs font-bold" value={editingUnit.name} onChange={e => setEditingUnit({ ...editingUnit, name: e.target.value })} required />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Tipo</label>
                                    <input type="text" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs font-bold" value={editingUnit.type} onChange={e => setEditingUnit({ ...editingUnit, type: e.target.value })} required />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Capacidade</label>
                                    <input type="text" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs font-bold" value={editingUnit.capacity} onChange={e => setEditingUnit({ ...editingUnit, capacity: e.target.value })} required />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Status</label>
                                    <select className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs font-bold" value={editingUnit.status} onChange={e => setEditingUnit({ ...editingUnit, status: e.target.value as any })}>
                                        <option value="Operando">Operando</option>
                                        <option value="Manutenção">Manutenção</option>
                                        <option value="Parado">Parado</option>
                                    </select>
                                </div>
                            </div>
                            <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex gap-3">
                                <button type="button" onClick={() => setIsUnitModalOpen(false)} className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold rounded-xl text-xs uppercase">Cancelar</button>
                                <button type="submit" className="flex-[2] py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs uppercase tracking-wider shadow">Salvar Planta</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Production;