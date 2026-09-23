<div align="center">

# ⚡ OmniFlux

**Plataforma Open Source de Gestão de Chamados Internos, Governança Operacional e Workflow Multi-Setorial Dinâmico**

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
- **Soberania Absoluta dos Dados:** Nenhum dado da sua empresa é compartilhado ou misturado com outras entidades.
- **Zero Overhead de Multi-Tenancy:** Modelagem limpa, transações ultrarrápidas e integridade relacional nativa no PostgreSQL.
- **Auditoria e Compliance:** Histórico imutável de todas as ações, trocas de status e aprovações com comprovantes anexados.

---

## ⚙️ Motor de Setores Dinâmicos & Regras Parametrizáveis

Diferente de sistemas rígidos de helpdesk, o OmniFlux é um **motor genérico de fluxos**. O Administrador cadastra setores livremente (*TI, Manutenção, Financeiro, RH, Compras, Operações*) e configura o comportamento através de flags operacionais:

| Flag de Setor | Tipo | Comportamento no Fluxo |
| :--- | :--- | :--- |
| `is_financial` | `Boolean` | Ativa campos obrigatórios de valor monetário (R$) e data de vencimento no ticket. |
| `requires_proof_file` | `Boolean` | Exige o upload compulsório de arquivo/foto de comprovação na conclusão da execução. |
| `allowed_proof_types` | `Enum` | Restringe os tipos de arquivos aceitos na comprovação (`IMAGE`, `DOCUMENT`, `ALL`). |
| `is_restricted` | `Boolean` | Controla se qualquer colaborador pode abrir chamados ou apenas perfis com permissão explícita. |

---

## 🔄 Máquina de Estados e Matriz de Aprovação

O fluxo de trabalho de cada chamado segue uma esteira rigorosa de homologação em etapas:

```
[ ABERTO ]
    │
    ▼ (Executor do setor assume a demanda)
[ EM_ANDAMENTO ]
    │
    ▼ (Executor conclui o trabalho e anexa o comprovante obrigatório)
[ AGUARDANDO_HOMOLOGACAO ]
    ├──► [ HOMOLOGADO_FECHADO ] (Gestor/Aprovador dá o visto final - Sucesso)
    └──► [ RECUSADO_REABERTO ]  (Gestor recusa com justificativa obrigatória de retrabalho)
              │
              └──────► Volta para [ EM_ANDAMENTO ]
```

### Perfis de Acesso por Setor (RBAC):
- **SOLICITANTE:** Cria tickets e acompanha o progresso de suas solicitações.
- **EXECUTOR:** Membro operacional que assume tickets do setor, executa as tarefas e anexa evidências.
- **HOMOLOGADOR / APROVADOR:** Gestor com poder de deferimento/indeferimento e visto de qualidade.
- **ADMIN_GERAL:** Gestão de usuários, setores, auditoria global e parametrizações da plataforma.

---

## 🚀 Inicialização Rápida com Docker Compose

O OmniFlux vem preparado com um ambiente conteinerizado completo contendo **PostgreSQL 16**, **MinIO** (armazenamento local compatível com AWS S3) e a aplicação **Next.js**.

### Pré-requisitos
- [Docker](https://docs.docker.com/get-docker/) e [Docker Compose](https://docs.docker.com/compose/) instalados.
- [Node.js 20 LTS](https://nodejs.org/) (opcional, para desenvolvimento bare-metal local).

### Passo a Passo

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/marcosanselmo/omniflux.git
   cd omniflux
   ```

2. **Configure as Variáveis de Ambiente:**
   ```bash
   cp .env.example .env
   ```
   *(Ajuste o `NEXTAUTH_SECRET` e senhas para seu ambiente).*

3. **Inicie todos os serviços com Docker Compose:**
   ```bash
   docker compose up -d
   ```

4. **Acesse as interfaces:**
   - **Aplicação Web OmniFlux:** [http://localhost:3000](http://localhost:3000)
   - **Console MinIO S3:** [http://localhost:9001](http://localhost:9001) *(Usuário: `omniflux_minio_admin` / Senha: `omniflux_minio_secret`)*
   - **Banco PostgreSQL:** `localhost:5432` *(Database: `omniflux_db`)*

---

## 🔐 Variáveis de Ambiente

As configurações do sistema são centralizadas via variáveis de ambiente. Utilize o arquivo `.env.example` como referência segura:

| Variável | Descrição | Exemplo Padrão |
| :--- | :--- | :--- |
| `NODE_ENV` | Modo de execução do Node.js | `development` / `production` |
| `PORT` | Porta HTTP da aplicação | `3000` |
| `NEXTAUTH_SECRET` | Chave secreta criptográfica da sessão | *(gerada via openssl)* |
| `NEXTAUTH_URL` | URL canônica do app | `http://localhost:3000` |
| `DATABASE_URL` | String de conexão PostgreSQL para o Prisma | `postgresql://user:pass@localhost:5432/omniflux_db` |
| `S3_ENDPOINT` | Host da API de Storage S3 / MinIO | `localhost` ou `minio` |
| `S3_PORT` | Porta da API S3 | `9000` |
| `S3_ACCESS_KEY` | Chave de acesso S3 / MinIO | `omniflux_minio_admin` |
| `S3_SECRET_KEY` | Chave secreta S3 / MinIO | `omniflux_minio_secret` |
| `S3_BUCKET_NAME` | Nome do bucket padrão de mídia | `omniflux-media` |
| `MAX_UPLOAD_SIZE_MB` | Limite de tamanho por upload em MB | `15` |
| `ALLOWED_FILE_TYPES` | Tipos MIME permitidos para anexos | `image/jpeg,image/png,application/pdf` |

---

## 🛠️ Stack Tecnológica

- **Core:** [Next.js 14+](https://nextjs.org/) (App Router, Server Actions, Route Handlers)
- **Linguagem:** [TypeScript 5+](https://www.typescriptlang.org/) (Strict Mode)
- **Estilização & Componentes:** [Tailwind CSS](https://tailwindcss.com/) + [Shadcn/UI](https://ui.shadcn.com/) (Radix Primitives)
- **Banco de Dados & ORM:** [PostgreSQL 16](https://www.postgresql.org/) + [Prisma ORM 5](https://www.prisma.io/)
- **Armazenamento de Mídia:** [AWS SDK v3 S3](https://aws.amazon.com/sdk-for-javascript/) + [MinIO](https://min.io/)
- **Validação de Dados:** [Zod](https://zod.dev/)
- **Containers & Deploy:** Docker Multi-stage (`output: 'standalone'`) com usuário não-privilegiado.

---

## 🤝 Diretrizes de Governança e Contribuição

Contribuições da comunidade são muito bem-vindas! Antes de submeter um Pull Request, certifique-se de:

1. Consultar o manual técnico de arquitetura e padrões no arquivo [`AGENTS.md`](./AGENTS.md).
2. Garantir tipagem 100% estrita em TypeScript (proibido o uso de `any`).
3. Validar todas as Server Actions e endpoints com schemas Zod.
4. Manter a arquitetura estritamente Single-Tenant.

---

## 📄 Licença

Este projeto é distribuído sob a licença **MIT**. Consulte o arquivo [LICENSE](./LICENSE) para mais detalhes.
