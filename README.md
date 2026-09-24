<div align="center">

# ⚡ OmniFlux v1.0.0

**Plataforma Open Source de Gestão de Chamados Internos, Governança Operacional e Esteira Kanban Multi-Setorial Dinâmica**

[![Next.js](https://img.shields.io/badge/Next.js-14.x-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x_Strict-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16.x-336791?style=for-the-badge&logo=postgresql)](https://www.postgresql.org/)
[![Prisma ORM](https://img.shields.io/badge/Prisma-5.x-2D3748?style=for-the-badge&logo=prisma)](https://www.prisma.io/)
[![Docker](https://img.shields.io/badge/Docker-Multi--Stage-2496ED?style=for-the-badge&logo=docker)](https://www.docker.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](LICENSE)

<p align="center">
  Projetado para organizações que necessitam de rastreabilidade, compliance e controle rigoroso de processos internos sem a complexidade ou os custos de soluções SaaS proprietárias.
</p>

</div>

---

## 🎯 Visão do Produto & Arquitetura Single-Tenant

O **OmniFlux** é uma solução **Single-Tenant (Self-Hosted)** de código aberto. Cada organização faz o deploy de sua própria instância, garantindo:
- **Soberania Absoluta dos Dados:** Nenhum dado corporativo é compartilhado ou particionado com outras entidades.
- **Zero Overhead de Multi-Tenancy:** Modelagem limpa, transações ultrarrápidas (`prisma.$transaction`) e integridade relacional nativa no PostgreSQL.
- **Auditoria e Compliance:** Histórico imutável de todas as ações, trocas de status e aprovações com comprovantes anexados e exportação para CSV/JSON.

---

## 🚀 Assistente de Instalação Inicial (Setup Wizard `/setup`)

Ao iniciar o OmniFlux pela primeira vez com um banco de dados limpo, o sistema direciona automaticamente para o **Wizard de Onboarding**:
1. **Cadastro do Administrador Geral:** Definição segura do usuário Master (`ADMIN_GERAL`) com nome, e-mail corporativo e senha criptografada via bcrypt.
2. **Seleção de Setores Padrão:** Escolha interativa dos setores essenciais para inicialização imediata:
   - *TI & Suporte Técnico*
   - *Manutenção Predial & Facilities*
   - *Financeiro & Contas a Pagar (com flag `is_financial` ativa)*
   - *Recursos Humanos & Departamento Pessoal*
   - *Jurídico & Compliance*
3. **Ativação Instantânea:** Sem dependência de seeds artificiais ou dados mockados. Uma vez configurado, a rota `/setup` é permanentemente bloqueada.

---

## 📋 Esteira Visual Kanban (Pipeline de Chamados)

A gestão operacional de chamados é apresentada em um moderno **Pipeline Kanban** multi-colunas que reflete exatamente as 5 etapas da máquina de estados:

1. **Abertos:** Chamados recém-criados aguardando início/atribuição.
2. **Em Execução:** Demandas assumidas ativamente por executores do setor.
3. **Aguardando Visto:** Demandas concluídas aguardando homologação formal do gestor.
4. **Retrabalho:** Chamados devolvidos com justificativa formal de recusa pelo homologador.
5. **Homologados & Fechados:** Chamados formalmente deferidos e encerrados com visto de qualidade.

*Possui busca instantânea, contadores de demandas pendentes e concluídas, além de alternador para modo de Lista Detalhada (Tabela).*

---

## 📎 Upload de Evidências na Abertura e Conclusão

- **Abertura do Chamado:** O solicitante pode anexar fotos e documentos probatórios da demanda (ex: foto de equipamento danificado, orçamentos, contratos em PDF).
- **Conclusão da Execução:** O executor anexa os comprovantes do serviço realizado (ex: foto do reparo concluído, comprovante de quitação), atendendo à governança de setores com flag `requires_proof_file`.
- **Armazenamento S3:** Todos os arquivos são sanitizados, nomeados com UUID v4 e armazenados de forma segura via API S3 (MinIO ou AWS S3).

---

## 📊 Dashboard Executivo & Métricas Operacionais

O painel principal oferece:
- **Visão dos Chamados por Etapa:** Contadores segmentados para cada fase da esteira operacional.
- **Gráfico de Demanda por Setor:** Gráfico Donut/Pizza interativo e proporcional em SVG puro, com legenda detalhada e percentuais por área.
- **Gráfico de Atividade Operacional:** Volume diário/semanal de chamados movimentados e taxa média de homologação.
- **Chamados Recentes:** Tabela com badges de status com ícones temáticos dedicados e alta visibilidade.

---

## ⚙️ Motor de Setores Dinâmicos & Regras Parametrizáveis

O sistema se comporta como um motor dinâmico e flexível:

| Flag de Setor | Tipo | Comportamento no Fluxo |
| :--- | :--- | :--- |
| `is_financial` | `Boolean` | Ativa campos obrigatórios de valor monetário (R$) e data de vencimento no ticket. |
| `requires_proof_file` | `Boolean` | Exige o upload compulsório de arquivo/foto de comprovação na conclusão da execução. |
| `allowed_proof_types` | `Enum` | Restringe os tipos de arquivos aceitos na comprovação (`IMAGE`, `DOCUMENT`, `ALL`). |
| `is_restricted` | `Boolean` | Controla se qualquer colaborador pode abrir chamados ou apenas perfis com permissão explícita. |

---

## 🔄 Máquina de Estados e RBAC

```
[ ABERTO ]
    │
    ▼ (Executor do setor assume a demanda)
[ EM_ANDAMENTO ]
    │
    ▼ (Executor conclui o trabalho e anexa o comprovante)
[ AGUARDANDO_HOMOLOGACAO ]
    ├──► [ HOMOLOGADO_FECHADO ] (Gestor aprova com visto final)
    └──► [ RECUSADO_REABERTO ]  (Gestor recusa com justificativa obrigatória)
              │
              └──────► Retorna para [ EM_ANDAMENTO ]
```

### Perfis de Acesso por Setor:
- **SOLICITANTE:** Cria tickets e acompanha o progresso de suas solicitações.
- **EXECUTOR:** Membro operacional que assume tickets do setor, executa as tarefas e anexa evidências.
- **HOMOLOGADOR / APROVADOR:** Gestor com poder de deferimento/indeferimento e visto de qualidade.
- **ADMIN_GERAL:** Gestão de usuários, setores, auditoria global e parametrizações da plataforma.

---

## 🚀 Inicialização Rápida com Docker Compose

O OmniFlux é executado integralmente via Docker Compose:

### Pré-requisitos
- [Docker](https://docs.docker.com/get-docker/) e [Docker Compose](https://docs.docker.com/compose/) instalados.

### Passo a Passo

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/marcosanselmo/omniflux.git
   cd omniflux
   ```

2. **Configure o arquivo `.env`:**
   ```bash
   cp .env.example .env
   ```

3. **Inicie os serviços:**
   ```bash
   docker compose up -d
   ```

4. **Acesse:**
   - **Aplicação Web:** [http://localhost:3000](http://localhost:3000)
   - **Armazenamento S3:** API S3 ativa internamente na porta `9000`.
   - **Banco PostgreSQL:** `localhost:5432` *(Database: `omniflux_db`)*

---

## 🛠️ Stack Tecnológica

- **Core:** [Next.js 14+](https://nextjs.org/) (App Router, Server Actions, Route Handlers)
- **Linguagem:** [TypeScript 5+](https://www.typescriptlang.org/) (Strict Mode)
- **Estilização:** [Tailwind CSS](https://tailwindcss.com/)
- **Banco de Dados & ORM:** [PostgreSQL 16](https://www.postgresql.org/) + [Prisma ORM 5](https://www.prisma.io/)
- **Armazenamento de Mídia:** [AWS SDK v3 S3](https://aws.amazon.com/sdk-for-javascript/) + [MinIO](https://min.io/)
- **Validação de Dados:** [Zod](https://zod.dev/)
- **Containers:** Docker Compose com serviços `web`, `postgres` e `minio`.

---

## 📄 Licença

Distribuído sob a licença **MIT**. Consulte o arquivo [LICENSE](./LICENSE) para mais detalhes.
