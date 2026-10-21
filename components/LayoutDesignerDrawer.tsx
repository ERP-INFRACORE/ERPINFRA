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
export type FontMode = 'roboto' | 'inter' | 'mono';
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
  showCustomizerBar: true,
  sidebarCollapsed: false,
  borderRadius: 'rounded',
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
    name: 'Azul InfraCore (Original)',
    category: 'Oficial',
    colorHex: '#0284c7',
    badgeClass: 'bg-cyan-600 text-white',
    dotClass: 'bg-cyan-500',
    navClass: 'bg-slate-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400 font-bold',
    borderClass: 'border-cyan-500',
    ringClass: 'ring-cyan-500',
    description: 'Tom corporativo confiável e equilibrado, padrão de engenharia'
  },
  {
    id: 'indigo',
    name: 'Índigo Executivo',
    category: 'Corporativo',
    colorHex: '#4f46e5',
    badgeClass: 'bg-indigo-600 text-white',
    dotClass: 'bg-indigo-500',
    navClass: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 font-bold',
    borderClass: 'border-indigo-500',
    ringClass: 'ring-indigo-500',
    description: 'Elegância executiva, perfeito para finanças e relatórios'
  },
  {
    id: 'emerald',
    name: 'Esmeralda Sustentável',
    category: 'Agro & Eco',
    colorHex: '#059669',
    badgeClass: 'bg-emerald-600 text-white',
    dotClass: 'bg-emerald-500',
    navClass: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 font-bold',
    borderClass: 'border-emerald-500',
    ringClass: 'ring-emerald-500',
    description: 'Produção sustentável, agronegócio e foco ecológico'
  },
  {
    id: 'amber',
    name: 'Âmbar Industrial',
    category: 'Usinas & Máquinas',
    colorHex: '#d97706',
    badgeClass: 'bg-amber-500 text-slate-950 font-bold',
    dotClass: 'bg-amber-500',
    navClass: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 font-bold',
    borderClass: 'border-amber-500',
    ringClass: 'ring-amber-500',
    description: 'Mineração, usinas pesadas, frota e britagem'
  },
  {
    id: 'violet',
    name: 'Violeta Tecnológico',
    category: 'Tech & IA',
    colorHex: '#7c3aed',
    badgeClass: 'bg-violet-600 text-white',
    dotClass: 'bg-violet-500',
    navClass: 'bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300 font-bold',
    borderClass: 'border-violet-500',
    ringClass: 'ring-violet-500',
    description: 'Análise de dados, inteligência artificial e modernidade'
  },
  {
    id: 'rose',
    name: 'Rosa Quartzo',
    category: 'Design & Suave',
    colorHex: '#f43f5e',
    badgeClass: 'bg-rose-500 text-white',
    dotClass: 'bg-rose-500',
    navClass: 'bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300 font-bold',
    borderClass: 'border-rose-500',
    ringClass: 'ring-rose-500',
    description: 'Estética contemporânea com contraste nítido e suave'
  },
  {
    id: 'crimson',
    name: 'Carmesim Operacional',
    category: 'Urgência & Pátio',
    colorHex: '#b91c1c',
    badgeClass: 'bg-red-700 text-white',
    dotClass: 'bg-red-600',
    navClass: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300 font-bold',
    borderClass: 'border-red-600',
    ringClass: 'ring-red-600',
    description: 'Alta intensidade e energia para pátios logísticos'
  },
  {
    id: 'slate',
    name: 'Titânio Monocromo',
    category: 'Minimalista',
    colorHex: '#475569',
    badgeClass: 'bg-slate-700 text-white',
    dotClass: 'bg-slate-600',
    navClass: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100 font-bold',
    borderClass: 'border-slate-600',
    ringClass: 'ring-slate-500',
    description: 'Visual sóbrio, cinza ardósia neutro e zero distrações'
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
    id: 'original',
    name: 'InfraCore Clássico (Original)',
    tagline: 'Layout corporativo padrão de fábrica, equilibrado, claro e com abas no topo.',
    icon: '🏢',
    badge: 'Padrão',
    prefs: {
      navMode: 'classic',
      visualStyle: 'original',
      density: 'standard',
      containerWidth: '1600',
      accent: 'cyan',
      theme: 'light',
      borderRadius: 'rounded',
      fontFamily: 'roboto',
      textScale: '100',
      cardShadow: 'soft',
      backdropBlur: true,
      reduceMotion: false,
      showLiveTelemetry: false
    }
  },
  {
    id: 'scada-industrial',
    name: 'Chão de Usina & SCADA',
    tagline: 'Painel escuro de centro de operações industriais com telemetria ao vivo e acento âmbar.',
    icon: '🏭',
    badge: 'Industrial COI',
    prefs: {
      navMode: 'dual-deck',
      visualStyle: 'scada',
      density: 'compact',
      containerWidth: 'full',
      accent: 'amber',
      theme: 'dark',
      borderRadius: 'none',
      fontFamily: 'mono',
      textScale: '100',
      cardShadow: 'none',
      backdropBlur: false,
      reduceMotion: true,
      showLiveTelemetry: true
    }
  },
  {
    id: 'boardroom-executive',
    name: 'Diretoria & Boardroom',
    tagline: 'Vidro bento glass moderno com azul índigo executivo e espaçamento confortável.',
    icon: '👔',
    badge: 'Executivo',
    prefs: {
      navMode: 'classic',
      visualStyle: 'bento-glass',
      density: 'comfortable',
      containerWidth: '1600',
      accent: 'indigo',
      theme: 'light',
      borderRadius: 'pill',
      fontFamily: 'inter',
      textScale: '100',
      cardShadow: 'soft',
      backdropBlur: true,
      reduceMotion: false,
      showLiveTelemetry: false
    }
  },
  {
    id: 'high-speed-ops',
    name: 'Faturamento de Alta Velocidade',
    tagline: 'Menu lateral recolhível e densidade compacta para digitação ultra rápida em tela cheia.',
    icon: '⚡',
    badge: 'Produtividade',
    prefs: {
      navMode: 'sidebar',
      visualStyle: 'minimal-flat',
      density: 'compact',
      containerWidth: 'full',
      accent: 'cyan',
      theme: 'light',
      borderRadius: 'subtle',
      fontFamily: 'roboto',
      textScale: '90',
      cardShadow: 'none',
      backdropBlur: false,
      reduceMotion: true,
      showLiveTelemetry: false
    }
  },
  {
    id: 'night-shift-oled',
    name: 'Turno Noturno OLED Puro',
    tagline: 'Fundo preto absoluto (#000000) com acento esmeralda suave para descanso ocular.',
    icon: '🌙',
    badge: 'OLED Black',
    prefs: {
      navMode: 'floating-dock',
      visualStyle: 'bento-glass',
      density: 'standard',
      containerWidth: '1600',
      accent: 'emerald',
      theme: 'oled',
      borderRadius: 'rounded',
      fontFamily: 'inter',
      textScale: '100',
      cardShadow: 'soft',
      backdropBlur: true,
      reduceMotion: false,
      showLiveTelemetry: true
    }
  },
  {
    id: 'accessibility-pro',
    name: 'Acessibilidade & Leitura',
    tagline: 'Texto ampliado (110%), bordas destacadas e alto contraste para operadores à distância.',
    icon: '👓',
    badge: 'Acessibilidade',
    prefs: {
      navMode: 'classic',
      visualStyle: 'original',
      density: 'comfortable',
      containerWidth: '1600',
      accent: 'indigo',
      theme: 'high-contrast',
      borderRadius: 'subtle',
      fontFamily: 'roboto',
      textScale: '110',
      cardShadow: 'strong',
      backdropBlur: false,
      reduceMotion: true,
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
              <div className="p-2.5 rounded-2xl bg-gradient-to-br from-cyan-500 to-indigo-600 text-white shadow-md flex items-center justify-center">
                <Palette size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-black uppercase tracking-tight font-display">
                    Studio de Designer & Layout
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[9px] font-black uppercase tracking-wider">
                    v2.5
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Personalização visual, paleta de cores, ergonomia e layouts
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
                    ? 'bg-cyan-500 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
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
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
                    Paleta de Cores Primárias (Accent)
                  </h4>
                  <span className="text-[11px] font-bold text-cyan-600 dark:text-cyan-400">
                    {currentAccent.name}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Define a cor dos botões primários, badges de destaque, abas ativas e realces do sistema.
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
                      className={`p-3 rounded-2xl border text-left transition-all relative flex flex-col justify-between gap-2 ${
                        isSelected
                          ? 'bg-slate-50 dark:bg-slate-800/90 border-cyan-500 ring-2 ring-cyan-500/30 shadow-md'
                          : 'bg-white dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2.5">
                          <span
                            className="w-5 h-5 rounded-full shadow-inner ring-2 ring-white dark:ring-slate-900 shrink-0"
                            style={{ backgroundColor: acc.colorHex }}
                          />
                          <span className="text-xs font-black text-slate-900 dark:text-white leading-tight">
                            {acc.name}
                          </span>
                        </div>
                        {isSelected && (
                          <span className="w-5 h-5 rounded-full bg-cyan-600 text-white flex items-center justify-center shrink-0">
                            <Check size={12} strokeWidth={3} />
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-2">
                        {acc.description}
                      </p>
                      <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-700/50 text-[10px]">
                        <span className="text-slate-400 font-mono">{acc.colorHex}</span>
                        <span className="font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          {acc.category}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Live Preview Box */}
              <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Pré-visualização do Acento no ERP:
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`${currentAccent.badgeClass} px-3 py-1.5 rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5`}>
                    <Sparkles size={13} /> Botão Primário Ativo
                  </span>
                  <span className={`${currentAccent.navClass} px-3 py-1.5 rounded-xl text-xs border border-transparent`}>
                    Aba de Módulo Selecionada
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
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
                    Modo de Iluminação (Aparência)
                  </h4>
                  <span className="text-[11px] font-bold text-cyan-600 dark:text-cyan-400 uppercase">
                    {prefs.theme}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'light', label: 'Modo Claro', sub: 'Padrão corporativo diurno', icon: <Sun size={15} className="text-amber-500" /> },
                    { id: 'dark', label: 'Escuro Ardósia', sub: 'Slate moderno elegante', icon: <Moon size={15} className="text-indigo-400" /> },
                    { id: 'oled', label: 'OLED Pitch Black', sub: 'Preto puro absoluto (#000)', icon: <Monitor size={15} className="text-emerald-400" /> },
                    { id: 'high-contrast', label: 'Alto Contraste', sub: 'Máxima distinção e foco', icon: <Contrast size={15} className="text-cyan-400" /> }
                  ].map(th => (
                    <button
                      key={th.id}
                      type="button"
                      onClick={() => updatePref('theme', th.id as ThemeMode)}
                      className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between gap-1.5 ${
                        prefs.theme === th.id
                          ? 'bg-slate-50 dark:bg-slate-800 border-cyan-500 ring-2 ring-cyan-500/30 shadow-md'
                          : 'bg-white dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/80 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {th.icon}
                          <span className="text-xs font-bold text-slate-900 dark:text-white">{th.label}</span>
                        </div>
                        {prefs.theme === th.id && <Check size={14} className="text-cyan-600 dark:text-cyan-400" />}
                      </div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">{th.sub}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Estilo Visual de Superfície */}
              <div className="space-y-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
                  Estilo Visual dos Cartões & Superfícies
                </h4>
                <div className="space-y-2">
                  {[
                    {
                      id: 'original',
                      label: 'Original Corporativo (Padrão)',
                      sub: 'Superfícies limpas, sombras sutis e contraste clássico do InfraCore.',
                      badge: 'Original'
                    },
                    {
                      id: 'scada',
                      label: 'Industrial SCADA / Chão de Fábrica',
                      sub: 'Inspirado em painéis supervisórios industriais (COI), fundo técnico e dados em destaque.',
                      badge: 'Industrial'
                    },
                    {
                      id: 'bento-glass',
                      label: 'Bento Glass (Acrílico Translúcido)',
                      sub: 'Gradiente suave de fundo, reflexos translúcidos e bordas refinadas estilo Bento Grid.',
                      badge: 'Moderno'
                    },
                    {
                      id: 'minimal-flat',
                      label: 'Minimalista Flat (Alto Foco)',
                      sub: 'Sem sombras, bordas de 1px minimalistas e foco absoluto no fluxo de trabalho ágil.',
                      badge: 'Flat'
                    },
                    {
                      id: 'soft-neumorphic',
                      label: 'Neumorphism Suave',
                      sub: 'Sombras duplas suaves em relevo com toque ergonômico contemporâneo.',
                      badge: 'Soft UI'
                    }
                  ].map(st => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => updatePref('visualStyle', st.id as VisualStyle)}
                      className={`w-full p-3.5 rounded-2xl border text-left transition-all flex items-start justify-between gap-3 ${
                        prefs.visualStyle === st.id
                          ? 'bg-slate-50 dark:bg-slate-800 border-cyan-500 ring-2 ring-cyan-500/30 shadow-md'
                          : 'bg-white dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/80 hover:border-slate-300'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900 dark:text-white">{st.label}</span>
                          <span className="px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700 text-[9px] font-black uppercase text-slate-600 dark:text-slate-300">
                            {st.badge}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                          {st.sub}
                        </p>
                      </div>
                      {prefs.visualStyle === st.id && (
                        <span className="p-1 rounded-full bg-cyan-600 text-white shrink-0 mt-0.5">
                          <Check size={12} />
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* =========================================================
              ABA 3: TIPOGRAFIA, GEOMETRIA E BORDAS
             ========================================================= */}
          {activeTab === 'typography' && (
            <div className="space-y-5">
              {/* Família Tipográfica */}
              <div className="space-y-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
                  Família da Fonte
                </h4>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'roboto', label: 'Roboto', sub: 'Padrão ERP', sample: 'Aa 123' },
                    { id: 'inter', label: 'Inter / Sans', sub: 'Moderno', sample: 'Aa 123' },
                    { id: 'mono', label: 'SCADA Mono', sub: 'Técnico', sample: '01 00' },
                  ].map(f => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => updatePref('fontFamily', f.id as FontMode)}
                      className={`p-3 rounded-2xl border text-center transition-all ${
                        prefs.fontFamily === f.id
                          ? 'bg-slate-50 dark:bg-slate-800 border-cyan-500 ring-2 ring-cyan-500/30 shadow-md'
                          : 'bg-white dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/80 hover:border-slate-300'
                      }`}
                    >
                      <div className="text-base font-bold text-slate-800 dark:text-white">{f.sample}</div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white mt-1">{f.label}</div>
                      <div className="text-[10px] text-slate-400">{f.sub}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Escala de Texto / Acessibilidade */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
                    Escala de Texto Global
                  </h4>
                  <span className="text-xs font-bold text-cyan-600 dark:text-cyan-400">
                    {prefs.textScale === '90' ? 'Compacto (90%)' : prefs.textScale === '110' ? 'Ampliado (110%)' : 'Padrão (100%)'}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: '90', label: 'Compacto', pct: '90%', desc: 'Mais dados por tela' },
                    { id: '100', label: 'Padrão', pct: '100%', desc: 'Equilíbrio ideal' },
                    { id: '110', label: 'Ampliado', pct: '110%', desc: 'Fácil leitura' }
                  ].map(s => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => updatePref('textScale', s.id as TextScaleMode)}
                      className={`p-2.5 rounded-2xl border text-center transition-all ${
                        prefs.textScale === s.id
                          ? 'bg-slate-50 dark:bg-slate-800 border-cyan-500 ring-2 ring-cyan-500/30 shadow-md font-bold'
                          : 'bg-white dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/80 hover:border-slate-300'
                      }`}
                    >
                      <span className="text-xs font-bold text-slate-900 dark:text-white block">{s.label} ({s.pct})</span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">{s.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Raio das Bordas (Border Radius) */}
              <div className="space-y-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
                  Arredondamento dos Cantos (Geometria)
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'none', label: 'Reto 0px', desc: 'Industrial técnico', radius: 'rounded-none' },
                    { id: 'subtle', label: 'Sutil 6px', desc: 'Discreto corporativo', radius: 'rounded-md' },
                    { id: 'rounded', label: 'Padrão 12px', desc: 'Equilibrado moderno', radius: 'rounded-xl' },
                    { id: 'pill', label: 'Pílula 20px', desc: 'Orgânico curvo', radius: 'rounded-2xl' }
                  ].map(r => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => updatePref('borderRadius', r.id as RadiusMode)}
                      className={`p-2.5 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                        prefs.borderRadius === r.id
                          ? 'bg-slate-50 dark:bg-slate-800 border-cyan-500 ring-2 ring-cyan-500/30 shadow-md'
                          : 'bg-white dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/80 hover:border-slate-300'
                      }`}
                    >
                      <div className={`w-10 h-6 border-2 border-slate-400 ${r.radius} bg-slate-200 dark:bg-slate-700`} />
                      <span className="text-[11px] font-bold text-slate-900 dark:text-white">{r.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Sombras dos Cartões */}
              <div className="space-y-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
                  Profundidade das Sombras (Elevation)
                </h4>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'none', label: 'Sem Sombra', desc: 'Plano (Flat)' },
                    { id: 'soft', label: 'Sombra Suave', desc: 'Padrão sutil' },
                    { id: 'strong', label: 'Pronunciada', desc: 'Profundidade 3D' }
                  ].map(sh => (
                    <button
                      key={sh.id}
                      type="button"
                      onClick={() => updatePref('cardShadow', sh.id as CardShadowMode)}
                      className={`p-2.5 rounded-2xl border text-center transition-all ${
                        prefs.cardShadow === sh.id
                          ? 'bg-slate-50 dark:bg-slate-800 border-cyan-500 ring-2 ring-cyan-500/30 shadow-md'
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
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
                  Perfis de Designer Prontos (1-Clique)
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Selecione uma combinação profissional pronta testada para diferentes perfis de uso no ERP.
                </p>
              </div>

              <div className="space-y-2.5">
                {DESIGNER_PRESETS.map(preset => {
                  const isActive = prefs.activePreset === preset.id;
                  return (
                    <div
                      key={preset.id}
                      className={`p-3.5 rounded-2xl border transition-all flex flex-col gap-2.5 ${
                        isActive
                          ? 'bg-slate-50 dark:bg-slate-800/90 border-cyan-500 ring-2 ring-cyan-500/30 shadow-md'
                          : 'bg-white dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/80 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <span className="text-2xl">{preset.icon}</span>
                          <div>
                            <div className="flex items-center gap-2">
                              <h5 className="text-xs font-black text-slate-900 dark:text-white">
                                {preset.name}
                              </h5>
                              <span className="px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700 text-[9px] font-black uppercase text-slate-600 dark:text-slate-300">
                                {preset.badge}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                              {preset.tagline}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700/60">
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                          <span>{preset.prefs.accent}</span> • 
                          <span>{preset.prefs.theme}</span> • 
                          <span>{preset.prefs.navMode}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => applyPreset(preset)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                            isActive
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-slate-900 text-white dark:bg-cyan-600 hover:bg-slate-800'
                          }`}
                        >
                          {isActive ? (
                            <>
                              <Check size={12} strokeWidth={3} /> Ativo Agora
                            </>
                          ) : (
                            <>
                              Aplicar Perfil <ChevronRight size={13} />
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
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
                  Recursos Complementares de Interface
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Ative ou desative ferramentas visuais avançadas e recursos de performance.
                </p>
              </div>

              <div className="space-y-2.5">
                {/* Fixar Barra de Personalização Superior */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <div className="space-y-0.5 pr-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">
                      Barra Rápida Superior no Topo
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                      Exibe a fita de atalhos rápidos compacta permanentemente acima do cabeçalho.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => updatePref('showCustomizerBar', !prefs.showCustomizerBar)}
                    className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ${
                      prefs.showCustomizerBar ? 'bg-cyan-600' : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                  >
                    <span
                      className={`block w-4 h-4 rounded-full bg-white shadow-md transform transition-transform ${
                        prefs.showCustomizerBar ? 'translate-x-7' : 'translate-x-1'
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
                    className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ${
                      prefs.backdropBlur ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                  >
                    <span
                      className={`block w-4 h-4 rounded-full bg-white shadow-md transform transition-transform ${
                        prefs.backdropBlur ? 'translate-x-7' : 'translate-x-1'
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
                    className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ${
                      prefs.reduceMotion ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                  >
                    <span
                      className={`block w-4 h-4 rounded-full bg-white shadow-md transform transition-transform ${
                        prefs.reduceMotion ? 'translate-x-7' : 'translate-x-1'
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
            className="px-5 py-2 rounded-xl bg-slate-900 dark:bg-cyan-600 text-white font-bold text-xs hover:bg-slate-800 dark:hover:bg-cyan-500 shadow-sm flex items-center gap-1.5 transition-all"
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
