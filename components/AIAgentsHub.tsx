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
    Copy
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
    CODE_AGENT_GUARDRAILS,
    CODE_AGENT_PROTECTED_PATHS,
    findUserRole,
    formatPhone,
    formatPhoneInput,
    getAgentSettings,
    getAIConfig,
    getPermissionName,
    getUserEligibility,
    isSuperAdminRole,
    isUserAdmin,
    newId,
    normalizePhone,
    roleHasPermission,
    setAIConfig
} from '../ai_agents_constants';

type IconType = React.ComponentType<{ size?: number; className?: string }>;

const ICONS: Record<string, IconType> = {
    TrendingUp, Wallet, Landmark, Package, ShoppingBag, FlaskConical, Factory, Mountain, Truck, Users: UsersIcon
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
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${checked ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`}
    >
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
);

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
        'context/AppContext.tsx',
        'components/Layout.tsx',
        'components/AIAuditAgent.tsx'
    ];

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
        setReqSelectedFiles(prev =>
            prev.includes(file) ? prev.filter(f => f !== file) : [...prev, file]
        );
    };

    const generateAgentLiveReply = (agentId: string, promptText: string): string => {
        const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);
        switch (agentId) {
            case 'sales': {
                const openBudgets = (budgets || []).filter(b => b.status === 'Aberto').length;
                const totalSales = (sales || []).reduce((acc, s) => acc + (s.amount || 0), 0);
                return `📊 [ERP Ao Vivo] Temos ${sales.length} venda(s) registrada(s) totalizando ${fmt(totalSales)} e ${openBudgets} orçamento(s) em aberto. Recebi sua mensagem ("${promptText}") e posso consultar estoque/preço ou registrar orçamento mediante confirmação.`;
            }
            case 'finance_analyst':
            case 'finance_manager': {
                return `💰 [ERP Ao Vivo] Saldo atual em caixa: ${fmt(financials.balance)} | A Receber: ${fmt(financials.receivables)} | A Pagar: ${fmt(financials.payables)}. Comando "${promptText}" processado com validação de perfil financeiro.`;
            }
            case 'inventory': {
                const low = (inventory || []).filter(i => i.quantity <= (i.minStock || 0));
                return `📦 [ERP Ao Vivo] Estoque possui ${inventory.length} itens cadastrados (${low.length} abaixo do estoque mínimo). Consulta "${promptText}" registrada.`;
            }
            case 'purchases': {
                const pendingPO = (purchaseOrders || []).filter(p => p.status === 'Pendente').length;
                return `🛒 [ERP Ao Vivo] Existem ${purchaseOrders.length} ordem(ns) de compra (${pendingPO} pendente(s) de recebimento). Solicitação "${promptText}" analisada.`;
            }
            case 'lab':
            case 'plant_operator':
            case 'crusher_operator': {
                const activeUnits = (productionUnits || []).filter(u => u.status === 'Operando').length;
                const activeOPs = (productionOrders || []).filter(o => o.status === 'Em Produção').length;
                return `🏭 [ERP Ao Vivo] ${activeUnits}/${productionUnits.length} usinas operando agora e ${activeOPs} O.P.(s) em produção. Apontamento "${promptText}" pronto para confirmação.`;
            }
            case 'fleet': {
                const op = (fleet || []).filter(v => v.status === 'Operacional').length;
                return `🚛 [ERP Ao Vivo] Frota com ${op}/${fleet.length} veículos operacionais. Registro "${promptText}" validado pelo Agente de Frota.`;
            }
            case 'hr': {
                const activeEmp = (employees || []).filter(e => e.status === 'Ativo').length;
                const pendPay = (payroll || []).filter(p => p.status === 'Pendente').length;
                return `👔 [ERP Ao Vivo] ${activeEmp} colaboradores ativos e ${pendPay} folha(s) pendente(s). Atendimento RH para "${promptText}" concluído.`;
            }
            default:
                return `🤖 [ERP Ao Vivo] Mensagem recebida e processada com os dados em tempo real do InfraCore ERP.`;
        }
    };

    const handleSendSimulatedMessage = (def: AIAgentDefinition) => {
        const text = chatInput.trim();
        if (!text) return;
        const base = chatMessages[def.id] || def.example;
        const reply = generateAgentLiveReply(def.id, text);
        setChatMessages(prev => ({
            ...prev,
            [def.id]: [...base, { from: 'user', text }, { from: 'agent', text: reply }]
        }));
        setChatInput('');
    };

    const handleTestWebhook = async () => {
        if (!config.gateway.webhookUrl) {
            addToast('Informe a URL do webhook (HTTPS) antes de testar.', 'warning');
            return;
        }
        setTestingWebhook(true);
        try {
            await fetch(config.gateway.webhookUrl, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    event: 'infracore.webhook.test',
                    provider: config.gateway.provider,
                    instance: config.gateway.instanceName || 'infracore-producao',
                    timestamp: new Date().toISOString()
                })
            });
            addToast(`Disparo de teste enviado para ${config.gateway.webhookUrl} (${config.gateway.provider})!`, 'success');
        } catch {
            addToast('Pacote de teste preparado. Verifique se o endpoint HTTPS está acessível.', 'info');
        } finally {
            setTestingWebhook(false);
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
        const phone = normalizePhone(rawPhone);
        if (!phone) return { error: 'Número inválido. Informe DDD + número, ex.: (11) 98765-4321.' };
        if (allLinks().some(l => l.phone === phone && l.userId !== userId)) {
            return { error: 'Este número já está vinculado a outro usuário.' };
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
        if (!isAdmin) return addToast('Apenas o Super Administrador pode autorizar números.', 'error');
        const user = users.find(u => u.id === linkUserId);
        if (!user) return addToast('Selecione um usuário.', 'error');
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
        addToast('Solicitação registrada na fila do agente.', 'success');
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
        addToast(`Prompt da proposta "${p.title}" copiado!`, 'success');
    };

    const setProposalStatus = (id: string, status: AICodeProposalStatus) => {
        if (!isAdmin) return;
        if (status === 'aprovada' && !window.confirm('Aprovar esta proposta? O agente poderá criar a branch e o Pull Request correspondentes.')) return;
        patchCode({ proposals: config.codeAgent.proposals.map(p => (p.id === id ? { ...p, status } : p)) });
    };

    // ----- Derivados -----

    const departments = ['Todos', ...Array.from(new Set(AI_AGENT_CATALOG.map(a => a.department)))];
    const visibleAgents = AI_AGENT_CATALOG.filter(a => department === 'Todos' || a.department === department);
    const activeCount = AI_AGENT_CATALOG.filter(a => getAgentSettings(config, a.id).enabled).length;
    const numbersCount = AI_AGENT_CATALOG.reduce((sum, a) => sum + getAgentSettings(config, a.id).links.length, 0);
    const eligibleAdmins = users.filter(u => u.status === 'Ativo' && isUserAdmin(u, roles));

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
                        <span className="p-2 bg-emerald-500 text-white rounded-xl"><MessageCircle size={20} /></span>
                        Agentes de IA &amp; WhatsApp
                    </h2>
                    <p className="text-xs text-slate-500 font-bold mt-1 ml-1">
                        Assistentes por função que operam o ERP por mensagem, áudio e foto.
                    </p>
                </div>
                <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest">
                    <span className="px-3 py-2 rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">{activeCount} agentes ativos</span>
                    <span className="px-3 py-2 rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300">{numbersCount} números autorizados</span>
                </div>
            </div>

            {/* Aviso sobre o estado da implementação */}
            <div className="flex gap-3 p-4 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200">
                <Info size={18} className="shrink-0 mt-0.5" />
                <p className="text-xs font-bold leading-relaxed">
                    Esta tela define <u>quem</u> pode conversar com cada agente e <u>o que</u> cada perfil pode executar. Receber as mensagens do WhatsApp e executar a IA exige um serviço no servidor (webhook do gateway + modelo de IA), que <u>ainda não foi implantado</u> — ele deverá aplicar estas permissões. Tokens e chaves de API nunca devem ser salvos aqui.
                </p>
            </div>

            {!canManage && (
                <div className="flex gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                    <Lock size={18} className="shrink-0 mt-0.5" />
                    <p className="text-xs font-bold">Você pode visualizar esta tela, mas seu perfil não tem a permissão “Gerir Agentes de IA”.</p>
                </div>
            )}

            <fieldset disabled={!canManage} className="min-w-0 border-0 p-0 m-0 space-y-8">
                {/* Gateway */}
                <section className="rounded-3xl border border-slate-200 dark:border-slate-700 p-6 space-y-5">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300"><Smartphone size={18} /></span>
                            <div>
                                <h3 className="font-black text-sm text-slate-900 dark:text-white uppercase tracking-tight">Gateway do WhatsApp</h3>
                                <p className="text-[11px] text-slate-500 font-bold">Chave geral: com ele desligado nenhum agente responde.</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={handleTestWebhook}
                                disabled={testingWebhook}
                                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50"
                            >
                                {testingWebhook ? 'Testando...' : 'Testar Webhook'}
                            </button>
                            <Toggle checked={config.gatewayEnabled} onChange={v => update({ ...config, gatewayEnabled: v })} />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1">
                            <label className={LABEL_CLASS}>Provedor</label>
                            <select className={INPUT_CLASS} value={config.gateway.provider} onChange={e => patchGateway({ provider: e.target.value as AIAgentsConfig['gateway']['provider'] })}>
                                <option value="evolution">Evolution API (open source)</option>
                                <option value="zapi">Z-API</option>
                                <option value="meta_cloud">WhatsApp Cloud API (Meta)</option>
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className={LABEL_CLASS}>Nome da instância</label>
                            <input className={INPUT_CLASS} value={config.gateway.instanceName} onChange={e => patchGateway({ instanceName: e.target.value })} placeholder="infracore-producao" />
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-center justify-between">
                                <label className={LABEL_CLASS}>URL do webhook (servidor)</label>
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
                                    <Copy size={11} /> Copiar URL Sugerida
                                </button>
                            </div>
                            <input className={INPUT_CLASS} value={config.gateway.webhookUrl} onChange={e => patchGateway({ webhookUrl: e.target.value })} placeholder="https://api.suaempresa.com/whatsapp/webhook" />
                            {config.gateway.webhookUrl && !config.gateway.webhookUrl.startsWith('https://') && (
                                <p className="text-[10px] font-bold text-rose-500 ml-1 flex items-center gap-1"><AlertTriangle size={12} /> Use HTTPS no webhook.</p>
                            )}
                            {config.gateway.webhookUrl && config.gateway.webhookUrl.startsWith('https://') && (
                                <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 ml-1 flex items-center gap-1"><Check size={12} /> Endpoint HTTPS válido</p>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <div className="space-y-1">
                            <label className={LABEL_CLASS}>Número Remetente (WhatsApp Business)</label>
                            <input
                                className={INPUT_CLASS}
                                inputMode="tel"
                                value={config.gateway.senderPhone || ''}
                                onChange={e => patchGateway({ senderPhone: formatPhoneInput(e.target.value) })}
                                placeholder="(11) 98765-4321"
                            />
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

                {/* Catálogo de agentes */}
                <section className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                        {departments.map(d => (
                            <button
                                key={d}
                                type="button"
                                onClick={() => setDepartment(d)}
                                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${department === d ? 'bg-slate-900 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-600'}`}
                            >
                                {d}
                            </button>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                        {visibleAgents.map(def => {
                            const Icon = ICONS[def.icon] || Bot;
                            const s = getAgentSettings(config, def.id);
                            return (
                                <div key={def.id} className={`rounded-3xl border p-5 flex flex-col gap-4 transition-all ${s.enabled ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50/30 dark:bg-emerald-900/10' : 'border-slate-200 dark:border-slate-700'}`}>
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <span className={`p-2.5 rounded-xl shrink-0 ${COLOR_CLASSES[def.color]}`}><Icon size={20} /></span>
                                            <div className="min-w-0">
                                                <h4 className="font-black text-sm text-slate-900 dark:text-white truncate">{def.name}</h4>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{def.department}</p>
                                            </div>
                                        </div>
                                        <Toggle checked={s.enabled} onChange={v => patchAgent(def.id, { enabled: v })} />
                                    </div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed flex-1">{def.description}</p>
                                    <p className="text-[11px] text-slate-400 font-bold">Para: {def.audience}</p>
                                    <div className="flex items-center justify-between">
                                        <span className={`text-[10px] font-black uppercase tracking-widest ${s.links.length ? 'text-slate-500' : 'text-amber-600'}`}>
                                            {s.links.length ? `${s.links.length} número(s)` : 'Sem números autorizados'}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => openAgent(def.id)}
                                            className="px-4 py-2 rounded-xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all"
                                        >
                                            {canManage ? 'Configurar' : 'Detalhes'}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>
            </fieldset>

            {/* Agente de código — somente Super Admin */}
            {isAdmin && (
                <section className="rounded-3xl bg-slate-900 text-white p-6 md:p-8 space-y-6 border border-slate-700">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <span className="p-2.5 rounded-xl bg-amber-400 text-slate-900"><Code2 size={20} /></span>
                            <div>
                                <h3 className="font-black text-base uppercase tracking-tight flex items-center gap-2">
                                    Agente de Código
                                    <span className="inline-flex items-center gap-1 text-[9px] px-2 py-1 rounded-lg bg-amber-400/20 text-amber-300 tracking-widest"><Lock size={10} /> Restrito ao Administrador</span>
                                </h3>
                                <p className="text-xs text-slate-400 font-bold mt-0.5">Sugere melhorias e prepara ajustes no código do sistema, sempre sob sua aprovação.</p>
                            </div>
                        </div>
                        <Toggle checked={config.codeAgent.enabled} onChange={v => patchCode({ enabled: v })} />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Proteções */}
                        <div className="space-y-4">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2"><ShieldCheck size={14} /> Proteções obrigatórias</h4>
                            <ul className="space-y-2">
                                {CODE_AGENT_GUARDRAILS.map(g => (
                                    <li key={g} className="flex gap-2 text-xs font-medium text-slate-300 leading-relaxed">
                                        <Check size={14} className="shrink-0 mt-0.5 text-emerald-400" /> {g}
                                    </li>
                                ))}
                            </ul>
                            <div className="flex flex-wrap gap-2 pt-1">
                                {CODE_AGENT_PROTECTED_PATHS.map(p => (
                                    <code key={p} className="px-2 py-1 rounded-lg bg-slate-800 text-[10px] text-rose-300 font-bold">{p}</code>
                                ))}
                            </div>
                            <div className="space-y-1 pt-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Modo de operação</label>
                                <select
                                    className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2.5 px-3 font-bold text-sm outline-none focus:border-amber-400"
                                    value={config.codeAgent.mode}
                                    onChange={e => patchCode({ mode: e.target.value as AIAgentsConfig['codeAgent']['mode'] })}
                                >
                                    <option value="suggest_only">Somente sugerir (não altera arquivos)</option>
                                    <option value="branch_and_pr">Criar branch + Pull Request para revisão</option>
                                </select>
                            </div>
                        </div>

                        {/* Números */}
                        <div className="space-y-4">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2"><Smartphone size={14} /> Números autorizados (administradores)</h4>
                            {config.codeAgent.links.length === 0 && (
                                <p className="text-xs font-bold text-slate-500">Nenhum número autorizado. O agente não responderá a ninguém.</p>
                            )}
                            <ul className="space-y-2">
                                {config.codeAgent.links.map(l => {
                                    const u = users.find(x => x.id === l.userId);
                                    const stillAdmin = !!u && u.status === 'Ativo' && isUserAdmin(u, roles);
                                    return (
                                        <li key={l.id} className="flex items-center justify-between gap-3 bg-slate-800 rounded-xl px-3 py-2">
                                            <div className="min-w-0">
                                                <p className="text-sm font-bold truncate">{userLabel(l.userId)}</p>
                                                <p className="text-[11px] text-slate-400 font-bold">{formatPhone(l.phone)}</p>
                                                {!stillAdmin && <p className="text-[10px] font-black text-rose-400 flex items-center gap-1"><AlertTriangle size={11} /> Não é mais administrador ativo — será bloqueado</p>}
                                            </div>
                                            <button type="button" onClick={() => patchCode({ links: config.codeAgent.links.filter(x => x.id !== l.id) })} className="p-2 text-slate-400 hover:text-rose-400"><Trash2 size={16} /></button>
                                        </li>
                                    );
                                })}
                            </ul>
                            <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-2">
                                <select
                                    className="bg-slate-800 border border-slate-700 rounded-xl py-2.5 px-3 font-bold text-sm outline-none focus:border-amber-400"
                                    value={linkUserId}
                                    onChange={e => handleSelectUserForLink(e.target.value)}
                                >
                                    <option value="">Administrador…</option>
                                    {eligibleAdmins.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                </select>
                                <input
                                    className="bg-slate-800 border border-slate-700 rounded-xl py-2.5 px-3 font-bold text-sm outline-none focus:border-amber-400"
                                    placeholder="(11) 98765-4321"
                                    inputMode="tel"
                                    value={linkPhone}
                                    onChange={e => setLinkPhone(formatPhoneInput(e.target.value))}
                                />
                                <button type="button" onClick={addCodeLink} className="px-4 py-2.5 rounded-xl bg-amber-400 text-slate-900 font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all flex items-center justify-center gap-1"><Plus size={14} /> Adicionar</button>
                            </div>
                        </div>
                    </div>

                    {/* Solicitações e propostas */}
                    <div className="space-y-4 pt-2 border-t border-slate-700">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 pt-4"><GitPullRequest size={14} /> Fila de solicitações e propostas</h4>

                        {/* Seletor Multi-Arquivo Assistido (Chips) */}
                        <div className="space-y-1.5">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">
                                Selecione os Arquivos Alvo (clique para marcar/desmarcar):
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
                            <input className="bg-slate-800 border border-slate-700 rounded-xl py-2.5 px-3 font-bold text-sm outline-none focus:border-amber-400 md:col-span-2" placeholder="Título (ex.: Ajustar filtro do DRE)" value={reqTitle} onChange={e => setReqTitle(e.target.value)} />
                            <select
                                className="bg-slate-800 border border-slate-700 rounded-xl py-2.5 px-3 font-bold text-sm outline-none focus:border-amber-400"
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
                                className="bg-slate-800 border border-slate-700 rounded-xl py-2.5 px-3 font-bold text-sm outline-none focus:border-amber-400"
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
                            <input className="bg-slate-800 border border-slate-700 rounded-xl py-2.5 px-3 font-bold text-sm outline-none focus:border-amber-400" placeholder="Arquivos adicionais opcionais (separe por vírgula)" value={reqFiles} onChange={e => setReqFiles(e.target.value)} />
                            <button type="button" onClick={addProposalRequest} className="px-5 py-2.5 rounded-xl bg-amber-400 text-slate-900 font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all flex items-center justify-center gap-1"><Plus size={14} /> Registrar solicitação</button>
                        </div>
                        <textarea className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2.5 px-3 font-bold text-sm outline-none focus:border-amber-400 min-h-[70px]" placeholder="Descreva o que deve ser sugerido ou alterado" value={reqDescription} onChange={e => setReqDescription(e.target.value)} />

                        {config.codeAgent.proposals.length === 0 ? (
                            <p className="text-xs font-bold text-slate-500">Nenhuma solicitação ainda. Propostas enviadas pelo agente aparecerão aqui para sua aprovação.</p>
                        ) : (
                            <ul className="space-y-3">
                                {config.codeAgent.proposals.map(p => (
                                    <li key={p.id} className="bg-slate-800 rounded-2xl p-4 space-y-2 border border-slate-700/70">
                                        <div className="flex flex-wrap items-start justify-between gap-2">
                                            <div className="min-w-0 space-y-1">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <p className="font-black text-sm">{p.title}</p>
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
                                                <p className="text-[11px] text-slate-400 font-bold">{p.requestedBy} · {new Date(p.createdAt).toLocaleString('pt-BR')} · via {p.origin === 'whatsapp' ? 'WhatsApp' : 'painel'}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${PROPOSAL_STATUS[p.status].className}`}>{PROPOSAL_STATUS[p.status].label}</span>
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
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                        {p.description && <p className="text-xs text-slate-300 font-medium whitespace-pre-wrap">{p.description}</p>}
                                        {p.files.length > 0 && (
                                            <div className="flex flex-wrap gap-1.5">{p.files.map(f => <code key={f} className="px-2 py-0.5 rounded bg-slate-900 text-[10px] text-sky-300 font-bold">{f}</code>)}</div>
                                        )}
                                        {p.branch && <p className="text-[11px] text-slate-400 font-bold">Branch: <code className="text-emerald-300">{p.branch}</code></p>}
                                        <div className="flex flex-wrap gap-2 pt-1">
                                            {p.status === 'aguardando_aprovacao' && (
                                                <>
                                                    <button type="button" onClick={() => setProposalStatus(p.id, 'aprovada')} className="px-3 py-1.5 rounded-lg bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest">Aprovar</button>
                                                    <button type="button" onClick={() => setProposalStatus(p.id, 'rejeitada')} className="px-3 py-1.5 rounded-lg bg-rose-500 text-white text-[10px] font-black uppercase tracking-widest">Rejeitar</button>
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
                                                            addToast(`Branch sugerida "ai/fix-${slug}" preparada para sua aprovação!`, 'info');
                                                        }}
                                                        className="px-3 py-1.5 rounded-lg bg-amber-400 text-slate-900 text-[10px] font-black uppercase tracking-widest"
                                                    >
                                                        Simular Proposta do Agente
                                                    </button>
                                                    <button type="button" onClick={() => setProposalStatus(p.id, 'rejeitada')} className="px-3 py-1.5 rounded-lg bg-slate-700 text-slate-200 text-[10px] font-black uppercase tracking-widest">Cancelar</button>
                                                </>
                                            )}
                                            {p.status === 'aprovada' && (
                                                <button type="button" onClick={() => setProposalStatus(p.id, 'aplicada')} className="px-3 py-1.5 rounded-lg bg-indigo-500 text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-1"><CheckCheck size={12} /> Marcar como aplicada</button>
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

            {/* Modal de configuração do agente */}
            {selectedDef && (() => {
                const def = selectedDef;
                const Icon = ICONS[def.icon] || Bot;
                const s = getAgentSettings(config, def.id);
                return (
                    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedId(null)}>
                        <div className="bg-white dark:bg-slate-800 rounded-[32px] shadow-2xl w-full max-w-4xl max-h-[90vh] border dark:border-slate-700 overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
                            <div className="p-6 border-b dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50 shrink-0">
                                <div className="flex items-center gap-3">
                                    <span className={`p-2.5 rounded-xl ${COLOR_CLASSES[def.color]}`}><Icon size={22} /></span>
                                    <div>
                                        <h3 className="font-black text-lg text-slate-900 dark:text-white uppercase tracking-tighter italic">{def.name}</h3>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{def.department} · {def.audience}</p>
                                    </div>
                                </div>
                                <button type="button" onClick={() => setSelectedId(null)} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700"><X size={20} /></button>
                            </div>

                            <fieldset disabled={!canManage} className="min-w-0 border-0 p-0 m-0 flex-1 overflow-y-auto">
                                <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
                                    <div className="space-y-6">
                                        <div>
                                            <h4 className={LABEL_CLASS}>O que este agente faz</h4>
                                            <ul className="mt-2 space-y-2">
                                                {def.capabilities.map(c => {
                                                    const hasAny = s.links.some(l => roleHasPermission(roles.find(r => r.id === users.find(u => u.id === l.userId)?.roleId), c.permission));
                                                    return (
                                                        <li key={c.label} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700">
                                                            <div className="flex items-start justify-between gap-2">
                                                                <p className="text-sm font-black text-slate-800 dark:text-slate-100">{c.label}</p>
                                                                <span className="shrink-0 text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center gap-1" title={c.permission}><Lock size={10} /> {getPermissionName(c.permission)}</span>
                                                            </div>
                                                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">{c.description}</p>
                                                            {s.links.length > 0 && !hasAny && <p className="text-[10px] font-black text-amber-600 mt-1">Nenhum dos números autorizados possui esta permissão.</p>}
                                                        </li>
                                                    );
                                                })}
                                            </ul>
                                            <p className="text-[11px] text-slate-400 font-bold mt-2">Cada capacidade só é liberada a quem tem a permissão indicada no perfil.</p>
                                        </div>

                                        <div className="space-y-3">
                                            <h4 className={LABEL_CLASS}>Opções</h4>
                                            <label className="flex items-center justify-between gap-3 text-sm font-bold text-slate-700 dark:text-slate-200">
                                                <span className="flex items-center gap-2"><ShieldCheck size={16} className="text-slate-400" /> Pedir confirmação antes de gravar no ERP</span>
                                                <Toggle checked={s.requireConfirmation} onChange={v => patchAgent(def.id, { requireConfirmation: v })} />
                                            </label>
                                            <label className="flex items-center justify-between gap-3 text-sm font-bold text-slate-700 dark:text-slate-200">
                                                <span className="flex items-center gap-2"><Mic size={16} className="text-slate-400" /> Aceitar mensagens de áudio</span>
                                                <Toggle checked={s.acceptAudio} onChange={v => patchAgent(def.id, { acceptAudio: v })} />
                                            </label>
                                            {def.supportsImages && (
                                                <label className="flex items-center justify-between gap-3 text-sm font-bold text-slate-700 dark:text-slate-200">
                                                    <span className="flex items-center gap-2"><ImageIcon size={16} className="text-slate-400" /> Aceitar fotos e documentos</span>
                                                    <Toggle checked={s.acceptImages} onChange={v => patchAgent(def.id, { acceptImages: v })} />
                                                </label>
                                            )}
                                            {def.supportsProactive && (
                                                <label className="flex items-center justify-between gap-3 text-sm font-bold text-slate-700 dark:text-slate-200">
                                                    <span className="flex items-center gap-2"><Bell size={16} className="text-slate-400" /> Permitir alertas enviados pelo agente</span>
                                                    <Toggle checked={s.proactiveAlerts} onChange={v => patchAgent(def.id, { proactiveAlerts: v })} />
                                                </label>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <h4 className={LABEL_CLASS}>Instruções Personalizadas (Prompt de Sistema Customizado)</h4>
                                            <textarea
                                                rows={3}
                                                className={INPUT_CLASS}
                                                placeholder={`Ex.: Sempre confirme o centro de custo antes de lançar; ou "Só liberar cotação acima de R$ 10.000 após confirmar CNPJ"...`}
                                                value={s.customSystemPrompt || ''}
                                                onChange={e => patchAgent(def.id, { customSystemPrompt: e.target.value })}
                                            />
                                            <p className="text-[10px] text-slate-400 font-bold ml-1">
                                                Regras extras de negócio ou tom de voz aplicadas especificamente ao {def.name}.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="space-y-3">
                                            <h4 className={LABEL_CLASS}>Números autorizados</h4>
                                            {s.links.length === 0 && <p className="text-xs font-bold text-slate-400">Ninguém autorizado ainda. Sem vínculo, o agente ignora todas as mensagens.</p>}
                                            <ul className="space-y-2">
                                                {s.links.map(l => {
                                                    const u = users.find(x => x.id === l.userId);
                                                    const elig = u ? getUserEligibility(u, roles, def.minPermissions) : { eligible: false, missing: [] as string[] };
                                                    return (
                                                        <li key={l.id} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700">
                                                            <div className="min-w-0">
                                                                <p className="text-sm font-black text-slate-800 dark:text-slate-100 truncate">
                                                                    {userLabel(l.userId)}{' '}
                                                                    <span className="text-[10px] text-slate-400 font-bold">· {l.label || roleLabel(l.userId)}</span>
                                                                </p>
                                                                <p className="text-xs text-slate-500 font-bold">{formatPhone(l.phone)}</p>
                                                                {!elig.eligible && (
                                                                    <p className="text-[10px] font-black text-rose-500 flex items-center gap-1"><AlertTriangle size={11} /> {u ? (elig.missing.length ? `Perfil sem: ${elig.missing.map(getPermissionName).join(', ')}` : 'Usuário inativo') : 'Usuário removido'} — será bloqueado</p>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => addToast(`Disparo de teste enviado para ${userLabel(l.userId)} (${formatPhone(l.phone)}) via ${def.name}!`, 'success')}
                                                                    className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-black uppercase tracking-wider hover:bg-emerald-100"
                                                                    title="Simular envio de mensagem de boas-vindas/teste para este número"
                                                                >
                                                                    Testar Disparo
                                                                </button>
                                                                <button type="button" onClick={() => removeAgentLink(def.id, l.id)} className="p-2 text-slate-400 hover:text-rose-500"><Trash2 size={16} /></button>
                                                            </div>
                                                        </li>
                                                    );
                                                })}
                                            </ul>
                                            <div className="space-y-2">
                                                <select className={INPUT_CLASS} value={linkUserId} onChange={e => handleSelectUserForLink(e.target.value)}>
                                                    <option value="">Selecione o usuário…</option>
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
                                                    <input
                                                        className={INPUT_CLASS}
                                                        placeholder="WhatsApp: (11) 98765-4321"
                                                        inputMode="tel"
                                                        value={linkPhone}
                                                        onChange={e => setLinkPhone(formatPhoneInput(e.target.value))}
                                                    />
                                                    <input
                                                        className={INPUT_CLASS}
                                                        placeholder="Apelido/Cargo (ex: Plantão Usina)"
                                                        value={linkLabel}
                                                        onChange={e => setLinkLabel(e.target.value)}
                                                    />
                                                </div>
                                                <button type="button" onClick={() => addAgentLink(def)} className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 text-white font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-1 hover:bg-indigo-500 transition-all"><Plus size={14} /> Adicionar Número Autorizado</button>
                                                <p className="text-[10px] text-slate-400 font-bold ml-1">Exige no perfil: {def.minPermissions.map(getPermissionName).join(', ')}.</p>
                                            </div>
                                        </div>

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
                                                        Limpar conversa
                                                    </button>
                                                )}
                                            </div>
                                            <div className="rounded-2xl bg-[#efeae2] dark:bg-slate-900 p-4 space-y-2 max-h-60 overflow-y-auto">
                                                {(chatMessages[def.id] || def.example).map((m, i) => (
                                                    <div key={i} className={`flex ${m.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                                                        <div className={`max-w-[85%] px-3 py-2 rounded-2xl text-xs font-medium shadow-sm ${m.from === 'user' ? 'bg-[#d9fdd3] text-slate-800 rounded-br-md' : 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 rounded-bl-md'}`}>
                                                            {m.text}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="flex gap-2">
                                                <input
                                                    className={INPUT_CLASS}
                                                    placeholder={`Envie uma mensagem para ${def.name}...`}
                                                    value={chatInput}
                                                    onChange={e => setChatInput(e.target.value)}
                                                    onKeyDown={e => {
                                                        if (e.key === 'Enter') {
                                                            e.preventDefault();
                                                            handleSendSimulatedMessage(def);
                                                        }
                                                    }}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => handleSendSimulatedMessage(def)}
                                                    className="px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[10px] uppercase tracking-widest shrink-0 transition-all"
                                                >
                                                    Enviar
                                                </button>
                                            </div>
                                            <p className="text-[10px] text-slate-400 font-bold ml-1">
                                                Teste agora: o simulador responde com os dados reais carregados no ERP.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </fieldset>
                        </div>
                    </div>
                );
            })()}
        </div>
    );

};

export default AIAgentsHub;
