-- CreateEnum
CREATE TYPE "RoleName" AS ENUM ('ADMIN', 'GESTOR', 'SUPERVISOR', 'CS', 'ANALISTA_DADOS', 'ANALISTA_FINANCEIRO');

-- CreateEnum
CREATE TYPE "ContactabilidadeStatus" AS ENUM ('SEM_TELEFONE', 'NUNCA_CONTATADO', 'AGUARDANDO_RESPOSTA', 'SEM_RESPOSTA', 'CONTATO_REALIZADO', 'CONTATO_RECUPERADO', 'CONTATO_INVALIDO', 'ESCALAR_CONTATO');

-- CreateEnum
CREATE TYPE "CanalContato" AS ENUM ('LIGACAO', 'WHATSAPP', 'EMAIL', 'VISITA', 'OUTRO');

-- CreateEnum
CREATE TYPE "ResultadoContato" AS ENUM ('CONTATO_REALIZADO', 'SEM_RESPOSTA', 'NUMERO_INVALIDO', 'WHATSAPP_NAO_ENTREGUE', 'RETORNO_SOLICITADO', 'CONTATO_RECUPERADO');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('PENDENTE', 'EM_ANDAMENTO', 'CONCLUIDA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "TaskTipo" AS ENUM ('LIGACAO', 'WHATSAPP', 'EMAIL', 'VISITA', 'TREINAMENTO', 'CAMPANHA', 'OUTRO');

-- CreateEnum
CREATE TYPE "TimelineEventType" AS ENUM ('IMPORTACAO', 'ATUALIZACAO_CADASTRAL', 'CLASSIFICACAO_ALTERADA', 'CONTATO_REGISTRADO', 'TAREFA_CRIADA', 'TAREFA_CONCLUIDA', 'TAREFA_CANCELADA', 'RESPONSAVEL_ALTERADO', 'OBSERVACAO');

-- CreateEnum
CREATE TYPE "NotificationTipo" AS ENUM ('PRIORIDADE_CRITICA', 'PRIORIDADE_ALTA', 'STATUS_RISCO', 'STATUS_CHURN', 'SEM_TELEFONE', 'SEM_CONTATO', 'TAREFA_VENCIDA', 'SELLOUT_BAIXO', 'INADIMPLENCIA', 'ESTOQUE_ELEVADO');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "RoleName" NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "supervisorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PDV" (
    "id" TEXT NOT NULL,
    "codigoPdv" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cidade" TEXT,
    "telefone" TEXT,
    "canal" TEXT,
    "modalidade" TEXT,
    "supervisorPlanilha" TEXT,
    "consultorPlanilha" TEXT,
    "statusVendas" TEXT,
    "adimplencia" TEXT,
    "maturidade" TEXT,
    "statusRetencao" TEXT,
    "valor" TEXT,
    "prioridade" TEXT,
    "segmento" TEXT,
    "ultimaTransacao" TIMESTAMP(3),
    "diasSemTransacao" INTEGER,
    "dataUltimaVendaRaspadinha" TIMESTAMP(3),
    "valorUltimaVendaRaspadinha" DECIMAL(14,2),
    "dataUltimaCompraRaspadinha" TIMESTAMP(3),
    "valorUltimaCompraRaspadinha" DECIMAL(14,2),
    "dataUltimaVendaTrem" TIMESTAMP(3),
    "valorUltimaVendaTrem" DECIMAL(14,2),
    "estoque" DECIMAL(14,2),
    "totalPacotesRaspadinha" DECIMAL(14,2),
    "totalVendasRaspadinha" DECIMAL(14,2),
    "selloutTotal" DECIMAL(14,2),
    "selloutMedioMensal" DECIMAL(14,2),
    "dataAtivacao" TIMESTAMP(3),
    "mesesDeBase" DECIMAL(10,2),
    "diasComMovimento" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PDV_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PDVAssignment" (
    "id" TEXT NOT NULL,
    "pdvId" TEXT NOT NULL,
    "responsavelId" TEXT,
    "backupId" TEXT,
    "inicioVigencia" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fimVigencia" TIMESTAMP(3),
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PDVAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contactability" (
    "id" TEXT NOT NULL,
    "pdvId" TEXT NOT NULL,
    "status" "ContactabilidadeStatus" NOT NULL DEFAULT 'NUNCA_CONTATADO',
    "ultimoContato" TIMESTAMP(3),
    "numeroTentativas" INTEGER NOT NULL DEFAULT 0,
    "ultimoCanal" TEXT,
    "ultimoResultado" TEXT,
    "proximaAcao" TEXT,
    "proximaAcaoData" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contactability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContactAttempt" (
    "id" TEXT NOT NULL,
    "pdvId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "canal" "CanalContato" NOT NULL,
    "resultado" "ResultadoContato" NOT NULL,
    "observacao" TEXT,
    "proximaAcao" TEXT,
    "proximaAcaoData" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContactAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "pdvId" TEXT NOT NULL,
    "responsavelId" TEXT NOT NULL,
    "criadoPorId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "tipo" "TaskTipo" NOT NULL DEFAULT 'OUTRO',
    "prioridadeOperacional" TEXT,
    "prazo" TIMESTAMP(3),
    "status" "TaskStatus" NOT NULL DEFAULT 'PENDENTE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimelineEvent" (
    "id" TEXT NOT NULL,
    "pdvId" TEXT NOT NULL,
    "usuarioId" TEXT,
    "tipo" "TimelineEventType" NOT NULL,
    "descricao" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TimelineEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImportBatch" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "arquivo" TEXT NOT NULL,
    "totalLinhas" INTEGER NOT NULL,
    "novosRegistros" INTEGER NOT NULL,
    "atualizados" INTEGER NOT NULL,
    "duplicados" INTEGER NOT NULL,
    "invalidos" INTEGER NOT NULL,
    "erros" JSONB,
    "columnMapping" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ImportBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImportChange" (
    "id" TEXT NOT NULL,
    "importBatchId" TEXT NOT NULL,
    "pdvId" TEXT NOT NULL,
    "campo" TEXT NOT NULL,
    "valorAnterior" TEXT,
    "valorNovo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ImportChange_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PerformanceSnapshot" (
    "id" TEXT NOT NULL,
    "pdvId" TEXT NOT NULL,
    "importBatchId" TEXT,
    "dataSnapshot" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "selloutTotal" DECIMAL(14,2),
    "selloutMedioMensal" DECIMAL(14,2),
    "estoque" DECIMAL(14,2),
    "diasSemTransacao" INTEGER,
    "statusRetencao" TEXT,
    "prioridade" TEXT,
    "valor" TEXT,
    "maturidade" TEXT,

    CONSTRAINT "PerformanceSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "tipo" "NotificationTipo" NOT NULL,
    "titulo" TEXT NOT NULL,
    "mensagem" TEXT NOT NULL,
    "lida" BOOLEAN NOT NULL DEFAULT false,
    "pdvId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppConfig" (
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,

    CONSTRAINT "AppConfig_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_supervisorId_idx" ON "User"("supervisorId");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE UNIQUE INDEX "PDV_codigoPdv_key" ON "PDV"("codigoPdv");

-- CreateIndex
CREATE INDEX "PDV_cidade_idx" ON "PDV"("cidade");

-- CreateIndex
CREATE INDEX "PDV_statusRetencao_idx" ON "PDV"("statusRetencao");

-- CreateIndex
CREATE INDEX "PDV_prioridade_idx" ON "PDV"("prioridade");

-- CreateIndex
CREATE INDEX "PDV_valor_idx" ON "PDV"("valor");

-- CreateIndex
CREATE INDEX "PDV_maturidade_idx" ON "PDV"("maturidade");

-- CreateIndex
CREATE INDEX "PDV_segmento_idx" ON "PDV"("segmento");

-- CreateIndex
CREATE INDEX "PDV_supervisorPlanilha_idx" ON "PDV"("supervisorPlanilha");

-- CreateIndex
CREATE INDEX "PDV_consultorPlanilha_idx" ON "PDV"("consultorPlanilha");

-- CreateIndex
CREATE INDEX "PDV_ultimaTransacao_idx" ON "PDV"("ultimaTransacao");

-- CreateIndex
CREATE INDEX "PDV_diasSemTransacao_idx" ON "PDV"("diasSemTransacao");

-- CreateIndex
CREATE INDEX "PDV_canal_idx" ON "PDV"("canal");

-- CreateIndex
CREATE INDEX "PDV_adimplencia_idx" ON "PDV"("adimplencia");

-- CreateIndex
CREATE INDEX "PDVAssignment_pdvId_ativo_idx" ON "PDVAssignment"("pdvId", "ativo");

-- CreateIndex
CREATE INDEX "PDVAssignment_responsavelId_ativo_idx" ON "PDVAssignment"("responsavelId", "ativo");

-- CreateIndex
CREATE INDEX "PDVAssignment_backupId_ativo_idx" ON "PDVAssignment"("backupId", "ativo");

-- CreateIndex
CREATE UNIQUE INDEX "Contactability_pdvId_key" ON "Contactability"("pdvId");

-- CreateIndex
CREATE INDEX "Contactability_status_idx" ON "Contactability"("status");

-- CreateIndex
CREATE INDEX "ContactAttempt_pdvId_idx" ON "ContactAttempt"("pdvId");

-- CreateIndex
CREATE INDEX "ContactAttempt_usuarioId_idx" ON "ContactAttempt"("usuarioId");

-- CreateIndex
CREATE INDEX "Task_pdvId_idx" ON "Task"("pdvId");

-- CreateIndex
CREATE INDEX "Task_responsavelId_status_idx" ON "Task"("responsavelId", "status");

-- CreateIndex
CREATE INDEX "Task_prazo_idx" ON "Task"("prazo");

-- CreateIndex
CREATE INDEX "Task_status_idx" ON "Task"("status");

-- CreateIndex
CREATE INDEX "TimelineEvent_pdvId_createdAt_idx" ON "TimelineEvent"("pdvId", "createdAt");

-- CreateIndex
CREATE INDEX "ImportBatch_createdAt_idx" ON "ImportBatch"("createdAt");

-- CreateIndex
CREATE INDEX "ImportChange_importBatchId_idx" ON "ImportChange"("importBatchId");

-- CreateIndex
CREATE INDEX "ImportChange_pdvId_idx" ON "ImportChange"("pdvId");

-- CreateIndex
CREATE INDEX "PerformanceSnapshot_pdvId_dataSnapshot_idx" ON "PerformanceSnapshot"("pdvId", "dataSnapshot");

-- CreateIndex
CREATE INDEX "Notification_usuarioId_lida_idx" ON "Notification"("usuarioId", "lida");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_supervisorId_fkey" FOREIGN KEY ("supervisorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PDVAssignment" ADD CONSTRAINT "PDVAssignment_pdvId_fkey" FOREIGN KEY ("pdvId") REFERENCES "PDV"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PDVAssignment" ADD CONSTRAINT "PDVAssignment_responsavelId_fkey" FOREIGN KEY ("responsavelId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PDVAssignment" ADD CONSTRAINT "PDVAssignment_backupId_fkey" FOREIGN KEY ("backupId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contactability" ADD CONSTRAINT "Contactability_pdvId_fkey" FOREIGN KEY ("pdvId") REFERENCES "PDV"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactAttempt" ADD CONSTRAINT "ContactAttempt_pdvId_fkey" FOREIGN KEY ("pdvId") REFERENCES "PDV"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactAttempt" ADD CONSTRAINT "ContactAttempt_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_pdvId_fkey" FOREIGN KEY ("pdvId") REFERENCES "PDV"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_responsavelId_fkey" FOREIGN KEY ("responsavelId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimelineEvent" ADD CONSTRAINT "TimelineEvent_pdvId_fkey" FOREIGN KEY ("pdvId") REFERENCES "PDV"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimelineEvent" ADD CONSTRAINT "TimelineEvent_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportBatch" ADD CONSTRAINT "ImportBatch_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportChange" ADD CONSTRAINT "ImportChange_importBatchId_fkey" FOREIGN KEY ("importBatchId") REFERENCES "ImportBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportChange" ADD CONSTRAINT "ImportChange_pdvId_fkey" FOREIGN KEY ("pdvId") REFERENCES "PDV"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerformanceSnapshot" ADD CONSTRAINT "PerformanceSnapshot_pdvId_fkey" FOREIGN KEY ("pdvId") REFERENCES "PDV"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerformanceSnapshot" ADD CONSTRAINT "PerformanceSnapshot_importBatchId_fkey" FOREIGN KEY ("importBatchId") REFERENCES "ImportBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
