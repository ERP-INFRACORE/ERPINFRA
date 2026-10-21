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

const sanitizeDbPayload = (item: any, isCreate: boolean) => {
    if (!item || typeof item !== 'object') return item;
    const cleaned: Record<string, any> = { ...item };

    if (isCreate) {
        if (!isValidUUID(cleaned.id)) {
            delete cleaned.id;
        }
    } else {
        delete cleaned.id;
    }

    Object.keys(cleaned).forEach((key) => {
        if (key.endsWith('Id')) {
            const val = cleaned[key];
            if (!val || !isValidUUID(val)) {
                cleaned[key] = null;
            }
        }
    });

    return cleaned;
};

// Generic Fetch
export const fetchData = async <T>(table: string) => {
    const { data, error } = await supabase.from(table).select('*').order('created_at', { ascending: false });
    if (error) {
        console.error(`Error fetching ${table}:`, error);
        return [];
    }
    return data as T[];
};

// Generic Create
export const createItem = async <T>(table: string, item: any) => {
    const cleanItem = sanitizeDbPayload(item, true);

    const { data, error } = await supabase.from(table).insert(cleanItem).select().single();
    if (error) throw error;
    return data as T;
};

// Generic Update
export const updateItem = async <T>(table: string, id: string, updates: any) => {
    const cleanUpdates = sanitizeDbPayload(updates, false);
    const { data, error } = await supabase.from(table).update(cleanUpdates).eq('id', id).select().single();
    if (error) throw error;
    return data as T;
};

// Generic Delete
export const deleteItem = async (table: string, id: string) => {
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) throw error;
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
export const fetchRoles = async () => {
    const { data, error } = await supabase.from('app_roles').select('*');
    if (error) return [];
    return data as AppRole[];
};
