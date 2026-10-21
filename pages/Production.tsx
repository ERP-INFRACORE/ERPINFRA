import React, { useState, useMemo } from 'react';
import {
    Factory,
    ClipboardList,
    CheckCircle,
    AlertTriangle,
    Play,
    Pause,
    RotateCcw,
    Plus,
    Filter,
    X,
    Save,
    MapPin,
    Activity,
    Thermometer,
    Zap,
    ChevronRight,
    Cpu,
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
    Calculator,
    Copy,
    ArrowRight,
    ShieldCheck,
    FileText,
    AlertCircle,
    RefreshCw,
    Sliders,
    TrendingUp,
    CheckSquare
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { ProductionOrder, InventoryItem, ProductionFormula, QualityTest, ProductionUnit } from '../types';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { exportToCSV, printDocument } from '../utils/exportUtils';

const Production = () => {
    const {
        inventory, productionOrders, formulas, productionUnits,
        addProductionOrder, updateProductionOrder, deleteProductionOrder,
        startProduction, completeProduction, addQualityTest,
        addProductionUnit, updateProductionUnit, deleteProductionUnit,
        addFormula, updateFormula, deleteFormula
    } = useApp();
    const { addToast } = useToast();
    const [activeTab, setActiveTab] = useState<'monitor' | 'orders' | 'formulas' | 'lab'>('monitor');

    const [selectedOrder, setSelectedOrder] = useState<ProductionOrder | null>(null);
    const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
    const [isEditOrderModalOpen, setIsEditOrderModalOpen] = useState(false);
    const [isTestModalOpen, setIsTestModalOpen] = useState(false);
    const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);
    const [isFormulaModalOpen, setIsFormulaModalOpen] = useState(false);
    const [isCalculatorModalOpen, setIsCalculatorModalOpen] = useState(false);

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

    // Batch Calculator State (Simulação de Dosagem / Traço)
    const [calcFormulaId, setCalcFormulaId] = useState<string>('');
    const [calcBatchVolume, setCalcBatchVolume] = useState<number>(8); // e.g. 8m³ ou 8 un
    const [calcMoistureCorrection, setCalcMoistureCorrection] = useState<number>(3); // 3% umidade da areia

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

    // Format currency helper
    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
    };

    // Calculate theoretical cost of a formula based on inventory prices
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

    const handleUpdateExistingOrder = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingOrder) return;
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

    // Duplicate formula
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

    // Quick status handlers for Production Orders
    const handlePauseOrder = (order: ProductionOrder) => {
        updateProductionOrder({ ...order, status: 'Pausado' });
        addToast(`O.P. #${order.orderNumber} pausada.`, 'warning');
    };

    const handleResumeOrder = (order: ProductionOrder) => {
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

    // Export Orders to CSV
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

    // Print Tech Sheet for Formula
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

    // Filtered orders
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

    // Filtered formulas
    const filteredFormulas = useMemo(() => {
        return formulas.filter(f => {
            const matchesSearch = !formulaSearch.trim() ||
                f.name.toLowerCase().includes(formulaSearch.toLowerCase()) ||
                f.ingredients.some(ing => ing.name.toLowerCase().includes(formulaSearch.toLowerCase()));

            const matchesCategory = formulaCategoryFilter === 'Todas' || f.category === formulaCategoryFilter;

            return matchesSearch && matchesCategory;
        });
    }, [formulas, formulaSearch, formulaCategoryFilter]);

    // Categories list for formula filter
    const formulaCategories = useMemo(() => {
        const cats = new Set<string>();
        formulas.forEach(f => { if (f.category) cats.add(f.category); });
        return ['Todas', ...Array.from(cats)];
    }, [formulas]);

    const productionStats = useMemo(() => {
        const getDate = (dateStr: string) => {
            if (!dateStr) return new Date();
            if (dateStr.includes('/')) {
                const [d, m, y] = dateStr.split('/').map(Number);
                return new Date(y, m - 1, d);
            }
            return new Date(dateStr);
        };

        const allTests = productionOrders.flatMap(o => o.qualityTests || []);
        const totalTests = allTests.length;
        const approvedTests = allTests.filter(t => t.status === 'Aprovado').length;
        const complianceRate = totalTests > 0 ? (approvedTests / totalTests) * 100 : 100;

        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        const approvalsMonth = allTests.filter(t => {
            if (!t.testedAt) return false;
            const d = getDate(t.testedAt);
            return t.status === 'Aprovado' && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        }).length;

        const totalUnits = productionUnits.length;
        const operatingUnits = productionUnits.filter(u => u.status === 'Operando');
        const availRate = totalUnits > 0 ? operatingUnits.length / totalUnits : 0;

        const avgLoad = operatingUnits.length > 0
            ? operatingUnits.reduce((acc, u) => acc + u.currentLoad, 0) / operatingUnits.length
            : 0;
        const perfRate = avgLoad / 100;
        const qualityRate = complianceRate / 100;
        const oee = availRate * perfRate * qualityRate * 100;

        // Order breakdown
        const totalOrders = productionOrders.length;
        const inProductionCount = productionOrders.filter(o => o.status === 'Em Produção').length;
        const inQualityCount = productionOrders.filter(o => o.status === 'Qualidade').length;
        const completedCount = productionOrders.filter(o => o.status === 'Finalizado').length;
        const pausedCount = productionOrders.filter(o => o.status === 'Pausado').length;
        const totalVolume = productionOrders.reduce((sum, o) => sum + (o.quantity || 0), 0);

        return {
            complianceRate,
            approvalsMonth,
            oee,
            potential: (100 - oee) * 0.1,
            totalOrders,
            inProductionCount,
            inQualityCount,
            completedCount,
            pausedCount,
            totalVolume
        };
    }, [productionOrders, productionUnits]);

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
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-2 font-medium italic underline underline-offset-4 decoration-indigo-500/30">
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
                            if (formulas.length > 0) setCalcFormulaId(formulas[0].id);
                            setIsCalculatorModalOpen(true);
                        }}
                        className="px-4 py-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 font-black rounded-2xl hover:bg-indigo-100 transition-all flex items-center gap-2 text-xs uppercase tracking-wider shadow-sm"
                        title="Simular Dosagem e Batelada"
                    >
                        <Calculator size={18} /> Calculadora de Traço
                    </button>

                    <button
                        onClick={() => {
                            setEditingUnit({ id: '', name: '', type: 'Britagem', status: 'Operando', capacity: '100 ton/h', currentLoad: 0, temp: 45, power: '120 kW' });
                            setIsUnitModalOpen(true);
                        }}
                        className="px-4 py-3 bg-slate-800 dark:bg-slate-700 text-white font-black rounded-2xl shadow-lg hover:bg-slate-900 transition-all flex items-center gap-2 text-xs uppercase tracking-widest"
                    >
                        <Plus size={18} /> Nova Usina
                    </button>
                    <button
                        onClick={() => setIsOrderModalOpen(true)}
                        className="px-5 py-3 bg-indigo-600 text-white font-black rounded-2xl shadow-xl hover:bg-indigo-700 transition-all flex items-center gap-2 text-xs uppercase tracking-widest shadow-indigo-600/30"
                    >
                        <Plus size={18} /> Nova O.P.
                    </button>
                </div>
            </div>

            {/* TAB: MONITORAMENTO */}
            {activeTab === 'monitor' && (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {productionUnits.map(unit => {
                            const activeOrder = productionOrders.find(o => o.unitId === unit.id && o.status === 'Em Produção');
                            return (
                                <div key={unit.id} className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 relative overflow-hidden group">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className={`p-3 rounded-2xl ${unit.status === 'Operando' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'} shadow-sm`}>
                                            <Factory size={24} />
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${unit.status === 'Operando' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                                                {unit.status.toUpperCase()}
                                            </span>
                                            <button
                                                onClick={() => { setEditingUnit(unit); setIsUnitModalOpen(true); }}
                                                className="p-1.5 text-slate-400 hover:text-indigo-600 transition-colors bg-slate-50 dark:bg-slate-900 rounded-lg opacity-0 group-hover:opacity-100"
                                            >
                                                <Edit2 size={12} />
                                            </button>
                                        </div>
                                    </div>
                                    <h3 className="font-black text-slate-800 dark:text-white mb-1 uppercase text-sm">{unit.name}</h3>

                                    {activeOrder ? (
                                        <div className="mt-4 p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl border border-indigo-100 dark:border-indigo-800">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">Ativo: {activeOrder.orderNumber}</span>
                                                <span className="text-[10px] font-black text-indigo-700">{activeOrder.progress}%</span>
                                            </div>
                                            <div className="h-1.5 w-full bg-indigo-200 dark:bg-indigo-900 rounded-full overflow-hidden">
                                                <div className="h-full bg-indigo-600 transition-all duration-1000" style={{ width: `${activeOrder.progress}%` }}></div>
                                            </div>
                                            <p className="text-[10px] font-bold text-slate-600 dark:text-slate-400 mt-2 truncate">{activeOrder.productName}</p>
                                        </div>
                                    ) : (
                                        <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 flex items-center justify-center h-20 text-center">
                                            <p className="text-[10px] font-black text-slate-400 uppercase">Aguardando Carga</p>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t dark:border-slate-700">
                                        <div className="flex items-center gap-2">
                                            <Thermometer size={12} className="text-orange-400" />
                                            <span className="text-[10px] font-black">{unit.temp}°C</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Zap size={12} className="text-amber-400" />
                                            <span className="text-[10px] font-black">{unit.power}</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700">
                            <div className="flex justify-between items-center mb-8">
                                <div className="flex items-center gap-3">
                                    <Activity className="text-indigo-600" />
                                    <h3 className="font-black text-lg text-slate-900 dark:text-white">Sensores Industriais</h3>
                                </div>
                                <div className="flex gap-2">
                                    <span className="flex items-center gap-1.5 text-[10px] font-black text-emerald-500 uppercase"><Circle size={8} fill="currentColor" /> Sistemas OK</span>
                                </div>
                            </div>
                            <div className="space-y-4">
                                {productionUnits.map((u, i) => (
                                    <div key={i} className="flex items-center gap-6 p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/50 hover:shadow-md transition-all border border-transparent hover:border-indigo-100">
                                        <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-xl shadow-sm flex items-center justify-center font-black text-indigo-600 border border-slate-100 dark:border-slate-700">{i + 1}</div>
                                        <div className="flex-1">
                                            <p className="font-black text-slate-800 dark:text-white uppercase text-[10px] tracking-tight">{u.name}</p>
                                            <div className="flex gap-3 mt-1">
                                                <span className="text-[9px] font-bold text-slate-400 uppercase">TIPO: <strong className="text-slate-600 dark:text-slate-300">{u.type}</strong></span>
                                                <span className="text-[9px] font-bold text-slate-400 uppercase">CAP: <strong className="text-slate-600 dark:text-slate-300">{u.capacity}</strong></span>
                                            </div>
                                        </div>
                                        <div className={`px-3 py-1 rounded-lg text-[9px] font-black ${u.currentLoad > 80 ? 'bg-orange-100 text-orange-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                            {u.currentLoad > 80 ? 'CARGA ALTA' : 'CARGA NOMINAL'}
                                        </div>
                                        <button onClick={() => { setEditingUnit(u); setIsUnitModalOpen(true); }} className="text-slate-300 hover:text-indigo-500 transition-colors"><Edit2 size={16} /></button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-indigo-900 to-slate-900 p-8 rounded-3xl shadow-2xl text-white relative overflow-hidden flex flex-col justify-between border border-indigo-500/30">
                            <div className="absolute top-0 right-0 p-8 opacity-10"><Cpu size={120} /></div>
                            <div>
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-500/20 rounded-full border border-indigo-500/30 mb-6">
                                    <Activity size={12} className="text-indigo-400 animate-pulse" />
                                    <span className="text-[9px] font-black tracking-widest uppercase">Otimização AI Ativa</span>
                                </div>
                                <h3 className="text-2xl font-black mb-6 leading-tight uppercase tracking-tight">Cálculo de Eficiência</h3>
                                <div className="space-y-4 mb-8 text-indigo-100/70">
                                    <p className="text-xs font-medium leading-relaxed italic border-l-2 border-indigo-500 pl-4 bg-indigo-500/5 py-2">
                                        Sugestão: Aumentar o giro da Usina de Concreto em 5% para compensar a viscosidade do agregado úmido detectado.
                                    </p>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-3 bg-white/5 rounded-2xl">
                                            <p className="text-[8px] font-black text-indigo-400 uppercase">OEE Atual</p>
                                            <p className="text-lg font-black text-white">{productionStats.oee.toFixed(1)}%</p>
                                        </div>
                                        <div className="p-3 bg-white/5 rounded-2xl">
                                            <p className="text-[8px] font-black text-indigo-400 uppercase">Potencial</p>
                                            <p className="text-lg font-black text-emerald-400">+{productionStats.potential.toFixed(1)}%</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => addToast("Otimização aplicada! Parâmetros da planta ajustados para máxima performance.", 'success')}
                                className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-2xl shadow-xl transition-all uppercase tracking-widest text-[10px] border border-indigo-400/50"
                            >
                                Aplicar Otimização
                            </button>
                        </div>
                    </div>

                    {/* Historical Chart */}
                    <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-black text-lg text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-3">
                                <Activity className="text-emerald-500" />
                                Volume de Produção (12 Meses)
                            </h3>
                            <div className="flex gap-4 text-[10px] font-bold uppercase">
                                <span className="flex items-center gap-2"><span className="w-3 h-3 bg-indigo-500 rounded-full"></span> Realizado</span>
                                <span className="flex items-center gap-2"><span className="w-3 h-3 bg-slate-300 dark:bg-slate-600 rounded-full"></span> Meta</span>
                            </div>
                        </div>
                        <div className="h-80 w-full">
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
                                    <Bar dataKey="Produção" fill="#6366F1" radius={[4, 4, 0, 0]} barSize={30} />
                                    <Bar dataKey="Meta" fill="#E2E8F0" radius={[4, 4, 0, 0]} barSize={30} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </>
            )}

            {/* TAB: ORDENS DE PRODUÇÃO (O.P.) */}
            {activeTab === 'orders' && (
                <div className="space-y-6">
                    {/* Orders KPI Quick Strip */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Total de Ordens</p>
                            <p className="text-2xl font-black text-slate-800 dark:text-white mt-1">{productionStats.totalOrders}</p>
                            <span className="text-[10px] text-slate-400 font-bold">{productionStats.totalVolume.toLocaleString()} un programadas</span>
                        </div>
                        <div className="bg-indigo-50 dark:bg-indigo-900/20 p-5 rounded-2xl border border-indigo-100 dark:border-indigo-800/40">
                            <p className="text-[10px] font-black uppercase text-indigo-500 tracking-wider flex items-center gap-1.5">
                                <Play size={12} className="text-indigo-600 animate-pulse" /> Em Produção
                            </p>
                            <p className="text-2xl font-black text-indigo-700 dark:text-indigo-300 mt-1">{productionStats.inProductionCount}</p>
                            <span className="text-[10px] text-indigo-500/80 font-bold">Nas usinas</span>
                        </div>
                        <div className="bg-amber-50 dark:bg-amber-900/20 p-5 rounded-2xl border border-amber-100 dark:border-amber-800/40">
                            <p className="text-[10px] font-black uppercase text-amber-500 tracking-wider flex items-center gap-1.5">
                                <FlaskConical size={12} /> Qualidade
                            </p>
                            <p className="text-2xl font-black text-amber-700 dark:text-amber-300 mt-1">{productionStats.inQualityCount}</p>
                            <span className="text-[10px] text-amber-500/80 font-bold">Em quarentena</span>
                        </div>
                        <div className="bg-emerald-50 dark:bg-emerald-900/20 p-5 rounded-2xl border border-emerald-100 dark:border-emerald-800/40">
                            <p className="text-[10px] font-black uppercase text-emerald-500 tracking-wider flex items-center gap-1.5">
                                <CheckCircle size={12} /> Finalizadas
                            </p>
                            <p className="text-2xl font-black text-emerald-700 dark:text-emerald-300 mt-1">{productionStats.completedCount}</p>
                            <span className="text-[10px] text-emerald-500/80 font-bold">Prontas no estoque</span>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-900/40 p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
                            <p className="text-[10px] font-black uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
                                <Pause size={12} /> Pausadas
                            </p>
                            <p className="text-2xl font-black text-slate-700 dark:text-slate-300 mt-1">{productionStats.pausedCount}</p>
                            <span className="text-[10px] text-slate-400 font-bold">Interrompidas</span>
                        </div>
                    </div>

                    {/* Filter and Action Bar */}
                    <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col md:flex-row gap-4 items-center justify-between">
                        <div className="relative w-full md:w-80">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input
                                type="text"
                                placeholder="Buscar OP, produto, lote ou operador..."
                                value={orderSearch}
                                onChange={e => setOrderSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>

                        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-bold">
                                <Filter size={14} /> Status:
                            </div>
                            <select
                                value={orderStatusFilter}
                                onChange={e => setOrderStatusFilter(e.target.value)}
                                className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                            >
                                <option value="Todos">Todos os Status</option>
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
                                <option value="Todas">Prioridade (Todas)</option>
                                <option value="Alta">Alta</option>
                                <option value="Média">Média</option>
                                <option value="Baixa">Baixa</option>
                            </select>

                            <select
                                value={orderUnitFilter}
                                onChange={e => setOrderUnitFilter(e.target.value)}
                                className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                            >
                                <option value="Todas">Usinas (Todas)</option>
                                {productionUnits.map(u => (
                                    <option key={u.id} value={u.id}>{u.name}</option>
                                ))}
                            </select>

                            <button
                                onClick={handleExportOrders}
                                className="px-3 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                                title="Exportar CSV"
                            >
                                <Download size={14} /> CSV
                            </button>
                        </div>
                    </div>

                    {/* Orders Table */}
                    <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
                        <div className="p-6 border-b dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                            <div className="flex items-center gap-3">
                                <ClipboardList className="text-indigo-600" />
                                <h3 className="font-black text-lg text-slate-900 dark:text-white uppercase tracking-tighter">
                                    Ordens de Produção ({filteredOrders.length})
                                </h3>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 dark:bg-gray-800 text-[10px] font-black text-slate-400 uppercase border-b dark:border-gray-700">
                                    <tr>
                                        <th className="px-6 py-4">Status / OP</th>
                                        <th className="px-6 py-4">Produto / Lote</th>
                                        <th className="px-6 py-4">Prioridade / Prazos</th>
                                        <th className="px-6 py-4">Operador / Usina</th>
                                        <th className="px-6 py-4 text-center">Progresso</th>
                                        <th className="px-6 py-4 text-right">Ações Operacionais</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y dark:divide-gray-700">
                                    {filteredOrders.map(o => (
                                        <React.Fragment key={o.id}>
                                            <tr
                                                className={`group hover:bg-slate-50 dark:hover:bg-indigo-900/10 transition-all cursor-pointer ${selectedOrder?.id === o.id ? 'bg-indigo-50/50 dark:bg-indigo-900/20' : ''}`}
                                                onClick={() => setSelectedOrder(selectedOrder?.id === o.id ? null : o)}
                                            >
                                                <td className="px-6 py-5">
                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase mb-1 ${
                                                        o.status === 'Finalizado' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' :
                                                        o.status === 'Em Produção' ? 'bg-indigo-100 text-indigo-700 border border-indigo-200 animate-pulse' :
                                                        o.status === 'Qualidade' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                                                        o.status === 'Pausado' ? 'bg-orange-100 text-orange-700 border border-orange-200' :
                                                        o.status === 'Cancelado' ? 'bg-rose-100 text-rose-700 border border-rose-200' :
                                                        'bg-slate-100 text-slate-600 border border-slate-200'
                                                    }`}>
                                                        <Circle size={7} fill="currentColor" /> {o.status}
                                                    </span>
                                                    <p className="font-mono text-xs text-indigo-600 dark:text-indigo-400 font-black">#{o.orderNumber}</p>
                                                </td>

                                                <td className="px-6 py-5">
                                                    <p className="font-black text-slate-900 dark:text-white text-xs uppercase">{o.productName}</p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-[10px] text-slate-500 font-bold uppercase">{o.quantity.toLocaleString()} UN</span>
                                                        <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-[9px] font-mono font-black text-slate-600 dark:text-slate-300">
                                                            {o.batch || 'SEM LOTE'}
                                                        </span>
                                                    </div>
                                                </td>

                                                <td className="px-6 py-5">
                                                    <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-black uppercase mb-1 ${
                                                        o.priority === 'Alta' ? 'bg-rose-100 text-rose-700' :
                                                        o.priority === 'Média' ? 'bg-amber-100 text-amber-700' :
                                                        'bg-slate-100 text-slate-600'
                                                    }`}>
                                                        {o.priority} Prioridade
                                                    </span>
                                                    <div className="text-[10px] text-slate-400 font-medium">
                                                        <span>Entrega: <strong className="text-slate-600 dark:text-slate-300">{o.dueDate || o.startDate}</strong></span>
                                                    </div>
                                                </td>

                                                <td className="px-6 py-5">
                                                    <div className="flex flex-col gap-1">
                                                        <span className="text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase flex items-center gap-1">
                                                            <User size={11} className="text-indigo-500" /> {o.operator || 'Operador Padrão'}
                                                        </span>
                                                        <span className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1">
                                                            <Factory size={10} /> {productionUnits.find(u => u.id === o.unitId)?.name || 'Usina Principal'}
                                                        </span>
                                                    </div>
                                                </td>

                                                <td className="px-6 py-5">
                                                    <div className="flex flex-col items-center gap-1.5 max-w-[130px] mx-auto">
                                                        <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                                                            <div
                                                                className={`h-full transition-all duration-500 ${
                                                                    o.status === 'Finalizado' ? 'bg-emerald-500' :
                                                                    o.status === 'Pausado' ? 'bg-orange-400' :
                                                                    'bg-indigo-600'
                                                                }`}
                                                                style={{ width: `${o.progress}%` }}
                                                            ></div>
                                                        </div>
                                                        <div className="flex items-center justify-between w-full text-[9px] font-black text-slate-400">
                                                            <span>{o.progress}%</span>
                                                            {o.status === 'Em Produção' && (
                                                                <div className="flex gap-1">
                                                                    <button
                                                                        onClick={(e) => { e.stopPropagation(); handleProgressIncrement(o, 25); }}
                                                                        className="px-1.5 py-0.5 bg-indigo-50 hover:bg-indigo-200 text-indigo-700 rounded text-[8px] font-bold"
                                                                        title="Avançar 25%"
                                                                    >
                                                                        +25%
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="px-6 py-5 text-right">
                                                    <div className="flex justify-end items-center gap-1.5">
                                                        {/* Status Controls */}
                                                        {o.status === 'Planejado' && (
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); startProduction(o.id); addToast(`Produção iniciada para OP #${o.orderNumber}! Insumos deduzidos.`, 'success'); }}
                                                                className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-md transition-all"
                                                                title="Iniciar Produção (Deduzir Insumos)"
                                                            >
                                                                <Play size={15} />
                                                            </button>
                                                        )}

                                                        {o.status === 'Em Produção' && (
                                                            <>
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); handlePauseOrder(o); }}
                                                                    className="p-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl shadow-md transition-all"
                                                                    title="Pausar Operação"
                                                                >
                                                                    <Pause size={15} />
                                                                </button>
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); updateProductionOrder({ ...o, status: 'Qualidade', progress: 90 }); addToast(`OP #${o.orderNumber} enviada para Quarentena / Qualidade!`, 'info'); }}
                                                                    className="p-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl shadow-md transition-all"
                                                                    title="Enviar para Qualidade"
                                                                >
                                                                    <FlaskConical size={15} />
                                                                </button>
                                                            </>
                                                        )}

                                                        {o.status === 'Pausado' && (
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); handleResumeOrder(o); }}
                                                                className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-md transition-all"
                                                                title="Retomar Produção"
                                                            >
                                                                <Play size={15} />
                                                            </button>
                                                        )}

                                                        {o.status === 'Qualidade' && (
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); completeProduction(o.id); addToast(`OP #${o.orderNumber} finalizada e integrada ao estoque!`, 'success'); }}
                                                                className="p-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-md transition-all"
                                                                title="Aprovar e Concluir OP (Entrada no Estoque)"
                                                            >
                                                                <CheckCircle size={15} />
                                                            </button>
                                                        )}

                                                        {/* Edit Order */}
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setEditingOrder(o);
                                                                setIsEditOrderModalOpen(true);
                                                            }}
                                                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
                                                            title="Editar O.P."
                                                        >
                                                            <Edit2 size={15} />
                                                        </button>

                                                        {/* Print Order */}
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                const formula = formulas.find(f => f.id === o.formulaId);
                                                                const printWindow = window.open('', '_blank');
                                                                if (printWindow) {
                                                                    printWindow.document.write(`
                                                                     <html>
                                                                        <head>
                                                                           <title>Ordem de Produção #${o.orderNumber}</title>
                                                                           <style>
                                                                              body { font-family: sans-serif; padding: 40px; color: #1e293b; }
                                                                              .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; border-bottom: 3px solid #4f46e5; padding-bottom: 20px; }
                                                                              .title { font-size: 24px; font-weight: 900; color: #4f46e5; text-transform: uppercase; }
                                                                              .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
                                                                              .section { margin-bottom: 30px; border: 1px solid #e2e8f0; padding: 20px; border-radius: 8px; }
                                                                              .section h3 { margin-top: 0; text-transform: uppercase; font-size: 13px; color: #64748b; border-bottom: 1px solid #eee; padding-bottom: 10px; margin-bottom: 15px; }
                                                                              table { width: 100%; border-collapse: collapse; }
                                                                              th, td { text-align: left; padding: 8px; border-bottom: 1px solid #eee; font-size: 12px; }
                                                                              th { text-transform: uppercase; color: #64748b; font-size: 10px; }
                                                                              .footer { margin-top: 50px; text-align: center; color: #94a3b8; font-size: 11px; border-top: 1px solid #eee; padding-top: 20px; }
                                                                              .signature-box { display: flex; justify-content: space-between; margin-top: 60px; }
                                                                              .signature { width: 45%; border-top: 1px solid #000; padding-top: 8px; text-align: center; font-size: 11px; }
                                                                           </style>
                                                                        </head>
                                                                        <body>
                                                                           <div class="header">
                                                                              <div>
                                                                                 <div class="title">Ordem de Produção Industrial</div>
                                                                                 <div style="font-size:12px; color:#64748b;">InfraCore ERP - PCP & Manufatura</div>
                                                                              </div>
                                                                              <div style="text-align: right">
                                                                                 <div style="font-size:18px; font-weight:bold;">#${o.orderNumber}</div>
                                                                                 <div style="font-size: 12px; color: #64748b;">Emissão: ${o.startDate} | Entrega: ${o.dueDate || o.startDate}</div>
                                                                              </div>
                                                                           </div>

                                                                           <div class="info-grid">
                                                                              <div>
                                                                                 <p><strong>Produto:</strong> ${o.productName}</p>
                                                                                 <p><strong>Lote:</strong> ${o.batch || 'N/A'}</p>
                                                                                 <p><strong>Quantidade:</strong> ${o.quantity.toLocaleString()} UN</p>
                                                                                 <p><strong>Prioridade:</strong> ${o.priority}</p>
                                                                              </div>
                                                                              <div>
                                                                                 <p><strong>Usina/Planta:</strong> ${productionUnits.find(u => u.id === o.unitId)?.name || o.unitId}</p>
                                                                                 <p><strong>Operador Responsável:</strong> ${o.operator || 'N/A'}</p>
                                                                                 <p><strong>Status Operacional:</strong> ${o.status}</p>
                                                                                 <p><strong>Progresso:</strong> ${o.progress}%</p>
                                                                              </div>
                                                                           </div>

                                                                           <div class="section">
                                                                              <h3>Especificações de Dosagem / Insumos Requeridos</h3>
                                                                              <table>
                                                                                 <thead>
                                                                                    <tr>
                                                                                       <th>Insumo</th>
                                                                                       <th>Dosagem / UN</th>
                                                                                       <th>Total Batelada</th>
                                                                                    </tr>
                                                                                 </thead>
                                                                                 <tbody>
                                                                                    ${(formula?.ingredients || []).map(ing => `
                                                                                       <tr>
                                                                                          <td><strong>${ing.name}</strong></td>
                                                                                          <td>${ing.qty} ${ing.unit}</td>
                                                                                          <td><strong>${(ing.qty * o.quantity).toFixed(2)} ${ing.unit}</strong></td>
                                                                                       </tr>
                                                                                    `).join('')}
                                                                                 </tbody>
                                                                              </table>
                                                                           </div>

                                                                           <div class="signature-box">
                                                                              <div class="signature">Operador da Planta</div>
                                                                              <div class="signature">Controle de Qualidade / Engenharia</div>
                                                                           </div>

                                                                           <div class="footer">
                                                                              <p>Documento oficial emitido eletronicamente em ${new Date().toLocaleString('pt-BR')}</p>
                                                                           </div>
                                                                           <script>window.print();</script>
                                                                        </body>
                                                                     </html>
                                                                  `);
                                                                    printWindow.document.close();
                                                                }
                                                            }}
                                                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
                                                            title="Imprimir Ordem de Serviço"
                                                        >
                                                            <Printer size={15} />
                                                        </button>

                                                        {/* Cancel / Delete */}
                                                        {o.status !== 'Cancelado' && o.status !== 'Finalizado' && (
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); handleCancelOrder(o); }}
                                                                className="p-2 text-slate-400 hover:text-orange-500 hover:bg-orange-50 rounded-xl transition-colors"
                                                                title="Cancelar O.P."
                                                            >
                                                                <X size={15} />
                                                            </button>
                                                        )}

                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); deleteProductionOrder(o.id); addToast(`OP #${o.orderNumber} removida.`, 'warning'); }}
                                                            className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-colors"
                                                            title="Excluir O.P."
                                                        >
                                                            <Trash2 size={15} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>

                                            {/* Expandable Order Details Row */}
                                            {selectedOrder?.id === o.id && (
                                                <tr className="bg-slate-50/80 dark:bg-slate-900/40 border-l-4 border-indigo-500">
                                                    <td colSpan={6} className="px-8 py-8 animate-in slide-in-from-top-4 duration-300">
                                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                                                            {/* Raw Materials Column */}
                                                            <div>
                                                                <h4 className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                                                    <Layers size={14} className="text-indigo-500" /> Insumos & Dosagem da Batelada
                                                                </h4>
                                                                <div className="space-y-3">
                                                                    {formulas.find(f => f.id === o.formulaId)?.ingredients.map((ing, idx) => {
                                                                        const stockItem = inventory.find(item => item.id === ing.productId);
                                                                        const requiredQty = ing.qty * o.quantity;
                                                                        const availableQty = stockItem?.quantity || 0;
                                                                        const hasEnoughStock = availableQty >= requiredQty;

                                                                        return (
                                                                            <div key={idx} className="flex flex-col gap-2 p-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
                                                                                <div className="flex justify-between items-center">
                                                                                    <span className="text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase">{ing.name}</span>
                                                                                    <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 dark:bg-indigo-900/50 px-2 py-0.5 rounded-lg">
                                                                                        {requiredQty.toFixed(2)} {ing.unit}
                                                                                    </span>
                                                                                </div>

                                                                                <div className="flex justify-between text-[9px] text-slate-400 font-medium border-t border-slate-50 dark:border-slate-700 pt-1 mt-1">
                                                                                    <span>Local: <strong className="text-slate-600 dark:text-slate-300">{stockItem?.location || 'Almoxarifado'}</strong></span>
                                                                                    <span>Unitário: {ing.qty} {ing.unit}/un</span>
                                                                                </div>

                                                                                {!o.rawMaterialsDeducted && (
                                                                                    <div className={`flex items-center gap-1.5 text-[9px] font-bold ${hasEnoughStock ? 'text-emerald-600' : 'text-rose-600'} mt-1`}>
                                                                                        <Archive size={10} />
                                                                                        <span>Estoque Atual: {availableQty.toFixed(2)} {stockItem?.unit || ing.unit}</span>
                                                                                        {!hasEnoughStock && <span className="ml-auto bg-rose-100 dark:bg-rose-900/30 px-1.5 py-0.5 rounded uppercase font-black">Insuficiente</span>}
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        );
                                                                    })}
                                                                    {o.rawMaterialsDeducted && (
                                                                        <div className="flex items-center gap-2 mt-4 text-[10px] font-black text-emerald-600 uppercase bg-emerald-50 dark:bg-emerald-900/30 p-2.5 rounded-xl border border-emerald-100 dark:border-emerald-800">
                                                                            <Check size={14} /> Insumos Baixados do Estoque
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            {/* Quality Column */}
                                                            <div>
                                                                <div className="flex justify-between items-center mb-4">
                                                                    <h4 className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                                        <FlaskConical size={14} className="text-amber-500" /> Laudos & Testes de Qualidade
                                                                    </h4>
                                                                    <button
                                                                        onClick={() => setIsTestModalOpen(true)}
                                                                        className="p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all flex items-center gap-1 text-[9px] font-bold uppercase"
                                                                    >
                                                                        <Plus size={11} /> Registrar
                                                                    </button>
                                                                </div>
                                                                <div className="space-y-3">
                                                                    {o.qualityTests?.map((test, idx) => (
                                                                        <div key={idx} className="p-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col gap-1">
                                                                            <div className="flex justify-between">
                                                                                <span className="text-[10px] font-black text-slate-800 dark:text-white uppercase">{test.type}</span>
                                                                                <span className={`text-[9px] font-black px-1.5 rounded uppercase ${test.status === 'Aprovado' ? 'text-emerald-600 bg-emerald-50' : test.status === 'Reprovado' ? 'text-rose-600 bg-rose-50' : 'text-amber-600 bg-amber-50'}`}>{test.status}</span>
                                                                            </div>
                                                                            <div className="flex justify-between items-end mt-1">
                                                                                <p className="text-[10px] text-slate-400 font-bold uppercase">Resultado: <strong className="text-indigo-600">{test.result}</strong></p>
                                                                                <span className="text-[8px] text-slate-400 font-mono">{test.testedAt}</span>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                    {(!o.qualityTests || o.qualityTests.length === 0) && (
                                                                        <div className="h-24 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl opacity-60">
                                                                            <p className="text-[10px] font-black text-slate-400 uppercase">Sem Testes Registrados</p>
                                                                            <button onClick={() => setIsTestModalOpen(true)} className="mt-2 text-indigo-600 text-[10px] font-bold hover:underline">Adicionar laudo agora</button>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            {/* Operational Timeline */}
                                                            <div>
                                                                <h4 className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                                                    <Activity size={14} className="text-emerald-500" /> Linha do Tempo da Batelada
                                                                </h4>
                                                                <div className="space-y-4 relative before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100 dark:before:bg-slate-700">
                                                                    <div className="flex items-center gap-4 relative">
                                                                        <div className="w-4 h-4 rounded-full bg-emerald-500 border-4 border-white dark:border-slate-800 z-10 shadow-sm"></div>
                                                                        <p className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase">Emissão da O.P. <span className="ml-2 font-mono text-slate-400">{o.startDate}</span></p>
                                                                    </div>
                                                                    <div className={`flex items-center gap-4 relative ${o.status !== 'Planejado' ? '' : 'opacity-30'}`}>
                                                                        <div className={`w-4 h-4 rounded-full ${o.status !== 'Planejado' ? 'bg-indigo-600' : 'bg-slate-200'} border-4 border-white dark:border-slate-800 z-10 shadow-sm`}></div>
                                                                        <p className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase">Início e Dosagem nas Usinas</p>
                                                                    </div>
                                                                    <div className={`flex items-center gap-4 relative ${o.status === 'Qualidade' || o.status === 'Finalizado' ? '' : 'opacity-30'}`}>
                                                                        <div className={`w-4 h-4 rounded-full ${o.status === 'Qualidade' || o.status === 'Finalizado' ? 'bg-amber-500' : 'bg-slate-200'} border-4 border-white dark:border-slate-800 z-10 shadow-sm`}></div>
                                                                        <p className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase">Inspeção Laboratorial (Slump/Cura)</p>
                                                                    </div>
                                                                    <div className={`flex items-center gap-4 relative ${o.status === 'Finalizado' ? '' : 'opacity-30'}`}>
                                                                        <div className={`w-4 h-4 rounded-full ${o.status === 'Finalizado' ? 'bg-emerald-500' : 'bg-slate-200'} border-4 border-white dark:border-slate-800 z-10 shadow-sm`}></div>
                                                                        <p className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase">Finalização e Entrada em Estoque</p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    ))}
                                    {filteredOrders.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic font-medium uppercase text-xs tracking-widest">
                                                Nenhuma ordem de produção encontrada com os filtros selecionados.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB: TRAÇOS & DOSAGEM (FÓRMULAS) */}
            {activeTab === 'formulas' && (
                <div className="space-y-6">
                    {/* Header Controls for Formulas */}
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col md:flex-row gap-4 items-center justify-between">
                        <div className="relative w-full md:w-96">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input
                                type="text"
                                placeholder="Buscar traço por nome ou ingrediente..."
                                value={formulaSearch}
                                onChange={e => setFormulaSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>

                        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-bold">
                                <Filter size={14} /> Categoria:
                            </div>
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
                                    if (formulas.length > 0) setCalcFormulaId(formulas[0].id);
                                    setIsCalculatorModalOpen(true);
                                }}
                                className="px-4 py-2 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 font-black rounded-xl text-xs uppercase flex items-center gap-1.5 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 transition-colors"
                            >
                                <Calculator size={14} /> Simulador de Batelada
                            </button>

                            <button
                                onClick={() => {
                                    setEditingFormula(null);
                                    setFormulaForm({ type: 'Composicao', ingredients: [{ productId: '', name: '', qty: 0, unit: 'kg' }], outputs: [{ productId: '', name: '', percentage: 0 }] });
                                    setIsFormulaModalOpen(true);
                                }}
                                className="px-4 py-2 bg-indigo-600 text-white font-black rounded-xl text-xs uppercase flex items-center gap-1.5 shadow-md hover:bg-indigo-700 transition-colors"
                            >
                                <Plus size={14} /> Novo Traço
                            </button>
                        </div>
                    </div>

                    {/* Formula Cards Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredFormulas.map(formula => {
                            const unitCost = calculateFormulaCost(formula);

                            return (
                                <div key={formula.id} className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 group hover:border-indigo-400 transition-all flex flex-col justify-between">
                                    <div>
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-2xl">
                                                <Beaker size={24} />
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-black px-2.5 py-1 bg-slate-100 dark:bg-slate-700 rounded-full uppercase text-slate-500">
                                                    {formula.category}
                                                </span>
                                                <span className={`text-[9px] font-black px-2 py-0.5 rounded-md uppercase ${formula.type === 'Britagem' ? 'bg-amber-100 text-amber-700' : 'bg-indigo-100 text-indigo-700'}`}>
                                                    {formula.type || 'Composição'}
                                                </span>
                                            </div>
                                        </div>

                                        <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2 uppercase tracking-tight">{formula.name}</h3>

                                        {/* Cost Indicator */}
                                        <div className="mb-6 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800 flex justify-between items-center">
                                            <span className="text-[10px] font-black uppercase text-slate-400">Custo Teórico Insumos</span>
                                            <span className="text-sm font-black text-indigo-600 dark:text-indigo-400">{formatCurrency(unitCost)} <span className="text-[10px] text-slate-400 font-normal">/ UN</span></span>
                                        </div>

                                        {/* Ingredients List */}
                                        <div className="space-y-2.5 mb-6">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Proporção de Dosagem</p>
                                            {formula.ingredients.map((ing, k) => {
                                                const stockItem = inventory.find(item => item.id === ing.productId);
                                                const availableQty = stockItem?.quantity || 0;
                                                const isStockLow = availableQty < (ing.qty * 10);

                                                return (
                                                    <div key={k} className="flex flex-col gap-1 text-xs font-medium border-b border-slate-50 dark:border-slate-700/60 pb-2">
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-slate-600 dark:text-slate-300 font-bold">{ing.name}</span>
                                                            <span className="font-mono font-black text-slate-900 dark:text-white px-2 py-0.5 bg-slate-100 dark:bg-slate-900 rounded-md text-[11px]">
                                                                {ing.qty} {ing.unit}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center justify-between text-[9px] text-slate-400">
                                                            <span>Estoque almoxarifado: <strong className={isStockLow ? 'text-rose-500 font-black' : 'text-slate-600 dark:text-slate-300'}>{availableQty.toFixed(1)} {stockItem?.unit || ing.unit}</strong></span>
                                                            {isStockLow && <span className="text-rose-500 font-bold uppercase text-[8px]">Estoque Baixo</span>}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Action Footer */}
                                    <div className="space-y-2 pt-4 border-t dark:border-slate-700">
                                        <button
                                            onClick={() => {
                                                setCalcFormulaId(formula.id);
                                                setIsCalculatorModalOpen(true);
                                            }}
                                            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/20"
                                        >
                                            <Calculator size={13} /> Calcular Batelada (Dosagem)
                                        </button>

                                        <div className="grid grid-cols-3 gap-2">
                                            <button
                                                onClick={() => {
                                                    setEditingFormula(formula);
                                                    setFormulaForm(formula);
                                                    setIsFormulaModalOpen(true);
                                                }}
                                                className="py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:text-indigo-600 rounded-xl text-[10px] font-bold uppercase transition-colors flex items-center justify-center gap-1"
                                                title="Editar Traço"
                                            >
                                                <Edit2 size={12} /> Editar
                                            </button>

                                            <button
                                                onClick={() => handleDuplicateFormula(formula)}
                                                className="py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:text-indigo-600 rounded-xl text-[10px] font-bold uppercase transition-colors flex items-center justify-center gap-1"
                                                title="Clonar Traço"
                                            >
                                                <Copy size={12} /> Clonar
                                            </button>

                                            <button
                                                onClick={() => handlePrintFormulaSheet(formula)}
                                                className="py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:text-indigo-600 rounded-xl text-[10px] font-bold uppercase transition-colors flex items-center justify-center gap-1"
                                                title="Imprimir Ficha Técnica de Dosagem"
                                            >
                                                <Printer size={12} /> Ficha
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                        <button
                            onClick={() => {
                                setEditingFormula(null);
                                setFormulaForm({ type: 'Composicao', ingredients: [{ productId: '', name: '', qty: 0, unit: 'kg' }], outputs: [{ productId: '', name: '', percentage: 0 }] });
                                setIsFormulaModalOpen(true);
                            }}
                            className="bg-slate-50 dark:bg-slate-900/50 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-3xl p-8 flex flex-col items-center justify-center gap-4 text-slate-400 hover:border-indigo-400 hover:text-indigo-600 transition-all group min-h-[350px]"
                        >
                            <div className="p-4 bg-white dark:bg-slate-800 rounded-full shadow-sm group-hover:scale-110 transition-transform">
                                <Plus size={32} />
                            </div>
                            <span className="font-black text-xs uppercase tracking-widest">Cadastrar Novo Traço</span>
                            <p className="text-[11px] text-slate-400 text-center max-w-xs font-medium">Configure misturas de concreto, britagem, asfalto ou argamassas industriais.</p>
                        </button>
                    </div>
                </div>
            )}

            {/* TAB: LABORATÓRIO & QUALIDADE */}
            {activeTab === 'lab' && (
                <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-sm border border-slate-100 dark:border-slate-700">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                        <div className="flex items-center gap-4">
                            <div className="p-4 bg-amber-500 rounded-2xl text-white shadow-xl">
                                <FlaskConical size={32} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">Controle de Qualidade & Laboratório</h3>
                                <p className="text-slate-400 text-[11px] font-bold uppercase tracking-widest">Monitoramento técnico de resistência, slump e conformidade.</p>
                            </div>
                        </div>
                        <div className="flex gap-4 w-full md:w-auto">
                            <div className="flex-1 md:w-64 p-4 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl border border-indigo-100 dark:border-indigo-800">
                                <p className="text-[10px] font-black text-indigo-500 uppercase mb-1">Taxa de Conformidade</p>
                                <p className="text-2xl font-black text-indigo-700">{productionStats.complianceRate.toFixed(1)}%</p>
                            </div>
                            <div className="flex-1 md:w-64 p-4 bg-emerald-50 dark:bg-emerald-900/30 rounded-2xl border border-emerald-100 dark:border-emerald-800">
                                <p className="text-[10px] font-black text-emerald-500 uppercase mb-1">Aprovações (Mês)</p>
                                <p className="text-2xl font-black text-emerald-700">{productionStats.approvalsMonth}</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                        <div>
                            <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                                <AlertTriangle size={14} className="text-amber-500" /> Ordens em Quarentena / Aguardando Laudo
                            </h4>
                            <div className="space-y-4">
                                {productionOrders.filter(o => o.status === 'Qualidade').map(o => (
                                    <div key={o.id} className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 flex justify-between items-center group hover:border-amber-400 transition-all">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl shadow-sm flex items-center justify-center text-amber-500 border border-slate-100 dark:border-slate-700">
                                                <Archive size={20} />
                                            </div>
                                            <div>
                                                <p className="font-black text-slate-800 dark:text-white uppercase text-xs">{o.productName}</p>
                                                <p className="text-[10px] text-slate-400 font-bold">#{o.orderNumber} • Lote {o.batch || 'S/N'} • {o.quantity} UN</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => { setSelectedOrder(o); setIsTestModalOpen(true); }}
                                            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-black rounded-xl text-[10px] uppercase shadow-lg shadow-amber-500/20 hover:scale-105 transition-all flex items-center gap-1.5"
                                        >
                                            <Plus size={12} /> Registrar Laudo
                                        </button>
                                    </div>
                                ))}
                                {productionOrders.filter(o => o.status === 'Qualidade').length === 0 && (
                                    <div className="h-40 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-3xl opacity-50">
                                        <Check size={32} className="mb-2 text-emerald-500" />
                                        <p className="text-[10px] font-black text-slate-400 uppercase">Todas as O.P.s avaliadas e em conformidade</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div>
                            <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                                <Clock size={14} className="text-indigo-500" /> Histórico de Testes Recentes
                            </h4>
                            <div className="space-y-3">
                                {productionOrders.flatMap(o => (o.qualityTests || []).map(t => ({ ...t, orderNum: o.orderNumber, prodName: o.productName }))).slice(0, 6).map((test, i) => (
                                    <div key={i} className="p-4 rounded-3xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm flex items-center gap-5">
                                        <div className={`p-3 rounded-xl ${test.status === 'Aprovado' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                            {test.status === 'Aprovado' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start">
                                                <p className="font-black text-slate-800 dark:text-white uppercase text-[10px]">{test.type}</p>
                                                <span className="text-[9px] font-black tracking-widest text-slate-400 uppercase">{test.testedAt}</span>
                                            </div>
                                            <p className="text-[10px] font-bold text-slate-500 mt-0.5">{test.prodName} (#{test.orderNum})</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-black text-indigo-600 uppercase">Resultado</p>
                                            <p className="text-sm font-black text-slate-800 dark:text-white">{test.result}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL: NOVA ORDEM DE PRODUÇÃO */}
            {isOrderModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-lg border dark:border-slate-700 animate-in zoom-in duration-200">
                        <div className="p-6 border-b dark:border-slate-700 flex justify-between items-center">
                            <h3 className="font-black text-xl text-slate-900 dark:text-white uppercase italic">Emitir Nova O.P.</h3>
                            <button onClick={() => setIsOrderModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
                        </div>
                        <form onSubmit={handleSaveOrder} className="p-6 space-y-5">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Unidade Produtora</label>
                                <select className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl py-3.5 font-black text-sm uppercase" value={newOrder.unitId} onChange={e => setNewOrder({ ...newOrder, unitId: e.target.value })} required>
                                    {productionUnits.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Traço / Processo Produtivo</label>
                                <select className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl py-3.5 font-black text-sm uppercase" value={newOrder.formulaId || ''} onChange={e => setNewOrder({ ...newOrder, formulaId: e.target.value })} required>
                                    <option value="">Selecione a fórmula / traço...</option>
                                    {formulas.map(f => <option key={f.id} value={f.id}>{f.name} ({f.category})</option>)}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Quantidade Total (UN)</label>
                                    <input type="number" className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl py-3.5 font-black text-sm" value={newOrder.quantity || ''} onChange={e => setNewOrder({ ...newOrder, quantity: Number(e.target.value) })} required min="1" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Lote (Batch)</label>
                                    <input type="text" className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl py-3.5 font-black text-sm uppercase" value={newOrder.batch} onChange={e => setNewOrder({ ...newOrder, batch: e.target.value.toUpperCase() })} required />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Operador Responsável</label>
                                    <input type="text" className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl py-3.5 font-black text-sm" placeholder="Ex: João Silva" value={newOrder.operator || ''} onChange={e => setNewOrder({ ...newOrder, operator: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Prioridade</label>
                                    <select className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl py-3.5 font-black text-sm" value={newOrder.priority} onChange={e => setNewOrder({ ...newOrder, priority: e.target.value as any })}>
                                        <option value="Baixa">BAIXA</option>
                                        <option value="Média">MÉDIA</option>
                                        <option value="Alta">ALTA</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Previsão de Entrega / Prazo</label>
                                <input
                                    type="date"
                                    className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl py-3.5 font-bold text-sm"
                                    value={newOrder.dueDate || new Date(Date.now() + 86400000).toISOString().split('T')[0]}
                                    onChange={e => setNewOrder({ ...newOrder, dueDate: e.target.value })}
                                />
                            </div>
                            <button type="submit" className="w-full py-4 bg-indigo-600 text-white font-black rounded-2xl shadow-xl mt-4 uppercase tracking-widest text-[11px] shadow-indigo-600/30 hover:bg-indigo-500 transition-all">
                                Lançar O.P. no Chão de Fábrica
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL: EDITAR O.P. EXISTENTE */}
            {isEditOrderModalOpen && editingOrder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-lg border dark:border-slate-700 animate-in zoom-in duration-200">
                        <div className="p-6 border-b dark:border-slate-700 flex justify-between items-center">
                            <h3 className="font-black text-xl text-slate-900 dark:text-white uppercase italic">Editar Ordem #{editingOrder.orderNumber}</h3>
                            <button onClick={() => { setIsEditOrderModalOpen(false); setEditingOrder(null); }} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
                        </div>
                        <form onSubmit={handleUpdateExistingOrder} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Status</label>
                                    <select
                                        className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl py-3 font-bold text-xs"
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
                                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Prioridade</label>
                                    <select
                                        className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl py-3 font-bold text-xs"
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
                                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Quantidade (UN)</label>
                                    <input
                                        type="number"
                                        className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl py-3 font-bold text-xs"
                                        value={editingOrder.quantity}
                                        onChange={e => setEditingOrder({ ...editingOrder, quantity: Number(e.target.value) })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Progresso Físico (%)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl py-3 font-bold text-xs"
                                        value={editingOrder.progress}
                                        onChange={e => setEditingOrder({ ...editingOrder, progress: Number(e.target.value) })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Operador</label>
                                    <input
                                        type="text"
                                        className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl py-3 font-bold text-xs"
                                        value={editingOrder.operator || ''}
                                        onChange={e => setEditingOrder({ ...editingOrder, operator: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Usina Alocada</label>
                                    <select
                                        className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl py-3 font-bold text-xs"
                                        value={editingOrder.unitId || ''}
                                        onChange={e => setEditingOrder({ ...editingOrder, unitId: e.target.value })}
                                    >
                                        {productionUnits.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Data Limite de Entrega</label>
                                <input
                                    type="date"
                                    className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl py-3 font-bold text-xs"
                                    value={editingOrder.dueDate || ''}
                                    onChange={e => setEditingOrder({ ...editingOrder, dueDate: e.target.value })}
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => { setIsEditOrderModalOpen(false); setEditingOrder(null); }}
                                    className="flex-1 py-3 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-bold uppercase text-xs"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-[2] py-3 bg-indigo-600 text-white font-black rounded-xl uppercase text-xs shadow-lg"
                                >
                                    Salvar Alterações
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL: CALCULADORA / SIMULADOR DE DOSAGEM (BATCH SCALING) */}
            {isCalculatorModalOpen && (
                <div className="fixed inset-0 z-[65] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
                    <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-2xl border dark:border-slate-700 animate-in zoom-in duration-200 my-8">
                        <div className="p-6 border-b dark:border-slate-700 flex justify-between items-center bg-indigo-50/50 dark:bg-indigo-900/20">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-indigo-600 text-white rounded-xl">
                                    <Calculator size={20} />
                                </div>
                                <div>
                                    <h3 className="font-black text-lg text-slate-900 dark:text-white uppercase tracking-tight">Simulador de Dosagem & Batelada</h3>
                                    <p className="text-[11px] text-slate-400">Cálculo proporcional de insumos com ajuste de umidade de agregados.</p>
                                </div>
                            </div>
                            <button onClick={() => setIsCalculatorModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
                        </div>

                        <div className="p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="md:col-span-2">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Selecione o Traço / Fórmula</label>
                                    <select
                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-3 px-3 font-bold text-xs uppercase"
                                        value={calcFormulaId}
                                        onChange={e => setCalcFormulaId(e.target.value)}
                                    >
                                        {formulas.map(f => (
                                            <option key={f.id} value={f.id}>{f.name} ({f.category})</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Volume Batelada (UN)</label>
                                    <input
                                        type="number"
                                        step="0.5"
                                        min="0.5"
                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-3 px-3 font-bold text-xs"
                                        value={calcBatchVolume}
                                        onChange={e => setCalcBatchVolume(Number(e.target.value))}
                                    />
                                </div>
                            </div>

                            {/* Moisture compensation */}
                            <div className="p-4 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-100 dark:border-slate-800">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-[10px] font-black uppercase text-slate-500">Correção de Umidade de Areia / Agregados</span>
                                    <span className="text-xs font-mono font-black text-indigo-600">{calcMoistureCorrection}%</span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="10"
                                    step="0.5"
                                    value={calcMoistureCorrection}
                                    onChange={e => setCalcMoistureCorrection(Number(e.target.value))}
                                    className="w-full accent-indigo-600"
                                />
                                <p className="text-[10px] text-slate-400 mt-1 italic">
                                    Ajuste técnico: compensa o teor de água nos agregados finos para garantir o fator água/cimento (A/C) correto.
                                </p>
                            </div>

                            {/* Batch Insumos Calculation Table */}
                            {(() => {
                                const selectedF = formulas.find(f => f.id === calcFormulaId);
                                if (!selectedF) return <p className="text-xs text-slate-400 italic">Selecione uma fórmula.</p>;

                                let totalBatchCost = 0;

                                return (
                                    <div className="space-y-4">
                                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                            Matérias-Primas Necessárias para {calcBatchVolume} UN
                                        </h4>
                                        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700">
                                            <table className="w-full text-xs">
                                                <thead className="bg-slate-100 dark:bg-slate-800 text-[10px] font-black text-slate-500 uppercase border-b border-slate-200 dark:border-slate-700">
                                                    <tr>
                                                        <th className="p-3 text-left">Insumo</th>
                                                        <th className="p-3 text-center">Dosagem Traço</th>
                                                        <th className="p-3 text-center">Qtd Batelada</th>
                                                        <th className="p-3 text-center">Estoque Atual</th>
                                                        <th className="p-3 text-right">Custo Est.</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100 dark:divide-gray-800">
                                                    {selectedF.ingredients.map((ing, idx) => {
                                                        const stockItem = inventory.find(i => i.id === ing.productId);
                                                        const unitCost = stockItem?.costPrice ?? stockItem?.price ?? 0;
                                                        // Adjust if it's fine aggregate with moisture correction
                                                        const moistureFactor = ing.name.toLowerCase().includes('areia') ? (1 + (calcMoistureCorrection / 100)) : 1;
                                                        const totalNeeded = ing.qty * calcBatchVolume * moistureFactor;
                                                        const itemCost = totalNeeded * unitCost;
                                                        totalBatchCost += itemCost;

                                                        const hasStock = (stockItem?.quantity || 0) >= totalNeeded;

                                                        return (
                                                            <tr key={idx} className="hover:bg-white dark:hover:bg-slate-800/80">
                                                                <td className="p-3 font-bold text-slate-800 dark:text-slate-200">
                                                                    {ing.name}
                                                                    {moistureFactor > 1 && <span className="ml-1 text-[9px] text-indigo-500 font-bold">(+Umidade)</span>}
                                                                </td>
                                                                <td className="p-3 text-center text-slate-500">{ing.qty} {ing.unit}</td>
                                                                <td className="p-3 text-center font-black text-indigo-600">{totalNeeded.toFixed(2)} {ing.unit}</td>
                                                                <td className="p-3 text-center">
                                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${hasStock ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700 font-black'}`}>
                                                                        {(stockItem?.quantity || 0).toFixed(1)} {stockItem?.unit || ing.unit}
                                                                    </span>
                                                                </td>
                                                                <td className="p-3 text-right font-mono font-bold text-slate-700 dark:text-slate-300">
                                                                    {formatCurrency(itemCost)}
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                                <tfoot className="bg-slate-100 dark:bg-slate-800/60 font-black border-t border-slate-200 dark:border-slate-700">
                                                    <tr>
                                                        <td colSpan={4} className="p-3 uppercase text-[10px] text-slate-500">Custo Total dos Insumos da Batelada:</td>
                                                        <td className="p-3 text-right text-indigo-600 font-mono text-sm">{formatCurrency(totalBatchCost)}</td>
                                                    </tr>
                                                </tfoot>
                                            </table>
                                        </div>

                                        <div className="pt-4 flex gap-3">
                                            <button
                                                type="button"
                                                onClick={() => setIsCalculatorModalOpen(false)}
                                                className="flex-1 py-3 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold rounded-xl text-xs uppercase"
                                            >
                                                Fechar
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setNewOrder({
                                                        ...newOrder,
                                                        formulaId: selectedF.id,
                                                        quantity: calcBatchVolume,
                                                        productName: selectedF.name,
                                                        productId: selectedF.outputProductId
                                                    });
                                                    setIsCalculatorModalOpen(false);
                                                    setIsOrderModalOpen(true);
                                                    addToast(`Dosagem de ${calcBatchVolume} UN carregada no formulário de O.P.!`, 'info');
                                                }}
                                                className="flex-[2] py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-xl text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-2"
                                            >
                                                <Play size={14} /> Emitir O.P. com esta Batelada
                                            </button>
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL: LAUDO TÉCNICO */}
            {isTestModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-md border dark:border-slate-700 animate-in zoom-in duration-200">
                        <div className="p-6 border-b dark:border-slate-700 flex justify-between items-center">
                            <h3 className="font-black text-xl text-slate-900 dark:text-white uppercase italic">Registrar Laudo Técnico</h3>
                            <button onClick={() => setIsTestModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
                        </div>
                        <form onSubmit={handleAddTest} className="p-6 space-y-4">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Tipo de Ensaio</label>
                                <select className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl py-3 font-bold text-sm" value={newTest.type} onChange={e => setNewTest({ ...newTest, type: e.target.value })} required>
                                    <option value="Slump Test">Slump Test (Abatimento)</option>
                                    <option value="Resistência (7 dias)">Cura / Resistência (7 dias)</option>
                                    <option value="Resistência (28 dias)">Cura / Resistência (28 dias)</option>
                                    <option value="Teor de Betume">Teor de Betume / Ligante</option>
                                    <option value="Granulometria">Análise Granulométrica</option>
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Resultado Encontrado</label>
                                    <input type="text" className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl py-3 font-bold text-sm" placeholder="Ex: 9.5 cm" value={newTest.result || ''} onChange={e => setNewTest({ ...newTest, result: e.target.value })} required />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Status do Laudo</label>
                                    <select className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl py-3 font-bold text-sm" value={newTest.status} onChange={e => setNewTest({ ...newTest, status: e.target.value as any })} required>
                                        <option value="Pendente">PENDENTE</option>
                                        <option value="Aprovado">APROVADO</option>
                                        <option value="Reprovado">REPROVADO</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Técnico Responsável</label>
                                <input type="text" className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl py-3 font-bold text-sm" placeholder="Ex: Eng. Roberto" value={newTest.tester || ''} onChange={e => setNewTest({ ...newTest, tester: e.target.value })} required />
                            </div>
                            <button type="submit" className="w-full py-4 bg-amber-500 text-white font-black rounded-2xl shadow-lg mt-6 uppercase tracking-widest text-xs">Confirmar Laudo</button>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL: CONFIGURAR UNIDADE */}
            {isUnitModalOpen && editingUnit && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-md border dark:border-slate-700 animate-in zoom-in duration-200">
                        <div className="p-6 border-b dark:border-slate-700 flex justify-between items-center">
                            <h3 className="font-black text-xl text-slate-900 dark:text-white uppercase italic">Configurar Unidade</h3>
                            <button onClick={() => setIsUnitModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
                        </div>
                        <form onSubmit={handleSaveUnit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Nome da Planta</label>
                                <input type="text" className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl py-3 font-bold text-sm" value={editingUnit.name} onChange={e => setEditingUnit({ ...editingUnit, name: e.target.value })} required />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Tipo</label>
                                    <input type="text" className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl py-3 font-bold text-sm" value={editingUnit.type} onChange={e => setEditingUnit({ ...editingUnit, type: e.target.value })} required />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Capacidade</label>
                                    <input type="text" className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl py-3 font-bold text-sm" placeholder="Ex: 80 ton/h" value={editingUnit.capacity} onChange={e => setEditingUnit({ ...editingUnit, capacity: e.target.value })} required />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Temperatura (°C)</label>
                                    <input type="number" className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl py-3 font-bold text-sm" value={editingUnit.temp} onChange={e => setEditingUnit({ ...editingUnit, temp: Number(e.target.value) })} />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Consumo (kW)</label>
                                    <input type="text" className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl py-3 font-bold text-sm" value={editingUnit.power} onChange={e => setEditingUnit({ ...editingUnit, power: e.target.value })} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Status</label>
                                <select className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl py-3 font-bold text-sm" value={editingUnit.status} onChange={e => setEditingUnit({ ...editingUnit, status: e.target.value as any })}>
                                    <option value="Operando">Operando</option>
                                    <option value="Manutenção">Manutenção</option>
                                    <option value="Parado">Parado</option>
                                </select>
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => {
                                    addToast("Deseja realmente remover esta unidade?", 'warning', 5000, {
                                        label: 'CONFIRMAR EXCLUSÃO',
                                        onClick: () => { deleteProductionUnit(editingUnit.id); setIsUnitModalOpen(false); }
                                    });
                                }} className="flex-1 py-4 bg-rose-50 text-rose-600 font-black rounded-2xl uppercase tracking-widest text-xs">Excluir</button>
                                <button type="submit" className="flex-[2] py-4 bg-indigo-600 text-white font-black rounded-2xl shadow-lg uppercase tracking-widest text-xs">Salvar Alterações</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL: TRAÇO / FÓRMULA */}
            {isFormulaModalOpen && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
                    <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-lg border dark:border-slate-700 animate-in zoom-in duration-200 my-8">
                        <div className="p-6 border-b dark:border-slate-700 flex justify-between items-center">
                            <h3 className="font-black text-xl text-slate-900 dark:text-white uppercase italic">{editingFormula ? 'Editar Traço' : 'Novo Traço / Fórmula'}</h3>
                            <button onClick={() => setIsFormulaModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
                        </div>
                        <form onSubmit={handleSaveFormula} className="p-6 space-y-4">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Tipo de Processo</label>
                                <select
                                    className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl py-3 font-bold text-sm uppercase"
                                    value={formulaForm.type || 'Composicao'}
                                    onChange={e => setFormulaForm({ ...formulaForm, type: e.target.value as any })}
                                >
                                    <option value="Composicao">Fabricação / Mistura (Vários Insumos → 1 Produto)</option>
                                    <option value="Britagem">Britagem / Separação (1 Insumo → Vários Produtos)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Nome do Processo / Fórmula</label>
                                <input type="text" className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl py-3 font-bold text-sm" value={formulaForm.name || ''} onChange={e => setFormulaForm({ ...formulaForm, name: e.target.value })} required />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Categoria</label>
                                    <input type="text" placeholder="Ex: Concreto, Asfalto..." className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl py-3 font-bold text-sm" value={formulaForm.category || ''} onChange={e => setFormulaForm({ ...formulaForm, category: e.target.value })} required />
                                </div>
                                {formulaForm.type !== 'Britagem' && (
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Produto Produzido (Estoque)</label>
                                        <select
                                            className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl py-3 font-bold text-sm uppercase"
                                            value={formulaForm.outputProductId || ''}
                                            onChange={e => {
                                                const selected = inventory.find(i => i.id === e.target.value);
                                                setFormulaForm({
                                                    ...formulaForm,
                                                    outputProductId: e.target.value,
                                                    name: selected ? selected.name : (formulaForm.name || '')
                                                });
                                            }}
                                            required={(formulaForm.type as string) !== 'Britagem'}
                                        >
                                            <option value="">Selecione o produto...</option>
                                            {inventory.map(item => (
                                                <option key={item.id} value={item.id}>{item.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                            </div>

                            {/* Standard Composition Inputs */}
                            {formulaForm.type !== 'Britagem' && (
                                <div className="pt-4 border-t dark:border-slate-700">
                                    <div className="flex justify-between items-center mb-4">
                                        <label className="text-[10px] font-black text-slate-400 uppercase">Ingredientes / Insumos (p/ UN)</label>
                                        <button type="button" onClick={addIngredient} className="text-indigo-600 text-[10px] font-black uppercase flex items-center gap-1"><Plus size={12} /> Adicionar</button>
                                    </div>
                                    <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
                                        {formulaForm.ingredients?.map((ing, idx) => (
                                            <div key={idx} className="flex gap-2 items-center">
                                                <select
                                                    className="flex-[2] bg-slate-50 dark:bg-slate-900 border-none rounded-xl py-2 font-bold text-xs uppercase"
                                                    value={ing.productId}
                                                    onChange={e => {
                                                        const newIngs = [...(formulaForm.ingredients || [])];
                                                        const selected = inventory.find(i => i.id === e.target.value);
                                                        newIngs[idx] = { ...ing, productId: e.target.value, name: selected?.name || '', unit: selected?.unit || 'un' };
                                                        setFormulaForm({ ...formulaForm, ingredients: newIngs });
                                                    }}
                                                    required
                                                >
                                                    <option value="">Selecione...</option>
                                                    {inventory.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                                                </select>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    placeholder="Qtd"
                                                    className="w-20 bg-slate-50 dark:bg-slate-900 border-none rounded-xl py-2 font-bold text-xs"
                                                    value={ing.qty}
                                                    onChange={e => {
                                                        const newIngs = [...(formulaForm.ingredients || [])];
                                                        newIngs[idx] = { ...ing, qty: Number(e.target.value) };
                                                        setFormulaForm({ ...formulaForm, ingredients: newIngs });
                                                    }}
                                                    required
                                                />
                                                <span className="text-[10px] font-bold text-slate-400 w-8">{ing.unit}</span>
                                                <button type="button" onClick={() => {
                                                    const newIngs = formulaForm.ingredients?.filter((_, i) => i !== idx);
                                                    setFormulaForm({ ...formulaForm, ingredients: newIngs });
                                                }} className="text-slate-300 hover:text-rose-500"><X size={14} /></button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Britagem / Decomposition */}
                            {formulaForm.type === 'Britagem' && (
                                <div className="space-y-6 pt-4 border-t dark:border-slate-700">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Matéria Prima de Entrada (Input)</label>
                                        <div className="flex gap-2 items-center">
                                            <select
                                                className="w-full bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800 rounded-xl py-3 font-bold text-sm uppercase text-indigo-700 dark:text-indigo-300"
                                                value={formulaForm.ingredients?.[0]?.productId || ''}
                                                onChange={e => {
                                                    const selected = inventory.find(i => i.id === e.target.value);
                                                    const inputIng = { productId: e.target.value, name: selected?.name || '', qty: 1, unit: selected?.unit || 'ton' };
                                                    setFormulaForm({ ...formulaForm, ingredients: [inputIng] });
                                                }}
                                                required
                                            >
                                                <option value="">Selecione a Pedra Bruta/Desmonte...</option>
                                                {inventory.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <div className="flex justify-between items-center mb-4">
                                            <label className="text-[10px] font-black text-slate-400 uppercase">Produtos Gerados / Saída (%)</label>
                                            <button type="button" onClick={addOutput} className="text-emerald-600 text-[10px] font-black uppercase flex items-center gap-1"><Plus size={12} /> Adicionar Produto</button>
                                        </div>
                                        <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
                                            {formulaForm.outputs?.map((out, idx) => (
                                                <div key={idx} className="flex gap-2 items-center">
                                                    <select
                                                        className="flex-[2] bg-slate-50 dark:bg-slate-900 border-none rounded-xl py-2 font-bold text-xs uppercase"
                                                        value={out.productId}
                                                        onChange={e => {
                                                            const newOuts = [...(formulaForm.outputs || [])];
                                                            const selected = inventory.find(i => i.id === e.target.value);
                                                            newOuts[idx] = { ...out, productId: e.target.value, name: selected?.name || '' };
                                                            setFormulaForm({ ...formulaForm, outputs: newOuts });
                                                        }}
                                                        required
                                                    >
                                                        <option value="">Selecione Produto...</option>
                                                        {inventory.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                                                    </select>
                                                    <div className="relative">
                                                        <input
                                                            type="number"
                                                            placeholder="%"
                                                            className="w-20 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-100 dark:border-emerald-800 rounded-xl py-2 pl-2 pr-6 font-bold text-xs text-emerald-700"
                                                            value={out.percentage}
                                                            onChange={e => {
                                                                const newOuts = [...(formulaForm.outputs || [])];
                                                                newOuts[idx] = { ...out, percentage: Number(e.target.value) };
                                                                setFormulaForm({ ...formulaForm, outputs: newOuts });
                                                            }}
                                                            required
                                                        />
                                                        <span className="absolute right-2 top-2 text-[10px] font-bold text-emerald-600">%</span>
                                                    </div>
                                                    <button type="button" onClick={() => {
                                                        const newOuts = formulaForm.outputs?.filter((_, i) => i !== idx);
                                                        setFormulaForm({ ...formulaForm, outputs: newOuts });
                                                    }} className="text-slate-300 hover:text-rose-500"><X size={14} /></button>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="mt-2 text-right">
                                            <span className={`text-[10px] font-black uppercase ${(formulaForm.outputs?.reduce((acc, curr) => acc + curr.percentage, 0) || 0) > 100 ? 'text-rose-500' : 'text-slate-400'}`}>
                                                Total Agregado: {formulaForm.outputs?.reduce((acc, curr) => acc + curr.percentage, 0) || 0}%
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-3 pt-6">
                                {editingFormula && (
                                    <button type="button" onClick={() => {
                                        addToast("Deseja realmente remover esta fórmula?", 'warning', 5000, {
                                            label: 'CONFIRMAR EXCLUSÃO',
                                            onClick: () => { deleteFormula(editingFormula.id); setIsFormulaModalOpen(false); }
                                        });
                                    }} className="flex-1 py-4 bg-rose-50 text-rose-600 font-black rounded-2xl uppercase tracking-widest text-xs">Excluir</button>
                                )}
                                <button type="submit" className="flex-[2] py-4 bg-indigo-600 text-white font-black rounded-2xl shadow-lg uppercase tracking-widest text-xs">Salvar Processo</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Production;