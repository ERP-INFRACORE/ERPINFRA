# InfraCore BETA - Sistema de Governança Multi-Agente & Prompts por Aba

Bem-vindo ao catálogo operacional de **Prompts e Governança Multi-Agente** do **InfraCore BETA** (ERP para Construção Civil, Engenharia Pesada e Usinas).

Este ecossistema foi projetado para permitir que múltiplos agentes de inteligência artificial (ou múltiplas sessões no Google Antigravity / Claude / ChatGPT) trabalhem em paralelo no código **sem gerar conflitos de merge, sem quebrar o estado global e sem alucinações**.

---

## 🛡️ As 4 Leis Inegociáveis de Governança

1. **File Ownership Estrito (Custódia de Arquivos)**:
   - Cada agente possui uma lista explícita de arquivos sob sua custódia.
   - O agente **NUNCA** deve modificar arquivos fora de sua custódia declarada sem prévia autorização.
2. **Protocolo Contract/RFC First (Estado Global Compartilhado)**:
   - Arquivos compartilhados centrais (`types.ts`, `context/AppContext.tsx`, `src/services/api.ts`, `supabase_schema.sql`) estão sob custódia exclusiva dos agentes arquitetos (`agent/app-context-arch` e `agent/supabase-db`).
   - Se uma aba de negócio precisar de um novo campo, hook ou mutation global, o agente deve gerar o bloco padronizado:
     ```markdown
     ### [PROPOSTA DE CONTRATO COMPARTILHADO]
     - Tipo a adicionar em types.ts:
     - Função/Estado em AppContext.tsx:
     - Motivo da solicitação pela aba:
     ```
     O usuário copia esse bloco e o leva para a sessão do Arquiteto.
3. **Branches Dedicadas por Agente**:
   - Cada sessão de agente opera exclusivamente em sua branch `agent/[modulo]`.
   - Nenhuma conversa commita diretamente na branch `main`.
4. **Verificação Obrigatória de Build**:
   - Todo agente deve rodar ou solicitar a validação de `npm run build` antes de finalizar qualquer entrega de código, garantindo zero erros de tipagem TypeScript.

---

## 🗺️ Mapa de Branches e Prompts Disponíveis

| # | Aba / Módulo | Arquivo de Prompt | Branch Dedicada | Arquivo Principal |
|---|---|---|---|---|
| **01** | Dashboard Executivo | [01_dashboard.md](file:///c:/Users/usuario/OneDrive/Área%20de%20Trabalho/InfraCore%20BETA/docs/prompts/01_dashboard.md) | `agent/dashboard` | `pages/Dashboard.tsx` |
| **02** | Cadastros Gerais | [02_cadastros.md](file:///c:/Users/usuario/OneDrive/Área%20de%20Trabalho/InfraCore%20BETA/docs/prompts/02_cadastros.md) | `agent/clients` | `pages/Clients.tsx` |
| **03** | Faturamento & Comercial | [03_vendas_faturamento.md](file:///c:/Users/usuario/OneDrive/Área%20de%20Trabalho/InfraCore%20BETA/docs/prompts/03_vendas_faturamento.md) | `agent/sales` | `pages/Sales.tsx` |
| **04** | Compras & Estoque | [04_compras_estoque.md](file:///c:/Users/usuario/OneDrive/Área%20de%20Trabalho/InfraCore%20BETA/docs/prompts/04_compras_estoque.md) | `agent/purchases` | `pages/Purchases.tsx` |
| **05** | Produção & Usina | [05_producao_usina.md](file:///c:/Users/usuario/OneDrive/Área%20de%20Trabalho/InfraCore%20BETA/docs/prompts/05_producao_usina.md) | `agent/production` | `pages/Production.tsx` |
| **06** | Financeiro & DRE | [06_financeiro.md](file:///c:/Users/usuario/OneDrive/Área%20de%20Trabalho/InfraCore%20BETA/docs/prompts/06_financeiro.md) | `agent/finance` | `pages/Finance.tsx` |
| **07** | RH & Departamento Pessoal | [07_rh_departamento_pessoal.md](file:///c:/Users/usuario/OneDrive/Área%20de%20Trabalho/InfraCore%20BETA/docs/prompts/07_rh_departamento_pessoal.md) | `agent/hr` | `pages/HR.tsx` |
| **08** | Frota & Máquinas Pesadas | [08_frota_equipamentos.md](file:///c:/Users/usuario/OneDrive/Área%20de%20Trabalho/InfraCore%20BETA/docs/prompts/08_frota_equipamentos.md) | `agent/fleet` | `pages/Fleet.tsx` |
| **09** | Relatórios & BI | [09_relatorios_bi.md](file:///c:/Users/usuario/OneDrive/Área%20de%20Trabalho/InfraCore%20BETA/docs/prompts/09_relatorios_bi.md) | `agent/reports` | `pages/Reports.tsx` |
| **10** | Configurações & Segurança | [10_configuracoes_seguranca.md](file:///c:/Users/usuario/OneDrive/Área%20de%20Trabalho/InfraCore%20BETA/docs/prompts/10_configuracoes_seguranca.md) | `agent/settings` | `pages/Settings.tsx` |
| **11** | Banco de Dados & Supabase | [11_supabase_banco_dados.md](file:///c:/Users/usuario/OneDrive/Área%20de%20Trabalho/InfraCore%20BETA/docs/prompts/11_supabase_banco_dados.md) | `agent/supabase-db` | `src/lib/supabase.ts`, `api.ts` |
| **12** | AI Agents Hub & Gemini | [12_ai_agents_hub.md](file:///c:/Users/usuario/OneDrive/Área%20de%20Trabalho/InfraCore%20BETA/docs/prompts/12_ai_agents_hub.md) | `agent/ai-hub` | `components/AIAgentsHub.tsx` |
| **13** | Design System & Layout | [13_layout_design_system.md](file:///c:/Users/usuario/OneDrive/Área%20de%20Trabalho/InfraCore%20BETA/docs/prompts/13_layout_design_system.md) | `agent/design-system` | `components/Layout.tsx` |
| **14** | Estado Global & Refatoração | [14_app_context_refactoring.md](file:///c:/Users/usuario/OneDrive/Área%20de%20Trabalho/InfraCore%20BETA/docs/prompts/14_app_context_refactoring.md) | `agent/app-context-arch` | `context/AppContext.tsx`, `types.ts` |
| **15** | DevOps, QA & Build | [15_devops_qa_build.md](file:///c:/Users/usuario/OneDrive/Área%20de%20Trabalho/InfraCore%20BETA/docs/prompts/15_devops_qa_build.md) | `agent/devops-qa` | `vite.config.ts`, `vercel.json` |

---

## 🚀 Como Inicializar uma Nova Conversa / Sessão

1. **Abra o Terminal no VS Code ou PowerShell**:
   Execute o script mestre para inicializar a branch ou crie-a manualmente:
   ```powershell
   # Cria ou alterna para a branch da aba desejada (exemplo: Financeiro)
   git checkout -b agent/finance
   ```
2. **Abra uma nova janela/conversa com o Agente de IA**.
3. **Copie o conteúdo integral do arquivo de prompt correspondente** (ex: `docs/prompts/06_financeiro.md`) e cole como a primeira mensagem da nova conversa.
4. **Trabalhe exclusivamente nas demandas daquele módulo**.
5. **Ao concluir**: execute os comandos de validação e commit fornecidos no topo do prompt.
