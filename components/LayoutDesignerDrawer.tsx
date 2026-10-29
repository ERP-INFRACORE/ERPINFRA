import React, { useState } from 'react';
import {
  Palette,
  Sliders,
  Sparkles,
  RotateCcw,
  Check,
  Sun,
  Moon,
  Contrast,
  Type,
  Maximize2,
  Minimize2,
  PanelLeft,
  Layers,
  Activity,
  X,
  Monitor,
  Wand2,
  Brush,
  ChevronRight,
  ShieldCheck,
  Laptop,
  LayoutDashboard
} from 'lucide-react';

export type NavMode = 'classic' | 'sidebar' | 'dual-deck' | 'floating-dock';
export type VisualStyle = 'original' | 'scada' | 'bento-glass' | 'minimal-flat' | 'soft-neumorphic';
export type DensityMode = 'compact' | 'standard' | 'comfortable';
export type ContainerWidthMode = '1600' | 'full';
export type AccentTheme = 'cyan' | 'indigo' | 'emerald' | 'amber' | 'violet' | 'rose' | 'crimson' | 'slate';
export type ThemeMode = 'light' | 'dark' | 'oled' | 'high-contrast';
export type RadiusMode = 'none' | 'subtle' | 'rounded' | 'pill';
export type ButtonStyleMode = 'fiori-outline' | 'redwood-solid' | 'industrial-sharp' | 'modern-soft';
export type FontMode = 'roboto' | 'inter' | 'jakarta' | 'plex' | 'mono';
export type TextScaleMode = '90' | '100' | '110';
export type CardShadowMode = 'none' | 'soft' | 'strong';

export interface LayoutPreferences {
  navMode: NavMode;
  visualStyle: VisualStyle;
  density: DensityMode;
  containerWidth: ContainerWidthMode;
  accent: AccentTheme;
  theme: ThemeMode;
  showCustomizerBar: boolean;
  sidebarCollapsed: boolean;
  borderRadius: RadiusMode;
  buttonStyle: ButtonStyleMode;
  fontFamily: FontMode;
  textScale: TextScaleMode;
  cardShadow: CardShadowMode;
  backdropBlur: boolean;
  reduceMotion: boolean;
  showLiveTelemetry: boolean;
  activePreset?: string;
}

export const DEFAULT_PREFS: LayoutPreferences = {
  navMode: 'classic',
  visualStyle: 'original',
  density: 'standard',
  containerWidth: '1600',
  accent: 'cyan',
  theme: 'light',
  showCustomizerBar: false,
  sidebarCollapsed: false,
  borderRadius: 'rounded',
  buttonStyle: 'fiori-outline',
  fontFamily: 'roboto',
  textScale: '100',
  cardShadow: 'soft',
  backdropBlur: true,
  reduceMotion: false,
  showLiveTelemetry: false,
  activePreset: 'original'
};

export const ACCENT_PALETTE: Array<{
  id: AccentTheme;
  name: string;
  category: string;
  colorHex: string;
  badgeClass: string;
  dotClass: string;
  navClass: string;
  borderClass: string;
  ringClass: string;
  description: string;
}> = [
  {
    id: 'cyan',
    name: 'Azul Engenharia',
    category: 'Oficial',
    colorHex: '#0284c7',
    badgeClass: 'bg-sky-700 text-white',
    dotClass: 'bg-sky-600',
    navClass: 'bg-slate-100 text-sky-800 dark:bg-slate-800 dark:text-sky-300 font-bold',
    borderClass: 'border-sky-700',
    ringClass: 'ring-sky-600',
    description: 'Tom corporativo confiável e equilibrado, padrão do InfraCore'
  },
  {
    id: 'slate',
    name: 'Grafite Titânio',
    category: 'Monocromo',
    colorHex: '#475569',
    badgeClass: 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900',
    dotClass: 'bg-slate-600',
    navClass: 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100 font-bold',
    borderClass: 'border-slate-700',
    ringClass: 'ring-slate-500',
    description: 'Visual sóbrio, cinza ardósia neutro, foco total e zero distrações'
  },
  {
    id: 'indigo',
    name: 'Azul Marinho Executivo',
    category: 'Corporativo',
    colorHex: '#1e40af',
    badgeClass: 'bg-blue-800 text-white',
    dotClass: 'bg-blue-700',
    navClass: 'bg-blue-50/60 text-blue-900 dark:bg-slate-800 dark:text-blue-300 font-bold',
    borderClass: 'border-blue-800',
    ringClass: 'ring-blue-700',
    description: 'Elegância corporativa sóbria, perfeita para finanças e governança'
  },
  {
    id: 'emerald',
    name: 'Verde Operacional',
    category: 'Produção',
    colorHex: '#15803d',
    badgeClass: 'bg-emerald-800 text-white',
    dotClass: 'bg-emerald-700',
    navClass: 'bg-emerald-50/60 text-emerald-900 dark:bg-slate-800 dark:text-emerald-300 font-bold',
    borderClass: 'border-emerald-800',
    ringClass: 'ring-emerald-700',
    description: 'Tom industrial discreto para produção, pátio e suprimentos'
  }
];

export interface DesignerPreset {
  id: string;
  name: string;
  tagline: string;
  icon: string;
  badge: string;
  prefs: Partial<LayoutPreferences>;
}

export const DESIGNER_PRESETS: DesignerPreset[] = [
  {
    id: 'sap-fiori',
    name: 'SAP Fiori / Horizon',
    tagline: 'Referência mundial em ERPs técnicos: fonte Inter, botões outline precisos e cantos sutis de 4px.',
    icon: 'SAP',
    badge: 'SAP Fiori',
    prefs: {
      navMode: 'classic',
      visualStyle: 'original',
      density: 'standard',
      containerWidth: '1600',
      accent: 'cyan',
      theme: 'light',
      borderRadius: 'subtle',
      buttonStyle: 'fiori-outline',
      fontFamily: 'inter',
      textScale: '100',
      cardShadow: 'none',
      backdropBlur: false,
      reduceMotion: false,
      showLiveTelemetry: false
    }
  },
  {
    id: 'oracle-redwood',
    name: 'Oracle Redwood Enterprise',
    tagline: 'Estética encorpada com tipografia IBM Plex Sans, botões sólidos de alto contraste e cantos de 8px.',
    icon: 'ORCL',
    badge: 'Oracle ERP',
    prefs: {
      navMode: 'classic',
      visualStyle: 'original',
      density: 'standard',
      containerWidth: '1600',
      accent: 'slate',
      theme: 'light',
      borderRadius: 'rounded',
      buttonStyle: 'redwood-solid',
      fontFamily: 'plex',
      textScale: '100',
      cardShadow: 'soft',
      backdropBlur: true,
      reduceMotion: false,
      showLiveTelemetry: false
    }
  },
  {
    id: 'industrial-scada',
    name: 'Industrial Reto & SCADA',
    tagline: 'Cantos vivos 0px, botões técnicos retos e fonte JetBrains Mono para chão de fábrica, usina e pátio.',
    icon: 'SCADA',
    badge: 'SCADA 0px',
    prefs: {
      navMode: 'classic',
      visualStyle: 'scada',
      density: 'compact',
      containerWidth: 'full',
      accent: 'slate',
      theme: 'dark',
      borderRadius: 'none',
      buttonStyle: 'industrial-sharp',
      fontFamily: 'mono',
      textScale: '100',
      cardShadow: 'none',
      backdropBlur: false,
      reduceMotion: true,
      showLiveTelemetry: true
    }
  },
  {
    id: 'odoo-modern',
    name: 'Odoo & Modern SaaS',
    tagline: 'Visual contemporâneo com Plus Jakarta Sans, botões suaves dinâmicos e navegação ágil.',
    icon: 'ODOO',
    badge: 'Odoo SaaS',
    prefs: {
      navMode: 'classic',
      visualStyle: 'original',
      density: 'standard',
      containerWidth: '1600',
      accent: 'indigo',
      theme: 'light',
      borderRadius: 'pill',
      buttonStyle: 'modern-soft',
      fontFamily: 'jakarta',
      textScale: '100',
      cardShadow: 'soft',
      backdropBlur: true,
      reduceMotion: false,
      showLiveTelemetry: false
    }
  },
  {
    id: 'infracore-default',
    name: 'InfraCore Clássico',
    tagline: 'Equilíbrio padrão de fábrica do InfraCore com fonte Roboto e acento azul engenharia.',
    icon: 'INFR',
    badge: 'Padrão',
    prefs: {
      navMode: 'classic',
      visualStyle: 'original',
      density: 'standard',
      containerWidth: '1600',
      accent: 'cyan',
      theme: 'light',
      borderRadius: 'rounded',
      buttonStyle: 'fiori-outline',
      fontFamily: 'roboto',
      textScale: '100',
      cardShadow: 'soft',
      backdropBlur: false,
      reduceMotion: false,
      showLiveTelemetry: false
    }
  }
];

interface LayoutDesignerDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  prefs: LayoutPreferences;
  updatePref: <K extends keyof LayoutPreferences>(key: K, value: LayoutPreferences[K]) => void;
  applyPreset: (preset: DesignerPreset) => void;
  resetToOriginalLayout: () => void;
}

export const LayoutDesignerDrawer: React.FC<LayoutDesignerDrawerProps> = ({
  isOpen,
  onClose,
  prefs,
  updatePref,
  applyPreset,
  resetToOriginalLayout
}) => {
  const [activeTab, setActiveTab] = useState<'palette' | 'surface' | 'typography' | 'navigation' | 'presets' | 'telemetry'>('palette');

  if (!isOpen) return null;

  const currentAccent = ACCENT_PALETTE.find(a => a.id === prefs.accent) || ACCENT_PALETTE[0];

  return (
    <div className="fixed inset-0 z-[140] pointer-events-none flex justify-end animate-in fade-in duration-150">
      {/* Backdrop transparente / suave para fechar ao clicar fora */}
      <div
        className="fixed inset-0 bg-slate-950/40 backdrop-blur-[2px] pointer-events-auto"
        onClick={onClose}
      />

      {/* Drawer deslizante da direita */}
      <aside className="pointer-events-auto relative z-10 w-full sm:w-[480px] max-w-[100vw] h-screen bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col justify-between overflow-hidden animate-in slide-in-from-right duration-200">
        {/* Top Header */}
        <div className="p-4 sm:p-5 bg-slate-900 text-white border-b border-slate-800 shrink-0">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 shadow-sm flex items-center justify-center">
                <Palette size={18} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold uppercase tracking-wider font-display">
                    Aparência & Layout Studio
                  </h3>
                  <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700 text-[10px] font-bold uppercase tracking-wider">
                    Corporativo
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Customização visual sóbria, densidade e modo de iluminação
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Fechar Studio de Design"
            >
              <X size={20} />
            </button>
          </div>

          {/* Abas Superiores de Navegação no Studio */}
          <div className="flex items-center gap-1 mt-4 overflow-x-auto no-scrollbar pt-1">
            {[
              { id: 'palette', label: 'Cores', icon: <Brush size={13} /> },
              { id: 'surface', label: 'Tema & Estilo', icon: <Layers size={13} /> },
              { id: 'typography', label: 'Tipografia', icon: <Type size={13} /> },
              { id: 'navigation', label: 'Navegação', icon: <PanelLeft size={13} /> },
              { id: 'presets', label: 'Perfis 1-Click', icon: <Wand2 size={13} /> },
              { id: 'telemetry', label: 'Ajustes', icon: <Sliders size={13} /> },
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-all ${
                  activeTab === tab.id
                    ? 'bg-slate-800 text-white border border-slate-700 shadow-xs'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-6 text-slate-800 dark:text-slate-100">
          {/* =========================================================
              ABA 1: CORES & PALETA DE DESTAQUE
             ========================================================= */}
          {activeTab === 'palette' && (
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Paleta Corporativa de Acento (Accent)
                  </h4>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                    {currentAccent.name}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Tom sóbrio aplicado com parcimônia em ações primárias, foco e abas selecionadas.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {ACCENT_PALETTE.map(acc => {
                  const isSelected = prefs.accent === acc.id;
                  return (
                    <button
                      key={acc.id}
                      type="button"
                      onClick={() => updatePref('accent', acc.id)}
                      className={`p-3.5 rounded-xl border text-left transition-all relative flex flex-col justify-between gap-2 ${
                        isSelected
                          ? 'bg-slate-50 dark:bg-slate-800/90 border-slate-700 dark:border-slate-300 ring-2 ring-slate-400/20 shadow-xs'
                          : 'bg-white dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2.5">
                          <span
                            className="w-4 h-4 rounded-full shadow-inner ring-1 ring-black/10 dark:ring-white/10 shrink-0"
                            style={{ backgroundColor: acc.colorHex }}
                          />
                          <span className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                            {acc.name}
                          </span>
                        </div>
                        {isSelected && (
                          <span className="w-4 h-4 rounded-full bg-slate-900 text-white dark:bg-white dark:text-slate-900 flex items-center justify-center shrink-0">
                            <Check size={10} strokeWidth={3} />
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                        {acc.description}
                      </p>
                      <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-700/50 text-[10px]">
                        <span className="text-slate-400 font-mono">{acc.colorHex}</span>
                        <span className="font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          {acc.category}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Live Preview Box */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Exemplo de Aplicação Discreta:
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`${currentAccent.badgeClass} px-3 py-1.5 rounded-lg text-xs font-bold shadow-xs flex items-center gap-1.5`}>
                    Botão Primário
                  </span>
                  <span className={`${currentAccent.navClass} px-3 py-1.5 rounded-lg text-xs border border-transparent`}>
                    Aba Selecionada
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================
              ABA 2: TEMA & ESTILO VISUAL DE SUPERFÍCIES
             ========================================================= */}
          {activeTab === 'surface' && (
            <div className="space-y-5">
              {/* Modo de Iluminação / Theme */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Modo de Iluminação
                  </h4>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase">
                    {prefs.theme}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'light', label: 'Modo Claro', sub: 'Padrão corporativo diurno', icon: <Sun size={15} className="text-amber-500" /> },
                    { id: 'dark', label: 'Escuro Ardósia', sub: 'Slate moderno e sóbrio', icon: <Moon size={15} className="text-slate-400" /> },
                    { id: 'oled', label: 'OLED Pitch Black', sub: 'Preto puro absoluto (#000)', icon: <Monitor size={15} className="text-emerald-500" /> },
                    { id: 'high-contrast', label: 'Alto Contraste', sub: 'Máxima legibilidade em obra', icon: <Contrast size={15} className="text-slate-600 dark:text-slate-200" /> }
                  ].map(th => (
                    <button
                      key={th.id}
                      type="button"
                      onClick={() => updatePref('theme', th.id as ThemeMode)}
                      className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between gap-1.5 ${
                        prefs.theme === th.id
                          ? 'bg-slate-50 dark:bg-slate-800 border-slate-700 dark:border-slate-300 ring-2 ring-slate-400/20 shadow-xs'
                          : 'bg-white dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/80 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {th.icon}
                          <span className="text-xs font-bold text-slate-900 dark:text-white">{th.label}</span>
                        </div>
                        {prefs.theme === th.id && (
                          <span className="w-3.5 h-3.5 rounded-full bg-slate-900 text-white dark:bg-white dark:text-slate-900 flex items-center justify-center">
                            <Check size={9} strokeWidth={3} />
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">{th.sub}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Estilo Visual de Superfície */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Estilo Visual das Superfícies
                </h4>
                <div className="space-y-2">
                  {[
                    {
                      id: 'original',
                      label: 'Corporativo Limpo (Padrão)',
                      sub: 'Superfícies limpas, bordas neutras sutis e contraste equilibrado.',
                      badge: 'Padrão'
                    },
                    {
                      id: 'minimal-flat',
                      label: 'Minimalista Flat',
                      sub: 'Sem sombras, bordas de 1px minimalistas e foco absoluto no fluxo de trabalho ágil.',
                      badge: 'Flat'
                    },
                    {
                      id: 'scada',
                      label: 'Técnico Monocromo',
                      sub: 'Painel escuro técnico com fundo neutro e ênfase total em dados.',
                      badge: 'Técnico'
                    }
                  ].map(st => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => updatePref('visualStyle', st.id as VisualStyle)}
                      className={`w-full p-3 rounded-xl border text-left transition-all flex items-start justify-between gap-3 ${
                        prefs.visualStyle === st.id
                          ? 'bg-slate-50 dark:bg-slate-800 border-slate-700 dark:border-slate-300 ring-2 ring-slate-400/20 shadow-xs'
                          : 'bg-white dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/80 hover:border-slate-300'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900 dark:text-white">{st.label}</span>
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-[9px] font-bold uppercase text-slate-600 dark:text-slate-300">
                            {st.badge}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                          {st.sub}
                        </p>
                      </div>
                      {prefs.visualStyle === st.id && (
                        <span className="w-4 h-4 rounded-full bg-slate-900 text-white dark:bg-white dark:text-slate-900 flex items-center justify-center shrink-0 mt-0.5">
                          <Check size={10} strokeWidth={3} />
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* =========================================================
              ABA 3: FONTES, BOTÕES & GEOMETRIA CORPORATIVA
             ========================================================= */}
          {activeTab === 'typography' && (
            <div className="space-y-6">
              {/* 1. Família Tipográfica (Inspirada nos maiores ERPs) */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Família Tipográfica (ERPs Globais)
                  </h4>
                  <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-200 uppercase">
                    {prefs.fontFamily}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'inter', label: 'Inter', sub: 'SAP Fiori / SaaS', sample: 'Aa 123' },
                    { id: 'jakarta', label: 'Plus Jakarta', sub: 'Odoo Moderno', sample: 'Aa 123' },
                    { id: 'plex', label: 'IBM Plex Sans', sub: 'Oracle Redwood', sample: 'Aa 123' },
                    { id: 'roboto', label: 'Roboto', sub: 'Padrão InfraCore', sample: 'Aa 123' },
                    { id: 'mono', label: 'JetBrains Mono', sub: 'Técnico / Numérico', sample: '01 00' }
                  ].map(f => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => updatePref('fontFamily', f.id as FontMode)}
                      className={`p-3 rounded-xl border text-center transition-all ${
                        prefs.fontFamily === f.id
                          ? 'bg-slate-50 dark:bg-slate-800 border-slate-700 dark:border-slate-300 ring-2 ring-slate-400/20 shadow-xs'
                          : 'bg-white dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/80 hover:border-slate-300'
                      }`}
                    >
                      <div className="text-base font-bold text-slate-800 dark:text-white">{f.sample}</div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white mt-1">{f.label}</div>
                      <div className="text-[10px] text-slate-400 leading-tight">{f.sub}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Formato e Estilo dos Botões (Inspirado em SAP, Oracle e SCADA) */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Estilo e Formato dos Botões
                  </h4>
                  <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-200 uppercase">
                    {prefs.buttonStyle}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    {
                      id: 'fiori-outline',
                      label: 'SAP Fiori (Técnico Outline)',
                      sub: 'Contorno nítido de 1px com cantos sutis (4px), precisão técnica.',
                      badge: 'SAP 4px'
                    },
                    {
                      id: 'redwood-solid',
                      label: 'Oracle Redwood (Sólido Encorpado)',
                      sub: 'Preenchimento marcante de alto contraste e cantos de 8px.',
                      badge: 'Oracle 8px'
                    },
                    {
                      id: 'industrial-sharp',
                      label: 'Industrial Reto (Sharp 0px)',
                      sub: 'Cantos vivos 0px estilo supervisório SCADA e NetSuite.',
                      badge: 'SCADA 0px'
                    },
                    {
                      id: 'modern-soft',
                      label: 'Odoo Modern (Soft Touch)',
                      sub: 'Cantos suaves arredondados (12px) e toque dinâmico.',
                      badge: 'Odoo 12px'
                    }
                  ].map(b => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => updatePref('buttonStyle', b.id as ButtonStyleMode)}
                      className={`p-3 rounded-xl border text-left transition-all flex items-start justify-between gap-2 ${
                        prefs.buttonStyle === b.id
                          ? 'bg-slate-50 dark:bg-slate-800 border-slate-700 dark:border-slate-300 ring-2 ring-slate-400/20 shadow-xs'
                          : 'bg-white dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/80 hover:border-slate-300'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900 dark:text-white">{b.label}</span>
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-[9px] font-bold uppercase text-slate-600 dark:text-slate-300">
                            {b.badge}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                          {b.sub}
                        </p>
                      </div>
                      {prefs.buttonStyle === b.id && (
                        <span className="w-3.5 h-3.5 rounded-full bg-slate-900 text-white dark:bg-white dark:text-slate-900 flex items-center justify-center shrink-0 mt-0.5">
                          <Check size={9} strokeWidth={3} />
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Escala de Texto Global */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Escala de Texto Global
                  </h4>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                    {prefs.textScale === '90' ? 'Compacto (90%)' : prefs.textScale === '110' ? 'Ampliado (110%)' : 'Padrão (100%)'}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: '90', label: 'Compacto', pct: '90%', desc: 'Mais linhas em tabelas' },
                    { id: '100', label: 'Padrão', pct: '100%', desc: 'Equilíbrio ideal' },
                    { id: '110', label: 'Ampliado', pct: '110%', desc: 'Facilidade de leitura' }
                  ].map(s => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => updatePref('textScale', s.id as TextScaleMode)}
                      className={`p-2.5 rounded-xl border text-center transition-all ${
                        prefs.textScale === s.id
                          ? 'bg-slate-50 dark:bg-slate-800 border-slate-700 dark:border-slate-300 ring-2 ring-slate-400/20 shadow-xs font-bold'
                          : 'bg-white dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/80 hover:border-slate-300'
                      }`}
                    >
                      <span className="text-xs font-bold text-slate-900 dark:text-white block">{s.label} ({s.pct})</span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">{s.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 4. Arredondamento dos Cantos (Geometria) */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Arredondamento dos Cantos (Geometria Global)
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'none', label: 'Reto 0px', desc: 'SCADA / NetSuite', radius: 'rounded-none' },
                    { id: 'subtle', label: 'Sutil 4px', desc: 'SAP Fiori', radius: 'rounded-sm' },
                    { id: 'rounded', label: 'Padrão 8px', desc: 'Oracle Redwood', radius: 'rounded-lg' },
                    { id: 'pill', label: 'Pílula 16px', desc: 'Odoo Moderno', radius: 'rounded-2xl' }
                  ].map(r => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => updatePref('borderRadius', r.id as RadiusMode)}
                      className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                        prefs.borderRadius === r.id
                          ? 'bg-slate-50 dark:bg-slate-800 border-slate-700 dark:border-slate-300 ring-2 ring-slate-400/20 shadow-xs'
                          : 'bg-white dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/80 hover:border-slate-300'
                      }`}
                    >
                      <div className={`w-8 h-5 border-2 border-slate-400 ${r.radius} bg-slate-200 dark:bg-slate-700`} />
                      <span className="text-[11px] font-bold text-slate-900 dark:text-white">{r.label}</span>
                      <span className="text-[9px] text-slate-400 leading-none">{r.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 5. Sombras dos Cartões */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Profundidade das Sombras (Elevation)
                </h4>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'none', label: 'Sem Sombra', desc: 'Plano (Flat / SAP)' },
                    { id: 'soft', label: 'Sombra Suave', desc: 'Padrão Corporativo' },
                    { id: 'strong', label: 'Pronunciada', desc: 'Profundidade 3D' }
                  ].map(sh => (
                    <button
                      key={sh.id}
                      type="button"
                      onClick={() => updatePref('cardShadow', sh.id as CardShadowMode)}
                      className={`p-2.5 rounded-xl border text-center transition-all ${
                        prefs.cardShadow === sh.id
                          ? 'bg-slate-50 dark:bg-slate-800 border-slate-700 dark:border-slate-300 ring-2 ring-slate-400/20 shadow-xs'
                          : 'bg-white dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/80 hover:border-slate-300'
                      }`}
                    >
                      <span className="text-xs font-bold text-slate-900 dark:text-white block">{sh.label}</span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">{sh.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* =========================================================
              ABA 4: NAVEGAÇÃO & ESPAÇAMENTO
             ========================================================= */}
          {activeTab === 'navigation' && (
            <div className="space-y-5">
              {/* Formato de Navegação */}
              <div className="space-y-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
                  Modo de Navegação Principal
                </h4>
                <div className="space-y-2">
                  {[
                    {
                      id: 'classic',
                      label: 'Menu Topo Clássico (Original)',
                      desc: 'Abas horizontais no cabeçalho superior. Mantém 100% da estrutura padrão.',
                      icon: <LayoutDashboard size={16} />
                    },
                    {
                      id: 'sidebar',
                      label: 'Sidebar Lateral Esquerda',
                      desc: 'Barra lateral vertical com botão de recolhimento para modo ícones compactos.',
                      icon: <PanelLeft size={16} />
                    },
                    {
                      id: 'dual-deck',
                      label: 'Topo Duplo com Telemetria (Dual-Deck)',
                      desc: '2 andares no topo com atalhos, módulo ativo e telemetria de produção.',
                      icon: <Layers size={16} />
                    },
                    {
                      id: 'floating-dock',
                      label: 'Dock Flutuante Inferior',
                      desc: 'Barra flutuante moderna no rodapé da página estilo macOS/iPadOS.',
                      icon: <Activity size={16} />
                    }
                  ].map(m => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => updatePref('navMode', m.id as NavMode)}
                      className={`w-full p-3 rounded-2xl border text-left transition-all flex items-start justify-between gap-3 ${
                        prefs.navMode === m.id
                          ? 'bg-slate-50 dark:bg-slate-800 border-cyan-500 ring-2 ring-cyan-500/30 shadow-md'
                          : 'bg-white dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/80 hover:border-slate-300'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-cyan-600 dark:text-cyan-400">{m.icon}</span>
                          <span className="text-xs font-bold text-slate-900 dark:text-white">{m.label}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                          {m.desc}
                        </p>
                      </div>
                      {prefs.navMode === m.id && (
                        <span className="p-1 rounded-full bg-cyan-600 text-white shrink-0 mt-0.5">
                          <Check size={12} />
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Densidade de Interface */}
              <div className="space-y-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
                  Densidade de Espaçamento
                </h4>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'compact', label: 'Compacta', desc: 'Paddings reduzidos, mais dados' },
                    { id: 'standard', label: 'Padrão', desc: 'Equilíbrio corporativo' },
                    { id: 'comfortable', label: 'Confortável', desc: 'Mais respiro e espaço' }
                  ].map(d => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => updatePref('density', d.id as DensityMode)}
                      className={`p-2.5 rounded-2xl border text-center transition-all ${
                        prefs.density === d.id
                          ? 'bg-slate-50 dark:bg-slate-800 border-cyan-500 ring-2 ring-cyan-500/30 shadow-md font-bold'
                          : 'bg-white dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/80 hover:border-slate-300'
                      }`}
                    >
                      <span className="text-xs font-bold text-slate-900 dark:text-white block">{d.label}</span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">{d.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Largura da Tela */}
              <div className="space-y-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
                  Enquadramento da Largura da Tela
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => updatePref('containerWidth', '1600')}
                    className={`p-3 rounded-2xl border text-left transition-all flex items-center justify-between ${
                      prefs.containerWidth === '1600'
                        ? 'bg-slate-50 dark:bg-slate-800 border-cyan-500 ring-2 ring-cyan-500/30 shadow-md'
                        : 'bg-white dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/80 hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
                        <Minimize2 size={14} /> 1600px Confinado
                      </div>
                      <span className="text-[10px] text-slate-400">Padrão seguro e centrado</span>
                    </div>
                    {prefs.containerWidth === '1600' && <Check size={14} className="text-cyan-600" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => updatePref('containerWidth', 'full')}
                    className={`p-3 rounded-2xl border text-left transition-all flex items-center justify-between ${
                      prefs.containerWidth === 'full'
                        ? 'bg-slate-50 dark:bg-slate-800 border-cyan-500 ring-2 ring-cyan-500/30 shadow-md'
                        : 'bg-white dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/80 hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
                        <Maximize2 size={14} /> 100% Tela Cheia
                      </div>
                      <span className="text-[10px] text-slate-400">Monitores UltraWide / 4K</span>
                    </div>
                    {prefs.containerWidth === 'full' && <Check size={14} className="text-cyan-600" />}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================
              ABA 5: PRESETS PRONTOS (1-CLICK)
             ========================================================= */}
          {activeTab === 'presets' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Perfis Corporativos Prontos (1-Clique)
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Combinações equilibradas e testadas para diferentes cenários de trabalho.
                </p>
              </div>

              <div className="space-y-2.5">
                {DESIGNER_PRESETS.map(preset => {
                  const isActive = prefs.activePreset === preset.id;
                  return (
                    <div
                      key={preset.id}
                      className={`p-3.5 rounded-xl border transition-all flex flex-col gap-2.5 ${
                        isActive
                          ? 'bg-slate-50 dark:bg-slate-800/90 border-slate-700 dark:border-slate-300 ring-2 ring-slate-400/20 shadow-xs'
                          : 'bg-white dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/80 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-mono text-[11px] font-bold flex items-center justify-center shrink-0">
                            {preset.badge.slice(0, 3).toUpperCase()}
                          </span>
                          <div>
                            <div className="flex items-center gap-2">
                              <h5 className="text-xs font-bold text-slate-900 dark:text-white">
                                {preset.name}
                              </h5>
                              <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-[9px] font-bold uppercase text-slate-600 dark:text-slate-300">
                                {preset.badge}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                              {preset.tagline}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700/60">
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                          <span>{preset.prefs.accent}</span> • 
                          <span>{preset.prefs.theme}</span> • 
                          <span>{preset.prefs.density}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => applyPreset(preset)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                            isActive
                              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                              : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700'
                          }`}
                        >
                          {isActive ? (
                            <>
                              <Check size={11} strokeWidth={3} /> Ativo
                            </>
                          ) : (
                            <>
                              Aplicar <ChevronRight size={12} />
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* =========================================================
              ABA 6: RECURSOS EXTRAS & AJUSTES
             ========================================================= */}
          {activeTab === 'telemetry' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Recursos Complementares de Interface
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Controles de acessibilidade, densidade e ferramentas de tela.
                </p>
              </div>

              <div className="space-y-2.5">
                {/* Fixar Barra de Personalização Superior */}
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <div className="space-y-0.5 pr-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">
                      Barra Rápida Superior no Topo
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                      Exibe atalhos compactos de visual permanentemente acima do cabeçalho.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => updatePref('showCustomizerBar', !prefs.showCustomizerBar)}
                    className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${
                      prefs.showCustomizerBar ? 'bg-slate-900 dark:bg-white' : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                  >
                    <span
                      className={`block w-4 h-4 rounded-full bg-white dark:bg-slate-900 shadow-xs transform transition-transform ${
                        prefs.showCustomizerBar ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Telemetria Industrial ao Vivo */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <div className="space-y-0.5 pr-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">
                      Fita de Telemetria Industrial COI
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                      Exibe o status em tempo real de usinas operando, frotas e saldo no topo da tela.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => updatePref('showLiveTelemetry', !prefs.showLiveTelemetry)}
                    className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ${
                      prefs.showLiveTelemetry ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                  >
                    <span
                      className={`block w-4 h-4 rounded-full bg-white shadow-md transform transition-transform ${
                        prefs.showLiveTelemetry ? 'translate-x-7' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Efeito Vidro Backdrop Blur */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <div className="space-y-0.5 pr-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">
                      Efeito de Vidro Fosco (Backdrop Blur)
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                      Habilita desfoque estético suave em cabeçalhos e janelas flutuantes.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => updatePref('backdropBlur', !prefs.backdropBlur)}
                    className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${
                      prefs.backdropBlur ? 'bg-slate-900 dark:bg-white' : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                  >
                    <span
                      className={`block w-4 h-4 rounded-full bg-white dark:bg-slate-900 shadow-xs transform transition-transform ${
                        prefs.backdropBlur ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Redução de Movimento / Performance Extrema */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <div className="space-y-0.5 pr-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">
                      Modo Performance (Sem Animações)
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                      Desativa animações e transições para aceleração em máquinas mais lentas.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => updatePref('reduceMotion', !prefs.reduceMotion)}
                    className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${
                      prefs.reduceMotion ? 'bg-slate-900 dark:bg-white' : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                  >
                    <span
                      className={`block w-4 h-4 rounded-full bg-white dark:bg-slate-900 shadow-xs transform transition-transform ${
                        prefs.reduceMotion ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Rodapé Fixo do Studio */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/90 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={resetToOriginalLayout}
            className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-rose-600 hover:border-rose-400 text-xs font-bold flex items-center gap-1.5 transition-colors"
            title="Restaurar layout original de fábrica sem perder dados"
          >
            <RotateCcw size={14} />
            <span>Restaurar Original</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs hover:bg-slate-800 dark:hover:bg-slate-100 shadow-sm flex items-center gap-1.5 transition-all"
          >
            <Check size={14} strokeWidth={2.5} />
            <span>Pronto / Salvar</span>
          </button>
        </div>
      </aside>
    </div>
  );
};

export default LayoutDesignerDrawer;
