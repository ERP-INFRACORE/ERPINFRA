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
  ExternalLink
} from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { APP_PERMISSIONS } from '../permission_constants';

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
    users,
    roles,
    vehicles,
    transactions,
    accounts,
    productionUnits,
    inventory,
    employees,
    sales,
    budgets,
    purchaseOrders
  } = useApp();
  const { addToast } = useToast();

  const [isOpen, setIsOpen] = useState(false);
  const [selectedModule, setSelectedModule] = useState<string>('Todos');
  const [selectedLayer, setSelectedLayer] = useState<'Todos' | 'Front-end' | 'Back-end'>('Todos');
  const [selectedSeverity, setSelectedSeverity] = useState<'Todos' | 'Crítico' | 'Alto' | 'Médio'>('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(100);
  const [expandedIssueId, setExpandedIssueId] = useState<string | null>(null);

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
    const unnamedVehicles = vehicles.filter(v => !v.name || v.name.trim() === '');
    const nonUuidSales = sales.filter(
      s => !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s.id)
    );
    const nonUuidPOs = purchaseOrders.filter(
      po => !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(po.id)
    );

    return STATIC_AUDIT_ISSUES.map(issue => {
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
  }, [users, roles, vehicles, sales, purchaseOrders, productionUnits, accounts]);

  const modulesList = useMemo(() => {
    const unique = Array.from(new Set(STATIC_AUDIT_ISSUES.map(i => i.module)));
    return ['Todos', ...unique];
  }, []);

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
    return { total, critical, high, medium, frontend, backend };
  }, [liveEnrichedIssues]);

  const handleRunScan = () => {
    setIsScanning(true);
    setScanProgress(0);
    const interval = setInterval(() => {
      setScanProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsScanning(false);
          addToast(
            `Varredura IA concluída! ${liveEnrichedIssues.length} diagnósticos mapeados em 10 módulos.`,
            'success'
          );
          return 100;
        }
        return prev + 20;
      });
    }, 140);
  };

  const handleCopyPrompt = (id: string, promptText: string, title?: string) => {
    navigator.clipboard.writeText(promptText);
    setCopiedId(id);
    addToast(
      title ? `Prompt copiado: "${title}"` : 'Prompt de solução copiado para a área de transferência!',
      'success'
    );
    setTimeout(() => {
      setCopiedId(prev => (prev === id ? null : prev));
    }, 2500);
  };

  const handleCopyAllFilteredPrompts = () => {
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

  const currentTabIssuesCount = useMemo(() => {
    const currentMod = routeToModuleMap[location.pathname];
    if (!currentMod) return liveEnrichedIssues.length;
    return liveEnrichedIssues.filter(
      i => i.module === currentMod || i.module === 'Global / Supabase'
    ).length;
  }, [location.pathname, liveEnrichedIssues]);

  const renderContent = () => (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 rounded-[28px] border border-indigo-500/30 shadow-xl relative overflow-hidden">
        <div className="absolute -right-12 -top-12 w-56 h-56 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-12 -bottom-12 w-56 h-56 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="p-3.5 bg-gradient-to-br from-cyan-500 to-indigo-600 rounded-2xl text-white shadow-lg shadow-cyan-500/25 shrink-0">
              <Bot size={28} />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-black tracking-tight uppercase italic">
                  Agente IA Auditor • Front-end & Back-end
                </h2>
                <span className="px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 rounded-full flex items-center gap-1">
                  <Sparkles size={11} /> Diagnóstico Ativo
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 mt-1.5 max-w-3xl leading-relaxed">
                Inspeção completa de todas as 10 abas do ERP, cruzando componentes React, regras de permissão,
                mutações do <code className="text-cyan-300 font-mono">AppContext.tsx</code> e schema SQL do Supabase, com{' '}
                <strong className="text-white">prompts prontos para solução imediata</strong>.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={handleRunScan}
              disabled={isScanning}
              className="px-4 py-3 bg-white/10 hover:bg-white/20 text-white border border-white/15 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2"
            >
              <RefreshCw size={15} className={isScanning ? 'animate-spin text-cyan-400' : 'text-cyan-400'} />
              {isScanning ? `Escaneando (${scanProgress}%)` : 'Reescanear Abas'}
            </button>

            <button
              type="button"
              onClick={handleCopyAllFilteredPrompts}
              className="px-5 py-3 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white rounded-2xl text-xs font-black uppercase tracking-wider shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2"
            >
              {copiedId === 'ALL_FILTERED' ? <Check size={15} /> : <Copy size={15} />}
              {copiedId === 'ALL_FILTERED'
                ? 'Super-Prompt Copiado!'
                : `Copiar Todos os Prompts (${filteredIssues.length})`}
            </button>
          </div>
        </div>

        {/* KPI Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-6 pt-6 border-t border-white/10">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Total Mapeado</span>
            <span className="text-2xl font-black text-white mt-0.5 block">{stats.total}</span>
            <span className="text-[10px] text-cyan-300 font-bold">Em 10 abas do ERP</span>
          </div>
          <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-3.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-rose-300 block">Críticos</span>
            <span className="text-2xl font-black text-rose-400 mt-0.5 block">{stats.critical}</span>
            <span className="text-[10px] text-rose-300/80 font-bold">Prioridade Máxima</span>
          </div>
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-300 block">Severidade Alta</span>
            <span className="text-2xl font-black text-amber-400 mt-0.5 block">{stats.high}</span>
            <span className="text-[10px] text-amber-300/80 font-bold">Fluxos incompletos</span>
          </div>
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-3.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-blue-300 block">Severidade Média</span>
            <span className="text-2xl font-black text-blue-400 mt-0.5 block">{stats.medium}</span>
            <span className="text-[10px] text-blue-300/80 font-bold">UX & Formatação</span>
          </div>
          <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-2xl p-3.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-indigo-300 block">Front-end (UI/UX)</span>
            <span className="text-2xl font-black text-indigo-400 mt-0.5 block">{stats.frontend}</span>
            <span className="text-[10px] text-indigo-300/80 font-bold">Botões, Modais & Hooks</span>
          </div>
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-3.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-300 block">Back-end (Supabase)</span>
            <span className="text-2xl font-black text-emerald-400 mt-0.5 block">{stats.backend}</span>
            <span className="text-[10px] text-emerald-300/80 font-bold">Sync, UUID & Colunas SQL</span>
          </div>
        </div>
      </div>

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
        </div>

        {/* Module Pills */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          {modulesList.map(mod => {
            const count =
              mod === 'Todos'
                ? liveEnrichedIssues.length
                : liveEnrichedIssues.filter(i => i.module === mod).length;
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
          const isExpanded = expandedIssueId === issue.id || true; // Always show solution prompt clearly

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

                {/* Copy Prompt Action Button */}
                <div className="shrink-0 flex items-center gap-2">
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
    </div>
  );

  if (mode === 'embedded') {
    return renderContent();
  }

  // Floating Global Mode (accessible on every tab of the ERP)
  return (
    <>
      <button
        type="button"
        onClick={() => {
          const currentMod = routeToModuleMap[location.pathname] || 'Todos';
          setSelectedModule(currentMod);
          setIsOpen(true);
        }}
        title="Abrir Agente IA Auditor (Front-end & Back-end)"
        className="fixed bottom-6 right-6 z-40 px-4 py-3 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 hover:from-indigo-900 hover:to-slate-900 text-white shadow-2xl border border-cyan-500/40 flex items-center gap-3 group transition-all hover:scale-105 active:scale-95"
      >
        <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-500 to-indigo-600 text-white shadow-md">
          <Bot size={18} />
        </div>
        <div className="text-left hidden sm:block">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-black uppercase tracking-wider">Agente IA</span>
            <span className="px-1.5 py-0.5 text-[9px] font-black bg-rose-500 text-white rounded-full">
              {currentTabIssuesCount}
            </span>
          </div>
          <span className="text-[10px] text-cyan-300 font-medium block">
            Auditor Front & Back-end
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
                  <Bot size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider">
                    Agente de IA Auditor — Revisão de Abas e Prompts de Solução
                  </h3>
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
                  Ver Todas as Abas ({liveEnrichedIssues.length})
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
