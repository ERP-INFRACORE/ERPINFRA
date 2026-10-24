<#
.SYNOPSIS
    Gerenciador e Criador de Branches Multi-Agente para o InfraCore BETA.
.DESCRIPTION
    Cria e sincroniza as branches agent/[modulo] a partir da branch principal (main).
    Permite alternar facilmente entre as branches de cada conversa.
.PARAMETER Action
    create-all : Cria todas as 15 branches locais baseadas na branch atual/main
    switch     : Alterna para a branch do módulo especificado (-Module <nome>)
    list       : Lista todas as branches de agentes e seus arquivos de prompt
.EXAMPLE
    .\scripts\setup-agent-branches.ps1 -Action list
    .\scripts\setup-agent-branches.ps1 -Action switch -Module finance
    .\scripts\setup-agent-branches.ps1 -Action create-all
#>

param (
    [Parameter(Mandatory = $false)]
    [ValidateSet('create-all', 'switch', 'list', 'status')]
    [string]$Action = 'list',

    [Parameter(Mandatory = $false)]
    [string]$Module
)

$AgentModules = @(
    @{ Id = 'dashboard'; Branch = 'agent/dashboard'; Prompt = 'docs/prompts/01_dashboard.md'; Custody = 'pages/Dashboard.tsx' },
    @{ Id = 'clients';   Branch = 'agent/clients';   Prompt = 'docs/prompts/02_cadastros.md'; Custody = 'pages/Clients.tsx' },
    @{ Id = 'sales';     Branch = 'agent/sales';     Prompt = 'docs/prompts/03_vendas_faturamento.md'; Custody = 'pages/Sales.tsx' },
    @{ Id = 'purchases'; Branch = 'agent/purchases'; Prompt = 'docs/prompts/04_compras_estoque.md'; Custody = 'pages/Purchases.tsx' },
    @{ Id = 'production';Branch = 'agent/production';Prompt = 'docs/prompts/05_producao_usina.md'; Custody = 'pages/Production.tsx' },
    @{ Id = 'finance';   Branch = 'agent/finance';   Prompt = 'docs/prompts/06_financeiro.md'; Custody = 'pages/Finance.tsx' },
    @{ Id = 'hr';        Branch = 'agent/hr';        Prompt = 'docs/prompts/07_rh_departamento_pessoal.md'; Custody = 'pages/HR.tsx' },
    @{ Id = 'fleet';     Branch = 'agent/fleet';     Prompt = 'docs/prompts/08_frota_equipamentos.md'; Custody = 'pages/Fleet.tsx' },
    @{ Id = 'reports';   Branch = 'agent/reports';   Prompt = 'docs/prompts/09_relatorios_bi.md'; Custody = 'pages/Reports.tsx' },
    @{ Id = 'settings';  Branch = 'agent/settings';  Prompt = 'docs/prompts/10_configuracoes_seguranca.md'; Custody = 'pages/Settings.tsx' },
    @{ Id = 'supabase-db'; Branch = 'agent/supabase-db'; Prompt = 'docs/prompts/11_supabase_banco_dados.md'; Custody = 'src/lib/supabase.ts, src/services/api.ts' },
    @{ Id = 'ai-hub';    Branch = 'agent/ai-hub';    Prompt = 'docs/prompts/12_ai_agents_hub.md'; Custody = 'components/AIAgentsHub.tsx, AIAuditAgent.tsx' },
    @{ Id = 'design-system'; Branch = 'agent/design-system'; Prompt = 'docs/prompts/13_layout_design_system.md'; Custody = 'components/Layout.tsx, LayoutDesignerDrawer.tsx' },
    @{ Id = 'app-context-arch'; Branch = 'agent/app-context-arch'; Prompt = 'docs/prompts/14_app_context_refactoring.md'; Custody = 'context/AppContext.tsx, types.ts' },
    @{ Id = 'devops-qa'; Branch = 'agent/devops-qa'; Prompt = 'docs/prompts/15_devops_qa_build.md'; Custody = 'vite.config.ts, vercel.json' }
)

function Show-List {
    Write-Host "`n====================================================================" -ForegroundColor Cyan
    Write-Host " InfraCore BETA - Catálogo de Branches e Agentes Multi-Conversação" -ForegroundColor Cyan
    Write-Host "====================================================================`n" -ForegroundColor Cyan
    
    foreach ($m in $AgentModules) {
        Write-Host (" [{0,-17}] -> Branch: {1,-24} | Arquivo: {2}" -f $m.Id, $m.Branch, $m.Custody) -ForegroundColor Green
        Write-Host ("   Prompt: {0}" -f $m.Prompt) -ForegroundColor Gray
    }
    Write-Host "`nPara alternar: .\scripts\setup-agent-branches.ps1 -Action switch -Module <id>" -ForegroundColor Yellow
    Write-Host "Para criar todas: .\scripts\setup-agent-branches.ps1 -Action create-all`n" -ForegroundColor Yellow
}

function Create-AllBranches {
    Write-Host "`nCriando branches para todos os 15 agentes a partir do commit atual..." -ForegroundColor Cyan
    $existing = git branch --format="%(refname:short)"
    foreach ($m in $AgentModules) {
        if ($existing -contains $m.Branch) {
            Write-Host (" Branch '{0}' já existe. Pulando criação." -f $m.Branch) -ForegroundColor Gray
        } else {
            git branch $m.Branch
            Write-Host (" [+] Branch '{0}' criada com sucesso." -f $m.Branch) -ForegroundColor Green
        }
    }
    Write-Host "`nTodas as branches estão prontas!" -ForegroundColor Cyan
}

function Switch-ModuleBranch {
    if (-not $Module) {
        Write-Host "Erro: Você precisa especificar o parâmetro -Module <nome>. Use -Action list para ver as opções." -ForegroundColor Red
        return
    }
    $target = $AgentModules | Where-Object { $_.Id -eq $Module -or $_.Branch -eq $Module }
    if (-not $target) {
        Write-Host "Erro: Módulo '$Module' não encontrado. Use -Action list para ver opções disponíveis." -ForegroundColor Red
        return
    }
    Write-Host ("Alternando para branch: {0} ({1})..." -f $target.Branch, $target.Custody) -ForegroundColor Cyan
    git checkout $target.Branch
    Write-Host ("Pronto! Arquivo de prompt: {0}" -f $target.Prompt) -ForegroundColor Green
}

switch ($Action) {
    'list' { Show-List }
    'create-all' { Create-AllBranches }
    'switch' { Switch-ModuleBranch }
    'status' { git status }
}
