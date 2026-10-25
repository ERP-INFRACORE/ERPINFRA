import { useApp } from './AppContext';

/**
 * Seletor de Estado Financeiro Especializado
 */
export const useFinancialState = () => {
  const {
    transactions,
    accounts,
    planOfAccounts,
    financials,
    addTransaction,
    updateTransaction,
    updateTransactionStatus,
    deleteTransaction,
    importTransactions,
    addAccount,
    deleteAccount,
    addPlanAccount,
    deletePlanAccount,
    updatePlanAccount
  } = useApp();

  return {
    transactions,
    accounts,
    planOfAccounts,
    financials,
    addTransaction,
    updateTransaction,
    updateTransactionStatus,
    deleteTransaction,
    importTransactions,
    addAccount,
    deleteAccount,
    addPlanAccount,
    deletePlanAccount,
    updatePlanAccount
  };
};

/**
 * Seletor de Estado de Frota Especializado
 */
export const useFleetState = () => {
  const {
    fleet,
    tires,
    addVehicle,
    updateVehicle,
    updateVehicleStatus,
    deleteVehicle,
    addMaintenanceRecord,
    deleteMaintenanceRecord,
    addFuelLog,
    deleteFuelLog,
    addTire,
    updateTire,
    deleteTire,
    addTireHistory,
    deleteTireHistory
  } = useApp();

  return {
    fleet,
    tires,
    addVehicle,
    updateVehicle,
    updateVehicleStatus,
    deleteVehicle,
    addMaintenanceRecord,
    deleteMaintenanceRecord,
    addFuelLog,
    deleteFuelLog,
    addTire,
    updateTire,
    deleteTire,
    addTireHistory,
    deleteTireHistory
  };
};

/**
 * Seletor de Estado de Estoque Especializado
 */
export const useInventoryState = () => {
  const {
    inventory,
    stockMovements,
    addStockItem,
    updateStock,
    updateStockItem,
    deleteStockItem
  } = useApp();

  return {
    inventory,
    stockMovements,
    addStockItem,
    updateStock,
    updateStockItem,
    deleteStockItem
  };
};

/**
 * Seletor de Estado de Recursos Humanos Especializado
 */
export const useHRState = () => {
  const {
    employees,
    payroll,
    timeLogs,
    vacations,
    salaryAdvances,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    addPayroll,
    payPayroll,
    addTimeLog,
    addVacation,
    updateVacationStatus,
    deleteVacation,
    addSalaryAdvance,
    updateAdvanceStatus,
    paySalaryAdvance,
    deleteAdvance
  } = useApp();

  return {
    employees,
    payroll,
    timeLogs,
    vacations,
    salaryAdvances,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    addPayroll,
    payPayroll,
    addTimeLog,
    addVacation,
    updateVacationStatus,
    deleteVacation,
    addSalaryAdvance,
    updateAdvanceStatus,
    paySalaryAdvance,
    deleteAdvance
  };
};

/**
 * Seletor de Estado Comercial e Vendas Especializado
 */
export const useSalesState = () => {
  const {
    clients,
    sales,
    budgets,
    addClient,
    updateClient,
    deleteClient,
    addSale,
    addBudget,
    updateBudget,
    updateBudgetStatus
  } = useApp();

  return {
    clients,
    sales,
    budgets,
    addClient,
    updateClient,
    deleteClient,
    addSale,
    addBudget,
    updateBudget,
    updateBudgetStatus
  };
};
