-- CreateEnum
CREATE TYPE "global_roles" AS ENUM ('ADMIN_GERAL', 'USUARIO');

-- CreateEnum
CREATE TYPE "sector_roles" AS ENUM ('SOLICITANTE', 'EXECUTOR', 'HOMOLOGADOR');

-- CreateEnum
CREATE TYPE "ticket_statuses" AS ENUM ('ABERTO', 'EM_ANDAMENTO', 'AGUARDANDO_HOMOLOGACAO', 'HOMOLOGADO_FECHADO', 'RECUSADO_REABERTO');

-- CreateEnum
CREATE TYPE "ticket_priorities" AS ENUM ('BAIXA', 'MEDIA', 'ALTA', 'URGENTE');

-- CreateEnum
CREATE TYPE "proof_types" AS ENUM ('IMAGE', 'DOCUMENT', 'ALL');

-- CreateEnum
CREATE TYPE "attachment_stages" AS ENUM ('CRIACAO', 'EXECUCAO', 'HOMOLOGACAO');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "avatar_url" VARCHAR(500),
    "global_role" "global_roles" NOT NULL DEFAULT 'USUARIO',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sectors" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "is_financial" BOOLEAN NOT NULL DEFAULT false,
    "requires_proof_file" BOOLEAN NOT NULL DEFAULT false,
    "allowed_proof_types" "proof_types" NOT NULL DEFAULT 'ALL',
    "is_restricted" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sectors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_sector_roles" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "sector_id" UUID NOT NULL,
    "role" "sector_roles" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_sector_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tickets" (
    "id" UUID NOT NULL,
    "ticket_number" SERIAL NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT NOT NULL,
    "status" "ticket_statuses" NOT NULL DEFAULT 'ABERTO',
    "priority" "ticket_priorities" NOT NULL DEFAULT 'MEDIA',
    "sector_id" UUID NOT NULL,
    "requester_id" UUID NOT NULL,
    "executor_id" UUID,
    "amount" DECIMAL(12,2),
    "due_date" TIMESTAMP(3),
    "closed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ticket_history" (
    "id" UUID NOT NULL,
    "ticket_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "from_status" "ticket_statuses",
    "to_status" "ticket_statuses" NOT NULL,
    "reason" TEXT,
    "comment" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ticket_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ticket_attachments" (
    "id" UUID NOT NULL,
    "ticket_id" UUID NOT NULL,
    "uploader_id" UUID NOT NULL,
    "file_name" VARCHAR(255) NOT NULL,
    "file_key" VARCHAR(500) NOT NULL,
    "mime_type" VARCHAR(100) NOT NULL,
    "file_size" INTEGER NOT NULL,
    "stage" "attachment_stages" NOT NULL DEFAULT 'CRIACAO',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ticket_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "sectors_slug_key" ON "sectors"("slug");

-- CreateIndex
CREATE INDEX "user_sector_roles_user_id_idx" ON "user_sector_roles"("user_id");

-- CreateIndex
CREATE INDEX "user_sector_roles_sector_id_idx" ON "user_sector_roles"("sector_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_sector_roles_user_id_sector_id_role_key" ON "user_sector_roles"("user_id", "sector_id", "role");

-- CreateIndex
CREATE UNIQUE INDEX "tickets_ticket_number_key" ON "tickets"("ticket_number");

-- CreateIndex
CREATE INDEX "tickets_sector_id_idx" ON "tickets"("sector_id");

-- CreateIndex
CREATE INDEX "tickets_requester_id_idx" ON "tickets"("requester_id");

-- CreateIndex
CREATE INDEX "tickets_executor_id_idx" ON "tickets"("executor_id");

-- CreateIndex
CREATE INDEX "tickets_status_idx" ON "tickets"("status");

-- CreateIndex
CREATE INDEX "tickets_created_at_idx" ON "tickets"("created_at");

-- CreateIndex
CREATE INDEX "ticket_history_ticket_id_idx" ON "ticket_history"("ticket_id");

-- CreateIndex
CREATE INDEX "ticket_history_user_id_idx" ON "ticket_history"("user_id");

-- CreateIndex
CREATE INDEX "ticket_history_created_at_idx" ON "ticket_history"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "ticket_attachments_file_key_key" ON "ticket_attachments"("file_key");

-- CreateIndex
CREATE INDEX "ticket_attachments_ticket_id_idx" ON "ticket_attachments"("ticket_id");

-- CreateIndex
CREATE INDEX "ticket_attachments_uploader_id_idx" ON "ticket_attachments"("uploader_id");

-- CreateIndex
CREATE INDEX "ticket_attachments_stage_idx" ON "ticket_attachments"("stage");

-- AddForeignKey
ALTER TABLE "user_sector_roles" ADD CONSTRAINT "user_sector_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_sector_roles" ADD CONSTRAINT "user_sector_roles_sector_id_fkey" FOREIGN KEY ("sector_id") REFERENCES "sectors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_sector_id_fkey" FOREIGN KEY ("sector_id") REFERENCES "sectors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_requester_id_fkey" FOREIGN KEY ("requester_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_executor_id_fkey" FOREIGN KEY ("executor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_history" ADD CONSTRAINT "ticket_history_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_history" ADD CONSTRAINT "ticket_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_attachments" ADD CONSTRAINT "ticket_attachments_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_attachments" ADD CONSTRAINT "ticket_attachments_uploader_id_fkey" FOREIGN KEY ("uploader_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
