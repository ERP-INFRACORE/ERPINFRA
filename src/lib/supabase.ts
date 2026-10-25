import { createClient } from '@supabase/supabase-js';

const DEFAULT_SUPABASE_URL = 'https://ucjizjocapdntcyrrmuh.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVjaml6am9jYXBkbnRjeXJybXVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI2MDc4NDYsImV4cCI6MjEwODE4Mzg0Nn0.rOwfzKw-fa8wP-tICEehBVvKk7uoEd69HlYjJiKrCBg';

const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: true,
        autoRefreshToken: true
    }
});

// Helper para verificar se Supabase está com credenciais válidas configuradas
export const isSupabaseConfigured = (): boolean => {
    return !!(
        supabaseUrl &&
        supabaseAnonKey &&
        supabaseUrl !== 'sua_url_aqui' &&
        supabaseAnonKey !== 'sua_chave_aqui' &&
        supabaseUrl !== 'https://placeholder.supabase.co'
    );
};

// Helper síncrono para verificar estado de conexão de rede do navegador
export const isOnline = (): boolean => {
    if (typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean') {
        return navigator.onLine;
    }
    return true;
};

// Ping de verificação ativa de conectividade com timeout
export const checkSupabaseConnection = async (timeoutMs: number = 3500): Promise<boolean> => {
    if (!isSupabaseConfigured() || !isOnline()) {
        return false;
    }

    try {
        const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Supabase ping timeout')), timeoutMs)
        );

        const pingPromise = supabase
            .from('settings')
            .select('id')
            .limit(1);

        const result = await Promise.race([pingPromise, timeoutPromise]);
        // Consideramos conectado se respondeu sem erro de rede crítico
        return !result.error || result.error.code !== 'PGRST301';
    } catch (err) {
        console.warn('⚠️ Supabase connection check failed:', err);
        return false;
    }
};

// Ouvinte de mudança de status de rede
export const onNetworkStatusChange = (callback: (isOnline: boolean) => void): (() => void) => {
    if (typeof window === 'undefined') return () => {};

    const handleOnline = () => callback(true);
    const handleOffline = () => callback(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
    };
};

// Log de status na inicialização
if (isSupabaseConfigured()) {
    console.log('✅ Supabase client initialized and ready!');
} else {
    console.log('📦 Supabase credentials not found. Running in Offline/LocalStorage mode.');
}
