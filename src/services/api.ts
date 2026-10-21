import { supabase } from '../lib/supabase';
import {
    Client, Supplier, Employee, InventoryItem, Transaction, Sale, Budget,
    PurchaseOrder, FleetVehicle, VehicleMaintenance, Tire, PayrollRecord,
    TimeLog, Vacation, SalaryAdvance, ProductionFormula, ProductionUnit,
    ProductionOrder, User, AppRole, AppSettings, AuditLog
} from '../../types';

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

    // Specific mapping for transactions (PostgreSQL schema compatibility)
    if (table === 'transactions') {
        const mapped: Record<string, any> = {
            date: toIsoDate(cleaned.date) || new Date().toISOString().split('T')[0],
            due_date: toIsoDate(cleaned.dueDate || cleaned.due_date || cleaned.date),
            description: cleaned.description || 'Lançamento',
            category: cleaned.category || 'Vendas',
            account: cleaned.account || 'Caixa Geral',
            account_id: cleaned.accountId && isValidUUID(cleaned.accountId) ? cleaned.accountId : (cleaned.account_id && isValidUUID(cleaned.account_id) ? cleaned.account_id : null),
            amount: Number(cleaned.amount || 0),
            status: cleaned.status || 'Pendente',
            type: cleaned.type || 'Receita',
            document_number: cleaned.documentNumber || cleaned.document_number || null,
            partner_id: cleaned.partnerId && isValidUUID(cleaned.partnerId) ? cleaned.partnerId : (cleaned.partner_id && isValidUUID(cleaned.partner_id) ? cleaned.partner_id : null),
            origin_module: cleaned.originModule || cleaned.origin_module || null,
            origin_id: cleaned.originId || cleaned.origin_id || null,
            ledger_code: cleaned.ledgerCode || cleaned.ledger_code || null,
            ledger_name: cleaned.ledgerName || cleaned.ledger_name || null,
        };
        if (isCreate) {
            mapped.id = cleaned.id;
        }
        return mapped;
    }

    // Specific mapping for sales (PostgreSQL schema compatibility)
    if (table === 'sales') {
        const mapped: Record<string, any> = {
            date: toIsoDate(cleaned.date) || new Date().toISOString().split('T')[0],
            category: cleaned.category || 'Vendas',
            amount: Number(cleaned.amount || 0),
            status: cleaned.status || 'Pendente',
            type: cleaned.type || 'Receita',
            client_id: cleaned.clientId && isValidUUID(cleaned.clientId) ? cleaned.clientId : (cleaned.client_id && isValidUUID(cleaned.client_id) ? cleaned.client_id : null),
            client_name: cleaned.clientName || cleaned.client_name || 'Cliente Balcão',
            items: Array.isArray(cleaned.items) ? cleaned.items : [],
            payment_method: cleaned.paymentMethod || cleaned.payment_method || 'credit',
            installments: Number(cleaned.installments || 1),
        };
        if (cleaned.weightTicket || cleaned.weight_ticket) {
            mapped.weight_ticket = cleaned.weightTicket || cleaned.weight_ticket;
        }
        if (cleaned.measuredWeight !== undefined || cleaned.measured_weight !== undefined) {
            mapped.measured_weight = cleaned.measuredWeight ?? cleaned.measured_weight;
        }
        if (isCreate) {
            mapped.id = cleaned.id;
        }
        return mapped;
    }

    // Specific table cleanups: strip relations / columns that don't exist in Supabase tables
    if (table === 'fleet') {
        delete cleaned.maintenanceHistory;
        delete cleaned.fuelLogs;
    }

    Object.keys(cleaned).forEach((key) => {
        if (cleaned[key] === undefined) {
            delete cleaned[key];
            return;
        }

        // documentId in stock_movements is VARCHAR(100), not a UUID foreign key
        if (key === 'documentId') return;

        if (key.endsWith('Id')) {
            const val = cleaned[key];
            if (val === '' || val === null || val === undefined) {
                cleaned[key] = null;
            } else if (isValidUUID(val)) {
                cleaned[key] = val;
            } else {
                cleaned[key] = toDeterministicUUID(val);
            }
        }
    });

    return cleaned;
};

// Generic Fetch
export const fetchData = async <T>(table: string): Promise<T[]> => {
    try {
        const { data, error } = await supabase.from(table).select('*').order('created_at', { ascending: false });
        if (error) {
            // Fallback without ordering if table doesn't have created_at
            const fallback = await supabase.from(table).select('*');
            if (fallback.error) {
                console.error(`Error fetching ${table}:`, fallback.error);
                return [];
            }
            return transformFetchedData<T>(table, fallback.data);
        }
        return transformFetchedData<T>(table, data);
    } catch (e) {
        console.error(`Unexpected error fetching ${table}:`, e);
        return [];
    }
};

const transformFetchedData = <T>(table: string, data: any[] | null): T[] => {
    if (!Array.isArray(data)) return [];

    if (table === 'transactions') {
        return data.map(row => ({
            ...row,
            date: toLocaleDate(row.date),
            dueDate: toLocaleDate(row.due_date || row.date),
            accountId: row.account_id || row.accountId || '',
            account: row.account || 'Caixa Geral',
            documentNumber: row.document_number || row.documentNumber || '',
            partnerId: row.partner_id || row.partnerId || '',
            partnerName: row.partner_name || row.partnerName || '',
            originModule: row.origin_module || row.originModule || '',
            originId: row.origin_id || row.originId || '',
            ledgerCode: row.ledger_code || row.ledgerCode || '',
            ledgerName: row.ledger_name || row.ledgerName || '',
        })) as T[];
    }

    if (table === 'sales') {
        return data.map(row => ({
            ...row,
            date: toLocaleDate(row.date),
            clientId: row.client_id || row.clientId || '',
            clientName: row.client_name || row.clientName || '',
            paymentMethod: row.payment_method || row.paymentMethod || '',
            installments: row.installments || 1,
            weightTicket: row.weight_ticket || row.weightTicket || '',
            measuredWeight: row.measured_weight ?? row.measuredWeight,
        })) as T[];
    }

    return data as T[];
};

// Generic Create
export const createItem = async <T>(table: string, item: any): Promise<T> => {
    const cleanItem = sanitizeDbPayload(table, item, true);

    const { data, error } = await supabase.from(table).insert(cleanItem).select().single();
    if (error) {
        console.error(`Error creating item in ${table}:`, error, cleanItem);
        throw error;
    }
    return data as T;
};

// Generic Update
export const updateItem = async <T>(table: string, id: string, updates: any): Promise<T> => {
    const targetId = isValidUUID(id) ? id : toDeterministicUUID(id);
    const cleanUpdates = sanitizeDbPayload(table, updates, false);
    const { data, error } = await supabase.from(table).update(cleanUpdates).eq('id', targetId).select().single();
    if (error) {
        console.error(`Error updating item in ${table} (id: ${targetId}):`, error, cleanUpdates);
        throw error;
    }
    return data as T;
};

// Generic Delete
export const deleteItem = async (table: string, id: string): Promise<boolean> => {
    const targetId = isValidUUID(id) ? id : toDeterministicUUID(id);
    const { error } = await supabase.from(table).delete().eq('id', targetId);
    if (error) {
        console.error(`Error deleting item from ${table} (id: ${targetId}):`, error);
        throw error;
    }
    return true;
};

// Specific Settings Update (Single Row)
export const updateSettings = async (settings: AppSettings) => {
    const { data: existing } = await supabase.from('settings').select('id').limit(1).single();

    if (existing) {
        return updateItem('settings', existing.id, settings);
    } else {
        return createItem('settings', settings);
    }
};

// Permission / Role Helper
export const fetchRoles = async (): Promise<AppRole[]> => {
    const { data, error } = await supabase.from('app_roles').select('*');
    if (error) return [];
    return (data as AppRole[]) || [];
};

