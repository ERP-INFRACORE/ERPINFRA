# ⚡ Diretrizes de Engenharia e Eficiência de Tokens (Agentes de IA InfraCore ERP)

Para todos os 10 agentes especialistas de IA (Financeiro, Frotas, Britagem, Usina Asfalto, Concreto, Almoxarifado, Compras, Laboratório, SST, RH), a equipe de desenvolvimento e o agente de IA devem obedecer rigorosamente às seguintes regras de economia e concisão de tokens:

### 1. Frugalidade de Prompt de Sistema (System Prompt Optimization)
- **Zero Preâmbulo**: Proibido adicionar frases de cortesia genérica nos prompts de sistema. Ir direto à alçada, permissões mínimas e formato esperado.
- **Tamanho Máximo**: Cada prompt padrão de agente não deve exceder 250 a 300 palavras.
- **Guardrails Compactos**: Agrupar guardrails em tópicos monossilábicos ou diretos (ex: `FORMATO: Moeda R$ pt-BR | RESPOSTA: Máx 4 linhas WhatsApp | AÇÃO CRÍTICA: Exigir SIM/NÃO`).

### 2. Exemplos Few-Shot Sintéticos
- No máximo 2 exemplos Few-Shot por agente, com foco estrito na calibração de formato (ex: montagem de tabela ASCII ou extração de campos essenciais).
- Manter o turno `user` e `assistant` dos Few-Shots com menos de 60 tokens cada.

### 3. Janela Deslizante de Memória Conversacional (Multi-Turn Windowing)
- Manter histórico enviado à API Gemini limitado estritamente aos últimos **4 a 6 turnos** (`slice(-6)`).
- Interações mais antigas não devem ser concatenadas ao payload para evitar multiplicação exponencial de tokens por requisição.

### 4. Triagem Determinística em Primeiro Lugar (Zero-Token Routing)
- Consultas padronizadas, seleções de menu (1 a 10) e comandos operacionais conhecidos devem ser tratados via Expressões Regulares / Smart Router no cliente, sem despachar chamada para a API Gemini.

### 5. Parâmetros de Geração Econômicos
- Configurar `maxOutputTokens` em no máximo **512 tokens** para mensagens de texto e **768 tokens** para extrações de visão/OCR.
- `temperature`: manter em **0.1** a **0.2** para evitar divagações prolixas e garantir determinismo.
