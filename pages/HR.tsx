import React, { useState, useMemo } from 'react';
import {
    Plus, X, Users, UserPlus, Search, Download, Edit2, Trash2, Wallet, Clock, Calendar,
    CheckCircle, XCircle, DollarSign, ArrowUpRight, Fingerprint, Play, StopCircle, Timer,
    Plane, TrendingUp, AlertCircle, Filter, ChevronDown, FileText, Printer, Check
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

    const [selectedAccount, setSelectedAccount] = useState<string>('');
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

    // Form States
    const [empForm, setEmpForm] = useState<Partial<Employee>>({
        status: 'Ativo',
        salary: 0,
        vacationDaysAvailable: 30,
        admissionDate: new Date().toISOString().split('T')[0]
    });

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

    // Helper para converter string de horário "HH:MM" para minutos
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

    // Helper para cálculo detalhado da folha de pagamento de um colaborador com consistência telemétrica de ponto
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
        }

        // 1. Horas Extras e Atrasos a partir dos registros de ponto (timeLogs)
        let extraMinutes = 0;
        let delayMinutes = 0;
        let daysWorked = 0;

        const employeeLogs = timeLogs.filter(log => {
            if (log.employeeId !== emp.id) return false;
            const logDate = log.date || '';
            let logM = '';
            let logY = '';
            if (logDate.includes('/')) {
                const parts = logDate.split('/');
                logM = parts[1]?.padStart(2, '0');
                logY = parts[2];
            } else if (logDate.includes('-')) {
                const parts = logDate.split('-');
                logY = parts[0];
                logM = parts[1]?.padStart(2, '0');
            }
            return logM === targetMonth && logY === targetYear;
        });

        employeeLogs.forEach(log => {
            if (log.checkIn) {
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
                    const standardDay = 480; // 8h diárias

                    if (totalWorked > standardDay) {
                        extraMinutes += (totalWorked - standardDay);
                    } else if (totalWorked < standardDay) {
                        delayMinutes += (standardDay - totalWorked);
                    }
                } else if (log.status === 'Extra') {
                    extraMinutes += 120; // 2 horas extras avulsas
                } else if (log.status === 'Atraso') {
                    delayMinutes += 60;
                }
            }
        });

        const overtimeHours = Number((extraMinutes / 60).toFixed(2));
        const delayHours = Number((delayMinutes / 60).toFixed(2));

        // Salário hora (divisor CLT 220 horas para jornada de 44h semanais)
        const hourlyRate = emp.salary > 0 ? emp.salary / 220 : 0;
        const overtimeEarnings = Number((overtimeHours * hourlyRate * 1.5).toFixed(2)); // Adicional 50%
        const dsrEarnings = Number((overtimeEarnings * (1 / 6)).toFixed(2)); // DSR s/ Horas Extras (Súmula 172 TST)
        const totalOvertime = Number((overtimeEarnings + dsrEarnings).toFixed(2));
        const delayDiscounts = Number((delayHours * hourlyRate).toFixed(2));

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

        // 5. Tributos (INSS e IRRF)
        const baseINSS = Number((emp.salary + totalOvertime).toFixed(2));
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
        const totalDiscounts = Number((inss + irrf + totalAdvances + delayDiscounts + transportDiscount).toFixed(2));
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
                if (v.employeeId !== currentEspelhoEmp.id || v.status !== 'Aprovado') return false;
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
            } else {
                expectedMins = 480; // 8h
                totalExpectedMins += expectedMins;
                occurrence = 'Dia Útil Normal';
            }

            if (log) {
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

            const deltaMin = workedMins - expectedMins;
            if (deltaMin > 0) {
                totalOvertimeMins += deltaMin;
                if (!occurrence.includes('DSR') && !occurrence.includes('Férias')) {
                    occurrence = `Hora Extra (+${formatMinutesToHours(deltaMin)})`;
                }
            } else if (deltaMin < 0) {
                if (!isWeekend && !onVacation) {
                    totalDelayMins += Math.abs(deltaMin);
                    if (workedMins === 0) {
                        occurrence = 'Falta / Sem Registro';
                    } else {
                        occurrence = `Atraso / Saída Antecipada (-${formatMinutesToHours(Math.abs(deltaMin))})`;
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
    }, [currentEspelhoEmp, selectedEspelhoMonth, timeLogs, vacations]);

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
        const transportVal = calc?.transportDiscount || 0;

        const totalEarnings = baseSalary + overtimeVal + benefitsVal;
        const totalDiscounts = record.discounts;
        const netSalary = record.totalNet;

        const html = `
            <div style="font-family: 'Segoe UI', Arial, sans-serif; padding: 30px; border: 2px solid #334155; max-width: 820px; margin: 0 auto; color: #1e293b; background: #fff;">
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
                        ${delaysVal > 0 ? `
                        <tr style="border-bottom: 1px solid #e2e8f0;">
                            <td style="padding: 8px; text-align: center; font-mono;">915</td>
                            <td style="padding: 8px;">Desconto Atrasos / Faltas Não Justificadas</td>
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

                <div style="font-size: 10px; line-height: 1.5; color: #64748b; border: 1px dashed #cbd5e1; padding: 10px; border-radius: 6px; margin-bottom: 40px;">
                    Declaro ter recebido a importância líquida discriminada neste recibo, referente aos serviços prestados na competência indicada, dando plena e irrevogável quitação.
                </div>

                <div style="display: flex; justify-content: space-between; gap: 60px; margin-top: 30px;">
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
            printWindow.document.write('<html><head><title>Holerite - ' + record.employeeName + '</title></head><body>');
            printWindow.document.write(html);
            printWindow.document.write('</body></html>');
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
            printWin.document.write('<html><head><title>Espelho de Ponto - ' + emp.name + '</title></head><body>');
            printWin.document.write(html);
            printWin.document.write('</body></html>');
            printWin.document.close();
            printWin.print();
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
                                                                <td className="px-4 py-4 text-center">
                                                                    <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase ${p.status === 'Pago' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                                                        {p.status}
                                                                    </span>
                                                                </td>
                                                                <td className="px-4 py-4 text-right">
                                                                    <div className="flex items-center justify-end gap-1.5">
                                                                        <button
                                                                            onClick={() => handlePrintReceipt(p)}
                                                                            className="px-2.5 py-1.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-200 font-bold text-[10px] rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1 uppercase"
                                                                            title="Visualizar ou imprimir comprovante"
                                                                        >
                                                                            <FileText size={12} /> {p.status === 'Pago' ? 'Holerite' : 'Prévia'}
                                                                        </button>
                                                                        {p.status === 'Pendente' && (
                                                                            <button
                                                                                onClick={() => handleDirectPayPayroll(p)}
                                                                                className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] rounded-lg shadow-sm transition-all flex items-center gap-1 uppercase"
                                                                                title="Confirmar pagamento e liquidar despesa no financeiro"
                                                                            >
                                                                                <Check size={12} /> Pagar
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                </td>
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
                                                <button
                                                    onClick={() => handlePrintEspelhoPonto(currentEspelhoEmp, selectedEspelhoMonth, espelhoData.daysData, espelhoData.totals)}
                                                    className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white font-black text-xs rounded-xl uppercase flex items-center gap-1.5 shadow-sm transition-all"
                                                >
                                                    <Printer size={15} /> Imprimir Espelho Oficial
                                                </button>
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
                                                                        d.onVacation
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

                        {/* Manual Time Adjustment Modal (Portaria MTE 671) */}
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
