import React, { useState } from 'react';
import {
    Plus, X, Users, UserPlus, Search, Download, Edit2, Trash2, Wallet, Clock, Calendar,
    CheckCircle, XCircle, DollarSign, ArrowUpRight, Fingerprint, Play, StopCircle, Timer,
    Plane, TrendingUp, AlertCircle, Filter, ChevronDown, FileText
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { Employee, PayrollRecord, TimeLog, Vacation, SalaryAdvance, PurchaseOrder } from '../types';
import { exportToCSV } from '../utils/exportUtils';

const HR = () => {
    const {
        employees, addEmployee, updateEmployee, deleteEmployee,
        payroll, addPayroll, payPayroll,
        timeLogs, addTimeLog,
        vacations, addVacation, updateVacationStatus, deleteVacation,
        salaryAdvances, addSalaryAdvance, updateAdvanceStatus, paySalaryAdvance, deleteAdvance,
        users
    } = useApp();
    const { addTransaction, accounts, hasPermission, currentUser, transactions, addPurchaseOrder, settings } = useApp();
    const { addToast } = useToast();

    const [activeTab, setActiveTab] = useState<'employees' | 'payroll' | 'vacations' | 'advances' | 'time'>('employees');
    const [searchTerm, setSearchTerm] = useState('');

    // Modals
    const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
    const [isPayrollModalOpen, setIsPayrollModalOpen] = useState(false);
    const [isVacationModalOpen, setIsVacationModalOpen] = useState(false);
    const [isAdvanceModalOpen, setIsAdvanceModalOpen] = useState(false);

    // Payment Modal State (Removed - Integrated with Purchases)
    // const [paymentModalOpen, setPaymentModalOpen] = useState(false);
    // const [paymentRecord, setPaymentRecord] = useState<PayrollRecord | null>(null);
    const [selectedAccount, setSelectedAccount] = useState<string>('');
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

    // Form States
    const [empForm, setEmpForm] = useState<Partial<Employee>>({
        status: 'Ativo',
        salary: 0,
        vacationDaysAvailable: 30,
        admissionDate: new Date().toISOString().split('T')[0]
    });

    // Tax Logic Helper
    const calculateTaxes = (baseSalary: number) => {
        // INSS 2024 (Progressive) - Simplified for Example
        let inss = 0;
        if (baseSalary <= 1412.00) inss = baseSalary * 0.075;
        else if (baseSalary <= 2666.68) inss = baseSalary * 0.09;
        else if (baseSalary <= 4000.03) inss = baseSalary * 0.12;
        else inss = baseSalary * 0.14;

        // Cap INSS
        if (inss > 908.85) inss = 908.85;

        // IRRF (Simplified Base)
        const baseIRRF = baseSalary - inss;
        let irrf = 0;
        if (baseIRRF <= 2259.20) irrf = 0;
        else if (baseIRRF <= 2826.65) irrf = (baseIRRF * 0.075) - 169.44;
        else if (baseIRRF <= 3751.05) irrf = (baseIRRF * 0.15) - 381.44;
        else if (baseIRRF <= 4664.68) irrf = (baseIRRF * 0.225) - 662.77;
        else irrf = (baseIRRF * 0.275) - 896.00;

        return { inss, irrf: Math.max(0, irrf) };
    };

    const [vacationForm, setVacationForm] = useState<Partial<Vacation>>({
        status: 'Solicitado',
        requestedAt: new Date().toLocaleDateString('pt-BR')
    });

    const [advanceForm, setAdvanceForm] = useState<Partial<SalaryAdvance>>({
        status: 'Pendente',
        requestDate: new Date().toLocaleDateString('pt-BR'),
        deductFromMonth: new Date().toISOString().slice(0, 7)
    });

    const filteredEmployees = employees.filter(emp =>
        emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.role.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
    };

    const handleSaveEmployee = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedEmployee) {
            updateEmployee({ ...selectedEmployee, ...empForm } as Employee);
        } else {
            const newEmp: Employee = {
                ...empForm,
                id: `emp-${Date.now()}`,
                name: empForm.name || '',
                role: empForm.role || '',
                department: empForm.department || '',
                email: empForm.email || '',
                status: empForm.status as any || 'Ativo',
                admissionDate: empForm.admissionDate || '',
                salary: Number(empForm.salary) || 0,
                vacationDaysAvailable: Number(empForm.vacationDaysAvailable) || 30
            } as Employee;
            addEmployee(newEmp);
        }
        setIsEmployeeModalOpen(false);
        setSelectedEmployee(null);
        setEmpForm({ status: 'Ativo', salary: 0, vacationDaysAvailable: 30 });
    };

    const handleGeneratePayroll = (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedAccount) {
            addToast("Por favor, selecione uma conta de pagamento para a provisão.", 'warning');
            return;
        }

        const month = new Date().toLocaleDateString('pt-BR', { month: '2-digit', year: 'numeric' });

        // Check if payroll already exists for this month to avoid duplicates
        const alreadyGenerated = payroll.some(p => p.month === month);
        if (alreadyGenerated) {
            addToast(`Já existem registros de folha para ${month}. Deseja gerar novamente (duplicar)?`, 'info', 10000, {
                label: 'GERAR',
                onClick: () => {
                    generatePayrollLogic(month);
                }
            });
            return;
        }

        generatePayrollLogic(month);
    };

    const generatePayrollLogic = (month: string) => {

        let count = 0;
        employees.filter(emp => emp.status === 'Ativo').forEach(emp => {
            // Verificar se há antecipações a descontar
            const advancesToDeduct = salaryAdvances.filter(
                adv => adv.employeeId === emp.id && adv.status === 'Pago' && adv.deductFromMonth === month
            );
            const totalAdvances = advancesToDeduct.reduce((sum, adv) => sum + adv.amount, 0);

            // Calculate Taxes
            const { inss, irrf } = calculateTaxes(emp.salary);
            const benefits = 500; // Mock VR/VA
            const totalDiscounts = inss + irrf + totalAdvances;

            const record: PayrollRecord = {
                id: `pay-${emp.id}-${Date.now()}`,
                employeeId: emp.id,
                employeeName: emp.name,
                month,
                baseSalary: emp.salary,
                benefits: benefits,
                overtime: 0,
                discounts: parseFloat(totalDiscounts.toFixed(2)),
                totalNet: parseFloat((emp.salary + benefits - totalDiscounts).toFixed(2)),
                status: 'Pendente'

            };
            addPayroll(record);

            // Create ODP (Purchase Order) for Authorization in Purchases Module
            const odp: PurchaseOrder = {
                id: `ODP-FOLHA-${record.id}`,
                supplierId: emp.id,
                supplierName: emp.name,
                date: new Date().toLocaleDateString('pt-BR'),
                items: [{
                    id: `PAY-${record.id}`,
                    name: `Salário Mensal - Competência ${month}`,
                    quantity: 1,
                    unit: 'UN',
                    price: record.totalNet
                }],
                subtotal: record.totalNet,
                total: record.totalNet,
                status: 'Pendente',
                attachments: [],
                paymentTerms: 'Transferência Bancária',
                shippingCost: 0,
                ledgerName: 'Salários e Ordenados',
                targetAccountId: selectedAccount, // Selected by user
                ledgerCode: '2.03.01'
            };
            addPurchaseOrder(odp);

            count++;
        });
        addToast(`Folha de ${month} gerada com sucesso para ${count} colaboradores!`, 'success');
        setIsPayrollModalOpen(false);
    };



    const handlePrintReceipt = (record: PayrollRecord) => {
        const companyName = settings?.companyName || "INFRACORE ERP";
        const companyDoc = settings?.document || "00.000.000/0000-00";

        // Simple HTML Template for Pay Slip (Holerite)
        const html = `
            <div style="font-family: monospace; padding: 40px; border: 1px solid #ccc; max-width: 800px; margin: 0 auto;">
                <div style="text-align: center; border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 30px;">
                    <h1 style="margin: 0; font-size: 24px; text-transform: uppercase;">Recibo de Pagamento de Salário</h1>
                    <p style="margin: 5px 0; font-size: 14px;">${companyName} - CNPJ: ${companyDoc}</p>
                </div>

                <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
                    <div>
                        <p style="margin: 2px 0; font-weight: bold;">Colaborador:</p>
                        <p style="margin: 2px 0;">${record.employeeName}</p>
                    </div>
                    <div style="text-align: right;">
                        <p style="margin: 2px 0; font-weight: bold;">Competência:</p>
                        <p style="margin: 2px 0;">${record.month}</p>
                    </div>
                </div>

                <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
                    <thead>
                        <tr style="border-bottom: 2px solid #000;">
                            <th style="text-align: left; padding: 10px;">Descrição</th>
                            <th style="text-align: right; padding: 10px;">Vencimentos</th>
                            <th style="text-align: right; padding: 10px;">Descontos</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style="padding: 10px; border-bottom: 1px solid #eee;">Salário Base</td>
                            <td style="text-align: right; padding: 10px; border-bottom: 1px solid #eee;">R$ ${record.baseSalary.toFixed(2)}</td>
                            <td style="text-align: right; padding: 10px; border-bottom: 1px solid #eee;">-</td>
                        </tr>
                        ${record.benefits ? `
                        <tr>
                            <td style="padding: 10px; border-bottom: 1px solid #eee;">Benefícios / Adicionais</td>
                            <td style="text-align: right; padding: 10px; border-bottom: 1px solid #eee;">R$ ${record.benefits.toFixed(2)}</td>
                            <td style="text-align: right; padding: 10px; border-bottom: 1px solid #eee;">-</td>
                        </tr>` : ''}
                        ${record.discounts ? `
                        <tr>
                            <td style="padding: 10px; border-bottom: 1px solid #eee;">Descontos (INSS/IRRF/Adiantamentos)</td>
                            <td style="text-align: right; padding: 10px; border-bottom: 1px solid #eee;">-</td>
                            <td style="text-align: right; padding: 10px; border-bottom: 1px solid #eee;">R$ ${record.discounts.toFixed(2)}</td>
                        </tr>` : ''}
                        <tr style="font-weight: bold; background-color: #f9f9f9;">
                            <td style="padding: 15px 10px;">TOTAIS</td>
                            <td style="text-align: right; padding: 15px 10px;">R$ ${(record.baseSalary + (record.benefits || 0)).toFixed(2)}</td>
                            <td style="text-align: right; padding: 15px 10px;">R$ ${(record.discounts || 0).toFixed(2)}</td>
                        </tr>
                    </tbody>
                </table>

                <div style="background: #eee; padding: 15px; border-radius: 8px; text-align: right; margin-bottom: 60px;">
                    <span style="font-weight: bold; font-size: 18px;">LÍQUIDO A RECEBER: R$ ${record.totalNet.toFixed(2)}</span>
                </div>

                <div style="display: flex; justify-content: space-between; gap: 40px;">
                    <div style="flex: 1; text-align: center;">
                        <div style="border-bottom: 1px solid #000; height: 1px; margin-bottom: 10px;"></div>
                        <p style="font-size: 10px;">${companyName}</p>
                    </div>
                    <div style="flex: 1; text-align: center;">
                        <div style="border-bottom: 1px solid #000; height: 1px; margin-bottom: 10px;"></div>
                        <p style="font-size: 10px;">${record.employeeName}</p>
                    </div>
                </div>
                
                <p style="text-align: center; margin-top: 40px; font-size: 10px; color: #999;">Documento gerado eletronicamente em ${new Date().toLocaleDateString()}</p>
            </div>
        `;

        const printWindow = window.open('', '', 'height=600,width=800');
        if (printWindow) {
            printWindow.document.write('<html><head><title>Recibo de Pagamento</title></head><body>');
            printWindow.document.write(html);
            printWindow.document.write('</body></html>');
            printWindow.document.close();
            printWindow.print();
        }
    };

    const handleSaveVacation = (e: React.FormEvent) => {
        e.preventDefault();
        const emp = employees.find(e => e.id === vacationForm.employeeId);
        if (!emp) return;

        const vacation: Vacation = {
            id: `vac-${Date.now()}`,
            employeeId: vacationForm.employeeId!,
            employeeName: emp.name,
            startDate: vacationForm.startDate!,
            endDate: vacationForm.endDate!,
            days: vacationForm.days!,
            status: 'Solicitado',
            requestedAt: new Date().toLocaleDateString('pt-BR'),
            notes: vacationForm.notes
        };
        addVacation(vacation);
        setIsVacationModalOpen(false);
        setVacationForm({ status: 'Solicitado', requestedAt: new Date().toLocaleDateString('pt-BR') });
    };

    const handleSaveAdvance = (e: React.FormEvent) => {
        e.preventDefault();
        const emp = employees.find(e => e.id === advanceForm.employeeId);
        if (!emp) return;

        // Validation: Check if Total Advances > Salary
        const requestedAmount = Number(advanceForm.amount) || 0;

        // Format YYYY-MM to MM/YYYY for system consistency
        const rawMonth = advanceForm.deductFromMonth || '';
        const [year, month] = rawMonth.split('-');
        const targetMonth = `${month}/${year}`;

        // Calculate existing advances for the same month
        const existingAdvances = salaryAdvances.filter(a =>
            a.employeeId === emp.id &&
            a.deductFromMonth === targetMonth &&
            ['Pendente', 'Aprovado', 'Pago'].includes(a.status)
        );
        const totalUsed = existingAdvances.reduce((sum, a) => sum + a.amount, 0);

        if ((totalUsed + requestedAmount) > emp.salary) {
            addToast(`LIMITE EXCEDIDO: O valor solicitado (${formatCurrency(requestedAmount)}) ultrapassa o salário mensal.`, 'error');
            return;
        }

        const advance: SalaryAdvance = {
            id: `adv-${Date.now()}`,
            employeeId: advanceForm.employeeId!,
            employeeName: emp.name,
            amount: requestedAmount,
            requestDate: new Date().toLocaleDateString('pt-BR'),
            status: 'Pendente',
            deductFromMonth: targetMonth,
            notes: advanceForm.notes
        };
        addSalaryAdvance(advance);
        setIsAdvanceModalOpen(false);
        setAdvanceForm({
            status: 'Pendente',
            requestDate: new Date().toLocaleDateString('pt-BR'),
            deductFromMonth: new Date().toISOString().slice(0, 7)
        });
    };

    const handlePayAdvance = (adv: SalaryAdvance) => {
        addToast(`Confirmar pagamento de antecipação: ${formatCurrency(adv.amount)} para ${adv.employeeName}?`, 'info', 10000, {
            label: 'CONFIRMAR',
            onClick: () => {
                // 1. Check if transaction already exists
                const txId = `tx-adv-${adv.id}`;
                if (transactions.some(t => t.id === txId)) {
                    addToast("Este adiantamento já foi processado no financeiro.", 'error');
                    return;
                }

                // 2. Create Financial Transaction
                addTransaction({
                    id: txId,
                    date: new Date().toLocaleDateString('pt-BR'),
                    description: `Adiantamento Salarial - ${adv.employeeName}`,
                    category: 'Adiantamentos',
                    type: 'Despesa',
                    amount: adv.amount,
                    status: 'Conciliado',
                    account: accounts[0]?.name || 'Caixa',
                    accountId: accounts[0]?.id || 'acc-1',
                    ledgerCode: '2.03.01',
                    ledgerName: 'Salários e Ordenados'
                });

                // 2. Update Status
                paySalaryAdvance(adv.id);
                addToast("Antecipação paga e registrada no financeiro.", 'success');
            }
        });
    };

    const handleTimeClock = (type: 'In' | 'Out') => {
        const now = new Date();
        const log: TimeLog = {
            id: `log-${Date.now()}`,
            employeeId: '1',
            date: now.toLocaleDateString('pt-BR'),
            checkIn: type === 'In' ? now.toLocaleTimeString() : '08:00',
            checkOut: type === 'Out' ? now.toLocaleTimeString() : undefined,
            status: 'Presente'
        };
        addTimeLog(log);
        addToast(`Ponto de ${type === 'In' ? 'Entrada' : 'Saída'} registrado às ${now.toLocaleTimeString()}`, 'success');
    };

    // --- Clock Kiosk Logic ---
    const [clockMethod, setClockMethod] = useState<'pin' | 'bio'>('pin');
    const [clockEmpId, setClockEmpId] = useState('');
    const [clockPass, setClockPass] = useState('');
    const [isBioScanning, setIsBioScanning] = useState(false);

    const handlePinClock = (type: 'In' | 'Out') => {
        if (!clockEmpId) {
            addToast("Selecione um colaborador.", 'warning');
            return;
        }
        const emp = employees.find(e => e.id === clockEmpId);
        if (!emp) return;

        // Verify password against linked user
        const user = users.find(u => u.employeeId === emp.id);

        // Fallback for verification
        if (!user) {
            if (clockPass !== '1234') {
                addToast("Senha padrão incorreta (1234).", 'error');
                return;
            }
        } else {
            if ((user.password && user.password !== clockPass) || (!user.password && clockPass !== '')) {
                addToast("Senha incorreta.", 'error');
                return;
            }
        }

        const now = new Date();
        addTimeLog({
            id: `log-${Date.now()}`,
            employeeId: emp.id,
            date: now.toLocaleDateString('pt-BR'),
            checkIn: type === 'In' ? now.toLocaleTimeString() : undefined,
            checkOut: type === 'Out' ? now.toLocaleTimeString() : undefined,
            status: type === 'In' ? 'Presente' : 'Saída'
        });
        addToast(`Ponto Registrado: ${emp.name} - ${type === 'In' ? 'ENTRADA' : 'SAÍDA'} às ${now.toLocaleTimeString()}`, 'success');
        setClockPass('');
        setClockEmpId('');
    };

    const handleBioSimulation = () => {
        setIsBioScanning(true);
        setTimeout(() => {
            setIsBioScanning(false);
            if (employees.length === 0) return;
            // Simulate recognizing the first active employee
            const emp = employees[0];
            const now = new Date();

            addTimeLog({
                id: `log-${Date.now()}`,
                employeeId: emp.id,
                date: now.toLocaleDateString('pt-BR'),
                checkIn: now.toLocaleTimeString(),
                status: 'Presente'
            });
            addToast(`BIOMETRIA RECONHECIDA: ${emp.name} - Entrada às ${now.toLocaleTimeString()}`, 'success');
        }, 2000);
    };

    return (
        <div className="flex flex-col gap-6 animate-in fade-in duration-500 pb-10" >
            {/* Header */}
            < div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6" >
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3 tracking-tight">
                        <div className="p-2 bg-cyan-600 rounded-2xl text-white shadow-xl shadow-cyan-600/20">
                            <Users size={24} />
                        </div>
                        Recursos Humanos
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-2 font-medium">Gestão de pessoas, férias e antecipações salariais.</p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border dark:border-slate-700">
                        <button onClick={() => setActiveTab('employees')} className={`px-4 py-2 text-xs font-black rounded-xl transition-all uppercase ${activeTab === 'employees' ? 'bg-white dark:bg-slate-700 text-cyan-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Colaboradores</button>
                        <button onClick={() => setActiveTab('advances')} className={`px-4 py-2 text-xs font-black rounded-xl transition-all uppercase ${activeTab === 'advances' ? 'bg-white dark:bg-slate-700 text-cyan-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Antecipações</button>
                        <button onClick={() => setActiveTab('payroll')} className={`px-4 py-2 text-xs font-black rounded-xl transition-all uppercase ${activeTab === 'payroll' ? 'bg-white dark:bg-slate-700 text-cyan-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Folha</button>
                        <button onClick={() => setActiveTab('time')} className={`px-4 py-2 text-xs font-black rounded-xl transition-all uppercase ${activeTab === 'time' ? 'bg-white dark:bg-slate-700 text-cyan-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Ponto</button>
                        {currentUser?.roleId === 'admin' && (
                            <button onClick={() => setActiveTab('vacations')} className={`px-4 py-2 text-xs font-black rounded-xl transition-all uppercase ${activeTab === 'vacations' ? 'bg-white dark:bg-slate-700 text-cyan-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Férias</button>
                        )}
                    </div>
                </div>
            </div>



            {/* ERROR / ACTION FEEDBACK */}
            {
                !hasPermission('employees.view') && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-200">
                        <p className="font-bold">Acesso Restrito: Você não tem permissão para visualizar dados de RH.</p>
                    </div>
                )
            }

            {
                hasPermission('employees.view') && (
                    <>
                        {/* KPI Cards */}

                        {/* KPI Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {[
                                { label: 'QUADRO TOTAL', value: employees.length, sub: 'Colaboradores', icon: <Users />, color: 'text-cyan-600', bg: 'bg-cyan-50 dark:bg-cyan-900/10' },
                                { label: 'CUSTO MENSAL', value: formatCurrency(employees.reduce((acc, e) => acc + e.salary, 0)), sub: 'Salários Base', icon: <DollarSign />, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/10' },
                                { label: 'FÉRIAS PENDENTES', value: vacations.filter(v => v.status === 'Solicitado').length, sub: 'Aguardando Aprovação', icon: <Plane />, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/10' },
                                { label: 'ANTECIPAÇÕES', value: formatCurrency(salaryAdvances.filter(a => a.status === 'Pendente').reduce((sum, a) => sum + a.amount, 0)), sub: 'Pendentes', icon: <TrendingUp />, color: 'text-rose-600', bg: 'bg-rose-50 dark:bg-rose-900/10' },
                            ].map((kpi, i) => (
                                <div key={i} className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className={`p-3 rounded-2xl ${kpi.bg} ${kpi.color}`}>{kpi.icon}</div>
                                        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                    </div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{kpi.label}</p>
                                    <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{kpi.value}</h3>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">{kpi.sub}</p>
                                </div>
                            ))}
                        </div>

                        {/* Employees Tab */}
                        {activeTab === 'employees' && (
                            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
                                <div className="p-6 border-b dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div className="relative group flex-1 max-w-md">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                        <input
                                            type="text"
                                            placeholder="Buscar por nome ou cargo..."
                                            className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border-none rounded-xl text-xs font-bold shadow-inner"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </div>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => exportToCSV(filteredEmployees, 'Colaboradores')}
                                            className="p-3 bg-white dark:bg-slate-700 text-slate-400 hover:text-emerald-500 rounded-xl shadow-sm border dark:border-slate-600 transition-colors"
                                            title="Exportar Excel"
                                        >
                                            <Download size={18} />
                                        </button>
                                        <button
                                            onClick={() => {
                                                setSelectedEmployee(null);
                                                setEmpForm({
                                                    status: 'Ativo',
                                                    salary: 0,
                                                    vacationDaysAvailable: 30,
                                                    admissionDate: new Date().toISOString().split('T')[0]
                                                });
                                                setIsEmployeeModalOpen(true);
                                            }}
                                            className="px-5 py-3 bg-indigo-600 text-white font-black rounded-xl shadow-lg hover:bg-indigo-700 transition-all flex items-center gap-2 text-xs uppercase tracking-widest"
                                        >
                                            <UserPlus size={16} /> Novo Colaborador
                                        </button>
                                    </div>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-slate-50 dark:bg-gray-800 text-[10px] font-black text-slate-400 uppercase border-b dark:border-gray-700">
                                            <tr>
                                                <th className="px-6 py-4">Colaborador</th>
                                                <th className="px-6 py-4">Cargo / Depto</th>
                                                <th className="px-6 py-4 text-center">Status</th>
                                                <th className="px-6 py-4 text-center">Férias Disp.</th>
                                                <th className="px-6 py-4 text-right">Salário</th>
                                                <th className="px-6 py-4 text-right">Ações</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y dark:divide-gray-700">
                                            {filteredEmployees.map(emp => (
                                                <tr key={emp.id} className="group hover:bg-slate-50 dark:hover:bg-cyan-900/10 transition-all">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-10 h-10 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 rounded-xl flex items-center justify-center font-black">
                                                                {emp.name.split(' ').map(n => n[0]).join('')}
                                                            </div>
                                                            <div>
                                                                <p className="font-black text-slate-900 dark:text-white">{emp.name}</p>
                                                                <p className="text-[10px] text-slate-400 font-bold">{emp.email}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <p className="font-bold text-slate-800 dark:text-slate-200">{emp.role}</p>
                                                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{emp.department}</p>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${emp.status === 'Ativo' ? 'bg-emerald-100 text-emerald-700' : emp.status === 'Férias' ? 'bg-blue-100 text-blue-700' : 'bg-rose-100 text-rose-700'}`}>
                                                            {emp.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className="font-black text-slate-900 dark:text-white">{emp.vacationDaysAvailable || 30} dias</span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right font-black text-slate-900 dark:text-white">
                                                        {formatCurrency(emp.salary)}
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            {hasPermission('employees.manage') && (
                                                                <>
                                                                    <button onClick={() => { setSelectedEmployee(emp); setEmpForm(emp); setIsEmployeeModalOpen(true); }} className="p-2 text-slate-400 hover:text-cyan-600 transition-colors"><Edit2 size={18} /></button>
                                                                    <button onClick={() => {
                                                                        addToast('Excluir colaborador?', 'warning', 5000, {
                                                                            label: 'EXCLUIR',
                                                                            onClick: () => deleteEmployee(emp.id)
                                                                        });
                                                                    }} className="p-2 text-slate-400 hover:text-rose-600 transition-colors"><Trash2 size={18} /></button>
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
                        )}

                        {/* Vacations Tab */}
                        {activeTab === 'vacations' && currentUser?.roleId === 'admin' && (
                            <div className="space-y-6">
                                <div className="flex justify-end">
                                    <button
                                        onClick={() => setIsVacationModalOpen(true)}
                                        className="px-6 py-3 bg-cyan-600 text-white font-black text-xs rounded-xl shadow-lg shadow-cyan-600/20 uppercase tracking-widest flex items-center gap-2"
                                    >
                                        <Plus size={18} /> Solicitar Férias
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {vacations.map(vac => (
                                        <div key={vac.id} className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700">
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <h3 className="font-black text-slate-900 dark:text-white text-lg">{vac.employeeName}</h3>
                                                    <p className="text-xs text-slate-400 font-bold mt-1">{vac.days} dias • {vac.startDate} a {vac.endDate}</p>
                                                </div>
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${vac.status === 'Aprovado' ? 'bg-emerald-100 text-emerald-700' :
                                                    vac.status === 'Rejeitado' ? 'bg-rose-100 text-rose-700' :
                                                        'bg-amber-100 text-amber-700'
                                                    }`}>
                                                    {vac.status}
                                                </span>
                                            </div>
                                            {vac.notes && <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 italic">"{vac.notes}"</p>}
                                            {vac.status === 'Solicitado' && hasPermission('employees.manage') && (
                                                <div className="flex gap-2 pt-4 border-t dark:border-slate-700">
                                                    <button
                                                        onClick={() => updateVacationStatus(vac.id, 'Aprovado', currentUser?.name || 'Admin')}
                                                        className="flex-1 py-2 bg-emerald-600 text-white font-black text-xs rounded-xl uppercase flex items-center justify-center gap-2 hover:bg-emerald-500 transition-colors"
                                                    >
                                                        <CheckCircle size={16} /> Aprovar
                                                    </button>
                                                    <button
                                                        onClick={() => updateVacationStatus(vac.id, 'Rejeitado', currentUser?.name || 'Admin')}
                                                        className="flex-1 py-2 bg-rose-600 text-white font-black text-xs rounded-xl uppercase flex items-center justify-center gap-2 hover:bg-rose-500 transition-colors"
                                                    >
                                                        <XCircle size={16} /> Rejeitar
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    {vacations.length === 0 && (
                                        <div className="col-span-2 text-center py-20 text-slate-400 italic">
                                            <Plane size={48} className="mx-auto mb-4 opacity-20" />
                                            <p className="font-medium">Nenhuma solicitação de férias</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Salary Advances Tab */}
                        {activeTab === 'advances' && (
                            <div className="space-y-6">
                                <div className="flex justify-end">
                                    <button
                                        onClick={() => setIsAdvanceModalOpen(true)}
                                        className="px-5 py-3 bg-indigo-600 text-white font-black rounded-xl shadow-lg hover:bg-indigo-700 transition-all flex items-center gap-2 text-xs uppercase tracking-widest"
                                    >
                                        <Plus size={16} /> Solicitar Antecipação
                                    </button>
                                </div>

                                <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm text-left">
                                            <thead className="bg-slate-50 dark:bg-gray-800 text-[10px] font-black text-slate-400 uppercase border-b dark:border-gray-700">
                                                <tr>
                                                    <th className="px-6 py-4">Colaborador</th>
                                                    <th className="px-6 py-4 text-right">Valor</th>
                                                    <th className="px-6 py-4">Desconto em</th>
                                                    <th className="px-6 py-4 text-center">Status</th>
                                                    <th className="px-6 py-4 text-right">Ações</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y dark:divide-gray-700">
                                                {salaryAdvances.map(adv => (
                                                    <tr key={adv.id} className="hover:bg-slate-50 dark:hover:bg-cyan-900/10 transition-all">
                                                        <td className="px-6 py-5 font-bold text-slate-800 dark:text-white">{adv.employeeName}</td>
                                                        <td className="px-6 py-5 text-right font-black text-emerald-600">{formatCurrency(adv.amount)}</td>
                                                        <td className="px-6 py-5 font-black text-slate-500">{adv.deductFromMonth}</td>
                                                        <td className="px-6 py-5 text-center">
                                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${adv.status === 'Pago' ? 'bg-emerald-100 text-emerald-700' :
                                                                adv.status === 'Aprovado' ? 'bg-blue-100 text-blue-700' :
                                                                    adv.status === 'Rejeitado' ? 'bg-rose-100 text-rose-700' :
                                                                        'bg-amber-100 text-amber-700'
                                                                }`}>
                                                                {adv.status}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-5 text-right">
                                                            <div className="flex justify-end gap-2">
                                                                {adv.status === 'Pendente' && hasPermission('employees.manage') && (
                                                                    <>
                                                                        <button
                                                                            onClick={() => updateAdvanceStatus(adv.id, 'Aprovado', currentUser?.name || 'Admin')}
                                                                            className="px-3 py-1.5 bg-emerald-600 text-white font-black text-[10px] rounded-lg hover:scale-105 transition-transform uppercase"
                                                                        >
                                                                            Aprovar
                                                                        </button>
                                                                        <button
                                                                            onClick={() => updateAdvanceStatus(adv.id, 'Rejeitado', currentUser?.name || 'Admin')}
                                                                            className="px-3 py-1.5 bg-rose-600 text-white font-black text-[10px] rounded-lg hover:scale-105 transition-transform uppercase"
                                                                        >
                                                                            Rejeitar
                                                                        </button>
                                                                    </>
                                                                )}
                                                                {adv.status === 'Aprovado' && hasPermission('finance.transact') && (
                                                                    <button
                                                                        onClick={() => handlePayAdvance(adv)}
                                                                        className="px-4 py-1.5 bg-cyan-600 text-white font-black text-[10px] rounded-lg shadow-sm hover:scale-105 transition-transform uppercase"
                                                                    >
                                                                        Pagar
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                                {salaryAdvances.length === 0 && (
                                                    <tr><td colSpan={5} className="px-6 py-20 text-center text-slate-400 italic font-medium uppercase text-xs tracking-widest">Nenhuma antecipação registrada...</td></tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Payroll Tab */}
                        {activeTab === 'payroll' && (
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
                                    <div className="p-6 border-b dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                                        <div className="flex items-center gap-3">
                                            <Wallet className="text-emerald-600" />
                                            <h3 className="font-black text-lg text-slate-900 dark:text-white uppercase tracking-tight">Folha de Pagamento</h3>
                                        </div>
                                        <div className="flex gap-3">
                                            <button
                                                onClick={() => exportToCSV(payroll, 'Folha_Pagamento')}
                                                className="p-2 bg-white dark:bg-slate-700 text-slate-400 hover:text-emerald-500 rounded-xl shadow-sm border dark:border-slate-600 transition-colors"
                                            >
                                                <Download size={16} />
                                            </button>
                                            <button onClick={() => setIsPayrollModalOpen(true)} disabled={!hasPermission('employees.manage')} className="px-4 py-2 bg-emerald-600 text-white font-black rounded-xl text-xs uppercase shadow-lg shadow-emerald-600/20 disabled:opacity-50 disabled:cursor-not-allowed">Gerar Folha Mensal</button>
                                        </div>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm text-left">
                                            <thead className="bg-slate-50 dark:bg-gray-800 text-[10px] font-black text-slate-400 uppercase border-b dark:border-gray-700">
                                                <tr>
                                                    <th className="px-6 py-4">Competência</th>
                                                    <th className="px-6 py-4">Colaborador</th>
                                                    <th className="px-6 py-4 text-right">Líquido</th>
                                                    <th className="px-6 py-4 text-center">Status</th>
                                                    <th className="px-6 py-4 text-right">Ações</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y dark:divide-gray-700">
                                                {payroll.map(p => (
                                                    <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-emerald-900/10 transition-all">
                                                        <td className="px-6 py-5 font-black text-slate-500">{p.month}</td>
                                                        <td className="px-6 py-5 font-bold text-slate-800 dark:text-white">{p.employeeName}</td>
                                                        <td className="px-6 py-5 text-right font-black text-emerald-600">{formatCurrency(p.totalNet)}</td>
                                                        <td className="px-6 py-5 text-center">
                                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${p.status === 'Pago' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                                                {p.status}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-5 text-right">
                                                            {p.status === 'Pendente' && (
                                                                <span className="text-[10px] text-slate-400 font-bold italic">Aguardando Autorização (Central de Compras)</span>
                                                            )
                                                            }
                                                            {p.status === 'Pago' && (
                                                                <button onClick={() => handlePrintReceipt(p)} className="px-4 py-1.5 bg-white border border-slate-200 text-slate-600 font-bold text-[10px] rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1 uppercase">
                                                                    <FileText size={12} /> Recibo
                                                                </button>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                                {payroll.length === 0 && (
                                                    <tr><td colSpan={5} className="px-6 py-20 text-center text-slate-400 italic font-medium uppercase text-xs tracking-widest">Aguardando geração da folha...</td></tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-8 rounded-3xl shadow-2xl text-white">
                                    <h3 className="text-2xl font-black mb-6 flex items-center gap-2"><DollarSign className="text-emerald-400" /> Resumo</h3>
                                    <div className="space-y-6">
                                        <div className="p-4 bg-white/5 rounded-2xl">
                                            <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Total Provisão Mensal</p>
                                            <p className="text-3xl font-black text-emerald-400">{formatCurrency(employees.reduce((acc, e) => acc + e.salary * 1.5, 0))}</p>
                                            <p className="text-[10px] text-slate-500 font-bold mt-1">Incluindo encargos patronais</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Time Clock Tab (Reformulated) */}
                        {activeTab === 'time' && (
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                                {/* Kiosk Panel */}
                                <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden flex flex-col">
                                    <div className="p-6 border-b dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-center">
                                        <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-2">Relógio de Ponto</h3>
                                        <p className="text-xs font-bold text-slate-400 uppercase">Selecione o método de identificação</p>
                                    </div>

                                    <div className="flex border-b dark:border-slate-700">
                                        <button
                                            onClick={() => setClockMethod('pin')}
                                            className={`flex-1 py-4 text-xs font-black uppercase tracking-widest transition-colors ${clockMethod === 'pin' ? 'bg-white dark:bg-slate-800 text-cyan-600 border-b-2 border-cyan-600' : 'bg-slate-50 dark:bg-slate-900 text-slate-400'}`}
                                        >
                                            Senha / PIN
                                        </button>
                                        <button
                                            onClick={() => setClockMethod('bio')}
                                            className={`flex-1 py-4 text-xs font-black uppercase tracking-widest transition-colors ${clockMethod === 'bio' ? 'bg-white dark:bg-slate-800 text-cyan-600 border-b-2 border-cyan-600' : 'bg-slate-50 dark:bg-slate-900 text-slate-400'}`}
                                        >
                                            Biometria (Serial)
                                        </button>
                                    </div>

                                    <div className="p-8 flex-1 flex flex-col justify-center">
                                        {clockMethod === 'pin' ? (
                                            <div className="space-y-6 max-w-sm mx-auto w-full">
                                                <div>
                                                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Colaborador</label>
                                                    <select
                                                        className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl py-4 font-bold text-sm"
                                                        value={clockEmpId}
                                                        onChange={e => setClockEmpId(e.target.value)}
                                                    >
                                                        <option value="">Selecione seu nome...</option>
                                                        {employees.filter(e => e.status === 'Ativo').map(e => (
                                                            <option key={e.id} value={e.id}>{e.name}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Senha / PIN</label>
                                                    <input
                                                        type="password"
                                                        className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl py-4 font-bold text-center text-2xl tracking-widest"
                                                        placeholder="••••"
                                                        value={clockPass}
                                                        onChange={e => setClockPass(e.target.value)}
                                                    />
                                                </div>
                                                <div className="grid grid-cols-2 gap-4 pt-4">
                                                    <button
                                                        onClick={() => handlePinClock('In')}
                                                        className="py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase shadow-lg shadow-emerald-600/20 hover:scale-105 transition-transform"
                                                    >
                                                        Entrada
                                                    </button>
                                                    <button
                                                        onClick={() => handlePinClock('Out')}
                                                        className="py-4 bg-rose-600 text-white rounded-2xl font-black uppercase shadow-lg shadow-rose-600/20 hover:scale-105 transition-transform"
                                                    >
                                                        Saída
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-center space-y-8">
                                                <div className={`w-32 h-32 mx-auto rounded-full border-4 flex items-center justify-center transition-all ${isBioScanning ? 'border-cyan-400 bg-cyan-50 animate-pulse' : 'border-slate-100 bg-slate-50'}`}>
                                                    <Fingerprint size={64} className={isBioScanning ? 'text-cyan-600' : 'text-slate-300'} />
                                                </div>
                                                <div>
                                                    <h4 className="font-black text-slate-900 dark:text-white uppercase mb-2">Leitor Biométrico (COM3)</h4>
                                                    <p className="text-sm text-slate-500">{isBioScanning ? 'Lendo impressão digital...' : 'Posicione o dedo no leitor'}</p>
                                                </div>
                                                <button
                                                    onClick={handleBioSimulation}
                                                    disabled={isBioScanning}
                                                    className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold uppercase text-xs tracking-widest disabled:opacity-50"
                                                >
                                                    {isBioScanning ? 'Processando...' : 'Iniciar Leitura Manual'}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Recent Logs (Existing) */}
                                <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col">
                                    <div className="p-6 border-b dark:border-slate-700 flex justify-between items-center bg-slate-50/50">
                                        <div className="flex items-center gap-3">
                                            <Timer className="text-cyan-600" />
                                            <h3 className="font-black text-lg text-slate-900 dark:text-white uppercase">Últimos Registros</h3>
                                        </div>
                                    </div>
                                    <div className="flex-1 p-6 space-y-4 overflow-y-auto max-h-[500px]">
                                        {timeLogs.map(log => (
                                            <div key={log.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-transparent hover:border-cyan-100 transition-all">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-12 h-12 rounded-xl shadow-sm flex items-center justify-center font-black ${log.status === 'Saída' ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                                        {log.status === 'Saída' ? <StopCircle size={24} /> : <Play size={24} />}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-sm text-slate-800 dark:text-white">{employees.find(e => e.id === log.employeeId)?.name || 'Colaborador'}</p>
                                                        <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">{log.date} • {log.checkIn || log.checkOut}</p>
                                                    </div>
                                                </div>
                                                <span className={`px-3 py-1 text-[10px] font-black rounded-full uppercase ${log.status === 'Saída' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>{log.status === 'Presente' ? 'Entrada' : log.status}</span>
                                            </div>
                                        ))}
                                        {timeLogs.length === 0 && (
                                            <p className="text-center text-slate-400 py-10 italic font-medium uppercase text-xs tracking-widest">Nenhum registro hoje.</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Employee Modal */}
                        {isEmployeeModalOpen && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                                <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-lg border dark:border-slate-700 animate-in zoom-in duration-200">
                                    <div className="p-6 border-b dark:border-slate-700 flex justify-between items-center">
                                        <h3 className="font-black text-xl text-slate-900 dark:text-white uppercase tracking-tight">{selectedEmployee ? 'Editar' : 'Cadastrar'} Colaborador</h3>
                                        <button onClick={() => setIsEmployeeModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
                                    </div>
                                    <form onSubmit={handleSaveEmployee} className="p-6 space-y-4">
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest">Nome Completo</label>
                                            <input type="text" className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl py-3 font-bold text-sm" value={empForm.name || ''} onChange={e => setEmpForm({ ...empForm, name: e.target.value })} required />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest">Cargo</label>
                                                <select
                                                    className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl py-3 font-bold text-sm"
                                                    value={empForm.role || ''}
                                                    onChange={e => setEmpForm({ ...empForm, role: e.target.value })}
                                                    required
                                                >
                                                    <option value="">Selecione o Cargo...</option>
                                                    {[
                                                        'Ajudante Geral',
                                                        'Analista Financeiro',
                                                        'Apontador',
                                                        'Assistente Administrativo',
                                                        'Comprador',
                                                        'Diretor',
                                                        'Eletricista',
                                                        'Engenheiro Civil',
                                                        'Gerente de Obras',
                                                        'Gerente de Projetos',
                                                        'Mecânico',
                                                        'Mestre de Obras',
                                                        'Motorista',
                                                        'Operador de Máquinas',
                                                        'Pedreiro',
                                                        'Servente',
                                                        'Técnico de Segurança',
                                                        'Vendedor'
                                                    ].map(role => (
                                                        <option key={role} value={role}>{role}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest">Departamento</label>
                                                <select className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl py-3 font-bold text-sm" value={empForm.department || ''} onChange={e => setEmpForm({ ...empForm, department: e.target.value })} required>
                                                    <option value="">Selecione...</option>
                                                    <option value="Engenharia">Engenharia</option>
                                                    <option value="Financeiro">Financeiro</option>
                                                    <option value="Operações">Operações</option>
                                                    <option value="Recursos Humanos">Recursos Humanos</option>
                                                    <option value="Vendas">Vendas</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest">Salário Base (R$)</label>
                                                <input type="number" className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl py-3 font-bold text-sm" value={empForm.salary || ''} onChange={e => setEmpForm({ ...empForm, salary: Number(e.target.value) })} required />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest">Dias de Férias</label>
                                                <input type="number" className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl py-3 font-bold text-sm" value={empForm.vacationDaysAvailable || 30} onChange={e => setEmpForm({ ...empForm, vacationDaysAvailable: Number(e.target.value) })} />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest">E-mail Corporativo</label>
                                            <input type="email" className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl py-3 font-bold text-sm" value={empForm.email || ''} onChange={e => setEmpForm({ ...empForm, email: e.target.value })} required />
                                        </div>
                                        <button type="submit" className="w-full py-4 bg-cyan-600 text-white font-black rounded-2xl shadow-lg mt-6 uppercase tracking-widest text-xs hover:bg-cyan-500 transition-all">{selectedEmployee ? 'Salvar Alterações' : 'Contratar Colaborador'}</button>
                                    </form>
                                </div>
                            </div>
                        )}

                        {/* Vacation Modal */}
                        {isVacationModalOpen && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                                <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-md border dark:border-slate-700 animate-in zoom-in duration-200">
                                    <div className="p-6 border-b dark:border-slate-700 flex justify-between items-center">
                                        <h3 className="font-black text-xl text-slate-900 dark:text-white uppercase tracking-tight">Solicitar Férias</h3>
                                        <button onClick={() => setIsVacationModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
                                    </div>
                                    <form onSubmit={handleSaveVacation} className="p-6 space-y-4">
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest">Colaborador</label>
                                            <select className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl py-3 font-bold text-sm" value={vacationForm.employeeId || ''} onChange={e => setVacationForm({ ...vacationForm, employeeId: e.target.value })} required>
                                                <option value="">Selecione...</option>
                                                {employees.filter(e => e.status === 'Ativo').map(emp => (
                                                    <option key={emp.id} value={emp.id}>{emp.name} ({emp.vacationDaysAvailable || 30} dias disponíveis)</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="grid grid-cols-3 gap-4">
                                            <div className="col-span-2 grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest">Data Início</label>
                                                    <input type="date" className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl py-3 font-bold text-sm" value={vacationForm.startDate || ''} onChange={e => setVacationForm({ ...vacationForm, startDate: e.target.value })} required />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest">Data Fim</label>
                                                    <input type="date" className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl py-3 font-bold text-sm" value={vacationForm.endDate || ''} onChange={e => setVacationForm({ ...vacationForm, endDate: e.target.value })} required />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest">Dias</label>
                                                <input type="number" className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl py-3 font-bold text-sm" value={vacationForm.days || ''} onChange={e => setVacationForm({ ...vacationForm, days: Number(e.target.value) })} required />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest">Observações</label>
                                            <textarea className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl py-3 font-bold text-sm" rows={3} value={vacationForm.notes || ''} onChange={e => setVacationForm({ ...vacationForm, notes: e.target.value })} />
                                        </div>
                                        <button type="submit" className="w-full py-4 bg-cyan-600 text-white font-black rounded-2xl shadow-lg mt-6 uppercase tracking-widest text-xs">Solicitar Férias</button>
                                    </form>
                                </div>
                            </div>
                        )}

                        {/* Salary Advance Modal */}
                        {isAdvanceModalOpen && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                                <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-md border dark:border-slate-700 animate-in zoom-in duration-200">
                                    <div className="p-6 border-b dark:border-slate-700 flex justify-between items-center">
                                        <h3 className="font-black text-xl text-slate-900 dark:text-white uppercase tracking-tight">Antecipação Salarial</h3>
                                        <button onClick={() => setIsAdvanceModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
                                    </div>
                                    <form onSubmit={handleSaveAdvance} className="p-6 space-y-4">
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest">Colaborador</label>
                                            <select className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl py-3 font-bold text-sm" value={advanceForm.employeeId || ''} onChange={e => setAdvanceForm({ ...advanceForm, employeeId: e.target.value })} required>
                                                <option value="">Selecione...</option>
                                                {employees.filter(e => e.status === 'Ativo').map(emp => (
                                                    <option key={emp.id} value={emp.id}>{emp.name} (Salário: {formatCurrency(emp.salary)})</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest">Valor (R$)</label>
                                                <input type="number" step="0.01" className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl py-3 font-bold text-sm" value={advanceForm.amount || ''} onChange={e => setAdvanceForm({ ...advanceForm, amount: Number(e.target.value) })} required />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest">Descontar em (Competência)</label>
                                                <input type="month" className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl py-3 font-bold text-sm" value={advanceForm.deductFromMonth || ''} onChange={e => setAdvanceForm({ ...advanceForm, deductFromMonth: e.target.value })} required />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest">Observações</label>
                                            <textarea className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl py-3 font-bold text-sm" rows={3} value={advanceForm.notes || ''} onChange={e => setAdvanceForm({ ...advanceForm, notes: e.target.value })} />
                                        </div>
                                        <button type="submit" className="w-full py-4 bg-cyan-600 text-white font-black rounded-2xl shadow-lg mt-6 uppercase tracking-widest text-xs">Solicitar Antecipação</button>
                                    </form>
                                </div>
                            </div>
                        )}

                        {/* Payroll Modal */}
                        {isPayrollModalOpen && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                                <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-md border dark:border-slate-700 animate-in zoom-in duration-200">
                                    <div className="p-6 border-b dark:border-slate-700 flex justify-between items-center text-center">
                                        <h3 className="font-black text-xl text-slate-900 dark:text-white uppercase tracking-tight mx-auto">Fechar Folha Mensal</h3>
                                        <button onClick={() => setIsPayrollModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
                                    </div>
                                    <div className="p-8 space-y-6 text-center">
                                        <div className="p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl border-2 border-emerald-100 dark:border-emerald-800">
                                            <p className="text-[10px] font-black text-emerald-700 uppercase mb-1">Competência Selecionada</p>
                                            <p className="text-3xl font-black text-emerald-600">{new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</p>
                                        </div>
                                        <p className="text-slate-500 text-sm font-medium">Ao confirmar, o sistema gerará os lançamentos de folha para todos os <strong>{employees.filter(e => e.status === 'Ativo').length}</strong> colaboradores ativos.</p>

                                        <div className="text-left bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                                            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Conta de Pagamento (Previsão)</label>
                                            <select
                                                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl py-3 px-3 font-bold text-sm outline-none focus:border-cyan-500 transition-colors"
                                                value={selectedAccount}
                                                onChange={(e) => setSelectedAccount(e.target.value)}
                                            >
                                                <option value="">Selecione uma conta...</option>
                                                {accounts.map(acc => (
                                                    <option key={acc.id} value={acc.id}>{acc.name} ({acc.bankName || acc.type})</option>
                                                ))}
                                            </select>
                                        </div>

                                        <button onClick={handleGeneratePayroll} className="w-full py-4 bg-emerald-600 text-white font-black rounded-2xl shadow-lg uppercase tracking-widest text-xs hover:bg-emerald-500 transition-all">Confirmar Geração</button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )
            }

        </div >
    );
};

export default HR;
