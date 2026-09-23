# Guia de Contribuição — OmniFlux

Agradecemos imensamente pelo seu interesse em contribuir com o **OmniFlux**! Este projeto é de código aberto sob licença MIT e foi concebido para entregar uma plataforma corporativa robusta de gestão de chamados internos e workflows intersetoriais.

Para garantir que a base de código permaneça limpa, segura, escalável e de fácil manutenção, solicitamos que todos os colaboradores sigam as diretrizes abaixo.

---

## 🏛️ Filosofia e Princípios de Arquitetura

### 1. Modelo Estritamente Single-Tenant (Self-Hosted)
- O OmniFlux é projetado para ser executado de forma dedicada por cada organização.
- **Não introduza multi-tenancy:** Jamais adicione abstrações como `tenant_id`, `company_id` ou isolamento lógico de empresas. Toda a base de dados pertence a uma única entidade.

### 2. Motor de Setores Dinâmicos
- Não crie fluxos engessados (*hardcoded*) para setores específicos no código-fonte.
- Toda lógica setorial deve ser orientada às flags comportamentais cadastradas no banco (`is_financial`, `requires_proof_file`, `allowed_proof_types`, `is_restricted`).

### 3. Máquina de Estados Imutável do Ticket
- As transições de chamado seguem um fluxo restrito:
  $$\text{ABERTO} \longrightarrow \text{EM\_ANDAMENTO} \longrightarrow \text{AGUARDANDO\_HOMOLOGACAO} \longrightarrow \begin{cases} \text{HOMOLOGADO\_FECHADO} \\ \text{RECUSADO\_REABERTO} \end{cases}$$
- Qualquer alteração de status deve registrar uma entrada na tabela de histórico de auditoria (`ticket_history`).

---

## 💻 Padrões de Engenharia e Qualidade de Código

### TypeScript Estrito
- **Zero tolerância com `any`:** O uso de `any` é terminantemente proibido.
- Se o formato de entrada for incerto, utilize `unknown` associado a Type Guards ou schemas do Zod.
- Mantenha habilitadas todas as regras estritas do compilador (`strict: true`, `noImplicitAny: true`, `strictNullChecks: true`).

### Validação Obrigatória com Zod
- Todos os formulários, Server Actions e Route Handlers devem validar as entradas através de schemas Zod.
- Trate erros de forma amigável e discriminada utilizando o padrão `ActionResponse<T>`.

### Next.js 14+ App Router
- **Server Components por padrão (RSC):** Renderize no servidor tudo o que não exigir listeners de eventos do navegador ou estado de tela.
- **`'use client'` apenas em nós de folha:** Adicione a diretiva estritamente nos componentes terminais que precisam de interatividade (botões com clique, modais, formulários).

### Banco de Dados & Prisma ORM
- Tabelas e colunas no PostgreSQL devem utilizar `snake_case` (mapeadas via `@@map` e `@map`).
- Nomes de modelos e propriedades no TypeScript utilizam `PascalCase` e `camelCase`.
- Toda chave primária transacional deve ser UUID v4 (`@id @default(uuid())`).
- Mantenha índices explícitos em todas as chaves estrangeiras.
- Não altere arquivos de migrations que já foram integrados à branch principal.

---

## 🚀 Como Submeter uma Contribuição

1. **Fork o repositório** e crie uma branch a partir da `main`:
   ```bash
   git checkout -b feature/minha-melhoria
   # ou
   git checkout -b fix/correcao-bug
   ```

2. **Instale as dependências e inicie os containers:**
   ```bash
   npm install
   docker compose up -d postgres minio
   npx prisma migrate dev
   ```

3. **Valide seu código localmente:**
   - Execute a verificação de tipos: `npx tsc --noEmit`
   - Garanta que não há erros de linter: `npm run lint`

4. **Commits Semânticos:**
   - Use convenções claras (`feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`).

5. **Abra um Pull Request:**
   - Descreva com clareza o problema resolvido ou a funcionalidade adicionada.
   - Anexe prints ou gravações caso tenha alterado componentes de interface.

---

## 📜 Licença

Ao contribuir com o OmniFlux, você concorda que suas contribuições serão licenciadas sob os termos da [Licença MIT](./LICENSE).
