import { createClient } from '@supabase/supabase-js'

const DEFAULT_SUPABASE_URL = 'https://ucjizjocapdntcyrrmuh.supabase.co'
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVjaml6am9jYXBkbnRjeXJybXVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI2MDc4NDYsImV4cCI6MjEwODE4Mzg0Nn0.rOwfzKw-fa8wP-tICEehBVvKk7uoEd69HlYjJiKrCBg'

const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Helper para verificar se Supabase está configurado
export const isSupabaseConfigured = () => {
    return !!(supabaseUrl && supabaseAnonKey &&
        supabaseUrl !== 'sua_url_aqui' &&
        supabaseAnonKey !== 'sua_chave_aqui' &&
        supabaseUrl !== 'https://placeholder.supabase.co')
}

// Log de status
if (isSupabaseConfigured()) {
    console.log('✅ Supabase configured and ready!')
} else {
    console.log('📦 Running in localStorage mode (offline)')
}
