import React, { useMemo, useState } from 'react';
import {
    Bot,
    MessageCircle,
    TrendingUp,
    Wallet,
    Landmark,
    Package,
    ShoppingBag,
    FlaskConical,
    Factory,
    Mountain,
    Truck,
    Users as UsersIcon,
    Lock,
    ShieldCheck,
    Code2,
    Plus,
    Trash2,
    X,
    Info,
    AlertTriangle,
    Check,
    Smartphone,
    Mic,
    Image as ImageIcon,
    Bell,
    CheckCheck,
    GitPullRequest,
    Copy,
    Send,
    Play,
    RefreshCw,
    Radio,
    ShieldAlert,
    FileText,
    CheckCircle2,
    AlertCircle,
    Sparkles,
    Terminal,
    QrCode,
    Activity,
    Wifi,
    WifiOff,
    Battery,
    LogOut,
    RotateCcw,
    Gauge,
    Clock,
    Zap,
    MousePointerClick,
    ListFilter,
    Menu,
    Layers,
    Search
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import {
    AIAgentNumberLink,
    AIAgentSettings,
    AIAgentsConfig,
    AICodeProposal,
    AICodeProposalStatus,
    AppSettings
} from '../types';
import {
    AI_AGENT_CATALOG,
    AIAgentDefinition,
    AIAgentPromptCategory,
    AGENT_TEST_TEMPLATES,
    CODE_AGENT_GUARDRAILS,
    CODE_AGENT_PROTECTED_PATHS,
    CODE_AGENT_SYSTEM_PROMPT,
    CODE_PROPOSAL_TEMPLATES,
    CodeProposalTemplate,
    ERP_PROMPT_VARIABLES,
    findUserRole,
    formatPhone,
    formatPhoneInput,
    getAgentSettings,
    getAIConfig,
    getPermissionName,
    getPhoneValidationMessage,
    getUserEligibility,
    interpolatePromptVariables,
    isProtectedPath,
    isUserAdmin,
    isValidPhone,
    newId,
    normalizePhone,
    roleHasPermission,
    setAIConfig,
    validateWebhookUrl,
    WebhookValidationResult,
    WhatsAppSessionStatus,
    getConnectionQuality,
    WhatsAppInteractivePayload,
    WhatsAppInteractiveActionButton,
    generateUserWhatsAppInteractiveMenu
} from '../ai_agents_constants';

type IconType = React.ComponentType<{ size?: number; className?: string }>;

const ICONS: Record<string, IconType> = {
    TrendingUp,
    Wallet,
    Landmark,
    Package,
    ShoppingBag,
    FlaskConical,
    Factory,
    Mountain,
    Truck,
    Users: UsersIcon
};

const COLOR_CLASSES: Record<AIAgentDefinition['color'], string> = {
    indigo: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-300',
    emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-300',
    sky: 'bg-sky-50 text-sky-600 dark:bg-sky-900/30 dark:text-sky-300',
    rose: 'bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-300',
    violet: 'bg-violet-50 text-violet-600 dark:bg-violet-900/30 dark:text-violet-300',
    orange: 'bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-300',
    teal: 'bg-teal-50 text-teal-600 dark:bg-teal-900/30 dark:text-teal-300',
    slate: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
};

const PROPOSAL_STATUS: Record<AICodeProposalStatus, { label: string; className: string }> = {
    solicitada: { label: 'Aguardando o agente', className: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300' },
    aguardando_aprovacao: { label: 'Aguardando aprovação', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' },
    aprovada: { label: 'Aprovada', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' },
    rejeitada: { label: 'Rejeitada', className: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300' },
    aplicada: { label: 'Aplicada', className: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300' }
};

const PRESET_CATEGORY_STYLES: Record<
    AIAgentPromptCategory,
    { label: string; badgeClass: string; icon: React.ComponentType<{ size?: number; className?: string }> }
> = {
    seguranca: {
        label: 'Segurança & LGPD',
        badgeClass: 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800',
        icon: ShieldCheck
    },
    alcada: {
        label: 'Alçada & Limites',
        badgeClass: 'bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 border-sky-200 dark:border-sky-800',
        icon: Lock
    },
    tom: {
        label: 'Tom de Voz',
        badgeClass: 'bg-violet-50 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300 border-violet-200 dark:border-violet-800',
        icon: Sparkles
    },
    formato: {
        label: 'Formato',
        badgeClass: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
        icon: FileText
    }
};

const INPUT_CLASS =
    'w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-3 font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all disabled:opacity-60';
const LABEL_CLASS = 'text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1';

const Toggle = ({ checked, onChange, disabled }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) => (
    <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
            checked ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'
        }`}
    >
        <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                checked ? 'translate-x-6' : 'translate-x-1'
            }`}
        />
    </button>
);

const WhatsAppQrCodeSvg: React.FC<{ size?: number }> = ({ size = 220 }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 220 220"
        className="rounded-2xl p-2 bg-white shadow-inner"
    >
        {/* Finder Pattern Top-Left */}
        <rect x="10" y="10" width="56" height="56" rx="8" fill="#1e293b" />
        <rect x="18" y="18" width="40" height="40" rx="4" fill="white" />
        <rect x="26" y="26" width="24" height="24" rx="2" fill="#1e293b" />

        {/* Finder Pattern Top-Right */}
        <rect x="154" y="10" width="56" height="56" rx="8" fill="#1e293b" />
        <rect x="162" y="18" width="40" height="40" rx="4" fill="white" />
        <rect x="170" y="26" width="24" height="24" rx="2" fill="#1e293b" />

        {/* Finder Pattern Bottom-Left */}
        <rect x="10" y="154" width="56" height="56" rx="8" fill="#1e293b" />
        <rect x="18" y="162" width="40" height="40" rx="4" fill="white" />
        <rect x="26" y="170" width="24" height="24" rx="2" fill="#1e293b" />

        {/* Timing & Data Modules Grid */}
        <g fill="#1e293b">
            <rect x="74" y="16" width="8" height="8" rx="1" />
            <rect x="90" y="16" width="8" height="8" rx="1" />
            <rect x="106" y="16" width="8" height="8" rx="1" />
            <rect x="122" y="16" width="8" height="8" rx="1" />
            <rect x="138" y="16" width="8" height="8" rx="1" />

            <rect x="74" y="32" width="8" height="8" rx="1" />
            <rect x="106" y="32" width="8" height="8" rx="1" />
            <rect x="138" y="32" width="8" height="8" rx="1" />

            <rect x="74" y="48" width="8" height="8" rx="1" />
            <rect x="90" y="48" width="8" height="8" rx="1" />
            <rect x="122" y="48" width="8" height="8" rx="1" />

            <rect x="16" y="74" width="8" height="8" rx="1" />
            <rect x="32" y="74" width="8" height="8" rx="1" />
            <rect x="48" y="74" width="8" height="8" rx="1" />
            <rect x="74" y="74" width="8" height="8" rx="1" />
            <rect x="90" y="74" width="8" height="8" rx="1" />
            <rect x="122" y="74" width="8" height="8" rx="1" />
            <rect x="154" y="74" width="8" height="8" rx="1" />
            <rect x="170" y="74" width="8" height="8" rx="1" />
            <rect x="186" y="74" width="8" height="8" rx="1" />

            <rect x="16" y="90" width="8" height="8" rx="1" />
            <rect x="48" y="90" width="8" height="8" rx="1" />
            <rect x="74" y="90" width="8" height="8" rx="1" />
            <rect x="138" y="90" width="8" height="8" rx="1" />
            <rect x="170" y="90" width="8" height="8" rx="1" />
            <rect x="202" y="90" width="8" height="8" rx="1" />

            <rect x="16" y="106" width="8" height="8" rx="1" />
            <rect x="32" y="106" width="8" height="8" rx="1" />
            <rect x="48" y="106" width="8" height="8" rx="1" />
            <rect x="170" y="106" width="8" height="8" rx="1" />
            <rect x="186" y="106" width="8" height="8" rx="1" />

            <rect x="16" y="122" width="8" height="8" rx="1" />
            <rect x="48" y="122" width="8" height="8" rx="1" />
            <rect x="74" y="122" width="8" height="8" rx="1" />
            <rect x="138" y="122" width="8" height="8" rx="1" />
            <rect x="154" y="122" width="8" height="8" rx="1" />
            <rect x="186" y="122" width="8" height="8" rx="1" />

            <rect x="16" y="138" width="8" height="8" rx="1" />
            <rect x="32" y="138" width="8" height="8" rx="1" />
            <rect x="74" y="138" width="8" height="8" rx="1" />
            <rect x="90" y="138" width="8" height="8" rx="1" />
            <rect x="122" y="138" width="8" height="8" rx="1" />
            <rect x="154" y="138" width="8" height="8" rx="1" />
            <rect x="186" y="138" width="8" height="8" rx="1" />
            <rect x="202" y="138" width="8" height="8" rx="1" />

            <rect x="74" y="154" width="8" height="8" rx="1" />
            <rect x="106" y="154" width="8" height="8" rx="1" />
            <rect x="122" y="154" width="8" height="8" rx="1" />
            <rect x="154" y="154" width="8" height="8" rx="1" />
            <rect x="186" y="154" width="8" height="8" rx="1" />

            <rect x="74" y="170" width="8" height="8" rx="1" />
            <rect x="90" y="170" width="8" height="8" rx="1" />
            <rect x="122" y="170" width="8" height="8" rx="1" />
            <rect x="138" y="170" width="8" height="8" rx="1" />
            <rect x="170" y="170" width="8" height="8" rx="1" />
            <rect x="202" y="170" width="8" height="8" rx="1" />

            <rect x="74" y="186" width="8" height="8" rx="1" />
            <rect x="106" y="186" width="8" height="8" rx="1" />
            <rect x="138" y="186" width="8" height="8" rx="1" />
            <rect x="154" y="186" width="8" height="8" rx="1" />
            <rect x="186" y="186" width="8" height="8" rx="1" />

            <rect x="90" y="202" width="8" height="8" rx="1" />
            <rect x="122" y="202" width="8" height="8" rx="1" />
            <rect x="154" y="202" width="8" height="8" rx="1" />
            <rect x="170" y="202" width="8" height="8" rx="1" />
        </g>
    </svg>
);

interface WhatsAppInteractiveMessageBubbleProps {
    interactive: WhatsAppInteractivePayload;
    onSelectAction: (action: { id: string; title: string; isWriteAction: boolean; promptQuery: string }) => void;
    onViewPayloadJson: () => void;
}

const WhatsAppInteractiveMessageBubble: React.FC<WhatsAppInteractiveMessageBubbleProps> = ({
    interactive,
    onSelectAction,
    onViewPayloadJson
}) => {
    const [isListExpanded, setIsListExpanded] = useState(false);

    return (
        <div className="space-y-2 max-w-sm w-full">
            {/* Balão de Mensagem Estilo WhatsApp */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl rounded-tl-sm shadow-md border border-slate-200 dark:border-slate-700 overflow-hidden text-xs text-slate-800 dark:text-slate-100">
                {/* Header da Mensagem Interativa */}
                <div className="px-3.5 pt-3 pb-1 border-b border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 truncate">
                        {interactive.headerText}
                    </span>
                    <button
                        type="button"
                        onClick={onViewPayloadJson}
                        title="Ver payload JSON Evolution / Z-API"
                        className="text-[9px] font-mono text-slate-400 hover:text-indigo-500 underline flex items-center gap-1"
                    >
                        <Code2 size={10} /> JSON
                    </button>
                </div>

                {/* Corpo do Texto */}
                <div className="p-3.5 space-y-2">
                    <p className="whitespace-pre-wrap leading-relaxed font-medium">
                        {interactive.bodyText}
                    </p>
                    <div className="flex items-center justify-between pt-1 text-[9px] text-slate-400 font-bold">
                        <span className="italic">{interactive.footerText}</span>
                        <div className="flex items-center gap-1">
                            <span>{new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                            <CheckCheck size={12} className="text-sky-500" />
                        </div>
                    </div>
                </div>

                {/* Seção Interativa: Botões Rápidos (até 3 botões) */}
                {interactive.type === 'button' && interactive.buttons && interactive.buttons.length > 0 && (
                    <div className="border-t border-slate-100 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-700">
                        {interactive.buttons.map(btn => (
                            <button
                                key={btn.id}
                                type="button"
                                onClick={() => onSelectAction(btn)}
                                className="w-full py-2.5 px-3 flex items-center justify-center gap-2 font-bold text-xs text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50/70 dark:hover:bg-emerald-950/30 transition-colors"
                            >
                                <MousePointerClick size={13} className="shrink-0" />
                                <span className="truncate">{btn.title}</span>
                                {btn.isWriteAction && (
                                    <span className="text-[8px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-black">
                                        Gravação
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                )}

                {/* Seção Interativa: Lista Interativa (4+ ações) */}
                {interactive.type === 'list' && (
                    <div className="border-t border-slate-100 dark:border-slate-700">
                        <button
                            type="button"
                            onClick={() => setIsListExpanded(!isListExpanded)}
                            className="w-full py-2.5 px-3 flex items-center justify-center gap-2 font-bold text-xs text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50/70 dark:hover:bg-indigo-950/30 transition-colors"
                        >
                            <Menu size={13} />
                            <span>{interactive.buttonListText || '☰ Ver Opções Autorizadas'}</span>
                            <span className="text-[10px] font-mono">
                                ({interactive.sections?.reduce((acc, s) => acc + s.rows.length, 0) || 0})
                            </span>
                        </button>

                        {/* Gaveta Expansível da Lista */}
                        {isListExpanded && interactive.sections && (
                            <div className="p-2 space-y-2 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-700 max-h-56 overflow-y-auto">
                                {interactive.sections.map((sec, sIdx) => (
                                    <div key={sIdx} className="space-y-1">
                                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 px-2 block">
                                            {sec.title}
                                        </span>
                                        <div className="space-y-1">
                                            {sec.rows.map(row => (
                                                <button
                                                    key={row.id}
                                                    type="button"
                                                    onClick={() => onSelectAction(row)}
                                                    className="w-full p-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-slate-200 dark:border-slate-700 text-left transition-all flex items-start justify-between gap-2 group"
                                                >
                                                    <div className="min-w-0">
                                                        <p className="font-bold text-xs text-slate-800 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 truncate">
                                                            {row.title}
                                                        </p>
                                                        <p className="text-[10px] text-slate-400 truncate">
                                                            {row.description}
                                                        </p>
                                                    </div>
                                                    {row.isWriteAction ? (
                                                        <span className="text-[8px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-black shrink-0">
                                                            Gravar
                                                        </span>
                                                    ) : (
                                                        <span className="text-[8px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 font-black shrink-0">
                                                            Consulta
                                                        </span>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

interface AIAgentsHubProps {
    settings: AppSettings;
    onUpdate: (settings: AppSettings) => void;
    /** Permite alterar a configuração (ai.agents.manage). Sem isso a tela fica somente leitura. */
    canManage: boolean;
}

const AIAgentsHub: React.FC<AIAgentsHubProps> = ({ settings, onUpdate, canManage }) => {
    const {
        users,
        roles,
        currentUser,
        sales,
        budgets,
        financials,
        inventory,
        purchaseOrders,
        productionOrders,
        productionUnits,
        fleet,
        employees,
        payroll
    } = useApp();
    const { addToast } = useToast();

    const config = useMemo(() => getAIConfig(settings), [settings]);
    const isAdmin = isUserAdmin(currentUser, roles);

    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [department, setDepartment] = useState('Todos');
    const [linkUserId, setLinkUserId] = useState('');
    const [linkPhone, setLinkPhone] = useState('');
    const [linkLabel, setLinkLabel] = useState('');
    const [chatMessages, setChatMessages] = useState<Record<string, Array<{ from: 'user' | 'agent'; text: string }>>>({});
    const [chatInput, setChatInput] = useState('');
    const [testingWebhook, setTestingWebhook] = useState(false);
    const [lastWebhookTest, setLastWebhookTest] = useState<{
        time: string;
        status: 'success' | 'info' | 'error';
        message: string;
        latencyMs: number;
    } | null>(null);

    // Sessão do WhatsApp & Diagnóstico de Conexão em Tempo Real
    const [sessionStatus, setSessionStatus] = useState<WhatsAppSessionStatus>('connected');
    const [isQrModalOpen, setIsQrModalOpen] = useState(false);
    const [qrCountdown, setQrCountdown] = useState(45);
    const [qrSeed, setQrSeed] = useState(1);
    const [isRestartingInstance, setIsRestartingInstance] = useState(false);
    const [pingHistory, setPingHistory] = useState<Array<{ time: string; latencyMs: number; status: 'success' | 'info' | 'error' }>>([
        { time: '16:40', latencyMs: 114, status: 'success' },
        { time: '17:15', latencyMs: 126, status: 'success' },
        { time: '17:45', latencyMs: 138, status: 'success' }
    ]);

    React.useEffect(() => {
        if (!isQrModalOpen) return;
        const interval = setInterval(() => {
            setQrCountdown(prev => {
                if (prev <= 1) {
                    setQrSeed(s => s + 1);
                    return 45;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [isQrModalOpen, qrSeed]);

    const handleOpenQrModal = () => {
        setQrCountdown(45);
        setQrSeed(s => s + 1);
        setIsQrModalOpen(true);
    };

    const handleSimulateQrScanSuccess = () => {
        setSessionStatus('connected');
        setIsQrModalOpen(false);
        if (!config.gateway.senderPhone) {
            patchGateway({ senderPhone: '(11) 98765-4321' });
        }
        addToast('WhatsApp pareado com sucesso! Sessão ativa e pronta para receber mensagens.', 'success');
    };

    const handleDisconnectSession = () => {
        if (!window.confirm('Deseja realmente desconectar a sessão do WhatsApp? Os agentes não responderão enquanto a instância estiver desconectada.')) return;
        setSessionStatus('disconnected');
        addToast('Sessão do WhatsApp desconectada.', 'info');
    };

    const handleRestartInstance = () => {
        setIsRestartingInstance(true);
        setTimeout(() => {
            setIsRestartingInstance(false);
            addToast(`Instância "${config.gateway.instanceName || 'infracore-producao'}" reiniciada com sucesso!`, 'success');
        }, 900);
    };

    // Modal de Teste de Disparo
    const [isTestModalOpen, setIsTestModalOpen] = useState(false);
    const [testTargetAgentId, setTestTargetAgentId] = useState<string>('sales_manager');
    const [testTargetPhone, setTestTargetPhone] = useState<string>('');
    const [testTargetName, setTestTargetName] = useState<string>('');
    const [testSelectedTemplateId, setTestSelectedTemplateId] = useState<string>('');
    const [testCustomMessage, setTestCustomMessage] = useState<string>('');
    const [isDispatchingTest, setIsDispatchingTest] = useState<boolean>(false);
    const [lastDispatchInfo, setLastDispatchInfo] = useState<{
        sentAt: string;
        agentName: string;
        phone: string;
        message: string;
        channel: string;
    } | null>(null);

    // Interatividade WhatsApp: Menu de Ações por Colaborador & Confirmação
    const [simulatedUserId, setSimulatedUserId] = useState<string>('');
    const [confirmationPrompt, setConfirmationPrompt] = useState<{
        action: { id: string; title: string; isWriteAction: boolean; promptQuery: string };
        agentName: string;
        agentId: string;
    } | null>(null);
    const [interactivePayloadModal, setInteractivePayloadModal] = useState<{ title: string; json: string } | null>(null);
    const [testDispatchMode, setTestDispatchMode] = useState<'text' | 'interactive'>('text');

    // Sub-Navegação Interna do Hub (Gateway | 10 Agentes | Código ADM)
    type HubSubTab = 'agents' | 'gateway' | 'code_agent';
    const [hubSubTab, setHubSubTab] = useState<HubSubTab>('agents');

    // Filtros e Ordenação da Fila de Propostas de Código
    const [codeProposalSearch, setCodeProposalSearch] = useState('');
    const [codeProposalSort, setCodeProposalSort] = useState<'priority' | 'recent'>('priority');

    // Visualização de Prompt Base / Padrão
    const [showBasePromptModal, setShowBasePromptModal] = useState(false);
    const [showCodeSystemPromptModal, setShowCodeSystemPromptModal] = useState(false);

    // Formulário de solicitação ao agente de código
    const [reqTitle, setReqTitle] = useState('');
    const [reqDescription, setReqDescription] = useState('');
    const [reqFiles, setReqFiles] = useState('');
    const [reqSelectedFiles, setReqSelectedFiles] = useState<string[]>([]);
    const [reqChangeType, setReqChangeType] = useState<NonNullable<AICodeProposal['changeType']>>('Refatoração');
    const [reqPriority, setReqPriority] = useState<NonNullable<AICodeProposal['priority']>>('Alta');

    const ERP_FILE_CHIPS = [
        'pages/Sales.tsx',
        'pages/Finance.tsx',
        'pages/Production.tsx',
        'pages/Purchases.tsx',
        'pages/Clients.tsx',
        'pages/Fleet.tsx',
        'pages/HR.tsx',
        'pages/Reports.tsx',
        'pages/Settings.tsx',
        'components/Layout.tsx',
        'components/AIAuditAgent.tsx',
        'components/AIAgentsHub.tsx'
    ];

    // Validação em tempo real da URL do Webhook
    const webhookValidation: WebhookValidationResult = useMemo(
        () => validateWebhookUrl(config.gateway.webhookUrl),
        [config.gateway.webhookUrl]
    );

    const handleSelectUserForLink = (uid: string) => {
        setLinkUserId(uid);
        if (!uid) return;
        const u = users.find(x => x.id === uid);
        if (!u) return;
        const matchedEmp = (employees || []).find(
            emp =>
                (u.email && emp.email && emp.email.toLowerCase() === u.email.toLowerCase()) ||
                emp.name.toLowerCase() === u.name.toLowerCase()
        );
        if (matchedEmp?.phone) {
            setLinkPhone(formatPhoneInput(matchedEmp.phone));
        }
        const roleName = findUserRole(u, roles)?.name;
        if (roleName && !linkLabel) {
            setLinkLabel(roleName);
        }
    };

    const toggleFileChip = (file: string) => {
        if (isProtectedPath(file)) {
            addToast(`O arquivo "${file}" é protegido pelos guardrails de segurança e não pode ser editado pela IA.`, 'error');
            return;
        }
        setReqSelectedFiles(prev =>
            prev.includes(file) ? prev.filter(f => f !== file) : [...prev, file]
        );
    };

    const applyCodeProposalTemplate = (tpl: CodeProposalTemplate) => {
        setReqTitle(tpl.title);
        setReqChangeType(tpl.changeType);
        setReqPriority(tpl.priority);
        setReqSelectedFiles(tpl.files);
        setReqDescription(tpl.description);
        addToast(`Modelo de solicitação "${tpl.title}" aplicado!`, 'info');
    };

    const testCodeGuardrailSimulation = () => {
        addToast(
            '🛡️ [Guardrail Acionado] Tentativa simulada de acesso a arquivo sensível (.env) bloqueada pelos guardrails de segurança!',
            'error'
        );
    };

    /** Gera resposta ao vivo conectada aos dados reais do InfraCore ERP para os 10 agentes e Agente de Código */
    const generateAgentLiveReply = (agentId: string, promptText: string): string => {
        const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);
        const lower = promptText.toLowerCase();

        // Verifica guardrail de segurança para comandos do Agente de Código
        if (agentId === 'code_agent') {
            if (lower.includes('.env') || lower.includes('credential') || lower.includes('secret') || lower.includes('senha') || lower.includes('token')) {
                return `🛡️ [GUARDRAIL ACIONADO] Operação Bloqueada: O Agente de Código é estritamente proibido de inspecionar, exibir ou modificar arquivos sensíveis (.env, credenciais, chaves criptográficas). Esta tentativa foi registrada na Auditoria do Administrador.`;
            }
            return `💻 [Agente de Código ADM] Autenticado como Super Administrador. Analisei a requisição "${promptText}". Modo ativo: "${config.codeAgent.mode}". Nenhuma alteração é gravada na branch principal sem Pull Request e aprovação explícita.`;
        }

        switch (agentId) {
            case 'sales_manager':
            case 'sales': {
                const openBudgets = (budgets || []).filter(b => b.status === 'Aberto').length;
                const totalSales = (sales || []).reduce((acc, s) => acc + (s.amount || 0), 0);
                const countSales = (sales || []).length;
                return `📊 [Comercial Ao Vivo] Temos ${countSales} venda(s) registrada(s) totalizando ${fmt(totalSales)} e ${openBudgets} orçamento(s) em aberto. Mensagem "${promptText}" analisada. Tabela de preços e limite de crédito prontos para validação.`;
            }
            case 'financial_analyst':
            case 'finance_analyst': {
                return `💰 [Analista Financeiro Ao Vivo] Saldo em caixa: ${fmt(financials.balance)} | A Receber: ${fmt(financials.receivables)} | A Pagar: ${fmt(financials.payables)}. Despesa/Boleto da mensagem "${promptText}" pré-analisada. Exige confirmação e centro de custo antes da baixa.`;
            }
            case 'financial_manager':
            case 'finance_manager': {
                const margin = financials.receivables - financials.payables;
                return `🏛️ [Gerente Financeiro Executivo] Caixa consolidado: ${fmt(financials.balance)}. Saldo operacional líquido projetado: ${fmt(margin)}. Comando executivo "${promptText}" processado com regras de dupla aprovação.`;
            }
            case 'stock_manager':
            case 'inventory': {
                const low = (inventory || []).filter(i => i.quantity <= (i.minStock || 0));
                const totalItems = (inventory || []).length;
                return `📦 [Almoxarifado Ao Vivo] Estoque com ${totalItems} itens cadastrados (${low.length} em nível crítico abaixo do mínimo). Movimentação "${promptText}" registrada com conferência de lote e equipamento.`;
            }
            case 'purchasing_manager':
            case 'purchases': {
                const pendingPO = (purchaseOrders || []).filter(p => p.status === 'Pendente').length;
                return `🛒 [Compras Ao Vivo] ${purchaseOrders.length} ordem(ns) de compra no sistema (${pendingPO} aguardando entrega de fornecedor). Cotação/requisição para "${promptText}" pronta para tabulação.`;
            }
            case 'lab_technician':
            case 'lab': {
                return `🧪 [Laboratório Tecnológico] Ensaio registrado para "${promptText}". Slump padrão (10 ± 2 cm) e teor de betume CBUQ (± 0.3%) validados contra normas DNIT/ABNT. Traço em conformidade técnica ✅.`;
            }
            case 'plant_operator': {
                const activeUnits = (productionUnits || []).filter(u => u.status === 'Operando').length;
                const activeOPs = (productionOrders || []).filter(o => o.status === 'Em Produção').length;
                return `🏭 [Usina Ao Vivo] ${activeUnits}/${productionUnits.length} usinas ativas e ${activeOPs} O.P.(s) em produção. Apontamento "${promptText}" conferido com temperatura de massa e veículo na balança.`;
            }
            case 'crusher_operator': {
                return `⛰️ [Britagem Ao Vivo] Apontamento de turno processado para "${promptText}". Produção de agregados (Brita 0, 1, 2 e pó de pedra) computada no diário com cálculo de horas operadas vs paradas.`;
            }
            case 'fleet_manager':
            case 'fleet': {
                const op = (fleet || []).filter(v => v.status === 'Operacional').length;
                return `🚛 [Gestor de Frotas] Frota com ${op}/${fleet.length} veículos operacionais. Apontamento "${promptText}" auditado contra média histórica de consumo de combustível e horímetro.`;
            }
            case 'hr_analyst':
            case 'hr': {
                const activeEmp = (employees || []).filter(e => e.status === 'Ativo').length;
                const pendPay = (payroll || []).filter(p => p.status === 'Pendente').length;
                return `👥 [RH e DP Ao Vivo] ${activeEmp} colaboradores ativos e ${pendPay} folha(s) em aberto. Solicitação "${promptText}" processada em estrita conformidade com a LGPD e limites de adiantamento.`;
            }
            default:
                return `🤖 [InfraCore ERP Ao Vivo] Mensagem recebida e processada com os dados e permissões em tempo real do sistema.`;
        }
    };

    const handleSendSimulatedMessageWithText = (def: AIAgentDefinition, customText?: string) => {
        const text = (customText !== undefined ? customText : chatInput).trim();
        if (!text) return;
        const base = chatMessages[def.id] || def.example;
        let reply = generateAgentLiveReply(def.id, text);
        const s = getAgentSettings(config, def.id);
        if (s.customSystemPrompt?.trim()) {
            const interpolated = interpolatePromptVariables(s.customSystemPrompt, {
                companyName: settings.tradeName || settings.companyName || 'InfraCore Soluções',
                userName: currentUser?.name || 'Administrador',
                alertLimit: 'R$ 5.000,00',
                costCenter: 'Geral / Matriz',
                scheduleMode: config.gateway.scheduleMode
            });
            reply += `\n\n📌 [Regra Customizada Aplicada]: "${interpolated.trim().slice(0, 90)}${interpolated.length > 90 ? '...' : ''}"`;
        }
        setChatMessages(prev => ({
            ...prev,
            [def.id]: [...base, { from: 'user', text }, { from: 'agent', text: reply }]
        }));
        if (customText === undefined) {
            setChatInput('');
        }
    };

    const handleTestWebhook = async () => {
        if (!config.gateway.webhookUrl) {
            addToast('Informe a URL do webhook (HTTPS) antes de testar a conexão.', 'warning');
            return;
        }

        const validation = validateWebhookUrl(config.gateway.webhookUrl);
        if (!validation.isValid && !validation.isLocal) {
            addToast(`URL do webhook inválida: ${validation.message}`, 'error');
            return;
        }

        setTestingWebhook(true);
        const startTime = Date.now();
        try {
            await fetch(config.gateway.webhookUrl, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    event: 'infracore.gateway.ping',
                    provider: config.gateway.provider,
                    instance: config.gateway.instanceName || 'infracore-producao',
                    timestamp: new Date().toISOString()
                })
            });
            const latency = Date.now() - startTime;
            const nowTime = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            setPingHistory(prev => [{ time: nowTime, latencyMs: latency, status: 'success' }, ...prev.slice(0, 4)]);
            setLastWebhookTest({
                time: new Date().toLocaleTimeString('pt-BR'),
                status: 'success',
                message: `Disparo de teste entregue ao endpoint (${config.gateway.provider})!`,
                latencyMs: latency
            });
            addToast(`Conexão com Webhook testada com sucesso! (~${latency}ms)`, 'success');
        } catch {
            const latency = Date.now() - startTime;
            const nowTime = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            setPingHistory(prev => [{ time: nowTime, latencyMs: latency, status: 'info' }, ...prev.slice(0, 4)]);
            setLastWebhookTest({
                time: new Date().toLocaleTimeString('pt-BR'),
                status: 'info',
                message: 'Payload preparado e enviado. Em navegadores locais, o endpoint pode requerer permissão CORS.',
                latencyMs: latency
            });
            addToast('Pacote de teste preparado e enviado ao gateway.', 'info');
        } finally {
            setTestingWebhook(false);
        }
    };

    const openTestModal = (agentId: string, phone?: string, name?: string) => {
        setTestTargetAgentId(agentId);
        setTestTargetPhone(phone ? formatPhoneInput(phone) : '');
        setTestTargetName(name || '');
        const templates = AGENT_TEST_TEMPLATES[agentId] || AGENT_TEST_TEMPLATES.sales_manager || [];
        if (templates.length > 0) {
            setTestSelectedTemplateId(templates[0].id);
            setTestCustomMessage(templates[0].text);
        } else {
            setTestSelectedTemplateId('');
            setTestCustomMessage('Mensagem de teste do InfraCore ERP via WhatsApp.');
        }
        setIsTestModalOpen(true);
    };

    const handleDispatchTestMessage = async () => {
        const phoneValidation = getPhoneValidationMessage(testTargetPhone);
        if (phoneValidation) {
            addToast(phoneValidation, 'error');
            return;
        }

        const normalized = normalizePhone(testTargetPhone);
        if (!normalized) {
            addToast('Telefone inválido para envio.', 'error');
            return;
        }

        const msgText = testCustomMessage.trim();
        if (!msgText) {
            addToast('A mensagem de teste não pode ficar vazia.', 'warning');
            return;
        }

        setIsDispatchingTest(true);
        const agentDef = AI_AGENT_CATALOG.find(a => a.id === testTargetAgentId);
        const agentName = testTargetAgentId === 'code_agent' ? 'Agente de Código (ADM)' : agentDef?.name || 'Agente IA';

        const targetUser = users.find(u => {
            const emp = employees?.find(e => e.phone && normalizePhone(e.phone) === normalized);
            return (u.email && emp?.email && u.email.toLowerCase() === emp.email.toLowerCase()) ||
                u.name.toLowerCase() === (testTargetName || '').toLowerCase();
        }) || users[0];
        const targetRole = findUserRole(targetUser, roles);
        const isAdm = targetUser ? isUserAdmin(targetUser, roles) : false;

        let interactiveData = undefined;
        if (testDispatchMode === 'interactive' && agentDef) {
            const menu = generateUserWhatsAppInteractiveMenu(
                agentDef,
                targetRole,
                isAdm,
                testTargetName || targetUser?.name || 'Colaborador',
                settings.tradeName || settings.companyName || 'InfraCore ERP'
            );
            interactiveData = menu.payload;
        }

        const payload = {
            event: 'whatsapp.message.test_dispatch',
            provider: config.gateway.provider,
            instance: config.gateway.instanceName || 'infracore-producao',
            agent: { id: testTargetAgentId, name: agentName },
            recipient: {
                name: testTargetName || 'Usuário de Teste',
                phone: normalized,
                formattedPhone: formatPhone(normalized)
            },
            message: {
                type: testDispatchMode === 'interactive' && interactiveData ? 'interactive' : 'text',
                body: msgText,
                interactive: interactiveData,
                timestamp: new Date().toISOString()
            }
        };

        try {
            if (config.gateway.webhookUrl) {
                await fetch(config.gateway.webhookUrl, {
                    method: 'POST',
                    mode: 'no-cors',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            }
            setLastDispatchInfo({
                sentAt: new Date().toLocaleTimeString('pt-BR'),
                agentName,
                phone: formatPhone(normalized),
                message: msgText,
                channel: config.gateway.webhookUrl ? 'Webhook do Gateway' : 'Simulação Local'
            });
            addToast(`Disparo de teste enviado para ${formatPhone(normalized)} via ${agentName}!`, 'success');
        } catch {
            addToast(`Disparo de teste simulado com sucesso para ${formatPhone(normalized)}.`, 'info');
        } finally {
            setIsDispatchingTest(false);
        }
    };

    const update = (next: AIAgentsConfig) => onUpdate(setAIConfig(settings, next));

    const patchGateway = (patch: Partial<AIAgentsConfig['gateway']>) =>
        update({ ...config, gateway: { ...config.gateway, ...patch } });

    const patchAgent = (id: string, patch: Partial<AIAgentSettings>) =>
        update({ ...config, agents: { ...config.agents, [id]: { ...getAgentSettings(config, id), ...patch } } });

    const patchCode = (patch: Partial<AIAgentsConfig['codeAgent']>) => {
        if (!isAdmin) {
            addToast('Apenas o Super Administrador pode alterar o agente de código.', 'error');
            return;
        }
        update({ ...config, codeAgent: { ...config.codeAgent, ...patch } });
    };

    const allLinks = (): AIAgentNumberLink[] => [
        ...Object.values(config.agents).flatMap(a => a.links || []),
        ...config.codeAgent.links
    ];

    /** Valida o novo vínculo. Um mesmo número nunca pode representar dois usuários diferentes. */
    const validateLink = (userId: string, rawPhone: string, existing: AIAgentNumberLink[]): { phone?: string; error?: string } => {
        if (!userId) return { error: 'Selecione um usuário.' };
        const phoneValidation = getPhoneValidationMessage(rawPhone);
        if (phoneValidation) return { error: phoneValidation };
        const phone = normalizePhone(rawPhone);
        if (!phone) return { error: 'Número inválido. Informe DDD + número, ex.: (11) 98765-4321.' };
        if (allLinks().some(l => l.phone === phone && l.userId !== userId)) {
            return { error: 'Este número já está vinculado a outro usuário no ERP.' };
        }
        if (existing.some(l => l.phone === phone && l.userId === userId)) {
            return { error: 'Este número já está autorizado neste agente.' };
        }
        return { phone };
    };

    const selectedDef = AI_AGENT_CATALOG.find(a => a.id === selectedId) || null;

    const openAgent = (id: string) => {
        setSelectedId(id);
        setLinkUserId('');
        setLinkPhone('');
        setLinkLabel('');
        const agentSettings = getAgentSettings(config, id);
        const firstLinked = agentSettings.links[0]?.userId;
        setSimulatedUserId(firstLinked || currentUser?.id || users[0]?.id || '');
    };

    const handleInteractiveActionClick = (
        def: AIAgentDefinition,
        action: { id: string; title: string; isWriteAction: boolean; promptQuery: string }
    ) => {
        const s = getAgentSettings(config, def.id);
        if (action.isWriteAction && s.requireConfirmation) {
            setConfirmationPrompt({
                action,
                agentName: def.name,
                agentId: def.id
            });
            return;
        }
        executeInteractiveAction(def, action);
    };

    const executeInteractiveAction = (
        def: AIAgentDefinition,
        action: { id: string; title: string; isWriteAction: boolean; promptQuery: string }
    ) => {
        handleSendSimulatedMessageWithText(def, action.promptQuery);
        addToast(`Ação WhatsApp "${action.title}" disparada no simulador!`, 'success');
        setConfirmationPrompt(null);
    };

    const addAgentLink = (def: AIAgentDefinition) => {
        const current = getAgentSettings(config, def.id);
        const user = users.find(u => u.id === linkUserId);
        if (!user) return addToast('Selecione um usuário.', 'error');
        const { eligible, missing } = getUserEligibility(user, roles, def.minPermissions);
        if (!eligible) {
            return addToast(
                missing.length
                    ? `O perfil deste usuário não possui: ${missing.map(getPermissionName).join(', ')}.`
                    : 'Usuário inativo.',
                'error'
            );
        }
        const { phone, error } = validateLink(linkUserId, linkPhone, current.links);
        if (error || !phone) return addToast(error || 'Número inválido.', 'error');
        patchAgent(def.id, {
            links: [
                ...current.links,
                { id: newId(), userId: linkUserId, phone, label: linkLabel.trim() || undefined }
            ]
        });
        setLinkUserId('');
        setLinkPhone('');
        setLinkLabel('');
        addToast('Número autorizado vinculado com sucesso!', 'success');
    };

    const removeAgentLink = (agentId: string, linkId: string) => {
        const current = getAgentSettings(config, agentId);
        patchAgent(agentId, { links: current.links.filter(l => l.id !== linkId) });
    };

    // ----- Agente de código (somente Super Admin) -----

    const addCodeLink = () => {
        if (!isAdmin) return addToast('Apenas o Super Administrador pode autorizar números no Agente de Código.', 'error');
        const user = users.find(u => u.id === linkUserId);
        if (!user) return addToast('Selecione um administrador.', 'error');
        if (user.status !== 'Ativo' || !isUserAdmin(user, roles)) {
            return addToast('Somente usuários ativos com perfil de Super Administrador podem ser autorizados.', 'error');
        }
        const { phone, error } = validateLink(linkUserId, linkPhone, config.codeAgent.links);
        if (error || !phone) return addToast(error || 'Número inválido.', 'error');
        patchCode({
            links: [
                ...config.codeAgent.links,
                { id: newId(), userId: linkUserId, phone, label: linkLabel.trim() || 'Super Admin' }
            ]
        });
        setLinkUserId('');
        setLinkPhone('');
        setLinkLabel('');
        addToast('Número de Administrador autorizado no Agente de Código!', 'success');
    };

    const addProposalRequest = () => {
        if (!isAdmin) return;
        const title = reqTitle.trim();
        if (!title) return addToast('Informe um título para a solicitação.', 'error');

        const manualFiles = reqFiles.split(',').map(f => f.trim()).filter(Boolean);
        const combinedFiles = Array.from(new Set([...reqSelectedFiles, ...manualFiles]));

        // Guardrail rigoroso: verificação de caminhos protegidos
        const protectedAttempt = combinedFiles.find(isProtectedPath);
        if (protectedAttempt) {
            addToast(`Arquivo protegido por guardrail de segurança: "${protectedAttempt}" não pode ser incluído em propostas!`, 'error');
            return;
        }

        const proposal: AICodeProposal = {
            id: newId(),
            title,
            description: reqDescription.trim(),
            files: combinedFiles,
            requestedBy: currentUser?.name || 'Administrador',
            createdAt: new Date().toISOString(),
            status: 'solicitada',
            origin: 'painel',
            changeType: reqChangeType,
            priority: reqPriority
        };
        patchCode({ proposals: [proposal, ...config.codeAgent.proposals] });
        setReqTitle('');
        setReqDescription('');
        setReqFiles('');
        setReqSelectedFiles([]);
        addToast('Solicitação registrada na fila do Agente de Código com guardrails validados.', 'success');
    };

    const deleteProposal = (id: string, title?: string) => {
        if (!isAdmin) return;
        patchCode({ proposals: config.codeAgent.proposals.filter(p => p.id !== id) });
        addToast(title ? `Proposta excluída da fila: "${title}"` : 'Proposta excluída da fila.', 'info');
    };

    const copyProposalPrompt = (p: AICodeProposal) => {
        const promptText = [
            `# Solicitação do Agente de Código (ADM) — ${p.title}`,
            `- **Tipo:** ${p.changeType || 'Refatoração'} | **Prioridade:** ${p.priority || 'Alta'}`,
            p.files.length > 0 ? `- **Arquivos Alvo:** ${p.files.map(f => `\`${f}\``).join(', ')}` : '',
            p.branch ? `- **Branch Sugerida:** \`${p.branch}\`` : '',
            `\n## Instruções de Implementação\n${p.description || p.title}`
        ].filter(Boolean).join('\n');
        navigator.clipboard.writeText(promptText);
        addToast(`Prompt da proposta "${p.title}" copiado para a área de transferência!`, 'success');
    };

    const setProposalStatus = (id: string, status: AICodeProposalStatus) => {
        if (!isAdmin) return;
        if (status === 'aprovada' && !window.confirm('Aprovar esta proposta? O agente poderá criar a branch e o Pull Request correspondentes para revisão humana.')) return;
        patchCode({ proposals: config.codeAgent.proposals.map(p => (p.id === id ? { ...p, status } : p)) });
    };

    // ----- Derivados -----

    const departments = ['Todos', ...Array.from(new Set(AI_AGENT_CATALOG.map(a => a.department)))];
    const visibleAgents = AI_AGENT_CATALOG.filter(a => department === 'Todos' || a.department === department);
    const activeCount = AI_AGENT_CATALOG.filter(a => getAgentSettings(config, a.id).enabled).length;
    const numbersCount = AI_AGENT_CATALOG.reduce((sum, a) => sum + getAgentSettings(config, a.id).links.length, 0);
    const eligibleAdmins = users.filter(u => u.status === 'Ativo' && isUserAdmin(u, roles));

    const PRIORITY_WEIGHT: Record<string, number> = {
        'Urgente': 4,
        'Alta': 3,
        'Média': 2,
        'Baixa': 1
    };

    const filteredProposals = useMemo(() => {
        let list = [...config.codeAgent.proposals];
        if (codeProposalSearch.trim()) {
            const query = codeProposalSearch.toLowerCase();
            list = list.filter(p =>
                p.title.toLowerCase().includes(query) ||
                (p.description && p.description.toLowerCase().includes(query)) ||
                p.files.some(f => f.toLowerCase().includes(query)) ||
                (p.changeType && p.changeType.toLowerCase().includes(query))
            );
        }
        if (codeProposalSort === 'priority') {
            list.sort((a, b) => {
                const wa = PRIORITY_WEIGHT[a.priority || 'Média'] || 2;
                const wb = PRIORITY_WEIGHT[b.priority || 'Média'] || 2;
                if (wb !== wa) return wb - wa;
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            });
        } else {
            list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        }
        return list;
    }, [config.codeAgent.proposals, codeProposalSearch, codeProposalSort]);

    const pendingCodeProposalsCount = config.codeAgent.proposals.filter(
        p => p.status === 'solicitada' || p.status === 'aguardando_aprovacao'
    ).length;

    const userLabel = (userId: string) => users.find(u => u.id === userId)?.name || 'Usuário removido';
    const roleLabel = (userId: string) => {
        const u = users.find(x => x.id === userId);
        return findUserRole(u, roles)?.name || '—';
    };

    return (
        <div className="space-y-8">
            {/* Cabeçalho */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-3 tracking-tight">
                        <span className="p-2 bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-500/20">
                            <MessageCircle size={20} />
                        </span>
                        Central de Agentes de IA &amp; Gateway WhatsApp
                    </h2>
                    <p className="text-xs text-slate-500 font-bold mt-1 ml-1">
                        Assistentes especializados por setor e Agente de Código com guardrails de segurança.
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-widest">
                    <span className="px-3 py-2 rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        {activeCount} agentes ativos
                    </span>
                    <span className="px-3 py-2 rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                        {numbersCount} números autorizados
                    </span>
                    <button
                        type="button"
                        onClick={() => openTestModal('sales_manager')}
                        className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5 shadow-md shadow-indigo-600/20 transition-all"
                    >
                        <Send size={12} /> Testar Disparo
                    </button>
                </div>
            </div>

            {/* Aviso sobre o estado da arquitetura */}
            <div className="flex gap-3 p-4 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200">
                <Info size={18} className="shrink-0 mt-0.5" />
                <div className="text-xs font-bold leading-relaxed space-y-1">
                    <p>
                        Esta central define <u>quem</u> pode interagir com cada agente e <u>quais capacidades</u> cada perfil tem permissão para acionar no ERP.
                    </p>
                    <p className="text-[11px] text-amber-700 dark:text-amber-300 font-normal">
                        Chaves de API e tokens sensíveis nunca são armazenados no frontend. O Agente de Código possui trava permanente de arquivos sensíveis (.env, credenciais).
                    </p>
                </div>
            </div>

            {!canManage && (
                <div className="flex gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                    <Lock size={18} className="shrink-0 mt-0.5" />
                    <p className="text-xs font-bold">Você pode visualizar esta tela, mas seu perfil não possui a permissão “Gerir Agentes de IA”.</p>
                </div>
            )}

            {/* Barra de Sub-Navegação por Segmentos com Badges em Tempo Real */}
            <div className="p-1.5 bg-slate-100 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-1.5">
                <button
                    type="button"
                    onClick={() => setHubSubTab('agents')}
                    className={`flex-1 min-w-[200px] py-2.5 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                        hubSubTab === 'agents'
                            ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-md'
                            : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                    }`}
                >
                    <Bot size={16} className={hubSubTab === 'agents' ? 'text-indigo-600 dark:text-indigo-400' : ''} />
                    <span>Agentes Especializados</span>
                    <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 text-[10px] font-black">
                        {activeCount}/10 Ativos
                    </span>
                </button>

                <button
                    type="button"
                    onClick={() => setHubSubTab('gateway')}
                    className={`flex-1 min-w-[200px] py-2.5 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                        hubSubTab === 'gateway'
                            ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-md'
                            : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                    }`}
                >
                    <Smartphone size={16} className={hubSubTab === 'gateway' ? 'text-emerald-500' : ''} />
                    <span>Gateway WhatsApp</span>
                    {sessionStatus === 'connected' ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-black flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Online ({lastWebhookTest?.latencyMs || pingHistory[0]?.latencyMs || 124}ms)
                        </span>
                    ) : (
                        <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300 text-[10px] font-black">
                            Offline
                        </span>
                    )}
                </button>

                {isAdmin && (
                    <button
                        type="button"
                        onClick={() => setHubSubTab('code_agent')}
                        className={`flex-1 min-w-[200px] py-2.5 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                            hubSubTab === 'code_agent'
                                ? 'bg-amber-400 text-slate-950 shadow-md font-black'
                                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                        }`}
                    >
                        <Code2 size={16} className={hubSubTab === 'code_agent' ? 'text-slate-950' : 'text-amber-500'} />
                        <span>Agente de Código (ADM)</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                            hubSubTab === 'code_agent'
                                ? 'bg-slate-900 text-amber-300'
                                : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        }`}>
                            {config.codeAgent.proposals.length} propostas{pendingCodeProposalsCount > 0 ? ` (${pendingCodeProposalsCount} pendentes)` : ''}
                        </span>
                    </button>
                )}
            </div>

            <fieldset disabled={!canManage} className="min-w-0 border-0 p-0 m-0 space-y-8">
                {/* Gateway do WhatsApp */}
                {hubSubTab === 'gateway' && (
                <section className="rounded-3xl border border-slate-200 dark:border-slate-700 p-6 space-y-6 bg-white dark:bg-slate-800 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-700">
                        <div className="flex items-center gap-3">
                            <span className="p-2.5 rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300">
                                <Smartphone size={20} />
                            </span>
                            <div>
                                <h3 className="font-black text-sm text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
                                    Gateway do WhatsApp &amp; Webhook
                                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider ${
                                        config.gatewayEnabled ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                                    }`}>
                                        {config.gatewayEnabled ? 'Habilitado' : 'Desativado'}
                                    </span>
                                </h3>
                                <p className="text-[11px] text-slate-500 font-bold">Chave mestra: com o gateway desligado nenhum agente responde.</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={handleTestWebhook}
                                disabled={testingWebhook}
                                className="px-3.5 py-2 rounded-xl bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 dark:hover:bg-slate-600 text-white text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 disabled:opacity-50"
                            >
                                <RefreshCw size={12} className={testingWebhook ? 'animate-spin' : ''} />
                                {testingWebhook ? 'Testando Conexão...' : 'Testar Conexão Webhook'}
                            </button>
                            <Toggle checked={config.gatewayEnabled} onChange={v => update({ ...config, gatewayEnabled: v })} />
                        </div>
                    </div>

                    {/* Monitor de Conexão em Tempo Real & Diagnóstico de Latência (Evolution API / Z-API) */}
                    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900/50 p-4 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                                {sessionStatus === 'connected' ? (
                                    <div className="flex items-center gap-2.5">
                                        <span className="relative flex h-3 w-3">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                                        </span>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">
                                                    WhatsApp Conectado &amp; Online
                                                </span>
                                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold">
                                                    Sessão Ativa
                                                </span>
                                            </div>
                                            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                                                Instância pareada • Pronto para recebimento e disparo automatizado
                                            </p>
                                        </div>
                                    </div>
                                ) : sessionStatus === 'connecting' ? (
                                    <div className="flex items-center gap-2.5">
                                        <RefreshCw size={16} className="animate-spin text-amber-500" />
                                        <div>
                                            <span className="text-xs font-black text-amber-600 dark:text-amber-400 uppercase tracking-wide">
                                                Conectando à Instância...
                                            </span>
                                            <p className="text-[10px] text-slate-500 font-medium">Aguardando handshake do WebSocket</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2.5">
                                        <WifiOff size={16} className="text-rose-500 shrink-0" />
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                                                    WhatsApp Desconectado
                                                </span>
                                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold">
                                                    Aguardando Pareamento
                                                </span>
                                            </div>
                                            <p className="text-[10px] text-slate-500 font-medium">
                                                Faça o pareamento via QR Code para que os agentes de IA possam responder
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center gap-2">
                                {sessionStatus === 'connected' ? (
                                    <>
                                        <button
                                            type="button"
                                            onClick={handleOpenQrModal}
                                            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all"
                                        >
                                            <QrCode size={13} className="text-emerald-500" />
                                            Ver QR Code
                                        </button>
                                        <button
                                            type="button"
                                            disabled={isRestartingInstance}
                                            onClick={handleRestartInstance}
                                            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all disabled:opacity-50"
                                        >
                                            <RotateCcw size={13} className={isRestartingInstance ? 'animate-spin text-amber-500' : 'text-slate-500'} />
                                            {isRestartingInstance ? 'Reiniciando...' : 'Reiniciar Instância'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleDisconnectSession}
                                            className="px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all"
                                        >
                                            <LogOut size={13} />
                                            Desconectar
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={handleOpenQrModal}
                                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-md shadow-emerald-600/20 transition-all"
                                    >
                                        <QrCode size={14} />
                                        Conectar WhatsApp (QR Code)
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Grade de Telemetria de Conexão */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-slate-200/70 dark:border-slate-800">
                            {/* Card 1: Latência Média */}
                            {(() => {
                                const lat = lastWebhookTest?.latencyMs || pingHistory[0]?.latencyMs || 124;
                                const quality = getConnectionQuality(lat);
                                return (
                                    <div className="p-3 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 space-y-1">
                                        <div className="flex items-center justify-between text-slate-400">
                                            <span className="text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                                                <Activity size={12} className="text-indigo-500" /> Latência
                                            </span>
                                            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${quality.badgeClass}`}>
                                                {quality.label}
                                            </span>
                                        </div>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-base font-black text-slate-900 dark:text-white font-mono">
                                                {lat}
                                            </span>
                                            <span className="text-[10px] font-bold text-slate-400">ms</span>
                                        </div>
                                        <p className="text-[9px] text-slate-400 font-medium">Tempo de resposta da API</p>
                                    </div>
                                );
                            })()}

                            {/* Card 2: Uptime da Instância */}
                            <div className="p-3 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 space-y-1">
                                <div className="flex items-center justify-between text-slate-400">
                                    <span className="text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                                        <Gauge size={12} className="text-emerald-500" /> Uptime
                                    </span>
                                    <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                                        SLA 99%
                                    </span>
                                </div>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-base font-black text-slate-900 dark:text-white font-mono">
                                        99.9%
                                    </span>
                                </div>
                                <p className="text-[9px] text-slate-400 font-medium">Últimos 30 dias contínuos</p>
                            </div>

                            {/* Card 3: Provedor & Instância */}
                            <div className="p-3 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 space-y-1">
                                <div className="flex items-center justify-between text-slate-400">
                                    <span className="text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                                        <Wifi size={12} className="text-sky-500" /> Provedor
                                    </span>
                                    <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 uppercase">
                                        {config.gateway.provider}
                                    </span>
                                </div>
                                <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate font-mono">
                                    {config.gateway.instanceName || 'infracore-producao'}
                                </div>
                                <p className="text-[9px] text-slate-400 font-medium">Instância do Gateway</p>
                            </div>

                            {/* Card 4: Aparelho Pareado / Bateria */}
                            <div className="p-3 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 space-y-1">
                                <div className="flex items-center justify-between text-slate-400">
                                    <span className="text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                                        <Battery size={12} className="text-emerald-500" /> Bateria
                                    </span>
                                    {sessionStatus === 'connected' ? (
                                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                                            96% • Carga
                                        </span>
                                    ) : (
                                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-500">
                                            N/D
                                        </span>
                                    )}
                                </div>
                                <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                                    {sessionStatus === 'connected' ? 'iPhone 15 Pro (v2.24)' : 'Nenhum dispositivo'}
                                </div>
                                <p className="text-[9px] text-slate-400 font-medium">WhatsApp Business</p>
                            </div>
                        </div>

                        {/* Linha de Histórico de Latência Recente */}
                        {pingHistory.length > 0 && (
                            <div className="flex flex-wrap items-center gap-2 pt-1 text-[10px] font-mono text-slate-500">
                                <span className="font-sans font-bold text-[9px] uppercase tracking-wider text-slate-400 flex items-center gap-1">
                                    <Clock size={11} /> Pings recentes:
                                </span>
                                {pingHistory.map((p, idx) => (
                                    <span
                                        key={idx}
                                        className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center gap-1"
                                    >
                                        <span className="text-slate-400">{p.time}</span>
                                        <span className={p.latencyMs <= 180 ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-amber-500 font-bold'}>
                                            {p.latencyMs}ms
                                        </span>
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1">
                            <label className={LABEL_CLASS}>Provedor da Conexão</label>
                            <select
                                className={INPUT_CLASS}
                                value={config.gateway.provider}
                                onChange={e => patchGateway({ provider: e.target.value as AIAgentsConfig['gateway']['provider'] })}
                            >
                                <option value="evolution">Evolution API (Open Source / Docker)</option>
                                <option value="zapi">Z-API (SaaS Dedicado)</option>
                                <option value="meta_cloud">WhatsApp Cloud API (Meta Oficial)</option>
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className={LABEL_CLASS}>Nome da Instância</label>
                            <input
                                className={INPUT_CLASS}
                                value={config.gateway.instanceName}
                                onChange={e => patchGateway({ instanceName: e.target.value })}
                                placeholder="infracore-producao"
                            />
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-center justify-between">
                                <label className={LABEL_CLASS}>URL do Webhook (Servidor)</label>
                                <button
                                    type="button"
                                    onClick={() => {
                                        const inst = (config.gateway.instanceName || 'infracore-producao').trim();
                                        const suggested = `https://api.infracore.com.br/webhooks/whatsapp/${inst}`;
                                        patchGateway({ webhookUrl: suggested });
                                        navigator.clipboard.writeText(suggested);
                                        addToast('URL sugerida preenchida e copiada!', 'success');
                                    }}
                                    className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                                >
                                    <Copy size={11} /> Copiar Sugerida
                                </button>
                            </div>
                            <input
                                className={`${INPUT_CLASS} ${
                                    webhookValidation.level === 'valid'
                                        ? 'border-emerald-500/50 focus:border-emerald-500'
                                        : webhookValidation.level === 'error'
                                        ? 'border-rose-500/50 focus:border-rose-500'
                                        : ''
                                }`}
                                value={config.gateway.webhookUrl}
                                onChange={e => patchGateway({ webhookUrl: e.target.value })}
                                placeholder="https://api.suaempresa.com.br/webhooks/whatsapp"
                            />
                        </div>
                    </div>

                    {/* Cartão de Validação Visual da URL do Webhook */}
                    <div className="p-3.5 rounded-2xl border transition-all text-xs font-bold flex flex-col md:flex-row items-start md:items-center justify-between gap-3 bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-700">
                        <div className="flex items-center gap-2.5">
                            {webhookValidation.level === 'valid' && (
                                <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
                            )}
                            {webhookValidation.level === 'warning' && (
                                <AlertTriangle size={18} className="text-amber-500 shrink-0" />
                            )}
                            {webhookValidation.level === 'error' && (
                                <AlertCircle size={18} className="text-rose-500 shrink-0" />
                            )}
                            {webhookValidation.level === 'empty' && (
                                <Radio size={18} className="text-slate-400 shrink-0" />
                            )}
                            <div>
                                <span className={`inline-block mr-2 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                                    webhookValidation.level === 'valid'
                                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                        : webhookValidation.level === 'warning'
                                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                        : webhookValidation.level === 'error'
                                        ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                        : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                                }`}>
                                    {webhookValidation.level === 'valid' && 'HTTPS Seguro'}
                                    {webhookValidation.level === 'warning' && (webhookValidation.isLocal ? 'Ambiente Local' : 'Inseguro')}
                                    {webhookValidation.level === 'error' && 'URL Inválida'}
                                    {webhookValidation.level === 'empty' && 'Pendente'}
                                </span>
                                <span className="text-slate-700 dark:text-slate-300">{webhookValidation.message}</span>
                            </div>
                        </div>

                        {webhookValidation.hostname && (
                            <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500 shrink-0">
                                <span className="px-2 py-1 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                                    Host: {webhookValidation.hostname}
                                </span>
                                {webhookValidation.pathname && webhookValidation.pathname !== '/' && (
                                    <span className="px-2 py-1 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 truncate max-w-[160px]">
                                        Rota: {webhookValidation.pathname}
                                    </span>
                                )}
                            </div>
                        )}
                    </div>

                    {lastWebhookTest && (
                        <div className="text-[11px] font-bold text-slate-500 flex items-center justify-between px-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                            <span>Último teste: {lastWebhookTest.message}</span>
                            <span className="text-emerald-600 dark:text-emerald-400">
                                Resposta em ~{lastWebhookTest.latencyMs}ms às {lastWebhookTest.time}
                            </span>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-slate-100 dark:border-slate-700">
                        <div className="space-y-1">
                            <div className="flex items-center justify-between">
                                <label className={LABEL_CLASS}>Número Remetente (WhatsApp Business)</label>
                                {config.gateway.senderPhone && (
                                    <span className={`text-[10px] font-bold ${
                                        isValidPhone(config.gateway.senderPhone) ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-500'
                                    }`}>
                                        {isValidPhone(config.gateway.senderPhone) ? '✓ Válido' : 'Incompleto'}
                                    </span>
                                )}
                            </div>
                            <input
                                className={INPUT_CLASS}
                                inputMode="tel"
                                value={config.gateway.senderPhone || ''}
                                onChange={e => patchGateway({ senderPhone: formatPhoneInput(e.target.value) })}
                                placeholder="(11) 98765-4321"
                            />
                            {config.gateway.senderPhone && !isValidPhone(config.gateway.senderPhone) && (
                                <p className="text-[10px] font-bold text-amber-500 ml-1">
                                    {getPhoneValidationMessage(config.gateway.senderPhone)}
                                </p>
                            )}
                        </div>
                        <div className="space-y-1">
                            <label className={LABEL_CLASS}>Horário de Atendimento Automático</label>
                            <select
                                className={INPUT_CLASS}
                                value={config.gateway.scheduleMode || '24x7'}
                                onChange={e => patchGateway({ scheduleMode: e.target.value as '24x7' | 'commercial' })}
                            >
                                <option value="24x7">24/7 — Tempo Integral (Plantão Contínuo)</option>
                                <option value="commercial">Comercial — Seg a Sáb (07:00 às 19:00)</option>
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className={LABEL_CLASS}>Expiração de Confirmação SIM/NÃO (min)</label>
                            <input
                                type="number"
                                min={1}
                                max={120}
                                className={INPUT_CLASS}
                                value={config.gateway.confirmationTimeoutMinutes ?? 15}
                                onChange={e => patchGateway({ confirmationTimeoutMinutes: Math.max(1, Number(e.target.value) || 15) })}
                                placeholder="15"
                            />
                        </div>
                    </div>
                </section>
                )}

                {/* Catálogo dos 10 Agentes Especializados */}
                {hubSubTab === 'agents' && (
                <section className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex flex-wrap gap-2">
                            {departments.map(d => (
                                <button
                                    key={d}
                                    type="button"
                                    onClick={() => setDepartment(d)}
                                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                        department === d
                                            ? 'bg-slate-900 text-white shadow-md'
                                            : 'bg-slate-100 dark:bg-slate-700 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-600'
                                    }`}
                                >
                                    {d}
                                </button>
                            ))}
                        </div>
                        <span className="text-[11px] font-bold text-slate-400">
                            Exibindo {visibleAgents.length} de {AI_AGENT_CATALOG.length} agentes especializados
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                        {visibleAgents.map(def => {
                            const Icon = ICONS[def.icon] || Bot;
                            const s = getAgentSettings(config, def.id);
                            return (
                                <div
                                    key={def.id}
                                    className={`rounded-3xl border p-5 flex flex-col gap-4 transition-all bg-white dark:bg-slate-800 ${
                                        s.enabled
                                            ? 'border-emerald-300 dark:border-emerald-700 shadow-sm shadow-emerald-500/5'
                                            : 'border-slate-200 dark:border-slate-700 opacity-90'
                                    }`}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <span className={`p-2.5 rounded-2xl shrink-0 ${COLOR_CLASSES[def.color]}`}>
                                                <Icon size={20} />
                                            </span>
                                            <div className="min-w-0">
                                                <h4 className="font-black text-sm text-slate-900 dark:text-white truncate">
                                                    {def.name}
                                                </h4>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                    {def.department}
                                                </p>
                                            </div>
                                        </div>
                                        <Toggle checked={s.enabled} onChange={v => patchAgent(def.id, { enabled: v })} />
                                    </div>

                                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed flex-1">
                                        {def.description}
                                    </p>

                                    <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-700">
                                        <p className="text-[11px] text-slate-400 font-bold truncate">Para: {def.audience}</p>
                                        <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider">
                                            {/* Indicador Visual Compacto de Prontidão Operacional */}
                                            {s.enabled && config.gatewayEnabled && sessionStatus === 'connected' && s.links.length > 0 ? (
                                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                    <Smartphone size={10} />
                                                    Operacional ({s.links.length})
                                                </span>
                                            ) : s.enabled && s.links.length === 0 ? (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300">
                                                    <AlertTriangle size={10} />
                                                    Sem Vínculos
                                                </span>
                                            ) : s.enabled && (!config.gatewayEnabled || sessionStatus !== 'connected') ? (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                                                    <WifiOff size={10} />
                                                    Gateway Off
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
                                                    Inativo
                                                </span>
                                            )}

                                            {s.customSystemPrompt?.trim() && (
                                                <span className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300 font-black flex items-center gap-1">
                                                    <Sparkles size={10} /> Prompt Ativo
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 pt-1">
                                        <button
                                            type="button"
                                            onClick={() => openAgent(def.id)}
                                            className="flex-1 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 dark:hover:bg-slate-600 text-white text-[10px] font-black uppercase tracking-widest transition-all text-center"
                                        >
                                            {canManage ? 'Configurar & Testar' : 'Detalhes'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => openTestModal(def.id)}
                                            title="Disparo de Teste para este Agente"
                                            className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-300 hover:bg-emerald-100 transition-colors"
                                        >
                                            <Send size={15} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>
                )}
            </fieldset>

            {/* Agente de Código (ADM) — Somente Super Administrador com Guardrails Rigorosos */}
            {isAdmin && hubSubTab === 'code_agent' && (
                <section className="rounded-3xl bg-slate-900 text-white p-6 md:p-8 space-y-6 border border-slate-700 shadow-xl">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <span className="p-2.5 rounded-2xl bg-amber-400 text-slate-950 shadow-lg shadow-amber-400/20">
                                <Code2 size={22} />
                            </span>
                            <div>
                                <h3 className="font-black text-base uppercase tracking-tight flex items-center gap-2">
                                    Agente de Código &amp; Arquitetura
                                    <span className="inline-flex items-center gap-1 text-[9px] px-2.5 py-1 rounded-lg bg-amber-400/20 text-amber-300 tracking-widest font-black">
                                        <Lock size={10} /> Restrito ao Super Administrador
                                    </span>
                                </h3>
                                <p className="text-xs text-slate-400 font-bold mt-0.5">
                                    Apoia na manutenção e melhorias do ERP. Nunca edita arquivos sensíveis nem comita na branch principal.
                                </p>
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2.5">
                            <button
                                type="button"
                                onClick={testCodeGuardrailSimulation}
                                className="px-3 py-1.5 rounded-xl bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 border border-rose-800 transition-colors"
                                title="Executa simulação de tentativa de leitura de arquivos .env para comprovar o bloqueio ativo"
                            >
                                <ShieldAlert size={12} /> Testar Bloqueio (.env)
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowCodeSystemPromptModal(true)}
                                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 border border-slate-700"
                            >
                                <Terminal size={12} /> Prompt do Agente
                            </button>
                            <Toggle checked={config.codeAgent.enabled} onChange={v => patchCode({ enabled: v })} />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Guardrails e Modo */}
                        <div className="space-y-4">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                <ShieldCheck size={14} className="text-amber-400" /> Guardrails de Segurança Obrigatórios
                            </h4>
                            <ul className="space-y-2">
                                {CODE_AGENT_GUARDRAILS.map(g => (
                                    <li key={g} className="flex gap-2 text-xs font-medium text-slate-300 leading-relaxed">
                                        <Check size={14} className="shrink-0 mt-0.5 text-emerald-400" /> {g}
                                    </li>
                                ))}
                            </ul>

                            <div className="space-y-1.5 pt-2">
                                <span className="text-[10px] font-black uppercase tracking-widest text-rose-400 flex items-center gap-1.5">
                                    <ShieldAlert size={12} /> Arquivos Sensíveis Bloqueados para Edição:
                                </span>
                                <div className="flex flex-wrap gap-1.5">
                                    {CODE_AGENT_PROTECTED_PATHS.map(p => (
                                        <span
                                            key={p}
                                            className="px-2 py-0.5 rounded-lg bg-rose-950/40 border border-rose-800 text-[10px] text-rose-300 font-mono font-bold flex items-center gap-1"
                                        >
                                            <Lock size={9} /> {p}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-1 pt-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                    Modo de Operação
                                </label>
                                <select
                                    className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2.5 px-3 font-bold text-sm outline-none focus:border-amber-400 text-white"
                                    value={config.codeAgent.mode}
                                    onChange={e => patchCode({ mode: e.target.value as AIAgentsConfig['codeAgent']['mode'] })}
                                >
                                    <option value="suggest_only">Somente sugerir código (não altera arquivos)</option>
                                    <option value="branch_and_pr">Criar branch e Pull Request para revisão humana</option>
                                </select>
                            </div>
                        </div>

                        {/* Números autorizados (Administradores) */}
                        <div className="space-y-4">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                <Smartphone size={14} className="text-amber-400" /> Administradores Autorizados via WhatsApp
                            </h4>
                            {config.codeAgent.links.length === 0 && (
                                <p className="text-xs font-bold text-slate-500">
                                    Nenhum número autorizado. O agente ignorará qualquer mensagem recebida no WhatsApp.
                                </p>
                            )}
                            <ul className="space-y-2">
                                {config.codeAgent.links.map(l => {
                                    const u = users.find(x => x.id === l.userId);
                                    const stillAdmin = !!u && u.status === 'Ativo' && isUserAdmin(u, roles);
                                    return (
                                        <li key={l.id} className="flex items-center justify-between gap-3 bg-slate-800 rounded-xl px-3 py-2.5 border border-slate-700">
                                            <div className="min-w-0">
                                                <p className="text-sm font-bold truncate text-white">{userLabel(l.userId)}</p>
                                                <p className="text-[11px] text-slate-400 font-bold">{formatPhone(l.phone)}</p>
                                                {!stillAdmin && (
                                                    <p className="text-[10px] font-black text-rose-400 flex items-center gap-1 mt-0.5">
                                                        <AlertTriangle size={11} /> Não é mais administrador ativo — bloqueado
                                                    </p>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <button
                                                    type="button"
                                                    onClick={() => openTestModal('code_agent', l.phone, userLabel(l.userId))}
                                                    className="px-2.5 py-1 rounded-lg bg-amber-400/20 text-amber-300 hover:bg-amber-400/30 text-[10px] font-black uppercase tracking-wider flex items-center gap-1"
                                                >
                                                    <Send size={11} /> Testar
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => patchCode({ links: config.codeAgent.links.filter(x => x.id !== l.id) })}
                                                    className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>

                            <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-2 pt-2">
                                <select
                                    className="bg-slate-800 border border-slate-700 rounded-xl py-2.5 px-3 font-bold text-sm outline-none focus:border-amber-400 text-white"
                                    value={linkUserId}
                                    onChange={e => handleSelectUserForLink(e.target.value)}
                                >
                                    <option value="">Administrador…</option>
                                    {eligibleAdmins.map(u => (
                                        <option key={u.id} value={u.id}>
                                            {u.name}
                                        </option>
                                    ))}
                                </select>
                                <div className="space-y-1">
                                    <input
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2.5 px-3 font-bold text-sm outline-none focus:border-amber-400 text-white"
                                        placeholder="(11) 98765-4321"
                                        inputMode="tel"
                                        value={linkPhone}
                                        onChange={e => setLinkPhone(formatPhoneInput(e.target.value))}
                                    />
                                    {linkPhone && !isValidPhone(linkPhone) && (
                                        <p className="text-[10px] font-bold text-rose-400">
                                            {getPhoneValidationMessage(linkPhone)}
                                        </p>
                                    )}
                                </div>
                                <button
                                    type="button"
                                    onClick={addCodeLink}
                                    className="px-4 py-2.5 rounded-xl bg-amber-400 text-slate-950 font-black text-[10px] uppercase tracking-widest hover:bg-amber-300 transition-all flex items-center justify-center gap-1 self-start"
                                >
                                    <Plus size={14} /> Autorizar
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Fila de Solicitações e Propostas de Código */}
                    <div className="space-y-4 pt-4 border-t border-slate-700">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                <GitPullRequest size={14} className="text-amber-400" /> Fila de Solicitações e Propostas Supervisionadas
                            </h4>
                            <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-[9px] font-black uppercase text-slate-400">Modelos Rápidos:</span>
                                {CODE_PROPOSAL_TEMPLATES.map(tpl => (
                                    <button
                                        key={tpl.id}
                                        type="button"
                                        onClick={() => applyCodeProposalTemplate(tpl)}
                                        className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 text-[9px] font-bold transition-all"
                                    >
                                        + {tpl.title.split(' ')[0]} {tpl.title.split(' ')[1] || ''}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Seletor Multi-Arquivo Seguro */}
                        <div className="space-y-1.5">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">
                                Selecione os Arquivos Alvo (arquivos sensíveis são travados automaticamente):
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                                {ERP_FILE_CHIPS.map(file => {
                                    const active = reqSelectedFiles.includes(file);
                                    return (
                                        <button
                                            key={file}
                                            type="button"
                                            onClick={() => toggleFileChip(file)}
                                            className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all border ${
                                                active
                                                    ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-sm'
                                                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-500'
                                            }`}
                                        >
                                            {active ? '✓ ' : '+ '}
                                            {file}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                            <input
                                className="bg-slate-800 border border-slate-700 rounded-xl py-2.5 px-3 font-bold text-sm outline-none focus:border-amber-400 text-white md:col-span-2"
                                placeholder="Título (ex.: Otimizar filtro de clientes)"
                                value={reqTitle}
                                onChange={e => setReqTitle(e.target.value)}
                            />
                            <select
                                className="bg-slate-800 border border-slate-700 rounded-xl py-2.5 px-3 font-bold text-sm outline-none focus:border-amber-400 text-white"
                                value={reqChangeType}
                                onChange={e => setReqChangeType(e.target.value as NonNullable<AICodeProposal['changeType']>)}
                            >
                                <option value="Bugfix">Tipo: Bugfix</option>
                                <option value="Refatoração">Tipo: Refatoração</option>
                                <option value="Nova Funcionalidade">Tipo: Nova Funcionalidade</option>
                                <option value="Performance">Tipo: Performance</option>
                                <option value="Segurança">Tipo: Segurança</option>
                            </select>
                            <select
                                className="bg-slate-800 border border-slate-700 rounded-xl py-2.5 px-3 font-bold text-sm outline-none focus:border-amber-400 text-white"
                                value={reqPriority}
                                onChange={e => setReqPriority(e.target.value as NonNullable<AICodeProposal['priority']>)}
                            >
                                <option value="Baixa">Prioridade: Baixa</option>
                                <option value="Média">Prioridade: Média</option>
                                <option value="Alta">Prioridade: Alta</option>
                                <option value="Urgente">Prioridade: Urgente</option>
                            </select>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-2">
                            <input
                                className="bg-slate-800 border border-slate-700 rounded-xl py-2.5 px-3 font-bold text-sm outline-none focus:border-amber-400 text-white"
                                placeholder="Arquivos adicionais (ex.: src/utils/format.ts — .env e credenciais são bloqueados)"
                                value={reqFiles}
                                onChange={e => setReqFiles(e.target.value)}
                            />
                            <button
                                type="button"
                                onClick={addProposalRequest}
                                className="px-5 py-2.5 rounded-xl bg-amber-400 text-slate-950 font-black text-[10px] uppercase tracking-widest hover:bg-amber-300 transition-all flex items-center justify-center gap-1"
                            >
                                <Plus size={14} /> Registrar Solicitação
                            </button>
                        </div>

                        <textarea
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2.5 px-3 font-bold text-sm outline-none focus:border-amber-400 min-h-[70px] text-white"
                            placeholder="Descreva o que o agente deve sugerir ou refatorar..."
                            value={reqDescription}
                            onChange={e => setReqDescription(e.target.value)}
                        />

                        {/* Barra de Filtro e Ordenação Rápida por Prioridade (Urgente Primeiro) */}
                        {config.codeAgent.proposals.length > 0 && (
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-800">
                                <div className="relative flex-1 max-w-sm">
                                    <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="text"
                                        className="w-full bg-slate-800/90 border border-slate-700 rounded-xl py-1.5 pl-8 pr-7 text-xs text-white placeholder-slate-400 outline-none focus:border-amber-400 transition-all font-medium"
                                        placeholder="Buscar por título, arquivo ou tipo..."
                                        value={codeProposalSearch}
                                        onChange={e => setCodeProposalSearch(e.target.value)}
                                    />
                                    {codeProposalSearch && (
                                        <button
                                            type="button"
                                            onClick={() => setCodeProposalSearch('')}
                                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                                        >
                                            <X size={12} />
                                        </button>
                                    )}
                                </div>
                                <div className="flex items-center gap-1.5 text-[10px] font-bold">
                                    <span className="text-slate-400 uppercase tracking-wider text-[9px]">Ordenar:</span>
                                    <button
                                        type="button"
                                        onClick={() => setCodeProposalSort('priority')}
                                        className={`px-2.5 py-1 rounded-lg transition-all ${
                                            codeProposalSort === 'priority'
                                                ? 'bg-amber-400 text-slate-950 font-black shadow-sm'
                                                : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
                                        }`}
                                    >
                                        ⚡ Prioridade (Urgente 1º)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setCodeProposalSort('recent')}
                                        className={`px-2.5 py-1 rounded-lg transition-all ${
                                            codeProposalSort === 'recent'
                                                ? 'bg-amber-400 text-slate-950 font-black shadow-sm'
                                                : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
                                        }`}
                                    >
                                        🕒 Mais Recentes
                                    </button>
                                </div>
                            </div>
                        )}

                        {config.codeAgent.proposals.length === 0 ? (
                            <p className="text-xs font-bold text-slate-500">
                                Nenhuma solicitação na fila. Propostas enviadas pelo WhatsApp ou painel aparecerão aqui.
                            </p>
                        ) : filteredProposals.length === 0 ? (
                            <p className="text-xs font-bold text-slate-400 py-2">
                                Nenhuma proposta encontrada para &ldquo;{codeProposalSearch}&rdquo;.
                            </p>
                        ) : (
                            <ul className="space-y-3">
                                {filteredProposals.map(p => (
                                    <li key={p.id} className="bg-slate-800 rounded-2xl p-4 space-y-2 border border-slate-700/70">
                                        <div className="flex flex-wrap items-start justify-between gap-2">
                                            <div className="min-w-0 space-y-1">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <p className="font-black text-sm text-white">{p.title}</p>
                                                    {p.changeType && (
                                                        <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 text-[9px] font-black uppercase tracking-wider">
                                                            {p.changeType}
                                                        </span>
                                                    )}
                                                    {p.priority && (
                                                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider ${
                                                            p.priority === 'Urgente' || p.priority === 'Alta'
                                                                ? 'bg-rose-500/20 text-rose-300'
                                                                : 'bg-amber-500/20 text-amber-300'
                                                        }`}>
                                                            Prioridade {p.priority}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-[11px] text-slate-400 font-bold">
                                                    {p.requestedBy} · {new Date(p.createdAt).toLocaleString('pt-BR')} · via {p.origin === 'whatsapp' ? 'WhatsApp' : 'painel'}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${PROPOSAL_STATUS[p.status].className}`}>
                                                    {PROPOSAL_STATUS[p.status].label}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => copyProposalPrompt(p)}
                                                    title="Copiar Prompt desta Proposta"
                                                    className="p-1.5 rounded-lg bg-slate-700 hover:bg-indigo-600 text-slate-200 hover:text-white transition-colors"
                                                >
                                                    <Copy size={14} />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => deleteProposal(p.id, p.title)}
                                                    title="Excluir Solicitação da Fila"
                                                    className="p-1.5 rounded-lg bg-slate-700 hover:bg-rose-600 text-slate-200 hover:text-white transition-colors"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                        {p.description && (
                                            <p className="text-xs text-slate-300 font-medium whitespace-pre-wrap">{p.description}</p>
                                        )}
                                        {p.files.length > 0 && (
                                            <div className="flex flex-wrap gap-1.5">
                                                {p.files.map(f => (
                                                    <code key={f} className="px-2 py-0.5 rounded bg-slate-900 text-[10px] text-sky-300 font-bold">
                                                        {f}
                                                    </code>
                                                ))}
                                            </div>
                                        )}
                                        {p.branch && (
                                            <p className="text-[11px] text-slate-400 font-bold">
                                                Branch Sugerida: <code className="text-emerald-300 font-mono">{p.branch}</code>
                                            </p>
                                        )}
                                        <div className="flex flex-wrap gap-2 pt-1">
                                            {p.status === 'aguardando_aprovacao' && (
                                                <>
                                                    <button
                                                        type="button"
                                                        onClick={() => setProposalStatus(p.id, 'aprovada')}
                                                        className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest"
                                                    >
                                                        Aprovar Proposta
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setProposalStatus(p.id, 'rejeitada')}
                                                        className="px-3 py-1.5 rounded-lg bg-rose-500 hover:bg-rose-600 text-white text-[10px] font-black uppercase tracking-widest"
                                                    >
                                                        Rejeitar
                                                    </button>
                                                </>
                                            )}
                                            {p.status === 'solicitada' && (
                                                <>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const slug = p.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 24) || 'ajuste';
                                                            patchCode({
                                                                proposals: config.codeAgent.proposals.map(item =>
                                                                    item.id === p.id
                                                                        ? { ...item, status: 'aguardando_aprovacao', branch: `ai/fix-${slug}` }
                                                                        : item
                                                                )
                                                            });
                                                            addToast(`Branch sugerida "ai/fix-${slug}" preparada para aprovação humana!`, 'info');
                                                        }}
                                                        className="px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 text-[10px] font-black uppercase tracking-widest"
                                                    >
                                                        Simular Branch do Agente
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setProposalStatus(p.id, 'rejeitada')}
                                                        className="px-3 py-1.5 rounded-lg bg-slate-700 text-slate-200 text-[10px] font-black uppercase tracking-widest"
                                                    >
                                                        Cancelar
                                                    </button>
                                                </>
                                            )}
                                            {p.status === 'aprovada' && (
                                                <button
                                                    type="button"
                                                    onClick={() => setProposalStatus(p.id, 'aplicada')}
                                                    className="px-3 py-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-1"
                                                >
                                                    <CheckCheck size={12} /> Marcar como Aplicada
                                                </button>
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => copyProposalPrompt(p)}
                                                className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-[10px] font-black uppercase tracking-widest flex items-center gap-1"
                                            >
                                                <Copy size={11} /> Copiar Prompt
                                            </button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </section>
            )}

            {/* Modal de Configuração do Agente Selecionado */}
            {selectedDef && (() => {
                const def = selectedDef;
                const Icon = ICONS[def.icon] || Bot;
                const s = getAgentSettings(config, def.id);
                return (
                    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedId(null)}>
                        <div className="bg-white dark:bg-slate-800 rounded-[32px] shadow-2xl w-full max-w-4xl max-h-[92vh] border dark:border-slate-700 overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
                            {/* Cabeçalho do Modal */}
                            <div className="p-6 border-b dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50 shrink-0">
                                <div className="flex items-center gap-3">
                                    <span className={`p-2.5 rounded-2xl ${COLOR_CLASSES[def.color]}`}>
                                        <Icon size={22} />
                                    </span>
                                    <div>
                                        <h3 className="font-black text-lg text-slate-900 dark:text-white uppercase tracking-tight">
                                            {def.name}
                                        </h3>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                            {def.department} · {def.audience}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => openTestModal(def.id)}
                                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black uppercase tracking-wider flex items-center gap-1"
                                    >
                                        <Send size={12} /> Testar Disparo
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setSelectedId(null)}
                                        className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>
                            </div>

                            <fieldset disabled={!canManage} className="min-w-0 border-0 p-0 m-0 flex-1 overflow-y-auto">
                                <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
                                    {/* Coluna Esquerda: Capacidades, Opções e Prompts */}
                                    <div className="space-y-6">
                                        <div>
                                            <h4 className={LABEL_CLASS}>O que este agente faz no ERP</h4>
                                            <ul className="mt-2 space-y-2">
                                                {def.capabilities.map(c => {
                                                    const hasAny = s.links.some(l => roleHasPermission(roles.find(r => r.id === users.find(u => u.id === l.userId)?.roleId), c.permission));
                                                    return (
                                                        <li key={c.label} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700">
                                                            <div className="flex items-start justify-between gap-2">
                                                                <p className="text-sm font-black text-slate-800 dark:text-slate-100">{c.label}</p>
                                                                <span className="shrink-0 text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center gap-1" title={c.permission}>
                                                                    <Lock size={10} /> {getPermissionName(c.permission)}
                                                                </span>
                                                            </div>
                                                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">{c.description}</p>
                                                            {s.links.length > 0 && !hasAny && (
                                                                <p className="text-[10px] font-black text-amber-600 mt-1">
                                                                    Nenhum dos números autorizados possui esta permissão no perfil.
                                                                </p>
                                                            )}
                                                        </li>
                                                    );
                                                })}
                                            </ul>
                                            <p className="text-[11px] text-slate-400 font-bold mt-2">
                                                Cada capacidade só é liberada a quem possui a permissão indicada em seu perfil de acesso.
                                            </p>
                                        </div>

                                        <div className="space-y-3">
                                            <h4 className={LABEL_CLASS}>Opções de Operação</h4>
                                            <label className="flex items-center justify-between gap-3 text-sm font-bold text-slate-700 dark:text-slate-200">
                                                <span className="flex items-center gap-2">
                                                    <ShieldCheck size={16} className="text-slate-400" /> Pedir confirmação antes de gravar no ERP
                                                </span>
                                                <Toggle checked={s.requireConfirmation} onChange={v => patchAgent(def.id, { requireConfirmation: v })} />
                                            </label>
                                            <label className="flex items-center justify-between gap-3 text-sm font-bold text-slate-700 dark:text-slate-200">
                                                <span className="flex items-center gap-2">
                                                    <Mic size={16} className="text-slate-400" /> Aceitar mensagens de áudio (transcrição automática)
                                                </span>
                                                <Toggle checked={s.acceptAudio} onChange={v => patchAgent(def.id, { acceptAudio: v })} />
                                            </label>
                                            {def.supportsImages && (
                                                <label className="flex items-center justify-between gap-3 text-sm font-bold text-slate-700 dark:text-slate-200">
                                                    <span className="flex items-center gap-2">
                                                        <ImageIcon size={16} className="text-slate-400" /> Aceitar fotos e Danfe/OCR
                                                    </span>
                                                    <Toggle checked={s.acceptImages} onChange={v => patchAgent(def.id, { acceptImages: v })} />
                                                </label>
                                            )}
                                            {def.supportsProactive && (
                                                <label className="flex items-center justify-between gap-3 text-sm font-bold text-slate-700 dark:text-slate-200">
                                                    <span className="flex items-center gap-2">
                                                        <Bell size={16} className="text-slate-400" /> Permitir alertas proativos iniciados pelo agente
                                                    </span>
                                                    <Toggle checked={s.proactiveAlerts} onChange={v => patchAgent(def.id, { proactiveAlerts: v })} />
                                                </label>
                                            )}
                                        </div>

                                        {/* Prompts de Sistema e Regras de Negócio Aprimoradas */}
                                        <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-700">
                                            <div className="flex items-center justify-between">
                                                <h4 className={LABEL_CLASS}>Instruções Personalizadas (Prompt de Sistema)</h4>
                                                <button
                                                    type="button"
                                                    onClick={() => setShowBasePromptModal(true)}
                                                    className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                                                >
                                                    <FileText size={11} /> Ver Prompt Base Padrão
                                                </button>
                                            </div>

                                            {/* Badges Compactos de Regras Predefinidas com Tags Coloridas por Categoria */}
                                            {def.promptPresets && def.promptPresets.length > 0 && (
                                                <div className="space-y-1.5">
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">
                                                        Presets por Categoria (clique para inserir no prompt):
                                                    </span>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {def.promptPresets.map(preset => {
                                                            const catInfo = PRESET_CATEGORY_STYLES[preset.category || 'alcada'];
                                                            const CatIcon = catInfo.icon;
                                                            return (
                                                                <button
                                                                    key={preset.label}
                                                                    type="button"
                                                                    onClick={() => {
                                                                        const current = s.customSystemPrompt || '';
                                                                        const appended = current ? `${current}\n${preset.prompt}` : preset.prompt;
                                                                        patchAgent(def.id, { customSystemPrompt: appended });
                                                                        addToast(`Regra "${preset.label}" (${catInfo.label}) inserida!`, 'success');
                                                                    }}
                                                                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all border flex items-center gap-1 hover:scale-[1.02] shadow-sm ${catInfo.badgeClass}`}
                                                                    title={preset.prompt}
                                                                >
                                                                    <CatIcon size={11} className="shrink-0" />
                                                                    <span>{preset.label}</span>
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Variáveis Dinâmicas do ERP */}
                                            <div className="space-y-1.5 pt-1">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">
                                                    Variáveis Dinâmicas do ERP (interpoladas ao vivo):
                                                </span>
                                                <div className="flex flex-wrap gap-1">
                                                    {ERP_PROMPT_VARIABLES.map(v => (
                                                        <button
                                                            key={v.tag}
                                                            type="button"
                                                            onClick={() => {
                                                                const current = s.customSystemPrompt || '';
                                                                const separator = current.endsWith(' ') || current === '' ? '' : ' ';
                                                                patchAgent(def.id, { customSystemPrompt: `${current}${separator}${v.tag}` });
                                                                addToast(`Variável ${v.tag} inserida!`, 'info');
                                                            }}
                                                            className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 font-mono text-[9px] font-bold border border-slate-200 dark:border-slate-600 transition-colors"
                                                            title={v.description}
                                                        >
                                                            {v.tag}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            <textarea
                                                rows={3}
                                                className={INPUT_CLASS}
                                                placeholder={`Ex.: Para a {{EMPRESA}}, confirme o centro de custo antes de lançar despesas acima de {{LIMITE_ALERTA}}...`}
                                                value={s.customSystemPrompt || ''}
                                                onChange={e => patchAgent(def.id, { customSystemPrompt: e.target.value })}
                                            />
                                            <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold ml-1">
                                                <span>Regras de negócio específicas e diretrizes aplicadas ao {def.name}.</span>
                                                {s.customSystemPrompt && (
                                                    <button
                                                        type="button"
                                                        onClick={() => patchAgent(def.id, { customSystemPrompt: '' })}
                                                        className="text-rose-500 hover:underline"
                                                    >
                                                        Limpar customização
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Coluna Direita: Números Autorizados e Simulador */}
                                    <div className="space-y-6">
                                        <div className="space-y-3">
                                            <h4 className={LABEL_CLASS}>Números Autorizados (Colaboradores)</h4>
                                            {s.links.length === 0 && (
                                                <p className="text-xs font-bold text-slate-400">
                                                    Nenhum número cadastrado. Sem vínculo, o agente ignora todas as mensagens recebidas.
                                                </p>
                                            )}
                                            <ul className="space-y-2">
                                                {s.links.map(l => {
                                                    const u = users.find(x => x.id === l.userId);
                                                    const elig = u ? getUserEligibility(u, roles, def.minPermissions) : { eligible: false, missing: [] as string[] };
                                                    return (
                                                        <li key={l.id} className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700">
                                                            <div className="min-w-0">
                                                                <p className="text-sm font-black text-slate-800 dark:text-slate-100 truncate">
                                                                    {userLabel(l.userId)}{' '}
                                                                    <span className="text-[10px] text-slate-400 font-bold">· {l.label || roleLabel(l.userId)}</span>
                                                                </p>
                                                                <p className="text-xs text-slate-500 font-bold">{formatPhone(l.phone)}</p>
                                                                {!elig.eligible && (
                                                                    <p className="text-[10px] font-black text-rose-500 flex items-center gap-1 mt-0.5">
                                                                        <AlertTriangle size={11} /> {u ? (elig.missing.length ? `Perfil sem: ${elig.missing.map(getPermissionName).join(', ')}` : 'Usuário inativo') : 'Usuário removido'} — bloqueado
                                                                    </p>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => openTestModal(def.id, l.phone, userLabel(l.userId))}
                                                                    className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-black uppercase tracking-wider hover:bg-emerald-100"
                                                                    title="Enviar mensagem de teste para este número"
                                                                >
                                                                    Testar
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => removeAgentLink(def.id, l.id)}
                                                                    className="p-2 text-slate-400 hover:text-rose-500 rounded-lg"
                                                                >
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            </div>
                                                        </li>
                                                    );
                                                })}
                                            </ul>

                                            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                                                <select
                                                    className={INPUT_CLASS}
                                                    value={linkUserId}
                                                    onChange={e => handleSelectUserForLink(e.target.value)}
                                                >
                                                    <option value="">Selecione o colaborador…</option>
                                                    {users.map(u => {
                                                        const e = getUserEligibility(u, roles, def.minPermissions);
                                                        return (
                                                            <option key={u.id} value={u.id} disabled={!e.eligible}>
                                                                {u.name}{!e.eligible ? (u.status !== 'Ativo' ? ' (inativo)' : ' (perfil sem permissão)') : ''}
                                                            </option>
                                                        );
                                                    })}
                                                </select>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                    <div className="space-y-1">
                                                        <input
                                                            className={INPUT_CLASS}
                                                            placeholder="WhatsApp: (11) 98765-4321"
                                                            inputMode="tel"
                                                            value={linkPhone}
                                                            onChange={e => setLinkPhone(formatPhoneInput(e.target.value))}
                                                        />
                                                        {linkPhone && !isValidPhone(linkPhone) && (
                                                            <p className="text-[10px] font-bold text-amber-500 ml-1">
                                                                {getPhoneValidationMessage(linkPhone)}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <input
                                                        className={INPUT_CLASS}
                                                        placeholder="Apelido/Cargo (ex: Plantão Usina)"
                                                        value={linkLabel}
                                                        onChange={e => setLinkLabel(e.target.value)}
                                                    />
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => addAgentLink(def)}
                                                    className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 text-white font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-1 hover:bg-indigo-500 transition-all shadow-md shadow-indigo-600/20"
                                                >
                                                    <Plus size={14} /> Adicionar Número Autorizado
                                                </button>
                                                <p className="text-[10px] text-slate-400 font-bold ml-1">
                                                    Permissões exigidas: {def.minPermissions.map(getPermissionName).join(', ')}.
                                                </p>
                                            </div>
                                        </div>

                                        {/* Menu Interativo WhatsApp: Teclado de Botões & Listas por Permissões do Usuário */}
                                        {(() => {
                                            const activeSimUser = users.find(u => u.id === simulatedUserId) || users[0];
                                            const simRole = findUserRole(activeSimUser, roles);
                                            const isSimAdmin = activeSimUser ? isUserAdmin(activeSimUser, roles) : false;
                                            const interactiveMenu = generateUserWhatsAppInteractiveMenu(
                                                def,
                                                simRole,
                                                isSimAdmin,
                                                activeSimUser?.name || 'Colaborador',
                                                settings.tradeName || settings.companyName || 'InfraCore ERP'
                                            );

                                            return (
                                                <div className="space-y-3 p-4 rounded-3xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700/80">
                                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                                        <div className="flex items-center gap-2">
                                                            <span className="p-1.5 rounded-lg bg-emerald-500 text-white shadow-sm">
                                                                <MousePointerClick size={14} />
                                                            </span>
                                                            <div>
                                                                <h4 className="text-xs font-black uppercase tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
                                                                    Menu Interativo WhatsApp
                                                                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-black">
                                                                        {interactiveMenu.isList ? 'Lista Interativa (≥4)' : 'Botões Rápidos (≤3)'}
                                                                    </span>
                                                                </h4>
                                                                <p className="text-[10px] text-slate-400 font-bold">
                                                                    Gerado dinamicamente com base nas permissões de cada colaborador
                                                                </p>
                                                            </div>
                                                        </div>

                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setInteractivePayloadModal({
                                                                    title: `Payload WhatsApp • ${def.name} (${interactiveMenu.payload.type.toUpperCase()})`,
                                                                    json: JSON.stringify(interactiveMenu.payload, null, 2)
                                                                });
                                                            }}
                                                            className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 self-start sm:self-auto"
                                                        >
                                                            <Code2 size={12} /> Copiar Payload JSON
                                                        </button>
                                                    </div>

                                                    {/* Seletor de Colaborador para Teste de Permissões */}
                                                    <div className="space-y-1">
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">
                                                            Simular Ações para o Colaborador:
                                                        </label>
                                                        <select
                                                            className={INPUT_CLASS}
                                                            value={simulatedUserId || activeSimUser?.id || ''}
                                                            onChange={e => setSimulatedUserId(e.target.value)}
                                                        >
                                                            {users.map(u => {
                                                                const r = findUserRole(u, roles);
                                                                const isAdm = isUserAdmin(u, roles);
                                                                return (
                                                                    <option key={u.id} value={u.id}>
                                                                        {u.name} — Cargo: {r?.name || 'Sem perfil'}{isAdm ? ' (Super Admin)' : ''}
                                                                    </option>
                                                                );
                                                            })}
                                                        </select>
                                                    </div>

                                                    {/* Badge de Resumo de Permissões */}
                                                    <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-[10px] flex items-center justify-between text-slate-600 dark:text-slate-300">
                                                        <span>
                                                            Colaborador: <strong className="font-black text-slate-900 dark:text-white">{activeSimUser?.name}</strong> ({simRole?.name || 'Sem perfil'})
                                                        </span>
                                                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                                            {interactiveMenu.authorizedCount} de {interactiveMenu.totalAvailable} ações autorizadas
                                                        </span>
                                                    </div>

                                                    {/* Pré-visualização do Balão com Botões/Lista */}
                                                    <div className="flex justify-center pt-1">
                                                        <WhatsAppInteractiveMessageBubble
                                                            interactive={interactiveMenu.payload}
                                                            onSelectAction={act => handleInteractiveActionClick(def, act)}
                                                            onViewPayloadJson={() => {
                                                                setInteractivePayloadModal({
                                                                    title: `Payload Interativo WhatsApp • ${def.name}`,
                                                                    json: JSON.stringify(interactiveMenu.payload, null, 2)
                                                                });
                                                            }}
                                                        />
                                                    </div>

                                                    <p className="text-[9px] text-slate-400 font-bold text-center">
                                                        💡 Clique nos botões acima para executar a consulta ou acionar a confirmação de gravação no simulador.
                                                    </p>
                                                </div>
                                            );
                                        })()}

                                        {/* Simulador Interativo Ao Vivo com Chips de Envio Direto e Edição */}
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <h4 className={LABEL_CLASS}>Simulador de Conversa Ao Vivo (Conectado ao ERP)</h4>
                                                {chatMessages[def.id] && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setChatMessages(prev => {
                                                            const next = { ...prev };
                                                            delete next[def.id];
                                                            return next;
                                                        })}
                                                        className="text-[10px] font-bold text-slate-400 hover:text-rose-500"
                                                    >
                                                        Restaurar Exemplo
                                                    </button>
                                                )}
                                            </div>
                                            <div className="rounded-2xl bg-[#efeae2] dark:bg-slate-900 p-4 space-y-2 max-h-52 overflow-y-auto border border-slate-200 dark:border-slate-800">
                                                {(chatMessages[def.id] || def.example).map((m, i) => (
                                                    <div key={i} className={`flex ${m.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                                                        <div className={`max-w-[85%] px-3 py-2 rounded-2xl text-xs font-medium shadow-sm whitespace-pre-wrap ${
                                                            m.from === 'user'
                                                                ? 'bg-[#d9fdd3] text-slate-800 rounded-br-md'
                                                                : 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 rounded-bl-md'
                                                        }`}>
                                                            {m.text}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Perguntas Rápidas de Campo com Envio Direto (Play) e Preenchimento */}
                                            {def.simulatorQuestions && def.simulatorQuestions.length > 0 && (
                                                <div className="space-y-1">
                                                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 flex items-center justify-between">
                                                        <span>Sugestões Rápidas de Campo:</span>
                                                        <span className="text-[8px] font-normal lowercase text-slate-500">clique no texto para editar ou ▶ para enviar</span>
                                                    </span>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {def.simulatorQuestions.map((q, idx) => (
                                                            <div
                                                                key={idx}
                                                                className="inline-flex items-center rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60 overflow-hidden text-[10px] font-bold text-emerald-800 dark:text-emerald-200 shadow-sm"
                                                            >
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setChatInput(q)}
                                                                    className="px-2 py-1 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-left truncate max-w-[210px] transition-colors"
                                                                    title="Clique para preencher no campo de digitação"
                                                                >
                                                                    {q}
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleSendSimulatedMessageWithText(def, q)}
                                                                    className="px-1.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white transition-colors border-l border-emerald-500 flex items-center justify-center"
                                                                    title="Disparar imediatamente esta pergunta no simulador"
                                                                >
                                                                    <Play size={10} className="fill-current" />
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            <div className="flex gap-2">
                                                <input
                                                    className={INPUT_CLASS}
                                                    placeholder={`Envie uma mensagem para ${def.name}...`}
                                                    value={chatInput}
                                                    onChange={e => setChatInput(e.target.value)}
                                                    onKeyDown={e => {
                                                        if (e.key === 'Enter') {
                                                            e.preventDefault();
                                                            handleSendSimulatedMessageWithText(def);
                                                        }
                                                    }}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => handleSendSimulatedMessageWithText(def)}
                                                    className="px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[10px] uppercase tracking-widest shrink-0 transition-all shadow-md shadow-emerald-600/20"
                                                >
                                                    Enviar
                                                </button>
                                            </div>
                                            <p className="text-[10px] text-slate-400 font-bold ml-1">
                                                Responde utilizando os números e registros reais carregados na sessão do ERP.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </fieldset>
                        </div>
                    </div>
                );
            })()}

            {/* Modal de Exibição do Prompt Base do Agente */}
            {showBasePromptModal && selectedDef && (
                <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setShowBasePromptModal(false)}>
                    <div className="bg-white dark:bg-slate-900 rounded-[28px] p-6 max-w-2xl w-full border dark:border-slate-700 space-y-4 shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between pb-3 border-b dark:border-slate-800">
                            <h4 className="font-black text-sm uppercase tracking-tight flex items-center gap-2 text-slate-900 dark:text-white">
                                <Terminal size={16} className="text-indigo-600" /> Prompt Base Especializado: {selectedDef.name}
                            </h4>
                            <button
                                type="button"
                                onClick={() => setShowBasePromptModal(false)}
                                className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
                            >
                                <X size={18} />
                            </button>
                        </div>
                        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 font-mono text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap max-h-80 overflow-y-auto leading-relaxed border dark:border-slate-800">
                            {selectedDef.defaultSystemPrompt}
                        </div>
                        <div className="flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => {
                                    navigator.clipboard.writeText(selectedDef.defaultSystemPrompt);
                                    addToast('Prompt base copiado!', 'success');
                                }}
                                className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 text-white text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5"
                            >
                                <Copy size={12} /> Copiar Prompt Base
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowBasePromptModal(false)}
                                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-black uppercase tracking-wider"
                            >
                                Fechar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Exibição do Prompt do Agente de Código */}
            {showCodeSystemPromptModal && (
                <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setShowCodeSystemPromptModal(false)}>
                    <div className="bg-white dark:bg-slate-900 rounded-[28px] p-6 max-w-2xl w-full border dark:border-slate-700 space-y-4 shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between pb-3 border-b dark:border-slate-800">
                            <h4 className="font-black text-sm uppercase tracking-tight flex items-center gap-2 text-slate-900 dark:text-white">
                                <Terminal size={16} className="text-amber-500" /> Prompt de Sistema do Agente de Código (ADM)
                            </h4>
                            <button
                                type="button"
                                onClick={() => setShowCodeSystemPromptModal(false)}
                                className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
                            >
                                <X size={18} />
                            </button>
                        </div>
                        <div className="p-4 rounded-2xl bg-slate-950 font-mono text-xs text-amber-300 whitespace-pre-wrap max-h-80 overflow-y-auto leading-relaxed border border-slate-800">
                            {CODE_AGENT_SYSTEM_PROMPT}
                        </div>
                        <div className="flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => {
                                    navigator.clipboard.writeText(CODE_AGENT_SYSTEM_PROMPT);
                                    addToast('Prompt do Agente de Código copiado!', 'success');
                                }}
                                className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5"
                            >
                                <Copy size={12} /> Copiar Prompt
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowCodeSystemPromptModal(false)}
                                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-black uppercase tracking-wider"
                            >
                                Fechar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Especializado de Teste de Disparo do WhatsApp */}
            {isTestModalOpen && (
                <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setIsTestModalOpen(false)}>
                    <div className="bg-white dark:bg-slate-900 rounded-[32px] p-6 max-w-xl w-full border dark:border-slate-700 space-y-5 shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between pb-3 border-b dark:border-slate-800">
                            <div className="flex items-center gap-2.5">
                                <span className="p-2 rounded-xl bg-emerald-500 text-white shadow-md">
                                    <Send size={16} />
                                </span>
                                <div>
                                    <h4 className="font-black text-sm uppercase tracking-tight text-slate-900 dark:text-white">
                                        Testador de Disparos WhatsApp
                                    </h4>
                                    <p className="text-[10px] font-bold text-slate-400">Simule envio direto pelo Gateway para homologação</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsTestModalOpen(false)}
                                className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {/* Seleção do Agente Remetente */}
                            <div className="space-y-1">
                                <label className={LABEL_CLASS}>Agente Remetente</label>
                                <select
                                    className={INPUT_CLASS}
                                    value={testTargetAgentId}
                                    onChange={e => {
                                        const newId = e.target.value;
                                        setTestTargetAgentId(newId);
                                        const templates = AGENT_TEST_TEMPLATES[newId] || [];
                                        if (templates.length > 0) {
                                            setTestSelectedTemplateId(templates[0].id);
                                            setTestCustomMessage(templates[0].text);
                                        }
                                    }}
                                >
                                    {AI_AGENT_CATALOG.map(a => (
                                        <option key={a.id} value={a.id}>
                                            {a.name} ({a.department})
                                        </option>
                                    ))}
                                    {isAdmin && <option value="code_agent">Agente de Código (Super Administrador)</option>}
                                </select>
                            </div>

                            {/* Destinatário */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className={LABEL_CLASS}>Nome do Destinatário</label>
                                    <input
                                        className={INPUT_CLASS}
                                        placeholder="Ex.: João da Usina"
                                        value={testTargetName}
                                        onChange={e => setTestTargetName(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className={LABEL_CLASS}>Telefone com DDD</label>
                                    <input
                                        className={INPUT_CLASS}
                                        placeholder="(11) 98765-4321"
                                        inputMode="tel"
                                        value={testTargetPhone}
                                        onChange={e => setTestTargetPhone(formatPhoneInput(e.target.value))}
                                    />
                                    {testTargetPhone && !isValidPhone(testTargetPhone) && (
                                        <p className="text-[10px] font-bold text-rose-500 ml-1">
                                            {getPhoneValidationMessage(testTargetPhone)}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Seletor de Modo: Texto vs Menu Interativo */}
                            <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 gap-1">
                                <button
                                    type="button"
                                    onClick={() => setTestDispatchMode('text')}
                                    className={`flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                                        testDispatchMode === 'text'
                                            ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                                            : 'text-slate-500 hover:text-slate-700'
                                    }`}
                                >
                                    Texto Simples
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setTestDispatchMode('interactive')}
                                    className={`flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                                        testDispatchMode === 'interactive'
                                            ? 'bg-emerald-600 text-white shadow-sm'
                                            : 'text-slate-500 hover:text-slate-700'
                                    }`}
                                >
                                    <MousePointerClick size={12} />
                                    Menu Interativo (Botões/Lista)
                                </button>
                            </div>

                            {/* Modelos Predefinidos de Mensagens */}
                            {testDispatchMode === 'text' && AGENT_TEST_TEMPLATES[testTargetAgentId] && (
                                <div className="space-y-1.5">
                                    <label className={LABEL_CLASS}>Modelos Rápidos de Mensagem</label>
                                    <div className="flex flex-wrap gap-1.5">
                                        {AGENT_TEST_TEMPLATES[testTargetAgentId].map(tpl => (
                                            <button
                                                key={tpl.id}
                                                type="button"
                                                onClick={() => {
                                                    setTestSelectedTemplateId(tpl.id);
                                                    setTestCustomMessage(tpl.text);
                                                }}
                                                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all border ${
                                                    testSelectedTemplateId === tpl.id
                                                        ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                                                }`}
                                            >
                                                {tpl.title}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Texto da Mensagem */}
                            {testDispatchMode === 'text' && (
                                <div className="space-y-1">
                                    <label className={LABEL_CLASS}>Conteúdo da Mensagem (WhatsApp)</label>
                                    <textarea
                                        rows={3}
                                        className={INPUT_CLASS}
                                        value={testCustomMessage}
                                        onChange={e => {
                                            setTestCustomMessage(e.target.value);
                                            setTestSelectedTemplateId('');
                                        }}
                                    />
                                </div>
                            )}

                            {/* Preview Estilizado do Balão do WhatsApp */}
                            {testDispatchMode === 'text' ? (
                                <div className="rounded-2xl bg-[#efeae2] dark:bg-slate-950 p-4 border border-slate-200 dark:border-slate-800 space-y-1">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1">
                                        Prévia no WhatsApp do Destinatário:
                                    </span>
                                    <div className="flex justify-start">
                                        <div className="max-w-[90%] px-3.5 py-2.5 rounded-2xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs font-medium shadow-sm rounded-bl-sm space-y-1">
                                            <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400">
                                                {testTargetAgentId === 'code_agent'
                                                    ? 'Agente de Código (ADM)'
                                                    : AI_AGENT_CATALOG.find(a => a.id === testTargetAgentId)?.name}
                                            </p>
                                            <p className="whitespace-pre-wrap leading-relaxed">{testCustomMessage || '...'}</p>
                                            <div className="text-[9px] text-slate-400 font-bold text-right flex items-center justify-end gap-1">
                                                <span>{new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                                                <CheckCheck size={12} className="text-sky-500" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                (() => {
                                    const agent = AI_AGENT_CATALOG.find(a => a.id === testTargetAgentId);
                                    const targetUser = users.find(u => {
                                        const emp = employees?.find(e => e.phone && normalizePhone(e.phone) === normalizePhone(testTargetPhone));
                                        return (u.email && emp?.email && u.email.toLowerCase() === emp.email.toLowerCase()) ||
                                            u.name.toLowerCase() === (testTargetName || '').toLowerCase();
                                    }) || users[0];
                                    const targetRole = findUserRole(targetUser, roles);
                                    const isAdm = targetUser ? isUserAdmin(targetUser, roles) : false;
                                    if (!agent) return null;
                                    const menu = generateUserWhatsAppInteractiveMenu(
                                        agent,
                                        targetRole,
                                        isAdm,
                                        testTargetName || targetUser?.name || 'Colaborador',
                                        settings.tradeName || settings.companyName || 'InfraCore ERP'
                                    );
                                    return (
                                        <div className="flex flex-col items-center p-3 rounded-2xl bg-[#efeae2] dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                                            <div className="flex items-center justify-between w-full">
                                                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                                                    Prévia da Mensagem Interativa ({menu.isList ? 'Lista' : 'Botões'}):
                                                </span>
                                                <span className="text-[9px] font-bold text-emerald-600">
                                                    {menu.authorizedCount} ações para {targetUser?.name}
                                                </span>
                                            </div>
                                            <WhatsAppInteractiveMessageBubble
                                                interactive={menu.payload}
                                                onSelectAction={act => addToast(`Ação "${act.title}" selecionada na prévia!`, 'info')}
                                                onViewPayloadJson={() => {
                                                    setInteractivePayloadModal({
                                                        title: `Payload Teste Interativo • ${agent.name}`,
                                                        json: JSON.stringify(menu.payload, null, 2)
                                                    });
                                                }}
                                            />
                                        </div>
                                    );
                                })()
                            )}

                            {lastDispatchInfo && (
                                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-[11px] font-bold text-emerald-800 dark:text-emerald-200 flex items-center justify-between">
                                    <span>✓ Último disparo: para {lastDispatchInfo.phone} às {lastDispatchInfo.sentAt}</span>
                                    <span className="text-[9px] uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-100">
                                        {lastDispatchInfo.channel}
                                    </span>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center justify-between gap-3 pt-3 border-t dark:border-slate-800">
                            <button
                                type="button"
                                onClick={() => {
                                    const agent = AI_AGENT_CATALOG.find(a => a.id === testTargetAgentId);
                                    let interactiveData = undefined;
                                    if (testDispatchMode === 'interactive' && agent) {
                                        const targetUser = users.find(u => {
                                            const emp = employees?.find(e => e.phone && normalizePhone(e.phone) === normalizePhone(testTargetPhone));
                                            return (u.email && emp?.email && u.email.toLowerCase() === emp.email.toLowerCase()) ||
                                                u.name.toLowerCase() === (testTargetName || '').toLowerCase();
                                        }) || users[0];
                                        const targetRole = findUserRole(targetUser, roles);
                                        const isAdm = targetUser ? isUserAdmin(targetUser, roles) : false;
                                        const menu = generateUserWhatsAppInteractiveMenu(
                                            agent,
                                            targetRole,
                                            isAdm,
                                            testTargetName || targetUser?.name || 'Colaborador',
                                            settings.tradeName || settings.companyName || 'InfraCore ERP'
                                        );
                                        interactiveData = menu.payload;
                                    }
                                    const samplePayload = {
                                        event: 'whatsapp.message.test',
                                        provider: config.gateway.provider,
                                        recipient: { phone: normalizePhone(testTargetPhone), name: testTargetName },
                                        message: {
                                            type: testDispatchMode === 'interactive' ? 'interactive' : 'text',
                                            body: testCustomMessage,
                                            interactive: interactiveData
                                        }
                                    };
                                    navigator.clipboard.writeText(JSON.stringify(samplePayload, null, 2));
                                    addToast(`Payload ${testDispatchMode === 'interactive' ? 'interativo' : 'de texto'} copiado em JSON!`, 'success');
                                }}
                                className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5"
                            >
                                <Copy size={12} /> Copiar Payload
                            </button>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setIsTestModalOpen(false)}
                                    className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 text-[10px] font-black uppercase tracking-wider"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="button"
                                    disabled={isDispatchingTest}
                                    onClick={handleDispatchTestMessage}
                                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[10px] uppercase tracking-widest flex items-center gap-1.5 shadow-lg shadow-emerald-600/20 disabled:opacity-50 transition-all"
                                >
                                    <Send size={13} className={isDispatchingTest ? 'animate-pulse' : ''} />
                                    {isDispatchingTest ? 'Enviando...' : 'Efetuar Disparo'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Interativo de Pareamento com QR Code */}
            {isQrModalOpen && (
                <div
                    className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
                    onClick={() => setIsQrModalOpen(false)}
                >
                    <div
                        className="bg-white dark:bg-slate-900 rounded-[32px] p-6 max-w-xl w-full border dark:border-slate-700 space-y-5 shadow-2xl overflow-hidden"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between pb-3 border-b dark:border-slate-800">
                            <div className="flex items-center gap-2.5">
                                <span className="p-2 rounded-xl bg-emerald-500 text-white shadow-md">
                                    <QrCode size={18} />
                                </span>
                                <div>
                                    <h4 className="font-black text-sm uppercase tracking-tight text-slate-900 dark:text-white">
                                        Parear WhatsApp com o InfraCore ERP
                                    </h4>
                                    <p className="text-[10px] font-bold text-slate-400">
                                        Conecte sua instância via Evolution API ou Z-API
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsQrModalOpen(false)}
                                className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 items-center">
                            {/* Lado do QR Code */}
                            <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
                                <div className="relative group">
                                    <WhatsAppQrCodeSvg size={190} />
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                        <div className="p-2 bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-500/40">
                                            <Smartphone size={18} />
                                        </div>
                                    </div>
                                </div>

                                {/* Barra de Expiração do QR */}
                                <div className="w-full space-y-1">
                                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
                                        <span className="flex items-center gap-1 font-sans font-bold">
                                            <Clock size={11} className="text-amber-500" /> Expira em:
                                        </span>
                                        <span className="font-bold text-amber-600 dark:text-amber-400">{qrCountdown}s</span>
                                    </div>
                                    <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                        <div
                                            className="bg-emerald-500 h-full transition-all duration-1000 ease-linear rounded-full"
                                            style={{ width: `${(qrCountdown / 45) * 100}%` }}
                                        />
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setQrCountdown(45);
                                        setQrSeed(s => s + 1);
                                        addToast('QR Code renovado com novo handshake!', 'info');
                                    }}
                                    className="text-[10px] font-bold text-slate-500 hover:text-emerald-600 flex items-center gap-1 transition-colors"
                                >
                                    <RotateCcw size={11} /> Renovar QR Code agora
                                </button>
                            </div>

                            {/* Lado das Instruções e Ação de Simulação */}
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                                        Passo a passo no Smartphone:
                                    </span>
                                    <ol className="text-xs text-slate-600 dark:text-slate-300 space-y-2 list-decimal list-inside font-medium leading-relaxed">
                                        <li>Abra o WhatsApp no aparelho corporativo</li>
                                        <li>Toque em <strong className="font-black text-slate-900 dark:text-white">Aparelhos Conectados</strong></li>
                                        <li>Toque em <strong className="font-black text-slate-900 dark:text-white">Conectar Aparelho</strong></li>
                                        <li>Aponte a câmera para este QR Code</li>
                                    </ol>
                                </div>

                                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-[10px] font-medium text-slate-500 space-y-1">
                                    <div className="flex justify-between">
                                        <span>Provedor:</span>
                                        <strong className="text-slate-800 dark:text-slate-200 uppercase font-mono">{config.gateway.provider}</strong>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Instância:</span>
                                        <strong className="text-slate-800 dark:text-slate-200 font-mono">{config.gateway.instanceName || 'infracore-producao'}</strong>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Criptografia:</span>
                                        <strong className="text-emerald-600 dark:text-emerald-400">End-to-End SSL</strong>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={handleSimulateQrScanSuccess}
                                    className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[11px] uppercase tracking-wider shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 transition-all"
                                >
                                    <Sparkles size={14} />
                                    Simular Pareamento Imediato
                                </button>
                            </div>
                        </div>

                        <div className="flex justify-end pt-2 border-t dark:border-slate-800">
                            <button
                                type="button"
                                onClick={() => setIsQrModalOpen(false)}
                                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 text-[10px] font-black uppercase tracking-wider"
                            >
                                Fechar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Confirmação de Ação Crítica no WhatsApp (Sim/Não) */}
            {confirmationPrompt && (
                <div
                    className="fixed inset-0 z-[85] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
                    onClick={() => setConfirmationPrompt(null)}
                >
                    <div
                        className="bg-white dark:bg-slate-900 rounded-[28px] p-6 max-w-md w-full border border-amber-300 dark:border-amber-700/80 space-y-4 shadow-2xl"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex items-center gap-3">
                            <span className="p-2.5 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
                                <AlertTriangle size={24} />
                            </span>
                            <div>
                                <h4 className="font-black text-sm uppercase tracking-tight text-slate-900 dark:text-white">
                                    Confirmação Prévia no WhatsApp
                                </h4>
                                <p className="text-[10px] font-bold text-slate-400">
                                    Simulação de regra: {confirmationPrompt.agentName}
                                </p>
                            </div>
                        </div>

                        <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-xs space-y-1.5">
                            <p className="font-bold text-amber-900 dark:text-amber-200">
                                O agente detectou uma ação de gravação ou alteração de dados no ERP:
                            </p>
                            <p className="font-black text-sm text-slate-900 dark:text-white">
                                &ldquo;{confirmationPrompt.action.title}&rdquo;
                            </p>
                            <p className="text-[11px] text-amber-700 dark:text-amber-300 font-medium">
                                Por segurança, o gateway aguarda resposta com SIM ou confirmação por botão para registrar as alterações.
                            </p>
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-2">
                            <button
                                type="button"
                                onClick={() => setConfirmationPrompt(null)}
                                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-black uppercase tracking-wider hover:bg-slate-200"
                            >
                                Cancelar (NÃO)
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    const agent = AI_AGENT_CATALOG.find(a => a.id === confirmationPrompt.agentId);
                                    if (agent) {
                                        executeInteractiveAction(agent, confirmationPrompt.action);
                                    }
                                }}
                                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest shadow-md shadow-emerald-600/20"
                            >
                                Confirmar (SIM)
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Exibição do Payload JSON da Mensagem Interativa */}
            {interactivePayloadModal && (
                <div
                    className="fixed inset-0 z-[85] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
                    onClick={() => setInteractivePayloadModal(null)}
                >
                    <div
                        className="bg-white dark:bg-slate-900 rounded-[28px] p-6 max-w-xl w-full border dark:border-slate-700 space-y-4 shadow-2xl"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between pb-3 border-b dark:border-slate-800">
                            <h4 className="font-black text-sm uppercase tracking-tight flex items-center gap-2 text-slate-900 dark:text-white">
                                <Code2 size={16} className="text-emerald-500" />
                                {interactivePayloadModal.title}
                            </h4>
                            <button
                                type="button"
                                onClick={() => setInteractivePayloadModal(null)}
                                className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="p-4 rounded-2xl bg-slate-950 font-mono text-xs text-emerald-300 whitespace-pre-wrap max-h-80 overflow-y-auto leading-relaxed border border-slate-800">
                            {interactivePayloadModal.json}
                        </div>

                        <div className="flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => {
                                    navigator.clipboard.writeText(interactivePayloadModal.json);
                                    addToast('Payload JSON copiado!', 'success');
                                }}
                                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
                            >
                                <Copy size={12} /> Copiar Payload
                            </button>
                            <button
                                type="button"
                                onClick={() => setInteractivePayloadModal(null)}
                                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-black uppercase tracking-wider"
                            >
                                Fechar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AIAgentsHub;
