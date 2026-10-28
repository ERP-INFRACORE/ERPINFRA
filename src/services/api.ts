import { supabase, isSupabaseConfigured, isOnline, onNetworkStatusChange } from '../lib/supabase';
import {
    Client, Supplier, Employee, InventoryItem, Transaction, Sale, Budget,
    PurchaseOrder, FleetVehicle, VehicleMaintenance, Tire, PayrollRecord,
    TimeLog, Vacation, SalaryAdvance, ProductionFormula, ProductionUnit,
    ProductionOrder, User, AppRole, AppSettings, AuditLog
} from '../../types';

// ============================================
// VALIDAÇÃO E GERAÇÃO DE UUIDs
// ============================================
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const isValidUUID = (val: any): boolean =>
    typeof val === 'string' && UUID_REGEX.test(val);

export const generateUUID = (): string => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
};

export const toDeterministicUUID = (input: any): string => {
    if (!input) return generateUUID();
    const str = String(input).trim();
    if (isValidUUID(str)) return str;

    // Fast deterministic hashing into a valid RFC4122 v4 UUID format
    let h1 = 0xdeadbeef, h2 = 0x41c6ce57, h3 = 0x811c9dc5, h4 = 0x9e3779b9;
    for (let i = 0; i < str.length; i++) {
        const ch = str.charCodeAt(i);
        h1 = Math.imul(h1 ^ ch, 2654435761);
        h2 = Math.imul(h2 ^ ch, 1597334677);
        h3 = Math.imul(h3 ^ ch, 3812015801);
        h4 = Math.imul(h4 ^ ch, 2718281829);
    }
    const toHex8 = (n: number) => (n >>> 0).toString(16).padStart(8, '0');
    const p1 = toHex8(h1);
    const p2 = toHex8(h2).slice(0, 4);
    const p3 = '4' + toHex8(h2).slice(5, 8); // UUID version 4
    const p4 = '8' + toHex8(h3).slice(1, 4); // UUID variant
    const p5 = toHex8(h4) + toHex8(h3).slice(4, 8);
    return `${p1}-${p2}-${p3}-${p4}-${p5}`.toLowerCase();
};

// ============================================
// CONVERSORES DE DATAS (ISO <-> pt-BR)
// ============================================
export const toIsoDate = (dateStr?: string): string | null => {
    if (!dateStr) return null;
    if (dateStr.includes('-')) {
        const parts = dateStr.split('T')[0].split('-');
        if (parts.length === 3 && parts[0].length === 4) return parts.join('-');
    }
    if (dateStr.includes('/')) {
        const parts = dateStr.split('/');
        if (parts.length === 3) {
            const day = parts[0].padStart(2, '0');
            const month = parts[1].padStart(2, '0');
            const year = parts[2];
            return `${year}-${month}-${day}`;
        }
    }
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? null : d.toISOString().split('T')[0];
};

export const toLocaleDate = (dateStr?: string): string => {
    if (!dateStr) return new Date().toLocaleDateString('pt-BR');
    if (dateStr.includes('/')) return dateStr;
    if (dateStr.includes('-')) {
        const parts = dateStr.split('T')[0].split('-');
        if (parts.length === 3 && parts[0].length === 4) {
            return `${parts[2].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[0]}`;
        }
    }
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString('pt-BR');
};
// ============================================
// CONVERSÃO BIDIRECIONAL CAMELCASE <-> SNAKE_CASE
// ============================================
export const camelToSnakeKey = (key: string): string => {
    return key.replace(/([A-Z])/g, '_$1').toLowerCase();
};

export const snakeToCamelKey = (key: string): string => {
    return key.replace(/_([a-z0-9])/g, (_, letter) => letter.toUpperCase());
};

export const toCamelCaseRecord = <T = any>(row: any): T => {
    if (!row || typeof row !== 'object' || Array.isArray(row)) return row;
    const res: Record<string, any> = {};
    for (const [key, val] of Object.entries(row)) {
        const camelKey = snakeToCamelKey(key);
        res[camelKey] = val;
        if (camelKey !== key) {
            res[key] = val;
        }
    }
    return res as T;
};

export const buildPlanOfAccountsTree = (rows: any[]): any[] => {
    if (!Array.isArray(rows) || rows.length === 0) return [];
    const nodeMap = new Map<string, any>();
    rows.forEach(r => {
        const id = String(r.id);
        nodeMap.set(id, {
            id,
            code: r.code || '',
            name: r.name || '',
            type: r.type || 'Despesa',
            parentId: r.parentId || r.parent_id || null,
            children: []
        });
    });
    const roots: any[] = [];
    rows.forEach(r => {
        const id = String(r.id);
        const node = nodeMap.get(id);
        if (!node) return;
        const parentId = r.parentId || r.parent_id ? String(r.parentId || r.parent_id) : null;
        if (parentId && nodeMap.has(parentId)) {
            nodeMap.get(parentId).children.push(node);
        } else {
            roots.push(node);
        }
    });
    return roots;
};

export const flattenPlanOfAccountsTree = (nodes: any[], parentId: string | null = null): any[] => {
    let list: any[] = [];
    if (!Array.isArray(nodes)) return list;
    nodes.forEach(n => {
        const id = n.id ? (isValidUUID(n.id) ? n.id : toDeterministicUUID(n.id)) : generateUUID();
        list.push({
            id,
            code: n.code,
            name: n.name,
            type: n.type || (parentId ? undefined : 'Despesa'),
            parent_id: parentId && isValidUUID(parentId) ? parentId : (parentId ? toDeterministicUUID(parentId) : null)
        });
        if (n.children && n.children.length > 0) {
            list = list.concat(flattenPlanOfAccountsTree(n.children, id));
        }
    });
    return list;
};


// ============================================
// SANITIZAÇÃO DE PAYLOAD E CONTRATOS DE DADOS
// ============================================
export const sanitizeDbPayload = (table: string, item: any, isCreate: boolean) => {
    if (!item || typeof item !== 'object') return item;
    const cleaned: Record<string, any> = { ...item };

    if (isCreate) {
        if (!isValidUUID(cleaned.id)) {
            cleaned.id = cleaned.id ? toDeterministicUUID(cleaned.id) : generateUUID();
        }
    } else {
        delete cleaned.id;
    }

    // 1. Mapeamento canônico para Transações Financeiras
    if (table === 'transactions') {
        const mapped: Record<string, any> = {
            date: toIsoDate(cleaned.date) || new Date().toISOString().split('T')[0],
            due_date: toIsoDate(cleaned.dueDate || cleaned.due_date || cleaned.date),
            competence_date: toIsoDate(cleaned.competenceDate || cleaned.competence_date || cleaned.date),
            description: cleaned.description || 'Lançamento',
            category: cleaned.category || 'Vendas',
            cost_center: cleaned.costCenter || cleaned.cost_center || null,
            payment_method: cleaned.paymentMethod || cleaned.payment_method || null,
            account: cleaned.account || 'Caixa Geral',
            account_id: cleaned.accountId && isValidUUID(cleaned.accountId) ? cleaned.accountId : (cleaned.account_id && isValidUUID(cleaned.account_id) ? cleaned.account_id : null),
            amount: Number(cleaned.amount || 0),
            status: cleaned.status || 'Pendente',
            type: cleaned.type || 'Receita',
            document_number: cleaned.documentNumber || cleaned.document_number || null,
            partner_id: cleaned.partnerId && isValidUUID(cleaned.partnerId) ? cleaned.partnerId : (cleaned.partner_id && isValidUUID(cleaned.partner_id) ? cleaned.partner_id : null),
            partner_name: cleaned.partnerName || cleaned.partner_name || null,
            origin_module: cleaned.originModule || cleaned.origin_module || null,
            origin_id: cleaned.originId && isValidUUID(cleaned.originId) ? cleaned.originId : (cleaned.origin_id && isValidUUID(cleaned.origin_id) ? cleaned.origin_id : null),
            ledger_code: cleaned.ledgerCode || cleaned.ledger_code || null,
            ledger_name: cleaned.ledgerName || cleaned.ledger_name || null,
            notes: cleaned.notes || null,
        };
        if (isCreate) mapped.id = cleaned.id;
        return mapped;
    }

    // 2. Mapeamento canônico para Vendas & PDV
    if (table === 'sales') {
        const mapped: Record<string, any> = {
            date: toIsoDate(cleaned.date) || new Date().toISOString().split('T')[0],
            due_date: toIsoDate(cleaned.dueDate || cleaned.due_date || cleaned.date),
            description: cleaned.description || 'Venda de Produtos/Serviços',
            category: cleaned.category || 'Vendas',
            account_id: cleaned.accountId && isValidUUID(cleaned.accountId) ? cleaned.accountId : (cleaned.account_id && isValidUUID(cleaned.account_id) ? cleaned.account_id : null),
            account: cleaned.account || 'Caixa Geral',
            amount: Number(cleaned.amount || 0),
            status: cleaned.status || 'Pendente',
            type: cleaned.type || 'Receita',
            document_number: cleaned.documentNumber || cleaned.document_number || null,
            client_id: cleaned.clientId && isValidUUID(cleaned.clientId) ? cleaned.clientId : (cleaned.client_id && isValidUUID(cleaned.client_id) ? cleaned.client_id : null),
            client_name: cleaned.clientName || cleaned.client_name || 'Cliente Balcão',
            items: Array.isArray(cleaned.items) ? cleaned.items : [],
            payment_method: cleaned.paymentMethod || cleaned.payment_method || 'credit',
            installments: Number(cleaned.installments || 1),
            installment_due_dates: cleaned.installmentDueDates || cleaned.installment_due_dates || null,
            weight_ticket: cleaned.weightTicket || cleaned.weight_ticket || null,
            measured_weight: cleaned.measuredWeight !== undefined ? cleaned.measuredWeight : (cleaned.measured_weight !== undefined ? cleaned.measured_weight : null),
            dispatch_status: cleaned.dispatchStatus || cleaned.dispatch_status || null,
            vehicle_id: cleaned.vehicleId && isValidUUID(cleaned.vehicleId) ? cleaned.vehicleId : (cleaned.vehicle_id && isValidUUID(cleaned.vehicle_id) ? cleaned.vehicle_id : null),
            driver_name: cleaned.driverName || cleaned.driver_name || null,
            tare_weight: cleaned.tareWeight !== undefined ? cleaned.tareWeight : (cleaned.tare_weight !== undefined ? cleaned.tare_weight : null),
            gross_weight: cleaned.grossWeight !== undefined ? cleaned.grossWeight : (cleaned.gross_weight !== undefined ? cleaned.gross_weight : null),
            net_weight: cleaned.netWeight !== undefined ? cleaned.netWeight : (cleaned.net_weight !== undefined ? cleaned.net_weight : null),
            weight_notes: cleaned.weightNotes || cleaned.weight_notes || null,
            ledger_code: cleaned.ledgerCode || cleaned.ledger_code || null,
            ledger_name: cleaned.ledgerName || cleaned.ledger_name || null,
        };
        if (isCreate) mapped.id = cleaned.id;
        return mapped;
    }

    // 3. Mapeamento canônico para Orçamentos
    if (table === 'budgets') {
        const mapped: Record<string, any> = {
            client_id: cleaned.clientId && isValidUUID(cleaned.clientId) ? cleaned.clientId : (cleaned.client_id && isValidUUID(cleaned.client_id) ? cleaned.client_id : null),
            client_name: cleaned.clientName || cleaned.client_name || 'Cliente Avulso',
            date: toIsoDate(cleaned.date) || new Date().toISOString().split('T')[0],
            subtotal: Number(cleaned.subtotal || 0),
            discount: Number(cleaned.discount || 0),
            total: Number(cleaned.total || 0),
            status: cleaned.status || 'Aberto',
            expiry_date: toIsoDate(cleaned.expiryDate || cleaned.expiry_date) || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
            items: Array.isArray(cleaned.items) ? cleaned.items : [],
            tare_weight: cleaned.tareWeight !== undefined ? cleaned.tareWeight : (cleaned.tare_weight !== undefined ? cleaned.tare_weight : null),
            gross_weight: cleaned.grossWeight !== undefined ? cleaned.grossWeight : (cleaned.gross_weight !== undefined ? cleaned.gross_weight : null),
            net_weight: cleaned.netWeight !== undefined ? cleaned.netWeight : (cleaned.net_weight !== undefined ? cleaned.net_weight : null),
            weight_notes: cleaned.weightNotes || cleaned.weight_notes || null,
            payment_method: cleaned.paymentMethod || cleaned.payment_method || null,
        };
        if (isCreate) mapped.id = cleaned.id;
        return mapped;
    }

    // 4. Mapeamento canônico para Funcionários (RH)
    if (table === 'employees') {
        const mapped: Record<string, any> = {
            name: cleaned.name || '',
            role: cleaned.role || '',
            department: cleaned.department || '',
            status: cleaned.status || 'Ativo',
            admission_date: toIsoDate(cleaned.admissionDate || cleaned.admission_date) || new Date().toISOString().split('T')[0],
            salary: Number(cleaned.salary || 0),
            email: cleaned.email || null,
            phone: cleaned.phone || null,
            address: cleaned.address || null,
            cpf: cleaned.cpf || null,
            photo: cleaned.photo || null,
            vacation_days_available: Number(cleaned.vacationDaysAvailable || cleaned.vacation_days_available || 30),
            cnh: cleaned.cnh || null,
            cnh_category: cleaned.cnhCategory || cleaned.cnh_category || null,
            cnh_expiry: cleaned.cnhExpiry || cleaned.cnh_expiry || null,
            cost_center: cleaned.costCenter || cleaned.cost_center || null,
        };
        if (isCreate) mapped.id = cleaned.id;
        return mapped;
    }

    // 5. Mapeamento canônico para Frota
    if (table === 'fleet') {
        const mapped: Record<string, any> = {
            name: cleaned.name || '',
            plate: cleaned.plate || '',
            model: cleaned.model || null,
            brand: cleaned.brand || null,
            year: cleaned.year ? Number(cleaned.year) : null,
            type: cleaned.type || 'Caminhão',
            status: cleaned.status || 'Operacional',
            fuel_type: cleaned.fuelType || cleaned.fuel_type || null,
            fuel_level: cleaned.fuelLevel !== undefined ? cleaned.fuelLevel : (cleaned.fuel_level !== undefined ? cleaned.fuel_level : null),
            km: Number(cleaned.km || 0),
            next_maintenance_km: cleaned.nextMaintenanceKm !== undefined ? Number(cleaned.nextMaintenanceKm) : (cleaned.next_maintenance_km !== undefined ? Number(cleaned.next_maintenance_km) : null),
            insurance_expiry: cleaned.insuranceExpiry || cleaned.insurance_expiry || null,
            driver_id: cleaned.driverId && isValidUUID(cleaned.driverId) ? cleaned.driverId : (cleaned.driver_id && isValidUUID(cleaned.driver_id) ? cleaned.driver_id : null),
            chassis: cleaned.chassis || null,
            renavam: cleaned.renavam || null,
            color: cleaned.color || null,
            color_name: cleaned.colorName || cleaned.color_name || null,
            last_maintenance: cleaned.lastMaintenance || cleaned.last_maintenance || null,
            cost_center: cleaned.costCenter || cleaned.cost_center || null,
            department: cleaned.department || null,
            telemetry_data: cleaned.telemetryData || cleaned.telemetry_data || {},
        };
        if (isCreate) mapped.id = cleaned.id;
        return mapped;
    }

    // 6. Mapeamento canônico para Ordens de Produção
    if (table === 'production_orders') {
        const mapped: Record<string, any> = {
            order_number: cleaned.orderNumber || cleaned.order_number || '',
            product_name: cleaned.productName || cleaned.product_name || '',
            product_id: cleaned.productId && isValidUUID(cleaned.productId) ? cleaned.productId : (cleaned.product_id && isValidUUID(cleaned.product_id) ? cleaned.product_id : null),
            formula_id: cleaned.formulaId && isValidUUID(cleaned.formulaId) ? cleaned.formulaId : (cleaned.formula_id && isValidUUID(cleaned.formula_id) ? cleaned.formula_id : null),
            quantity: Number(cleaned.quantity || 0),
            status: cleaned.status || 'Planejado',
            start_date: toIsoDate(cleaned.startDate || cleaned.start_date) || new Date().toISOString().split('T')[0],
            due_date: toIsoDate(cleaned.dueDate || cleaned.due_date) || new Date().toISOString().split('T')[0],
            priority: cleaned.priority || 'Média',
            progress: Number(cleaned.progress || 0),
            unit_id: cleaned.unitId && isValidUUID(cleaned.unitId) ? cleaned.unitId : (cleaned.unit_id && isValidUUID(cleaned.unit_id) ? cleaned.unit_id : null),
            batch: cleaned.batch || null,
            operator: cleaned.operator || null,
            quality_tests: Array.isArray(cleaned.qualityTests || cleaned.quality_tests) ? (cleaned.qualityTests || cleaned.quality_tests) : [],
            raw_materials_deducted: Boolean(cleaned.rawMaterialsDeducted ?? cleaned.raw_materials_deducted),
            client_id: cleaned.clientId && isValidUUID(cleaned.clientId) ? cleaned.clientId : (cleaned.client_id && isValidUUID(cleaned.client_id) ? cleaned.client_id : null),
            sale_id: cleaned.saleId && isValidUUID(cleaned.saleId) ? cleaned.saleId : (cleaned.sale_id && isValidUUID(cleaned.sale_id) ? cleaned.sale_id : null),
            vehicle_id: cleaned.vehicleId && isValidUUID(cleaned.vehicleId) ? cleaned.vehicleId : (cleaned.vehicle_id && isValidUUID(cleaned.vehicle_id) ? cleaned.vehicle_id : null),
        };
        if (isCreate) mapped.id = cleaned.id;
        return mapped;
    }

    // 7. Mapeamento canônico para Plano de Contas
    if (table === 'plan_of_accounts') {
        const mapped: Record<string, any> = {
            code: cleaned.code || '',
            name: cleaned.name || '',
            type: cleaned.type || 'Despesa',
            parent_id: cleaned.parentId && isValidUUID(cleaned.parentId) ? cleaned.parentId : (cleaned.parent_id && isValidUUID(cleaned.parent_id) ? cleaned.parent_id : null),
        };
        if (isCreate) mapped.id = cleaned.id;
        return mapped;
    }

    // Mapeamento genérico e resiliente para demais tabelas
    const genericMapped: Record<string, any> = {};
    for (const [key, val] of Object.entries(cleaned)) {
        if (val === undefined) continue;

        // Limpeza de relações runtime locais
        if (key === 'maintenanceHistory' || key === 'fuelLogs' || key === 'children') continue;
        if (key === 'documentId' && table === 'stock_movements') {
            genericMapped.document_id = val;
            continue;
        }

        const snakeKey = camelToSnakeKey(key);

        if (key.endsWith('Id') || snakeKey.endsWith('_id')) {
            if (val === '' || val === null || val === undefined) {
                genericMapped[snakeKey] = null;
            } else if (isValidUUID(val)) {
                genericMapped[snakeKey] = val;
            } else {
                genericMapped[snakeKey] = toDeterministicUUID(val);
            }
            continue;
        }

        genericMapped[snakeKey] = val;
    }

    if (isCreate) genericMapped.id = cleaned.id;
    return genericMapped;
};

// ============================================
// ESTRUTURA DE SYNC QUEUE E CACHE LOCAL (Offline-First)
// ============================================
export interface SyncQueueItem {
    id: string;
    table: string;
    operation: 'insert' | 'update' | 'delete';
    targetId: string;
    payload?: any;
    timestamp: number;
    retryCount: number;
}

const SYNC_QUEUE_KEY = 'infracore_sync_queue';
const CACHE_PREFIX = 'infracore_cache_table_';

type SyncStatusListener = (status: { isSyncing: boolean; pendingCount: number }) => void;
const syncListeners: Set<SyncStatusListener> = new Set();
let isSyncing = false;

export const subscribeToSyncStatus = (listener: SyncStatusListener): (() => void) => {
    syncListeners.add(listener);
    listener({ isSyncing, pendingCount: getSyncQueue().length });
    return () => {
        syncListeners.delete(listener);
    };
};

const notifySyncStatus = () => {
    const pendingCount = getSyncQueue().length;
    syncListeners.forEach(listener => {
        try {
            listener({ isSyncing, pendingCount });
        } catch (e) {
            console.error('Error in sync status listener:', e);
        }
    });
};

export const getSyncQueue = (): SyncQueueItem[] => {
    if (typeof localStorage === 'undefined') return [];
    try {
        const raw = localStorage.getItem(SYNC_QUEUE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
};

const saveSyncQueue = (queue: SyncQueueItem[]) => {
    if (typeof localStorage === 'undefined') return;
    try {
        localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
        notifySyncStatus();
    } catch (e) {
        console.warn('Failed to persist sync queue:', e);
    }
};

const enqueueMutation = (
    table: string,
    operation: 'insert' | 'update' | 'delete',
    targetId: string,
    payload?: any
) => {
    const queue = getSyncQueue();
    // Se já houver mutação pendente para o mesmo targetId, reconcilia para evitar overhead
    const existingIndex = queue.findIndex(item => item.table === table && item.targetId === targetId);

    if (existingIndex >= 0) {
        const existing = queue[existingIndex];
        if (existing.operation === 'insert' && operation === 'update') {
            // Incorpora updates no payload de criação original
            queue[existingIndex] = {
                ...existing,
                payload: { ...existing.payload, ...payload },
                timestamp: Date.now()
            };
            saveSyncQueue(queue);
            return;
        } else if (existing.operation === 'insert' && operation === 'delete') {
            // Se foi criado offline e deletado antes de sincronizar, basta remover da fila
            queue.splice(existingIndex, 1);
            saveSyncQueue(queue);
            return;
        } else if (operation === 'delete') {
            // Sobrescreve para delete direto
            queue[existingIndex] = {
                id: generateUUID(),
                table,
                operation: 'delete',
                targetId,
                timestamp: Date.now(),
                retryCount: 0
            };
            saveSyncQueue(queue);
            return;
        }
    }

    queue.push({
        id: generateUUID(),
        table,
        operation,
        targetId,
        payload,
        timestamp: Date.now(),
        retryCount: 0
    });
    saveSyncQueue(queue);
};

// Gerenciamento de Cache Local por Tabela
const getLocalTableCache = <T>(table: string): T[] => {
    if (typeof localStorage === 'undefined') return [];
    try {
        const raw = localStorage.getItem(`${CACHE_PREFIX}${table}`);
        if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) return parsed;
            if (parsed && typeof parsed === 'object') return [parsed] as unknown as T[];
        }

        // Fallback para o snapshot consolidado infracore_erp_data
        const appRaw = localStorage.getItem('infracore_erp_data');
        if (appRaw) {
            const parsed = JSON.parse(appRaw);
            if (Array.isArray(parsed[table])) return parsed[table];
            if (table === 'settings' && parsed.settings && typeof parsed.settings === 'object') {
                return [parsed.settings] as unknown as T[];
            }
        }
    } catch (e) {
        console.warn(`Failed to read cache for table ${table}:`, e);
    }
    return [];
};

const saveLocalTableCache = (table: string, data: any) => {
    if (typeof localStorage === 'undefined' || data === undefined || data === null) return;
    try {
        const toStore = Array.isArray(data) ? data : [data];
        localStorage.setItem(`${CACHE_PREFIX}${table}`, JSON.stringify(toStore));
    } catch (e) {
        console.warn(`Failed to persist cache for table ${table}:`, e);
    }
};

const updateItemInLocalCache = (table: string, targetId: string, updatedData: any) => {
    const current = getLocalTableCache<any>(table);
    const index = current.findIndex(item => item.id === targetId);
    if (index >= 0) {
        current[index] = { ...current[index], ...updatedData };
    } else {
        current.unshift({ id: targetId, ...updatedData });
    }
    saveLocalTableCache(table, current);
};

const removeItemFromLocalCache = (table: string, targetId: string) => {
    const current = getLocalTableCache<any>(table);
    const filtered = current.filter(item => item.id !== targetId);
    saveLocalTableCache(table, filtered);
};

// ============================================
// PROCESSAMENTO DA SYNC QUEUE (Last-Write-Wins)
// ============================================
export const processSyncQueue = async (): Promise<{ processed: number; failed: number }> => {
    if (isSyncing) return { processed: 0, failed: 0 };
    if (!isOnline() || !isSupabaseConfigured()) return { processed: 0, failed: 0 };

    isSyncing = true;
    notifySyncStatus();

    let processedCount = 0;
    let failedCount = 0;

    try {
        const queue = getSyncQueue();
        if (queue.length === 0) return { processed: 0, failed: 0 };

        const remainingQueue: SyncQueueItem[] = [];

        for (const item of queue) {
            // Se perdeu conectividade no meio do processamento, preserva o restante
            if (!isOnline()) {
                remainingQueue.push(item);
                continue;
            }

            try {
                if (item.operation === 'delete') {
                    const { error } = await supabase.from(item.table).delete().eq('id', item.targetId);
                    if (error && error.code !== 'PGRST116') {
                        throw error;
                    }
                    processedCount++;
                } else if (item.operation === 'insert') {
                    // Verifica se o registro já existe no banco
                    const { data: remoteExisting } = await supabase
                        .from(item.table)
                        .select('id, updated_at')
                        .eq('id', item.targetId)
                        .maybeSingle();

                    if (remoteExisting) {
                        // Resolução de conflito Last-Write-Wins
                        const remoteTime = remoteExisting.updated_at ? new Date(remoteExisting.updated_at).getTime() : 0;
                        if (remoteTime > item.timestamp) {
                            console.warn(`[Conflict] Remote record is newer for ${item.table} (id: ${item.targetId}). Discarding local mutation.`);
                        } else {
                            await supabase.from(item.table).update(item.payload).eq('id', item.targetId);
                        }
                    } else {
                        await supabase.from(item.table).insert({ ...item.payload, id: item.targetId });
                    }
                    processedCount++;
                } else if (item.operation === 'update') {
                    // Last-Write-Wins: Compara updated_at remoto com timestamp local
                    const { data: remoteExisting } = await supabase
                        .from(item.table)
                        .select('id, updated_at')
                        .eq('id', item.targetId)
                        .maybeSingle();

                    if (remoteExisting && remoteExisting.updated_at) {
                        const remoteTime = new Date(remoteExisting.updated_at).getTime();
                        if (remoteTime > item.timestamp) {
                            console.warn(`[Conflict] Discarding local update on ${item.table} (id: ${item.targetId}) - Server is more recent.`);
                            processedCount++;
                            continue;
                        }
                    }

                    const { error } = await supabase.from(item.table).update(item.payload).eq('id', item.targetId);
                    if (error) throw error;
                    processedCount++;
                }
            } catch (err: any) {
                console.error(`Failed to sync item ${item.id} (${item.operation} on ${item.table}):`, err);
                // Erro transitório de rede: mantém na fila e incrementa retry
                if (isNetworkError(err) || !isOnline()) {
                    item.retryCount = (item.retryCount || 0) + 1;
                    remainingQueue.push(item);
                } else {
                    // Erro fatal (ex: payload irrecuperável): descarta para não bloquear a fila indefinidamente
                    console.error(`Discarding poison sync item ${item.id} due to non-network error:`, err);
                    failedCount++;
                }
            }
        }

        saveSyncQueue(remainingQueue);
    } finally {
        isSyncing = false;
        notifySyncStatus();
    }

    return { processed: processedCount, failed: failedCount };
};

const isNetworkError = (error: any): boolean => {
    if (!error) return false;
    const msg = String(error.message || error.details || error).toLowerCase();
    return (
        msg.includes('failed to fetch') ||
        msg.includes('network') ||
        msg.includes('offline') ||
        msg.includes('timeout') ||
        msg.includes('connection')
    );
};

// ============================================
// OPERAÇÕES CRUD RESILIENTES (GENERIC APIS)
// ============================================

// Leitura Genérica com Fallback de Cache
export const fetchData = async <T>(table: string): Promise<T[]> => {
    if (!isSupabaseConfigured() || !isOnline()) {
        const cached = getLocalTableCache<T>(table);
        return transformFetchedData<T>(table, cached);
    }

    try {
        const { data, error } = await supabase.from(table).select('*').order('created_at', { ascending: false });
        if (error) {
            // Fallback sem ordenação de created_at se a tabela não tiver
            const fallback = await supabase.from(table).select('*');
            if (fallback.error) {
                console.warn(`Query failed for ${table}, falling back to local cache:`, fallback.error);
                const cached = getLocalTableCache<T>(table);
                return transformFetchedData<T>(table, cached);
            }
            const transformed = transformFetchedData<T>(table, fallback.data);
            saveLocalTableCache(table, transformed);
            return transformed;
        }

        const transformed = transformFetchedData<T>(table, data);
        saveLocalTableCache(table, transformed);
        return transformed;
    } catch (e) {
        console.warn(`Network exception fetching ${table}, recovering from local cache:`, e);
        const cached = getLocalTableCache<T>(table);
        return transformFetchedData<T>(table, cached);
    }
};

const transformFetchedData = <T>(table: string, data: any[] | null): T[] => {
    if (!Array.isArray(data)) return [];

    if (table === 'plan_of_accounts') {
        return buildPlanOfAccountsTree(data) as unknown as T[];
    }

    return data.map(row => {
        const camelRow = toCamelCaseRecord<any>(row);

        // Conversões específicas de data e normalizações
        if (table === 'transactions') {
            camelRow.date = toLocaleDate(camelRow.date);
            camelRow.dueDate = toLocaleDate(camelRow.dueDate || camelRow.due_date || camelRow.date);
            if (camelRow.competenceDate || camelRow.competence_date) {
                camelRow.competenceDate = toLocaleDate(camelRow.competenceDate || camelRow.competence_date);
            }
            camelRow.accountId = camelRow.accountId || camelRow.account_id || '';
            camelRow.account = camelRow.account || 'Caixa Geral';
            camelRow.documentNumber = camelRow.documentNumber || camelRow.document_number || '';
            camelRow.partnerId = camelRow.partnerId || camelRow.partner_id || '';
            camelRow.partnerName = camelRow.partnerName || camelRow.partner_name || '';
            camelRow.originModule = camelRow.originModule || camelRow.origin_module || '';
            camelRow.originId = camelRow.originId || camelRow.origin_id || '';
            camelRow.ledgerCode = camelRow.ledgerCode || camelRow.ledger_code || '';
            camelRow.ledgerName = camelRow.ledgerName || camelRow.ledger_name || '';
        } else if (table === 'sales') {
            camelRow.date = toLocaleDate(camelRow.date);
            if (camelRow.dueDate || camelRow.due_date) {
                camelRow.dueDate = toLocaleDate(camelRow.dueDate || camelRow.due_date);
            }
            camelRow.clientId = camelRow.clientId || camelRow.client_id || '';
            camelRow.clientName = camelRow.clientName || camelRow.client_name || '';
            camelRow.paymentMethod = camelRow.paymentMethod || camelRow.payment_method || '';
            camelRow.installments = Number(camelRow.installments || 1);
            camelRow.weightTicket = camelRow.weightTicket || camelRow.weight_ticket || '';
            camelRow.measuredWeight = camelRow.measuredWeight ?? camelRow.measured_weight;
            camelRow.tareWeight = camelRow.tareWeight ?? camelRow.tare_weight;
            camelRow.grossWeight = camelRow.grossWeight ?? camelRow.gross_weight;
            camelRow.netWeight = camelRow.netWeight ?? camelRow.net_weight;
            camelRow.ledgerCode = camelRow.ledgerCode || camelRow.ledger_code;
            camelRow.ledgerName = camelRow.ledgerName || camelRow.ledger_name;
        } else if (table === 'budgets') {
            camelRow.clientId = camelRow.clientId || camelRow.client_id || '';
            camelRow.clientName = camelRow.clientName || camelRow.client_name || '';
            camelRow.date = toLocaleDate(camelRow.date);
            camelRow.expiryDate = toLocaleDate(camelRow.expiryDate || camelRow.expiry_date);
            camelRow.subtotal = Number(camelRow.subtotal || 0);
            camelRow.discount = Number(camelRow.discount || 0);
            camelRow.total = Number(camelRow.total || 0);
            camelRow.status = camelRow.status || 'Aberto';
            camelRow.items = Array.isArray(camelRow.items) ? camelRow.items : [];
            camelRow.tareWeight = camelRow.tareWeight ?? camelRow.tare_weight;
            camelRow.grossWeight = camelRow.grossWeight ?? camelRow.gross_weight;
            camelRow.netWeight = camelRow.netWeight ?? camelRow.net_weight;
            camelRow.weightNotes = camelRow.weightNotes || camelRow.weight_notes;
            camelRow.paymentMethod = camelRow.paymentMethod || camelRow.payment_method;
        } else if (table === 'employees') {
            if (camelRow.admissionDate || camelRow.admission_date) {
                camelRow.admissionDate = toLocaleDate(camelRow.admissionDate || camelRow.admission_date);
            }
            camelRow.costCenter = camelRow.costCenter || camelRow.cost_center || '';
            camelRow.cnhCategory = camelRow.cnhCategory || camelRow.cnh_category || '';
            camelRow.cnhExpiry = camelRow.cnhExpiry || camelRow.cnh_expiry || '';
        } else if (table === 'fleet') {
            camelRow.fuelType = camelRow.fuelType || camelRow.fuel_type;
            camelRow.fuelLevel = camelRow.fuelLevel ?? camelRow.fuel_level;
            camelRow.nextMaintenanceKm = camelRow.nextMaintenanceKm ?? camelRow.next_maintenance_km;
            camelRow.costCenter = camelRow.costCenter || camelRow.cost_center || '';
            camelRow.department = camelRow.department || camelRow.department || '';
            camelRow.telemetryData = camelRow.telemetryData || camelRow.telemetry_data || {};
        } else if (table === 'production_orders') {
            camelRow.orderNumber = camelRow.orderNumber || camelRow.order_number || '';
            camelRow.productName = camelRow.productName || camelRow.product_name || '';
            camelRow.formulaId = camelRow.formulaId || camelRow.formula_id;
            camelRow.unitId = camelRow.unitId || camelRow.unit_id;
            camelRow.qualityTests = camelRow.qualityTests || camelRow.quality_tests || [];
            camelRow.clientId = camelRow.clientId || camelRow.client_id;
            camelRow.saleId = camelRow.saleId || camelRow.sale_id;
            camelRow.vehicleId = camelRow.vehicleId || camelRow.vehicle_id;
        }

        return camelRow as T;
    });
};

// Criação com Fallback Resiliente e Sync Queue
export const createItem = async <T>(table: string, item: any): Promise<T> => {
    const cleanItem = sanitizeDbPayload(table, item, true);
    const targetId = cleanItem.id;

    // Se estiver offline ou sem Supabase configurado, enfileira e retorna otimista
    if (!isSupabaseConfigured() || !isOnline()) {
        enqueueMutation(table, 'insert', targetId, cleanItem);
        updateItemInLocalCache(table, targetId, cleanItem);
        return cleanItem as T;
    }

    try {
        const { data, error } = await supabase.from(table).insert(cleanItem).select().single();
        if (error) {
            if (isNetworkError(error)) {
                enqueueMutation(table, 'insert', targetId, cleanItem);
                updateItemInLocalCache(table, targetId, cleanItem);
                return cleanItem as T;
            }
            console.error(`Error creating item in ${table}:`, error, cleanItem);
            throw error;
        }

        const result = (data || cleanItem) as T;
        updateItemInLocalCache(table, targetId, result);
        return result;
    } catch (e: any) {
        if (isNetworkError(e)) {
            enqueueMutation(table, 'insert', targetId, cleanItem);
            updateItemInLocalCache(table, targetId, cleanItem);
            return cleanItem as T;
        }
        throw e;
    }
};

// Atualização com Fallback Resiliente e Sync Queue
export const updateItem = async <T>(table: string, id: string, updates: any): Promise<T> => {
    const targetId = isValidUUID(id) ? id : toDeterministicUUID(id);
    const cleanUpdates = sanitizeDbPayload(table, updates, false);
    const optimisticMerged = { id: targetId, ...cleanUpdates };

    if (!isSupabaseConfigured() || !isOnline()) {
        enqueueMutation(table, 'update', targetId, cleanUpdates);
        updateItemInLocalCache(table, targetId, optimisticMerged);
        return optimisticMerged as T;
    }

    try {
        const { data, error } = await supabase.from(table).update(cleanUpdates).eq('id', targetId).select().single();
        if (error) {
            if (isNetworkError(error)) {
                enqueueMutation(table, 'update', targetId, cleanUpdates);
                updateItemInLocalCache(table, targetId, optimisticMerged);
                return optimisticMerged as T;
            }
            console.error(`Error updating item in ${table} (id: ${targetId}):`, error, cleanUpdates);
            throw error;
        }

        const result = (data || optimisticMerged) as T;
        updateItemInLocalCache(table, targetId, result);
        return result;
    } catch (e: any) {
        if (isNetworkError(e)) {
            enqueueMutation(table, 'update', targetId, cleanUpdates);
            updateItemInLocalCache(table, targetId, optimisticMerged);
            return optimisticMerged as T;
        }
        throw e;
    }
};

// Remoção com Fallback Resiliente e Sync Queue
export const deleteItem = async (table: string, id: string): Promise<boolean> => {
    const targetId = isValidUUID(id) ? id : toDeterministicUUID(id);

    if (!isSupabaseConfigured() || !isOnline()) {
        enqueueMutation(table, 'delete', targetId);
        removeItemFromLocalCache(table, targetId);
        return true;
    }

    try {
        const { error } = await supabase.from(table).delete().eq('id', targetId);
        if (error) {
            if (isNetworkError(error)) {
                enqueueMutation(table, 'delete', targetId);
                removeItemFromLocalCache(table, targetId);
                return true;
            }
            console.error(`Error deleting item from ${table} (id: ${targetId}):`, error);
            throw error;
        }
        removeItemFromLocalCache(table, targetId);
        return true;
    } catch (e: any) {
        if (isNetworkError(e)) {
            enqueueMutation(table, 'delete', targetId);
            removeItemFromLocalCache(table, targetId);
            return true;
        }
        throw e;
    }
};

// Atualização de Configurações do Sistema
export const updateSettings = async (settings: AppSettings) => {
    // 1. Sempre persiste imediatamente no cache local dedicado para integridade instantânea
    saveLocalTableCache('settings', [settings]);

    if (!isSupabaseConfigured() || !isOnline()) {
        enqueueMutation('settings', 'update', 'system_settings', settings);
        return settings;
    }

    try {
        const { data: existing, error: selectErr } = await supabase.from('settings').select('id').limit(1).maybeSingle();
        if (selectErr) {
            console.warn('Tabela settings no Supabase indisponível ou inacessível, enfileirando mutação:', selectErr.message);
            enqueueMutation('settings', 'update', 'system_settings', settings);
            return settings;
        }

        if (existing && existing.id) {
            return await updateItem('settings', existing.id, settings);
        } else {
            return await createItem('settings', settings);
        }
    } catch (e) {
        console.warn('Falha remota ao sincronizar settings, preservando em fila offline:', e);
        enqueueMutation('settings', 'update', 'system_settings', settings);
        return settings;
    }
};

// Helper de Permissões e Roles
export const fetchRoles = async (): Promise<AppRole[]> => {
    if (!isSupabaseConfigured() || !isOnline()) {
        return getLocalTableCache<AppRole>('app_roles');
    }
    try {
        const { data, error } = await supabase.from('app_roles').select('*');
        if (error) return getLocalTableCache<AppRole>('app_roles');
        const roles = (data as AppRole[]) || [];
        saveLocalTableCache('app_roles', roles);
        return roles;
    } catch {
        return getLocalTableCache<AppRole>('app_roles');
    }
};

// ============================================
// AUTO-INICIALIZAÇÃO DE SINCRONIZAÇÃO
// ============================================
if (typeof window !== 'undefined') {
    onNetworkStatusChange((online) => {
        if (online) {
            console.log('🌐 Conexão restaurada! Iniciando drenagem da fila de sincronização...');
            processSyncQueue().then(({ processed, failed }) => {
                if (processed > 0 || failed > 0) {
                    console.log(`✅ Fila sincronizada com sucesso: ${processed} processados, ${failed} falhas.`);
                }
            });
        }
    });

    // Tentativa inicial se já estiver online ao inicializar o script
    if (isOnline() && isSupabaseConfigured()) {
        setTimeout(() => {
            processSyncQueue().catch(err => console.warn('Erro ao processar fila inicial:', err));
        }, 1500);
    }
}
