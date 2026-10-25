# Diretrizes de Governança e Integridade Estrutural

## Preservação da Estrutura do Sistema
1. **Cautela com a Estrutura Existente:**
   - Não realize alterações bruscas, refatorações agressivas ou reorganizações de arquivos, diretórios e arquitetura pré-existente sem estrita necessidade.
   - Respeite o design e as convenções já estabelecidas no sistema (arquivos em raiz, schemas existentes, convenções de contexto e rotas).

2. **Autorização Prévia Obrigatória para Mudanças Estruturais:**
   - Caso qualquer medida de alteração estrutural seja necessária (ex.: mudanças de schema no banco de dados, reestruturação de pastas, alteração de contratos compartilhados, substituição de bibliotecas centrais ou refatorações de grande porte), você DEVE:
     1. Descrever claramente o motivo e o impacto da mudança.
     2. Apresentar os riscos e a alternativa menos invasiva possível.
     3. **Solicitar autorização prévia ao usuário e aguardar aprovação explícita antes de efetuar qualquer alteração.**
