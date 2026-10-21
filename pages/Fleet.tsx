import React, { useState, useMemo } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie
} from 'recharts';
import {
    Truck,
    Settings,
    Wrench,
    Droplets,
    Activity,
    Plus,
    Search,
    Calendar,
    ChevronRight,
    MapPin,
    PenTool,
    Fuel,
    AlertTriangle,
    CheckCircle,
    X,
    Filter,
    ArrowUpRight,
    TrendingUp,
    Gauge,
    History,
    Download,
    FileText,
    Paperclip,
    Upload,
    File,
    XCircle,
    Trash2,
    Eye,
    LayoutDashboard,
    PieChart as PieIcon,
    Save,
    Disc,
    ArrowRight,
    RefreshCw,
    Info,
    Package,
    Printer
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { FleetVehicle, MaintenanceRecord, FuelLog, Tire, TireHistory } from '../types';
import { exportToCSV } from '../utils/exportUtils';

const Fleet = () => {

    const {
        fleet, tires, inventory, addVehicle, updateVehicle, deleteVehicle, updateVehicleStatus,
        addMaintenanceRecord, deleteMaintenanceRecord, addFuelLog, deleteFuelLog,
        addTire, updateTire, deleteTire, addTireHistory, deleteTireHistory, accounts: financialAccounts,
        updateStock, purchaseOrders, addPurchaseOrder
    } = useApp();
    const { addToast } = useToast();
    const [activeTab, setActiveTab] = useState<'overview' | 'vehicles' | 'maintenance' | 'fuel' | 'tires' | 'almoxarifado'>('overview');

    // Search/Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [vehicleStatusFilter, setVehicleStatusFilter] = useState<string>('all');

    // Modals
    const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
    const [isMaintModalOpen, setIsMaintModalOpen] = useState(false);
    const [isFuelModalOpen, setIsFuelModalOpen] = useState(false);
    const [isTireModalOpen, setIsTireModalOpen] = useState(false);
    const [isTireHistoryModalOpen, setIsTireHistoryModalOpen] = useState(false);

    // Tire Layout Manager
    const [isTireLayoutOpen, setIsTireLayoutOpen] = useState(false);
    const [layoutVehicle, setLayoutVehicle] = useState<FleetVehicle | null>(null);

    // Helper para cálculo preciso de consumo de combustível e custos por veículo
    const getVehicleFuelMetrics = (vehicle: FleetVehicle) => {
        const logs = vehicle.fuelLogs || [];
        const totalLiters = logs.reduce((acc, l) => acc + (l.liters || 0), 0);
        const totalFuelCost = logs.reduce((acc, l) => acc + (l.cost || 0), 0);
        const maintTotal = (vehicle.maintenanceHistory || []).reduce((acc, m) => acc + (m.cost || 0), 0);

        // Ordenar abastecimentos cronologicamente por data e depois por hodômetro
        const sorted = [...logs].sort((a, b) => {
            const dateA = new Date(a.date).getTime() || 0;
            const dateB = new Date(b.date).getTime() || 0;
            if (dateA !== dateB) return dateA - dateB;
            return (a.km || 0) - (b.km || 0);
        });

        // Cálculo de consumo por trecho (entre abastecimentos consecutivos)
        let validDeltaKm = 0;
        let validLiters = 0;
        const logMetrics = new Map<string, { deltaKm: number; kmPerLiter: number; pricePerLiter: number }>();

        for (let i = 0; i < sorted.length; i++) {
            const current = sorted[i];
            const pricePerLiter = current.liters > 0 ? current.cost / current.liters : 0;

            if (i === 0) {
                logMetrics.set(current.id, {
                    deltaKm: 0,
                    kmPerLiter: 0,
                    pricePerLiter
                });
            } else {
                const prev = sorted[i - 1];
                const dKm = (current.km || 0) - (prev.km || 0);
                const cLiters = current.liters || 0;
                const kml = (dKm > 0 && cLiters > 0) ? Number((dKm / cLiters).toFixed(2)) : 0;

                if (dKm > 0 && cLiters > 0) {
                    validDeltaKm += dKm;
                    validLiters += cLiters;
                }

                logMetrics.set(current.id, {
                    deltaKm: Math.max(0, dKm),
                    kmPerLiter: kml,
                    pricePerLiter
                });
            }
        }

        // Consumo médio ponderado (km/L)
        let avgKmPerLiter = 0;
        if (validDeltaKm > 0 && validLiters > 0) {
            avgKmPerLiter = Number((validDeltaKm / validLiters).toFixed(2));
        } else if (sorted.length === 1 && vehicle.km > sorted[0].km && sorted[0].liters > 0) {
            const dKm = vehicle.km - sorted[0].km;
            avgKmPerLiter = Number((dKm / sorted[0].liters).toFixed(2));
            validDeltaKm = dKm;
        }

        // Custo por km (R$/KM)
        const avgPricePerLiter = totalLiters > 0 ? totalFuelCost / totalLiters : 0;
        const fuelCostPerKm = avgKmPerLiter > 0 ? (avgPricePerLiter / avgKmPerLiter) : (validDeltaKm > 0 ? totalFuelCost / validDeltaKm : 0);
        const maintCostPerKm = vehicle.km > 0 ? (maintTotal / vehicle.km) : 0;
        const totalCostPerKm = fuelCostPerKm + maintCostPerKm;

        return {
            totalLiters,
            totalFuelCost,
            maintTotal,
            totalCost: totalFuelCost + maintTotal,
            validDeltaKm,
            avgKmPerLiter,
            avgPricePerLiter,
            fuelCostPerKm: Number(fuelCostPerKm.toFixed(2)),
            totalCostPerKm: Number(totalCostPerKm.toFixed(2)),
            logMetrics
        };
    };

    // Helper para cálculo da vida útil, desgaste e sulco do pneu
    const getTireMetrics = (tire: Tire, currentVehicle?: FleetVehicle) => {
        // Se estiver montado, soma os KM rodados no veículo desde a montagem
        const runningKm = (tire.status === 'Em uso' && currentVehicle && tire.installKm !== undefined && currentVehicle.km > tire.installKm)
            ? (currentVehicle.km - tire.installKm)
            : 0;
        const totalAccumulatedKm = (tire.currentKm || 0) + runningKm;
        const maxKm = Math.max(1, tire.maxKm || 100000);
        const wearPercent = Math.min(100, Math.round((totalAccumulatedKm / maxKm) * 100));
        const remainingKm = Math.max(0, maxKm - totalAccumulatedKm);

        // Sulco do pneu em mm (novo: 16mm, limite de descarte CONTRAN: 1.6mm)
        const treadDepth = Math.max(1.6, Number((16 - ((totalAccumulatedKm / maxKm) * (16 - 1.6))).toFixed(1)));

        // Nível de criticidade
        let healthBadge: { label: string; color: string; bg: string };
        if (wearPercent >= 85 || treadDepth <= 3.0) {
            healthBadge = { label: 'Crítico / Troca', color: 'text-rose-600', bg: 'bg-rose-100 dark:bg-rose-900/30' };
        } else if (wearPercent >= 65 || treadDepth <= 5.0) {
            healthBadge = { label: 'Atenção / Rodízio', color: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-900/30' };
        } else if (wearPercent >= 30) {
            healthBadge = { label: 'Bom', color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30' };
        } else {
            healthBadge = { label: 'Excelente', color: 'text-emerald-600', bg: 'bg-emerald-100 dark:bg-emerald-900/30' };
        }

        // CPK (Custo por KM estimado - base R$ 2.400,00)
        const estimatedTireCost = 2400;
        const cpk = totalAccumulatedKm > 0 ? (estimatedTireCost / totalAccumulatedKm).toFixed(3) : '0.000';

        return {
            totalAccumulatedKm,
            runningKm,
            wearPercent,
            remainingKm,
            treadDepth,
            healthBadge,
            cpk
        };
    };

    const handleTireChange = (vehicleId: string, position: string, tireId: string) => {
        const vehicle = fleet.find(v => v.id === vehicleId);
        const today = new Date().toISOString().split('T')[0];

        // 1. Desmontar pneu se tireId estiver vazio
        if (!tireId) {
            const currentTire = tires.find(t => t.currentVehicleId === vehicleId && t.position === position);
            if (currentTire) {
                const distanceRun = (vehicle && currentTire.installKm !== undefined && vehicle.km > currentTire.installKm)
                    ? (vehicle.km - currentTire.installKm)
                    : 0;
                const newTotalKm = (currentTire.currentKm || 0) + distanceRun;

                updateTire({
                    ...currentTire,
                    currentVehicleId: undefined,
                    position: undefined,
                    installKm: undefined,
                    currentKm: newTotalKm,
                    status: newTotalKm >= currentTire.maxKm ? 'Descartado' : 'Estoque'
                });

                addTireHistory(currentTire.id, {
                    id: `H-${Date.now()}`,
                    date: today,
                    type: 'Retirada',
                    km: newTotalKm,
                    vehicleId,
                    position,
                    notes: `Desmontado de ${vehicle?.plate || vehicleId} (${position}). Rodou ${distanceRun.toLocaleString()} km nesta posição.`
                });
                addToast(`Pneu ${currentTire.serialNumber} retirado e retornado ao estoque! (${distanceRun.toLocaleString()} km rodados nesta posição)`, 'info');
            }
            return;
        }

        const newTire = tires.find(t => t.id === tireId);
        if (!newTire || !vehicle) return;

        // 2. Se a posição de destino já tem um pneu montado, desmonte-o primeiro
        const currentOccupant = tires.find(t => t.currentVehicleId === vehicleId && t.position === position);
        if (currentOccupant && currentOccupant.id !== newTire.id) {
            const occDistanceRun = (currentOccupant.installKm !== undefined && vehicle.km > currentOccupant.installKm)
                ? (vehicle.km - currentOccupant.installKm)
                : 0;
            const occTotalKm = (currentOccupant.currentKm || 0) + occDistanceRun;

            updateTire({
                ...currentOccupant,
                currentVehicleId: undefined,
                position: undefined,
                installKm: undefined,
                currentKm: occTotalKm,
                status: occTotalKm >= currentOccupant.maxKm ? 'Descartado' : 'Estoque'
            });

            addTireHistory(currentOccupant.id, {
                id: `H-${Date.now()}-occ`,
                date: today,
                type: 'Retirada',
                km: occTotalKm,
                vehicleId,
                position,
                notes: `Substituído na posição ${position} por ${newTire.serialNumber}. Rodou ${occDistanceRun.toLocaleString()} km.`
            });
        }

        // 3. Se o pneu a montar estava montado em outro veículo/posição, calcular km acumulados
        let baseKm = newTire.currentKm || 0;
        if (newTire.currentVehicleId) {
            const oldVeh = fleet.find(v => v.id === newTire.currentVehicleId);
            if (oldVeh && newTire.installKm !== undefined && oldVeh.km > newTire.installKm) {
                baseKm += (oldVeh.km - newTire.installKm);
            }
        }

        const isRotation = newTire.currentVehicleId === vehicleId;

        updateTire({
            ...newTire,
            currentVehicleId: vehicleId,
            position,
            installKm: vehicle.km,
            currentKm: baseKm,
            status: 'Em uso'
        });

        addTireHistory(newTire.id, {
            id: `H-${Date.now()}`,
            date: today,
            type: isRotation ? 'Rodízio' : 'Instalação',
            km: baseKm,
            vehicleId,
            position,
            notes: isRotation
                ? `Rodízio de posição para ${position} no veículo ${vehicle.plate}.`
                : `Montado no veículo ${vehicle.plate} (${position}) com odômetro em ${vehicle.km.toLocaleString()} km.`
        });

        addToast(`Pneu ${newTire.serialNumber} montado na posição ${position} (${vehicle.plate})!`, 'success');
    };

    // Forms
    const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
    const [newMaint, setNewMaint] = useState<Partial<MaintenanceRecord>>({
        type: 'Preventiva',
        date: new Date().toISOString().split('T')[0],
        cost: 0,
        km: 0,
        ledgerCode: '2.02.02',
        ledgerName: 'Manutenção de Frota e Peças',
        attachments: []
    });
    const [newFuel, setNewFuel] = useState<Partial<FuelLog>>({
        date: new Date().toISOString().split('T')[0],
        liters: 0,
        cost: 0,
        km: 0,
        fuelType: 'Diesel',
        ledgerCode: '2.02.01',
        ledgerName: 'Combustível e Lubrificantes (Diesel S10)',
        attachments: []
    });

    const [vehicleForm, setVehicleForm] = useState<Partial<FleetVehicle>>({
        status: 'Operacional',
        type: 'Toco',
        km: 0
    });

    const [editingVehicleId, setEditingVehicleId] = useState<string | null>(null);
    const [selectedTireId, setSelectedTireId] = useState<string | null>(null);

    const [tireForm, setTireForm] = useState<Partial<Tire>>({
        status: 'Novo',
        brand: '',
        model: '',
        size: '295/80 R22.5',
        recapCount: 0,
        currentKm: 0,
        maxKm: 100000
    });

    const filteredVehicles = fleet.filter(v => {
        const matchesSearch = v.plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
            v.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = vehicleStatusFilter === 'all' || v.status === vehicleStatusFilter;
        return matchesSearch && matchesStatus;
    });

    const vehicleCosts = useMemo(() => {
        return fleet.map(v => {
            const metrics = getVehicleFuelMetrics(v);
            return {
                id: v.id,
                modelo: v.name,
                placa: v.plate,
                tipo: v.type,
                odometro: v.km,
                totalAbastecimento: metrics.totalFuelCost,
                totalManutencao: metrics.maintTotal,
                custoTotal: metrics.totalCost,
                kmPorLitro: metrics.avgKmPerLiter > 0 ? metrics.avgKmPerLiter.toFixed(2) : 'N/D',
                custoPorKm: metrics.totalCostPerKm > 0 ? metrics.totalCostPerKm.toFixed(2) : (metrics.totalCost > 0 && v.km > 0 ? (metrics.totalCost / v.km).toFixed(2) : '0.00')
            };
        });
    }, [fleet]);

    const totalKm = useMemo(() => fleet.reduce((acc, v) => acc + (v.km || 0), 0), [fleet]);
    const operationalCount = fleet.filter(v => v.status === 'Operacional').length;

    const currentMonthStats = useMemo(() => {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        let fuel = 0;
        let maint = 0;
        let tires = 0;

        fleet.forEach(v => {
            v.fuelLogs?.forEach(l => {
                const d = new Date(l.date + 'T12:00:00'); // Ensure correct day parsing
                if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
                    fuel += l.cost;
                }
            });
            v.maintenanceHistory?.forEach(m => {
                const d = new Date(m.date + 'T12:00:00');
                if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
                    if (m.description.toLowerCase().includes('pneu') || m.type === 'Preditiva') { // Simple heuristic for tires
                        tires += m.cost;
                    } else {
                        maint += m.cost;
                    }
                }
            });
        });

        return { fuel, maint, tires, total: fuel + maint + tires };
    }, [fleet]);

    const formatBRL = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

    const handleSaveMaintenance = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedVehicleId) return;

        const record: MaintenanceRecord = {
            id: `M-${Date.now()}`,
            vehicleId: selectedVehicleId,
            date: newMaint.date || '',
            type: newMaint.type || 'Preventiva',
            description: newMaint.description || '',
            cost: Number(newMaint.cost) || 0,
            km: Number(newMaint.km) || 0,
            mechanic: newMaint.mechanic,
            attachments: newMaint.attachments,
            productId: newMaint.productId,
            productQuantity: newMaint.productQuantity,
            debitAccountId: newMaint.debitAccountId,
            ledgerCode: newMaint.ledgerCode,
            ledgerName: newMaint.ledgerName
        };

        addMaintenanceRecord(selectedVehicleId, record);
        setIsMaintModalOpen(false);
        setNewMaint({
            type: 'Preventiva',
            date: new Date().toISOString().split('T')[0],
            cost: 0,
            km: 0,
            attachments: []
        });
        addToast("Manutenção registrada e custo lançado no financeiro!", 'success');
    };

    const handleSaveVehicle = (e: React.FormEvent) => {
        e.preventDefault();
        const vehicleData = {
            ...vehicleForm,
            id: editingVehicleId || `V-${Date.now()}`,
            name: vehicleForm.name || '',
            plate: vehicleForm.plate || '',
            km: Number(vehicleForm.km) || 0,
            lastMaintenance: vehicleForm.lastMaintenance || new Date().toLocaleDateString('pt-BR')
        } as FleetVehicle;

        if (editingVehicleId) {
            updateVehicle(vehicleData);
        } else {
            addVehicle(vehicleData);
        }

        setIsVehicleModalOpen(false);
        setEditingVehicleId(null);
        setVehicleForm({ status: 'Operacional', type: 'Toco', km: 0 });
        addToast(editingVehicleId ? "Veículo atualizado!" : "Novo veículo cadastrado!", 'success');
    };

    const handleEditVehicle = (vehicle: FleetVehicle) => {
        setVehicleForm(vehicle);
        setEditingVehicleId(vehicle.id);
        setIsVehicleModalOpen(true);
    };

    const handleDelete = (id: string) => {
        addToast("Tem certeza que deseja remover este veículo? Esta ação não pode ser desfeita.", 'warning', 10000, {
            label: 'EXCLUIR',
            onClick: () => deleteVehicle(id)
        });
    };

    const handleSaveFuel = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedVehicleId) return;

        const vehicle = fleet.find(v => v.id === selectedVehicleId);
        const fuelKm = Number(newFuel.km) || (vehicle?.km || 0);
        const liters = Number(newFuel.liters) || 0;
        const cost = Number(newFuel.cost) || 0;
        const pricePerLiter = liters > 0 ? Number((cost / liters).toFixed(2)) : 0;

        const log: FuelLog = {
            id: `F-${Date.now()}`,
            vehicleId: selectedVehicleId,
            date: newFuel.date || new Date().toISOString().split('T')[0],
            liters,
            cost,
            km: fuelKm,
            fuelType: newFuel.fuelType || 'Diesel',
            attachments: newFuel.attachments,
            ledgerCode: newFuel.ledgerCode,
            ledgerName: newFuel.ledgerName,
            pricePerLiter,
            isPaid: true
        };

        addFuelLog(selectedVehicleId, log);

        // Se o hodômetro lançado no abastecimento for maior que o atual do veículo, atualiza o veículo
        if (vehicle && fuelKm > vehicle.km) {
            updateVehicle({ ...vehicle, km: fuelKm });
        }

        setIsFuelModalOpen(false);
        setNewFuel({
            date: new Date().toISOString().split('T')[0],
            liters: 0,
            cost: 0,
            km: 0,
            fuelType: 'Diesel',
            attachments: []
        });
        addToast("Abastecimento registrado com sucesso e odômetro atualizado!", 'success');
    };

    const handleSaveTire = (e: React.FormEvent) => {
        e.preventDefault();

        const newTireId = selectedTireId || `T-${Date.now()}`;

        // Handle Stock Deduction logic (Only for new tires coming from stock)
        if (!selectedTireId && tireForm.stockItemId) {
            updateStock(tireForm.stockItemId, -1, `Uso Interno - Frota (Pneu ${newTireId})`, newTireId);
        }

        const tireData: Tire = {
            ...tireForm,
            id: newTireId,
            currentKm: Number(tireForm.currentKm) || 0,
            maxKm: Number(tireForm.maxKm) || 100000,
            recapCount: Number(tireForm.recapCount) || 0,
            history: tireForm.history || []
        } as Tire;

        if (selectedTireId) {
            updateTire(tireData);
        } else {
            addTire(tireData);
        }
        setIsTireModalOpen(false);
        setSelectedTireId(null);
        setTireForm({ status: 'Novo', brand: '', model: '', size: '295/80 R22.5', recapCount: 0, currentKm: 0, maxKm: 100000 });
        addToast(selectedTireId ? "Pneu atualizado!" : "Pneu cadastrado com sucesso!", 'success');
    };

    const [historyEntry, setHistoryEntry] = useState<Partial<TireHistory>>({
        type: 'Rodízio',
        date: new Date().toISOString().split('T')[0],
        km: 0
    });

    const handleSaveTireHistory = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTireId) return;

        const entry: TireHistory = {
            id: `H-${Date.now()}`,
            date: historyEntry.date || '',
            type: historyEntry.type as any,
            km: Number(historyEntry.km) || 0,
            vehicleId: historyEntry.vehicleId,
            position: historyEntry.position,
            notes: historyEntry.notes
        };

        addTireHistory(selectedTireId, entry);
        setIsTireHistoryModalOpen(false);
        setHistoryEntry({ type: 'Rodízio', date: new Date().toISOString().split('T')[0], km: 0 });
        addToast("Histórico registrado e status do pneu atualizado!", 'success');
    };

    return (
        <div className="flex flex-col gap-6 animate-in fade-in duration-500 pb-10">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2 tracking-tight">
                        <div className="p-1.5 bg-teal-600 rounded-xl text-white shadow-lg shadow-teal-600/20">
                            <Truck size={20} />
                        </div>
                        Central de Frota
                    </h1>
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0">

                    <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border dark:border-slate-700 whitespace-nowrap">
                        {['overview', 'vehicles', 'maintenance', 'fuel', 'tires', 'almoxarifado'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab as any)}
                                className={`px-3 py-1.5 text-[10px] font-black rounded-lg transition-all uppercase ${activeTab === tab ? 'bg-white dark:bg-slate-700 text-teal-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                {tab === 'overview' ? 'Resumo' : tab === 'vehicles' ? 'Veículos' : tab === 'maintenance' ? 'Manut.' : tab === 'fuel' ? 'Abast.' : tab === 'tires' ? 'Pneus' : 'Almox.'}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {activeTab === 'overview' && (
                <>
                    {/* KPI Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                            { label: 'DISPONIBILIDADE', value: `${operationalCount}/${fleet.length}`, sub: 'Veículos Ativos', icon: <Activity />, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/10' },
                            { label: 'KM TOTAL RODADO', value: totalKm.toLocaleString(), sub: 'Distância Acumulada', icon: <Gauge />, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-900/10' },
                            { label: 'MANUTENÇÃO PENDENTE', value: fleet.filter(v => v.status === 'Manutenção').length, sub: 'Intervenções em curso', icon: <Wrench />, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/10' },
                            { label: 'CUSTO MENSAL ESTIMADO', value: formatBRL(currentMonthStats.total), sub: `Base: ${new Date().toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}`, icon: <TrendingUp />, color: 'text-teal-500', bg: 'bg-teal-50 dark:bg-teal-900/10' },
                        ].map((kpi, i) => (
                            <div key={i} className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 hover:scale-[1.02] transition-transform cursor-default">
                                <div className="flex justify-between items-start mb-6">
                                    <div className={`p-3 rounded-2xl ${kpi.bg} ${kpi.color}`}>
                                        {kpi.icon}
                                    </div>
                                    <ArrowUpRight size={16} className="text-slate-300" />
                                </div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{kpi.label}</p>
                                <h3 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">{kpi.value}</h3>
                                <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase">{kpi.sub}</p>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        {/* Alertas - Col 1 */}
                        <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 h-[320px] flex flex-col">
                            <h3 className="text-sm font-black text-slate-900 dark:text-white mb-4 uppercase tracking-tight flex items-center gap-2 shrink-0">
                                <AlertTriangle className="text-orange-500" size={16} /> Alertas ({fleet.filter(v => v.km > 10000).length + tires.filter(t => { const v = fleet.find(veh => veh.id === t.currentVehicleId); const m = getTireMetrics(t, v); return m.wearPercent >= 85 || m.treadDepth <= 3.0 || (t.status === 'Em uso' && m.runningKm > 10000); }).length})
                            </h3>
                            <div className="space-y-3 overflow-y-auto pr-1 flex-1 custom-scrollbar">
                                {fleet.map(v => {
                                    const needsMaint = v.km > 10000;
                                    return needsMaint ? (
                                        <div key={v.id} className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-800 rounded-xl">
                                            <div>
                                                <p className="font-black text-[10px] text-slate-800 dark:text-slate-200 uppercase">{v.plate}</p>
                                                <p className="text-[9px] font-bold text-orange-700">Prev. Necessária ({v.km.toLocaleString()} KM)</p>
                                            </div>
                                            <button onClick={() => { setSelectedVehicleId(v.id); setActiveTab('maintenance'); setIsMaintModalOpen(true); }} className="p-1.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700" title="Criar Ordem de Manutenção"><Wrench size={12} /></button>
                                        </div>
                                    ) : null;
                                })}
                                {tires.map(t => {
                                    const v = fleet.find(veh => veh.id === t.currentVehicleId);
                                    const m = getTireMetrics(t, v);
                                    if (m.wearPercent >= 85 || m.treadDepth <= 3.0) {
                                        return (
                                            <div key={t.id} className="flex items-center justify-between p-3 bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-800 rounded-xl">
                                                <div>
                                                    <p className="font-black text-[10px] text-slate-800 dark:text-slate-200 uppercase">Pneu {t.serialNumber} {v ? `(${v.plate})` : ''}</p>
                                                    <p className="text-[9px] font-bold text-rose-700">Troca Crítica • {m.wearPercent}% Desgaste • Sulco {m.treadDepth}mm</p>
                                                </div>
                                                <button onClick={() => setActiveTab('tires')} className="p-1.5 bg-rose-600 text-white rounded-lg hover:bg-rose-700" title="Ver Inventário de Pneus"><Disc size={12} /></button>
                                            </div>
                                        );
                                    }
                                    if (t.status === 'Em uso' && m.runningKm > 10000) {
                                        return (
                                            <div key={t.id} className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800 rounded-xl">
                                                <div>
                                                    <p className="font-black text-[10px] text-slate-800 dark:text-slate-200 uppercase">Pneu {t.serialNumber} ({v?.plate || 'Frota'})</p>
                                                    <p className="text-[9px] font-bold text-amber-700">Sugerir Rodízio • {m.runningKm.toLocaleString()} km no mesmo eixo</p>
                                                </div>
                                                <button onClick={() => { if (v) { setSelectedVehicleId(v.id); setLayoutVehicle(v); setIsTireLayoutOpen(true); } else { setActiveTab('tires'); } }} className="p-1.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700" title="Fazer Rodízio"><RefreshCw size={12} /></button>
                                            </div>
                                        );
                                    }
                                    return null;
                                })}
                                {fleet.every(v => v.km <= 10000) && tires.every(t => {
                                    const v = fleet.find(veh => veh.id === t.currentVehicleId);
                                    const m = getTireMetrics(t, v);
                                    return m.wearPercent < 85 && m.treadDepth > 3.0 && !(t.status === 'Em uso' && m.runningKm > 10000);
                                }) && (
                                    <div className="flex flex-col items-center justify-center h-full text-slate-400">
                                        <CheckCircle size={32} className="opacity-20 mb-2" />
                                        <p className="text-[10px] font-bold uppercase">Tudo certo com a frota e pneus!</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Chart - Col 2 */}
                        <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 h-[320px] flex flex-col">
                            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2 shrink-0">
                                <PieIcon size={16} /> Custos do Mês
                            </h3>
                            <div className="flex-1 min-h-0">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={[{ name: 'Diesel', value: currentMonthStats.fuel }, { name: 'Manut.', value: currentMonthStats.maint }, { name: 'Pneus', value: currentMonthStats.tires }]} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={5} dataKey="value">
                                            <Cell fill="#0d9488" /><Cell fill="#0ea5e9" /><Cell fill="#f43f5e" />
                                        </Pie>
                                        <Tooltip formatter={(value: number) => formatBRL(value)} contentStyle={{ borderRadius: '12px', border: 'none', backgroundColor: '#1e293b', color: '#fff', fontSize: '10px' }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="flex justify-center gap-3 mt-2 shrink-0 text-[9px] font-black uppercase">
                                <div className="text-teal-600 flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-teal-600"></div> Diesel</div>
                                <div className="text-cyan-600 flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-cyan-600"></div> Manut.</div>
                                <div className="text-rose-600 flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-rose-600"></div> Pneus</div>
                            </div>
                        </div>

                        {/* KPI - Col 3 */}
                        <div className="bg-slate-900 p-6 rounded-3xl shadow-2xl text-white relative overflow-hidden flex flex-col justify-center h-[320px]">
                            <div className="absolute top-0 right-0 p-8 opacity-5 grayscale"><Activity size={150} /></div>
                            <h3 className="text-xl font-black mb-1 leading-tight relative z-10">Disponibilidade</h3>
                            <p className="text-teal-400 text-[9px] font-black uppercase tracking-widest mb-6 relative z-10">Performance Global</p>

                            <div className="space-y-6 relative z-10">
                                <div className="flex justify-between items-end">
                                    <p className="text-5xl font-black">{(operationalCount / Math.max(1, fleet.length) * 100).toFixed(0)}%</p>
                                    <div className="text-right">
                                        <p className="text-[10px] font-bold text-white/30 uppercase">Meta: 95%</p>
                                    </div>
                                </div>
                                <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
                                    <div className="h-full bg-teal-500 rounded-full shadow-[0_0_15px_rgba(20,184,166,0.5)]" style={{ width: `${(operationalCount / Math.max(1, fleet.length) * 100)}%` }}></div>
                                </div>
                                <div className="grid grid-cols-2 gap-3 mt-4">
                                    <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                                        <p className="text-[9px] font-black text-white/40 uppercase mb-0.5">Tempo Médio</p>
                                        <p className="text-lg font-bold">4.2 <span className="text-[9px] opacity-50">dias</span></p>
                                    </div>
                                    <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                                        <p className="text-[9px] font-black text-white/40 uppercase mb-0.5">Custo/KM</p>
                                        <p className="text-lg font-bold">R$ 1,45</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Consolidated Cost Report Table */}
                    <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden mt-8">
                        <div className="p-6 border-b dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                            <div>
                                <h3 className="font-black text-lg text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
                                    <FileText className="text-teal-600" size={20} />
                                    Relatório Consolidado de Custos por Ativo
                                </h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Visão agregada de gastos operacionais e manutenção</p>
                            </div>
                            <button
                                onClick={() => exportToCSV(vehicleCosts, 'Relatorio_Consolidado_Frota')}
                                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white font-black rounded-xl text-[10px] uppercase shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-all"
                            >
                                <Download size={14} /> Exportar Consolidado
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 dark:bg-gray-800 text-[10px] font-black text-slate-400 uppercase border-b dark:border-gray-700">
                                    <tr>
                                        <th className="px-6 py-4">Veículo / Placa</th>
                                        <th className="px-6 py-4 text-right">Manutenção</th>
                                        <th className="px-6 py-4 text-right">Abastecimento</th>
                                        <th className="px-6 py-4 text-right">Custo Total</th>
                                        <th className="px-6 py-4 text-center">Consumo Médio</th>
                                        <th className="px-6 py-4 text-right">Custo/KM</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y dark:divide-gray-700">
                                    {vehicleCosts.map((vc, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-teal-900/10 transition-all group">
                                            <td className="px-6 py-4">
                                                <p className="font-black text-slate-900 dark:text-white uppercase text-xs">{vc.modelo}</p>
                                                <p className="text-[10px] text-teal-600 font-bold">{vc.placa}</p>
                                            </td>
                                            <td className="px-6 py-4 text-right font-bold text-slate-600">{formatBRL(vc.totalManutencao)}</td>
                                            <td className="px-6 py-4 text-right font-bold text-slate-600">{formatBRL(vc.totalAbastecimento)}</td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="px-3 py-1 bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 font-black rounded-lg">
                                                    {formatBRL(vc.custoTotal)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center font-mono text-xs">{vc.kmPorLitro} KM/L</td>
                                            <td className="px-6 py-4 text-right font-black text-slate-800 dark:text-slate-200">R$ {vc.custoPorKm}</td>
                                        </tr>
                                    ))}
                                    {vehicleCosts.length === 0 && (
                                        <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic font-medium uppercase text-xs tracking-widest">Aguardando inserção de ativos...</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}

            {activeTab === 'vehicles' && (
                <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700">
                    <div className="p-6 border-b dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-800/50">
                        <div className="flex items-center gap-3">
                            <Truck className="text-teal-600" />
                            <h3 className="font-black text-lg text-slate-900 dark:text-white">Frota de Veículos e Máquinas</h3>
                        </div>
                        <div className="flex gap-4">
                            <div className="relative group">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input
                                    type="text"
                                    placeholder="Modelo ou Placa..."
                                    className="pl-9 pr-4 py-2.5 bg-white dark:bg-gray-700 border-none rounded-xl text-xs font-bold shadow-sm w-64"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <button
                                onClick={() => exportToCSV(filteredVehicles, 'Frota_Veiculos')}
                                className="p-2.5 bg-white dark:bg-gray-700 rounded-xl shadow-sm border dark:border-gray-600 text-slate-400 hover:text-emerald-500 transition-colors"
                                title="Exportar Excel"
                            >
                                <Download size={18} />
                            </button>
                            <div className="flex items-center gap-1.5 bg-white dark:bg-gray-700 rounded-xl px-2.5 py-1 shadow-sm border dark:border-gray-600">
                                <Filter size={14} className="text-slate-400" />
                                <select
                                    value={vehicleStatusFilter}
                                    onChange={e => setVehicleStatusFilter(e.target.value)}
                                    className="bg-transparent text-xs font-bold text-slate-600 dark:text-slate-200 outline-none cursor-pointer py-1"
                                    title="Filtrar por Status Operacional"
                                >
                                    <option value="all">Todos os Status</option>
                                    <option value="Operacional">Operacional</option>
                                    <option value="Em Manutenção">Em Manutenção</option>
                                    <option value="Inativo">Inativo</option>
                                </select>
                            </div>

                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-6 animate-in slide-in-from-bottom-4 duration-500">
                        {filteredVehicles.map(v => {
                            // Calculate metrics for this vehicle
                            const fuelLogs = v.fuelLogs || [];
                            const maintHistory = v.maintenanceHistory || [];
                            const fuelMetrics = getVehicleFuelMetrics(v);
                            const totalLiters = fuelMetrics.totalLiters;
                            const avgConsumption = fuelMetrics.avgKmPerLiter > 0 ? `${fuelMetrics.avgKmPerLiter.toFixed(1)} km/l` : 'N/D';
                            const sortedFuelLogs = [...fuelLogs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                            const lastRefuel = sortedFuelLogs[0];
                            const oilChanges = maintHistory.filter(m =>
                                m.type?.toLowerCase().includes('óleo') ||
                                m.type?.toLowerCase().includes('oleo') ||
                                m.description?.toLowerCase().includes('troca de óleo') ||
                                m.description?.toLowerCase().includes('troca de oleo')
                            ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                            const lastOilChange = oilChanges[0];
                            const oilChangeInterval = 10000;
                            const lastOilKm = lastOilChange?.km || 0;
                            const nextOilKm = lastOilKm + oilChangeInterval;
                            const kmUntilOil = nextOilKm - v.km;
                            const oilChangeUrgent = kmUntilOil < 1000;
                            const oilChangeWarning = kmUntilOil < 2000;

                            // Calculate monthly spending (last 30 days)
                            const now = new Date();
                            const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

                            const parseDate = (dateStr: string) => {
                                if (!dateStr) return new Date(0);
                                const parts = dateStr.split('/');
                                if (parts.length === 3) {
                                    return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
                                }
                                return new Date(dateStr);
                            };

                            const monthlyFuelCost = fuelLogs
                                .filter(log => parseDate(log.date) >= thirtyDaysAgo)
                                .reduce((acc, log) => acc + (log.cost || 0), 0);

                            const monthlyMaintCost = maintHistory
                                .filter(m => parseDate(m.date) >= thirtyDaysAgo)
                                .reduce((acc, m) => acc + (m.cost || 0), 0);

                            const formatMoney = (val: number) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

                            return (
                                <div key={v.id} className="p-3 rounded-2xl border border-slate-100 dark:border-slate-700/50 bg-white dark:bg-slate-800/80 hover:shadow-lg hover:scale-[1.01] hover:border-teal-500/30 transition-all duration-300 group relative overflow-hidden">
                                    {/* Header - Compact */}
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-2">
                                            <div className="w-7 h-7 bg-slate-50 dark:bg-slate-700 rounded-lg flex items-center justify-center text-slate-400 group-hover:bg-teal-50 group-hover:text-teal-600 transition-all">
                                                {v.type === 'Caminhão' ? <Truck size={14} /> : <Settings size={14} />}
                                            </div>
                                            <div>
                                                <h4 className="font-black text-[10px] text-slate-800 dark:text-white uppercase leading-tight truncate max-w-[90px]">{v.name}</h4>
                                                <p className="text-[9px] font-black text-teal-600">{v.plate}</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-1">
                                            <button onClick={() => handleEditVehicle(v)} className="p-1 text-slate-400 hover:text-teal-600 rounded transition-colors"><Settings size={12} /></button>
                                            <button onClick={() => handleDelete(v.id)} className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"><Trash2 size={12} /></button>
                                        </div>
                                    </div>

                                    {/* Status Badge */}
                                    <div className="mb-2">
                                        <select
                                            className={`w-full py-0.5 px-2 text-[8px] font-black uppercase rounded-lg border cursor-pointer outline-none transition-all ${v.status === 'Operacional' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
                                                v.status === 'Manutenção' ? 'bg-amber-50 border-amber-200 text-amber-700' :
                                                    'bg-slate-50 border-slate-200 text-slate-500'
                                                }`}
                                            value={v.status}
                                            onChange={(e) => updateVehicleStatus(v.id, e.target.value as any)}
                                        >
                                            <option value="Operacional">🟢 Operacional</option>
                                            <option value="Manutenção">🟡 Manutenção</option>
                                            <option value="Parado">⚫ Parado</option>
                                        </select>
                                    </div>

                                    {/* Tire Schematic with Integrated Metrics */}
                                    <div className="relative h-[160px] bg-slate-100 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-600 overflow-hidden">
                                        {/* Chassis Line */}
                                        <div className="absolute top-2 bottom-2 left-1/2 w-10 -translate-x-1/2 border-x border-slate-300 dark:border-slate-600"></div>

                                        {/* Odometer - Top Center */}
                                        <div className="absolute top-1 left-1/2 -translate-x-1/2 bg-teal-600 text-white px-2 py-0.5 rounded z-20 shadow-lg">
                                            <span className="text-[8px] font-black">{v.km.toLocaleString()} KM</span>
                                        </div>

                                        {/* Left Side Metrics */}
                                        <div className="absolute left-1 top-6 w-[45px] flex flex-col gap-1 z-10">
                                            <div className="bg-emerald-500 text-white p-1 rounded-lg text-center shadow-md mb-1">
                                                <p className="text-[5px] font-bold uppercase leading-none opacity-90">Consumo</p>
                                                <p className="text-[8px] font-black leading-tight">{avgConsumption}</p>
                                            </div>
                                            <div className="bg-cyan-500 text-white p-1 rounded-lg text-center shadow-md">
                                                <p className="text-[5px] font-bold uppercase leading-none opacity-90">Abastec.</p>
                                                <p className="text-[7px] font-black leading-tight truncate">{lastRefuel ? lastRefuel.date.split('/').slice(0, 2).join('/') : 'N/A'}</p>
                                            </div>
                                        </div>

                                        {/* Right Side Metrics */}
                                        <div className="absolute right-1 top-6 w-[45px] flex flex-col gap-1 z-10">
                                            <div className="bg-amber-500 text-white p-1 rounded-lg text-center shadow-md mb-1">
                                                <p className="text-[5px] font-bold uppercase leading-none opacity-90">Óleo</p>
                                                <p className="text-[7px] font-black leading-tight truncate">{lastOilChange ? lastOilChange.date.split('/').slice(0, 2).join('/') : 'N/A'}</p>
                                            </div>
                                            <div className={`p-1 rounded-lg text-center text-white shadow-md ${oilChangeUrgent ? 'bg-rose-500' : oilChangeWarning ? 'bg-orange-500' : 'bg-slate-600'}`}>
                                                <p className="text-[5px] font-bold uppercase leading-none opacity-90">Próx.</p>
                                                <p className="text-[7px] font-black leading-tight">{lastOilChange ? `${Math.round(nextOilKm / 1000)}k` : 'N/A'}</p>
                                            </div>
                                        </div>

                                        {/* Cabin Indicator */}
                                        {v.type !== 'Carreta LS' && (
                                            <div className="absolute top-6 left-1/2 -translate-x-1/2 w-10 h-8 bg-slate-200 dark:bg-slate-700/50 rounded-lg border border-slate-300 dark:border-slate-600 flex items-center justify-center z-0">
                                                <span className="text-[5px] font-black text-slate-400 uppercase">Cabine</span>
                                            </div>
                                        )}

                                        {/* Dynamic Tire Slots */}
                                        {(() => {
                                            const vSlots: any[] = [];
                                            const type = v.type;
                                            const isCarreta = type === 'Carreta LS';
                                            const isTruck = type === 'Truck';

                                            if (isCarreta) {
                                                [1, 2, 3].forEach((axle, idx) => {
                                                    const topPos = 30 + (idx * 30);
                                                    vSlots.push(
                                                        { id: `E${axle}_LE_EXT`, style: { top: `${topPos}px`, left: 'calc(50% - 42px)' } },
                                                        { id: `E${axle}_LE_INT`, style: { top: `${topPos}px`, left: 'calc(50% - 24px)' } },
                                                        { id: `E${axle}_LD_INT`, style: { top: `${topPos}px`, left: 'calc(50% + 12px)' } },
                                                        { id: `E${axle}_LD_EXT`, style: { top: `${topPos}px`, left: 'calc(50% + 30px)' } }
                                                    );
                                                });
                                            } else {
                                                vSlots.push(
                                                    { id: 'E1_LE', style: { top: '30px', left: 'calc(50% - 30px)' } },
                                                    { id: 'E1_LD', style: { top: '30px', left: 'calc(50% + 18px)' } }
                                                );
                                                const a2Top = isTruck ? 75 : 85;
                                                vSlots.push(
                                                    { id: 'E2_LE_EXT', style: { top: `${a2Top}px`, left: 'calc(50% - 42px)' } },
                                                    { id: 'E2_LE_INT', style: { top: `${a2Top}px`, left: 'calc(50% - 24px)' } },
                                                    { id: 'E2_LD_INT', style: { top: `${a2Top}px`, left: 'calc(50% + 12px)' } },
                                                    { id: 'E2_LD_EXT', style: { top: `${a2Top}px`, left: 'calc(50% + 30px)' } }
                                                );
                                                if (isTruck) {
                                                    const a3Top = 105;
                                                    vSlots.push(
                                                        { id: 'E3_LE_EXT', style: { top: `${a3Top}px`, left: 'calc(50% - 42px)' } },
                                                        { id: 'E3_LE_INT', style: { top: `${a3Top}px`, left: 'calc(50% - 24px)' } },
                                                        { id: 'E3_LD_INT', style: { top: `${a3Top}px`, left: 'calc(50% + 12px)' } },
                                                        { id: 'E3_LD_EXT', style: { top: `${a3Top}px`, left: 'calc(50% + 30px)' } }
                                                    );
                                                }
                                            }

                                            return vSlots.map(slot => {
                                                const mountedTire = tires.find(t => t.currentVehicleId === v.id && t.position === slot.id);
                                                return (
                                                    <div key={slot.id} className="absolute z-10" style={slot.style}>
                                                        <div className={`w-4 h-8 rounded border shadow-sm transition-all flex items-center justify-center cursor-pointer relative ${mountedTire
                                                            ? 'bg-slate-800 border-slate-900 text-white hover:bg-teal-600'
                                                            : 'bg-white border-dashed border-slate-400 hover:border-teal-500'
                                                            }`}>
                                                            {mountedTire ? (
                                                                <span className="text-[5px] font-bold rotate-90 whitespace-nowrap">{mountedTire.serialNumber?.slice(-4)}</span>
                                                            ) : <Plus size={6} className="text-slate-300" />}
                                                            <select
                                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                                value={mountedTire?.id || ''}
                                                                onChange={(e) => handleTireChange(v.id, slot.id, e.target.value)}
                                                            >
                                                                <option value="">Vazio</option>
                                                                {tires.filter(t => t.status === 'Novo' || t.status === 'Estoque' || t.status === 'Recapagem' || t.id === mountedTire?.id).map(t => (
                                                                    <option key={t.id} value={t.id}>{t.serialNumber} ({t.brand})</option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                    </div>
                                                );
                                            });
                                        })()}

                                        {/* Bottom Monthly Spending Bar */}
                                        <div className="absolute bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-sm p-1.5 flex justify-between items-center gap-2">
                                            {/* Monthly Fuel Cost */}
                                            <div className="flex items-center gap-1.5 bg-blue-600/90 text-white px-2 py-1 rounded-lg">
                                                <Droplets size={10} className="opacity-80" />
                                                <div className="text-left">
                                                    <p className="text-[6px] font-bold uppercase leading-none opacity-75">Comb/Mês</p>
                                                    <p className="text-[8px] font-black leading-tight">{formatMoney(monthlyFuelCost)}</p>
                                                </div>
                                            </div>
                                            {/* Monthly Maintenance Cost */}
                                            <div className="flex items-center gap-1.5 bg-purple-600/90 text-white px-2 py-1 rounded-lg">
                                                <Wrench size={10} className="opacity-80" />
                                                <div className="text-right">
                                                    <p className="text-[6px] font-bold uppercase leading-none opacity-75">Manut/Mês</p>
                                                    <p className="text-[8px] font-black leading-tight">{formatMoney(monthlyMaintCost)}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    {/* Action Buttons - Compact */}
                                    <div className="flex gap-1 mt-2">
                                        <button
                                            onClick={() => { setSelectedVehicleId(v.id); setIsMaintModalOpen(true); }}
                                            className="flex-1 py-1 bg-slate-50 dark:bg-slate-700 hover:bg-teal-600 hover:text-white rounded-lg text-[8px] font-black uppercase transition-all flex items-center justify-center gap-1"
                                        >
                                            <Wrench size={10} /> Manut.
                                        </button>
                                        <button
                                            onClick={() => { setSelectedVehicleId(v.id); setIsFuelModalOpen(true); }}
                                            className="flex-1 py-1 bg-slate-50 dark:bg-slate-700 hover:bg-emerald-600 hover:text-white rounded-lg text-[8px] font-black uppercase transition-all flex items-center justify-center gap-1"
                                        >
                                            <Droplets size={10} /> Abast.
                                        </button>
                                        <button
                                            onClick={() => { setSelectedVehicleId(v.id); setLayoutVehicle(v); setIsTireLayoutOpen(true); }}
                                            className="flex-1 py-1 bg-slate-50 dark:bg-slate-700 hover:bg-indigo-600 hover:text-white rounded-lg text-[8px] font-black uppercase transition-all flex items-center justify-center gap-1"
                                            title="Mapa de Pneus Detalhado"
                                        >
                                            <Disc size={10} /> Pneus
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {activeTab === 'maintenance' && (
                <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
                    <div className="p-6 border-b dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                        <div className="flex items-center gap-3">
                            <Settings className="text-teal-600" />
                            <h3 className="font-black text-lg text-slate-900 dark:text-white uppercase tracking-tight">Histórico de Ordens de Manutenção</h3>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => exportToCSV(fleet.flatMap(v => v.maintenanceHistory || []), 'Historico_Manutencao')}
                                className="p-2 bg-white dark:bg-slate-700 text-slate-400 hover:text-emerald-500 rounded-xl shadow-sm border dark:border-slate-600 transition-colors"
                            >
                                <Download size={16} />
                            </button>
                            <button
                                onClick={() => setIsMaintModalOpen(true)}
                                className="px-4 py-2 bg-teal-600 text-white font-black rounded-xl text-xs uppercase shadow-lg shadow-teal-600/20 flex items-center gap-1.5"
                            >
                                <Plus size={14} /> Nova Ordem de Manutenção
                            </button>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 dark:bg-gray-800 text-[10px] font-black text-slate-400 uppercase border-b dark:border-gray-700">
                                <tr>
                                    <th className="px-6 py-4 text-center">Data</th>
                                    <th className="px-6 py-4">Veículo</th>
                                    <th className="px-6 py-4">Serviço / Plano de Contas</th>
                                    <th className="px-6 py-4 text-right">KM</th>
                                    <th className="px-6 py-4 text-right">Custo</th>
                                    <th className="px-6 py-4 text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y dark:divide-gray-700">
                                {fleet.flatMap(v => v.maintenanceHistory || []).sort((a, b) => b.date.localeCompare(a.date)).map(m => {
                                    const veh = fleet.find(v => v.id === m.vehicleId);
                                    return (
                                        <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-teal-900/10 transition-all group">
                                            <td className="px-6 py-5 text-center font-bold text-slate-500">{m.date}</td>
                                            <td className="px-6 py-5">
                                                <p className="font-black text-slate-900 dark:text-white uppercase text-xs">{veh?.name}</p>
                                                <p className="text-[10px] text-teal-600 font-bold">{veh?.plate}</p>
                                            </td>
                                            <td className="px-6 py-5">
                                                <p className="font-bold text-slate-800 dark:text-slate-200 leading-tight flex items-center gap-1.5">
                                                    {m.description}
                                                    {m.attachments && m.attachments.length > 0 && <Paperclip size={12} className="text-teal-500" />}
                                                </p>
                                                <div className="flex items-center gap-1.5 mt-1">
                                                    <span className="text-[9px] font-black text-slate-400 bg-slate-100 dark:bg-slate-700 px-1 rounded italic">{m.ledgerCode}</span>
                                                    <span className="text-[10px] font-black text-teal-600 uppercase tracking-widest">{m.ledgerName || m.type}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-right font-mono text-xs">{m.km.toLocaleString()}</td>
                                            <td className="px-6 py-5 text-right font-black text-slate-900 dark:text-white">{formatBRL(m.cost)}</td>
                                            <td className="px-6 py-5 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <span className="px-3 py-1 bg-green-100 text-green-700 text-[10px] font-black rounded-full uppercase">Concluído</span>
                                                    <button
                                                        onClick={() => deleteMaintenanceRecord(m.vehicleId, m.id)}
                                                        className="text-slate-400 hover:text-rose-600 p-1"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            const printWindow = window.open('', '_blank');
                                                            if (printWindow) {
                                                                printWindow.document.write(`
                                                                 <html>
                                                                    <head>
                                                                       <title>Ordem de Manutenção #${m.id}</title>
                                                                       <style>
                                                                          body { font-family: sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; }
                                                                          .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #0d9488; padding-bottom: 15px; }
                                                                          .row { display: flex; justify-content: space-between; margin-bottom: 10px; border-bottom: 1px dashed #eee; padding-bottom: 5px; }
                                                                          .label { font-weight: bold; color: #555; }
                                                                          .cost { font-size: 1.5em; font-weight: bold; color: #0d9488; text-align: center; margin: 20px 0; }
                                                                          .footer { margin-top: 30px; text-align: center; font-size: 11px; color: #999; }
                                                                       </style>
                                                                    </head>
                                                                    <body>
                                                                       <div class="header">
                                                                          <h2>Ordem de Manutenção</h2>
                                                                          <p>InfraCore Fleet Management</p>
                                                                       </div>
                                                                       <div class="content">
                                                                          <div class="row"><span class="label">Data:</span> <span>${m.date}</span></div>
                                                                          <div class="row"><span class="label">Veículo:</span> <span>${veh?.name} (${veh?.plate})</span></div>
                                                                          <div class="row"><span class="label">KM:</span> <span>${m.km.toLocaleString()}</span></div>
                                                                          <div class="row"><span class="label">Tipo:</span> <span>${m.type}</span></div>
                                                                          <div class="row"><span class="label">Classificação:</span> <span>${m.ledgerCode} - ${m.ledgerName}</span></div>
                                                                          
                                                                          <div style="margin-top: 20px;">
                                                                             <div class="label">Descrição do Serviço:</div>
                                                                             <div style="padding: 10px; background: #f8fafc; border-radius: 8px; margin-top: 5px;">${m.description}</div>
                                                                          </div>

                                                                          <div class="cost">Valor Total: ${formatBRL(m.cost)}</div>
                                                                       </div>
                                                                       <div class="footer">
                                                                          <p>Documento processado em ${new Date().toLocaleString('pt-BR')}</p>
                                                                          <p>Assinatura do Responsável: __________________________</p>
                                                                       </div>
                                                                       <script>window.print();</script>
                                                                    </body>
                                                                 </html>
                                                              `);
                                                                printWindow.document.close();
                                                            }
                                                        }}
                                                        className="text-slate-400 hover:text-teal-600 p-1"
                                                        title="Imprimir Ordem"
                                                    >
                                                        <Printer size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {fleet.every(v => !v.maintenanceHistory?.length) && (
                                    <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic font-medium uppercase text-xs tracking-widest">Aguardando comando de manutenção...</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )
            }

            {
                activeTab === 'fuel' && (
                    <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
                        <div className="p-6 border-b dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                            <div className="flex items-center gap-3">
                                <History className="text-teal-600" />
                                <h3 className="font-black text-lg text-slate-900 dark:text-white uppercase tracking-tight">Registro de Abastecimentos</h3>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => exportToCSV(fleet.flatMap(v => v.fuelLogs || []), 'Historico_Abastecimento')}
                                    className="p-2 bg-white dark:bg-slate-700 text-slate-400 hover:text-emerald-500 rounded-xl shadow-sm border dark:border-slate-600 transition-colors"
                                >
                                    <Download size={16} />
                                </button>
                                <button onClick={() => setIsFuelModalOpen(true)} className="px-4 py-2 bg-teal-600 text-white font-black rounded-xl text-xs uppercase shadow-lg shadow-teal-600/20">Registrar Ticket</button>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 dark:bg-gray-800 text-[10px] font-black text-slate-400 uppercase border-b dark:border-gray-700">
                                    <tr>
                                        <th className="px-6 py-4">Data</th>
                                        <th className="px-6 py-4">Veículo / Classificação</th>
                                        <th className="px-6 py-4 text-center">Litragem</th>
                                        <th className="px-6 py-4 text-right">Preço Un.</th>
                                        <th className="px-6 py-4 text-right">Total Pago</th>
                                        <th className="px-6 py-4 text-center">Consumo Trecho</th>
                                        <th className="px-6 py-4 text-right">KM</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y dark:divide-gray-700">
                                    {fleet.flatMap(v => v.fuelLogs || []).sort((a, b) => b.date.localeCompare(a.date)).map(l => {
                                        const veh = fleet.find(v => v.id === l.vehicleId);
                                        const metrics = veh ? getVehicleFuelMetrics(veh) : null;
                                        const logMetric = metrics?.logMetrics.get(l.id);
                                        return (
                                            <tr key={l.id} className="hover:bg-slate-50 dark:hover:bg-teal-900/10 transition-all group">
                                                <td className="px-6 py-5 font-bold text-slate-500">{l.date}</td>
                                                <td className="px-6 py-5">
                                                    <p className="font-black text-slate-900 dark:text-white uppercase text-xs">{veh?.name}</p>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] text-teal-600 font-bold">{veh?.plate}</span>
                                                        <span className="text-[9px] text-slate-400 font-mono">[{l.ledgerCode || '2.03.01'}]</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5 text-center font-black text-slate-700 dark:text-slate-300">{l.liters} L</td>
                                                <td className="px-6 py-4 text-right text-xs text-slate-400">{formatBRL(l.liters > 0 ? l.cost / l.liters : 0)}</td>
                                                <td className="px-6 py-5 text-right font-black text-emerald-600">
                                                    <div className="flex flex-col items-end">
                                                        <span>{formatBRL(l.cost)}</span>
                                                        {l.attachments && l.attachments.length > 0 && (
                                                            <span className="flex items-center gap-1 text-[9px] text-slate-400 uppercase font-bold">
                                                                <Paperclip size={10} /> {l.attachments.length} {l.attachments.length === 1 ? 'anexo' : 'anexos'}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5 text-center">
                                                    {logMetric && logMetric.kmPerLiter > 0 ? (
                                                        <div>
                                                            <span className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-mono font-black rounded-lg text-xs">
                                                                {logMetric.kmPerLiter} KM/L
                                                            </span>
                                                            <p className="text-[9px] text-slate-400 font-bold mt-0.5">+{logMetric.deltaKm.toLocaleString()} km no trecho</p>
                                                        </div>
                                                    ) : (
                                                        <span className="text-slate-400 text-xs italic">-</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-5 text-right font-mono text-xs">
                                                    <div className="flex items-center justify-end gap-3">
                                                        {l.km.toLocaleString()}
                                                        <button onClick={() => deleteFuelLog(l.vehicleId, l.id)} className="text-slate-300 hover:text-rose-500"><Trash2 size={14} /></button>
                                                        <button
                                                            onClick={() => {
                                                                const printWindow = window.open('', '_blank');
                                                                if (printWindow) {
                                                                    printWindow.document.write(`
                                                                     <html>
                                                                        <head>
                                                                           <title>Registro de Abastecimento</title>
                                                                           <style>
                                                                              body { font-family: 'Courier New', monospace; padding: 20px; max-width: 350px; margin: 0 auto; }
                                                                              .header { text-align: center; margin-bottom: 15px; border-bottom: 1px dashed #000; padding-bottom: 10px; }
                                                                              .row { display: flex; justify-content: space-between; margin-bottom: 5px; }
                                                                              .label { font-weight: bold; }
                                                                              .total { font-weight: bold; font-size: 1.2em; border-top: 1px dashed #000; margin-top: 10px; padding-top: 5px; text-align: right; }
                                                                           </style>
                                                                        </head>
                                                                        <body>
                                                                           <div class="header">
                                                                              <h3>POSTO INTERNO</h3>
                                                                              <p>Comprovante de Abastecimento</p>
                                                                           </div>
                                                                           <div>
                                                                              <div class="row"><span class="label">Data:</span> <span>${l.date}</span></div>
                                                                              <div class="row"><span class="label">Veículo:</span> <span>${veh?.plate}</span></div>
                                                                              <div class="row"><span class="label">Hodômetro:</span> <span>${l.km.toLocaleString()} KM</span></div>
                                                                              <hr style="border:0; border-top:1px dashed #ccc"/>
                                                                              <div class="row"><span class="label">Combustível:</span> <span>${(l as any).fuelType || 'Diesel S10'}</span></div>
                                                                              <div class="row"><span class="label">Litros:</span> <span>${l.liters.toFixed(2)} L</span></div>
                                                                              <div class="row"><span class="label">Preço/L:</span> <span>${formatBRL(l.cost / l.liters)}</span></div>
                                                                              
                                                                              <div class="total">TOTAL: ${formatBRL(l.cost)}</div>
                                                                           </div>
                                                                           <div style="margin-top: 30px; text-align: center; font-size: 10px;">
                                                                              <p>__________________________</p>
                                                                              <p>Assinatura Motorista</p>
                                                                           </div>
                                                                           <script>window.print();</script>
                                                                        </body>
                                                                     </html>
                                                                  `);
                                                                    printWindow.document.close();
                                                                }
                                                            }}
                                                            className="text-slate-300 hover:text-teal-600"
                                                            title="Imprimir Cupom"
                                                        >
                                                            <Printer size={14} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {fleet.every(v => !v.fuelLogs?.length) && (
                                        <tr><td colSpan={7} className="px-6 py-12 text-center text-slate-400 italic font-medium uppercase text-xs tracking-widest">Sem registros de consumo ativos...</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )
            }

            {
                activeTab === 'tires' && (
                    <div className="space-y-6 animate-in fade-in duration-500">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                            {[
                                { label: 'TOTAL DE PNEUS', value: tires.length, icon: <Disc />, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/10' },
                                { label: 'EM OPERAÇÃO', value: tires.filter(t => t.status === 'Em uso').length, icon: <Activity />, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/10' },
                                { label: 'EM ESTOQUE', value: tires.filter(t => t.status === 'Estoque' || t.status === 'Novo').length, icon: <LayoutDashboard />, color: 'text-teal-500', bg: 'bg-teal-50 dark:bg-teal-900/10' },
                                { label: 'ALERTA DE TROCA', value: tires.filter(t => { const v = fleet.find(veh => veh.id === t.currentVehicleId); const m = getTireMetrics(t, v); return m.wearPercent >= 85 || m.treadDepth <= 3.0; }).length, icon: <AlertTriangle />, color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-900/10' },
                                { label: 'SUGESTÃO RODÍZIO', value: tires.filter(t => { const v = fleet.find(veh => veh.id === t.currentVehicleId); const m = getTireMetrics(t, v); return t.status === 'Em uso' && m.runningKm > 10000; }).length, icon: <RefreshCw />, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/10' },
                            ].map((kpi, i) => (
                                <div key={i} className="bg-white dark:bg-slate-800 p-5 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className={`p-2.5 rounded-2xl ${kpi.bg} ${kpi.color}`}>{kpi.icon}</div>
                                    </div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{kpi.label}</p>
                                    <h3 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">{kpi.value}</h3>
                                </div>
                            ))}
                        </div>

                        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
                            <div className="p-6 border-b dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-800/50">
                                <div className="flex items-center gap-3">
                                    <Disc className="text-teal-600" size={24} />
                                    <div>
                                        <h3 className="font-black text-lg text-slate-900 dark:text-white uppercase tracking-tight">Inventário & Vida Útil de Pneus</h3>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">Controle telemétrico de desgaste, sulco (mm), rodagem acumulada e trocas</p>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => {
                                            setSelectedTireId(null);
                                            setTireForm({ status: 'Novo', brand: '', model: '', size: '295/80 R22.5', recapCount: 0, currentKm: 0, maxKm: 100000 });
                                            setIsTireModalOpen(true);
                                        }}
                                        className="px-4 py-2 bg-teal-600 text-white font-black rounded-xl text-[10px] uppercase shadow-lg shadow-teal-600/20"
                                    >
                                        Novo Pneu
                                    </button>
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-50 dark:bg-gray-800 text-[10px] font-black text-slate-400 uppercase border-b dark:border-gray-700">
                                        <tr>
                                            <th className="px-6 py-4">Nº Série / Modelo</th>
                                            <th className="px-6 py-4">Status</th>
                                            <th className="px-6 py-4">Veículo / Posição</th>
                                            <th className="px-6 py-4 text-center">KM Acumulado</th>
                                            <th className="px-6 py-4 text-center">Vida Útil & Sulco</th>
                                            <th className="px-6 py-4 text-center">Custo/KM</th>
                                            <th className="px-6 py-4 text-center">Recapagens</th>
                                            <th className="px-6 py-4 text-right">Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y dark:divide-gray-700">
                                        {tires.map(tire => {
                                            const vehicle = fleet.find(v => v.id === tire.currentVehicleId);
                                            const metrics = getTireMetrics(tire, vehicle);

                                            return (
                                                <tr key={tire.id} className="hover:bg-slate-50 dark:hover:bg-teal-900/10 transition-all group">
                                                    <td className="px-6 py-4">
                                                        <p className="font-black text-slate-900 dark:text-white uppercase text-xs">{tire.serialNumber}</p>
                                                        <p className="text-[10px] text-slate-400 font-bold uppercase">{tire.brand} {tire.model} • {tire.size}</p>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-2 py-1 rounded-full text-[9px] font-black uppercase ${tire.status === 'Em uso' ? 'bg-emerald-100 text-emerald-700' :
                                                            tire.status === 'Estoque' || tire.status === 'Novo' ? 'bg-blue-100 text-blue-700' :
                                                                'bg-rose-100 text-rose-700'
                                                            }`}>
                                                            {tire.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {vehicle ? (
                                                            <div className="flex flex-col">
                                                                <div className="flex items-center gap-1.5 font-black text-xs text-slate-800 dark:text-white uppercase">
                                                                    <Truck size={12} className="text-teal-600" />
                                                                    {vehicle.plate}
                                                                </div>
                                                                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold uppercase mt-0.5">
                                                                    <ArrowRight size={10} />
                                                                    {vehicle.name} • Posição: {tire.position || 'N/A'}
                                                                </div>
                                                                {tire.installKm !== undefined && (
                                                                    <div className="text-[9px] text-teal-600/70 font-bold mt-1 uppercase tracking-tighter">
                                                                        Montado c/ {tire.installKm.toLocaleString()} KM (+{metrics.runningKm.toLocaleString()} KM rodados)
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold uppercase italic">
                                                                <LayoutDashboard size={12} />
                                                                Almoxarifado / Estoque
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className="font-mono text-xs font-black text-slate-800 dark:text-slate-200">
                                                            {metrics.totalAccumulatedKm.toLocaleString()} KM
                                                        </span>
                                                        <p className="text-[9px] text-slate-400 font-bold">Máx: {tire.maxKm?.toLocaleString() || '100.000'} KM</p>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <div className="w-32 mx-auto">
                                                            <div className="flex justify-between items-center mb-1">
                                                                <span className={`text-[9px] font-black ${metrics.wearPercent >= 85 ? 'text-rose-500' : 'text-slate-400'}`}>
                                                                    {metrics.wearPercent}%
                                                                </span>
                                                                <span className="text-[9px] font-bold text-slate-500">
                                                                    {metrics.remainingKm.toLocaleString()} KM rest.
                                                                </span>
                                                            </div>
                                                            <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden mb-1">
                                                                <div
                                                                    className={`h-full rounded-full transition-all duration-500 ${metrics.wearPercent >= 85 ? 'bg-rose-500' : metrics.wearPercent >= 65 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                                                    style={{ width: `${Math.min(100, metrics.wearPercent)}%` }}
                                                                ></div>
                                                            </div>
                                                            <div className="flex justify-between items-center text-[9px]">
                                                                <span className="font-mono text-slate-400">Sulco: {metrics.treadDepth}mm</span>
                                                                <span className={`px-1.5 py-0.5 rounded font-black text-[8px] ${metrics.healthBadge.bg} ${metrics.healthBadge.color}`}>
                                                                    {metrics.healthBadge.label}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-center font-mono text-xs font-bold text-slate-600 dark:text-slate-300">
                                                        R$ {metrics.cpk}
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className="px-2 py-1 bg-slate-100 dark:bg-slate-900 rounded-lg text-[10px] font-black text-slate-600 dark:text-slate-400">
                                                            {tire.recapCount}X
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex justify-end gap-2">
                                                            <button
                                                                onClick={() => {
                                                                    setSelectedTireId(tire.id);
                                                                    setHistoryEntry({ ...historyEntry, km: metrics.totalAccumulatedKm });
                                                                    setIsTireHistoryModalOpen(true);
                                                                }}
                                                                className="p-2 bg-slate-50 dark:bg-slate-700 text-slate-400 hover:text-teal-600 rounded-xl transition-all"
                                                                title="Registrar Rodízio / Movimentação"
                                                            >
                                                                <RefreshCw size={14} />
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    setSelectedTireId(tire.id);
                                                                    setTireForm(tire);
                                                                    setIsTireModalOpen(true);
                                                                }}
                                                                className="p-2 bg-slate-50 dark:bg-slate-700 text-slate-400 hover:text-blue-600 rounded-xl transition-all"
                                                                title="Editar Pneu"
                                                            >
                                                                <Settings size={14} />
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    if (confirm("Deseja excluir este pneu do inventário?")) deleteTire(tire.id);
                                                                }}
                                                                className="p-2 bg-slate-50 dark:bg-slate-700 text-slate-400 hover:text-rose-600 rounded-xl transition-all"
                                                                title="Excluir Pneu"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Maintenance Modal */}
            {
                isMaintModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
                        <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-2xl w-full max-w-4xl border dark:border-slate-700 animate-in zoom-in duration-200 my-8">
                            <div className="px-10 py-8 border-b dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                                <h3 className="font-black text-xl text-slate-900 dark:text-white uppercase tracking-tight">Registrar Manutenção</h3>
                                <button onClick={() => setIsMaintModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
                            </div>
                            <form onSubmit={handleSaveMaintenance} className="p-10 space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-6">
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Veículo</label>
                                            <select
                                                className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl py-4 font-bold text-sm"
                                                value={selectedVehicleId}
                                                onChange={e => setSelectedVehicleId(e.target.value)}
                                                required
                                            >
                                                <option value="">Selecione o veículo...</option>
                                                {fleet.map(v => <option key={v.id} value={v.id}>{v.plate} - {v.name}</option>)}
                                            </select>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Data</label>
                                                <input type="date" className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl py-4 font-bold text-sm" value={newMaint.date} onChange={e => setNewMaint({ ...newMaint, date: e.target.value })} required />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Tipo</label>
                                                <select className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl py-4 font-bold text-sm" value={newMaint.type} onChange={e => setNewMaint({ ...newMaint, type: e.target.value as any })} required>
                                                    <option value="Preventiva">Preventiva</option>
                                                    <option value="Corretiva">Corretiva</option>
                                                    <option value="Preditiva">Preditiva</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Descrição do Serviço</label>
                                            <textarea className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl py-4 px-4 font-bold text-sm" placeholder="Ex: Troca de óleo, filtros, pastilhas..." value={newMaint.description} onChange={e => setNewMaint({ ...newMaint, description: e.target.value })} required rows={4}></textarea>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Conta de Débito</label>
                                            <select
                                                className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl py-4 font-bold text-sm"
                                                value={newMaint.debitAccountId || ''}
                                                onChange={e => setNewMaint({ ...newMaint, debitAccountId: e.target.value })}
                                                required
                                            >
                                                <option value="">Selecione a conta...</option>
                                                {financialAccounts.map(acc => (
                                                    <option key={acc.id} value={acc.id}>{acc.name} ({formatBRL(acc.balance)})</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Custo Mão de Obra (R$)</label>
                                                <input type="number" className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl py-4 font-bold text-sm" placeholder="0.00" value={newMaint.cost || ''} onChange={e => setNewMaint({ ...newMaint, cost: Number(e.target.value) })} required />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">KM Atual</label>
                                                <input type="number" className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl py-4 font-bold text-sm" placeholder="0" value={newMaint.km || ''} onChange={e => setNewMaint({ ...newMaint, km: Number(e.target.value) })} required />
                                            </div>
                                        </div>

                                        <div className="p-6 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                                            <h4 className="text-xs font-black text-teal-600 uppercase mb-4">Peças e Insumos</h4>
                                            <div className="grid grid-cols-1 gap-4">
                                                <div>
                                                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Produto (Filtro: Peças/Manutenção)</label>
                                                    <select
                                                        className="w-full bg-white dark:bg-slate-800 border dark:border-slate-600 rounded-xl py-3 font-bold text-sm"
                                                        value={newMaint.productId}
                                                        onChange={e => {
                                                            const prod = inventory.find(i => i.id === e.target.value);
                                                            // Add product cost to total cost logic would be here, but simplified for now
                                                            setNewMaint({ ...newMaint, productId: e.target.value, productQuantity: 1 });
                                                        }}
                                                    >
                                                        <option value="">Nenhum produto...</option>
                                                        {inventory
                                                            .filter(item => {
                                                                const cat = (item.category || '').toLowerCase();
                                                                return cat.includes('peça') || cat.includes('peca') || cat.includes('manutenção') || cat.includes('manutencao');
                                                            })
                                                            .map(item => (
                                                                <option key={item.id} value={item.id}>{item.name} (Disp: {item.quantity} {item.unit}) - {formatBRL(item.price)}</option>
                                                            ))}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Quantidade</label>
                                                    <input type="number" className="w-full bg-white dark:bg-slate-800 border dark:border-slate-600 rounded-xl py-3 font-bold text-sm" value={newMaint.productQuantity || 0} onChange={e => setNewMaint({ ...newMaint, productQuantity: Number(e.target.value) })} min="0" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Plano de Contas</label>
                                    <select
                                        className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl py-3 font-bold text-sm"
                                        value={newMaint.ledgerCode}
                                        onChange={e => {
                                            const options: any = {
                                                '2.03.04': 'Manutenção de Frota',
                                                '2.07.03': 'IPVA / Taxas / Seguros',
                                                '2.03.06': 'Pneus / Rodagem'
                                            };
                                            setNewMaint({ ...newMaint, ledgerCode: e.target.value, ledgerName: options[e.target.value] });
                                        }}
                                    >
                                        <option value="2.03.04">2.03.04 - Manutenção de Frota</option>
                                        <option value="2.07.03">2.07.03 - IPVA / Taxas / Seguros</option>
                                        <option value="2.03.06">2.03.06 - Pneus / Rodagem</option>
                                    </select>
                                </div>

                                {/* Attachments Section */}
                                <div className="pt-6 border-t border-slate-50 dark:border-slate-700">
                                    <h4 className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">
                                        <Paperclip size={14} className="text-teal-600" /> Comprovantes & Notas
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="border-2 border-dashed border-slate-100 dark:border-slate-700 rounded-2xl p-4 flex flex-col items-center justify-center text-center cursor-pointer hover:border-teal-400 transition-colors relative">
                                            <input
                                                type="file"
                                                className="absolute inset-0 opacity-0 cursor-pointer"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) {
                                                        const at = { id: Date.now().toString(), name: file.name, type: file.type, date: new Date().toLocaleDateString('pt-BR'), size: (file.size / 1024).toFixed(1) + ' KB' };
                                                        setNewMaint({ ...newMaint, attachments: [...(newMaint.attachments || []), at] });
                                                    }
                                                }}
                                            />
                                            <Upload size={20} className="text-slate-300 mb-1" />
                                            <span className="text-[9px] font-bold text-slate-400 uppercase text-center">Anexar Nota/Recibo</span>
                                        </div>

                                        <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
                                            {newMaint.attachments?.map((at: any) => (
                                                <div key={at.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl group border border-transparent hover:border-teal-100">
                                                    <div className="flex items-center gap-2 overflow-hidden">
                                                        <File size={14} className="text-teal-600 shrink-0" />
                                                        <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 truncate uppercase">{at.name}</span>
                                                    </div>
                                                    <button type="button" onClick={() => setNewMaint({ ...newMaint, attachments: newMaint.attachments?.filter((a: any) => a.id !== at.id) })} className="p-1 text-slate-300 hover:text-rose-500 transition-colors">
                                                        <XCircle size={14} />
                                                    </button>
                                                </div>
                                            ))}
                                            {(!newMaint.attachments || newMaint.attachments.length === 0) && (
                                                <div className="h-full flex flex-col items-center justify-center py-4 opacity-40">
                                                    <p className="text-[9px] font-bold text-slate-400 uppercase italic">Sem anexos</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <button type="submit" className="w-full py-4 bg-teal-600 text-white font-black rounded-2xl shadow-lg mt-6 uppercase tracking-widest text-xs">Lançar Manutenção</button>
                            </form>
                        </div>
                    </div>
                )
            }

            {/* Fuel Modal */}
            {
                isFuelModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-lg border dark:border-slate-700 animate-in zoom-in duration-200">
                            <div className="p-6 border-b dark:border-slate-700 flex justify-between items-center">
                                <h3 className="font-black text-xl text-slate-900 dark:text-white uppercase tracking-tight">Lançar Abastecimento</h3>
                                <button onClick={() => setIsFuelModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
                            </div>
                            <form onSubmit={handleSaveFuel} className="p-6 space-y-4">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Veículo</label>
                                    <select
                                        className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl py-3 font-bold text-sm"
                                        value={selectedVehicleId}
                                        onChange={e => {
                                            const vId = e.target.value;
                                            setSelectedVehicleId(vId);
                                            const v = fleet.find(veh => veh.id === vId);
                                            if (v && (!newFuel.km || newFuel.km === 0)) {
                                                setNewFuel(prev => ({ ...prev, km: v.km }));
                                            }
                                        }}
                                        required
                                    >
                                        <option value="">Selecione o veículo...</option>
                                        {fleet.map(v => <option key={v.id} value={v.id}>{v.plate} - {v.name} (Atual: {v.km.toLocaleString()} KM)</option>)}
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Combustível</label>
                                        <select className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl py-3 font-bold text-sm" value={newFuel.fuelType} onChange={e => setNewFuel({ ...newFuel, fuelType: e.target.value as any })} required>
                                            <option value="Diesel">Diesel</option>
                                            <option value="Gasolina">Gasolina</option>
                                            <option value="Etanol">Etanol</option>
                                            <option value="Arla 32">Arla 32</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Data</label>
                                        <input type="date" className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl py-3 font-bold text-sm" value={newFuel.date} onChange={e => setNewFuel({ ...newFuel, date: e.target.value })} required />
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Litros</label>
                                        <input type="number" step="0.01" className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl py-3 font-bold text-sm" placeholder="0.00" value={newFuel.liters || ''} onChange={e => setNewFuel({ ...newFuel, liters: Number(e.target.value) })} required />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Total Pago</label>
                                        <input type="number" step="0.01" className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl py-3 font-bold text-sm" placeholder="R$" value={newFuel.cost || ''} onChange={e => setNewFuel({ ...newFuel, cost: Number(e.target.value) })} required />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">KM no Abastecimento</label>
                                        <input type="number" className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl py-3 font-bold text-sm" placeholder="0" value={newFuel.km || ''} onChange={e => setNewFuel({ ...newFuel, km: Number(e.target.value) })} required />
                                    </div>
                                </div>

                                {Number(newFuel.liters) > 0 && Number(newFuel.cost) > 0 && (
                                    <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 rounded-xl flex justify-between items-center text-xs">
                                        <span className="font-bold text-emerald-800 dark:text-emerald-200">Preço Médio por Litro:</span>
                                        <span className="font-mono font-black text-emerald-700 dark:text-emerald-300">
                                            {formatBRL((Number(newFuel.cost) || 0) / (Number(newFuel.liters) || 1))}/L
                                        </span>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Plano de Contas</label>
                                    <select
                                        className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl py-3 font-bold text-sm"
                                        value={newFuel.ledgerCode}
                                        onChange={e => {
                                            const options: any = {
                                                '2.03.01': 'Combustível (Diesel)',
                                                '2.03.04': 'Arla 32 / Aditivos'
                                            };
                                            setNewFuel({ ...newFuel, ledgerCode: e.target.value, ledgerName: options[e.target.value] });
                                        }}
                                    >
                                        <option value="2.03.01">2.03.01 - Combustível (Diesel)</option>
                                        <option value="2.03.04">2.03.04 - Arla 32 / Aditivos</option>
                                    </select>
                                </div>

                                {/* Attachments Section */}
                                <div className="pt-6 border-t border-slate-50 dark:border-slate-700">
                                    <h4 className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">
                                        <Paperclip size={14} className="text-emerald-600" /> Comprovantes & Anexos
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="border-2 border-dashed border-slate-100 dark:border-slate-700 rounded-2xl p-4 flex flex-col items-center justify-center text-center cursor-pointer hover:border-emerald-400 transition-colors relative">
                                            <input
                                                type="file"
                                                className="absolute inset-0 opacity-0 cursor-pointer"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) {
                                                        const at = { id: Date.now().toString(), name: file.name, type: file.type, date: new Date().toLocaleDateString('pt-BR'), size: (file.size / 1024).toFixed(1) + ' KB' };
                                                        setNewFuel({ ...newFuel, attachments: [...(newFuel.attachments || []), at] });
                                                    }
                                                }}
                                            />
                                            <Upload size={20} className="text-slate-300 mb-1" />
                                            <span className="text-[9px] font-bold text-slate-400 uppercase text-center">Anexar Cupom Fiscal</span>
                                        </div>

                                        <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
                                            {newFuel.attachments?.map((at: any) => (
                                                <div key={at.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl group border border-transparent hover:border-emerald-100">
                                                    <div className="flex items-center gap-2 overflow-hidden">
                                                        <File size={14} className="text-emerald-600 shrink-0" />
                                                        <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 truncate uppercase">{at.name}</span>
                                                    </div>
                                                    <button type="button" onClick={() => setNewFuel({ ...newFuel, attachments: newFuel.attachments?.filter((a: any) => a.id !== at.id) })} className="p-1 text-slate-300 hover:text-rose-500 transition-colors">
                                                        <XCircle size={14} />
                                                    </button>
                                                </div>
                                            ))}
                                            {(!newFuel.attachments || newFuel.attachments.length === 0) && (
                                                <div className="h-full flex flex-col items-center justify-center py-4 opacity-40">
                                                    <p className="text-[9px] font-bold text-slate-400 uppercase italic">Nenhum cupom</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <button type="submit" className="w-full py-4 bg-emerald-600 text-white font-black rounded-2xl shadow-lg mt-6 uppercase tracking-widest text-xs">Confirmar Registro</button>
                            </form>
                        </div>
                    </div>
                )
            }
            {/* Fuel Modal ... already exists ... */}

            {/* New/Edit Vehicle Modal */}
            {
                isVehicleModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
                        <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-2xl w-full max-w-2xl border dark:border-slate-700 animate-in zoom-in duration-300 my-8 overflow-hidden">
                            <div className="px-10 py-8 border-b dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                                <div>
                                    <h3 className="font-black text-2xl text-slate-900 dark:text-white uppercase tracking-tighter leading-tight">
                                        {editingVehicleId ? 'Editar Veículo' : 'Novo Ativo de Frota'}
                                    </h3>
                                    <p className="text-xs font-bold text-teal-600 uppercase tracking-widest mt-1">Sincronização em tempo real</p>
                                </div>
                                <button onClick={() => setIsVehicleModalOpen(false)} className="p-3 bg-white dark:bg-slate-700 text-slate-400 hover:text-rose-500 rounded-2xl shadow-sm transition-all"><X size={24} /></button>
                            </div>

                            <form onSubmit={handleSaveVehicle} className="p-10 space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-6">
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Modelo / Nome do Ativo</label>
                                            <input
                                                type="text"
                                                className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-2xl py-4 font-bold text-sm focus:ring-2 focus:ring-teal-500 transition-all shadow-inner"
                                                placeholder="Ex: Volvo FH 540"
                                                value={vehicleForm.name || ''}
                                                onChange={e => setVehicleForm({ ...vehicleForm, name: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-[10px] font-black text-slate-400 uppercase mb-3">Placa / ID</label>
                                                <input type="text" className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-2xl py-4 font-bold text-sm" placeholder="ABC-1234" value={vehicleForm.plate || ''} onChange={e => setVehicleForm({ ...vehicleForm, plate: e.target.value })} required />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-black text-slate-400 uppercase mb-3">Tipo</label>
                                                <select className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-2xl py-4 font-bold text-sm" value={vehicleForm.type} onChange={e => setVehicleForm({ ...vehicleForm, type: e.target.value as any })}>
                                                    <option value="Toco">Caminhão Toco (6 Pneus)</option>
                                                    <option value="Truck">Caminhão Truck (10 Pneus)</option>
                                                    <option value="Carreta LS">Carreta LS (12 Pneus)</option>
                                                    <option value="Máquina">Máquina</option>
                                                    <option value="Utilitário">Utilitário</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-[10px] font-black text-slate-400 uppercase mb-3">Odômetro (KM)</label>
                                                <input type="number" className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-2xl py-4 font-bold text-sm" value={vehicleForm.km || ''} onChange={e => setVehicleForm({ ...vehicleForm, km: Number(e.target.value) })} required />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-black text-slate-400 uppercase mb-3">Combustível (%)</label>
                                                <input type="number" className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-2xl py-4 font-bold text-sm" value={vehicleForm.fuelLevel || ''} onChange={e => setVehicleForm({ ...vehicleForm, fuelLevel: Number(e.target.value) })} max="100" min="0" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase mb-3">Status Operacional</label>
                                            <div className="flex gap-2">
                                                {['Operacional', 'Manutenção', 'Parado'].map((st) => (
                                                    <button
                                                        key={st}
                                                        type="button"
                                                        onClick={() => setVehicleForm({ ...vehicleForm, status: st as any })}
                                                        className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase transition-all ${vehicleForm.status === st ? 'bg-teal-600 text-white shadow-lg' : 'bg-slate-50 dark:bg-slate-900 text-slate-400'}`}
                                                    >
                                                        {st}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-8 border-t dark:border-slate-700 flex gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setIsVehicleModalOpen(false)}
                                        className="flex-1 py-5 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 font-black rounded-3xl uppercase tracking-widest text-[10px] hover:bg-slate-200 transition-all"
                                    >
                                        Descartar
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-[2] py-5 bg-teal-600 text-white font-black rounded-3xl uppercase tracking-widest text-[10px] shadow-2xl shadow-teal-600/30 hover:bg-teal-500 transition-all flex items-center justify-center gap-3"
                                    >
                                        <Save size={18} /> {editingVehicleId ? 'Salvar Alterações' : 'Confirmar Cadastro'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }
            {/* Tire Modal */}
            {
                isTireModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-lg border dark:border-slate-700 animate-in zoom-in duration-200">
                            <div className="p-6 border-b dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                                <h3 className="font-black text-xl text-slate-900 dark:text-white uppercase tracking-tight">
                                    {selectedTireId ? 'Editar Pneu' : 'Novo Pneu'}
                                </h3>
                                <button onClick={() => setIsTireModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
                            </div>

                            {!selectedTireId && !tireForm.brand ? (
                                // Mode Selection for New Tire
                                <div className="p-8 grid grid-cols-2 gap-6">
                                    <button
                                        onClick={() => setTireForm({ ...tireForm, brand: ' ' })} // Hack to bypass check, will reset
                                        className="flex flex-col items-center justify-center gap-4 p-6 bg-slate-50 dark:bg-slate-700 rounded-3xl border-2 border-slate-100 dark:border-slate-600 hover:border-teal-500 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-all group"
                                    >
                                        <div className="p-4 bg-white dark:bg-slate-800 rounded-full text-slate-400 group-hover:text-teal-600 shadow-sm"><PenTool size={32} /></div>
                                        <div className="text-center">
                                            <h4 className="font-black text-slate-800 dark:text-white uppercase mb-1">Cadastro Manual</h4>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase">Pneus já existentes ou sem estoque</p>
                                        </div>
                                    </button>

                                    <button
                                        onClick={() => setTireForm({ ...tireForm, brand: 'STOCK_MODE' })}
                                        className="flex flex-col items-center justify-center gap-4 p-6 bg-slate-50 dark:bg-slate-700 rounded-3xl border-2 border-slate-100 dark:border-slate-600 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all group"
                                    >
                                        <div className="p-4 bg-white dark:bg-slate-800 rounded-full text-slate-400 group-hover:text-blue-600 shadow-sm"><Package size={32} /></div>
                                        <div className="text-center">
                                            <h4 className="font-black text-slate-800 dark:text-white uppercase mb-1">Baixar do Estoque</h4>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase">Consumir item do Almoxarifado</p>
                                        </div>
                                    </button>
                                </div>
                            ) : (
                                <form onSubmit={(e) => {
                                    e.preventDefault();
                                    // Intercept for stock deduction logic
                                    if (tireForm.brand === 'STOCK_MODE' && tireForm.model) { // model holds itemId here momentarily
                                        const itemId = tireForm.model;
                                        const item = inventory.find(i => i.id === itemId);
                                        if (item) {
                                            // Deduct from stock
                                            // We need access to updateStock, but it's in context. 
                                            // We'll rely on global updateStock from props/context if available or simple logic
                                            // Since we can't easily call updateStock here without it being in scope (it is in Fleet component),
                                            // we will assume Fleet component has updateStock in scope? YES.
                                            // WAIT: updateStock is NOTdestructured in Fleet. We need to add it.
                                        }
                                        // Correct the form data before saving
                                        // Actually, let handleSaveTire handle the logic if we pass a special flag or handle it here
                                    }
                                    handleSaveTire(e);
                                }} className="p-6 space-y-4">
                                    {tireForm.brand === 'STOCK_MODE' ? (
                                        <div className="space-y-4">
                                            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800 flex items-start gap-3">
                                                <Info className="text-blue-600 shrink-0 mt-0.5" size={18} />
                                                <div>
                                                    <p className="text-xs font-bold text-blue-800 dark:text-blue-200 uppercase">Conciliação de Estoque</p>
                                                    <p className="text-[10px] text-blue-600/80 dark:text-blue-300">Ao selecionar um pneu, uma unidade será removida do estoque automaticamente e o pneu será cadastrado na frota.</p>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Selecione o Pneu em Estoque</label>
                                                <select
                                                    className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl py-3 font-bold text-sm"
                                                    onChange={(e) => {
                                                        const item = inventory.find(i => i.id === e.target.value);
                                                        if (item) {
                                                            // Pre-fill form with item data
                                                            setTireForm({
                                                                ...tireForm,
                                                                brand: item.name.split(' ')[0], // Guess brand
                                                                model: item.name, // Use full name as model for now or split
                                                                size: '295/80 R22.5', // Default or parse from description
                                                                stockItemId: item.id, // Store ref
                                                                maxKm: 100000,
                                                                currentKm: 0,
                                                                status: 'Novo'
                                                            });
                                                        }
                                                    }}
                                                >
                                                    <option value="">Selecione...</option>
                                                    {inventory.filter(i =>
                                                        i.category.toLowerCase().includes('pneu') && i.quantity > 0
                                                    ).map(i => (
                                                        <option key={i.id} value={i.id}>{i.name} - (Disp: {i.quantity})</option>
                                                    ))}
                                                </select>
                                            </div>
                                            {tireForm.stockItemId && (
                                                <div className="space-y-4 pt-4 border-t dark:border-slate-800 animate-in fade-in">
                                                    <div>
                                                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Número de Série (Fogo)</label>
                                                        <input
                                                            type="text"
                                                            className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl py-3 font-bold text-sm uppercase"
                                                            placeholder="Ex: PN-102030"
                                                            value={tireForm.serialNumber || ''}
                                                            onChange={e => setTireForm({ ...tireForm, serialNumber: e.target.value })}
                                                            required
                                                        />
                                                    </div>
                                                    <button
                                                        type="submit"
                                                        className="w-full py-4 bg-blue-600 text-white font-black rounded-2xl shadow-lg mt-6 uppercase tracking-widest text-xs hover:bg-blue-500 transition-all"
                                                    >
                                                        <Download size={16} className="inline mr-2" /> Baixar e Cadastrar
                                                    </button>
                                                </div>
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => setTireForm({ status: 'Novo', brand: '', model: '', size: '295/80 R22.5', recapCount: 0, currentKm: 0, maxKm: 100000 })}
                                                className="w-full py-3 text-slate-400 text-xs font-bold uppercase hover:text-slate-600"
                                            >
                                                Cancelar
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <div>
                                                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Número de Série (Fogo)</label>
                                                <input
                                                    type="text"
                                                    className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl py-3 font-bold text-sm uppercase"
                                                    placeholder="Ex: PN-102030"
                                                    value={tireForm.serialNumber || ''}
                                                    onChange={e => setTireForm({ ...tireForm, serialNumber: e.target.value })}
                                                    required
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Marca</label>
                                                    <input type="text" className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl py-3 font-bold text-sm" value={tireForm.brand} onChange={e => setTireForm({ ...tireForm, brand: e.target.value })} required />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Modelo</label>
                                                    <input type="text" className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl py-3 font-bold text-sm" value={tireForm.model} onChange={e => setTireForm({ ...tireForm, model: e.target.value })} required />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Medida</label>
                                                    <input type="text" className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl py-3 font-bold text-sm" value={tireForm.size} onChange={e => setTireForm({ ...tireForm, size: e.target.value })} required />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">KM Estimado (Vida Útil)</label>
                                                    <input type="number" className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl py-3 font-bold text-sm" value={tireForm.maxKm} onChange={e => setTireForm({ ...tireForm, maxKm: Number(e.target.value) })} required />
                                                </div>
                                            </div>
                                            <button type="submit" className="w-full py-4 bg-teal-600 text-white font-black rounded-2xl shadow-lg mt-6 uppercase tracking-widest text-xs">Salvar Alterações</button>
                                        </>
                                    )}
                                </form>
                            )}
                        </div>
                    </div>
                )
            }

            {/* Tire History/Rotation Modal */}
            {
                isTireHistoryModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-lg border dark:border-slate-700 animate-in zoom-in duration-200">
                            <div className="p-6 border-b dark:border-slate-700 flex justify-between items-center">
                                <h3 className="font-black text-xl text-slate-900 dark:text-white uppercase tracking-tight">Movimentação / Histórico</h3>
                                <button onClick={() => setIsTireHistoryModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
                            </div>
                            <form onSubmit={handleSaveTireHistory} className="p-6 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Data</label>
                                        <input type="date" className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl py-3 font-bold text-sm" value={historyEntry.date} onChange={e => setHistoryEntry({ ...historyEntry, date: e.target.value })} required />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Evento</label>
                                        <select
                                            className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl py-3 font-bold text-sm"
                                            value={historyEntry.type}
                                            onChange={e => setHistoryEntry({ ...historyEntry, type: e.target.value as any })}
                                            required
                                        >
                                            <option value="Instalação">Instalação</option>
                                            <option value="Rodízio">Rodízio</option>
                                            <option value="Retirada">Retirada (Estoque)</option>
                                            <option value="Recapagem">Recapagem</option>
                                            <option value="Inspeção">Inspeção</option>
                                        </select>
                                    </div>
                                </div>

                                {(historyEntry.type === 'Instalação' || historyEntry.type === 'Rodízio') && (
                                    <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-top-2">
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Veículo</label>
                                            <select
                                                className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl py-3 font-bold text-sm"
                                                value={historyEntry.vehicleId}
                                                onChange={e => setHistoryEntry({ ...historyEntry, vehicleId: e.target.value })}
                                                required
                                            >
                                                <option value="">Selecione...</option>
                                                {fleet.map(v => <option key={v.id} value={v.id}>{v.plate}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Posição</label>
                                            <select
                                                className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl py-3 font-bold text-sm"
                                                value={historyEntry.position}
                                                onChange={e => setHistoryEntry({ ...historyEntry, position: e.target.value })}
                                                required
                                            >
                                                <option value="DI">Dianteiro Esq.</option>
                                                <option value="DD">Dianteiro Dir.</option>
                                                <option value="T1E">Tração 1 Esq. Ext.</option>
                                                <option value="T1EI">Tração 1 Esq. Int.</option>
                                                <option value="T1D">Tração 1 Dir. Ext.</option>
                                                <option value="T1DI">Tração 1 Dir. Int.</option>
                                            </select>
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">KM no Evento</label>
                                    <input type="number" className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl py-3 font-bold text-sm" value={historyEntry.km} onChange={e => setHistoryEntry({ ...historyEntry, km: Number(e.target.value) })} required />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Observações</label>
                                    <textarea className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl py-3 px-4 font-bold text-sm" placeholder="Ex: Pressão, profundidade do sulco..." value={historyEntry.notes} onChange={e => setHistoryEntry({ ...historyEntry, notes: e.target.value })} rows={2}></textarea>
                                </div>

                                <button type="submit" className="w-full py-4 bg-teal-600 text-white font-black rounded-2xl shadow-lg mt-2 uppercase tracking-widest text-xs">Registrar Evento</button>

                                {selectedTireId && (
                                    <div className="mt-6 pt-6 border-t dark:border-slate-700">
                                        <h4 className="text-[10px] font-black text-slate-400 uppercase mb-4 tracking-widest">Histórico Recente</h4>
                                        <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
                                            {tires.find(t => t.id === selectedTireId)?.history.map(h => (
                                                <div key={h.id} className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl relative group">
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <p className="text-[10px] font-black text-slate-900 dark:text-white uppercase">{h.type}</p>
                                                            <p className="text-[9px] font-bold text-teal-600">{h.date} • {h.km.toLocaleString()} KM</p>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => deleteTireHistory(selectedTireId, h.id)}
                                                            className="text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"
                                                        >
                                                            <Trash2 size={12} />
                                                        </button>
                                                    </div>
                                                    {h.notes && <p className="text-[9px] text-slate-400 mt-1 italic leading-tight">"{h.notes}"</p>}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </form>
                        </div>
                    </div>
                )
            }
            {/* Tire Layout Manager Modal */}
            {
                isTireLayoutOpen && layoutVehicle && (() => {
                    const currentLayoutVehicle = fleet.find(v => v.id === layoutVehicle.id) || layoutVehicle;
                    return (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-2xl border dark:border-slate-700 h-[80vh] flex flex-col">
                                <div className="p-6 border-b dark:border-slate-700 flex justify-between items-center">
                                    <div>
                                        <h3 className="font-black text-xl text-slate-900 dark:text-white uppercase tracking-tight">Gestão de Rodado</h3>
                                        <p className="text-xs text-slate-400 font-bold uppercase">{currentLayoutVehicle.name} • {currentLayoutVehicle.plate} • Odômetro: {currentLayoutVehicle.km.toLocaleString()} KM</p>
                                    </div>
                                    <button onClick={() => { setIsTireLayoutOpen(false); setLayoutVehicle(null); }} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
                                </div>

                                <div className="flex-1 overflow-y-auto p-8 flex justify-center items-center bg-slate-50 dark:bg-slate-900/50">
                                    {/* Vehicle Schematic */}
                                    <div className="relative w-64 h-[500px] bg-slate-200 dark:bg-slate-700 rounded-[3rem] shadow-2xl border-4 border-slate-300 dark:border-slate-600">
                                        {/* Cabin Area */}
                                        <div className="absolute top-6 left-6 right-6 h-32 bg-slate-300 dark:bg-slate-600 rounded-2xl border-4 border-slate-400/30 flex items-center justify-center">
                                            <span className="text-slate-400 font-black text-xs uppercase opacity-50">Cabine</span>
                                        </div>

                                        {/* Axle Lines */}
                                        <div className="absolute top-48 left-0 right-0 h-1 bg-slate-400/30"></div>
                                        <div className="absolute bottom-32 left-0 right-0 h-1 bg-slate-400/30"></div>
                                        <div className="absolute bottom-16 left-0 right-0 h-1 bg-slate-400/30"></div>

                                        {/* Tire Slots */}
                                        {(() => {
                                            const getSlots = (type: string) => {
                                                const slots: any[] = [];
                                                const isTruck = type === 'Truck';
                                                const isCarreta = type === 'Carreta LS';

                                                if (isCarreta) {
                                                    [1, 2, 3].forEach((axle, idx) => {
                                                        const baseTop = 130 + (idx * 110);
                                                        slots.push(
                                                            { id: `E${axle}_LE_EXT`, label: `E${axle} LE EXT`, style: { top: `${baseTop}px`, left: '-20px' } },
                                                            { id: `E${axle}_LE_INT`, label: `E${axle} LE INT`, style: { top: `${baseTop}px`, left: '30px' } },
                                                            { id: `E${axle}_LD_INT`, label: `E${axle} LD INT`, style: { top: `${baseTop}px`, right: '30px' } },
                                                            { id: `E${axle}_LD_EXT`, label: `E${axle} LD EXT`, style: { top: `${baseTop}px`, right: '-20px' } }
                                                        );
                                                    });
                                                } else {
                                                    slots.push(
                                                        { id: 'E1_LE', label: 'E1 LE (Dianteiro Esq.)', style: { top: '80px', left: '-20px' } },
                                                        { id: 'E1_LD', label: 'E1 LD (Dianteiro Dir.)', style: { top: '80px', right: '-20px' } }
                                                    );

                                                    const a2Top = isTruck ? 280 : 350;
                                                    slots.push(
                                                        { id: 'E2_LE_EXT', label: 'E2 LE EXT', style: { top: `${a2Top}px`, left: '-20px' } },
                                                        { id: 'E2_LE_INT', label: 'E2 LE INT', style: { top: `${a2Top}px`, left: '30px' } },
                                                        { id: 'E2_LD_INT', label: 'E2 LD INT', style: { top: `${a2Top}px`, right: '30px' } },
                                                        { id: 'E2_LD_EXT', label: 'E2 LD EXT', style: { top: `${a2Top}px`, right: '-20px' } }
                                                    );

                                                    if (isTruck) {
                                                        const a3Top = 380;
                                                        slots.push(
                                                            { id: 'E3_LE_EXT', label: 'E3 LE EXT', style: { top: `${a3Top}px`, left: '-20px' } },
                                                            { id: 'E3_LE_INT', label: 'E3 LE INT', style: { top: `${a3Top}px`, left: '30px' } },
                                                            { id: 'E3_LD_INT', label: 'E3 LD INT', style: { top: `${a3Top}px`, right: '30px' } },
                                                            { id: 'E3_LD_EXT', label: 'E3 LD EXT', style: { top: `${a3Top}px`, right: '-20px' } }
                                                        );
                                                    }
                                                }
                                                return slots;
                                            };

                                            return getSlots(currentLayoutVehicle.type).map(slot => {
                                                const mountedTire = tires.find(t => t.currentVehicleId === currentLayoutVehicle.id && t.position === slot.id);
                                                const metrics = mountedTire ? getTireMetrics(mountedTire, currentLayoutVehicle) : null;

                                                return (
                                                    <div key={slot.id} className="absolute flex flex-col items-center z-10" style={slot.style}>
                                                        <div className="relative group/slot">
                                                            <div className={`w-10 h-16 rounded-lg border-2 shadow-lg transition-all flex flex-col items-center justify-center cursor-pointer ${mountedTire
                                                                ? metrics && metrics.wearPercent >= 85
                                                                    ? 'bg-rose-900 border-rose-500 text-white hover:scale-110 shadow-rose-900/50'
                                                                    : 'bg-slate-800 border-slate-900 text-white hover:scale-110 shadow-slate-900/50'
                                                                : 'bg-white/50 border-dashed border-slate-400 hover:border-teal-500 hover:bg-teal-50'
                                                                }`}>
                                                                {mountedTire ? (
                                                                    <div className="flex flex-col items-center">
                                                                        <span className="text-[7px] font-bold rotate-90 whitespace-nowrap">{mountedTire.serialNumber?.slice(-5)}</span>
                                                                        {metrics && (
                                                                            <span className={`text-[6px] font-black mt-1 px-1 rounded ${metrics.wearPercent >= 85 ? 'bg-rose-600' : 'bg-slate-700'}`}>
                                                                                {metrics.wearPercent}%
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                ) : (
                                                                    <Plus size={12} className="text-slate-400" />
                                                                )}
                                                            </div>

                                                            {/* Tooltip / Selector */}
                                                            <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover/slot:block w-52 bg-white dark:bg-slate-800 p-3 rounded-xl shadow-xl z-50 border border-slate-100 dark:border-slate-600">
                                                                <p className="text-[10px] font-black uppercase text-slate-400 mb-1">{slot.label}</p>
                                                                {mountedTire && metrics && (
                                                                    <div className="mb-2 p-1.5 bg-slate-50 dark:bg-slate-900 rounded-lg text-[9px] space-y-0.5">
                                                                        <p className="font-bold text-slate-700 dark:text-slate-200">{mountedTire.brand} {mountedTire.model}</p>
                                                                        <p className="text-teal-600 font-bold">KM Acumulado: {metrics.totalAccumulatedKm.toLocaleString()} km</p>
                                                                        <p className="text-slate-500">Sulco: {metrics.treadDepth}mm ({metrics.wearPercent}% gasto)</p>
                                                                    </div>
                                                                )}
                                                                <select
                                                                    className="w-full text-xs p-1.5 border rounded bg-slate-50 dark:bg-slate-900 font-bold"
                                                                    value={mountedTire?.id || ''}
                                                                    onChange={(e) => handleTireChange(currentLayoutVehicle.id, slot.id, e.target.value)}
                                                                >
                                                                    <option value="">Vazio (Desmontar)</option>
                                                                    {tires.filter(t => t.status === 'Novo' || t.status === 'Estoque' || t.status === 'Recapagem' || t.id === mountedTire?.id).map(t => (
                                                                        <option key={t.id} value={t.id}>
                                                                            {t.serialNumber} - {t.brand} {t.position ? `(${t.position})` : ''}
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            });
                                        })()}
                                    </div>
                                </div>

                                <div className="p-6 border-t dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-center flex justify-between items-center text-xs text-slate-400">
                                    <span>Passe o mouse sobre os slots para ver dados telemétricos e trocar pneus</span>
                                    <button onClick={() => { setIsTireLayoutOpen(false); setLayoutVehicle(null); }} className="px-4 py-2 bg-slate-200 dark:bg-slate-700 font-bold rounded-lg text-slate-700 dark:text-white uppercase text-[10px]">Fechar</button>
                                </div>
                            </div>
                        </div>
                    );
                })()
            }
            {activeTab === 'almoxarifado' && (
                <div className="space-y-6 animate-in slide-in-from-right duration-500">
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700">
                        <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-teal-100 dark:bg-teal-900/30 text-teal-600 rounded-xl">
                                    <Package size={20} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-slate-900 dark:text-white">Almoxarifado de Manutenção</h3>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Controle de peças, pneus e insumos para frota.</p>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <div className="relative group">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-teal-600" size={16} />
                                    <input
                                        type="text"
                                        placeholder="Buscar peça..."
                                        className="pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-700/50 border-none rounded-xl text-xs font-bold w-64 focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 dark:bg-slate-900/50 text-[10px] uppercase font-black text-slate-400">
                                    <tr>
                                        <th className="px-6 py-4 rounded-l-xl">Item / Código</th>
                                        <th className="px-6 py-4">Categoria</th>
                                        <th className="px-6 py-4 text-center">Und.</th>
                                        <th className="px-6 py-4 text-center">Estoque Atual</th>
                                        <th className="px-6 py-4 text-center">Mínimo</th>
                                        <th className="px-6 py-4 text-right rounded-r-xl">Custo Médio</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y dark:divide-slate-700">
                                    {inventory
                                        .filter(i => {
                                            const cats = ['peças', 'pecas', 'manutenção', 'manutencao', 'pneus', 'oleos', 'óleos', 'filtros', 'insumos frota'];
                                            const isMaintCategory = cats.some(c => i.category.toLowerCase().includes(c));
                                            const matchesSearch = i.name.toLowerCase().includes(searchTerm.toLowerCase()) || i.id.toLowerCase().includes(searchTerm.toLowerCase());
                                            return isMaintCategory && matchesSearch;
                                        })
                                        .map(item => (
                                            <tr key={item.id} className="group hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-400">
                                                            <Settings size={14} />
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-slate-700 dark:text-slate-200">{item.name}</p>
                                                            <p className="text-[10px] text-slate-400 font-mono">#{item.id}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-500 uppercase">
                                                        {item.category}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-center text-xs font-bold text-slate-500">{item.unit}</td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-black ${item.quantity <= item.minStock
                                                        ? 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400 animate-pulse'
                                                        : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
                                                        }`}>
                                                        {item.quantity}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-center text-xs font-bold text-slate-400">{item.minStock}</td>
                                                <td className="px-6 py-4 text-right font-bold text-slate-700 dark:text-slate-300">
                                                    {formatBRL(item.price)}
                                                </td>
                                            </tr>
                                        ))}
                                    {inventory.filter(i => ['peças', 'pecas', 'manutenção', 'manutencao', 'pneus', 'oleos', 'óleos', 'filtros', 'insumos frota'].some(c => i.category.toLowerCase().includes(c))).length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic">
                                                Nenhum item de manutenção encontrado no estoque.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Fleet;
