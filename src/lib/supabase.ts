import { createClient } from '@supabase/supabase-js'

const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('⚠️ Supabase credentials not found. Using localStorage mode.')
}

export const supabase = createClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseAnonKey || 'placeholder-key'
)

// Helper para verificar se Supabase está configurado
export const isSupabaseConfigured = () => {
    return !!(supabaseUrl && supabaseAnonKey &&
        supabaseUrl !== 'sua_url_aqui' &&
        supabaseAnonKey !== 'sua_chave_aqui')
}

// Log de status
if (isSupabaseConfigured()) {
    console.log('✅ Supabase configured and ready!')
} else {
    console.log('📦 Running in localStorage mode (offline)')
}
