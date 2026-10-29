import React, { useState, useMemo, useEffect } from 'react';
import {
    Plus, X, Users, UserPlus, Search, Download, Edit2, Trash2, Wallet, Clock, Calendar,
    CheckCircle, XCircle, DollarSign, ArrowUpRight, Fingerprint, Play, StopCircle, Timer,
    Plane, TrendingUp, AlertCircle, Filter, ChevronDown, FileText, Printer, Check, RotateCcw,
    AlertTriangle, ShieldCheck, Sun, Info, Eye, ChevronRight
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
    const { addTransaction, deleteTransaction, accounts, hasPermission, currentUser, transactions, addPurchaseOrder, settings, updateSettings } = useApp();
    const { addToast } = useToast();

    const [activeTab, setActiveTab] = useState<'employees' | 'payroll' | 'vacations' | 'advances' | 'time'>('employees');
    const [searchTerm, setSearchTerm] = useState('');

    // Modals
    const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
    const [isPayrollModalOpen, setIsPayrollModalOpen] = useState(false);
    const [isVacationModalOpen, setIsVacationModalOpen] = useState(false);
    const [isAdvanceModalOpen, setIsAdvanceModalOpen] = useState(false);

    const [selectedAccount, setSelectedAccount] = useState<string>('');
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

    // Form States
    const [empForm, setEmpForm] = useState<Partial<Employee>>({
        status: 'Ativo',
        salary: 0,
        vacationDaysAvailable: 30,
        admissionDate: new Date().toISOString().split('T')[0]
    });

    // Estados de Liquidação e Estorno de Antecipações
    const [isPayAdvanceModalOpen, setIsPayAdvanceModalOpen] = useState(false);
    const [selectedAdvanceToPay, setSelectedAdvanceToPay] = useState<SalaryAdvance | null>(null);
    const [advancePaymentForm, setAdvancePaymentForm] = useState({
        accountId: '',
        paymentMethod: 'PIX' as 'PIX' | 'Transferência Bancária' | 'Dinheiro' | 'Cheque',
        date: new Date().toISOString().split('T')[0],
        notes: ''
    });

    const [isRefundAdvanceModalOpen, setIsRefundAdvanceModalOpen] = useState(false);
    const [selectedAdvanceToRefund, setSelectedAdvanceToRefund] = useState<SalaryAdvance | null>(null);
    const [refundReason, setRefundReason] = useState('');

    // Permissão restrita para estorno de antecipações e férias (Admin ou Gerente Financeiro)
    const canRefundAdvance = useMemo(() => {
        if (!currentUser) return false;
        return (
            currentUser.roleId === 'admin' ||
            currentUser.roleId === 'manager_finance' ||
            currentUser.roleId === 'financial' ||
            hasPermission('all') ||
            hasPermission('finance.admin') ||
            hasPermission('finance.delete')
        );
    }, [currentUser, hasPermission]);

    // Permissão ampla para visualização e operação da aba de Férias (Admin, Gestores ou employees.manage)
    const canAccessVacations = useMemo(() => {
        if (!currentUser) return false;
        return (
            currentUser.roleId === 'admin' ||
            currentUser.roleId === 'manager' ||
            currentUser.roleId === 'manager_finance' ||
            hasPermission('employees.manage') ||
            hasPermission('all')
        );
    }, [currentUser, hasPermission]);

    // Sub-abas e estados da Reformulação de Férias
    const [vacationSubTab, setVacationSubTab] = useState<'requests' | 'periods' | 'calendar'>('requests');
    const [vacationStatusFilter, setVacationStatusFilter] = useState<string>('Todos');
    const [selectedCalendarMonth, setSelectedCalendarMonth] = useState<string>(new Date().toISOString().slice(0, 7)); // YYYY-MM

    // Estados de Pagamento e Estorno de Férias
    const [isPayVacationModalOpen, setIsPayVacationModalOpen] = useState(false);
    const [selectedVacationToPay, setSelectedVacationToPay] = useState<Vacation | null>(null);
    const [vacationPaymentForm, setVacationPaymentForm] = useState({
        accountId: '',
        paymentMethod: 'PIX' as 'PIX' | 'Transferência Bancária' | 'Dinheiro' | 'Cheque',
        date: new Date().toISOString().split('T')[0],
        notes: ''
    });

    const [isRefundVacationModalOpen, setIsRefundVacationModalOpen] = useState(false);
    const [selectedVacationToRefund, setSelectedVacationToRefund] = useState<Vacation | null>(null);
    const [refundVacationReason, setRefundVacationReason] = useState('');

    // Modal de Recibo Oficial de Férias
    const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
    const [selectedVacationForReceipt, setSelectedVacationForReceipt] = useState<Vacation | null>(null);

    // Estados da Folha de Pagamento (Com e Sem Encargos Federais)
    const [payrollChargeView, setPayrollChargeView] = useState<'without_taxes' | 'with_taxes'>('without_taxes');
    const [payrollTaxSettings, setPayrollTaxSettings] = useState({
        regime: 'Lucro Presumido / Real' as 'Lucro Presumido / Real' | 'Simples Nacional' | 'Desonerada' | 'Personalizado',
        applyFGTS: true,             // 8%
        applyINSSPatronal: true,     // 28.8%
        applyProvisaoFerias13: true  // 19.44%
    });
    const [showTaxConfig, setShowTaxConfig] = useState(false);
    const [provisionMode, setProvisionMode] = useState<'net' | 'gross_with_taxes'>('net');

    // Estados do Espelho de Ponto
    const [timeViewMode, setTimeViewMode] = useState<'timesheet' | 'kiosk'>('timesheet');
    const [selectedEspelhoEmpId, setSelectedEspelhoEmpId] = useState<string>('');
    const [selectedEspelhoMonth, setSelectedEspelhoMonth] = useState<string>(new Date().toISOString().slice(0, 7)); // YYYY-MM
    const [isManualTimeModalOpen, setIsManualTimeModalOpen] = useState(false);
    const [manualTimeForm, setManualTimeForm] = useState({
        employeeId: '',
        date: new Date().toISOString().split('T')[0],
        checkIn: '08:00',
        lunchStart: '12:00',
        lunchEnd: '13:00',
        checkOut: '17:00',
        reason: 'Marcação normal de trabalho'
    });

    // Estados de Abono e Justificativa de Faltas no Ponto
    const [isJustifyModalOpen, setIsJustifyModalOpen] = useState(false);
    const [selectedJustifyDay, setSelectedJustifyDay] = useState<{
        day: number;
        dateStr: string;
        dateIso: string;
        weekday: string;
        workedMins: number;
        expectedMins: number;
        deltaMin: number;
    } | null>(null);
    const [justifyForm, setJustifyForm] = useState({
        type: 'Atestado Médico (Art. 473 CLT)',
        reason: '',
        doctorCrm: ''
    });

    // Justificativas persistidas em localStorage
    const [justifications, setJustifications] = useState<Record<string, { type: string; reason: string; doctorCrm?: string; approvedBy: string; date: string }>>(() => {
        try {
            if (settings?.config?.hrJustifications && typeof settings.config.hrJustifications === 'object') {
                return settings.config.hrJustifications;
            }
            const stored = localStorage.getItem('infracore_hr_justifications');
            return stored ? JSON.parse(stored) : {};
        } catch {
            return {};
        }
    });

    // Helper para converter string de horário "HH:MM" para minutos

    useEffect(() => {
        if (settings?.config?.hrJustifications && typeof settings.config.hrJustifications === 'object') {
            setJustifications(settings.config.hrJustifications);
        }
    }, [settings?.config?.hrJustifications]);

    const parseTimeToMinutes = (t?: string): number | null => {
        if (!t) return null;
        const parts = t.trim().split(':').map(Number);
        if (parts.length >= 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
            return parts[0] * 60 + parts[1];
        }
        return null;
    };

    // Helper para formatar minutos em string legível "Xh YYmin"
    const formatMinutesToHours = (mins: number) => {
        const sign = mins < 0 ? '-' : '';
        const abs = Math.abs(mins);
        const h = Math.floor(abs / 60);
        const m = abs % 60;
        return `${sign}${h}h ${m.toString().padStart(2, '0')}m`;
    };

    // Helper para cálculo progressivo oficial do INSS (CLT 2024/2026)
    const calculateProgressiveINSS = (base: number) => {
        let inss = 0;
        if (base <= 1412.00) {
            inss = base * 0.075;
        } else if (base <= 2666.68) {
            inss = (base * 0.09) - 21.18;
        } else if (base <= 4000.03) {
            inss = (base * 0.12) - 101.18;
        } else if (base <= 7786.02) {
            inss = (base * 0.14) - 181.18;
        } else {
            inss = 908.86;
        }
        return Number(Math.min(908.86, Math.max(0, inss)).toFixed(2));
    };

    // Helper para cálculo progressivo do IRRF (CLT / Receita Federal)
    const calculateIRRF = (baseIRRF: number) => {
        let irrf = 0;
        if (baseIRRF <= 2259.20) {
            irrf = 0;
        } else if (baseIRRF <= 2826.65) {
            irrf = (baseIRRF * 0.075) - 169.44;
        } else if (baseIRRF <= 3751.05) {
            irrf = (baseIRRF * 0.15) - 381.44;
        } else if (baseIRRF <= 4664.68) {
            irrf = (baseIRRF * 0.225) - 662.77;
        } else {
            irrf = (baseIRRF * 0.275) - 896.00;
        }
        return Number(Math.max(0, irrf).toFixed(2));
    };

    // Helper para cálculo detalhado da folha de pagamento de um colaborador com consistência telemétrica de ponto e CLT
    const calculateEmployeePayroll = (emp: Employee, month: string) => {
        // Normalização de mês de competência (suporta 'MM/YYYY' ou 'YYYY-MM')
        let targetMonth = '';
        let targetYear = '';
        if (month.includes('/')) {
            const parts = month.split('/');
            targetMonth = parts[0].padStart(2, '0');
            targetYear = parts[1];
        } else if (month.includes('-')) {
            const parts = month.split('-');
            targetYear = parts[0];
            targetMonth = parts[1].padStart(2, '0');
        } else {
            const now = new Date();
            targetMonth = String(now.getMonth() + 1).padStart(2, '0');
            targetYear = String(now.getFullYear());
        }

        const yearNum = parseInt(targetYear, 10) || new Date().getFullYear();
        const monthNum = parseInt(targetMonth, 10) || (new Date().getMonth() + 1);
        const daysInMonth = new Date(yearNum, monthNum, 0).getDate();

        // 1. Apuração diária completa: Horas Extras, Atrasos e Faltas Integrais Injustificadas com DSR (CLT Art. 6º Lei 605/49)
        let extraMinutes = 0;
        let delayMinutes = 0;
        let daysWorked = 0;
        let unjustifiedAbsenceDays = 0;
        const weeksWithAbsence = new Set<number>();

        for (let day = 1; day <= daysInMonth; day++) {
            const dateObj = new Date(yearNum, monthNum - 1, day);
            const dayOfWeek = dateObj.getDay();
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
            const weekNumber = Math.floor((day - 1) / 7);

            const dayPadded = String(day).padStart(2, '0');
            const monthPadded = String(monthNum).padStart(2, '0');
            const dateIso = `${yearNum}-${monthPadded}-${dayPadded}`;
            const dateBr = `${dayPadded}/${monthPadded}/${yearNum}`;

            // Checar se o colaborador estava em gozo de férias aprovadas/concluídas neste dia
            const onVacation = vacations.some(v => {
                if (v.employeeId !== emp.id || (v.status !== 'Aprovado' && v.status !== 'Concluído')) return false;
                const parseD = (dStr: string) => {
                    if (dStr.includes('/')) {
                        const parts = dStr.split('/');
                        return new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0])).getTime();
                    }
                    return new Date(dStr).getTime();
                };
                const cur = dateObj.getTime();
                return cur >= parseD(v.startDate) && cur <= parseD(v.endDate);
            });

            // Checar se há justificativa ou abono legal (Atestado Médico / Art. 473 CLT)
            const justKey = `${emp.id}-${dateIso}`;
            const isJustified = !!justifications[justKey];

            // Localizar marcação de ponto
            const log = timeLogs.find(l => {
                if (l.employeeId !== emp.id) return false;
                const ld = l.date || '';
                return ld === dateIso || ld === dateBr;
            });

            const isLogAbonado = log?.status === ('Abonado' as any) || log?.status === ('Justificado' as any);

            if (onVacation) {
                // Período de férias regulamentares
                continue;
            }

            if (isWeekend) {
                // Trabalho excepcional em DSR ou sábado
                if (log?.checkIn && log?.checkOut) {
                    const inMin = parseTimeToMinutes(log.checkIn);
                    const outMin = parseTimeToMinutes(log.checkOut);
                    if (inMin !== null && outMin !== null && outMin > inMin) {
                        extraMinutes += (outMin - inMin);
                    }
                }
                continue;
            }

            // Dia Útil Normal
            if (isJustified || isLogAbonado) {
                daysWorked++;
                // Dia integralmente abonado por lei (sem acréscimo nem desconto)
                continue;
            }

            if (log && log.checkIn) {
                daysWorked++;
                const inMin = parseTimeToMinutes(log.checkIn);
                const outMin = parseTimeToMinutes(log.checkOut);

                if (inMin !== null && outMin !== null && outMin > inMin) {
                    let lunchMin = 60;
                    if (log.lunchStart && log.lunchEnd) {
                        const ls = parseTimeToMinutes(log.lunchStart);
                        const le = parseTimeToMinutes(log.lunchEnd);
                        if (ls !== null && le !== null && le > ls) lunchMin = le - ls;
                    }
                    const totalWorked = Math.max(0, (outMin - inMin) - lunchMin);
                    const standardDay = 480; // 8h normais
                    const rawDelta = totalWorked - standardDay;

                    if (Math.abs(rawDelta) <= 10) {
                        // Tolerância legal Art. 58 § 1º CLT
                    } else if (rawDelta > 10) {
                        extraMinutes += rawDelta;
                    } else if (rawDelta < -10) {
                        delayMinutes += Math.abs(rawDelta);
                    }
                } else if (log.status === 'Extra') {
                    extraMinutes += 120;
                } else if (log.status === 'Atraso') {
                    delayMinutes += 60;
                }
            } else {
                // Dia útil sem marcação e sem justificativa legal = Falta Integral Injustificada
                // Apenas computa se a data for anterior ou igual à data de hoje
                const today = new Date();
                today.setHours(23, 59, 59, 999);
                if (dateObj <= today) {
                    unjustifiedAbsenceDays++;
                    weeksWithAbsence.add(weekNumber);
                }
            }
        }

        const overtimeHours = Number((extraMinutes / 60).toFixed(2));
        const delayHours = Number((delayMinutes / 60).toFixed(2));
        const lostDsrDays = weeksWithAbsence.size; // 1 DSR perdido por semana com falta injustificada (Art. 6º Lei 605/49)

        // Salário dia (divisor 30) e salário hora (divisor CLT 220 para jornada 44h)
        const dailyRate = emp.salary > 0 ? emp.salary / 30 : 0;
        const hourlyRate = emp.salary > 0 ? emp.salary / 220 : 0;

        const overtimeEarnings = Number((overtimeHours * hourlyRate * 1.5).toFixed(2)); // Horas Extras 50%
        const dsrEarnings = Number((overtimeEarnings * (1 / 6)).toFixed(2)); // DSR s/ Horas Extras (Súmula 172 TST)
        const totalOvertime = Number((overtimeEarnings + dsrEarnings).toFixed(2));

        const delayDiscounts = Number((delayHours * hourlyRate).toFixed(2));
        const absenceDiscounts = Number(((unjustifiedAbsenceDays + lostDsrDays) * dailyRate).toFixed(2));

        // 2. Benefícios (VR / VA)
        const benefits = 550.00;

        // 3. Desconto legal de Vale Transporte (CLT Art. 458: até 6% do salário base)
        const transportDiscount = Number(Math.min(emp.salary * 0.06, 180.00).toFixed(2));

        // 4. Antecipações Salariais a descontar nesta competência
        const advancesToDeduct = salaryAdvances.filter(adv => {
            if (adv.employeeId !== emp.id) return false;
            if (adv.status !== 'Pago' && adv.status !== 'Aprovado') return false;
            const advMonth = adv.deductFromMonth || '';
            let advM = '';
            let advY = '';
            if (advMonth.includes('/')) {
                const p = advMonth.split('/');
                advM = p[0].padStart(2, '0');
                advY = p[1];
            } else if (advMonth.includes('-')) {
                const p = advMonth.split('-');
                advY = p[0];
                advM = p[1].padStart(2, '0');
            }
            return advM === targetMonth && advY === targetYear;
        });
        const totalAdvances = advancesToDeduct.reduce((sum, adv) => sum + adv.amount, 0);

        // 5. Tributos (INSS e IRRF) - Base tributável considera salário deduzido de faltas/atrasos e acrescido de HE
        const baseINSS = Number(Math.max(0, emp.salary - absenceDiscounts - delayDiscounts + totalOvertime).toFixed(2));
        const inss = calculateProgressiveINSS(baseINSS);

        const baseIRRF = Math.max(0, Number((baseINSS - inss).toFixed(2)));
        const irrf = calculateIRRF(baseIRRF);

        // 6. FGTS e Encargos Patronais (Parametrizáveis com e sem encargos)
        const fgtsRate = payrollTaxSettings.applyFGTS ? 0.08 : 0;
        const inssPatronalRate = payrollTaxSettings.applyINSSPatronal ? 0.288 : 0;
        const provisaoRate = payrollTaxSettings.applyProvisaoFerias13 ? 0.1944 : 0;

        const fgts = Number((baseINSS * fgtsRate).toFixed(2));
        const inssPatronal = Number((baseINSS * inssPatronalRate).toFixed(2));
        const provisaoFerias13 = Number((baseINSS * provisaoRate).toFixed(2));
        const totalFederalTaxes = Number((fgts + inssPatronal + provisaoFerias13).toFixed(2));

        // 7. Totais de Vencimentos, Descontos e Líquido
        const totalEarnings = Number((emp.salary + totalOvertime + benefits).toFixed(2));
        const totalDiscounts = Number((inss + irrf + totalAdvances + delayDiscounts + absenceDiscounts + transportDiscount).toFixed(2));
        const totalNet = Number(Math.max(0, totalEarnings - totalDiscounts).toFixed(2));
        const totalCompanyCost = Number((totalEarnings + totalFederalTaxes).toFixed(2));

        return {
            baseSalary: emp.salary,
            daysWorked,
            overtimeHours,
            overtimeEarnings,
            dsrEarnings,
            totalOvertime,
            delayHours,
            delayDiscounts,
            unjustifiedAbsenceDays,
            lostDsrDays,
            absenceDiscounts,
            benefits,
            transportDiscount,
            totalAdvances,
            baseINSS,
            inss,
            baseIRRF,
            irrf,
            fgts,
            inssPatronal,
            provisaoFerias13,
            totalFederalTaxes,
            totalEarnings,
            totalDiscounts,
            totalNet,
            totalCompanyCost
        };
    };

    // Helper para cálculo completo do Recibo de Férias nos moldes da CLT (Art. 142 e 145)
    const calculateVacationReceipt = (emp: Employee, days: number = 30, hasAbono: boolean = false, abonoDays: number = 10) => {
        const dailySalary = emp.salary > 0 ? emp.salary / 30 : 0;
        const baseDays = Math.max(0, days);
        const vacationSalary = Number((dailySalary * baseDays).toFixed(2));
        const tercoConstitucional = Number((vacationSalary / 3).toFixed(2));

        // Abono pecuniário (venda legal de até 10 dias - Art. 143 CLT) - Isento de INSS e IRRF (Súmula 125 STJ)
        const abonoSalary = hasAbono ? Number((dailySalary * abonoDays).toFixed(2)) : 0;
        const abonoTerco = hasAbono ? Number((abonoSalary / 3).toFixed(2)) : 0;
        const totalAbono = Number((abonoSalary + abonoTerco).toFixed(2));

        const grossVacation = Number((vacationSalary + tercoConstitucional).toFixed(2));
        const inss = calculateProgressiveINSS(grossVacation);
        const baseIRRF = Math.max(0, grossVacation - inss);
        const irrf = calculateIRRF(baseIRRF);

        const totalDiscounts = Number((inss + irrf).toFixed(2));
        const netVacation = Number(Math.max(0, grossVacation - totalDiscounts + totalAbono).toFixed(2));
        const totalCompanyCost = Number((grossVacation + totalAbono).toFixed(2));

        return {
            dailySalary,
            days: baseDays,
            vacationSalary,
            tercoConstitucional,
            hasAbono,
            abonoDays,
            abonoSalary,
            abonoTerco,
            totalAbono,
            grossVacation,
            inss,
            irrf,
            totalDiscounts,
            netVacation,
            totalCompanyCost
        };
    };

    const [vacationForm, setVacationForm] = useState<Partial<Vacation> & { sellDays?: boolean; sellDaysCount?: number }>({
        status: 'Solicitado',
        requestedAt: new Date().toLocaleDateString('pt-BR'),
        days: 30,
        sellDays: false,
        sellDaysCount: 10
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

    const handleSaveManualTime = (e: React.FormEvent) => {
        e.preventDefault();
        const targetEmpId = manualTimeForm.employeeId || selectedEspelhoEmpId || employees[0]?.id;
        if (!targetEmpId) {
            addToast("Selecione um colaborador.", 'warning');
            return;
        }

        const inMin = parseTimeToMinutes(manualTimeForm.checkIn);
        const outMin = parseTimeToMinutes(manualTimeForm.checkOut);
        const lsMin = parseTimeToMinutes(manualTimeForm.lunchStart);
        const leMin = parseTimeToMinutes(manualTimeForm.lunchEnd);

        let lunchDuration = 60;
        if (lsMin !== null && leMin !== null && leMin > lsMin) {
            lunchDuration = leMin - lsMin;
        }

        let workedMin = 0;
        if (inMin !== null && outMin !== null && outMin > inMin) {
            workedMin = Math.max(0, (outMin - inMin) - lunchDuration);
        }

        const totalHours = (workedMin / 60).toFixed(2);
        let status: 'Regular' | 'Extra' | 'Atraso' | 'Presente' = 'Presente';
        if (workedMin > 480) {
            status = 'Extra';
        } else if (workedMin < 480 && workedMin > 0) {
            status = 'Atraso';
        }

        const newLog: TimeLog = {
            id: `log-manual-${Date.now()}`,
            employeeId: targetEmpId,
            date: manualTimeForm.date,
            checkIn: manualTimeForm.checkIn,
            lunchStart: manualTimeForm.lunchStart,
            lunchEnd: manualTimeForm.lunchEnd,
            checkOut: manualTimeForm.checkOut,
            totalHours,
            status
        };

        addTimeLog(newLog);
        addToast(`Marcação manual registrada com sucesso!`, 'success');
        setIsManualTimeModalOpen(false);
    };

    const currentEspelhoEmp = useMemo(() => {
        if (selectedEspelhoEmpId) {
            return employees.find(e => e.id === selectedEspelhoEmpId) || employees[0];
        }
        return employees[0];
    }, [selectedEspelhoEmpId, employees]);

    const espelhoData = useMemo(() => {
        if (!currentEspelhoEmp) {
            return {
                daysData: [],
                totals: {
                    expectedMins: 0,
                    expectedStr: '0h 00m',
                    workedMins: 0,
                    workedStr: '0h 00m',
                    overtimeMins: 0,
                    overtimeStr: '0h 00m',
                    delayMins: 0,
                    delayStr: '0h 00m',
                    balanceMins: 0,
                    balanceStr: '0h 00m'
                }
            };
        }

        const [yStr, mStr] = selectedEspelhoMonth.split('-');
        const year = parseInt(yStr, 10);
        const monthNum = parseInt(mStr, 10);
        const daysInMonth = new Date(year, monthNum, 0).getDate();

        let totalExpectedMins = 0;
        let totalWorkedMins = 0;
        let totalOvertimeMins = 0;
        let totalDelayMins = 0;

        const weekdayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        const daysData = [];

        for (let day = 1; day <= daysInMonth; day++) {
            const dateObj = new Date(year, monthNum - 1, day);
            const dayOfWeek = dateObj.getDay();
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
            const weekday = weekdayNames[dayOfWeek];

            const dayPadded = String(day).padStart(2, '0');
            const monthPadded = String(monthNum).padStart(2, '0');
            const dateIso = `${year}-${monthPadded}-${dayPadded}`;
            const dateBr = `${dayPadded}/${monthPadded}/${year}`;

            // Férias
            const onVacation = vacations.some(v => {
                if (v.employeeId !== currentEspelhoEmp.id || (v.status !== 'Aprovado' && v.status !== 'Concluído')) return false;
                const parseD = (dStr: string) => {
                    if (dStr.includes('/')) {
                        const parts = dStr.split('/');
                        return new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0])).getTime();
                    }
                    return new Date(dStr).getTime();
                };
                const cur = dateObj.getTime();
                return cur >= parseD(v.startDate) && cur <= parseD(v.endDate);
            });

            // Abono / Justificativa de Falta
            const justKey = `${currentEspelhoEmp.id}-${dateIso}`;
            const just = justifications[justKey];
            const isJustified = !!just;

            // Log de ponto
            const log = timeLogs.find(l => {
                if (l.employeeId !== currentEspelhoEmp.id) return false;
                const ld = l.date || '';
                return ld === dateIso || ld === dateBr;
            });

            let checkIn = log?.checkIn || '';
            let lunchStart = log?.lunchStart || '';
            let lunchEnd = log?.lunchEnd || '';
            let checkOut = log?.checkOut || '';

            let expectedMins = 0;
            let workedMins = 0;
            let occurrence = '';

            if (onVacation) {
                occurrence = 'Férias Regulamentares';
            } else if (isWeekend) {
                occurrence = dayOfWeek === 0 ? 'DSR (Descanso Semanal)' : 'Sábado (Compensado)';
                if (log?.checkIn && log?.checkOut) {
                    occurrence = 'Trabalho em DSR/Fim de Semana (100%)';
                }
            } else if (isJustified) {
                expectedMins = 480; // 8h
                totalExpectedMins += expectedMins;
                workedMins = expectedMins; // Ausência totalmente abonada
                occurrence = `Abono Legal: ${just.type}`;
            } else {
                expectedMins = 480; // 8h
                totalExpectedMins += expectedMins;
                occurrence = 'Dia Útil Normal';
            }

            if (!isJustified && log) {
                if (checkIn && checkOut) {
                    const inMin = parseTimeToMinutes(checkIn);
                    const outMin = parseTimeToMinutes(checkOut);
                    if (inMin !== null && outMin !== null && outMin > inMin) {
                        let lunchDuration = 60;
                        if (lunchStart && lunchEnd) {
                            const ls = parseTimeToMinutes(lunchStart);
                            const le = parseTimeToMinutes(lunchEnd);
                            if (ls !== null && le !== null && le > ls) lunchDuration = le - ls;
                        }
                        workedMins = Math.max(0, (outMin - inMin) - lunchDuration);
                    }
                } else if (log.status === 'Extra') {
                    workedMins = 600;
                } else if (log.status === 'Presente') {
                    workedMins = 480;
                }
            }

            totalWorkedMins += workedMins;

            const rawDeltaMin = workedMins - expectedMins;
            let deltaMin = rawDeltaMin;

            // Tolerância CLT (Art. 58, § 1º: Variações de até 10 minutos diários não são computadas nem descontadas)
            const isWithinCltTolerance = !isWeekend && !onVacation && !isJustified && workedMins > 0 && Math.abs(rawDeltaMin) <= 10;
            if (isWithinCltTolerance) {
                deltaMin = 0;
                occurrence = 'Jornada Cumprida (Tolerância Legal Art. 58 CLT)';
            } else if (deltaMin > 0) {
                totalOvertimeMins += deltaMin;
                if (!occurrence.includes('DSR') && !occurrence.includes('Férias') && !occurrence.includes('Abono')) {
                    occurrence = `Hora Extra (+${formatMinutesToHours(deltaMin)})`;
                }
            } else if (deltaMin < 0) {
                if (!isWeekend && !onVacation && !isJustified) {
                    totalDelayMins += Math.abs(deltaMin);
                    if (workedMins === 0) {
                        occurrence = 'Falta Não Justificada';
                    } else {
                        occurrence = `Atraso / Saída (-${formatMinutesToHours(Math.abs(deltaMin))})`;
                    }
                }
            }

            daysData.push({
                day,
                dateStr: dateBr,
                dateIso,
                weekday,
                isWeekend,
                onVacation,
                isJustified,
                justification: just,
                isWithinCltTolerance,
                checkIn,
                lunchStart,
                lunchEnd,
                checkOut,
                workedMins,
                workedStr: formatMinutesToHours(workedMins),
                expectedMins,
                expectedStr: formatMinutesToHours(expectedMins),
                deltaMin,
                deltaStr: deltaMin > 0 ? `+${formatMinutesToHours(deltaMin)}` : deltaMin < 0 ? `-${formatMinutesToHours(Math.abs(deltaMin))}` : '0h 00m',
                occurrence
            });
        }

        const balanceMins = totalOvertimeMins - totalDelayMins;

        const totals = {
            expectedMins: totalExpectedMins,
            expectedStr: formatMinutesToHours(totalExpectedMins),
            workedMins: totalWorkedMins,
            workedStr: formatMinutesToHours(totalWorkedMins),
            overtimeMins: totalOvertimeMins,
            overtimeStr: formatMinutesToHours(totalOvertimeMins),
            delayMins: totalDelayMins,
            delayStr: formatMinutesToHours(totalDelayMins),
            balanceMins,
            balanceStr: balanceMins >= 0 ? `+${formatMinutesToHours(balanceMins)}` : `-${formatMinutesToHours(Math.abs(balanceMins))}`
        };

        return { daysData, totals };
    }, [currentEspelhoEmp, selectedEspelhoMonth, timeLogs, vacations, justifications]);

    const payrollSummary = useMemo(() => {
        const activeEmps = employees.filter(e => e.status === 'Ativo');
        const currentMonth = new Date().toLocaleDateString('pt-BR', { month: '2-digit', year: 'numeric' });
        let totalBase = 0;
        let totalOvertime = 0;
        let totalBenefits = 0;
        let totalDiscountsEmployee = 0;
        let totalNet = 0;
        let totalINSSPatronal = 0;
        let totalFGTS = 0;
        let totalProvisao13Ferias = 0;
        let totalFederalTaxes = 0;
        let totalCompanyCost = 0;

        activeEmps.forEach(emp => {
            const calc = calculateEmployeePayroll(emp, currentMonth);
            totalBase += calc.baseSalary;
            totalOvertime += calc.totalOvertime;
            totalBenefits += calc.benefits;
            totalDiscountsEmployee += calc.totalDiscounts;
            totalNet += calc.totalNet;
            totalINSSPatronal += calc.inssPatronal;
            totalFGTS += calc.fgts;
            totalProvisao13Ferias += calc.provisaoFerias13;
            totalFederalTaxes += calc.totalFederalTaxes;
            totalCompanyCost += calc.totalCompanyCost;
        });

        const effectiveTaxRate = totalBase > 0 ? (totalFederalTaxes / totalBase) * 100 : 0;

        return {
            totalBase,
            totalOvertime,
            totalBenefits,
            totalDiscountsEmployee,
            totalNet,
            totalINSSPatronal,
            totalFGTS,
            totalProvisao13Ferias,
            totalFederalTaxes,
            totalCompanyCost,
            effectiveTaxRate
        };
    }, [employees, timeLogs, salaryAdvances, payrollTaxSettings]);

    const exportPayrollCSV = () => {
        if (payrollChargeView === 'without_taxes') {
            const dataToExport = payroll.map(p => {
                const emp = employees.find(e => e.id === p.employeeId);
                const calc = emp ? calculateEmployeePayroll(emp, p.month) : null;
                return {
                    Competencia: p.month,
                    Colaborador: p.employeeName,
                    Cargo: emp?.role || 'N/D',
                    SalarioBase: p.baseSalary,
                    HorasExtras_DSR: p.overtime || (calc?.totalOvertime || 0),
                    Beneficios: p.benefits || (calc?.benefits || 0),
                    Descontos: p.discounts || (calc?.totalDiscounts || 0),
                    TotalLiquido: p.totalNet,
                    Status: p.status,
                    DataPagamento: p.paidAt || 'Pendente'
                };
            });
            exportToCSV(dataToExport, `Folha_Pagamento_Sem_Encargos_${new Date().toISOString().slice(0, 10)}`);
        } else {
            const dataToExport = payroll.map(p => {
                const emp = employees.find(e => e.id === p.employeeId);
                const calc = emp ? calculateEmployeePayroll(emp, p.month) : null;
                return {
                    Competencia: p.month,
                    Colaborador: p.employeeName,
                    Cargo: emp?.role || 'N/D',
                    BaseINSS: calc?.baseINSS || p.baseSalary,
                    FGTS_8Porcento: calc?.fgts || 0,
                    INSS_Patronal_28_8Porcento: calc?.inssPatronal || 0,
                    Provisao_13_Ferias_19_4Porcento: calc?.provisaoFerias13 || 0,
                    TotalEncargosFederais: calc?.totalFederalTaxes || 0,
                    CustoTotalEmpresa: calc?.totalCompanyCost || p.totalNet,
                    RegimeTributario: payrollTaxSettings.regime,
                    Status: p.status
                };
            });
            exportToCSV(dataToExport, `Folha_Pagamento_Com_Encargos_${new Date().toISOString().slice(0, 10)}`);
        }
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
            const payrollCalc = calculateEmployeePayroll(emp, month);

            const record: PayrollRecord = {
                id: `pay-${emp.id}-${Date.now()}`,
                employeeId: emp.id,
                employeeName: emp.name,
                month,
                baseSalary: emp.salary,
                benefits: payrollCalc.benefits,
                overtime: payrollCalc.totalOvertime,
                discounts: payrollCalc.totalDiscounts,
                totalNet: payrollCalc.totalNet,
                status: 'Pendente'
            };
            addPayroll(record);

            const targetAccountId = selectedAccount || accounts[0]?.id || 'acc-1';
            const isFullTaxes = provisionMode === 'gross_with_taxes';
            const provisionAmount = isFullTaxes ? payrollCalc.totalCompanyCost : record.totalNet;
            const provisionItemName = isFullTaxes
                ? `Custo Folha c/ Encargos (${payrollTaxSettings.regime}) - Comp. ${month} (Total: ${formatCurrency(provisionAmount)})`
                : `Salário Mensal Líquido - Competência ${month} (Líq: ${formatCurrency(provisionAmount)})`;

            // Create ODP (Purchase Order) for Authorization in Purchases Module
            const odp: PurchaseOrder = {
                id: `ODP-FOLHA-${record.id}`,
                supplierId: emp.id,
                supplierName: emp.name,
                date: new Date().toLocaleDateString('pt-BR'),
                items: [{
                    id: `PAY-${record.id}`,
                    name: provisionItemName,
                    quantity: 1,
                    unit: 'UN',
                    price: provisionAmount
                }],
                subtotal: provisionAmount,
                total: provisionAmount,
                status: 'Pendente',
                attachments: [],
                paymentTerms: 'Transferência Bancária / PIX',
                shippingCost: 0,
                ledgerName: 'Salários e Ordenados',
                targetAccountId,
                ledgerCode: '2.03.01'
            };
            addPurchaseOrder(odp);

            // Create Pending Financial Transaction for accounts payable visibility
            const txId = `tx-pay-${record.id}`;
            if (!transactions.some(t => t.id === txId)) {
                addTransaction({
                    id: txId,
                    date: new Date().toLocaleDateString('pt-BR'),
                    description: isFullTaxes
                        ? `Provisão Folha Integral c/ Encargos (${month}) - ${emp.name}`
                        : `Provisão Folha Salarial Líquida (${month}) - ${emp.name}`,
                    category: 'Folha de Pagamento',
                    type: 'Despesa',
                    amount: provisionAmount,
                    status: 'Pendente',
                    account: accounts.find(a => a.id === targetAccountId)?.name || accounts[0]?.name || 'Caixa',
                    accountId: targetAccountId,
                    ledgerCode: '2.03.01',
                    ledgerName: 'Salários e Ordenados'
                });
            }

            count++;
        });
        addToast(`Folha de ${month} processada para ${count} colaboradores (${provisionMode === 'gross_with_taxes' ? 'com encargos federais' : 'líquido'})!`, 'success');
        setIsPayrollModalOpen(false);
    };

    const handlePrintReceipt = (record: PayrollRecord) => {
        const companyName = settings?.companyName || "INFRACORE ERP CONSTRUTORA LTDA";
        const companyDoc = settings?.document || "00.000.000/0001-90";
        const emp = employees.find(e => e.id === record.employeeId);
        const calc = emp ? calculateEmployeePayroll(emp, record.month) : null;

        const baseSalary = record.baseSalary;
        const overtimeVal = record.overtime || (calc?.totalOvertime || 0);
        const benefitsVal = record.benefits || (calc?.benefits || 0);
        const inssVal = calc?.inss || 0;
        const irrfVal = calc?.irrf || 0;
        const advancesVal = calc?.totalAdvances || 0;
        const delaysVal = calc?.delayDiscounts || 0;
        const absenceVal = calc?.absenceDiscounts || 0;
        const absenceDays = (calc?.unjustifiedAbsenceDays || 0) + (calc?.lostDsrDays || 0);
        const transportVal = calc?.transportDiscount || 0;

        const totalEarnings = baseSalary + overtimeVal + benefitsVal;
        const totalDiscounts = record.discounts;
        const netSalary = record.totalNet;

        const html = `
            <div style="font-family: 'Segoe UI', Arial, sans-serif; padding: 25px; border: 2px solid #334155; max-width: 820px; margin: 0 auto; color: #1e293b; background: #fff;">
                <div style="display: flex; justify-content: space-between; border-bottom: 2px solid #0d9488; padding-bottom: 15px; margin-bottom: 20px;">
                    <div>
                        <h2 style="margin: 0; font-size: 20px; text-transform: uppercase; color: #0d9488; font-weight: 900;">${companyName}</h2>
                        <p style="margin: 3px 0; font-size: 11px; color: #64748b;">CNPJ: ${companyDoc} • Sistema InfraCore RH</p>
                    </div>
                    <div style="text-align: right;">
                        <h3 style="margin: 0; font-size: 16px; font-weight: bold; text-transform: uppercase;">Recibo de Pagamento (Holerite)</h3>
                        <p style="margin: 3px 0; font-size: 12px; font-weight: bold; color: #0d9488;">Competência: ${record.month}</p>
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 10px; background: #f8fafc; padding: 12px; border-radius: 8px; margin-bottom: 20px; font-size: 11px; border: 1px solid #e2e8f0;">
                    <div><strong>Colaborador:</strong> ${record.employeeName}</div>
                    <div><strong>Cargo:</strong> ${emp?.role || 'N/D'}</div>
                    <div><strong>Depto:</strong> ${emp?.department || 'Operacional'}</div>
                    <div><strong>Matrícula:</strong> ${record.employeeId}</div>
                    <div><strong>Admissão:</strong> ${emp?.admissionDate || '01/01/2024'}</div>
                    <div><strong>Status:</strong> ${emp?.status || 'Ativo'}</div>
                </div>

                <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 11px;">
                    <thead>
                        <tr style="background-color: #0d9488; color: #fff;">
                            <th style="text-align: center; padding: 8px; width: 60px;">Cód.</th>
                            <th style="text-align: left; padding: 8px;">Descrição do Evento</th>
                            <th style="text-align: center; padding: 8px; width: 80px;">Ref.</th>
                            <th style="text-align: right; padding: 8px; width: 120px;">Vencimentos</th>
                            <th style="text-align: right; padding: 8px; width: 120px;">Descontos</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr style="border-bottom: 1px solid #e2e8f0;">
                            <td style="padding: 8px; text-align: center; font-mono;">001</td>
                            <td style="padding: 8px;">Salário Base Mensal</td>
                            <td style="padding: 8px; text-align: center;">30 dias</td>
                            <td style="padding: 8px; text-align: right; font-weight: bold;">R$ ${baseSalary.toFixed(2)}</td>
                            <td style="padding: 8px; text-align: right;">-</td>
                        </tr>
                        ${overtimeVal > 0 ? `
                        <tr style="border-bottom: 1px solid #e2e8f0; background: #f0fdf4;">
                            <td style="padding: 8px; text-align: center; font-mono;">050</td>
                            <td style="padding: 8px;">Horas Extras 50% + DSR (Ponto Eletrônico)</td>
                            <td style="padding: 8px; text-align: center;">${calc?.overtimeHours || 0}h</td>
                            <td style="padding: 8px; text-align: right; font-weight: bold; color: #16a34a;">R$ ${overtimeVal.toFixed(2)}</td>
                            <td style="padding: 8px; text-align: right;">-</td>
                        </tr>` : ''}
                        ${benefitsVal > 0 ? `
                        <tr style="border-bottom: 1px solid #e2e8f0;">
                            <td style="padding: 8px; text-align: center; font-mono;">101</td>
                            <td style="padding: 8px;">Auxílio Alimentação / Refeição (VA/VR)</td>
                            <td style="padding: 8px; text-align: center;">Integral</td>
                            <td style="padding: 8px; text-align: right; font-weight: bold;">R$ ${benefitsVal.toFixed(2)}</td>
                            <td style="padding: 8px; text-align: right;">-</td>
                        </tr>` : ''}
                        <tr style="border-bottom: 1px solid #e2e8f0;">
                            <td style="padding: 8px; text-align: center; font-mono;">901</td>
                            <td style="padding: 8px;">INSS (Tabela Progressiva Oficial)</td>
                            <td style="padding: 8px; text-align: center;">CLT</td>
                            <td style="padding: 8px; text-align: right;">-</td>
                            <td style="padding: 8px; text-align: right; color: #dc2626; font-weight: bold;">R$ ${(inssVal || (totalDiscounts * 0.4)).toFixed(2)}</td>
                        </tr>
                        ${irrfVal > 0 ? `
                        <tr style="border-bottom: 1px solid #e2e8f0;">
                            <td style="padding: 8px; text-align: center; font-mono;">902</td>
                            <td style="padding: 8px;">IRRF Retido na Fonte</td>
                            <td style="padding: 8px; text-align: center;">CLT</td>
                            <td style="padding: 8px; text-align: right;">-</td>
                            <td style="padding: 8px; text-align: right; color: #dc2626; font-weight: bold;">R$ ${irrfVal.toFixed(2)}</td>
                        </tr>` : ''}
                        ${advancesVal > 0 ? `
                        <tr style="border-bottom: 1px solid #e2e8f0; background: #fff1f2;">
                            <td style="padding: 8px; text-align: center; font-mono;">905</td>
                            <td style="padding: 8px;">Adiantamento / Antecipação Salarial Quitado</td>
                            <td style="padding: 8px; text-align: center;">Adiant.</td>
                            <td style="padding: 8px; text-align: right;">-</td>
                            <td style="padding: 8px; text-align: right; color: #dc2626; font-weight: bold;">R$ ${advancesVal.toFixed(2)}</td>
                        </tr>` : ''}
                        ${absenceVal > 0 ? `
                        <tr style="border-bottom: 1px solid #e2e8f0; background: #fef2f2;">
                            <td style="padding: 8px; text-align: center; font-mono;">910</td>
                            <td style="padding: 8px;">Faltas e DSR Não Justificados (Art. 6º Lei 605/49)</td>
                            <td style="padding: 8px; text-align: center;">${absenceDays} dia(s)</td>
                            <td style="padding: 8px; text-align: right;">-</td>
                            <td style="padding: 8px; text-align: right; color: #dc2626; font-weight: bold;">R$ ${absenceVal.toFixed(2)}</td>
                        </tr>` : ''}
                        ${delaysVal > 0 ? `
                        <tr style="border-bottom: 1px solid #e2e8f0;">
                            <td style="padding: 8px; text-align: center; font-mono;">915</td>
                            <td style="padding: 8px;">Desconto Atrasos / Saídas Não Justificadas</td>
                            <td style="padding: 8px; text-align: center;">${calc?.delayHours || 0}h</td>
                            <td style="padding: 8px; text-align: right;">-</td>
                            <td style="padding: 8px; text-align: right; color: #dc2626; font-weight: bold;">R$ ${delaysVal.toFixed(2)}</td>
                        </tr>` : ''}
                        ${transportVal > 0 ? `
                        <tr style="border-bottom: 1px solid #e2e8f0;">
                            <td style="padding: 8px; text-align: center; font-mono;">920</td>
                            <td style="padding: 8px;">Desconto Vale Transporte (CLT 6%)</td>
                            <td style="padding: 8px; text-align: center;">6%</td>
                            <td style="padding: 8px; text-align: right;">-</td>
                            <td style="padding: 8px; text-align: right; color: #dc2626;">R$ ${transportVal.toFixed(2)}</td>
                        </tr>` : ''}
                        <tr style="font-weight: bold; background-color: #f1f5f9; border-top: 2px solid #334155;">
                            <td colspan="3" style="padding: 10px; text-align: right; text-transform: uppercase;">TOTAIS BRUTOS:</td>
                            <td style="padding: 10px; text-align: right; color: #0f766e;">R$ ${totalEarnings.toFixed(2)}</td>
                            <td style="padding: 10px; text-align: right; color: #b91c1c;">R$ ${totalDiscounts.toFixed(2)}</td>
                        </tr>
                    </tbody>
                </table>

                <div style="display: flex; justify-content: space-between; align-items: center; background: #f8fafc; border: 2px solid #0d9488; padding: 14px 20px; border-radius: 8px; margin-bottom: 25px;">
                    <div style="font-size: 11px; line-height: 1.6;">
                        <div><strong>Base Cálc. INSS:</strong> R$ ${(calc?.baseINSS || baseSalary).toFixed(2)}</div>
                        <div><strong>Base Cálc. FGTS:</strong> R$ ${(calc?.baseINSS || baseSalary).toFixed(2)} • <strong>FGTS Mês (8%):</strong> R$ ${(calc?.fgts || baseSalary * 0.08).toFixed(2)}</div>
                    </div>
                    <div style="text-align: right;">
                        <span style="font-size: 10px; font-weight: bold; color: #64748b; text-transform: uppercase; display: block;">Valor Líquido a Receber</span>
                        <span style="font-size: 22px; font-weight: 900; color: #0d9488;">R$ ${netSalary.toFixed(2)}</span>
                    </div>
                </div>

                <div style="font-size: 10px; line-height: 1.5; color: #64748b; border: 1px dashed #cbd5e1; padding: 10px; border-radius: 6px; margin-bottom: 35px;">
                    Declaro ter recebido a importância líquida discriminada neste recibo, referente aos serviços prestados na competência indicada, dando plena e irrevogável quitação.
                </div>

                <div style="display: flex; justify-content: space-between; gap: 60px; margin-top: 25px;">
                    <div style="flex: 1; text-align: center;">
                        <div style="border-bottom: 1px solid #475569; margin-bottom: 6px;"></div>
                        <p style="font-size: 10px; margin: 0; font-weight: bold;">${companyName}</p>
                        <p style="font-size: 9px; margin: 0; color: #64748b;">Empregador</p>
                    </div>
                    <div style="flex: 1; text-align: center;">
                        <div style="border-bottom: 1px solid #475569; margin-bottom: 6px;"></div>
                        <p style="font-size: 10px; margin: 0; font-weight: bold;">${record.employeeName}</p>
                        <p style="font-size: 9px; margin: 0; color: #64748b;">Assinatura do Colaborador • Data: ___/___/______</p>
                    </div>
                </div>
            </div>
        `;

        const printWindow = window.open('', '', 'height=750,width=900');
        if (printWindow) {
            printWindow.document.write(`
                <html>
                <head>
                    <title>Holerite - ${record.employeeName}</title>
                    <style>
                        @media print {
                            @page { size: A4 portrait; margin: 10mm; }
                            body { margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                        }
                    </style>
                </head>
                <body>
                    ${html}
                </body>
                </html>
            `);
            printWindow.document.close();
            printWindow.print();
        }
    };

    // Impressão Oficial do Espelho de Ponto (Portaria MTE nº 671/2021)
    const handlePrintEspelhoPonto = (emp: Employee, monthStr: string, daysData: any[], totals: any) => {
        const companyName = settings?.companyName || "INFRACORE ERP CONSTRUTORA LTDA";
        const companyDoc = settings?.document || "00.000.000/0001-90";
        const companyAddress = settings?.address || "Av. Paulista, 1000 - São Paulo/SP";

        const html = `
            <div style="font-family: Arial, sans-serif; padding: 25px; border: 2px solid #0f172a; max-width: 900px; margin: 0 auto; color: #0f172a; font-size: 10px;">
                <div style="text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 10px; margin-bottom: 15px;">
                    <h2 style="margin: 0; font-size: 16px; text-transform: uppercase; font-weight: 900;">${companyName}</h2>
                    <p style="margin: 3px 0;">CNPJ: ${companyDoc} • ${companyAddress}</p>
                    <h3 style="margin: 6px 0 0; font-size: 13px; text-transform: uppercase; background: #e2e8f0; padding: 4px; border-radius: 4px;">
                        Espelho de Ponto Eletrônico (Portaria MTE Nº 671/2021 - Art. 74 CLT)
                    </h3>
                </div>

                <div style="display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 8px; background: #f8fafc; padding: 10px; border-radius: 6px; margin-bottom: 15px; border: 1px solid #cbd5e1;">
                    <div><strong>Empregado:</strong> ${emp.name}</div>
                    <div><strong>Cargo:</strong> ${emp.role}</div>
                    <div><strong>Departamento:</strong> ${emp.department}</div>
                    <div><strong>Matrícula:</strong> ${emp.id}</div>
                    <div><strong>Admissão:</strong> ${emp.admissionDate || 'N/D'}</div>
                    <div><strong>Competência:</strong> ${monthStr}</div>
                    <div><strong>Jornada Padrão:</strong> 44h semanais (8h/dia)</div>
                    <div><strong>Regime:</strong> CLT Mensalista</div>
                    <div><strong>Emissão:</strong> ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}</div>
                </div>

                <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px; font-size: 9px; text-align: center;">
                    <thead>
                        <tr style="background-color: #0f172a; color: #fff;">
                            <th style="padding: 5px; border: 1px solid #0f172a;">Data / Dia</th>
                            <th style="padding: 5px; border: 1px solid #0f172a;">1ª Entrada</th>
                            <th style="padding: 5px; border: 1px solid #0f172a;">1ª Saída</th>
                            <th style="padding: 5px; border: 1px solid #0f172a;">2ª Entrada</th>
                            <th style="padding: 5px; border: 1px solid #0f172a;">2ª Saída</th>
                            <th style="padding: 5px; border: 1px solid #0f172a;">Realizado</th>
                            <th style="padding: 5px; border: 1px solid #0f172a;">Previsto</th>
                            <th style="padding: 5px; border: 1px solid #0f172a;">Saldo</th>
                            <th style="padding: 5px; border: 1px solid #0f172a;">Ocorrência</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${daysData.map(d => `
                            <tr style="background: ${d.isWeekend ? '#f1f5f9' : '#fff'}; border-bottom: 1px solid #e2e8f0;">
                                <td style="padding: 4px; border: 1px solid #cbd5e1; font-weight: bold;">${d.dateStr} (${d.weekday})</td>
                                <td style="padding: 4px; border: 1px solid #cbd5e1;">${d.checkIn || '-'}</td>
                                <td style="padding: 4px; border: 1px solid #cbd5e1;">${d.lunchStart || '-'}</td>
                                <td style="padding: 4px; border: 1px solid #cbd5e1;">${d.lunchEnd || '-'}</td>
                                <td style="padding: 4px; border: 1px solid #cbd5e1;">${d.checkOut || '-'}</td>
                                <td style="padding: 4px; border: 1px solid #cbd5e1; font-weight: bold;">${d.workedStr}</td>
                                <td style="padding: 4px; border: 1px solid #cbd5e1;">${d.expectedStr}</td>
                                <td style="padding: 4px; border: 1px solid #cbd5e1; font-weight: bold; color: ${d.deltaMin > 0 ? '#16a34a' : d.deltaMin < 0 ? '#dc2626' : '#64748b'};">
                                    ${d.deltaStr}
                                </td>
                                <td style="padding: 4px; border: 1px solid #cbd5e1; font-size: 8px;">${d.occurrence}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>

                <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; background: #f8fafc; padding: 10px; border-radius: 6px; margin-bottom: 20px; border: 1px solid #0f172a; text-align: center;">
                    <div><span style="font-size: 8px; text-transform: uppercase; color: #64748b;">Horas Previstas:</span><br/><strong>${totals.expectedStr}</strong></div>
                    <div><span style="font-size: 8px; text-transform: uppercase; color: #64748b;">Horas Trabalhadas:</span><br/><strong style="color: #0f172a;">${totals.workedStr}</strong></div>
                    <div><span style="font-size: 8px; text-transform: uppercase; color: #16a34a;">Horas Extras (50%):</span><br/><strong style="color: #16a34a;">+${totals.overtimeStr}</strong></div>
                    <div><span style="font-size: 8px; text-transform: uppercase; color: #dc2626;">Atrasos / Faltas:</span><br/><strong style="color: #dc2626;">-${totals.delayStr}</strong></div>
                    <div><span style="font-size: 8px; text-transform: uppercase; color: #0284c7;">Saldo Banco de Horas:</span><br/><strong style="color: #0284c7;">${totals.balanceStr}</strong></div>
                </div>

                <div style="font-size: 9px; line-height: 1.4; color: #475569; border: 1px dashed #94a3b8; padding: 8px; border-radius: 4px; margin-bottom: 35px;">
                    Reconheço a exatidão das marcações, horários e intervalos consignados neste espelho de ponto, correspondendo à expressão da verdade em cumprimento ao Art. 74 da Consolidação das Leis do Trabalho e Portaria MTE 671/2021.
                </div>

                <div style="display: flex; justify-content: space-between; gap: 60px;">
                    <div style="flex: 1; text-align: center;">
                        <div style="border-bottom: 1px solid #000; margin-bottom: 4px;"></div>
                        <p style="font-size: 9px; margin: 0; font-weight: bold;">${companyName}</p>
                        <p style="font-size: 8px; margin: 0; color: #64748b;">Assinatura do Empregador / Recursos Humanos</p>
                    </div>
                    <div style="flex: 1; text-align: center;">
                        <div style="border-bottom: 1px solid #000; margin-bottom: 4px;"></div>
                        <p style="font-size: 9px; margin: 0; font-weight: bold;">${emp.name}</p>
                        <p style="font-size: 8px; margin: 0; color: #64748b;">Assinatura do Colaborador • Data: ___/___/______</p>
                    </div>
                </div>
            </div>
        `;

        const printWin = window.open('', '', 'height=800,width=1000');
        if (printWin) {
            printWin.document.write(`
                <html>
                <head>
                    <title>Espelho de Ponto - ${emp.name}</title>
                    <style>
                        @media print {
                            @page { size: A4 portrait; margin: 8mm; }
                            body { margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                        }
                    </style>
                </head>
                <body>
                    ${html}
                </body>
                </html>
            `);
            printWin.document.close();
            printWin.print();
        }
    };

    const handleSaveVacation = (e: React.FormEvent) => {
        e.preventDefault();
        const emp = employees.find(e => e.id === vacationForm.employeeId);
        if (!emp) return;

        const requestedDays = Number(vacationForm.days) || 30;
        const hasAbono = !!vacationForm.sellDays;
        const abonoDays = hasAbono ? 10 : 0;
        const totalDaysToDeduct = requestedDays + abonoDays;

        if (totalDaysToDeduct > (emp.vacationDaysAvailable || 30)) {
            addToast(`Saldo insuficiente! Colaborador possui apenas ${emp.vacationDaysAvailable || 30} dias de férias disponíveis.`, 'error');
            return;
        }

        const receipt = calculateVacationReceipt(emp, requestedDays, hasAbono, abonoDays);
        const abonoNote = hasAbono ? ` [Abono Pecuniário: 10 dias - R$ ${receipt.totalAbono.toFixed(2)}]` : '';
        const receiptNote = ` [Recibo Líquido: R$ ${receipt.netVacation.toFixed(2)}]`;

        const vacation: Vacation = {
            id: `vac-${Date.now()}`,
            employeeId: vacationForm.employeeId!,
            employeeName: emp.name,
            startDate: vacationForm.startDate!,
            endDate: vacationForm.endDate!,
            days: requestedDays,
            status: 'Solicitado',
            requestedAt: new Date().toLocaleDateString('pt-BR'),
            notes: `${vacationForm.notes || 'Férias regulares'}${abonoNote}${receiptNote}`
        };
        addVacation(vacation);
        addToast(`Solicitação de férias de ${emp.name} criada com sucesso!`, 'success');
        setIsVacationModalOpen(false);
        setVacationForm({ status: 'Solicitado', requestedAt: new Date().toLocaleDateString('pt-BR'), days: 30, sellDays: false, sellDaysCount: 10 });
    };

    const openPayVacationModal = (vac: Vacation) => {
        setSelectedVacationToPay(vac);
        setVacationPaymentForm({
            accountId: accounts[0]?.id || '',
            paymentMethod: 'PIX',
            date: new Date().toISOString().split('T')[0],
            notes: `Quitação de férias - ${vac.employeeName} (${vac.days} dias)`
        });
        setIsPayVacationModalOpen(true);
    };

    const handleConfirmPayVacation = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedVacationToPay) return;
        const emp = employees.find(e => e.id === selectedVacationToPay.employeeId);
        if (!emp) return;

        const hasAbono = !!selectedVacationToPay.notes?.includes('Abono Pecuniário');
        const receipt = calculateVacationReceipt(emp, selectedVacationToPay.days || 30, hasAbono);
        const amountToPay = receipt.netVacation;
        const targetAccount = accounts.find(a => a.id === vacationPaymentForm.accountId) || accounts[0];

        const txId = `tx-vac-${selectedVacationToPay.id}`;
        if (transactions.some(t => t.id === txId)) {
            addToast("Estas férias já possuem lançamento financeiro registrado.", 'error');
            return;
        }

        addTransaction({
            id: txId,
            date: vacationPaymentForm.date,
            description: `Provisão Férias - ${selectedVacationToPay.employeeName} (${selectedVacationToPay.days} dias)`,
            amount: amountToPay,
            type: 'Despesa',
            category: 'Folha de Pagamento',
            status: 'Pendente',
            accountId: targetAccount?.id || 'acc-1',
            account: targetAccount?.name || 'Conta Bancária',
            partnerName: selectedVacationToPay.employeeName,
            paymentMethod: vacationPaymentForm.paymentMethod,
            originModule: 'RH',
            originId: selectedVacationToPay.id,
            ledgerCode: '2.03.01',
            ledgerName: 'Salários e Ordenados'
        });

        updateVacationStatus(selectedVacationToPay.id, 'Aprovado', currentUser?.name || 'Admin');
        addToast(`Férias de ${selectedVacationToPay.employeeName} provisionadas e enviadas ao Contas a Pagar (${formatCurrency(amountToPay)}) para liquidação pela Tesouraria!`, 'success');
        setIsPayVacationModalOpen(false);
        setSelectedVacationToPay(null);
    };

    const openRefundVacationModal = (vac: Vacation) => {
        if (!canRefundAdvance) {
            addToast('Acesso negado: apenas Administrador ou Gerente Financeiro podem estornar pagamentos.', 'error');
            return;
        }
        setSelectedVacationToRefund(vac);
        setRefundVacationReason('');
        setIsRefundVacationModalOpen(true);
    };

    const handleConfirmRefundVacation = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedVacationToRefund) return;
        const txId = `tx-vac-${selectedVacationToRefund.id}`;
        deleteTransaction(txId);
        updateVacationStatus(selectedVacationToRefund.id, 'Aprovado', currentUser?.name || 'Admin');
        addToast(`Pagamento de férias de ${selectedVacationToRefund.employeeName} estornado com sucesso. Saldo bancário recomposto.`, 'success');
        setIsRefundVacationModalOpen(false);
        setSelectedVacationToRefund(null);
    };

    const openReceiptModal = (vac: Vacation) => {
        setSelectedVacationForReceipt(vac);
        setIsReceiptModalOpen(true);
    };

    const handlePrintVacationReceipt = (vac: Vacation) => {
        const emp = employees.find(e => e.id === vac.employeeId);
        if (!emp) return;
        const hasAbono = !!vac.notes?.includes('Abono Pecuniário');
        const receipt = calculateVacationReceipt(emp, vac.days || 30, hasAbono);
        const companyName = settings?.companyName || 'InfraCore ERP Engenharia & Construções';
        const companyCnpj = settings?.document || '12.345.678/0001-90';

        const html = `
            <div style="font-family: Arial, sans-serif; padding: 30px; color: #1e293b; max-width: 800px; margin: 0 auto; line-height: 1.4;">
                <div style="border-bottom: 2px solid #0891b2; padding-bottom: 12px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-start;">
                    <div>
                        <h1 style="font-size: 20px; font-weight: 900; margin: 0; color: #0f172a; text-transform: uppercase;">${companyName}</h1>
                        <p style="font-size: 11px; margin: 4px 0 0 0; color: #64748b;">CNPJ: ${companyCnpj} • Departamento de Recursos Humanos</p>
                    </div>
                    <div style="text-align: right;">
                        <span style="font-size: 14px; font-weight: 900; background: #e0f2fe; color: #0369a1; padding: 4px 10px; border-radius: 6px; text-transform: uppercase;">Recibo Oficial de Férias</span>
                        <p style="font-size: 10px; color: #64748b; margin: 4px 0 0 0;">Art. 142 e 145 da CLT</p>
                    </div>
                </div>

                <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; margin-bottom: 20px; font-size: 11px;">
                    <div style="display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 10px;">
                        <div><strong>Colaborador:</strong> ${emp.name}</div>
                        <div><strong>Cargo:</strong> ${emp.role}</div>
                        <div><strong>Depto:</strong> ${emp.department}</div>
                        <div><strong>CPF:</strong> ${emp.cpf || 'Não cadastrado'}</div>
                        <div><strong>Data Admissão:</strong> ${emp.admissionDate || '—'}</div>
                        <div><strong>Salário Base:</strong> ${formatCurrency(emp.salary)}</div>
                    </div>
                    <div style="margin-top: 10px; padding-top: 8px; border-top: 1px dashed #cbd5e1; display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px;">
                        <div><strong>Período de Gozo:</strong> ${vac.startDate} a ${vac.endDate}</div>
                        <div><strong>Dias de Férias:</strong> ${vac.days || 30} dias</div>
                        <div><strong>Abono Pecuniário:</strong> ${hasAbono ? 'Sim (10 dias vendidos)' : 'Não'}</div>
                    </div>
                </div>

                <table style="width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 20px;">
                    <thead>
                        <tr style="background: #0f172a; color: white;">
                            <th style="padding: 8px; text-align: left;">Cód.</th>
                            <th style="padding: 8px; text-align: left;">Descrição da Rubrica</th>
                            <th style="padding: 8px; text-align: center;">Ref.</th>
                            <th style="padding: 8px; text-align: right;">Proventos (R$)</th>
                            <th style="padding: 8px; text-align: right;">Descontos (R$)</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr style="border-bottom: 1px solid #e2e8f0;">
                            <td style="padding: 8px;">101</td>
                            <td style="padding: 8px;">Salário de Férias (${receipt.days} dias)</td>
                            <td style="padding: 8px; text-align: center;">${receipt.days}d</td>
                            <td style="padding: 8px; text-align: right; font-weight: bold; color: #047857;">${formatCurrency(receipt.vacationSalary)}</td>
                            <td style="padding: 8px; text-align: right;">-</td>
                        </tr>
                        <tr style="border-bottom: 1px solid #e2e8f0;">
                            <td style="padding: 8px;">102</td>
                            <td style="padding: 8px;">1/3 Constitucional de Férias (Art. 7º, XVII CF)</td>
                            <td style="padding: 8px; text-align: center;">33.33%</td>
                            <td style="padding: 8px; text-align: right; font-weight: bold; color: #047857;">${formatCurrency(receipt.tercoConstitucional)}</td>
                            <td style="padding: 8px; text-align: right;">-</td>
                        </tr>
                        ${hasAbono ? `
                        <tr style="border-bottom: 1px solid #e2e8f0; background: #f0fdf4;">
                            <td style="padding: 8px;">105</td>
                            <td style="padding: 8px;">Abono Pecuniário (Art. 143 CLT - Isento)</td>
                            <td style="padding: 8px; text-align: center;">10d</td>
                            <td style="padding: 8px; text-align: right; font-weight: bold; color: #047857;">${formatCurrency(receipt.abonoSalary)}</td>
                            <td style="padding: 8px; text-align: right;">-</td>
                        </tr>
                        <tr style="border-bottom: 1px solid #e2e8f0; background: #f0fdf4;">
                            <td style="padding: 8px;">106</td>
                            <td style="padding: 8px;">1/3 Constitucional s/ Abono Pecuniário</td>
                            <td style="padding: 8px; text-align: center;">33.33%</td>
                            <td style="padding: 8px; text-align: right; font-weight: bold; color: #047857;">${formatCurrency(receipt.abonoTerco)}</td>
                            <td style="padding: 8px; text-align: right;">-</td>
                        </tr>` : ''}
                        <tr style="border-bottom: 1px solid #e2e8f0;">
                            <td style="padding: 8px;">901</td>
                            <td style="padding: 8px;">INSS s/ Férias</td>
                            <td style="padding: 8px; text-align: center;">CLT</td>
                            <td style="padding: 8px; text-align: right;">-</td>
                            <td style="padding: 8px; text-align: right; font-weight: bold; color: #dc2626;">${formatCurrency(receipt.inss)}</td>
                        </tr>
                        ${receipt.irrf > 0 ? `
                        <tr style="border-bottom: 1px solid #e2e8f0;">
                            <td style="padding: 8px;">902</td>
                            <td style="padding: 8px;">IRRF s/ Férias</td>
                            <td style="padding: 8px; text-align: center;">Tabela</td>
                            <td style="padding: 8px; text-align: right;">-</td>
                            <td style="padding: 8px; text-align: right; font-weight: bold; color: #dc2626;">${formatCurrency(receipt.irrf)}</td>
                        </tr>` : ''}
                    </tbody>
                    <tfoot>
                        <tr style="background: #f1f5f9; font-weight: bold;">
                            <td colspan="3" style="padding: 10px; text-align: right;">TOTAIS:</td>
                            <td style="padding: 10px; text-align: right; color: #047857;">${formatCurrency(receipt.totalCompanyCost)}</td>
                            <td style="padding: 10px; text-align: right; color: #dc2626;">${formatCurrency(receipt.totalDiscounts)}</td>
                        </tr>
                        <tr style="background: #0f172a; color: white; font-weight: 900; font-size: 13px;">
                            <td colspan="3" style="padding: 12px; text-align: right; text-transform: uppercase;">Valor Líquido a Receber:</td>
                            <td colspan="2" style="padding: 12px; text-align: right; color: #34d399; font-size: 15px;">${formatCurrency(receipt.netVacation)}</td>
                        </tr>
                    </tfoot>
                </table>

                <div style="border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px; margin-bottom: 30px; font-size: 10px; color: #475569; background: #fafafa;">
                    <p style="margin: 0 0 6px 0;"><strong>DECLARAÇÃO DE QUITAÇÃO (Art. 145 CLT):</strong></p>
                    <p style="margin: 0;">Recebi da empresa <strong>${companyName}</strong> a importância líquida de <strong>${formatCurrency(receipt.netVacation)}</strong>, referente ao pagamento das minhas férias relativas ao período acima discriminado, as quais gozarei na forma da legislação trabalhista vigente, dando plena e rasa quitação.</p>
                </div>

                <div style="display: flex; justify-content: space-between; gap: 60px; margin-top: 40px;">
                    <div style="flex: 1; text-align: center;">
                        <div style="border-bottom: 1px solid #000; margin-bottom: 4px;"></div>
                        <p style="font-size: 9px; margin: 0; font-weight: bold;">${companyName}</p>
                        <p style="font-size: 8px; margin: 0; color: #64748b;">Empregador / Recursos Humanos</p>
                    </div>
                    <div style="flex: 1; text-align: center;">
                        <div style="border-bottom: 1px solid #000; margin-bottom: 4px;"></div>
                        <p style="font-size: 9px; margin: 0; font-weight: bold;">${emp.name}</p>
                        <p style="font-size: 8px; margin: 0; color: #64748b;">Assinatura do Colaborador • Data: ___/___/______</p>
                    </div>
                </div>
            </div>
        `;

        const printWin = window.open('', '', 'height=800,width=1000');
        if (printWin) {
            printWin.document.write(`
                <html>
                <head>
                    <title>Recibo de Férias - ${emp.name}</title>
                    <style>
                        @media print {
                            @page { size: A4 portrait; margin: 10mm; }
                            body { margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                        }
                    </style>
                </head>
                <body>
                    ${html}
                </body>
                </html>
            `);
            printWin.document.close();
            printWin.print();
        }
    };

    // Handlers para Abono e Justificativa de Faltas no Ponto
    const openJustifyModal = (dayData: any) => {
        setSelectedJustifyDay(dayData);
        setJustifyForm({
            type: 'Atestado Médico (Art. 473 CLT)',
            reason: '',
            doctorCrm: ''
        });
        setIsJustifyModalOpen(true);
    };

    const handleConfirmJustify = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedJustifyDay || !currentEspelhoEmp) return;

        const justKey = `${currentEspelhoEmp.id}-${selectedJustifyDay.dateIso}`;
        const newJust = {
            type: justifyForm.type,
            reason: justifyForm.reason || 'Conforme documentação apresentada',
            doctorCrm: justifyForm.doctorCrm,
            approvedBy: currentUser?.name || 'Gestor RH',
            date: selectedJustifyDay.dateIso
        };

        const updated = { ...justifications, [justKey]: newJust };
        setJustifications(updated);
        try {
            localStorage.setItem('infracore_hr_justifications', JSON.stringify(updated));
            if (updateSettings && settings) {
                updateSettings({
                    ...settings,
                    config: { ...(settings.config || {}), hrJustifications: updated }
                });
            }
        } catch {}

        // Registrar no TimeLog do dia para consistência telemétrica e auditoria MTE (sem marcações físicas forjadas)
        const existingLog = timeLogs.find(l => l.employeeId === currentEspelhoEmp.id && (l.date === selectedJustifyDay.dateIso || l.date === selectedJustifyDay.dateStr));
        if (!existingLog) {
            addTimeLog({
                id: `log-just-${Date.now()}`,
                employeeId: currentEspelhoEmp.id,
                date: selectedJustifyDay.dateIso,
                checkIn: '',
                lunchStart: '',
                lunchEnd: '',
                checkOut: '',
                totalHours: '0.00',
                status: 'Presente' as any
            });
        }

        addToast(`Falta do dia ${selectedJustifyDay.dateStr} abonada com sucesso (${justifyForm.type})!`, 'success');
        setIsJustifyModalOpen(false);
        setSelectedJustifyDay(null);
    };

    const handleRemoveJustification = (dateIso: string) => {
        if (!currentEspelhoEmp) return;
        const justKey = `${currentEspelhoEmp.id}-${dateIso}`;
        const updated = { ...justifications };
        delete updated[justKey];
        setJustifications(updated);
        try {
            localStorage.setItem('infracore_hr_justifications', JSON.stringify(updated));
            if (updateSettings && settings) {
                updateSettings({
                    ...settings,
                    config: { ...(settings.config || {}), hrJustifications: updated }
                });
            }
        } catch {}
        addToast("Abono revogado com sucesso.", 'info');
    };

    // Exportação do Saldo do Ponto para a Folha de Pagamento
    const handleExportPontoToFolha = () => {
        if (!currentEspelhoEmp) return;
        const hourlyRate = currentEspelhoEmp.salary > 0 ? currentEspelhoEmp.salary / 220 : 0;
        const extraHours = espelhoData.totals.overtimeMins / 60;
        const delayHours = espelhoData.totals.delayMins / 60;
        const extraEarnings = extraHours * hourlyRate * 1.5;
        const delayDiscount = delayHours * hourlyRate;

        addToast(
            `Saldo de ponto integrado! Extras: +${espelhoData.totals.overtimeStr} (${formatCurrency(extraEarnings)}) | Atrasos/Faltas: -${espelhoData.totals.delayStr} (${formatCurrency(delayDiscount)}). Abrindo aba da Folha...`,
            'success'
        );
        setActiveTab('payroll');
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

    const openPayAdvanceModal = (adv: SalaryAdvance) => {
        setSelectedAdvanceToPay(adv);
        setAdvancePaymentForm({
            accountId: accounts[0]?.id || '',
            paymentMethod: 'PIX',
            date: new Date().toISOString().split('T')[0],
            notes: ''
        });
        setIsPayAdvanceModalOpen(true);
    };

    const handleConfirmPayAdvance = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedAdvanceToPay) return;

        const targetAccount = accounts.find(a => a.id === advancePaymentForm.accountId) || accounts[0];
        if (!targetAccount) {
            addToast("Selecione uma conta bancária de origem para efetuar o débito.", 'warning');
            return;
        }

        const txId = `tx-adv-${selectedAdvanceToPay.id}`;
        if (transactions.some(t => t.id === txId)) {
            addToast("Este adiantamento já possui transação financeira registrada.", 'error');
            return;
        }

        // 1. Criar transação financeira de despesa vinculada à conta bancária selecionada
        const formattedDate = advancePaymentForm.date
            ? new Date(advancePaymentForm.date + 'T12:00:00').toLocaleDateString('pt-BR')
            : new Date().toLocaleDateString('pt-BR');

        addTransaction({
            id: txId,
            date: formattedDate,
            description: `Provisão Adiantamento Salarial (${advancePaymentForm.paymentMethod}) - ${selectedAdvanceToPay.employeeName}`,
            category: 'Adiantamentos',
            type: 'Despesa',
            amount: selectedAdvanceToPay.amount,
            status: 'Pendente',
            account: targetAccount.name,
            accountId: targetAccount.id,
            ledgerCode: '2.03.01',
            ledgerName: 'Salários e Ordenados'
        });

        // Atualizar status da antecipação para 'Aprovado' (aguardando liquidação pela Tesouraria)
        updateAdvanceStatus(selectedAdvanceToPay.id, 'Aprovado', currentUser?.name || 'Gestor RH');

        addToast(`Adiantamento de ${selectedAdvanceToPay.employeeName} (${formatCurrency(selectedAdvanceToPay.amount)}) provisionado e enviado ao Contas a Pagar para liquidação pela Tesouraria!`, 'success');
        setIsPayAdvanceModalOpen(false);
        setSelectedAdvanceToPay(null);
    };

    const openRefundAdvanceModal = (adv: SalaryAdvance) => {
        if (!canRefundAdvance) {
            addToast("Apenas Administradores ou Gerente Financeiro podem estornar pagamentos de adiantamentos.", 'error');
            return;
        }
        setSelectedAdvanceToRefund(adv);
        setRefundReason('');
        setIsRefundAdvanceModalOpen(true);
    };

    const handleConfirmRefundAdvance = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedAdvanceToRefund) return;
        if (!canRefundAdvance) {
            addToast("Acesso negado: apenas Administradores ou Gerente Financeiro têm autorização para estornar.", 'error');
            return;
        }

        const txId = `tx-adv-${selectedAdvanceToRefund.id}`;
        const linkedTx = transactions.find(t => t.id === txId);

        // 1. Excluir a transação financeira de despesa vinculada (recompondo automaticamente o saldo bancário da conta)
        if (linkedTx) {
            deleteTransaction(linkedTx.id);
        }

        // 2. Retornar status da antecipação para 'Aprovado'
        updateAdvanceStatus(selectedAdvanceToRefund.id, 'Aprovado', currentUser?.name || 'Admin');

        addToast(`Estorno realizado com sucesso! O adiantamento de ${selectedAdvanceToRefund.employeeName} retornou para 'Aprovado' e o valor de ${formatCurrency(selectedAdvanceToRefund.amount)} foi recomposto na conta bancária.`, 'success');
        setIsRefundAdvanceModalOpen(false);
        setSelectedAdvanceToRefund(null);
        setRefundReason('');
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

    // --- Quick Direct Payroll Payment Handler ---
    const handleDirectPayPayroll = (record: PayrollRecord) => {
        payPayroll(record.id);
        const txId = `tx-pay-${record.id}`;
        const existingTx = transactions.find(t => t.id === txId);
        if (existingTx) {
            addTransaction({
                ...existingTx,
                status: 'Conciliado'
            });
        } else {
            addTransaction({
                id: txId,
                date: new Date().toLocaleDateString('pt-BR'),
                description: `Folha Pagamento (${record.month}) - ${record.employeeName}`,
                category: 'Folha de Pagamento',
                type: 'Despesa',
                amount: record.totalNet,
                status: 'Conciliado',
                account: accounts[0]?.name || 'Caixa',
                accountId: accounts[0]?.id || 'acc-1',
                ledgerCode: '2.03.01',
                ledgerName: 'Salários e Ordenados'
            });
        }
        addToast(`Pagamento de ${record.employeeName} confirmado e liquidado com sucesso!`, 'success');
    };

    // --- Clock Kiosk Expresso Logic ---
    const [currentTimeStr, setCurrentTimeStr] = useState<string>(() => new Date().toLocaleTimeString('pt-BR'));
    React.useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTimeStr(new Date().toLocaleTimeString('pt-BR'));
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const todayIsoStr = new Date().toISOString().split('T')[0];
    const todayBrStr = new Date().toLocaleDateString('pt-BR');

    const [clockMethod, setClockMethod] = useState<'express' | 'pin'>('express');
    const [clockEmpId, setClockEmpId] = useState('');
    const [clockPass, setClockPass] = useState('');

    const selectedClockEmp = useMemo(() => {
        if (!clockEmpId) return null;
        return employees.find(e => e.id === clockEmpId) || null;
    }, [clockEmpId, employees]);

    const selectedClockEmpLog = useMemo(() => {
        if (!clockEmpId) return null;
        return timeLogs.find(l => l.employeeId === clockEmpId && (l.date === todayIsoStr || l.date === todayBrStr));
    }, [clockEmpId, timeLogs, todayIsoStr, todayBrStr]);

    // Registro Expresso 1-Clique com sincronização em tempo real
    const handleQuickPunch = (punchType: 'checkIn' | 'lunchStart' | 'lunchEnd' | 'checkOut') => {
        if (!clockEmpId) {
            addToast("Selecione um colaborador para registrar o ponto.", 'warning');
            return;
        }
        const emp = employees.find(e => e.id === clockEmpId);
        if (!emp) return;

        const now = new Date();
        const punchTime = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

        const existingLog = timeLogs.find(l =>
            l.employeeId === emp.id && (l.date === todayIsoStr || l.date === todayBrStr)
        );

        const currentIn = punchType === 'checkIn' ? punchTime : (existingLog?.checkIn || '');
        const currentLs = punchType === 'lunchStart' ? punchTime : (existingLog?.lunchStart || '');
        const currentLe = punchType === 'lunchEnd' ? punchTime : (existingLog?.lunchEnd || '');
        const currentOut = punchType === 'checkOut' ? punchTime : (existingLog?.checkOut || '');

        let workedMin = 0;
        let totalHours = existingLog?.totalHours || '0.00';
        let status: 'Regular' | 'Extra' | 'Atraso' | 'Presente' | 'Saída' = existingLog?.status || 'Presente';

        if (currentIn && currentOut) {
            const inMin = parseTimeToMinutes(currentIn);
            const outMin = parseTimeToMinutes(currentOut);
            let lunchDuration = 60;
            if (currentLs && currentLe) {
                const lsMin = parseTimeToMinutes(currentLs);
                const leMin = parseTimeToMinutes(currentLe);
                if (lsMin !== null && leMin !== null && leMin > lsMin) {
                    lunchDuration = leMin - lsMin;
                }
            }
            if (inMin !== null && outMin !== null && outMin > inMin) {
                workedMin = Math.max(0, (outMin - inMin) - lunchDuration);
                totalHours = (workedMin / 60).toFixed(2);
                if (workedMin > 480) status = 'Extra';
                else if (workedMin < 480) status = 'Atraso';
                else status = 'Regular';
            }
        } else if (punchType === 'checkOut') {
            status = 'Saída';
        } else {
            status = 'Presente';
        }

        const logId = existingLog ? existingLog.id : `log-${emp.id}-${todayIsoStr}`;
        const newLog: TimeLog = {
            id: logId,
            employeeId: emp.id,
            date: todayIsoStr,
            checkIn: currentIn || punchTime,
            lunchStart: currentLs || undefined,
            lunchEnd: currentLe || undefined,
            checkOut: currentOut || undefined,
            totalHours,
            status
        };

        addTimeLog(newLog);

        const labelMap: Record<string, string> = {
            checkIn: '1ª Entrada (Início da Jornada)',
            lunchStart: 'Saída Intervalo / Almoço',
            lunchEnd: 'Retorno Intervalo / Almoço',
            checkOut: '2ª Saída (Término da Jornada)'
        };

        addToast(`Ponto registrado: ${emp.name} — ${labelMap[punchType]} às ${punchTime}!`, 'success');
    };

    const handlePinClock = (type: 'In' | 'Out') => {
        if (!clockEmpId) {
            addToast("Selecione um colaborador.", 'warning');
            return;
        }
        const emp = employees.find(e => e.id === clockEmpId);
        if (!emp) return;

        const user = users.find(u => u.employeeId === emp.id);
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

        handleQuickPunch(type === 'In' ? 'checkIn' : 'checkOut');
        setClockPass('');
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
                        {canAccessVacations && (
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

                        {/* Vacations Tab (Reformulada com Controle CLT, Recibos e Cronograma) */}
                        {activeTab === 'vacations' && canAccessVacations && (
                            <div className="space-y-6">
                                {/* Barra Superior: Sub-navegação e Botão de Nova Solicitação */}
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-800 p-4 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm">
                                    <div className="flex flex-wrap bg-slate-100 dark:bg-slate-900 p-1 rounded-2xl gap-1">
                                        <button
                                            onClick={() => setVacationSubTab('requests')}
                                            className={`px-4 py-2.5 text-xs font-black rounded-xl transition-all uppercase flex items-center gap-2 ${vacationSubTab === 'requests' ? 'bg-white dark:bg-slate-800 text-cyan-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                        >
                                            <FileText size={15} /> Solicitações & Quitações
                                            {vacations.filter(v => v.status === 'Solicitado').length > 0 && (
                                                <span className="px-1.5 py-0.5 bg-amber-500 text-white rounded-full text-[9px] font-black">
                                                    {vacations.filter(v => v.status === 'Solicitado').length}
                                                </span>
                                            )}
                                        </button>
                                        <button
                                            onClick={() => setVacationSubTab('periods')}
                                            className={`px-4 py-2.5 text-xs font-black rounded-xl transition-all uppercase flex items-center gap-2 ${vacationSubTab === 'periods' ? 'bg-white dark:bg-slate-800 text-cyan-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                        >
                                            <Clock size={15} /> Períodos & Dobra CLT
                                        </button>
                                        <button
                                            onClick={() => setVacationSubTab('calendar')}
                                            className={`px-4 py-2.5 text-xs font-black rounded-xl transition-all uppercase flex items-center gap-2 ${vacationSubTab === 'calendar' ? 'bg-white dark:bg-slate-800 text-cyan-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                        >
                                            <Calendar size={15} /> Cronograma de Ausências
                                        </button>
                                    </div>

                                    <button
                                        onClick={() => {
                                            setVacationForm({
                                                status: 'Solicitado',
                                                requestedAt: new Date().toLocaleDateString('pt-BR'),
                                                days: 30,
                                                sellDays: false,
                                                sellDaysCount: 10
                                            });
                                            setIsVacationModalOpen(true);
                                        }}
                                        className="px-5 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-black text-xs rounded-xl shadow-lg shadow-cyan-600/20 uppercase tracking-widest flex items-center gap-2 transition-all"
                                    >
                                        <Plus size={16} /> Solicitar Férias
                                    </button>
                                </div>

                                {/* 4 KPIs Executivos no Topo */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {/* 1. Em Férias Hoje */}
                                    {(() => {
                                        const nowTime = new Date().getTime();
                                        const parseD = (dStr: string) => {
                                            if (dStr.includes('/')) {
                                                const parts = dStr.split('/');
                                                return new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0])).getTime();
                                            }
                                            return new Date(dStr).getTime();
                                        };
                                        const activeToday = vacations.filter(v => (v.status === 'Aprovado' || v.status === 'Concluído') && nowTime >= parseD(v.startDate) && nowTime <= parseD(v.endDate));
                                        return (
                                            <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Em Férias Hoje</span>
                                                    <span className="p-2 bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 rounded-xl">
                                                        <Sun size={18} />
                                                    </span>
                                                </div>
                                                <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">{activeToday.length}</p>
                                                <p className="text-[11px] text-slate-400 font-medium mt-1 truncate">
                                                    {activeToday.length > 0 ? activeToday.map(v => v.employeeName).join(', ') : 'Nenhum colaborador ausente'}
                                                </p>
                                            </div>
                                        );
                                    })()}

                                    {/* 2. Próximas Férias Agendadas */}
                                    {(() => {
                                        const scheduled = vacations.filter(v => v.status === 'Aprovado');
                                        return (
                                            <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Férias Agendadas</span>
                                                    <span className="p-2 bg-emerald-50 dark:bg-emerald-900/40 text-emerald-600 rounded-xl">
                                                        <Calendar size={18} />
                                                    </span>
                                                </div>
                                                <p className="text-2xl font-black text-emerald-600 mt-2">{scheduled.length}</p>
                                                <p className="text-[11px] text-slate-400 font-medium mt-1">
                                                    {vacations.filter(v => v.status === 'Solicitado').length} solicitações pendentes
                                                </p>
                                            </div>
                                        );
                                    })()}

                                    {/* 3. Alerta de Dobra CLT (Período Crítico) */}
                                    {(() => {
                                        const now = new Date();
                                        const criticalEmps = employees.filter(emp => {
                                            if (emp.status !== 'Ativo' || !emp.admissionDate) return false;
                                            const adm = new Date(emp.admissionDate);
                                            const diffMonths = (now.getFullYear() - adm.getFullYear()) * 12 + (now.getMonth() - adm.getMonth());
                                            return diffMonths >= 22 && (emp.vacationDaysAvailable || 30) >= 15;
                                        });
                                        return (
                                            <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-rose-500">Risco Dobra CLT</span>
                                                    <span className="p-2 bg-rose-50 dark:bg-rose-900/40 text-rose-500 rounded-xl">
                                                        <AlertTriangle size={18} />
                                                    </span>
                                                </div>
                                                <p className="text-2xl font-black text-rose-600 mt-2">{criticalEmps.length}</p>
                                                <p className="text-[11px] text-slate-400 font-medium mt-1">
                                                    {criticalEmps.length > 0 ? `${criticalEmps.length} colaboradores > 22 meses` : 'Nenhum período vencido'}
                                                </p>
                                            </div>
                                        );
                                    })()}

                                    {/* 4. Custo Financeiro Previsto */}
                                    {(() => {
                                        let totalReceipts = 0;
                                        vacations.filter(v => v.status === 'Aprovado').forEach(vac => {
                                            const emp = employees.find(e => e.id === vac.employeeId);
                                            if (emp) {
                                                const hasAbono = !!vac.notes?.includes('Abono Pecuniário');
                                                const receipt = calculateVacationReceipt(emp, vac.days || 30, hasAbono);
                                                totalReceipts += receipt.netVacation;
                                            }
                                        });
                                        return (
                                            <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-cyan-600">Provisão a Pagar</span>
                                                    <span className="p-2 bg-cyan-50 dark:bg-cyan-900/40 text-cyan-600 rounded-xl">
                                                        <DollarSign size={18} />
                                                    </span>
                                                </div>
                                                <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">{formatCurrency(totalReceipts)}</p>
                                                <p className="text-[11px] text-slate-400 font-medium mt-1">Salário + 1/3 das aprovadas</p>
                                            </div>
                                        );
                                    })()}
                                </div>

                                {/* Visão 1: Solicitações e Quitações */}
                                {vacationSubTab === 'requests' && (
                                    <div className="space-y-4">
                                        {/* Barra de Filtros de Férias */}
                                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white dark:bg-slate-800 p-4 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm">
                                            <div className="flex flex-wrap items-center gap-1.5">
                                                {['Todos', 'Solicitado', 'Aprovado', 'Concluído', 'Rejeitado'].map((st) => (
                                                    <button
                                                        key={st}
                                                        onClick={() => setVacationStatusFilter(st)}
                                                        className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase transition-all ${
                                                            vacationStatusFilter === st
                                                                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                                                                : 'bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                                                        }`}
                                                    >
                                                        {st}
                                                    </button>
                                                ))}
                                            </div>
                                            <div className="relative w-full sm:w-64">
                                                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                                <input
                                                    type="text"
                                                    placeholder="Buscar por colaborador..."
                                                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-cyan-500"
                                                    value={searchTerm}
                                                    onChange={e => setSearchTerm(e.target.value)}
                                                />
                                            </div>
                                        </div>

                                        {/* Tabela de Solicitações e Recibos */}
                                        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-xs text-left">
                                                    <thead className="bg-slate-50 dark:bg-slate-900 text-[10px] font-black text-slate-400 uppercase border-b dark:border-slate-700">
                                                        <tr>
                                                            <th className="px-5 py-4">Colaborador</th>
                                                            <th className="px-5 py-4">Período de Gozo</th>
                                                            <th className="px-5 py-4 text-center">Dias</th>
                                                            <th className="px-5 py-4 text-right">Recibo (Bruto / Líq.)</th>
                                                            <th className="px-5 py-4 text-center">Status</th>
                                                            <th className="px-5 py-4 text-right">Ações & Quitação</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y dark:divide-slate-700">
                                                        {vacations
                                                            .filter(vac => {
                                                                if (vacationStatusFilter !== 'Todos' && vac.status !== vacationStatusFilter) return false;
                                                                if (searchTerm && !vac.employeeName.toLowerCase().includes(searchTerm.toLowerCase())) return false;
                                                                return true;
                                                            })
                                                            .map((vac) => {
                                                                const emp = employees.find(e => e.id === vac.employeeId);
                                                                const hasAbono = !!vac.notes?.includes('Abono Pecuniário');
                                                                const receipt = emp ? calculateVacationReceipt(emp, vac.days || 30, hasAbono) : null;
                                                                const txId = `tx-vac-${vac.id}`;
                                                                const linkedTx = transactions.find(t => t.id === txId);

                                                                return (
                                                                    <tr key={vac.id} className="hover:bg-slate-50/80 dark:hover:bg-cyan-900/10 transition-colors">
                                                                        <td className="px-5 py-4">
                                                                            <div className="font-bold text-slate-800 dark:text-white text-sm">{vac.employeeName}</div>
                                                                            <div className="text-[10px] text-slate-400 font-medium">
                                                                                {emp ? `${emp.role} • ${emp.department}` : 'Colaborador'}
                                                                            </div>
                                                                        </td>
                                                                        <td className="px-5 py-4">
                                                                            <div className="font-bold text-slate-800 dark:text-slate-200">
                                                                                {vac.startDate} <span className="text-slate-400 font-normal">a</span> {vac.endDate}
                                                                            </div>
                                                                            {hasAbono && (
                                                                                <span className="inline-block mt-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 rounded text-[9px] font-black uppercase">
                                                                                    + 10d Abono Pecuniário
                                                                                </span>
                                                                            )}
                                                                        </td>
                                                                        <td className="px-5 py-4 text-center font-black text-slate-900 dark:text-white">
                                                                            <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-700 rounded-lg text-xs font-black">
                                                                                {vac.days || 30} dias
                                                                            </span>
                                                                        </td>
                                                                        <td className="px-5 py-4 text-right">
                                                                            {receipt ? (
                                                                                <div>
                                                                                    <div className="font-black text-emerald-600 text-sm">{formatCurrency(receipt.netVacation)}</div>
                                                                                    <div className="text-[10px] text-slate-400">Bruto: {formatCurrency(receipt.totalCompanyCost)}</div>
                                                                                </div>
                                                                            ) : (
                                                                                <span className="text-slate-400">—</span>
                                                                            )}
                                                                        </td>
                                                                        <td className="px-5 py-4 text-center">
                                                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                                                                                vac.status === 'Concluído' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300' :
                                                                                vac.status === 'Aprovado' ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300' :
                                                                                vac.status === 'Rejeitado' ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300' :
                                                                                'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300'
                                                                            }`}>
                                                                                {vac.status === 'Concluído' ? 'Pago / Concluído' : vac.status}
                                                                            </span>
                                                                            {linkedTx && (
                                                                                <div className="text-[9px] text-slate-400 mt-0.5 truncate max-w-[120px] mx-auto">
                                                                                    {linkedTx.account}
                                                                                </div>
                                                                            )}
                                                                        </td>
                                                                        <td className="px-5 py-4 text-right">
                                                                            <div className="flex items-center justify-end gap-1.5">
                                                                                {/* Botão Ver Recibo */}
                                                                                <button
                                                                                    onClick={() => openReceiptModal(vac)}
                                                                                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl transition-colors"
                                                                                    title="Visualizar e Imprimir Recibo Oficial de Férias"
                                                                                >
                                                                                    <Printer size={15} />
                                                                                </button>

                                                                                {/* Solicitação Pendente: Aprovar / Rejeitar */}
                                                                                {vac.status === 'Solicitado' && hasPermission('employees.manage') && (
                                                                                    <>
                                                                                        <button
                                                                                            onClick={() => updateVacationStatus(vac.id, 'Aprovado', currentUser?.name || 'Admin')}
                                                                                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl uppercase transition-all shadow-sm flex items-center gap-1"
                                                                                            title="Aprovar Férias"
                                                                                        >
                                                                                            <CheckCircle size={14} /> Aprovar
                                                                                        </button>
                                                                                        <button
                                                                                            onClick={() => updateVacationStatus(vac.id, 'Rejeitado', currentUser?.name || 'Admin')}
                                                                                            className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs rounded-xl uppercase transition-all shadow-sm"
                                                                                            title="Rejeitar Solicitação"
                                                                                        >
                                                                                            <XCircle size={14} />
                                                                                        </button>
                                                                                    </>
                                                                                )}

                                                                                {/* Aprovado: Provisionar no Financeiro ou Aguardando Tesouraria */}
                                                                                {vac.status === 'Aprovado' && hasPermission('employees.manage') && (
                                                                                    linkedTx ? (
                                                                                        <span className="px-2.5 py-1.5 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 font-bold text-[10px] rounded-xl flex items-center gap-1 uppercase" title="Provisão enviada ao Contas a Pagar. Aguardando liquidação pela Tesouraria.">
                                                                                            <Clock size={12} /> Aberto no Fin.
                                                                                        </span>
                                                                                    ) : (
                                                                                        <button
                                                                                            onClick={() => openPayVacationModal(vac)}
                                                                                            className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-black text-xs rounded-xl uppercase transition-all shadow-sm flex items-center gap-1.5"
                                                                                            title="Enviar provisão de férias para o Contas a Pagar"
                                                                                        >
                                                                                            <Wallet size={14} /> Provisionar (Fin.)
                                                                                        </button>
                                                                                    )
                                                                                )}

                                                                                {/* Concluído: Estornar Pagamento */}
                                                                                {vac.status === 'Concluído' && (
                                                                                    canRefundAdvance ? (
                                                                                        <button
                                                                                            onClick={() => openRefundVacationModal(vac)}
                                                                                            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-black text-xs rounded-xl uppercase transition-all shadow-sm flex items-center gap-1"
                                                                                            title="Estornar pagamento e recompor saldo bancário"
                                                                                        >
                                                                                            <RotateCcw size={14} /> Estornar
                                                                                        </button>
                                                                                    ) : (
                                                                                        <button
                                                                                            disabled
                                                                                            className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 text-slate-400 font-bold text-xs rounded-xl uppercase cursor-not-allowed flex items-center gap-1"
                                                                                            title="Estorno permitido apenas para Administrador ou Gerente Financeiro"
                                                                                        >
                                                                                            <RotateCcw size={14} /> Estornar
                                                                                        </button>
                                                                                    )
                                                                                )}
                                                                            </div>
                                                                        </td>
                                                                    </tr>
                                                                );
                                                            })}
                                                        {vacations.length === 0 && (
                                                            <tr>
                                                                <td colSpan={6} className="py-16 text-center text-slate-400">
                                                                    <Plane size={44} className="mx-auto mb-3 opacity-20" />
                                                                    <p className="font-bold text-sm">Nenhuma solicitação de férias cadastrada.</p>
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Visão 2: Mapa de Períodos e Dobra CLT */}
                                {vacationSubTab === 'periods' && (
                                    <div className="space-y-4">
                                        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-4 rounded-3xl flex items-center gap-3">
                                            <AlertTriangle className="text-amber-600 shrink-0" size={24} />
                                            <div className="text-xs">
                                                <strong className="text-amber-900 dark:text-amber-200 uppercase font-black">Regra de Ouro da CLT (Art. 134 e 137):</strong>
                                                <p className="text-amber-800 dark:text-amber-300 font-medium mt-0.5">
                                                    As férias devem ser concedidas nos 12 meses subsequentes à aquisição (período concessivo). Sempre que as férias forem concedidas após o prazo legal, o empregador pagará em dobro a respectiva remuneração.
                                                </p>
                                            </div>
                                        </div>

                                        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-xs text-left">
                                                    <thead className="bg-slate-50 dark:bg-slate-900 text-[10px] font-black text-slate-400 uppercase border-b dark:border-slate-700">
                                                        <tr>
                                                            <th className="px-5 py-4">Colaborador</th>
                                                            <th className="px-5 py-4">Admissão / Tempo de Casa</th>
                                                            <th className="px-5 py-4">Período Concessivo Limite</th>
                                                            <th className="px-5 py-4 text-center">Saldo Disponível</th>
                                                            <th className="px-5 py-4 text-center">Status Legal</th>
                                                            <th className="px-5 py-4 text-right">Ação</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y dark:divide-slate-700">
                                                        {employees.filter(e => e.status === 'Ativo').map(emp => {
                                                            const admDate = emp.admissionDate ? new Date(emp.admissionDate) : new Date();
                                                            const now = new Date();
                                                            const diffMonths = (now.getFullYear() - admDate.getFullYear()) * 12 + (now.getMonth() - admDate.getMonth());
                                                            const years = Math.floor(diffMonths / 12);
                                                            const remMonths = diffMonths % 12;
                                                            const timeStr = `${years} ano(s) e ${remMonths} mês(es)`;

                                                            // Período concessivo limite = admissão + 23 meses (último mês antes da dobra do 1º período)
                                                            const limitDate = new Date(admDate);
                                                            limitDate.setMonth(limitDate.getMonth() + 23);
                                                            const limitStr = limitDate.toLocaleDateString('pt-BR');

                                                            let statusBadge = {
                                                                label: 'Período Aquisitivo em Curso',
                                                                cls: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                                                            };

                                                            if (diffMonths >= 24 && (emp.vacationDaysAvailable || 30) > 0) {
                                                                statusBadge = {
                                                                    label: 'CRÍTICO: Risco de Dobra CLT',
                                                                    cls: 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 animate-pulse font-black'
                                                                };
                                                            } else if (diffMonths >= 21 && (emp.vacationDaysAvailable || 30) > 0) {
                                                                statusBadge = {
                                                                    label: 'Atenção: Vence em < 60 dias',
                                                                    cls: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 font-bold'
                                                                };
                                                            } else if (diffMonths >= 12) {
                                                                statusBadge = {
                                                                    label: 'Regular (Direito Adquirido)',
                                                                    cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 font-bold'
                                                                };
                                                            }

                                                            return (
                                                                <tr key={emp.id} className="hover:bg-slate-50/80 dark:hover:bg-cyan-900/10 transition-colors">
                                                                    <td className="px-5 py-4">
                                                                        <div className="font-bold text-slate-800 dark:text-white text-sm">{emp.name}</div>
                                                                        <div className="text-[10px] text-slate-400">{emp.role} • {emp.department}</div>
                                                                    </td>
                                                                    <td className="px-5 py-4">
                                                                        <div className="font-bold text-slate-800 dark:text-slate-200">{emp.admissionDate || '—'}</div>
                                                                        <div className="text-[10px] text-slate-400">{timeStr}</div>
                                                                    </td>
                                                                    <td className="px-5 py-4 font-bold text-slate-700 dark:text-slate-300">
                                                                        Até {limitStr}
                                                                    </td>
                                                                    <td className="px-5 py-4 text-center">
                                                                        <span className="px-3 py-1 bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800 rounded-xl text-xs font-black">
                                                                            {emp.vacationDaysAvailable || 30} dias
                                                                        </span>
                                                                    </td>
                                                                    <td className="px-5 py-4 text-center">
                                                                        <span className={`px-3 py-1 rounded-full text-[10px] uppercase ${statusBadge.cls}`}>
                                                                            {statusBadge.label}
                                                                        </span>
                                                                    </td>
                                                                    <td className="px-5 py-4 text-right">
                                                                        <button
                                                                            onClick={() => {
                                                                                setVacationForm({
                                                                                    employeeId: emp.id,
                                                                                    status: 'Solicitado',
                                                                                    requestedAt: new Date().toLocaleDateString('pt-BR'),
                                                                                    days: Math.min(30, emp.vacationDaysAvailable || 30),
                                                                                    sellDays: false,
                                                                                    sellDaysCount: 10
                                                                                });
                                                                                setIsVacationModalOpen(true);
                                                                            }}
                                                                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs rounded-xl uppercase transition-all shadow-sm flex items-center gap-1 ml-auto"
                                                                        >
                                                                            <Calendar size={13} /> Agendar
                                                                        </button>
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Visão 3: Cronograma de Ausências */}
                                {vacationSubTab === 'calendar' && (
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-4 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm">
                                            <div className="flex items-center gap-3">
                                                <Calendar className="text-cyan-600" size={20} />
                                                <h4 className="font-black text-sm text-slate-800 dark:text-white uppercase tracking-tight">Linha do Tempo de Ausências</h4>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-bold text-slate-400">Mês de Referência:</span>
                                                <input
                                                    type="month"
                                                    value={selectedCalendarMonth}
                                                    onChange={e => setSelectedCalendarMonth(e.target.value)}
                                                    className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 dark:text-white"
                                                />
                                            </div>
                                        </div>

                                        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 space-y-4">
                                            {(() => {
                                                const [yearStr, monthStr] = selectedCalendarMonth.split('-');
                                                const cYear = parseInt(yearStr, 10);
                                                const cMonth = parseInt(monthStr, 10);
                                                const daysInMonth = new Date(cYear, cMonth, 0).getDate();

                                                const approvedVacations = vacations.filter(v => v.status === 'Aprovado' || v.status === 'Concluído');

                                                return (
                                                    <div className="overflow-x-auto">
                                                        <div className="min-w-[700px] space-y-3">
                                                            {/* Cabeçalho de dias do mês */}
                                                            <div className="grid grid-cols-12 gap-1 text-center text-[10px] font-black text-slate-400 uppercase pb-2 border-b dark:border-slate-700">
                                                                <div className="col-span-3 text-left">Colaborador</div>
                                                                <div className="col-span-9 grid grid-cols-4 gap-1">
                                                                    <div>Semana 1 (1-7)</div>
                                                                    <div>Semana 2 (8-14)</div>
                                                                    <div>Semana 3 (15-21)</div>
                                                                    <div>Semana 4 (22-{daysInMonth})</div>
                                                                </div>
                                                            </div>

                                                            {/* Linhas de Colaboradores com Férias no Mês */}
                                                            {approvedVacations.length > 0 ? (
                                                                approvedVacations.map(vac => (
                                                                    <div key={vac.id} className="grid grid-cols-12 gap-1 items-center py-2.5 border-b dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-900/40 rounded-xl px-2">
                                                                        <div className="col-span-3 font-bold text-xs text-slate-800 dark:text-white truncate">
                                                                            {vac.employeeName}
                                                                            <span className="block text-[9px] text-slate-400 font-normal">{vac.days} dias • {vac.startDate} a {vac.endDate}</span>
                                                                        </div>
                                                                        <div className="col-span-9 bg-slate-100 dark:bg-slate-900/80 rounded-xl p-1 relative h-8 flex items-center">
                                                                            <div
                                                                                className="h-6 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-black text-[10px] rounded-lg shadow-sm flex items-center justify-center px-2 truncate w-full"
                                                                            >
                                                                                🌴 Em gozo de férias ({vac.startDate} - {vac.endDate})
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                ))
                                                            ) : (
                                                                <div className="py-12 text-center text-slate-400">
                                                                    <p className="font-bold text-xs">Nenhum colaborador com férias agendadas para {selectedCalendarMonth}.</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    </div>
                                )}
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
                                                                    transactions.some(t => t.id === `tx-adv-${adv.id}`) ? (
                                                                        <span className="px-2.5 py-1 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 font-bold text-[10px] rounded-lg flex items-center gap-1 uppercase" title="Provisão enviada ao Contas a Pagar. Aguardando baixa da Tesouraria.">
                                                                            <Clock size={11} /> Aberto no Fin.
                                                                        </span>
                                                                    ) : (
                                                                        <button
                                                                            onClick={() => openPayAdvanceModal(adv)}
                                                                            className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white font-black text-[10px] rounded-lg shadow-sm hover:scale-105 transition-all uppercase flex items-center gap-1"
                                                                            title="Enviar provisão para o Contas a Pagar"
                                                                        >
                                                                            <DollarSign size={11} /> Provisionar (Fin.)
                                                                        </button>
                                                                    )
                                                                )}
                                                                {adv.status === 'Pago' && (
                                                                    <button
                                                                        onClick={() => openRefundAdvanceModal(adv)}
                                                                        disabled={!canRefundAdvance}
                                                                        className={`px-3 py-1.5 text-[10px] font-black rounded-lg transition-all uppercase flex items-center gap-1 ${
                                                                            canRefundAdvance
                                                                                ? 'bg-amber-100 hover:bg-amber-200 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 shadow-sm hover:scale-105 cursor-pointer'
                                                                                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed opacity-60'
                                                                        }`}
                                                                        title={canRefundAdvance ? "Estornar pagamento e recompor saldo da conta bancária" : "Apenas Administradores ou Gerente Financeiro podem estornar pagamentos"}
                                                                    >
                                                                        <RotateCcw size={12} /> Estornar
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
                            <div className="space-y-6">
                                {/* Barra Superior de Alternância: Sem Encargos vs Com Encargos Federais */}
                                <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-4 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm">
                                    <div className="flex bg-slate-100 dark:bg-slate-900 p-1.5 rounded-2xl">
                                        <button
                                            onClick={() => setPayrollChargeView('without_taxes')}
                                            className={`px-5 py-2.5 text-xs font-black rounded-xl transition-all uppercase flex items-center gap-2 ${
                                                payrollChargeView === 'without_taxes'
                                                    ? 'bg-white dark:bg-slate-800 text-cyan-600 shadow-sm'
                                                    : 'text-slate-400 hover:text-slate-600'
                                            }`}
                                        >
                                            <Wallet size={16} /> Sem Encargos (Folha Líquida CLT)
                                        </button>
                                        <button
                                            onClick={() => setPayrollChargeView('with_taxes')}
                                            className={`px-5 py-2.5 text-xs font-black rounded-xl transition-all uppercase flex items-center gap-2 ${
                                                payrollChargeView === 'with_taxes'
                                                    ? 'bg-white dark:bg-slate-800 text-emerald-600 shadow-sm'
                                                    : 'text-slate-400 hover:text-slate-600'
                                            }`}
                                        >
                                            <DollarSign size={16} /> Com Encargos Federais (Custo Empresa)
                                        </button>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-3">
                                        {payrollChargeView === 'with_taxes' && (
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest hidden sm:inline">Regime:</span>
                                                <select
                                                    value={payrollTaxSettings.regime}
                                                    onChange={e => {
                                                        const reg = e.target.value as any;
                                                        if (reg === 'Lucro Presumido / Real') {
                                                            setPayrollTaxSettings({
                                                                regime: reg,
                                                                applyFGTS: true,
                                                                applyINSSPatronal: true,
                                                                applyProvisaoFerias13: true
                                                            });
                                                        } else if (reg === 'Simples Nacional') {
                                                            setPayrollTaxSettings({
                                                                regime: reg,
                                                                applyFGTS: true,
                                                                applyINSSPatronal: false,
                                                                applyProvisaoFerias13: true
                                                            });
                                                        } else if (reg === 'Desonerada') {
                                                            setPayrollTaxSettings({
                                                                regime: reg,
                                                                applyFGTS: true,
                                                                applyINSSPatronal: false,
                                                                applyProvisaoFerias13: true
                                                            });
                                                        } else {
                                                            setPayrollTaxSettings(prev => ({ ...prev, regime: reg }));
                                                        }
                                                    }}
                                                    className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-black text-slate-700 dark:text-slate-200 rounded-xl px-3 py-2 outline-none cursor-pointer"
                                                >
                                                    <option value="Lucro Presumido / Real">Lucro Presumido / Real (28,8% INSS + 8% FGTS)</option>
                                                    <option value="Simples Nacional">Simples Nacional (Isento INSS Patronal)</option>
                                                    <option value="Desonerada">Folha Desonerada (CPRB)</option>
                                                    <option value="Personalizado">Personalizado</option>
                                                </select>

                                                <button
                                                    onClick={() => setShowTaxConfig(!showTaxConfig)}
                                                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 rounded-xl text-slate-600 dark:text-slate-300 text-xs font-bold transition-colors flex items-center gap-1.5"
                                                    title="Ajustar encargos individuais"
                                                >
                                                    <Filter size={14} /> {showTaxConfig ? 'Fechar' : 'Ajustar Encargos'}
                                                </button>
                                            </div>
                                        )}

                                        <button
                                            onClick={exportPayrollCSV}
                                            className="p-2.5 bg-white dark:bg-slate-700 text-slate-400 hover:text-emerald-500 rounded-xl shadow-sm border dark:border-slate-600 transition-colors"
                                            title="Exportar dados da folha (CSV)"
                                        >
                                            <Download size={16} />
                                        </button>

                                        <button
                                            onClick={() => {
                                                setProvisionMode(payrollChargeView === 'with_taxes' ? 'gross_with_taxes' : 'net');
                                                setIsPayrollModalOpen(true);
                                            }}
                                            disabled={!hasPermission('employees.manage')}
                                            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-emerald-600/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                        >
                                            Fechar Folha Mensal
                                        </button>
                                    </div>
                                </div>

                                {/* Painel Expansível de Ajuste Fino dos Encargos Federais */}
                                {showTaxConfig && payrollChargeView === 'with_taxes' && (
                                    <div className="p-4 bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex flex-wrap items-center justify-between gap-4 animate-in fade-in duration-200">
                                        <div className="flex flex-wrap items-center gap-6">
                                            <span className="text-[11px] font-black uppercase text-emerald-800 dark:text-emerald-300 tracking-wider">
                                                Encargos Federais Ativos:
                                            </span>
                                            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-200">
                                                <input
                                                    type="checkbox"
                                                    checked={payrollTaxSettings.applyFGTS}
                                                    onChange={e => setPayrollTaxSettings(prev => ({
                                                        ...prev,
                                                        applyFGTS: e.target.checked,
                                                        regime: 'Personalizado'
                                                    }))}
                                                    className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                                                />
                                                FGTS (8,0%)
                                            </label>
                                            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-200">
                                                <input
                                                    type="checkbox"
                                                    checked={payrollTaxSettings.applyINSSPatronal}
                                                    onChange={e => setPayrollTaxSettings(prev => ({
                                                        ...prev,
                                                        applyINSSPatronal: e.target.checked,
                                                        regime: 'Personalizado'
                                                    }))}
                                                    className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                                                />
                                                INSS Patronal / Terceiros / RAT (28,8%)
                                            </label>
                                            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-200">
                                                <input
                                                    type="checkbox"
                                                    checked={payrollTaxSettings.applyProvisaoFerias13}
                                                    onChange={e => setPayrollTaxSettings(prev => ({
                                                        ...prev,
                                                        applyProvisaoFerias13: e.target.checked,
                                                        regime: 'Personalizado'
                                                    }))}
                                                    className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                                                />
                                                Provisões Trabalhistas 13º e Férias (19,44%)
                                            </label>
                                        </div>
                                        <span className="px-3 py-1 bg-emerald-600 text-white rounded-full text-[10px] font-black uppercase">
                                            Alíquota Efetiva: +{payrollSummary.effectiveTaxRate.toFixed(1)}%
                                        </span>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                    {/* Tabela de Colaboradores e Lançamentos */}
                                    <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
                                        <div className="p-6 border-b dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                                            <div className="flex items-center gap-3">
                                                <Wallet className={payrollChargeView === 'with_taxes' ? 'text-emerald-600' : 'text-cyan-600'} />
                                                <div>
                                                    <h3 className="font-black text-lg text-slate-900 dark:text-white uppercase tracking-tight">
                                                        {payrollChargeView === 'with_taxes' ? 'Folha de Pagamento — Custo Total Empresa' : 'Folha de Pagamento — Líquido dos Colaboradores'}
                                                    </h3>
                                                    <p className="text-[11px] text-slate-400 font-bold">
                                                        {payrollChargeView === 'with_taxes' ? `Regime: ${payrollTaxSettings.regime} (Encargos federais somam ${formatCurrency(payrollSummary.totalFederalTaxes)})` : 'Valores líquidos a creditar na conta de cada colaborador (sem encargos patronais)'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm text-left">
                                                <thead className="bg-slate-50 dark:bg-gray-800 text-[10px] font-black text-slate-400 uppercase border-b dark:border-gray-700">
                                                    {payrollChargeView === 'without_taxes' ? (
                                                        <tr>
                                                            <th className="px-4 py-4">Comp.</th>
                                                            <th className="px-5 py-4">Colaborador</th>
                                                            <th className="px-4 py-4 text-right">Base</th>
                                                            <th className="px-4 py-4 text-right">HE/DSR</th>
                                                            <th className="px-4 py-4 text-right">Descontos</th>
                                                            <th className="px-5 py-4 text-right">Líquido a Pagar</th>
                                                            <th className="px-4 py-4 text-center">Status</th>
                                                            <th className="px-4 py-4 text-right">Ações</th>
                                                        </tr>
                                                    ) : (
                                                        <tr>
                                                            <th className="px-4 py-4">Comp.</th>
                                                            <th className="px-5 py-4">Colaborador</th>
                                                            <th className="px-4 py-4 text-right">Base INSS</th>
                                                            <th className="px-4 py-4 text-right">FGTS (8%)</th>
                                                            <th className="px-4 py-4 text-right">INSS Pat.</th>
                                                            <th className="px-4 py-4 text-right">Provisões</th>
                                                            <th className="px-5 py-4 text-right">Custo Empresa</th>
                                                            <th className="px-4 py-4 text-center">Status</th>
                                                            <th className="px-4 py-4 text-right">Ações</th>
                                                        </tr>
                                                    )}
                                                </thead>
                                                <tbody className="divide-y dark:divide-gray-700">
                                                    {payroll.map(p => {
                                                        const emp = employees.find(e => e.id === p.employeeId);
                                                        const calc = emp ? calculateEmployeePayroll(emp, p.month) : null;
                                                        const baseSalary = p.baseSalary;
                                                        const overtimeVal = p.overtime || (calc?.totalOvertime || 0);
                                                        const discountsVal = p.discounts || (calc?.totalDiscounts || 0);
                                                        const baseINSS = calc?.baseINSS || (baseSalary + overtimeVal);
                                                        const fgtsVal = calc?.fgts || 0;
                                                        const inssPatVal = calc?.inssPatronal || 0;
                                                        const provisaoVal = calc?.provisaoFerias13 || 0;
                                                        const companyCost = calc?.totalCompanyCost || (p.totalNet + fgtsVal + inssPatVal + provisaoVal);

                                                        return (
                                                            <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-emerald-900/10 transition-all">
                                                                <td className="px-4 py-4 font-black text-slate-500 text-xs">{p.month}</td>
                                                                <td className="px-5 py-4">
                                                                    <p className="font-bold text-slate-800 dark:text-white text-xs">{p.employeeName}</p>
                                                                    <p className="text-[10px] text-slate-400 font-medium">{emp?.role || 'Colaborador'}</p>
                                                                </td>
                                                                {payrollChargeView === 'without_taxes' ? (
                                                                    <>
                                                                        <td className="px-4 py-4 text-right font-medium text-xs text-slate-600 dark:text-slate-300">{formatCurrency(baseSalary)}</td>
                                                                        <td className="px-4 py-4 text-right font-medium text-xs text-emerald-600">+{formatCurrency(overtimeVal)}</td>
                                                                        <td className="px-4 py-4 text-right font-medium text-xs text-rose-600">-{formatCurrency(discountsVal)}</td>
                                                                        <td className="px-5 py-4 text-right font-black text-sm text-cyan-600">{formatCurrency(p.totalNet)}</td>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <td className="px-4 py-4 text-right font-medium text-xs text-slate-600 dark:text-slate-300">{formatCurrency(baseINSS)}</td>
                                                                        <td className="px-4 py-4 text-right font-bold text-xs text-amber-600">{payrollTaxSettings.applyFGTS ? formatCurrency(fgtsVal) : 'Isento'}</td>
                                                                        <td className="px-4 py-4 text-right font-bold text-xs text-rose-600">{payrollTaxSettings.applyINSSPatronal ? formatCurrency(inssPatVal) : 'Isento'}</td>
                                                                        <td className="px-4 py-4 text-right font-bold text-xs text-purple-600">{payrollTaxSettings.applyProvisaoFerias13 ? formatCurrency(provisaoVal) : 'Isento'}</td>
                                                                        <td className="px-5 py-4 text-right font-black text-sm text-emerald-600">{formatCurrency(companyCost)}</td>
                                                                    </>
                                                                )}
                                                                {(() => {
                                                                    const tx = transactions.find(t => t.id === `tx-pay-${p.id}`);
                                                                    const isPaidInFinance = p.status === 'Pago' || tx?.status === 'Conciliado';

                                                                    return (
                                                                        <>
                                                                            <td className="px-4 py-4 text-center">
                                                                                <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase ${isPaidInFinance ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'}`}>
                                                                                    {isPaidInFinance ? 'Pago (Tesouraria)' : 'Aguardando Financeiro'}
                                                                                </span>
                                                                            </td>
                                                                            <td className="px-4 py-4 text-right">
                                                                                <div className="flex items-center justify-end gap-1.5">
                                                                                    <button
                                                                                        onClick={() => handlePrintReceipt(p)}
                                                                                        className="px-2.5 py-1.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-200 font-bold text-[10px] rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1 uppercase"
                                                                                        title="Visualizar ou imprimir comprovante"
                                                                                    >
                                                                                        <FileText size={12} /> {isPaidInFinance ? 'Holerite' : 'Prévia'}
                                                                                    </button>
                                                                                    {isPaidInFinance ? (
                                                                                        <span className="px-2 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-bold text-[10px] rounded-lg flex items-center gap-1 uppercase" title="Liquidação efetuada pelo módulo Financeiro">
                                                                                            <CheckCircle size={12} /> Liquidado
                                                                                        </span>
                                                                                    ) : (
                                                                                        <span className="px-2 py-1.5 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 font-bold text-[10px] rounded-lg flex items-center gap-1 uppercase" title="Provisão gerada e encaminhada ao Contas a Pagar. Liquidação exclusiva da Tesouraria.">
                                                                                            <Clock size={12} /> Aberto (Fin.)
                                                                                        </span>
                                                                                    )}
                                                                                </div>
                                                                            </td>
                                                                        </>
                                                                    );
                                                                })()}
                                                            </tr>
                                                        );
                                                    })}
                                                    {payroll.length === 0 && (
                                                        <tr><td colSpan={payrollChargeView === 'without_taxes' ? 8 : 9} className="px-6 py-20 text-center text-slate-400 italic font-medium uppercase text-xs tracking-widest">Aguardando geração da folha...</td></tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {/* Card de Resumo Dinâmico (Com e Sem Encargos) */}
                                    <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-8 rounded-3xl shadow-2xl text-white flex flex-col justify-between">
                                        <div>
                                            <div className="flex items-center justify-between mb-6">
                                                <h3 className="text-xl font-black flex items-center gap-2">
                                                    <DollarSign className={payrollChargeView === 'with_taxes' ? 'text-emerald-400' : 'text-cyan-400'} />
                                                    {payrollChargeView === 'with_taxes' ? 'Resumo Custo Empresa' : 'Resumo Desembolso Líquido'}
                                                </h3>
                                                <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-full ${payrollChargeView === 'with_taxes' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'}`}>
                                                    {payrollChargeView === 'with_taxes' ? 'Com Encargos' : 'Sem Encargos'}
                                                </span>
                                            </div>

                                            <div className="space-y-4">
                                                {payrollChargeView === 'without_taxes' ? (
                                                    <>
                                                        <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Líquido a Pagar aos Colaboradores</p>
                                                            <p className="text-3xl font-black text-cyan-400">{formatCurrency(payrollSummary.totalNet)}</p>
                                                            <p className="text-[10px] text-slate-400 font-bold mt-1">Salário base + Horas extras - Descontos legais</p>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-3 text-xs">
                                                            <div className="p-3 bg-white/5 rounded-xl">
                                                                <span className="text-[10px] text-slate-400 uppercase block font-bold">Salários Base</span>
                                                                <span className="font-bold text-white">{formatCurrency(payrollSummary.totalBase)}</span>
                                                            </div>
                                                            <div className="p-3 bg-white/5 rounded-xl">
                                                                <span className="text-[10px] text-emerald-400 uppercase block font-bold">Horas Extras + DSR</span>
                                                                <span className="font-bold text-emerald-300">+{formatCurrency(payrollSummary.totalOvertime)}</span>
                                                            </div>
                                                            <div className="p-3 bg-white/5 rounded-xl">
                                                                <span className="text-[10px] text-blue-400 uppercase block font-bold">Auxílio Alimentação</span>
                                                                <span className="font-bold text-blue-300">+{formatCurrency(payrollSummary.totalBenefits)}</span>
                                                            </div>
                                                            <div className="p-3 bg-white/5 rounded-xl">
                                                                <span className="text-[10px] text-rose-400 uppercase block font-bold">Descontos Retidos</span>
                                                                <span className="font-bold text-rose-300">-{formatCurrency(payrollSummary.totalDiscountsEmployee)}</span>
                                                            </div>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <>
                                                        <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Custo Total Empresa ({payrollTaxSettings.regime})</p>
                                                            <p className="text-3xl font-black text-emerald-400">{formatCurrency(payrollSummary.totalCompanyCost)}</p>
                                                            <p className="text-[10px] text-slate-400 font-bold mt-1">Salários + Encargos Federais (+{payrollSummary.effectiveTaxRate.toFixed(1)}%)</p>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-3 text-xs">
                                                            <div className="p-3 bg-white/5 rounded-xl">
                                                                <span className="text-[10px] text-slate-400 uppercase block font-bold">Folha Bruta (Base+HE)</span>
                                                                <span className="font-bold text-white">{formatCurrency(payrollSummary.totalBase + payrollSummary.totalOvertime)}</span>
                                                            </div>
                                                            <div className="p-3 bg-white/5 rounded-xl">
                                                                <span className="text-[10px] text-cyan-400 uppercase block font-bold">Líquido Colaboradores</span>
                                                                <span className="font-bold text-cyan-300">{formatCurrency(payrollSummary.totalNet)}</span>
                                                            </div>
                                                            <div className="p-3 bg-white/5 rounded-xl">
                                                                <span className="text-[10px] text-amber-400 uppercase block font-bold">FGTS (8%)</span>
                                                                <span className="font-bold text-amber-300">{payrollTaxSettings.applyFGTS ? formatCurrency(payrollSummary.totalFGTS) : 'Isento'}</span>
                                                            </div>
                                                            <div className="p-3 bg-white/5 rounded-xl">
                                                                <span className="text-[10px] text-rose-400 uppercase block font-bold">INSS Patronal (28.8%)</span>
                                                                <span className="font-bold text-rose-300">{payrollTaxSettings.applyINSSPatronal ? formatCurrency(payrollSummary.totalINSSPatronal) : 'Isento'}</span>
                                                            </div>
                                                            <div className="p-3 bg-white/5 rounded-xl">
                                                                <span className="text-[10px] text-purple-400 uppercase block font-bold">Provisão 13º / Férias</span>
                                                                <span className="font-bold text-purple-300">{payrollTaxSettings.applyProvisaoFerias13 ? formatCurrency(payrollSummary.totalProvisao13Ferias) : 'Isento'}</span>
                                                            </div>
                                                            <div className="p-3 bg-white/5 rounded-xl">
                                                                <span className="text-[10px] text-emerald-400 uppercase block font-bold">Total Encargos</span>
                                                                <span className="font-bold text-emerald-300">{formatCurrency(payrollSummary.totalFederalTaxes)}</span>
                                                            </div>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        <div className="pt-6 border-t border-white/10 mt-6 text-xs text-slate-400 flex justify-between items-center">
                                            <span>Regime Tributário:</span>
                                            <span className="font-bold text-white">{payrollChargeView === 'with_taxes' ? payrollTaxSettings.regime : 'CLT Padrão'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Time Clock Tab (Espelho de Ponto & Kiosk) */}
                        {activeTab === 'time' && (
                            <div className="space-y-6">
                                {/* Subtab navigation between Espelho de Ponto and Kiosk */}
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-800 p-4 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm">
                                    <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-2xl">
                                        <button
                                            onClick={() => setTimeViewMode('timesheet')}
                                            className={`px-5 py-2.5 text-xs font-black rounded-xl transition-all uppercase flex items-center gap-2 ${timeViewMode === 'timesheet' ? 'bg-white dark:bg-slate-800 text-cyan-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                        >
                                            <Calendar size={16} /> Espelho de Ponto (Portaria 671)
                                        </button>
                                        <button
                                            onClick={() => setTimeViewMode('kiosk')}
                                            className={`px-5 py-2.5 text-xs font-black rounded-xl transition-all uppercase flex items-center gap-2 ${timeViewMode === 'kiosk' ? 'bg-white dark:bg-slate-800 text-cyan-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                        >
                                            <Fingerprint size={16} /> Relógio Kiosk / Registro
                                        </button>
                                    </div>
                                    {timeViewMode === 'timesheet' && (
                                        <div className="flex flex-wrap items-center gap-3">
                                            <select
                                                className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-white"
                                                value={selectedEspelhoEmpId || (currentEspelhoEmp?.id || '')}
                                                onChange={(e) => setSelectedEspelhoEmpId(e.target.value)}
                                            >
                                                {employees.map(emp => (
                                                    <option key={emp.id} value={emp.id}>{emp.name} ({emp.role})</option>
                                                ))}
                                            </select>
                                            <input
                                                type="month"
                                                className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-white"
                                                value={selectedEspelhoMonth}
                                                onChange={(e) => setSelectedEspelhoMonth(e.target.value)}
                                            />
                                            <button
                                                onClick={() => {
                                                    setManualTimeForm({
                                                        employeeId: currentEspelhoEmp?.id || '',
                                                        date: new Date().toISOString().split('T')[0],
                                                        checkIn: '08:00',
                                                        lunchStart: '12:00',
                                                        lunchEnd: '13:00',
                                                        checkOut: '17:00',
                                                        reason: 'Ajuste operacional de marcação'
                                                    });
                                                    setIsManualTimeModalOpen(true);
                                                }}
                                                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl uppercase flex items-center gap-1.5 shadow-sm transition-all"
                                            >
                                                <Plus size={15} /> Ajuste Manual
                                            </button>
                                            {currentEspelhoEmp && (
                                                <>
                                                    <button
                                                        onClick={handleExportPontoToFolha}
                                                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl uppercase flex items-center gap-1.5 shadow-sm transition-all"
                                                        title="Exportar horas extras e faltas para a Folha de Pagamento"
                                                    >
                                                        <ArrowUpRight size={15} /> Exportar p/ Folha
                                                    </button>
                                                    <button
                                                        onClick={() => handlePrintEspelhoPonto(currentEspelhoEmp, selectedEspelhoMonth, espelhoData.daysData, espelhoData.totals)}
                                                        className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white font-black text-xs rounded-xl uppercase flex items-center gap-1.5 shadow-sm transition-all"
                                                    >
                                                        <Printer size={15} /> Imprimir Espelho Oficial
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {timeViewMode === 'timesheet' && (
                                    <>
                                        {/* Espelho KPI Totals */}
                                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Horas Previstas</span>
                                                <p className="text-xl font-black text-slate-800 dark:text-white">{espelhoData.totals.expectedStr}</p>
                                                <span className="text-[10px] text-slate-400">Jornada 44h semanais</span>
                                            </div>
                                            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Horas Trabalhadas</span>
                                                <p className="text-xl font-black text-slate-900 dark:text-white">{espelhoData.totals.workedStr}</p>
                                                <span className="text-[10px] text-slate-400">Total realizado</span>
                                            </div>
                                            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
                                                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest block mb-1">Horas Extras (+)</span>
                                                <p className="text-xl font-black text-emerald-600">+{espelhoData.totals.overtimeStr}</p>
                                                <span className="text-[10px] text-emerald-600/70">Adicional 50%</span>
                                            </div>
                                            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
                                                <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest block mb-1">Atrasos / Faltas (-)</span>
                                                <p className="text-xl font-black text-rose-500">-{espelhoData.totals.delayStr}</p>
                                                <span className="text-[10px] text-rose-500/70">Horas a debitar</span>
                                            </div>
                                            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm col-span-2 md:col-span-1">
                                                <span className="text-[10px] font-black text-cyan-600 uppercase tracking-widest block mb-1">Saldo Banco</span>
                                                <p className={`text-xl font-black ${espelhoData.totals.balanceMins >= 0 ? 'text-cyan-600' : 'text-rose-600'}`}>{espelhoData.totals.balanceStr}</p>
                                                <span className="text-[10px] text-cyan-600/70">Compensação mensal</span>
                                            </div>
                                        </div>

                                        {/* Espelho Table */}
                                        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
                                            <div className="p-4 border-b dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/30">
                                                <div>
                                                    <h4 className="font-black text-sm text-slate-800 dark:text-white uppercase tracking-tight">
                                                        Espelho Mensal • {currentEspelhoEmp ? currentEspelhoEmp.name : 'Nenhum colaborador'} ({selectedEspelhoMonth})
                                                    </h4>
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">
                                                        Conformidade Art. 74 CLT & Portaria MTE 671/2021
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-xs text-left">
                                                    <thead className="bg-slate-50 dark:bg-slate-900 text-[10px] font-black text-slate-400 uppercase border-b dark:border-slate-700">
                                                        <tr>
                                                            <th className="px-4 py-3">Data / Dia</th>
                                                            <th className="px-4 py-3 text-center">1ª Entrada</th>
                                                            <th className="px-4 py-3 text-center">Intervalo Intrajornada</th>
                                                            <th className="px-4 py-3 text-center">2ª Saída</th>
                                                            <th className="px-4 py-3 text-center">Realizado</th>
                                                            <th className="px-4 py-3 text-center">Previsto</th>
                                                            <th className="px-4 py-3 text-center">Saldo Diário</th>
                                                            <th className="px-4 py-3">Ocorrência</th>
                                                            <th className="px-4 py-3 text-right">Ação</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y dark:divide-slate-700">
                                                        {espelhoData.daysData.map((d) => (
                                                            <tr key={d.day} className={`hover:bg-slate-50/80 dark:hover:bg-cyan-900/10 transition-colors ${d.isWeekend ? 'bg-slate-50/40 dark:bg-slate-900/30' : ''}`}>
                                                                <td className="px-4 py-3 font-bold text-slate-800 dark:text-slate-200">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-[11px] ${d.isWeekend ? 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300' : 'bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-300'}`}>
                                                                            {d.day}
                                                                        </span>
                                                                        <div>
                                                                            <span className="block font-black">{d.weekday}</span>
                                                                            <span className="text-[10px] text-slate-400">{d.dateStr}</span>
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td className="px-4 py-3 text-center font-mono font-bold text-slate-700 dark:text-slate-300">
                                                                    {d.checkIn || '—'}
                                                                </td>
                                                                <td className="px-4 py-3 text-center font-mono text-slate-600 dark:text-slate-400">
                                                                    {d.lunchStart && d.lunchEnd ? `${d.lunchStart} - ${d.lunchEnd}` : (d.checkIn && d.checkOut ? '12:00 - 13:00' : '—')}
                                                                </td>
                                                                <td className="px-4 py-3 text-center font-mono font-bold text-slate-700 dark:text-slate-300">
                                                                    {d.checkOut || '—'}
                                                                </td>
                                                                <td className="px-4 py-3 text-center font-black text-slate-900 dark:text-white">
                                                                    {d.workedStr}
                                                                </td>
                                                                <td className="px-4 py-3 text-center text-slate-400 font-bold">
                                                                    {d.expectedStr}
                                                                </td>
                                                                <td className="px-4 py-3 text-center font-black">
                                                                    <span className={`px-2 py-0.5 rounded-md text-[10px] ${
                                                                        d.deltaMin > 0
                                                                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                                                                            : d.deltaMin < 0 && !d.isWeekend && !d.onVacation
                                                                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300'
                                                                            : 'text-slate-400'
                                                                    }`}>
                                                                        {d.deltaStr}
                                                                    </span>
                                                                </td>
                                                                <td className="px-4 py-3">
                                                                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wide ${
                                                                        d.isJustified
                                                                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                                                            : d.isWithinCltTolerance
                                                                            ? 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950/60 dark:text-cyan-300'
                                                                            : d.onVacation
                                                                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                                                                            : d.isWeekend
                                                                            ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                                                            : d.deltaMin > 0
                                                                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                                                                            : d.workedMins === 0
                                                                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300'
                                                                            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                                                                    }`}>
                                                                        {d.occurrence}
                                                                    </span>
                                                                </td>
                                                                <td className="px-4 py-3 text-right">
                                                                    {d.isJustified ? (
                                                                        <div className="flex items-center justify-end gap-1.5">
                                                                            <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 rounded-lg text-[9px] font-bold" title={d.justification?.reason}>
                                                                                {d.justification?.doctorCrm ? `CRM ${d.justification.doctorCrm}` : 'Abonado'}
                                                                            </span>
                                                                            <button
                                                                                onClick={() => handleRemoveJustification(d.dateIso)}
                                                                                className="p-1 hover:bg-rose-100 text-rose-500 rounded-lg transition-colors"
                                                                                title="Revogar abono da falta"
                                                                            >
                                                                                <X size={13} />
                                                                            </button>
                                                                        </div>
                                                                    ) : (!d.isWeekend && !d.onVacation && (d.workedMins === 0 || d.deltaMin < 0)) ? (
                                                                        <button
                                                                            onClick={() => openJustifyModal(d)}
                                                                            className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white font-black text-[10px] rounded-lg uppercase tracking-wider transition-all shadow-sm flex items-center gap-1 ml-auto"
                                                                            title="Abonar falta ou atraso com atestado ou justificativa legal"
                                                                        >
                                                                            <ShieldCheck size={12} /> Abonar
                                                                        </button>
                                                                    ) : (
                                                                        <span className="text-slate-300 dark:text-slate-600 text-[10px]">—</span>
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </>
                                )}

                                {timeViewMode === 'kiosk' && (
                                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                                        {/* Kiosk Panel - Ponto Expresso 1-Clique */}
                                        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden flex flex-col">
                                            {/* Cabeçalho com Relógio ao Vivo e Data de Hoje */}
                                            <div className="p-6 border-b dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900/50 flex flex-col sm:flex-row items-center justify-between gap-4">
                                                <div>
                                                    <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
                                                        <Clock className="text-cyan-600" size={22} /> Ponto Expresso 1-Clique
                                                    </h3>
                                                    <p className="text-xs font-bold text-slate-400 capitalize">
                                                        {new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                                    </p>
                                                </div>
                                                <div className="bg-slate-900 dark:bg-black text-cyan-400 px-5 py-2.5 rounded-2xl font-mono text-2xl font-black shadow-inner tracking-widest border border-cyan-500/30">
                                                    {currentTimeStr}
                                                </div>
                                            </div>

                                            <div className="p-6 space-y-6 flex-1 flex flex-col justify-between">
                                                <div className="space-y-4">
                                                    <div>
                                                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">
                                                            Colaborador
                                                        </label>
                                                        <select
                                                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl py-3.5 px-4 font-bold text-sm text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-cyan-500 transition-all"
                                                            value={clockEmpId}
                                                            onChange={e => setClockEmpId(e.target.value)}
                                                        >
                                                            <option value="">Selecione seu nome na lista...</option>
                                                            {employees.filter(e => e.status === 'Ativo').map(e => (
                                                                <option key={e.id} value={e.id}>{e.name} — {e.role} ({e.department})</option>
                                                            ))}
                                                        </select>
                                                    </div>

                                                    {clockEmpId && selectedClockEmp ? (
                                                        <div className="space-y-5 animate-in fade-in duration-300">
                                                            {/* Mini Card de Status de Hoje */}
                                                            <div className="p-4 bg-slate-50 dark:bg-slate-900/80 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                                                                <div className="flex items-center justify-between">
                                                                    <div>
                                                                        <p className="font-black text-slate-900 dark:text-white text-base">{selectedClockEmp.name}</p>
                                                                        <p className="text-[11px] text-slate-400 font-bold">{selectedClockEmp.role} • {selectedClockEmp.department}</p>
                                                                    </div>
                                                                    <span className="px-3 py-1 bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300 rounded-full text-[10px] font-black uppercase">
                                                                        Hoje ({todayBrStr})
                                                                    </span>
                                                                </div>

                                                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t dark:border-slate-700 text-center">
                                                                    <div className={`p-2.5 rounded-xl border ${selectedClockEmpLog?.checkIn ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'}`}>
                                                                        <span className="text-[9px] font-black uppercase block tracking-wider">1ª Entrada</span>
                                                                        <span className="text-sm font-mono font-black">{selectedClockEmpLog?.checkIn || '--:--'}</span>
                                                                    </div>
                                                                    <div className={`p-2.5 rounded-xl border ${selectedClockEmpLog?.lunchStart ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'}`}>
                                                                        <span className="text-[9px] font-black uppercase block tracking-wider">Início Almoço</span>
                                                                        <span className="text-sm font-mono font-black">{selectedClockEmpLog?.lunchStart || '--:--'}</span>
                                                                    </div>
                                                                    <div className={`p-2.5 rounded-xl border ${selectedClockEmpLog?.lunchEnd ? 'bg-blue-50 dark:bg-blue-950/30 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'}`}>
                                                                        <span className="text-[9px] font-black uppercase block tracking-wider">Fim Almoço</span>
                                                                        <span className="text-sm font-mono font-black">{selectedClockEmpLog?.lunchEnd || '--:--'}</span>
                                                                    </div>
                                                                    <div className={`p-2.5 rounded-xl border ${selectedClockEmpLog?.checkOut ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-300 dark:border-rose-700 text-rose-700 dark:text-rose-300' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'}`}>
                                                                        <span className="text-[9px] font-black uppercase block tracking-wider">2ª Saída</span>
                                                                        <span className="text-sm font-mono font-black">{selectedClockEmpLog?.checkOut || '--:--'}</span>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* 4 Botões 1-Clique */}
                                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                                                                <button
                                                                    onClick={() => handleQuickPunch('checkIn')}
                                                                    className="p-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-600/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                                                                >
                                                                    <Play size={16} /> 1ª Entrada ({currentTimeStr.slice(0, 5)})
                                                                </button>
                                                                <button
                                                                    onClick={() => handleQuickPunch('lunchStart')}
                                                                    className="p-4 bg-amber-600 hover:bg-amber-500 text-white rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-600/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                                                                >
                                                                    <Clock size={16} /> Início Almoço ({currentTimeStr.slice(0, 5)})
                                                                </button>
                                                                <button
                                                                    onClick={() => handleQuickPunch('lunchEnd')}
                                                                    className="p-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg shadow-blue-600/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                                                                >
                                                                    <CheckCircle size={16} /> Fim Almoço ({currentTimeStr.slice(0, 5)})
                                                                </button>
                                                                <button
                                                                    onClick={() => handleQuickPunch('checkOut')}
                                                                    className="p-4 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg shadow-rose-600/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                                                                >
                                                                    <StopCircle size={16} /> 2ª Saída ({currentTimeStr.slice(0, 5)})
                                                                </button>
                                                            </div>

                                                            <button
                                                                onClick={() => {
                                                                    setSelectedEspelhoEmpId(clockEmpId);
                                                                    setTimeViewMode('timesheet');
                                                                }}
                                                                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700/80 text-slate-700 dark:text-slate-200 font-bold rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
                                                            >
                                                                <Calendar size={14} /> Ver Espelho Completo (Portaria 671)
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="py-12 text-center text-slate-400 space-y-3">
                                                            <Clock size={48} className="mx-auto opacity-20 text-cyan-600 animate-pulse" />
                                                            <p className="font-bold text-sm text-slate-600 dark:text-slate-300">Selecione seu nome acima para bater o ponto em 1 clique</p>
                                                            <p className="text-xs text-slate-400 max-w-xs mx-auto">O horário atual será registrado com validade legal e sincronizado imediatamente com o espelho de ponto.</p>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Modo PIN Opcional */}
                                                <div className="pt-4 border-t dark:border-slate-700/50">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Opção com Senha / PIN</span>
                                                        <button
                                                            onClick={() => setClockMethod(clockMethod === 'pin' ? 'express' : 'pin')}
                                                            className="text-[10px] font-bold text-cyan-600 hover:underline uppercase"
                                                        >
                                                            {clockMethod === 'pin' ? 'Ocultar PIN' : 'Usar Senha/PIN'}
                                                        </button>
                                                    </div>
                                                    {clockMethod === 'pin' && (
                                                        <div className="mt-3 flex gap-2">
                                                            <input
                                                                type="password"
                                                                className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 font-bold text-center text-base tracking-widest"
                                                                placeholder="PIN (1234)"
                                                                value={clockPass}
                                                                onChange={e => setClockPass(e.target.value)}
                                                            />
                                                            <button
                                                                onClick={() => handlePinClock('In')}
                                                                className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold text-xs uppercase"
                                                            >
                                                                Entrada
                                                            </button>
                                                            <button
                                                                onClick={() => handlePinClock('Out')}
                                                                className="px-4 py-2 bg-rose-600 text-white rounded-xl font-bold text-xs uppercase"
                                                            >
                                                                Saída
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
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
                            </div>
                        )}

                        {/* Modal de Liquidação / Pagamento de Antecipação */}
                        {isPayAdvanceModalOpen && selectedAdvanceToPay && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                                <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-lg border dark:border-slate-700 overflow-hidden animate-in zoom-in-95 duration-200">
                                    <div className="p-6 border-b dark:border-slate-700 flex justify-between items-center bg-slate-50/70 dark:bg-slate-900/50">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2.5 bg-emerald-600 text-white rounded-2xl shadow-lg shadow-emerald-600/20">
                                                <Wallet size={20} />
                                            </div>
                                            <div>
                                                <h3 className="font-black text-lg text-slate-900 dark:text-white uppercase tracking-tight">Liquidar Antecipação</h3>
                                                <p className="text-xs text-slate-400 font-bold">Lançamento de débito e quitação de adiantamento</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => { setIsPayAdvanceModalOpen(false); setSelectedAdvanceToPay(null); }}
                                            className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg"
                                        >
                                            <X size={20} />
                                        </button>
                                    </div>

                                    <form onSubmit={handleConfirmPayAdvance} className="p-6 space-y-4">
                                        {/* Card de Resumo da Solicitação */}
                                        <div className="p-4 bg-slate-50 dark:bg-slate-900/80 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                                            <div>
                                                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Colaborador</span>
                                                <p className="font-black text-base text-slate-800 dark:text-white">{selectedAdvanceToPay.employeeName}</p>
                                                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold mt-0.5">
                                                    Desconto previsto: <span className="text-cyan-600 dark:text-cyan-400">{selectedAdvanceToPay.deductFromMonth}</span>
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Valor a Pagar</span>
                                                <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{formatCurrency(selectedAdvanceToPay.amount)}</p>
                                            </div>
                                        </div>

                                        {/* Seleção da Conta Bancária de Origem com Saldo */}
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">
                                                Conta Bancária de Saída (Débito)
                                            </label>
                                            <select
                                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-3 px-3 font-bold text-sm outline-none focus:border-cyan-500 transition-colors"
                                                value={advancePaymentForm.accountId}
                                                onChange={e => setAdvancePaymentForm({ ...advancePaymentForm, accountId: e.target.value })}
                                                required
                                            >
                                                <option value="">Selecione a conta bancária...</option>
                                                {accounts.map(acc => (
                                                    <option key={acc.id} value={acc.id}>
                                                        {acc.name} ({acc.bankName || acc.type || 'Conta'}) — Saldo: {formatCurrency(acc.balance || 0)}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            {/* Forma de Pagamento */}
                                            <div>
                                                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">
                                                    Forma de Pagamento
                                                </label>
                                                <select
                                                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-3 px-3 font-bold text-sm outline-none focus:border-cyan-500 transition-colors"
                                                    value={advancePaymentForm.paymentMethod}
                                                    onChange={e => setAdvancePaymentForm({ ...advancePaymentForm, paymentMethod: e.target.value as any })}
                                                    required
                                                >
                                                    <option value="PIX">⚡ PIX</option>
                                                    <option value="Transferência Bancária">🏦 Transferência (TED/DOC)</option>
                                                    <option value="Dinheiro">💵 Dinheiro em Espécie</option>
                                                    <option value="Cheque">📄 Cheque</option>
                                                </select>
                                            </div>

                                            {/* Data do Pagamento */}
                                            <div>
                                                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">
                                                    Data do Débito
                                                </label>
                                                <input
                                                    type="date"
                                                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-3 font-bold text-sm outline-none focus:border-cyan-500 transition-colors"
                                                    value={advancePaymentForm.date}
                                                    onChange={e => setAdvancePaymentForm({ ...advancePaymentForm, date: e.target.value })}
                                                    required
                                                />
                                            </div>
                                        </div>

                                        {/* Observações */}
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">
                                                Observações / Identificador Comprovante (Opcional)
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="Ex: Chave PIX, autenticação bancária, nº comprovante"
                                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-3 font-bold text-xs outline-none focus:border-cyan-500 transition-colors"
                                                value={advancePaymentForm.notes}
                                                onChange={e => setAdvancePaymentForm({ ...advancePaymentForm, notes: e.target.value })}
                                            />
                                        </div>

                                        <div className="pt-2">
                                            <button
                                                type="submit"
                                                className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-2xl shadow-lg shadow-emerald-600/20 uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2"
                                            >
                                                <Check size={16} /> Confirmar Pagamento e Debitar Conta
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}

                        {/* Modal de Estorno de Pagamento de Antecipação */}
                        {isRefundAdvanceModalOpen && selectedAdvanceToRefund && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                                <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-lg border dark:border-slate-700 overflow-hidden animate-in zoom-in-95 duration-200">
                                    <div className="p-6 border-b dark:border-slate-700 flex justify-between items-center bg-amber-50/70 dark:bg-amber-950/30">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2.5 bg-amber-600 text-white rounded-2xl shadow-lg shadow-amber-600/20">
                                                <RotateCcw size={20} />
                                            </div>
                                            <div>
                                                <h3 className="font-black text-lg text-slate-900 dark:text-white uppercase tracking-tight">Estornar Pagamento</h3>
                                                <p className="text-xs text-amber-700 dark:text-amber-300 font-bold">Reversão de débito e recomposição de saldo bancário</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => { setIsRefundAdvanceModalOpen(false); setSelectedAdvanceToRefund(null); }}
                                            className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg"
                                        >
                                            <X size={20} />
                                        </button>
                                    </div>

                                    <form onSubmit={handleConfirmRefundAdvance} className="p-6 space-y-4">
                                        <div className="p-4 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-2xl space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] font-black uppercase text-amber-800 dark:text-amber-300 tracking-wider">Ação Restrita</span>
                                                <span className="px-2.5 py-0.5 bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200 rounded-full text-[9px] font-black uppercase">
                                                    Admin / Gerente Financeiro
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                                                O estorno excluirá o lançamento financeiro de despesa vinculado, <strong>recompondo automaticamente o saldo da conta bancária de origem</strong> e retornando a antecipação de <strong>{selectedAdvanceToRefund.employeeName}</strong> no valor de <strong>{formatCurrency(selectedAdvanceToRefund.amount)}</strong> para o status <strong>'Aprovado'</strong>.
                                            </p>
                                        </div>

                                        {(() => {
                                            const txId = `tx-adv-${selectedAdvanceToRefund.id}`;
                                            const linkedTx = transactions.find(t => t.id === txId);
                                            return linkedTx ? (
                                                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                                                    <span className="text-[10px] font-black uppercase text-slate-400 block mb-1">Transação Financeira Localizada:</span>
                                                    <p className="font-bold text-slate-800 dark:text-white">{linkedTx.description}</p>
                                                    <p className="text-[11px] text-slate-500 mt-0.5">
                                                        Conta de Origem: <strong>{linkedTx.account}</strong> • Valor: <strong>{formatCurrency(linkedTx.amount)}</strong> • Data: {linkedTx.date}
                                                    </p>
                                                </div>
                                            ) : (
                                                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-400 italic">
                                                    Nenhuma transação financeira vinculada encontrada (será apenas revertido o status para Aprovado).
                                                </div>
                                            );
                                        })()}

                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">
                                                Motivo / Justificativa do Estorno (Obrigatório)
                                            </label>
                                            <textarea
                                                rows={3}
                                                required
                                                placeholder="Informe o motivo da reversão (ex: pagamento em duplicidade, conta bancária incorreta, cancelamento solicitado pelo colaborador)..."
                                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 font-medium text-xs outline-none focus:border-amber-500 transition-colors"
                                                value={refundReason}
                                                onChange={e => setRefundReason(e.target.value)}
                                            />
                                        </div>

                                        <div className="pt-2">
                                            <button
                                                type="submit"
                                                className="w-full py-4 bg-amber-600 hover:bg-amber-500 text-white font-black rounded-2xl shadow-lg shadow-amber-600/20 uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2"
                                            >
                                                <RotateCcw size={16} /> Confirmar Estorno e Recompor Saldo
                                            </button>
                                        </div>
                                    </form>
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

                        {/* Vacation Modal (Aprimorado com Cálculo ao Vivo e Abono Pecuniário) */}
                        {isVacationModalOpen && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                                <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-lg border dark:border-slate-700 overflow-hidden animate-in zoom-in-95 duration-200">
                                    <div className="p-6 border-b dark:border-slate-700 flex justify-between items-center bg-cyan-50/70 dark:bg-cyan-950/30">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2.5 bg-cyan-600 text-white rounded-2xl shadow-lg shadow-cyan-600/20">
                                                <Plane size={20} />
                                            </div>
                                            <div>
                                                <h3 className="font-black text-xl text-slate-900 dark:text-white uppercase tracking-tight">Solicitar / Agendar Férias</h3>
                                                <p className="text-xs text-cyan-700 dark:text-cyan-300 font-bold">Conformidade CLT Art. 134 e 143</p>
                                            </div>
                                        </div>
                                        <button onClick={() => setIsVacationModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"><X size={20} /></button>
                                    </div>
                                    <form onSubmit={handleSaveVacation} className="p-6 space-y-4 max-h-[85vh] overflow-y-auto">
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest">Colaborador</label>
                                            <select
                                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-3 px-3 font-bold text-sm text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-cyan-500"
                                                value={vacationForm.employeeId || ''}
                                                onChange={e => {
                                                    const empId = e.target.value;
                                                    setVacationForm(prev => ({ ...prev, employeeId: empId }));
                                                }}
                                                required
                                            >
                                                <option value="">Selecione um colaborador...</option>
                                                {employees.filter(e => e.status === 'Ativo').map(emp => (
                                                    <option key={emp.id} value={emp.id}>
                                                        {emp.name} — Saldo: {emp.vacationDaysAvailable || 30} dias ({formatCurrency(emp.salary)}/mês)
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Botões Rápidos de Duração das Férias */}
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 tracking-widest">Opção de Fracionamento CLT</label>
                                            <div className="grid grid-cols-4 gap-2">
                                                {[
                                                    { label: '30 dias', days: 30, sell: false },
                                                    { label: '20d + Abono', days: 20, sell: true },
                                                    { label: '15 dias', days: 15, sell: false },
                                                    { label: '10 dias', days: 10, sell: false }
                                                ].map((opt, i) => (
                                                    <button
                                                        key={i}
                                                        type="button"
                                                        onClick={() => {
                                                            let newEnd = vacationForm.startDate || '';
                                                            if (vacationForm.startDate) {
                                                                const dt = new Date(vacationForm.startDate);
                                                                dt.setDate(dt.getDate() + opt.days - 1);
                                                                newEnd = dt.toISOString().split('T')[0];
                                                            }
                                                            setVacationForm(prev => ({
                                                                ...prev,
                                                                days: opt.days,
                                                                sellDays: opt.sell,
                                                                endDate: newEnd
                                                            }));
                                                        }}
                                                        className={`py-2 px-2 rounded-xl text-xs font-black uppercase transition-all text-center border ${
                                                            vacationForm.days === opt.days && vacationForm.sellDays === opt.sell
                                                                ? 'bg-cyan-600 text-white border-cyan-600 shadow-md shadow-cyan-600/20'
                                                                : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                                                        }`}
                                                    >
                                                        {opt.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-3 gap-3">
                                            <div>
                                                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest">Data Início</label>
                                                <input
                                                    type="date"
                                                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-3 font-bold text-xs text-slate-800 dark:text-white"
                                                    value={vacationForm.startDate || ''}
                                                    onChange={e => {
                                                        const start = e.target.value;
                                                        const days = vacationForm.days || 30;
                                                        let end = '';
                                                        if (start) {
                                                            const dt = new Date(start);
                                                            dt.setDate(dt.getDate() + days - 1);
                                                            end = dt.toISOString().split('T')[0];
                                                        }
                                                        setVacationForm(prev => ({ ...prev, startDate: start, endDate: end }));
                                                    }}
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest">Data Fim</label>
                                                <input
                                                    type="date"
                                                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-3 font-bold text-xs text-slate-800 dark:text-white"
                                                    value={vacationForm.endDate || ''}
                                                    onChange={e => setVacationForm(prev => ({ ...prev, endDate: e.target.value }))}
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest">Dias de Gozo</label>
                                                <input
                                                    type="number"
                                                    min="5"
                                                    max="30"
                                                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-3 font-bold text-xs text-slate-800 dark:text-white"
                                                    value={vacationForm.days || 30}
                                                    onChange={e => {
                                                        const days = Number(e.target.value);
                                                        let end = vacationForm.endDate || '';
                                                        if (vacationForm.startDate && days > 0) {
                                                            const dt = new Date(vacationForm.startDate);
                                                            dt.setDate(dt.getDate() + days - 1);
                                                            end = dt.toISOString().split('T')[0];
                                                        }
                                                        setVacationForm(prev => ({ ...prev, days, endDate: end }));
                                                    }}
                                                    required
                                                />
                                            </div>
                                        </div>

                                        {/* Toggle Abono Pecuniário (Venda de 10 dias) */}
                                        <label className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-2xl cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={!!vacationForm.sellDays}
                                                onChange={e => setVacationForm(prev => ({ ...prev, sellDays: e.target.checked }))}
                                                className="w-4 h-4 text-cyan-600 rounded focus:ring-cyan-500"
                                            />
                                            <div>
                                                <span className="text-xs font-black text-slate-800 dark:text-white block">Abono Pecuniário (Vender 10 dias de férias)</span>
                                                <span className="text-[10px] text-slate-400 font-medium">Art. 143 CLT: conversão de 1/3 do período de férias em remuneração em dinheiro isenta de INSS/IRRF.</span>
                                            </div>
                                        </label>

                                        {/* Live Preview do Recibo de Férias */}
                                        {(() => {
                                            const emp = employees.find(e => e.id === vacationForm.employeeId);
                                            if (!emp) return null;
                                            const receipt = calculateVacationReceipt(emp, vacationForm.days || 30, !!vacationForm.sellDays, 10);
                                            return (
                                                <div className="p-4 bg-cyan-50/50 dark:bg-cyan-950/20 border border-cyan-200 dark:border-cyan-800 rounded-2xl space-y-2 text-xs">
                                                    <div className="flex justify-between items-center border-b border-cyan-200/50 pb-2">
                                                        <span className="text-[10px] font-black uppercase text-cyan-800 dark:text-cyan-300">Estimativa do Recibo (CLT)</span>
                                                        <span className="text-sm font-black text-cyan-700 dark:text-cyan-300">{formatCurrency(receipt.netVacation)} Líquido</span>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] text-slate-600 dark:text-slate-300 pt-1">
                                                        <div>Salário Férias ({receipt.days}d): <strong>{formatCurrency(receipt.vacationSalary)}</strong></div>
                                                        <div>1/3 Constitucional: <strong>{formatCurrency(receipt.tercoConstitucional)}</strong></div>
                                                        {receipt.hasAbono && (
                                                            <>
                                                                <div className="text-emerald-700 dark:text-emerald-400">Abono (10d): <strong>{formatCurrency(receipt.abonoSalary)}</strong></div>
                                                                <div className="text-emerald-700 dark:text-emerald-400">1/3 Abono: <strong>{formatCurrency(receipt.abonoTerco)}</strong></div>
                                                            </>
                                                        )}
                                                        <div className="text-rose-600">INSS Previsto: <strong>-{formatCurrency(receipt.inss)}</strong></div>
                                                        <div className="text-rose-600">IRRF Previsto: <strong>-{formatCurrency(receipt.irrf)}</strong></div>
                                                    </div>
                                                </div>
                                            );
                                        })()}

                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest">Observações Adicionais</label>
                                            <textarea
                                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-3 font-bold text-xs text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-cyan-500"
                                                rows={2}
                                                placeholder="Ex: Escala alinhada com gestor imediato, cobertura de plantão"
                                                value={vacationForm.notes || ''}
                                                onChange={e => setVacationForm({ ...vacationForm, notes: e.target.value })}
                                            />
                                        </div>

                                        <button
                                            type="submit"
                                            className="w-full py-4 bg-cyan-600 hover:bg-cyan-500 text-white font-black rounded-2xl shadow-lg shadow-cyan-600/20 uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2"
                                        >
                                            <Check size={16} /> Confirmar e Solicitar Férias
                                        </button>
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

                                        <div className="text-left bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700 space-y-2">
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Base da Provisão no Contas a Pagar</label>
                                            <div className="grid grid-cols-1 gap-2 text-xs">
                                                <label className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${provisionMode === 'net' ? 'bg-cyan-50 dark:bg-cyan-950/30 border-cyan-300 dark:border-cyan-700 text-cyan-900 dark:text-cyan-200 font-bold' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'}`}>
                                                    <input
                                                        type="radio"
                                                        name="provisionMode"
                                                        checked={provisionMode === 'net'}
                                                        onChange={() => setProvisionMode('net')}
                                                        className="mt-0.5 text-cyan-600 focus:ring-cyan-500"
                                                    />
                                                    <div className="flex-1">
                                                        <span className="block font-black text-xs">Sem Encargos Federais (Líquido dos Colaboradores)</span>
                                                        <span className="text-[10px] text-slate-400 font-medium block mt-0.5">Lança apenas o líquido devido aos colaboradores: {formatCurrency(payrollSummary.totalNet)}</span>
                                                    </div>
                                                </label>
                                                <label className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${provisionMode === 'gross_with_taxes' ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200 font-bold' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'}`}>
                                                    <input
                                                        type="radio"
                                                        name="provisionMode"
                                                        checked={provisionMode === 'gross_with_taxes'}
                                                        onChange={() => setProvisionMode('gross_with_taxes')}
                                                        className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                                                    />
                                                    <div className="flex-1">
                                                        <span className="block font-black text-xs">Com Encargos Federais (Custo Total Empresa)</span>
                                                        <span className="text-[10px] text-slate-400 font-medium block mt-0.5">Lança o custo total da folha com encargos e provisões ({payrollTaxSettings.regime}): {formatCurrency(payrollSummary.totalCompanyCost)}</span>
                                                    </div>
                                                </label>
                                            </div>
                                        </div>

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

                        {/* Modal de Quitação de Férias no Banco */}
                        {isPayVacationModalOpen && selectedVacationToPay && (() => {
                            const emp = employees.find(e => e.id === selectedVacationToPay.employeeId);
                            const hasAbono = !!selectedVacationToPay.notes?.includes('Abono Pecuniário');
                            const receipt = emp ? calculateVacationReceipt(emp, selectedVacationToPay.days || 30, hasAbono) : null;
                            const amountToPay = receipt?.netVacation || 0;
                            const selectedAcc = accounts.find(a => a.id === vacationPaymentForm.accountId) || accounts[0];
                            const isBalanceLow = selectedAcc && selectedAcc.balance < amountToPay;

                            return (
                                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                                    <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-lg border dark:border-slate-700 overflow-hidden animate-in zoom-in-95 duration-200">
                                        <div className="p-6 border-b dark:border-slate-700 flex justify-between items-center bg-slate-50/70 dark:bg-slate-900/50">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2.5 bg-emerald-600 text-white rounded-2xl shadow-lg shadow-emerald-600/20">
                                                    <Wallet size={20} />
                                                </div>
                                                <div>
                                                    <h3 className="font-black text-xl text-slate-900 dark:text-white uppercase tracking-tight">Liquidar Recibo de Férias</h3>
                                                    <p className="text-xs text-slate-400 font-bold">Débito em conta bancária e quitação CLT</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => { setIsPayVacationModalOpen(false); setSelectedVacationToPay(null); }}
                                                className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg"
                                            >
                                                <X size={20} />
                                            </button>
                                        </div>

                                        <form onSubmit={handleConfirmPayVacation} className="p-6 space-y-4">
                                            <div className="p-4 bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl space-y-2">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-[10px] font-black uppercase text-emerald-800 dark:text-emerald-300">Valor Líquido do Recibo</span>
                                                    <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 rounded-full text-[9px] font-black uppercase">
                                                        Art. 145 CLT
                                                    </span>
                                                </div>
                                                <div className="text-2xl font-black text-emerald-600">
                                                    {formatCurrency(amountToPay)}
                                                </div>
                                                <div className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                                                    Colaborador: <strong>{selectedVacationToPay.employeeName}</strong> • {selectedVacationToPay.days || 30} dias ({selectedVacationToPay.startDate} a {selectedVacationToPay.endDate})
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 tracking-widest">
                                                    Conta Bancária de Débito
                                                </label>
                                                <select
                                                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-3 px-3 font-bold text-xs text-slate-800 dark:text-white outline-none focus:border-cyan-500 transition-colors"
                                                    value={vacationPaymentForm.accountId}
                                                    onChange={e => setVacationPaymentForm({ ...vacationPaymentForm, accountId: e.target.value })}
                                                    required
                                                >
                                                    <option value="">Selecione uma conta...</option>
                                                    {accounts.map(acc => (
                                                        <option key={acc.id} value={acc.id}>
                                                            {acc.name} — Saldo: {formatCurrency(acc.balance)} ({acc.bankName || acc.type})
                                                        </option>
                                                    ))}
                                                </select>
                                                {isBalanceLow && (
                                                    <p className="text-[11px] text-amber-600 dark:text-amber-400 font-bold mt-1.5 flex items-center gap-1">
                                                        <AlertCircle size={13} /> Atenção: O saldo atual desta conta é inferior ao valor do recibo de férias.
                                                    </p>
                                                )}
                                            </div>

                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 tracking-widest">
                                                        Meio de Pagamento
                                                    </label>
                                                    <select
                                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-3 font-bold text-xs text-slate-800 dark:text-white outline-none focus:border-cyan-500 transition-colors"
                                                        value={vacationPaymentForm.paymentMethod}
                                                        onChange={e => setVacationPaymentForm({ ...vacationPaymentForm, paymentMethod: e.target.value as any })}
                                                    >
                                                        <option value="PIX">PIX</option>
                                                        <option value="Transferência Bancária">Transferência Bancária (TED)</option>
                                                        <option value="Dinheiro">Dinheiro em Espécie</option>
                                                        <option value="Cheque">Cheque</option>
                                                    </select>
                                                </div>

                                                <div>
                                                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 tracking-widest">
                                                        Data do Pagamento
                                                    </label>
                                                    <input
                                                        type="date"
                                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-3 font-bold text-xs text-slate-800 dark:text-white outline-none focus:border-cyan-500 transition-colors"
                                                        value={vacationPaymentForm.date}
                                                        onChange={e => setVacationPaymentForm({ ...vacationPaymentForm, date: e.target.value })}
                                                        required
                                                    />
                                                </div>
                                            </div>

                                            <p className="text-[10px] text-slate-400 italic">
                                                * Art. 145 CLT: O pagamento da remuneração das férias será efetuado até 2 dias antes do início do respectivo período.
                                            </p>

                                            <div>
                                                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 tracking-widest">
                                                    Observação / Comprovante Bancário
                                                </label>
                                                <input
                                                    type="text"
                                                    placeholder="Ex: Chave PIX, nº autenticação TED, lote folha"
                                                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-3 font-bold text-xs text-slate-800 dark:text-white outline-none focus:border-cyan-500 transition-colors"
                                                    value={vacationPaymentForm.notes}
                                                    onChange={e => setVacationPaymentForm({ ...vacationPaymentForm, notes: e.target.value })}
                                                />
                                            </div>

                                            <div className="pt-2">
                                                <button
                                                    type="submit"
                                                    className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-2xl shadow-lg shadow-emerald-600/20 uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2"
                                                >
                                                    <Check size={16} /> Confirmar Quitação e Debitar Conta
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            );
                        })()}

                        {/* Modal de Estorno de Pagamento de Férias */}
                        {isRefundVacationModalOpen && selectedVacationToRefund && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                                <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-lg border dark:border-slate-700 overflow-hidden animate-in zoom-in-95 duration-200">
                                    <div className="p-6 border-b dark:border-slate-700 flex justify-between items-center bg-amber-50/70 dark:bg-amber-950/30">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2.5 bg-amber-600 text-white rounded-2xl shadow-lg shadow-amber-600/20">
                                                <RotateCcw size={20} />
                                            </div>
                                            <div>
                                                <h3 className="font-black text-lg text-slate-900 dark:text-white uppercase tracking-tight">Estornar Quitação de Férias</h3>
                                                <p className="text-xs text-amber-700 dark:text-amber-300 font-bold">Reversão de débito e recomposição de saldo bancário</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => { setIsRefundVacationModalOpen(false); setSelectedVacationToRefund(null); }}
                                            className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg"
                                        >
                                            <X size={20} />
                                        </button>
                                    </div>

                                    <form onSubmit={handleConfirmRefundVacation} className="p-6 space-y-4">
                                        <div className="p-4 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-2xl space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] font-black uppercase text-amber-800 dark:text-amber-300 tracking-wider">Ação Restrita</span>
                                                <span className="px-2.5 py-0.5 bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200 rounded-full text-[9px] font-black uppercase">
                                                    Admin / Gerente Financeiro
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                                                O estorno excluirá o lançamento financeiro de despesa vinculado, <strong>recompondo automaticamente o saldo da conta bancária de origem</strong> e retornando as férias de <strong>{selectedVacationToRefund.employeeName}</strong> para o status <strong>'Aprovado'</strong>.
                                            </p>
                                        </div>

                                        {(() => {
                                            const txId = `tx-vac-${selectedVacationToRefund.id}`;
                                            const linkedTx = transactions.find(t => t.id === txId);
                                            return linkedTx ? (
                                                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                                                    <span className="text-[10px] font-black uppercase text-slate-400 block mb-1">Transação Financeira Localizada:</span>
                                                    <p className="font-bold text-slate-800 dark:text-white">{linkedTx.description}</p>
                                                    <p className="text-[11px] text-slate-500 mt-0.5">
                                                        Conta de Origem: <strong>{linkedTx.account}</strong> • Valor: <strong>{formatCurrency(linkedTx.amount)}</strong> • Data: {linkedTx.date}
                                                    </p>
                                                </div>
                                            ) : (
                                                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-400 italic">
                                                    Nenhuma transação financeira vinculada encontrada (apenas o status será revertido para Aprovado).
                                                </div>
                                            );
                                        })()}

                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">
                                                Motivo / Justificativa do Estorno (Obrigatório)
                                            </label>
                                            <textarea
                                                rows={3}
                                                required
                                                placeholder="Informe o motivo formal do estorno (ex: cancelamento do período pelo colaborador, ajuste de datas)"
                                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-3 text-xs font-bold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                                                value={refundVacationReason}
                                                onChange={e => setRefundVacationReason(e.target.value)}
                                            />
                                        </div>

                                        <div className="pt-2">
                                            <button
                                                type="submit"
                                                className="w-full py-4 bg-amber-600 hover:bg-amber-500 text-white font-black rounded-2xl shadow-lg shadow-amber-600/20 uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2"
                                            >
                                                <RotateCcw size={16} /> Confirmar Estorno e Restaurar Saldo
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}

                        {/* Modal de Recibo Oficial de Férias */}
                        {isReceiptModalOpen && selectedVacationForReceipt && (() => {
                            const emp = employees.find(e => e.id === selectedVacationForReceipt.employeeId);
                            if (!emp) return null;
                            const hasAbono = !!selectedVacationForReceipt.notes?.includes('Abono Pecuniário');
                            const receipt = calculateVacationReceipt(emp, selectedVacationForReceipt.days || 30, hasAbono);
                            return (
                                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                                    <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-xl border dark:border-slate-700 overflow-hidden animate-in zoom-in-95 duration-200">
                                        <div className="p-6 border-b dark:border-slate-700 flex justify-between items-center bg-slate-50/70 dark:bg-slate-900/50">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2.5 bg-cyan-600 text-white rounded-2xl shadow-lg shadow-cyan-600/20">
                                                    <FileText size={20} />
                                                </div>
                                                <div>
                                                    <h3 className="font-black text-xl text-slate-900 dark:text-white uppercase tracking-tight">Recibo de Pagamento de Férias</h3>
                                                    <p className="text-xs text-slate-400 font-bold">Demonstrativo Legal CLT • Art. 142 e 145</p>
                                                </div>
                                            </div>
                                            <button onClick={() => setIsReceiptModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"><X size={20} /></button>
                                        </div>

                                        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
                                            <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs space-y-1.5">
                                                <div className="flex justify-between">
                                                    <span className="text-slate-400">Colaborador:</span>
                                                    <strong className="text-slate-800 dark:text-white">{emp.name} ({emp.role})</strong>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-slate-400">Período de Gozo:</span>
                                                    <strong className="text-slate-800 dark:text-white">{selectedVacationForReceipt.startDate} a {selectedVacationForReceipt.endDate} ({selectedVacationForReceipt.days} dias)</strong>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-slate-400">Salário Base:</span>
                                                    <strong className="text-slate-800 dark:text-white">{formatCurrency(emp.salary)}</strong>
                                                </div>
                                            </div>

                                            <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden text-xs">
                                                <table className="w-full">
                                                    <thead className="bg-slate-50 dark:bg-slate-900 text-[10px] font-black uppercase text-slate-400 border-b dark:border-slate-700">
                                                        <tr>
                                                            <th className="p-3 text-left">Rubrica</th>
                                                            <th className="p-3 text-center">Ref.</th>
                                                            <th className="p-3 text-right">Proventos</th>
                                                            <th className="p-3 text-right">Descontos</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y dark:divide-slate-700 font-medium">
                                                        <tr>
                                                            <td className="p-3">Salário de Férias</td>
                                                            <td className="p-3 text-center">{receipt.days}d</td>
                                                            <td className="p-3 text-right font-bold text-emerald-600">{formatCurrency(receipt.vacationSalary)}</td>
                                                            <td className="p-3 text-right">—</td>
                                                        </tr>
                                                        <tr>
                                                            <td className="p-3">1/3 Constitucional (Art. 7º, XVII CF)</td>
                                                            <td className="p-3 text-center">33.33%</td>
                                                            <td className="p-3 text-right font-bold text-emerald-600">{formatCurrency(receipt.tercoConstitucional)}</td>
                                                            <td className="p-3 text-right">—</td>
                                                        </tr>
                                                        {receipt.hasAbono && (
                                                            <>
                                                                <tr className="bg-emerald-50/50 dark:bg-emerald-950/20">
                                                                    <td className="p-3">Abono Pecuniário (Isento)</td>
                                                                    <td className="p-3 text-center">10d</td>
                                                                    <td className="p-3 text-right font-bold text-emerald-600">{formatCurrency(receipt.abonoSalary)}</td>
                                                                    <td className="p-3 text-right">—</td>
                                                                </tr>
                                                                <tr className="bg-emerald-50/50 dark:bg-emerald-950/20">
                                                                    <td className="p-3">1/3 Constitucional s/ Abono</td>
                                                                    <td className="p-3 text-center">33.33%</td>
                                                                    <td className="p-3 text-right font-bold text-emerald-600">{formatCurrency(receipt.abonoTerco)}</td>
                                                                    <td className="p-3 text-right">—</td>
                                                                </tr>
                                                            </>
                                                        )}
                                                        <tr>
                                                            <td className="p-3">INSS s/ Férias</td>
                                                            <td className="p-3 text-center">CLT</td>
                                                            <td className="p-3 text-right">—</td>
                                                            <td className="p-3 text-right font-bold text-rose-500">-{formatCurrency(receipt.inss)}</td>
                                                        </tr>
                                                        {receipt.irrf > 0 && (
                                                            <tr>
                                                                <td className="p-3">IRRF Retido na Fonte</td>
                                                                <td className="p-3 text-center">Tabela</td>
                                                                <td className="p-3 text-right">—</td>
                                                                <td className="p-3 text-right font-bold text-rose-500">-{formatCurrency(receipt.irrf)}</td>
                                                            </tr>
                                                        )}
                                                    </tbody>
                                                    <tfoot className="bg-slate-50 dark:bg-slate-900 border-t dark:border-slate-700 font-black">
                                                        <tr>
                                                            <td colSpan={2} className="p-3 text-right uppercase text-[10px] text-slate-400">Total Líquido a Receber:</td>
                                                            <td colSpan={2} className="p-3 text-right text-base text-emerald-600">{formatCurrency(receipt.netVacation)}</td>
                                                        </tr>
                                                    </tfoot>
                                                </table>
                                            </div>

                                            <div className="flex gap-3 pt-2">
                                                <button
                                                    onClick={() => handlePrintVacationReceipt(selectedVacationForReceipt)}
                                                    className="flex-1 py-3.5 bg-cyan-600 hover:bg-cyan-500 text-white font-black rounded-2xl shadow-lg uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2"
                                                >
                                                    <Printer size={16} /> Imprimir Recibo Oficial
                                                </button>
                                                <button
                                                    onClick={() => setIsReceiptModalOpen(false)}
                                                    className="px-6 py-3.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-2xl text-xs uppercase"
                                                >
                                                    Fechar
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })()}

                        {/* Modal de Abono e Justificativa de Falta no Ponto */}
                        {isJustifyModalOpen && selectedJustifyDay && currentEspelhoEmp && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                                <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-lg border dark:border-slate-700 overflow-hidden animate-in zoom-in-95 duration-200">
                                    <div className="p-6 border-b dark:border-slate-700 flex justify-between items-center bg-amber-50/70 dark:bg-amber-950/30">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2.5 bg-amber-500 text-white rounded-2xl shadow-lg shadow-amber-500/20">
                                                <ShieldCheck size={20} />
                                            </div>
                                            <div>
                                                <h3 className="font-black text-xl text-slate-900 dark:text-white uppercase tracking-tight">Abonar / Justificar Falta</h3>
                                                <p className="text-xs text-amber-700 dark:text-amber-300 font-bold">Art. 473 CLT • Falta Justificada Legalmente</p>
                                            </div>
                                        </div>
                                        <button onClick={() => setIsJustifyModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"><X size={20} /></button>
                                    </div>

                                    <form onSubmit={handleConfirmJustify} className="p-6 space-y-4">
                                        <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs space-y-1">
                                            <div className="flex justify-between">
                                                <span className="text-slate-400">Colaborador:</span>
                                                <strong className="text-slate-800 dark:text-white">{currentEspelhoEmp.name}</strong>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-slate-400">Data do Ponto:</span>
                                                <strong className="text-slate-800 dark:text-white">{selectedJustifyDay.dateStr} ({selectedJustifyDay.weekday})</strong>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-slate-400">Impacto Atual:</span>
                                                <span className="text-rose-600 font-bold">Falta de 8h (a debitar na Folha)</span>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 tracking-widest">
                                                Motivo Legal do Abono (Art. 473 CLT)
                                            </label>
                                            <select
                                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-3 px-3 font-bold text-xs text-slate-800 dark:text-white outline-none focus:border-amber-500 transition-colors"
                                                value={justifyForm.type}
                                                onChange={e => setJustifyForm({ ...justifyForm, type: e.target.value })}
                                                required
                                            >
                                                <option value="Atestado Médico (Art. 473 CLT)">Atestado Médico (Doença / Incapacidade)</option>
                                                <option value="Licença Nojo / Falecimento (Art. 473, I CLT)">Falecimento de Familiar / Luto (até 2 dias)</option>
                                                <option value="Licença Gala / Casamento (Art. 473, II CLT)">Casamento / Licença Gala (até 3 dias)</option>
                                                <option value="Licença Paternidade (Art. 473, III CLT)">Nascimento de Filho / Paternidade (até 5 dias)</option>
                                                <option value="Doação Voluntária de Sangue (Art. 473, IV CLT)">Doação de Sangue (1 dia a cada 12 meses)</option>
                                                <option value="Convocação Eleitoral / Alistamento (Art. 473, V CLT)">Alistamento Eleitoral / Justiça Eleitoral (até 2 dias)</option>
                                                <option value="Convocação Judicial / Júri">Convocação Judicial / Testemunha em Juízo</option>
                                                <option value="Folga Compensatória (Banco de Horas)">Folga Compensatória (Compensação Banco)</option>
                                                <option value="Outro Motivo Justificado pelo Gestor">Outro Motivo Justificado pelo Gestor</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 tracking-widest">
                                                CRM do Médico / Nº Documento (Se aplicável)
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="Ex: CRM-SP 123456, Dr. Alberto Silva"
                                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-3 font-bold text-xs text-slate-800 dark:text-white outline-none focus:border-amber-500 transition-colors"
                                                value={justifyForm.doctorCrm}
                                                onChange={e => setJustifyForm({ ...justifyForm, doctorCrm: e.target.value })}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 tracking-widest">
                                                Justificativa Detalhada / Observações
                                            </label>
                                            <textarea
                                                rows={3}
                                                placeholder="Descreva a justificativa para arquivamento no dossiê trabalhista..."
                                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 font-bold text-xs text-slate-800 dark:text-white outline-none focus:border-amber-500 transition-colors"
                                                value={justifyForm.reason}
                                                onChange={e => setJustifyForm({ ...justifyForm, reason: e.target.value })}
                                            />
                                        </div>

                                        <p className="text-[10px] text-slate-400 italic">
                                            * Ao abonar, o dia passa a constar como cumprido (8h) sem desconto salarial ou prejuízo ao banco de horas.
                                        </p>

                                        <div className="pt-2">
                                            <button
                                                type="submit"
                                                className="w-full py-4 bg-amber-500 hover:bg-amber-600 text-white font-black rounded-2xl shadow-lg shadow-amber-500/20 uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2"
                                            >
                                                <Check size={16} /> Confirmar Abono Legal da Falta
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}
                        {isManualTimeModalOpen && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                                <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-lg border dark:border-slate-700 animate-in zoom-in duration-200">
                                    <div className="p-6 border-b dark:border-slate-700 flex justify-between items-center">
                                        <div>
                                            <h3 className="font-black text-xl text-slate-900 dark:text-white uppercase tracking-tight">Marcação / Ajuste Manual de Ponto</h3>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Portaria MTE nº 671/2021</p>
                                        </div>
                                        <button onClick={() => setIsManualTimeModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
                                    </div>
                                    <form onSubmit={handleSaveManualTime} className="p-6 space-y-4">
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest">Colaborador</label>
                                            <select
                                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-3 px-3 font-bold text-sm"
                                                value={manualTimeForm.employeeId}
                                                onChange={e => setManualTimeForm({ ...manualTimeForm, employeeId: e.target.value })}
                                                required
                                            >
                                                <option value="">Selecione...</option>
                                                {employees.filter(e => e.status === 'Ativo').map(emp => (
                                                    <option key={emp.id} value={emp.id}>{emp.name} ({emp.role})</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest">Data do Ponto</label>
                                            <input
                                                type="date"
                                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-3 px-3 font-bold text-sm"
                                                value={manualTimeForm.date}
                                                onChange={e => setManualTimeForm({ ...manualTimeForm, date: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                            <div>
                                                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest">1ª Entrada</label>
                                                <input
                                                    type="time"
                                                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-2 font-bold text-sm text-center"
                                                    value={manualTimeForm.checkIn}
                                                    onChange={e => setManualTimeForm({ ...manualTimeForm, checkIn: e.target.value })}
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest">Início Intervalo</label>
                                                <input
                                                    type="time"
                                                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-2 font-bold text-sm text-center"
                                                    value={manualTimeForm.lunchStart}
                                                    onChange={e => setManualTimeForm({ ...manualTimeForm, lunchStart: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest">Fim Intervalo</label>
                                                <input
                                                    type="time"
                                                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-2 font-bold text-sm text-center"
                                                    value={manualTimeForm.lunchEnd}
                                                    onChange={e => setManualTimeForm({ ...manualTimeForm, lunchEnd: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest">2ª Saída</label>
                                                <input
                                                    type="time"
                                                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-2 font-bold text-sm text-center"
                                                    value={manualTimeForm.checkOut}
                                                    onChange={e => setManualTimeForm({ ...manualTimeForm, checkOut: e.target.value })}
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest">Motivo / Justificativa Legal (Obrigatório)</label>
                                            <input
                                                type="text"
                                                placeholder="Ex: Esquecimento de crachá, serviço externo, autorização prévia"
                                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-3 px-3 font-bold text-sm"
                                                value={manualTimeForm.reason}
                                                onChange={e => setManualTimeForm({ ...manualTimeForm, reason: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div className="pt-2">
                                            <button
                                                type="submit"
                                                className="w-full py-4 bg-cyan-600 hover:bg-cyan-500 text-white font-black rounded-2xl shadow-lg uppercase tracking-widest text-xs transition-all"
                                            >
                                                Gravar Ajuste no Ponto
                                            </button>
                                        </div>
                                    </form>
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
