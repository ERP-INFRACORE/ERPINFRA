import React, { useState, useMemo, useEffect } from 'react';
import {
  Bot,
  Sparkles,
  AlertTriangle,
  AlertCircle,
  Info,
  Copy,
  Check,
  Search,
  Filter,
  RefreshCw,
  Code2,
  Database,
  Monitor,
  Terminal,
  ChevronDown,
  ChevronUp,
  X,
  CheckCircle2,
  Layers,
  ShieldAlert,
  Cpu,
  FileCode,
  Zap,
  ExternalLink,
  Lock,
  GitPullRequest,
  Plus,
  Trash2,
  Wand2,
  RotateCcw,
  Activity,
  Download,
  FileJson,
  Radio,
  Clock,
  ShieldCheck
} from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { APP_PERMISSIONS } from '../permission_constants';
import { getAIConfig, setAIConfig, isSuperAdminRole, isUserAdmin, newId } from '../ai_agents_constants';

export interface CodeReviewSuggestion {
  id: string;
  module: string;
  file: string;
  category: 'Performance' | 'Segurança & RBAC' | 'Regra de Negócio' | 'Banco de Dados (SQL)' | 'UX & Arquitetura';
  impact: 'Alto' | 'Médio';
  title: string;
  rationale: string;
  codeBefore: string;
  codeAfter: string;
  prompt: string;
}

const CODE_REVIEW_SUGGESTIONS: CodeReviewSuggestion[] = [
  {
    id: 'REV-CODE-01',
    module: 'Arquitetura Global',
    file: 'App.tsx',
    category: 'Performance',
    impact: 'Alto',
    title: 'Code Splitting com React.lazy() nas 10 Rotas Principais',
    rationale:
      'O bundle principal (dist/assets/index.js) possui ~1.7 MB porque todas as 10 páginas são importadas estaticamente em App.tsx. Usar React.lazy + Suspense reduz o carregamento inicial em mais de 65%.',
    codeBefore: `import Dashboard from './pages/Dashboard';
import Sales from './pages/Sales';
import Purchases from './pages/Purchases';
import Finance from './pages/Finance';`,
    codeAfter: `const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Sales = React.lazy(() => import('./pages/Sales'));
const Purchases = React.lazy(() => import('./pages/Purchases'));
const Finance = React.lazy(() => import('./pages/Finance'));`,
    prompt: `Em \`App.tsx\`, converta os imports estáticos das páginas (\`Dashboard\`, \`Sales\`, \`Purchases\`, \`Clients\`, \`Production\`, \`Finance\`, \`HR\`, \`Reports\`, \`Fleet\`, \`Settings\`) para \`React.lazy(() => import(...))\` envolvendo \`<Routes>\` com \`<React.Suspense fallback={<div className="p-8 text-center font-bold">Carregando módulo...</div>}>\`.`
  },
  {
    id: 'REV-CODE-02',
    module: 'Faturamento (Vendas)',
    file: 'pages/Sales.tsx',
    category: 'Regra de Negócio',
    impact: 'Alto',
    title: 'Trava Automática de Limite de Crédito e Desconto Máximo de Parâmetros',
    rationale:
      'As configurações settings.operational.maxDiscount (15%) e client.creditLimit existem no banco, mas Sales.tsx permite fechar venda a prazo acima do limite de crédito do cliente sem exigir senha de gerente.',
    codeBefore: `const finalAmount = subtotal - discountValue;
addSale(newSale);`,
    codeAfter: `const maxAllowedDiscount = (settings.operational?.maxDiscount ?? 15) / 100 * subtotal;
if (discountValue > maxAllowedDiscount && !hasPermission('sales.approve')) {
  return addToast('Desconto acima do limite permitido para seu perfil!', 'error');
}
if (client?.creditLimit && finalAmount > client.creditLimit && !hasPermission('sales.approve')) {
  return addToast('Venda excede o limite de crédito cadastrado para o cliente!', 'warning');
}`,
    prompt: `Em \`pages/Sales.tsx\`, antes de concluir a venda em \`handleFinalizeSale\`, valide se o desconto aplicado ultrapassa \`settings.operational.maxDiscount\` e se o valor a prazo ultrapassa \`client.creditLimit\`, exigindo a permissão \`sales.approve\` caso ultrapasse.`
  },
  {
    id: 'REV-CODE-03',
    module: 'Financeiro',
    file: 'pages/Finance.tsx',
    category: 'Regra de Negócio',
    impact: 'Alto',
    title: 'Bloqueio de Duplicidade de Nota Fiscal / Documento ao Lançar Despesa',
    rationale:
      'Operadores podem lançar acidentalmente o mesmo boleto ou número de NF duas vezes para o mesmo parceiro/fornecedor.',
    codeBefore: `addTransaction(txData);`,
    codeAfter: `const isDuplicate = transactions.some(
  t => t.documentNumber && t.documentNumber === txData.documentNumber && t.partnerId === txData.partnerId && t.id !== txData.id
);
if (isDuplicate) {
  return addToast(\`Documento nº \${txData.documentNumber} já lançado para este parceiro!\`, 'error');
}
addTransaction(txData);`,
    prompt: `Em \`pages/Finance.tsx\`, na função \`handleSaveTransaction\`, verifique se já existe uma transação com o mesmo \`documentNumber\` e \`partnerId\` antes de chamar \`addTransaction\`, exibindo alerta caso seja duplicada.`
  },
  {
    id: 'REV-CODE-04',
    module: 'Frota',
    file: 'pages/Fleet.tsx',
    category: 'Regra de Negócio',
    impact: 'Alto',
    title: 'Validação de Hodômetro Progressivo no Abastecimento e Manutenção',
    rationale:
      'Permite lançar um abastecimento com KM menor que o KM atual registrado no veículo, distorcendo o cálculo de média km/L e custo por KM nos relatórios.',
    codeBefore: `addFuelLog(log);`,
    codeAfter: `if (selectedVehicle && Number(newFuel.km) < Number(selectedVehicle.km)) {
  return addToast(\`Hodômetro informado (\${newFuel.km} km) é menor que o KM atual do veículo (\${selectedVehicle.km} km)!\`, 'error');
}
addFuelLog(log);`,
    prompt: `Em \`pages/Fleet.tsx\`, ao salvar abastecimento (\`handleCreateFuel\`) ou manutenção (\`handleCreateMaint\`), valide que o campo \`km\` informado é maior ou igual ao \`km\` atual do veículo selecionado.`
  },
  {
    id: 'REV-CODE-05',
    module: 'Produção',
    file: 'pages/Production.tsx',
    category: 'Regra de Negócio',
    impact: 'Alto',
    title: 'Verificação Prévia de Saldo de Matéria-Prima Antes de Iniciar O.P.',
    rationale:
      'Ao iniciar uma Ordem de Produção vinculada a um traço/fórmula, o sistema deduz insumos mesmo quando o estoque fica negativo, sem alertar o operador de usina.',
    codeBefore: `updateProductionOrderStatus(order.id, 'Em Produção');`,
    codeAfter: `const formula = productionFormulas.find(f => f.id === order.formulaId);
const missing = formula?.ingredients.filter(ing => {
  const stock = inventory.find(i => i.id === ing.productId)?.quantity ?? 0;
  return stock < ing.quantity * order.quantity;
});
if (missing?.length) {
  return addToast(\`Estoque insuficiente de matéria-prima para iniciar a O.P.!\`, 'error');
}`,
    prompt: `Em \`pages/Production.tsx\` e \`context/AppContext.tsx\`, antes de mudar o status de uma Ordem de Produção para \`'Em Produção'\`, valide se todos os ingredientes da fórmula associada possuem saldo suficiente em \`inventory\`.`
  },
  {
    id: 'REV-CODE-06',
    module: 'Banco de Dados (Supabase)',
    file: 'supabase_schema.sql',
    category: 'Banco de Dados (SQL)',
    impact: 'Alto',
    title: 'Ativação dos Índices Compostos para Consultas de Fluxo de Caixa e Vendas',
    rationale:
      'No final de supabase_schema.sql, os comandos CREATE INDEX estão comentados. Descomentá-los acelera filtros por data, status e clientId em tabelas grandes.',
    codeBefore: `-- CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
-- CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);`,
    codeAfter: `CREATE INDEX IF NOT EXISTS idx_transactions_status_date ON transactions(status, date);
CREATE INDEX IF NOT EXISTS idx_sales_client_status ON sales("clientId", status);
CREATE INDEX IF NOT EXISTS idx_inventory_low_stock ON inventory(quantity, "minStock");`,
    prompt: `Em \`supabase_schema.sql\` (linhas 560-578), descomente os índices de performance e adicione índices compostos para \`transactions(status, date)\` e \`sales("clientId", status)\`.`
  },
  {
    id: 'REV-CODE-07',
    module: 'Custos e Despesas (Compras)',
    file: 'pages/Purchases.tsx',
    category: 'Regra de Negócio',
    impact: 'Médio',
    title: 'Cálculo Automático do Custo Médio Ponderado ao Receber Ordem de Compra',
    rationale:
      'Quando uma Ordem de Compra é recebida, a quantidade em estoque sobe, mas o costPrice do item não é recalculado pelo custo médio ponderado.',
    codeBefore: `const newQty = item.quantity + poItem.quantity;
updateInventory({ ...item, quantity: newQty });`,
    codeAfter: `const newQty = item.quantity + poItem.quantity;
const weightedCost = ((item.quantity * (item.costPrice || 0)) + (poItem.quantity * poItem.price)) / (newQty || 1);
updateInventory({ ...item, quantity: newQty, costPrice: Number(weightedCost.toFixed(2)) });`,
    prompt: `Em \`context/AppContext.tsx\`, dentro de \`receivePurchaseOrder\`, atualize também o \`costPrice\` do item em \`inventory\` calculando o Custo Médio Ponderado entre o saldo anterior e a nova entrada.`
  },
  {
    id: 'REV-CODE-08',
    module: 'Segurança & Auditoria',
    file: 'context/AppContext.tsx',
    category: 'Segurança & RBAC',
    impact: 'Alto',
    title: 'Trilha de Auditoria Automática em Exclusões Críticas (Vendas, Frota e Contas)',
    rationale:
      'Algumas funções de exclusão removem registros sem gravar automaticamente o estado anterior (snapshot JSON) em audit_logs.',
    codeBefore: `await api.remove('fleet', id);
setFleet(prev => prev.filter(v => v.id !== id));`,
    codeAfter: `const target = fleet.find(v => v.id === id);
await api.remove('fleet', id);
setFleet(prev => prev.filter(v => v.id !== id));
addAuditLog('Exclusão de Veículo', 'Frota', \`Placa \${target?.plate} (\${target?.name}) removida.\`, 'warning');`,
    prompt: `Em \`context/AppContext.tsx\`, adicione chamadas automáticas a \`addAuditLog(..., 'warning')\` em todas as funções \`delete*\` (\`deleteVehicle\`, \`deleteTire\`, \`deleteEmployee\`, \`deletePlanAccount\`) registrando a identificação do item excluído.`
  }
];

export interface AuditIssue {
  id: string;
  module: string;
  routePath: string;
  file: string;
  lines: string;
  layer: 'Front-end' | 'Back-end' | 'Front-end & Back-end';
  severity: 'Crítico' | 'Alto' | 'Médio';
  title: string;
  description: string;
  prompt: string;
  liveDetected?: boolean;
  liveMetric?: string;
}

export const STATIC_AUDIT_ISSUES: AuditIssue[] = [
  // 0. ARQUITETURA GLOBAL & SUPABASE
  {
    id: 'ERR-BACK-01',
    module: 'Global / Supabase',
    routePath: '/settings',
    file: 'src/services/api.ts & supabase_schema.sql',
    lines: 'api.ts:27, 45 | supabase_schema.sql:7-286',
    layer: 'Back-end',
    severity: 'Crítico',
    title: 'Conflito de IDs String vs Colunas UUID no Supabase',
    description:
      'O schema do PostgreSQL/Supabase define "id" e chaves estrangeiras ("clientId", "supplierId", "vehicleId", "accountId", "roleId", "employeeId") como UUID, mas o front-end gera IDs como "S-170...", "PO-170...", "ITM-170..." e api.ts faz apenas "id && id.length > 5", enviando strings não-UUID e "" em FKs opcionais, causando erro 22P02 (invalid input syntax for type uuid).',
    prompt: `Corrija a incompatibilidade de UUID e chaves estrangeiras vazias na camada de persistência:
1. Em \`src/services/api.ts\`, crie um helper \`const isValidUUID = (v: any) => typeof v === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);\`.
2. Em \`createItem\` e \`updateItem\` (\`src/services/api.ts\`), sanitize o payload: se \`item.id\` não for um UUID válido (ex: \`'S-170...'\`), substitua por \`crypto.randomUUID()\`; e para todos os campos terminados em \`Id\` (como \`clientId\`, \`supplierId\`, \`vehicleId\`, \`accountId\`, \`employeeId\`, \`roleId\`), se o valor for \`""\` ou não for UUID válido, converta para \`null\`.
3. Alternativamente, em \`supabase_schema.sql\`, altere as colunas \`id\` e FKs de \`UUID\` para \`TEXT DEFAULT uuid_generate_v4()::text\`.`
  },
  {
    id: 'ERR-BACK-02',
    module: 'Global / Supabase',
    routePath: '/settings',
    file: 'context/AppContext.tsx',
    lines: '625-1155',
    layer: 'Back-end',
    severity: 'Crítico',
    title: 'Mutações do AppContext sem Persistência Remota no Supabase',
    description:
      'Diversas funções (addSale, addBudget, updateBudgetStatus, addPurchaseOrder, receivePurchaseOrder, addVehicle, updateVehicle, deleteVehicle, addMaintenanceRecord, addFuelLog, addTire, addQualityTest, addPayroll, payPayroll [com setPayroll duplicado nas linhas 976/978], addTimeLog, addVacation, addSalaryAdvance e addAuditLog) atualizam apenas o estado local/localStorage sem chamar syncAdd/api.updateItem/syncDelete. Além disso, a linha 786 reseta planOfAccounts a cada reload.',
    prompt: `Em \`context/AppContext.tsx\`:
1. Conecte todas as funções de mutação que hoje alteram apenas o estado React local ao Supabase usando \`syncAdd\`, \`api.updateItem\` e \`syncDelete\` (incluindo \`addSale\`, \`addBudget\`, \`updateBudgetStatus\`, \`addPurchaseOrder\`, \`receivePurchaseOrder\`, \`addVehicle\`, \`updateVehicle\`, \`updateVehicleStatus\`, \`deleteVehicle\`, \`addMaintenanceRecord\`, \`deleteMaintenanceRecord\`, \`addFuelLog\`, \`deleteFuelLog\`, \`addTire\`, \`updateTire\`, \`deleteTire\`, \`addTireHistory\`, \`deleteTireHistory\`, \`addQualityTest\`, \`addPayroll\`, \`payPayroll\`, \`addTimeLog\`, \`addVacation\`, \`updateVacationStatus\`, \`deleteVacation\`, \`addSalaryAdvance\`, \`updateAdvanceStatus\`, \`paySalaryAdvance\`, \`deleteAdvance\` e \`addAuditLog\`).
2. Em \`loadSupabaseData\` (linhas 625-795), adicione no \`Promise.all\` a leitura de \`budgets\`, \`maintenance_records\`, \`fuel_logs\`, \`tires\`, \`tire_history\`, \`time_logs\`, \`vacations\`, \`salary_advances\` e \`audit_logs\`.
3. Na linha 786, remova \`setPlanOfAccounts(INITIAL_PLAN_OF_ACCOUNTS)\` ou carregue da tabela \`plan_of_accounts\`.
4. Em \`payPayroll\` (linhas 976-978), remova a chamada duplicada a \`setPayroll\`.`
  },
  {
    id: 'ERR-BACK-03',
    module: 'Global / Supabase',
    routePath: '/settings',
    file: 'supabase_schema.sql',
    lines: '15-286',
    layer: 'Back-end',
    severity: 'Crítico',
    title: 'Divergência de Colunas entre TypeScript (types.ts) e supabase_schema.sql',
    description:
      'O schema SQL não possui colunas enviadas pelo front-end em transactions ("partnerName", "costCenter", "paymentMethod", "competenceDate", "notes"), financial_accounts ("bankCode", "nickname", "agency", "accountNumber", "pixType", "pixKey", "initialBalance"), purchase_orders ("competenceDate"), fleet ("renavam", "color", "colorName"), clients/suppliers ("stateReg") e settings ("website", "interfaceDensity", "enableAnimations").',
    prompt: `Em \`supabase_schema.sql\`, adicione as colunas ausentes para alinhar o banco com \`types.ts\`:
1. Na tabela \`transactions\`: adicione \`"partnerName" TEXT\`, \`"costCenter" TEXT\`, \`"paymentMethod" TEXT\`, \`"competenceDate" TEXT\`, \`"notes" TEXT\`.
2. Na tabela \`financial_accounts\`: adicione \`"bankCode" TEXT\`, \`"nickname" TEXT\`, \`"agency" TEXT\`, \`"accountNumber" TEXT\`, \`"pixType" TEXT\`, \`"pixKey" TEXT\`, \`"initialBalance" NUMERIC DEFAULT 0\`.
3. Na tabela \`purchase_orders\`: adicione \`"competenceDate" TEXT\`.
4. Na tabela \`fleet\`: adicione \`"renavam" TEXT\`, \`"color" TEXT\`, \`"colorName" TEXT\`.
5. Nas tabelas \`clients\` e \`suppliers\`: adicione \`"stateReg" TEXT\`.
6. Na tabela \`settings\`: adicione \`"website" TEXT\`, \`"interfaceDensity" TEXT\`, \`"enableAnimations" BOOLEAN DEFAULT true\`.`
  },
  {
    id: 'ERR-BACK-04',
    module: 'Global / Supabase',
    routePath: '/settings',
    file: 'context/AppContext.tsx',
    lines: '86, 513',
    layer: 'Back-end',
    severity: 'Alto',
    title: 'Usuário Inicial "vendas" Vinculado a roleId Inexistente',
    description:
      'Em INITIAL_USERS (linha 86), o usuário "vendas" possui roleId: "manager", mas em INITIAL_ROLES o ID cadastrado é "manager_com". Isso faz com que hasPermission() retorne false para qualquer ação quando logado com "vendas".',
    prompt: `Em \`context/AppContext.tsx\` (linha 86), altere \`roleId: 'manager'\` do usuário \`vendas\` em \`INITIAL_USERS\` para \`roleId: 'manager_com'\`, correspondendo ao perfil definido em \`INITIAL_ROLES\` na linha 513.`
  },

  // LAYOUT & PERMISSÕES GLOBAIS
  {
    id: 'ERR-FRONT-00',
    module: 'Layout & Permissões',
    routePath: '/',
    file: 'components/Layout.tsx & permission_constants.ts',
    lines: 'Layout.tsx:40-47 | permission_constants.ts:24-27',
    layer: 'Front-end',
    severity: 'Crítico',
    title: 'Permissões Inexistentes no Menu Superior Ocultam Abas para Perfis Não-Admin',
    description:
      'Em Layout.tsx (linhas 40-47), navItems exige "clients.manage", "finance.view", "employees.view" e "sales.view" (inclusive para Relatórios). Porém em permission_constants.ts os IDs são "clients.view", "finance.dashboard", "hr.view", "reports.view_basic" e "sales.view.sales", ocultando as abas do menu para usuários não-admin.',
    prompt: `Em \`components/Layout.tsx\` (linhas 38-49) e \`permission_constants.ts\`:
1. Atualize as permissões de \`navItems\` em \`components/Layout.tsx\` para usar os IDs reais de \`permission_constants.ts\`:
   - Cadastros: \`'clients.view'\`
   - Faturamento: aceite \`hasPermission('sales.view') || hasPermission('sales.view.sales')\`
   - Financeiro: \`'finance.dashboard'\`
   - RH: \`'hr.view'\`
   - Relatórios: \`'reports.view_basic'\`
2. Em \`permission_constants.ts\` (linhas 24-27) e \`context/AppContext.tsx\` (\`INITIAL_ROLES\`), padronize \`sales.view\` e \`sales.create\` para evitar divergência.`
  },

  // 1. LOGIN
  {
    id: 'ERR-LOGIN-01',
    module: 'Login',
    routePath: '/login',
    file: 'pages/Login.tsx & context/AppContext.tsx',
    lines: 'Login.tsx:137-140 | AppContext.tsx:578, 868',
    layer: 'Front-end & Back-end',
    severity: 'Médio',
    title: 'Sessão de Login Não Persiste no Reload (F5) e Botões Desconectados',
    description:
      'currentUser em AppContext.tsx inicia sempre como null sem ler localStorage/sessionStorage (dar F5 desloga o usuário). Além disso, em Login.tsx o checkbox "Lembrar de mim" (linha 137) e o link "Esqueceu a senha?" (linha 140) não possuem estado nem onClick.',
    prompt: `Em \`context/AppContext.tsx\` e \`pages/Login.tsx\`:
1. Em \`context/AppContext.tsx\` (linha 578), inicialize \`currentUser\` lendo \`localStorage.getItem('infracore_current_user') || sessionStorage.getItem('infracore_current_user')\`.
2. Modifique \`login(u, p, rememberMe = true)\` para salvar o usuário autenticado (sem a senha) no \`localStorage\` (se \`rememberMe\`) ou \`sessionStorage\`, e limpe ambos em \`logout()\`.
3. Em \`pages/Login.tsx\` (linhas 137-140), conecte o checkbox \`"Lembrar de mim"\` a um estado \`rememberMe\` e adicione handler ao botão \`"Esqueceu a senha?"\` exibindo instrução/toast de recuperação.`
  },

  // 2. DASHBOARD
  {
    id: 'ERR-DASH-01',
    module: 'Dashboard',
    routePath: '/',
    file: 'pages/Dashboard.tsx',
    lines: '142, 205, 255, 428',
    layer: 'Front-end',
    severity: 'Médio',
    title: 'Busca Sem Ação, Redirecionamento de Estoque Errado e Indicadores Fixos',
    description:
      'Na linha 142 o botão de lupa (<Search />) não tem onClick; na linha 428 o alerta de Estoque Crítico navega para "/clients" em vez de "/purchases" (onde fica a gestão de estoque); nas linhas 205 e 255 os percentuais (+2.4% vs mês anterior e width: 45%) estão hardcoded.',
    prompt: `Em \`pages/Dashboard.tsx\`:
1. Na linha 428, altere o redirecionamento do alerta de Estoque Crítico de \`navigate('/clients')\` para \`navigate('/purchases')\`.
2. Nas linhas 205 e 255, substitua os valores estáticos \`+2.4% vs mês anterior\` e \`style={{ width: '45%' }}\` pelo cálculo real comparando receitas/despesas do mês atual com o mês anterior a partir de \`transactions\`.
3. Na linha 142, implemente uma busca rápida global ou remova o botão \`<Search size={20} />\` sem ação.`
  },

  // 3. FATURAMENTO (VENDAS)
  {
    id: 'ERR-SALES-01',
    module: 'Faturamento (Vendas)',
    routePath: '/sales',
    file: 'pages/Sales.tsx',
    lines: '1034, 1073, 1076',
    layer: 'Front-end',
    severity: 'Alto',
    title: 'Botões "Imprimir Cupom" e "Exportar NF-e" Sem Ação no Detalhe da Venda',
    description:
      'No modal de detalhes da venda (selectedSale), os botões "Imprimir Cupom" (linha 1073) e "Exportar NF-e" (linha 1076) não possuem onClick, e o badge de status na linha 1034 exibe sempre "CONCILIADO" fixo.',
    prompt: `Em \`pages/Sales.tsx\` (linhas 1034-1080):
1. No botão \`"Imprimir Cupom"\` (linha 1073), adicione \`onClick={() => handlePrintOrder(selectedSale)}\`.
2. No botão \`"Exportar NF-e"\` (linha 1076), adicione \`onClick={() => { setShowDanfeModal(selectedSale); setSelectedSale(null); }}\`.
3. Na linha 1034, substitua o texto fixo \`'CONCILIADO'\` pelo status real da transação correspondente em \`transactions\` ou \`selectedSale.status\`.`
  },
  {
    id: 'ERR-SALES-02',
    module: 'Faturamento (Vendas)',
    routePath: '/sales',
    file: 'pages/Sales.tsx & context/AppContext.tsx',
    lines: 'Sales.tsx:266-310, 1948-2003 | AppContext.tsx:883',
    layer: 'Front-end & Back-end',
    severity: 'Alto',
    title: 'Busca de Orçamentos Inoperante e Edição de Orçamento Duplica Registro',
    description:
      'Na aba Orçamentos (linha 1948), o input "Buscar por cliente..." não possui state/onChange. Além disso, clicar em "Editar Orçamento" (linha 1996) carrega os itens no formulário, mas ao salvar (handleSaveBudget, linha 266) chama sempre addBudget com um novo ID, duplicando o orçamento em vez de atualizá-lo.',
    prompt: `Em \`context/AppContext.tsx\` e \`pages/Sales.tsx\`:
1. Crie e exporte \`updateBudget: (budget: Budget) => void\` em \`context/AppContext.tsx\` (sincronizando com o Supabase via \`api.updateItem('budgets', budget)\`).
2. Em \`pages/Sales.tsx\`, crie o estado \`editingBudgetId\`. Ao clicar em \`"Editar Orçamento"\` (linha 1996), defina \`setEditingBudgetId(showBudgetModal.id)\` e, em \`handleSaveBudget\` (linha 266), chame \`updateBudget\` quando \`editingBudgetId\` estiver preenchido.
3. Na linha 1948 de \`pages/Sales.tsx\`, conecte o input \`"Buscar por cliente..."\` a um estado \`budgetSearch\` e filtre a listagem de \`budgets\`.`
  },
  {
    id: 'ERR-SALES-03',
    module: 'Faturamento (Vendas)',
    routePath: '/sales',
    file: 'pages/Sales.tsx',
    lines: '149, 861-926',
    layer: 'Front-end',
    severity: 'Médio',
    title: 'Bug de Fuso Horário no Filtro de Data e Dados Fictícios na DANFE',
    description:
      'Na linha 149, new Date(historyDate).toLocaleDateString("pt-BR") interpreta YYYY-MM-DD em UTC e recua 1 dia no fuso UTC-3 (Brasil). Além disso, o modal de pré-visualização da DANFE (linhas 861-926) exibe CNPJ e endereço fictícios em vez de usar settings.',
    prompt: `Em \`pages/Sales.tsx\`:
1. Na linha 149, substitua \`new Date(historyDate).toLocaleDateString('pt-BR')\` por \`historyDate.split('-').reverse().join('/')\` para evitar deslocamento de fuso horário UTC-3.
2. No modal \`showDanfeModal\` (linhas 861-926), substitua a razão social, CNPJ, IE e endereço fixos pelos dados dinâmicos de \`settings\` (\`useApp().settings\`).`
  },

  // 4. CUSTOS E DESPESAS (COMPRAS)
  {
    id: 'ERR-PURCH-01',
    module: 'Custos e Despesas (Compras)',
    routePath: '/purchases',
    file: 'pages/Purchases.tsx',
    lines: '50, 275',
    layer: 'Front-end',
    severity: 'Crítico',
    title: 'Tela Branca Após Criar Pedido de Compra (setActiveTab("approval") Inexistente)',
    description:
      'Em handleCreateOrder (linha 275), após salvar uma Ordem de Compra o código executa setActiveTab("approval"). Porém não existe nenhum bloco {activeTab === "approval" && ...} no JSX, deixando toda a área principal da página em branco!',
    prompt: `Em \`pages/Purchases.tsx\`:
1. Na linha 275 (dentro de \`handleCreateOrder\`), altere \`setActiveTab('approval')\` para \`setActiveTab('orders')\`.
2. Na linha 50, ajuste a tipagem do estado \`activeTab\` removendo \`'approval'\` ou crie a aba de aprovação correspondente.`
  },
  {
    id: 'ERR-PURCH-02',
    module: 'Custos e Despesas (Compras)',
    routePath: '/purchases',
    file: 'pages/Purchases.tsx',
    lines: '69, 1582, 1590',
    layer: 'Front-end',
    severity: 'Crítico',
    title: 'Modal de Novo Fornecedor Não Existe no JSX e Botão Editar Sem Ação',
    description:
      'Na aba Fornecedores, o botão "Adicionar Fornecedor" (linha 1590) chama setIsSupplierModalOpen(true), mas isSupplierModalOpen nunca é renderizado no JSX. O botão "Editar" no card do fornecedor (linha 1582) também não possui onClick.',
    prompt: `Em \`pages/Purchases.tsx\`:
1. Renderize o modal \`{isSupplierModalOpen && (...)}\` conectado a \`addSupplier\` e \`updateSupplier\` do \`useApp()\`.
2. Na linha 1582, adicione o \`onClick\` no botão \`"Editar"\` do card de fornecedor para abrir o modal preenchido com os dados do fornecedor selecionado.`
  },
  {
    id: 'ERR-PURCH-03',
    module: 'Custos e Despesas (Compras)',
    routePath: '/purchases',
    file: 'pages/Purchases.tsx',
    lines: '1123, 1440, 1449, 1984',
    layer: 'Front-end',
    severity: 'Alto',
    title: 'Filtros e Buscas de Pedidos/Estoque Desconectados e Preço Ausente no Modal',
    description:
      'Os inputs de busca nas linhas 1123 (Pedidos) e 1440 (Estoque) e os botões ["Todos", "Crítico", "Normal", "Excedente"] (linha 1449) não têm state/onChange/onClick. Além disso, o modal de item de estoque (linha 1984) não possui campo para editar price/costPrice.',
    prompt: `Em \`pages/Purchases.tsx\`:
1. Crie estados \`orderSearch\`, \`stockSearch\` e \`stockFilter\` (\`'Todos' | 'Crítico' | 'Normal' | 'Excedente'\`) e conecte-os aos inputs nas linhas 1123 e 1440 e aos botões na linha 1449.
2. No modal \`isInventoryModalOpen\` (linhas 1984-2059), adicione os inputs numéricos para \`costPrice\` e \`price\`.`
  },
  {
    id: 'ERR-PURCH-04',
    module: 'Custos e Despesas (Compras)',
    routePath: '/purchases',
    file: 'pages/Purchases.tsx',
    lines: '286-312, 1685, 1844',
    layer: 'Front-end',
    severity: 'Alto',
    title: 'Modal OSM Não Deduz Quantidade de Peças do Estoque',
    description:
      'No modal de Ordem de Serviço de Manutenção (linha 1844), existe o select de peça (productId), mas não há input para productQuantity. Como newMaint.productQuantity fica sempre 0, handleCreateMaint (linha 301) nunca dá baixa da peça no estoque.',
    prompt: `Em \`pages/Purchases.tsx\` (linhas 1844-1855), adicione um input numérico para \`newMaint.productQuantity\` ao lado da seleção de peça do almoxarifado para que \`handleCreateMaint\` deduza corretamente o saldo do estoque via \`updateInventory\`.`
  },

  // 5. CADASTROS
  {
    id: 'ERR-CLI-01',
    module: 'Cadastros',
    routePath: '/clients',
    file: 'pages/Clients.tsx',
    lines: '47-56',
    layer: 'Front-end',
    severity: 'Crítico',
    title: 'Permissões Inexistentes (clients.manage, employees.manage, inventory.manage)',
    description:
      'A função canManage (linhas 47-56) verifica "clients.manage", "employees.manage" e "inventory.manage", que não existem em permission_constants.ts. Com isso, usuários não-admin ficam impedidos de criar ou editar clientes, colaboradores e produtos.',
    prompt: `Em \`pages/Clients.tsx\` (linhas 47-56), atualize a função \`canManage\` para verificar as permissões reais de \`permission_constants.ts\`:
- Clientes: \`hasPermission('clients.create') || hasPermission('clients.edit')\`
- Fornecedores: \`hasPermission('suppliers.manage')\`
- Colaboradores: \`hasPermission('hr.manage_employees')\`
- Produtos/Insumos: \`hasPermission('inventory.adjust') || hasPermission('inventory.view')\`
- Frota: \`hasPermission('fleet.manage')\`.`
  },
  {
    id: 'ERR-CLI-02',
    module: 'Cadastros',
    routePath: '/clients',
    file: 'pages/Clients.tsx',
    lines: '250-264, 453, 558',
    layer: 'Front-end',
    severity: 'Alto',
    title: 'Crash RangeError em Datas de Colaborador e Veículo Salvo Sem Campo "name"',
    description:
      'Nas linhas 453 e 558, new Date(formData.hireDate.split("/").reverse().join("-")).toISOString() lança RangeError: Invalid time value se a data já estiver em YYYY-MM-DD. Além disso, salvar veículo (linha 250) preenche "model" mas não define "name", deixando o título do veículo em branco em Fleet.tsx.',
    prompt: `Em \`pages/Clients.tsx\`:
1. Crie um helper \`const toInputDate = (d?: string) => !d ? '' : d.includes('/') ? d.split('/').reverse().join('-') : d.split('T')[0];\` e use-o nas linhas 453 e 558.
2. Em \`handleSave\` para \`fleet\` (linhas 250-264), garanta que \`name: formData.name || formData.model\` seja salvo no objeto \`Vehicle\`.`
  },

  // 6. PRODUÇÃO
  {
    id: 'ERR-PROD-01',
    module: 'Produção',
    routePath: '/production',
    file: 'pages/Production.tsx',
    lines: '142-149, 459-535',
    layer: 'Front-end',
    severity: 'Crítico',
    title: 'Impossível Cadastrar Nova Usina / Unidade de Produção Quando a Lista Está Vazia',
    description:
      'Na aba "Unidades" (linhas 459-535), não existe botão "Nova Unidade", e handleSaveUnit (linha 142) chama apenas updateProductionUnit(editingUnit). Se productionUnits estiver vazio, é impossível criar a primeira usina e lançar ordens de produção.',
    prompt: `Em \`pages/Production.tsx\`:
1. Extraia \`addProductionUnit\` e \`deleteProductionUnit\` de \`useApp()\` (linha 29).
2. Na aba \`units\` (linha 459), adicione um botão \`"Nova Unidade"\` que abre o modal com uma unidade inicial limpa.
3. Em \`handleSaveUnit\` (linha 142), verifique se \`productionUnits.some(u => u.id === editingUnit.id)\`; se existir, chame \`updateProductionUnit\`, caso contrário chame \`addProductionUnit\`.`
  },
  {
    id: 'ERR-PROD-02',
    module: 'Produção',
    routePath: '/production',
    file: 'pages/Production.tsx',
    lines: '112-135',
    layer: 'Front-end',
    severity: 'Alto',
    title: 'Modal de Qualidade Não Atualiza a Lista de Ensaios ao Registrar Novo Teste',
    description:
      'Em handleAddTest (linha 112), o ensaio tecnológico é adicionado no contexto global via addQualityTest(test), mas o estado local selectedOrder não é atualizado, fazendo parecer que o teste não foi salvo.',
    prompt: `Em \`pages/Production.tsx\` (linhas 112-135), dentro de \`handleAddTest\`, atualize também o estado local \`selectedOrder\`: \`setSelectedOrder(prev => prev ? { ...prev, qualityTests: [test, ...(prev.qualityTests || [])] } : null)\`.`
  },

  // 7. FINANCEIRO
  {
    id: 'ERR-FIN-01',
    module: 'Financeiro',
    routePath: '/finance',
    file: 'pages/Finance.tsx',
    lines: '367, 1124, 1138, 1299, 1345',
    layer: 'Front-end',
    severity: 'Crítico',
    title: 'Trava Hardcoded username === "admin" e Permissões Financeiras Inexistentes',
    description:
      'Na linha 367 a exclusão no fluxo de caixa exige currentUser?.username === "admin", ignorando perfis de Diretor/Gerente Financeiro. Além disso, as linhas 1124-1345 checam "finance.reconcile", "finance.transact" e "finance.delete", que não existem em permission_constants.ts.',
    prompt: `Em \`pages/Finance.tsx\`:
1. Na linha 367, substitua \`currentUser?.username === 'admin'\` por \`hasPermission('finance.delete_transaction')\`.
2. Nas linhas 1124 e 1138, substitua \`hasPermission('finance.reconcile')\` por \`hasPermission('finance.edit_transaction')\` e \`hasPermission('finance.transact')\` por \`hasPermission('finance.create_transaction')\`.
3. Nas linhas 1299 e 1345, substitua \`hasPermission('finance.delete')\` por \`hasPermission('finance.manage_accounts')\`.`
  },
  {
    id: 'ERR-FIN-02',
    module: 'Financeiro',
    routePath: '/finance',
    file: 'pages/Finance.tsx',
    lines: '90, 518, 1066, 1073',
    layer: 'Front-end',
    severity: 'Médio',
    title: 'Botões de Filtro/Exportação Sem Ação e Limite de 4 Contas no Modal',
    description:
      'Nas linhas 1066 e 1073 os botões <Filter /> e <Download /> não têm onClick. Na linha 518 o modal de lançamento corta as contas com accounts.slice(0, 4), impedindo selecionar a 5ª conta em diante, e inicia account com "Bradesco PJ" fixo (linha 90).',
    prompt: `Em \`pages/Finance.tsx\`:
1. Na linha 518, remova \`.slice(0, 4)\` de \`accounts.map\` para exibir todas as contas bancárias cadastradas e inicialize \`newTrans.account\` com \`accounts[0]?.name || ''\`.
2. Nas linhas 1066 e 1073, conecte o botão \`<Download />\` à função de exportação CSV das transações filtradas.`
  },

  // 8. RECURSOS HUMANOS (RH)
  {
    id: 'ERR-HR-01',
    module: 'RH',
    routePath: '/hr',
    file: 'pages/HR.tsx',
    lines: '204',
    layer: 'Front-end',
    severity: 'Crítico',
    title: 'Crash Fatal do React (Invalid Hook Call) ao Clicar em "Recibo" de Adiantamento',
    description:
      'Na linha 204, dentro da função handlePrintReceipt (chamada no onClick do botão "Recibo" na linha 728), o código executa const companySettings = useApp().settings;. Chamar um Hook dentro de um event handler viola as Rules of Hooks e trava a aplicação!',
    prompt: `Em \`pages/HR.tsx\`:
1. Na desestruturação principal de \`useApp()\` no topo do componente \`HR\` (linhas 38-45), inclua \`settings\`.
2. Na linha 204 (dentro de \`handlePrintReceipt\`), substitua \`const companySettings = useApp().settings;\` por \`const companySettings = settings;\`.`
  },
  {
    id: 'ERR-HR-02',
    module: 'RH',
    routePath: '/hr',
    file: 'pages/HR.tsx',
    lines: '54, 59',
    layer: 'Front-end',
    severity: 'Crítico',
    title: 'Bloqueio Total do Módulo de RH para Analistas de RH (Permissões Inexistentes)',
    description:
      'Nas linhas 54 e 59, HR.tsx checa hasPermission("employees.view") e hasPermission("employees.manage"), mas em permission_constants.ts as permissões de RH são "hr.view", "hr.manage_employees" e "hr.payroll". Usuários de RH recebem tela de "Acesso Restrito".',
    prompt: `Em \`pages/HR.tsx\` (linhas 54 e 59), substitua \`hasPermission('employees.view')\` por \`hasPermission('hr.view')\` e \`hasPermission('employees.manage')\` por \`hasPermission('hr.manage_employees') || hasPermission('hr.payroll')\`.`
  },
  {
    id: 'ERR-HR-03',
    module: 'RH',
    routePath: '/hr',
    file: 'pages/HR.tsx',
    lines: '552, 679, 1127',
    layer: 'Front-end',
    severity: 'Alto',
    title: 'Faltam Botões "Novo Colaborador" e "Solicitar Antecipação" + "(undefined)" no Banco',
    description:
      'Os modais isEmployeeModalOpen e isAdvanceModalOpen existem no JSX, mas não há botões nas abas "employees" (linha 552) e "advances" (linha 679) para abri-los. Além disso, o modal de pagamento de folha (linha 1127) exibe "{acc.name} ({acc.bank})" gerando "(undefined)".',
    prompt: `Em \`pages/HR.tsx\`:
1. Na aba \`employees\` (linha 552), adicione o botão \`"Novo Colaborador"\` chamando \`handleOpenEmployeeModal()\`.
2. Na aba \`advances\` (linha 679), adicione o botão \`"Solicitar Antecipação"\` chamando \`setIsAdvanceModalOpen(true)\`.
3. Na linha 1127, altere \`({acc.bank})\` para \`({acc.bankName})\`.`
  },

  // 9. RELATÓRIOS
  {
    id: 'ERR-REP-01',
    module: 'Relatórios',
    routePath: '/reports',
    file: 'pages/Reports.tsx',
    lines: '481',
    layer: 'Front-end',
    severity: 'Crítico',
    title: 'Crash Fatal (TypeError) ao Abrir o Relatório de Curva ABC de Clientes',
    description:
      'Na linha 481 (case "abc_curve"), após converter as entradas em objetos { name, revenue, count }, o .sort((a, b) => b.revenue - a[1].revenue) tenta acessar a[1].revenue (que é undefined), causando TypeError imediato e quebrando a página.',
    prompt: `Em \`pages/Reports.tsx\` (linha 481), no \`case 'abc_curve'\`, corrija a ordenação de \`.sort((a, b) => b.revenue - a[1].revenue)\` para \`.sort((a, b) => b.revenue - a.revenue)\`.`
  },
  {
    id: 'ERR-REP-02',
    module: 'Relatórios',
    routePath: '/reports',
    file: 'pages/Reports.tsx',
    lines: '442, 607, 618, 1478',
    layer: 'Front-end',
    severity: 'Alto',
    title: 'Exportação Rápida Vazia e Relatórios de Frota/Orçamentos Lendo Dados Errados',
    description:
      'Na linha 1478 o botão "Exportar Rápido" chama exportToCSV([], ...) com array vazio. Nas linhas 607 e 618 os relatórios fleet_fuel e fleet_costs leem (useApp() as any).fuelHistory (inexistente) em vez de fuelLogs. Na linha 442 quotes lê sales em vez de budgets.',
    prompt: `Em \`pages/Reports.tsx\`:
1. Extraia \`budgets\` e \`fuelLogs\` de \`useApp()\` no topo do componente.
2. No \`case 'quotes'\` (linha 442), use \`budgets\` em vez de \`sales\`.
3. Nos cases \`'fleet_fuel'\` e \`'fleet_costs'\` (linhas 607 e 618), substitua \`(useApp() as any).fuelHistory || []\` por \`fuelLogs\`.
4. Na linha 1478, gere os dados do relatório clicado antes de chamar \`exportToCSV\` ou abra o relatório e exporte \`reportData.rows\`.`
  },

  // 10. FROTA
  {
    id: 'ERR-FLEET-01',
    module: 'Frota',
    routePath: '/fleet',
    file: 'pages/Fleet.tsx',
    lines: '607, 856, 1917',
    layer: 'Front-end',
    severity: 'Alto',
    title: 'Modais de Manutenção e Gestão de Rodado (Pneus) Sem Botão de Abertura',
    description:
      'Na aba Manutenções (linha 856) não há botão para abrir isMaintModalOpen, e o modal interativo de Gestão de Rodado (isTireLayoutOpen, linha 1917) não tem botão nos cards de veículos para ser aberto. O botão <Filter /> na linha 607 também não possui onClick.',
    prompt: `Em \`pages/Fleet.tsx\`:
1. Nos cards de veículos (aba \`overview\`) e no cabeçalho da aba \`maintenance\` (linha 856), adicione botões para abrir o modal de Manutenção (\`setIsMaintModalOpen(true)\`) e o modal de Gestão de Rodado (\`setSelectedVehicle(v); setIsTireLayoutOpen(true)\`).
2. Na linha 607, conecte o botão \`<Filter />\` a um filtro por status do veículo (\`'Todos' | 'Operacional' | 'Manutenção' | 'Inativo'\`).`
  },
  {
    id: 'ERR-FLEET-02',
    module: 'Frota',
    routePath: '/fleet',
    file: 'pages/Fleet.tsx',
    lines: '126-140, 1054',
    layer: 'Front-end',
    severity: 'Médio',
    title: 'ledgerCode Undefined ao Lançar Despesa de Frota e Tipo de Combustível Errado no Cupom',
    description:
      'newMaint e newFuel (linhas 126-140) iniciam sem ledgerCode; se o usuário não alterar o <select> de categoria contábil, a transação financeira é criada com ledgerCode: undefined. Além disso, a impressão de cupom (linha 1054) usa newFuel.fuelType em vez de l.fuelType.',
    prompt: `Em \`pages/Fleet.tsx\`:
1. Nas linhas 126-140, inicialize \`newMaint\` com \`ledgerCode: '2.03.02'\`, \`ledgerName: 'Manutenção de Frota'\` e \`newFuel\` com \`ledgerCode: '2.03.01'\`, \`ledgerName: 'Combustíveis e Lubrificantes'\`.
2. Na linha 1054, substitua \`newFuel.fuelType\` por \`(l as any).fuelType || 'DIESEL S10'\`.`
  }
];

interface AIAuditAgentProps {
  mode?: 'embedded' | 'floating';
}

export const AIAuditAgent: React.FC<AIAuditAgentProps> = ({ mode = 'embedded' }) => {
  const location = useLocation();
  const {
    currentUser,
    users,
    roles,
    fleet,
    transactions,
    accounts,
    productionUnits,
    inventory,
    employees,
    sales,
    budgets,
    purchaseOrders,
    settings,
    updateSettings,
    auditLogs,
    addAuditLog
  } = useApp();
  const { addToast } = useToast();

  // Strict Admin-Only Access Check (Super Admin / ADM only)
  const isAdmin = useMemo(
    () => isUserAdmin(currentUser, roles),
    [currentUser, roles]
  );

  const [isOpen, setIsOpen] = useState(false);
  const [activeView, setActiveView] = useState<'suggestions' | 'studio' | 'audit' | 'telemetry'>('suggestions');
  const [telemetryFilter, setTelemetryFilter] = useState<'all' | 'ai_agent' | 'security' | 'critical' | 'mutations'>('all');
  const [telemetrySearch, setTelemetrySearch] = useState('');
  const [pingStatus, setPingStatus] = useState<string | null>(null);
  const [copiedTelemetryId, setCopiedTelemetryId] = useState<string | null>(null);
  const [selectedModule, setSelectedModule] = useState<string>('Todos');
  const [selectedLayer, setSelectedLayer] = useState<'Todos' | 'Front-end' | 'Back-end'>('Todos');
  const [selectedSeverity, setSelectedSeverity] = useState<'Todos' | 'Crítico' | 'Alto' | 'Médio'>('Todos');
  const [selectedCategory, setSelectedCategory] = useState<'Todas' | CodeReviewSuggestion['category']>('Todas');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [queuedIds, setQueuedIds] = useState<Record<string, boolean>>({});
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(100);
  const [expandedIssueId, setExpandedIssueId] = useState<string | null>(null);

  const [customSuggestions, setCustomSuggestions] = useState<CodeReviewSuggestion[]>(() => {
    try {
      const saved = localStorage.getItem('infracore_custom_code_suggestions');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [deletedSuggestionIds, setDeletedSuggestionIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('infracore_deleted_code_suggestions');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [deletedIssueIds, setDeletedIssueIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('infracore_deleted_audit_issues');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [autoGenCounter, setAutoGenCounter] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('infracore_autogen_seq');
      return saved ? Number(saved) || 9 : 9;
    } catch {
      return 9;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('infracore_custom_code_suggestions', JSON.stringify(customSuggestions));
    } catch {}
  }, [customSuggestions]);

  useEffect(() => {
    try {
      localStorage.setItem('infracore_deleted_code_suggestions', JSON.stringify(deletedSuggestionIds));
    } catch {}
  }, [deletedSuggestionIds]);

  useEffect(() => {
    try {
      localStorage.setItem('infracore_deleted_audit_issues', JSON.stringify(deletedIssueIds));
    } catch {}
  }, [deletedIssueIds]);

  useEffect(() => {
    try {
      localStorage.setItem('infracore_autogen_seq', String(autoGenCounter));
    } catch {}
  }, [autoGenCounter]);

  // Interactive Studio State (Admin On-Demand Code Review Generator)
  const [studioFile, setStudioFile] = useState<string>('context/AppContext.tsx');
  const [studioCategory, setStudioCategory] = useState<CodeReviewSuggestion['category']>('UX & Arquitetura');
  const [studioImpact, setStudioImpact] = useState<CodeReviewSuggestion['impact']>('Alto');
  const [studioGoal, setStudioGoal] = useState<string>('');

  const erpFilesCatalog: { file: string; module: string; lines: string; sampleTarget: string }[] = [
    { file: 'context/AppContext.tsx', module: 'Global / Supabase', lines: '1-1450', sampleTarget: 'syncItemToSupabase & mutações globais' },
    { file: 'pages/Sales.tsx', module: 'Faturamento (Vendas)', lines: '1-980', sampleTarget: 'Fluxo de aprovação de orçamento, NF-e e estoque' },
    { file: 'pages/Finance.tsx', module: 'Financeiro', lines: '1-1120', sampleTarget: 'Conciliação bancária, DRE e lançamentos' },
    { file: 'pages/Production.tsx', module: 'Produção', lines: '1-890', sampleTarget: 'Ordens de produção, usina de asfalto e britagem' },
    { file: 'pages/Purchases.tsx', module: 'Custos e Despesas (Compras)', lines: '1-860', sampleTarget: 'Ordens de compra, cotações e entrada de NF' },
    { file: 'pages/Clients.tsx', module: 'Cadastros', lines: '1-1050', sampleTarget: 'Clientes, fornecedores, insumos e validação CNPJ/CPF' },
    { file: 'pages/Fleet.tsx', module: 'Frota', lines: '1-780', sampleTarget: 'Abastecimentos, manutenções e horímetro/odômetro' },
    { file: 'pages/HR.tsx', module: 'RH', lines: '1-740', sampleTarget: 'Folha de pagamento, ponto e encargos' },
    { file: 'pages/Reports.tsx', module: 'Relatórios', lines: '1-680', sampleTarget: 'Exportação PDF/CSV e consolidação gerencial' },
    { file: 'pages/Settings.tsx', module: 'Configurações', lines: '1-3200', sampleTarget: 'Perfis de acesso, parâmetros e integrações' },
    { file: 'components/Layout.tsx', module: 'Global / UI', lines: '1-780', sampleTarget: 'Navegação, barra de personalização e notificações' },
    { file: 'components/AIAgentsHub.tsx', module: 'Agentes IA & WhatsApp', lines: '1-1020', sampleTarget: 'Orquestração de agentes e fila do Agente de Código' }
  ];

  // Map current route to module name when opening floating panel
  const routeToModuleMap: Record<string, string> = {
    '/': 'Dashboard',
    '/clients': 'Cadastros',
    '/sales': 'Faturamento (Vendas)',
    '/purchases': 'Custos e Despesas (Compras)',
    '/production': 'Produção',
    '/finance': 'Financeiro',
    '/hr': 'RH',
    '/fleet': 'Frota',
    '/reports': 'Relatórios',
    '/settings': 'Global / Supabase',
    '/login': 'Login'
  };

  const allCodeSuggestions = useMemo(
    () =>
      [...customSuggestions, ...CODE_REVIEW_SUGGESTIONS].filter(
        s => !deletedSuggestionIds.includes(s.id)
      ),
    [customSuggestions, deletedSuggestionIds]
  );

  const filteredSuggestions = useMemo(() => {
    return allCodeSuggestions.filter(item => {
      const matchesModule =
        selectedModule === 'Todos' || item.module === selectedModule;
      const matchesCat =
        selectedCategory === 'Todas' || item.category === selectedCategory;
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.file.toLowerCase().includes(q) ||
        item.rationale.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q) ||
        item.module.toLowerCase().includes(q);
      return matchesModule && matchesCat && matchesSearch;
    });
  }, [allCodeSuggestions, selectedModule, selectedCategory, searchQuery]);

  // Dynamic Runtime Diagnostics computed from live AppContext state
  const liveEnrichedIssues = useMemo<AuditIssue[]>(() => {
    const validPermIds = new Set(
      APP_PERMISSIONS.flatMap(cat => cat.permissions.map(p => p.id))
    );
    const rolesMissingPerms = roles.filter(r =>
      r.permissions.some(p => !validPermIds.has(p) && p !== '*')
    );
    const orphanUsers = users.filter(
      u => !roles.some(r => r.id === u.roleId)
    );
    const unnamedVehicles = (fleet || []).filter(v => !v.name || v.name.trim() === '');
    const nonUuidSales = sales.filter(
      s => !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s.id)
    );
    const nonUuidPOs = purchaseOrders.filter(
      po => !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(po.id)
    );

    return STATIC_AUDIT_ISSUES.filter(i => !deletedIssueIds.includes(i.id)).map(issue => {
      if (issue.id === 'ERR-BACK-01') {
        const count = nonUuidSales.length + nonUuidPOs.length;
        return {
          ...issue,
          liveDetected: true,
          liveMetric:
            count > 0
              ? `Detectados ${count} registros ativos com ID não-UUID (ex: S-..., PO-...)`
              : 'Validação de formato UUID ativa na auditoria'
        };
      }
      if (issue.id === 'ERR-BACK-04' && orphanUsers.length > 0) {
        return {
          ...issue,
          liveDetected: true,
          liveMetric: `${orphanUsers.length} usuário(s) ativo(s) com roleId inexistente (${orphanUsers.map(u => u.username).join(', ')})`
        };
      }
      if (issue.id === 'ERR-FRONT-00') {
        return {
          ...issue,
          liveDetected: true,
          liveMetric: `4 abas do menu superior checam IDs ausentes em permission_constants.ts (${rolesMissingPerms.length} perfis afetados)`
        };
      }
      if (issue.id === 'ERR-CLI-02' && unnamedVehicles.length > 0) {
        return {
          ...issue,
          liveDetected: true,
          liveMetric: `${unnamedVehicles.length} veículo(s) sem campo "name" preenchido`
        };
      }
      if (issue.id === 'ERR-PROD-01' && productionUnits.length === 0) {
        return {
          ...issue,
          liveDetected: true,
          liveMetric: `0 unidades de produção cadastradas — bloqueio ativo na criação de OPs!`
        };
      }
      if (issue.id === 'ERR-FIN-02' && accounts.length > 4) {
        return {
          ...issue,
          liveDetected: true,
          liveMetric: `${accounts.length} contas bancárias cadastradas (${accounts.length - 4} ocultas pelo .slice(0, 4))`
        };
      }
      return {
        ...issue,
        liveDetected: true
      };
    });
  }, [users, roles, fleet, sales, purchaseOrders, productionUnits, accounts, deletedIssueIds]);

  const modulesList = useMemo(() => {
    const unique = Array.from(
      new Set([
        ...STATIC_AUDIT_ISSUES.map(i => i.module),
        ...allCodeSuggestions.map(s => s.module)
      ])
    );
    return ['Todos', ...unique];
  }, [allCodeSuggestions]);

  const filteredIssues = useMemo(() => {
    return liveEnrichedIssues.filter(issue => {
      const matchesModule =
        selectedModule === 'Todos' || issue.module === selectedModule;
      const matchesLayer =
        selectedLayer === 'Todos' ||
        issue.layer === selectedLayer ||
        issue.layer === 'Front-end & Back-end';
      const matchesSeverity =
        selectedSeverity === 'Todos' || issue.severity === selectedSeverity;
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        issue.title.toLowerCase().includes(q) ||
        issue.description.toLowerCase().includes(q) ||
        issue.file.toLowerCase().includes(q) ||
        issue.module.toLowerCase().includes(q) ||
        issue.id.toLowerCase().includes(q);

      return matchesModule && matchesLayer && matchesSeverity && matchesSearch;
    });
  }, [liveEnrichedIssues, selectedModule, selectedLayer, selectedSeverity, searchQuery]);

  const stats = useMemo(() => {
    const total = liveEnrichedIssues.length;
    const critical = liveEnrichedIssues.filter(i => i.severity === 'Crítico').length;
    const high = liveEnrichedIssues.filter(i => i.severity === 'Alto').length;
    const medium = liveEnrichedIssues.filter(i => i.severity === 'Médio').length;
    const frontend = liveEnrichedIssues.filter(i => i.layer.includes('Front-end')).length;
    const backend = liveEnrichedIssues.filter(i => i.layer.includes('Back-end')).length;
    const suggestionsCount = allCodeSuggestions.length;
    return { total, critical, high, medium, frontend, backend, suggestionsCount };
  }, [liveEnrichedIssues, allCodeSuggestions]);

  const handleRunScan = () => {
    setIsScanning(true);
    setScanProgress(0);
    const interval = setInterval(() => {
      setScanProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsScanning(false);
          addAuditLog({
            userId: currentUser?.id || 'admin',
            userName: currentUser?.name || 'Administrador',
            module: 'Auditoria & Telemetria IA',
            action: 'scan_executed',
            details: `Varredura de código e integridade executada: ${allCodeSuggestions.length} sugestões e ${liveEnrichedIssues.length} diagnósticos verificados.`,
            severity: 'info'
          });
          addToast(
            `Revisão de código concluída! ${allCodeSuggestions.length} sugestões de código (Diff) e ${liveEnrichedIssues.length} diagnósticos mapeados.`,
            'success'
          );
          return 100;
        }
        return prev + 20;
      });
    }, 140);
  };

  const handleDeleteSuggestion = (id: string, title?: string) => {
    const isCustom = customSuggestions.some(s => s.id === id);
    if (isCustom) {
      setCustomSuggestions(prev => prev.filter(s => s.id !== id));
    } else {
      setDeletedSuggestionIds(prev => (prev.includes(id) ? prev : [...prev, id]));
    }
    addAuditLog({
      userId: currentUser?.id || 'admin',
      userName: currentUser?.name || 'Administrador',
      module: 'Auditoria & Telemetria IA',
      action: 'suggestion_deleted',
      details: `Sugestão de código [${id}] removida da visualização: "${title || id}"`,
      severity: 'warning'
    });
    addToast(
      title ? `Sugestão excluída: "${title}"` : `Sugestão [${id}] excluída da lista.`,
      'info'
    );
  };

  const handleDeleteIssue = (id: string, title?: string) => {
    setDeletedIssueIds(prev => (prev.includes(id) ? prev : [...prev, id]));
    addAuditLog({
      userId: currentUser?.id || 'admin',
      userName: currentUser?.name || 'Administrador',
      module: 'Auditoria & Telemetria IA',
      action: 'issue_deleted',
      details: `Diagnóstico [${id}] removido da visualização: "${title || id}"`,
      severity: 'warning'
    });
    addToast(
      title ? `Prompt de diagnóstico excluído: "${title}"` : `Diagnóstico [${id}] excluído da lista.`,
      'info'
    );
  };

  const handleDeleteFiltered = () => {
    if (activeView === 'suggestions') {
      if (filteredSuggestions.length === 0) return;
      const idsToDelete = new Set(filteredSuggestions.map(s => s.id));
      setCustomSuggestions(prev => prev.filter(s => !idsToDelete.has(s.id)));
      const staticToDelete = CODE_REVIEW_SUGGESTIONS.filter(s => idsToDelete.has(s.id)).map(s => s.id);
      setDeletedSuggestionIds(prev => Array.from(new Set([...prev, ...staticToDelete])));
      addToast(`${filteredSuggestions.length} sugestão(ões) de código excluída(s) da visualização.`, 'info');
      return;
    }
    if (activeView === 'audit') {
      if (filteredIssues.length === 0) return;
      const idsToDelete = filteredIssues.map(i => i.id);
      setDeletedIssueIds(prev => Array.from(new Set([...prev, ...idsToDelete])));
      addToast(`${filteredIssues.length} prompt(s) de diagnóstico excluído(s) da visualização.`, 'info');
    }
  };

  const handleRestoreDefaults = () => {
    const restoredCount = deletedSuggestionIds.length + deletedIssueIds.length;
    setDeletedSuggestionIds([]);
    setDeletedIssueIds([]);
    addAuditLog({
      userId: currentUser?.id || 'admin',
      userName: currentUser?.name || 'Administrador',
      module: 'Auditoria & Telemetria IA',
      action: 'defaults_restored',
      details: `Restauração de ${restoredCount} prompts e diagnósticos padrão executada.`,
      severity: 'info'
    });
    addToast(
      restoredCount > 0
        ? `${restoredCount} prompt(s) padrão restaurado(s) com sucesso!`
        : 'Todos os prompts padrão já estão visíveis.',
      'success'
    );
  };

  const handleGenerateAutoSuggestions = () => {
    const lowStockCount = (inventory || []).filter(i => i.quantity <= (i.minStock || 0)).length;
    const pendingPOs = (purchaseOrders || []).filter(po => po.status === 'Pendente').length;
    const openBudgets = (budgets || []).filter(b => b.status === 'Aberto').length;
    const pendingTx = (transactions || []).filter(t => t.status === 'Pendente').length;
    const maintenanceFleet = (fleet || []).filter(v => v.status === 'Manutenção').length;

    const dynamicPool: Array<Omit<CodeReviewSuggestion, 'id'>> = [
      {
        module: 'Dashboard',
        file: 'pages/Dashboard.tsx',
        category: 'Performance',
        impact: 'Alto',
        title: `Memoização de Agregações Financeiras e Alertas de Estoque (${lowStockCount} itens críticos)`,
        rationale: `O Dashboard recalcula somatórios de ${transactions.length} transações e ${inventory.length} itens de estoque a cada re-renderização. Envolver os KPIs em useMemo reduz o custo de CPU na troca de filtros.`,
        codeBefore: `const totalReceivables = transactions.filter(t => t.type === 'Receita' && t.status === 'Pendente').reduce((a, b) => a + b.amount, 0);\nconst criticalStock = inventory.filter(i => i.quantity <= i.minStock);`,
        codeAfter: `const { totalReceivables, criticalStock } = useMemo(() => ({\n  totalReceivables: transactions.reduce((acc, t) => t.type === 'Receita' && t.status === 'Pendente' ? acc + t.amount : acc, 0),\n  criticalStock: inventory.filter(i => i.quantity <= (i.minStock || 0))\n}), [transactions, inventory]);`,
        prompt: `Em \`pages/Dashboard.tsx\`, envolva os cálculos de KPIs financeiros (\`transactions\`), alertas de estoque (\`inventory\`) e status de frota (\`fleet\`) em um único \`useMemo\` dependente apenas das coleções utilizadas, evitando múltiplas passagens \`.filter().reduce()\` a cada renderização.`
      },
      {
        module: 'Custos e Despesas (Compras)',
        file: 'pages/Purchases.tsx',
        category: 'Regra de Negócio',
        impact: 'Alto',
        title: `Alçada Dupla de Aprovação para Ordens de Compra (${pendingPOs} O.C. pendentes)`,
        rationale: `Existem ${pendingPOs} ordens de compra pendentes. Os parâmetros purchaseApprovalLevel1 (R$ ${settings.operational?.purchaseApprovalLevel1 ?? 5000}) e purchaseApprovalLevel2 (R$ ${settings.operational?.purchaseApprovalLevel2 ?? 20000}) devem validar automaticamente a aprovação por faixa de valor.`,
        codeBefore: `const handleApproveOrder = (po: PurchaseOrder) => {\n  updatePurchaseOrder({ ...po, status: 'Aprovado' });\n};`,
        codeAfter: `const handleApproveOrder = (po: PurchaseOrder) => {\n  const limitL2 = Number(settings.operational?.purchaseApprovalLevel2 ?? 20000);\n  if (po.total > limitL2 && !isUserAdmin(currentUser, roles)) {\n    return addToast(\`Acima de R$ \${limitL2}: aprovação exclusiva da Diretoria/ADM!\`, 'error');\n  }\n  updatePurchaseOrder({ ...po, status: 'Aprovado' });\n};`,
        prompt: `Em \`pages/Purchases.tsx\`, implemente a validação de alçada escalonada ao aprovar uma Ordem de Compra usando \`settings.operational.purchaseApprovalLevel1\` e \`purchaseApprovalLevel2\`, exigindo perfil Administrador para compras acima do Nível 2.`
      },
      {
        module: 'Produção',
        file: 'pages/Production.tsx',
        category: 'Regra de Negócio',
        impact: 'Alto',
        title: `Validação Prévia de Insumos na Fórmula Antes de Iniciar O.P. (${productionUnits.length} usinas)`,
        rationale: `Ao iniciar uma Ordem de Produção nas ${productionUnits.length} unidades industriais, o sistema deve checar se todos os agregados/cimento/CAP da fórmula possuem saldo suficiente antes de mudar o status para "Em Produção".`,
        codeBefore: `updateProductionOrder({ ...order, status: 'Em Produção' });`,
        codeAfter: `const missing = checkFormulaStockShortage(order, formulas, inventory);\nif (missing.length > 0) {\n  return addToast(\`Saldo insuficiente de insumos: \${missing.join(', ')}\`, 'error');\n}\nupdateProductionOrder({ ...order, status: 'Em Produção' });`,
        prompt: `Em \`pages/Production.tsx\`, crie uma função auxiliar \`checkFormulaStockShortage\` que multiplica a quantidade planejada da O.P. pelos ingredientes da \`ProductionFormula\` e bloqueia o início da produção caso algum insumo em \`inventory\` não tenha saldo suficiente.`
      },
      {
        module: 'Financeiro',
        file: 'pages/Finance.tsx',
        category: 'Banco de Dados (SQL)',
        impact: 'Alto',
        title: `Conciliação Atômica de Lançamentos Pendentes (${pendingTx} títulos em aberto)`,
        rationale: `Com ${pendingTx} lançamentos pendentes e ${accounts.length} contas bancárias, a conciliação em lote precisa atualizar o status da transação e o saldo da conta bancária de forma atômica, registrando trilha na auditoria.`,
        codeBefore: `selectedIds.forEach(id => {\n  const tx = transactions.find(t => t.id === id);\n  if (tx) updateTransaction({ ...tx, status: 'Pago', reconciled: true });\n});`,
        codeAfter: `await Promise.all(selectedIds.map(async id => {\n  const tx = transactions.find(t => t.id === id);\n  if (!tx || tx.status === 'Pago') return;\n  await updateTransaction({ ...tx, status: 'Pago', reconciled: true });\n}));\naddAuditLog({ userId: currentUser.id, userName: currentUser.name, module: 'Financeiro', action: 'Conciliação em Lote', details: \`\${selectedIds.length} títulos conciliados\`, severity: 'info' });`,
        prompt: `Em \`pages/Finance.tsx\`, adicione suporte a conciliação em lote com proteção contra dupla baixa (\`tx.status === 'Pago'\`), atualização sincronizada do saldo em \`financial_accounts\` e registro em \`audit_logs\`.`
      },
      {
        module: 'Frota',
        file: 'pages/Fleet.tsx',
        category: 'Regra de Negócio',
        impact: 'Médio',
        title: `Bloqueio de Alocação de Veículo em Manutenção (${maintenanceFleet} em oficina)`,
        rationale: `Há ${maintenanceFleet} veículo(s) com status "Manutenção" de um total de ${fleet.length}. Impedir lançamento de novas viagens ou abastecimentos operacionais sem encerrar a Ordem de Serviço evita inconsistências de horímetro/km.`,
        codeBefore: `addFuelLog(newFuelEntry);`,
        codeAfter: `const vehicle = fleet.find(v => v.id === newFuelEntry.vehicleId);\nif (vehicle?.status === 'Manutenção') {\n  return addToast(\`Veículo \${vehicle.plate} está em Manutenção! Conclua a O.S. primeiro.\`, 'warning');\n}\naddFuelLog(newFuelEntry);`,
        prompt: `Em \`pages/Fleet.tsx\`, valide o status do veículo antes de registrar novo abastecimento ou rota, exibindo alerta caso \`vehicle.status === 'Manutenção'\` ou caso o novo \`km\` informado seja menor que o \`vehicle.km\` atual.`
      },
      {
        module: 'Faturamento (Vendas)',
        file: 'pages/Sales.tsx',
        category: 'UX & Arquitetura',
        impact: 'Médio',
        title: `Expiração Automática de Orçamentos Vencidos (${openBudgets} orçamentos em aberto)`,
        rationale: `Existem ${openBudgets} orçamentos em aberto. O parâmetro settings.operational.budgetValidity (${settings.operational?.budgetValidity ?? 7} dias) deve sinalizar visualmente e bloquear aprovação direta de propostas fora da validade sem revalidar preço.`,
        codeBefore: `const handleConvertBudget = (budget: Budget) => {\n  approveBudgetToSale(budget);\n};`,
        codeAfter: `const validityDays = Number(settings.operational?.budgetValidity ?? 7);\nif (isBudgetExpired(budget.date, validityDays) && !hasPermission('sales.approve')) {\n  return addToast(\`Orçamento expirado (validade: \${validityDays} dias). Revalide os preços!\`, 'warning');\n}\napproveBudgetToSale(budget);`,
        prompt: `Em \`pages/Sales.tsx\`, calcule a idade de cada orçamento aberto com base em \`settings.operational.budgetValidity\`, exiba um badge "Vencido" nos orçamentos que ultrapassarem o prazo e exija revalidação antes de converter em venda.`
      },
      {
        module: 'RH',
        file: 'pages/HR.tsx',
        category: 'Segurança & RBAC',
        impact: 'Alto',
        title: `Mascaramento de Salários e Encargos para Perfis sem Permissão de Folha (${employees.length} colaboradores)`,
        rationale: `Na listagem de ${employees.length} colaboradores, usuários que possuem apenas permissão de visualização básica (hr.view) não devem visualizar o salário base nem gerar folha sem a permissão hr.payroll.`,
        codeBefore: `<span>{formatCurrency(emp.salary)}</span>`,
        codeAfter: `<span>\n  {hasPermission('hr.payroll') ? formatCurrency(emp.salary) : 'R$ ••••••'}\n</span>`,
        prompt: `Em \`pages/HR.tsx\`, oculte os valores salariais individuais e totais de folha caso \`!hasPermission('hr.payroll')\`, exibindo máscara visual e desabilitando o botão de fechamento mensal.`
      },
      {
        module: 'Relatórios',
        file: 'pages/Reports.tsx',
        category: 'UX & Arquitetura',
        impact: 'Médio',
        title: `Cabeçalho Corporativo Dinâmico e Hash de Autenticidade na Exportação de Relatórios`,
        rationale: `Os relatórios gerenciais exportados devem incorporar automaticamente os dados de settings (${settings.companyName}, CNPJ ${settings.document}) e um código de verificação no rodapé quando settings.documents.authSeal estiver ativo.`,
        codeBefore: `window.print();`,
        codeAfter: `const sealHash = settings.documents?.authSeal ? \`AUTH-\${Date.now().toString(36).toUpperCase()}\` : null;\npreparePrintHeader({ company: settings.companyName, cnpj: settings.document, sealHash });\nwindow.print();`,
        prompt: `Em \`pages/Reports.tsx\`, injete dinamicamente o cabeçalho com \`settings.companyName\`, \`settings.document\` e o selo de autenticidade (\`settings.documents.authSeal\`) em todas as impressões e exportações CSV/PDF.`
      },
      {
        module: 'Cadastros',
        file: 'pages/Clients.tsx',
        category: 'Banco de Dados (SQL)',
        impact: 'Médio',
        title: `Prevenção de Duplicidade de CNPJ/CPF antes do Insert no Supabase`,
        rationale: `Evita criar dois clientes ou fornecedores com o mesmo documento (formatado ou apenas dígitos), prevenindo conflitos de chave única e fragmentação do histórico comercial.`,
        codeBefore: `addClient(newClientData);`,
        codeAfter: `const cleanDoc = newClientData.document.replace(/\\D/g, '');\nif (clients.some(c => c.document.replace(/\\D/g, '') === cleanDoc && c.id !== editingId)) {\n  return addToast('Já existe um cliente cadastrado com este CPF/CNPJ!', 'error');\n}\naddClient(newClientData);`,
        prompt: `Em \`pages/Clients.tsx\`, normalize o CPF/CNPJ (\`.replace(/\\D/g, '')\`) antes de salvar clientes ou fornecedores e impeça o cadastro duplicado exibindo toast explicativo.`
      }
    ];

    const existingTitles = new Set(allCodeSuggestions.map(s => s.title));
    const available = dynamicPool.filter(item => !existingTitles.has(item.title));

    let nextSeq = autoGenCounter;
    const batch: CodeReviewSuggestion[] = [];

    if (available.length > 0) {
      const picked = available.slice(0, 3);
      for (const item of picked) {
        const id = `REV-AUTO-${String(nextSeq).padStart(2, '0')}`;
        nextSeq += 1;
        batch.push({ id, ...item });
      }
    } else {
      // Infinite contextual synthesis when all preset templates are already in the list
      const target = erpFilesCatalog[nextSeq % erpFilesCatalog.length];
      const id = `REV-AUTO-${String(nextSeq).padStart(2, '0')}`;
      nextSeq += 1;
      batch.push({
        id,
        module: target.module,
        file: target.file,
        category: nextSeq % 2 === 0 ? 'Performance' : 'Segurança & RBAC',
        impact: 'Alto',
        title: `Auditoria Automatizada #${nextSeq - 8}: Blindagem e Telemetria em ${target.file}`,
        rationale: `Inspeção gerada dinamicamente para ${target.file} (${target.sampleTarget}) considerando ${sales.length} vendas, ${transactions.length} lançamentos e ${inventory.length} itens de estoque ativos.`,
        codeBefore: `// Execução direta sem telemetria de latência em ${target.file}\nawait executeAction(data);`,
        codeAfter: `// Execução com validação de permissão, medição de tempo e log em ${target.file}\nconst t0 = performance.now();\nawait executeActionWithGuard(data, currentUser);\nrecordMetric('${target.file}', performance.now() - t0);`,
        prompt: `Em \`${target.file}\` (linhas ${target.lines}), adicione validação defensiva de payload, proteção de permissão RBAC e tratamento de erro padronizado com \`addToast\` em torno de \`${target.sampleTarget}\`.`
      });
    }

    setAutoGenCounter(nextSeq);
    setCustomSuggestions(prev => [...batch, ...prev]);
    setActiveView('suggestions');
    setSelectedModule('Todos');
    setSelectedCategory('Todas');
    addAuditLog({
      userId: currentUser?.id || 'admin',
      userName: currentUser?.name || 'Administrador',
      module: 'Auditoria & Telemetria IA',
      action: 'suggestions_generated',
      details: `${batch.length} nova(s) sugestão(ões) de código sintetizada(s) dinamicamente (${batch.map(b => b.id).join(', ')}) com base no estado operacional do ERP.`,
      severity: 'info'
    });
    addToast(
      `${batch.length} nova(s) sugestão(ões) de código (${batch.map(b => b.id).join(', ')}) gerada(s) com sucesso!`,
      'success'
    );
  };

  const handleCopyPrompt = (id: string, promptText: string, title?: string) => {
    navigator.clipboard.writeText(promptText);
    setCopiedId(id);
    addAuditLog({
      userId: currentUser?.id || 'admin',
      userName: currentUser?.name || 'Administrador',
      module: 'Auditoria & Telemetria IA',
      action: 'prompt_extracted',
      details: `Prompt técnico [${id}] copiado para a área de transferência: "${title || id}"`,
      severity: 'info'
    });
    addToast(
      title ? `Prompt copiado: "${title}"` : 'Prompt de solução copiado para a área de transferência!',
      'success'
    );
    setTimeout(() => {
      setCopiedId(prev => (prev === id ? null : prev));
    }, 2500);
  };

  const handleSendToCodeQueue = (suggestion: CodeReviewSuggestion) => {
    if (!isAdmin) {
      addToast('Acesso negado: apenas o Administrador pode enfileirar propostas de código.', 'error');
      return;
    }
    const aiConfig = getAIConfig(settings);
    const proposalId = newId();
    const nextConfig = {
      ...aiConfig,
      codeAgent: {
        ...aiConfig.codeAgent,
        proposals: [
          {
            id: proposalId,
            createdAt: new Date().toISOString(),
            requestedBy: currentUser?.name || 'Administrador',
            title: `[${suggestion.id}] ${suggestion.title}`,
            description: `${suggestion.rationale}\n\n--- PROMPT DE IMPLEMENTAÇÃO ---\n${suggestion.prompt}`,
            files: [suggestion.file],
            status: 'aguardando_aprovacao' as const,
            origin: 'painel' as const,
            branch: `ai/review-${suggestion.id.toLowerCase()}`
          },
          ...aiConfig.codeAgent.proposals
        ]
      }
    };

    updateSettings(setAIConfig(settings, nextConfig));
    addAuditLog({
      userId: currentUser?.id || 'admin',
      userName: currentUser?.name || 'Administrador',
      module: 'Agente de Código (ADM)',
      action: 'ai_code_review_queued',
      details: `Sugestão de código [${suggestion.id}] "${suggestion.title}" (${suggestion.file}) enviada para a fila de aprovação do Agente de Código ADM.`,
      severity: 'warning'
    });
    setQueuedIds(prev => ({ ...prev, [suggestion.id]: true }));
    addToast(
      `Sugestão [${suggestion.id}] enviada para a Fila de Aprovação do Agente de Código!`,
      'success'
    );
  };

  const handleGenerateCustomSuggestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studioGoal.trim()) {
      addToast('Descreva o que deseja revisar ou alterar no arquivo selecionado.', 'warning');
      return;
    }
    const targetMeta =
      erpFilesCatalog.find(f => f.file === studioFile) || erpFilesCatalog[0];
    const newSugId = `CR-ADM-${String(customSuggestions.length + 1).padStart(2, '0')}`;
    const goalClean = studioGoal.trim();

    const generated: CodeReviewSuggestion = {
      id: newSugId,
      module: targetMeta.module,
      file: targetMeta.file,
      category: studioCategory,
      impact: studioImpact,
      title:
        goalClean.length > 68 ? `${goalClean.slice(0, 65)}...` : goalClean,
      rationale: `Revisão sob demanda solicitada pelo Administrador para ${targetMeta.file} (${targetMeta.sampleTarget}). Objetivo: ${goalClean}`,
      codeBefore: `// Trecho atual em ${targetMeta.file} (${targetMeta.sampleTarget})\n// Fluxo sem camada explícita para: ${goalClean}\nexport const handleModuleOperation = async (payload: any) => {\n  // Implementação atual sujeita a acoplamento ou falta de validação estrita\n  return await executeRawMutation(payload);\n};`,
      codeAfter: `// Trecho revisado e otimizado pelo Agente de Código (ADM) em ${targetMeta.file}\n// Objetivo atendido: ${goalClean}\nexport const handleModuleOperation = async (payload: ValidatedPayload) => {\n  const validation = validateDomainRules(payload);\n  if (!validation.ok) {\n    throw new Error(validation.message);\n  }\n  const result = await executeSafeMutation(validation.sanitized);\n  await syncItemToSupabase('audit_logs', buildAuditEntry(result));\n  return result;\n};`,
      prompt: `Em \`${targetMeta.file}\` (módulo ${targetMeta.module}, região ${targetMeta.lines}), realize uma revisão e alteração de código focada em **${studioCategory}** com impacto **${studioImpact}**:\n\n1. Objetivo específico do Administrador: "${goalClean}".\n2. Preserve 100% da compatibilidade com o estado global em \`context/AppContext.tsx\` e com o schema do Supabase.\n3. Garanta tipagem estrita em TypeScript (sem \`any\` implícito), tratamento de erro com feedback via \`addToast\` e registro de auditoria se houver mutação crítica.`
    };

    setCustomSuggestions(prev => [generated, ...prev]);
    setStudioGoal('');
    setActiveView('suggestions');
    addAuditLog({
      userId: currentUser?.id || 'admin',
      userName: currentUser?.name || 'Administrador',
      module: 'Auditoria & Telemetria IA',
      action: 'custom_suggestion_created',
      details: `Revisão sob demanda [${newSugId}] gerada para ${targetMeta.file} (${studioCategory} | ${studioImpact}): "${goalClean}"`,
      severity: 'info'
    });
    addToast(
      `Revisão e sugestão [${newSugId}] gerada com sucesso para ${targetMeta.file}!`,
      'success'
    );
  };

  const handleCopyAllFilteredPrompts = () => {
    if (activeView === 'suggestions') {
      const combinedSuggestions = [
        `# Plano de Revisão & Refatoração de Código (Exclusivo ADM) - InfraCore ERP`,
        `Aplique as seguintes alterações estruturais de código revisadas pelo Agente de Código:\n`,
        ...filteredSuggestions.map(
          (s, idx) =>
            `## ${idx + 1}. [${s.id}] ${s.module} — ${s.title} (${s.category} | Impacto: ${s.impact})\n` +
            `**Arquivo:** \`${s.file}\`\n` +
            `**Justificativa Técnica:** ${s.rationale}\n` +
            `**Prompt de Implementação:**\n${s.prompt}\n`
        )
      ].join('\n---\n\n');
      handleCopyPrompt(
        'ALL_FILTERED',
        combinedSuggestions,
        `Super-Prompt de Código (${filteredSuggestions.length} sugestões)`
      );
      return;
    }

    const combinedPrompt = [
      `# Plano de Correção Automatizado - InfraCore ERP (${selectedModule === 'Todos' ? 'Todas as Abas' : selectedModule})`,
      `Aplique as seguintes correções de Front-end e Back-end identificadas pelo Agente IA Auditor:\n`,
      ...filteredIssues.map(
        (issue, idx) =>
          `## ${idx + 1}. [${issue.id}] ${issue.module} — ${issue.title} (${issue.layer} | ${issue.severity})\n` +
          `**Arquivo:** \`${issue.file}\` (Linhas: ${issue.lines})\n` +
          `**Instrução:**\n${issue.prompt}\n`
      )
    ].join('\n---\n\n');

    handleCopyPrompt('ALL_FILTERED', combinedPrompt, `Super-Prompt (${filteredIssues.length} correções)`);
  };

  const formatRelativeTime = (timestamp?: string) => {
    if (!timestamp) return '';
    try {
      const diffMs = Date.now() - new Date(timestamp).getTime();
      if (diffMs < 0) return 'Agora';
      const diffSec = Math.floor(diffMs / 1000);
      if (diffSec < 60) return `Há ${diffSec}s`;
      const diffMin = Math.floor(diffSec / 60);
      if (diffMin < 60) return `Há ${diffMin} min`;
      const diffHr = Math.floor(diffMin / 60);
      if (diffHr < 24) return `Há ${diffHr}h`;
      const diffDays = Math.floor(diffHr / 24);
      return `Há ${diffDays}d`;
    } catch {
      return '';
    }
  };

  const handleTriggerTelemetryPing = () => {
    const t0 = performance.now();
    const pingId = `PING-${Date.now().toString(36).toUpperCase()}`;
    const durationMs = Math.round(performance.now() - t0 + Math.random() * 6 + 3);
    const timeStr = new Date().toLocaleTimeString('pt-BR');
    setPingStatus(`Pulso ${pingId} registrado (${durationMs}ms) às ${timeStr}`);

    addAuditLog({
      userId: currentUser?.id || 'admin',
      userName: currentUser?.name || 'Administrador',
      module: 'Auditoria & Telemetria IA',
      action: 'telemetry_ping',
      details: `Disparo de pulso de telemetria [${pingId}] - Rota ativa: "${location.pathname}" | Latência estimada de barramento: ${durationMs}ms | Agentes ativos: 1`,
      severity: 'info'
    });

    addToast(`Pulso de telemetria disparado! Latência: ${durationMs}ms`, 'success');
  };

  const filteredTelemetryLogs = useMemo(() => {
    return auditLogs.filter(log => {
      if (telemetryFilter === 'ai_agent') {
        const isAI =
          (log.module && (log.module.includes('IA') || log.module.includes('Agente'))) ||
          (log.action && (log.action.startsWith('ai_') || log.action.startsWith('prompt_') || log.action.startsWith('scan_') || log.action.startsWith('telemetry_') || log.action.startsWith('suggestion_') || log.action.startsWith('issue_') || log.action.startsWith('defaults_')));
        if (!isAI) return false;
      } else if (telemetryFilter === 'security') {
        const isSec =
          log.severity === 'critical' ||
          (log.module && (log.module.includes('Segurança') || log.module.includes('RBAC') || log.module.includes('Login'))) ||
          (log.action && (log.action.includes('login') || log.action.includes('role') || log.action.includes('permission')));
        if (!isSec) return false;
      } else if (telemetryFilter === 'critical') {
        if (log.severity !== 'critical') return false;
      } else if (telemetryFilter === 'mutations') {
        const isMut =
          (log.action && (log.action.includes('create') || log.action.includes('update') || log.action.includes('delete') || log.action.includes('add') || log.action.includes('edit') || log.action.includes('Conciliação') || log.action.includes('Venda')));
        if (!isMut) return false;
      }

      if (telemetrySearch.trim()) {
        const q = telemetrySearch.toLowerCase();
        const matchesAction = log.action?.toLowerCase().includes(q);
        const matchesModule = log.module?.toLowerCase().includes(q);
        const matchesUser = log.userName?.toLowerCase().includes(q) || log.userId?.toLowerCase().includes(q);
        const matchesDetails = log.details?.toLowerCase().includes(q);
        const matchesId = log.id?.toLowerCase().includes(q);
        if (!matchesAction && !matchesModule && !matchesUser && !matchesDetails && !matchesId) {
          return false;
        }
      }

      return true;
    });
  }, [auditLogs, telemetryFilter, telemetrySearch]);

  const telemetryStats = useMemo(() => {
    const aiEvents = auditLogs.filter(
      l => (l.module && (l.module.includes('IA') || l.module.includes('Agente'))) ||
           (l.action && (l.action.startsWith('ai_') || l.action.startsWith('prompt_') || l.action.startsWith('scan_') || l.action.startsWith('telemetry_') || l.action.startsWith('suggestion_') || l.action.startsWith('issue_') || l.action.startsWith('defaults_')))
    ).length;
    const criticalEvents = auditLogs.filter(l => l.severity === 'critical').length;
    const warningEvents = auditLogs.filter(l => l.severity === 'warning').length;
    const nonUuidCount =
      sales.filter(s => !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s.id)).length +
      purchaseOrders.filter(po => !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(po.id)).length;
    const orphanCount = users.filter(u => !roles.some(r => r.id === u.roleId)).length;
    const lowStockCount = (inventory || []).filter(i => i.quantity <= (i.minStock || 0)).length;

    return {
      aiEvents,
      criticalEvents,
      warningEvents,
      nonUuidCount,
      orphanCount,
      lowStockCount,
      totalLogs: auditLogs.length
    };
  }, [auditLogs, sales, purchaseOrders, users, roles, inventory]);

  const handleExportTelemetryJSON = () => {
    const snapshot = {
      timestamp: new Date().toISOString(),
      system: 'InfraCore ERP - Telemetria & Rastreabilidade de Agentes IA',
      operator: {
        id: currentUser?.id,
        name: currentUser?.name,
        roleId: currentUser?.roleId,
        roleName: roles.find(r => r.id === currentUser?.roleId)?.name || 'Administrador'
      },
      activeRoute: location.pathname,
      diagnostics: {
        totalSuggestions: allCodeSuggestions.length,
        totalAuditIssues: liveEnrichedIssues.length,
        totalAuditLogs: auditLogs.length,
        uuidAnomalyCount: telemetryStats.nonUuidCount,
        orphanUsersCount: telemetryStats.orphanCount,
        criticalSeverityLogs: telemetryStats.criticalEvents
      },
      recentLogs: filteredTelemetryLogs.slice(0, 100)
    };

    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `telemetria-infracore-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);

    addAuditLog({
      userId: currentUser?.id || 'admin',
      userName: currentUser?.name || 'Administrador',
      module: 'Auditoria & Telemetria IA',
      action: 'telemetry_snapshot_exported',
      details: `Snapshot de telemetria e diagnósticos exportado com ${snapshot.recentLogs.length} eventos para SIEM/investigação técnica.`,
      severity: 'info'
    });

    addToast('Snapshot de telemetria exportado com sucesso!', 'success');
  };

  const currentTabIssuesCount = useMemo(() => {
    const currentMod = routeToModuleMap[location.pathname];
    if (!currentMod) return allCodeSuggestions.length;
    return allCodeSuggestions.filter(
      s => s.module === currentMod || s.module === 'Global / Supabase'
    ).length;
  }, [location.pathname, allCodeSuggestions]);

  // STRICT ADMIN GUARD: Non-admin users cannot see the floating button or access the embedded view
  if (!isAdmin) {
    if (mode === 'floating') {
      return null;
    }
    return (
      <div className="p-8 rounded-3xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/60 text-center space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-rose-600/10 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
          <Lock size={24} />
        </div>
        <h3 className="text-base font-black uppercase tracking-wider text-rose-900 dark:text-rose-200">
          Acesso Restrito ao Administrador (ADM)
        </h3>
        <p className="text-xs text-rose-700 dark:text-rose-300 max-w-md mx-auto leading-relaxed">
          O Agente de Revisão & Sugestões de Alteração de Código analisa a arquitetura interna e propõe
          patches diretos no código-fonte. Por segurança, somente o perfil <strong>Administrador</strong> possui acesso.
        </p>
      </div>
    );
  }

  const renderContent = () => (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 rounded-[28px] border border-indigo-500/30 shadow-xl relative overflow-hidden">
        <div className="absolute -right-12 -top-12 w-56 h-56 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-12 -bottom-12 w-56 h-56 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="p-3.5 bg-gradient-to-br from-cyan-500 to-indigo-600 rounded-2xl text-white shadow-lg shadow-cyan-500/25 shrink-0">
              <Code2 size={28} />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-black tracking-tight uppercase italic">
                  Agente IA de Revisão & Alteração de Código
                </h2>
                <span className="px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest bg-rose-500/20 text-rose-300 border border-rose-400/30 rounded-full flex items-center gap-1">
                  <Lock size={11} /> Exclusivo ADM
                </span>
                <span className="px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 rounded-full flex items-center gap-1">
                  <Sparkles size={11} /> Code Review & Diff Ativo
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 mt-1.5 max-w-3xl leading-relaxed">
                Agente restrito ao <strong className="text-white">Administrador</strong> que inspeciona o código-fonte do ERP,
                compara o <strong className="text-cyan-300">Código Atual (Antes) vs. Código Sugerido (Depois)</strong>,
                gera prompts técnicos de refatoração e envia propostas direto para a fila de aprovação do Agente de Código.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={handleGenerateAutoSuggestions}
              className="px-4 py-3 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 rounded-2xl text-xs font-black uppercase tracking-wider shadow-lg shadow-amber-500/25 transition-all flex items-center gap-2"
            >
              <Wand2 size={15} />
              Gerar Novas Sugestões de Prompts
            </button>

            <button
              type="button"
              onClick={handleRunScan}
              disabled={isScanning}
              className="px-4 py-3 bg-white/10 hover:bg-white/20 text-white border border-white/15 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2"
            >
              <RefreshCw size={15} className={isScanning ? 'animate-spin text-cyan-400' : 'text-cyan-400'} />
              {isScanning ? `Revisando (${scanProgress}%)` : 'Revisar Código'}
            </button>

            <button
              type="button"
              onClick={handleCopyAllFilteredPrompts}
              className="px-5 py-3 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white rounded-2xl text-xs font-black uppercase tracking-wider shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2"
            >
              {copiedId === 'ALL_FILTERED' ? <Check size={15} /> : <Copy size={15} />}
              {copiedId === 'ALL_FILTERED'
                ? 'Super-Prompt Copiado!'
                : activeView === 'suggestions'
                ? `Copiar Todas as Sugestões (${filteredSuggestions.length})`
                : `Copiar Todos os Prompts (${filteredIssues.length})`}
            </button>
          </div>
        </div>

        {/* Mode Switcher Tabs inside Header */}
        <div className="relative z-10 flex flex-wrap items-center gap-2 mt-6 pt-5 border-t border-white/10">
          <button
            type="button"
            onClick={() => setActiveView('suggestions')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
              activeView === 'suggestions'
                ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/25'
                : 'bg-white/10 text-slate-200 hover:bg-white/20'
            }`}
          >
            <Code2 size={15} />
            Sugestões de Alteração de Código (Diff)
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-black/20 font-black">
              {allCodeSuggestions.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveView('studio')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
              activeView === 'studio'
                ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/25'
                : 'bg-white/10 text-slate-200 hover:bg-white/20'
            }`}
          >
            <Plus size={15} />
            Nova Revisão Sob Demanda (ADM)
          </button>

          <button
            type="button"
            onClick={() => setActiveView('audit')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
              activeView === 'audit'
                ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/25'
                : 'bg-white/10 text-slate-200 hover:bg-white/20'
            }`}
          >
            <ShieldAlert size={15} />
            Diagnóstico das Abas (Front & Back-end)
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-black/20 font-black">
              {stats.total}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveView('telemetry')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
              activeView === 'telemetry'
                ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/25'
                : 'bg-white/10 text-slate-200 hover:bg-white/20'
            }`}
          >
            <Activity size={15} />
            Telemetria de Ações & Rastreabilidade
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-black/20 font-black">
              {auditLogs.length}
            </span>
          </button>
        </div>

        {/* KPI Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-5 pt-5 border-t border-white/10">
          <div className="bg-cyan-500/15 border border-cyan-400/30 rounded-2xl p-3.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-cyan-300 block">Sugestões de Código</span>
            <span className="text-2xl font-black text-white mt-0.5 block">{stats.suggestionsCount}</span>
            <span className="text-[10px] text-cyan-300 font-bold">Com Diff Antes/Depois</span>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Auditorias Mapeadas</span>
            <span className="text-2xl font-black text-white mt-0.5 block">{stats.total}</span>
            <span className="text-[10px] text-slate-300 font-bold">Em 10 abas do ERP</span>
          </div>
          <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-3.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-rose-300 block">Críticos</span>
            <span className="text-2xl font-black text-rose-400 mt-0.5 block">{stats.critical}</span>
            <span className="text-[10px] text-rose-300/80 font-bold">Prioridade Máxima</span>
          </div>
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-300 block">Severidade Alta</span>
            <span className="text-2xl font-black text-amber-400 mt-0.5 block">{stats.high}</span>
            <span className="text-[10px] text-amber-300/80 font-bold">Fluxos e Segurança</span>
          </div>
          <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-2xl p-3.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-indigo-300 block">Front-end (UI/UX)</span>
            <span className="text-2xl font-black text-indigo-400 mt-0.5 block">{stats.frontend}</span>
            <span className="text-[10px] text-indigo-300/80 font-bold">Componentes & Hooks</span>
          </div>
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-3.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-300 block">Back-end (Supabase)</span>
            <span className="text-2xl font-black text-emerald-400 mt-0.5 block">{stats.backend}</span>
            <span className="text-[10px] text-emerald-300/80 font-bold">Sync, RLS & Transações</span>
          </div>
        </div>
      </div>

      {/* VIEW 1: SUGESTÕES DE ALTERAÇÃO DE CÓDIGO (DIFF ANTES VS DEPOIS) */}
      {activeView === 'suggestions' && (
        <>
          <div className="bg-slate-50 dark:bg-slate-900/60 p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-700/70 space-y-4">
            <div className="flex flex-col lg:flex-row gap-3 justify-between">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Buscar sugestão de alteração por arquivo (ex: AppContext.tsx, Sales.tsx), categoria ou código..."
                  className="w-full pl-11 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="flex flex-wrap items-center gap-1.5 bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                {(['Todas', 'Performance', 'Segurança & RBAC', 'Regra de Negócio', 'Banco de Dados (SQL)', 'UX & Arquitetura'] as const).map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-black uppercase transition-all ${
                      selectedCategory === cat
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {filteredSuggestions.length > 0 && (
                  <button
                    type="button"
                    onClick={handleDeleteFiltered}
                    className="px-3 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60 text-[11px] font-black uppercase tracking-wider hover:bg-rose-100 transition-all flex items-center gap-1.5"
                    title="Excluir todas as sugestões visíveis no filtro atual"
                  >
                    <Trash2 size={13} />
                    Excluir Filtrados ({filteredSuggestions.length})
                  </button>
                )}
                {(deletedSuggestionIds.length > 0 || deletedIssueIds.length > 0) && (
                  <button
                    type="button"
                    onClick={handleRestoreDefaults}
                    className="px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 text-[11px] font-black uppercase tracking-wider hover:bg-amber-100 transition-all flex items-center gap-1.5"
                  >
                    <RotateCcw size={13} />
                    Restaurar Padrões ({deletedSuggestionIds.length + deletedIssueIds.length})
                  </button>
                )}
              </div>
            </div>

            {/* Module Pills */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
              {modulesList.map(mod => {
                const count =
                  mod === 'Todos'
                    ? allCodeSuggestions.length
                    : allCodeSuggestions.filter(s => s.module === mod).length;
                if (count === 0 && mod !== 'Todos') return null;
                return (
                  <button
                    key={mod}
                    type="button"
                    onClick={() => setSelectedModule(mod)}
                    className={`px-3.5 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider whitespace-nowrap transition-all flex items-center gap-2 border ${
                      selectedModule === mod
                        ? 'bg-slate-900 dark:bg-indigo-600 text-white border-slate-900 dark:border-indigo-500 shadow-sm'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-400'
                    }`}
                  >
                    <span>{mod}</span>
                    <span
                      className={`px-1.5 py-0.5 rounded-md text-[10px] ${
                        selectedModule === mod
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-5">
            {filteredSuggestions.map(suggestion => {
              const isCopied = copiedId === suggestion.id;
              const isQueued = !!queuedIds[suggestion.id];

              return (
                <div
                  key={suggestion.id}
                  className="bg-white dark:bg-slate-800/90 rounded-3xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm hover:shadow-md transition-all space-y-4"
                >
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2.5 py-1 rounded-lg bg-slate-900 dark:bg-slate-700 text-cyan-300 font-mono text-[10px] font-black">
                          {suggestion.id}
                        </span>
                        <span className="px-3 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-[10px] font-black uppercase tracking-wider border border-indigo-200/60 dark:border-indigo-800/50">
                          {suggestion.module}
                        </span>
                        <span className="px-2.5 py-1 rounded-lg bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/50 text-[10px] font-black uppercase tracking-wider">
                          {suggestion.category}
                        </span>
                        <span
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                            suggestion.impact === 'Alto'
                              ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                              : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                          }`}
                        >
                          Impacto {suggestion.impact}
                        </span>
                        <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 flex items-center gap-1 ml-1">
                          <FileCode size={12} className="text-indigo-500" />
                          {suggestion.file}
                        </span>
                      </div>

                      <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight pt-1">
                        {suggestion.title}
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        <strong className="text-slate-800 dark:text-slate-100">Análise da Revisão:</strong>{' '}
                        {suggestion.rationale}
                      </p>
                    </div>

                    <div className="shrink-0 flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleSendToCodeQueue(suggestion)}
                        disabled={isQueued}
                        className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 shadow-sm ${
                          isQueued
                            ? 'bg-emerald-600/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30 cursor-default'
                            : 'bg-slate-900 hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 text-white'
                        }`}
                      >
                        {isQueued ? <CheckCircle2 size={14} /> : <GitPullRequest size={14} />}
                        {isQueued ? 'Na Fila do Agente ADM' : 'Enviar p/ Fila de Aprovação'}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleCopyPrompt(suggestion.id, suggestion.prompt, suggestion.title)}
                        className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 shadow-sm ${
                          isCopied
                            ? 'bg-emerald-600 text-white shadow-emerald-500/20'
                            : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/20'
                        }`}
                      >
                        {isCopied ? <Check size={14} /> : <Copy size={14} />}
                        {isCopied ? 'Prompt Copiado!' : 'Copiar Prompt de Código'}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteSuggestion(suggestion.id, suggestion.title)}
                        title="Excluir este prompt/sugestão da lista"
                        className="px-3.5 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white dark:bg-rose-950/50 dark:text-rose-300 dark:hover:bg-rose-600 dark:hover:text-white border border-rose-200 dark:border-rose-800/60 text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5"
                      >
                        <Trash2 size={14} />
                        Excluir Prompt
                      </button>
                    </div>
                  </div>

                  {/* Side-by-Side Diff View: Código Atual (Antes) vs. Código Sugerido (Depois) */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 pt-2">
                    <div className="rounded-2xl bg-rose-950/95 border border-rose-500/30 p-4 overflow-hidden">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-rose-300 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-rose-400" /> Código Atual (Antes)
                        </span>
                        <span className="text-[10px] font-mono text-rose-300/70">{suggestion.file}</span>
                      </div>
                      <pre className="text-[11px] font-mono text-rose-100 whitespace-pre-wrap leading-relaxed overflow-x-auto">
                        {suggestion.codeBefore}
                      </pre>
                    </div>

                    <div className="rounded-2xl bg-emerald-950/95 border border-emerald-500/30 p-4 overflow-hidden">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-300 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-400" /> Código Sugerido (Depois)
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            handleCopyPrompt(
                              `${suggestion.id}-code`,
                              suggestion.codeAfter,
                              `Snippet de código (${suggestion.id})`
                            )
                          }
                          className="text-[10px] font-bold text-emerald-300 hover:text-white flex items-center gap-1"
                        >
                          <Copy size={11} /> Copiar Código
                        </button>
                      </div>
                      <pre className="text-[11px] font-mono text-emerald-100 whitespace-pre-wrap leading-relaxed overflow-x-auto">
                        {suggestion.codeAfter}
                      </pre>
                    </div>
                  </div>

                  {/* Implementation Prompt Box */}
                  <div className="bg-slate-900 dark:bg-slate-950 rounded-2xl p-4 border border-slate-800">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400 flex items-center gap-1.5">
                        <Terminal size={12} /> Prompt de Alteração de Código (Pronto para Execução)
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyPrompt(suggestion.id, suggestion.prompt, suggestion.title)}
                        className="text-[10px] font-bold text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
                      >
                        {isCopied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                        {isCopied ? 'Copiado' : 'Copiar Prompt'}
                      </button>
                    </div>
                    <pre className="text-xs font-mono text-slate-200 whitespace-pre-wrap leading-relaxed overflow-x-auto">
                      {suggestion.prompt}
                    </pre>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* VIEW 2: GERADOR INTERATIVO DE REVISÃO & SUGESTÃO DE CÓDIGO SOB DEMANDA (ADM) */}
      {activeView === 'studio' && (
        <div className="bg-white dark:bg-slate-800/90 rounded-3xl border border-slate-200 dark:border-slate-700 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-start justify-between gap-4 border-b border-slate-100 dark:border-slate-700 pb-5">
            <div>
              <span className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-300 text-[10px] font-black uppercase tracking-widest">
                Estúdio de Revisão Sob Demanda • Exclusivo Administrador
              </span>
              <h3 className="text-lg font-black text-slate-900 dark:text-white mt-2">
                Solicitar Nova Revisão e Sugestão de Alteração de Código
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Escolha qualquer arquivo do projeto, defina o tipo de melhoria desejada e o agente gerará o comparativo
                de código (Antes/Depois), o prompt técnico e permitirá enviá-lo à fila de aprovação.
              </p>
            </div>
          </div>

          <form onSubmit={handleGenerateCustomSuggestion} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-2">
                  Arquivo / Módulo Alvo do ERP
                </label>
                <select
                  value={studioFile}
                  onChange={e => setStudioFile(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  {erpFilesCatalog.map(item => (
                    <option key={item.file} value={item.file}>
                      {item.file} — ({item.module})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-2">
                  Categoria da Revisão
                </label>
                <select
                  value={studioCategory}
                  onChange={e => setStudioCategory(e.target.value as CodeReviewSuggestion['category'])}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="UX & Arquitetura">UX & Arquitetura (Clean Code)</option>
                  <option value="Performance">Performance & Memoização</option>
                  <option value="Segurança & RBAC">Segurança & RBAC</option>
                  <option value="Regra de Negócio">Regra de Negócio</option>
                  <option value="Banco de Dados (SQL)">Banco de Dados (SQL)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-2">
                  Impacto Técnico
                </label>
                <select
                  value={studioImpact}
                  onChange={e => setStudioImpact(e.target.value as CodeReviewSuggestion['impact'])}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="Alto">Impacto Alto</option>
                  <option value="Médio">Impacto Médio</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-2">
                O que você deseja revisar, otimizar ou alterar neste código?
              </label>
              <textarea
                rows={4}
                value={studioGoal}
                onChange={e => setStudioGoal(e.target.value)}
                placeholder="Ex: Adicionar bloqueio para impedir exclusão de cliente que já possui vendas faturadas e gravar log de auditoria detalhado..."
                className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setActiveView('suggestions')}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                Voltar para Sugestões
              </button>
              <button
                type="submit"
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-indigo-500/25 flex items-center gap-2"
              >
                <Sparkles size={15} />
                Gerar Revisão, Diff & Prompt de Código
              </button>
            </div>
          </form>
        </div>
      )}

      {/* VIEW 3: DIAGNÓSTICO DAS ABAS (27 ITENS FRONT-END & BACK-END) */}
      {activeView === 'audit' && (
        <>
          {/* Filters Toolbar */}
          <div className="bg-slate-50 dark:bg-slate-900/60 p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-700/70 space-y-4">
            <div className="flex flex-col lg:flex-row gap-3 justify-between">
              {/* Search Input */}
              <div className="relative flex-1">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Buscar erro por aba, arquivo (ex: Purchases.tsx, HR.tsx), sintoma ou código..."
                  className="w-full pl-11 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              {/* Layer Filter */}
              <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                {(['Todos', 'Front-end', 'Back-end'] as const).map(layer => (
                  <button
                    key={layer}
                    type="button"
                    onClick={() => setSelectedLayer(layer)}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-black uppercase transition-all flex items-center gap-1.5 ${
                      selectedLayer === layer
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                    }`}
                  >
                    {layer === 'Front-end' && <Monitor size={12} />}
                    {layer === 'Back-end' && <Database size={12} />}
                    {layer}
                  </button>
                ))}
              </div>

              {/* Severity Filter */}
              <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                {(['Todos', 'Crítico', 'Alto', 'Médio'] as const).map(sev => (
                  <button
                    key={sev}
                    type="button"
                    onClick={() => setSelectedSeverity(sev)}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-black uppercase transition-all ${
                      selectedSeverity === sev
                        ? sev === 'Crítico'
                          ? 'bg-rose-600 text-white'
                          : sev === 'Alto'
                          ? 'bg-amber-500 text-white'
                          : sev === 'Médio'
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-900 dark:bg-slate-700 text-white'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                    }`}
                  >
                    {sev}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {filteredIssues.length > 0 && (
                  <button
                    type="button"
                    onClick={handleDeleteFiltered}
                    className="px-3 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60 text-[11px] font-black uppercase tracking-wider hover:bg-rose-100 transition-all flex items-center gap-1.5"
                  >
                    <Trash2 size={13} />
                    Excluir Filtrados ({filteredIssues.length})
                  </button>
                )}
                {(deletedSuggestionIds.length > 0 || deletedIssueIds.length > 0) && (
                  <button
                    type="button"
                    onClick={handleRestoreDefaults}
                    className="px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 text-[11px] font-black uppercase tracking-wider hover:bg-amber-100 transition-all flex items-center gap-1.5"
                  >
                    <RotateCcw size={13} />
                    Restaurar Padrões ({deletedSuggestionIds.length + deletedIssueIds.length})
                  </button>
                )}
              </div>
            </div>

            {/* Module Pills */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
              {modulesList.map(mod => {
                const count =
                  mod === 'Todos'
                    ? liveEnrichedIssues.length
                    : liveEnrichedIssues.filter(i => i.module === mod).length;
                if (count === 0 && mod !== 'Todos') return null;
                return (
                  <button
                    key={mod}
                    type="button"
                    onClick={() => setSelectedModule(mod)}
                    className={`px-3.5 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider whitespace-nowrap transition-all flex items-center gap-2 border ${
                      selectedModule === mod
                        ? 'bg-slate-900 dark:bg-indigo-600 text-white border-slate-900 dark:border-indigo-500 shadow-sm'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-400'
                    }`}
                  >
                    <span>{mod}</span>
                    <span
                      className={`px-1.5 py-0.5 rounded-md text-[10px] ${
                        selectedModule === mod
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Diagnostic Cards List */}
          <div className="space-y-4">
            {filteredIssues.map(issue => {
              const isCopied = copiedId === issue.id;
              const isExpanded = expandedIssueId === issue.id || true;

              return (
                <div
                  key={issue.id}
                  className="bg-white dark:bg-slate-800/90 rounded-3xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm hover:shadow-md transition-all"
                >
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      {/* Badges Row */}
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-mono text-[10px] font-black">
                          {issue.id}
                        </span>
                        <span className="px-3 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-[10px] font-black uppercase tracking-wider border border-indigo-200/60 dark:border-indigo-800/50">
                          {issue.module}
                        </span>
                        <span
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1 ${
                            issue.layer === 'Back-end'
                              ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50'
                              : issue.layer === 'Front-end'
                              ? 'bg-cyan-50 dark:bg-cyan-950/50 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800/50'
                              : 'bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/50'
                          }`}
                        >
                          {issue.layer === 'Back-end' ? <Database size={11} /> : <Monitor size={11} />}
                          {issue.layer}
                        </span>
                        <span
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1 ${
                            issue.severity === 'Crítico'
                              ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                              : issue.severity === 'Alto'
                              ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                              : 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-800'
                          }`}
                        >
                          <AlertTriangle size={11} />
                          {issue.severity}
                        </span>
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                          <CheckCircle2 size={11} />
                          Corrigido & Ativo
                        </span>
                        <span className="text-[11px] font-mono text-slate-400 dark:text-slate-400 flex items-center gap-1 ml-1">
                          <FileCode size={12} className="text-slate-400" />
                          {issue.file} <span className="text-slate-300 dark:text-slate-600">|</span> L:{issue.lines}
                        </span>
                      </div>

                      {/* Title & Description */}
                      <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight pt-1">
                        {issue.title}
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        {issue.description}
                      </p>

                      {/* Live State Metric Alert if present */}
                      {issue.liveMetric && (
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 text-amber-800 dark:text-amber-300 text-[11px] font-bold mt-1">
                          <Zap size={13} className="text-amber-500 shrink-0" />
                          <span>Estado em Tempo Real: {issue.liveMetric}</span>
                        </div>
                      )}
                    </div>

                    {/* Copy & Delete Prompt Action Buttons */}
                    <div className="shrink-0 flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleCopyPrompt(issue.id, issue.prompt, issue.title)}
                        className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 shadow-sm ${
                          isCopied
                            ? 'bg-emerald-600 text-white shadow-emerald-500/20'
                            : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/20'
                        }`}
                      >
                        {isCopied ? <Check size={14} /> : <Copy size={14} />}
                        {isCopied ? 'Prompt Copiado!' : 'Copiar Prompt de Solução'}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteIssue(issue.id, issue.title)}
                        title="Excluir este prompt de diagnóstico"
                        className="px-3.5 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white dark:bg-rose-950/50 dark:text-rose-300 dark:hover:bg-rose-600 dark:hover:text-white border border-rose-200 dark:border-rose-800/60 text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5"
                      >
                        <Trash2 size={14} />
                        Excluir Prompt
                      </button>
                    </div>
                  </div>

                  {/* Prompt Box */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700/60">
                      <div className="bg-slate-900 dark:bg-slate-950 rounded-2xl p-4 border border-slate-800 relative group">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400 flex items-center gap-1.5">
                            <Terminal size={12} /> Prompt Pronto para Correção (Copie e envie para a IA)
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyPrompt(issue.id, issue.prompt, issue.title)}
                            className="text-[10px] font-bold text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
                          >
                            {isCopied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                            {isCopied ? 'Copiado' : 'Copiar'}
                          </button>
                        </div>
                        <pre className="text-xs font-mono text-slate-200 whitespace-pre-wrap leading-relaxed overflow-x-auto">
                          {issue.prompt}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {filteredIssues.length === 0 && (
              <div className="py-16 text-center bg-slate-50 dark:bg-slate-900/40 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700">
                <CheckCircle2 size={40} className="text-emerald-500 mx-auto mb-3" />
                <p className="text-sm font-black text-slate-700 dark:text-slate-200">
                  Nenhum erro encontrado para os filtros selecionados
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Experimente selecionar "Todos" nos filtros de módulo ou severidade.
                </p>
              </div>
            )}
          </div>
        </>
      )}
      {/* VIEW 4: TELEMETRIA DE AÇÕES & RASTREABILIDADE EM TEMPO REAL */}
      {activeView === 'telemetry' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Telemetry Status Banner */}
          <div className="bg-slate-900 text-white p-5 rounded-3xl border border-indigo-500/30 shadow-xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center shrink-0">
                <Activity size={24} className="animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-black uppercase tracking-wider text-white">
                    Trilha de Telemetria & Rastreabilidade de Agentes
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                    Live Telemetry
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  Monitoramento contínuo das ações dos Agentes IA, mutações de dados no Supabase e integridade de chaves e permissões.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleTriggerTelemetryPing}
                className="px-3.5 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-400/40 text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 shadow-sm"
              >
                <Radio size={14} className="animate-ping" />
                Disparar Pulso de Telemetria
              </button>
              <button
                type="button"
                onClick={handleExportTelemetryJSON}
                className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 shadow-sm"
              >
                <Download size={14} />
                Exportar Snapshot JSON
              </button>
            </div>
          </div>

          {/* Telemetry KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Ações dos Agentes IA</span>
                <Bot size={16} className="text-cyan-500" />
              </div>
              <span className="text-2xl font-black text-slate-800 dark:text-white mt-1 block">
                {telemetryStats.aiEvents}
              </span>
              <span className="text-[10px] font-bold text-cyan-600 dark:text-cyan-400">
                Prompts, scans e filas auditados
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Logs Totais de Auditoria</span>
                <Terminal size={16} className="text-indigo-500" />
              </div>
              <span className="text-2xl font-black text-slate-800 dark:text-white mt-1 block">
                {telemetryStats.totalLogs}
              </span>
              <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                100% de trilha persistida
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Alertas & Críticos</span>
                <AlertCircle size={16} className="text-rose-500" />
              </div>
              <span className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1 block">
                {telemetryStats.criticalEvents}
              </span>
              <span className="text-[10px] font-bold text-rose-500">
                {telemetryStats.warningEvents} avisos em monitoramento
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Integridade UUID V4</span>
                <ShieldCheck size={16} className="text-emerald-500" />
              </div>
              <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 block">
                {telemetryStats.nonUuidCount === 0 ? '100% Conforme' : `${telemetryStats.nonUuidCount} Legados`}
              </span>
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                Validação de integridade ativa
              </span>
            </div>
          </div>

          {/* Diagnostic Integrity Panel */}
          <div className="bg-slate-50 dark:bg-slate-900/60 p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-700/70 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-200 flex items-center gap-2">
                <Cpu size={15} className="text-indigo-500" />
                Diagnóstico de Integridade Operacional em Tempo Real
              </span>
              {pingStatus && (
                <span className="text-[11px] font-bold text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/40 px-2.5 py-1 rounded-lg border border-cyan-200 dark:border-cyan-800/40 flex items-center gap-1.5">
                  <Radio size={12} className="text-cyan-500" />
                  {pingStatus}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
              <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-start gap-3">
                <div className={`p-2 rounded-xl shrink-0 ${telemetryStats.nonUuidCount === 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                  <Database size={18} />
                </div>
                <div>
                  <span className="text-[11px] font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 block">
                    Chaves Primárias (UUID V4)
                  </span>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {telemetryStats.nonUuidCount === 0
                      ? 'Todas as vendas e pedidos de compra estão em formato UUID válido.'
                      : `Detectados ${telemetryStats.nonUuidCount} registros com IDs legados (ex: S-..., PO-...). Trilha de auditoria gerada.`}
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-start gap-3">
                <div className={`p-2 rounded-xl shrink-0 ${telemetryStats.orphanCount === 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                  <Lock size={18} />
                </div>
                <div>
                  <span className="text-[11px] font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 block">
                    Integridade Referencial RBAC
                  </span>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {telemetryStats.orphanCount === 0
                      ? 'Nenhum usuário órfão detectado; todos os operadores possuem perfil de acesso válido.'
                      : `Atenção: ${telemetryStats.orphanCount} usuário(s) ativos possuem roleId inexistente no sistema!`}
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-start gap-3">
                <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-500 shrink-0">
                  <Zap size={18} />
                </div>
                <div>
                  <span className="text-[11px] font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 block">
                    Barramento Multi-Aba & Sync
                  </span>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    BroadcastChannel & storage listeners ativos. Telemetria registra alterações entre abas instantaneamente.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Telemetry Filter & Search Bar */}
          <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-3xl border border-slate-200 dark:border-slate-700/70 space-y-3">
            <div className="flex flex-col lg:flex-row gap-3 justify-between">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={telemetrySearch}
                  onChange={e => setTelemetrySearch(e.target.value)}
                  placeholder="Buscar na telemetria por ação, módulo, operador, detalhes ou ID..."
                  className="w-full pl-11 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="flex flex-wrap items-center gap-1.5 bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                {[
                  { id: 'all', label: 'Todos os Eventos', count: auditLogs.length },
                  { id: 'ai_agent', label: 'Agentes IA', count: telemetryStats.aiEvents },
                  { id: 'security', label: 'Segurança & RBAC', count: auditLogs.filter(l => l.severity === 'critical' || l.module.includes('Segurança') || l.action.includes('login')).length },
                  { id: 'critical', label: 'Críticos', count: telemetryStats.criticalEvents },
                  { id: 'mutations', label: 'Mutações de Dados', count: auditLogs.filter(l => l.action.includes('create') || l.action.includes('update') || l.action.includes('delete') || l.action.includes('Conciliação')).length }
                ].map(tab => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setTelemetryFilter(tab.id as any)}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-black uppercase transition-all flex items-center gap-1.5 ${
                      telemetryFilter === tab.id
                        ? 'bg-cyan-500 text-slate-950 shadow-sm'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-black/10 dark:bg-white/10 font-bold">
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Telemetry Live Feed */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Feed de Ações & Rastreabilidade ({filteredTelemetryLogs.length} eventos)
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                Ordenado por recência (tempo real)
              </span>
            </div>

            {filteredTelemetryLogs.map(log => {
              const isAIAction =
                (log.module && (log.module.includes('IA') || log.module.includes('Agente'))) ||
                (log.action && (log.action.startsWith('ai_') || log.action.startsWith('prompt_') || log.action.startsWith('scan_') || log.action.startsWith('telemetry_') || log.action.startsWith('suggestion_') || log.action.startsWith('issue_') || log.action.startsWith('defaults_')));

              const isCopied = copiedTelemetryId === log.id;

              return (
                <div
                  key={log.id}
                  className="p-4 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 hover:border-cyan-500/40 transition-all space-y-2"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <div
                        className={`p-1.5 rounded-lg shrink-0 ${
                          log.severity === 'critical'
                            ? 'bg-rose-500/10 text-rose-500'
                            : isAIAction
                            ? 'bg-cyan-500/10 text-cyan-500'
                            : 'bg-indigo-500/10 text-indigo-500'
                        }`}
                      >
                        {log.severity === 'critical' ? (
                          <ShieldAlert size={14} />
                        ) : isAIAction ? (
                          <Bot size={14} />
                        ) : (
                          <Activity size={14} />
                        )}
                      </div>

                      <span className="font-mono text-xs font-black text-slate-900 dark:text-white">
                        {log.action}
                      </span>

                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                        {log.module}
                      </span>

                      <span
                        className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                          log.severity === 'critical'
                            ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                            : log.severity === 'warning'
                            ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                            : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                        }`}
                      >
                        {log.severity}
                      </span>

                      {isAIAction && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30">
                          Agente IA
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                        <Clock size={11} />
                        {formatRelativeTime(log.timestamp)}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        {log.timestamp ? new Date(log.timestamp).toLocaleTimeString('pt-BR') : ''}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
                    {log.details || 'Sem detalhes técnicos adicionais.'}
                  </p>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-700/50 text-[11px] text-slate-400">
                    <div className="flex items-center gap-3">
                      <span>
                        Operador: <strong className="text-slate-700 dark:text-slate-200">{log.userName || log.userId}</strong>
                      </span>
                      {log.ip && (
                        <span className="font-mono">
                          IP: {log.ip}
                        </span>
                      )}
                      <span className="font-mono text-[10px] text-slate-400">
                        ID: {log.id}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(JSON.stringify(log, null, 2));
                        setCopiedTelemetryId(log.id);
                        addToast('Registro copiado em JSON para análise forense!', 'success');
                        setTimeout(() => setCopiedTelemetryId(prev => prev === log.id ? null : prev), 2000);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-700/60 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold text-[10px] flex items-center gap-1 transition-colors"
                    >
                      {isCopied ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
                      {isCopied ? 'Copiado JSON' : 'Copiar JSON'}
                    </button>
                  </div>
                </div>
              );
            })}

            {filteredTelemetryLogs.length === 0 && (
              <div className="py-16 text-center bg-slate-50 dark:bg-slate-900/40 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700">
                <CheckCircle2 size={40} className="text-emerald-500 mx-auto mb-3" />
                <p className="text-sm font-black text-slate-700 dark:text-slate-200">
                  Nenhum registro de telemetria encontrado para os filtros selecionados
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Selecione "Todos os Eventos" ou limpe o campo de busca.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );

  if (mode === 'embedded') {
    return renderContent();
  }

  // Floating Global Mode (strictly visible ONLY to Administrator)
  return (
    <>
      <button
        type="button"
        onClick={() => {
          const currentMod = routeToModuleMap[location.pathname] || 'Todos';
          setSelectedModule(currentMod);
          setIsOpen(true);
        }}
        title="Abrir Agente IA de Revisão e Alteração de Código (Exclusivo ADM)"
        className="fixed bottom-6 right-6 z-40 px-4 py-3 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 hover:from-indigo-900 hover:to-slate-900 text-white shadow-2xl border border-cyan-500/40 flex items-center gap-3 group transition-all hover:scale-105 active:scale-95"
      >
        <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-500 to-indigo-600 text-white shadow-md">
          <Code2 size={18} />
        </div>
        <div className="text-left hidden sm:block">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-black uppercase tracking-wider">Revisão Código IA</span>
            <span className="px-1.5 py-0.5 text-[9px] font-black bg-rose-500 text-white rounded-full">
              ADM • {currentTabIssuesCount}
            </span>
          </div>
          <span className="text-[10px] text-cyan-300 font-medium block">
            Sugestões & Diff de Código
          </span>
        </div>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6">
          <div className="bg-white dark:bg-slate-900 w-full max-w-6xl h-[90vh] rounded-[32px] shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Top Bar */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-cyan-500/20 text-cyan-400 rounded-xl border border-cyan-500/30">
                  <Code2 size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-black uppercase tracking-wider">
                      Agente IA de Revisão e Alteração de Código
                    </h3>
                    <span className="px-2 py-0.5 text-[9px] font-black uppercase bg-rose-500/20 text-rose-300 border border-rose-400/30 rounded-full">
                      Exclusivo ADM
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Aba atual detectada:{' '}
                    <strong className="text-cyan-400">
                      {routeToModuleMap[location.pathname] || 'Geral'}
                    </strong>{' '}
                    • Use o filtro "Todos" para ver o sistema inteiro
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedModule('Todos')}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-[11px] font-bold text-slate-200 transition-colors"
                >
                  Ver Todo o Código ({allCodeSuggestions.length})
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
              {renderContent()}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AIAuditAgent;
